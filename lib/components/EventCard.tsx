import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Event } from "../types";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

type EventCardProps = {
	event: Event;
	onPress: (event: Event) => void;
};

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];

	const formatEventDate = (dateString: string): string => {
		const date = parseISO(dateString);
		return format(date, "d MMMM yyyy", { locale: pl });
	};

	return (
		<TouchableOpacity
			style={[styles.container, { backgroundColor: colors.background }]}
			onPress={() => onPress(event)}
		>
			<View style={styles.content}>
				{event.image_url ? (
					<Image
						source={{ uri: event.image_url }}
						style={styles.image}
					/>
				) : (
					<View
						style={[
							styles.placeholderImage,
							{ backgroundColor: colors.icon },
						]}
					>
						<Ionicons
							name="paper-plane"
							size={24}
							color={colors.background}
						/>
					</View>
				)}
				<View style={styles.textContainer}>
					<Text style={[styles.title, { color: colors.text }]}>
						{event.title}
					</Text>
					<Text style={[styles.date, { color: colors.icon }]}>
						{formatEventDate(event.date)}
						{event.time && ` o ${event.time}`}
					</Text>
					{event.location && (
						<View style={styles.locationContainer}>
							<Ionicons
								name="location"
								size={14}
								color={colors.icon}
							/>
							<Text
								style={[
									styles.location,
									{ color: colors.icon },
								]}
							>
								{event.location}
							</Text>
						</View>
					)}
					{event.description && (
						<Text
							style={[styles.description, { color: colors.icon }]}
							numberOfLines={2}
						>
							{event.description}
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
	},
	image: {
		width: 80,
		height: 80,
		borderRadius: 8,
		marginRight: 16,
	},
	placeholderImage: {
		width: 80,
		height: 80,
		borderRadius: 8,
		marginRight: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	textContainer: {
		flex: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 4,
	},
	date: {
		fontSize: 14,
		marginBottom: 4,
	},
	locationContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 4,
	},
	location: {
		fontSize: 14,
		marginLeft: 4,
	},
	description: {
		fontSize: 14,
	},
});
