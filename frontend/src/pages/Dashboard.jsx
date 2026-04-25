import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import InputBar from "../components/InputBar";
import Contacts from "./Contacts";
import { useWallet } from "../context/WalletContext";
import { useChat } from "../hooks/useChat";
import { saveChat, getChatById } from "../utils/localStorage";
import { getChatHistory } from "../utils/api.js";

const Dashboard = () => {
  const { walletAddress, walletType } = useWallet();
  const {
    messages,
    isLoading,
    error,
    sessionId,
    currentTransaction,
    chatStatus,
    sendChatMessage,
    confirmTransaction,
    startNewChat,
    loadChatHistory,
  } = useChat();
  const [currentChatId, setCurrentChatId] = useState(null);
  const [viewingChatId, setViewingChatId] = useState(null);
  const [viewingMessages, setViewingMessages] = useState([]);
  const [showContacts, setShowContacts] = useState(false);

  const isTransactionComplete =
    chatStatus === "success" || chatStatus === "failed";
  const isReadOnly = viewingChatId !== null;

  // Save current chat
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      const chat = {
        id: sessionId,
        preview: messages[0]?.content?.substring(0, 50) || "Untitled",
        timestamp: new Date().toISOString(),
        messages: messages,
      };
      saveChat(chat);
      setCurrentChatId(sessionId);
    }
  }, [messages, sessionId]);

  const handleNewTransaction = () => {
    setViewingChatId(null);
    setViewingMessages([]);
    startNewChat();
  };

  const handleSelectChat = async (sessionId) => {
    try {
      const history = await getChatHistory(walletAddress, sessionId);
      setViewingChatId(sessionId);
      setViewingMessages(
        history.map((h) => ({
          id: h.id,
          role: h.role,
          content: h.message,
          timestamp: h.createdAt,
        })),
      );
    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  };

  const displayMessages = isReadOnly ? viewingMessages : messages;
  const displayIsLoading = isReadOnly ? false : isLoading;

  if (showContacts) {
    return <Contacts onBack={() => setShowContacts(false)} />;
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col">
      <Header onContactsClick={() => setShowContacts(true)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          onNewTransaction={handleNewTransaction}
          onSelectChat={handleSelectChat}
          currentChatId={isReadOnly ? viewingChatId : currentChatId}
        />

        <div className="flex-1 flex flex-col">
          <ChatArea
            messages={displayMessages}
            isLoading={displayIsLoading}
            error={error}
            chatStatus={isReadOnly ? null : chatStatus}
            isReadOnly={isReadOnly}
            currentTransaction={currentTransaction}
          />

          {!isReadOnly && (
            <InputBar
              onSend={(msg) => sendChatMessage(walletAddress, msg)}
              onConfirm={() => {
                if (currentTransaction?.id) {
                  confirmTransaction(walletAddress, currentTransaction.id);
                }
              }}
              isLoading={isLoading}
              isDisabled={!walletAddress}
              chatStatus={chatStatus}
              hasTransaction={!!currentTransaction}
            />
          )}

          {isReadOnly && (
            <div className="bg-slate-800 border-t border-slate-700 px-6 py-3 flex justify-between items-center">
              <span className="text-sm text-slate-400">
                Viewing past transaction (read-only)
              </span>
              <button
                onClick={handleNewTransaction}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                ← Back to new transaction
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
