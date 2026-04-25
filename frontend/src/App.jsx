import React, { useEffect } from "react";
import { useWallet } from "./context/WalletContext";
import { usePrivy, PrivyProvider } from "@privy-io/react-auth";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";

const AppContent = () => {
  const { isAuthenticated, isLoading, connectPrivy } = useWallet();
  const { user, authenticated } = usePrivy();

  // Handle Privy authentication
  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      connectPrivy(user.wallet.address, user.email, user.id);
    }
  }, [authenticated, user?.wallet?.address]);

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading WalletAgent...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <Landing />;
};

function App() {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || "cmnsvstup00350cl7lhnmal02"}
      config={{
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      <AppContent />
    </PrivyProvider>
  );
}

export default App;
