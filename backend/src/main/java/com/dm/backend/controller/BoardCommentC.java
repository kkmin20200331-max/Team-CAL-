package com.dm.backend.controller;

import com.dm.backend.service.BoardCommentService;
import com.dm.backend.vo.BoardCommentVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/board/comment")
@RequiredArgsConstructor
public class BoardCommentC {

    private final BoardCommentService boardCommentService;

    // =========================
    // [공통]
    // =========================

    @GetMapping
    public List<BoardCommentVO> getCommentList(
            @RequestParam String post_id
    ) {
        return boardCommentService.getCommentList(post_id);
    }

    // =========================
    // [직원]
    // =========================

    @PostMapping
    public void createComment(@RequestBody BoardCommentVO vo) {
        boardCommentService.createComment(vo);
    }

    @PutMapping
    public void updateComment(@RequestBody BoardCommentVO vo) {
        boardCommentService.updateComment(vo);
    }

    @DeleteMapping
    public void deleteComment(
            @RequestParam String id,
            @RequestParam String post_id
    ) {
        boardCommentService.deleteComment(id, post_id);
    }
}