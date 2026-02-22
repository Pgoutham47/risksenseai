import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, ArrowUpDown } from 'lucide-react';
import { agencies, getBandClass, getBorderBandClass, formatCurrency, type Band } from '@/data/mockData';
import { PageTransition } from '@/components/AnimatedComponents';

type SortKey = 'trustScore' | 'outstandingBalance' | 'lastUpdated';

const AgencyDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [bandFilter, setBandFilter] = useState<'ALL' | Band>('ALL');
  const [tenureFilter, setTenureFilter] = useState<'ALL' | 'NEW' | 'ESTABLISHED'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('trustScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const perPage = 20;

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

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or ID..." className="w-full bg-card border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <select value={bandFilter} onChange={e => { setBandFilter(e.target.value as any); setPage(1); }} className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="ALL">All Bands</option>
            {(['CLEAR', 'CAUTION', 'WARNING', 'RESTRICTED', 'BLOCKED'] as Band[]).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={tenureFilter} onChange={e => { setTenureFilter(e.target.value as any); setPage(1); }} className="bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="ALL">All Tenure</option>
            <option value="NEW">New (&lt;90 days)</option>
            <option value="ESTABLISHED">Established</option>
          </select>
        </div>

        {/* Table */}
        <div className="panel overflow-hidden overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-secondary/50 text-muted-foreground">
                <th className="text-left py-3 px-4 font-medium">Agency ID</th>
                <th className="text-left py-3 px-4 font-medium">Agency Name</th>
                <th className="text-center py-3 px-4 font-medium cursor-pointer" onClick={() => toggleSort('trustScore')}>
                  <span className="inline-flex items-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-center py-3 px-4 font-medium">Band</th>
                <th className="text-right py-3 px-4 font-medium">Credit Limit</th>
                <th className="text-right py-3 px-4 font-medium cursor-pointer" onClick={() => toggleSort('outstandingBalance')}>
                  <span className="inline-flex items-center gap-1">Outstanding <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="text-center py-3 px-4 font-medium">Utilization</th>
                <th className="text-left py-3 px-4 font-medium">Top Signal</th>
                <th className="text-left py-3 px-4 font-medium">Last Update</th>
                <th className="text-center py-3 px-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(a => (
                <tr key={a.id} className={`${getBorderBandClass(a.band)} border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors`} onClick={() => navigate(`/agency/${a.id}`)}>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{a.id}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{a.name}</td>
                  <td className="text-center py-3 px-4 font-mono text-foreground">{a.trustScore}</td>
                  <td className="text-center py-3 px-4"><span className={getBandClass(a.band)}>{a.band}</span></td>
                  <td className="text-right py-3 px-4 font-mono text-foreground">{formatCurrency(a.creditLimit)}</td>
                  <td className="text-right py-3 px-4 font-mono text-foreground">{formatCurrency(a.outstandingBalance)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${a.utilization}%`, background: a.utilization > 70 ? 'hsl(0, 65%, 55%)' : a.utilization > 50 ? 'hsl(38, 90%, 55%)' : 'hsl(142, 70%, 42%)' }} />
                      </div>
                      <span className="font-mono text-muted-foreground text-[10px]">{a.utilization}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{a.topSignal}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground text-[10px]">{a.lastUpdated}</td>
                  <td className="text-center py-3 px-4">
                    <button className="text-primary hover:underline text-[11px] font-medium" onClick={e => { e.stopPropagation(); navigate(`/agency/${a.id}`); }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-7 h-7 rounded flex items-center justify-center ${page === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default AgencyDirectory;
