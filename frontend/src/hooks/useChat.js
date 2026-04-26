import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";
const SWAP_ROUTER_ADDRESS = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
import {
  processIntent,
  getChatHistory,
  confirmTransactionApi,
  saveChatMessageApi,
} from "../utils/api.js";
import { useWallet } from "../context/WalletContext.jsx";
import { useWallets } from "@privy-io/react-auth";

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatStatus, setChatStatus] = useState("idle");

  const { walletType } = useWallet();
  const { wallets } = useWallets();

  const startNewChat = useCallback(() => {
    setSessionId(uuidv4());
    setMessages([]);
    setCurrentTransaction(null);
    setChatStatus("idle");
    setError(null);
  }, []);

  const waitForTransaction = async (provider, txHash) => {
    while (true) {
      const receipt = await provider.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });
      if (receipt) return receipt;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  const loadChatHistory = useCallback(
    async (walletAddress) => {
      if (!walletAddress || !sessionId) return;
      try {
        const history = await getChatHistory(walletAddress, sessionId);
        setMessages(
          history.map((h) => ({
            id: h.id,
            role: h.role,
            content: h.message,
            timestamp: h.createdAt,
          })),
        );
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    },
    [sessionId],
  );

  const sendChatMessage = useCallback(
    async (walletAddress, userMessage) => {
      if (!walletAddress || !sessionId) {
        setError("Wallet not connected or session not initialized");
        return;
      }

      setIsLoading(true);
      setError(null);
      setChatStatus("processing");

      try {
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: "user",
            content: userMessage,
            timestamp: new Date().toISOString(),
          },
        ]);

        const result = await processIntent(
          walletAddress,
          userMessage,
          sessionId,
        );

        if (result.status === "ready_for_confirmation") {
          setCurrentTransaction(result.transaction);

          const tx = result.transaction;
          const isSwap = tx.mode === "swap";

          let content;
          if (isSwap && result.quote) {
            content = `SWAP_DETAILS:${JSON.stringify({
              fromAmount: tx.amountHuman,
              fromToken: tx.fromTokenSymbol,
              toAmount: result.quote.amountOut,
              toToken: tx.toTokenSymbol,
              slippage: 0.5,
              rate: (
                parseFloat(result.quote.amountOut) / parseFloat(tx.amountHuman)
              ).toFixed(6),
            })}`;
          } else {
            content = `Ready to transfer ${tx.amountHuman} ${tx.tokenSymbol} to ${tx.toAddress}. Please confirm.`;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: uuidv4(),
              role: "agent",
              content,
              timestamp: new Date().toISOString(),
              transactionData: tx,
            },
          ]);

          if (walletType === "privy") {
            setChatStatus("processing");
            await signAndSubmit(walletAddress, result.transaction);
          } else {
            setChatStatus("ready_for_confirmation");
          }
        } else if (result.status === "needs_clarification") {
          let content = result.message;

          try {
            JSON.parse(content);
            content =
              "I understood your request but something went wrong processing it. Please try again.";
          } catch {}

          setMessages((prev) => [
            ...prev,
            {
              id: uuidv4(),
              role: "agent",
              content,
              timestamp: new Date().toISOString(),
            },
          ]);
          setChatStatus("idle");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setChatStatus("idle");
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, walletType],
  );

  const switchNetwork = async (provider, chainId) => {
    const chainIdHex = "0x" + chainId.toString(16);

    const currentChainId = await provider.request({ method: "eth_chainId" });
    if (currentChainId === chainIdHex) return; // already on correct network

    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });

    await new Promise((resolve) => {
      const check = setInterval(async () => {
        const current = await provider.request({ method: "eth_chainId" });
        if (current === chainIdHex) {
          clearInterval(check);
          resolve();
        }
      }, 500);

      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 30000);
    });
  };

  const signAndSubmit = useCallback(
    async (walletAddress, transaction) => {
      setIsLoading(true);
      try {
        const isSwap = transaction.mode === "swap";
        let txHash;

        const MAX_UINT256 =
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

        const encodeApproval = (spender, amount) => {
          const selector = "0x095ea7b3";
          const paddedSpender = spender
            .slice(2)
            .toLowerCase()
            .padStart(64, "0");
          const amountHex = amount.startsWith("0x")
            ? amount.slice(2).padStart(64, "0")
            : BigInt(amount).toString(16).padStart(64, "0");
          return selector + paddedSpender + amountHex;
        };

        const waitForReceipt = async (provider, hash) => {
          console.log("Waiting for tx to be mined:", hash);
          while (true) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const receipt = await provider.request({
              method: "eth_getTransactionReceipt",
              params: [hash],
            });
            if (receipt) {
              console.log("Tx mined:", receipt);
              return receipt;
            }
          }
        };

        if (walletType === "privy") {
          const privyWallet = wallets.find(
            (w) => w.address.toLowerCase() === walletAddress.toLowerCase(),
          );
          if (!privyWallet) throw new Error("Privy wallet not found");
          const provider = await privyWallet.getEthereumProvider();

          await switchNetwork(provider, transaction.chainId);
          await new Promise((resolve) => setTimeout(resolve, 1000));

          if (isSwap) {
            if (!transaction.swapRoute?.to) {
              throw new Error("Swap route missing — please try again");
            }

            const isFromETH =
              transaction.tokenSymbol === "ETH" ||
              transaction.tokenSymbol?.toLowerCase().includes("eth");

            if (!isFromETH) {
              console.log("Sending approval...");
              const approvalHash = await provider.request({
                method: "eth_sendTransaction",
                params: [
                  {
                    from: walletAddress,
                    to: transaction.swapRoute.tokenInAddress,
                    data: encodeApproval(SWAP_ROUTER_ADDRESS, MAX_UINT256),
                    value: "0x0",
                  },
                ],
              });
              console.log("Approval sent, waiting for confirmation...");
              await waitForReceipt(provider, approvalHash);
              console.log("Approval confirmed! Sending swap...");
            }

            txHash = await provider.request({
              method: "eth_sendTransaction",
              params: [
                {
                  from: walletAddress,
                  to: SWAP_ROUTER_ADDRESS,
                  data: transaction.swapRoute.data,
                  value:
                    "0x" +
                    BigInt(transaction.swapRoute.value || 0).toString(16),
                },
              ],
            });
          } else {
            const isNativeToken = (symbol) =>
              ["ETH", "WETH"].includes(symbol?.toUpperCase()) ||
              symbol?.toLowerCase().includes("eth");

            if (isNativeToken(transaction.tokenSymbol)) {
              txHash = await provider.request({
                method: "eth_sendTransaction",
                params: [
                  {
                    from: walletAddress,
                    to: transaction.toAddress,
                    value:
                      "0x" +
                      BigInt(
                        Math.round(parseFloat(transaction.amountHuman) * 1e18),
                      ).toString(16),
                    data: "0x",
                  },
                ],
              });
            } else {
              const encodeERC20Transfer = (to, amount, decimals = 6) => {
                const selector = "0xa9059cbb";
                const paddedTo = to.slice(2).toLowerCase().padStart(64, "0");
                const amountWei = BigInt(
                  Math.round(parseFloat(amount) * 10 ** decimals),
                );
                const paddedAmount = amountWei.toString(16).padStart(64, "0");
                return selector + paddedTo + paddedAmount;
              };

              const TOKEN_ADDRESSES = {
                USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
                WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
              };

              const TOKEN_DECIMALS = {
                USDC: 6,
                WETH: 18,
              };

              const tokenSymbol = transaction.tokenSymbol.toUpperCase();
              const tokenAddress = TOKEN_ADDRESSES[tokenSymbol];

              if (!tokenAddress) {
                throw new Error(
                  `Unsupported token: ${transaction.tokenSymbol}`,
                );
              }

              txHash = await provider.request({
                method: "eth_sendTransaction",
                params: [
                  {
                    from: walletAddress,
                    to: tokenAddress,
                    value: "0x0",
                    data: encodeERC20Transfer(
                      transaction.toAddress,
                      transaction.amountHuman,
                      TOKEN_DECIMALS[tokenSymbol] || 6,
                    ),
                  },
                ],
              });
            }
          }
        } else {
          const provider = window.ethereum;
          if (!provider) throw new Error("MetaMask not found");

          await switchNetwork(provider, transaction.chainId);

          if (isSwap) {
            if (!transaction.swapRoute?.to) {
              throw new Error("Swap route missing — please try again");
            }

            const isFromETH =
              transaction.tokenSymbol === "ETH" ||
              transaction.tokenSymbol?.toLowerCase().includes("eth");

            if (!isFromETH) {
              console.log("Sending approval...");
              const approvalHash = await provider.request({
                method: "eth_sendTransaction",
                params: [
                  {
                    from: walletAddress,
                    to: transaction.swapRoute.tokenInAddress,
                    data: encodeApproval(SWAP_ROUTER_ADDRESS, MAX_UINT256),
                    value: "0x0",
                  },
                ],
              });
              console.log("Approval sent, waiting for confirmation...");
              await waitForReceipt(provider, approvalHash);
              console.log("Approval confirmed! Sending swap...");
            }

            txHash = await provider.request({
              method: "eth_sendTransaction",
              params: [
                {
                  from: walletAddress,
                  to: SWAP_ROUTER_ADDRESS,
                  data: transaction.swapRoute.data,
                  value:
                    "0x" +
                    BigInt(transaction.swapRoute.value || 0).toString(16),
                },
              ],
            });
          } else {
            const isNativeToken = (symbol) =>
              ["ETH", "WETH"].includes(symbol?.toUpperCase()) ||
              symbol?.toLowerCase().includes("eth");

            if (isNativeToken(transaction.tokenSymbol)) {
              txHash = await provider.request({
                method: "eth_sendTransaction",
                params: [
                  {
                    from: walletAddress,
                    to: transaction.toAddress,
                    value:
                      "0x" +
                      BigInt(
                        Math.round(parseFloat(transaction.amountHuman) * 1e18),
                      ).toString(16),
                    data: "0x",
                  },
                ],
              });
            } else {
              const encodeERC20Transfer = (to, amount, decimals = 6) => {
                const selector = "0xa9059cbb";
                const paddedTo = to.slice(2).toLowerCase().padStart(64, "0");
                const amountWei = BigInt(
                  Math.round(parseFloat(amount) * 10 ** decimals),
                );
                const paddedAmount = amountWei.toString(16).padStart(64, "0");
                return selector + paddedTo + paddedAmount;
              };

              const TOKEN_ADDRESSES = {
                USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
                WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
              };

              const TOKEN_DECIMALS = {
                USDC: 6,
                WETH: 18,
              };

              const tokenSymbol = transaction.tokenSymbol.toUpperCase();
              const tokenAddress = TOKEN_ADDRESSES[tokenSymbol];

              if (!tokenAddress) {
                throw new Error(
                  `Unsupported token: ${transaction.tokenSymbol}`,
                );
              }

              txHash = await provider.request({
                method: "eth_sendTransaction",
                params: [
                  {
                    from: walletAddress,
                    to: tokenAddress,
                    value: "0x0",
                    data: encodeERC20Transfer(
                      transaction.toAddress,
                      transaction.amountHuman,
                      TOKEN_DECIMALS[tokenSymbol] || 6,
                    ),
                  },
                ],
              });
            }
          }
        }

        await confirmTransactionApi(transaction.id, txHash);
        setChatStatus("success");
        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: "agent",
            content: `✅ Transaction successful!\nTxHash: ${txHash}`,
            timestamp: new Date().toISOString(),
          },
        ]);
        setCurrentTransaction(null);
      } catch (err) {
        const userRejected =
          err?.code === 4001 ||
          err?.message?.toLowerCase().includes("user rejected") ||
          err?.message?.toLowerCase().includes("user denied") ||
          err?.message?.toLowerCase().includes("cancelled");

        console.error("Error:", err?.message);

        const message = userRejected
          ? `Transaction cancelled. No funds were moved. Start a new message whenever you're ready.`
          : `❌ Transaction failed: ${err instanceof Error ? err.message : "Unknown error"}`;

        setChatStatus(userRejected ? "idle" : "failed");
        setCurrentTransaction(null);

        await saveChatMessageApi(
          walletAddress,
          "agent",
          message,
          transaction.sessionId,
        );

        setMessages((prev) => [
          ...prev,
          {
            id: uuidv4(),
            role: "agent",
            content: message,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [walletType, wallets],
  );

  const confirmTransaction = useCallback(
    async (walletAddress, transactionId) => {
      if (!walletAddress || !currentTransaction) return;
      setIsLoading(true);
      await signAndSubmit(walletAddress, currentTransaction);
      setIsLoading(false);
    },
    [currentTransaction, signAndSubmit],
  );

  useEffect(() => {
    if (!sessionId) startNewChat();
  }, []);

  return {
    messages,
    sessionId,
    currentTransaction,
    isLoading,
    error,
    chatStatus,
    sendChatMessage,
    confirmTransaction,
    startNewChat,
    loadChatHistory,
  };
};
