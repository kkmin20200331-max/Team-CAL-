CREATE TABLE BOARD_COMMENT (
                               ID VARCHAR2(21 CHAR) PRIMARY KEY,

                               POST_ID VARCHAR2(21 CHAR) NOT NULL
        REFERENCES BOARD_POST(ID) ON DELETE CASCADE,

                               STORE_ID VARCHAR2(21 CHAR) NOT NULL,
                               USER_ID VARCHAR2(21 CHAR) NOT NULL,

                               PARENT_ID VARCHAR2(21 CHAR), -- 대댓글용 (NULL이면 일반 댓글)

                               CONTENT VARCHAR2(1000 CHAR) NOT NULL,

                               STATUS VARCHAR2(20 CHAR) DEFAULT 'ACTIVE',

                               CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               UPDATED_AT TIMESTAMP
);

CREATE INDEX IDX_COMMENT_POST ON BOARD_COMMENT(POST_ID);
CREATE INDEX IDX_COMMENT_PARENT ON BOARD_COMMENT(PARENT_ID);
SELECT object_name, object_type
FROM user_objects
WHERE object_name = 'BOARD_COMMENT';