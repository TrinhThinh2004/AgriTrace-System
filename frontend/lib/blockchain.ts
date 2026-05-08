/**
 * Blockchain config phía frontend — chỉ chứa explorer URL helpers.
 * Đồng bộ với backend/libs/shared/src/blockchain.ts (Sepolia testnet).
 */
export const BLOCKCHAIN_CONFIG = {
  CHAIN_ID: 11155111,
  CHAIN_NAME: "Sepolia",
  NATIVE_SYMBOL: "ETH",
  EXPLORER_BASE_URL: "https://sepolia.etherscan.io",
} as const;

export function txExplorerUrl(txHash: string): string {
  return `${BLOCKCHAIN_CONFIG.EXPLORER_BASE_URL}/tx/${txHash}`;
}

export function addressExplorerUrl(address: string): string {
  return `${BLOCKCHAIN_CONFIG.EXPLORER_BASE_URL}/address/${address}`;
}

export function blockExplorerUrl(blockNumber: number | string | bigint): string {
  return `${BLOCKCHAIN_CONFIG.EXPLORER_BASE_URL}/block/${blockNumber}`;
}
