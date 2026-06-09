package com.dm.backend.service;

import com.dm.backend.vo.BoardPostVO;

import java.util.List;

public interface BoardPostService {

    // =========================
    // [공통]
    // =========================

    BoardPostVO getPost(String id);

    List<BoardPostVO> getPostList(
            String store_id
    );

    List<BoardPostVO> searchPost(
            String store_id,
            String keyword
    );


    // =========================
    // [관리자]
    // =========================

    void createPost(
            BoardPostVO boardPostVO
    );

    void updatePost(
            BoardPostVO boardPostVO
    );

    void deletePost(
            String id
    );
}