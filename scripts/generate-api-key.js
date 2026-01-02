/**
 * Generate API keys for customers
 * Format: ib_sk_[32 random chars]
 */

const crypto = require('crypto');

function generateApiKey() {
  const prefix = 'ib_sk_';
  const randomPart = crypto.randomBytes(24).toString('hex'); // 48 chars
  return prefix + randomPart;
}

function generateMultipleKeys(count = 1) {
  const keys = [];
  for (let i = 0; i < count; i++) {
    keys.push(generateApiKey());
  }
  return keys;
}

// CLI usage
const count = parseInt(process.argv[2]) || 1;
const keys = generateMultipleKeys(count);

console.log('\n🔑 Generated API Key(s):\n');
keys.forEach((key, index) => {
  console.log(`${index + 1}. ${key}`);
});
console.log('\n');

module.exports = { generateApiKey, generateMultipleKeys };