import React, { useState, useEffect, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	SafeAreaView,
	useColorScheme,
	Pressable,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Home() {
	const { user, loading } = useAuth();
	const [loadingState, setLoadingState] = useState(false);
	const colorScheme = useColorScheme();
	const isDarkMode = colorScheme === 'dark';

	// Renderuj komponent tylko raz, używając useMemo
	const content = useMemo(() => {
		// Jeśli użytkownik nie jest zalogowany i zakończono ładowanie, przekieruj do ekranu logowania
		if (!user && !loading) {
			return <Redirect href="/(auth)/login" />;
		}

		// Podczas ładowania pokaż wskaźnik aktywności
		if (loading) {
			return (
				<View style={styles.container}>
					<ActivityIndicator size="large" color="#0000ff" />
					<Text style={styles.text}>Ładowanie...</Text>
				</View>
			);
		}

		// Główny widok
		return (
			<SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
				<View style={[styles.header, isDarkMode && styles.headerDark]}>
					<Text style={[styles.title, isDarkMode && styles.titleDark]}>
						Witaj, {user?.first_name || ""}!
					</Text>
				</View>

				<View style={styles.content}>
					<Pressable
						style={({ pressed }) => [
							styles.card,
							isDarkMode && styles.cardDark,
							pressed && styles.cardPressed,
							pressed && isDarkMode && styles.cardPressedDark
						]}
						onPress={() => router.push("/birthdays")}
					>
						<View style={styles.cardContent}>
							<Ionicons name="gift" size={48} color="#FF6B6B" />
							<Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
								Urodziny
							</Text>
							<Text style={[styles.cardSubtitle, isDarkMode && styles.cardSubtitleDark]}>
								Zarządzaj urodzinami
							</Text>
						</View>
					</Pressable>

					<Pressable
						style={({ pressed }) => [
							styles.card,
							isDarkMode && styles.cardDark,
							pressed && styles.cardPressed,
							pressed && isDarkMode && styles.cardPressedDark
						]}
						onPress={() => router.push("/events")}
					>
						<View style={styles.cardContent}>
							<Ionicons name="calendar" size={48} color="#4ECDC4" />
							<Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
								Wydarzenia
							</Text>
							<Text style={[styles.cardSubtitle, isDarkMode && styles.cardSubtitleDark]}>
								Zarządzaj wydarzeniami
							</Text>
						</View>
					</Pressable>
					
					<Pressable
						style={({ pressed }) => [
							styles.card,
							isDarkMode && styles.cardDark,
							pressed && styles.cardPressed,
							pressed && isDarkMode && styles.cardPressedDark
						]}
						onPress={() => router.push("/party")}
					>
						<View style={styles.cardContent}>
							<Ionicons name="people" size={48} color="#6C5CE7" />
							<Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
								Imprezy
							</Text>
							<Text style={[styles.cardSubtitle, isDarkMode && styles.cardSubtitleDark]}>
								Zarządzaj imprezami
							</Text>
						</View>
					</Pressable>
				</View>

				<Pressable
					style={({ pressed }) => [
						styles.profileButton,
						isDarkMode && styles.profileButtonDark,
						pressed && styles.profileButtonPressed,
						pressed && isDarkMode && styles.profileButtonPressedDark
					]}
					onPress={() => router.push("/profile")}
				>
					<View style={styles.profileContent}>
						<Ionicons name="person-circle" size={24} color={isDarkMode ? "#FFF" : "#333"} />
						<Text style={[styles.profileButtonText, isDarkMode && styles.profileButtonTextDark]}>
							Profil
						</Text>
					</View>
				</Pressable>
			</SafeAreaView>
		);
	}, [user, loading, isDarkMode]);

	return content;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F7F7F7",
	},
	containerDark: {
		backgroundColor: "#1A1A1A",
	},
	header: {
		padding: 20,
		backgroundColor: "#FFF",
		borderBottomWidth: 1,
		borderBottomColor: "#EEE",
	},
	headerDark: {
		backgroundColor: "#2A2A2A",
		borderBottomColor: "#333",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
	},
	titleDark: {
		color: "#FFF",
	},
	content: {
		flex: 1,
		padding: 20,
		justifyContent: "center",
	},
	cardContent: {
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center',
	},
	card: {
		backgroundColor: "#FFF",
		borderRadius: 10,
		padding: 20,
		marginBottom: 20,
		width: '100%',
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
		borderWidth: 1,
		borderColor: "#EEE",
	},
	cardDark: {
		backgroundColor: "#2A2A2A",
		shadowColor: "#000",
		shadowOpacity: 0.3,
		borderColor: "#333",
	},
	cardPressed: {
		backgroundColor: "#F0F0F0",
		opacity: 0.8,
	},
	cardPressedDark: {
		backgroundColor: "#1A1A1A",
		opacity: 0.8,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginTop: 10,
		color: "#333",
		textAlign: "center",
		includeFontPadding: false,
		textAlignVertical: "center",
	},
	cardTitleDark: {
		color: "#FFF",
	},
	cardSubtitle: {
		fontSize: 14,
		color: "#666",
		marginTop: 5,
		textAlign: "center",
		includeFontPadding: false,
		textAlignVertical: "center",
	},
	cardSubtitleDark: {
		color: "#AAA",
	},
	profileContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	profileButton: {
		width: '100%',
		padding: 15,
		backgroundColor: "#FFF",
		borderTopWidth: 1,
		borderTopColor: "#EEE",
	},
	profileButtonDark: {
		backgroundColor: "#2A2A2A",
		borderTopColor: "#333",
	},
	profileButtonPressed: {
		backgroundColor: "#F0F0F0",
		opacity: 0.8,
	},
	profileButtonPressedDark: {
		backgroundColor: "#1A1A1A",
		opacity: 0.8,
	},
	profileButtonText: {
		marginLeft: 10,
		fontSize: 16,
		color: "#333",
		includeFontPadding: false,
		textAlignVertical: "center",
	},
	profileButtonTextDark: {
		color: "#FFF",
	},
	text: {
		marginTop: 10,
		fontSize: 16,
		color: "#333",
	},
});
