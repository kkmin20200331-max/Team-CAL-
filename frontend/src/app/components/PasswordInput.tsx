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

// 물리 키코드 → 영문 (IME 상태 무관하게 물리 키 위치로 변환)
const CODE_MAP: Record<string, string> = {
  KeyQ:'q',KeyW:'w',KeyE:'e',KeyR:'r',KeyT:'t',KeyY:'y',KeyU:'u',KeyI:'i',KeyO:'o',KeyP:'p',
  KeyA:'a',KeyS:'s',KeyD:'d',KeyF:'f',KeyG:'g',KeyH:'h',KeyJ:'j',KeyK:'k',KeyL:'l',
  KeyZ:'z',KeyX:'x',KeyC:'c',KeyV:'v',KeyB:'b',KeyN:'n',KeyM:'m',
  Digit1:'1',Digit2:'2',Digit3:'3',Digit4:'4',Digit5:'5',
  Digit6:'6',Digit7:'7',Digit8:'8',Digit9:'9',Digit0:'0',
  Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Backslash:'\\',
  Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/',Backquote:'`',
};
const CODE_MAP_SHIFT: Record<string, string> = {
  KeyQ:'Q',KeyW:'W',KeyE:'E',KeyR:'R',KeyT:'T',KeyY:'Y',KeyU:'U',KeyI:'I',KeyO:'O',KeyP:'P',
  KeyA:'A',KeyS:'S',KeyD:'D',KeyF:'F',KeyG:'G',KeyH:'H',KeyJ:'J',KeyK:'K',KeyL:'L',
  KeyZ:'Z',KeyX:'X',KeyC:'C',KeyV:'V',KeyB:'B',KeyN:'N',KeyM:'M',
  Digit1:'!',Digit2:'@',Digit3:'#',Digit4:'$',Digit5:'%',
  Digit6:'^',Digit7:'&',Digit8:'*',Digit9:'(',Digit0:')',
  Minus:'_',Equal:'+',BracketLeft:'{',BracketRight:'}',Backslash:'|',
  Semicolon:':',Quote:'"',Comma:'<',Period:'>',Slash:'?',Backquote:'~',
};

const isKorean = (key: string) => /^[ㄱ-ㅎㅏ-ㅣ가-힣]$/.test(key);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 키: e.key가 한글 문자면 물리 키코드로 영문 변환
    if (isKorean(e.key)) {
      e.preventDefault();
      const char = (e.shiftKey ? CODE_MAP_SHIFT : CODE_MAP)[e.nativeEvent.code];
      if (char) onChange(realRef.current + char);
      return;
    }
    // 백스페이스 직접 처리
    if (e.key === 'Backspace') {
      e.preventDefault();
      onChange(realRef.current.slice(0, -1));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const displayed = e.target.value;
    const old = realRef.current;
    const newLen = displayed.length;
    const oldLen = old.length;

    if (newLen === 0) { onChange(''); return; }

    if (newLen > oldLen) {
      // ●를 제거하고 남은 문자 (한글이면 keyDown에서 이미 처리됐으므로 무시)
      const newChars = displayed.replace(/●/g, '').replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
      if (newChars) onChange(old + newChars);
    } else {
      onChange(old.slice(0, newLen));
    }
  };

  const textColor = (style?.color as string) || '#333';

  return (
    <input
      id={id}
      type="text"
      inputMode="text"
      autoComplete={autoComplete}
      value={'●'.repeat(value.length)}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      placeholder={placeholder}
      style={{
        ...style,
        color: textColor,
        WebkitTextFillColor: textColor,
        fontFamily: 'system-ui, -apple-system, "Noto Sans KR", sans-serif',
        fontWeight: 300,
        letterSpacing: value.length > 0 ? '3px' : undefined,
      }}
      className={`pw-input${className ? ` ${className}` : ''}`}
    />
  );
}
