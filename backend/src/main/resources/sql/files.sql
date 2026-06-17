CREATE TABLE FILES (
                       ID              VARCHAR2(21 CHAR) PRIMARY KEY,

                       USER_ID         VARCHAR2(21 CHAR)
        REFERENCES USERS(ID),

                       FILE_TYPE       VARCHAR2(30 CHAR) NOT NULL,

                       ORIGINAL_NAME   VARCHAR2(255 CHAR),

                       STORAGE_PATH    VARCHAR2(500 CHAR) NOT NULL,

                       FILE_SIZE       NUMBER,


                       MIME_TYPE       VARCHAR2(100 CHAR),

                       CREATED_AT      TIMESTAMP DEFAULT SYSTIMESTAMP,
                       UPDATED_AT      TIMESTAMP
);