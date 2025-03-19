-- Włączenie rozszerzenia UUID (jeśli jeszcze nie istnieje)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Usunięcie istniejących tabel (jeśli istnieją)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS birthdays;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS party_groups;
DROP TABLE IF EXISTS party_members;
DROP TABLE IF EXISTS party_proposals;
DROP TABLE IF EXISTS party_votes;
DROP TABLE IF EXISTS party_expenses;
DROP TABLE IF EXISTS party_tasks;
DROP TABLE IF EXISTS party_messages;

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

-- Utworzenie tabeli party_groups
CREATE TABLE party_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planning', 'confirmed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli party_members
CREATE TABLE party_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_group_id UUID NOT NULL REFERENCES party_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(party_group_id, user_id)
);

-- Utworzenie tabeli party_proposals
CREATE TABLE party_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_group_id UUID NOT NULL REFERENCES party_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location_url TEXT,
  image_url TEXT,
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli party_votes
CREATE TABLE party_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES party_proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(proposal_id, user_id)
);

-- Utworzenie tabeli party_expenses
CREATE TABLE party_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_group_id UUID NOT NULL REFERENCES party_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli party_tasks
CREATE TABLE party_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_group_id UUID NOT NULL REFERENCES party_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utworzenie tabeli party_messages
CREATE TABLE party_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  party_group_id UUID NOT NULL REFERENCES party_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tworzenie indeksów
CREATE INDEX birthdays_user_id_idx ON birthdays(user_id);
CREATE INDEX birthdays_date_idx ON birthdays(date);
CREATE INDEX events_user_id_idx ON events(user_id);
CREATE INDEX events_date_idx ON events(date);
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_reference_id_idx ON notifications(reference_id);
CREATE INDEX party_groups_created_by_idx ON party_groups(created_by);
CREATE INDEX party_members_party_group_id_idx ON party_members(party_group_id);
CREATE INDEX party_members_user_id_idx ON party_members(user_id);
CREATE INDEX party_proposals_party_group_id_idx ON party_proposals(party_group_id);
CREATE INDEX party_proposals_user_id_idx ON party_proposals(user_id);
CREATE INDEX party_votes_proposal_id_idx ON party_votes(proposal_id);
CREATE INDEX party_votes_user_id_idx ON party_votes(user_id);
CREATE INDEX party_expenses_party_group_id_idx ON party_expenses(party_group_id);
CREATE INDEX party_expenses_paid_by_idx ON party_expenses(paid_by);
CREATE INDEX party_tasks_party_group_id_idx ON party_tasks(party_group_id);
CREATE INDEX party_tasks_assigned_to_idx ON party_tasks(assigned_to);
CREATE INDEX party_messages_party_group_id_idx ON party_messages(party_group_id);
CREATE INDEX party_messages_user_id_idx ON party_messages(user_id);

-- Włączenie RLS dla wszystkich tabel
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_messages ENABLE ROW LEVEL SECURITY;

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

-- Polityki dla party_groups
DROP POLICY IF EXISTS "Użytkownicy mogą widzieć grupy, w których są członkami" ON party_groups;
CREATE POLICY "Użytkownicy mogą widzieć grupy, w których są członkami" 
  ON party_groups FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM party_members 
      WHERE party_members.party_group_id = party_groups.id 
      AND party_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Użytkownicy mogą tworzyć grupy" ON party_groups;
CREATE POLICY "Użytkownicy mogą tworzyć grupy" 
  ON party_groups FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Polityki dla party_members
DROP POLICY IF EXISTS "Użytkownicy mogą widzieć członków grup, w których są" ON party_members;
CREATE POLICY "Użytkownicy mogą widzieć członków grup, w których są" 
  ON party_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM party_members pm 
      WHERE pm.party_group_id = party_members.party_group_id 
      AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Administratorzy mogą dodawać członków" ON party_members;
CREATE POLICY "Administratorzy mogą dodawać członków" 
  ON party_members FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM party_members pm 
      WHERE pm.party_group_id = party_members.party_group_id 
      AND pm.user_id = auth.uid() 
      AND pm.role = 'admin'
    )
  );

