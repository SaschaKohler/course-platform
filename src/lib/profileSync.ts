// src/lib/profileSync.ts
import { supabase } from "./supabaseClient";

export async function syncMissingProfiles() {
  try {
    // 1. Hole alle Auth Users
    const {
      data: { users },
      error: authError,
    } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    // 2. Hole alle existierenden Profile
    const { data: existingProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("id");
    if (profileError) throw profileError;

    // 3. Finde User ohne Profile
    const existingProfileIds = new Set(existingProfiles?.map((p) => p.id));
    const usersWithoutProfiles = users.filter(
      (user) => !existingProfileIds.has(user.id),
    );

    // 4. Erstelle fehlende Profile
    if (usersWithoutProfiles.length > 0) {
      const profilesToCreate = usersWithoutProfiles.map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        created_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from("profiles")
        .insert(profilesToCreate);

      if (insertError) throw insertError;

      console.log(`Created ${usersWithoutProfiles.length} missing profiles`);
      return usersWithoutProfiles.length;
    }

    return 0;
  } catch (error) {
    console.error("Error syncing profiles:", error);
    throw error;
  }
}
