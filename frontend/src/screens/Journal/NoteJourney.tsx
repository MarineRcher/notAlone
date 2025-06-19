import { Text, View } from "react-native";
import Mascot from "../../components/mascot";
import Button from "../../components/button";

const NoteJourney = () => {
    return (
        <View>
            <Mascot
                mascot="hey"
                text={
                    "Prends un moment pour poser tes pensées… Raconte-moi ta journée, sans filtre, sans jugement. Tu peux tout déposer ici."
                }
            />

            <Button title="Suivant" onPress={() => {}}></Button>
        </View>
    );
};
export default NoteJourney;
