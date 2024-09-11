import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [guid, setGuid] = useState("");
  const messagesContainerRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    wsRef.current = new WebSocket("ws://103.217.145.32:3000/cable");

    wsRef.current.onopen = () => {
      console.log("Connected to websocket server");
      const newGuid = Math.random().toString(36).substring(2, 15);
      setGuid(newGuid);

      wsRef.current.send(
        JSON.stringify({
          command: "subscribe",
          identifier: JSON.stringify({
            id: newGuid,
            channel: "MessagesChannel",
          }),
        })
      );
    };

    wsRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "ping" || data.type === "welcome" || data.type === "confirm_subscription") {
        return;
      }

      const message = data.message;
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    // Cleanup WebSocket connection on component unmount
    return () => {
      wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    resetScroll();
  }, [messages]);

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

  const fetchMessages = async () => {
    const response = await fetch("http://103.217.145.32:3000/messages");
    const data = await response.json();
    setMessages(data);
  };

  const resetScroll = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  return (
    <div className="App">
      <div className="messageHeader">
        <h1>Messages</h1>
        <p>Guid: {guid}</p>
      </div>
      <div className="messages" ref={messagesContainerRef}>
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
