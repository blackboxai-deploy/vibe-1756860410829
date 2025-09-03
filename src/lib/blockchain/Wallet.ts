import { Transaction } from './Transaction';
import { HashUtil } from '../crypto/hash';

export interface WalletData {
  address: string;
  publicKey: string;
  privateKey: string;
  balance?: number;
}

/**
 * Represents a digital wallet for the blockchain
 */
export class Wallet {
  public address: string;
  public publicKey: string;
  private privateKey: string;
  public balance: number;

  constructor(data?: WalletData) {
    if (data) {
      this.address = data.address;
      this.publicKey = data.publicKey;
      this.privateKey = data.privateKey;
      this.balance = data.balance || 0;
    } else {
      // Generate new wallet
      const keyPair = this.generateKeyPair();
      this.publicKey = keyPair.publicKey;
      this.privateKey = keyPair.privateKey;
      this.address = this.generateAddress(this.publicKey);
      this.balance = 0;
    }
  }

  /**
   * Generate a new key pair (simplified for demo)
   */
  private generateKeyPair(): { publicKey: string; privateKey: string } {
    const randomSeed = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    const privateKey = HashUtil.sha256Sync(randomSeed + Date.now().toString());
    const publicKey = HashUtil.sha256Sync(privateKey + 'public');

    return { publicKey, privateKey };
  }

  /**
   * Generate wallet address from public key
   */
  private generateAddress(publicKey: string): string {
    const hash = HashUtil.sha256Sync(publicKey);
    return 'BC' + hash.substring(0, 32).toUpperCase();
  }

  /**
   * Create and sign a transaction
   */
  createTransaction(to: string, amount: number, fee: number = 0.001): Transaction {
    if (this.balance < amount + fee) {
      throw new Error('Insufficient balance');
    }

    const transaction = new Transaction({
      from: this.address,
      to,
      amount,
      fee,
      timestamp: Date.now()
    });

    // Sign the transaction
    transaction.signTransaction(this.privateKey);

    return transaction;
  }

  /**
   * Calculate balance from blockchain transactions
   */
  calculateBalance(allTransactions: Transaction[]): number {
    let balance = 0;

    for (const transaction of allTransactions) {
      // Add received amounts
      if (transaction.to === this.address) {
        balance += transaction.amount;
      }
      
      // Subtract sent amounts and fees
      if (transaction.from === this.address) {
        balance -= (transaction.amount + transaction.fee);
      }
    }

    this.balance = balance;
    return balance;
  }

  /**
   * Get transaction history for this wallet
   */
  getTransactionHistory(allTransactions: Transaction[]): Transaction[] {
    return allTransactions.filter(
      tx => tx.from === this.address || tx.to === this.address
    );
  }

  /**
   * Get pending transactions (sent but not yet mined)
   */
  getPendingTransactions(pendingTransactions: Transaction[]): Transaction[] {
    return pendingTransactions.filter(tx => tx.from === this.address);
  }

  /**
   * Verify if a transaction belongs to this wallet
   */
  ownsTransaction(transaction: Transaction): boolean {
    return transaction.from === this.address;
  }

  /**
   * Sign arbitrary data with this wallet's private key
   */
  signData(data: string): string {
    return HashUtil.sha256Sync(data + this.privateKey);
  }

  /**
   * Verify a signature against this wallet's public key
   */
  verifySignature(data: string, signature: string): boolean {
    const expectedSignature = HashUtil.sha256Sync(data + this.getPrivateKey());
    return signature === expectedSignature;
  }

  /**
   * Get public key (safe to share)
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Get private key (keep secret!)
   */
  getPrivateKey(): string {
    return this.privateKey;
  }

  /**
   * Export wallet data (without private key for sharing)
   */
  exportPublicData(): any {
    return {
      address: this.address,
      publicKey: this.publicKey,
      balance: this.balance
    };
  }

  /**
   * Export full wallet data (including private key)
   */
  exportWallet(): WalletData {
    return {
      address: this.address,
      publicKey: this.publicKey,
      privateKey: this.privateKey,
      balance: this.balance
    };
  }

  /**
   * Create wallet from exported data
   */
  static fromData(data: WalletData): Wallet {
    return new Wallet(data);
  }

  /**
   * Create multiple wallets for testing
   */
  static createTestWallets(count: number): Wallet[] {
    const wallets: Wallet[] = [];
    for (let i = 0; i < count; i++) {
      wallets.push(new Wallet());
    }
    return wallets;
  }

  /**
   * Get short address for display
   */
  getShortAddress(): string {
    return `${this.address.substring(0, 8)}...${this.address.substring(this.address.length - 8)}`;
  }

  /**
   * Format balance with currency symbol
   */
  getFormattedBalance(): string {
    return `₿${this.balance.toFixed(6)}`;
  }
}