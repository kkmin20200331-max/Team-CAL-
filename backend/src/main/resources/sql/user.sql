create table users (
   id         varchar2(21 char) primary key,
   username   varchar2(40 char) not null,
   password   varchar2(20 char) not null,
   name       varchar2(20 char) not null,
   phone      varchar2(20 char) not null unique,
   role       varchar2(20 char) not null,
   status     varchar2(20 char) not null,
   profile_image VARCHAR2(500 CHAR),
   created_at timestamp default current_timestamp
);
-- 1. 매장 관리자 (점주)
insert into users (
   id,
   username,
   password,
   name,
   phone,
   role,
   status
) values ( 'U1StGXR8_Z5jdHi6B-my1',
           'admin01',
           'hash_pw_admin_123',
           '김점주',
           '010-1111-2222',
           'ADMIN',
           'ACTIVE' );

-- 2. 일반 직원 (승인 완료)
insert into users (
   id,
   username,
   password,
   name,
   phone,
   role,
   status
) values ( 'U2xY8pQ3_a1BcDeFgH1j2',
           'staff_lee',
           'hash_pw_staff_123',
           '이알바',
           '010-3333-4444',
           'STAFF',
           'ACTIVE' );

-- 3. 신입 직원 (승인 완료)
insert into users (
   id,
   username,
   password,
   name,
   phone,
   role,
   status
) values ( 'U9L0mN1o_P2qR3sT4uV53',
           'staff_park',
           'hash_pw_park_123',
           '박신입',
           '010-5555-6666',
           'STAFF',
           'ACTIVE' );

-- 4. 방금 앱으로 가입한 대기자 (승인 대기 중)
insert into users (
   id,
   username,
   password,
   name,
   phone,
   role,
   status
) values ( 'U7yZ8aB9_c0DeF1gH2iJ4',
           'guest_choi',
           'hash_pw_guest_123',
           '최대기',
           '010-7777-8888',
           'GUEST',
           'PENDING' );

select * from users;

DELETE FROM users WHERE name = 'adminsm';

DELETE FROM users WHERE username = '1234';

DELETE FROM users WHERE username = 'gg';

COMMIT;

UPDATE users SET password = '123' WHERE username = 'admin01';
