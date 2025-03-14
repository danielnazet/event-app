import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Birthday } from "../types";
import { formatBirthdayDate } from "../services/notificationService";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

type BirthdayCardProps = {
	birthday: Birthday;
	onPress: (birthday: Birthday) => void;
};

export const BirthdayCard: React.FC<BirthdayCardProps> = ({
	birthday,
	onPress,
}) => {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];

	return (
		<TouchableOpacity
			style={[styles.container, { backgroundColor: colors.background }]}
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
								{ backgroundColor: colors.icon },
							]}
						>
							<Text
								style={[
									styles.placeholderText,
									{ color: colors.background },
								]}
							>
								{birthday.person_name.charAt(0).toUpperCase()}
							</Text>
						</View>
					)}
				</View>
				<View style={styles.textContainer}>
					<Text style={[styles.name, { color: colors.text }]}>
						{birthday.person_name}
					</Text>
					<Text style={[styles.date, { color: colors.icon }]}>
						{formatBirthdayDate(birthday.date)}
					</Text>
					{birthday.notes && (
						<Text
							style={[styles.notes, { color: colors.icon }]}
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
		borderRadius: 12,
		marginBottom: 16,
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
	placeholderText: {
		fontSize: 24,
		fontWeight: "bold",
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
