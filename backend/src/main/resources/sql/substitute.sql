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