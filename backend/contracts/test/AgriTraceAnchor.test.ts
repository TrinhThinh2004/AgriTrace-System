import { expect } from 'chai';
import { ethers } from 'hardhat';
import type { AgriTraceAnchor } from '../typechain-types';

describe('AgriTraceAnchor', () => {
  let contract: AgriTraceAnchor;
  let owner: any;
  let other: any;

  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('AgriTraceAnchor');
    contract = (await Factory.deploy()) as unknown as AgriTraceAnchor;
    await contract.waitForDeployment();
  });

  describe('deployment', () => {
    it('sets deployer as owner', async () => {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it('starts with lastAnchorId = 0', async () => {
      expect(await contract.lastAnchorId()).to.equal(0n);
    });
  });

  describe('storeAnchor', () => {
    const root = ethers.keccak256(ethers.toUtf8Bytes('test-merkle-root'));

    it('owner can store, increments id, emits event', async () => {
      const tx = await contract.storeAnchor(root, 1n, 100n);
      await expect(tx)
        .to.emit(contract, 'AnchorStored')
        .withArgs(1n, root, 1n, 100n, owner.address);

      expect(await contract.lastAnchorId()).to.equal(1n);
      const a = await contract.anchors(1n);
      expect(a.merkleRoot).to.equal(root);
      expect(a.fromSeq).to.equal(1n);
      expect(a.toSeq).to.equal(100n);
      expect(a.timestamp).to.be.greaterThan(0n);
    });

    it('multiple anchors increment monotonically', async () => {
      await contract.storeAnchor(root, 1n, 10n);
      await contract.storeAnchor(root, 11n, 20n);
      await contract.storeAnchor(root, 21n, 30n);
      expect(await contract.lastAnchorId()).to.equal(3n);
    });

    it('reverts when called by non-owner', async () => {
      await expect(
        contract.connect(other).storeAnchor(root, 1n, 100n),
      ).to.be.revertedWithCustomError(contract, 'NotOwner');
    });

    it('reverts on invalid range (toSeq < fromSeq)', async () => {
      await expect(
        contract.storeAnchor(root, 100n, 50n),
      ).to.be.revertedWithCustomError(contract, 'InvalidRange');
    });

    it('reverts on zero root', async () => {
      await expect(
        contract.storeAnchor(ethers.ZeroHash, 1n, 1n),
      ).to.be.revertedWithCustomError(contract, 'InvalidRoot');
    });

    it('allows fromSeq == toSeq (single-record batch)', async () => {
      await contract.storeAnchor(root, 42n, 42n);
      const a = await contract.anchors(1n);
      expect(a.fromSeq).to.equal(42n);
      expect(a.toSeq).to.equal(42n);
    });
  });

  describe('transferOwnership', () => {
    it('owner can transfer to a new address', async () => {
      await expect(contract.transferOwnership(other.address))
        .to.emit(contract, 'OwnershipTransferred')
        .withArgs(owner.address, other.address);
      expect(await contract.owner()).to.equal(other.address);
    });

    it('reverts when called by non-owner', async () => {
      await expect(
        contract.connect(other).transferOwnership(other.address),
      ).to.be.revertedWithCustomError(contract, 'NotOwner');
    });

    it('reverts on zero address', async () => {
      await expect(
        contract.transferOwnership(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(contract, 'InvalidAddress');
    });

    it('new owner can store anchor; old owner cannot', async () => {
      await contract.transferOwnership(other.address);
      const root = ethers.keccak256(ethers.toUtf8Bytes('x'));
      await contract.connect(other).storeAnchor(root, 1n, 1n);
      await expect(
        contract.storeAnchor(root, 2n, 2n),
      ).to.be.revertedWithCustomError(contract, 'NotOwner');
    });
  });
});
