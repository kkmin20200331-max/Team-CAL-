CREATE TABLE NOTICE_READ (
                             id VARCHAR2(21 char) PRIMARY KEY,
                             notice_id VARCHAR2(21 char) REFERENCES NOTICE(id) ON DELETE CASCADE,
                             user_id VARCHAR2(21 char) REFERENCES USERS(id) ON DELETE CASCADE,
                             read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO notice_read VALUES ('NR_Lee_20260522', 'NTC_20260522_01', 'U2xY8pQ3_a1BcDeFgH1j2', CURRENT_TIMESTAMP);
select * from notice_read;
