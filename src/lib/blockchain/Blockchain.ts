import { Block } from './Block';
import { Transaction } from './Transaction';

export interface BlockchainConfig {
  difficulty: number;
  miningReward: number;
  maxTransactionsPerBlock: number;
}

/**
 * Main blockchain implementation
 */
export class Blockchain {
  public chain: Block[];
  public pendingTransactions: Transaction[];
  public difficulty: number;
  public miningReward: number;
  public maxTransactionsPerBlock: number;

  constructor(config: Partial<BlockchainConfig> = {}) {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = config.difficulty || 2;
    this.miningReward = config.miningReward || 10;
    this.maxTransactionsPerBlock = config.maxTransactionsPerBlock || 10;

    // Create genesis block
    this.createGenesisBlock();
  }

  /**
   * Create the genesis block (first block in the chain)
   */
  private createGenesisBlock(): void {
    const genesisBlock = Block.createGenesisBlock();
    genesisBlock.mineBlock(this.difficulty);
    this.chain.push(genesisBlock);
  }

  /**
   * Get the latest block in the chain
   */
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add a transaction to the pending pool
   */
  addTransaction(transaction: Transaction): boolean {
    // Validate transaction
    if (!transaction.isValid()) {
      console.error('Invalid transaction');
      return false;
    }

    // Check if sender has sufficient balance (except for system transactions)
    if (transaction.from !== 'SYSTEM') {
      const senderBalance = this.getBalance(transaction.from);
      if (senderBalance < transaction.amount + transaction.fee) {
        console.error('Insufficient balance');
        return false;
      }
    }

    // Check for double spending
    const existingTransaction = this.pendingTransactions.find(
      tx => tx.hash === transaction.hash
    );
    if (existingTransaction) {
      console.error('Transaction already exists');
      return false;
    }

    this.pendingTransactions.push(transaction);
    return true;
  }

  /**
   * Mine a new block with pending transactions
   */
  mineBlock(minerAddress: string, onProgress?: (attempts: number, hash: string) => void): Block {
    // Select transactions for the block (up to max limit)
    const transactionsToMine = this.pendingTransactions
      .slice(0, this.maxTransactionsPerBlock);

    // Create coinbase transaction (mining reward)
    const coinbaseTransaction = Transaction.createCoinbaseTransaction(
      minerAddress, 
      this.miningReward + this.getTotalFees(transactionsToMine)
    );

    // Create new block
    const newBlock = new Block({
      index: this.chain.length,
      timestamp: Date.now(),
      transactions: [coinbaseTransaction, ...transactionsToMine],
      previousHash: this.getLatestBlock().hash
    });

    // Mine the block
    newBlock.mineBlock(this.difficulty, onProgress);

    // Add block to chain
    this.chain.push(newBlock);

    // Remove mined transactions from pending pool
    this.pendingTransactions = this.pendingTransactions.slice(this.maxTransactionsPerBlock);

    return newBlock;
  }

  /**
   * Get total fees from a list of transactions
   */
  private getTotalFees(transactions: Transaction[]): number {
    return transactions.reduce((total, tx) => total + tx.fee, 0);
  }

  /**
   * Get balance for an address
   */
  getBalance(address: string): number {
    let balance = 0;

    // Go through all blocks and transactions
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        // Add received amounts
        if (transaction.to === address) {
          balance += transaction.amount;
        }
        
        // Subtract sent amounts and fees
        if (transaction.from === address) {
          balance -= (transaction.amount + transaction.fee);
        }
      }
    }

    return balance;
  }

  /**
   * Get all transactions for an address
   */
  getTransactionHistory(address: string): Transaction[] {
    const transactions: Transaction[] = [];

    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.from === address || transaction.to === address) {
          transactions.push(transaction);
        }
      }
    }

    return transactions;
  }

  /**
   * Validate the entire blockchain
   */
  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Validate current block
      if (!currentBlock.isValidBlock(previousBlock, this.difficulty)) {
        return false;
      }

      // Check if previous hash matches
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get blockchain statistics
   */
  getStats(): any {
    const totalTransactions = this.chain.reduce(
      (total, block) => total + block.transactions.length, 0
    );

    const totalBlocks = this.chain.length;
    const pendingCount = this.pendingTransactions.length;

    // Calculate average block time
    let totalTime = 0;
    for (let i = 1; i < this.chain.length; i++) {
      totalTime += this.chain[i].timestamp - this.chain[i - 1].timestamp;
    }
    const averageBlockTime = totalBlocks > 1 ? totalTime / (totalBlocks - 1) : 0;

    return {
      totalBlocks,
      totalTransactions,
      pendingTransactions: pendingCount,
      difficulty: this.difficulty,
      miningReward: this.miningReward,
      averageBlockTime: Math.round(averageBlockTime),
      isValid: this.isChainValid()
    };
  }

  /**
   * Get pending transactions count
   */
  getPendingTransactionsCount(): number {
    return this.pendingTransactions.length;
  }

  /**
   * Get block by hash
   */
  getBlockByHash(hash: string): Block | undefined {
    return this.chain.find(block => block.hash === hash);
  }

  /**
   * Get block by index
   */
  getBlockByIndex(index: number): Block | undefined {
    return this.chain[index];
  }

  /**
   * Adjust mining difficulty based on block time
   */
  adjustDifficulty(): void {
    const targetBlockTime = 30000; // 30 seconds
    
    if (this.chain.length < 2) return;

    const lastBlock = this.getLatestBlock();
    const previousBlock = this.chain[this.chain.length - 2];
    const actualTime = lastBlock.timestamp - previousBlock.timestamp;

    if (actualTime < targetBlockTime / 2) {
      this.difficulty++;
    } else if (actualTime > targetBlockTime * 2) {
      this.difficulty = Math.max(1, this.difficulty - 1);
    }

    console.log(`Difficulty adjusted to: ${this.difficulty}`);
  }

  /**
   * Export blockchain data
   */
  exportChain(): any {
    return {
      chain: this.chain.map(block => block.toObject()),
      pendingTransactions: this.pendingTransactions.map(tx => tx.toObject()),
      difficulty: this.difficulty,
      miningReward: this.miningReward,
      maxTransactionsPerBlock: this.maxTransactionsPerBlock
    };
  }

  /**
   * Import blockchain data
   */
  importChain(data: any): void {
    this.chain = data.chain.map((blockData: any) => Block.fromObject(blockData));
    this.pendingTransactions = data.pendingTransactions.map(
      (txData: any) => Transaction.fromObject(txData)
    );
    this.difficulty = data.difficulty;
    this.miningReward = data.miningReward;
    this.maxTransactionsPerBlock = data.maxTransactionsPerBlock;
  }
}