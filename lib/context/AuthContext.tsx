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
				// Najpierw sprawdź, czy użytkownik istnieje w tabeli auth.users
				const { data: authUserExists, error: checkError } =
					await supabase
						.from("auth.users")
						.select("id")
						.eq("id", userId)
						.maybeSingle();

				if (checkError || !authUserExists) {
					console.error(
						"Użytkownik nie istnieje w tabeli auth.users:",
						checkError
					);
					setLoading(false);
					return null;
				}

				// Pobierz dane użytkownika z auth
				const { data: authUser, error: userError } =
					await supabase.auth.getUser();

				if (userError || !authUser.user) {
					console.error(
						"Nie można pobrać danych użytkownika:",
						userError
					);
					setLoading(false);
					return null;
				}

				console.log("Dane użytkownika z auth:", authUser.user);

				// Przygotuj dane profilu
				const profileData = {
					id: userId,
					email: authUser.user.email || "",
					first_name: authUser.user.user_metadata?.first_name || "",
					last_name: authUser.user.user_metadata?.last_name || "",
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				};

				console.log("Tworzenie profilu z danymi:", profileData);

				// Sprawdź, czy profil już istnieje
				const { data: existingProfile, error: checkProfileError } =
					await supabase
						.from("profiles")
						.select("id")
						.eq("id", userId)
						.maybeSingle();

				if (existingProfile) {
					console.log("Profil już istnieje, aktualizuję dane");
				}

				// Utwórz lub zaktualizuj profil
				const { data: profile, error: profileError } = await supabase
					.from("profiles")
					.upsert([profileData], { onConflict: "id" })
					.select()
					.single();

				if (profileError) {
					console.error(
						"Błąd podczas tworzenia profilu:",
						profileError
					);
					setLoading(false);
					return null;
				}

				console.log("Utworzono profil:", profile);
				// Aktualizuj stan tylko jeśli dane się zmieniły
				if (
					profile &&
					JSON.stringify(profile) !== JSON.stringify(user)
				) {
					setUser(profile as User);
				}
				setLoading(false);
				return profile as User;
			} catch (error) {
				console.error(
					"Nieoczekiwany błąd podczas tworzenia profilu:",
					error
				);
				setLoading(false);
				return null;
			}
		},
		[user]
	);

	useEffect(() => {
		// Ustaw flagę, że komponent jest zamontowany
		isMountedRef.current = true;

		// Pobierz aktualną sesję
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (isMountedRef.current) {
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
			return { error: new Error("Użytkownik nie jest zalogowany") };
		}

		const profile = await fetchUserProfile(session.user.id);
		if (!profile) {
			return { error: new Error("Nie udało się utworzyć profilu") };
		}

		return { error: null };
	}, [session, fetchUserProfile]);

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
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		return { error };
	}, []);

	const signOut = useCallback(async () => {
		await supabase.auth.signOut();
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
