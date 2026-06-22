package com.dm.backend.service;

import com.dm.backend.mapper.FileMapper;
import com.dm.backend.vo.FileVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileMapper fileMapper;
    private final RestTemplate restTemplate;

    @Value("${supabase.project.url}")
    private String supabaseUrl;

    @Value("${supabase.project.key}")
    private String supabaseKey;

    private static final String BUCKET = "documents";

    // =========================
    // [공통]
    // =========================

    public void insertFile(FileVO fileVO) {
        fileMapper.insertFile(fileVO);
    }

    public void updateFile(FileVO fileVO) {
        fileMapper.updateFile(fileVO);
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

    // =========================
    // [매장 전체 파일 조회]
    // =========================

    public List<FileVO> getFilesByStoreId(String storeId) {
        return fileMapper.selectFilesByStoreId(storeId);
    }

    // =========================
    // [Supabase 업로드]
    // =========================

    public FileVO uploadToSupabase(String userId, String fileType, MultipartFile file) throws Exception {
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String ext = "";
        int dotIdx = originalName.lastIndexOf('.');
        if (dotIdx >= 0) ext = originalName.substring(dotIdx);

        String fileId   = UUID.randomUUID().toString().replace("-", "").substring(0, 21);
        String path     = userId + "/" + fileId + ext;
        String apiUrl   = supabaseUrl.replaceAll("/$", "") + "/storage/v1/object/" + BUCKET + "/" + path;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseKey);
        headers.setContentType(MediaType.parseMediaType(
                file.getContentType() != null ? file.getContentType() : "application/octet-stream"
        ));

        ResponseEntity<Map> res = restTemplate.exchange(apiUrl, HttpMethod.POST, new HttpEntity<>(file.getBytes(), headers), Map.class);
        if (!res.getStatusCode().is2xxSuccessful()) throw new RuntimeException("Supabase 업로드 실패");

        FileVO vo = new FileVO();
        vo.setId(fileId);
        vo.setUser_id(userId);
        vo.setFile_type(fileType.toUpperCase());
        vo.setOriginal_name(originalName);
        vo.setStorage_path(path);
        vo.setFile_size(file.getSize());
        vo.setMime_type(file.getContentType());

        fileMapper.insertFile(vo);
        return vo;
    }

    // =========================
    // [Supabase 서명 URL]
    // =========================

    public String getSignedUrl(String id) {
        FileVO file = fileMapper.selectFileById(id);
        if (file == null) throw new RuntimeException("파일을 찾을 수 없습니다.");

        String apiUrl = supabaseUrl.replaceAll("/$", "") + "/storage/v1/object/sign/" + BUCKET + "/" + file.getStorage_path();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<Map> res = restTemplate.exchange(apiUrl, HttpMethod.POST, new HttpEntity<>("{\"expiresIn\":3600}", headers), Map.class);
        if (res.getBody() == null) throw new RuntimeException("서명 URL 생성 실패");

        String signedUrl = (String) res.getBody().get("signedURL");
        return supabaseUrl.replaceAll("/$", "") + "/storage/v1" + signedUrl;
    }

    // =========================
    // [Supabase 파일 삭제]
    // =========================

    public void deleteFromSupabase(String id) {
        FileVO file = fileMapper.selectFileById(id);
        if (file == null) return;

        String apiUrl = supabaseUrl.replaceAll("/$", "") + "/storage/v1/object/" + BUCKET;
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        String body = "{\"prefixes\":[\"" + file.getStorage_path() + "\"]}";
        try {
            restTemplate.exchange(apiUrl, HttpMethod.DELETE, new HttpEntity<>(body, headers), Map.class);
        } catch (Exception ignored) {}

        fileMapper.deleteFile(id);
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
}