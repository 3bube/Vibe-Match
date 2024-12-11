import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth.context";
import ChatService from "@/services/ChatService";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import debounce from "lodash/debounce";

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_deleted?: boolean;
  is_image?: boolean;
  image_url?: string;
};

type TypingStatus = {
  user_id: string;
  is_typing: boolean;
};

export default function MessagesScreen() {
  const { id: chatRoomId } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    const checkMatchStatus = async () => {
      if (!user) return;

      try {
        const canChat = await ChatService.canChat(user.id, otherUserId);
        if (!canChat) {
          Alert.alert("No Match", "You need to match with this user to start chatting.");
          router.back(); // Redirect back if not matched
        }
      } catch (error) {
        console.error("Error checking match status:", error);
        Alert.alert("Error", "Failed to verify match status.");
      }
    };

    checkMatchStatus();
  }, [user, otherUserId]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    if (user) {
      ChatService.handleUserLogin(user.id);
    }
  }, [user]);

  // Debounced typing indicator
  const updateTypingStatus = debounce(async (isTyping: boolean) => {
    if (!user) return;
    try {
      await ChatService.updateTypingStatus(chatRoomId as string, user.id, isTyping);
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  }, 500);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_room_id", chatRoomId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        Alert.alert("Error", "Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel(`chat_room_${chatRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
          if (payload.new.sender_id !== user?.id) {
            ChatService.markMessageAsRead(payload.new.id, user?.id || "");
          }
        }
      )
      .subscribe();

    // Subscribe to typing status
    const typingSubscription = supabase
      .channel(`typing_${chatRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_status",
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        (payload) => {
          setTypingUsers((current) =>
            current.map((status) =>
              status.user_id === payload.new.user_id
                ? { ...status, is_typing: payload.new.is_typing }
                : status
            )
          );
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
      updateTypingStatus.cancel();
    };
  }, [chatRoomId, user?.id]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        chat_room_id: chatRoomId,
        sender_id: user.id,
        content: inputText.trim(),
      });

      if (error) throw error;
      setInputText("");
      updateTypingStatus(false);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant permission to access your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (uri: string) => {
    if (!user) return;
    setImageUploading(true);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imagePath = await ChatService.uploadImage(blob);

      const { error } = await supabase.from("messages").insert({
        chat_room_id: chatRoomId,
        sender_id: user.id,
        content: "Sent an image",
        is_image: true,
        image_url: imagePath,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setImageUploading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      await ChatService.deleteMessage(messageId, user.id);
      setMessages((current) =>
        current.map((msg) =>
          msg.id === messageId ? { ...msg, is_deleted: true } : msg
        )
      );
    } catch (error) {
      console.error("Error deleting message:", error);
      Alert.alert("Error", "Failed to delete message");
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUserMessage = item.sender_id === user?.id;

    if (item.is_deleted) {
      return (
        <View style={[styles.messageBubble, styles.deletedMessage]}>
          <Text style={styles.deletedMessageText}>Message deleted</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        onLongPress={() => {
          if (isUserMessage) {
            Alert.alert(
              "Delete Message",
              "Are you sure you want to delete this message?",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: () => handleDeleteMessage(item.id) },
              ]
            );
          }
        }}
      >
        <View
          style={[
            styles.messageBubble,
            isUserMessage ? styles.userMessage : styles.otherMessage,
          ]}
        >
          {item.is_image ? (
            <Image
              source={{ uri: supabase.storage.from("chat-images").getPublicUrl(item.image_url || "").data.publicUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : (
            <Text
              style={
                isUserMessage
                  ? styles.userMessageText
                  : styles.otherMessageText
              }
            >
              {item.content}
            </Text>
          )}
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
      />

      {typingUsers.some((status) => status.is_typing) && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Someone is typing...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        style={styles.inputContainer}
      >
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleImagePick}
          disabled={imageUploading}
        >
          <Ionicons name="image" size={24} color="#000" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            updateTypingStatus(Boolean(text.trim()));
          }}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    height: 60,
    backgroundColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 20,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#000",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
  },
  userMessageText: {
    color: "#fff",
    fontSize: 16,
  },
  otherMessageText: {
    color: "#000",
    fontSize: 16,
  },
  deletedMessage: {
    backgroundColor: "#f0f0f0",
    alignSelf: "center",
  },
  deletedMessageText: {
    color: "#999",
    fontStyle: "italic",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  typingIndicator: {
    padding: 8,
    backgroundColor: "#f9f9f9",
  },
  typingText: {
    color: "#666",
    fontSize: 12,
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});
