import { supabase } from "@/lib/supabase";

export const sendMessage = async (
  message: string,
  matchId: string,
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: userId,
      content: message,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error sending message:", error);
    throw error; // Re-throw to handle in component
  }
};

export const fetchMessages = async (matchId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error; // Re-throw to handle in component
  }
};
