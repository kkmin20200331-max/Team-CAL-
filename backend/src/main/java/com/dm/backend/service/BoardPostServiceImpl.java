package com.dm.backend.service;

import com.dm.backend.mapper.BoardPostMapper;
import com.dm.backend.vo.BoardPostVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BoardPostServiceImpl
        implements BoardPostService {

    @Autowired
    private BoardPostMapper boardPostMapper;

    // =========================
    // [공통]
    // =========================

    @Override
    public List<BoardPostVO> getPostList(
            String board_id
    ) {
        return boardPostMapper.getPostList(
                board_id
        );
    }

    @Override
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

    @Override
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

    @Override
    public void createPost(
            BoardPostVO vo
    ) {
        boardPostMapper.createPost(vo);
    }

    @Override
    public void updatePost(
            BoardPostVO vo
    ) {
        boardPostMapper.updatePost(vo);
    }

    @Override
    public void deletePost(
            String id
    ) {
        boardPostMapper.deletePost(id);
    }
}