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
import { Birthday } from "../../lib/types";
import {
	createBirthday,
	getBirthdayById,
	updateBirthday,
	uploadBirthdayImage,
} from "../../lib/services/birthdayService";
import { scheduleBirthdayNotifications } from "../../lib/services/notificationService";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function BirthdayFormScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { user } = useAuth();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';
	const colors = Colors[colorScheme ?? "light"];
	const isEditing = !!id;

	const [personName, setPersonName] = useState("");
	const [birthdate, setBirthdate] = useState(new Date());
	const [notes, setNotes] = useState("");
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);

	useEffect(() => {
		if (isEditing && id) {
			fetchBirthday(id);
		}
	}, [id]);

	const fetchBirthday = async (birthdayId: string) => {
		try {
			const { data, error } = await getBirthdayById(birthdayId);
			if (error) {
				Alert.alert("Błąd", "Nie udało się pobrać danych urodzin");
				return;
			}

			if (data) {
				setPersonName(data.person_name);
				setBirthdate(parse(data.date, "yyyy-MM-dd", new Date()));
				setNotes(data.notes || "");
				setImageUri(data.image_url || null);
			}
		} catch (error) {
			console.error("Błąd podczas pobierania urodzin:", error);
			Alert.alert("Błąd", "Wystąpił nieoczekiwany błąd");
		}
	};

	const handleSave = async () => {
		if (!user) {
			Alert.alert("Błąd", "Musisz być zalogowany");
			return;
		}

		if (!personName) {
			Alert.alert("Błąd", "Imię jest wymagane");
			return;
		}

		setLoading(true);
		try {
			let imageUrl = imageUri;

			// Jeśli wybrano nowe zdjęcie, prześlij je
			if (imageUri && imageUri.startsWith("file://")) {
				const { url, error } = await uploadBirthdayImage(
					user.id,
					imageUri
				);
				if (error) {
					console.error("Błąd podczas przesyłania zdjęcia:", error);
				} else {
					imageUrl = url;
				}
			}

			const birthdayData = {
				person_name: personName,
				date: format(birthdate, "yyyy-MM-dd"),
				notes: notes || undefined,
				image_url: imageUrl || undefined,
				user_id: user.id,
			};

			let result;
			if (isEditing && id) {
				// Aktualizacja istniejących urodzin
				const { data, error } = await updateBirthday(id, {
					person_name: birthdayData.person_name,
					date: birthdayData.date,
					notes: birthdayData.notes,
					image_url: birthdayData.image_url,
				});
				result = { data, error };
			} else {
				// Dodawanie nowych urodzin
				result = await createBirthday(birthdayData);
			}

			if (result.error) {
				Alert.alert("Błąd", result.error.message);
			} else if (result.data) {
				// Zaplanuj powiadomienia
				await scheduleBirthdayNotifications(result.data);

				Alert.alert(
					"Sukces",
					isEditing
						? "Urodziny zostały zaktualizowane"
						: "Urodziny zostały dodane",
					[{ text: "OK", onPress: () => router.back() }]
				);
			}
		} catch (error) {
			console.error("Błąd podczas zapisywania urodzin:", error);
			Alert.alert("Błąd", "Wystąpił nieoczekiwany błąd");
		} finally {
			setLoading(false);
		}
	};

	const pickImage = async () => {
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (status !== "granted") {
			Alert.alert(
				"Błąd",
				"Potrzebujemy uprawnień do galerii, aby wybrać zdjęcie"
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});

		if (!result.canceled && result.assets && result.assets.length > 0) {
			setImageUri(result.assets[0].uri);
		}
	};

	const handleDateChange = (event: any, selectedDate?: Date) => {
		setShowDatePicker(false);
		if (selectedDate) {
			setBirthdate(selectedDate);
		}
	};

	const formatDisplayDate = (date: Date) => {
		return format(date, "d MMMM", { locale: pl });
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
				</View>

				<View style={styles.formContainer}>
					<TouchableOpacity
						style={styles.imageContainer}
						onPress={pickImage}
					>
						{imageUri ? (
							<Image
								source={{ uri: imageUri }}
								style={styles.image}
							/>
						) : (
							<View
								style={[
									styles.imagePlaceholder,
									{ backgroundColor: isDark ? '#333' : colors.icon },
								]}
							>
								<Ionicons
									name="camera"
									size={40}
									color={isDark ? '#fff' : colors.background}
								/>
								<Text
									style={[
										styles.imagePlaceholderText,
										{ color: isDark ? '#fff' : colors.background },
									]}
								>
									Dodaj zdjęcie
								</Text>
							</View>
						)}
					</TouchableOpacity>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Imię
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
							value={personName}
							onChangeText={setPersonName}
							placeholder="Imię osoby"
							placeholderTextColor={isDark ? '#666' : colors.icon}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Data urodzin
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
								{formatDisplayDate(birthdate)}
							</Text>
							<Ionicons
								name="calendar"
								size={20}
								color={isDark ? '#666' : colors.icon}
							/>
						</TouchableOpacity>
						{showDatePicker && (
							<DateTimePicker
								value={birthdate}
								mode="date"
								display="default"
								onChange={handleDateChange}
							/>
						)}
					</View>

					<View style={styles.inputContainer}>
						<Text style={[styles.label, { color: colors.text }]}>
							Notatki (opcjonalnie)
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
							value={notes}
							onChangeText={setNotes}
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
		padding: 20,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
		marginTop: -10,
	},
	backButton: {
		padding: 8,
		marginLeft: -8,
	},
	formContainer: {
		flex: 1,
		width: '100%',
	},
	imageContainer: {
		alignItems: "center",
		marginBottom: 24,
	},
	image: {
		width: 120,
		height: 120,
		borderRadius: 60,
	},
	imagePlaceholder: {
		width: 120,
		height: 120,
		borderRadius: 60,
		justifyContent: "center",
		alignItems: "center",
	},
	imagePlaceholderText: {
		marginTop: 8,
		fontSize: 14,
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
	dateInput: {
		height: 50,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 16,
		fontSize: 16,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	textArea: {
		height: 100,
		paddingTop: 12,
	},
	button: {
		height: 50,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 24,
	},
	buttonText: {
		color: "black",
		fontSize: 16,
		fontWeight: "600",
	},
});
