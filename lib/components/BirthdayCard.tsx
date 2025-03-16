import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Birthday } from "../types";
import { formatBirthdayDate } from "../services/notificationService";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

type BirthdayCardProps = {
	birthday: Birthday;
	onPress: (birthday: Birthday) => void;
	isDark?: boolean;
};

export const BirthdayCard: React.FC<BirthdayCardProps> = ({
	birthday,
	onPress,
	isDark,
}) => {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];

	return (
		<TouchableOpacity
			style={[
				styles.container,
				{
					backgroundColor: isDark ? '#1a1a1a' : colors.background,
					borderColor: isDark ? '#333' : '#eee',
				}
			]}
			onPress={() => onPress(birthday)}
		>
			<View style={styles.content}>
				<View style={styles.imageContainer}>
					{birthday.image_url ? (
						<Image
							source={{ uri: birthday.image_url }}
							style={styles.image}
						/>
					) : (
						<View
							style={[
								styles.placeholderImage,
								{ backgroundColor: isDark ? '#333' : '#666' },
							]}
						>
							<Ionicons
								name="person"
								size={24}
								color={isDark ? '#666' : '#fff'}
							/>
						</View>
					)}
				</View>
				<View style={styles.textContainer}>
					<Text style={[styles.name, { color: isDark ? '#fff' : colors.text }]}>
						{birthday.person_name}
					</Text>
					<Text style={[styles.date, { color: isDark ? '#aaa' : colors.icon }]}>
						{formatBirthdayDate(birthday.date)}
					</Text>
					{birthday.notes && (
						<Text
							style={[styles.notes, { color: isDark ? '#aaa' : colors.icon }]}
							numberOfLines={2}
						>
							{birthday.notes}
						</Text>
					)}
				</View>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		borderWidth: 1,
		borderRadius: 8,
		marginBottom: 10,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	content: {
		flexDirection: "row",
		alignItems: "center",
	},
	imageContainer: {
		marginRight: 16,
	},
	image: {
		width: 60,
		height: 60,
		borderRadius: 30,
	},
	placeholderImage: {
		width: 60,
		height: 60,
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
	},
	textContainer: {
		flex: 1,
	},
	name: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 4,
	},
	date: {
		fontSize: 14,
		marginBottom: 4,
	},
	notes: {
		fontSize: 14,
	},
});
