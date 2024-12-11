import { supabase } from "@/lib/supabase";
import { getUserLocation, updateUserLocation } from "@/utils/location.utils";
import { registerForPushNotificationsAsync } from '@/utils/notifications';

interface MessageStatus {
  messageId: string;
  isRead: boolean;
  readAt?: string;
}

class ChatService {
  async canChat(user1Id: string, user2Id: string): Promise<boolean> {
    try {
      const { data: match, error } = await supabase
        .from("matches")
        .select("*")
        .or(`liker_id.eq.${user1Id},liked_id.eq.${user2Id}`)
        .or(`liked_id.eq.${user1Id},liker_id.eq.${user2Id}`)
        .single();

      if (error) throw error;
      return Boolean(match);
    } catch (error) {
      console.error("Error checking if users can chat:", error);
      throw error;
    }
  }

  async getChatRoom(user1Id: string, user2Id: string): Promise<string> {
    if (!(await this.canChat(user1Id, user2Id))) {
      throw new Error("Users have not matched yet");
    }

    const { data: existingRoom, error: existingRoomError } = await supabase
      .from("chat_rooms")
      .select("id")
      .or(`user1_id.eq.${user1Id},user2_id.eq.${user2Id}`)
      .or(`user1_id.eq.${user2Id},user2_id.eq.${user1Id}`)
      .single();

    if (existingRoomError && existingRoomError.code !== "PGRST116") {
      throw existingRoomError;
    }

    if (existingRoom) return existingRoom.id;

    const { data: newRoom, error: newRoomError } = await supabase
      .from("chat_rooms")
      .insert([{ user1_id: user1Id, user2_id: user2Id }])
      .select()
      .single();

    if (newRoomError) throw newRoomError;
    return newRoom.id;
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const { error } = await supabase.from("message_status").upsert({
      message_id: messageId,
      user_id: userId,
      is_read: true,
      read_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  async getUnreadCount(userId: string, chatRoomId: string): Promise<number> {
    const { data, error } = await supabase
      .from("messages")
      .select("id")
      .eq("chat_room_id", chatRoomId)
      .neq("sender_id", userId)
      .not("message_status", "is_read", "eq", true);

    if (error) throw error;
    return data?.length || 0;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("messages")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("sender_id", userId);

    if (error) throw error;
  }

  async updateTypingStatus(
    chatRoomId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    const { error } = await supabase.from("typing_status").upsert({
      chat_room_id: chatRoomId,
      user_id: userId,
      is_typing: isTyping,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  async uploadImage(file: Blob): Promise<string> {
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const { data, error } = await supabase.storage
      .from("chat-images")
      .upload(fileName, file);

    if (error) throw error;
    return data.path;
  }

  async handleUserLogin(userId: string) {
    const location = await getUserLocation();
    if (location) {
      await updateUserLocation(userId, location.latitude, location.longitude);
    }
    await registerForPushNotificationsAsync(userId);
  }

  async findUsersWithinRadius(userId: string, radius: number) {
    const { data, error } = await supabase
      .from("users")
      .select("id, latitude, longitude")
      .neq("id", userId)
      .lt("distance", radius);

    if (error) throw error;
    return data;
  }

  async findMatches(userId: string, radius: number) {
    const nearbyUsers = await this.findUsersWithinRadius(userId, radius);
    const matches = nearbyUsers.filter(
      (nearbyUser) =>
        nearbyUser.latitude !== null &&
        nearbyUser.longitude !== null &&
        nearbyUser.id !== userId
    );
    return matches;
  }
}

export default new ChatService();
