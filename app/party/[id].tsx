import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/context/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';

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

type PartyMember = {
	id: string;
	user_id: string;
	role: 'admin' | 'member';
	status: 'pending' | 'accepted' | 'declined';
	profile: {
		first_name: string;
		last_name: string;
		avatar_url: string | null;
	};
};

type PartyProposal = {
	id: string;
	title: string;
	description: string | null;
	location_url: string | null;
	image_url: string | null;
	votes: number;
	user_id: string;
	created_at: string;
	profile: {
		first_name: string;
		last_name: string;
		avatar_url: string | null;
	};
};

export default function PartyDetailsScreen() {
	const { id } = useLocalSearchParams();
	const { user } = useAuth();
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];

	const [group, setGroup] = useState<PartyGroup | null>(null);
	const [members, setMembers] = useState<PartyMember[]>([]);
	const [proposals, setProposals] = useState<PartyProposal[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'info' | 'proposals' | 'expenses' | 'tasks' | 'chat'>('info');

	useEffect(() => {
		fetchGroupDetails();
	}, [id]);

	const fetchGroupDetails = async () => {
		try {
			// Pobierz szczegóły grupy
			const { data: groupData, error: groupError } = await supabase
				.from('party_groups')
				.select('*')
				.eq('id', id)
				.single();

			if (groupError) throw groupError;
			setGroup(groupData);

			// Pobierz członków grupy
			const { data: membersData, error: membersError } = await supabase
				.from('party_members')
				.select(`
					*,
					profile:profiles(first_name, last_name, avatar_url)
				`)
				.eq('party_group_id', id);

			if (membersError) throw membersError;
			setMembers(membersData);

			// Pobierz propozycje
			const { data: proposalsData, error: proposalsError } = await supabase
				.from('party_proposals')
				.select(`
					*,
					profile:profiles(first_name, last_name, avatar_url)
				`)
				.eq('party_group_id', id)
				.order('votes', { ascending: false });

			if (proposalsError) throw proposalsError;
			setProposals(proposalsData);
		} catch (error) {
			console.error('Błąd podczas pobierania szczegółów grupy:', error);
			Alert.alert('Błąd', 'Nie udało się pobrać szczegółów grupy');
		} finally {
			setLoading(false);
		}
	};

	const handleAddProposal = () => {
		// TODO: Implementacja dodawania propozycji
	};

	const handleVote = async (proposalId: string) => {
		if (!user) return;

		try {
			// Sprawdź czy użytkownik już głosował
			const { data: existingVote } = await supabase
				.from('party_votes')
				.select('id')
				.eq('proposal_id', proposalId)
				.eq('user_id', user.id)
				.single();

			if (existingVote) {
				Alert.alert('Uwaga', 'Już zagłosowałeś na tę propozycję');
				return;
			}

			// Dodaj głos
			const { error: voteError } = await supabase
				.from('party_votes')
				.insert([
					{
						proposal_id: proposalId,
						user_id: user.id,
					},
				]);

			if (voteError) throw voteError;

			// Zaktualizuj licznik głosów
			const { error: updateError } = await supabase.rpc('increment_proposal_votes', {
				proposal_id: proposalId,
			});

			if (updateError) throw updateError;

			// Odśwież listę propozycji
			fetchGroupDetails();
		} catch (error) {
			console.error('Błąd podczas głosowania:', error);
			Alert.alert('Błąd', 'Nie udało się zagłosować');
		}
	};

	if (loading) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<ActivityIndicator size="large" color={colors.tint} />
			</View>
		);
	}

	if (!group) {
		return (
			<View style={[styles.container, { backgroundColor: colors.background }]}>
				<Text style={[styles.errorText, { color: colors.text }]}>
					Nie znaleziono grupy
				</Text>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Ionicons name="arrow-back" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
					{group.name}
				</Text>
			</View>

			<View style={styles.tabs}>
				<TouchableOpacity
					style={[
						styles.tab,
						activeTab === 'info' && { backgroundColor: colors.tint },
					]}
					onPress={() => setActiveTab('info')}
				>
					<Ionicons
						name="information-circle-outline"
						size={24}
						color={activeTab === 'info' ? 'black' : colors.text}
					/>
					<Text
						style={[
							styles.tabText,
							activeTab === 'info' && { color: 'black' },
						]}
					>
						Info
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.tab,
						activeTab === 'proposals' && { backgroundColor: colors.tint },
					]}
					onPress={() => setActiveTab('proposals')}
				>
					<Ionicons
						name="location-outline"
						size={24}
						color={activeTab === 'proposals' ? 'black' : colors.text}
					/>
					<Text
						style={[
							styles.tabText,
							activeTab === 'proposals' && { color: 'black' },
						]}
					>
						Propozycje
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.tab,
						activeTab === 'expenses' && { backgroundColor: colors.tint },
					]}
					onPress={() => setActiveTab('expenses')}
				>
					<Ionicons
						name="wallet-outline"
						size={24}
						color={activeTab === 'expenses' ? 'black' : colors.text}
					/>
					<Text
						style={[
							styles.tabText,
							activeTab === 'expenses' && { color: 'black' },
						]}
					>
						Wydatki
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.tab,
						activeTab === 'tasks' && { backgroundColor: colors.tint },
					]}
					onPress={() => setActiveTab('tasks')}
				>
					<Ionicons
						name="checkbox-outline"
						size={24}
						color={activeTab === 'tasks' ? 'black' : colors.text}
					/>
					<Text
						style={[
							styles.tabText,
							activeTab === 'tasks' && { color: 'black' },
						]}
					>
						Zadania
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.tab,
						activeTab === 'chat' && { backgroundColor: colors.tint },
					]}
					onPress={() => setActiveTab('chat')}
				>
					<Ionicons
						name="chatbubble-outline"
						size={24}
						color={activeTab === 'chat' ? 'black' : colors.text}
					/>
					<Text
						style={[
							styles.tabText,
							activeTab === 'chat' && { color: 'black' },
						]}
					>
						Czat
					</Text>
				</TouchableOpacity>
			</View>

			<ScrollView style={styles.content}>
				{activeTab === 'info' && (
					<View style={styles.infoSection}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>
							Informacje o grupie
						</Text>
						{group.description && (
							<Text style={[styles.description, { color: colors.text }]}>
								{group.description}
							</Text>
						)}
						<View style={styles.infoRow}>
							<Ionicons name="calendar-outline" size={20} color={colors.icon} />
							<Text style={[styles.infoText, { color: colors.text }]}>
								{new Date(group.date).toLocaleDateString('pl-PL')}
							</Text>
						</View>
						<View style={styles.infoRow}>
							<Ionicons name="people-outline" size={20} color={colors.icon} />
							<Text style={[styles.infoText, { color: colors.text }]}>
								{members.length} członków
							</Text>
						</View>

						<Text style={[styles.sectionTitle, { color: colors.text }]}>
							Członkowie
						</Text>
						{members.map((member) => (
							<View key={member.id} style={styles.memberRow}>
								<View style={styles.memberInfo}>
									<Text style={[styles.memberName, { color: colors.text }]}>
										{member.profile.first_name} {member.profile.last_name}
									</Text>
									<Text style={[styles.memberRole, { color: colors.icon }]}>
										{member.role === 'admin' ? 'Administrator' : 'Członek'}
									</Text>
								</View>
							</View>
						))}
					</View>
				)}

				{activeTab === 'proposals' && (
					<View style={styles.proposalsSection}>
						<View style={styles.proposalsHeader}>
							<Text style={[styles.sectionTitle, { color: colors.text }]}>
								Propozycje miejsc
							</Text>
							<TouchableOpacity
								style={[styles.addButton, { backgroundColor: colors.tint }]}
								onPress={handleAddProposal}
							>
								<Ionicons name="add" size={24} color="black" />
							</TouchableOpacity>
						</View>

						{proposals.length === 0 ? (
							<Text style={[styles.emptyText, { color: colors.text }]}>
								Brak propozycji. Dodaj pierwszą!
							</Text>
						) : (
							proposals.map((proposal) => (
								<View
									key={proposal.id}
									style={[styles.proposalCard, { backgroundColor: colors.card }]}
								>
									<View style={styles.proposalHeader}>
										<Text style={[styles.proposalTitle, { color: colors.text }]}>
											{proposal.title}
										</Text>
										<TouchableOpacity
											style={styles.voteButton}
											onPress={() => handleVote(proposal.id)}
										>
											<Ionicons name="heart-outline" size={20} color={colors.tint} />
											<Text style={[styles.voteCount, { color: colors.text }]}>
												{proposal.votes}
											</Text>
										</TouchableOpacity>
									</View>

									{proposal.description && (
										<Text
											style={[styles.proposalDescription, { color: colors.text }]}
											numberOfLines={2}
										>
											{proposal.description}
										</Text>
									)}

									{proposal.location_url && (
										<TouchableOpacity
											style={styles.locationButton}
											onPress={() => {/* TODO: Implementacja otwierania linku */}}
										>
											<Ionicons name="location-outline" size={16} color={colors.tint} />
											<Text style={[styles.locationText, { color: colors.tint }]}>
												Zobacz na mapie
											</Text>
										</TouchableOpacity>
									)}
								</View>
							))
						)}
					</View>
				)}

				{activeTab === 'expenses' && (
					<View style={styles.expensesSection}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>
							Wydatki
						</Text>
						<Text style={[styles.emptyText, { color: colors.text }]}>
							Wkrótce dostępne
						</Text>
					</View>
				)}

				{activeTab === 'tasks' && (
					<View style={styles.tasksSection}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>
							Zadania
						</Text>
						<Text style={[styles.emptyText, { color: colors.text }]}>
							Wkrótce dostępne
						</Text>
					</View>
				)}

				{activeTab === 'chat' && (
					<View style={styles.chatSection}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>
							Czat grupy
						</Text>
						<Text style={[styles.emptyText, { color: colors.text }]}>
							Wkrótce dostępne
						</Text>
					</View>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingTop: 24,
		paddingBottom: 16,
	},
	backButton: {
		marginRight: 16,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		flex: 1,
	},
	tabs: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	tab: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 8,
		borderRadius: 8,
		marginHorizontal: 4,
	},
	tabText: {
		marginLeft: 4,
		fontSize: 12,
		fontWeight: '500',
	},
	content: {
		flex: 1,
	},
	infoSection: {
		padding: 24,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 16,
	},
	description: {
		fontSize: 16,
		marginBottom: 16,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	infoText: {
		marginLeft: 8,
		fontSize: 16,
	},
	memberRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	memberInfo: {
		flex: 1,
	},
	memberName: {
		fontSize: 16,
		fontWeight: '500',
	},
	memberRole: {
		fontSize: 14,
	},
	proposalsSection: {
		padding: 24,
	},
	proposalsHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	addButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	proposalCard: {
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
	proposalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	proposalTitle: {
		fontSize: 18,
		fontWeight: '600',
		flex: 1,
	},
	voteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 8,
	},
	voteCount: {
		marginLeft: 4,
		fontSize: 14,
	},
	proposalDescription: {
		fontSize: 14,
		marginBottom: 12,
	},
	locationButton: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	locationText: {
		marginLeft: 4,
		fontSize: 14,
	},
	expensesSection: {
		padding: 24,
	},
	tasksSection: {
		padding: 24,
	},
	chatSection: {
		padding: 24,
	},
	emptyText: {
		fontSize: 16,
		textAlign: 'center',
		marginTop: 24,
	},
	errorText: {
		fontSize: 16,
		textAlign: 'center',
		marginTop: 24,
	},
}); 