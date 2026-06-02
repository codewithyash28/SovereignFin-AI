import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal as TerminalIcon, 
  Shield, 
  RefreshCw, 
  Zap, 
  TrendingDown, 
  Leaf, 
  Play, 
  Pause, 
  AlertTriangle, 
  Check, 
  X, 
  ShieldAlert, 
  Cpu, 
  ArrowUpRight, 
  DollarSign, 
  Wallet, 
  Globe, 
  Send, 
  UserCheck, 
  Lock, 
  HelpCircle,
  TrendingUp,
  FileSpreadsheet
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from "recharts";
import { Tenant, Transaction, TelemetryLog, DebtrixPayoffPlan } from "./types";

export default function App() {
  // Master Sandbox States 
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("tenant_scp_001");
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [debtrixPlans, setDebtrixPlans] = useState<{ avalanche: DebtrixPayoffPlan; snowball: DebtrixPayoffPlan } | null>(null);
  const [activeTab, setActiveTab] = useState<"ledgers" | "sentinel" | "debtrix" | "ecology">("ledgers");
  
  // Quick Transaction form states
  const [txAsset, setTxAsset] = useState<"USD" | "EUR" | "BTC" | "SOL">("USD");
  const [txAmount, setTxAmount] = useState<string>("");
  const [txCategory, setTxCategory] = useState<string>("SaaS & Cloud");
  const [txReference, setTxReference] = useState<string>("");

  // System/Streaming/UI states
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [activeStrategy, setActiveStrategy] = useState<"AVALANCHE" | "SNOWBALL">("AVALANCHE");
  const [extraBufferInput, setExtraBufferInput] = useState<number>(0);
  const [logsFilter, setLogsFilter] = useState<string>("all");
  
  // AI Consulting Channel states
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Systems verified. Standby for enterprise-grade autonomous asset consulting. Ask me to formulate optimal debt payoffs or analyze transactional footprints." }
  ]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Auto-scroll logic for terminal
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial Launch: Fetch tenant overview and active logs
  useEffect(() => {
    fetchTenantSummaries();
    fetchTelemetryLogs();

    // Live continuous polling timers for enterprise fidelity
    const telemetryInterval = setInterval(() => {
      fetchTelemetryLogs();
    }, 2500);

    return () => {
      clearInterval(telemetryInterval);
    };
  }, []);

  // 2. Fetch specific tenant when dropdown selection changes
  useEffect(() => {
    if (selectedTenantId) {
      fetchTenantDetails(selectedTenantId);
    }
  }, [selectedTenantId]);

  // Periodic fetch to keep sub-second streaming balance modifications in sync
  useEffect(() => {
    if (!isStreaming || !selectedTenantId) return;

    const streamSyncInterval = setInterval(() => {
      fetchTenantDetails(selectedTenantId, true);
    }, 4500);

    return () => {
      clearInterval(streamSyncInterval);
    };
  }, [isStreaming, selectedTenantId]);

  const fetchTenantSummaries = async () => {
    try {
      const res = await fetch("/api/tenants");
      const data = await res.json();
      if (data.tenants) {
        setTenants(data.tenants);
      }
    } catch (err) {
      console.error("Failed to fetch tenant list summaries:", err);
    }
  };

  const fetchTenantDetails = async (tenantId: string, isSilent: boolean = false) => {
    try {
      const res = await fetch(`/api/tenant/${tenantId}`);
      if (!res.ok) throw new Error("Auth verification failed.");
      const data = await res.json();
      if (data.tenant) {
        setActiveTenant(data.tenant);
        setExtraBufferInput(data.tenant.extraPaymentBuffer);
        if (data.debtrixPlans) {
          setDebtrixPlans(data.debtrixPlans);
        }
      }
    } catch (err) {
      console.error("Failed fetching deep tenant profile:", err);
    }
  };

  const fetchTelemetryLogs = async () => {
    try {
      const res = await fetch("/api/telemetry");
      const data = await res.json();
      if (data.logs) {
        setTelemetryLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed downloading telemetry streams:", err);
    }
  };

  // Transaction injector command
  const handleInjectTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || isNaN(Number(txAmount)) || Number(txAmount) <= 0) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tenant/${selectedTenantId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: txAsset,
          amount: Number(txAmount),
          reference: txReference || `Manual Micro-Asset Allocation (${txAsset})`,
          category: txCategory,
          type: "WITHDRAWAL"
        })
      });
      const data = await res.json();
      
      // Auto-trigger corresponding view based on security outcome
      if (data.status === "AWAITING_HUMAN_APPROVAL") {
        setActiveTab("sentinel"); // switch to sentinel so they see the staging lock
      } else {
        setActiveTab("ledgers");
      }

      // Reset form fields
      setTxAmount("");
      setTxReference("");
      
      // Sync DB records
      await fetchTenantDetails(selectedTenantId);
      await fetchTelemetryLogs();
    } catch (err) {
      console.error("Inbound payment ingestion disrupted:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Human Oversight Override Release
  const handleStagingResolution = async (txId: string, approve: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tenant/${selectedTenantId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txId, approve })
      });
      if (res.ok) {
        await fetchTenantDetails(selectedTenantId);
        await fetchTelemetryLogs();
      }
    } catch (err) {
      console.error("Staging lock override failure:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Dynamic Debtrix Extra Buffer update
  const handleUpdateDebtrixBuffer = async (newVal: number) => {
    try {
      const res = await fetch(`/api/tenant/${selectedTenantId}/debtrix-buffer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraPaymentBuffer: newVal })
      });
      const data = await res.json();
      if (data.success && data.debtrixPlans) {
        setDebtrixPlans(data.debtrixPlans);
        if (activeTenant) {
          setActiveTenant({
            ...activeTenant,
            extraPaymentBuffer: newVal
          });
        }
      }
    } catch (err) {
      console.error("Failed saving adjusted buffer matrix:", err);
    }
  };

  // Send AI message
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatHistory(prev => [...prev, { sender: "user", text: userText }]);
    setChatMessage("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          message: userText
        })
      });
      const data = await res.json();
      if (data.response) {
        setChatHistory(prev => [...prev, { sender: "ai", text: data.response }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: "ai", text: "Error syncing AI reasoning channel. Key index corrupted." }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Helper values for security visualization
  const pendingStagingTxs = activeTenant?.transactions.filter(t => t.status === "AWAITING_HUMAN_APPROVAL") || [];
  const systemStateOnSaffronLock = pendingStagingTxs.length > 0;

  // Render variables for Active strategy
  const currentPlan = debtrixPlans ? (activeStrategy === "AVALANCHE" ? debtrixPlans.avalanche : debtrixPlans.snowball) : null;
  const originalPlan = debtrixPlans ? (activeStrategy === "AVALANCHE" ? debtrixPlans.avalanche : debtrixPlans.snowball) : null; // calculated interest values

  // Recharts Debtrix Chart Data Mapper
  const chartData = currentPlan?.schedule.map(step => {
    const keyVal: any = { month: `M${step.month}`, "Remaining Debt": step.totalRemaining, "Interest Paid": step.cumulativeInterest };
    return keyVal;
  }) || [];

  // Recharts Carbon categories data constructor
  const carbonPercentages = activeTenant?.ecoMetrics.categoryPercentages || {};
  const carbonPieData = Object.keys(carbonPercentages).map(cat => ({
    name: cat,
    value: Math.floor((activeTenant?.ecoMetrics.totalCarbonKg || 0) * (carbonPercentages[cat] / 100))
  }));

  const CO_COLORS = ["#00E5FF", "#38BDF8", "#0284C7", "#0369A1", "#075985", "#F59E0B"];

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-100 flex flex-col font-sans selection:bg-[#00E5FF] selection:text-[#0A0B0E]">
      
      {/* 1. TOP SECURE INTEGRATION HEADER DISPLAY */}
      <header className={`border-b ${systemStateOnSaffronLock ? 'border-[#FF9100]/40 bg-[#160E07]' : 'border-slate-800 bg-[#0F1116]'} px-6 py-4 flex flex-col md:flex-row items-center justify-between transition-colors duration-500`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`p-2.5 rounded-lg ${systemStateOnSaffronLock ? 'bg-[#FF9100]/20 text-[#FF9100]' : 'bg-[#00E5FF]/10 text-[#00E5FF]'} transition-colors duration-500`}>
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            {systemStateOnSaffronLock && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9100] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FF9100]"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-lg tracking-wider text-slate-50">SOVEREIGNFIN AI</h1>
              <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded uppercase tracking-widest border border-slate-700">v3.5 EXP</span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Multi-Agent Enterprise SaaS Engine</p>
          </div>
        </div>

        {/* Dynamic State Lightings & Dropdown selectors */}
        <div className="flex flex-wrap items-center gap-4 mt-4 md:mt-0">
          
          {/* ZERO TRUST TENANT SELECTOR */}
          <div className="flex items-center gap-2.5 bg-[#141822] px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <span className="text-xs text-[#00E5FF]">●</span> TENANT COMPLIANCE:
            </span>
            <select 
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-[#00E5FF] focus:outline-none cursor-pointer pr-2 font-display"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id} className="bg-[#141822] text-slate-100">
                  {t.name} [{t.id.split("_")[1].toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          {/* AI Reasoning Beacon state Indicator */}
          <div className="flex items-center gap-2 bg-[#121319] px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
            {systemStateOnSaffronLock ? (
              <>
                <span className="h-2 w-2 rounded-full bg-[#FF9100] pulse-beacon-saffron"></span>
                <span className="text-[#FF9100] font-semibold">STAGING GATEKEEPER LOCK IN EFFECT</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-[#00E5FF]"></span>
                <span className="text-[#00E5FF] font-semibold">MULTI-AGENT AUTONOMY PASSIVE</span>
              </>
            )}
          </div>

          {/* Stream pause toggler */}
          <button 
            onClick={() => setIsStreaming(!isStreaming)}
            title={isStreaming ? "Pause continuous Ledger updates" : "Resume continuous streaming updates"}
            className={`p-2 rounded-md border text-xs flex items-center gap-1.5 transition-all ${isStreaming ? 'bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" /> STREAMING
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> PAUSED
              </>
            )}
          </button>
        </div>
      </header>

      {/* CORE FRAME FOR SANDBOX EXPLORATION CONTAINER */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: ACTIVE USER/TENANT PROFILE INFO & QUICK TRANSACTION ACTIONS */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Tenant Profile Context panel */}
          {activeTenant ? (
            <div className="bg-[#0F1116] border border-slate-800 rounded-xl p-5 relative overflow-hidden" id="card-tenant-context">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#00E5FF]/10 to-transparent rounded-bl-full pointer-events-none" />
              
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Authenticated Domain</p>
              <h2 className="text-xl font-display font-semibold text-slate-100 flex items-center gap-1.5 mb-1">
                {activeTenant.name}
              </h2>
              <code className="text-xs text-[#00E5FF] font-mono mb-4 block">{activeTenant.domain}</code>

              <div className="border-t border-slate-800 mt-3 pt-3 grid grid-cols-2 gap-3">
                <div className="bg-[#14161F] p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-mono">CURRENCY HOLDINGS</span>
                  <span className="text-sm font-semibold block text-[#00E5FF] mt-0.5">USD, EUR, BTC, SOL</span>
                </div>
                <div className="bg-[#14161F] p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block font-mono">RISK SCORE</span>
                  <span className={`text-sm font-semibold block mt-0.5 ${activeTenant.securityState.securityScore > 90 ? 'text-emerald-400' : 'text-[#FF9100]'}`}>
                    {activeTenant.securityState.securityScore}% Index
                  </span>
                </div>
              </div>

              {/* Zero-Trust compliance note */}
              <div className="mt-4 p-2.5 bg-[#1C1F26] rounded-md border border-slate-800 text-[11px] text-slate-400 leading-normal flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                <span>
                  <strong>Zero-Trust Sandboxed Account:</strong> Document schemas & memory sectors are fully isolated. Other tenants cannot read this memory block.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#0F1116] border border-slate-800 rounded-xl p-6 h-52 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-6 h-6 text-[#00E5FF] animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-mono">Verifying Tenant Cryptographics...</p>
              </div>
            </div>
          )}

          {/* QUICK TRANSACTION INJECTOR FORM */}
          <div className="bg-[#0F1116] border border-slate-800 rounded-xl p-5" id="card-tx-injector">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Zap className="text-[#00E5FF] w-5 h-5" />
              <div>
                <h3 className="font-display font-semibold text-slate-100 text-sm tracking-wider">MICRO-LEDGER INJECTOR</h3>
                <p className="text-[10px] text-slate-500">Atomic Sub-second Transaction Engine</p>
              </div>
            </div>

            <form onSubmit={handleInjectTransaction} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">BASE ASSET TYPE</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["USD", "EUR", "BTC", "SOL"] as const).map(asset => (
                    <button
                      key={asset}
                      type="button"
                      onClick={() => setTxAsset(asset)}
                      className={`py-1.5 text-xs font-mono rounded border transition-all ${txAsset === asset ? 'bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF] font-bold' : 'bg-[#14161F] border-slate-800 text-slate-400 hover:border-slate-700'}`}
                    >
                      {asset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">TRANSACTION VALUE</label>
                  <div className="relative">
                    <input 
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      required
                      className="w-full bg-[#14161F] text-slate-100 border border-slate-800 focus:border-[#00E5FF] focus:outline-none rounded px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">FOOTPRINT CATEGORY</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full bg-[#14161F] text-slate-100 border border-slate-800 focus:border-[#00E5FF] focus:outline-none rounded px-2 py-1.5 text-xs"
                  >
                    <option value="SaaS & Cloud">SaaS & Cloud</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Corporate Travel">Corporate Travel</option>
                    <option value="Offices & Grid">Offices & Grid</option>
                    <option value="Standard Settlement">Standard Settlement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">LEDGER DESTINATION KEY / REF</label>
                <input 
                  type="text"
                  placeholder="e.g. AWS Cloud Ingestion Settlement"
                  value={txReference}
                  onChange={(e) => setTxReference(e.target.value)}
                  className="w-full bg-[#14161F] text-slate-100 border border-slate-800 focus:border-[#00E5FF] focus:outline-none rounded px-3 py-1.5 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-[#00E5FF]/80 to-[#0284C7]/80 hover:from-[#00E5FF] hover:to-[#0284C7] text-[#0A0B0E] font-bold text-xs py-2 rounded transition-all duration-300 shadow-md shadow-[#00E5FF]/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? "SYNCING MOUNT..." : "COMMIT ATOMIC LEDGER"}
              </button>

              <p className="text-[9px] text-slate-500 text-center font-mono leading-tight mt-1">
                Note: Transactions exceeding limit ({activeTenant ? `$${activeTenant.securityState.anomalyThreshold.toLocaleString()}` : "$2,500"}) will trigger autonomous staging lock state.
              </p>
            </form>
          </div>

        </div>

        {/* MIDDLE COLUMN: MAIN INTERACTIVE METRIC TABS (3 TABS COVERS ALL 4 TRACKS) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          
          {/* Track Tabs control header */}
          <div className="flex flex-wrap border-b border-slate-800 gap-1 bg-[#0F1116] p-1.5 rounded-xl border border-slate-850">
            <button
              onClick={() => setActiveTab("ledgers")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold font-display tracking-wider flex items-center gap-2 transition-all ${activeTab === "ledgers" ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Wallet className="w-4 h-4" /> TRACK 1: MICRO-LEDGERS
            </button>
            <button
              onClick={() => setActiveTab("sentinel")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold font-display tracking-wider flex items-center gap-2 transition-all ${activeTab === "sentinel" ? (systemStateOnSaffronLock ? 'bg-[#FF9100]/10 text-[#FF9100]' : 'bg-[#00E5FF]/10 text-[#00E5FF]') : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Shield className="w-4 h-4" /> TRACK 2: SOVEREIGN SENTINEL {pendingStagingTxs.length > 0 && `(${pendingStagingTxs.length})`}
            </button>
            <button
              onClick={() => setActiveTab("debtrix")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold font-display tracking-wider flex items-center gap-2 transition-all ${activeTab === "debtrix" ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <TrendingDown className="w-4 h-4" /> TRACK 3: DEBTRIX PAYOFFS
            </button>
            <button
              onClick={() => setActiveTab("ecology")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold font-display tracking-wider flex items-center gap-2 transition-all ${activeTab === "ecology" ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Leaf className="w-4 h-4" /> TRACK 4: ECO-FINANCE CALCULATOR
            </button>
          </div>

          {/* ACTIVE VIEWPORT INTERACTIVE SAFEGUARD GATE CARD OVERLAY */}
          <AnimatePresence>
            {systemStateOnSaffronLock && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -25 }}
                className="overflow-hidden mb-6"
              >
                <div className="border border-[#FF9100]/60 bg-gradient-to-r from-[#1D120B] via-[#0E0B0A] to-[#120E0D] rounded-xl p-5 shadow-2xl relative overflow-hidden pulse-beacon-saffron-border">
                  {/* Glowing background highlights */}
                  <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#FF9100]/15 rounded-full blur-[70px] pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#00E5FF]/5 rounded-full blur-[60px] pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-[#FF9100]/20 text-[#FF9100] rounded-xl border border-[#FF9100]/40 flex items-center justify-center shrink-0 mt-1 shadow-inner shadow-[#FF9100]/30">
                        <ShieldAlert className="w-8 h-8 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-[#FF9100]/25 text-[#FFD099] border border-[#FF9100]/30 font-mono tracking-widest font-black px-2 py-0.5 rounded flex items-center gap-1 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9100] animate-ping" />
                            ACTIVE COGNITIVE SHIELD ACTIVE: OUTFLOW FROZEN
                          </span>
                        </div>
                        <h3 className="text-base font-display font-bold text-slate-100 tracking-wide mt-1">
                          Enterprise Micro-Ledger High Deviation Staged Lock
                        </h3>
                        <p className="text-xs text-slate-400 max-w-[760px] leading-relaxed">
                          The SovereignFin Guardian model flagged an incoming micro-ledger stream because its transactional vectors significantly exceeded your tenant configuration limits (max allowed: <span className="text-[#00E5FF] font-mono font-bold">${activeTenant?.securityState.anomalyThreshold.toLocaleString()}</span>). Releases are held in escrow pending manual key action.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Staged objects */}
                  <div className="mt-4 space-y-3 pt-4 border-t border-[#FF9100]/20 relative z-10">
                    {pendingStagingTxs.map((stgTx) => (
                      <div key={stgTx.id} className="bg-[#080706] border border-[#FF9100]/15 py-3 px-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs shadow-inner">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-bold text-[#FF9100] tracking-wider text-[11px]">ENVELOPE_LOCK: {stgTx.id}</span>
                            <span className="bg-[#1C120A] text-[#FFD099] border border-[#FF9100]/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                              {stgTx.reference}
                            </span>
                            <span className="bg-[#111319] text-slate-400 border border-slate-800 px-2 py-0.5 rounded text-[10px]">
                              {stgTx.category}
                            </span>
                          </div>
                          <div className="text-slate-300">
                            Volume: <span className="text-[#FF9100] font-bold">{stgTx.amount.toLocaleString()} {stgTx.asset}</span> <span className="text-slate-500 font-normal">({(stgTx.asset === "USD" ? stgTx.amount : stgTx.asset === "EUR" ? stgTx.amount * 1.08 : stgTx.asset === "BTC" ? stgTx.amount * 68000 : stgTx.asset === "SOL" ? stgTx.amount * 165 : stgTx.amount).toLocaleString(undefined, {style: 'currency', currency: 'USD'})} equivalent)</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <span>Threat deviation:</span> 
                            <span className="text-[#FF9100] font-bold">{(stgTx.anomalyScore * 100).toFixed(0)}% Match</span>
                            <span className="text-slate-650">•</span>
                            <span>System time: {new Date(stgTx.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                          <button
                            onClick={() => handleStagingResolution(stgTx.id, false)}
                            disabled={actionLoading}
                            className="flex-1 md:flex-none border border-red-500/30 text-rose-400 bg-red-950/25 hover:bg-red-900/35 font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-mono"
                          >
                            <X className="w-3.5 h-3.5" /> REJECT RELEASE
                          </button>
                          <button
                            onClick={() => handleStagingResolution(stgTx.id, true)}
                            disabled={actionLoading}
                            className="flex-1 md:flex-none bg-gradient-to-r from-[#FF9100] to-[#E65100] hover:from-[#FFA726] hover:to-[#FB8C05] text-[#0A0B0E] font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-[#FF9100]/20 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-mono"
                          >
                            <Check className="w-3.5 h-3.5" /> SIGN & RELEASE PAYLOAD
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              
              {/* TABS 1: MICRO-LEDGERS WORKSPACE */}
              {activeTab === "ledgers" && activeTenant && (
                <motion.div
                  key="ledgers-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Ledger Balances indicators */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { symbol: "$ USD", val: activeTenant.balances.USD, label: "Fiduciary Ledger", color: "text-[#00E5FF]" },
                      { symbol: "€ EUR", val: activeTenant.balances.EUR, label: "Sovereign Settlement", color: "text-sky-400" },
                      { symbol: "₿ BTC", val: activeTenant.balances.BTC, label: "Crypto Micro-reserves", color: "text-amber-400" },
                      { symbol: "◎ SOL", val: activeTenant.balances.SOL, label: "High-Frequency Streams", color: "text-emerald-400" },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-[#0F1116] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{item.label}</span>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className={`text-xl font-mono font-bold ${item.color}`}>
                            {item.symbol.includes("$") || item.symbol.includes("€") ? `${item.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : item.val}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono ml-1">{item.symbol}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* High speed sub-second ledger stream ticker and form */}
                  <div className="bg-[#0F1116] border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <div>
                        <h4 className="font-display font-semibold text-slate-100 text-sm tracking-wider">LIVE HIGH-SPEED TRANSACTION CHAIN</h4>
                        <p className="text-[10px] text-slate-500">Continuous sub-second micro-ledger entries feed ledger pipeline</p>
                      </div>
                      <span className="text-[10px] bg-[#00E5FF]/10 text-[#00E5FF] px-2 py-0.5 rounded font-mono animate-pulse">● FEED ONLINE</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="bg-[#12141B] text-slate-500 border border-slate-800 uppercase text-[9px] tracking-wider">
                            <th className="p-3">SEQUENCE ID</th>
                            <th className="p-3">TIMESTAMP</th>
                            <th className="p-3">ASSET IN/OUT</th>
                            <th className="p-3">VALUE</th>
                            <th className="p-3">ENVIRONMENT CO2</th>
                            <th className="p-3">SENTINEL SCAN</th>
                            <th className="p-3">HEALTH STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {activeTenant.transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="p-3 text-slate-400 font-semibold">{tx.id}</td>
                              <td className="p-3 text-slate-500">{new Date(tx.timestamp).toLocaleTimeString()}</td>
                              <td className="p-3">
                                <span className="bg-[#1C1F2E] text-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                                  {tx.reference}
                                </span>
                              </td>
                              <td className="p-3 text-[#00E5FF] font-bold">-{tx.amount} {tx.asset}</td>
                              <td className="p-3 text-slate-400">{tx.carbonFootprintKg} kg</td>
                              <td className="p-3 text-slate-400">Idx {(tx.anomalyScore * 100).toFixed(0)}%</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${tx.status === "COMMITTED" ? 'bg-emerald-500/10 text-emerald-400' : tx.status === "AWAITING_HUMAN_APPROVAL" ? 'bg-[#FF9100]/10 text-[#FF9100]' : 'bg-red-500/10 text-red-500'}`}>
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TABS 2: SOVEREIGN ASSET SENTINEL WORKSPACE */}
              {activeTab === "sentinel" && activeTenant && (
                <motion.div
                  key="sentinel-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Security Diagnostics Score */}
                    <div className="bg-[#0F1116] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                      <div>
                        <h4 className="font-display font-semibold text-slate-300 text-xs uppercase tracking-widest mb-3">Sovereign Guardian Health</h4>
                        <div className="flex items-center gap-4 mt-2">
                          <div className={`p-4 rounded-full ${systemStateOnSaffronLock ? 'bg-[#FF9100]/10 text-[#FF9100]' : 'bg-[#00E5FF]/10 text-[#00E5FF]'}`}>
                            <ShieldAlert className="w-10 h-10 animate-bounce" />
                          </div>
                          <div>
                            <span className="text-4xl font-display font-black text-slate-100">{activeTenant.securityState.securityScore}%</span>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase">INTEGRITY MULTIPLIER</p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 mt-4 pt-4 space-y-2 text-xs">
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-500">BASELINE LIMIT:</span>
                          <span className="text-[#00E5FF] font-semibold">${activeTenant.securityState.anomalyThreshold.toLocaleString()} USD</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-500">VECTOR DISP:</span>
                          <span className="text-slate-300">LOW DEVIATION</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-500">MUTATOR STATE:</span>
                          <span className="text-slate-300 capitalize">{activeTenant.securityState.monitoringStatus.replace("_", " ")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Threat / Vector scanning baseline logs */}
                    <div className="bg-[#0F1116] border border-slate-800 rounded-xl p-5 lg:col-span-2">
                      <h4 className="font-display font-semibold text-slate-300 text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-[#00E5FF]" /> SECURITY GUARDIAN COMPLIANCE LOGS
                      </h4>

                      <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                        {activeTenant.securityState.auditLogs.map((log, index) => (
                          <div key={index} className="bg-[#14161F] border border-slate-850 p-2.5 rounded-lg flex items-start gap-2.5 text-xs font-mono">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${log.severity === "CRITICAL" ? 'bg-red-500/10 text-red-400' : log.severity === "WARNING" ? 'bg-[#FF9100]/10 text-[#FF9100]' : 'bg-slate-800 text-slate-400'}`}>
                              {log.action}
                            </span>
                            <div className="flex-1">
                              <p className="text-slate-200">{log.message}</p>
                              {log.details && <p className="text-[10px] text-slate-500 mt-0.5">{log.details}</p>}
                            </div>
                            <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* STAGING AREA AND OVERSIGHT GATEKEEPER DISPLAY */}
                  <div className={`border rounded-xl p-6 transition-all duration-500 ${systemStateOnSaffronLock ? 'border-[#FF9100]/50 bg-[#1A100A]' : 'border-slate-800 bg-[#0F1116]'}`}>
                    <div className="flex items-center gap-3.5 mb-5 border-b pb-4 border-slate-800">
                      <div className={`p-2.5 rounded-lg ${systemStateOnSaffronLock ? 'bg-[#FF9100]/20 text-[#FF9100]' : 'bg-slate-800 text-slate-500'}`}>
                        <Lock className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-slate-100 text-sm tracking-widest">STAGING OVERSIGHT SENTINEL LOCKER</h4>
                        <p className="text-[10px] text-slate-400">Compliance gate holding anomalous transaction pipelines pending human keys</p>
                      </div>
                    </div>

                    {pendingStagingTxs.length > 0 ? (
                      <div className="space-y-4">
                        <div className="bg-[#241710]/50 border border-[#FF9100]/20 p-3.5 rounded-lg mb-4 text-xs leading-relaxed text-[#FFD099] font-mono flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-[#FF9100] shrink-0 mt-0.5" />
                          <span>
                            <strong>BEHAVIOR VECTOR EXCURSION DETECTED:</strong> Outbound transactional values exceeded the typical user footprint index constraint by 180%. Automatic staging lock initialized to avoid systemic corporate capital drain. Human cryptographical confirmation mandatory.
                          </span>
                        </div>

                        <div className="divide-y divide-slate-800 bg-[#0A0B0E] rounded-lg border border-slate-800">
                          {pendingStagingTxs.map((stgTx) => (
                            <div key={stgTx.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                              <div className="space-y-1.5 font-mono">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#FF9100] uppercase text-xs">LOCK ENVELOPE: {stgTx.id}</span>
                                  <span className="text-[10px] bg-slate-850 text-slate-400 px-1.5 py-0.5 rounded">REFERENCE: {stgTx.reference}</span>
                                </div>
                                <p className="text-xs text-slate-400">
                                  Routing payload: <span className="text-slate-100 font-bold">{stgTx.amount} {stgTx.asset}</span> | Est. Carbon: <span className="text-slate-100 font-bold">{stgTx.carbonFootprintKg} kgCO2</span>
                                </p>
                                <p className="text-[10px] text-slate-500 text-xs">Timestamp: {new Date(stgTx.timestamp).toLocaleString()} | Deviation: Index {stgTx.anomalyScore}</p>
                              </div>

                              <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                  onClick={() => handleStagingResolution(stgTx.id, false)}
                                  className="flex-1 md:flex-none border border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20 font-mono text-xs px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <X className="w-4 h-4" /> REJECT ATTEMPT
                                </button>
                                <button
                                  onClick={() => handleStagingResolution(stgTx.id, true)}
                                  className="flex-1 md:flex-none bg-[#FF9100] hover:bg-[#FF9100]/90 text-[#0a0b0e] font-mono text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Check className="w-4 h-4" /> AUTHORISE RELEASE
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center bg-slate-900/10 rounded-lg border border-slate-850">
                        <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <h5 className="font-mono font-medium text-xs text-slate-300">SYSTEM ENVELOPES COMPLIANT</h5>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">SovereignFin sentinel scanning background flows. No active locks.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TABS 3: DEBTRIX WORKSPACE */}
              {activeTab === "debtrix" && activeTenant && debtrixPlans && (
                <motion.div
                  key="debtrix-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Active corporate liabilities panel */}
                    <div className="bg-[#0F1116] border border-slate-800 rounded-xl p-5 lg:col-span-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-display font-semibold text-slate-300 text-xs uppercase tracking-widest mb-3">CONSOLIDATED LIABILITIES</h4>
                        <div className="space-y-2 mt-4">
                          {activeTenant.debts.map((debt) => (
                            <div key={debt.id} className="bg-[#14161F] p-3 rounded-lg border border-slate-850 font-mono flex justify-between items-center text-xs">
                              <div>
                                <span className="font-semibold text-slate-200 block">{debt.name}</span>
                                <span className="text-[10px] text-slate-500">APR: {debt.apr}% | Min: ${debt.minPayment}/mo</span>
                              </div>
                              <span className="text-slate-100 font-bold">${debt.balance.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Extra payment buffer controls */}
                      <div className="border-t border-slate-800 mt-4 pt-4">
                        <div className="flex justify-between items-center text-xs font-mono mb-2">
                          <span className="text-slate-500">DEBTRIX EXTRA BUFFER:</span>
                          <span className="text-[#00E5FF] font-bold">${extraBufferInput.toLocaleString()}/mo</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="30000"
                          step="500"
                          value={extraBufferInput}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setExtraBufferInput(val);
                            handleUpdateDebtrixBuffer(val);
                          }}
                          className="w-full bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
                        />
                        <span className="text-[9px] font-mono text-slate-550 block text-center mt-1">Adjust payoff momentum instantly with extra buffer capital allocation</span>
                      </div>
                    </div>

                    {/* Projections graph and comparisons */}
                    <div className="bg-[#0F1116] border border-slate-800 rounded-xl p-5 lg:col-span-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                        <div>
                          <h4 className="font-display font-semibold text-slate-300 text-xs uppercase tracking-widest">LIABILITY PATHWAY FORECASTS</h4>
                          <p className="text-[10px] text-slate-500">Simulating structural payoff velocities month-by-month</p>
                        </div>
                        <div className="flex border border-slate-800 rounded p-1 text-[11px] font-mono bg-[#111319]">
                          {(["AVALANCHE", "SNOWBALL"] as const).map(strat => (
                            <button
                              key={strat}
                              onClick={() => setActiveStrategy(strat)}
                              className={`px-2.5 py-1 rounded transition-all ${activeStrategy === strat ? 'bg-[#00E5FF]/10 text-[#00E5FF] font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                              {strat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                        <div className="bg-[#12141A] p-2 rounded border border-slate-850 font-mono">
                          <span className="text-[9px] text-slate-500 uppercase block">OPTIMAL TERM</span>
                          <span className="text-sm font-bold text-slate-100">{currentPlan?.monthsToDebtFree} Months</span>
                        </div>
                        <div className="bg-[#12141A] p-2 rounded border border-slate-850 font-mono">
                          <span className="text-[9px] text-slate-500 uppercase block">INTEREST PAID</span>
                          <span className="text-sm font-bold text-slate-100">${currentPlan?.totalInterestPaid.toLocaleString()}</span>
                        </div>
                        <div className="bg-[#12141A] p-2 rounded border border-emerald-850/50 bg-emerald-900/5 font-mono">
                          <span className="text-[9px] text-emerald-400 uppercase block">INTEREST SAVED</span>
                          <span className="text-sm font-bold text-emerald-400 font-bold">${currentPlan?.interestSaved.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Payoff curve */}
                      <div className="h-[210px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                            <defs>
                              <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                            <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: 9 }} />
                            <YAxis stroke="#6B7280" style={{ fontSize: 9 }} />
                            <RechartsTooltip contentStyle={{ backgroundColor: '#0F1116', border: '1px solid #374151', color: '#FFF', fontSize: 10 }} />
                            <Area type="monotone" dataKey="Remaining Debt" stroke="#00E5FF" strokeWidth={2} fillOpacity={1} fill="url(#colorDebt)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                  {/* STEP-BY-STEP PAYOFF ACTION STEPS */}
                  <div className="bg-[#0F1116] border border-[#00E5FF]/20 rounded-xl p-5">
                    <h4 className="font-display font-semibold text-slate-100 text-sm tracking-wider mb-3">DEBTRIX MULTI-TIER ACTION STEPS (ALGORITHMIC FLOW)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentPlan?.payoffOrder.map((debtName, idx) => (
                        <div key={idx} className="bg-[#141620] border border-slate-800 p-4 rounded-lg flex gap-3 relative overflow-hidden">
                          <div className="text-slate-500 font-display font-black text-3xl align-middle leading-none opacity-40 select-none">0{idx + 1}</div>
                          <div className="space-y-1 font-mono">
                            <span className="text-xs font-bold text-slate-200 block uppercase">{debtName}</span>
                            <p className="text-[10px] text-slate-400">
                              {idx === 0 
                                ? `🔥 MAXIMUM PAYDOWN PRIORITY: Channeling extra portfolio buffer of $${extraBufferInput.toLocaleString()}/mo onto this high APR trigger.`
                                : `🕒 STATUTORY MINIMUM COMMITMENT: Paying statutory minimum limit. Standing in stream queue.`}
                            </p>
                          </div>
                          {idx === 0 && <span className="absolute top-2 right-2 bg-rose-500/10 text-rose-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">HOT TARGET</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TABS 4: ECO COMPLIANCE WORKSPACE */}
              {activeTab === "ecology" && activeTenant && (
                <motion.div
                  key="ecology-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Footprint Indicator */}
                    <div className="bg-[#0F1116] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                      <div>
                        <h4 className="font-display font-semibold text-slate-300 text-xs uppercase tracking-widest mb-3">ENVIRONMENT CO2 FACTORING</h4>
                        <div className="space-y-4 mt-4">
                          <div className="bg-[#131720] p-4 rounded-lg border border-slate-850">
                            <span className="text-[10px] text-slate-500 block font-mono">CUMULATIVE TRANSACTION CARBON</span>
                            <span className="text-2xl font-bold block text-emerald-400 font-mono mt-1">
                              {activeTenant.ecoMetrics.totalCarbonKg.toLocaleString()} kgCO2
                            </span>
                          </div>
                          <div className="bg-[#131720] p-4 rounded-lg border border-emerald-900/30">
                            <span className="text-[10px] text-slate-500 block font-mono">ACTIVE GREEN TAX ADJUSTMENTS</span>
                            <span className="text-2xl font-bold block text-[#00E5FF] font-mono mt-1">
                              ${activeTenant.ecoMetrics.activeGreenTaxCreditUSD.toLocaleString()} USD
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 mt-4 pt-4 text-xs font-mono text-slate-500">
                        *Green adjustments are automatically updated each time raw cargo logistics parameters compile.
                      </div>
                    </div>

                    {/* Logistics CO2 Category distribution */}
                    <div className="bg-[#0F1116] border border-slate-800 rounded-xl p-5 lg:col-span-2">
                      <h4 className="font-display font-semibold text-slate-300 text-xs uppercase tracking-widest mb-3">CONSOLIDATION BY COMPLIANCE VECTOR</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        {/* Custom Barchart representing categories */}
                        <div className="h-[180px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={carbonPieData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                              <XAxis dataKey="name" style={{ fontSize: 8 }} stroke="#6B7280" />
                              <YAxis style={{ fontSize: 8 }} stroke="#6B7280" />
                              <Bar dataKey="value" fill="#00E5FF">
                                {carbonPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CO_COLORS[index % CO_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 text-xs font-mono">
                          {Object.keys(carbonPercentages).map((cat, idx) => (
                            <div key={cat} className="flex items-center justify-between p-2 rounded bg-[#14161F]">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CO_COLORS[idx % CO_COLORS.length] }} />
                                <span className="text-slate-300">{cat}</span>
                              </div>
                              <span className="text-[#00E5FF] font-bold">{carbonPercentages[cat]}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* CO2 Emissions coefficients and offset logistics metadata */}
                  <div className="bg-[#0F1116] border border-slate-800 rounded-xl p-5">
                    <h4 className="font-display font-semibold text-slate-100 text-sm tracking-wider mb-3">ECO LOGISTICS MULTIPLIERS BY CATEGORY INDEX</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-center text-xs font-mono">
                      {[
                        { category: "Logistics", mult: "1.85 kg / $", desc: "Freight & Carrier Lines" },
                        { category: "SaaS & Cloud", mult: "0.12 kg / $", desc: "Compute servers" },
                        { category: "Corporate Travel", mult: "0.65 kg / $", desc: "Global hotels & jets" },
                        { category: "Offices & Grid", mult: "0.45 kg / $", desc: "Workplace HVAC" },
                        { category: "Energy Systems", mult: "2.10 kg / $", desc: "Generator fuel flows" },
                        { category: "Standard Settlement", mult: "0.01 kg / $", desc: "Crypto/Fiat gas" }
                      ].map((multiplier, idx) => (
                        <div key={idx} className="bg-[#111319] border border-slate-850 p-3 rounded-lg flex flex-col justify-between">
                          <span className="text-slate-300 font-semibold uppercase text-[10px] text-left block">{multiplier.category}</span>
                          <span className="text-[#00E5FF] font-mono font-bold text-[13px] my-1 text-center block">{multiplier.mult}</span>
                          <span className="text-[9px] text-slate-500 text-left block leading-tight">{multiplier.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

      </main>

      {/* 3. TERMINAL AND REAL-TIME AI PORT CONSOLE (PERSISTENT FOOTER ROW) */}
      <footer className="mt-auto bg-[#0A0B0D] border-t border-slate-800">
        <div className="max-w-[1600px] w-full mx-auto p-4 lg:px-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* TERMINAL RUNTIME MONITOR (TELEMETRY LOGS) */}
          <div className="lg:col-span-1 bg-[#060709] border border-slate-850 rounded-xl p-4 flex flex-col h-[280px]">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-3">
              <span className="text-xs font-mono font-bold tracking-wider text-[#00E5FF] flex items-center gap-1.5 uppercase">
                <TerminalIcon className="w-4 h-4 animate-pulse text-[#00E5FF]" /> Ledger Telemetry Terminal
              </span>
              <div className="flex gap-1 text-[10px] font-mono">
                {(["all", "TRACK_1", "TRACK_2", "TRACK_3", "TRACK_4"] as const).map(flt => (
                  <button
                    key={flt}
                    onClick={() => setLogsFilter(flt)}
                    className={`px-1.5 py-0.5 rounded transition ${logsFilter === flt ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    {flt === "all" ? "ALL" : flt.split("_")[1] || flt}
                  </button>
                ))}
              </div>
            </div>

            {/* Rolling Terminal Output */}
            <div className="flex-1 overflow-y-auto text-[11px] font-mono pr-1 space-y-2">
              {telemetryLogs
                .filter(log => logsFilter === "all" || log.level === logsFilter)
                .map((log, idx) => {
                  const getLogBadgeStyle = () => {
                    const codeUpper = log.code.toUpperCase();
                    if (codeUpper.includes("ANOMALY") || codeUpper.includes("HOLD") || codeUpper.includes("LOCK") || codeUpper.includes("STAGING") || log.statusColor === "Saffron") {
                      return "text-[#FF9100] bg-[#FF9100]/10 border border-[#FF9100]/20 font-bold px-2 py-0.5 rounded text-[9px]";
                    }
                    if (codeUpper.includes("THREAT") || codeUpper.includes("REJECT") || codeUpper.includes("FAIL") || codeUpper.includes("CRITICAL") || log.statusColor === "Red") {
                      return "text-rose-400 bg-rose-500/10 border border-rose-500/20 font-bold px-2 py-0.5 rounded text-[9px]";
                    }
                    if (codeUpper.includes("MICRO_LEDGER") || codeUpper.includes("STREAM") || codeUpper.includes("TX") || log.statusColor === "Teal") {
                      return "text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/20 font-bold px-2 py-0.5 rounded text-[9px]";
                    }
                    return "text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded text-[9px]";
                  };

                  return (
                    <div key={idx} className="leading-6 flex items-center gap-2 py-0.5 hover:bg-slate-900/40 rounded px-1 transition-colors">
                      <span className="text-slate-600 font-sans tracking-tight shrink-0 select-none text-[10px]">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className={`${getLogBadgeStyle()} shrink-0 select-none min-w-[130px] text-center`}>
                        {log.code}
                      </span>
                      <span className="text-[#E0E2E7] select-all flex-1 truncate" title={log.message}>
                        {log.message}
                      </span>
                    </div>
                  );
                })}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* SECURE AI CONSULTING CHANNEL PANEL (GEMINI SUITE CO-PILOT) */}
          <div className="lg:col-span-2 bg-[#060709] border border-slate-850 rounded-xl p-4 flex flex-col h-[280px]">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-3">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-200 flex items-center gap-1.5 uppercase">
                <Cpu className="w-4 h-4 text-[#00E5FF]" /> Sovereign Oracle Inference Portal
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                SECURE CONTEXT: {activeTenant?.name || "AUTHENTICATING..."}
              </span>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 mb-3 text-xs">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-lg leading-relaxed ${msg.sender === "user" ? "bg-[#141822] text-[#00E5FF] border border-[#00E5FF]/20" : "bg-[#101217] text-slate-300 border border-slate-850"}`}>
                    <span className="text-[8px] font-mono block text-slate-500 uppercase tracking-wider mb-1">
                      {msg.sender === "user" ? "Systems Architect Auth" : "Autonomous FinAgent"}
                    </span>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#101217] text-slate-500 p-3 rounded-lg border border-slate-850 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF9100]" />
                    <span className="font-mono text-[10px]">GEMINI INTEL VECTOR INFERENCE LIVE...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Form */}
            <form onSubmit={handleSendAiMessage} className="flex gap-2 shrink-0">
              <input 
                type="text"
                placeholder="Ask SovereignFin AI to run financial optimization routines..."
                value={chatMessage}
                disabled={aiLoading}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-[#12141C] text-slate-100 border border-slate-850 focus:border-[#00E5FF] focus:outline-none rounded-lg px-3 py-2 text-xs"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 hover:border-[#00E5FF]/50 text-[#00E5FF] p-2 rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Outer credit line - keeping margins neat and professional */}
        <div className="text-center text-[10px] text-slate-600 font-mono py-2 bg-[#090A0D] border-t border-slate-900 leading-normal">
          CONFIDENTIAL FOR INTERNAL HUMAN AUDITING USE ONLY | MULTI-TENANT ISOLATION KEYED SHIELDS ACTIVE
        </div>
      </footer>

    </div>
  );
}
