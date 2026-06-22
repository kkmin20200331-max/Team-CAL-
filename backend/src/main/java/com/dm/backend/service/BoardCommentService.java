package com.dm.backend.service;

import com.dm.backend.mapper.BoardCommentMapper;
import com.dm.backend.vo.BoardCommentVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardCommentService {

    private final BoardCommentMapper boardCommentMapper;

    // =========================
    // [공통]
    // =========================

    public List<BoardCommentVO> getCommentList(String post_id) {
        return boardCommentMapper.getCommentList(post_id);
    }

    // =========================
    // [직원]
    // =========================

    public void createComment(BoardCommentVO vo) {
        boardCommentMapper.createComment(vo);
        boardCommentMapper.syncCommentCount(vo.getPost_id());
    }

    public void updateComment(BoardCommentVO vo) {
        boardCommentMapper.updateComment(vo);
    }

    public void deleteComment(String id, String post_id) {
        boardCommentMapper.deleteComment(id);
        boardCommentMapper.syncCommentCount(post_id);
    }
}
