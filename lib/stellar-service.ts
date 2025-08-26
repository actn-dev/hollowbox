import { z } from "zod";

// Types for Stellar API responses
export interface StellarTransaction {
  id: string;
  created_at: string;
  type: string;
  successful: boolean;
  operation_count: number;
  source_account: string;
}

export interface StellarOperation {
  id: string;
  type: string;
  type_i: number;
  created_at: string;
  transaction_hash: string;
  source_account: string;
  from?: string;
  to?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  amount?: string;
  buying_asset_type?: string;
  buying_asset_code?: string;
  buying_asset_issuer?: string;
  selling_asset_type?: string;
  selling_asset_code?: string;
  selling_asset_issuer?: string;
  offer_id?: string;
  liquidity_pool_id?: string;
  reserves_deposited?: string[];
  shares_received?: string;
  reserves_received?: string[];
  shares_redeemed?: string;
}

export interface StellarBalance {
  balance: string;
  limit?: string;
  buying_liabilities: string;
  selling_liabilities: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  is_authorized?: boolean;
  is_authorized_to_maintain_liabilities?: boolean;
  is_clawback_enabled?: boolean;
}

export interface StellarAccount {
  id: string;
  account_id: string;
  sequence: string;
  subentry_count: number;
  home_domain?: string;
  last_modified_ledger: number;
  last_modified_time: string;
  thresholds: {
    low_threshold: number;
    med_threshold: number;
    high_threshold: number;
  };
  flags: {
    auth_required: boolean;
    auth_revocable: boolean;
    auth_immutable: boolean;
    auth_clawback_enabled: boolean;
  };
  balances: StellarBalance[];
  signers: Array<{
    weight: number;
    key: string;
    type: string;
  }>;
  data: Record<string, string>;
}

// Configuration constants
const STELLAR_HORIZON_URL = "https://horizon.stellar.org";
const HOLLOWVOX_ASSET_CODE = "HOLLOWVOX";
const HOLLOWVOX_ISSUER =
  "GAALODFU5N247F4GQMOSBSZWDYFA3VUBFUU4OCO6YTPPA4HM66VSEXZA";
const LIQUIDITY_PROVIDER_WALLET =
  "GAALODFU5N247F4GQMOSBSZWDYFA3VUBFUU4OCO6YTPPA4HM66VSEXZA";

export class StellarService {
  private readonly baseUrl = STELLAR_HORIZON_URL;
  private readonly requestCache = new Map<
    string,
    { data: any; expires: number }
  >();
  private readonly cacheTimeout = 30 * 1000; // 30 seconds

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = url;
    const now = Date.now();

    // Check cache first
    const cached = this.requestCache.get(cacheKey);
    if (cached && now < cached.expires) {
      return cached.data;
    }

    console.log("Fetching from Stellar API:", url);

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Stellar API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Cache the response
      // this.requestCache.set(cacheKey, {
      //   data,
      //   expires: now + this.cacheTimeout,
      // });

