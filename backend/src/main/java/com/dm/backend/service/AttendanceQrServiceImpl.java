package com.dm.backend.service;

import com.dm.backend.mapper.AttendanceQrMapper;
import com.dm.backend.vo.AttendanceQrVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.UUID;

@Service
public class AttendanceQrServiceImpl
        implements AttendanceQrService {

    @Autowired
    private AttendanceQrMapper attendanceQrMapper;

    @Override
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