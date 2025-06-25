import { Alert, TextInput, View } from "react-native";
import { useContext, useEffect, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Mascot from "../../components/mascot";
import Button from "../../components/button";
import journalService from "../../api/journalService";
import { NavigationParams } from "../../types/journal";
import Input from "../../components/input";
import { AuthContext } from "../../context/AuthContext";
import BackButton from "../../components/backNavigation";
import styles from "./Journal.style";

type Props = NativeStackScreenProps<any, "Note">;

const NoteJourneyScreen = ({ navigation, route }: Props) => {
    const { user } = useContext(AuthContext);
    const [note, setNote] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [journalData, setJournalData] = useState<NavigationParams | null>(
        null
    );
    const [showPopup, setShowPopup] = useState(false);
    const [popupData, setPopupData] = useState({
        message: "",
        totalPoints: 0,
    });

    useEffect(() => {
        const params = route.params as NavigationParams;
        if (params) {
            setJournalData(params);
            const previousNote = params.existingData?.journal?.note;
            if (previousNote) setNote(previousNote);
        }
    }, [route.params]);
    if (showPopup) {
        Alert.alert(
            "Points ajoutés 🎉",
            `${popupData.message}\nPoints totaux: ${popupData.totalPoints}`,
            [{ text: "OK", onPress: () => setShowPopup(false) }]
        );
    }
    const handleNext = async () => {
        if (!journalData?.journalId) return;
        if (!note) {
            setNote("Écris ce que tu ressens, ce que tu veux...");
        }
        setIsLoading(true);
        try {
            await journalService.addNotes({
                id_journal: journalData.journalId,
                note: note,
            });
            const response = await journalService.addPoints({
                id_journal: journalData.journalId,
            });
            const { message, totalPoints } = response.data;

            setPopupData({ message, totalPoints });
            setShowPopup(true);
            navigation.navigate("Main", { screen: "Follow" });
        } catch (err) {
            console.error("Erreur lors de l'enregistrement des notes:", err);
        } finally {
            setIsLoading(false);
        }
    };
    if (!user?.hasPremium) {
        return (
            <View style={styles.page}>
                <Mascot
                    mascot="hey"
                    text="Cette fonctionnalité est réservée aux utilisateurs Premium ✨"
                />
                <Button
                    title="Passer"
                    onPress={() =>
                        navigation.navigate("Main", { screen: "Follow" })
                    }
                />
            </View>
        );
    } else {
        return (
            <View style={styles.page}>
                <BackButton />
                <Mascot
                    mascot="hey"
                    text="Prends un moment pour poser tes pensées… Raconte-moi ta journée, sans filtre, sans jugement. Tu peux tout déposer ici."
                />

                <Input
                    placeholder="Écris ce que tu ressens, ce que tu veux..."
                    value={note}
                    onChangeText={setNote}
                    style={{ height: 100 }}
                    multiline
                />

                <Button
                    title={isLoading ? "Enregistrement..." : "Terminer"}
                    onPress={handleNext}
                    disabled={isLoading}
                />
            </View>
        );
    }
};

export default NoteJourneyScreen;
