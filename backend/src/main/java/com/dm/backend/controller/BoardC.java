package com.dm.backend.controller;

import com.dm.backend.service.BoardService;
import com.dm.backend.vo.BoardVO;
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
@RequestMapping("/api/board")
public class BoardC {

    @Autowired
    private BoardService boardService;

    @PostMapping
    public ResponseEntity<?> registerBoard(
            @RequestBody BoardVO boardVO
    ) {
        try {
            return ResponseEntity.ok(
                    boardService.registerBoard(boardVO)
            );
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

    @PostMapping("/tab")
    public ResponseEntity<?> registerBoardTab(
            @RequestBody BoardVO boardVO
    ) {
        return registerBoard(boardVO);
    }

    @PutMapping
    public void updateBoard(
            @RequestBody BoardVO boardVO
    ) {
        boardService.updateBoard(boardVO);
    }

    @DeleteMapping
    public ResponseEntity<?> deleteBoard(
            @RequestParam String id
    ) {
        try {
            boardService.deleteBoard(id);
            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "deleted"
                    )
            );
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

    @GetMapping
    public List<BoardVO> getBoardList(
            @RequestParam String store_id
    ) {
        return boardService.getBoardList(store_id);
    }

    @GetMapping("/{id}")
    public BoardVO getBoard(
            @PathVariable String id
    ) {
        return boardService.getBoard(id);
    }
}
