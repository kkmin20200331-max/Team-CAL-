package com.dm.backend.service;

import com.dm.backend.mapper.UserLineMapper;
import com.dm.backend.vo.UserLineVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
}