import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	Alert,
	Image,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createEvent, uploadEventImage } from "../../lib/services/eventService";
import { scheduleEventNotifications } from "../../lib/services/notificationService";
import { useLocalSearchParams } from "expo-router";

// Rozszerzamy typ Colors o brakujące właściwości
declare module "@/constants/Colors" {
	interface ColorTheme {
		border: string;
		card: string;
		inputText: string;
		inputBackground: string;
	}
}

export default function EventFormScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { user } = useAuth();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';
	const colors = Colors[colorScheme ?? "light"];
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [date, setDate] = useState(new Date());
	const [time, setTime] = useState(new Date());
	const [location, setLocation] = useState("");
	const [imageUri, setImageUri] = useState<string | undefined>(undefined);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleSave = async () => {
		if (!user) {
			Alert.alert("Błąd", "Musisz być zalogowany");
			return;
		}

		if (!title) {
			Alert.alert("Błąd", "Tytuł jest wymagany");
			return;
		}

		try {
			setLoading(true);
			
			// Przygotowujemy dane wydarzenia zgodnie z nowym schematem bazy danych
			const eventData = {
				user_id: user.id,
				title: title,
				description: description,
				date: format(date, "yyyy-MM-dd"),
			};

			console.log("Dane wydarzenia do zapisania:", eventData);

			// Tworzenie nowego wydarzenia
			const result = await createEvent(eventData);

			if (result.error) {
				console.error("Błąd podczas zapisywania wydarzenia:", result.error);
				Alert.alert("Błąd", "Nie udało się zapisać wydarzenia: " + (result.error.message || "Nieznany błąd"));
				return;
			}

			console.log("Wydarzenie zapisane pomyślnie:", result.data);

			// Zaplanuj powiadomienia tylko jeśli wydarzenie zostało pomyślnie utworzone
			if (result.data && result.data.id) {
				try {
					await scheduleEventNotifications(result.data);
					console.log("Powiadomienia zaplanowane pomyślnie");
				} catch (notificationError) {
					console.error("Błąd podczas planowania powiadomień:", notificationError);
					// Nie przerywamy procesu, jeśli powiadomienia nie mogą być zaplanowane
				}
			}

			Alert.alert("Dodano", "Wydarzenie zostało dodane", [
				{
					text: "OK",
					onPress: () => router.back(),
				},
			]);
		} catch (error) {
			console.error("Błąd podczas zapisywania wydarzenia:", error);
			Alert.alert("Błąd", "Wystąpił nieoczekiwany błąd: " + (error instanceof Error ? error.message : "Nieznany błąd"));
		} finally {
			setLoading(false);
		}
	};

	const pickImage = async () => {
		try {
			const permissionResult =
				await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (!permissionResult.granted) {
				Alert.alert(
					"Brak uprawnień",
					"Potrzebujemy dostępu do galerii, aby wybrać zdjęcie"
				);
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [16, 9],
				quality: 0.8,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				setImageUri(result.assets[0].uri);
			}
		} catch (error) {
			console.error("Błąd podczas wybierania obrazu:", error);
			Alert.alert("Błąd", "Nie udało się wybrać obrazu");
		}
	};

	const handleDateChange = (event: any, selectedDate?: Date) => {
		setShowDatePicker(false);
		if (selectedDate) {
			setDate(selectedDate);
		}
	};

	const handleTimeChange = (event: any, selectedTime?: Date) => {
		setShowTimePicker(false);
		if (selectedTime) {
			setTime(selectedTime);
		}
	};

	const formatDisplayDate = (date: Date) => {
		return format(date, "d MMMM yyyy", { locale: pl });
	};

	const formatDisplayTime = (time: Date) => {
		return format(time, "HH:mm");
	};

	// Dodajemy brakujące właściwości do obiektu colors
	const extendedColors = {
		...colors,
		border: colors.border || colors.icon,
		card: colors.card || colors.background,
		inputText: colors.inputText || colors.text,
		inputBackground: colors.inputBackground || colors.background,
	};

	return (
		<KeyboardAvoidingView
			style={[
				styles.container,
				{ backgroundColor: isDark ? '#000000' : colors.background }
			]}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={100}
		>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.header}>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => router.back()}
					>
						<Ionicons
							name="arrow-back"
							size={24}
							color={colors.text}
						/>
					</TouchableOpacity>
					<Text
						style={[styles.title, { color: colors.text }]}
					>
						Dodaj wydarzenie
					</Text>
					<View style={styles.placeholder} />
				</View>

				<View style={styles.formContainer}>
					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Tytuł
						</Text>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: isDark ? '#1a1a1a' : colors.background,
									color: colors.text,
									borderColor: isDark ? '#333' : colors.icon,
								},
							]}
							value={title}
							onChangeText={setTitle}
							placeholder="Nazwa wydarzenia"
							placeholderTextColor={isDark ? '#666' : colors.icon}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Data
						</Text>
						<TouchableOpacity
							style={[
								styles.dateInput,
								{
									backgroundColor: isDark ? '#1a1a1a' : colors.background,
									borderColor: isDark ? '#333' : colors.icon,
								},
							]}
							onPress={() => setShowDatePicker(true)}
						>
							<Text style={{ color: colors.text }}>
								{formatDisplayDate(date)}
							</Text>
							<Ionicons
								name="calendar"
								size={20}
								color={isDark ? '#666' : colors.icon}
							/>
						</TouchableOpacity>
						{showDatePicker && (
							<DateTimePicker
								value={date}
								mode="date"
								display="default"
								onChange={handleDateChange}
							/>
						)}
					</View>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Godzina
						</Text>
						<TouchableOpacity
							style={[
								styles.dateInput,
								{
									backgroundColor: isDark ? '#1a1a1a' : colors.background,
									borderColor: isDark ? '#333' : colors.icon,
								},
							]}
							onPress={() => setShowTimePicker(true)}
						>
							<Text style={{ color: colors.text }}>
								{time ? format(time, "HH:mm") : "Wybierz godzinę"}
							</Text>
							<Ionicons
								name="time"
								size={20}
								color={isDark ? '#666' : colors.icon}
							/>
						</TouchableOpacity>
						{showTimePicker && (
							<DateTimePicker
								value={time || new Date()}
								mode="time"
								display="default"
								onChange={handleTimeChange}
							/>
						)}
					</View>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Opis (opcjonalnie)
						</Text>
						<TextInput
							style={[
								styles.input,
								styles.textArea,
								{
									backgroundColor: isDark ? '#1a1a1a' : colors.background,
									color: colors.text,
									borderColor: isDark ? '#333' : colors.icon,
								},
							]}
							value={description}
							onChangeText={setDescription}
							placeholder="Dodatkowe informacje"
							placeholderTextColor={isDark ? '#666' : colors.icon}
							multiline
							numberOfLines={4}
							textAlignVertical="top"
						/>
					</View>

					<TouchableOpacity
						style={[
							styles.button,
							{ backgroundColor: colors.tint },
						]}
						onPress={handleSave}
						disabled={loading}
					>
						<Text style={styles.buttonText}>
							{loading ? "Zapisywanie..." : "Zapisz"}
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
		padding: 16,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 24,
	},
	backButton: {
		padding: 8,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
	},
	placeholder: {
		width: 40,
	},
	formContainer: {
		flex: 1,
	},
	inputContainer: {
		marginBottom: 20,
	},
	label: {
		fontSize: 16,
		fontWeight: "500",
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
	},
	dateInput: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	dateText: {
		fontSize: 16,
	},
	textArea: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		minHeight: 100,
	},
	imageContainer: {
		marginBottom: 20,
	},
	imagePicker: {
		borderWidth: 1,
		borderRadius: 8,
		borderStyle: "dashed",
		padding: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	imagePickerText: {
		marginTop: 8,
		fontSize: 16,
	},
	imagePreviewContainer: {
		alignItems: "center",
	},
	imagePreview: {
		width: "100%",
		height: 200,
		borderRadius: 8,
		marginBottom: 8,
	},
	changeImageButton: {
		padding: 8,
	},
	changeImageText: {
		fontSize: 16,
		fontWeight: "500",
	},
	button: {
		borderRadius: 8,
		padding: 16,
		alignItems: "center",
		marginTop: 16,
	},
	buttonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: "bold",
	},
	disabledButton: {
		opacity: 0.7,
	},
});
