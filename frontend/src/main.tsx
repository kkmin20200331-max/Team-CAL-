
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import "./styles/index.css";

  // 초기 언어 설정을 data-lang 속성으로 즉시 반영 (React 마운트 전)
  const initLang = (sessionStorage.getItem('app-language') as string) || 'ko';
  document.documentElement.setAttribute('data-lang', initLang);

  createRoot(document.getElementById("root")!).render(<App />);
