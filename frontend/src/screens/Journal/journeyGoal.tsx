import { Text, View } from "react-native";
import Mascot from "../../components/mascot";
import Button from "../../components/button";

const journeyGoal = () => 
{
	return (
		<View>
			<Mascot
				mascot="woaw"
				text={
					"As-tu réussi à atteindre ton objectif d’hier ? Si tu veux, on peut en choisir un nouveau pour aujourd’hui."
				}
			/>

			<Button title="Suivant" onPress={() => 
{}}></Button>
		</View>
	);
};

export default journeyGoal;
