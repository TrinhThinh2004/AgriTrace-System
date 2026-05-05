/**
 * Copy compiled ABI + bytecode from artifacts/ to ../libs/shared/abi/
 * so audit-service can import via @app/shared. Strips bulky metadata.
 *
 * Usage: npm run export-abi (after `npm run compile`)
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(
  __dirname,
  '..',
  'artifacts',
  'contracts',
  'AgriTraceAnchor.sol',
  'AgriTraceAnchor.json',
);
const DEST_DIR = path.join(__dirname, '..', '..', 'libs', 'shared', 'abi');
const DEST = path.join(DEST_DIR, 'AgriTraceAnchor.json');

if (!fs.existsSync(SRC)) {
  console.error('ABI artifact not found at:', SRC);
  console.error('Run `npm run compile` first.');
  process.exit(1);
}

fs.mkdirSync(DEST_DIR, { recursive: true });

const artifact = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const minimal = {
  contractName: artifact.contractName,
  abi: artifact.abi,
  bytecode: artifact.bytecode,
};
fs.writeFileSync(DEST, JSON.stringify(minimal, null, 2));
console.log(`✓ ABI exported to ${DEST}`);
