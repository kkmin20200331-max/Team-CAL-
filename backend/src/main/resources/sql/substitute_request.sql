CREATE TABLE SUBSTITUTE_REQUEST (
                                    id VARCHAR2(21 char) PRIMARY KEY,
                                    shift_id VARCHAR2(21 char) REFERENCES SHIFT(id) ON DELETE CASCADE,
                                    status VARCHAR2(20 char) NOT NULL,
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO substitute_request VALUES ('SR_Lee_20260525', 'SHF_Lee_20260525_01', 'OPEN', CURRENT_TIMESTAMP);
select * from substitute_request;