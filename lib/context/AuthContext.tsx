import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useRef,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { User } from "../types";

type AuthContextType = {
	session: Session | null;
	user: User | null;
	loading: boolean;
	signUp: (
		email: string,
		password: string,
		firstName: string,
		lastName: string
	) => Promise<{ error: any }>;
	signIn: (email: string, password: string) => Promise<{ error: any }>;
	signOut: () => Promise<void>;
	resetPassword: (email: string) => Promise<{ error: any }>;
	updateProfile: (
		updates: Partial<User>
	) => Promise<{ error: any; user: User | null }>;
	createProfileIfNotExists: () => Promise<{ error: any }>;
	createTestAdminProfile: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	// Referencje do poprzednich wartości, aby uniknąć niepotrzebnych aktualizacji
	const prevUserIdRef = useRef<string | null>(null);
	const isMountedRef = useRef(true);

	// Memoizowane funkcje, aby uniknąć ponownego tworzenia przy każdym renderowaniu
	const fetchUserProfile = useCallback(
		async (userId: string) => {
			// Jeśli komponent został odmontowany, nie aktualizuj stanu
			if (!isMountedRef.current) return null;

			// Jeśli już pobieramy profil dla tego samego użytkownika, nie rób tego ponownie
			if (prevUserIdRef.current === userId && user) {
				console.log("Profil już pobrany dla użytkownika:", userId);
				return user;
			}

			prevUserIdRef.current = userId;

			try {
				console.log("Pobieranie profilu dla użytkownika:", userId);
				const { data, error } = await supabase
					.from("profiles")
					.select("*")
					.eq("id", userId)
					.single();

				if (error) {
					console.error("Błąd podczas pobierania profilu:", error);

					if (error.code === "PGRST116") {
						console.log(
							"Profil nie istnieje, tworzę nowy profil..."
						);
						// Profil nie istnieje, utwórz go
						return await createProfileForUser(userId);
					}
				} else if (data) {
					console.log("Znaleziono profil:", data);
					// Aktualizuj stan tylko jeśli dane się zmieniły
					if (JSON.stringify(data) !== JSON.stringify(user)) {
						setUser(data as User);
					}
					setLoading(false);
					return data as User;
				}

				setLoading(false);
				return null;
			} catch (error) {
				console.error(
					"Nieoczekiwany błąd podczas pobierania profilu:",
					error
				);
				setLoading(false);
				return null;
			}
		},
		[user]
	);

	// Nowa funkcja do tworzenia profilu dla istniejącego użytkownika
	const createProfileForUser = useCallback(
		async (userId: string) => {
			// Jeśli komponent został odmontowany, nie aktualizuj stanu
			if (!isMountedRef.current) return null;

			try {
				// Pobierz dane użytkownika z auth
				const { data: authUser, error: userError } =
					await supabase.auth.getUser();

				if (userError || !authUser.user) {
					console.error(
						"Nie udało się pobrać danych użytkownika:",
						userError
					);
					setLoading(false);
					return null;
				}

				// Utwórz profil użytkownika
				const { data: newProfile, error: insertError } = await supabase
					.from("profiles")
					.insert([
						{
							id: userId,
							email: authUser.user.email,
							first_name: authUser.user.user_metadata?.first_name || "",
							last_name: authUser.user.user_metadata?.last_name || "",
							avatar_url: authUser.user.user_metadata?.avatar_url || null,
						},
					])
					.select()
					.single();

				if (insertError) {
					console.error(
						"Błąd podczas tworzenia profilu:",
						insertError
					);
					setLoading(false);
					return null;
				}

				// Konwertuj profil na obiekt User
				const userProfile: User = {
					id: newProfile.id,
					email: newProfile.email,
					first_name: newProfile.first_name,
					last_name: newProfile.last_name,
					avatar_url: newProfile.avatar_url,
					created_at: newProfile.created_at,
					updated_at: newProfile.updated_at,
				};

				// Aktualizuj stan
				setUser(userProfile);
				setLoading(false);
				return userProfile;
			} catch (error) {
				console.error(
					"Nieoczekiwany błąd podczas tworzenia profilu:",
					error
				);
				setLoading(false);
				return null;
			}
		},
		[isMountedRef]
	);

	useEffect(() => {
		// Ustaw flagę, że komponent jest zamontowany
		isMountedRef.current = true;

		// Pobierz aktualną sesję
		supabase.auth.getSession().then(({ data: { session }, error }) => {
			if (isMountedRef.current) {
				if (error) {
					console.error("Błąd podczas pobierania sesji:", error);
					setSession(null);
					setUser(null);
					setLoading(false);
					return;
				}
				
				setSession(session);
				if (session) {
					fetchUserProfile(session.user.id);
				} else {
					setLoading(false);
				}
			}
		});

		// Nasłuchuj zmian w sesji
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (isMountedRef.current) {
				setSession(session);
				if (session) {
					fetchUserProfile(session.user.id);
				} else {
					setUser(null);
					setLoading(false);
				}
			}
		});

		return () => {
			// Oznacz, że komponent został odmontowany
			isMountedRef.current = false;
			subscription.unsubscribe();
		};
	}, [fetchUserProfile]);

	// Dodaj nową funkcję do publicznego API kontekstu
	const createProfileIfNotExists = useCallback(async () => {
		if (!session || !session.user) {
			console.error("Użytkownik nie jest zalogowany");
			return { error: new Error("Użytkownik nie jest zalogowany") };
		}

		try {
			console.log("Próba utworzenia profilu dla użytkownika:", session.user.id);
			
			// Sprawdź, czy to konto testowe admin
			const isTestAdmin = session.user.email === "admin@admin.com";
			
			// Najpierw sprawdź, czy profil już istnieje
			const { data: existingProfile, error: checkError } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", session.user.id)
				.maybeSingle();
				
			if (checkError) {
				console.error("Błąd podczas sprawdzania profilu:", checkError);
				// Kontynuuj mimo błędu, aby spróbować utworzyć profil
			}
			
			// Jeśli profil już istnieje, użyj go
			if (existingProfile) {
				// Aktualizuj stan tylko jeśli dane się zmieniły
				if (JSON.stringify(existingProfile) !== JSON.stringify(user)) {
					setUser(existingProfile as User);
				}
				console.log("Profil już istnieje:", existingProfile);
				return { error: null };
			}
			
			// Jeśli profil nie istnieje, utwórz go
			console.log("Profil nie istnieje, tworzenie nowego profilu...");
			
			// Przygotuj dane profilu
			const profileData = {
				id: session.user.id,
				email: session.user.email || "",
				first_name: isTestAdmin ? "Admin" : (session.user.user_metadata?.first_name || ""),
				last_name: isTestAdmin ? "Testowy" : (session.user.user_metadata?.last_name || ""),
				avatar_url: session.user.user_metadata?.avatar_url || null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};
			
			try {
				// Utwórz profil
				const { data: newProfile, error: insertError } = await supabase
					.from("profiles")
					.insert([profileData])
					.select()
					.single();
					
				if (insertError) {
					console.error("Błąd podczas tworzenia profilu:", insertError);
					
					// Jeśli błąd dotyczy polityki RLS, spróbuj utworzyć profil ręcznie
					if (insertError.message.includes("violates row-level security policy")) {
						console.log("Błąd polityki RLS, tworzenie profilu ręcznie...");
						
						// Utwórz obiekt profilu ręcznie
						const manualProfile: User = {
							id: session.user.id,
							email: session.user.email || "",
							first_name: isTestAdmin ? "Admin" : (session.user.user_metadata?.first_name || ""),
							last_name: isTestAdmin ? "Testowy" : (session.user.user_metadata?.last_name || ""),
							avatar_url: session.user.user_metadata?.avatar_url || null,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
						};
						
						// Aktualizuj stan
						setUser(manualProfile);
						console.log("Profil utworzony ręcznie:", manualProfile);
						return { error: null };
					}
					
					return { error: insertError };
				}
				
				// Konwertuj profil na obiekt User
				const userProfile: User = {
					id: newProfile.id,
					email: newProfile.email,
					first_name: newProfile.first_name,
					last_name: newProfile.last_name,
					avatar_url: newProfile.avatar_url,
					created_at: newProfile.created_at,
					updated_at: newProfile.updated_at,
				};
				
				// Aktualizuj stan
				setUser(userProfile);
				console.log("Profil utworzony pomyślnie:", userProfile);
				return { error: null };
			} catch (insertError) {
				console.error("Nieoczekiwany błąd podczas tworzenia profilu:", insertError);
				
				// Utwórz obiekt profilu ręcznie w przypadku błędu
				const manualProfile: User = {
					id: session.user.id,
					email: session.user.email || "",
					first_name: isTestAdmin ? "Admin" : (session.user.user_metadata?.first_name || ""),
					last_name: isTestAdmin ? "Testowy" : (session.user.user_metadata?.last_name || ""),
					avatar_url: session.user.user_metadata?.avatar_url || null,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				};
				
				// Aktualizuj stan
				setUser(manualProfile);
				console.log("Profil utworzony ręcznie po błędzie:", manualProfile);
				return { error: null };
			}
		} catch (error) {
			console.error("Błąd podczas tworzenia profilu:", error);
			return { error };
		}
	}, [session, user]);

	const signUp = useCallback(
		async (
			email: string,
			password: string,
			firstName: string,
			lastName: string
		) => {
			try {
				// Rejestracja użytkownika z wyłączonym potwierdzeniem e-mail
				const { data, error } = await supabase.auth.signUp({
					email,
					password,
					options: {
						emailRedirectTo: undefined,
						data: {
							first_name: firstName,
							last_name: lastName,
						},
					},
				});

				if (error) {
					console.error("Błąd podczas rejestracji:", error);

					// Jeśli użytkownik już istnieje, spróbuj zalogować
					if (error.message === "User already registered") {
						console.log(
							"Użytkownik już istnieje, próbuję zalogować..."
						);
						return await signIn(email, password);
					}

					return { error };
				}

				if (!data.user) {
					return {
						error: new Error("Nie udało się utworzyć użytkownika"),
					};
				}

				// Zaloguj użytkownika od razu po rejestracji
				const { error: signInError } =
					await supabase.auth.signInWithPassword({
						email,
						password,
					});

				if (signInError) {
					console.error(
						"Błąd podczas logowania po rejestracji:",
						signInError
					);
					return { error: signInError };
				}

				// Utwórz profil użytkownika
				const { error: profileError } = await supabase
					.from("profiles")
					.upsert(
						[
							{
								id: data.user.id,
								email,
								first_name: firstName,
								last_name: lastName,
								created_at: new Date().toISOString(),
								updated_at: new Date().toISOString(),
							},
						],
						{ onConflict: "id" }
					);

				if (profileError) {
					console.error(
						"Błąd podczas tworzenia profilu:",
						profileError
					);

					// Jeśli nie udało się utworzyć profilu, spróbujmy pobrać istniejący
					await fetchUserProfile(data.user.id);

					// Zwracamy błąd, ale użytkownik może być już zalogowany
					return { error: profileError };
				}

				// Pobierz utworzony profil
				await fetchUserProfile(data.user.id);

				return { error: null };
			} catch (err) {
				console.error(
					"Nieoczekiwany błąd podczas tworzenia konta:",
					err
				);
				return { error: err };
			}
		},
		[fetchUserProfile]
	);

	const signIn = useCallback(async (email: string, password: string) => {
		try {
			// Specjalna obsługa dla konta testowego
			if (email === "admin@admin.com" && password === "admin123") {
				console.log("Logowanie jako konto testowe admin");
				
				// Próba zalogowania
				const { data, error } = await supabase.auth.signInWithPassword({
					email,
					password,
				});
				
				if (error) {
					console.error("Błąd logowania dla konta testowego:", error);
					
					// Jeśli błąd dotyczy tokenu, spróbuj wyczyścić sesję i zalogować się ponownie
					if (error.message.includes("Invalid Refresh Token") || 
						error.message.includes("Refresh Token Not Found")) {
						
						console.log("Próba wyczyszczenia sesji i ponownego logowania");
						await supabase.auth.signOut({ scope: 'global' });
						
						// Ponowna próba logowania
						const retryResult = await supabase.auth.signInWithPassword({
							email,
							password,
						});
						
						if (retryResult.error) {
							console.error("Ponowna próba logowania nie powiodła się:", retryResult.error);
							return { error: retryResult.error };
						}
						
						return { error: null };
					}
					
					return { error };
				}
				
				return { error: null };
			}
			
			// Standardowe logowanie dla innych kont
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			return { error };
		} catch (error) {
			console.error("Nieoczekiwany błąd podczas logowania:", error);
			return { error };
		}
	}, []);

	const signOut = useCallback(async () => {
		// Wyczyść wszystkie tokeny i dane sesji
		await supabase.auth.signOut({ scope: 'global' });
		setUser(null);
		setSession(null);
	}, []);

	const resetPassword = useCallback(async (email: string) => {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: "myapp://reset-password",
		});

		return { error };
	}, []);

	const updateProfile = useCallback(
		async (updates: Partial<User>) => {
			if (!user)
				return {
					error: new Error("Użytkownik nie jest zalogowany"),
					user: null,
				};

			const { data, error } = await supabase
				.from("profiles")
				.update({
					...updates,
					updated_at: new Date().toISOString(),
				})
				.eq("id", user.id)
				.select()
				.single();

			if (!error && data) {
				// Aktualizuj stan tylko jeśli dane się zmieniły
				if (JSON.stringify(data) !== JSON.stringify(user)) {
					setUser(data as User);
				}
				return { error: null, user: data as User };
			}

			return { error, user: null };
		},
		[user]
	);

	// Funkcja do tworzenia profilu dla konta testowego
	const createTestAdminProfile = useCallback(async () => {
		try {
			// Sprawdź, czy profil już istnieje
			const { data: existingProfile, error: checkError } = await supabase
				.from("profiles")
				.select("*")
				.eq("email", "admin@admin.com")
				.maybeSingle();
				
			if (checkError) {
				console.error("Błąd podczas sprawdzania profilu testowego:", checkError);
				// Kontynuuj mimo błędu, aby spróbować utworzyć profil
			}
			
			// Jeśli profil już istnieje, użyj go
			if (existingProfile) {
				console.log("Profil testowy już istnieje:", existingProfile);
				// Aktualizuj stan tylko jeśli dane się zmieniły
				if (JSON.stringify(existingProfile) !== JSON.stringify(user)) {
					setUser(existingProfile as User);
				}
				return { error: null };
			}
			
			// Pobierz ID użytkownika testowego
			const { data: authData, error: authError } = await supabase.auth.getUser();
			
			if (authError || !authData.user) {
				console.error("Błąd podczas pobierania danych użytkownika testowego:", authError);
				// Kontynuuj mimo błędu, używając danych z sesji
				if (!session || !session.user) {
					return { error: new Error("Nie znaleziono użytkownika") };
				}
			}
			
			const userId = authData?.user?.id || session?.user?.id;
			if (!userId) {
				return { error: new Error("Nie znaleziono ID użytkownika") };
			}
			
			// Utwórz profil dla konta testowego
			try {
				const { data: newProfile, error: insertError } = await supabase
					.from("profiles")
					.insert([
						{
							id: userId,
							email: "admin@admin.com",
							first_name: "Admin",
							last_name: "Testowy",
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
						},
					])
					.select()
					.single();
					
				if (insertError) {
					console.error("Błąd podczas tworzenia profilu testowego:", insertError);
					
					// Jeśli błąd dotyczy polityki RLS, spróbuj utworzyć profil ręcznie
					if (insertError.message.includes("violates row-level security policy")) {
						console.log("Błąd polityki RLS, tworzenie profilu testowego ręcznie...");
						
						// Utwórz obiekt profilu ręcznie
						const manualProfile: User = {
							id: userId,
							email: "admin@admin.com",
							first_name: "Admin",
							last_name: "Testowy",
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
						};
						
						// Aktualizuj stan
						setUser(manualProfile);
						console.log("Profil testowy utworzony ręcznie:", manualProfile);
						return { error: null };
					}
					
					return { error: insertError };
				}
				
				// Konwertuj profil na obiekt User
				const userProfile: User = {
					id: newProfile.id,
					email: newProfile.email,
					first_name: newProfile.first_name,
					last_name: newProfile.last_name,
					avatar_url: newProfile.avatar_url,
					created_at: newProfile.created_at,
					updated_at: newProfile.updated_at,
				};
				
				// Aktualizuj stan
				setUser(userProfile);
				console.log("Profil testowy utworzony pomyślnie:", userProfile);
				return { error: null };
			} catch (insertError) {
				console.error("Nieoczekiwany błąd podczas tworzenia profilu testowego:", insertError);
				
				// Utwórz obiekt profilu ręcznie w przypadku błędu
				const manualProfile: User = {
					id: userId,
					email: "admin@admin.com",
					first_name: "Admin",
					last_name: "Testowy",
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				};
				
				// Aktualizuj stan
				setUser(manualProfile);
				console.log("Profil testowy utworzony ręcznie po błędzie:", manualProfile);
				return { error: null };
			}
		} catch (error) {
			console.error("Nieoczekiwany błąd podczas tworzenia profilu testowego:", error);
			return { error };
		}
	}, [session, user]);

	const value = {
		session,
		user,
		loading,
		signUp,
		signIn,
		signOut,
		resetPassword,
		updateProfile,
		createProfileIfNotExists,
		createTestAdminProfile,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
