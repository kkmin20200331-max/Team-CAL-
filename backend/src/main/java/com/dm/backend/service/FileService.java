package com.dm.backend.service;

import com.dm.backend.mapper.FileMapper;
import com.dm.backend.vo.FileVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileMapper fileMapper;

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