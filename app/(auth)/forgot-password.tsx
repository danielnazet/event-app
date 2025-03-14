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
import { Ionicons } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const { resetPassword } = useAuth();
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];

	const handleResetPassword = async () => {
		if (!email) {
			Alert.alert("Błąd", "Proszę podać adres email");
			return;
		}

		try {
			setLoading(true);
			const { error } = await resetPassword(email);
			if (error) {
				Alert.alert("Błąd", error.message);
			} else {
				Alert.alert(
					"Sukces",
					"Instrukcje resetowania hasła zostały wysłane na podany adres email",
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

	const goBack = () => {
		router.back();
	};

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.background }]}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={100}
		>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.formContainer}>
					<TouchableOpacity
						style={styles.backButton}
						onPress={goBack}
					>
						<Ionicons
							name="arrow-back"
							size={24}
							color={colors.text}
						/>
					</TouchableOpacity>

					<Text style={[styles.title, { color: colors.text }]}>
						Resetowanie hasła
					</Text>
					<Text style={[styles.subtitle, { color: colors.icon }]}>
						Podaj swój adres email, a wyślemy Ci instrukcje
						resetowania hasła
					</Text>

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

					<TouchableOpacity
						style={[
							styles.button,
							{ backgroundColor: colors.tint },
						]}
						onPress={handleResetPassword}
						disabled={loading}
					>
						<Text style={styles.buttonText}>
							{loading ? "Wysyłanie..." : "Wyślij instrukcje"}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.loginLink} onPress={goBack}>
						<Text
							style={[
								styles.loginLinkText,
								{ color: colors.tint },
							]}
						>
							Wróć do logowania
						</Text>
					</TouchableOpacity>
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
	backButton: {
		marginBottom: 24,
		alignSelf: "flex-start",
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
	loginLink: {
		alignSelf: "center",
		marginTop: 24,
		padding: 8,
	},
	loginLinkText: {
		fontSize: 14,
		fontWeight: "600",
	},
});
