import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Mascot from "../components/mascot";
import styles from "./HomeScreen.style";
import CheckCircle from "../../assets/icons/check-circle.svg";
import User from "../../assets/icons/menu/user.svg";
import Plus from "../../assets/icons/plus-white.svg";
import Phone from "../../assets/icons/phone.svg";
import GroupUsers from "../../assets/icons/user-group.svg";
import colors from "../css/colors";

const HomeScreen = (navigation) => {
    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Mascot + texte motivant */}
            <View style={styles.container}>
                <Mascot
                    mascot="woaw"
                    text="{X} jours de victoire, petit à petit… et je suis là pour les suivants."
                />
            </View>

            {/* Ligne du haut divisée en 2 */}
            <View style={styles.topRow}>
                {/* Vos badges - moitié gauche */}
                <View style={styles.leftBox}>
                    <View style={styles.iconWrapper}>
                        <CheckCircle width={36} height={36} />
                    </View>
                    <Text style={styles.squaresText}>Vos badges</Text>
                </View>

                {/* Colonne droite avec deux blocs */}
                <View style={styles.rightColumn}>
                    <View style={styles.group}>
                        <GroupUsers width={36} height={36} />
                        <Text style={styles.userText}>Cercle de parole</Text>
                    </View>
                    <View style={styles.user}>
                        <User width={36} height={36} />
                        <Text style={styles.squaresText}>
                            Parler avec votre parain
                        </Text>
                    </View>
                </View>
            </View>

            {/* Ajouter une addiction */}
            <View style={styles.addiction}>
                <Plus width={36} height={36} fill={colors.background} />
                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate("AddUserAddiction");
                    }}
                >
                    <Text style={styles.userText}>Ajouter une addiction</Text>
                </TouchableOpacity>
            </View>

            {/* Appel anonyme */}
            <View style={styles.number}>
                <Phone width={36} height={36} />
                <Text style={styles.squaresText}>
                    Appeller une aide anonyme
                </Text>
            </View>
        </ScrollView>
    );
};

export default HomeScreen;
