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
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/context/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function NewProposalScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Błąd', 'Potrzebujemy uprawnień do galerii, aby wybrać zdjęcie');
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
  };

  const uploadImage = async (uri: string) => {
    if (!user) return null;

    setUploadingImage(true);
    try {
      const fileName = `proposal_${user.id}_${new Date().getTime()}`;
      const fileExt = uri.split('.').pop();
      const filePath = `${user.id}/proposals/${fileName}.${fileExt}`;

      // Konwertuj URI na Blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Sprawdź czy blob nie jest pusty
      if (blob.size === 0) {
        throw new Error('Nie udało się przetworzyć zdjęcia');
      }

      // Prześlij plik do Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('party-proposals')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Błąd uploadu:', uploadError);
        throw uploadError;
      }

      // Pobierz publiczny URL
      const { data } = supabase.storage
        .from('party-proposals')
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('Nie udało się pobrać URL-a zdjęcia');
      }

      return data.publicUrl;
    } catch (error) {
      console.error('Błąd podczas uploadu:', error);
      Alert.alert('Błąd', 'Nie udało się przesłać zdjęcia');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Błąd', 'Nazwa miejsca jest wymagana');
      return;
    }

    if (!user) {
      Alert.alert('Błąd', 'Musisz być zalogowany, aby dodać propozycję');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri);
      }

      const { error } = await supabase
        .from('party_proposals')
        .insert([
          {
            party_group_id: id,
            user_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            location_url: locationUrl.trim() || null,
            image_url: imageUrl,
          },
        ]);

      if (error) throw error;

      Alert.alert('Sukces', 'Propozycja została dodana');
      router.back();
    } catch (error) {
      console.error('Błąd podczas dodawania propozycji:', error);
      Alert.alert('Błąd', 'Nie udało się dodać propozycji');
    } finally {
      setLoading(false);
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
        <Text style={[styles.title, { color: colors.text }]}>Nowa propozycja</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Nazwa miejsca</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Wprowadź nazwę miejsca"
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
            placeholder="Wprowadź opis miejsca (opcjonalnie)"
            placeholderTextColor={colors.icon}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Link do mapy</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={locationUrl}
            onChangeText={setLocationUrl}
            placeholder="Wklej link do mapy (opcjonalnie)"
            placeholderTextColor={colors.icon}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Zdjęcie miejsca</Text>
          <TouchableOpacity
            style={[
              styles.imageButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            onPress={pickImage}
            disabled={uploadingImage}
          >
            {imageUri ? (
              <Text style={[styles.imageText, { color: colors.text }]}>
                Zmień zdjęcie
              </Text>
            ) : (
              <Text style={[styles.imageText, { color: colors.text }]}>
                Wybierz zdjęcie
              </Text>
            )}
            <Ionicons name="image-outline" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.tint }]}
          onPress={handleSubmit}
          disabled={loading || uploadingImage}
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text style={styles.submitButtonText}>Dodaj propozycję</Text>
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
  imageButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageText: {
    fontSize: 16,
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
}); 