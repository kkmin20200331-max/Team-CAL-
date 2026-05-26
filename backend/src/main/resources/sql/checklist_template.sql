CREATE TABLE CHECKLIST_TEMPLATE (
                                    id VARCHAR2(21 char) PRIMARY KEY,
                                    store_id VARCHAR2(21 char) REFERENCES STORE(id) ON DELETE CASCADE,
                                    task_name VARCHAR2(100) NOT NULL,
                                    description VARCHAR2(255),
                                    active CHAR(1) DEFAULT 'Y' CHECK (active IN ('Y', 'N'))
);
INSERT INTO checklist_template VALUES ('CT_Closing_01', 'V1StGXR8_Z5jdHi6B-myT', '마감 정산', '시재 확인', 'Y');
select * from checklist_template;