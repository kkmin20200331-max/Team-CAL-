CREATE TABLE ATTENDANCE (
                            id VARCHAR2(21 char) PRIMARY KEY,
                            shift_id VARCHAR2(21 char) REFERENCES SHIFT(id) ON DELETE CASCADE,
                            check_in_at TIMESTAMP,
                            check_out_at TIMESTAMP,
                            attendance_status VARCHAR2(20 char)
);
INSERT INTO attendance VALUES ('ATT_Lee_20260518', 'SHF_Lee_20260518_01', TO_TIMESTAMP('2026-05-18 17:55:00', 'YYYY-MM-DD HH24:MI:SS'), TO_TIMESTAMP('2026-05-18 22:05:00', 'YYYY-MM-DD HH24:MI:SS'), 'ON_TIME');
select * from attendance;
