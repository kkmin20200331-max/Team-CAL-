package com.dm.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class BusinessValidationService {

    @Value("${public-data.service-key}")
    private String serviceKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // =========================
    // 사업자등록번호 진위여부(상태조회) 검증 API 호출
    // =========================
    public BusinessValidationResult validate(String businessNumber) {
        if (businessNumber == null) {
            return new BusinessValidationResult(false, "사업자등록번호가 입력되지 않았습니다.");
        }

        // 하이픈 제거
        String cleanNumber = businessNumber.replaceAll("\\D", "");
        if (cleanNumber.length() != 10) {
            return new BusinessValidationResult(false, "사업자등록번호는 10자리여야 합니다.");
        }

        // 템플릿 키 상태 확인
        if ("YOUR_PUBLIC_DATA_PORTAL_SERVICE_KEY".equals(serviceKey)) {
            log.warn("공공데이터 포털 API 키가 설정되지 않았습니다. application.properties를 확인해 주세요.");
            return new BusinessValidationResult(false, "서버 API 키 설정이 완료되지 않았습니다.");
        }

        try {
            // 공공데이터 API URL
            String url = "https://api.odcloud.kr/api/nts-businessman/v1/status";

            // URI 직접 생성 (이중 인코딩 방지)
            URI uri = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("serviceKey", serviceKey)
                    .build(true)
                    .toUri();

            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            // Request Body
            Map<String, Object> requestBody = Map.of("b_no", List.of(cleanNumber));
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // API Call
            ResponseEntity<Map> response = restTemplate.postForEntity(uri, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List<Map<String, Object>> data = (List<Map<String, Object>>) body.get("data");

                if (data != null && !data.isEmpty()) {
                    Map<String, Object> item = data.get(0);
                    String bSttCd = (String) item.get("b_stt_cd"); // "01": 계속, "02": 휴업, "03": 폐업, "": 등록되지 않음
                    String bStt = (String) item.get("b_stt");     // 상태 문자열
                    String taxType = (String) item.get("tax_type"); // 세금유형 (예: 국세청에 등록되지 않은 사업자등록번호입니다.)

                    if (bSttCd != null && !bSttCd.isEmpty()) {
                        String statusDesc = bStt != null && !bStt.isEmpty() ? bStt : "등록된 사업자";
                        if ("03".equals(bSttCd)) {
                            return new BusinessValidationResult(false, "폐업된 사업자번호입니다.");
                        }
                        return new BusinessValidationResult(true, "인증 성공 (" + statusDesc + ")");
                    } else {
                        String errMsg = taxType != null && !taxType.isEmpty() ? taxType : "등록되지 않은 사업자번호입니다.";
                        return new BusinessValidationResult(false, errMsg);
                    }
                }
            }
            return new BusinessValidationResult(false, "사업자등록정보를 조회할 수 없습니다.");
        } catch (Exception e) {
            log.error("사업자등록번호 검증 중 오류 발생: {}", e.getMessage(), e);
            return new BusinessValidationResult(false, "공공데이터 API 호출 오류가 발생했습니다.");
        }
    }

    public static class BusinessValidationResult {
        private final boolean valid;
        private final String message;

        public BusinessValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }
}
