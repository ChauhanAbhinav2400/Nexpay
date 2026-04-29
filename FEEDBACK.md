# Uniswap Integration Feedback — NexPay

## What We Built

NexPay is an AI-powered crypto payment assistant where users type natural
language commands like "Swap 0.5 ETH to USDC" and our AI agent automatically
understands the intent, fetches a live Uniswap V3 quote, builds the swap
calldata, and sends it to the frontend for wallet signing and execution on
Sepolia testnet.

The interesting part is that our AI agent acts as the bridge between human
language and Uniswap's contracts. The user never sees a router address, a
calldata, or a fee tier — they just type what they want and NexPay handles
everything through Uniswap V3 under the hood.

## How We Integrated Uniswap V3

### Contract Discovery

We needed two contracts to make swaps work:

- **QuoterV2** — to get live price quotes before execution
- **SwapRouter02** — to build and execute the actual swap

Finding both Sepolia addresses was straightforward via Google search. We
specifically chose SwapRouter02 over the Universal Router because it is simpler
and perfectly sufficient for single-hop swaps which is our primary use case.

### Quote Flow

When a user says "Swap 0.5 ETH to USDC", our backend:

1. Calls QuoterV2 via `quoteExactInputSingle.staticCall` — free, no gas
2. Returns the exact USDC amount the user will receive
3. Shows it to the user before they confirm anything

### Execution Flow

After user confirms:

1. We encode `exactInputSingle` calldata using ethers.js Interface
2. Apply slippage protection to amountOutMinimum
3. Send the transaction to SwapRouter02 via MetaMask or Privy wallet
4. Swap executes on Sepolia blockchain

### Token Support

For the hackathon we intentionally limited to ETH, WETH, and USDC on Sepolia
to demonstrate the core concept works end to end. On mainnet we plan to expand
to all major tokens across multiple chains. The architecture is already designed
to support this — adding a new token is just adding one entry to our token
registry.

## What Worked Really Well

- **QuoterV2 staticCall** worked perfectly on first attempt — no errors,
  accurate quotes every time
- **SwapRouter02 exactInputSingle** encoding with ethers.js was clean and
  straightforward
- **ETH to WETH address mapping** was a neat trick we handled internally so
  users never need to think about it — they say ETH and we handle the WETH
  conversion transparently
- **Overall swap flow** from natural language → quote → confirmation →
  execution worked reliably throughout development and testing

## Friction Points & What Could Be Better

### 1. No Official Testnet Token Registry

The biggest friction we faced was finding correct token addresses for Sepolia.
We had to go to three different places:

- SwapRouter02 and QuoterV2 addresses → Google search
- USDC address → Circle developer docs
- WETH address → Etherscan

Uniswap has great documentation for mainnet tokens but nothing equivalent for
testnets. A single dedicated page in Uniswap docs listing all verified token
addresses per testnet with their decimals would save every developer building
on testnets significant time.

### 2. Limited Testnet Liquidity

Only ETH, WETH, and USDC pools have real liquidity on Sepolia. Any other token
pair returns a liquidity error. This is understandable but it does limit what
developers can demonstrate on testnet. A Uniswap maintained set of test token
pools on Sepolia with guaranteed liquidity would let developers build and demo
more realistic swap scenarios.

## Overall Developer Experience

**9/10**

The core integration was smooth, reliable, and worked correctly on the first
attempt. The contracts do exactly what the documentation says. The only gaps
are around testnet setup — finding token addresses required visiting multiple
external sources instead of one place in Uniswap docs. .

## Integration Details

- **Network:** Sepolia Testnet
- **Contracts:** QuoterV2 + SwapRouter02
- **Tokens:** ETH, WETH, USDC
- **Library:** ethers.js v6
- **Code:** https://github.com/ChauhanAbhinav2400/Nexpay/blob/main/backend/services/api/src/services/swap/uniswap.ts
