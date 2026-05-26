CREATE TABLE RISK_ALERT (
                            id VARCHAR2(21 char) PRIMARY KEY,
                            store_id VARCHAR2(21 char) REFERENCES STORE(id) ON DELETE CASCADE,
                            shift_id VARCHAR2(21 char) REFERENCES SHIFT(id) ON DELETE CASCADE,
                            risk_type VARCHAR2(50 char),
                            message VARCHAR2(255),
                            severity VARCHAR2(20 char),
                            resolved CHAR(1) DEFAULT 'N' CHECK (resolved IN ('Y', 'N'))
);
INSERT INTO risk_alert VALUES ('RA_20260526_01', 'V1StGXR8_Z5jdHi6B-myT', 'SHF_Park_20260526_01', 'NEWBIE_ALONE', '신입 단독 근무', 'HIGH', 'N');
select * from RISK_ALERT;