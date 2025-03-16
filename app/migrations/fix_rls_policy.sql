-- Dodanie polityki umożliwiającej wstawianie wierszy do tabeli profiles
DROP POLICY IF EXISTS "Użytkownicy mogą dodawać swój profil" ON profiles;
CREATE POLICY "Użytkownicy mogą dodawać swój profil" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Dodanie polityki umożliwiającej wstawianie wierszy do tabeli profiles dla wszystkich użytkowników (alternatywne rozwiązanie)
-- DROP POLICY IF EXISTS "Zezwalaj na wszystkie operacje INSERT" ON profiles;
-- CREATE POLICY "Zezwalaj na wszystkie operacje INSERT" 
--   ON profiles FOR INSERT 
--   WITH CHECK (true);

-- Odświeżenie pamięci podręcznej schematu
NOTIFY pgrst, 'reload schema'; 