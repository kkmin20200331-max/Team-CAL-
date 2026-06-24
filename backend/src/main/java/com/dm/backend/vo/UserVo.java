package com.dm.backend.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserVo {
    private String id;
    private String username;
    private String password;
    private String name;
    private String phone;
    private String role;
    private String status;
    private LocalDateTime created_at;

    private String profile_image;

    private String brandName;
    private String branchName;
    private String storeAddress;
    private String storeType;
    private String businessNumber;
    private String openTime;
    private String closeTime;
    private Integer maxCapacity;
}
