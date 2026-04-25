import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

const ChatArea = ({
  messages,
  isLoading,
  error,
  chatStatus,
  currentTransaction,
  isReadOnly = false,
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col bg-slate-900">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="text-4xl mb-4">💬</div>
              <h2 className="text-xl font-semibold text-slate-300 mb-2">
                Start a conversation
              </h2>
              <p className="text-slate-500">
                {isReadOnly
                  ? "This is a read-only view of a past transaction"
                  : "Send a message or use voice input to start your transaction"}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-slate-700 px-4 py-3 rounded-lg">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
                <span className="text-sm">{error}</span>
              </div>
            )}

            {chatStatus === "ready_for_confirmation" && currentTransaction && (
              <div className="mb-4 bg-blue-900 border border-blue-700 text-blue-100 px-4 py-3 rounded-lg">
                <span className="text-sm">
                  📋 Transaction ready for confirmation. Review and click the
                  confirm button below.
                </span>
              </div>
            )}

            {chatStatus === "success" && (
              <div className="mb-4 bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded-lg">
                <span className="text-sm">
                  ✅ Transaction submitted successfully!
                </span>
              </div>
            )}

            {chatStatus === "failed" && (
              <div className="mb-4 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
                <span className="text-sm">
                  ❌ Transaction failed. Please try again.
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;
