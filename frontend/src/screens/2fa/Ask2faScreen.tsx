import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import styles from "../form.style";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import BackButton from "../../components/backNavigation";

const Ask2faScreen = ({ navigation, route }) => 
{
	const isFromRegistration = route?.params?.isFromRegistration || false;

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			<BackButton />

			<View>
				<Mascot
					mascot="super"
					text="Un renard avisé sécurise toujours son terrier… Tu veux activer la double protection ?"
				/>

				<View style={styles.buttonRow}>
					<Button
						type="secondary"
						title="Non"
						onPress={() => 
{
							if (navigation) 
{
								if (isFromRegistration) 
{
									navigation.navigate("AddUserAddiction");
								} else {
									navigation.navigate("Main");
								}
							}
						}}
					/>
					<Button
						title="Oui"
						onPress={() =>
							navigation && navigation.navigate("Enable2FA")
						}
					/>
				</View>
			</View>
		</ScrollView>
	);
};

export default Ask2faScreen;
