CREATE TABLE CHECKLIST_RESULT (
                                  id VARCHAR2(21 char) PRIMARY KEY,
                                  shift_id VARCHAR2(21 char) REFERENCES SHIFT(id) ON DELETE CASCADE,
                                  template_id VARCHAR2(21 char) REFERENCES CHECKLIST_TEMPLATE(id) ON DELETE CASCADE,
                                  assigned_to VARCHAR2(21 char) REFERENCES USERS(id) ON DELETE CASCADE,
                                  is_completed CHAR(1) DEFAULT 'N' CHECK (upper(is_completed) IN ('Y', 'N')),
                                  completed_at TIMESTAMP
);
INSERT INTO checklist_result VALUES ('CR_Lee_20260518', 'SHF_Lee_20260518_01', 'CT_Closing_01', 'U2xY8pQ3_a1BcDeFgH1j2', 'Y', TO_TIMESTAMP('2026-05-18 22:15:00', 'YYYY-MM-DD HH24:MI:SS'));
select * from checklist_result;
