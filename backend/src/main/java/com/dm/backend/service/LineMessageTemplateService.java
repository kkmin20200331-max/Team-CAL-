package com.dm.backend.service;

import org.springframework.stereotype.Service;

@Service
public class LineMessageTemplateService {

    public String substituteRequest(String language, String reason) {
        return message(
                language,
                "대타 신청",
                "접수",
                "새로운 대타 신청이 등록되었습니다.",
                reason
        );
    }

    public String substituteRecruitment(String language) {
        return message(
                language,
                "대타 모집",
                "모집 중",
                "새로운 대타 모집글이 등록되었습니다.",
                null
        );
    }

    public String emergencySubstituteRecruitment(String language, String date) {
        if ("en".equals(language)) {
            return format(
                    "BiteMate",
                    "Type",
                    "Status",
                    "Details",
                    "Reason",
                    "Urgent substitute request",
                    "Open",
                    "Please check if you can cover the substitute shift on " + date + ".",
                    null
            );
        }

        if ("ja".equals(language)) {
            return format(
                    "BiteMate",
                    "種類",
                    "状態",
                    "内容",
                    "理由",
                    "緊急代替勤務依頼",
                    "募集中",
                    date + "の代替勤務が可能か確認してください。",
                    null
            );
        }

        return message(
                language,
                "긴급 대타 요청",
                "모집 중",
                date + " 대타 근무 가능 여부를 확인해주세요.",
                null
        );
    }

    public String substituteApplication(String language) {
        return message(
                language,
                "대타 지원",
                "접수",
                "새로운 대타 지원자가 등록되었습니다.",
                null
        );
    }

    public String substituteApplicationCancelled(String language) {
        return message(
                language,
                "대타 지원",
                "취소",
                "대타 지원자 1명이 신청을 취소했습니다.",
                null
        );
    }

    public String substituteApprovedForApplicant(String language) {
        return message(
                language,
                "대타 확정",
                "승인",
                "지원하신 대타 근무가 확정되었습니다.",
                null
        );
    }

    public String substituteApprovedForRequester(String language) {
        return message(
                language,
                "대타 확정",
                "승인",
                "요청하신 대타 근무자가 확정되었습니다.",
                null
        );
    }

    public String leaveRequest(String language, String reason) {
        return message(
                language,
                "휴무 신청",
                "접수",
                "새로운 휴무 신청이 등록되었습니다.",
                reason
        );
    }

    public String leaveRequestSubmitted(String language) {
        return message(
                language,
                "휴무 신청",
                "접수",
                "휴무 신청이 접수되었습니다.",
                null
        );
    }

    public String leaveResult(String language, String status) {
        boolean approved = "APPROVED".equalsIgnoreCase(status);
        return message(
                language,
                "휴무 신청",
                approved ? "승인" : "거절",
                approved
                        ? "휴무 신청이 승인되었습니다."
                        : "휴무 신청이 거절되었습니다.",
                null
        );
    }

    private String message(String language, String typeKo, String statusKo, String bodyKo, String reason) {

        String lang = language == null ? "ko" : language;

        if ("en".equals(lang)) {
            return format(
                    "BiteMate",
                    "Type",
                    "Status",
                    "Details",
                    "Reason",
                    translateTypeEn(typeKo),
                    translateStatusEn(statusKo),
                    translateBodyEn(bodyKo),
                    reason
            );
        }

        if ("ja".equals(lang)) {
            return format(
                    "BiteMate",
                    "種類",
                    "状態",
                    "内容",
                    "理由",
                    translateTypeJa(typeKo),
                    translateStatusJa(statusKo),
                    translateBodyJa(bodyKo),
                    reason
            );
        }

        return format(
                "바이트메이트",
                "유형",
                "상태",
                "내용",
                "사유",
                typeKo,
                statusKo,
                bodyKo,
                reason
        );
    }

    private String format(
            String appName,
            String typeLabel,
            String statusLabel,
            String bodyLabel,
            String reasonLabel,
            String type,
            String status,
            String body,
            String reason
    ) {

        StringBuilder builder = new StringBuilder();
        builder.append("[").append(appName).append("]\n");
        builder.append(typeLabel).append(": ").append(type).append("\n");
        builder.append(statusLabel).append(": ").append(status).append("\n");
        builder.append(bodyLabel).append(": ").append(body);

        if (reason != null && !reason.isBlank()) {
            builder.append("\n").append(reasonLabel).append(": ").append(reason);
        }

        return builder.toString();
    }

