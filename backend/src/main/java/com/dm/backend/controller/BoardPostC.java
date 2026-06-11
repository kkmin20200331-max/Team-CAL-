package com.dm.backend.controller;

import com.dm.backend.service.BoardPostService;
import com.dm.backend.vo.BoardPostVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/board/post")
public class BoardPostC {

    @Autowired
    private BoardPostService boardPostService;

    // =========================
    // [공통]
    // =========================

    // 게시글 단건 조회
    @GetMapping("/{id}")
    public BoardPostVO getPost(
            @PathVariable String id
    ) {
        return boardPostService.getPost(id);
    }

    // 게시글 목록 조회
    @GetMapping
    public List<BoardPostVO> getPostList(
            @RequestParam String board_id
    ) {
        return boardPostService.getPostList(
                board_id
        );
    }

    // 게시글 검색
    @GetMapping("/search")
    public List<BoardPostVO> searchPost(
            @RequestParam String store_id,
            @RequestParam String keyword
    ) {
        return boardPostService.searchPost(
                store_id,
                keyword
        );
    }

    // =========================
    // [관리자]
    // =========================

    // 게시글 등록
    @PostMapping
    public void createPost(
            @RequestBody BoardPostVO boardPostVO
    ) {
        boardPostService.createPost(
                boardPostVO
        );
    }

    // 게시글 수정
    @PutMapping
    public void updatePost(
            @RequestBody BoardPostVO boardPostVO
    ) {
        boardPostService.updatePost(
                boardPostVO
        );
    }

    // 게시글 삭제
    @DeleteMapping
    public void deletePost(
            @RequestParam String id
    ) {
        boardPostService.deletePost(
                id
        );
    }

    // =========================
    // [직원]
    // =========================

}