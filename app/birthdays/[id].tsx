import React, { useState, useEffect } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { format, parse } from "date-fns";
import { pl } from "date-fns/locale";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Birthday } from "../../lib/types";
import {
	createBirthday,
	getBirthdayById,
	updateBirthday,
	uploadBirthdayImage,
} from "../../lib/services/birthdayService";
import { scheduleBirthdayNotifications } from "../../lib/services/notificationService";

// Rozszerzamy typ Colors o brakujące właściwości
declare module "@/constants/Colors" {
	interface ColorTheme {
		border: string;
		card: string;
	}
}

export default function BirthdayFormScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { user } = useAuth();
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];
	const [name, setName] = useState("");
	const [date, setDate] = useState(new Date());
	const [notes, setNotes] = useState("");
	const [imageUri, setImageUri] = useState<string | undefined>(undefined);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [loading, setLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	useEffect(() => {
		if (id) {
			setIsEditing(true);
			fetchBirthday(id);
		}
	}, [id]);

	const fetchBirthday = async (birthdayId: string) => {
		try {
			setLoading(true);
			const { data, error } = await getBirthdayById(birthdayId);
			if (error) {
				Alert.alert("Błąd", "Nie udało się pobrać danych urodzin");
				return;
			}
			if (data) {
				setName(data.person_name);
				setDate(parse(data.date, "yyyy-MM-dd", new Date()));
				setNotes(data.notes || "");
				setImageUri(data.image_url || undefined);
			}
		} catch (error) {
			console.error("Błąd podczas pobierania urodzin:", error);
			Alert.alert("Błąd", "Wystąpił nieoczekiwany błąd");
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		if (!user) {
			Alert.alert("Błąd", "Musisz być zalogowany");
			return;
		}

		if (!name) {
			Alert.alert("Błąd", "Imię jest wymagane");
			return;
		}

		try {
			setLoading(true);
			let finalImageUrl = imageUri;

			// Jeśli jest nowy obraz do przesłania
			if (imageUri && imageUri.startsWith("file://")) {
				const { url, error: uploadError } = await uploadBirthdayImage(
					user.id,
					imageUri
				);
				if (uploadError) {
					console.error(
						"Błąd podczas przesyłania obrazu:",
						uploadError
					);
					Alert.alert(
						"Ostrzeżenie",
						"Nie udało się przesłać obrazu, ale urodziny zostaną zapisane"
					);
				} else {
					finalImageUrl = url;
				}
			}

			const birthdayData = {
				user_id: user.id,
				person_name: name,
				date: format(date, "yyyy-MM-dd"),
				notes: notes,
				image_url: finalImageUrl,
			};

			let result;
			if (isEditing && id) {
				// Aktualizacja istniejących urodzin
				result = await updateBirthday(id, {
					person_name: name,
					date: format(date, "yyyy-MM-dd"),
					notes: notes,
					image_url: finalImageUrl,
				});
			} else {
				// Tworzenie nowych urodzin
				result = await createBirthday(birthdayData);
			}

			if (result.error) {
				Alert.alert("Błąd", "Nie udało się zapisać urodzin");
				return;
			}

			// Zaplanuj powiadomienia
			if (result.data) {
				await scheduleBirthdayNotifications(result.data);
			}

			Alert.alert(
				isEditing ? "Zaktualizowano" : "Dodano",
				isEditing
					? "Urodziny zostały zaktualizowane"
					: "Urodziny zostały dodane",
				[
					{
						text: "OK",
						onPress: () => router.back(),
					},
				]
			);
		} catch (error) {
			console.error("Błąd podczas zapisywania urodzin:", error);
			Alert.alert("Błąd", "Wystąpił nieoczekiwany błąd");
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
				aspect: [4, 3],
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

	const formatDisplayDate = (date: Date) => {
		return format(date, "d MMMM yyyy", { locale: pl });
	};

	// Dodajemy brakujące właściwości do obiektu colors
	const extendedColors = {
		...colors,
		border: colors.icon,
		card: colors.background,
	};

	return (
		<KeyboardAvoidingView
			style={[
				styles.container,
				{ backgroundColor: extendedColors.background },
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
							color={extendedColors.text}
						/>
					</TouchableOpacity>
					<Text
						style={[styles.title, { color: extendedColors.text }]}
					>
						{isEditing ? "Edytuj urodziny" : "Dodaj urodziny"}
					</Text>
					<View style={styles.placeholder} />
				</View>

				<View style={styles.formContainer}>
					<View style={styles.inputContainer}>
						<Text
							style={[
								styles.label,
								{ color: extendedColors.text },
							]}
						>
							Imię i nazwisko
						</Text>
						<TextInput
							style={[
								styles.input,
								{
									color: extendedColors.text,
									borderColor: extendedColors.border,
									backgroundColor: extendedColors.card,
								},
							]}
							value={name}
							onChangeText={setName}
							placeholder="Podaj imię i nazwisko"
							placeholderTextColor={extendedColors.text + "80"}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text
							style={[
								styles.label,
								{ color: extendedColors.text },
							]}
						>
							Data urodzin
						</Text>
						<TouchableOpacity
							style={[
								styles.dateInput,
								{
									borderColor: extendedColors.border,
									backgroundColor: extendedColors.card,
								},
							]}
							onPress={() => setShowDatePicker(true)}
						>
							<Text
								style={[
									styles.dateText,
									{ color: extendedColors.text },
								]}
							>
								{formatDisplayDate(date)}
							</Text>
							<Ionicons
								name="calendar"
								size={24}
								color={extendedColors.text}
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
						<Text
							style={[
								styles.label,
								{ color: extendedColors.text },
							]}
						>
							Notatki (opcjonalnie)
						</Text>
						<TextInput
							style={[
								styles.textArea,
								{
									color: extendedColors.text,
									borderColor: extendedColors.border,
									backgroundColor: extendedColors.card,
								},
							]}
							value={notes}
							onChangeText={setNotes}
							placeholder="Dodaj notatki"
							placeholderTextColor={extendedColors.text + "80"}
							multiline
							numberOfLines={4}
							textAlignVertical="top"
						/>
					</View>

					<View style={styles.imageContainer}>
						<Text
							style={[
								styles.label,
								{ color: extendedColors.text },
							]}
						>
							Zdjęcie (opcjonalnie)
						</Text>
						{imageUri ? (
							<View style={styles.imagePreviewContainer}>
								<Image
									source={{ uri: imageUri }}
									style={styles.imagePreview}
								/>
								<TouchableOpacity
									style={styles.changeImageButton}
									onPress={pickImage}
								>
									<Text
										style={[
											styles.changeImageText,
											{ color: extendedColors.tint },
										]}
									>
										Zmień zdjęcie
									</Text>
								</TouchableOpacity>
							</View>
						) : (
							<TouchableOpacity
								style={[
									styles.imagePicker,
									{
										borderColor: extendedColors.border,
										backgroundColor: extendedColors.card,
									},
								]}
								onPress={pickImage}
							>
								<Ionicons
									name="image"
									size={32}
									color={extendedColors.text}
								/>
								<Text
									style={[
										styles.imagePickerText,
										{ color: extendedColors.text },
									]}
								>
									Wybierz zdjęcie
								</Text>
							</TouchableOpacity>
						)}
					</View>

					<TouchableOpacity
						style={[
							styles.saveButton,
							{ backgroundColor: extendedColors.tint },
							loading && styles.disabledButton,
						]}
						onPress={handleSave}
						disabled={loading}
					>
						<Text style={styles.saveButtonText}>
							{loading
								? "Zapisywanie..."
								: isEditing
								? "Zaktualizuj"
								: "Zapisz"}
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
	saveButton: {
		borderRadius: 8,
		padding: 16,
		alignItems: "center",
		marginTop: 16,
	},
	saveButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	disabledButton: {
		opacity: 0.7,
	},
});
