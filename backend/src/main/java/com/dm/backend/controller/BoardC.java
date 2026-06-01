package com.dm.backend.controller;

import com.dm.backend.service.BoardService;
import com.dm.backend.vo.BoardVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/board")
public class BoardC {

    @Autowired
    private BoardService boardService;

    // =========================
    // [관리자]
    // =========================

    // 게시판 생성
    @PostMapping
    public void registerBoard(
            @RequestBody BoardVO boardVO
    ){
        boardService.registerBoard(boardVO);
    }

    // 게시판 수정
    @PutMapping
    public void updateBoard(
            @RequestBody BoardVO boardVO
    ){
        boardService.updateBoard(boardVO);
    }

    // 게시판 삭제
    @DeleteMapping
    public void deleteBoard(
            @RequestParam String id
    ){
        boardService.deleteBoard(id);
    }


    // =========================
    // [공통]
    // =========================

    // 게시판 목록 조회
    @GetMapping
    public List<BoardVO> getBoardList(
            @RequestParam String store_id
    ){
        return boardService.getBoardList(store_id);
    }

    // 게시판 단건 조회
    @GetMapping("/{id}")
    public BoardVO getBoard(
            @PathVariable String id
    ){
        return boardService.getBoard(id);
    }
}