import React from 'react';

function MessageList({ messages }) {
  const getEmoji = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes("absence")) return "⚠️";
  if (lower.startsWith("ajout")) return "➕";
  if (lower.startsWith("supprime")) return "➖";
  return "💬";
  };

  return (
    <div style={{ height: "300px", overflowY: "auto", border: "1px solid #ccc", padding: 10, backgroundColor: "#f9f9f9" }}>
      {messages.map((msg, i) => (
        <div key={i} style={{ display: "flex", justifyContent: msg.sender === "Moi" ? "flex-end" : "flex-start", marginBottom: 10 }}>
          <div style={{ maxWidth: "70%", padding: 10, borderRadius: 10, backgroundColor: msg.sender === "Moi" ? "#dcf8c6" : "#e6e6e6", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <div style={{ fontSize: "0.85em", marginBottom: 4 }}>
              <strong>{msg.sender}</strong> <span style={{ color: "#888", fontSize: "0.75em" }}>{msg.time}</span>
            </div>
            <div>
              {getEmoji(msg.text)} {msg.text}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MessageList;