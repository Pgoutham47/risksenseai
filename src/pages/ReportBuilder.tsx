import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Printer, Download, Building2, TrendingDown, TrendingUp, AlertTriangle, Shield, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { agencies, Agency, generateAgencyScoreHistory, decisionHistory, getBandColor, formatCurrency, alerts, Band } from '@/data/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const bandLabel: Record<Band, string> = { CLEAR: 'Clear', CAUTION: 'Caution', WARNING: 'Warning', RESTRICTED: 'Restricted', BLOCKED: 'Blocked' };

const ReportBuilder: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(agencies[0].id);
  const reportRef = useRef<HTMLDivElement>(null);

  const agency = agencies.find(a => a.id === selectedId) as Agency;
  const scoreHistory = generateAgencyScoreHistory(agency.trustScore, 90);
  const agencyAlerts = alerts.filter(a => a.agencyId === agency.id);
  const decisions = decisionHistory[agency.id] ?? [
    { timestamp: agency.lastUpdated, trustScore: agency.trustScore, band: agency.band, topSignals: agency.signals.filter(s => s.score >= 0.4).map(s => s.id), action: `Current band: ${agency.band}` },
  ];

  const radarData = agency.signals.map(s => ({ signal: s.name.split(' ').slice(0, 2).join(' '), value: Math.round(s.score * 100) }));

  const handlePrint = () => {
    window.print();
  };

  const criticalSignals = agency.signals.filter(s => s.status === 'CRITICAL');
  const elevatedSignals = agency.signals.filter(s => s.status === 'ELEVATED');

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
      {/* Controls — hidden in print */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-heading tracking-wide text-foreground">Report Builder</h2>
            <p className="text-xs text-muted-foreground">Generate printable risk reports for any agency</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {agencies.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Printable Report */}
      <div ref={reportRef} className="space-y-6 print:space-y-4">
        {/* Report Header */}
        <Card className="print:shadow-none print:border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary print:text-black" />
                  <span className="text-xs font-mono text-muted-foreground tracking-widest">RISKSENSE AI — AGENCY RISK REPORT</span>
                </div>
                <h1 className="text-2xl font-heading text-foreground">{agency.name}</h1>
                <p className="text-sm text-muted-foreground">{agency.id} · {agency.cohort} · Tenure: {agency.tenure} days</p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 justify-end">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getBandColor(agency.band) }} />
                  <span className="text-sm font-semibold" style={{ color: getBandColor(agency.band) }}>{bandLabel[agency.band]}</span>
                </div>
                <p className="text-3xl font-heading text-foreground">{agency.trustScore}</p>
                <p className="text-[10px] text-muted-foreground">TRUST SCORE</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
          {[
            { label: 'Credit Limit', value: formatCurrency(agency.creditLimit), icon: Building2 },
            { label: 'Outstanding', value: formatCurrency(agency.outstandingBalance), icon: TrendingDown },
            { label: 'Utilization', value: `${agency.utilization}%`, icon: TrendingUp },
            { label: 'Chargeback Phase', value: `Phase ${agency.chargebackPhase}`, icon: AlertTriangle },
          ].map(kpi => (
            <Card key={kpi.label} className="print:shadow-none">
              <CardContent className="p-4 flex items-center gap-3">
                <kpi.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-lg font-semibold text-foreground">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Score History + Radar */}
        <div className="grid md:grid-cols-3 gap-4 print:grid-cols-3">
          <Card className="md:col-span-2 print:col-span-2 print:shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trust Score History (90 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52 print:h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval={14} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="print:shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Signal Footprint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52 print:h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-border" />
                    <PolarAngleAxis dataKey="signal" tick={{ fontSize: 9 }} className="text-muted-foreground" />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Signal Breakdown */}
        <Card className="print:shadow-none print:break-inside-avoid">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Signal Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Signal</TableHead>
                  <TableHead className="text-xs">Score</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Fraud Type</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell print:table-cell">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agency.signals.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-medium">{s.id} — {s.name}</TableCell>
                    <TableCell className="text-xs font-mono">{(s.score * 100).toFixed(0)}%</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        s.status === 'CRITICAL' ? 'bg-destructive/10 text-destructive' :
                        s.status === 'ELEVATED' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                        'bg-muted text-muted-foreground'
                      }`}>{s.status}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.fraudType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell print:table-cell max-w-[200px] truncate">{s.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {criticalSignals.length > 0 && (
              <p className="mt-3 text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {criticalSignals.length} critical signal{criticalSignals.length > 1 ? 's' : ''} require immediate attention.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Decision Timeline */}
        <Card className="print:shadow-none print:break-inside-avoid">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Decision Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-4 border-l-2 border-border ml-2">
              {decisions.map((d, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[1.85rem] top-0.5 w-3 h-3 rounded-full border-2 border-background" style={{ backgroundColor: getBandColor(d.band) }} />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{d.timestamp}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${getBandColor(d.band)}20`, color: getBandColor(d.band) }}>
                        {bandLabel[d.band]} · {d.trustScore}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{d.action}</p>
                    {d.topSignals.length > 0 && (
                      <p className="text-[10px] text-muted-foreground">Top signals: {d.topSignals.join(', ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        {agencyAlerts.length > 0 && (
          <Card className="print:shadow-none print:break-inside-avoid">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts ({agencyAlerts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Severity</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencyAlerts.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          a.severity === 'CRITICAL' ? 'bg-destructive/10 text-destructive' :
                          a.severity === 'WARNING' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                          'bg-muted text-muted-foreground'
                        }`}>{a.severity}</span>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{a.type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">{a.description}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{a.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground">RiskSense AI · Confidential · Generated {new Date().toISOString().slice(0, 16).replace('T', ' ')}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportBuilder;
