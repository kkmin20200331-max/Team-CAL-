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

-- AI schedule recommendation sample shifts.
-- Matches PEOPLE_LOG weekly sample dates: 2026-06-15(Mon) ~ 2026-06-21(Sun).
-- Store uses the real STORE PK, while PEOPLE_LOG sample uses STORE_ID = '1'.
MERGE INTO shift target
USING (
    SELECT
        'SHF_AI_' || TO_CHAR(work_day, 'YYYYMMDD') || '_01' AS id,
        'V1StGXR8_Z5jdHi6B-myT' AS store_id,
        'U2xY8pQ3_a1BcDeFgH1j2' AS user_id,
        TRUNC(work_day) AS work_date,
        work_day + NUMTODSINTERVAL(9, 'HOUR') AS start_at,
        work_day + NUMTODSINTERVAL(17, 'HOUR') AS end_at,
        'SCHEDULED' AS status
    FROM (
        SELECT DATE '2026-06-15' + LEVEL - 1 AS work_day
        FROM DUAL
        CONNECT BY LEVEL <= 7
    )
    UNION ALL
    SELECT
        'SHF_AI_' || TO_CHAR(work_day, 'YYYYMMDD') || '_02' AS id,
        'V1StGXR8_Z5jdHi6B-myT' AS store_id,
        'U9L0mN1o_P2qR3sT4uV53' AS user_id,
        TRUNC(work_day) AS work_date,
        work_day + NUMTODSINTERVAL(11, 'HOUR') AS start_at,
        work_day + NUMTODSINTERVAL(15, 'HOUR') AS end_at,
        'SCHEDULED' AS status
    FROM (
        SELECT DATE '2026-06-15' + LEVEL - 1 AS work_day
        FROM DUAL
        CONNECT BY LEVEL <= 7
    )
    UNION ALL
    SELECT
        'SHF_AI_' || TO_CHAR(work_day, 'YYYYMMDD') || '_03' AS id,
        'V1StGXR8_Z5jdHi6B-myT' AS store_id,
        'U9L0mN1o_P2qR3sT4uV53' AS user_id,
        TRUNC(work_day) AS work_date,
        work_day + NUMTODSINTERVAL(18, 'HOUR') AS start_at,
        work_day + NUMTODSINTERVAL(20, 'HOUR') AS end_at,
        'SCHEDULED' AS status
    FROM (
        SELECT DATE '2026-06-15' + LEVEL - 1 AS work_day
        FROM DUAL
        CONNECT BY LEVEL <= 7
    )
    WHERE TO_CHAR(work_day, 'DY', 'NLS_DATE_LANGUAGE=ENGLISH') IN ('SAT', 'SUN')
) source
ON (target.id = source.id)
WHEN MATCHED THEN
    UPDATE SET
        target.store_id = source.store_id,
        target.user_id = source.user_id,
        target.work_date = source.work_date,
        target.start_at = source.start_at,
        target.end_at = source.end_at,
        target.status = source.status
WHEN NOT MATCHED THEN
    INSERT (id, store_id, user_id, work_date, start_at, end_at, status)
    VALUES (source.id, source.store_id, source.user_id, source.work_date, source.start_at, source.end_at, source.status);

COMMIT;
