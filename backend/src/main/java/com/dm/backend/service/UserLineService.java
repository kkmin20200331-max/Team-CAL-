package com.dm.backend.service;

import com.dm.backend.mapper.UserLineMapper;
import com.dm.backend.vo.UserLineVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserLineService {

    @Autowired
    private UserLineMapper userLineMapper;

    // =========================
    // LINE 연동 등록
    // =========================

    @Transactional
    public void register(
            UserLineVO vo
    ) {

        if (vo.getFollow_yn() == null || vo.getFollow_yn().isBlank()) {
            vo.setFollow_yn("N");
        }

        UserLineVO lineInfo =
                userLineMapper.findByLineUserId(
                        vo.getLine_user_id()
                );

        if (lineInfo != null
                && lineInfo.getUser_id() != null
                && vo.getUser_id() != null
                && !lineInfo.getUser_id().trim().equals(vo.getUser_id().trim())) {

            System.out.println(
                    "LINE account relinked from user_id "
                            + lineInfo.getUser_id()
                            + " to "
                            + vo.getUser_id()
            );

            userLineMapper.deleteByLineUserId(
                    vo.getLine_user_id()
            );
        }

        UserLineVO userInfo =
                userLineMapper.findByUserId(
                        vo.getUser_id()
                );

        if(userInfo != null){

            userLineMapper.updateLineUserId(
                    vo
            );

            return;
        }

        UserLineVO existingLineInfo =
                userLineMapper.findByLineUserId(
                        vo.getLine_user_id()
                );

        if(existingLineInfo != null){

            throw new RuntimeException(
                    "이미 다른 계정에 연동된 LINE 계정입니다."
            );
        }

        userLineMapper.register(
                vo
        );
    }



    // =========================
    // LINE 조회
    // =========================

    public UserLineVO getLineInfo(
            String user_id
    ) {

        return userLineMapper.getLineInfo(
                user_id
        );
    }



    // =========================
    // LINE USER ID 조회
    // =========================

    public String getLineUserId(
            String user_id
    ) {

        return userLineMapper.getLineUserId(
                user_id
        );
    }



    // =========================
    // 친구추가
    // =========================

    public void follow(
            String line_user_id
    ) {

        userLineMapper.follow(
                line_user_id
        );
    }



    // =========================
    // 친구삭제
    // =========================

    public void unfollow(
            String line_user_id
    ) {

        userLineMapper.unfollow(
                line_user_id
        );
    }



    // =========================
    // LINE 연동 해제
    // =========================

    public void delete(
            String user_id
    ) {

        userLineMapper.delete(
                user_id
        );
    }
    // =========================
    // LINE - 직원 USER_ID → LINE USER_ID
    // =========================
    public String getLineUserIdByUserId(String user_id) {

        try {
            return userLineMapper.getLineUserId(user_id);
        } catch (Exception e) {
            return null;
        }
    }


    // =========================
    // LINE - shift_id → 관리자 LINE USER_ID
    // =========================
    public List<String> getOwnerLineUserIdsByShiftId(String shift_id) {

        try {
            return userLineMapper.getOwnerLineUserIdsByShiftId(shift_id);
        } catch (Exception e) {
            System.err.println("Admin LINE lookup by shift_id failed: " + shift_id + " / " + e.getMessage());
            return List.of();
        }
    }

    public List<String> getAdminLineUserIdsByStoreId(String store_id) {

        try {
            return userLineMapper.getAdminLineUserIdsByStoreId(store_id);
        } catch (Exception e) {
            System.err.println("Admin LINE lookup by store_id failed: " + store_id + " / " + e.getMessage());
            return List.of();
        }
    }

    public List<UserLineVO> getOwnerLineTargetsByShiftId(String shift_id) {

        try {
            return userLineMapper.getOwnerLineTargetsByShiftId(shift_id);
        } catch (Exception e) {
            System.err.println("Admin LINE target lookup by shift_id failed: " + shift_id + " / " + e.getMessage());
            return getOwnerLineUserIdsByShiftId(shift_id).stream()
                    .map(this::toDefaultLanguageTarget)
                    .toList();
        }
    }

    public List<UserLineVO> getAdminLineTargetsByStoreId(String store_id) {

        try {
            return userLineMapper.getAdminLineTargetsByStoreId(store_id);
        } catch (Exception e) {
            System.err.println("Admin LINE target lookup by store_id failed: " + store_id + " / " + e.getMessage());
            return getAdminLineUserIdsByStoreId(store_id).stream()
                    .map(this::toDefaultLanguageTarget)
                    .toList();
        }
    }

    private UserLineVO toDefaultLanguageTarget(String lineUserId) {

        UserLineVO target = new UserLineVO();
        target.setLine_user_id(lineUserId);
        target.setFollow_yn("Y");
        target.setLanguage("ko");

        return target;
    }
}
