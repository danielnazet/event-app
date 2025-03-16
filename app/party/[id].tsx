import React, { useState, useEffect, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	ScrollView,
	Alert,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { router, Redirect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

// Interfejs dla typu Party
interface Party {
	id: string;
	title: string;
	description?: string;
	date: string;
	time?: string;
	location: string;
	participants: number;
	maxParticipants?: number;
	organizer: string;
}

export default function PartyDetailsScreen() {
	const { user, loading } = useAuth();
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const { id } = useLocalSearchParams<{ id: string }>();
	
	const [party, setParty] = useState<Party | null>(null);
	const [loadingParty, setLoadingParty] = useState(true);

	useEffect(() => {
		// Symulacja pobierania danych z API
		const fetchParty = async () => {
			setLoadingParty(true);
			try {
				// Tutaj będzie kod do pobierania danych z API
				// Na razie używamy danych testowych
				await new Promise(resolve => setTimeout(resolve, 1000));
				
				// Przykładowe dane
				const dummyParty: Party = {
					id: id || '1',
					title: 'Urodziny Ani',
					description: 'Zapraszamy na urodziny Ani! Będzie dużo zabawy, muzyki i pysznego jedzenia. Prezenty mile widziane, ale najważniejsza jest Twoja obecność!',
					date: '2025-04-15',
					time: '18:00',
					location: 'Warszawa, ul. Kwiatowa 5',
					participants: 8,
					maxParticipants: 12,
					organizer: 'Jan Kowalski'
				};
				
				setParty(dummyParty);
			} catch (error) {
				console.error("Błąd podczas pobierania danych imprezy:", error);
				Alert.alert("Błąd", "Nie udało się pobrać danych imprezy");
			} finally {
				setLoadingParty(false);
			}
		};

		fetchParty();
	}, [id]);

	const handleJoin = () => {
		Alert.alert(
			"Dołącz do imprezy",
			"Czy na pewno chcesz dołączyć do tej imprezy?",
			[
				{ text: "Anuluj", style: "cancel" },
				{ 
					text: "Dołącz", 
					onPress: () => {
						// Tutaj będzie kod do dołączania do imprezy
						Alert.alert("Sukces", "Dołączyłeś do imprezy!");
					}
				}
			]
		);
	};

	const handleEdit = () => {
		// Przekierowanie do ekranu edycji
		router.push(`/party/edit/${id}` as any);
	};

	const handleDelete = () => {
		Alert.alert(
			"Usuń imprezę",
			"Czy na pewno chcesz usunąć tę imprezę? Tej operacji nie można cofnąć.",
			[
				{ text: "Anuluj", style: "cancel" },
				{ 
					text: "Usuń", 
					style: "destructive",
					onPress: () => {
						// Tutaj będzie kod do usuwania imprezy
						Alert.alert(
							"Sukces",
							"Impreza została usunięta",
							[{ text: "OK", onPress: () => router.back() }]
						);
					}
				}
			]
		);
	};

	// Renderuj komponent tylko raz, używając useMemo
	const content = useMemo(() => {
		// Jeśli użytkownik nie jest zalogowany i zakończono ładowanie, przekieruj do ekranu logowania
		if (!user && !loading) {
			return <Redirect href="/(auth)/login" />;
		}

		// Podczas ładowania pokaż wskaźnik aktywności
		if (loading || loadingParty) {
			return (
				<View style={[styles.container, { backgroundColor: colors.background }]}>
					<ActivityIndicator size="large" color={colors.tint} />
					<Text style={[styles.text, { color: colors.text }]}>Ładowanie...</Text>
				</View>
			);
		}

		if (!party) {
			return (
				<View style={[styles.container, { backgroundColor: colors.background }]}>
					<Text style={[styles.text, { color: colors.text }]}>Nie znaleziono imprezy</Text>
					<TouchableOpacity
						style={[styles.button, { backgroundColor: colors.tint }]}
						onPress={() => router.back()}
					>
						<Text style={styles.buttonText}>Wróć</Text>
					</TouchableOpacity>
				</View>
			);
		}

		return (
			<ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text }]}>{party.title}</Text>
					<View style={styles.actions}>
						<TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
							<Ionicons name="create-outline" size={24} color={colors.text} />
						</TouchableOpacity>
						<TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
							<Ionicons name="trash-outline" size={24} color={colors.text} />
						</TouchableOpacity>
					</View>
				</View>

				<View style={[styles.card, { backgroundColor: colors.card }]}>
					<View style={styles.infoRow}>
						<Ionicons name="calendar-outline" size={20} color={colors.text} />
						<Text style={[styles.infoText, { color: colors.text }]}>
							{party.date && format(new Date(party.date), "dd MMMM yyyy", { locale: pl })}
							{party.time && ` o ${party.time}`}
						</Text>
					</View>

					<View style={styles.infoRow}>
						<Ionicons name="location-outline" size={20} color={colors.text} />
						<Text style={[styles.infoText, { color: colors.text }]}>{party.location}</Text>
					</View>

					<View style={styles.infoRow}>
						<Ionicons name="people-outline" size={20} color={colors.text} />
						<Text style={[styles.infoText, { color: colors.text }]}>
							{party.participants} / {party.maxParticipants || "∞"} uczestników
						</Text>
					</View>

					<View style={styles.infoRow}>
						<Ionicons name="person-outline" size={20} color={colors.text} />
						<Text style={[styles.infoText, { color: colors.text }]}>
							Organizator: {party.organizer}
						</Text>
					</View>
				</View>

				{party.description && (
					<View style={[styles.card, { backgroundColor: colors.card }]}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>Opis</Text>
						<Text style={[styles.description, { color: colors.text }]}>
							{party.description}
						</Text>
					</View>
				)}

				<TouchableOpacity
					style={[styles.joinButton, { backgroundColor: colors.tint }]}
					onPress={handleJoin}
				>
					<Text style={styles.joinButtonText}>Dołącz do imprezy</Text>
				</TouchableOpacity>
			</ScrollView>
		);
	}, [user, loading, party, loadingParty, colors, id]);

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
		paddingTop: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		flex: 1,
	},
	actions: {
		flexDirection: "row",
	},
	actionButton: {
		padding: 8,
		marginLeft: 8,
	},
	card: {
		margin: 16,
		marginTop: 8,
		padding: 16,
		borderRadius: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	infoRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	infoText: {
		fontSize: 16,
		marginLeft: 10,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 8,
	},
	description: {
		fontSize: 16,
		lineHeight: 24,
	},
	joinButton: {
		margin: 16,
		padding: 16,
		borderRadius: 8,
		alignItems: "center",
		marginBottom: 40,
	},
	joinButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	button: {
		padding: 12,
		borderRadius: 8,
		alignItems: "center",
		margin: 16,
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	text: {
		fontSize: 16,
		marginTop: 10,
		textAlign: "center",
		padding: 16,
	},
}); 