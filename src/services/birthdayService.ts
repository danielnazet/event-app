import { supabase } from '../lib/supabase';
import { Birthday } from '../../lib/types';

export const getBirthdays = async (userId: string): Promise<{ data: Birthday[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('birthdays')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  return { data, error };
};

export const getBirthdayById = async (id: string): Promise<{ data: Birthday | null; error: any }> => {
  const { data, error } = await supabase
    .from('birthdays')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
};

export const createBirthday = async (
  birthday: Omit<Birthday, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Birthday | null; error: any }> => {
  const { data, error } = await supabase
    .from('birthdays')
    .insert([
      {
        ...birthday,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  return { data, error };
};

export const updateBirthday = async (
  id: string,
  updates: Partial<Omit<Birthday, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<{ data: Birthday | null; error: any }> => {
  const { data, error } = await supabase
    .from('birthdays')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

export const deleteBirthday = async (id: string): Promise<{ error: any }> => {
  const { error } = await supabase.from('birthdays').delete().eq('id', id);
  return { error };
};

export const uploadBirthdayImage = async (
  userId: string,
  uri: string
): Promise<{ url: string | null; error: any }> => {
  try {
    const fileName = `birthday_${userId}_${new Date().getTime()}`;
    const fileExt = uri.split('.').pop();
    const filePath = `${userId}/birthdays/${fileName}.${fileExt}`;

    // Konwertuj URI na Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Prześlij plik do Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('birthday-images')
      .upload(filePath, blob);

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    // Pobierz publiczny URL
    const { data } = supabase.storage.from('birthday-images').getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error };
  }
}; 