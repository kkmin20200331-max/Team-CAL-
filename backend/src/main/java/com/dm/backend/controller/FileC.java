package com.dm.backend.controller;

import com.dm.backend.service.FileService;
import com.dm.backend.vo.FileVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/file")
@RequiredArgsConstructor
public class FileC {

    private final FileService fileService;

    // =========================
    // [공통]
    // =========================

    @PostMapping
    public void insertFile(
            @RequestBody FileVO fileVO
    ) {
        fileService.insertFile(fileVO);
    }

    @PutMapping
    public void updateFile(
            @RequestBody FileVO fileVO
    ) {
        fileService.updateFile(fileVO);
    }

    @PostMapping("/upload")
    public FileVO uploadFile(
            @RequestParam String store_id,
            @RequestParam String user_id,
            @RequestParam String file_type,
            @RequestParam("file") MultipartFile file
    ) {
        return fileService.uploadAndAnalyze(store_id, user_id, file_type, file);
    }

    @PostMapping("/{id}/ocr")
    public FileVO runOcr(
            @PathVariable String id
    ) {
        return fileService.runOcr(id);
    }

    @GetMapping("/{id}/signed-url")
    public Map<String, String> createSignedUrl(
            @PathVariable String id
    ) {
        String url = fileService.createSignedUrl(id);
        return Map.of("url", url == null ? "" : url);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(
            @PathVariable String id,
            @RequestParam String status
    ) {
        fileService.updateFileStatus(id, status);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public void deleteFile(
            @PathVariable String id
    ) {
        fileService.deleteFile(id);
    }

    @GetMapping("/{id}")
    public FileVO getFileById(
            @PathVariable String id
    ) {
        return fileService.getFileById(id);
    }

    @GetMapping("/user/{userId}")
    public List<FileVO> getFilesByUserId(
            @PathVariable String userId
    ) {
        return fileService.getFilesByUserId(userId);
    }

    // =========================
    // [매장 전체 파일 조회]
    // =========================

    @GetMapping("/store/{storeId}")
    public List<FileVO> getFilesByStoreId(@PathVariable String storeId) {
        return fileService.getFilesByStoreId(storeId);
    }

    // =========================
    // [Supabase 업로드]
    // =========================

    @PostMapping("/upload-supabase")
    public ResponseEntity<?> upload(
            @RequestParam String user_id,
            @RequestParam String file_type,
            @RequestParam("file") MultipartFile file
    ) {
        try {
            FileVO vo = fileService.uploadToSupabase(user_id, file_type, file);
            return ResponseEntity.ok(vo);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // =========================
    // [서명 URL (다운로드/미리보기)]
    // =========================

    @GetMapping("/{id}/url")
    public ResponseEntity<?> getSignedUrl(@PathVariable String id) {
        try {
            return ResponseEntity.ok(Map.of("url", fileService.getSignedUrl(id)));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // =========================
    // [Supabase 파일 삭제]
    // =========================

    @DeleteMapping("/supabase/{id}")
    public ResponseEntity<?> deleteFromSupabase(@PathVariable String id) {
        fileService.deleteFromSupabase(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    // =========================
    // [근로계약서]
    // =========================

    @GetMapping("/contract/{userId}")
    public List<FileVO> getContractsByUserId(
            @PathVariable String userId
    ) {
        return fileService.getContractsByUserId(userId);
    }

    // =========================
    // [보건증]
    // =========================

    @GetMapping("/health-cert/{userId}")
    public List<FileVO> getHealthCertsByUserId(
            @PathVariable String userId
    ) {
        return fileService.getHealthCertsByUserId(userId);
    }
}
