'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  signature: string;
}

export function TransactionPool() {
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all'>('pending');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch pending transactions
      const pendingResponse = await fetch('/api/transaction?action=pending');
      const pendingData = await pendingResponse.json();
      
      // Fetch all transactions
      const allResponse = await fetch('/api/transaction?action=all');
      const allData = await allResponse.json();

      if (pendingData.success) {
        setPendingTransactions(pendingData.data.transactions);
      }
      
      if (allData.success) {
        setAllTransactions(allData.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return `${Math.floor(diff / 1000)}s ago`;
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  const formatHash = (hash: string) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const formatAddress = (address: string) => {
    if (address === 'SYSTEM') return 'SYSTEM';
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

  const getTransactionType = (tx: Transaction) => {
    if (tx.from === 'SYSTEM') return 'Mining Reward';
    return 'Transfer';
  };

  const renderTransactionList = (transactions: Transaction[], showConfirmations: boolean = false) => {
    if (transactions.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {selectedTab === 'pending' ? 'No pending transactions' : 'No transactions found'}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {transactions.map((tx: any, index: number) => (
          <Card key={tx.hash || index} className="transition-all hover:shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant={tx.from === 'SYSTEM' ? 'default' : 'secondary'}>
                        {getTransactionType(tx)}
                      </Badge>
                      {showConfirmations && 'confirmations' in tx && (
                        <Badge variant="outline">
                          {(tx as any).confirmations} confirmations
                        </Badge>
                      )}
                    </div>
                    <div className="font-mono text-sm mt-1">
                      {formatHash(tx.hash)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      ₿{tx.amount.toFixed(6)}
                    </div>
                    {tx.fee > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Fee: ₿{tx.fee.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div>
                    <div className="text-muted-foreground">From:</div>
                    <div className="font-mono">{formatAddress(tx.from)}</div>
                  </div>
                  <div className="text-center text-muted-foreground px-2">→</div>
                  <div className="text-right">
                    <div className="text-muted-foreground">To:</div>
                    <div className="font-mono">{formatAddress(tx.to)}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div>{formatTimestamp(tx.timestamp)}</div>
                  {showConfirmations && 'blockIndex' in tx && (
                    <div>Block #{(tx as any).blockIndex}</div>
                  )}
                  <div 
                    className="font-mono cursor-pointer hover:text-foreground"
                    title={tx.signature}
                  >
                    Sig: {formatHash(tx.signature)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transaction Pool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pendingTransactions.length}</div>
            <p className="text-xs text-muted-foreground">Pending Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{allTransactions.length}</div>
            <p className="text-xs text-muted-foreground">Total Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              ₿{pendingTransactions.reduce((sum, tx) => sum + tx.fee, 0).toFixed(6)}
            </div>
            <p className="text-xs text-muted-foreground">Pending Fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Pool */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Transaction Pool</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex bg-muted rounded-lg p-1">
              <button
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  selectedTab === 'pending'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setSelectedTab('pending')}
              >
                Pending ({pendingTransactions.length})
              </button>
              <button
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  selectedTab === 'all'
                    ? 'bg-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setSelectedTab('all')}
              >
                All ({allTransactions.length})
              </button>
            </div>
            <Button
              onClick={fetchTransactions}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedTab === 'pending' && pendingTransactions.length > 0 && (
            <Alert className="mb-4">
              <AlertDescription>
                These transactions are waiting to be mined into a block. 
                Higher fee transactions are typically processed first.
              </AlertDescription>
            </Alert>
          )}
          
          <ScrollArea className="h-96">
            {selectedTab === 'pending' 
              ? renderTransactionList(pendingTransactions)
              : renderTransactionList(allTransactions, true)
            }
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Transaction Details for Pending */}
      {selectedTab === 'pending' && pendingTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Memory Pool Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Fee Distribution</h4>
                <div className="space-y-1">
                  {[0.001, 0.01, 0.1].map(threshold => {
                    const count = pendingTransactions.filter(tx => tx.fee >= threshold).length;
                    const percentage = pendingTransactions.length > 0 
                      ? ((count / pendingTransactions.length) * 100).toFixed(1)
                      : '0';
                    
                    return (
                      <div key={threshold} className="flex justify-between text-sm">
                        <span>≥ ₿{threshold}:</span>
                        <span>{count} ({percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Volume</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span>₿{pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Fees:</span>
                    <span>₿{pendingTransactions.reduce((sum, tx) => sum + tx.fee, 0).toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Fee:</span>
                    <span>₿{pendingTransactions.length > 0 
                      ? (pendingTransactions.reduce((sum, tx) => sum + tx.fee, 0) / pendingTransactions.length).toFixed(6)
                      : '0.000000'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}