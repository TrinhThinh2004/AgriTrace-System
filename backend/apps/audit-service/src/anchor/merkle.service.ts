import { Injectable } from '@nestjs/common';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

/**
 * Tính Merkle tree từ danh sách record_hash của audit_logs.
 * Dùng keccak256 (giống Ethereum) + sortPairs để root tính off-chain
 * khớp với cách verify on-chain (nếu sau này contract verify proof).
 *
 * Input record_hash là sha256 hex (64 chars). Trước khi đưa vào Merkle,
 * convert hex → Buffer; cây sẽ hash các leaf bằng keccak256 lần nữa.
 */
@Injectable()
export class MerkleService {
  /**
   * Build Merkle tree.
   * @param recordHashes Mảng record_hash hex (không có 0x prefix).
   * @returns root (0x-prefixed hex) + tree object để gọi getProof().
   */
  buildTree(recordHashes: string[]): { root: string; tree: MerkleTree } {
    if (recordHashes.length === 0) {
      throw new Error('Cannot build Merkle tree from empty list');
    }
    const leaves = recordHashes.map((h) => Buffer.from(h, 'hex'));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = '0x' + tree.getRoot().toString('hex');
    return { root, tree };
  }

  /**
   * Lấy Merkle proof cho 1 record_hash → mảng các sibling hashes (0x hex).
   * Client verify: replay proof + record_hash → root → so với on-chain root.
   */
  getProof(tree: MerkleTree, recordHash: string): string[] {
    const leaf = Buffer.from(recordHash, 'hex');
    return tree.getProof(leaf).map((p) => '0x' + p.data.toString('hex'));
  }

  /**
   * Verify proof độc lập 
   */
  verifyProof(root: string, recordHash: string, proof: string[]): boolean {
    const leaf = Buffer.from(recordHash, 'hex');
    const proofBufs = proof.map((p) =>
      Buffer.from(p.startsWith('0x') ? p.slice(2) : p, 'hex'),
    );
    const rootBuf = Buffer.from(
      root.startsWith('0x') ? root.slice(2) : root,
      'hex',
    );
    return MerkleTree.verify(proofBufs, leaf, rootBuf, keccak256, {
      sortPairs: true,
    });
  }
}
