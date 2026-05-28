CREATE TABLE NOTICE (
                        id VARCHAR2(21 char) PRIMARY KEY,
                        store_id VARCHAR2(21 char) REFERENCES STORE(id) ON DELETE CASCADE,
                        writer_id VARCHAR2(21 char) REFERENCES USERS(id) ON DELETE CASCADE,
                        title VARCHAR2(200) NOT NULL,
                        content CLOB,
                        tag VARCHAR2(50 char),
                        is_urgent CHAR(1) DEFAULT 'N' CHECK (UPPER(is_urgent) IN ('Y', 'N')),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO notice VALUES ('NTC_20260522_01', 'V1StGXR8_Z5jdHi6B-myT', 'U1StGXR8_Z5jdHi6B-my1', '주말 대청소', '포스기 청소', 'CLEANING', 'Y', CURRENT_TIMESTAMP);
select * from notice;