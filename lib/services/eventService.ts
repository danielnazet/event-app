import { supabase } from '../supabase';
import { Event } from '../types';
import uuid from 'react-native-uuid';

export const getEvents = async (userId: string): Promise<{ data: Event[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  return { data, error };
};

export const getEventById = async (id: string): Promise<{ data: Event | null; error: any }> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
};

export const createEvent = async (
  event: Omit<Event, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Event | null; error: any }> => {
  try {
    console.log('Próba utworzenia wydarzenia:', event);
    
    // Generujemy UUID ręcznie używając react-native-uuid
    const id = uuid.v4().toString();
    
    // Tworzymy obiekt danych wydarzenia zgodnie z nowym schematem bazy danych
    const eventData = {
      id: id,
      user_id: event.user_id,
      title: event.title,
      description: event.description,
      date: event.date,
    };
    
    console.log('Wysyłanie danych wydarzenia:', eventData);
    
    // Nie używamy metody .select() po wstawieniu danych
    const { error } = await supabase
      .from('events')
      .insert([eventData]);

    if (error) {
      console.error('Błąd podczas tworzenia wydarzenia w Supabase:', error);
      return { data: null, error };
    }

    // Ręcznie tworzymy obiekt danych na podstawie wysłanych danych
    const createdEvent = {
      ...eventData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Event;

    console.log('Wydarzenie utworzone pomyślnie:', createdEvent);
    return { data: createdEvent, error: null };
  } catch (error) {
    console.error('Nieoczekiwany błąd podczas tworzenia wydarzenia:', error);
    return { data: null, error };
  }
};

export const updateEvent = async (
  id: string,
  updates: Partial<Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<{ data: Event | null; error: any }> => {
  const { data, error } = await supabase
    .from('events')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

export const deleteEvent = async (id: string): Promise<{ error: any }> => {
  const { error } = await supabase.from('events').delete().eq('id', id);
  return { error };
};

export const uploadEventImage = async (
  userId: string,
  uri: string
): Promise<{ url: string | null; error: any }> => {
  try {
    const fileName = `event_${userId}_${new Date().getTime()}`;
    const fileExt = uri.split('.').pop();
    const filePath = `${userId}/events/${fileName}.${fileExt}`;

    // Konwertuj URI na Blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Prześlij plik do Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, blob);

    if (uploadError) {
      return { url: null, error: uploadError };
    }

    // Pobierz publiczny URL
    const { data } = supabase.storage.from('event-images').getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    return { url: null, error };
  }
}; 