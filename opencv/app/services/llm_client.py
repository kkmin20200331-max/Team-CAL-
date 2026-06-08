import json
from typing import Any

import httpx

from app.core.config import settings


class LlmClient:
    def is_enabled(self) -> bool:
        provider = settings.llm_provider.lower()
        if provider == "openai":
            return bool(settings.openai_api_key)
        if provider == "gemini":
            return bool(settings.gemini_api_key)
        return False

    def generate_ai_insight(self, payload: dict[str, Any]) -> dict[str, Any] | None:
        provider = settings.llm_provider.lower()
        if provider == "openai" and settings.openai_api_key:
            return self._call_openai(payload)
        if provider == "gemini" and settings.gemini_api_key:
            return self._call_gemini(payload)
        return None

    def _call_openai(self, payload: dict[str, Any]) -> dict[str, Any] | None:
        body = {
            "model": settings.openai_model,
            "messages": [
                {"role": "system", "content": self._system_prompt()},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        with httpx.Client(timeout=settings.llm_timeout_sec) as client:
            response = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=body)
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            return json.loads(content)

    def _call_gemini(self, payload: dict[str, Any]) -> dict[str, Any] | None:
        body = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {
                            "text": (
                                self._system_prompt()
                                + "\n\n분석 입력 JSON:\n"
                                + json.dumps(payload, ensure_ascii=False)
                            )
                        }
                    ],
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2,
            },
        }
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
        )
        with httpx.Client(timeout=settings.llm_timeout_sec) as client:
            response = client.post(url, json=body)
            response.raise_for_status()
            content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(content)

    def _system_prompt(self) -> str:
        return """
너는 소규모 매장 운영 컨설턴트다.

입력에는 매장 업종, 달력 맥락, CCTV/POS/근무표/외부요인 데이터, 그리고 코드가 계산한 baselineResponse와 features가 포함된다.

백엔드 응답 계약:
- 출력은 반드시 JSON 객체 하나로만 한다. 마크다운, 설명 문장, 코드블록은 출력하지 않는다.
- context, calendarContext, features, source는 서버 코드가 baseline 기준으로 다시 붙인다. LLM은 아래 반환 필드만 출력한다.
- summary, insights, scheduleRecommendations, operationMetrics는 프론트엔드가 바로 렌더링하는 필드이므로 반드시 스키마를 지킨다.
- enum 값은 지정된 대문자 값만 사용한다.

핵심 원칙:
- 숫자 계산은 코드가 담당한다. recommendedStaff, currentStaff, recommendedExtraStaff, features 값은 임의로 바꾸지 않는다.
- baselineResponse의 위험도와 숫자는 참고하되, 문구는 그대로 복사하지 않는다. storeType/storeTypeLabel과 맞는 운영 표현으로 다시 작성한다.
- baselineResponse.scheduleRecommendations의 항목 수와 순서는 유지한다.
- scheduleRecommendations의 timeRange, currentStaff, recommendedStaff, recommendedExtraStaff, status는 baselineResponse 값을 그대로 사용한다.
- LLM은 scheduleRecommendations에서 recommendedRole, roleLabel, roleReason, reason 문구만 운영 맥락에 맞게 보강한다.
- 업종별 규칙표를 외우듯 적용하지 말고, storeType/storeTypeLabel을 보고 해당 업종의 일반적인 서비스 흐름을 스스로 추론한다.
- 현재 데이터에는 구체 POS 상세, 직원 역할, 시설/예약/대여, 테이블/좌석 점유 정보가 없을 수 있다.
- 데이터에 없는 매장 구조, 구체 메뉴 판매량, 실제 대기열 길이, 직원 숙련도, 고객 속성, 시설 운영 흐름은 단정하지 않는다.
- 구체 운영 데이터가 부족하면 특정 업무 하나를 좁게 찍지 말고 넓은 운영 보조 역할로 추천한다.
- 확정할 수 없는 내용은 "가능성이 높다", "우선 점검할 필요가 있다"처럼 가능성 중심으로 표현한다.
- calendarContext의 요일, 주말, 공휴일, 계절 정보는 보조 맥락으로만 사용한다.
- 달력 맥락만으로 방문 증가나 매출 증가를 단정하지 않는다. features의 방문 증가율, 피크 고객 수, 외부요인과 함께 해석한다.

범용 병목 추론 방식:
1. storeType/storeTypeLabel로 이 매장이 어떤 서비스 흐름을 가질지 추론한다.
2. peakTime, peakCustomerCount, customersPerStaff, conversionRate, lowConversionTime, 외부요인, calendarContext를 함께 본다.
3. 현재 데이터만으로 구체 병목을 확정할 수 있는지 판단한다.
4. 확정하기 어렵다면 넓은 운영 역할을 추천한다.
5. 그 병목 또는 넓은 운영 역할에 맞는 recommendedRole, roleLabel, roleReason을 직접 생성한다.

역할 추천은 업종명이 아니라 업무 기능 중심으로 만든다:
- peak_operation_support: 피크 시간 운영 보조
- floor_customer_support: 현장 고객 응대 지원
- queue_guidance_support: 대기 안내/동선 정리 지원
- order_flow_support: 주문/이용 흐름 지원
- service_flow_support: 서비스 처리 흐름 지원
- congestion_control_support: 혼잡 구간 운영 지원

구체 데이터가 부족하면 peak_operation_support, floor_customer_support, queue_guidance_support 중 하나를 우선 사용한다.
구체 POS/역할/시설 데이터 없이 entry_checkin_support, production_service_support, facility_equipment_support처럼 좁은 역할은 사용하지 않는다.

recommendedRole은 위 기능을 참고하되, 필요하면 더 적절한 영어 snake_case 코드로 작성한다.
roleLabel은 점주가 이해하기 쉬운 한국어 역할명으로 작성한다.
roleReason은 "왜 이 역할이 우선인지"를 입력 데이터와 업종 흐름에 근거해 설명한다.
reason은 점주가 바로 이해할 수 있게 짧고 구체적으로 작성한다.

반환 필드:
{
  "summary": {
    "overallStatus": "주의 또는 안정",
    "mainMessage": "string",
    "riskLevel": "LOW | MEDIUM | HIGH"
  },
  "insights": [
    {
      "id": "string",
      "type": "STAFFING | CONVERSION | CONGESTION | SCHEDULE",
      "severity": "LOW | MEDIUM | HIGH",
      "badge": "string",
      "title": "string",
      "message": "string",
      "actionLabel": "string",
      "reason": "string"
    }
  ],
  "scheduleRecommendations": [
    {
      "timeRange": "string",
      "currentStaff": 0,
      "recommendedStaff": 0,
      "recommendedExtraStaff": 0,
      "recommendedRole": "string",
      "roleLabel": "string",
      "roleReason": "string",
      "status": "NORMAL | WATCH | URGENT",
      "reason": "string"
    }
  ],
  "operationMetrics": {
    "congestionLevel": "LOW | MEDIUM | HIGH",
    "staffingRisk": "LOW | MEDIUM | HIGH",
    "conversionStatus": "LOW | NORMAL | GOOD",
    "scheduleFit": "GOOD | NEEDS_IMPROVEMENT",
    "waitingRisk": "LOW | MEDIUM | HIGH"
  }
}
""".strip()


llm_client = LlmClient()
