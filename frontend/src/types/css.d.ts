import 'react';

declare module 'react' {
  interface CSSProperties {
    WebkitTextSecurity?: 'none' | 'disc' | 'circle' | 'square';
  }
}
