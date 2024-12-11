import { supabase } from "@/lib/supabase";

class MessageService{

    async sendMessage(chatRoomId: string, content: string, senderId: string): Promise<void>{
        const { data: message, error } = await supabase
        .from("messages")
        .insert({
            chat_room_id: chatRoomId,
            sender_id: senderId,
            content: content,
        })
        .select()
        .single();

        if(error) throw error;

            // mark as read for the sender
    await supabase
    .from("message_reads")
    .insert.({
        message_id: message.id, 
        user_id: senderId,
    });

    await supabase.functions.invoke("send-chat-notification", {
        body: { chatRoomId, senderId, content}
    });
    }

    async markAsRead(messageId: string, userId: string): Promise<void>{
        await supabase
        .from("message_reads")
        .upsert({
            message_id: messageId,
            user_id: userId,
        })
    }
}