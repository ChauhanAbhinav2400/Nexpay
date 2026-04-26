import React, { useState, useEffect, useRef } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

const InputBar = ({
  onSend,
  onConfirm,
  onCancel,
  isLoading,
  isDisabled,
  chatStatus,
  hasTransaction = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const { isListening, transcript, startListening, resetTranscript } =
    useSpeechRecognition();
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (transcript) {
      setInputValue(transcript); // always update input with latest transcript
    }
  }, [transcript]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && !isDisabled) {
      onSend(inputValue);
      setInputValue("");
      resetTranscript(); // clear transcript too
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (onConfirm) onConfirm();
  };

  const handleCancel = (e) => {
    e.preventDefault();
    if (onCancel) onCancel();
  };

  const handleMicClick = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      startListening();
    }
  };

  const handleTextChange = (e) => {
    setInputValue(e.target.value);
    // If user clears input, also reset transcript
    if (e.target.value === "") resetTranscript();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  // Show confirm + cancel when ready for confirmation
  if (hasTransaction && chatStatus === "ready_for_confirmation") {
    return (
      <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg px-4 py-2 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 font-semibold transition-colors"
          >
            {isLoading ? "Submitting..." : "Confirm & Execute"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSend}
      className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4"
    >
      <div className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleTextChange}
          disabled={isDisabled || isLoading}
          placeholder={
            isDisabled
              ? "Start a new transaction to continue."
              : "Type your message or use voice..."
          }
          className="flex-1 bg-slate-800 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:opacity-50"
          rows="1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />

        <button
          type="button"
          onClick={handleMicClick}
          disabled={isDisabled || isLoading}
          className={`p-2 rounded-full transition-all ${
            isListening
              ? "bg-red-600 animate-pulse text-white"
              : "bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2C6.69 2 4 4.69 4 8v3c0 .55.45 1 1 1s1-.45 1-1V8c0-2.21 1.79-4 4-4s4 1.79 4 4v3c0 .55.45 1 1 1s1-.45 1-1V8c0-3.31-2.69-6-6-6zm3 8.5c0 1.1-.9 2-2 2s-2-.9-2-2v-2c0-1.1.9-2 2-2s2 .9 2 2v2zm3-2.5c0 2.21-1.79 4-4 4s-4-1.79-4-4H6c0 3.09 2.41 5.68 5.5 5.97V17h1v-1.03c3.09-.29 5.5-2.88 5.5-5.97h-1z" />
          </svg>
        </button>

        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading || isDisabled}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 font-semibold transition-colors"
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default InputBar;
