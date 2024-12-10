import React, { useState, useEffect } from "react";
import { View, TextInput, Button, FlatList, Text } from "react-native";
import { supabase } from "@/lib/supabase";

const ChatScreen = ({ matchId }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId);
      if (!error) setMessages(data);
    };

    const subscription = supabase
      .from(`messages:match_id=eq.${matchId}`)
      .on("INSERT", (payload) => setMessages((prev) => [...prev, payload.new]))
      .subscribe();

    fetchMessages();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [matchId]);

  const sendMessage = async () => {
    const { user } = supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: user.id,
      content: message,
    });

    if (!error) setMessage("");
  };

  return (
    <View>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <Text>{`${item.sender_id}: ${item.content}`}</Text>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Type a message"
      />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
};

export default ChatScreen;
