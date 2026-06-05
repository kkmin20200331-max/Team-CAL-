package com.dm.backend.service;

import com.dm.backend.mapper.BoardMapper;
import com.dm.backend.vo.BoardVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BoardService {

    @Autowired
    private BoardMapper boardMapper;

    // =========================
    // [관리자]
    // =========================

    public void registerBoard(BoardVO boardVO) {
        boardMapper.registerBoard(boardVO);
    }

    public void updateBoard(BoardVO boardVO) {
        boardMapper.updateBoard(boardVO);
    }

    public void deleteBoard(String id) {
        boardMapper.deleteBoard(id);
    }


    // =========================
    // [공통]
    // =========================

    public List<BoardVO> getBoardList(String store_id) {
        return boardMapper.getBoardList(store_id);
    }

    public BoardVO getBoard(String id) {
        return boardMapper.getBoard(id);
    }
}