CREATE TABLE LEAVE_REQUEST (
                               id VARCHAR2(21 char) PRIMARY KEY,
                               shift_id VARCHAR2(21 char) REFERENCES SHIFT(id) ON DELETE CASCADE,
                               user_id VARCHAR2(21 char) REFERENCES USERS(id) ON DELETE CASCADE,
                               reason VARCHAR2(255),
                               status VARCHAR2(20 char) NOT NULL,     -- PENDING, APPROVED, REJECTED
                               requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               processed_at TIMESTAMP
);
-- 1. 박신입(U9L0mN1o...)의 휴무 신청 (점주 승인 대기 중)
-- 다가오는 5월 26일 스케줄에 대해 휴무를 요청함
INSERT INTO leave_request (id, shift_id, user_id, reason, status, requested_at, processed_at)
VALUES (
           'LR_Park_20260526',
           'SHF_Park_20260526_01',
           'U9L0mN1o_P2qR3sT4uV53',
           '학교 전공 시험으로 인한 휴무 요청',
           'PENDING',
           TO_TIMESTAMP('2026-05-21 14:30:00', 'YYYY-MM-DD HH24:MI:SS'),
           NULL -- 아직 승인/거절 전이므로 처리 시간은 NULL
       );

-- 2. 이알바(U2xY8pQ3...)의 휴무 신청 (점주 승인 완료)
-- 다가오는 5월 25일 스케줄에 대해 휴무를 요청했고, 점주가 확인 후 승인함
INSERT INTO leave_request (id, shift_id, user_id, reason, status, requested_at, processed_at)
VALUES (
           'LR_Lee_20260525',
           'SHF_Lee_20260525_01',
           'U2xY8pQ3_a1BcDeFgH1j2',
           '병원 진료 예약',
           'APPROVED',
           TO_TIMESTAMP('2026-05-20 09:00:00', 'YYYY-MM-DD HH24:MI:SS'),
           TO_TIMESTAMP('2026-05-21 10:15:00', 'YYYY-MM-DD HH24:MI:SS') -- 점주가 처리한 시간
       );

-- 데이터 삽입 후 바로 전체 리스트 조회 (신청일자 최신순)
SELECT * FROM leave_request ORDER BY requested_at DESC;