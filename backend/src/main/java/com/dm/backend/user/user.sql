create table users (
    id varchar2(20 char) primary key,
    username varchar2(20 char) not null,
    password varchar2(20 char) not null,
    name varchar2(20 char) not null,
    phone varchar2(20 char) not null unique,
    role varchar2(20 char) not null,
    status varchar2(20 char) not null,
    created_at timestamp not null
);
-- 1. 관리자 계정
INSERT INTO users (id, username, password, name, phone, role, status, created_at)
VALUES ('admin', 'admin_nick', 'admin1234!', '관리자', '010-0000-0000', 'ROLE_ADMIN', 'ACTIVE', SYSTIMESTAMP);

-- 2. 일반 유저 1
INSERT INTO users (id, username, password, name, phone, role, status, created_at)
VALUES ('user01', 'spring_master', 'pass1111', '김스프링', '010-1111-2222', 'ROLE_USER', 'ACTIVE', SYSTIMESTAMP);

-- 3. 일반 유저 2 (휴면 또는 정지 상태)
INSERT INTO users (id, username, password, name, phone, role, status, created_at)
VALUES ('user02', 'react_beginner', 'pass2222', '이리액트', '010-3333-4444', 'ROLE_USER', 'INACTIVE', SYSTIMESTAMP);

-- 4. 일반 유저 3
INSERT INTO users (id, username, password, name, phone, role, status, created_at)
VALUES ('test_dev', 'oracle_jjang', 'pass3333', '박오라클', '010-5555-6666', 'ROLE_USER', 'ACTIVE', SYSTIMESTAMP);

select * from users;