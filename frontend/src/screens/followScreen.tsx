import { Text, View } from "react-native";
import Mascot from "../components/mascot";
import Button from "../components/button";
import { CalendarList } from "react-native-calendars";

const FollowScreen = () => {
    return (
        <View>
            <Mascot
                mascot="hey"
                text={
                    "Ton journal t’attend ! Quelques lignes et hop, des points pour nourrir ta forêt."
                }
            />
            <CalendarList
                horizontal
                pagingEnabled
                pastScrollRange={12}
                futureScrollRange={12}
                calendarWidth={320}
                onDayPress={(day) => {
                    console.log("selected day", day);
                }}
                theme={{
                    selectedDayBackgroundColor: "#00adf5",
                    todayTextColor: "#00adf5",
                }}
            />
            <Button title="Remplir le journal" onPress={() => {}}></Button>
        </View>
    );
};
export default FollowScreen;
