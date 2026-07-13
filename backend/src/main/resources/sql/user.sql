create table users (
   id         varchar2(21 char) primary key,
   username   varchar2(40 char) not null,
   password   varchar2(20 char) not null,
   name       varchar2(20 char) not null,
   phone      varchar2(20 char) not null unique,
   role       varchar2(20 char) not null,
   status     varchar2(20 char) not null,
   profile_image VARCHAR2(500 CHAR),
   created_at timestamp default current_timestamp
);
-- 1. 매장 관리자 (점주)
insert into users (
   id,
   username,
   password,
   name,
   phone,
   role,
   status
) values ( 'U1StGXR8_Z5jdHi6B-my1',
           'admin01',
           'hash_pw_admin_123',
           '김점주',
           '010-1111-2222',
           'ADMIN',
           'ACTIVE' );

-- 2. 일반 직원 (승인 완료)
insert into users (
   id,
   username,
   password,
   name,
   phone,
   role,
   status
) values ( 'U2xY8pQ3_a1BcDeFgH1j2',
           'staff_lee',
           'hash_pw_staff_123',
           '이알바',
           '010-3333-4444',
           'STAFF',
           'ACTIVE' );

-- 3. 신입 직원 (승인 완료)
insert into users (
   id,
   username,
   password,
   name,
   phone,
   role,
   status
) values ( 'U9L0mN1o_P2qR3sT4uV53',
           'staff_park',
           'hash_pw_park_123',
           '박신입',
           '010-5555-6666',
           'STAFF',
           'ACTIVE' );

-- 4. 방금 앱으로 가입한 대기자 (승인 대기 중)
insert into users (
   id,
   username,
   password,
   name,
   phone,
   role,
   status
) values ( 'U7yZ8aB9_c0DeF1gH2iJ4',
           'guest_choi',
           'hash_pw_guest_123',
           '최대기',
           '010-7777-8888',
           'GUEST',
           'PENDING' );


select * from users;

DELETE FROM users WHERE name = 'testsmsm';

DELETE FROM users WHERE username = '1234';

DELETE FROM users WHERE username = 'gg';

COMMIT;

MERGE INTO PEOPLE_LOG target
USING (
    SELECT
        'ST_704c5c4aba8243eca6' AS STORE_ID,
        'CAM-AI-001' AS CAMERA_ID,
        TO_TIMESTAMP('2026-07-13 09:00:00', 'YYYY-MM-DD HH24:MI:SS')
            + NUMTODSINTERVAL(TRUNC((LEVEL - 1) / 12), 'DAY')
            + NUMTODSINTERVAL(MOD(LEVEL - 1, 12), 'HOUR') AS RECORD_TIME,
        (
            CASE TRUNC((LEVEL - 1) / 12)
                WHEN 0 THEN 12  -- 7/13
                WHEN 1 THEN 16  -- 7/14
                WHEN 2 THEN 20  -- 7/15
                END
                +
            CASE
                WHEN 9 + MOD(LEVEL - 1, 12) BETWEEN 11 AND 13 THEN 12
                WHEN 9 + MOD(LEVEL - 1, 12) BETWEEN 18 AND 20 THEN 18
                WHEN 9 + MOD(LEVEL - 1, 12) BETWEEN 14 AND 17 THEN 8
                ELSE 3
                END
                + MOD(LEVEL, 4)
            ) AS PEOPLE_COUNT
    FROM DUAL
    CONNECT BY LEVEL <= 36
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
    VALUES (
               source.STORE_ID,
               source.CAMERA_ID,
               source.RECORD_TIME,
               source.PEOPLE_COUNT
           );

COMMIT;

SELECT STORE_ID, CAMERA_ID, RECORD_TIME, PEOPLE_COUNT
FROM PEOPLE_LOG
WHERE STORE_ID = 'ST_704c5c4aba8243eca6'
  AND RECORD_TIME BETWEEN
    TO_TIMESTAMP('2026-07-13 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    AND
    TO_TIMESTAMP('2026-07-15 23:59:59', 'YYYY-MM-DD HH24:MI:SS')
ORDER BY RECORD_TIME;