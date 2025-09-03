'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';


interface MiningStatus {
  isMining: boolean;
  minerAddress: string | null;
  attempts: number;
  currentHash: string;
  difficulty: number;
  pendingTransactions: number;
  miningReward: number;
  runtime: number;
}

export function MiningInterface() {
  const [minerAddress, setMinerAddress] = useState('');
  const [miningStatus, setMiningStatus] = useState<MiningStatus | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [lastMinedBlock, setLastMinedBlock] = useState<any>(null);

  const fetchMiningStatus = async () => {
    try {
      const response = await fetch('/api/mining?action=status');
      const data = await response.json();
      
      if (data.success) {
        setMiningStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching mining status:', error);
    }
  };

  useEffect(() => {
    fetchMiningStatus();
    const interval = setInterval(fetchMiningStatus, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const startMining = async () => {
    if (!minerAddress.trim()) {
      showMessage('Please enter a miner address', 'error');
      return;
    }

    try {
      const response = await fetch('/api/mining', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          minerAddress: minerAddress.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('Mining started successfully!', 'success');
        fetchMiningStatus();
      } else {
        showMessage(data.error || 'Failed to start mining', 'error');
      }
    } catch (error) {
      showMessage('Error starting mining', 'error');
      console.error('Mining error:', error);
    }
  };

  const stopMining = async () => {
    try {
      const response = await fetch('/api/mining', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'stop'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('Mining stopped', 'info');
        fetchMiningStatus();
      } else {
        showMessage(data.error || 'Failed to stop mining', 'error');
      }
    } catch (error) {
      showMessage('Error stopping mining', 'error');
      console.error('Stop mining error:', error);
    }
  };

  const quickMine = async () => {
    if (!minerAddress.trim()) {
      showMessage('Please enter a miner address', 'error');
      return;
    }

    try {
      showMessage('Mining block immediately...', 'info');
      
      const response = await fetch('/api/mining', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'quick_mine',
          minerAddress: minerAddress.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setLastMinedBlock(data.data.block);
        showMessage(`Block mined successfully! Reward: ₿${data.data.minerReward}`, 'success');
        fetchMiningStatus();
      } else {
        showMessage(data.error || 'Failed to mine block', 'error');
      }
    } catch (error) {
      showMessage('Error mining block', 'error');
      console.error('Quick mine error:', error);
    }
  };

  const formatRuntime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const calculateHashRate = () => {
    if (!miningStatus || !miningStatus.isMining || miningStatus.runtime === 0) {
      return 0;
    }
    return Math.round((miningStatus.attempts / miningStatus.runtime) * 1000); // hashes per second
  };

  return (
    <div className="space-y-6">
      {/* Mining Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Mining Control Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minerAddress">Miner Address</Label>
            <Input
              id="minerAddress"
              type="text"
              placeholder="Enter your wallet address (e.g., BC1234ABCD...)"
              value={minerAddress}
              onChange={(e) => setMinerAddress(e.target.value)}
              disabled={miningStatus?.isMining}
            />
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={startMining}
              disabled={miningStatus?.isMining || !minerAddress.trim()}
              className="flex-1"
            >
              {miningStatus?.isMining ? 'Mining...' : 'Start Mining'}
            </Button>
            
            <Button
              onClick={stopMining}
              disabled={!miningStatus?.isMining}
              variant="outline"
              className="flex-1"
            >
              Stop Mining
            </Button>
            
            <Button
              onClick={quickMine}
              disabled={miningStatus?.isMining || !minerAddress.trim()}
              variant="secondary"
              className="flex-1"
            >
              Quick Mine
            </Button>
          </div>

          {message && (
            <Alert className={messageType === 'error' ? 'border-red-500' : messageType === 'success' ? 'border-green-500' : ''}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Mining Status */}
      <Card>
        <CardHeader>
          <CardTitle>Mining Status</CardTitle>
        </CardHeader>
        <CardContent>
          {miningStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={miningStatus.isMining ? "default" : "secondary"}>
                      {miningStatus.isMining ? 'Mining' : 'Idle'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Difficulty:</span>
                    <span className="text-sm">{miningStatus.difficulty}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pending Transactions:</span>
                    <span className="text-sm">{miningStatus.pendingTransactions}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Mining Reward:</span>
                    <span className="text-sm">₿{miningStatus.miningReward}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {miningStatus.isMining && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Attempts:</span>
                        <span className="text-sm font-mono">{miningStatus.attempts.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Runtime:</span>
                        <span className="text-sm">{formatRuntime(miningStatus.runtime)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Hash Rate:</span>
                        <span className="text-sm">{calculateHashRate()} H/s</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Miner:</span>
                        <span className="text-sm font-mono text-xs">
                          {miningStatus.minerAddress ? 
                            `${miningStatus.minerAddress.substring(0, 8)}...${miningStatus.minerAddress.substring(miningStatus.minerAddress.length - 8)}` : 
                            'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {miningStatus.isMining && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Hash Attempt:</span>
                  </div>
                  <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                    {miningStatus.currentHash || 'Calculating...'}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>Mining Progress</span>
                      <span>{miningStatus.attempts.toLocaleString()} attempts</span>
                    </div>
                    <Progress value={Math.min((miningStatus.attempts / 10000) * 100, 100)} />
                    <div className="text-xs text-muted-foreground text-center">
                      Target: {Array(miningStatus.difficulty).fill('0').join('')}{'*'.repeat(64 - miningStatus.difficulty)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-3">Loading mining status...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Mined Block */}
      {lastMinedBlock && (
        <Card>
          <CardHeader>
            <CardTitle>Last Mined Block</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Block Index:</span>
                  <span className="text-sm">#{lastMinedBlock.index}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Transactions:</span>
                  <span className="text-sm">{lastMinedBlock.transactions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Nonce:</span>
                  <span className="text-sm font-mono">{lastMinedBlock.nonce.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Timestamp:</span>
                  <span className="text-sm">{new Date(lastMinedBlock.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Block Hash:</span>
                  <div className="p-2 bg-muted rounded font-mono text-xs break-all mt-1">
                    {lastMinedBlock.hash}
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