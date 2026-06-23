package com.dm.backend;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AttendanceQrIntegrationTest {

    private static final String STORE_ID = "TST_QR_STORE_000001";
    private static final String USER_ID = "TST_QR_USER_0000001";
    private static final String MEMBER_ID = "TST_QR_MEM_00000001";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        cleanup();

        jdbcTemplate.update("""
                INSERT INTO STORE (
                    ID, NAME, ADDRESS, CAPACITY, OPEN_TIME, CLOSE_TIME
                )
                VALUES (
                    ?, 'QR 테스트 매장', '서울시 테스트로 1', 30, '09:00', '22:00'
                )
                """,
                STORE_ID
        );

        jdbcTemplate.update("""
                INSERT INTO USERS (
                    ID, USERNAME, PASSWORD, NAME, PHONE, ROLE, STATUS
                )
                VALUES (
                    ?, ?, ?, ?, ?, 'STAFF', 'ACTIVE'
                )
                """,
                USER_ID,
                "tstqr01",
                "1234",
                "QR테스트",
                "010-9000-0002"
        );

        jdbcTemplate.update("""
                INSERT INTO STORE_MEMBER (
                    ID, STORE_ID, USER_ID, MEMBER_ROLE, USER_LEVEL,
                    APPROVAL_STATUS, PAY_TYPE, PAY_AMOUNT
                )
                VALUES (
                    ?, ?, ?, 'STAFF', 'REGULAR', 'APPROVED', 'HOURLY', 10000
                )
                """,
                MEMBER_ID,
                STORE_ID,
                USER_ID
        );
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    @Test
    void qrCheckCreatesAttendance() throws Exception {
        String response =
                mockMvc.perform(post("/api/attendance/qr/" + STORE_ID))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.qr_token", notNullValue()))
                        .andReturn()
                        .getResponse()
                        .getContentAsString();

        String token =
                response.replaceAll(
                        ".*\\\"qr_token\\\"\\s*:\\s*\\\"([^\\\"]+)\\\".*",
                        "$1"
                );

        mockMvc.perform(post("/api/attendance/qr/check")
                        .contentType("application/json")
                        .content("""
                                {
                                  "qr_token": "%s",
                                  "user_id": "%s"
                                }
                                """.formatted(token, USER_ID)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.message").value("출근 처리 완료"));
    }

    private void cleanup() {
        jdbcTemplate.update("DELETE FROM ATTENDANCE WHERE USER_ID = ?", USER_ID);
        jdbcTemplate.update("DELETE FROM ATTENDANCE_QR WHERE STORE_ID = ?", STORE_ID);
        jdbcTemplate.update("DELETE FROM STORE_MEMBER WHERE ID = ?", MEMBER_ID);
        jdbcTemplate.update("DELETE FROM USERS WHERE ID = ?", USER_ID);
        jdbcTemplate.update("DELETE FROM STORE WHERE ID = ?", STORE_ID);
    }
}
