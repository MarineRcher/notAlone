import { Text, View } from "react-native";
import Mascot from "../../components/mascot";
import Button from "../../components/button";

const TopActivity = () => 
{
	return (
		<View>
			<Mascot
				mascot="hey"
				text={
					"Si tu devais choisir les deux moments clés de ta journée, ce serait quoi ?"
				}
			/>

			<Button title="Suivant" onPress={() => 
{}}></Button>
		</View>
	);
};

export default TopActivity;
