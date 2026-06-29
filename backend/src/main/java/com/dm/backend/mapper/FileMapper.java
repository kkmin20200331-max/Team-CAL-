package com.dm.backend.mapper;

import com.dm.backend.vo.FileVO;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface FileMapper {

    // =========================
    // [공통]
    // =========================

    @Insert("""
        INSERT INTO FILES
        (
            ID,
            USER_ID,
            STORE_ID,
            FILE_TYPE,
            ORIGINAL_NAME,
            STORAGE_PATH,
            FILE_SIZE,
            MIME_TYPE,
            STATUS,
            OCR_STATUS,
            EXPIRY_DATE,
            NOTES,
            EXTRACTED_DATA
        )
        VALUES
        (
            #{id},
            #{user_id},
            #{store_id},
            #{file_type},
            #{original_name},
            #{storage_path},
            #{file_size},
            #{mime_type},
            NVL(#{status}, 'PENDING'),
            NVL(#{ocr_status}, 'PENDING'),
            #{expiry_date,jdbcType=DATE},
            #{notes,jdbcType=VARCHAR},
            #{extracted_data,jdbcType=CLOB}
        )
    """)
    int insertFile(FileVO file);

    @Update("""
        UPDATE FILES
        SET
            ORIGINAL_NAME = #{original_name},
            STORAGE_PATH = #{storage_path},
            FILE_SIZE = #{file_size},
            MIME_TYPE = #{mime_type},
            STATUS = #{status},
            OCR_STATUS = #{ocr_status},
            EXPIRY_DATE = #{expiry_date,jdbcType=DATE},
            NOTES = #{notes,jdbcType=VARCHAR},
            EXTRACTED_DATA = #{extracted_data,jdbcType=CLOB},
            UPDATED_AT = SYSTIMESTAMP
        WHERE ID = #{id}
    """)
    int updateFile(FileVO file);

    @Update("""
        UPDATE FILES
        SET
            STATUS = #{status},
            UPDATED_AT = SYSTIMESTAMP
        WHERE ID = #{id}
    """)
    int updateFileStatus(
            @Param("id") String id,
            @Param("status") String status
    );

    @Update("""
        UPDATE FILES
        SET
            OCR_STATUS = #{ocr_status},
            STATUS = NVL(#{status}, STATUS),
            EXPIRY_DATE = #{expiry_date,jdbcType=DATE},
            NOTES = #{notes,jdbcType=VARCHAR},
            EXTRACTED_DATA = #{extracted_data,jdbcType=CLOB},
            UPDATED_AT = SYSTIMESTAMP
        WHERE ID = #{id}
    """)
    int updateOcrResult(FileVO file);

    @Delete("""
        DELETE FROM FILES
        WHERE ID = #{id}
    """)
    int deleteFile(String id);

    @Select("""
        SELECT *
        FROM FILES
        WHERE ID = #{id}
    """)
    FileVO selectFileById(String id);

    @Select("""
        SELECT *
        FROM FILES
        WHERE USER_ID = #{user_id}
        ORDER BY CREATED_AT DESC
    """)
    List<FileVO> selectFilesByUserId(String user_id);

    // =========================
    // [매장 전체 파일 조회]
    // =========================

    @Select("""
        SELECT f.*, u.NAME AS USER_NAME
        FROM FILES f
        JOIN USERS u ON f.USER_ID = u.ID
        WHERE f.STORE_ID = #{store_id}
        ORDER BY f.CREATED_AT DESC
    """)
    List<FileVO> selectFilesByStoreId(String store_id);

    // =========================
    // [근로계약서]
    // =========================

    @Select("""
        SELECT *
        FROM FILES
        WHERE USER_ID = #{user_id}
          AND FILE_TYPE = 'CONTRACT'
        ORDER BY CREATED_AT DESC
    """)
    List<FileVO> selectContractsByUserId(String user_id);

    // =========================
    // [보건증]
    // =========================

    @Select("""
        SELECT *
        FROM FILES
        WHERE USER_ID = #{user_id}
          AND FILE_TYPE = 'HEALTH_CERT'
        ORDER BY CREATED_AT DESC
    """)
    List<FileVO> selectHealthCertsByUserId(String user_id);
}
