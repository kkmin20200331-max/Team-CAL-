create table store(
    id varchar2(21 char) primary key,
    name varchar2(30 char) not null,
    address varchar(255) not null,
    capacity number(5) default 0,
    open_time varchar2(5 char) not null,
    close_time varchar2(5 char) not null
);
-- 1. 일반 카페 (수용 인원 50명)
INSERT INTO store (id, name, address, capacity, open_time, close_time)
VALUES ('V1StGXR8_Z5jdHi6B-myT', '시프트 커피 강남점', '서울시 강남구 테헤란로 123', 50, '08:00', '22:00');

-- 2. 대형 라운지 매장 (수용 인원 120명)
INSERT INTO store (id, name, address, capacity, open_time, close_time)
VALUES ('N2xY8pQ3_a1BcDeFgH1jK', '도쿄 랩스 라운지', '도쿄도 미나토구 롯폰기 1-2-3', 120, '09:00', '23:00');

-- 3. 소규모 베이커리 (수용 인원 30명)
INSERT INTO store (id, name, address, capacity, open_time, close_time)
VALUES ('k9L0mN1o_P2qR3sT4uV5w', '나이테이 베이커리', '서울시 마포구 홍익로 45', 30, '07:30', '21:00');

-- 4. 중형 음식점 (수용 인원 80명)
INSERT INTO store (id, name, address, capacity, open_time, close_time)
VALUES ('X7yZ8aB9_c0DeF1gH2iJ3', '신주쿠 우동 강남본점', '서울시 서초구 강남대로 456', 80, '11:00', '21:30');

select * from store;

ALTER TABLE STORE
    ADD TYPE VARCHAR2(20 CHAR);
UPDATE STORE
SET TYPE = 'CAFE'
WHERE ID = 'V1StGXR8_Z5jdHi6B-myT';

delete from STORE where name = '이치란라멘 텐진점';

commit;