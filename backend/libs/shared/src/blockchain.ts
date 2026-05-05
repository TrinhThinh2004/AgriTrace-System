// Cấu hình blockchain cho ứng dụng, bao gồm thông tin về mạng, token gốc, RPC URL và explorer URL.
export const BLOCKCHAIN_CONFIG = {
  CHAIN_ID: 11155111,
  CHAIN_NAME: 'Sepolia',
  NATIVE_SYMBOL: 'ETH',
  DEFAULT_RPC_URL: 'https://ethereum-sepolia-rpc.publicnode.com',
  EXPLORER_BASE_URL: 'https://sepolia.etherscan.io',
} as const;

// Hàm tiện ích để tạo URL cho giao dịch trên explorer.
export function txExplorerUrl(txHash: string): string {
  return `${BLOCKCHAIN_CONFIG.EXPLORER_BASE_URL}/tx/${txHash}`;
}
export function addressExplorerUrl(address: string): string {
  return `${BLOCKCHAIN_CONFIG.EXPLORER_BASE_URL}/address/${address}`;
}

export function blockExplorerUrl(blockNumber: number | string | bigint): string {
  return `${BLOCKCHAIN_CONFIG.EXPLORER_BASE_URL}/block/${blockNumber}`;
}
