import React from "react";
import { useWallet } from "../context/WalletContext";
import { usePrivy } from "@privy-io/react-auth";

const Landing = () => {
  const { connectMetaMask } = useWallet();
  const { login } = usePrivy();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleMetaMaskClick = async () => {
    try {
      setIsLoading(true);
      if (!window.ethereum) {
        alert("MetaMask not detected. Please install MetaMask.");
        return;
      }
      await connectMetaMask();
    } catch (error) {
      console.error("Failed to connect MetaMask:", error);
      alert("Failed to connect MetaMask");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivyClick = () => {
    setIsLoading(true);
    login();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-bold text-white">W</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">WalletAgent</h1>
          <p className="text-slate-400">AI-powered crypto wallet assistant</p>
        </div>

        {/* Description */}
        <p className="text-slate-300 mb-8">
          Control your crypto wallet with natural language. Send transactions,
          check balances, and manage your assets with AI assistance.
        </p>

        {/* Auth Buttons */}
        <div className="space-y-4">
          <button
            onClick={handlePrivyClick}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
          >
            {isLoading ? "Connecting..." : "🔐 Get Started with Privy"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-400">or</span>
            </div>
          </div>

          <button
            onClick={handleMetaMaskClick}
            disabled={isLoading}
            className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all border border-slate-700 hover:border-slate-600"
          >
            {isLoading ? "Connecting..." : "🦊 Connect MetaMask"}
          </button>
        </div>

        {/* Features */}
        <div className="mt-12 space-y-3 text-left">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            Features
          </h3>
          <div className="space-y-2 text-sm text-slate-400">
            <p>✨ Natural language commands</p>
            <p>🎤 Voice input support</p>
            <p>🔒 Non-custodial wallet control</p>
            <p>⚡ Fast transactions with AI</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
