'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Wallet {
  address: string;
  balance: number;
  shortAddress: string;
  formattedBalance: string;
  publicKey?: string;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  signature: string;
}

export function WalletManager() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Transaction form state
  const [sendForm, setSendForm] = useState({
    to: '',
    amount: '',
    fee: '0.001'
  });

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wallet?action=list');
      const data = await response.json();
      
      if (data.success) {
        setWallets(data.data.wallets);
        
        // Update balances
        await updateBalances();
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBalances = async () => {
    try {
      await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_balances' })
      });
      
      // Refresh wallet list
      const response = await fetch('/api/wallet?action=list');
      const data = await response.json();
      
      if (data.success) {
        setWallets(data.data.wallets);
        
        // Update selected wallet if it exists
        if (selectedWallet) {
          const updatedWallet = data.data.wallets.find(
            (w: Wallet) => w.address === selectedWallet.address
          );
          if (updatedWallet) {
            setSelectedWallet(updatedWallet);
          }
        }
      }
    } catch (error) {
      console.error('Error updating balances:', error);
    }
  };

  const fetchTransactions = async (address: string) => {
    try {
      const response = await fetch(`/api/wallet?action=transactions&address=${address}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  useEffect(() => {
    fetchWallets();
    const interval = setInterval(updateBalances, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      fetchTransactions(selectedWallet.address);
    }
  }, [selectedWallet]);

  const createWallet = async () => {
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('New wallet created successfully!', 'success');
        fetchWallets();
      } else {
        showMessage(data.error || 'Failed to create wallet', 'error');
      }
    } catch (error) {
      showMessage('Error creating wallet', 'error');
      console.error('Create wallet error:', error);
    }
  };

  const createMultipleWallets = async () => {
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_multiple', count: 5 })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage(`${data.data.count} wallets created successfully!`, 'success');
        fetchWallets();
      } else {
        showMessage(data.error || 'Failed to create wallets', 'error');
      }
    } catch (error) {
      showMessage('Error creating wallets', 'error');
      console.error('Create multiple wallets error:', error);
    }
  };

  const sendTransaction = async () => {
    if (!selectedWallet) {
      showMessage('Please select a wallet first', 'error');
      return;
    }

    if (!sendForm.to || !sendForm.amount) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }

    const amount = parseFloat(sendForm.amount);
    const fee = parseFloat(sendForm.fee);

    if (amount <= 0) {
      showMessage('Amount must be greater than 0', 'error');
      return;
    }

    if (amount + fee > selectedWallet.balance) {
      showMessage('Insufficient balance', 'error');
      return;
    }

    try {
      const response = await fetch('/api/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          from: selectedWallet.address,
          to: sendForm.to,
          amount,
          fee
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('Transaction created successfully!', 'success');
        setSendForm({ to: '', amount: '', fee: '0.001' });
        
        // Refresh data
        setTimeout(() => {
          updateBalances();
          if (selectedWallet) {
            fetchTransactions(selectedWallet.address);
          }
        }, 1000);
      } else {
        showMessage(data.error || 'Failed to create transaction', 'error');
      }
    } catch (error) {
      showMessage('Error creating transaction', 'error');
      console.error('Transaction error:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatHash = (hash: string) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  return (
    <div className="space-y-6">
      {/* Wallet Management Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Manager</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={createWallet} variant="outline" className="flex-1">
              Create New Wallet
            </Button>
            <Button onClick={createMultipleWallets} variant="outline" className="flex-1">
              Create 5 Test Wallets
            </Button>
            <Button onClick={updateBalances} variant="outline" className="flex-1">
              Refresh Balances
            </Button>
          </div>

          {message && (
            <Alert className={messageType === 'error' ? 'border-red-500' : messageType === 'success' ? 'border-green-500' : ''}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallets List */}
        <Card>
          <CardHeader>
            <CardTitle>Wallets ({wallets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-3">Loading wallets...</span>
                </div>
              ) : wallets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No wallets found</p>
                  <Button onClick={createWallet} variant="outline" className="mt-4">
                    Create Your First Wallet
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {wallets.map((wallet) => (
                    <Card
                      key={wallet.address}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedWallet?.address === wallet.address ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedWallet(wallet)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-mono text-sm">{wallet.shortAddress}</div>
                            <div className="text-lg font-bold">{wallet.formattedBalance}</div>
                          </div>
                          <Badge variant={wallet.balance > 0 ? "default" : "secondary"}>
                            {wallet.balance > 0 ? "Active" : "Empty"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Wallet Details & Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedWallet ? 'Wallet Details' : 'Select a Wallet'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedWallet ? (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="send">Send</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Wallet Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Address:</span>
                        <div className="font-mono text-xs mt-1 p-2 bg-muted rounded break-all">
                          {selectedWallet.address}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Balance:</span>
                        <span className="font-bold">{selectedWallet.formattedBalance}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recent Transactions</h4>
                    <ScrollArea className="h-48">
                      {transactions.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No transactions found
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {transactions.slice(0, 10).map((tx: Transaction, index: number) => (
                            <div key={index} className="p-2 bg-muted rounded text-xs">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-mono">{formatHash(tx.hash)}</div>
                                  <div className="text-muted-foreground mt-1">
                                    {tx.from === 'SYSTEM' ? (
                                      <span className="text-green-600">Mining Reward</span>
                                    ) : tx.from === selectedWallet.address ? (
                                      <span className="text-red-600">Sent to {formatHash(tx.to)}</span>
                                    ) : (
                                      <span className="text-green-600">Received from {formatHash(tx.from)}</span>
                                    )}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {formatTimestamp(tx.timestamp)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-medium ${
                                    tx.from === selectedWallet.address ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {tx.from === selectedWallet.address ? '-' : '+'}₿{tx.amount.toFixed(6)}
                                  </div>
                                  {tx.fee > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      Fee: ₿{tx.fee.toFixed(6)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>

                <TabsContent value="send" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="recipient">Recipient Address</Label>
                      <Input
                        id="recipient"
                        type="text"
                        placeholder="Enter wallet address..."
                        value={sendForm.to}
                        onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Amount (₿)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.000001"
                          min="0.000001"
                          max={selectedWallet.balance - parseFloat(sendForm.fee)}
                          placeholder="0.000000"
                          value={sendForm.amount}
                          onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="fee">Fee (₿)</Label>
                        <Input
                          id="fee"
                          type="number"
                          step="0.000001"
                          min="0.000001"
                          placeholder="0.001000"
                          value={sendForm.fee}
                          onChange={(e) => setSendForm({ ...sendForm, fee: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded text-sm">
                      <div className="flex justify-between">
                        <span>Available Balance:</span>
                        <span className="font-medium">{selectedWallet.formattedBalance}</span>
                      </div>
                      {sendForm.amount && (
                        <>
                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span>₿{parseFloat(sendForm.amount || '0').toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fee:</span>
                            <span>₿{parseFloat(sendForm.fee || '0').toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1 mt-1">
                            <span>Total Cost:</span>
                            <span>₿{(parseFloat(sendForm.amount || '0') + parseFloat(sendForm.fee || '0')).toFixed(6)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <Button 
                      onClick={sendTransaction} 
                      className="w-full"
                      disabled={!sendForm.to || !sendForm.amount || parseFloat(sendForm.amount || '0') <= 0}
                    >
                      Send Transaction
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select a wallet from the list to view details and send transactions
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}