import React from "react";

const MessageBubble = ({ message }) => {
  const isUser = message.role === "user";

  const getTypeStyles = () => {
    if (isUser) return "bg-blue-600 text-white";
    switch (message.type) {
      case "success":
        return "bg-green-900 border border-green-700 text-green-100";
      case "error":
        return "bg-red-900 border border-red-700 text-red-100";
      case "incomplete":
        return "bg-yellow-900 border border-yellow-700 text-yellow-100";
      default:
        return "bg-slate-700 text-slate-100";
    }
  };

  const shortenAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isSwapDetails = message.content?.startsWith("SWAP_DETAILS:");
  let swapDetails = null;
  if (isSwapDetails) {
    try {
      swapDetails = JSON.parse(message.content.replace("SWAP_DETAILS:", ""));
    } catch {}
  }

  const isTransferDetails = message.content?.startsWith("TRANSFER_DETAILS:");
  let transferDetails = null;
  if (isTransferDetails) {
    try {
      transferDetails = JSON.parse(
        message.content.replace("TRANSFER_DETAILS:", ""),
      );
    } catch {}
  }

  // Add this helper inside your component (above renderContent)
  const renderMessageWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) =>
      urlRegex.test(part) ? (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-green-200 font-semibold break-all"
        >
          {part}
        </a>
      ) : (
        <span key={index}>{part}</span>
      ),
    );
  };

  const renderContent = () => {
    if (message.type === "success" && message.txHash) {
      return (
        <div>
          {message.explorerUrl || message.txHash ? (
            <>
              <p className="text-sm mb-2">✅ Transaction successful!</p>

              <a
                href={
                  message.explorerUrl ||
                  `https://etherscan.io/tx/${message.txHash}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline hover:text-green-200 font-semibold cursor-pointer"
              >
                View on Explorer: {shortenAddress(message.txHash)}
              </a>
            </>
          ) : (
            <p className="text-sm">{message.content}</p>
          )}
        </div>
      );
    }

    // Error type
    if (message.type === "error") {
      return (
        <div>
          <p className="text-sm mb-1 font-semibold">❌ Error</p>
          <p className="text-xs">{message.content}</p>
        </div>
      );
    }

    if (isSwapDetails && swapDetails) {
      return (
        <div>
          <p className="text-sm font-semibold mb-3">🔄 Swap Preview</p>
          <div className="bg-slate-800 rounded-lg p-3 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">You pay</span>
              <span className="font-semibold text-white">
                {swapDetails.fromAmount} {swapDetails.fromToken}
              </span>
            </div>
            <div className="border-t border-slate-600 my-1" />
            <div className="flex justify-between items-center">
              <span className="text-slate-400">You receive</span>
              <span className="font-semibold text-green-400">
                ~{Number(swapDetails.toAmount).toFixed(6)} {swapDetails.toToken}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Rate</span>
              <span className="text-slate-200">
                1 {swapDetails.fromToken} = {swapDetails.rate}{" "}
                {swapDetails.toToken}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Slippage</span>
              <span className="text-yellow-400">{swapDetails.slippage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Protocol</span>
              <span className="text-purple-400">Uniswap V3</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Review and confirm below ↓
          </p>
        </div>
      );
    }

    if (isTransferDetails && transferDetails) {
      return (
        <div>
          <p className="text-sm font-semibold mb-3">📤 Transfer Preview</p>
          <div className="bg-slate-800 rounded-lg p-3 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">To</span>
              <span className="font-semibold text-white">
                {transferDetails.toContactName || "Direct Address"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Address</span>
              <span className="text-slate-200 font-mono">
                {transferDetails.toAddress?.slice(0, 6)}...
                {transferDetails.toAddress?.slice(-4)}
              </span>
            </div>
            <div className="border-t border-slate-600 my-1" />
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Amount</span>
              <span className="font-semibold text-green-400">
                {transferDetails.amount} {transferDetails.token}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Network</span>
              <span className="text-purple-400">{transferDetails.network}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">From</span>
              <span className="text-slate-200 font-mono">
                {transferDetails.fromAddress?.slice(0, 6)}...
                {transferDetails.fromAddress?.slice(-4)}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Review and confirm below ↓
          </p>
        </div>
      );
    }

    if (message.txData) {
      return (
        <div>
          <p className="text-sm mb-3 font-semibold">Transaction Details:</p>
          <div className="text-xs space-y-2">
            {message.txData.amountHuman && (
              <p>
                <span className="text-slate-300">Amount:</span>{" "}
                {message.txData.amountHuman} {message.txData.tokenSymbol}
              </p>
            )}
            {message.txData.toContactName && (
              <p>
                <span className="text-slate-300">To:</span>{" "}
                {message.txData.toContactName}
              </p>
            )}
            {message.txData.gasCostUsd && (
              <p>
                <span className="text-slate-300">Gas:</span> $
                {message.txData.gasCostUsd}
              </p>
            )}
            {message.txData.isGasSponsored && (
              <p className="text-green-300">✅ Gas Sponsored!</p>
            )}
          </div>
          <p className="text-xs mt-3 font-semibold text-slate-300">
            {message.content}
          </p>
        </div>
      );
    }

    if (message.content?.includes("TxHash:")) {
      return (
        <div className="text-sm">
          <p>{message.content.split("TxHash:")[0].trim()}</p>
          <p className="text-xs font-mono break-all mt-1 text-slate-300">
            TxHash: {message.content.split("TxHash:")[1].trim()}
          </p>
        </div>
      );
    }
    // AFTER
    return (
      <p className="text-sm break-words">
        {renderMessageWithLinks(message.content)}
      </p>
    );
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-md px-4 py-3 rounded-lg ${getTypeStyles()} animate-fadeIn`}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default MessageBubble;
