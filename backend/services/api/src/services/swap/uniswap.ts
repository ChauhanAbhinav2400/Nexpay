import { ethers } from "ethers";

const QUOTER_ADDRESS = "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3";
export const SWAP_ROUTER_ADDRESS = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

const SEPOLIA_TOKENS: Record<string, { address: string; decimals: number }> = {
  ETH: { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
  USDC: { address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6 },
  WETH: { address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", decimals: 18 },
};

const POOL_FEE = 3000;

const QUOTER_ABI = [
  "function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
];

export async function getUniswapQuote(
  fromToken: string,
  toToken: string,
  amountIn: string,
  chainId: number,
) {
  const rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const tokenIn = SEPOLIA_TOKENS[fromToken as keyof typeof SEPOLIA_TOKENS];
  const tokenOut = SEPOLIA_TOKENS[toToken as keyof typeof SEPOLIA_TOKENS];

  if (!tokenIn || !tokenOut) {
    throw new Error(`Unsupported token pair: ${fromToken}/${toToken}`);
  }

  const tokenInAddress =
    fromToken === "ETH" ? SEPOLIA_TOKENS.WETH.address : tokenIn.address;
  const tokenOutAddress =
    toToken === "ETH" ? SEPOLIA_TOKENS.WETH.address : tokenOut.address;

  const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);

  const quoter = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, provider);

  const [amountOut] = await quoter.quoteExactInputSingle.staticCall({
    tokenIn: tokenInAddress,
    tokenOut: tokenOutAddress,
    amountIn: amountInWei,
    fee: POOL_FEE,
    sqrtPriceLimitX96: 0,
  });

  const amountOutFormatted = ethers.formatUnits(amountOut, tokenOut.decimals);

  return {
    amountIn,
    amountOut: amountOutFormatted,
    fromToken,
    toToken,
    chainId,
    fee: POOL_FEE,
    tokenInAddress,
    tokenOutAddress,
    amountInWei: amountInWei.toString(),
    amountOutWei: amountOut.toString(),
  };
}

export function buildSwapCalldata(
  fromToken: string,
  toToken: string,
  amountInWei: string,
  amountOutMinWei: string,
  recipientAddress: string,
  slippagePercent: number,
) {
  const slippageFactor = 1 - slippagePercent / 100;
  const amountOutMin = BigInt(
    Math.floor(Number(amountOutMinWei) * slippageFactor),
  ).toString();

  const iface = new ethers.Interface([
    "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  ]);

  const tokenInAddress =
    fromToken === "ETH"
      ? SEPOLIA_TOKENS.WETH.address
      : SEPOLIA_TOKENS[fromToken as keyof typeof SEPOLIA_TOKENS].address;
  const tokenOutAddress =
    toToken === "ETH"
      ? SEPOLIA_TOKENS.WETH.address
      : SEPOLIA_TOKENS[toToken as keyof typeof SEPOLIA_TOKENS].address;

  const calldata = iface.encodeFunctionData("exactInputSingle", [
    {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      fee: POOL_FEE,
      recipient: recipientAddress,
      amountIn: amountInWei,
      amountOutMinimum: amountOutMin,
      sqrtPriceLimitX96: 0,
    },
  ]);

  return {
    to: SWAP_ROUTER_ADDRESS,
    data: calldata,
    value: fromToken === "ETH" ? amountInWei : "0",
    amountOutMin,
  };
}
