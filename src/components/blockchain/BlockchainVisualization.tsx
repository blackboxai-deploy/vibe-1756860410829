'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Block {
  index: number;
  timestamp: number;
  transactions: any[];
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
}

interface BlockchainVisualizationProps {
  onBlockSelect?: (block: Block) => void;
  autoRefresh?: boolean;
}

export function BlockchainVisualization({ onBlockSelect, autoRefresh = true }: BlockchainVisualizationProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchBlockchain = async () => {
    try {
      setLoading(true);
      
      // Fetch blockchain data
      const chainResponse = await fetch('/api/blockchain?action=chain');
      const chainData = await chainResponse.json();
      
      // Fetch stats
      const statsResponse = await fetch('/api/blockchain?action=stats');
      const statsData = await statsResponse.json();

      if (chainData.success) {
        setBlocks(chainData.data.chain);
      }
      
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching blockchain:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockchain();
    
    if (autoRefresh) {
      const interval = setInterval(fetchBlockchain, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  const handleBlockClick = (block: Block) => {
    setSelectedBlock(block);
    onBlockSelect?.(block);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatHash = (hash: string) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Blockchain Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading blockchain...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalBlocks}</div>
              <p className="text-xs text-muted-foreground">Total Blocks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Total Transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.difficulty}</div>
              <p className="text-xs text-muted-foreground">Difficulty</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.pendingTransactions}</div>
              <p className="text-xs text-muted-foreground">Pending Txs</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Blockchain Visualization */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Blockchain Explorer</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={stats?.isValid ? "default" : "destructive"}>
              {stats?.isValid ? "Valid" : "Invalid"}
            </Badge>
            <Button
              onClick={fetchBlockchain}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {blocks.map((block, index) => (
                <div key={block.index} className="flex items-center space-x-2">
                  {/* Connection Line */}
                  {index > 0 && (
                    <div className="w-8 flex justify-center">
                      <div className="h-6 w-px bg-border"></div>
                    </div>
                  )}
                  
                  {/* Block Card */}
                  <Card
                    className={`flex-1 cursor-pointer transition-all hover:shadow-md ${
                      selectedBlock?.index === block.index ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleBlockClick(block)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">Block #{block.index}</Badge>
                            <Badge variant="outline">{block.transactions.length} Txs</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Hash: {formatHash(block.hash)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatTimestamp(block.timestamp)}
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>Nonce: {block.nonce.toLocaleString()}</div>
                          <div className="mt-1">
                            <Badge 
                              variant={block.hash.startsWith('00') ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {block.hash.startsWith('00') ? 'Mined' : 'Genesis'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Selected Block Details */}
      {selectedBlock && (
        <Card>
          <CardHeader>
            <CardTitle>Block Details - #{selectedBlock.index}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Block Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Index:</span> {selectedBlock.index}</div>
                  <div><span className="font-medium">Timestamp:</span> {formatTimestamp(selectedBlock.timestamp)}</div>
                  <div><span className="font-medium">Nonce:</span> {selectedBlock.nonce.toLocaleString()}</div>
                  <div><span className="font-medium">Transactions:</span> {selectedBlock.transactions.length}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Hashes</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Block Hash:</span>
                    <div className="break-all text-xs font-mono mt-1 p-2 bg-muted rounded">
                      {selectedBlock.hash}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Previous Hash:</span>
                    <div className="break-all text-xs font-mono mt-1 p-2 bg-muted rounded">
                      {selectedBlock.previousHash}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Merkle Root:</span>
                    <div className="break-all text-xs font-mono mt-1 p-2 bg-muted rounded">
                      {selectedBlock.merkleRoot}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions in Block */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Transactions</h4>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {selectedBlock.transactions.map((tx: any, index: number) => (
                    <div key={index} className="text-xs p-2 bg-muted rounded flex justify-between items-center">
                      <div>
                        <span className="font-mono">{formatHash(tx.hash)}</span>
                        <span className="ml-2 text-muted-foreground">
                          {tx.from === 'SYSTEM' ? 'Coinbase' : `${formatHash(tx.from)} → ${formatHash(tx.to)}`}
                        </span>
                      </div>
                      <div className="font-medium">
                        ₿{parseFloat(tx.amount).toFixed(6)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}