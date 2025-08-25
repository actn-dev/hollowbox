// Types for Profit Tracker data structures

export interface TransactionDetail {
  id: string;
  date: string;
  type: string;
  hollowvoxAmount: number;
  xlmAmount: number;
  price: number;
  counterparty?: string;
  poolShares?: number;
}

export interface WalletMetrics {
  address: string;
  name: string;
  color: string;
  description?: string;
  currentBalances: Record<string, number>;
  totalHollowvoxSold: number;
  totalXlmReceived: number;
  averageSellPrice: number;
  estimatedProfit: number;
  actionFundAllocation: number;
  impactFundAllocation: number;
  totalLiquidityProvided: number;
  transactionCount: number;
  lastTransactionDate?: string;
  lastUpdated?: Date;
  recentTransactions: TransactionDetail[];
  error?: string;
}

export interface ProfitTrackerData {
  wallets: WalletMetrics[];
  combinedProfit: number;
  combinedActionFund: number;
  combinedImpactFund: number;
  combinedLiquidity: number;
  totalTransactions: number;
  lastRefresh: string;
  isLiveStreaming: boolean;
}

export interface UpdateResult {
  wallet: string;
  success: boolean;
  error?: string;
  transactions?: number;
}

export interface StellarUpdateResponse {
  success: boolean;
  message: string;
  updatedWallets: number;
  results: UpdateResult[];
}

// Constants
export const LIQUIDITY_PROVIDER_WALLET =
  "GAALODFU5N247F4GQMOSBSZWDYFA3VUBFUU4OCO6YTPPA4HM66VSEXZA";
export const HOLLOWVOX_ASSET_CODE = "HOLLOWVOX";
export const HOLLOWVOX_ISSUER =
  "GAALODFU5N247F4GQMOSBSZWDYFA3VUBFUU4OCO6YTPPA4HM66VSEXZA";
