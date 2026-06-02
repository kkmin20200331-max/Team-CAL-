package com.dm.backend.controller;


import com.dm.backend.service.BoardPostService;
import com.dm.backend.vo.BoardPostVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/board_post")
public class BoardPostC {

    @Autowired
    private BoardPostService boardPostService;

    // =========================
    // [공통]
    // =========================

    // 게시글 작성
    @PostMapping
    public void registerPost(
            @RequestBody BoardPostVO boardPostVO
    ) {
        boardPostService.registerPost(boardPostVO);
    }

    // 게시글 수정
    @PutMapping
    public void updatePost(
            @RequestBody BoardPostVO boardPostVO
    ) {
        boardPostService.updatePost(boardPostVO);
    }

    // 게시글 삭제
    @DeleteMapping
    public void deletePost(
            @RequestParam String id
    ) {
        boardPostService.deletePost(id);
    }


    // 게시글 목록 조회
    @GetMapping
    public List<BoardPostVO> getPostList(
            @RequestParam String board_id
    ) {
        return boardPostService.getPostList(board_id);
    }

    // 게시글 조회
    @GetMapping("/{id}")
    public BoardPostVO getPost(
            @PathVariable String id
    ) {
        return boardPostService.getPost(id);
    }
}

