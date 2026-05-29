CREATE TABLE SUBSTITUTE_APPLY (
                                  id VARCHAR2(21 char) PRIMARY KEY,
                                  substitute_request_id VARCHAR2(21 char) REFERENCES SUBSTITUTE_REQUEST(id) ON DELETE CASCADE,
                                  applicant_user_id VARCHAR2(21 char) REFERENCES USERS(id) ON DELETE CASCADE,
                                  status VARCHAR2(20 char) NOT NULL,
                                  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO substitute_apply VALUES ('SA_Park_20260525', 'SR_Lee_20260525', 'U9L0mN1o_P2qR3sT4uV53', 'APPLIED', CURRENT_TIMESTAMP);

select * from substitute_apply;
