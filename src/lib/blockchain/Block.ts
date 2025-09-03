import { Transaction } from './Transaction';
import { HashUtil } from '../crypto/hash';

export interface BlockData {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  nonce?: number;
  hash?: string;
}

/**
 * Represents a block in the blockchain
 */
export class Block {
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public previousHash: string;
  public nonce: number;
  public hash: string;
  public merkleRoot: string;

  constructor(data: BlockData) {
    this.index = data.index;
    this.timestamp = data.timestamp;
    this.transactions = data.transactions;
    this.previousHash = data.previousHash;
    this.nonce = data.nonce || 0;
    this.merkleRoot = this.calculateMerkleRoot();
    this.hash = data.hash || this.calculateHash();
  }

  /**
   * Calculate the hash of this block
   */
  calculateHash(): string {
    const blockString = `${this.index}${this.previousHash}${this.timestamp}${this.merkleRoot}${this.nonce}`;
    return HashUtil.sha256Sync(blockString);
  }

  /**
   * Calculate the Merkle root of all transactions in this block
   */
  calculateMerkleRoot(): string {
    if (this.transactions.length === 0) {
      return HashUtil.sha256Sync('');
    }

    const transactionHashes = this.transactions.map(tx => tx.hash);
    return HashUtil.calculateMerkleRoot(transactionHashes);
  }

  /**
   * Mine this block using Proof of Work
   */
  mineBlock(difficulty: number, onProgress?: (attempts: number, hash: string) => void): void {
    const target = '0'.repeat(difficulty);
    let attempts = 0;
    
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      attempts++;
      this.hash = this.calculateHash();
      
      // Call progress callback every 1000 attempts
      if (onProgress && attempts % 1000 === 0) {
        onProgress(attempts, this.hash);
      }
    }

    console.log(`Block mined after ${attempts} attempts: ${this.hash}`);
  }

  /**
   * Validate all transactions in this block
   */
  validateTransactions(): boolean {
    for (const transaction of this.transactions) {
      if (!transaction.isValid()) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if this block is valid
   */
  isValidBlock(previousBlock?: Block, difficulty?: number): boolean {
    // Check if block hash is valid
    if (this.hash !== this.calculateHash()) {
      return false;
    }

    // Check if merkle root is valid
    if (this.merkleRoot !== this.calculateMerkleRoot()) {
      return false;
    }

    // Check if previous hash matches
    if (previousBlock && this.previousHash !== previousBlock.hash) {
      return false;
    }

    // Check proof of work if difficulty provided
    if (difficulty !== undefined && !HashUtil.isValidProofOfWork(this.hash, difficulty)) {
      return false;
    }

    // Validate all transactions
    if (!this.validateTransactions()) {
      return false;
    }

    return true;
  }

  /**
   * Get the total transaction fees in this block
   */
  getTotalFees(): number {
    return this.transactions.reduce((total, tx) => total + tx.fee, 0);
  }

  /**
   * Get the total transaction amount in this block
   */
  getTotalAmount(): number {
    return this.transactions
      .filter(tx => tx.from !== 'SYSTEM') // Exclude coinbase transactions
      .reduce((total, tx) => total + tx.amount, 0);
  }

  /**
   * Create genesis block (first block in the chain)
   */
  static createGenesisBlock(): Block {
    const genesisTransaction = Transaction.createCoinbaseTransaction('genesis', 100);
    
    return new Block({
      index: 0,
      timestamp: Date.now(),
      transactions: [genesisTransaction],
      previousHash: '0'.repeat(64)
    });
  }

  /**
   * Get block data as object
   */
  toObject(): any {
    return {
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions.map(tx => tx.toObject()),
      previousHash: this.previousHash,
      nonce: this.nonce,
      hash: this.hash,
      merkleRoot: this.merkleRoot
    };
  }

  /**
   * Create block from object data
   */
  static fromObject(data: any): Block {
    const transactions = data.transactions.map((txData: any) => Transaction.fromObject(txData));
    
    const block = new Block({
      index: data.index,
      timestamp: data.timestamp,
      transactions,
      previousHash: data.previousHash,
      nonce: data.nonce,
      hash: data.hash
    });

    return block;
  }
}