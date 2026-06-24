package com.dm.backend.service;

import com.dm.backend.mapper.AttendanceQrMapper;
import com.dm.backend.mapper.StoreMemberMapper;
import com.dm.backend.vo.AttendanceQrVO;
import com.dm.backend.vo.StoreMemberVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceQrService {

    private final AttendanceQrMapper attendanceQrMapper;
    private final AttendanceService attendanceService;
    private final StoreMemberMapper storeMemberMapper;

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
                                + (30 * 1000)
                );

        AttendanceQrVO vo =
                new AttendanceQrVO(
                        token,
                        store_id,
                        now,
                        expire,
                        "Y"
                );

        attendanceQrMapper.expireStoreQrs(
                store_id
        );

        attendanceQrMapper.createQr(
                vo
        );

        return vo;
    }

    // =========================
    // [QR 검증 후 출퇴근 처리]
    // =========================

    public String checkAttendanceByQr(
            String qr_token,
            String user_id
    ) {

        if (qr_token == null || qr_token.isBlank()) {
            throw new IllegalArgumentException("QR 토큰이 없습니다.");
        }

        if (user_id == null || user_id.isBlank()) {
            throw new IllegalArgumentException("사용자 정보가 없습니다.");
        }

        AttendanceQrVO qr =
                attendanceQrMapper.getQr(
                        qr_token
                );

        if (qr == null) {
            throw new IllegalArgumentException("유효하지 않은 QR 코드입니다.");
        }

        Date now =
                new Date();

        if (qr.getExpired_at() == null
                || qr.getExpired_at().before(now)) {
            attendanceQrMapper.expireQr(
                    qr_token
            );
            throw new IllegalArgumentException("만료된 QR 코드입니다.");
        }

        StoreMemberVo member =
                storeMemberMapper.getMemberInfo(
                        user_id,
                        qr.getStore_id()
                );

        if (member == null
                || !"APPROVED".equalsIgnoreCase(member.getApproval_status())) {
            throw new IllegalArgumentException("해당 매장 직원만 출퇴근 처리할 수 있습니다.");
        }

        return attendanceService.checkAttendance(
                qr.getStore_id(),
                user_id
        );
    }
}
