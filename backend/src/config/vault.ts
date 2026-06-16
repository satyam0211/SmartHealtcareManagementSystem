import vault from 'node-vault';

const vaultAddr = process.env.VAULT_ADDR || 'http://127.0.0.1:8200';
const vaultToken = process.env.VAULT_TOKEN || 'ship_vault_root_token';

// Initialize the Vault client
export const vaultClient = vault({
  apiVersion: 'v1',
  endpoint: vaultAddr,
  token: vaultToken,
});

/**
 * Encrypts a string using the Vault Transit Secrets Engine
 * @param plaintext The raw string to encrypt
 * @param keyName The transit key name (e.g. 'patient-key')
 */
export async function encryptField(plaintext: string, keyName: string = 'ship-patient-key'): Promise<string> {
  try {
    const response = await vaultClient.write(`transit/encrypt/${keyName}`, {
      plaintext: Buffer.from(plaintext).toString('base64'),
    });
    return response.data.ciphertext;
  } catch (error) {
    console.error('Vault encryption failed:', error);
    throw new Error('Encryption Service Unavailable');
  }
}

/**
 * Decrypts a ciphertext string using the Vault Transit Secrets Engine
 * @param ciphertext The encrypted string
 * @param keyName The transit key name
 */
export async function decryptField(ciphertext: string, keyName: string = 'ship-patient-key'): Promise<string> {
  try {
    const response = await vaultClient.write(`transit/decrypt/${keyName}`, {
      ciphertext: ciphertext,
    });
    const base64Plaintext = response.data.plaintext;
    return Buffer.from(base64Plaintext, 'base64').toString('utf8');
  } catch (error) {
    console.error('Vault decryption failed:', error);
    throw new Error('Decryption Service Unavailable');
  }
}
