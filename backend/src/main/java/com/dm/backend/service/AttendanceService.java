package com.dm.backend.service;

public interface AttendanceService {

    String checkAttendance(
            String qr_token,
            String user_id
    );

}