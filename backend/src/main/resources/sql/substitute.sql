create table substitute_post
(

    id                varchar2(21 char) primary key,

    shift_id          varchar2(21 char)
        references shift (id) on delete cascade,

    store_id          varchar2(21 char)
        references store (id) on delete cascade,

    requester_user_id varchar2(21 char)
        references users (id),

    reason            varchar2(500 char),

    status            varchar2(20 char),

    created_at        timestamp,

    closed_at         timestamp
);
create table substitute_application(

                                       id varchar2(21 char) primary key,

                                       substitute_post_id varchar2(21 char)
                                           references substitute_post(id) on delete cascade,

                                       applicant_user_id varchar2(21 char)
                                           references users(id),

                                       message varchar2(500 char),

                                       status varchar2(20 char),

                                       applied_at timestamp
);
create table substitute_history(

                                   id varchar2(21 char) primary key,

                                   shift_id varchar2(21 char),

                                   store_id varchar2(21 char),

                                   original_user_id varchar2(21 char),

                                   substitute_user_id varchar2(21 char),

                                   approved_by varchar2(21 char),

                                   approved_at timestamp
);
INSERT INTO substitute_post (
    id,
    shift_id,
    store_id,
    requester_user_id,
    reason,
    status,
    created_at,
    closed_at
) VALUES (
             'SP_00001',
             'SFT_1780385934502',
             'V1StGXR8_Z5jdHi6B-myT',
             'U2xY8pQ3_a1BcDeFgH1j2',
             '개인 사정으로 오늘 14~18시 타임 대타 구합니다',
             'OPEN',
             SYSTIMESTAMP,
             NULL
         );
INSERT INTO substitute_post (
    id,
    shift_id,
    store_id,
    requester_user_id,
    reason,
    status,
    created_at,
    closed_at
) VALUES (
             'SP_00002',
             'SFT_1780385934502',
             'V1StGXR8_Z5jdHi6B-myT',
             'U9L0mN1o_P2qR3sT4uV53',
             '6/2 근무 갑작스러운 일정으로 대타 요청드립니다',
             'OPEN',
             SYSTIMESTAMP,
             NULL
         );
INSERT INTO substitute_post (
    id,
    shift_id,
    store_id,
    requester_user_id,
    reason,
    status,
    created_at,
    closed_at
) VALUES (
             'SP_00003',
             'SFT_1780385934502',
             'V1StGXR8_Z5jdHi6B-myT',
             'U2xY8pQ3_a1BcDeFgH1j2',
             '피크타임이라 경험 있는 분 우대합니다',
             'CLOSED',
             TO_TIMESTAMP('2026-06-01 09:30:00.000000', 'YYYY-MM-DD HH24:MI:SS.FF6'),
             TO_TIMESTAMP('2026-06-02 18:30:00.000000', 'YYYY-MM-DD HH24:MI:SS.FF6')
         );
INSERT INTO substitute_post (
    id,
    shift_id,
    store_id,
    requester_user_id,
    reason,
    status,
    created_at,
    closed_at
) VALUES (
             'SP_00004',
             'SFT_1780385934502',
             'V1StGXR8_Z5jdHi6B-myT',
             'U9L0mN1o_P2qR3sT4uV53',
             '급하게 대타 필요합니다. 빠르게 연락 주세요',
             'OPEN',
             SYSTIMESTAMP,
             NULL
         );
select * from substitute_post