-- Polityki dla party_proposals
DROP POLICY IF EXISTS "Użytkownicy mogą widzieć propozycje w swoich grupach" ON party_proposals;
CREATE POLICY "Użytkownicy mogą widzieć propozycje w swoich grupach" 
  ON party_proposals FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM party_members 
      WHERE party_members.party_group_id = party_proposals.party_group_id 
      AND party_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Użytkownicy mogą dodawać propozycje w swoich grupach" ON party_proposals;
CREATE POLICY "Użytkownicy mogą dodawać propozycje w swoich grupach" 
  ON party_proposals FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM party_members 
      WHERE party_members.party_group_id = party_proposals.party_group_id 
      AND party_members.user_id = auth.uid()
    )
  );

-- Polityki dla party_votes
DROP POLICY IF EXISTS "Użytkownicy mogą głosować na propozycje w swoich grupach" ON party_votes;
CREATE POLICY "Użytkownicy mogą głosować na propozycje w swoich grupach" 
  ON party_votes FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM party_proposals pp
      JOIN party_members pm ON pm.party_group_id = pp.party_group_id
      WHERE pp.id = party_votes.proposal_id
      AND pm.user_id = auth.uid()
    )
  );

-- Polityki dla party_expenses
DROP POLICY IF EXISTS "Użytkownicy mogą widzieć wydatki w swoich grupach" ON party_expenses;
CREATE POLICY "Użytkownicy mogą widzieć wydatki w swoich grupach" 
  ON party_expenses FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM party_members 
      WHERE party_members.party_group_id = party_expenses.party_group_id 
      AND party_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Użytkownicy mogą dodawać wydatki w swoich grupach" ON party_expenses;
CREATE POLICY "Użytkownicy mogą dodawać wydatki w swoich grupach" 
  ON party_expenses FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM party_members 
      WHERE party_members.party_group_id = party_expenses.party_group_id 
      AND party_members.user_id = auth.uid()
    )
  );

-- Polityki dla party_tasks
DROP POLICY IF EXISTS "Użytkownicy mogą widzieć zadania w swoich grupach" ON party_tasks;
CREATE POLICY "Użytkownicy mogą widzieć zadania w swoich grupach" 
  ON party_tasks FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM party_members 
      WHERE party_members.party_group_id = party_tasks.party_group_id 
      AND party_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Użytkownicy mogą dodawać zadania w swoich grupach" ON party_tasks;
CREATE POLICY "Użytkownicy mogą dodawać zadania w swoich grupach" 
  ON party_tasks FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM party_members 
      WHERE party_members.party_group_id = party_tasks.party_group_id 
      AND party_members.user_id = auth.uid()
    )
  );

-- Polityki dla party_messages
DROP POLICY IF EXISTS "Użytkownicy mogą widzieć wiadomości w swoich grupach" ON party_messages;
CREATE POLICY "Użytkownicy mogą widzieć wiadomości w swoich grupach" 
  ON party_messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM party_members 
      WHERE party_members.party_group_id = party_messages.party_group_id 
      AND party_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Użytkownicy mogą wysyłać wiadomości w swoich grupach" ON party_messages;
CREATE POLICY "Użytkownicy mogą wysyłać wiadomości w swoich grupach" 
  ON party_messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM party_members 
      WHERE party_members.party_group_id = party_messages.party_group_id 
      AND party_members.user_id = auth.uid()
    )
  );

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

DROP TRIGGER IF EXISTS update_party_groups_updated_at ON party_groups;
CREATE TRIGGER update_party_groups_updated_at
BEFORE UPDATE ON party_groups
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_party_proposals_updated_at ON party_proposals;
CREATE TRIGGER update_party_proposals_updated_at
BEFORE UPDATE ON party_proposals
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_party_expenses_updated_at ON party_expenses;
CREATE TRIGGER update_party_expenses_updated_at
BEFORE UPDATE ON party_expenses
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_party_tasks_updated_at ON party_tasks;
CREATE TRIGGER update_party_tasks_updated_at
BEFORE UPDATE ON party_tasks
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