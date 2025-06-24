import { Text, View } from "react-native";
import Mascot from "../../components/mascot";
import Button from "../../components/button";

const AskDeviation = () => 
{
	return (
		<View>
			<Mascot
				mascot="hey"
				text={
					"Il y a eu un petit écart ? Ce n’est pas grave, je suis toujours là."
				}
			/>

			<Button title="Suivant" onPress={() => 
{}}></Button>
		</View>
	);
};

export default AskDeviation;
