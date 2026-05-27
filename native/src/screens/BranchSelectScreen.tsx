import { StackNavigationProp } from "@react-navigation/stack";
import { View } from "react-native";


type BranchSelectScreenNavigationProp = StackNavigationProp<any, 'BranchSelect'>;

type Props = {
  navigation: BranchSelectScreenNavigationProp;
  setIsLoggedIn?: (value: boolean) => void; 
};

export default function BranchSelectScreen () => {
return (
    <View>
    </View>
)
}