import React, { useState, useEffect, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	SafeAreaView,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Home() {
	const { user, loading } = useAuth();
	const [loadingState, setLoadingState] = useState(false);

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
			<SafeAreaView style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>
						Witaj, {user?.first_name || ""}!
					</Text>
				</View>

				<View style={styles.content}>
					<TouchableOpacity
						style={styles.card}
						onPress={() => router.push("/birthdays")}
					>
						<Ionicons name="gift" size={48} color="#FF6B6B" />
						<Text style={styles.cardTitle}>Urodziny</Text>
						<Text style={styles.cardSubtitle}>
							Zarządzaj urodzinami
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.card}
						onPress={() => router.push("/events")}
					>
						<Ionicons name="calendar" size={48} color="#4ECDC4" />
						<Text style={styles.cardTitle}>Wydarzenia</Text>
						<Text style={styles.cardSubtitle}>
							Zarządzaj wydarzeniami
						</Text>
					</TouchableOpacity>
				</View>

				<TouchableOpacity
					style={styles.profileButton}
					onPress={() => router.push("/profile")}
				>
					<Ionicons name="person-circle" size={24} color="#333" />
					<Text style={styles.profileButtonText}>Profil</Text>
				</TouchableOpacity>
			</SafeAreaView>
		);
	}, [user, loading]);

	return content;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F7F7F7",
	},
	header: {
		padding: 20,
		backgroundColor: "#FFF",
		borderBottomWidth: 1,
		borderBottomColor: "#EEE",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
	},
	content: {
		flex: 1,
		padding: 20,
		justifyContent: "center",
	},
	card: {
		backgroundColor: "#FFF",
		borderRadius: 10,
		padding: 20,
		marginBottom: 20,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginTop: 10,
		color: "#333",
	},
	cardSubtitle: {
		fontSize: 14,
		color: "#666",
		marginTop: 5,
	},
	profileButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 15,
		backgroundColor: "#FFF",
		borderTopWidth: 1,
		borderTopColor: "#EEE",
	},
	profileButtonText: {
		marginLeft: 10,
		fontSize: 16,
		color: "#333",
	},
	text: {
		marginTop: 10,
		fontSize: 16,
		color: "#333",
	},
});
