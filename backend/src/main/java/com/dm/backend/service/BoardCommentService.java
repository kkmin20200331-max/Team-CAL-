package com.dm.backend.service;

import com.dm.backend.mapper.BoardCommentMapper;
import com.dm.backend.vo.BoardCommentVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BoardCommentService {

    @Autowired
    private BoardCommentMapper boardCommentMapper;

    public List<BoardCommentVO> getCommentList(String post_id) {
        return boardCommentMapper.getCommentList(post_id);
    }

    public void createComment(BoardCommentVO vo) {
        boardCommentMapper.createComment(vo);
        boardCommentMapper.syncCommentCount(vo.getPost_id());
    }

    public void deleteComment(String id, String post_id) {
        boardCommentMapper.deleteComment(id);
        boardCommentMapper.syncCommentCount(post_id);
    }
}
