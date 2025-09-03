'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlockchainVisualization } from '@/components/blockchain/BlockchainVisualization';
import { MiningInterface } from '@/components/blockchain/MiningInterface';
import { WalletManager } from '@/components/blockchain/WalletManager';
import { TransactionPool } from '@/components/blockchain/TransactionPool';
import { NetworkStats } from '@/components/blockchain/NetworkStats';

export default function Home() {
  const [activeTab, setActiveTab] = useState('blockchain');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-sm"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Blockchain Simulation</h1>
                <p className="text-sm text-muted-foreground">
                  Interactive Blockchain Explorer & Mining Simulator
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Demo Mode</Badge>
              <Badge variant="secondary">v1.0.0</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
            <TabsTrigger value="mining">Mining</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          <TabsContent value="blockchain" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Blockchain Explorer</h2>
              <p className="text-muted-foreground">
                Explore the blockchain structure, view blocks, transactions, and monitor chain integrity.
              </p>
            </div>
            <BlockchainVisualization />
          </TabsContent>

          <TabsContent value="mining" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Mining Interface</h2>
              <p className="text-muted-foreground">
                Mine new blocks, observe the proof-of-work process, and earn mining rewards.
              </p>
            </div>
            <MiningInterface />
          </TabsContent>

          <TabsContent value="wallets" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Wallet Manager</h2>
              <p className="text-muted-foreground">
                Create wallets, check balances, send transactions, and manage your blockchain assets.
              </p>
            </div>
            <WalletManager />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Transaction Pool</h2>
              <p className="text-muted-foreground">
                Monitor pending transactions, analyze fee markets, and track transaction history.
              </p>
            </div>
            <TransactionPool />
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Network Statistics</h2>
              <p className="text-muted-foreground">
                Monitor network health, mining activity, and blockchain performance metrics.
              </p>
            </div>
            <NetworkStats />
          </TabsContent>
        </Tabs>

        {/* Educational Information */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>About This Blockchain Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Key Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Real-time blockchain visualization</li>
                    <li>• Interactive proof-of-work mining</li>
                    <li>• Digital wallet management</li>
                    <li>• Transaction pool monitoring</li>
                    <li>• Network statistics dashboard</li>
                    <li>• Complete transaction history</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Educational Goals</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Understand blockchain structure</li>
                    <li>• Learn about proof-of-work consensus</li>
                    <li>• Experience digital wallet operations</li>
                    <li>• Observe transaction lifecycle</li>
                    <li>• Analyze network performance</li>
                    <li>• Explore cryptocurrency concepts</li>
                  </ul>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Getting Started</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>1. Explore the Blockchain:</strong> Start with the Blockchain tab to see the genesis block and understand the chain structure.
                  </p>
                  <p>
                    <strong>2. Create Wallets:</strong> Use the Wallets tab to create digital wallets and receive addresses for transactions.
                  </p>
                  <p>
                    <strong>3. Mine Blocks:</strong> Go to Mining tab, enter a wallet address, and start mining to create new blocks and earn rewards.
                  </p>
                  <p>
                    <strong>4. Send Transactions:</strong> Use the Wallet Manager to send transactions between wallets and see them in the transaction pool.
                  </p>
                  <p>
                    <strong>5. Monitor Network:</strong> Check the Network tab for real-time statistics and mining activity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Blockchain Simulation - Educational Demo
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Built with Next.js & TypeScript</span>
              <span>•</span>
              <span>Tailwind CSS & shadcn/ui</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}