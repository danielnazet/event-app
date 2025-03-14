import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	Alert,
	ActivityIndicator,
	ScrollView,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { useRouter } from "expo-router";

export default function LoginScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const { signIn, createProfileIfNotExists } = useAuth();
	const router = useRouter();

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert("Błąd", "Proszę podać email i hasło");
			return;
		}

		setLoading(true);
		try {
			const { error } = await signIn(email, password);
			if (error) {
				Alert.alert("Błąd logowania", error.message);
			} else {
				await createProfileIfNotExists();
				router.replace("/(tabs)");
			}
		} catch (error) {
			console.error("Nieoczekiwany błąd podczas logowania:", error);
			Alert.alert(
				"Błąd",
				"Wystąpił nieoczekiwany błąd podczas logowania"
			);
		} finally {
			setLoading(false);
		}
	};

	const navigateToRegister = () => {
		router.push("/register");
	};

	const navigateToForgotPassword = () => {
		router.push("/forgot-password");
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={100}
		>
			<View style={styles.formContainer}>
				<Text style={styles.title}>Logowanie</Text>

				<View style={styles.inputContainer}>
					<Text style={styles.label}>Email</Text>
					<TextInput
						style={styles.input}
						value={email}
						onChangeText={setEmail}
						placeholder="Twój email"
						keyboardType="email-address"
						autoCapitalize="none"
					/>
				</View>

				<View style={styles.inputContainer}>
					<Text style={styles.label}>Hasło</Text>
					<TextInput
						style={styles.input}
						value={password}
						onChangeText={setPassword}
						placeholder="Twoje hasło"
						secureTextEntry
					/>
				</View>

				<TouchableOpacity
					style={styles.forgotPasswordButton}
					onPress={navigateToForgotPassword}
				>
					<Text style={styles.forgotPasswordText}>
						Zapomniałeś hasła?
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.loginButton}
					onPress={handleLogin}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.loginButtonText}>Zaloguj się</Text>
					)}
				</TouchableOpacity>

				<View style={styles.registerContainer}>
					<Text style={styles.registerText}>
						Nie masz jeszcze konta?
					</Text>
					<TouchableOpacity onPress={navigateToRegister}>
						<Text style={styles.registerLink}>Zarejestruj się</Text>
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F7F7F7",
	},
	formContainer: {
		flex: 1,
		padding: 20,
		justifyContent: "center",
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 30,
		textAlign: "center",
		color: "#333",
	},
	inputContainer: {
		marginBottom: 20,
	},
	label: {
		fontSize: 16,
		marginBottom: 8,
		color: "#333",
	},
	input: {
		backgroundColor: "#FFF",
		borderWidth: 1,
		borderColor: "#DDD",
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
	},
	forgotPasswordButton: {
		alignSelf: "flex-end",
		marginBottom: 20,
	},
	forgotPasswordText: {
		color: "#4ECDC4",
		fontSize: 14,
	},
	loginButton: {
		backgroundColor: "#4ECDC4",
		borderRadius: 8,
		padding: 15,
		alignItems: "center",
		marginBottom: 20,
	},
	loginButtonText: {
		color: "#FFF",
		fontSize: 16,
		fontWeight: "bold",
	},
	registerContainer: {
		flexDirection: "row",
		justifyContent: "center",
	},
	registerText: {
		color: "#666",
		marginRight: 5,
	},
	registerLink: {
		color: "#4ECDC4",
		fontWeight: "bold",
	},
});
