import React, { useState, useEffect, useRef } from 'react';
import { useNeuralock, useNeuralockSession } from '@neuralock/react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// Message component with end-to-end encryption
function SecureMessagingApp() {
  const { encrypt, decrypt, isInitialized } = useNeuralock();
  const { session } = useNeuralockSession();
  
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isInitialized) return;

    socketRef.current = io('wss://messaging.neuralock.app', {
      auth: {
        sessionId: session.id,
        publicKey: session.ephemeralKeyPair.publicKey
      }
    });

    socketRef.current.on('message', handleIncomingMessage);
    socketRef.current.on('typing', handleTypingIndicator);
    socketRef.current.on('conversation_update', handleConversationUpdate);

    return () => {
      socketRef.current.disconnect();
    };
  }, [isInitialized, session]);

  // Message encryption/decryption
  const encryptMessage = async (content, conversationId, type = 'text') => {
    const messageData = {
      id: uuidv4(),
      content,
      type,
      sender: session.userPublicKey,
      timestamp: new Date().toISOString(),
      conversationId
    };

    // Encrypt the message content
    const objectId = `msg:${conversationId}:${messageData.id}`;
    const encrypted = await encrypt(JSON.stringify(messageData), objectId);

    return {
      ...messageData,
      encrypted,
      objectId
    };
  };

  const decryptMessage = async (encryptedMessage) => {
    try {
      const decrypted = await decrypt(
        encryptedMessage.encrypted,
        encryptedMessage.objectId
      );
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      return null;
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;

    try {
      // Encrypt message
      const encryptedMessage = await encryptMessage(
        inputMessage,
        activeConversation.id
      );

      // Handle attachments
      const encryptedAttachments = await Promise.all(
        attachments.map(async (file) => {
          const fileData = await fileToBase64(file);
          const attachmentId = `attachment:${activeConversation.id}:${uuidv4()}`;
          const encrypted = await encrypt(fileData, attachmentId);
          
          return {
            id: attachmentId,
            name: file.name,
            size: file.size,
            type: file.type,
            encrypted
          };
        })
      );

      // Send via WebSocket
      socketRef.current.emit('send_message', {
        message: encryptedMessage,
        attachments: encryptedAttachments,
        conversationId: activeConversation.id
      });

      // Update local state
      setMessages(prev => [...prev, {
        ...encryptedMessage,
        attachments: encryptedAttachments,
        status: 'sent'
      }]);

      // Clear input
      setInputMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle incoming messages
  const handleIncomingMessage = async (data) => {
    const { message, attachments } = data;

    // Decrypt message
    const decryptedMessage = await decryptMessage(message);
    if (!decryptedMessage) return;

    // Decrypt attachments if any
    const decryptedAttachments = await Promise.all(
      (attachments || []).map(async (attachment) => {
        try {
          const decryptedData = await decrypt(
            attachment.encrypted,
            attachment.id
          );
          return {
            ...attachment,
            data: decryptedData
          };
        } catch (error) {
          console.error('Failed to decrypt attachment:', error);
          return null;
        }
      })
    );

    // Add to messages
    setMessages(prev => [...prev, {
      ...decryptedMessage,
      attachments: decryptedAttachments.filter(Boolean),
      status: 'received'
    }]);

    // Show notification
    if (document.hidden) {
      showNotification(decryptedMessage);
    }
  };

  // Group chat functionality
  const createGroupConversation = async (name, participants) => {
    const conversationId = `group:${uuidv4()}`;
    
    // Create shared encryption context for group
    const groupKey = {
      id: conversationId,
      name,
      participants,
      createdAt: new Date().toISOString(),
      createdBy: session.userPublicKey
    };

    // Encrypt group metadata
    const encrypted = await encrypt(
      JSON.stringify(groupKey),
      `group:meta:${conversationId}`
    );

    // Share with all participants
    for (const participant of participants) {
      await shareGroupAccess(conversationId, participant);
    }

    socketRef.current.emit('create_group', {
      conversationId,
      name,
      participants,
      encrypted
    });

    return conversationId;
  };

  const shareGroupAccess = async (conversationId, participantAddress) => {
    // Grant read/write permissions to group messages
    await updatePermissions(`group:meta:${conversationId}`, {
      add: { [participantAddress]: ['read', 'write'] }
    });
  };

  // Message expiration
  const sendExpiringMessage = async (content, expirationMinutes) => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

    const messageData = {
      content,
      expiresAt: expiresAt.toISOString()
    };

    const encryptedMessage = await encryptMessage(
      JSON.stringify(messageData),
      activeConversation.id,
      'expiring'
    );

    socketRef.current.emit('send_message', {
      message: encryptedMessage,
      expiresAt: expiresAt.toISOString()
    });

    // Schedule local deletion
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== encryptedMessage.id));
    }, expirationMinutes * 60 * 1000);
  };

  // Typing indicators
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', {
        conversationId: activeConversation.id,
        isTyping: true
      });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('typing', {
        conversationId: activeConversation.id,
        isTyping: false
      });
    }, 1000);
  };

  // File handling
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    // Validate file sizes (max 10MB per file)
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Max size is 10MB.`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // UI Components
  return (
    <div className="secure-messaging-app">
      <div className="sidebar">
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          onSelect={setActiveConversation}
          onCreateGroup={createGroupConversation}
        />
      </div>

      <div className="main-chat">
        {activeConversation ? (
          <>
            <ChatHeader conversation={activeConversation} />
            
            <MessageList
              messages={messages.filter(
                msg => msg.conversationId === activeConversation.id
              )}
              currentUser={session.userPublicKey}
            />

            <MessageInput
              value={inputMessage}
              onChange={setInputMessage}
              onSend={sendMessage}
              onTyping={handleTyping}
              attachments={attachments}
              onFileSelect={handleFileSelect}
              onSendExpiring={sendExpiringMessage}
            />
          </>
        ) : (
          <div className="no-conversation">
            Select a conversation or create a new one
          </div>
        )}
      </div>
    </div>
  );
}

// Conversation list component
function ConversationList({ conversations, activeConversation, onSelect, onCreateGroup }) {
  const [showNewGroup, setShowNewGroup] = useState(false);

  return (
    <div className="conversation-list">
      <div className="header">
        <h2>Messages</h2>
        <button onClick={() => setShowNewGroup(true)}>+ New Group</button>
      </div>

      <div className="conversations">
        {conversations.map(conv => (
          <div
            key={conv.id}
            className={`conversation-item ${activeConversation?.id === conv.id ? 'active' : ''}`}
            onClick={() => onSelect(conv)}
          >
            <div className="avatar">
              {conv.type === 'group' ? '👥' : '👤'}
            </div>
            <div className="info">
              <div className="name">{conv.name}</div>
              <div className="last-message">{conv.lastMessage}</div>
            </div>
            <div className="meta">
              <div className="time">{formatTime(conv.lastMessageTime)}</div>
              {conv.unreadCount > 0 && (
                <div className="unread-badge">{conv.unreadCount}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          onCreate={onCreateGroup}
        />
      )}
    </div>
  );
}

// Message list component
function MessageList({ messages, currentUser }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map(message => (
        <div
          key={message.id}
          className={`message ${message.sender === currentUser ? 'sent' : 'received'}`}
        >
          <div className="content">
            {message.type === 'expiring' && (
              <div className="expiring-indicator">🔥 Expires soon</div>
            )}
            
            <div className="text">{message.content}</div>
            
            {message.attachments?.map(attachment => (
              <div key={attachment.id} className="attachment">
                {attachment.type.startsWith('image/') ? (
                  <img src={attachment.data} alt={attachment.name} />
                ) : (
                  <div className="file">
                    📎 {attachment.name} ({formatFileSize(attachment.size)})
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="metadata">
            <span className="time">{formatTime(message.timestamp)}</span>
            {message.status === 'sent' && <span className="status">✓✓</span>}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

// Message input component
function MessageInput({
  value,
  onChange,
  onSend,
  onTyping,
  attachments,
  onFileSelect,
  onSendExpiring
}) {
  const [showExpiryOptions, setShowExpiryOptions] = useState(false);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    } else {
      onTyping();
    }
  };

  return (
    <div className="message-input">
      {attachments.length > 0 && (
        <div className="attachment-preview">
          {attachments.map((file, index) => (
            <div key={index} className="attachment-item">
              {file.name}
              <button onClick={() => removeAttachment(index)}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="input-container">
        <button className="attach-button" onClick={() => fileInputRef.current.click()}>
          📎
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          multiple
          style={{ display: 'none' }}
        />

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
        />

        <button className="expiry-button" onClick={() => setShowExpiryOptions(!showExpiryOptions)}>
          ⏰
        </button>

        <button className="send-button" onClick={onSend}>
          Send
        </button>
      </div>

      {showExpiryOptions && (
        <div className="expiry-options">
          <button onClick={() => onSendExpiring(value, 5)}>5 min</button>
          <button onClick={() => onSendExpiring(value, 30)}>30 min</button>
          <button onClick={() => onSendExpiring(value, 60)}>1 hour</button>
          <button onClick={() => onSendExpiring(value, 1440)}>24 hours</button>
        </div>
      )}
    </div>
  );
}

// Helper functions
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return date.toLocaleDateString();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function showNotification(message) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('New Message', {
      body: message.content,
      icon: '/icon.png'
    });
  }
}

export default SecureMessagingApp;