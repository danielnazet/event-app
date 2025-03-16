-- Usunięcie istniejącej tabeli profiles (jeśli istnieje)
DROP TABLE IF EXISTS profiles;

-- Utworzenie tabeli profiles z poprawioną referencją do auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dodanie ograniczenia klucza obcego po utworzeniu tabeli
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Odświeżenie pamięci podręcznej schematu
NOTIFY pgrst, 'reload schema'; 