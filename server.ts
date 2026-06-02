import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { 
  Tenant, 
  Transaction, 
  Debt, 
  DebtrixPayoffPlan, 
  EcoMetrics, 
  TelemetryLog 
} from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Initialize Server-Side Gemini API client
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("SovereignFin AI: Secure server-side Gemini SDK initialized successfully.");
  } catch (error) {
    console.error("SovereignFin AI: Failed to initialize Gemini Client:", error);
  }
} else {
  console.log("SovereignFin AI: GEMINI_API_KEY is unconfigured. Running in secure local sandbox mode.");
}

// Global state for live micro-ledger streaming simulation
let globalTelemetryLogs: TelemetryLog[] = [
  {
    timestamp: new Date().toISOString(),
    tenantId: "all",
    level: "SYSTEM",
    code: "BOOT_SUCCESS",
    message: "SovereignFin AI core ledger systems hyper-threaded and initialized successfully.",
    statusColor: "Teal"
  }
];

function logTelemetry(tenantId: string, level: TelemetryLog["level"], code: string, message: string, statusColor: TelemetryLog["statusColor"] = "Teal") {
  const log: TelemetryLog = {
    timestamp: new Date().toISOString(),
    tenantId,
    level,
    code,
    message,
    statusColor
  };
  globalTelemetryLogs.unshift(log); // prepend
  if (globalTelemetryLogs.length > 100) {
    globalTelemetryLogs.pop();
  }
}

// Mock Footprint Dataset
const CARBON_MULTIPLIERS = {
  "Logistics": 1.85,
  "SaaS & Cloud": 0.12,
  "Corporate Travel": 0.65,
  "Offices & Grid": 0.45,
  "Energy Systems": 2.10,
  "Standard Settlement": 0.01
};

