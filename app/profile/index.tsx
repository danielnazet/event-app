import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	TextInput,
	ScrollView,
	Alert,
	ActivityIndicator,
} from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import { User } from "../../lib/types";
import { Redirect } from "expo-router";

export default function ProfileScreen() {
	const { user, updateProfile, signOut, loading } = useAuth();
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];

	const [isEditing, setIsEditing] = useState(false);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [loadingData, setLoadingData] = useState(false);
	const [uploadingImage, setUploadingImage] = useState(false);

	// Aktualizuj stan po zmianie użytkownika
	useEffect(() => {
		if (user) {
			setFirstName(user.first_name || "");
			setLastName(user.last_name || "");
		}
	}, [user]);

	// Zdefiniuj handleSaveProfile jako useCallback
	const handleSaveProfile = useCallback(async () => {
		if (!firstName || !lastName) {
			Alert.alert("Błąd", "Imię i nazwisko są wymagane");
			return;
		}

		setLoadingData(true);
		try {
			const { error } = await updateProfile({
				first_name: firstName,
				last_name: lastName,
			});

			if (error) {
				Alert.alert("Błąd", error.message);
			} else {
				setIsEditing(false);
				Alert.alert("Sukces", "Profil został zaktualizowany");
			}
		} catch (error) {
			Alert.alert("Błąd", "Wystąpił nieoczekiwany błąd");
			console.error(error);
		} finally {
			setLoadingData(false);
		}
	}, [firstName, lastName, updateProfile]);

	// Zdefiniuj handleLogout jako useCallback
	const handleLogout = useCallback(async () => {
		Alert.alert("Wylogowanie", "Czy na pewno chcesz się wylogować?", [
			{ text: "Anuluj", style: "cancel" },
			{ text: "Wyloguj", style: "destructive", onPress: signOut },
		]);
	}, [signOut]);

	// Zdefiniuj pickImage jako useCallback
	const pickImage = useCallback(async () => {
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
			await uploadAvatar(result.assets[0].uri);
		}
	}, []);

	// Zdefiniuj uploadAvatar jako useCallback
	const uploadAvatar = useCallback(
		async (uri: string) => {
			if (!user) return;

			setUploadingImage(true);
			try {
				const fileName = `avatar_${user.id}_${new Date().getTime()}`;
				const fileExt = uri.split(".").pop();
				const filePath = `${user.id}/avatar/${fileName}.${fileExt}`;

				// Konwertuj URI na Blob
				const response = await fetch(uri);
				const blob = await response.blob();

				// Prześlij plik do Supabase Storage
				const { error: uploadError } = await supabase.storage
					.from("avatars")
					.upload(filePath, blob);

				if (uploadError) {
					throw uploadError;
				}

				// Pobierz publiczny URL
				const { data } = supabase.storage
					.from("avatars")
					.getPublicUrl(filePath);

				// Zaktualizuj profil użytkownika
				const { error } = await updateProfile({
					avatar_url: data.publicUrl,
				});

				if (error) {
					throw error;
				}

				Alert.alert(
					"Sukces",
					"Zdjęcie profilowe zostało zaktualizowane"
				);
			} catch (error) {
				Alert.alert(
					"Błąd",
					"Nie udało się zaktualizować zdjęcia profilowego"
				);
				console.error(error);
			} finally {
				setUploadingImage(false);
			}
		},
		[user, updateProfile]
	);

	// Renderuj komponent tylko raz, używając useMemo
	const content = useMemo(() => {
		// Jeśli użytkownik nie jest zalogowany i zakończono ładowanie, przekieruj do ekranu logowania
		if (!user && !loading) {
			return <Redirect href="/(auth)/login" />;
		}

		// Podczas ładowania pokaż wskaźnik aktywności
		if (loading || !user) {
			return (
				<View
					style={[
						styles.container,
						{ backgroundColor: colors.background },
					]}
				>
					<ActivityIndicator size="large" color={colors.tint} />
					<Text style={[styles.text, { color: colors.text }]}>
						Ładowanie profilu...
					</Text>
				</View>
			);
		}

		return (
			<ScrollView
				style={[
					styles.container,
					{ backgroundColor: colors.background },
				]}
			>
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text }]}>
						Profil
					</Text>
					<TouchableOpacity
						style={styles.logoutButton}
						onPress={handleLogout}
					>
						<Ionicons
							name="log-out-outline"
							size={24}
							color={colors.tint}
						/>
					</TouchableOpacity>
				</View>

				<View style={styles.avatarContainer}>
					{uploadingImage ? (
						<View
							style={[
								styles.avatar,
								{ backgroundColor: colors.icon },
							]}
						>
							<ActivityIndicator
								size="large"
								color={colors.background}
							/>
						</View>
					) : user.avatar_url ? (
						<Image
							source={{ uri: user.avatar_url }}
							style={styles.avatar}
						/>
					) : (
						<View
							style={[
								styles.avatar,
								{ backgroundColor: colors.icon },
							]}
						>
							<Text
								style={[
									styles.avatarText,
									{ color: colors.background },
								]}
							>
								{user.first_name.charAt(0).toUpperCase()}
								{user.last_name.charAt(0).toUpperCase()}
							</Text>
						</View>
					)}
					<TouchableOpacity
						style={styles.editAvatarButton}
						onPress={pickImage}
					>
						<Ionicons name="camera" size={20} color="white" />
					</TouchableOpacity>
				</View>

				<View style={styles.infoContainer}>
					{isEditing ? (
						<>
							<View style={styles.inputContainer}>
								<Text
									style={[
										styles.label,
										{ color: colors.text },
									]}
								>
									Imię
								</Text>
								<TextInput
									style={[
										styles.input,
										{
											backgroundColor: colors.background,
											color: colors.text,
											borderColor: colors.icon,
										},
									]}
									value={firstName}
									onChangeText={setFirstName}
									placeholder="Imię"
									placeholderTextColor={colors.icon}
								/>
							</View>

							<View style={styles.inputContainer}>
								<Text
									style={[
										styles.label,
										{ color: colors.text },
									]}
								>
									Nazwisko
								</Text>
								<TextInput
									style={[
										styles.input,
										{
											backgroundColor: colors.background,
											color: colors.text,
											borderColor: colors.icon,
										},
									]}
									value={lastName}
									onChangeText={setLastName}
									placeholder="Nazwisko"
									placeholderTextColor={colors.icon}
								/>
							</View>

							<View style={styles.buttonContainer}>
								<TouchableOpacity
									style={[
										styles.button,
										{ backgroundColor: colors.tint },
									]}
									onPress={handleSaveProfile}
									disabled={loadingData}
								>
									<Text style={styles.buttonText}>
										{loadingData
											? "Zapisywanie..."
											: "Zapisz zmiany"}
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										styles.button,
										{
											backgroundColor: "transparent",
											borderColor: colors.icon,
											borderWidth: 1,
										},
									]}
									onPress={() => setIsEditing(false)}
									disabled={loadingData}
								>
									<Text
										style={[
											styles.buttonText,
											{ color: colors.text },
										]}
									>
										Anuluj
									</Text>
								</TouchableOpacity>
							</View>
						</>
					) : (
						<>
							<View style={styles.infoRow}>
								<Text
									style={[
										styles.infoLabel,
										{ color: colors.icon },
									]}
								>
									Imię
								</Text>
								<Text
									style={[
										styles.infoValue,
										{ color: colors.text },
									]}
								>
									{user.first_name}
								</Text>
							</View>

							<View style={styles.infoRow}>
								<Text
									style={[
										styles.infoLabel,
										{ color: colors.icon },
									]}
								>
									Nazwisko
								</Text>
								<Text
									style={[
										styles.infoValue,
										{ color: colors.text },
									]}
								>
									{user.last_name}
								</Text>
							</View>

							<View style={styles.infoRow}>
								<Text
									style={[
										styles.infoLabel,
										{ color: colors.icon },
									]}
								>
									Email
								</Text>
								<Text
									style={[
										styles.infoValue,
										{ color: colors.text },
									]}
								>
									{user.email}
								</Text>
							</View>

							<TouchableOpacity
								style={[
									styles.editButton,
									{ backgroundColor: colors.tint },
								]}
								onPress={() => setIsEditing(true)}
							>
								<Text style={styles.editButtonText}>
									Edytuj profil
								</Text>
							</TouchableOpacity>
						</>
					)}
				</View>
			</ScrollView>
		);
	}, [
		user,
		loading,
		colors,
		isEditing,
		firstName,
		lastName,
		loadingData,
		uploadingImage,
		handleSaveProfile,
		handleLogout,
		pickImage,
	]);

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
		paddingHorizontal: 24,
		paddingTop: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
	},
	logoutButton: {
		padding: 8,
	},
	avatarContainer: {
		alignItems: "center",
		marginTop: 24,
		marginBottom: 32,
	},
	avatar: {
		width: 120,
		height: 120,
		borderRadius: 60,
		justifyContent: "center",
		alignItems: "center",
	},
	avatarText: {
		fontSize: 36,
		fontWeight: "bold",
	},
	editAvatarButton: {
		position: "absolute",
		bottom: 0,
		right: "35%",
		backgroundColor: "#0a7ea4",
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "white",
	},
	infoContainer: {
		paddingHorizontal: 24,
	},
	infoRow: {
		marginBottom: 16,
	},
	infoLabel: {
		fontSize: 14,
		marginBottom: 4,
	},
	infoValue: {
		fontSize: 18,
		fontWeight: "500",
	},
	editButton: {
		height: 50,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 24,
	},
	editButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
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
	buttonContainer: {
		marginTop: 24,
	},
	button: {
		height: 50,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 16,
	},
	buttonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
	text: {
		fontSize: 16,
		textAlign: "center",
		marginTop: 24,
	},
});
