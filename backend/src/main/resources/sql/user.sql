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
    SELECT '1' AS STORE_ID, 'CAM-001' AS CAMERA_ID,
           TO_TIMESTAMP('2026-07-09 08:00:00', 'YYYY-MM-DD HH24:MI:SS') AS RECORD_TIME,
           4 AS PEOPLE_COUNT
    FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 09:00:00', 'YYYY-MM-DD HH24:MI:SS'), 8 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 10:00:00', 'YYYY-MM-DD HH24:MI:SS'), 14 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 11:00:00', 'YYYY-MM-DD HH24:MI:SS'), 22 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 12:00:00', 'YYYY-MM-DD HH24:MI:SS'), 38 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 13:00:00', 'YYYY-MM-DD HH24:MI:SS'), 42 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 14:00:00', 'YYYY-MM-DD HH24:MI:SS'), 29 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 15:00:00', 'YYYY-MM-DD HH24:MI:SS'), 24 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 16:00:00', 'YYYY-MM-DD HH24:MI:SS'), 31 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 17:00:00', 'YYYY-MM-DD HH24:MI:SS'), 45 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 18:00:00', 'YYYY-MM-DD HH24:MI:SS'), 63 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 19:00:00', 'YYYY-MM-DD HH24:MI:SS'), 71 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 20:00:00', 'YYYY-MM-DD HH24:MI:SS'), 54 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 21:00:00', 'YYYY-MM-DD HH24:MI:SS'), 28 FROM DUAL
    UNION ALL SELECT '1', 'CAM-001', TO_TIMESTAMP('2026-07-09 22:00:00', 'YYYY-MM-DD HH24:MI:SS'), 12 FROM DUAL
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

UPDATE users SET password = '123' WHERE username = 'admin01';

select id, original_name, storage_path
from files
where id in (
             'FILE_82c7f5854e274549',
             'FILE_412f1757c0844024',
             'FILE_9d3a8160af1b42cd'
    );

SELECT
    STORE_ID,
    CAMERA_ID,
    TO_CHAR(RECORD_TIME, 'YYYY-MM-DD HH24:MI:SS') AS RECORD_TIME,
    PEOPLE_COUNT
FROM PEOPLE_LOG
WHERE STORE_ID = '1'
  AND RECORD_TIME BETWEEN
    TO_TIMESTAMP('2026-07-09 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
    AND TO_TIMESTAMP('2026-07-09 23:59:59', 'YYYY-MM-DD HH24:MI:SS')
ORDER BY RECORD_TIME;