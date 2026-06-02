CREATE TABLE AI_ANALYSIS (
                             ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

                             STORE_ID VARCHAR2(50) NOT NULL,

                             ANALYSIS_TYPE VARCHAR2(30),

                             RESULT_JSON CLOB,

                             CREATED_AT TIMESTAMP DEFAULT SYSTIMESTAMP
);

INSERT INTO AI_ANALYSIS (
    STORE_ID,
    ANALYSIS_TYPE,
    RESULT_JSON
) VALUES (
             'STORE001',
             'DAILY',
             '{
                 "peakTime":"12:00~14:00",
                 "recommendedStaff":4,
                 "averagePeople":18,
                 "congestionLevel":"HIGH",
                 "summary":"점심시간 인원 집중으로 추가 인력 배치 필요"
             }'
         );

INSERT INTO AI_ANALYSIS (
    STORE_ID,
    ANALYSIS_TYPE,
    RESULT_JSON
) VALUES (
             'STORE001',
             'WEEKLY',
             '{
                 "peakTime":"11:30~13:30",
                 "recommendedStaff":5,
                 "averagePeople":21,
                 "congestionLevel":"HIGH",
                 "summary":"평일 점심 수요가 지속적으로 높음"
             }'
         );

INSERT INTO AI_ANALYSIS (
    STORE_ID,
    ANALYSIS_TYPE,
    RESULT_JSON
) VALUES (
             'STORE002',
             'DAILY',
             '{
                 "peakTime":"18:00~20:00",
                 "recommendedStaff":3,
                 "averagePeople":12,
                 "congestionLevel":"MEDIUM",
                 "summary":"퇴근 시간대 방문객 증가"
             }'
         );

INSERT INTO AI_ANALYSIS (
    STORE_ID,
    ANALYSIS_TYPE,
    RESULT_JSON
) VALUES (
             'STORE002',
             'WEEKLY',
             '{
                 "peakTime":"17:30~20:30",
                 "recommendedStaff":3,
                 "averagePeople":10,
                 "congestionLevel":"MEDIUM",
                 "summary":"저녁 시간대 중심 운영 권장"
             }'
         );

INSERT INTO AI_ANALYSIS (
    STORE_ID,
    ANALYSIS_TYPE,
    RESULT_JSON
) VALUES (
             'STORE003',
             'DAILY',
             '{
                 "peakTime":"14:00~16:00",
                 "recommendedStaff":2,
                 "averagePeople":6,
                 "congestionLevel":"LOW",
                 "summary":"한산한 매장으로 최소 인원 운영 가능"
             }'
         );

INSERT INTO AI_ANALYSIS (
    STORE_ID,
    ANALYSIS_TYPE,
    RESULT_JSON
) VALUES (
             'STORE003',
             'MONTHLY',
             '{
                 "peakTime":"13:00~15:00",
                 "recommendedStaff":2,
                 "averagePeople":7,
                 "congestionLevel":"LOW",
                 "summary":"운영시간 단축 검토 가능"
             }'
         );