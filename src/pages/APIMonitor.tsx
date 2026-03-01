import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, RefreshCw, Server, AlertCircle,
    CheckCircle2, Clock, MapPin, Plane, Info, Copy, Check
} from 'lucide-react';
import { PageTransition } from '@/components/AnimatedComponents';

const APIMonitor: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!data?.data) return;
        navigator.clipboard.writeText(JSON.stringify(data.data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const fetchApiData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/tbo/flight-search');
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            const result = await response.json();

            if (result.status === 'error') {
                throw new Error(result.message);
            }

            setData(result);
            setLastRefreshed(new Date());
        } catch (err: any) {
            setError(err.message || 'Failed to fetch API data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApiData();
    }, []);

    return (
        <PageTransition>
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Server className="w-6 h-6 text-accent" />
                            TBO Flight API Monitor
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Raw view of the upstream JSON response payload directly from the UAT environment.
                        </p>
                    </div>

                    <button
                        onClick={fetchApiData}
                        disabled={loading}
                        className="btn-primary flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Fetching Payload...' : 'Test Connection'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Status Panel */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="panel-glass p-6">
                            <h3 className="font-heading text-sm font-semibold tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Connection Status
                            </h3>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                    <RefreshCw className="w-8 h-8 text-accent animate-spin" />
                                    <p className="text-sm text-muted-foreground font-mono">Attempting connection to TBO...</p>
                                </div>
                            ) : error ? (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-medium text-destructive">Connection Failed</h4>
                                            <p className="text-xs text-destructive/80 mt-1 font-mono break-all">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                                        <span className="text-sm text-muted-foreground">Status</span>
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <span className="text-sm font-medium text-emerald-500">200 OK</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                                        <span className="text-sm text-muted-foreground">Source</span>
                                        {data?.source === 'live_uat' ? (
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                Live UAT Environment
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                Simulator Fallback
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                                        <span className="text-sm text-muted-foreground">Trace ID</span>
                                        <span className="text-xs font-mono text-foreground truncate max-w-[150px]">
                                            {data?.data?.Response?.TraceId || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                                        <span className="text-sm text-muted-foreground">Last Ping</span>
                                        <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                            {lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Never'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="panel-glass p-6 bg-accent/5 border-accent/20">
                            <h3 className="font-heading text-sm font-semibold tracking-wider text-accent mb-3 flex items-center gap-2">
                                <Info className="w-4 h-4" /> How it Works
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                The TBO UAT search endpoint can take up to 90 seconds to reply. This console uses a 15-second timeout for quick UX. If the server is slow, this monitor will show the fallback simulator payload used to keep the RiskPulse Pipeline functional.
                            </p>
                        </div>
                    </div>

                    {/* JSON Payload View */}
                    <div className="md:col-span-2 panel-glass flex flex-col overflow-hidden h-[600px]">
                        <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between shrink-0">
                            <h3 className="font-heading text-sm font-semibold tracking-wider text-foreground flex items-center gap-2">
                                Search Response JSON
                            </h3>
                            {data && data.data?.Response?.Origin && (
                                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono bg-background/50 px-3 py-1.5 rounded border border-border">
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {data.data.Response.Origin}</span>
                                    <Plane className="w-3 h-3" />
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {data.data.Response.Destination}</span>
                                </div>
                            )}
                            {data && (
                                <button
                                    onClick={handleCopy}
                                    className="ml-auto text-xs flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/50"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied!' : 'Copy JSON'}
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto bg-[#0d1117] p-4 p-scrollbar">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="flex flex-col gap-2 items-center opacity-50">
                                        <div className="w-32 h-2 bg-muted rounded animate-pulse"></div>
                                        <div className="w-48 h-2 bg-muted rounded animate-pulse"></div>
                                        <div className="w-24 h-2 bg-muted rounded animate-pulse"></div>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground/50 font-mono text-sm">
                                    Waiting for valid payload...
                                </div>
                            ) : data ? (
                                <pre className="text-[11px] sm:text-xs font-mono text-emerald-400 select-text">
                                    {JSON.stringify(data.data, null, 2)}
                                </pre>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default APIMonitor;
