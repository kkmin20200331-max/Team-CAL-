package com.dm.backend.service;

import com.dm.backend.mapper.BoardPostMapper;
import com.dm.backend.vo.BoardVO;
import com.dm.backend.vo.BoardPostVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BoardPostService {

    private final BoardPostMapper boardPostMapper;
    private final BoardService boardService;

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
        validatePost(vo);
        prepareBoard(vo);
        preparePostDefaults(vo);

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

    private void prepareBoard(BoardPostVO vo) {
        if (vo.getBoard_id() != null && !vo.getBoard_id().isBlank()) {
            return;
        }

        if (vo.getBoard_name() == null || vo.getBoard_name().isBlank()) {
            throw new IllegalArgumentException("Board id or board name is required.");
        }

        BoardVO boardVO = new BoardVO();
        boardVO.setStore_id(vo.getStore_id());
        boardVO.setName(vo.getBoard_name());
        boardVO.setCreated_by(vo.getWriter_id());

        BoardVO board = boardService.registerBoard(boardVO);
        vo.setBoard_id(board.getId());
    }

    private void preparePostDefaults(BoardPostVO vo) {
        if (vo.getId() == null || vo.getId().isBlank()) {
            vo.setId(
                    "POST_" + UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            .substring(0, 18)
            );
        }

        if (vo.getStatus() == null || vo.getStatus().isBlank()) {
            vo.setStatus("PUBLISHED");
        }

        if (vo.getIs_pinned() == null || vo.getIs_pinned().isBlank()) {
            vo.setIs_pinned("N");
        }
    }

    private void validatePost(BoardPostVO vo) {
        if (vo == null) {
            throw new IllegalArgumentException("Post data is required.");
        }

        if (vo.getStore_id() == null || vo.getStore_id().isBlank()) {
            throw new IllegalArgumentException("Store id is required.");
        }

        if (vo.getWriter_id() == null || vo.getWriter_id().isBlank()) {
            throw new IllegalArgumentException("Writer id is required.");
        }

        if (vo.getTitle() == null || vo.getTitle().isBlank()) {
            throw new IllegalArgumentException("Post title is required.");
        }
    }
}