    private String translateTypeEn(String value) {
        return switch (value) {
            case "대타 신청" -> "Substitute request";
            case "대타 모집" -> "Substitute recruitment";
            case "긴급 대타 요청" -> "Urgent substitute request";
            case "대타 지원" -> "Substitute application";
            case "대타 확정" -> "Substitute confirmed";
            case "휴무 신청" -> "Leave request";
            default -> value;
        };
    }

    private String translateStatusEn(String value) {
        return switch (value) {
            case "접수" -> "Received";
            case "모집 중" -> "Open";
            case "취소" -> "Cancelled";
            case "승인" -> "Approved";
            case "거절" -> "Rejected";
            default -> value;
        };
    }

    private String translateBodyEn(String value) {
        return switch (value) {
            case "새로운 대타 신청이 등록되었습니다." -> "A new substitute request has been submitted.";
            case "새로운 대타 모집글이 등록되었습니다." -> "A new substitute recruitment post has been created.";
            case "새로운 대타 지원자가 등록되었습니다." -> "A new substitute applicant has been submitted.";
            case "대타 지원자 1명이 신청을 취소했습니다." -> "One substitute applicant has cancelled their application.";
            case "지원하신 대타 근무가 확정되었습니다." -> "Your substitute shift has been confirmed.";
            case "요청하신 대타 근무자가 확정되었습니다." -> "A substitute worker has been confirmed for your request.";
            case "새로운 휴무 신청이 등록되었습니다." -> "A new leave request has been submitted.";
            case "휴무 신청이 접수되었습니다." -> "Your leave request has been received.";
            case "휴무 신청이 승인되었습니다." -> "Your leave request has been approved.";
            case "휴무 신청이 거절되었습니다." -> "Your leave request has been rejected.";
            default -> value;
        };
    }

    private String translateTypeJa(String value) {
        return switch (value) {
            case "대타 신청" -> "代替勤務申請";
            case "대타 모집" -> "代替勤務募集";
            case "긴급 대타 요청" -> "緊急代替勤務依頼";
            case "대타 지원" -> "代替勤務応募";
            case "대타 확정" -> "代替勤務確定";
            case "휴무 신청" -> "休暇申請";
            default -> value;
        };
    }

    private String translateStatusJa(String value) {
        return switch (value) {
            case "접수" -> "受付";
            case "모집 중" -> "募集中";
            case "취소" -> "取消";
            case "승인" -> "承認";
            case "거절" -> "拒否";
            default -> value;
        };
    }

    private String translateBodyJa(String value) {
        return switch (value) {
            case "새로운 대타 신청이 등록되었습니다." -> "新しい代替勤務申請が登録されました。";
            case "새로운 대타 모집글이 등록되었습니다." -> "新しい代替勤務募集が登録されました。";
            case "새로운 대타 지원자가 등록되었습니다." -> "新しい代替勤務応募者が登録されました。";
            case "대타 지원자 1명이 신청을 취소했습니다." -> "代替勤務応募者1名が申請をキャンセルしました。";
            case "지원하신 대타 근무가 확정되었습니다." -> "応募した代替勤務が確定しました。";
            case "요청하신 대타 근무자가 확정되었습니다." -> "依頼した代替勤務者が確定しました。";
            case "새로운 휴무 신청이 등록되었습니다." -> "新しい休暇申請が登録されました。";
            case "휴무 신청이 접수되었습니다." -> "休暇申請が受け付けられました。";
            case "휴무 신청이 승인되었습니다." -> "休暇申請が承認されました。";
            case "휴무 신청이 거절되었습니다." -> "休暇申請が拒否されました。";
            default -> value;
        };
    }

    public String followWelcomeMessage(String language) {
        if ("en".equals(language)) {
            return "BiteMate LINE notification has been activated.";
        }
        if ("ja".equals(language)) {
            return "BiteMateのLINE通知受信が有効になりました。";
        }
        return "바이트메이트 LINE 알림 수신이 활성화되었습니다.";
    }
}
