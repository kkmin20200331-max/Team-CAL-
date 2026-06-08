CREATE TABLE AI_ANALYSIS (

                             ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

                             STORE_ID VARCHAR2(50) NOT NULL,

                             ANALYSIS_TYPE VARCHAR2(30),

                             ANALYSIS_START_DATE DATE,

                             ANALYSIS_END_DATE DATE,

                             RESULT_JSON CLOB,

                             CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP

);