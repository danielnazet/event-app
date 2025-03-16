import React, { useState, useMemo } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Alert,
	Platform,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { router, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function NewPartyScreen() {
	const { user, loading } = useAuth();
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [location, setLocation] = useState("");
	const [date, setDate] = useState(new Date());
	const [time, setTime] = useState(new Date());
	const [maxParticipants, setMaxParticipants] = useState("");
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		if (!user) {
			Alert.alert("Błąd", "Musisz być zalogowany");
			return;
		}

		if (!title) {
			Alert.alert("Błąd", "Tytuł jest wymagany");
			return;
		}

		setIsSaving(true);
		try {
			// Tutaj będzie kod do zapisywania imprezy w bazie danych
			// Na razie tylko symulujemy zapisywanie
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			Alert.alert(
				"Sukces",
				"Impreza została dodana",
				[{ text: "OK", onPress: () => router.back() }]
			);
		} catch (error) {
			console.error("Błąd podczas zapisywania imprezy:", error);
			Alert.alert("Błąd", "Wystąpił nieoczekiwany błąd");
		} finally {
			setIsSaving(false);
		}
	};

	const onDateChange = (event: any, selectedDate?: Date) => {
		const currentDate = selectedDate || date;
		setShowDatePicker(Platform.OS === "ios");
		setDate(currentDate);
	};

	const onTimeChange = (event: any, selectedTime?: Date) => {
		const currentTime = selectedTime || time;
		setShowTimePicker(Platform.OS === "ios");
		setTime(currentTime);
	};

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
			<ScrollView 
				style={[styles.container, { backgroundColor: colors.background }]}
				contentContainerStyle={styles.contentContainer}
			>
				<View style={styles.formGroup}>
					<Text style={[styles.label, { color: colors.text }]}>Tytuł</Text>
					<TextInput
						style={[
							styles.input,
							{ backgroundColor: colors.card, color: colors.text },
						]}
						value={title}
						onChangeText={setTitle}
						placeholder="Nazwa imprezy"
						placeholderTextColor={colors.text + "80"}
					/>
				</View>

				<View style={styles.formGroup}>
					<Text style={[styles.label, { color: colors.text }]}>Opis</Text>
					<TextInput
						style={[
							styles.input,
							styles.textArea,
							{ backgroundColor: colors.card, color: colors.text },
						]}
						value={description}
						onChangeText={setDescription}
						placeholder="Opis imprezy"
						placeholderTextColor={colors.text + "80"}
						multiline
						numberOfLines={4}
					/>
				</View>

				<View style={styles.formGroup}>
					<Text style={[styles.label, { color: colors.text }]}>Lokalizacja</Text>
					<TextInput
						style={[
							styles.input,
							{ backgroundColor: colors.card, color: colors.text },
						]}
						value={location}
						onChangeText={setLocation}
						placeholder="Adres imprezy"
						placeholderTextColor={colors.text + "80"}
					/>
				</View>

				<View style={styles.formGroup}>
					<Text style={[styles.label, { color: colors.text }]}>Data</Text>
					<TouchableOpacity
						style={[
							styles.input,
							{ backgroundColor: colors.card, flexDirection: "row", alignItems: "center" },
						]}
						onPress={() => setShowDatePicker(true)}
					>
						<Text style={{ color: colors.text }}>
							{format(date, "dd MMMM yyyy", { locale: pl })}
						</Text>
						<Ionicons name="calendar" size={20} color={colors.text} style={{ marginLeft: 10 }} />
					</TouchableOpacity>
					{showDatePicker && (
						<DateTimePicker
							value={date}
							mode="date"
							display="default"
							onChange={onDateChange}
						/>
					)}
				</View>

				<View style={styles.formGroup}>
					<Text style={[styles.label, { color: colors.text }]}>Godzina</Text>
					<TouchableOpacity
						style={[
							styles.input,
							{ backgroundColor: colors.card, flexDirection: "row", alignItems: "center" },
						]}
						onPress={() => setShowTimePicker(true)}
					>
						<Text style={{ color: colors.text }}>
							{format(time, "HH:mm")}
						</Text>
						<Ionicons name="time" size={20} color={colors.text} style={{ marginLeft: 10 }} />
					</TouchableOpacity>
					{showTimePicker && (
						<DateTimePicker
							value={time}
							mode="time"
							display="default"
							onChange={onTimeChange}
						/>
					)}
				</View>

				<View style={styles.formGroup}>
					<Text style={[styles.label, { color: colors.text }]}>Maksymalna liczba uczestników</Text>
					<TextInput
						style={[
							styles.input,
							{ backgroundColor: colors.card, color: colors.text },
						]}
						value={maxParticipants}
						onChangeText={setMaxParticipants}
						placeholder="Liczba uczestników"
						placeholderTextColor={colors.text + "80"}
						keyboardType="number-pad"
					/>
				</View>

				<TouchableOpacity
					style={[styles.saveButton, { backgroundColor: colors.tint }]}
					onPress={handleSave}
					disabled={isSaving}
				>
					{isSaving ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.saveButtonText}>Zapisz</Text>
					)}
				</TouchableOpacity>
			</ScrollView>
		);
	}, [
		user,
		loading,
		title,
		description,
		location,
		date,
		time,
		maxParticipants,
		showDatePicker,
		showTimePicker,
		isSaving,
		colors,
	]);

	return content;
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {
		padding: 16,
		paddingTop: 20,
	},
	formGroup: {
		marginBottom: 16,
	},
	label: {
		fontSize: 16,
		marginBottom: 8,
		fontWeight: "500",
	},
	input: {
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
	},
	textArea: {
		height: 100,
		textAlignVertical: "top",
	},
	saveButton: {
		borderRadius: 8,
		padding: 16,
		alignItems: "center",
		marginTop: 24,
		marginBottom: 40,
	},
	saveButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	text: {
		fontSize: 16,
		marginTop: 10,
	},
}); 