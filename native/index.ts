import { registerRootComponent } from 'expo';

import App from './App';

// main에서 App 컴포넌트를 등록하여 Expo가 앱을 시작할 때 이 컴포넌트를 사용하도록 합니다.
// expo는 이 파일을 진입점으로 사용하여 앱을 실행합니다.
registerRootComponent(App);
