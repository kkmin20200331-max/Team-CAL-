package com.dm.backend.controller;

import com.dm.backend.service.BoardPostService;
import com.dm.backend.vo.BoardPostVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/board/post")
public class BoardPostC {

    @Autowired
    private BoardPostService boardPostService;

    @GetMapping("/{id}")
    public BoardPostVO getPost(
            @PathVariable String id
    ) {
        return boardPostService.getPost(id);
    }

    @GetMapping
    public List<BoardPostVO> getPostList(
            @RequestParam String board_id
    ) {
        return boardPostService.getPostList(board_id);
    }

    @GetMapping("/search")
    public List<BoardPostVO> searchPost(
            @RequestParam String store_id,
            @RequestParam String keyword
    ) {
        return boardPostService.searchPost(store_id, keyword);
    }

    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestBody BoardPostVO boardPostVO
    ) {
        try {
            boardPostService.createPost(boardPostVO);
            return ResponseEntity.ok(boardPostVO);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "message",
                                    e.getMessage()
                            )
                    );
        }
    }

    @PutMapping
    public void updatePost(
            @RequestBody BoardPostVO boardPostVO
    ) {
        boardPostService.updatePost(boardPostVO);
    }

    @DeleteMapping
    public void deletePost(
            @RequestParam String id
    ) {
        boardPostService.deletePost(id);
    }
}
