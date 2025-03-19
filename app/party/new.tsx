import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	ActivityIndicator,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/context/AuthContext';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function NewPartyScreen() {
	const { user } = useAuth();
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? 'light'];

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [date, setDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleCreateGroup = async () => {
		if (!name.trim()) {
			Alert.alert('Błąd', 'Nazwa grupy jest wymagana');
			return;
		}

		if (!user) {
			Alert.alert('Błąd', 'Musisz być zalogowany, aby utworzyć grupę');
			return;
		}

		setLoading(true);
		try {
			const { data, error } = await supabase
				.from('party_groups')
				.insert([
					{
						name: name.trim(),
						description: description.trim() || null,
						date: date.toISOString().split('T')[0],
						status: 'planning',
						created_by: user.id,
					},
				])
				.select()
				.single();

			if (error) throw error;

			// Dodaj twórcę jako administratora grupy
			const { error: memberError } = await supabase
				.from('party_members')
				.insert([
					{
						party_group_id: data.id,
						user_id: user.id,
						role: 'admin',
						status: 'accepted',
					},
				]);

			if (memberError) throw memberError;

			Alert.alert('Sukces', 'Grupa została utworzona');
			router.back();
		} catch (error) {
			console.error('Błąd podczas tworzenia grupy:', error);
			Alert.alert('Błąd', 'Nie udało się utworzyć grupy');
		} finally {
			setLoading(false);
		}
	};

	const onDateChange = (event: any, selectedDate?: Date) => {
		setShowDatePicker(false);
		if (selectedDate) {
			setDate(selectedDate);
		}
	};

	return (
		<ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Ionicons name="arrow-back" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.title, { color: colors.text }]}>Nowa grupa</Text>
			</View>

			<View style={styles.form}>
				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: colors.text }]}>Nazwa grupy</Text>
					<TextInput
						style={[
							styles.input,
							{
								backgroundColor: colors.background,
								color: colors.text,
								borderColor: colors.border,
							},
						]}
						value={name}
						onChangeText={setName}
						placeholder="Wprowadź nazwę grupy"
						placeholderTextColor={colors.icon}
					/>
				</View>

				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: colors.text }]}>Opis</Text>
					<TextInput
						style={[
							styles.input,
							styles.textArea,
							{
								backgroundColor: colors.background,
								color: colors.text,
								borderColor: colors.border,
							},
						]}
						value={description}
						onChangeText={setDescription}
						placeholder="Wprowadź opis grupy (opcjonalnie)"
						placeholderTextColor={colors.icon}
						multiline
						numberOfLines={4}
					/>
				</View>

				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: colors.text }]}>Data spotkania</Text>
					<TouchableOpacity
						style={[
							styles.dateButton,
							{
								backgroundColor: colors.background,
								borderColor: colors.border,
							},
						]}
						onPress={() => setShowDatePicker(true)}
					>
						<Text style={[styles.dateText, { color: colors.text }]}>
							{date.toLocaleDateString('pl-PL')}
						</Text>
						<Ionicons name="calendar-outline" size={20} color={colors.icon} />
					</TouchableOpacity>
				</View>

				{showDatePicker && (
					<DateTimePicker
						value={date}
						mode="date"
						display="default"
						onChange={onDateChange}
						minimumDate={new Date()}
					/>
				)}

				<TouchableOpacity
					style={[styles.createButton, { backgroundColor: colors.tint }]}
					onPress={handleCreateGroup}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="black" />
					) : (
						<Text style={styles.createButtonText}>Utwórz grupę</Text>
					)}
				</TouchableOpacity>
			</View>
		</ScrollView>
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
	},
	form: {
		padding: 24,
	},
	inputContainer: {
		marginBottom: 24,
	},
	label: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 8,
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 16,
		fontSize: 16,
	},
	textArea: {
		height: 100,
		textAlignVertical: 'top',
		paddingTop: 12,
	},
	dateButton: {
		height: 50,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	dateText: {
		fontSize: 16,
	},
	createButton: {
		height: 50,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 24,
	},
	createButtonText: {
		color: 'black',
		fontSize: 16,
		fontWeight: '600',
	},
}); 