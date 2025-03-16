import React, { useState, useEffect, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	SafeAreaView,
	FlatList,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

// Interfejs dla typu Party
interface Party {
	id: string;
	title: string;
	date: string;
	location: string;
	participants: number;
}

export default function PartyScreen() {
	const { user, loading } = useAuth();
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const [loadingParties, setLoadingParties] = useState(false);
	const [parties, setParties] = useState<Party[]>([]);

	// Przykładowe dane imprez
	const dummyParties: Party[] = [
		{
			id: '1',
			title: 'Urodziny Ani',
			date: '2025-04-15',
			location: 'Warszawa, ul. Kwiatowa 5',
			participants: 12
		},
		{
			id: '2',
			title: 'Impreza firmowa',
			date: '2025-05-20',
			location: 'Kraków, ul. Długa 10',
			participants: 45
		},
		{
			id: '3',
			title: 'Spotkanie klasowe',
			date: '2025-06-10',
			location: 'Gdańsk, ul. Morska 15',
			participants: 25
		}
	];

	useEffect(() => {
		// Tutaj można dodać pobieranie danych z API
		setParties(dummyParties);
	}, []);

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
					<ActivityIndicator size="large" color={colors.tint} />
					<Text style={[styles.text, { color: colors.text }]}>Ładowanie...</Text>
				</View>
			);
		}

		return (
			<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text }]}>Imprezy</Text>
					<TouchableOpacity
						style={styles.addButton}
						onPress={() => router.push("/party/new" as any)}
					>
						<Ionicons name="add" size={24} color={colors.text} />
					</TouchableOpacity>
				</View>

				{loadingParties ? (
					<ActivityIndicator size="large" color={colors.tint} />
				) : (
					<FlatList
						data={parties}
						keyExtractor={(item) => item.id}
						renderItem={({ item }) => (
							<TouchableOpacity
								style={[styles.card, { backgroundColor: colors.card }]}
								onPress={() => router.push(`/party/${item.id}` as any)}
							>
								<View style={styles.cardHeader}>
									<Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
									<Ionicons name="people" size={20} color={colors.text} />
									<Text style={[styles.participants, { color: colors.text }]}>{item.participants}</Text>
								</View>
								<View style={styles.cardDetails}>
									<View style={styles.detailRow}>
										<Ionicons name="calendar-outline" size={16} color={colors.text} />
										<Text style={[styles.detailText, { color: colors.text }]}>{item.date}</Text>
									</View>
									<View style={styles.detailRow}>
										<Ionicons name="location-outline" size={16} color={colors.text} />
										<Text style={[styles.detailText, { color: colors.text }]}>{item.location}</Text>
									</View>
								</View>
							</TouchableOpacity>
						)}
						contentContainerStyle={styles.listContent}
					/>
				)}
			</SafeAreaView>
		);
	}, [user, loading, parties, loadingParties, colors]);

	return content;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 16,
		paddingTop: 60,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
	},
	text: {
		fontSize: 16,
		marginTop: 10,
	},
	addButton: {
		padding: 8,
	},
	listContent: {
		padding: 16,
	},
	card: {
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	cardHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "bold",
		flex: 1,
	},
	participants: {
		fontSize: 14,
		marginLeft: 4,
	},
	cardDetails: {
		marginTop: 8,
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 4,
	},
	detailText: {
		fontSize: 14,
		marginLeft: 8,
	},
}); 