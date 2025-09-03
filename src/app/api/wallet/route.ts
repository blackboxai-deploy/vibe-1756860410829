import { NextRequest, NextResponse } from 'next/server';
import { Wallet } from '@/lib/blockchain/Wallet';
import { Blockchain } from '@/lib/blockchain/Blockchain';

// Global storage for wallets (in a real app, this would be in a database)
const wallets = new Map<string, Wallet>();

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
    const address = searchParams.get('address');

    switch (action) {
      case 'list':
        const walletsList = Array.from(wallets.values()).map(wallet => ({
          address: wallet.address,
          balance: wallet.balance,
          shortAddress: wallet.getShortAddress(),
          formattedBalance: wallet.getFormattedBalance()
        }));

        return NextResponse.json({
          success: true,
          data: {
            wallets: walletsList,
            count: walletsList.length
          }
        });

      case 'balance':
        if (!address) {
          return NextResponse.json({
            success: false,
            error: 'Address parameter required'
          }, { status: 400 });
        }

        const bc = getBlockchain();
        const balance = bc.getBalance(address);
        
        return NextResponse.json({
          success: true,
          data: {
            address,
            balance,
            formattedBalance: `₿${balance.toFixed(6)}`
          }
        });

      case 'transactions':
        if (!address) {
          return NextResponse.json({
            success: false,
            error: 'Address parameter required'
          }, { status: 400 });
        }

        const blockchain = getBlockchain();
        const transactions = blockchain.getTransactionHistory(address);
        
        return NextResponse.json({
          success: true,
          data: {
            address,
            transactions: transactions.map(tx => tx.toObject()),
            count: transactions.length
          }
        });

      case 'details':
        if (!address) {
          return NextResponse.json({
            success: false,
            error: 'Address parameter required'
          }, { status: 400 });
        }

        const wallet = wallets.get(address);
        if (!wallet) {
          return NextResponse.json({
            success: false,
            error: 'Wallet not found'
          }, { status: 404 });
        }

        const blockchainInstance = getBlockchain();
        wallet.balance = blockchainInstance.getBalance(address);

        return NextResponse.json({
          success: true,
          data: {
            ...wallet.exportPublicData(),
            shortAddress: wallet.getShortAddress(),
            formattedBalance: wallet.getFormattedBalance(),
            transactionCount: blockchainInstance.getTransactionHistory(address).length
          }
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'Wallet API',
            endpoints: [
              'GET /api/wallet?action=list - List all wallets',
              'GET /api/wallet?action=balance&address=ADDR - Get wallet balance',
              'GET /api/wallet?action=transactions&address=ADDR - Get wallet transactions',
              'GET /api/wallet?action=details&address=ADDR - Get wallet details',
              'POST /api/wallet - Create wallets and perform operations'
            ]
          }
        });
    }
  } catch (error) {
    console.error('Wallet API error:', error);
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

    switch (action) {
      case 'create':
        const newWallet = new Wallet();
        wallets.set(newWallet.address, newWallet);

        return NextResponse.json({
          success: true,
          message: 'Wallet created successfully',
          data: {
            address: newWallet.address,
            publicKey: newWallet.publicKey,
            balance: newWallet.balance,
            shortAddress: newWallet.getShortAddress()
          }
        });

      case 'import':
        const { privateKey, publicKey, address } = body;
        
        if (!privateKey || !publicKey || !address) {
          return NextResponse.json({
            success: false,
            error: 'privateKey, publicKey, and address are required'
          }, { status: 400 });
        }

        const importedWallet = Wallet.fromData({
          address,
          publicKey,
          privateKey,
          balance: 0
        });

        // Update balance from blockchain
        const bc = getBlockchain();
        importedWallet.balance = bc.getBalance(address);
        
        wallets.set(address, importedWallet);

        return NextResponse.json({
          success: true,
          message: 'Wallet imported successfully',
          data: {
            address: importedWallet.address,
            balance: importedWallet.balance,
            shortAddress: importedWallet.getShortAddress(),
            formattedBalance: importedWallet.getFormattedBalance()
          }
        });

      case 'export':
        const { address: exportAddress, includePrivateKey = false } = body;
        
        if (!exportAddress) {
          return NextResponse.json({
            success: false,
            error: 'Address is required'
          }, { status: 400 });
        }

        const walletToExport = wallets.get(exportAddress);
        if (!walletToExport) {
          return NextResponse.json({
            success: false,
            error: 'Wallet not found'
          }, { status: 404 });
        }

        const exportData = includePrivateKey 
          ? walletToExport.exportWallet()
          : walletToExport.exportPublicData();

        return NextResponse.json({
          success: true,
          data: exportData
        });

      case 'create_multiple':
        const { count = 5 } = body;
        
        if (count > 20) {
          return NextResponse.json({
            success: false,
            error: 'Maximum 20 wallets can be created at once'
          }, { status: 400 });
        }

        const newWallets = Wallet.createTestWallets(count);
        const walletData = [];

        for (const wallet of newWallets) {
          wallets.set(wallet.address, wallet);
          walletData.push({
            address: wallet.address,
            shortAddress: wallet.getShortAddress(),
            balance: wallet.balance,
            formattedBalance: wallet.getFormattedBalance()
          });
        }

        return NextResponse.json({
          success: true,
          message: `${count} wallets created successfully`,
          data: {
            wallets: walletData,
            count: walletData.length
          }
        });

      case 'update_balances':
        const blockchain = getBlockchain();
        let updatedCount = 0;

        for (const [address, wallet] of wallets) {
          const newBalance = blockchain.getBalance(address);
          if (wallet.balance !== newBalance) {
            wallet.balance = newBalance;
            updatedCount++;
          }
        }

        return NextResponse.json({
          success: true,
          message: `${updatedCount} wallet balances updated`,
          data: {
            updatedCount,
            totalWallets: wallets.size
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}