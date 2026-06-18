import { useRef } from 'react';

interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
  className?: string;
}

export default function PasswordInput({
  value,
  onChange,
  style,
  placeholder,
  autoComplete = 'off',
  id,
  className,
}: PasswordInputProps) {
  const realRef = useRef(value);
  realRef.current = value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const displayed = e.target.value;
    const oldReal = realRef.current;
    const oldLen = oldReal.length;
    const newLen = displayed.length;
    // 한글 문자 제거 (IME 입력 차단)
    const newChars = displayed.replace(/●/g, '').replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');

    if (newLen === 0) {
      onChange('');
    } else if (newLen > oldLen) {
      onChange(oldReal + newChars);
    } else {
      onChange(oldReal.slice(0, newLen));
    }
  };

  const textColor = (style?.color as string) || '#333';

  const mergedStyle: React.CSSProperties = {
    ...style,
    color: textColor,
    WebkitTextFillColor: textColor,
    // Bookk Gothic 폰트가 ● 를 invisible로 렌더링 → 시스템 폰트 강제
    fontFamily: 'system-ui, -apple-system, "Noto Sans KR", sans-serif',
    fontWeight: 300,
    letterSpacing: value.length > 0 ? '3px' : undefined,
  };

  const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
    // 한글 IME 조합 시작 시 즉시 blur→focus로 IME 강제 해제
    const el = e.currentTarget;
    el.blur();
    requestAnimationFrame(() => el.focus());
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="text"
      autoComplete={autoComplete}
      value={'●'.repeat(value.length)}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      placeholder={placeholder}
      style={mergedStyle}
      className={`pw-input${className ? ` ${className}` : ''}`}
    />
  );
}
