import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Alert,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";

export default function RegisterScreen() {
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const { signUp } = useAuth();
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];

	const handleRegister = async () => {
		if (
			!firstName ||
			!lastName ||
			!email ||
			!password ||
			!confirmPassword
		) {
			Alert.alert("Błąd", "Proszę wypełnić wszystkie pola");
			return;
		}

		if (password !== confirmPassword) {
			Alert.alert("Błąd", "Hasła nie są identyczne");
			return;
		}

		if (password.length < 6) {
			Alert.alert("Błąd", "Hasło musi mieć co najmniej 6 znaków");
			return;
		}

		setLoading(true);
		try {
			const { error } = await signUp(
				email,
				password,
				firstName,
				lastName
			);
			if (error) {
				Alert.alert("Błąd rejestracji", error.message);
			} else {
				Alert.alert(
					"Rejestracja udana",
					"Twoje konto zostało utworzone. Możesz się teraz zalogować.",
					[
						{
							text: "OK",
							onPress: () => router.push("/login"),
						},
					]
				);
			}
		} catch (error) {
			Alert.alert("Błąd", "Wystąpił nieoczekiwany błąd");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const navigateToLogin = () => {
		router.push("/login");
	};

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.background }]}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={100}
		>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.formContainer}>
					<Text style={[styles.title, { color: colors.text }]}>
						Rejestracja
					</Text>
					<Text style={[styles.subtitle, { color: colors.icon }]}>
						Utwórz konto, aby zarządzać swoimi urodzinami i
						wydarzeniami
					</Text>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Imię
						</Text>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: colors.background,
									color: colors.text,
									borderColor: colors.icon,
								},
							]}
							placeholder="Twoje imię"
							placeholderTextColor={colors.icon}
							value={firstName}
							onChangeText={setFirstName}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Nazwisko
						</Text>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: colors.background,
									color: colors.text,
									borderColor: colors.icon,
								},
							]}
							placeholder="Twoje nazwisko"
							placeholderTextColor={colors.icon}
							value={lastName}
							onChangeText={setLastName}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Email
						</Text>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: colors.background,
									color: colors.text,
									borderColor: colors.icon,
								},
							]}
							placeholder="Twój email"
							placeholderTextColor={colors.icon}
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
							keyboardType="email-address"
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Hasło
						</Text>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: colors.background,
									color: colors.text,
									borderColor: colors.icon,
								},
							]}
							placeholder="Twoje hasło"
							placeholderTextColor={colors.icon}
							value={password}
							onChangeText={setPassword}
							secureTextEntry
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Potwierdź hasło
						</Text>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: colors.background,
									color: colors.text,
									borderColor: colors.icon,
								},
							]}
							placeholder="Potwierdź hasło"
							placeholderTextColor={colors.icon}
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							secureTextEntry
						/>
					</View>

					<TouchableOpacity
						style={[
							styles.button,
							{ backgroundColor: colors.tint },
						]}
						onPress={handleRegister}
						disabled={loading}
					>
						<Text style={styles.buttonText}>
							{loading ? "Rejestracja..." : "Zarejestruj się"}
						</Text>
					</TouchableOpacity>

					<View style={styles.loginContainer}>
						<Text
							style={[styles.loginText, { color: colors.icon }]}
						>
							Masz już konto?{" "}
						</Text>
						<TouchableOpacity onPress={navigateToLogin}>
							<Text
								style={[
									styles.loginLink,
									{ color: colors.tint },
								]}
							>
								Zaloguj się
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
	},
	formContainer: {
		padding: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		marginBottom: 32,
	},
	inputContainer: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		marginBottom: 8,
		fontWeight: "500",
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 16,
		fontSize: 16,
	},
	button: {
		height: 50,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 24,
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
	loginContainer: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 24,
	},
	loginText: {
		fontSize: 14,
	},
	loginLink: {
		fontSize: 14,
		fontWeight: "600",
	},
});
