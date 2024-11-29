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
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const fetchProfile = useCallback(
    async (userId: string, userEmail?: string | undefined) => {
      // Prevent multiple simultaneous profile fetches
      if (isProfileLoading) return;

      setIsProfileLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // Only create profile if we don't have one yet
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: userId,
                  email: userEmail || "",
                  full_name: "",
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
      } finally {
        setIsProfileLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const {
          data: { session: currentSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (currentSession && mounted) {
          setSession(currentSession);
          setUser(currentSession.user);
          await ensureProfile(currentSession.user);

          if (currentSession.user) {
            await fetchProfile(
              currentSession.user.id,
              currentSession.user.email,
            );
          }
        }
      } catch (error) {
        console.error("Error during session initialization:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession?.user?.id);

      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id, newSession.user.email);
          await ensureProfile(newSession.user);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    });

    return () => {
      mounted = false;
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

  const ensureProfile = async (user: User) => {
    try {
      // 1. Prüfe ob Profil existiert
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select()
        .eq("id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      // 2. Wenn kein Profil existiert, erstelle eines
      if (!existingProfile) {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([
            {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || null,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
        return newProfile;
      }

      // 3. Wenn Profil existiert, aktualisiere es wenn nötig
      if (
        existingProfile.email !== user.email ||
        existingProfile.full_name !== user.user_metadata?.full_name
      ) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from("profiles")
          .update({
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
          })
          .eq("id", user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setProfile(updatedProfile);
        return updatedProfile;
      }

      setProfile(existingProfile);
      return existingProfile;
    } catch (error) {
      console.error("Error ensuring profile:", error);
      throw error;
    }
  };

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
      console.log(authData);
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
