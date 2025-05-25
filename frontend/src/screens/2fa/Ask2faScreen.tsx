import { View, Text, ScrollView, TouchableOpacity } from "react-native";

const ask2faScreen = ({ navigation }) => {
    return (
        <ScrollView>
            <View>
                <Text>Voulez vous activer la double authentification ?</Text>
            </View>
            <View>
                <TouchableOpacity
                    onPress={() => navigation && navigation.navigate("Main")}
                >
                    <Text>Non</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() =>
                        navigation && navigation.navigate("Enable2FA")
                    }
                >
                    <Text>Oui</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};
export default ask2faScreen;
