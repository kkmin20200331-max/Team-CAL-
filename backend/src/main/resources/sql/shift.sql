create table shift(
    id varchar2(21 char) primary key,
    store_id varchar2(21 char) references store(id) on delete cascade,
    user_id varchar2(21 char) references users(id) on delete cascade,
    work_date date not null,
    start_at timestamp not null,
    end_at timestamp not null,
    status varchar2(20 char) not null

);
-- 1. 이알바(U2xY8pQ3...)의 과거 근무 완료 기록
INSERT INTO shift (id, store_id, user_id, work_date, start_at, end_at, status)
VALUES (
           'SHF_Lee_20260518_01',
           'V1StGXR8_Z5jdHi6B-myT',
           'U2xY8pQ3_a1BcDeFgH1j2',
           TO_DATE('2026-05-18', 'YYYY-MM-DD'),
           TO_TIMESTAMP('2026-05-18 18:00:00', 'YYYY-MM-DD HH24:MI:SS'),
           TO_TIMESTAMP('2026-05-18 22:00:00', 'YYYY-MM-DD HH24:MI:SS'),
           'COMPLETED'
       );

-- 2. 이알바의 예정된 이번 주 마감 근무
INSERT INTO shift (id, store_id, user_id, work_date, start_at, end_at, status)
VALUES (
           'SHF_Lee_20260525_01',
           'V1StGXR8_Z5jdHi6B-myT',
           'U2xY8pQ3_a1BcDeFgH1j2',
           TO_DATE('2026-05-25', 'YYYY-MM-DD'),
           TO_TIMESTAMP('2026-05-25 18:00:00', 'YYYY-MM-DD HH24:MI:SS'),
           TO_TIMESTAMP('2026-05-25 22:00:00', 'YYYY-MM-DD HH24:MI:SS'),
           'SCHEDULED'
       );

-- 3. 박신입(U9L0mN1o...)의 예정된 이번 주 오전 근무
INSERT INTO shift (id, store_id, user_id, work_date, start_at, end_at, status)
VALUES (
           'SHF_Park_20260526_01',
           'V1StGXR8_Z5jdHi6B-myT',
           'U9L0mN1o_P2qR3sT4uV53',
           TO_DATE('2026-05-26', 'YYYY-MM-DD'),
           TO_TIMESTAMP('2026-05-26 10:00:00', 'YYYY-MM-DD HH24:MI:SS'),
           TO_TIMESTAMP('2026-05-26 15:00:00', 'YYYY-MM-DD HH24:MI:SS'),
           'SCHEDULED'
       );

-- 데이터 삽입 후 바로 전체 리스트 조회
SELECT * FROM shift ORDER BY work_date, start_at;