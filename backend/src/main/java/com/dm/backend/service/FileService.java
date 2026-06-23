package com.dm.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.dm.backend.mapper.FileMapper;
import com.dm.backend.vo.DocumentOcrRequestVO;
import com.dm.backend.vo.DocumentOcrResponseVO;
import com.dm.backend.vo.FileVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileMapper fileMapper;
    private final SupabaseStorageService supabaseStorageService;
    private final DocumentOcrClient documentOcrClient;
    private final ObjectMapper objectMapper;

    // =========================
    // [공통]
    // =========================

    public void insertFile(FileVO fileVO) {
        fileMapper.insertFile(fileVO);
    }

    public void updateFile(FileVO fileVO) {
        fileMapper.updateFile(fileVO);
    }

    public FileVO uploadAndAnalyze(String storeId, String userId, String fileType, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다.");
        }

        String normalizedFileType = normalizeFileType(fileType);
        FileVO fileVO = new FileVO();
        fileVO.setId("FILE_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
        fileVO.setStore_id(storeId);
        fileVO.setUser_id(userId);
        fileVO.setFile_type(normalizedFileType);
        fileVO.setOriginal_name(file.getOriginalFilename());
        fileVO.setStorage_path(buildStoragePath(storeId, userId, normalizedFileType, fileVO.getId(), file.getOriginalFilename()));
        fileVO.setFile_size(file.getSize());
        fileVO.setMime_type(file.getContentType());
        fileVO.setStatus("PENDING");
        fileVO.setOcr_status("PROCESSING");

        try {
            supabaseStorageService.upload(fileVO.getStorage_path(), file);
            fileMapper.insertFile(fileVO);
            applyOcrResult(fileVO);
            return fileMapper.selectFileById(fileVO.getId());
        } catch (Exception e) {
            if (fileVO.getId() != null) {
                fileVO.setOcr_status("FAILED");
                fileVO.setNotes("OCR 처리 중 오류가 발생했습니다: " + e.getMessage());
                try {
                    if (fileMapper.selectFileById(fileVO.getId()) == null) {
                        fileMapper.insertFile(fileVO);
                    } else {
                        fileMapper.updateOcrResult(fileVO);
                    }
                } catch (Exception ignored) {
                }
            }
            throw new IllegalStateException("문서 업로드 처리에 실패했습니다.", e);
        }
    }

    public FileVO runOcr(String id) {
        FileVO fileVO = fileMapper.selectFileById(id);
        if (fileVO == null) {
            throw new IllegalArgumentException("문서를 찾을 수 없습니다.");
        }
        fileVO.setOcr_status("PROCESSING");
        fileMapper.updateOcrResult(fileVO);
        applyOcrResult(fileVO);
        return fileMapper.selectFileById(id);
    }

    public String createSignedUrl(String id) {
        FileVO fileVO = fileMapper.selectFileById(id);
        if (fileVO == null) {
            throw new IllegalArgumentException("문서를 찾을 수 없습니다.");
        }
        return supabaseStorageService.createSignedUrl(fileVO.getStorage_path());
    }

    public void updateFileStatus(String id, String status) {
        fileMapper.updateFileStatus(id, normalizeStatus(status));
    }

    public void deleteFile(String id) {
        fileMapper.deleteFile(id);
    }

    public FileVO getFileById(String id) {
        return fileMapper.selectFileById(id);
    }

    public List<FileVO> getFilesByUserId(String userId) {
        return fileMapper.selectFilesByUserId(userId);
    }

    public List<FileVO> getFilesByStoreId(String storeId) {
        return fileMapper.selectFilesByStoreId(storeId);
    }

    // =========================
    // [근로계약서]
    // =========================

    public List<FileVO> getContractsByUserId(String userId) {
        return fileMapper.selectContractsByUserId(userId);
    }

    // =========================
    // [보건증]
    // =========================

    public List<FileVO> getHealthCertsByUserId(String userId) {
        return fileMapper.selectHealthCertsByUserId(userId);
    }

    private void applyOcrResult(FileVO fileVO) {
        try {
            String signedUrl = supabaseStorageService.createSignedUrl(fileVO.getStorage_path());
            if (signedUrl == null || signedUrl.isBlank()) {
                throw new IllegalStateException("Supabase signed URL을 생성하지 못했습니다.");
            }
            DocumentOcrResponseVO response = documentOcrClient.extract(new DocumentOcrRequestVO(
                    fileVO.getId(),
                    fileVO.getFile_type(),
                    signedUrl,
                    fileVO.getOriginal_name()
            ));

            if (response == null) {
                fileVO.setOcr_status("FAILED");
                fileVO.setNotes("OCR 서버 응답이 비어 있습니다.");
            } else {
                fileVO.setOcr_status(defaultText(response.getOcr_status(), "COMPLETED"));
                fileVO.setStatus(defaultText(response.getStatus(), fileVO.getStatus()));
                fileVO.setNotes(response.getNotes());
                fileVO.setExtracted_data(toJson(response.getExtracted_data()));
                fileVO.setExpiry_date(toSqlDate(response.getExpiry_date()));
            }
        } catch (Exception e) {
            fileVO.setOcr_status("FAILED");
            fileVO.setNotes("OCR 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
        fileMapper.updateOcrResult(fileVO);
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private Date toSqlDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Date.valueOf(LocalDate.parse(value));
        } catch (Exception e) {
            return null;
        }
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String normalizeFileType(String fileType) {
        if (fileType == null || fileType.isBlank()) {
            return "OTHER";
        }
        return switch (fileType.trim().toLowerCase()) {
            case "health_certificate", "health_cert", "health-cert" -> "HEALTH_CERT";
            case "contract" -> "CONTRACT";
            case "id_card", "id-card" -> "ID_CARD";
            case "bank_account", "bank-account" -> "BANK_ACCOUNT";
            default -> fileType.trim().toUpperCase();
        };
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "PENDING";
        }
        return switch (status.trim().toLowerCase()) {
            case "verified", "approved" -> "VERIFIED";
            case "rejected" -> "REJECTED";
            case "expired" -> "EXPIRED";
            default -> "PENDING";
        };
    }

    private String buildStoragePath(String storeId, String userId, String fileType, String fileId, String originalName) {
        return storeId + "/" + userId + "/" + fileType + "/" + fileId + extensionOf(originalName);
    }

    private String extensionOf(String originalName) {
        if (originalName == null || originalName.isBlank() || !originalName.contains(".")) {
            return "";
        }
        String extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
        return extension.matches("\\.[a-z0-9]{1,10}") ? extension : "";
    }
}
