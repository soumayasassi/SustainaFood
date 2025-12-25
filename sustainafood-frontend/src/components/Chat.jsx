import { useState, useEffect } from "react";
import io from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import styled from "styled-components";

const socket = io("http://localhost:3000", { autoConnect: false });

const ChatContainer = styled.div`
  border: 1px solid #228b22;
  padding: 20px;
  border-radius: 10px;
  max-width: 100%;
  background: #f0f8f0;
`;

const MessageList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Message = styled.div`
  padding: 10px;
  border-radius: 8px;
  max-width: 70%;
  align-self: ${(props) => (props.isSender ? "flex-end" : "flex-start")};
  background: ${(props) => (props.isSender ? "#228b22" : "#ffffff")};
  color: ${(props) => (props.isSender ? "white" : "#3a5a3a")};
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #228b22;
  border-radius: 5px;
  font-size: 16px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: #228b22;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #1a7a1a;
  }
`;

const Chat = ({ recipientId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatId = user && recipientId ? [user.uid, recipientId].sort().join("_") : null;

  useEffect(() => {
    if (!user || !chatId) return;

    socket.auth = { token: user.token };
    socket.connect();
    socket.emit("joinChat", chatId);

    fetch(`http://localhost:3000/messages/${chatId}/messages`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des messages");
        return res.json();
      })
      .then((data) => setMessages(data))
      .catch((error) => console.error(error));

    socket.on("message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("message");
      socket.disconnect();
    };
  }, [chatId, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || !user) return;

    try {
      const response = await fetch(`http://localhost:3000/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          chatId,
          receiver: recipientId,
          content: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage("");
      } else {
        console.error("Erreur lors de l'envoi du message");
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
    }
  };

  return (
    <ChatContainer aria-label="Fenêtre de messagerie">
      <MessageList>
        {messages.map((msg) => (
          <Message key={msg._id} isSender={msg.sender._id === user?.uid}>
            <strong>{msg.sender.name}: </strong>{msg.content}
          </Message>
        ))}
      </MessageList>
      <InputContainer>
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrivez un message..."
          aria-label="Champ de saisie du message"
        />
        <Button onClick={sendMessage} aria-label="Envoyer le message">
          Envoyer
        </Button>
      </InputContainer>
    </ChatContainer>
  );
};

export default Chat;