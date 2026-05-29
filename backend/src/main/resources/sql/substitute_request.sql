CREATE TABLE SUBSTITUTE_REQUEST (
                                    id VARCHAR2(21 char) PRIMARY KEY,
                                    shift_id VARCHAR2(21 char) REFERENCES SHIFT(id) ON DELETE CASCADE,
                                    work_date DATE NOT NULL,
                                    start_at VARCHAR2(50 char) NOT NULL, -- 👈 10에서 50으로 전격 확장
                                    end_at VARCHAR2(50 char) NOT NULL,   -- 👈 10에서 50으로 전격 확장
                                    pay_rate NUMBER NOT NULL,
                                    status VARCHAR2(20 char) NOT NULL,
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO SUBSTITUTE_REQUEST (id, shift_id, work_date, start_at, end_at, pay_rate, status, created_at)
SELECT
    'SR_AUTO_001',
    id,
    work_date,
    start_at,               -- 💡 이제 24바이트짜리 원본 데이터가 들어와도 부드럽게 수용합니다.
    end_at,
    12000,
    'OPEN',
    CURRENT_TIMESTAMP
FROM SHIFT
WHERE ROWNUM = 1;
select * from substitute_request;