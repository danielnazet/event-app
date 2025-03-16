-- Włączenie rozszerzenia UUID (jeśli jeszcze nie istnieje)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Usunięcie istniejących tabel (jeśli istnieją)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS birthdays;
DROP TABLE IF EXISTS profiles;

-- Utworzenie tabeli profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli birthdays
CREATE TABLE birthdays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  date DATE NOT NULL,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reference_id UUID NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('birthday', 'event')),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('week_before', 'day_before')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tworzenie indeksów
CREATE INDEX birthdays_user_id_idx ON birthdays(user_id);
CREATE INDEX birthdays_date_idx ON birthdays(date);
CREATE INDEX events_user_id_idx ON events(user_id);
CREATE INDEX events_date_idx ON events(date);
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_reference_id_idx ON notifications(reference_id);

-- Włączenie RLS dla wszystkich tabel
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Polityki dla tabeli profiles
DROP POLICY IF EXISTS "Użytkownicy mogą czytać tylko swój profil" ON profiles;
CREATE POLICY "Użytkownicy mogą czytać tylko swój profil" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Użytkownicy mogą aktualizować tylko swój profil" ON profiles;
CREATE POLICY "Użytkownicy mogą aktualizować tylko swój profil" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Polityki dla tabeli birthdays
DROP POLICY IF EXISTS "Użytkownicy mogą czytać tylko swoje urodziny" ON birthdays;
CREATE POLICY "Użytkownicy mogą czytać tylko swoje urodziny" 
  ON birthdays FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Użytkownicy mogą dodawać tylko swoje urodziny" ON birthdays;
CREATE POLICY "Użytkownicy mogą dodawać tylko swoje urodziny" 
  ON birthdays FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Użytkownicy mogą aktualizować tylko swoje urodziny" ON birthdays;
CREATE POLICY "Użytkownicy mogą aktualizować tylko swoje urodziny" 
  ON birthdays FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Użytkownicy mogą usuwać tylko swoje urodziny" ON birthdays;
CREATE POLICY "Użytkownicy mogą usuwać tylko swoje urodziny" 
  ON birthdays FOR DELETE 
  USING (auth.uid() = user_id);

-- Polityki dla tabeli events
DROP POLICY IF EXISTS "Użytkownicy mogą czytać tylko swoje wydarzenia" ON events;
CREATE POLICY "Użytkownicy mogą czytać tylko swoje wydarzenia" 
  ON events FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Użytkownicy mogą dodawać tylko swoje wydarzenia" ON events;
CREATE POLICY "Użytkownicy mogą dodawać tylko swoje wydarzenia" 
  ON events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Użytkownicy mogą aktualizować tylko swoje wydarzenia" ON events;
CREATE POLICY "Użytkownicy mogą aktualizować tylko swoje wydarzenia" 
  ON events FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Użytkownicy mogą usuwać tylko swoje wydarzenia" ON events;
CREATE POLICY "Użytkownicy mogą usuwać tylko swoje wydarzenia" 
  ON events FOR DELETE 
  USING (auth.uid() = user_id);

-- Polityki dla tabeli notifications
DROP POLICY IF EXISTS "Użytkownicy mogą czytać tylko swoje powiadomienia" ON notifications;
CREATE POLICY "Użytkownicy mogą czytać tylko swoje powiadomienia" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Użytkownicy mogą dodawać tylko swoje powiadomienia" ON notifications;
CREATE POLICY "Użytkownicy mogą dodawać tylko swoje powiadomienia" 
  ON notifications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Użytkownicy mogą aktualizować tylko swoje powiadomienia" ON notifications;
CREATE POLICY "Użytkownicy mogą aktualizować tylko swoje powiadomienia" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Użytkownicy mogą usuwać tylko swoje powiadomienia" ON notifications;
CREATE POLICY "Użytkownicy mogą usuwać tylko swoje powiadomienia" 
  ON notifications FOR DELETE 
  USING (auth.uid() = user_id);

-- Funkcja do automatycznej aktualizacji pola updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggery do automatycznej aktualizacji pola updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_birthdays_updated_at ON birthdays;
CREATE TRIGGER update_birthdays_updated_at
BEFORE UPDATE ON birthdays
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Konfiguracja Storage
INSERT INTO storage.buckets (id, name, public)
SELECT 'profile-avatars', 'Profile Avatars', true
WHERE NOT EXISTS (SELECT FROM storage.buckets WHERE id = 'profile-avatars');

INSERT INTO storage.buckets (id, name, public)
SELECT 'birthday-images', 'Birthday Images', true
WHERE NOT EXISTS (SELECT FROM storage.buckets WHERE id = 'birthday-images');

INSERT INTO storage.buckets (id, name, public)
SELECT 'event-images', 'Event Images', true
WHERE NOT EXISTS (SELECT FROM storage.buckets WHERE id = 'event-images');

-- Polityki dla Storage
DROP POLICY IF EXISTS "Publiczny dostęp do avatarów" ON storage.objects;
CREATE POLICY "Publiczny dostęp do avatarów" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "Użytkownicy mogą przesyłać swoje avatary" ON storage.objects;
CREATE POLICY "Użytkownicy mogą przesyłać swoje avatary" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'profile-avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

DROP POLICY IF EXISTS "Publiczny dostęp do zdjęć urodzin" ON storage.objects;
CREATE POLICY "Publiczny dostęp do zdjęć urodzin" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'birthday-images');

DROP POLICY IF EXISTS "Użytkownicy mogą przesyłać zdjęcia do swoich urodzin" ON storage.objects;
CREATE POLICY "Użytkownicy mogą przesyłać zdjęcia do swoich urodzin" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'birthday-images' AND auth.uid() = (storage.foldername(name))[1]::uuid);

DROP POLICY IF EXISTS "Publiczny dostęp do zdjęć wydarzeń" ON storage.objects;
CREATE POLICY "Publiczny dostęp do zdjęć wydarzeń" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Użytkownicy mogą przesyłać zdjęcia do swoich wydarzeń" ON storage.objects;
CREATE POLICY "Użytkownicy mogą przesyłać zdjęcia do swoich wydarzeń" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'event-images' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Odświeżenie pamięci podręcznej schematu
NOTIFY pgrst, 'reload schema'; 