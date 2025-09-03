import { HashUtil } from '../crypto/hash';

export interface TransactionData {
  from: string;
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  signature?: string;
}

/**
 * Represents a blockchain transaction
 */
export class Transaction {
  public from: string;
  public to: string;
  public amount: number;
  public fee: number;
  public timestamp: number;
  public signature: string;
  public hash: string;

  constructor(data: TransactionData) {
    this.from = data.from;
    this.to = data.to;
    this.amount = data.amount;
    this.fee = data.fee;
    this.timestamp = data.timestamp;
    this.signature = data.signature || '';
    this.hash = this.calculateHash();
  }

  /**
   * Calculate the hash of this transaction
   */
  calculateHash(): string {
    const transactionString = `${this.from}${this.to}${this.amount}${this.fee}${this.timestamp}`;
    return HashUtil.sha256Sync(transactionString);
  }

  /**
   * Sign this transaction with a private key (simplified for demo)
   */
  signTransaction(privateKey: string): void {
    // Simplified signing - in real blockchain this would use ECDSA
    const dataToSign = `${this.from}${this.to}${this.amount}${this.fee}${this.timestamp}${privateKey}`;
    this.signature = HashUtil.sha256Sync(dataToSign);
    this.hash = this.calculateHash();
  }

  /**
   * Verify the signature of this transaction
   */
  isValidSignature(publicKey: string): boolean {
    if (!this.signature) return false;
    
    // Simplified verification - in real blockchain this would verify ECDSA signature
    const expectedSignature = HashUtil.sha256Sync(
      `${this.from}${this.to}${this.amount}${this.fee}${this.timestamp}${publicKey}`
    );
    
    return this.signature === expectedSignature;
  }

  /**
   * Check if this transaction is valid
   */
  isValid(): boolean {
    // Check basic validity
    if (this.from === this.to) return false;
    if (this.amount <= 0) return false;
    if (this.fee < 0) return false;
    if (!this.signature) return false;
    
    // Genesis transaction (mining reward) doesn't need signature verification
    if (this.from === 'SYSTEM') return true;
    
    return true; // Simplified - in real implementation would verify signature
  }

  /**
   * Create a coinbase transaction (mining reward)
   */
  static createCoinbaseTransaction(to: string, amount: number): Transaction {
    return new Transaction({
      from: 'SYSTEM',
      to,
      amount,
      fee: 0,
      timestamp: Date.now()
    });
  }

  /**
   * Get transaction data as object
   */
  toObject(): any {
    return {
      from: this.from,
      to: this.to,
      amount: this.amount,
      fee: this.fee,
      timestamp: this.timestamp,
      signature: this.signature,
      hash: this.hash
    };
  }

  /**
   * Create transaction from object data
   */
  static fromObject(data: any): Transaction {
    const transaction = new Transaction({
      from: data.from,
      to: data.to,
      amount: data.amount,
      fee: data.fee,
      timestamp: data.timestamp,
      signature: data.signature
    });
    transaction.hash = data.hash;
    return transaction;
  }
}