const crypto = require('crypto')

const ALGORITHM = 'aes-256-gcm'
const PREFIX = 'enc:v1:'

/**
 * Derives a 32-byte AES key from SETTINGS_ENCRYPTION_KEY.
 * Accepts either a 64-char hex string (raw 32-byte key) or any other
 * passphrase, which gets hashed down to 32 bytes with SHA-256.
 * Returns null if no key is configured.
 */
function getKey() {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY
  if (!raw) return null
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex')
  return crypto.createHash('sha256').update(raw).digest()
}

function isEncryptionConfigured() {
  return getKey() !== null
}

/**
 * Encrypts a plaintext string. If no encryption key is configured, returns
 * the value unchanged (caller is responsible for warning about this).
 */
function encrypt(plainText) {
  const key = getKey()
  if (!key || plainText === null || plainText === undefined) return plainText

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

/**
 * Decrypts a value previously produced by encrypt(). Values that were never
 * encrypted (no prefix — e.g. legacy plaintext rows) are returned as-is.
 * Throws if the value IS encrypted but no key is configured, since silently
 * returning ciphertext would be confusing and unsafe.
 */
function decrypt(value) {
  if (typeof value !== 'string' || !value.startsWith(PREFIX)) return value

  const key = getKey()
  if (!key) {
    throw new Error(
      'This setting is encrypted but SETTINGS_ENCRYPTION_KEY is not configured on the server.'
    )
  }

  const [ivB64, tagB64, dataB64] = value.slice(PREFIX.length).split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const data = Buffer.from(dataB64, 'base64')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])

  return decrypted.toString('utf8')
}

module.exports = { encrypt, decrypt, isEncryptionConfigured }
