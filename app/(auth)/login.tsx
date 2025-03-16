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
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

export default function LoginScreen() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const { signIn, createProfileIfNotExists, signOut, createTestAdminProfile } = useAuth();
	const router = useRouter();
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme];

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert("Błąd", "Proszę podać email i hasło");
			return;
		}

		setLoading(true);
		try {
			// Sprawdź, czy to konto testowe admin
			const isTestAdmin = email === "admin@admin.com" && password === "admin123";
			
			if (isTestAdmin) {
				console.log("Logowanie jako konto testowe admin");
			}
			
			// Najpierw wyczyść istniejącą sesję
			await signOut();
			
			// Następnie spróbuj zalogować się
			const { error } = await signIn(email, password);
			if (error) {
				console.error("Błąd logowania:", error);
				
				if (error.message.includes("Invalid Refresh Token") || 
					error.message.includes("Refresh Token Not Found")) {
					Alert.alert(
						"Błąd sesji", 
						"Problem z tokenem sesji. Spróbuj ponownie zalogować się."
					);
				} else {
					Alert.alert("Błąd logowania", error.message);
				}
			} else {
				try {
					// Dla konta testowego admin, użyj specjalnej funkcji
					if (isTestAdmin) {
						console.log("Używanie specjalnej funkcji dla konta testowego admin");
						await createTestAdminProfile();
						router.replace("/(tabs)");
						return;
					}
					
					// Dla innych kont, utwórz profil, jeśli nie istnieje
					const profileResult = await createProfileIfNotExists();
					
					if (profileResult.error) {
						console.error("Błąd podczas tworzenia profilu:", profileResult.error);
						
						Alert.alert(
							"Ostrzeżenie", 
							"Zalogowano, ale wystąpił problem z profilem użytkownika."
						);
					}
					
					router.replace("/(tabs)");
				} catch (profileError) {
					console.error("Błąd podczas tworzenia profilu:", profileError);
					
					// Dla konta testowego admin, kontynuuj mimo błędu
					if (isTestAdmin) {
						console.log("Kontynuowanie mimo błędu dla konta testowego admin");
						router.replace("/(tabs)");
						return;
					}
					
					Alert.alert(
						"Ostrzeżenie", 
						"Zalogowano, ale wystąpił problem z profilem użytkownika."
					);
					router.replace("/(tabs)");
				}
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
	
	const fillTestAccount = () => {
		setEmail("admin@admin.com");
		setPassword("admin123");
	};

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.background }]}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={100}
		>
			<View style={styles.formContainer}>
				<Text style={[styles.title, { color: colors.text }]}>Logowanie</Text>

				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: colors.text }]}>Email</Text>
					<TextInput
						style={[
							styles.input,
							{
								color: colors.inputText || colors.text,
								backgroundColor: colors.inputBackground || colors.background,
								borderColor: colors.border || colors.icon,
							}
						]}
						value={email}
						onChangeText={setEmail}
						placeholder="Twój email"
						placeholderTextColor={colors.icon}
						keyboardType="email-address"
						autoCapitalize="none"
					/>
				</View>

				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: colors.text }]}>Hasło</Text>
					<TextInput
						style={[
							styles.input,
							{
								color: colors.inputText || colors.text,
								backgroundColor: colors.inputBackground || colors.background,
								borderColor: colors.border || colors.icon,
							}
						]}
						value={password}
						onChangeText={setPassword}
						placeholder="Twoje hasło"
						placeholderTextColor={colors.icon}
						secureTextEntry
					/>
				</View>

				<View style={styles.forgotPasswordContainer}>
					<TouchableOpacity
						style={styles.forgotPasswordButton}
						onPress={navigateToForgotPassword}
					>
						<Text style={[styles.forgotPasswordText, { color: colors.tint }]}>
							Zapomniałeś hasła?
						</Text>
					</TouchableOpacity>
					
					<TouchableOpacity
						style={styles.testAccountButton}
						onPress={fillTestAccount}
					>
						<Text style={[styles.testAccountText, { color: colors.tint }]}>
							Użyj konta testowego
						</Text>
					</TouchableOpacity>
				</View>

				<TouchableOpacity
					style={[styles.loginButton, { backgroundColor: colors.tint }]}
					onPress={handleLogin}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="white" />
					) : (
						<Text style={styles.loginButtonText}>Zaloguj się</Text>
					)}
				</TouchableOpacity>

				<View style={styles.registerContainer}>
					<Text style={[styles.registerText, { color: colors.text }]}>
						Nie masz konta?
					</Text>
					<TouchableOpacity onPress={navigateToRegister}>
						<Text style={[styles.registerLink, { color: colors.tint }]}>
							Zarejestruj się
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
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
	},
	inputContainer: {
		marginBottom: 20,
	},
	label: {
		fontSize: 16,
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
	},
	forgotPasswordContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	forgotPasswordButton: {
		alignSelf: "flex-start",
	},
	forgotPasswordText: {
		fontSize: 14,
	},
	testAccountButton: {
		alignSelf: "flex-end",
	},
	testAccountText: {
		fontSize: 14,
	},
	loginButton: {
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
		marginRight: 5,
	},
	registerLink: {
		fontWeight: "bold",
	},
});
