import React, { useState, useEffect, useRef, useContext } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Animated,
	Dimensions,
} from "react-native";
import Mascot from "../../components/mascot";
import styles from "./BreathingScreen.style";
import colors from "../../css/colors";
import BackButton from "../../components/backNavigation";
import { AuthContext } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

const BreathingScreen = ({ navigation }: any) => {
	const { user } = useContext(AuthContext);
	const [timeLeft, setTimeLeft] = useState(300);
	const [isActive, setIsActive] = useState(false);
	const [isInhaling, setIsInhaling] = useState(true);
	const [breathingPhase, setBreathingPhase] = useState("Appuie pour commencer");

	const scaleAnim = useRef(new Animated.Value(0.5)).current;
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const isActiveRef = useRef(isActive);

	useEffect(() => {
		isActiveRef.current = isActive;
	}, [isActive]);

	// Animation du cercle de respiration
	const startBreathingAnimation = () => {
		const inhaleAnimation = () => {
			setIsInhaling(true);
			setBreathingPhase("Inspire...");
			Animated.timing(scaleAnim, {
				toValue: 1,
				duration: 4000, // 4 secondes pour inspirer
				useNativeDriver: true,
			}).start(() => {
				exhaleAnimation();
			});
		};

		const exhaleAnimation = () => {
			setIsInhaling(false);
			setBreathingPhase("Expire...");
			Animated.timing(scaleAnim, {
				toValue: 0.5,
				duration: 4000, // 4 secondes pour expirer
				useNativeDriver: true,
			}).start(() => {
				if (isActiveRef.current) {
					inhaleAnimation();
				}
			});
		};

		inhaleAnimation();
	};

	// Démarrer/arrêter l'exercice
	const toggleBreathing = () => {
		if (!isActive) {
			setIsActive(true);
			startBreathingAnimation();

			// Timer du chronomètre
			intervalRef.current = setInterval(() => {
				setTimeLeft(prev => {
					if (prev <= 1) {
						setIsActive(false);
						setBreathingPhase("Terminé ! Bien joué 🎉");
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} else {
			stopBreathing();
		}
	};

	const stopBreathing = () => {
		setIsActive(false);
		setBreathingPhase("Exercice arrêté");

		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		scaleAnim.stopAnimation();
		Animated.timing(scaleAnim, {
			toValue: 0.5,
			duration: 500,
			useNativeDriver: true,
		}).start();
	};

	const resetTimer = () => {
		stopBreathing();
		setTimeLeft(300);
		setBreathingPhase("Appuie sur commencer");
	};

	// Formater le temps en mm:ss
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	// Nettoyage à la destruction du composant
	useEffect(() => {
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	// Arrêter automatiquement quand le temps est écoulé
	useEffect(() => {
		if (timeLeft === 0 && isActive) {
			stopBreathing();
		}
	}, [timeLeft, isActive]);

	return (
		<View style={styles.container}>
			<BackButton />
			<Mascot mascot="hey" text="Reprends ton souffle..." />

			<View style={styles.timerContainer}>
				<Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
			</View>

			<View style={styles.breathingContainer}>
				<Animated.View
					style={[
						styles.breathingCircle,
						{
							transform: [{ scale: scaleAnim }],
							backgroundColor: isInhaling ? colors.secondary : colors.primary,
						},
					]}
				/>
				<Text style={styles.instructionText}>{breathingPhase}</Text>
			</View>

			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={[
						styles.button,
						isActive ? styles.stopButton : styles.startButton,
					]}
					onPress={toggleBreathing}
				>
					<Text style={styles.buttonText}>
						{isActive ? "Arrêter" : "Commencer"}
					</Text>
				</TouchableOpacity>
				{user?.hasPremium && (
					<TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
						<Text style={styles.resetButtonText}>Recommencer</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};

export default BreathingScreen;
