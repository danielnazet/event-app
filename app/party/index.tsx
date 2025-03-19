import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/context/AuthContext';
import { Redirect } from 'expo-router';

type PartyGroup = {
	id: string;
	name: string;
	description: string | null;
	date: string;
	status: 'planning' | 'confirmed' | 'cancelled';
	created_by: string;
	created_at: string;
	updated_at: string;
};

export default function PartyScreen() {
	const { user, loading: authLoading } = useAuth();
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];

	const [partyGroups, setPartyGroups] = useState<PartyGroup[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchPartyGroups();
	}, []);

	const fetchPartyGroups = async () => {
		try {
			const { data, error } = await supabase
				.from('party_groups')
				.select('*')
				.order('created_at', { ascending: false });

			if (error) throw error;
			setPartyGroups(data || []);
		} catch (error) {
			console.error('Błąd podczas pobierania grup:', error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusColor = (status: PartyGroup['status']) => {
		switch (status) {
			case 'planning':
				return colors.warning;
			case 'confirmed':
				return colors.success;
			case 'cancelled':
				return colors.error;
			default:
				return colors.text;
		}
	};

	const getStatusText = (status: PartyGroup['status']) => {
		switch (status) {
			case 'planning':
				return 'Planowanie';
			case 'confirmed':
				return 'Potwierdzone';
			case 'cancelled':
				return 'Odwołane';
			default:
				return status;
		}
	};

	if (authLoading) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<ActivityIndicator size="large" color={colors.tint} />
			</View>
		);
	}

	if (!user) {
		return <Redirect href="/(auth)/login" />;
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.header}>
				<Text style={[styles.title, { color: colors.text }]}>Grupy imprez</Text>
				<TouchableOpacity
					style={[styles.addButton, { backgroundColor: colors.tint }]}
					onPress={() => {/* TODO: Implementacja tworzenia nowej grupy */}}
				>
					<Ionicons name="add" size={24} color="black" />
				</TouchableOpacity>
			</View>

			{loading ? (
				<ActivityIndicator size="large" color={colors.tint} />
			) : (
				<FlatList
					data={partyGroups}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<TouchableOpacity
							style={[styles.groupCard, { backgroundColor: colors.card }]}
							onPress={() => {/* TODO: Implementacja przejścia do szczegółów grupy */}}
						>
							<View style={styles.groupHeader}>
								<Text style={[styles.groupName, { color: colors.text }]}>
									{item.name}
								</Text>
								<View
									style={[
										styles.statusBadge,
										{ backgroundColor: getStatusColor(item.status) },
									]}
								>
									<Text style={styles.statusText}>
										{getStatusText(item.status)}
									</Text>
								</View>
							</View>

							{item.description && (
								<Text
									style={[styles.groupDescription, { color: colors.text }]}
									numberOfLines={2}
								>
									{item.description}
								</Text>
							)}

							<View style={styles.groupFooter}>
								<View style={styles.dateContainer}>
									<Ionicons
										name="calendar-outline"
										size={16}
										color={colors.icon}
									/>
									<Text style={[styles.dateText, { color: colors.text }]}>
										{new Date(item.date).toLocaleDateString('pl-PL')}
									</Text>
								</View>
								<View style={styles.membersContainer}>
									<Ionicons
										name="people-outline"
										size={16}
										color={colors.icon}
									/>
									<Text style={[styles.membersText, { color: colors.text }]}>
										{/* TODO: Implementacja liczenia członków */}
										0 członków
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					)}
					contentContainerStyle={styles.listContent}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingTop: 24,
		paddingBottom: 16,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
	},
	addButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	listContent: {
		padding: 16,
	},
	groupCard: {
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	groupHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	groupName: {
		fontSize: 18,
		fontWeight: '600',
		flex: 1,
	},
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		marginLeft: 8,
	},
	statusText: {
		color: 'white',
		fontSize: 12,
		fontWeight: '500',
	},
	groupDescription: {
		fontSize: 14,
		marginBottom: 12,
	},
	groupFooter: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	dateContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 16,
	},
	dateText: {
		marginLeft: 4,
		fontSize: 14,
	},
	membersContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	membersText: {
		marginLeft: 4,
		fontSize: 14,
	},
}); 