      return data;
    } catch (error) {
      console.error(`Error fetching from Stellar API (${url}):`, error);
      throw error;
    }
  }

  async getAccount(accountId: string): Promise<StellarAccount> {
    return this.makeRequest<StellarAccount>(`/accounts/${accountId}`);
  }

  async getAccountTransactions(
    accountId: string,
    limit = 200,
    cursor?: string
  ): Promise<{ records: StellarTransaction[]; _links: any }> {
    let endpoint = `/accounts/${accountId}/transactions?order=desc&limit=${limit}`;
    if (cursor) {
      endpoint += `&cursor=${cursor}`;
    }
    return this.makeRequest(endpoint);
  }

  async getAccountOperations(
    accountId: string,
    limit = 200,
    cursor?: string
  ): Promise<{ _embedded: { records: StellarOperation[] }; _links: any }> {
    let endpoint = `/accounts/${accountId}/operations?order=desc&limit=${limit}`;
    if (cursor) {
      endpoint += `&cursor=${cursor}`;
    }
    return this.makeRequest(endpoint);
  }

  async getAccountBalances(accountId: string): Promise<Record<string, number>> {
    const account = await this.getAccount(accountId);
    const balances: Record<string, number> = {};

    for (const balance of account.balances) {
      if (balance.asset_type === "native") {
        balances["XLM"] = parseFloat(balance.balance);
      } else if (balance.asset_code && balance.asset_issuer) {
        const key = `${balance.asset_code}:${balance.asset_issuer}`;
        balances[key] = parseFloat(balance.balance);
      }
    }

    return balances;
  }

  async analyzeWalletActivity(walletAddress: string): Promise<{
    currentBalances: Record<string, number>;
    totalHollowvoxSold: number;
    totalXlmReceived: number;
    averageSellPrice: number;
    estimatedProfit: number;
    actionFundAllocation: number;
    impactFundAllocation: number;
    totalLiquidityProvided: number;
    transactionCount: number;
    lastTransactionDate: string | null;
    recentTransactions: Array<{
      id: string;
      date: string;
      type: string;
      hollowvoxAmount: number;
      xlmAmount: number;
      price: number;
      counterparty?: string;
      poolShares?: number;
    }>;
    error?: string;
  }> {
    try {
      // Get current balances
      const currentBalances = await this.getAccountBalances(walletAddress);

      // Get operations for analysis
      const operations = await this.getAccountOperations(walletAddress, 200);

      let totalHollowvoxSold = 0;
      let totalXlmReceived = 0;
      let totalLiquidityProvided = 0;
      let transactionCount = 0;
      let lastTransactionDate: string | null = null;
      const recentTransactions: Array<{
        id: string;
        date: string;
        type: string;
        hollowvoxAmount: number;
        xlmAmount: number;
        price: number;
        counterparty?: string;
        poolShares?: number;
      }> = [];

      for (const operation of operations._embedded.records) {
        // Track HOLLOWVOX selling operations
        if (
          operation.type === "manage_sell_offer" &&
          operation.selling_asset_code === HOLLOWVOX_ASSET_CODE &&
          operation.selling_asset_issuer === HOLLOWVOX_ISSUER &&
          operation.source_account === walletAddress
        ) {
          const amount = parseFloat(operation.amount || "0");
          totalHollowvoxSold += amount;
          transactionCount++;

          if (!lastTransactionDate) {
            lastTransactionDate = operation.created_at;
          }

          recentTransactions.push({
            id: operation.id,
            date: operation.created_at,
            type: "sell",
            hollowvoxAmount: amount,
            xlmAmount: 0, // Will be calculated from corresponding operations
            price: 0,
          });
        }

        // Track XLM received from sales
        if (
          operation.type === "payment" &&
          operation.asset_type === "native" &&
          operation.to === walletAddress
        ) {
          const amount = parseFloat(operation.amount || "0");
          totalXlmReceived += amount;
        }

        // Track liquidity provision (for LP wallets)
        if (
          operation.type === "liquidity_pool_deposit" &&
          operation.source_account === walletAddress
        ) {
          const shares = parseFloat(operation.shares_received || "0");
          totalLiquidityProvided += shares;

          recentTransactions.push({
            id: operation.id,
            date: operation.created_at,
            type: "liquidity_deposit",
            hollowvoxAmount: 0,
            xlmAmount: 0,
            price: 0,
            poolShares: shares,
          });
        }
      }

      // Calculate metrics
      const averageSellPrice =
        totalHollowvoxSold > 0 ? totalXlmReceived / totalHollowvoxSold : 0;
      const estimatedProfit = totalXlmReceived;

      // Calculate Action Token commitments (20% of profits)
      const actionFundAllocation = estimatedProfit * 0.1; // 10% for $ACTION purchases
      const impactFundAllocation = estimatedProfit * 0.1; // 10% for Impact Fund

      return {
        currentBalances,
        totalHollowvoxSold,
        totalXlmReceived,
        averageSellPrice,
        estimatedProfit,
        actionFundAllocation,
        impactFundAllocation,
        totalLiquidityProvided,
        transactionCount,
        lastTransactionDate,
        recentTransactions: recentTransactions.slice(0, 10), // Latest 10 transactions
      };
    } catch (error) {
      console.error(`Error analyzing wallet ${walletAddress}:`, error);
      return {
        currentBalances: {},
        totalHollowvoxSold: 0,
        totalXlmReceived: 0,
        averageSellPrice: 0,
        estimatedProfit: 0,
        actionFundAllocation: 0,
        impactFundAllocation: 0,
        totalLiquidityProvided: 0,
        transactionCount: 0,
        lastTransactionDate: null,
        recentTransactions: [],
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async updateAllWallets(walletAddresses: string[]): Promise<{
    success: boolean;
    message: string;
    updatedWallets: number;
    errors: Array<{ wallet: string; error: string }>;
  }> {
    const errors: Array<{ wallet: string; error: string }> = [];
    let updatedWallets = 0;

    for (const address of walletAddresses) {
      try {
        await this.analyzeWalletActivity(address);
        updatedWallets++;
      } catch (error) {
        errors.push({
          wallet: address,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: errors.length === 0,
      message: `Updated ${updatedWallets} wallets${
        errors.length > 0 ? `, ${errors.length} failed` : ""
      }`,
      updatedWallets,
      errors,
    };
  }

  // Validate Stellar address format
  static isValidStellarAddress(address: string): boolean {
    return /^G[A-Z2-7]{55}$/.test(address);
  }

  // Get default wallet configurations
  static getDefaultWallets() {
    return [
      {
        address: "GAALODFU5N247F4GQMOSBSZWDYFA3VUBFUU4OCO6YTPPA4HM66VSEXZA",
        name: "Primary Trading Wallet",
        color: "#3b82f6",
        description: "Main HOLLOWVOX token sales and market making",
      },
      {
        address: "GC7EQXZ7R5NZJ5QDKWJZV4YAYRZQMCQCCIRXZS7NQPNZJZ5Q5K4QJZQK",
        name: "Secondary Trading Wallet",
        color: "#10b981",
        description:
          "Additional HOLLOWVOX token sales wallet + Liquidity Provider",
      },
    ];
  }
}

export const stellarService = new StellarService();

export async function getStellarAssetBalance(
  accountId: string
): Promise<number> {
  try {
    const account = await stellarService.getAccount(accountId);
    const hollowvoxBalance = account.balances.find(
      (b) =>
        b.asset_type !== "native" &&
        b.asset_code === HOLLOWVOX_ASSET_CODE &&
        b.asset_issuer === HOLLOWVOX_ISSUER
    );
    return hollowvoxBalance ? parseFloat(hollowvoxBalance.balance) : 0;
  } catch (error) {
    console.error(`Failed to get balance for ${accountId}:`, error);
    return 0;
  }
}
