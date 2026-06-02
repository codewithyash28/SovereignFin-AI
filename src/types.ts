/**
 * SovereignFin AI Core Types
 * (Consistent data representations across full-stack boundaries)
 */

export interface Transaction {
  id: string;
  timestamp: string;
  asset: "USD" | "EUR" | "BTC" | "SOL";
  amount: number;
  type: "DEPOSIT" | "WITHDRAWAL" | "STREAM";
  reference: string;
  category: "Logistics" | "SaaS & Cloud" | "Corporate Travel" | "Offices & Grid" | "Energy Systems" | "Standard Settlement";
  carbonFootprintKg: number; // calculated CO2 emissions
  status: "COMMITTED" | "AWAITING_HUMAN_APPROVAL" | "REJECTED" | "STAGING_LOCK";
  anomalyScore: number; // 0.0 to 1.0 based on behavioral baseline vector distance
}

export interface SecuritySentinelState {
  securityScore: number;
  anomalyThreshold: number;
  compromisedVectorRisk: "LOW" | "ELEVATED" | "CRITICAL";
  monitoringStatus: "ACTIVE_MONITORING" | "STAGING_HOLD_ACTIVE";
  auditLogs: {
    timestamp: string;
    action: string;
    severity: "INFO" | "WARNING" | "CRITICAL";
    message: string;
    details?: string;
  }[];
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number; // percentage (e.g., 18.5 for 18.5%)
  minPayment: number;
}

export interface DebtrixPayoffPlan {
  strategy: "AVALANCHE" | "SNOWBALL";
  totalOriginalDebt: number;
  monthlyAllocation: number; // minimums + extra buffer
  monthsToDebtFree: number;
  totalInterestPaid: number;
  interestSaved: number;
  schedule: Array<{
    month: number;
    debts: Array<{
      name: string;
      remainingBalance: number;
      paymentThisMonth: number;
    }>;
    totalRemaining: number;
    cumulativeInterest: number;
  }>;
  payoffOrder: string[];
}

export interface EcoMetrics {
  totalCarbonKg: number;
  activeGreenTaxCreditUSD: number;
  offsetsPurchasedKg: number;
  categoryPercentages: { [key: string]: number };
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  balances: {
    USD: number;
    EUR: number;
    BTC: number;
    SOL: number;
  };
  transactions: Transaction[];
  securityState: SecuritySentinelState;
  debts: Debt[];
  extraPaymentBuffer: number;
  ecoMetrics: EcoMetrics;
}

export interface TelemetryLog {
  timestamp: string;
  tenantId: string;
  level: "SYSTEM" | "TRACK_1" | "TRACK_2" | "TRACK_3" | "TRACK_4";
  code: string;
  message: string;
  statusColor: "Teal" | "Saffron" | "Gray" | "Red";
}
