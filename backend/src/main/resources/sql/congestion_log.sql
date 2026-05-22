CREATE TABLE CONGESTION_LOG (
                                id VARCHAR2(21 char) PRIMARY KEY,
                                store_id VARCHAR2(21 char) REFERENCES STORE(id) ON DELETE CASCADE,
                                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                customer_count NUMBER DEFAULT 0,
                                congestion_rate NUMBER(5,2),
                                estimated_waiting_minutes NUMBER DEFAULT 0
);
INSERT INTO congestion_log VALUES ('CGL_20260518_1900', 'V1StGXR8_Z5jdHi6B-myT', TO_TIMESTAMP('2026-05-18 19:00:00', 'YYYY-MM-DD HH24:MI:SS'), 45, 85.50, 15);
select * from congestion_log;
