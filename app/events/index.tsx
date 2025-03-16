import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	SafeAreaView,
	ScrollView,
	Image,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Event } from "../../lib/types";
import { getEvents } from "../../lib/services/eventService";
import { EventCard } from "../../lib/components/EventCard";
import { useColorScheme } from "react-native";
import { Colors } from "../../lib/constants/Colors";
import { formatEventDate } from "../../lib/utils/dateUtils";

export default function EventsScreen() {
	const { user, loading } = useAuth();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';
	const colors = Colors[colorScheme ?? "light"];
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
		if (!user && !loading) {
			return <Redirect href="/(auth)/login" />;
		}

		if (loading) {
			return (
				<View style={[styles.container, { backgroundColor: isDark ? '#000000' : colors.background }]}>
					<ActivityIndicator size="large" color={colors.tint} />
					<Text style={[styles.text, { color: colors.text }]}>Ładowanie...</Text>
				</View>
			);
		}

		return (
			<SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : colors.background }]}>
				<View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#FFF', borderBottomColor: isDark ? '#333' : '#EEE' }]}>
					<Text style={[styles.title, { color: colors.text }]}>Wydarzenia</Text>
					<TouchableOpacity
						style={styles.addButton}
						onPress={() => router.push("/events/new")}
					>
						<Ionicons name="add" size={24} color={colors.text} />
					</TouchableOpacity>
				</View>

				{loadingData ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={colors.tint} />
						<Text style={[styles.text, { color: colors.text }]}>Ładowanie...</Text>
					</View>
				) : (
					<FlatList
						data={events}
						keyExtractor={(item) => item.id}
						renderItem={({ item }) => (
							<EventCard
								event={item}
								onPress={handleEventPress}
								isDark={isDark}
							/>
						)}
						contentContainerStyle={styles.listContent}
						ListEmptyComponent={
							<View style={styles.emptyContainer}>
								<Text style={[styles.emptyText, { color: colors.text }]}>
									Nie masz jeszcze żadnych wydarzeń
								</Text>
								<TouchableOpacity
									style={[styles.emptyButton, { backgroundColor: colors.tint }]}
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
	}, [user, loading, loadingData, events, handleEventPress, isDark, colors]);

	return content;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 15,
		borderBottomWidth: 1,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
	},
	addButton: {
		padding: 8,
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
		marginBottom: 20,
		textAlign: "center",
	},
	emptyButton: {
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
	},
});
