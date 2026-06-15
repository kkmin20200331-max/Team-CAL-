package com.dm.backend.service;

import com.dm.backend.mapper.BoardPostMapper;
import com.dm.backend.vo.BoardPostVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardPostService {

    private final BoardPostMapper boardPostMapper;

    // =========================
    // [공통]
    // =========================

    public List<BoardPostVO> getPostList(
            String board_id
    ) {
        return boardPostMapper.getPostList(
                board_id
        );
    }

    public BoardPostVO getPost(
            String id
    ) {

        boardPostMapper.increaseViewCount(
                id
        );

        return boardPostMapper.getPost(
                id
        );
    }

    public List<BoardPostVO> searchPost(
            String store_id,
            String keyword
    ) {
        return boardPostMapper.searchPost(
                store_id,
                keyword
        );
    }

    // =========================
    // [관리자]
    // =========================

    public void createPost(
            BoardPostVO vo
    ) {
        boardPostMapper.createPost(
                vo
        );
    }

    public void updatePost(
            BoardPostVO vo
    ) {
        boardPostMapper.updatePost(
                vo
        );
    }

    public void deletePost(
            String id
    ) {
        boardPostMapper.deletePost(
                id
        );
    }
}