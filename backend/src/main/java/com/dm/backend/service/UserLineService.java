package com.dm.backend.service;

import com.dm.backend.mapper.UserLineMapper;
import com.dm.backend.vo.UserLineVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserLineService {

    @Autowired
    private UserLineMapper userLineMapper;

    // =========================
    // LINE 연동 등록
    // =========================

    public void register(
            UserLineVO vo
    ) {

        if (vo.getFollow_yn() == null || vo.getFollow_yn().isBlank()) {
            vo.setFollow_yn("N");
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

        UserLineVO lineInfo =
                userLineMapper.findByLineUserId(
                        vo.getLine_user_id()
                );

        if(lineInfo != null){

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
            return List.of();
        }
    }

    public List<String> getAdminLineUserIdsByStoreId(String store_id) {

        try {
            return userLineMapper.getAdminLineUserIdsByStoreId(store_id);
        } catch (Exception e) {
            return List.of();
        }
    }
}
