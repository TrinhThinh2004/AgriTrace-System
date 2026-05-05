import { ethers, network } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  const native = 'ETH';

  console.log('──────────────────────────────────────────────');
  console.log(` Network:  ${network.name} (chainId ${network.config.chainId})`);
  console.log(` Deployer: ${deployer.address}`);
  console.log(` Balance:  ${ethers.formatEther(balance)} ${native}`);
  console.log('──────────────────────────────────────────────');

  if (balance === 0n && network.name !== 'hardhat') {
    throw new Error(
      `Deployer wallet has 0 ${native}. ` +
        'Get test ETH from https://sepolia-faucet.pk910.de/ before deploying.',
    );
  }

  const Factory = await ethers.getContractFactory('AgriTraceAnchor');
  console.log('Deploying AgriTraceAnchor...');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const tx = contract.deploymentTransaction();
  const receipt = tx ? await tx.wait() : null;

  console.log('\n✓ Deployed AgriTraceAnchor');
  console.log(`  address:  ${address}`);
  console.log(`  tx:       ${tx?.hash}`);
  console.log(`  block:    ${receipt?.blockNumber ?? '(pending)'}`);
  console.log(`  gas used: ${receipt?.gasUsed?.toString() ?? '?'}`);

  if (network.name === 'sepolia') {
    console.log(`  explorer: https://sepolia.etherscan.io/address/${address}`);
    console.log('\nNext steps:');
    console.log(`  1. Add to backend/.env:`);
    console.log(`       ANCHOR_CONTRACT_ADDRESS=${address}`);
    console.log(`  2. Export ABI for audit-service to use:`);
    console.log(`       npm run export-abi`);
    console.log(`  3. (optional) Verify on Etherscan:`);
    console.log(`       npx hardhat verify --network sepolia ${address}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
