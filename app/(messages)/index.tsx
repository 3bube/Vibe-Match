import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { router } from "expo-router";

type Message = {
  id: string;
  sender: string;
  preview: string;
  timestamp: Date;
  unread: boolean;
};

const initialMessages: Message[] = [
  {
    id: "1",
    sender: "John Doe",
    preview: "Hey, how are you doing?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    unread: true,
  },
  {
    id: "2",
    sender: "Jane Smith",
    preview: "Are we still on for lunch tomorrow?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unread: false,
  },
  {
    id: "3",
    sender: "Mike Johnson",
    preview: "I've sent you the report you requested.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unread: true,
  },
  {
    id: "4",
    sender: "Sarah Williams",
    preview: "Thanks for your help yesterday!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    unread: false,
  },
  {
    id: "5",
    sender: "David Brown",
    preview: "Can we reschedule our meeting?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    unread: false,
  },
];

const handleChatPress = (id) => {
  router.push(`/chat/${id}`);
};

export default function MessageListScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => handleChatPress(item.id)}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.sender[0].toUpperCase()}</Text>
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={[styles.senderName, item.unread && styles.unreadText]}>
            {item.sender}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        <Text
          style={[styles.messagePreview, item.unread && styles.unreadText]}
          numberOfLines={1}
        >
          {item.preview}
        </Text>
      </View>
      {item.unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.composeButton}>
          <IconSymbol name="edit" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    // height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  composeButton: {
    padding: 8,
  },
  messageList: {
    paddingVertical: 8,
  },
  messageItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  messagePreview: {
    fontSize: 14,
    color: "#666",
  },
  unreadText: {
    fontWeight: "bold",
    color: "#000",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#000",
    marginLeft: 8,
  },
});
