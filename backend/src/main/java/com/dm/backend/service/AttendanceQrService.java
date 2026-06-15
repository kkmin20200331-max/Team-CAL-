package com.dm.backend.service;

import com.dm.backend.mapper.AttendanceQrMapper;
import com.dm.backend.vo.AttendanceQrVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceQrService {

    private final AttendanceQrMapper attendanceQrMapper;

    // =========================
    // [QR 생성]
    // =========================

    public AttendanceQrVO generateQr(
            String store_id
    ) {

        String token =
                UUID.randomUUID().toString();

        Date now =
                new Date();

        Date expire =
                new Date(
                        now.getTime()
                                + (10 * 60 * 1000)
                );

        AttendanceQrVO vo =
                new AttendanceQrVO(
                        token,
                        store_id,
                        now,
                        expire,
                        "Y"
                );

        attendanceQrMapper.createQr(
                vo
        );

        return vo;
    }
}