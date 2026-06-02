package com.dm.backend.service;

import com.dm.backend.mapper.BoardPostMapper;
import com.dm.backend.vo.BoardPostVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class BoardPostService {

    @Autowired
    private BoardPostMapper boardPostMapper;

    // =========================
    // [공통]
    // =========================

    public void registerPost(BoardPostVO boardPostVO) {
        boardPostMapper.registerPost(boardPostVO);
    }

    public void updatePost(BoardPostVO boardPostVO) {
        boardPostMapper.updatePost(boardPostVO);
    }

    public void deletePost(String id) {
        boardPostMapper.deletePost(id);
    }


    public List<BoardPostVO> getPostList(String board_id) {
        return boardPostMapper.getPostList(board_id);
    }

    public BoardPostVO getPost(String id) {
        return boardPostMapper.getPost(id);
    }
}

