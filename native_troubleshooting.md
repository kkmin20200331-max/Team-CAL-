# Native App (React Native) Troubleshooting Report

본 문서는 Team-CAL 모바일 하이브리드 앱(React Native / Expo) 프로젝트 전반에서 발생한 핵심 트러블슈팅 사례 3가지를 정리한 문서입니다. 핵심 기능인 QR 출퇴근의 실시간 데이터 매칭부터 UI 레이아웃 대응, 주간 급여 실시간 계산 싱크까지 모바일 개발 과정에서의 대표적인 기술적 해결 방안을 다룹니다.

---

## 1. QR 출퇴근 기록의 실시간 화면 미반영 및 중복 생성 데이터 식별 오류 (핵심 기능)

### 🚨 문제 상황 (Symptom)
* 직원이 매장의 QR 코드를 스캔하여 출근/퇴근 처리를 완료하고, 관리자 웹 사이트에서는 기록이 즉시 확인됨에도 불구하고 **모바일 앱 대시보드 화면에는 퇴근 시간이 나타나지 않고 계속 "근무 중"으로 유지**되는 현상이 있었습니다.
* 또한, 일시적인 네트워크 지연 등으로 동일한 시간에 출퇴근 레코드가 여러 개 중복 생성되는 물리적 데이터 충돌이 발생했을 때, 앱에서 실제 완료된 퇴근 행을 구분하지 못하는 현상이 동반되었습니다.

### 🔍 원인 분석 (Cause)
* **원인 1 (모바일 네트워크 캐싱)**: iOS(`NSURLSession`) 및 안드로이드 네이티브 통신 레이어는 동일한 `GET` 주소의 API 요청 시 과거 데이터를 우선 반환하는 강력한 로컬 캐싱을 강제합니다. 이로 인해 Axios에 캐시 제어 헤더를 심어도 무시되고 최신 퇴근 정보가 누락되었습니다.
* **원인 2 (중복 데이터 식별 한계)**: Jackson 라이브러리가 초 단위까지만 직렬화(`yyyy-MM-dd HH:mm:ss`)하여 밀리초 단위가 생략되어 저장되었고, 앱 내 `reduce` 최신 필터링 코드에서 중복된 행들의 시간이 완벽히 일치하자 어떤 행이 퇴근을 완료한 유효 행인지 가려내지 못해 `check_out_at`이 `null`인 대기 상태의 행을 렌더링했습니다.

### 🛠️ 해결 방안 (Solution)
1. **Cache-Busting 타임스탬프 파라미터 적용**: 모바일 OS의 로컬 캐시를 강제 무력화하기 위해 실시간 조회 주소 뒤에 밀리초 단위 시간 파라미터(`_t: Date.now()`)를 바인딩하여 무조건 백엔드 서버를 거치도록 변경했습니다.
2. **Priority Merge(우선순위 병합) 필터 개선**: 동일한 날짜에 중복된 출근 시각 기록이 존재할 경우, 단순 크기 비교 외에 퇴근 정보(`check_out_at`)가 존재하는 완료 레코드를 최우선으로 선점하도록 논리 비교 연산을 강화했습니다.
   ```typescript
   todayAttendance = todayAttendanceList.reduce((latest: any, current: any) => {
     if (!latest) return current;
     
     const currentIn = current.check_in_at || '';
     const latestIn = latest.check_in_at || '';
     if (currentIn > latestIn) return current;
     if (currentIn < latestIn) return latest;
     
     // 💡 초 단위까지 일치하는 중복 생성 건의 경우, 퇴근 기록이 찍힌 진짜 유효 행을 강제 선점
     if (current.check_out_at && !latest.check_out_at) return current;
     return latest;
   }, null);
   ```

---

## 2. 안드로이드(갤럭시 등) 기기별 Bottom Tab Bar 레이아웃 및 Safe Area 간섭

