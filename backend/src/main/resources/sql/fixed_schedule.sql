create table fixed_schedule(
    id varchar2(21 char) primary key,
    store_id varchar2(21 char) references store(id) on delete cascade,
    user_id varchar2(21 char) references users(id) on delete cascade,
    weekday varchar2(10 char) not null,
    start_time varchar2(5 char) not null,
    end_time varchar2(5 char) not null,
    active CHAR(1) DEFAULT 'Y' CHECK (UPPER(active) IN ('Y', 'N'))
);
-- 1. 이알바(U2xY8pQ3...)의 강남점 월요일 마감 근무 (정상적인 대문자 'Y' 입력)
INSERT INTO fixed_schedule (id, store_id, user_id, weekday, start_time, end_time, active)
VALUES ('FS_NanoID_Lee_Mon01', 'V1StGXR8_Z5jdHi6B-myT', 'U2xY8pQ3_a1BcDeFgH1j2', 'MON', '18:00', '22:00', 'Y');

-- 2. 이알바의 강남점 수요일 마감 근무 (소문자 'y' 입력 테스트 -> UPPER 조건 덕분에 통과됨!)
INSERT INTO fixed_schedule (id, store_id, user_id, weekday, start_time, end_time, active)
VALUES ('FS_NanoID_Lee_Wed02', 'V1StGXR8_Z5jdHi6B-myT', 'U2xY8pQ3_a1BcDeFgH1j2', 'WED', '18:00', '22:00', 'y');

-- 3. 박신입(U9L0mN1o...)의 강남점 화요일 오전 근무 (active 값 아예 생략 -> DEFAULT 'Y'가 자동으로 들어감)
INSERT INTO fixed_schedule (id, store_id, user_id, weekday, start_time, end_time)
VALUES ('FS_NanoID_Park_Tue1', 'V1StGXR8_Z5jdHi6B-myT', 'U9L0mN1o_P2qR3sT4uV53', 'TUE', '10:00', '15:00');

-- 4. 박신입의 강남점 목요일 오전 근무 (예전엔 했지만 지금은 비활성화 상태인 'N' 입력)
INSERT INTO fixed_schedule (id, store_id, user_id, weekday, start_time, end_time, active)
VALUES ('FS_NanoID_Park_Thu2', 'V1StGXR8_Z5jdHi6B-myT', 'U9L0mN1o_P2qR3sT4uV53', 'THU', '10:00', '15:00', 'N');

select * from fixed_schedule;

MERGE INTO PEOPLE_LOG target
USING (
    SELECT
        '1' AS STORE_ID,
        'CAM-001' AS CAMERA_ID,
        TRUNC(SYSDATE)
            + NUMTODSINTERVAL(8 + LEVEL - 1, 'HOUR') AS RECORD_TIME,
        CASE 8 + LEVEL - 1
            WHEN 8 THEN 3
            WHEN 9 THEN 8
            WHEN 10 THEN 14
            WHEN 11 THEN 22
            WHEN 12 THEN 34
            WHEN 13 THEN 30
            WHEN 14 THEN 18
            WHEN 15 THEN 16
            WHEN 16 THEN 20
            WHEN 17 THEN 28
            WHEN 18 THEN 42
            WHEN 19 THEN 55
            WHEN 20 THEN 38
            WHEN 21 THEN 22
            WHEN 22 THEN 10
            ELSE 5
            END AS PEOPLE_COUNT
    FROM DUAL
    CONNECT BY LEVEL <= 15
) source
ON (
    target.STORE_ID = source.STORE_ID
        AND target.CAMERA_ID = source.CAMERA_ID
        AND target.RECORD_TIME = source.RECORD_TIME
    )
WHEN MATCHED THEN
    UPDATE SET target.PEOPLE_COUNT = source.PEOPLE_COUNT
WHEN NOT MATCHED THEN
    INSERT (STORE_ID, CAMERA_ID, RECORD_TIME, PEOPLE_COUNT)
    VALUES (source.STORE_ID, source.CAMERA_ID, source.RECORD_TIME, source.PEOPLE_COUNT);

COMMIT;


SELECT
    STORE_ID,
    CAMERA_ID,
    TO_CHAR(RECORD_TIME, 'YYYY-MM-DD HH24:MI:SS') AS RECORD_TIME,
    PEOPLE_COUNT
FROM PEOPLE_LOG
WHERE STORE_ID = 'V1StGXR8_Z5jdHi6B-myT'
  AND RECORD_TIME >= TRUNC(SYSDATE)
  AND RECORD_TIME < TRUNC(SYSDATE) + 1
ORDER BY RECORD_TIME;