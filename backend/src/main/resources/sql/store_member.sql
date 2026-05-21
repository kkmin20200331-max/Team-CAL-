create table store_member(
    id varchar2(21 char) primary key,
    store_id varchar2(21 char) references store(id) on delete cascade,
    user_id varchar2(21 char) references users(id) on delete cascade,
    member_role varchar2(20 char) not null,
    user_level varchar2(20 char) not null,
    approval_status varchar2(20 char) not null,
    joined_at timestamp default current_timestamp
);
-- 1. 김점주(U1StGXR8_Z5jdHi6B-my1)를 시프트 커피 강남점(V1StGXR8_Z5jdHi6B-myT)의 점주(ADMIN)로 연결 (승인 완료)
INSERT INTO store_member (id, store_id, user_id, member_role, user_level, approval_status)
VALUES ('M_001_강남커피_김점주', 'V1StGXR8_Z5jdHi6B-myT', 'U1StGXR8_Z5jdHi6B-my1', 'ADMIN', 'MANAGER', 'APPROVED');

-- 2. 이알바(U2xY8pQ3_a1BcDeFgH1j2)를 시프트 커피 강남점(V1StGXR8_Z5jdHi6B-myT)의 일반 직원(STAFF)이자 마감 가능자(CLOSER)로 연결 (승인 완료)
INSERT INTO store_member (id, store_id, user_id, member_role, user_level, approval_status)
VALUES ('M_002_강남커피_이알바', 'V1StGXR8_Z5jdHi6B-myT', 'U2xY8pQ3_a1BcDeFgH1j2', 'STAFF', 'CLOSER', 'APPROVED');

-- 3. 박신입(U9L0mN1o_P2qR3sT4uV53)을 시프트 커피 강남점(V1StGXR8_Z5jdHi6B-myT)의 일반 직원(STAFF)이자 일반 숙련도(REGULAR)로 연결 (승인 완료)
INSERT INTO store_member (id, store_id, user_id, member_role, user_level, approval_status)
VALUES ('M_003_강남커피_박신입', 'V1StGXR8_Z5jdHi6B-myT', 'U9L0mN1o_P2qR3sT4uV53', 'STAFF', 'REGULAR', 'APPROVED');

-- 4. 최대기(U7yZ8aB9_c0DeF1gH2iJ4)가 도쿄 랩스 라운지(N2xY8pQ3_a1BcDeFgH1jK)에 보낸 가입 신청 정보 (신입 등급, 승인 대기 중)
INSERT INTO store_member (id, store_id, user_id, member_role, user_level, approval_status)
VALUES ('M_004_도쿄라운지_최대기', 'N2xY8pQ3_a1BcDeFgH1jK', 'U7yZ8aB9_c0DeF1gH2iJ4', 'STAFF', 'NEWBIE', 'PENDING');

select * from store_member;