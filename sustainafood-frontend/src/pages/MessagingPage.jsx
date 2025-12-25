"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import io from "socket.io-client"
import { useAuth } from "../contexts/AuthContext"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import SpeechButton from "../components/SpeechButton"
import "../assets/styles/MessagingPage.css"
import "../assets/styles/ChatPage.css"
import pdp from "../assets/images/pdp.png"
import { getUserById } from "../api/userService"

const socket = io("http://localhost:3000", { autoConnect: false })

const MessagingPage = () => {
  const { user: authUser } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConversations, setFilteredConversations] = useState([])
  const [selectedRecipientId, setSelectedRecipientId] = useState(null)
  const [recipient, setRecipient] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState(null)
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const chatId =
    authUser && selectedRecipientId ? [authUser._id || authUser.id, selectedRecipientId].sort().join("_") : null
  const lastMessageRef = useRef(null)

  useEffect(() => {
    if (!authUser) {
      setError("You must be logged in to access messaging.")
      return
    }

    const fetchConversations = async () => {
      try {
        const response = await fetch(`http://localhost:3000/messages/conversations`, {
          headers: { "X-User-Id": authUser?._id || authUser?.id },
        })
        if (!response.ok) throw new Error("Error fetching conversations")
        const data = await response.json()
        setConversations(data)
        setFilteredConversations(data)
      } catch (err) {
        setError("Unable to load conversations.")
      }
    }

    fetchConversations()
  }, [authUser])

  useEffect(() => {
    if (!selectedRecipientId || !authUser) {
      setRecipient(null)
      setMessages([])
      return
    }

    const fetchRecipientAndMessages = async () => {
      try {
        const response = await getUserById(selectedRecipientId)
        setRecipient(response.data)

        if (chatId) {
          socket.auth = { token: authUser.token }
          socket.connect()
          socket.emit("joinChat", chatId)

          fetch(`http://localhost:3000/messages/${chatId}/messages`, {
            headers: { "X-User-Id": authUser?._id || authUser?.id },
          })
            .then((res) => {
              if (!res.ok) throw new Error("Error fetching messages")
              return res.json()
            })
            .then(async (data) => {
              setMessages(data)
              const unreadMessages = data.filter(
                (msg) => msg.receiver._id === (authUser?._id || authUser?.id) && !msg.read,
              )
              if (unreadMessages.length > 0) {
                await fetch(`http://localhost:3000/messages/${chatId}/mark-as-read`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-User-Id": authUser?._id || authUser?.id,
                  },
                })
                // Update local state to reflect read status
                setMessages((prev) =>
                  prev.map((msg) =>
                    unreadMessages.some((unread) => unread._id === msg._id) ? { ...msg, read: true } : msg,
                  ),
                )
              }
            })
            .catch((error) => setError(error.message))

          socket.on("message", (message) => {
            setMessages((prev) => [...prev, message])
            if (isChatCollapsed && message.sender._id !== (authUser?._id || authUser?.id)) {
              setHasNewMessage(true)
            }
            // Mark new message as read if it's from the recipient and the user is viewing the chat
            if (message.receiver._id === (authUser?._id || authUser?.id) && !message.read && !isChatCollapsed) {
              fetch(`http://localhost:3000/messages/${chatId}/mark-as-read`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-User-Id": authUser?._id || authUser?.id,
                },
              })
                .then(() => {
                  setMessages((prev) =>
                    prev.map((msg) => (msg._id === message._id ? { ...msg, read: true } : msg)),
                  )
                })
                .catch((err) => setError("Failed to mark message as read: " + err.message))
            }
          })

          socket.on("typing", ({ userId }) => {
            if (userId !== (authUser?._id || authUser?.id)) setIsTyping(true)
          })

          socket.on("stopTyping", ({ userId }) => {
            if (userId !== (authUser?._id || authUser?.id)) setIsTyping(false)
          })

          return () => {
            socket.off("message")
            socket.off("typing")
            socket.off("stopTyping")
            socket.disconnect()
          }
        }
      } catch (err) {
        setError("Unable to load recipient or messages.")
      }
    }

    fetchRecipientAndMessages()
  }, [selectedRecipientId, authUser, chatId, isChatCollapsed])

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase()
    setSearchQuery(query)
    const filtered = conversations.filter((conv) => {
      const recipient = conv.participants.find((p) => p._id !== (authUser?._id || authUser?.id))
      return recipient?.name.toLowerCase().includes(query)
    })
    setFilteredConversations(filtered)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || !authUser) return
    try {
      const response = await fetch(`http://localhost:3000/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": authUser?._id || authUser?.id,
        },
        body: JSON.stringify({ chatId, receiver: selectedRecipientId, content: newMessage }),
      })
      if (response.ok) {
        setNewMessage("")
        socket.emit("stopTyping", { chatId, userId: authUser?._id || authUser?.id })
      } else {
        setError("Error sending message")
      }
    } catch (error) {
      setError("Network error: " + error.message)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    if (!chatId || !authUser) return
    socket.emit("typing", { chatId, userId: authUser?._id || authUser?.id })
    if (typingTimeout) clearTimeout(typingTimeout)
    const timeout = setTimeout(() => socket.emit("stopTyping", { chatId, userId: authUser?._id || authUser?.id }), 2000)
    setTypingTimeout(timeout)
  }

  const generateChatText = () => {
    const messagesText = messages.length
      ? `Conversation with ${recipient?.name}: ${messages
          .map(
            (msg) => `${msg.sender._id === (authUser?._id || authUser?.id) ? "You" : msg.sender.name}: ${msg.content}`,
          )
          .join(". ")}`
      : `No conversation ongoing with ${recipient?.name}.`
    return `Chat with ${recipient?.name}. ${messagesText}`
  }

  const toggleChatCollapse = () => {
    setIsChatCollapsed(!isChatCollapsed)
    if (hasNewMessage) {
      setHasNewMessage(false)
    }
  }

  const recipientPhotoUrl = recipient?.photo ? `http://localhost:3000/${recipient.photo}` : pdp

  if (error) {
    return (
      <div className="messaging-container">
        <Navbar />
        <div className="messaging-error">{error}</div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="messaging-container">
      <Navbar />
      <div className={`messaging-main ${isChatCollapsed ? "collapsed" : ""}`}>
        <div
          className={`chat-collapse-toggle ${isChatCollapsed ? "collapsed" : ""} ${hasNewMessage ? "new-message" : ""}`}
          onClick={toggleChatCollapse}
          aria-label={isChatCollapsed ? "Expand chat" : "Collapse chat"}
          title={isChatCollapsed ? "Expand chat" : "Collapse chat"}
        />

        <div className="messaging-sidebar">
          <div className="messaging-header">
            <h2>Conversations</h2>
            <input
              type="text"
              placeholder="Search..."
              className="messaging-search"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <div className="messaging-conversations">
            {filteredConversations.map((conversation) => {
              const recipient = conversation.participants.find((p) => p._id !== (authUser?._id || authUser?.id))
              const recipientPhotoUrl = recipient?.photo ? `http://localhost:3000/${recipient.photo}` : pdp
              const lastMessageTime = conversation.lastMessage
                ? new Date(conversation.lastMessage.timestamp).toLocaleString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""
              const timeLabel = lastMessageTime
                ? conversation.lastMessage.timestamp.includes("2025-05-12")
                  ? "Yesterday"
                  : lastMessageTime
                : "N/A"

              return (
                <div
                  key={conversation.chatId}
                  className={`conversation-item ${selectedRecipientId === recipient._id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedRecipientId(recipient._id)
                    if (isChatCollapsed) {
                      setIsChatCollapsed(false)
                    }
                  }}
                >
                  <img
                    src={recipientPhotoUrl || "/placeholder.svg"}
                    alt={`Profile photo of ${recipient.name}`}
                    className="conversation-photo"
                  />
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <h3>{recipient.name}</h3>
                      <span className="conversation-time">{timeLabel}</span>
                    </div>
                    <p className="conversation-preview">{conversation.lastMessage?.content || "No messages yet..."}</p>
                  </div>
                  {conversation.unreadCount > 0 && <span className="unread-count">{conversation.unreadCount}</span>}
                </div>
              )
            })}
          </div>
        </div>
        <div className="messaging-chat">
          {selectedRecipientId ? (
            <div className="chat-main">
              <div className="chat-header">
                <h2 style={{ color: "white" }}>{recipient?.name}</h2>
                <button
                  className="chat-back-btn"
                  onClick={() => {
                    setSelectedRecipientId(null)
                    setIsChatCollapsed(false)
                  }}
                  aria-label="Close Chat"
                >
                  Close
                </button>
              </div>
              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div
                    key={msg._id}
                    className={`chat-message ${msg.sender._id === (authUser?._id || authUser?.id) ? "sent" : "received"}`}
                    ref={index === messages.length - 1 ? lastMessageRef : null}
                  >
                    <img
                      src={msg.sender.photo ? `http://localhost:3000/${msg.sender.photo}` : pdp}
                      alt={`Profile photo of ${msg.sender.name}`}
                      className="chat-message-avatar"
                    />
                    <div className="chat-message-content">
                      {msg.content}
                      <span className="chat-message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="chat-message received" ref={lastMessageRef}>
                    <div className="chat-message-content">
                      <span>{recipient?.name} is typing...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="chat-input-container">
                <SpeechButton textToRead={generateChatText()} />
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  placeholder="type something..."
                  className="chat-input"
                  aria-label="Message input field"
                />
                <button onClick={sendMessage} className="chat-send-btn" aria-label="Send message">
                  <span className="send-icon">▶</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-placeholder">Select a conversation to start chatting</div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default MessagingPage