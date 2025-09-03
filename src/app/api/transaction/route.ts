import { NextRequest, NextResponse } from 'next/server';
import { Transaction } from '@/lib/blockchain/Transaction';
import { Blockchain } from '@/lib/blockchain/Blockchain';
import { Wallet } from '@/lib/blockchain/Wallet';

// Global blockchain instance
let blockchain: Blockchain | null = null;



function getBlockchain(): Blockchain {
  if (!blockchain) {
    blockchain = new Blockchain({
      difficulty: 2,
      miningReward: 10,
      maxTransactionsPerBlock: 5
    });
  }
  return blockchain;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const bc = getBlockchain();

    switch (action) {
      case 'pending':
        return NextResponse.json({
          success: true,
          data: {
            transactions: bc.pendingTransactions.map(tx => tx.toObject()),
            count: bc.pendingTransactions.length
          }
        });

      case 'all':
        const allTransactions = [];
        for (const block of bc.chain) {
          for (const tx of block.transactions) {
            allTransactions.push({
              ...tx.toObject(),
              blockIndex: block.index,
              blockHash: block.hash,
              confirmations: bc.chain.length - block.index
            });
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            transactions: allTransactions,
            count: allTransactions.length
          }
        });

      case 'by_hash':
        const hash = searchParams.get('hash');
        if (!hash) {
          return NextResponse.json({
            success: false,
            error: 'Hash parameter required'
          }, { status: 400 });
        }

        // Search in pending transactions
        let foundTx = bc.pendingTransactions.find(tx => tx.hash === hash);
        let blockInfo = null;

        // If not found in pending, search in blockchain
        if (!foundTx) {
          for (const block of bc.chain) {
            const tx = block.transactions.find(tx => tx.hash === hash);
            if (tx) {
              foundTx = tx;
              blockInfo = {
                blockIndex: block.index,
                blockHash: block.hash,
                confirmations: bc.chain.length - block.index
              };
              break;
            }
          }
        }

        if (!foundTx) {
          return NextResponse.json({
            success: false,
            error: 'Transaction not found'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: {
            transaction: foundTx.toObject(),
            ...blockInfo,
            isPending: !blockInfo
          }
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'Transaction API',
            endpoints: [
              'GET /api/transaction?action=pending - Get pending transactions',
              'GET /api/transaction?action=all - Get all transactions',
              'GET /api/transaction?action=by_hash&hash=HASH - Get transaction by hash',
              'POST /api/transaction - Create and submit transactions'
            ]
          }
        });
    }
  } catch (error) {
    console.error('Transaction API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const bc = getBlockchain();

    switch (action) {
      case 'create':
        const { from, to, amount, fee = 0.001, privateKey } = body;

        // Validate required fields
        if (!from || !to || !amount) {
          return NextResponse.json({
            success: false,
            error: 'from, to, and amount are required'
          }, { status: 400 });
        }

        // Check if amount is valid
        if (amount <= 0) {
          return NextResponse.json({
            success: false,
            error: 'Amount must be greater than 0'
          }, { status: 400 });
        }

        // Check if fee is valid
        if (fee < 0) {
          return NextResponse.json({
            success: false,
            error: 'Fee cannot be negative'
          }, { status: 400 });
        }

        // Check sender balance
        const senderBalance = bc.getBalance(from);
        if (senderBalance < amount + fee) {
          return NextResponse.json({
            success: false,
            error: `Insufficient balance. Available: ${senderBalance}, Required: ${amount + fee}`
          }, { status: 400 });
        }

        // Create transaction
        const transaction = new Transaction({
          from,
          to,
          amount: parseFloat(amount),
          fee: parseFloat(fee),
          timestamp: Date.now()
        });

        // Sign transaction if private key provided
        if (privateKey) {
          transaction.signTransaction(privateKey);
        }

        // Add to blockchain
        const success = bc.addTransaction(transaction);
        if (!success) {
          return NextResponse.json({
            success: false,
            error: 'Failed to add transaction to blockchain'
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: 'Transaction created and added to pending pool',
          data: {
            transaction: transaction.toObject(),
            pendingCount: bc.pendingTransactions.length
          }
        });

      case 'batch_create':
        const { transactions } = body;

        if (!Array.isArray(transactions) || transactions.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'transactions array is required'
          }, { status: 400 });
        }

        if (transactions.length > 10) {
          return NextResponse.json({
            success: false,
            error: 'Maximum 10 transactions per batch'
          }, { status: 400 });
        }

        const results = [];
        let successCount = 0;

        for (const txData of transactions) {
          try {
            const { from, to, amount, fee = 0.001, privateKey } = txData;

            // Validate transaction data
            if (!from || !to || !amount || amount <= 0) {
              results.push({
                success: false,
                error: 'Invalid transaction data',
                data: txData
              });
              continue;
            }

            // Check balance
            const balance = bc.getBalance(from);
            if (balance < amount + fee) {
              results.push({
                success: false,
                error: 'Insufficient balance',
                data: txData
              });
              continue;
            }

            // Create and sign transaction
            const tx = new Transaction({
              from,
              to,
              amount: parseFloat(amount),
              fee: parseFloat(fee),
              timestamp: Date.now()
            });

            if (privateKey) {
              tx.signTransaction(privateKey);
            }

            // Add to blockchain
            const added = bc.addTransaction(tx);
            if (added) {
              results.push({
                success: true,
                data: tx.toObject()
              });
              successCount++;
            } else {
              results.push({
                success: false,
                error: 'Failed to add transaction',
                data: txData
              });
            }
          } catch (error) {
            results.push({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              data: txData
            });
          }
        }

        return NextResponse.json({
          success: true,
          message: `${successCount}/${transactions.length} transactions processed successfully`,
          data: {
            results,
            successCount,
            totalCount: transactions.length,
            pendingCount: bc.pendingTransactions.length
          }
        });

      case 'simulate':
        const { from: simFrom, to: simTo, amount: simAmount, fee: simFee = 0.001 } = body;

        if (!simFrom || !simTo || !simAmount) {
          return NextResponse.json({
            success: false,
            error: 'from, to, and amount are required for simulation'
          }, { status: 400 });
        }

        const currentBalance = bc.getBalance(simFrom);
        const totalCost = parseFloat(simAmount) + parseFloat(simFee);
        const canAfford = currentBalance >= totalCost;

        return NextResponse.json({
          success: true,
          data: {
            simulation: {
              from: simFrom,
              to: simTo,
              amount: parseFloat(simAmount),
              fee: parseFloat(simFee),
              totalCost,
              currentBalance,
              canAfford,
              newBalance: canAfford ? currentBalance - totalCost : currentBalance,
              estimatedConfirmationTime: '30-60 seconds'
            }
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Transaction API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}