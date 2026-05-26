import { StackNavigationProp } from '@react-navigation/stack';
// TypeScript: 이 화면에서 사용할 네비게이션 타입을 정의합니다.
type DashboardScreenNavigationProp = StackNavigationProp<any, 'Dashboard'>;

type Props = {
  navigation: DashboardScreenNavigationProp;
};

const DashboardScreen = () => {
return (
    <div></div>
    );
};
export default DashboardScreen;