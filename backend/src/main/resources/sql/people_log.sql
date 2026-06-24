CREATE TABLE PEOPLE_LOG (
                            ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                            STORE_ID VARCHAR2(50) NOT NULL,
                            RECORD_TIME TIMESTAMP NOT NULL,
                            PEOPLE_COUNT NUMBER NOT NULL
);

CREATE INDEX IDX_PEOPLE_LOG_01
    ON PEOPLE_LOG(STORE_ID, RECORD_TIME);

INSERT INTO PEOPLE_LOG (STORE_ID, RECORD_TIME, PEOPLE_COUNT)
SELECT
    'STORE001',
    TO_TIMESTAMP('2026-06-01 00:00:00', 'YYYY-MM-DD HH24:MI:SS')
        + NUMTODSINTERVAL((LEVEL - 1) * 10, 'MINUTE'),
    TRUNC(DBMS_RANDOM.VALUE(1, 35))
FROM DUAL
    CONNECT BY LEVEL <= 144;

ALTER TABLE PEOPLE_LOG
    ADD CAMERA_ID VARCHAR2(50);
UPDATE PEOPLE_LOG
SET CAMERA_ID = 'CAM-001'
WHERE CAMERA_ID IS NULL;

COMMIT;
ALTER TABLE PEOPLE_LOG
    MODIFY CAMERA_ID VARCHAR2(50) NOT NULL;
select * from people_log;



INSERT INTO PEOPLE_LOG (STORE_ID, CAMERA_ID, RECORD_TIME, PEOPLE_COUNT)
SELECT
    '1',
    'CAM-001',
    TO_TIMESTAMP('2026-06-15 09:00:00', 'YYYY-MM-DD HH24:MI:SS')
        + NUMTODSINTERVAL(LEVEL - 1, 'HOUR'),
    TRUNC(DBMS_RANDOM.VALUE(5, 35))
FROM DUAL
CONNECT BY LEVEL <= 12;

COMMIT;

-- Weekly visit-pattern sample data for store 1.
-- 2026-06-15 is Monday. Creates hourly rows from 09:00 to 20:00 for 7 days.
MERGE INTO PEOPLE_LOG target
USING (
    SELECT
        '1' AS STORE_ID,
        'CAM-001' AS CAMERA_ID,
        TO_TIMESTAMP('2026-06-15 09:00:00', 'YYYY-MM-DD HH24:MI:SS')
            + NUMTODSINTERVAL(TRUNC((LEVEL - 1) / 12), 'DAY')
            + NUMTODSINTERVAL(MOD(LEVEL - 1, 12), 'HOUR') AS RECORD_TIME,
        (
            CASE TRUNC((LEVEL - 1) / 12)
                WHEN 0 THEN 8   -- Monday
                WHEN 1 THEN 10  -- Tuesday
                WHEN 2 THEN 12  -- Wednesday
                WHEN 3 THEN 14  -- Thursday
                WHEN 4 THEN 20  -- Friday
                WHEN 5 THEN 26  -- Saturday
                ELSE 22         -- Sunday
            END
            +
            CASE
                WHEN 9 + MOD(LEVEL - 1, 12) BETWEEN 11 AND 13 THEN 10
                WHEN 9 + MOD(LEVEL - 1, 12) BETWEEN 18 AND 20 THEN 16
                WHEN 9 + MOD(LEVEL - 1, 12) BETWEEN 14 AND 17 THEN 6
                ELSE 2
            END
            + MOD(LEVEL, 5)
        ) AS PEOPLE_COUNT
    FROM DUAL
    CONNECT BY LEVEL <= 84
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



UPDATE users
SET role = 'STAFF'
WHERE role = 'GUEST';

COMMIT;