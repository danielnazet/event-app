import * as FileSystem from 'expo-file-system';

export const uploadBirthdayImage = async (userId: string, uri: string) => {
  try {
    const fileName = `photo_${Date.now()}.jpg`;

    // Utwórz FormData i dodaj plik
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      type: 'image/jpeg',
      name: fileName
    } as any);

    // Upload do Supabase
    const { data, error } = await supabase.storage
      .from('birthday-images')
      .upload(fileName, formData);

    if (error) {
      console.error('Błąd:', error);
      return { url: null, error };
    }

    // Pobierz URL
    const { data: urlData } = supabase.storage
      .from('birthday-images')
      .getPublicUrl(fileName);

    return { url: urlData?.publicUrl || null, error: null };

  } catch (error) {
    console.error('Błąd:', error);
    return { url: null, error };
  }
}; 