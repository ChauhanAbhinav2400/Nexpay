import React, { useEffect, useState } from "react";
import { getAllChatSessions } from "../utils/api.js";
import { useWallet } from "../context/WalletContext.jsx";

const Sidebar = ({ onNewTransaction, onSelectChat, currentChatId }) => {
  const [chats, setChats] = useState([]);
  const { walletAddress } = useWallet();

  useEffect(() => {
    if (!walletAddress) return;

    getAllChatSessions(walletAddress)
      .then((sessions) => setChats(sessions))
      .catch(console.error);
  }, [walletAddress]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-700 flex flex-col p-4">
      <button
        onClick={onNewTransaction}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg mb-6 transition-colors"
      >
        + New Transaction
      </button>

      <div className="flex-1 overflow-y-auto">
        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">
          Past Chats
        </h3>
        {chats.length === 0 ? (
          <p className="text-xs text-slate-500">No previous chats</p>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <button
                key={chat.sessionId}
                onClick={() => onSelectChat(chat.sessionId)}
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  currentChatId === chat.sessionId
                    ? "bg-purple-600 text-white"
                    : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <div className="text-xs font-medium truncate">
                  {chat.preview || "Untitled"}
                </div>
                <div
                  className={`text-xs  mt-1 ${
                    currentChatId === chat.sessionId
                      ? "text-white"
                      : "text-slate-500"
                  }`}
                >
                  {formatDate(chat.timestamp)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
