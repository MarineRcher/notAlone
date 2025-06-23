import { Text, View } from "react-native";
import Mascot from "../../components/mascot";
import Button from "../../components/button";

const ResumeJourneyScreen = () => {
    return (
        <View>
            <Mascot
                mascot="hey"
                text={
                    "Si ta journée était un mot, ce serait… ? J’ai hâte de le découvrir."
                }
            />

            <Button title="Suivant" onPress={() => {}}></Button>
        </View>
    );
};
export default ResumeJourneyScreen;
