import { useState } from 'react';

export default function useMessagePanel() {
  const [messages, setMessages] = useState([]);

  const addMessage = (sender, text) => {
    const newMsg = {
      sender,
      text,
      time: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  return {
    messages,
    addMessage,
    clearMessages: () => setMessages([]),
  };
}
