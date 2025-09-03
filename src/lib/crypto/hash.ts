/**
 * SHA-256 hashing utility for blockchain operations
 */
export class HashUtil {
  /**
   * Calculate SHA-256 hash of input data using Web Crypto API
   */
  static async sha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Synchronous SHA-256 hash using a simple implementation for demo purposes
   */
  static sha256Sync(data: string): string {
    // Simple hash function for demo purposes (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(8).substring(0, 64);
  }

  /**
   * Calculate hash of a block
   */
  static hashBlock(
    index: number,
    previousHash: string,
    timestamp: number,
    data: string,
    nonce: number
  ): string {
    const blockString = `${index}${previousHash}${timestamp}${data}${nonce}`;
    return this.sha256Sync(blockString);
  }

  /**
   * Calculate Merkle root of transactions
   */
  static calculateMerkleRoot(transactions: string[]): string {
    if (transactions.length === 0) return this.sha256Sync('');
    if (transactions.length === 1) return this.sha256Sync(transactions[0]);

    let hashes = transactions.map(tx => this.sha256Sync(tx));
    
    while (hashes.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = i + 1 < hashes.length ? hashes[i + 1] : left;
        nextLevel.push(this.sha256Sync(left + right));
      }
      
      hashes = nextLevel;
    }
    
    return hashes[0];
  }

  /**
   * Validate proof of work - check if hash meets difficulty requirement
   */
  static isValidProofOfWork(hash: string, difficulty: number): boolean {
    const target = '0'.repeat(difficulty);
    return hash.substring(0, difficulty) === target;
  }

  /**
   * Generate a random nonce for mining
   */
  static generateNonce(): number {
    return Math.floor(Math.random() * 1000000);
  }
}