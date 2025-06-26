import { Linking, Text, TouchableOpacity, View, Image } from "react-native";
import styles from "./presentLink.style";
import apiConfig from "../config/api";

type Props = {
	link: {
		id: string;
		name: string;
		resume: string;
		link: string;
		image_url: string | null;
	};
};

const PresentLink = ({ link }: Props) => {
	const getImageUrl = (imageUrl: string | null) => {
		if (!imageUrl) return null;

		if (imageUrl.startsWith("http")) {
			return imageUrl;
		}

		return `${apiConfig.baseURL}${imageUrl}`;
	};

	const fullImageUrl = getImageUrl(link.image_url);
	return (
		<TouchableOpacity
			onPress={() => Linking.openURL(link.link)}
			style={styles.container}
		>
			{fullImageUrl && (
				<Image
					source={{ uri: fullImageUrl }}
					style={styles.image}
					resizeMode="cover"
				/>
			)}
			<View style={styles.containerContent}>
				<Text style={styles.h3}>{link.name}</Text>
				<Text style={styles.p}>{link.resume}</Text>
			</View>
		</TouchableOpacity>
	);
};

export default PresentLink;