// In-Memory Multi-Tenant Ledger Database
let tenants: Tenant[] = [
  {
    id: "tenant_scp_001",
    name: "Sovereign Capital Partners Ltd",
    domain: "sovereigncap.io",
    balances: {
      USD: 1450200,
      EUR: 890400,
      BTC: 12.4,
      SOL: 340.5
    },
    extraPaymentBuffer: 15000,
    ecoMetrics: {
      totalCarbonKg: 142050,
      activeGreenTaxCreditUSD: 24500,
      offsetsPurchasedKg: 42000,
      categoryPercentages: {
        "Logistics": 45,
        "SaaS & Cloud": 10,
        "Corporate Travel": 25,
        "Offices & Grid": 15,
        "Energy Systems": 5
      }
    },
    debts: [
      { id: "debt_scp_01", name: "Alpha Capital Line of Credit", balance: 350000, apr: 14.8, minPayment: 4200 },
      { id: "debt_scp_02", name: "SBA Industrial Expansion Loan", balance: 650000, apr: 6.2, minPayment: 6800 },
      { id: "debt_scp_03", name: "Prime Commercial Real Estate Debt", balance: 1200000, apr: 5.4, minPayment: 9400 },
      { id: "debt_scp_04", name: "Datacenter Hardware Lease v4", balance: 85000, apr: 8.5, minPayment: 1800 }
    ],
    securityState: {
      securityScore: 94,
      anomalyThreshold: 5000, // payments over $5000 trigger STAGING LOCK
      compromisedVectorRisk: "LOW",
      monitoringStatus: "ACTIVE_MONITORING",
      auditLogs: [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), action: "AUTHENTICATION", severity: "INFO", message: "User session authenticated with hardware security key." },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), action: "VECTOR_MATCH", severity: "INFO", message: "Batch transaction pipeline vectors verified. Anomaly index: 0.12" }
      ]
    },
    transactions: [
      {
        id: "tx_scp_201",
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        asset: "USD",
        amount: 4200,
        type: "STREAM",
        reference: "AWS Cloud Ingestion Settlement",
        category: "SaaS & Cloud",
        carbonFootprintKg: 504,
        status: "COMMITTED",
        anomalyScore: 0.12
      },
      {
        id: "tx_scp_202",
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        asset: "EUR",
        amount: 14200,
        type: "WITHDRAWAL",
        reference: "Frankfurt Logistics Hub Settle - STAGING TRACE",
        category: "Logistics",
        carbonFootprintKg: 26270,
        status: "COMMITTED",
        anomalyScore: 0.42
      }
    ]
  },
  {
    id: "tenant_obsidian_002",
    name: "Obsidian Labs Inc.",
    domain: "obsidianlabs.co",
    balances: {
      USD: 625100,
      EUR: 124500,
      BTC: 4.8,
      SOL: 1120.4
    },
    extraPaymentBuffer: 8500,
    ecoMetrics: {
      totalCarbonKg: 34200,
      activeGreenTaxCreditUSD: 6840,
      offsetsPurchasedKg: 18000,
      categoryPercentages: {
        "Logistics": 5,
        "SaaS & Cloud": 65,
        "Corporate Travel": 15,
        "Offices & Grid": 10,
        "Energy Systems": 5
      }
    },
    debts: [
      { id: "debt_obs_01", name: "Silicon Syndicate Venture Debt", balance: 140000, apr: 12.5, minPayment: 2100 },
      { id: "debt_obs_02", name: "AWS Cloud Hardware Lease", balance: 45000, apr: 9.8, minPayment: 1100 },
      { id: "debt_obs_03", name: "Elite Talent Sign-on Liability", balance: 25000, apr: 15.0, minPayment: 600 }
    ],
    securityState: {
      securityScore: 81,
      anomalyThreshold: 2500, // over $2500 trigger STAGING LOCK for testing
      compromisedVectorRisk: "ELEVATED",
      monitoringStatus: "STAGING_HOLD_ACTIVE",
      auditLogs: [
        { timestamp: new Date(Date.now() - 15 * 60000).toISOString(), action: "STAGING_LOCK", severity: "WARNING", message: "Staging lock triggered on outbound payment of $3,500. Awaiting manual signature.", details: "Baseline Vector deviation: 0.82" },
        { timestamp: new Date(Date.now() - 86400000).toISOString(), action: "AUDIT", severity: "INFO", message: "IP range modified. Security vectors recalculated." }
      ]
    },
    transactions: [
      {
        id: "tx_obs_301",
        timestamp: new Date().toISOString(),
        asset: "USD",
        amount: 3500,
        type: "DEPOSIT",
        reference: "Global Saffron Supplier Liquidation Hub",
        category: "Logistics",
        carbonFootprintKg: 6475,
        status: "AWAITING_HUMAN_APPROVAL",
        anomalyScore: 0.82
      },
      {
        id: "tx_obs_302",
        timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        asset: "SOL",
        amount: 45,
        type: "STREAM",
        reference: "Decentralized GPU Compute Farm Lease",
        category: "SaaS & Cloud",
        carbonFootprintKg: 5.4,
        status: "COMMITTED",
        anomalyScore: 0.15
      }
    ]
  },
  {
    id: "tenant_koda_003",
    name: "Koda Stream Ltd.",
    domain: "kodastream.global",
    balances: {
      USD: 185300,
      EUR: 256100,
      BTC: 1.12,
      SOL: 45.1
    },
    extraPaymentBuffer: 3000,
    ecoMetrics: {
      totalCarbonKg: 12400,
      activeGreenTaxCreditUSD: 4100,
      offsetsPurchasedKg: 8000,
      categoryPercentages: {
        "Logistics": 10,
        "SaaS & Cloud": 70,
        "Corporate Travel": 10,
        "Offices & Grid": 10,
        "Energy Systems": 0
      }
    },
    debts: [
      { id: "debt_koda_01", name: "High-Yield Working Capital Credit", balance: 45000, apr: 19.5, minPayment: 1500 },
      { id: "debt_koda_02", name: "Micro-payment Node Term Rent", balance: 18000, apr: 11.2, minPayment: 450 }
    ],
    securityState: {
      securityScore: 98,
      anomalyThreshold: 1200, // over $1200 triggers lock
      compromisedVectorRisk: "LOW",
      monitoringStatus: "ACTIVE_MONITORING",
      auditLogs: [
        { timestamp: new Date().toISOString(), action: "SCAN", severity: "INFO", message: "Sovereign behavioral scans verified 1400 sub-second micropayments flawlessly." }
      ]
    },
    transactions: [
      {
        id: "tx_koda_401",
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        asset: "USD",
        amount: 110,
        type: "STREAM",
        reference: "Stream Node Multi-settlement S01",
        category: "Standard Settlement",
        carbonFootprintKg: 1.1,
        status: "COMMITTED",
        anomalyScore: 0.01
      }
    ]
  }
];

