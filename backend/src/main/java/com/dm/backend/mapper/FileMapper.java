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
            FILE_TYPE,
            ORIGINAL_NAME,
            STORAGE_PATH,
            FILE_SIZE,
            MIME_TYPE
        )
        VALUES
        (
            #{id},
            #{user_id},
            #{file_type},
            #{original_name},
            #{storage_path},
            #{file_size},
            #{mime_type}
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
            UPDATED_AT = SYSTIMESTAMP
        WHERE ID = #{id}
    """)
    int updateFile(FileVO file);

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