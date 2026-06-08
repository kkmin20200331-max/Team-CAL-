package com.dm.backend.service;

import com.dm.backend.vo.AttendanceQrVO;

public interface AttendanceQrService {

    AttendanceQrVO generateQr(
            String store_id
    );

}