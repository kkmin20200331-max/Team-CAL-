package com.dm.backend.service;

import com.dm.backend.mapper.BoardMapper;
import com.dm.backend.vo.BoardVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class BoardService {

    @Autowired
    private BoardMapper boardMapper;

    // =========================
    // [관리자]
    // =========================

    public BoardVO registerBoard(BoardVO boardVO) {
        validateBoard(boardVO);

        boardVO.setName(boardVO.getName().trim());

        BoardVO existingBoard = boardMapper.getBoardByStoreAndName(
                boardVO.getStore_id(),
                boardVO.getName()
        );

        if (existingBoard != null) {
            return existingBoard;
        }

        if (boardVO.getId() == null || boardVO.getId().isBlank()) {
            boardVO.setId(
                    "BRD_" + UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            .substring(0, 18)
            );
        }

        boardMapper.registerBoard(boardVO);

        return boardMapper.getBoard(boardVO.getId());
    }

    public void updateBoard(BoardVO boardVO) {
        boardMapper.updateBoard(boardVO);
    }

    public void deleteBoard(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Board id is required.");
        }

        if (boardMapper.countPostByBoardId(id) > 0) {
            throw new IllegalArgumentException("게시글이 있는 탭은 삭제할 수 없습니다. 게시글을 먼저 이동하거나 삭제해주세요.");
        }

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

    private void validateBoard(BoardVO boardVO) {
        if (boardVO == null) {
            throw new IllegalArgumentException("Board data is required.");
        }

        if (boardVO.getStore_id() == null || boardVO.getStore_id().isBlank()) {
            throw new IllegalArgumentException("Store id is required.");
        }

        if (boardVO.getName() == null || boardVO.getName().isBlank()) {
            throw new IllegalArgumentException("Board name is required.");
        }

        if (boardVO.getCreated_by() == null || boardVO.getCreated_by().isBlank()) {
            throw new IllegalArgumentException("Creator id is required.");
        }
    }
}
