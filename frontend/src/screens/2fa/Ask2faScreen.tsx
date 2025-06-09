import { View, Text, ScrollView, TouchableOpacity } from "react-native";

const Ask2faScreen = ({ navigation, route }) => {
    const isFromRegistration = route?.params?.isFromRegistration || false;

    return (
        <ScrollView>
            <View>
                <Text>Voulez vous activer la double authentification ?</Text>
            </View>
            <View>
                <TouchableOpacity
                    onPress={() => {
                        if (navigation) {
                            if (isFromRegistration) {
                                navigation.navigate("AddUserAddiction");
                            } else {
                                navigation.navigate("Main");
                            }
                        }
                    }}
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
export default Ask2faScreen;