### 🚨 문제 상황 (Symptom)
* iOS 환경에서는 탭바 디자인이 이상적으로 출력되었으나, 특정 안드로이드 디바이스(삼성 갤럭시 등)에서 화면 하단 탭 바가 시스템 내비게이션 바(소프트키 영역 또는 제스처 바)와 겹쳐서 아이콘이 가려지거나 터치가 정상적으로 이루어지지 않는 물리적 UI 간섭 현상이 발생했습니다.

### 🔍 원인 분석 (Cause)
* **원인**: iOS는 `SafeAreaView`가 하단 홈바 인디케이터 높이를 자동으로 유연하게 계산해 주지만, 안드로이드 기기는 화면 제조사별, 시스템 바 설정(3버튼 내비게이션 vs 제스처 내비게이션)에 따라 뷰포트 하단의 높이 인식이 달라집니다. React Navigation의 기본 탭바가 안드로이드 시스템 바 영역을 침범하여 발생한 문제였습니다.

### 🛠️ 해결 방안 (Solution)
* **플랫폼별 조건부 레이아웃 및 패딩 추가**: `native/src/navigation` 및 하단 탭바 스타일 컴포넌트에서 `Platform` API와 `react-native-safe-area-context`를 적용하여 안드로이드 기기일 때 하단 패딩 여백을 동적으로 보정했습니다.
  ```typescript
  import { Platform } from 'react-native';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';

  const insets = useSafeAreaInsets();
  const bottomTabBarHeight = Platform.OS === 'android' 
    ? 60 + Math.max(insets.bottom, 8) // 안드로이드 물리바/제스처 영역 고려 추가 여백 확보
    : 60 + insets.bottom;
  ```
* **결과**: 안드로이드 사용자들도 하단 시스템 내비게이션 바의 방해 없이 원활하게 탭 버튼을 클릭할 수 있도록 사용성을 극대화했습니다.

---

## 3. 대타/휴무 신청 등 스케줄 변동에 따른 실시간 주간 급여 및 근무 시간 계산 싱크

### 🚨 문제 상황 (Symptom)
* 대시보드 화면에 접속했을 때 노출되는 주간 총 근무시간 및 예상 주급이 실제 근무표(Schedule)와 맞지 않거나, 직원이 대타를 신청해 둔 근무나 휴무(OFF)로 변경된 근무 시간까지 모두 합산되어 급여가 잘못 표기되는 실시간 동기화 오류가 존재했습니다.

### 🔍 원인 분석 (Cause)
* **원인**: 대시보드의 근무 및 예상 급여 연산 함수에서 일정 데이터를 단순히 루프 돌며 시간 차이를 계산했는데, 승인 대기 중인 대타 근무(`SUBSTITUTE_REQ`)나 승인 완료된 휴무(`OFF`), 휴가 신청 대기(`LEAVE_PENDING`)와 같은 동적 스케줄 상태(Status) 예외 필터링이 누락되어 가짜 일정이 급여 총합에 합산되었던 것입니다.

### 🛠️ 해결 방안 (Solution)
* **상태 기반 필터링 및 실시간 시급 매칭**: `DashboardScreen.tsx`에서 급여를 산출할 때 예외 상태값 필터링을 엄격히 적용하였으며, 매장 멤버십 정보를 실시간 동기화하여 연동하게 조치했습니다.
  ```typescript
  const scheduledMinutes = mergedSchedule.reduce((sum, item) => {
    // 휴무(OFF), 휴무 대기중(LEAVE_PENDING), 대타 요청(SUBSTITUTE_REQ) 상태인 근무는 이번 주 근무 시간 계산에서 필수로 제외
    if (
      item.status === 'OFF' || 
      item.status === 'LEAVE_PENDING' || 
      item.status === 'SUBSTITUTE_REQ'
    ) {
      return sum;
    }
    
    if (!item.time.includes(' - ')) return sum;
    const [start, end] = item.time.split(' - ');
    ...
    return sum + diff;
  }, 0);
  ```
* **결과**: 일정이 실시간으로 변동(대타 양도, 휴가 등)되는 즉시 주간 총 근무 시간과 예상 주급 및 주휴수당 계산이 즉각적으로 수정 반영되어 금융 데이터의 신뢰도를 높였습니다.
