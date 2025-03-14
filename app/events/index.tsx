import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	SafeAreaView,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Event } from "../../lib/types";
import { getEvents } from "../../lib/services/eventService";
import { EventCard } from "../../lib/components/EventCard";

export default function EventsScreen() {
	const { user, loading } = useAuth();
	const [events, setEvents] = useState<Event[]>([]);
	const [loadingData, setLoadingData] = useState(true);

	// Zdefiniuj fetchEvents jako useCallback, aby uniknąć ponownego tworzenia funkcji
	const fetchEvents = useCallback(async () => {
		if (!user) return;

		try {
			setLoadingData(true);
			const { data, error } = await getEvents(user.id);
			if (error) {
				console.error("Błąd podczas pobierania wydarzeń:", error);
				return;
			}
			setEvents(data || []);
		} catch (error) {
			console.error("Błąd podczas pobierania wydarzeń:", error);
		} finally {
			setLoadingData(false);
		}
	}, [user]);

	// Pobierz dane wydarzeń, gdy użytkownik jest zalogowany
	useEffect(() => {
		if (user) {
			fetchEvents();
		}
	}, [user, fetchEvents]);

	// Zdefiniuj handleEventPress jako useCallback
	const handleEventPress = useCallback((event: Event) => {
		router.push({
			pathname: "/events/[id]",
			params: { id: event.id },
		});
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
					<ActivityIndicator size="large" color="#0000ff" />
					<Text style={styles.text}>Ładowanie...</Text>
				</View>
			);
		}

		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => router.back()}
					>
						<Ionicons name="arrow-back" size={24} color="#333" />
					</TouchableOpacity>
					<Text style={styles.title}>Wydarzenia</Text>
					<TouchableOpacity
						style={styles.addButton}
						onPress={() => router.push("/events/new")}
					>
						<Ionicons name="add" size={24} color="#333" />
					</TouchableOpacity>
				</View>

				{loadingData ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color="#0000ff" />
						<Text style={styles.text}>Ładowanie...</Text>
					</View>
				) : (
					<FlatList
						data={events}
						keyExtractor={(item) => item.id}
						renderItem={({ item }) => (
							<EventCard
								event={item}
								onPress={handleEventPress}
							/>
						)}
						contentContainerStyle={styles.listContent}
						ListEmptyComponent={
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>
									Nie masz jeszcze żadnych wydarzeń
								</Text>
								<TouchableOpacity
									style={styles.emptyButton}
									onPress={() => router.push("/events/new")}
								>
									<Text style={styles.emptyButtonText}>
										Dodaj wydarzenie
									</Text>
								</TouchableOpacity>
							</View>
						}
					/>
				)}
			</SafeAreaView>
		);
	}, [user, loading, loadingData, events, handleEventPress]);

	return content;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F7F7F7",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 15,
		backgroundColor: "#FFF",
		borderBottomWidth: 1,
		borderBottomColor: "#EEE",
	},
	backButton: {
		padding: 5,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#333",
	},
	addButton: {
		padding: 5,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	listContent: {
		padding: 15,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	emptyText: {
		fontSize: 16,
		color: "#666",
		marginBottom: 20,
		textAlign: "center",
	},
	emptyButton: {
		backgroundColor: "#4ECDC4",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
	},
	emptyButtonText: {
		color: "#FFF",
		fontWeight: "bold",
	},
	text: {
		marginTop: 10,
		fontSize: 16,
		color: "#333",
	},
});
