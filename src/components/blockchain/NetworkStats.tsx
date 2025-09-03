'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface BlockchainStats {
  totalBlocks: number;
  totalTransactions: number;
  pendingTransactions: number;
  difficulty: number;
  miningReward: number;
  averageBlockTime: number;
  isValid: boolean;
}

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

export function NetworkStats() {
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [miningStatus, setMiningStatus] = useState<MiningStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch blockchain stats
      const statsResponse = await fetch('/api/blockchain?action=stats');
      const statsData = await statsResponse.json();
      
      // Fetch mining status
      const miningResponse = await fetch('/api/mining?action=status');
      const miningData = await miningResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
      
      if (miningData.success) {
        setMiningStatus(miningData.data);
      }
    } catch (error) {
      console.error('Error fetching network stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, []);

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

  const formatHashRate = (hashRate: number) => {
    if (hashRate >= 1000000) {
      return `${(hashRate / 1000000).toFixed(2)} MH/s`;
    } else if (hashRate >= 1000) {
      return `${(hashRate / 1000).toFixed(2)} KH/s`;
    } else {
      return `${hashRate} H/s`;
    }
  };

  const getNetworkHealth = () => {
    if (!stats) return { status: 'unknown', color: 'secondary' };
    
    if (!stats.isValid) {
      return { status: 'Invalid Chain', color: 'destructive' };
    } else if (miningStatus?.isMining) {
      return { status: 'Mining Active', color: 'default' };
    } else if (stats.pendingTransactions > 0) {
      return { status: 'Transactions Pending', color: 'secondary' };
    } else {
      return { status: 'Healthy', color: 'default' };
    }
  };

  const calculateNetworkUtilization = () => {
    if (!stats) return 0;
    // Simple utilization based on pending transactions and recent block activity
    const pendingWeight = Math.min((stats.pendingTransactions / 10) * 100, 50);
    const miningWeight = miningStatus?.isMining ? 30 : 0;
    const recentActivityWeight = stats.totalBlocks > 1 ? 20 : 0;
    
    return Math.min(pendingWeight + miningWeight + recentActivityWeight, 100);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Network Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading network stats...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const networkHealth = getNetworkHealth();
  const hashRate = calculateHashRate();
  const networkUtilization = calculateNetworkUtilization();

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.totalBlocks || 0}</div>
            <p className="text-xs text-muted-foreground">Total Blocks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">Total Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.difficulty || 0}</div>
            <p className="text-xs text-muted-foreground">Mining Difficulty</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">₿{stats?.miningReward || 0}</div>
            <p className="text-xs text-muted-foreground">Block Reward</p>
          </CardContent>
        </Card>
      </div>

      {/* Network Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Network Health
            <Badge variant={networkHealth.color as "default" | "secondary" | "destructive" | "outline"}>
              {networkHealth.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Network Utilization</span>
              <span>{networkUtilization.toFixed(1)}%</span>
            </div>
            <Progress value={networkUtilization} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Blockchain Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Chain Valid:</span>
                  <Badge variant={stats?.isValid ? "default" : "destructive"} className="text-xs">
                    {stats?.isValid ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Pending Transactions:</span>
                  <span>{stats?.pendingTransactions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Block Time:</span>
                  <span>{stats?.averageBlockTime ? formatRuntime(stats.averageBlockTime) : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Mining Activity</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Mining Status:</span>
                  <Badge variant={miningStatus?.isMining ? "default" : "secondary"} className="text-xs">
                    {miningStatus?.isMining ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {miningStatus?.isMining && (
                  <>
                    <div className="flex justify-between">
                      <span>Hash Rate:</span>
                      <span>{formatHashRate(hashRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Runtime:</span>
                      <span>{formatRuntime(miningStatus.runtime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attempts:</span>
                      <span>{miningStatus.attempts.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Mining Status */}
      {miningStatus?.isMining && (
        <Card>
          <CardHeader>
            <CardTitle>Live Mining Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Mining Progress</span>
                <span>{miningStatus.attempts.toLocaleString()} attempts</span>
              </div>
              <Progress value={Math.min((miningStatus.attempts / 50000) * 100, 100)} />
              <div className="text-xs text-muted-foreground text-center">
                Target: {Array(miningStatus.difficulty).fill('0').join('')}{'*'.repeat(64 - miningStatus.difficulty)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Current Hash Attempt:</span>
                <Button variant="ghost" size="sm" onClick={fetchStats}>
                  Refresh
                </Button>
              </div>
              <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                {miningStatus.currentHash || 'Calculating...'}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">{formatHashRate(hashRate)}</div>
                <div className="text-xs text-muted-foreground">Hash Rate</div>
              </div>
              <div>
                <div className="text-lg font-bold">{miningStatus.difficulty}</div>
                <div className="text-xs text-muted-foreground">Difficulty</div>
              </div>
              <div>
                <div className="text-lg font-bold">{formatRuntime(miningStatus.runtime)}</div>
                <div className="text-xs text-muted-foreground">Runtime</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Data */}
      <Card>
        <CardHeader>
          <CardTitle>Network Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats ? (stats.totalTransactions / Math.max(stats.totalBlocks, 1)).toFixed(1) : '0.0'}
              </div>
              <div className="text-xs text-muted-foreground">Avg Transactions per Block</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats && stats.totalBlocks > 1 
                  ? Math.round(86400000 / Math.max(stats.averageBlockTime, 1000)) 
                  : 0}
              </div>
              <div className="text-xs text-muted-foreground">Estimated Blocks per Day</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.pow(2, stats?.difficulty || 0).toExponential(2)}
              </div>
              <div className="text-xs text-muted-foreground">Difficulty Hash Operations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}