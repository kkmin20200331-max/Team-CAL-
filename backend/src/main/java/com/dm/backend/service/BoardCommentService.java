package com.dm.backend.service;

import com.dm.backend.mapper.BoardCommentMapper;
import com.dm.backend.mapper.UserMapper;
import com.dm.backend.vo.BoardCommentVO;
import com.dm.backend.vo.UserVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardCommentService {

    private final BoardCommentMapper boardCommentMapper;
    // ✅ [추가] 댓글 삭제 권한 판단을 위한 유저 정보 조회용 Mapper
    private final UserMapper userMapper;

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

    // ✅ [수정] 댓글을 삭제하려는 사용자가 본인이거나 관리자(ADMIN)인지 권한 검증하는 기능 추가
    public void deleteComment(String id, String post_id, String user_id) {
        BoardCommentVO comment = boardCommentMapper.getCommentById(id);
        if (comment == null) return;

        UserVo user = userMapper.getUserById(user_id);
        if (user == null) {
            throw new IllegalArgumentException("존재하지 않는 사용자입니다.");
        }

        // 본인 작성 댓글이거나 권한이 ADMIN인 경우에만 삭제 통과
        if (comment.getUser_id().equals(user_id) || "ADMIN".equals(user.getRole())) {
            boardCommentMapper.deleteComment(id);
            boardCommentMapper.syncCommentCount(post_id);
        } else {
            throw new IllegalArgumentException("댓글 삭제 권한이 없습니다.");
        }
    }
}

