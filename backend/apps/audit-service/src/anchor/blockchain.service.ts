import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join } from 'path';
import { BLOCKCHAIN_CONFIG } from '@app/shared';

interface AnchorStoredEventArgs {
  anchorId: bigint;
  merkleRoot: string;
  fromSeq: bigint;
  toSeq: bigint;
}

/**
 * Wrapper quanh ethers.js để gọi contract AgriTraceAnchor trên Sepolia.
 * Service chỉ làm 2 việc:
 *   1. submitAnchor() — gửi tx storeAnchor và parse anchorId từ event
 *   2. getOnchainRoot() — đọc root từ contract 
 *
 * ABI được load runtime từ libs/shared/abi/AgriTraceAnchor.json
 * Contract address + private key
 * load từ env (ANCHOR_CONTRACT_ADDRESS, ANCHOR_PRIVATE_KEY).
 */
@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider!: ethers.JsonRpcProvider;
  private wallet!: ethers.Wallet;
  private contract!: ethers.Contract;
  private chainId!: number;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const rpcUrl =
      this.config.get<string>('ANCHOR_RPC_URL') ??
      BLOCKCHAIN_CONFIG.DEFAULT_RPC_URL;
    const privateKey = this.config.get<string>('ANCHOR_PRIVATE_KEY');
    const contractAddress = this.config.get<string>('ANCHOR_CONTRACT_ADDRESS');

    if (!privateKey) {
      this.logger.warn(
        'ANCHOR_PRIVATE_KEY not set — anchor worker will fail at runtime. ' +
          'Set it in backend/.env to enable anchoring.',
      );
      return;
    }
    if (!contractAddress) {
      this.logger.warn(
        'ANCHOR_CONTRACT_ADDRESS not set — anchor worker will fail at runtime.',
      );
      return;
    }

    const abiPath = join(
      process.cwd(),
      'libs/shared/abi/AgriTraceAnchor.json',
    );
    const abiArtifact = JSON.parse(readFileSync(abiPath, 'utf8'));
    const abi = abiArtifact.abi ?? abiArtifact;

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(contractAddress, abi, this.wallet);
    this.chainId = BLOCKCHAIN_CONFIG.CHAIN_ID;

    this.logger.log(
      `Blockchain ready: chain=${BLOCKCHAIN_CONFIG.CHAIN_NAME}(${this.chainId}) ` +
        `contract=${contractAddress} signer=${this.wallet.address}`,
    );
  }

  isReady(): boolean {
    return !!this.contract;
  }

  getChainId(): number {
    return this.chainId;
  }

  // Gửi tx storeAnchor(root, fromSeq, toSeq) và parse anchorId từ event receipt.
  async submitAnchor(
    root: string,
    fromSeq: bigint,
    toSeq: bigint,
  ): Promise<{
    txHash: string;
    blockNumber: number;
    onchainAnchorId: bigint;
  }> {
    if (!this.isReady()) {
      throw new Error('BlockchainService not initialized — check env vars');
    }

    this.logger.log(
      `submitAnchor: root=${root.slice(0, 10)}... range=[${fromSeq}, ${toSeq}]`,
    );

    const tx = await this.contract.storeAnchor(root, fromSeq, toSeq);
    const receipt = await tx.wait();
    if (!receipt) throw new Error('Tx receipt is null');

    const onchainAnchorId = this.parseAnchorId(receipt);

    this.logger.log(
      `Anchor confirmed: tx=${receipt.hash} block=${receipt.blockNumber} onchainId=${onchainAnchorId}`,
    );

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      onchainAnchorId,
    };
  }

  //  Đọc anchor info (root, fromSeq, toSeq, timestamp) từ contract theo onchainAnchorId.
  async getAnchorOnchain(onchainAnchorId: bigint): Promise<{
    merkleRoot: string;
    fromSeq: bigint;
    toSeq: bigint;
    timestamp: bigint;
  }> {
    if (!this.isReady()) {
      throw new Error('BlockchainService not initialized');
    }
    const a = await this.contract.anchors(onchainAnchorId);
    return {
      merkleRoot: a.merkleRoot,
      fromSeq: a.fromSeq,
      toSeq: a.toSeq,
      timestamp: a.timestamp,
    };
  }

  // Đọc root của anchor mới nhất (theo block number) từ contract.
  private parseAnchorId(receipt: ethers.TransactionReceipt): bigint {
    for (const log of receipt.logs) {
      try {
        const parsed = this.contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed?.name === 'AnchorStored') {
          const args = parsed.args as unknown as AnchorStoredEventArgs;
          return args.anchorId;
        }
      } catch {
      //  bỏ qua log không parse được
      }
    }
    throw new Error('AnchorStored event not found in receipt');
  }
}
