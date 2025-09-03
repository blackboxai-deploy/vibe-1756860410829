import { NextRequest, NextResponse } from 'next/server';
import { Blockchain } from '@/lib/blockchain/Blockchain';

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

// Mining state
interface MiningState {
  isMining: boolean;
  minerAddress: string | null;
  startTime: number | null;
  attempts: number;
  currentHash: string;
}

let miningState: MiningState = {
  isMining: false,
  minerAddress: null,
  startTime: null,
  attempts: 0,
  currentHash: ''
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const bc = getBlockchain();
        return NextResponse.json({
          success: true,
          data: {
            isMining: miningState.isMining,
            minerAddress: miningState.minerAddress,
            attempts: miningState.attempts,
            currentHash: miningState.currentHash,
            difficulty: bc.difficulty,
            pendingTransactions: bc.getPendingTransactionsCount(),
            miningReward: bc.miningReward,
            runtime: miningState.startTime ? Date.now() - miningState.startTime : 0
          }
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'Mining API',
            endpoints: [
              'GET /api/mining?action=status - Get mining status',
              'POST /api/mining - Start/stop mining operations'
            ]
          }
        });
    }
  } catch (error) {
    console.error('Mining API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, minerAddress } = body;

    const bc = getBlockchain();

    switch (action) {
      case 'start':
        if (!minerAddress) {
          return NextResponse.json({
            success: false,
            error: 'Miner address is required'
          }, { status: 400 });
        }

        if (miningState.isMining) {
          return NextResponse.json({
            success: false,
            error: 'Mining is already in progress'
          }, { status: 400 });
        }

        if (bc.pendingTransactions.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'No pending transactions to mine'
          }, { status: 400 });
        }

        // Start mining process
        miningState.isMining = true;
        miningState.minerAddress = minerAddress;
        miningState.startTime = Date.now();
        miningState.attempts = 0;
        miningState.currentHash = '';

        // Mine block asynchronously
        setTimeout(() => {
          try {
            const minedBlock = bc.mineBlock(minerAddress, (attempts, hash) => {
              miningState.attempts = attempts;
              miningState.currentHash = hash;
            });

            // Mining completed
            miningState.isMining = false;
            miningState.minerAddress = null;
            miningState.startTime = null;

            console.log(`Block mined successfully: ${minedBlock.hash}`);
          } catch (error) {
            console.error('Mining error:', error);
            miningState.isMining = false;
            miningState.minerAddress = null;
            miningState.startTime = null;
          }
        }, 100);

        return NextResponse.json({
          success: true,
          message: 'Mining started',
          data: {
            minerAddress,
            difficulty: bc.difficulty,
            pendingTransactions: bc.pendingTransactions.length
          }
        });

      case 'stop':
        if (!miningState.isMining) {
          return NextResponse.json({
            success: false,
            error: 'No mining in progress'
          }, { status: 400 });
        }

        miningState.isMining = false;
        miningState.minerAddress = null;
        miningState.startTime = null;

        return NextResponse.json({
          success: true,
          message: 'Mining stopped'
        });

      case 'quick_mine':
        if (!minerAddress) {
          return NextResponse.json({
            success: false,
            error: 'Miner address is required'
          }, { status: 400 });
        }

        if (bc.pendingTransactions.length === 0) {
          // Create a dummy transaction for testing
          const { Transaction } = await import('@/lib/blockchain/Transaction');
          const dummyTx = Transaction.createCoinbaseTransaction(minerAddress, 1);
          bc.addTransaction(dummyTx);
        }

        // Mine block immediately (synchronously for testing)
        const minedBlock = bc.mineBlock(minerAddress);

        return NextResponse.json({
          success: true,
          message: 'Block mined successfully',
          data: {
            block: minedBlock.toObject(),
            minerReward: bc.miningReward + minedBlock.getTotalFees()
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Mining API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}