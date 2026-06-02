CREATE TABLE board (
                       id VARCHAR2(30) PRIMARY KEY,

                       store_id VARCHAR2(30) NOT NULL,

                       name VARCHAR2(100) NOT NULL,

                       created_by VARCHAR2(30) NOT NULL,

                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE board_post (
                            id VARCHAR2(30) PRIMARY KEY,

                            board_id VARCHAR2(30) NOT NULL,
                            store_id VARCHAR2(30) NOT NULL,

                            writer_id VARCHAR2(30) NOT NULL,

                            title VARCHAR2(200) NOT NULL,
                            content CLOB,

                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE board
    ADD CONSTRAINT fk_board_store
        FOREIGN KEY (store_id)
            REFERENCES store(id);
ALTER TABLE board_post
    ADD CONSTRAINT fk_board_post_board
        FOREIGN KEY (board_id)
            REFERENCES board(id);
ALTER TABLE board_post
    ADD CONSTRAINT fk_board_post_store
        FOREIGN KEY (store_id)
            REFERENCES store(id);
ALTER TABLE board_post
    ADD CONSTRAINT fk_board_post_user
        FOREIGN KEY (writer_id)
            REFERENCES users(id);
INSERT INTO board
(id, store_id, name, created_by)
VALUES
    ('BRD_001', 'V1StGXR8_Z5jdHi6B-myT', '공지사항', 'USR_ADMIN');

INSERT INTO board
(id, store_id, name, created_by)
VALUES
    ('BRD_002', 'V1StGXR8_Z5jdHi6B-myT', '메뉴얼', 'USR_ADMIN');

INSERT INTO board
(id, store_id, name, created_by)
VALUES
    ('BRD_003', 'V1StGXR8_Z5jdHi6B-myT', '분실물 관리', 'USR_ADMIN');

INSERT INTO board
(id, store_id, name, created_by)
VALUES
    ('BRD_004', 'V1StGXR8_Z5jdHi6B-myT', '프로모션/이벤트', 'USR_ADMIN');

INSERT INTO board
(id, store_id, name, created_by)
VALUES
    ('BRD_005', 'V1StGXR8_Z5jdHi6B-myT', '체크리스트', 'USR_ADMIN');
INSERT INTO board_post
(id, board_id, store_id, writer_id, title, content)
VALUES
    (
        'POST_001',
        'BRD_001',
        'V1StGXR8_Z5jdHi6B-myT',
        'U1StGXR8_Z5jdHi6B-my1',
        '6월 근무표 공지',
        '6월 근무표가 등록되었습니다.'
    );
INSERT INTO board_post
(id, board_id, store_id, writer_id, title, content)
VALUES
    (
        'POST_002',
        'BRD_001',
        'V1StGXR8_Z5jdHi6B-myT',
        'U1StGXR8_Z5jdHi6B-my1',
        '유니폼 착용 안내',
        '근무 시 유니폼을 착용해주세요.'
    );
INSERT INTO board_post
(id, board_id, store_id, writer_id, title, content)
VALUES
    (
        'POST_003',
        'BRD_002',
        'V1StGXR8_Z5jdHi6B-myT',
        'U1StGXR8_Z5jdHi6B-my1',
        'POS 사용법',
        'POS 로그인 후 판매 메뉴를 이용하세요.'
    );
INSERT INTO board_post
(id, board_id, store_id, writer_id, title, content)
VALUES
    (
        'POST_004',
        'BRD_003',
        'V1StGXR8_Z5jdHi6B-myT',
        'U1StGXR8_Z5jdHi6B-my1',
        '검정색 지갑 습득',
        '카운터 앞에서 습득했습니다.'
    );
INSERT INTO board_post
(id, board_id, store_id, writer_id, title, content)
VALUES
    (
        'POST_005',
        'BRD_004',
        'V1StGXR8_Z5jdHi6B-myT',
        'U1StGXR8_Z5jdHi6B-my1',
        '여름 음료 할인 이벤트',
        '6월 한달간 20% 할인 진행합니다.'
    );
INSERT INTO board_post
(id, board_id, store_id, writer_id, title, content)
VALUES
    (
        'POST_006',
        'BRD_005',
        'V1StGXR8_Z5jdHi6B-myT',
        'U1StGXR8_Z5jdHi6B-my1',
        '오픈 체크리스트',
        '□ 출입문 개방
        □ POS 로그인
        □ 냉장고 점검
        □ 재고 확인'
    );
select * from board;
select * from board_post;