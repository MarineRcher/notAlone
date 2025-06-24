import { Text, View } from "react-native";
import Mascot from "../../components/mascot";
import Button from "../../components/button";

const AskUserOk = () => 
{
	return (
		<View>
			<Mascot
				mascot="hey"
				text={
					"Un petit coup de museau pour te demander : comment va ton monde intérieur aujourd’hui ?"
				}
			/>

			<Button title="Suivant" onPress={() => 
{}}></Button>
		</View>
	);
};

export default AskUserOk;
