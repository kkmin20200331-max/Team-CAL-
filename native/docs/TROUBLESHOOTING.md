# 겪었던 문제와 해결 과정 (Troubleshooting & Improvement)

## 🧐 문제 상황: 일관성 없는 다크 모드 UI와 유지보수의 어려움

프로젝트 초기 단계에서는 각 화면과 컴포넌트에서 개별적으로 다크 모드 스타일을 처리했습니다. 이로 인해 다음과 같은 문제점들이 발생했습니다.

1.  **UI 버그**: 다크 모드로 전환 시, 일부 텍스트는 검은색으로 그대로 남아 보이지 않거나, 특정 아이콘 및 배경색이 라이트 모드 색상으로 표시되는 등 **UI의 일관성이 깨지는 문제**가 빈번하게 발생했습니다.
2.  **코드의 복잡성 증가**: 스타일을 적용하기 위해 모든 컴포넌트에 `isDarkMode` prop을 전달해야 했고, `StyleSheet` 내부에서는 삼항 연산자(`isDarkMode ? 'white' : 'black'`)를 남발하여 코드가 지저분하고 가독성이 떨어졌습니다.
3.  **유지보수의 어려움**: "앱의 전체적인 브랜드 색상을 파란색에서 보라색으로 바꿔주세요" 와 같은 간단한 디자인 변경 요청이 들어왔을 때, 관련된 모든 파일을 찾아 수십 개의 색상 코드를 일일이 수정해야 하는 **비효율적인 유지보수 구조**를 가지고 있었습니다.

---

## 💡 해결 과정: 중앙화된 테마 시스템 도입 및 전체 리팩토링

이 문제를 근본적으로 해결하기 위해, **의미 기반의 중앙화된 테마 시스템**을 도입하고 전체 코드를 리팩토링하는 과정을 거쳤습니다.

### 1단계: 중앙 색상 관리소 `ThemeContext` 설계

- `contexts/ThemeContext.tsx` 파일을 생성하여 앱의 모든 색상을 한 곳에서 관리하도록 했습니다.
- 단순히 'dark', 'light'로 구분하는 것을 넘어, 색상의 **의미(Semantic Name)**에 따라 변수명을 정의했습니다.
  - **Before**: `const color = isDarkMode ? '#E0E0E0' : '#333333';`
  - **After**: `text: isDarkMode ? '#E0E0E0' : '#333333',` -> `color: colors.text`
- `primary`, `background`, `card`, `border`, `text`, `subText` 등 기본적인 색상뿐만 아니라, `sunday` (일요일 텍스트 색상), `disabled` (비활성화 버튼 색상), `yellowLight` (경고 배지 배경색) 등 특정 상태나 컴포넌트에 사용되는 색상까지 모두 변수화했습니다.

### 2단계: 전수조사를 통한 하드코딩 색상 제거

- `screens`와 `components` 폴더 내의 **모든 `.tsx` 파일을 하나씩 검토**하며, 하드코딩된 색상 코드를 찾아냈습니다.
- 찾아낸 모든 색상 값을 1단계에서 정의한 `ThemeContext`의 `colors` 객체 변수로 교체했습니다.
- 이 과정에서 불필요하게 `isDarkMode` prop을 받던 모든 컴포넌트에서 해당 prop을 제거하고, 대신 `useTheme()` 훅을 직접 사용하도록 코드를 통일했습니다.

**예시: 버튼 컴포넌트 리팩토링**

```tsx
// Before
const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  // ...
  acceptButton: {
    backgroundColor: '#D97706',
  },
  rejectButtonText: {
    color: colors.text,
  },
});

// After
const getThemedStyles = (colors: any) => StyleSheet.create({
  // ...
  acceptButton: {
    backgroundColor: colors.yellow, // 의미 기반 변수 사용
  },
  rejectButtonText: {
    color: colors.text,
  },
});
```

### 3단계: 동적 스타일링 구조 통일

- 모든 컴포넌트가 `const { colors } = useTheme();` 와 `const styles = getThemedStyles(colors);` 패턴을 따르도록 하여, 스타일링 코드의 일관성을 확보했습니다.
- 이를 통해 어떤 개발자가 어떤 파일을 보더라도 테마와 스타일이 어떻게 적용되는지 쉽게 파악할 수 있게 되었습니다.

---

## ✨ 개선 결과 및 효과

- **완벽한 UI 일관성 확보**: 앱의 모든 부분에서 다크 모드가 완벽하게 동작하게 되어 사용자 경험(UX)의 질을 크게 향상시켰습니다.
- **유지보수 비용 극감**: 이제 "브랜드 색상을 바꿔주세요" 라는 요청이 와도 `ThemeContext.tsx` 파일의 `primary` 색상 값 **단 한 줄만 수정**하면 앱 전체에 일괄적으로 반영됩니다. 이는 개발 속도와 유지보수 효율성을 극적으로 향상시켰습니다.
- **코드 가독성 및 품질 향상**: 불필요한 prop 전달과 삼항 연산자가 사라지고, 의미 있는 변수명을 사용하게 되어 코드 전체의 가독성과 품질이 높아졌습니다. 이는 향후 신규 팀원이 프로젝트에 적응하는 데 드는 시간도 단축시키는 효과를 가져옵니다.
