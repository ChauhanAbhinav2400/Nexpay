import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { API_BASE_URL } from "../utils/api.js";
const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedAddress = localStorage.getItem("walletAgent_address");
    const storedType = localStorage.getItem("walletAgent_type");

    if (storedAddress && storedType) {
      setWalletAddress(storedAddress);
      setWalletType(storedType);
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  // Authenticate with backend
  const authenticateWithBackend = async (
    address,
    type,
    email = null,
    privyUserId = null,
  ) => {
    try {
      if (!address) {
        throw new Error("Wallet address is required");
      }

      const response = await fetch(`${API_BASE_URL}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          walletType: type,
          ...(email && { email: email.address }),
          ...(privyUserId && { privyUserId }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Auth failed with status ${response.status}`,
        );
      }

      const data = await response.json();
      setUser(data.user);
      return data;
    } catch (error) {
      console.error("Backend authentication failed:", error);
      throw error;
    }
  };

  const connectMetaMask = async () => {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        const address = accounts[0];

        // Authenticate with backend
        await authenticateWithBackend(address, "metamask");

        setWalletAddress(address);
        setWalletType("metamask");
        setIsAuthenticated(true);

        localStorage.setItem("walletAgent_address", address);
        localStorage.setItem("walletAgent_type", "metamask");

        return address;
      }
    } catch (error) {
      console.error("MetaMask connection failed:", error);
      throw error;
    }
  };

  const connectPrivy = useCallback(
    async (address, email = null, privyUserId = null) => {
      try {
        await authenticateWithBackend(address, "privy", email, privyUserId);

        setWalletAddress(address);
        setWalletType("privy");
        setIsAuthenticated(true);

        localStorage.setItem("walletAgent_address", address);
        localStorage.setItem("walletAgent_type", "privy");
      } catch (error) {
        console.error("Privy connection failed:", error);
        throw error;
      }
    },
    [],
  ); // ← empty deps, function never recreated

  const disconnect = () => {
    setWalletAddress(null);
    setWalletType(null);
    setIsAuthenticated(false);
    setUser(null);

    localStorage.removeItem("walletAgent_address");
    localStorage.removeItem("walletAgent_type");
  };

  const value = {
    walletAddress,
    walletType,
    isAuthenticated,
    isLoading,
    user,
    connectMetaMask,
    connectPrivy,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};
