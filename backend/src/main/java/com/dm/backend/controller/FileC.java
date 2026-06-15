package com.dm.backend.controller;

import com.dm.backend.service.FileService;
import com.dm.backend.vo.FileVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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