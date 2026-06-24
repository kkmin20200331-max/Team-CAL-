CREATE TABLE admin_application (
    id VARCHAR2(30) PRIMARY KEY,
    user_id VARCHAR2(21) NOT NULL,
    store_name VARCHAR2(100) NOT NULL,
    store_address VARCHAR2(255),
    store_type VARCHAR2(50),
    capacity NUMBER(5) DEFAULT 0,
    open_time VARCHAR2(5),
    close_time VARCHAR2(5),
    business_number VARCHAR2(50),
    business_license_file_id VARCHAR2(30),
    status VARCHAR2(20) DEFAULT 'PENDING' NOT NULL,
    reject_reason VARCHAR2(500),
    created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR2(21)
);

INSERT INTO users (
    id, username, password, name, phone, role, status
) VALUES (
    'MASTER_001',
    'master',
    '1234',
    '시스템 관리자',
    '010-0000-0000',
    'MASTER',
    'ACTIVE'
);
