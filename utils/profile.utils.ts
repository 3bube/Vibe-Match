import { supabase } from "../lib/supabase";
import { uploadFile } from "./upload.utils";
/**
 * Saves the user's profile to the database.
 *
 * @param {string} bio The user's bio.
 * @param {string} mood The user's mood.
 * @returns {Promise<void>} A promise that resolves when the profile is saved.
 * @throws {Error} An error if the profile could not be saved.
 */
export const handleSaveProfile = async (
  bio: string,
  mood: string,
  profilePicture: string,
  age: number
): Promise<void> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  let profilePictureUri: string | null = null;

  if (profilePicture) {
    profilePictureUri = await uploadFile({
      uri: profilePicture,
      bucket: "profile_picture",
    });
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    user_id: user.id,
    bio,
    mood,
    photo_url: profilePictureUri,
    age,
  });

  if (profileError) throw profileError;
};

export const fetchProfiles = async (): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(30);
    if (error) throw new Error("Error fetching profiles:", error);

    return data;
  } catch (error) {
    console.error("Error fetching profiles:", error);
  }
};

export const fetchProfile = async (userId: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId);
    if (error) throw new Error("Error fetching profile:", error);

    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
  }
};

export const handleSwipeRight = async (profile: {
  id: string;
  user: { id: string };
}): Promise<void> => {
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError) throw new Error("Error getting user:", userError);

  // Save like to database
  const { error } = await supabase.from("matches").insert({
    liker_id: data.user.id,
    liked_id: profile.id,
  });
  if (error) console.error(error);
};

export const handleSwipeLeft = (profile: any) => {
  console.log("Skipped:", profile);
};
