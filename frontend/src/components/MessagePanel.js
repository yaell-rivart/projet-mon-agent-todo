import React, { useEffect, useState, useRef } from "react";

function MessagePanel() {
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/messages/");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connecté");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("📩 Message reçu :", msg);

        if (msg.history) {
          setMessages(msg.history);
        } else {
          setMessages((prev) => [...prev, msg]);
        }
      } catch (e) {
        console.error("Erreur de parsing du message WebSocket :", e);
      }
    };

    ws.onclose = () => console.log("❌ WebSocket déconnecté");
    ws.onerror = (e) => console.error("❗ WebSocket erreur :", e);

    return () => {
      ws.close();
    };
  }, []);

  // Scroll automatique au dernier message
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const getAlignment = (msg) => {
    return msg.sender === "Utilisateur" ? "flex-end" : "flex-start";
  };

  const getBackgroundColor = (msg) => {
    if (msg.sender === "Utilisateur") {
      return "#dcf8c6"; // vert clair utilisateur (à droite)
    }
    if (msg.sender === "Erreur" || msg.type === "error") {
      return "#ffe6e6"; // rouge clair erreur (à gauche)
    }
    return "#e6e6e6"; // gris clair bot/info (à gauche)
  };

  return (
    <div ref={containerRef} style={styles.container}>
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: getAlignment(msg),
            marginBottom: 10,
          }}
        >
          <div
            style={{
              maxWidth: "70%",
              padding: 10,
              borderRadius: 10,
              backgroundColor: getBackgroundColor(msg),
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: "0.85em", marginBottom: 4 }}>
              <strong>{msg.sender}</strong>{" "}
              <span style={{ color: "#888", fontSize: "0.75em" }}>{msg.time}</span>
            </div>
            <div>{msg.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    height: "200px",
    overflowY: "auto",
    border: "1px solid #ccc",
    padding: 10,
    backgroundColor: "#f9f9f9",
  },
};

export default MessagePanel;