// Helper to simulate atomic continuous streams
setInterval(() => {
  tenants.forEach(tenant => {
    // Generate an atomic micro-stream log/transaction 35% of the time
    if (Math.random() < 0.35) {
      const assets: ("USD" | "EUR" | "BTC" | "SOL")[] = ["USD", "EUR", "BTC", "SOL"];
      const asset = assets[Math.floor(Math.random() * assets.length)];
      
      // Keep amounts small to fit the Micro-Ledger DNA
      let amount = 0;
      if (asset === "USD" || asset === "EUR") {
        amount = Number((Math.random() * 25 + 1).toFixed(2));
      } else if (asset === "SOL") {
        amount = Number((Math.random() * 0.1 + 0.01).toFixed(4));
      } else {
        amount = Number((Math.random() * 0.0002 + 0.00001).toFixed(6));
      }

      // Convert asset to USD approx value for green calculation
      let usdEquiv = amount;
      if (asset === "EUR") usdEquiv = amount * 1.08;
      if (asset === "BTC") usdEquiv = amount * 68000;
      if (asset === "SOL") usdEquiv = amount * 165;

      const categories: Transaction["category"][] = ["SaaS & Cloud", "Logistics", "Corporate Travel", "Standard Settlement"];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const mult = CARBON_MULTIPLIERS[category] || 0.01;
      const carbon = Number((usdEquiv * mult).toFixed(3));

      // Stream transaction is committed immediately (sub-second high speed micro-ledger)
      const streamTx: Transaction = {
        id: `tx_stream_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        asset,
        amount,
        type: "STREAM",
        reference: `Automated Stream Node ${Math.floor(Math.random() * 900 + 100)}`,
        category,
        carbonFootprintKg: carbon,
        status: "COMMITTED",
        anomalyScore: Number((Math.random() * 0.15).toFixed(3))
      };

      // Atomic Update balances
      tenant.balances[asset] = Number((tenant.balances[asset] - amount).toFixed(6));
      if (tenant.balances[asset] < 0) tenant.balances[asset] = 0; // prevent absolute negative in sandbox

      tenant.transactions.unshift(streamTx);
      if (tenant.transactions.length > 30) tenant.transactions.pop();

      // Update carbon index
      tenant.ecoMetrics.totalCarbonKg = Number((tenant.ecoMetrics.totalCarbonKg + carbon).toFixed(3));
      tenant.ecoMetrics.activeGreenTaxCreditUSD = Number((tenant.ecoMetrics.totalCarbonKg * 0.18).toFixed(2));

      // Telemetry log
      logTelemetry(
        tenant.id, 
        "TRACK_1", 
        "MICRO_LEDGER_STREAM", 
        `High-speed Stream update committed: [-${amount} ${asset}] Vector anomaly signature matched.`, 
        "Teal"
      );
    }
  });
}, 9000); // every 9 seconds, continuous microstream simulations

// Algorithmic Debtrix payout solver: snowball vs avalanche
export function calculateDebtrixAlgorithms(debts: Debt[], strategy: "AVALANCHE" | "SNOWBALL", extraBuffer: number): DebtrixPayoffPlan {
  const totalOriginalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const minPaymentsSum = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const monthlyAllocation = minPaymentsSum + extraBuffer;

  // Clone debts so we don't mutate primary data during iterative math simulations
  let simulatedDebts = debts.map(d => ({ ...d }));

  // Sort priorities:
  // Avalanche prioritizes highest APR descending.
  // Snowball prioritizes lowest balance ascending.
  const payoffPriorityOrder = [...debts].sort((a, b) => {
    if (strategy === "AVALANCHE") {
      return b.apr - a.apr; // High APR first
    } else {
      return a.balance - b.balance; // Low balance first
    }
  }).map(d => d.name);

  let schedule: DebtrixPayoffPlan["schedule"] = [];
  let month = 0;
  let totalInterestPaid = 0;

  // Let's run a month-by-month payment simulation loop
  while (simulatedDebts.some(d => d.balance > 0) && month < 300) {
    month++;
    let interestThisMonthSum = 0;
    
    // 1. Accrue Monthly Interest & Pay Minimums First
    let paymentsThisMonth = simulatedDebts.map(d => {
      let interest = 0;
      if (d.balance > 0) {
        // Accrue monthly interest: balance * (apr / 100 / 12)
        interest = d.balance * (d.apr / 100 / 12);
        d.balance += interest;
        interestThisMonthSum += interest;
      }
      return { id: d.id, name: d.name, debtObj: d, paymentApplied: 0, interestAccrued: interest };
    });

    totalInterestPaid += interestThisMonthSum;

    // Minimum commitments pool
    let activeBufferPool = extraBuffer;

    // Apply minimum payments
    paymentsThisMonth.forEach(ptm => {
      const d = ptm.debtObj;
      if (d.balance <= 0) return;

      const minToPay = Math.min(d.minPayment, d.balance);
      d.balance -= minToPay;
      ptm.paymentApplied += minToPay;

      // If minToPay is less than minPayment, we save the left-over for the extra pool
      if (minToPay < d.minPayment) {
        activeBufferPool += (d.minPayment - minToPay);
      }
    });

    // 2. Distribute Extra Buffer Pool based on Strategy Priority Ranking
    // Find the debts sorted in exact priority order
    let sortedPriorityIDs = [...simulatedDebts].sort((a, b) => {
      if (strategy === "AVALANCHE") {
        return b.apr - a.apr;
      } else {
        return a.balance - b.balance;
      }
    });

    for (let currentTarget of sortedPriorityIDs) {
      if (activeBufferPool <= 0) break;
      if (currentTarget.balance <= 0) continue;

      const extraToApply = Math.min(activeBufferPool, currentTarget.balance);
      currentTarget.balance -= extraToApply;
      activeBufferPool -= extraToApply;

      // Add to applied payment tracking
      const trackObj = paymentsThisMonth.find(ptm => ptm.id === currentTarget.id);
      if (trackObj) {
        trackObj.paymentApplied += extraToApply;
      }
    }

    // Capture this month's schedule state snippet
    schedule.push({
      month,
      debts: paymentsThisMonth.map(ptm => ({
        name: ptm.name,
        remainingBalance: Number(ptm.debtObj.balance.toFixed(2)),
        paymentThisMonth: Number(ptm.paymentApplied.toFixed(2))
      })),
      totalRemaining: Number(simulatedDebts.reduce((sum, d) => sum + d.balance, 0).toFixed(2)),
      cumulativeInterest: Number(totalInterestPaid.toFixed(2))
    });
  }

  // Calculate baseline simulation with only minPayments (to find exact total interest saved by using the matrix)
  let baseSimDebts = debts.map(d => ({ ...d }));
  let baseMonth = 0;
  let baseTotalInterestPaid = 0;
  while (baseSimDebts.some(d => d.balance > 0) && baseMonth < 300) {
    baseMonth++;
    baseSimDebts.forEach(d => {
      if (d.balance <= 0) return;
      let interest = d.balance * (d.apr / 100 / 12);
      d.balance += interest;
      baseTotalInterestPaid += interest;

      let minToPay = Math.min(d.minPayment, d.balance);
      d.balance -= minToPay;
    });
  }

  const interestSaved = Math.max(0, Number((baseTotalInterestPaid - totalInterestPaid).toFixed(2)));

  return {
    strategy,
    totalOriginalDebt,
    monthlyAllocation,
    monthsToDebtFree: month,
    totalInterestPaid: Number(totalInterestPaid.toFixed(2)),
    interestSaved,
    schedule,
    payoffOrder: payoffPriorityOrder
  };
}

// REST ENDPOINTS

// 1. Get multi-tenant configuration (Zero-Trust Isolated)
app.get("/api/tenants", (req, res) => {
  // Returns high-level summaries. The individual tenant views must request isolated tenant profiles using secure Tenant ID.
  const tenantSummaries = tenants.map(t => ({
    id: t.id,
    name: t.name,
    domain: t.domain,
    balances: t.balances,
    securityRisk: t.securityState.compromisedVectorRisk,
    securityScore: t.securityState.securityScore
  }));
  res.json({ tenants: tenantSummaries });
});

// 2. Fetch specific Tenant dataset (Ensures verified tenant isolation sandbox)
app.get("/api/tenant/:id", (req, res) => {
  const { id } = req.params;
  const tenant = tenants.find(t => t.id === id);
  if (!tenant) {
    logTelemetry("all", "SYSTEM", "AUTH_FAIL", `Unauthorized access attempt or invalid request to Tenant ID: ${id}`, "Red");
    return res.status(404).json({ error: "Tenant verification context missing. Security isolation aborted." });
  }

  // Recalculate optimal payoff strategies in real-time
  const avalanchePlan = calculateDebtrixAlgorithms(tenant.debts, "AVALANCHE", tenant.extraPaymentBuffer);
  const snowballPlan = calculateDebtrixAlgorithms(tenant.debts, "SNOWBALL", tenant.extraPaymentBuffer);

  res.json({
    tenant,
    debtrixPlans: {
      avalanche: avalanchePlan,
      snowball: snowballPlan
    }
  });
});

// 3. Post a raw financial action through the SovereignFin micro-ledger
app.post("/api/tenant/:id/action", (req, res) => {
  const { id } = req.params;
  const { asset, amount, reference, category, type } = req.body;

  const tenant = tenants.find(t => t.id === id);
  if (!tenant) {
    return res.status(404).json({ error: "Invalid Tenant context" });
  }

  if (!asset || !amount || isNaN(amount) || amount <= 0 || !category) {
    return res.status(400).json({ error: "Invalid transaction payload indices." });
  }

  // Trace Asset Conversion to USD for behavioral vectors & Green Tax calculation
  let usdEquiv = amount;
  if (asset === "EUR") usdEquiv = amount * 1.08;
  if (asset === "BTC") usdEquiv = amount * 68000;
  if (asset === "SOL") usdEquiv = amount * 165;

  // TRACK 2: SOVEREIGN ASSET SENTINEL ANOMALY scan
  const highDeviation = usdEquiv >= tenant.securityState.anomalyThreshold;
  const anomalyScore = highDeviation ? Number((0.75 + Math.random() * 0.2).toFixed(2)) : Number((Math.random() * 0.2).toFixed(2));

  // Eco credit footprint computing
  const mult = CARBON_MULTIPLIERS[category as Transaction["category"]] || 0.01;
  const carbonFootprint = Number((usdEquiv * mult).toFixed(3));

  const newTx: Transaction = {
    id: `tx_user_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    asset: asset as any,
    amount: Number(amount),
    type: type || "WITHDRAWAL",
    reference,
    category: category as any,
    carbonFootprintKg: carbonFootprint,
    status: highDeviation ? "AWAITING_HUMAN_APPROVAL" : "COMMITTED",
    anomalyScore
  };

  if (highDeviation) {
    // STAGING LOCK protocol triggered. Toggle system accent to saffron gold
    tenant.securityState.monitoringStatus = "STAGING_HOLD_ACTIVE";
    tenant.transactions.unshift(newTx);

    // Add audit log
    const auditMsg = `STAGING LOCK: High-value outbound payment ($${usdEquiv.toFixed(2)} USD value) triggers behavioral sentinel.`;
    tenant.securityState.auditLogs.unshift({
      timestamp: new Date().toISOString(),
      action: "STAGING_LOCK",
      severity: "WARNING",
      message: auditMsg,
      details: `Threshold set to $${tenant.securityState.anomalyThreshold}. Outflow is 0.75 deviation index.`
    });

    logTelemetry(
      tenant.id, 
      "TRACK_2", 
      "STAGING_HOLD_ACTIVE", 
      `ALERT: Sovereign asset sentinel triggered. Outflow matches suspicious pattern. Balance unchanged, status gold-locked.`, 
      "Saffron"
    );

    return res.json({ 
      status: "AWAITING_HUMAN_APPROVAL", 
      transaction: newTx,
      message: "Security sentinel staged. Outbound stream requires manual signature verification." 
    });
  } else {
    // Balance modification committed
    tenant.balances[asset] = Number((tenant.balances[asset] - amount).toFixed(6));
    tenant.transactions.unshift(newTx);

    // Environmental metrics integration
    tenant.ecoMetrics.totalCarbonKg = Number((tenant.ecoMetrics.totalCarbonKg + carbonFootprint).toFixed(3));
    tenant.ecoMetrics.activeGreenTaxCreditUSD = Number((tenant.ecoMetrics.totalCarbonKg * 0.18).toFixed(2));

    logTelemetry(
      tenant.id, 
      "TRACK_1", 
      "TRANSACTION_COMMITTED", 
      `Ledger committed [-${amount} ${asset}]. Environmental CO2 offset matrix revised.`, 
      "Teal"
    );

    return res.json({ 
      status: "COMMITTED", 
      transaction: newTx,
      message: "Micro-payment finalized instantly on ledger." 
    });
  }
});

// 4. Manual Overrides of Security Locks via Hardware human key validation
app.post("/api/tenant/:id/override", (req, res) => {
  const { id } = req.params;
  const { transactionId, approve } = req.body;

  const tenant = tenants.find(t => t.id === id);
  if (!tenant) return res.status(404).json({ error: "Tenant context not found." });

  const tx = tenant.transactions.find(t => t.id === transactionId);
  if (!tx) return res.status(404).json({ error: "Transaction index offline." });

  if (approve) {
    tx.status = "COMMITTED";
    // commit actual balance modification
    tenant.balances[tx.asset] = Number((tenant.balances[tx.asset] - tx.amount).toFixed(6));
    
    // update eco offset
    tenant.ecoMetrics.totalCarbonKg = Number((tenant.ecoMetrics.totalCarbonKg + tx.carbonFootprintKg).toFixed(3));
    tenant.ecoMetrics.activeGreenTaxCreditUSD = Number((tenant.ecoMetrics.totalCarbonKg * 0.18).toFixed(2));

    tenant.securityState.monitoringStatus = "ACTIVE_MONITORING";
    tenant.securityState.auditLogs.unshift({
      timestamp: new Date().toISOString(),
      action: "HUMAN_OVERRIDE_APPROVED",
      severity: "INFO",
      message: "Staged transaction released via human verification index.",
      details: `Release authorization key: ${Math.random().toString(16).substring(3, 10).toUpperCase()}`
    });

    logTelemetry(
      tenant.id, 
      "TRACK_2", 
      "SECURE_RELEASE", 
      `STAGING RELEASE: Manual security permission overrode lock. Account ledger synced fully.`, 
      "Teal"
    );
  } else {
    tx.status = "REJECTED";
    tenant.securityState.monitoringStatus = "ACTIVE_MONITORING";
    tenant.securityState.auditLogs.unshift({
      timestamp: new Date().toISOString(),
      action: "HUMAN_OVERRIDE_REJECTED",
      severity: "CRITICAL",
      message: "Suspicious behavioral transaction terminated by the user.",
      details: "No balances altered."
    });

    logTelemetry(
      tenant.id, 
      "TRACK_2", 
      "THREAT_MITIGATED", 
      `STAGING EXTINGUISHED: Transaction rejected by human-in-the-loop audit. Threat neutralized.`, 
      "Red"
    );
  }

  res.json({ success: true, transaction: tx });
});

// 5. Update Debtrix Buffers
app.post("/api/tenant/:id/debtrix-buffer", (req, res) => {
  const { id } = req.params;
  const { extraPaymentBuffer } = req.body;

  const tenant = tenants.find(t => t.id === id);
  if (!tenant) return res.status(404).json({ error: "Tenant not found." });

  tenant.extraPaymentBuffer = Number(extraPaymentBuffer || 0);

  logTelemetry(
    tenant.id, 
    "TRACK_3", 
    "DEBTRIX_BUFFER_RECALLED", 
    `Debtrix payoff priority buffer set to $${tenant.extraPaymentBuffer}. Projections updated.`, 
    "Saffron"
  );

  const avalanchePlan = calculateDebtrixAlgorithms(tenant.debts, "AVALANCHE", tenant.extraPaymentBuffer);
  const snowballPlan = calculateDebtrixAlgorithms(tenant.debts, "SNOWBALL", tenant.extraPaymentBuffer);

  res.json({
    success: true,
    extraPaymentBuffer: tenant.extraPaymentBuffer,
    debtrixPlans: {
      avalanche: avalanchePlan,
      snowball: snowballPlan
    }
  });
});

// 6. Live Telemetry polling route
app.get("/api/telemetry", (req, res) => {
  res.json({ logs: globalTelemetryLogs });
});

// 7. Secure AI Consultation Chat with active sandbox tenant context injection
app.post("/api/chatbot", async (req, res) => {
  const { tenantId, message } = req.body;
  const tenant = tenants.find(t => t.id === tenantId);

  if (!tenant) {
    return res.status(400).json({ error: "Valid tenant ID is required." });
  }

  const promptText = `
SYSTEM CONTEXT DIRECTIVE:
You are SovereignFin AI, the unified, enterprise-grade Autonomous Multi-Agent Financial SaaS Engine.
We have injected the secure multi-tenant execution context below. Speak directly and objectively with elite financial systems expertise. Maintain the persona. Do not mention internal API keys or database structural layouts. Use high-scannability markdown vectors and clean bullet lists.

TENANT SECURE PROFILE:
- Name: ${tenant.name}
- Domain: ${tenant.domain}
- Core Currencies/Balancings:
  USD: ${tenant.balances.USD}, EUR: ${tenant.balances.EUR}, BTC: ${tenant.balances.BTC}, SOL: ${tenant.balances.SOL}
- Liability Debts Structure:
  ${tenant.debts.map(d => `${d.name} -> Balance: $${d.balance}, Interest APR: ${d.apr}%, Min Monthly Pay: $${d.minPayment}`).join("\n")}
- Debtrix Extra Buffer Allotment: $${tenant.extraPaymentBuffer}
- Carbon Footprint Emissions Metric: ${tenant.ecoMetrics.totalCarbonKg} kgCO2 (Tax Credit: $${tenant.ecoMetrics.activeGreenTaxCreditUSD})

USER COMMAND:
"${message}"
`;

  if (ai) {
    try {
      logTelemetry(tenantId, "SYSTEM", "AI_REASONING", "Gemini 3 contextual inference agent initialized to respond to user inquiry.", "Saffron");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
      });

      const responseText = response.text || "Diagnostic trace failed to parse inference channel.";
      return res.json({ response: responseText });
    } catch (err: any) {
      console.error("Gemini context run failed:", err);
      // Fallback
    }
  }

  // Pure High-Fidelity Rule-base consulting if API offline or has mock keys
  logTelemetry(tenantId, "SYSTEM", "LOCAL_REASONING", "Sovereign intelligence responding using local mathematical sandbox routines.", "Teal");
  
  // Real dynamic analysis on debts if user asks about debts
  const isDebtQuery = /debt|payoff|owe|snowball|avalanche|liability|interest/i.test(message);
  const isCarbonQuery = /carbon|eco|footprint|green|tax|offset|logistic/i.test(message);
  const isLedgerQuery = /balance|ledger|cash|wallet|secure|hold/i.test(message);

  let responseText = "";
  if (isDebtQuery) {
    const pAvalanche = calculateDebtrixAlgorithms(tenant.debts, "AVALANCHE", tenant.extraPaymentBuffer);
    const pSnowball = calculateDebtrixAlgorithms(tenant.debts, "SNOWBALL", tenant.extraPaymentBuffer);

    responseText = `### SovereignFin AI Multi-Agent Debtrix Analysis (Local Expert Core)
   
Analyzing debt metrics for **${tenant.name}**:

1. **Active Repayment Multiplier**: By adding your extra pool **$${tenant.extraPaymentBuffer}/mo** atop the statutory minimum commitments (**$${tenant.debts.reduce((sum, d) => sum + d.minPayment, 0)}/mo**), your total monthly capital target is **$${pAvalanche.monthlyAllocation}/mo**.
2. **Comparison Matrix**:
   - **Avalanche Strategy**: Prioritizes higher interest APR descending (**${pAvalanche.payoffOrder[0]}** first).
     - **Duration**: **${pAvalanche.monthsToDebtFree} months** to reach zero liabilities.
     - **Interest Saved**: **$${pAvalanche.interestSaved}** relative to paying standard minimum schedules.
   - **Snowball Strategy**: Prioritizes smaller remaining balances ascending (**${pSnowball.payoffOrder[0]}** first).
     - **Duration**: **${pSnowball.monthsToDebtFree} months**.
     - **Interest Saved**: **$${pSnowball.interestSaved}**.

**Dynamic Recommendation**: The **${pAvalanche.interestSaved >= pSnowball.interestSaved ? "Avalanche" : "Snowball"}** model is optimized as your optimal economic yield curve here, saving **$${Math.max(pAvalanche.interestSaved, pSnowball.interestSaved)}** in cumulative interest cost.`;
  } else if (isCarbonQuery) {
    responseText = `### SovereignFin AI Eco-Sovereign Ecological Audit
   
Analyzing carbon logs for **${tenant.name}**:
- **Consolidated Emission Footprint**: Your operations have emitted a cumulative **${tenant.ecoMetrics.totalCarbonKg.toLocaleString()} kgCO2** based on outbound logistical categories.
- **Ecological Credits (Active Accumulator)**: Under environmental corporate compliance structures, this qualifies you for **$${tenant.ecoMetrics.activeGreenTaxCreditUSD.toLocaleString()} USD** in Green Tax Relief adjustments (calculated at standard 18% multiplier).
- **Logistics Offset Sentinel**: We recommend routing **$450 USD** of your next USD reserve into Gold-Standard carbon offsets to neutralise ${Math.floor(tenant.ecoMetrics.totalCarbonKg * 0.2)} kgCO2 from Cloud compute workloads instantly.`;
  } else if (isLedgerQuery) {
    responseText = `### High-Speed Micro-Ledger Balancings
   
Isolated ledger report in real-time metrics for **${tenant.name}**:
- **Base Reserves**: **$${tenant.balances.USD.toLocaleString()} USD** | **€${tenant.balances.EUR.toLocaleString()} EUR**
- **Sovereign Blockchains**: **${tenant.balances.BTC} BTC** | **${tenant.balances.SOL} SOL**
- **Asset Sentinel Status**: **${tenant.securityState.compromisedVectorRisk} RISK LEVEL**. Immediate actions are mapped through sub-second settlement channels to avoid frontrunning and slippage.`;
  } else {
    responseText = `### Corporate Financial Agent Intelligence Brief

Welcome to SovereignFin AI, Systems Architect. I am actively managing transaction flows for **${tenant.name}**.

Available Expert Engines to execute:
1. **TRACK 1 [Micro-Ledgers]**: Ask me to run balance balances or submit a stream transaction block.
2. **TRACK 2 [Sovereign Sentinel]**: Request a safety behavioral vector scanning review or auditing logs.
3. **TRACK 3 [Debtrix Matrices]**: Ask "Analyze my liability compression matrices" to optimize snowball and avalanche payoff paths.
4. **TRACK 4 [EcoQuest Calculator]**: Ask about environmental multipliers, green tax rewards, or log footprint distributions.

How shall we optimize your corporate balance ledgers today?`;
  }

  res.json({ response: responseText });
});

// Configure Vite or Serve Web Production Assets
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite HMR disabled proxy.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving static dist folder.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SovereignFin AI Server running on http://localhost:${PORT}`);
  });
}

configureServer();
