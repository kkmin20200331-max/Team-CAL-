package com.dm.backend.controller;

import com.dm.backend.service.BoardCommentService;
import com.dm.backend.vo.BoardCommentVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/board/comment")
public class BoardCommentC {

    @Autowired
    private BoardCommentService boardCommentService;

    // 댓글 목록 조회
    @GetMapping
    public List<BoardCommentVO> getCommentList(
            @RequestParam String post_id
    ) {
        return boardCommentService.getCommentList(post_id);
    }

    // 댓글 등록
    @PostMapping
    public void createComment(
            @RequestBody BoardCommentVO boardCommentVO
    ) {
        boardCommentService.createComment(boardCommentVO);
    }

    // 댓글 삭제
    @DeleteMapping
    public void deleteComment(
            @RequestParam String id,
            @RequestParam String post_id
    ) {
        boardCommentService.deleteComment(id, post_id);
    }
}
