# AI 자동 스케줄 생성 API

Spring Boot가 DB에서 필요한 데이터를 조회한 뒤 AI 서버에 전달하면, AI 서버는 저장 가능한 `shift` 후보를 반환합니다. 실제 DB 저장은 Spring Boot에서 트랜잭션으로 처리합니다.

## Endpoint

```http
POST /api/v1/ai-schedules/generate
```

## Request

```json
{
  "store": {
    "id": 1,
    "name": "강남점",
    "open_time": "09:00",
    "close_time": "22:00",
    "capacity": 50,
    "type": "CAFE"
  },
  "start_date": "2026-06-22",
  "end_date": "2026-06-28",
  "members": [],
  "fixed_schedules": [],
  "shifts": [],
  "leave_requests": [],
  "people_logs": [],
  "slot_minutes": 60,
  "customers_per_staff": 25,
  "min_staff": 1,
  "output_status": "confirmed"
}
```

입력 배열은 아래 DB 조회 결과를 그대로 매핑하면 됩니다.

- `members`: `store_member` + `users`, `approval_status = APPROVED`
- `fixed_schedules`: `fixed_schedule`, `active = Y`
- `shifts`: 생성 기간 안의 기존 근무표
- `leave_requests`: 생성 기간 안의 승인된 휴무/대타 요청
- `people_logs`: 시간대별 고객 수 로그

`output_status`는 프론트 기준이면 `confirmed`, DB 정책 기준이면 `SCHEDULED`로 넘기면 됩니다.

## Response

```json
{
  "storeId": 1,
  "startDate": "2026-06-22",
  "endDate": "2026-06-28",
  "slotMinutes": 60,
  "status": "confirmed",
  "generatedShifts": [
    {
      "storeId": 1,
      "userId": 10,
      "userName": "김민수",
      "workDate": "2026-06-22",
      "startAt": "2026-06-22T10:00",
      "endAt": "2026-06-22T14:00",
      "status": "confirmed",
      "reason": "예상 고객 55명 기준 필요 인원 3명"
    }
  ],
  "slotSummaries": [
    {
      "workDate": "2026-06-22",
      "timeRange": "10:00-11:00",
      "expectedPeopleCount": 55,
      "requiredStaff": 3,
      "assignedStaff": 2,
      "shortage": 1,
      "candidateUserIds": [10, 11]
    }
  ],
  "warnings": [
    "2026-06-22 10:00-11:00 구간 후보 부족: 1명 미배정"
  ]
}
```

## 생성 규칙

1. `store.open_time`부터 `store.close_time`까지 `slot_minutes` 단위 슬롯을 만듭니다.
2. `people_logs`에서 해당 슬롯의 예상 고객 수를 계산합니다.
3. `ceil(expectedPeopleCount / customersPerStaff)`로 필요 인원을 계산합니다.
4. 승인된 직원 중 `fixed_schedule` 또는 `available_days`가 맞는 직원만 후보로 둡니다.
5. 기존 `shift`와 시간이 겹치는 직원은 제외합니다.
6. 승인된 `leave_request`가 연결된 근무와 겹치는 직원은 제외합니다.
7. 생성된 인접 슬롯은 같은 직원 기준으로 하나의 shift로 병합합니다.
