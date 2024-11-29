// src/contexts/AuthContext.tsx
import { createContext, useCallback, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { Database } from "../types/supabase";
import toast from "react-hot-toast";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<
    Database["public"]["Tables"]["profiles"]["Row"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialProfileFetch, setIsInitialProfileFetch] = useState(true);
  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // Create profile if it doesn't exist
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: userId,
                  email: user?.email,
                  full_name: user?.user_metadata?.full_name || "",
                },
              ])
              .select()
              .single();

            if (createError) throw createError;
            setProfile(newProfile);
          } else {
            throw error;
          }
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error in profile management:", error);
        setError("Failed to load user profile");
      }
    },
    [user],
  );

  useEffect(() => {
    // Prüfe zuerst den localStorage
    const storedSession = localStorage.getItem("supabase-auth");
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        // Wenn ein Token vorhanden ist, setze initial die Session
        if (parsedSession?.access_token) {
          setLoading(true);
          console.log("Found stored session:", parsedSession);
        }
      } catch (error) {
        console.error("Error parsing stored session:", error);
      }
    }

    // Dann erst die Supabase Session Prüfung
    const initSession = async () => {
      try {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (currentSession) {
          console.log("Session validated with Supabase");
          setSession(currentSession);
          setUser(currentSession.user);

          if (currentSession.user) {
            await fetchProfile(currentSession.user.id);
          }
        }
      } catch (error) {
        console.error("Error during session initialization:", error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession?.user?.id);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Handle profile on auth state change
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Expose loading state and session info for debugging
  console.log("AuthContext state:", {
    loading,
    hasSession: !!session,
    hasUser: !!user,
    hasProfile: !!profile,
  });

  const signIn = async (email: string, password: string) => {
    setError(null);

    try {
      // 1. Anmeldung durchführen
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;

      // 2. Session und User setzen
      if (authData.session && authData.user) {
        setSession(authData.session);
        setUser(authData.user);

        // 3. Profil abrufen oder erstellen
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select()
          .eq("id", authData.user.id)
          .single();

        // 4. Wenn kein Profil existiert, eines erstellen
        if (profileError && profileError.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: authData.user.id,
              email: authData.user.email,
              full_name: authData.user.user_metadata?.full_name || null,
            })
            .select()
            .single();

          if (createError) throw createError;
          if (newProfile) setProfile(newProfile);
        } else if (profileError) {
          throw profileError;
        } else if (profileData) {
          setProfile(profileData);
        }

        return authData;
      }
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case "Invalid login credentials":
            throw new Error("Ungültige Anmeldedaten");
          case "Email not confirmed":
            throw new Error("Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse");
          default:
            throw new Error(error.message);
        }
      }
      throw new Error("Ein unerwarteter Fehler ist aufgetreten");
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    try {
      console.log("AuthContext: Starting sign up");
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.log("AuthContext: Sign up error:", signUpError);
        throw signUpError;
      }

      if (data.user) {
        console.log("AuthContext: Creating profile");
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email,
          full_name: fullName,
        });

        if (profileError) {
          console.log("AuthContext: Profile creation error:", profileError);
          throw profileError;
        }
      }

      console.log("AuthContext: Sign up successful");
      toast.success(
        "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails",
      );
    } catch (error) {
      console.error("AuthContext: Error in signUp:", error);
      if (error instanceof Error) {
        switch (error.message) {
          case "User already registered":
            toast.error("Diese E-Mail-Adresse ist bereits registriert");
            break;
          default:
            toast.error("Registrierung fehlgeschlagen");
        }
        setError(error.message);
      }
      throw error;
    }
  };
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Erfolgreich abgemeldet");
    } catch (error) {
      console.error("Error signing out:", error);
      setError(error instanceof Error ? error.message : "Error signing out");
      toast.error("Abmelden fehlgeschlagen");
      throw error;
    }
  };

  const value = {
    session,
    user,
    profile,
    signIn,
    signUp,
    signOut,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
