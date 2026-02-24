import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ArrowUpDown, LayoutGrid, List, AlertTriangle, TrendingDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { agencies, getBandClass, getBorderBandClass, formatCurrency, generateAgencyScoreHistory, type Band, type Agency } from '@/data/mockData';
import { PageTransition } from '@/components/AnimatedComponents';
import EmptyState from '@/components/EmptyState';

type SortKey = 'trustScore' | 'outstandingBalance' | 'lastUpdated';
type ViewMode = 'hybrid' | 'grid' | 'table';

// Mini sparkline SVG
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const h = 20, w = 56;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Highlight matched text
const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/30 text-accent-foreground rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
};

// Score ring for cards
const ScoreRing: React.FC<{ score: number; band: Band; size?: number }> = ({ score, band, size = 56 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const bandColorMap: Record<Band, string> = {
    CLEAR: 'hsl(var(--band-clear))',
    CAUTION: 'hsl(var(--band-caution))',
    WARNING: 'hsl(var(--band-warning))',
    RESTRICTED: 'hsl(var(--band-restricted))',
    BLOCKED: 'hsl(var(--band-blocked))',
  };
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={bandColorMap[band]} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="fill-foreground font-mono text-xs font-bold">{score}</text>
    </svg>
  );
};

// Flagged agency card
const FlaggedCard: React.FC<{ agency: Agency; search: string; sparkData: number[]; onClick: () => void }> = ({ agency, search, sparkData, onClick }) => {
  const bandColorMap: Record<Band, string> = {
    CLEAR: 'hsl(var(--band-clear))',
    CAUTION: 'hsl(var(--band-caution))',
    WARNING: 'hsl(var(--band-warning))',
    RESTRICTED: 'hsl(var(--band-restricted))',
    BLOCKED: 'hsl(var(--band-blocked))',
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="panel-glass p-4 cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <ScoreRing score={agency.trustScore} band={agency.band} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-foreground truncate">
              <HighlightText text={agency.name} query={search} />
            </span>
            <span className={getBandClass(agency.band)}>{agency.band}</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            <HighlightText text={agency.id} query={search} />
          </span>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>Limit {formatCurrency(agency.creditLimit)}</span>
            <span className="text-foreground font-medium">{formatCurrency(agency.outstandingBalance)} out</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <AlertTriangle className="w-3 h-3" />
          {agency.topSignal}
        </div>
        <Sparkline data={sparkData} color={bandColorMap[agency.band]} />
      </div>
      <div className="mt-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${agency.utilization}%`,
              background: agency.utilization > 70 ? 'hsl(var(--band-restricted))' : agency.utilization > 50 ? 'hsl(var(--band-caution))' : 'hsl(var(--band-clear))'
            }} />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">{agency.utilization}%</span>
        </div>
      </div>
    </motion.div>
  );
};

