import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient.js';
import {
  Sliders,
  Server,
  Heart,
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Check,
  Power,
  Clock,
  ShieldCheck,
  ChevronRight,
  Globe,
  Coins,
  Settings,
} from 'lucide-react';

interface GatewayConfig {
  gateway: string;
  name: string;
  enabled: boolean;
  routingPriority: number;
  failoverPriority: number;
  supportedCurrencies: string[];
  supportedCountries: string[];
  paymentMethods: string[];
}

interface GatewayHealth {
  gateway: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  lastChecked: string;
  consecutiveFailures: number;
  latencyMs?: number;
  uptimePercentage?: number;
}

interface SLOMetric {
  metric: string;
  actual: number;
  target: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  errorBudgetRemaining: number;
}

interface HistoricalEvent {
  timestamp: string;
  latencyMs: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
}

export const GatewayAdminPanel: React.FC = () => {
  const [configs, setConfigs] = useState<GatewayConfig[]>([]);
  const [healthStatus, setHealthStatus] = useState<Record<string, GatewayHealth>>({});
  const [activeGateway, setActiveGateway] = useState<string>('STRIPE');
  const [sloMetrics, setSloMetrics] = useState<SLOMetric[]>([]);
  const [history, setHistory] = useState<HistoricalEvent[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [poundingCheck, setPoundingCheck] = useState<string | null>(null);
  const [submittingConfig, setSubmittingConfig] = useState(false);
  const [errorInput, setErrorInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state form
  const [editingGateway, setEditingGateway] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoutingPriority, setEditRoutingPriority] = useState(5);
  const [editFailoverPriority, setEditFailoverPriority] = useState(5);
  const [editCurrencies, setEditCurrencies] = useState('');
  const [editCountries, setEditCountries] = useState('');

  const fetchConfigsAndHealth = async () => {
    setLoading(true);
    try {
      // 1. Fetch live configs list
      const configRes = await apiClient.get('/admin/payments/gateways/config');
      setConfigs(configRes.data);

      // 2. Fetch live global health reports
      const healthRes = await apiClient.get('/admin/payments/gateways/health');
      const healthMap: Record<string, GatewayHealth> = {};
      healthRes.data.gateways.forEach((h: any) => {
        healthMap[h.gateway] = h;
      });
      setHealthStatus(healthMap);

      // Default selected gateway to first config if stripe isn't found
      if (configRes.data.length > 0) {
        const hasStripe = configRes.data.some((g: any) => g.gateway === 'STRIPE');
        if (!hasStripe && activeGateway === 'STRIPE') {
          setActiveGateway(configRes.data[0].gateway);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorInput('Failed to synchronise gateway routing configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchGatewayTelemetry = async (gatewayName: string) => {
    try {
      // 1. Fetch SLOs
      const sloRes = await apiClient.get(`/admin/payments/gateways/slo/${gatewayName}?timeframe=30`);
      setSloMetrics(sloRes.data.slos || []);

      // 2. Fetch History Timeline
      const historyRes = await apiClient.get(`/admin/payments/gateways/health/history/${gatewayName}?timeframe=30`);
      setHistory(historyRes.data.history || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConfigsAndHealth();
  }, []);

  useEffect(() => {
    if (activeGateway) {
      fetchGatewayTelemetry(activeGateway);
    }
  }, [activeGateway]);

  const handleToggleState = async (cfg: GatewayConfig) => {
    try {
      const targetState = !cfg.enabled;
      await apiClient.post(
        '/admin/payments/gateways/config',
        {
          gateway: cfg.gateway,
          enabled: targetState,
        }
      );
      setSuccessMsg(`Smart Router has updated state of ${cfg.gateway} to ${targetState ? 'ENABLED' : 'DISABLED'}`);
      fetchConfigsAndHealth();
    } catch (err: any) {
      console.error(err);
      setErrorInput(`Could not toggle status of ${cfg.gateway}: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDiagnosePing = async (gatewayName: string) => {
    setPoundingCheck(gatewayName);
    setErrorInput('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post('/admin/payments/gateways/health/check', { gateway: gatewayName });
      setSuccessMsg(`${gatewayName} diagnostics completed! Latency: ${res.data.latencyMs}ms. Health: ${res.data.status}`);
      fetchConfigsAndHealth();
      if (activeGateway === gatewayName) {
        fetchGatewayTelemetry(gatewayName);
      }
    } catch (err: any) {
      console.error(err);
      setErrorInput(`Diagnostic verification of ${gatewayName} returned failure: ${err.response?.data?.message || err.message}`);
    } finally {
      setPoundingCheck(null);
    }
  };

  const startEditing = (cfg: GatewayConfig) => {
    setEditingGateway(cfg.gateway);
    setEditName(cfg.name);
    setEditRoutingPriority(cfg.routingPriority);
    setEditFailoverPriority(cfg.failoverPriority);
    setEditCurrencies(cfg.supportedCurrencies.join(', '));
    setEditCountries(cfg.supportedCountries.join(', '));
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGateway) return;

    setSubmittingConfig(true);
    setErrorInput('');
    setSuccessMsg('');

    try {
      const formattedCurrencies = editCurrencies
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length > 0);
      
      const formattedCountries = editCountries
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length > 0);

      await apiClient.post(
        '/admin/payments/gateways/config',
        {
          gateway: editingGateway,
          name: editName,
          routingPriority: Number(editRoutingPriority),
          failoverPriority: Number(editFailoverPriority),
          supportedCurrencies: formattedCurrencies,
          supportedCountries: formattedCountries,
        }
      );

      setSuccessMsg(`Custom routing values for ${editingGateway} persistent in Database.`);
      setEditingGateway(null);
      fetchConfigsAndHealth();
    } catch (err: any) {
      console.error(err);
      setErrorInput(err.response?.data?.message || 'Failed to submit dynamic gateway configuration properties.');
    } finally {
      setSubmittingConfig(false);
    }
  };

  const getHealthIndicatorStyles = (status: 'GREEN' | 'YELLOW' | 'RED' | undefined) => {
    if (status === 'GREEN') {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        glow: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse',
        label: 'Healthy',
      };
    } else if (status === 'YELLOW') {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-100',
        glow: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse',
        label: 'Degraded',
      };
    } else {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-100',
        glow: 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse',
        label: 'Outage / Failing',
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Errors */}
      {errorInput && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs sm:text-sm">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Governance Exception: </span>
            {errorInput}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Router Dynamic Update: </span>
            {successMsg}
          </div>
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Registered Gateways List & Routing Control */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-500" />
                  Operational Smart Router Controllers
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  List active provider integrations, adjust sorting weights dynamically, and enforce global country policies.
                </p>
              </div>
              <button
                onClick={fetchConfigsAndHealth}
                disabled={loading}
                className="p-1.5 px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors rounded-lg flex items-center gap-1.5 text-xs text-slate-600 font-bold"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Sync Router Specs
              </button>
            </div>

            <div className="space-y-4">
              {configs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed rounded-xl">
                  <Server className="h-10 w-10 text-slate-350 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">Wait... Scanning connected provider modules</p>
                </div>
              ) : (
                configs.map((cfg) => {
                  const health = healthStatus[cfg.gateway];
                  const stateStyles = getHealthIndicatorStyles(health?.status);
                  
                  return (
                    <div
                      key={cfg.gateway}
                      className={`relative border p-4.5 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer ${
                        activeGateway === cfg.gateway 
                          ? 'bg-slate-50 border-indigo-300 ring-1 ring-indigo-100 shadow-xs' 
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                      onClick={() => setActiveGateway(cfg.gateway)}
                    >
                      {/* Gateway Badge and Health status */}
                      <div className="space-y-2 max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-850 tracking-tight text-sm text-[14px]">
                            {cfg.name}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                            {cfg.gateway}
                          </span>
                        </div>

                        {/* Country limits / Currency policies */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Coins className="h-3 w-3 text-slate-400" />
                            Currencies: <span className="font-semibold text-slate-700">{cfg.supportedCurrencies.join(', ') || 'Global'}</span>
                          </span>
                          {cfg.supportedCountries.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3 text-slate-400" />
                              Countries: <span className="font-semibold text-slate-700">{cfg.supportedCountries.join(', ')}</span>
                            </span>
                          )}
                        </div>

                        {/* Router Priority weights */}
                        <div className="flex gap-4 text-[11px]">
                          <div>
                            <span className="text-slate-400">Router sorting score: </span>
                            <span className="font-bold text-indigo-600">{cfg.routingPriority} / 10</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Failover route score: </span>
                            <span className="font-bold text-amber-600">{cfg.failoverPriority} / 10</span>
                          </div>
                        </div>
                      </div>

                      {/* Operation levers */}
                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                        {/* Live latency signal icon */}
                        <div className={`p-1.5 px-2.5 border rounded-lg flex items-center gap-2 text-xs font-semibold ${stateStyles.bg}`}>
                          <div className={`h-2 w-2 rounded-full ${stateStyles.glow}`} />
                          <span className="font-bold">{stateStyles.label}</span>
                          {health?.latencyMs !== undefined && (
                            <span className="border-l border-slate-200 pl-1.5 font-mono text-[10px]">{health.latencyMs}ms</span>
                          )}
                        </div>

                        {/* Enable/Disable Toggle button */}
                        <button
                          onClick={() => handleToggleState(cfg)}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                            cfg.enabled 
                              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={cfg.enabled ? 'Disable Gateway Connection' : 'Enable Gateway Connection'}
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span>{cfg.enabled ? 'Disable' : 'Enable'}</span>
                        </button>

                        {/* Trigger ping diagnostics */}
                        <button
                          onClick={() => handleDiagnosePing(cfg.gateway)}
                          disabled={poundingCheck === cfg.gateway}
                          className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors text-slate-650 rounded-lg"
                          title="Trigger Live Ping Diagnostics"
                        >
                          <Activity className={`h-3.5 w-3.5 ${poundingCheck === cfg.gateway ? 'animate-bounce' : ''}`} />
                        </button>

                        {/* Edit properties button */}
                        <button
                          onClick={() => startEditing(cfg)}
                          className="p-1.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 transition-colors text-indigo-650 rounded-lg"
                          title="Edit routing attributes"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* EDIT CONTEXT PROPERTY FORM */}
          {editingGateway && (
            <form onSubmit={handleSaveConfig} className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4.5 w-4.5 text-indigo-500" />
                  <span className="text-sm font-extrabold text-slate-800">Assign Router Attributes: {editingGateway}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingGateway(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase text-[10px]">Logical Label</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded focus:border-indigo-400 focus:bg-white text-slate-700 outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold uppercase text-[10px]">Main Sorting Priority</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editRoutingPriority}
                      onChange={(e) => setEditRoutingPriority(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-700 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-500 font-bold uppercase text-[10px]">Failover Rank Score</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editFailoverPriority}
                      onChange={(e) => setEditFailoverPriority(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-700 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase text-[10px] flex items-center justify-between">
                    <span>Currency Routing Whitelist</span>
                    <span className="text-[9px] text-slate-400 normal-case font-normal">(Comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INR, USD"
                    value={editCurrencies}
                    onChange={(e) => setEditCurrencies(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold uppercase text-[10px] flex items-center justify-between">
                    <span>Country Restrictions</span>
                    <span className="text-[9px] text-slate-400 normal-case font-normal">(Empty equals all country limits bypassed)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IN, US"
                    value={editCountries}
                    onChange={(e) => setEditCountries(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingConfig}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {submittingConfig ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Save Router Configuration
                </button>
              </div>
            </form>
          )}

          {/* TELEMETRY ACTIVE TIMELINE GRAPH */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-500" />
                Live Status Outage & History Timeline: {activeGateway}
              </h3>
              <p className="text-xs text-slate-400">Recorded diagnostic checkpoints captured consecutively over the past 30 days timeframe limit</p>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                No telemetry signals collected for {activeGateway}. Trigger manual check to begin auditing.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Horizontal Tick marks representative of healthy vs unhealthy */}
                <div className="flex flex-wrap gap-1.5 justify-start p-3 bg-slate-50 rounded-xl border border-slate-150">
                  {history.map((tick, idx) => {
                    let colorClass = 'bg-emerald-500';
                    let label = 'Healthy check';
                    if (tick.status === 'YELLOW') {
                      colorClass = 'bg-amber-400';
                      label = 'Degraded latency';
                    } else if (tick.status === 'RED') {
                      colorClass = 'bg-rose-500';
                      label = 'Full connection outage';
                    }
                    
                    return (
                      <div
                        key={idx}
                        className={`h-4.5 w-2 sm:h-5 sm:w-2.5 rounded-sm hover:-translate-y-0.5 hover:scale-110 cursor-pointer transition-all ${colorClass}`}
                        title={`${new Date(tick.timestamp).toLocaleString()} - ${label} (${tick.latencyMs}ms)`}
                      />
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold px-2">
                  <span>30 Days Ago</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Healthy
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-400" /> Degraded
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> Webhook Outage
                    </span>
                  </div>
                  <span>Today</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Service Level Objectives (SLO) Metrics visualizers */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 h-full">
            <div>
              <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                SLO Error Budget remaining
              </h3>
              <p className="text-xs text-slate-400">
                Service Level Objectives mapped according to customer payment success ratios.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {sloMetrics.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Select a gateway segment to load structural agreement indicators.
                </div>
              ) : (
                sloMetrics.map((slo) => {
                  const errorBudget = slo.errorBudgetRemaining;
                  const isHealthy = slo.status === 'PASS';
                  const isWarning = slo.status === 'WARN';

                  let budgetBarColor = 'bg-emerald-500';
                  let budgetBgColor = 'text-emerald-700 bg-emerald-50';
                  if (errorBudget < 30) {
                    budgetBarColor = 'bg-rose-500';
                    budgetBgColor = 'text-rose-750 bg-rose-50';
                  } else if (errorBudget < 70) {
                    budgetBarColor = 'bg-amber-400';
                    budgetBgColor = 'text-amber-700 bg-amber-50';
                  }

                  return (
                    <div key={slo.metric} className="py-4.5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-slate-800 text-xs sm:text-sm block leading-snug">
                            {slo.metric}
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-400 font-semibold block mt-0.5">
                            Target Threshold: {slo.target}%
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold tracking-tight ${
                          isHealthy 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : isWarning 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isHealthy ? 'PASS' : isWarning ? 'WARNING' : 'FAILING'}
                        </span>
                      </div>

                      {/* Display Gauge Actual Values vs Target */}
                      <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] font-semibold text-slate-600">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Actual</span>
                          <span className="text-slate-800 font-bold">{slo.actual.toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Target</span>
                          <span className="text-slate-500">{slo.target.toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Variance</span>
                          <span className={`font-bold ${slo.actual >= slo.target ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {(slo.actual - slo.target).toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      {/* Error budget indicator slider bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400 uppercase">Error Budget Remaining</span>
                          <span className={`px-1 rounded ${budgetBgColor}`}>{errorBudget.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-150">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${budgetBarColor}`}
                            style={{ width: `${Math.max(0, Math.min(100, errorBudget))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Summary card metadata */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs text-slate-600">
              <h4 className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                Agreement Summary
              </h4>
              <p className="leading-relaxed text-[11px] text-slate-500 font-medium">
                Our dynamic failover system triggers rerouting when error budgets drop below a <strong>30% security buffer</strong>, isolating degrading routers within <strong>150ms</strong>.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
