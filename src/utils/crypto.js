/**
 * Hash a string using SHA-256
 * @param {string} text - The text to hash
 * @returns {Promise<string>} - Hex-encoded hash
 */
export async function sha256Hash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
