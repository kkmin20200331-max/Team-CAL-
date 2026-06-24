package com.dm.backend;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PayrollStoreIntegrationTest {

    private static final String STORE_ID = "V1StGXR8_Z5jdHi6B-myT";
    private static final String USER_ID = "TST_PAY_USER_000001";
    private static final String MEMBER_ID = "TST_PAY_MEM_000001";
    private static final String ATTENDANCE_ID = "TST_PAY_ATT_000001";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        cleanup();

        jdbcTemplate.update("""
                INSERT INTO USERS (
                    ID, USERNAME, PASSWORD, NAME, PHONE, ROLE, STATUS
                )
                VALUES (
                    ?, ?, ?, ?, ?, 'STAFF', 'ACTIVE'
                )
                """,
                USER_ID,
                "tstpay01",
                "1234",
                "급여테스트",
                "010-9000-0001"
        );

        jdbcTemplate.update("""
                INSERT INTO STORE_MEMBER (
                    ID, STORE_ID, USER_ID, MEMBER_ROLE, USER_LEVEL,
                    APPROVAL_STATUS, PAY_TYPE, PAY_AMOUNT
                )
                VALUES (
                    ?, ?, ?, 'STAFF', 'CLOSER', 'APPROVED', 'HOURLY', 10000
                )
                """,
                MEMBER_ID,
                STORE_ID,
                USER_ID
        );

        jdbcTemplate.update("""
                INSERT INTO ATTENDANCE (
                    ID, STORE_ID, USER_ID, WORK_DATE,
                    CHECK_IN_AT, CHECK_OUT_AT, WORK_MINUTES,
                    OVERTIME_MINUTES, STATUS
                )
                VALUES (
                    ?, ?, ?, DATE '2026-06-22',
                    TIMESTAMP '2026-06-22 18:00:00',
                    TIMESTAMP '2026-06-23 04:00:00',
                    600, 120, 'CHECKED_OUT'
                )
                """,
                ATTENDANCE_ID,
                STORE_ID,
                USER_ID
        );
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    @Test
    void getStorePayrollCalculatesPayFromAttendance() throws Exception {
        mockMvc.perform(get("/api/payroll/store")
                        .param("store_id", STORE_ID)
                        .param("year_month", "2026-06"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].employeeId", hasItem(USER_ID)))
                .andExpect(jsonPath("$[?(@.employeeId == '" + USER_ID + "')].regularHours").value(hasItem(10.0)))
                .andExpect(jsonPath("$[?(@.employeeId == '" + USER_ID + "')].overtimeHours").value(hasItem(2.0)))
                .andExpect(jsonPath("$[?(@.employeeId == '" + USER_ID + "')].holidayHours").value(hasItem(6.0)))
                .andExpect(jsonPath("$[?(@.employeeId == '" + USER_ID + "')].basePay").value(hasItem(100000.0)))
                .andExpect(jsonPath("$[?(@.employeeId == '" + USER_ID + "')].overtimePay").value(hasItem(10000.0)))
                .andExpect(jsonPath("$[?(@.employeeId == '" + USER_ID + "')].holidayPay").value(hasItem(30000.0)))
                .andExpect(jsonPath("$[?(@.employeeId == '" + USER_ID + "')].totalPay").value(hasItem(140000.0)))
                .andExpect(jsonPath("$[?(@.employeeId == '" + USER_ID + "')].status").value(hasItem("approved")));
    }

    private void cleanup() {
        jdbcTemplate.update("DELETE FROM ATTENDANCE WHERE ID = ?", ATTENDANCE_ID);
        jdbcTemplate.update("DELETE FROM STORE_MEMBER WHERE ID = ?", MEMBER_ID);
        jdbcTemplate.update("DELETE FROM USERS WHERE ID = ?", USER_ID);
    }
}
