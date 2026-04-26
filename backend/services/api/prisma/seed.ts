import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const tokens = [
  // Base Mainnet (chainId: 8453)
  {
    chainId: 8453,
    symbol: 'USDC',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    isSwappable: true,
    isSendable: true,
  },
  {
    chainId: 8453,
    symbol: 'ETH',
    address: ZERO_ADDRESS,
    decimals: 18,
    isSwappable: true,
    isSendable: true,
  },
  {
    chainId: 8453,
    symbol: 'WETH',
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    isSwappable: true,
    isSendable: true,
  },
  // Sepolia Testnet (chainId: 11155111)
  {
    chainId: 11155111,
    symbol: 'USDC',
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    decimals: 6,
    isSwappable: true,
    isSendable: true,
  },
  {
    chainId: 11155111,
    symbol: 'ETH',
    address: ZERO_ADDRESS,
    decimals: 18,
    isSwappable: true,
    isSendable: true,
  },
  {
    chainId: 11155111,
    symbol: 'WETH',
    address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    decimals: 18,
    isSwappable: true,
    isSendable: true,
  },
];

async function main() {
  console.log('Seeding token allowlist...');

  for (const token of tokens) {
    await prisma.allowedToken.upsert({
      where: {
        chainId_address: {
          chainId: token.chainId,
          address: token.address,
        },
      },
      update: {
        symbol: token.symbol,
        decimals: token.decimals,
        isSwappable: token.isSwappable,
        isSendable: token.isSendable,
        isActive: true,
      },
      create: {
        ...token,
        isActive: true,
      },
    });
    console.log(`  ${token.symbol} on chain ${token.chainId}`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