// Filter pill
const FilterPill: React.FC<{ label: string; active: boolean; onClick: () => void; color?: string }> = ({ label, active, onClick, color }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all ${
      active
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
    }`}
    style={active && color ? { background: color, borderColor: color } : undefined}
  >
    {label}
  </motion.button>
);

const AgencyDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const initialBand = searchParams.get('band');
  const [bandFilter, setBandFilter] = useState<'ALL' | Band>(
    initialBand && ['CLEAR', 'CAUTION', 'WARNING', 'RESTRICTED', 'BLOCKED'].includes(initialBand)
      ? initialBand as Band : 'ALL'
  );
  const [tenureFilter, setTenureFilter] = useState<'ALL' | 'NEW' | 'ESTABLISHED'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('trustScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('hybrid');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const perPage = 20;

  // Simulate loading
  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Generate sparkline data per agency (memoized)
  const sparkDataMap = useMemo(() => {
    const map: Record<string, number[]> = {};
    agencies.forEach(a => {
      const hist = generateAgencyScoreHistory(a.trustScore, 30);
      map[a.id] = hist.map(h => h.score);
    });
    return map;
  }, []);

  const filtered = useMemo(() => {
    let list = [...agencies];
    if (search) list = list.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()));
    if (bandFilter !== 'ALL') list = list.filter(a => a.band === bandFilter);
    if (tenureFilter === 'NEW') list = list.filter(a => a.tenure < 90);
    if (tenureFilter === 'ESTABLISHED') list = list.filter(a => a.tenure >= 90);
    list.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return 0;
    });
    return list;
  }, [search, bandFilter, tenureFilter, sortKey, sortDir]);

  const flaggedAgencies = useMemo(() => filtered.filter(a => ['BLOCKED', 'RESTRICTED'].includes(a.band)), [filtered]);
  const tableAgencies = useMemo(() => {
    const list = viewMode === 'hybrid' ? filtered.filter(a => !['BLOCKED', 'RESTRICTED'].includes(a.band)) : filtered;
    return list;
  }, [filtered, viewMode]);

  const paged = tableAgencies.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(tableAgencies.length / perPage);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }, [sortKey]);

  const bandColorMap: Record<Band, string> = {
    CLEAR: 'hsl(var(--band-clear))',
    CAUTION: 'hsl(var(--band-caution))',
    WARNING: 'hsl(var(--band-warning))',
    RESTRICTED: 'hsl(var(--band-restricted))',
    BLOCKED: 'hsl(var(--band-blocked))',
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-5">
          <div className="flex gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse flex-1 max-w-[200px]" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />)}
          </div>
          <div className="panel p-0">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 border-b border-border/50 bg-muted/30 animate-pulse" />)}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Search + Filters */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name or ID..."
                className="w-full bg-card border border-border rounded-lg pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-shadow"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* View mode toggle */}
            <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
              {([['hybrid', 'Hybrid'], ['grid', 'Grid'], ['table', 'Table']] as [ViewMode, string][]).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                    viewMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode === 'grid' ? <LayoutGrid className="w-3.5 h-3.5" /> : mode === 'table' ? <List className="w-3.5 h-3.5" /> : label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mr-1">Band</span>
            <FilterPill label="All" active={bandFilter === 'ALL'} onClick={() => { setBandFilter('ALL'); setPage(1); }} />
            {(['CLEAR', 'CAUTION', 'WARNING', 'RESTRICTED', 'BLOCKED'] as Band[]).map(b => (
              <FilterPill key={b} label={b} active={bandFilter === b} onClick={() => { setBandFilter(b); setPage(1); }} color={bandFilter === b ? bandColorMap[b] : undefined} />
            ))}
            <div className="w-px h-5 bg-border mx-1" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mr-1">Tenure</span>
            <FilterPill label="All" active={tenureFilter === 'ALL'} onClick={() => { setTenureFilter('ALL'); setPage(1); }} />
            <FilterPill label="New (<90d)" active={tenureFilter === 'NEW'} onClick={() => { setTenureFilter('NEW'); setPage(1); }} />
            <FilterPill label="Established" active={tenureFilter === 'ESTABLISHED'} onClick={() => { setTenureFilter('ESTABLISHED'); setPage(1); }} />
          </div>

          {/* Result count */}
          <div className="text-[11px] text-muted-foreground">
            {filtered.length} agencies found
            {search && <span> matching "<span className="text-foreground font-medium">{search}</span>"</span>}
          </div>
        </motion.div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <EmptyState
            type={search ? 'search' : 'filter'}
            title={search ? `No agencies matching "${search}"` : 'No agencies in this filter'}
            description={search ? 'Try a different name or ID, or clear your search.' : 'Adjust your band or tenure filters to see results.'}
            action={{ label: 'Clear Filters', onClick: () => { setSearch(''); setBandFilter('ALL'); setTenureFilter('ALL'); } }}
          />
        )}

        {/* Flagged Cards — only in hybrid/grid mode */}
        {filtered.length > 0 && (viewMode === 'hybrid' || viewMode === 'grid') && flaggedAgencies.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Flagged Agencies</h3>
              <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">{flaggedAgencies.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence>
                {flaggedAgencies.map(a => (
                  <FlaggedCard key={a.id} agency={a} search={search} sparkData={sparkDataMap[a.id]} onClick={() => navigate(`/agency/${a.id}`)} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Grid view for non-flagged */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <AnimatePresence>
              {tableAgencies.map(a => (
                <FlaggedCard key={a.id} agency={a} search={search} sparkData={sparkDataMap[a.id]} onClick={() => navigate(`/agency/${a.id}`)} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Table — in hybrid or table mode */}
        {(viewMode === 'hybrid' || viewMode === 'table') && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            {viewMode === 'hybrid' && (
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">All Other Agencies</h3>
                <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-medium">{tableAgencies.length}</span>
              </div>
            )}
            <div className="panel overflow-hidden overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-secondary/50 text-muted-foreground sticky top-0 z-10">
                    <th className="text-left py-3 px-4 font-medium">Agency</th>
                    <th className="text-center py-3 px-4 font-medium cursor-pointer select-none" onClick={() => toggleSort('trustScore')}>
                      <span className="inline-flex items-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="text-center py-3 px-4 font-medium">Trend</th>
                    <th className="text-center py-3 px-4 font-medium">Band</th>
                    <th className="text-right py-3 px-4 font-medium">Credit</th>
                    <th className="text-right py-3 px-4 font-medium cursor-pointer select-none" onClick={() => toggleSort('outstandingBalance')}>
                      <span className="inline-flex items-center gap-1">Outstanding <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="text-center py-3 px-4 font-medium">Util</th>
                    <th className="text-left py-3 px-4 font-medium">Signal</th>
                    <th className="text-center py-3 px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paged.map((a, i) => (
                      <motion.tr
                        key={a.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className={`${getBorderBandClass(a.band)} border-b border-border/50 premium-row cursor-pointer`}
                        onClick={() => navigate(`/agency/${a.id}`)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-foreground font-medium"><HighlightText text={a.name} query={search} /></span>
                            <span className="font-mono text-[10px] text-muted-foreground"><HighlightText text={a.id} query={search} /></span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4 font-mono text-foreground font-semibold">{a.trustScore}</td>
                        <td className="text-center py-3 px-4">
                          <Sparkline data={sparkDataMap[a.id]} color={bandColorMap[a.band]} />
                        </td>
                        <td className="text-center py-3 px-4"><span className={getBandClass(a.band)}>{a.band}</span></td>
                        <td className="text-right py-3 px-4 font-mono text-foreground">{formatCurrency(a.creditLimit)}</td>
                        <td className="text-right py-3 px-4 font-mono text-foreground">{formatCurrency(a.outstandingBalance)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden w-12">
                              <div className="h-full rounded-full" style={{
                                width: `${a.utilization}%`,
                                background: a.utilization > 70 ? 'hsl(var(--band-restricted))' : a.utilization > 50 ? 'hsl(var(--band-caution))' : 'hsl(var(--band-clear))'
                              }} />
                            </div>
                            <span className="font-mono text-muted-foreground text-[10px]">{a.utilization}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-[11px]">{a.topSignal}</td>
                        <td className="text-center py-3 px-4">
                          <button className="text-primary hover:underline text-[11px] font-semibold" onClick={e => { e.stopPropagation(); navigate(`/agency/${a.id}`); }}>View</button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Pagination */}
        {(viewMode !== 'grid') && totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, tableAgencies.length)} of {tableAgencies.length}</span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${page === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AgencyDirectory;
