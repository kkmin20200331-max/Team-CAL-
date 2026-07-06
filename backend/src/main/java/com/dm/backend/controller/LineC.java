package com.dm.backend.controller;

import com.dm.backend.service.LineService;
import com.dm.backend.service.UserLineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/line")
public class LineC {

    @Autowired
    private LineService lineService;

    @Autowired
    private UserLineService userLineService;

    @GetMapping("/test")
    public String test() {

        lineService.sendMessage(
                "U3aebea394016df2ba82427d18ea6e5f8",
                "테스트 메시지"
        );

        return "OK";
    }

    @GetMapping("/admin-targets")
    public Map<String, Object> adminTargets(
            @RequestParam(required = false) String store_id,
            @RequestParam(required = false) String shift_id
    ) {

        List<String> targets = resolveAdminTargets(store_id, shift_id);

        return Map.of(
                "store_id", store_id == null ? "" : store_id,
                "shift_id", shift_id == null ? "" : shift_id,
                "count", targets.size(),
                "targets", targets.stream().map(this::maskLineUserId).toList()
        );
    }

    @PostMapping("/test/admin")
    public Map<String, Object> testAdmin(
            @RequestParam(required = false) String store_id,
            @RequestParam(required = false) String shift_id
    ) {

        List<String> targets = resolveAdminTargets(store_id, shift_id);

        for (String target : targets) {
            lineService.sendMessage(
                    target,
                    "[LINE 테스트]\n관리자 알림 대상 조회와 발송이 정상 동작합니다."
            );
        }

        return Map.of(
                "sent", targets.size(),
                "targets", targets.stream().map(this::maskLineUserId).toList()
        );
    }

    private List<String> resolveAdminTargets(String storeId, String shiftId) {

        if (shiftId != null && !shiftId.isBlank()) {
            return userLineService.getOwnerLineUserIdsByShiftId(shiftId);
        }

        if (storeId != null && !storeId.isBlank()) {
            return userLineService.getAdminLineUserIdsByStoreId(storeId);
        }

        throw new IllegalArgumentException("store_id 또는 shift_id가 필요합니다.");
    }

    private String maskLineUserId(String lineUserId) {

        if (lineUserId == null || lineUserId.length() <= 10) {
            return "";
        }

        return lineUserId.substring(0, 6)
                + "..."
                + lineUserId.substring(lineUserId.length() - 4);
    }
}
