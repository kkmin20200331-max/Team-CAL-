package com.dm.backend.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserLanguageMapper {

    @Select("""
        SELECT LANGUAGE
        FROM USER_LANGUAGE
        WHERE TRIM(USER_ID) = TRIM(#{user_id})
    """)
    String getLanguage(
            @Param("user_id") String user_id
    );

    @Insert("""
        MERGE INTO USER_LANGUAGE target
        USING (
            SELECT
                #{user_id} AS USER_ID,
                #{language} AS LANGUAGE
            FROM DUAL
        ) source
        ON (TRIM(target.USER_ID) = TRIM(source.USER_ID))
        WHEN MATCHED THEN
            UPDATE SET
                target.LANGUAGE = source.LANGUAGE,
                target.UPDATED_AT = SYSTIMESTAMP
        WHEN NOT MATCHED THEN
            INSERT (USER_ID, LANGUAGE, UPDATED_AT)
            VALUES (source.USER_ID, source.LANGUAGE, SYSTIMESTAMP)
    """)
    void upsertLanguage(
            @Param("user_id") String user_id,
            @Param("language") String language
    );
}
