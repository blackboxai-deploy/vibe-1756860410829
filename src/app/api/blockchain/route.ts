import { NextRequest, NextResponse } from 'next/server';
import { Blockchain } from '@/lib/blockchain/Blockchain';

// Global blockchain instance (in a real app, this would be in a database)
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
      case 'stats':
        return NextResponse.json({
          success: true,
          data: bc.getStats()
        });

      case 'chain':
        return NextResponse.json({
          success: true,
          data: {
            chain: bc.chain.map(block => block.toObject()),
            length: bc.chain.length
          }
        });

      case 'pending':
        return NextResponse.json({
          success: true,
          data: {
            transactions: bc.pendingTransactions.map(tx => tx.toObject()),
            count: bc.pendingTransactions.length
          }
        });

      case 'block':
        const blockIndex = parseInt(searchParams.get('index') || '0');
        const block = bc.getBlockByIndex(blockIndex);
        if (!block) {
          return NextResponse.json({
            success: false,
            error: 'Block not found'
          }, { status: 404 });
        }
        return NextResponse.json({
          success: true,
          data: block.toObject()
        });

      case 'balance':
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json({
            success: false,
            error: 'Address parameter required'
          }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          data: {
            address,
            balance: bc.getBalance(address)
          }
        });

      case 'transactions':
        const txAddress = searchParams.get('address');
        if (!txAddress) {
          return NextResponse.json({
            success: false,
            error: 'Address parameter required'
          }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          data: {
            transactions: bc.getTransactionHistory(txAddress).map(tx => tx.toObject())
          }
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'Blockchain API',
            endpoints: [
              'GET /api/blockchain?action=stats - Get blockchain statistics',
              'GET /api/blockchain?action=chain - Get full blockchain',
              'GET /api/blockchain?action=pending - Get pending transactions',
              'GET /api/blockchain?action=block&index=N - Get specific block',
              'GET /api/blockchain?action=balance&address=ADDR - Get address balance',
              'GET /api/blockchain?action=transactions&address=ADDR - Get address transactions',
              'POST /api/blockchain - Various blockchain operations'
            ]
          }
        });
    }
  } catch (error) {
    console.error('Blockchain API error:', error);
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
      case 'reset':
        blockchain = new Blockchain({
          difficulty: body.difficulty || 2,
          miningReward: body.miningReward || 10,
          maxTransactionsPerBlock: body.maxTransactionsPerBlock || 5
        });
        return NextResponse.json({
          success: true,
          message: 'Blockchain reset successfully'
        });

      case 'validate':
        const isValid = bc.isChainValid();
        return NextResponse.json({
          success: true,
          data: {
            isValid,
            message: isValid ? 'Blockchain is valid' : 'Blockchain is invalid'
          }
        });

      case 'adjust_difficulty':
        bc.adjustDifficulty();
        return NextResponse.json({
          success: true,
          data: {
            difficulty: bc.difficulty,
            message: 'Difficulty adjusted'
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Blockchain API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}