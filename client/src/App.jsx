import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [guid, setGuid] = useState("");
  const wsRef = useRef(null); // To keep a reference to the WebSocket

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket("ws://103.217.145.32:3000/cable");
    wsRef.current = ws; // Store WebSocket reference

    const newGuid = Math.random().toString(36).substring(2, 15); // Generate GUID
    setGuid(newGuid);

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      ws.send(JSON.stringify({
        command: "subscribe",
        identifier: JSON.stringify({
          id: newGuid,
          channel: "MessagesChannel",
        }),
      }));
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type !== "ping" && data.type !== "welcome" && data.type !== "confirm_subscription") {
        const message = data.message;
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };

    return () => {
      // Cleanup on component unmount
      ws.close();
    };
  }, []); // Empty dependency array means this effect runs once on mount

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = e.target.message.value;
    e.target.message.value = "";

    await fetch("http://103.217.145.32:3000/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    });
  };

  return (
    <div className="App">
      <div className="messageHeader">
        <h1>Messages</h1>
        <p>Guid: {guid}</p>
      </div>
      <div className="messages" id="messages">
        {messages.map((message) => (
          <div className="message" key={message.id}>
            <p>{message.body}</p>
          </div>
        ))}
      </div>
      <div className="messageForm">
        <form onSubmit={handleSubmit}>
          <input className="messageInput" type="text" name="message" />
          <button className="messageButton" type="submit">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;