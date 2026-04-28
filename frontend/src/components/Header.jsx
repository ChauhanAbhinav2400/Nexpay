import React from "react";
import { useWallet } from "../context/WalletContext";

const Header = ({ onContactsClick }) => {
  const { walletAddress, walletType, disconnect } = useWallet();

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <h1 className="text-xl font-bold text-white">NexPay</h1>
      </div>

      <div className="flex items-center gap-4">
        {walletAddress && (
          <div className="flex items-center gap-3">
            <button
              onClick={onContactsClick}
              className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
            >
              📇 Contacts
            </button>
            <span className="text-sm text-slate-400">
              {walletType === "metamask" ? "MetaMask" : "Privy"} •{" "}
              {formatAddress(walletAddress)}
            </span>
            <button
              onClick={disconnect}
              className="px-3 py-1 text-sm text-slate-400 hover:text-red-400 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
