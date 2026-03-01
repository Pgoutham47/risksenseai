import re

with open('../src/pages/Dashboard.tsx', 'r') as f:
    code = f.read()

# Replace LiveEventFeed
live_feed_replacement = """const LiveEventFeed: React.FC = () => {
  const navigate = useNavigate();
  const { liveEvents, agencies } = useData();
  const [visibleEvents, setVisibleEvents] = useState(liveEvents.slice(0, VISIBLE_EVENTS));
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const poolIndexRef = useRef(VISIBLE_EVENTS);

  useEffect(() => {
    setVisibleEvents(liveEvents.slice(0, VISIBLE_EVENTS));
  }, [liveEvents]);

  useEffect(() => {
    if (liveEvents.length === 0) return;
    const interval = setInterval(() => {
      const nextIndex = poolIndexRef.current % liveEvents.length;
      const nextEvent = {
        ...liveEvents[nextIndex],
        id: `${liveEvents[nextIndex].id}-${Date.now()}`,
        timestamp: generateFreshTimestamp(),
      };
      poolIndexRef.current += 1;
      setEnteringId(nextEvent.id);
      setVisibleEvents(prev => [nextEvent, ...prev.slice(0, VISIBLE_EVENTS - 1)]);
      setTimeout(() => setEnteringId(null), 500);
    }, CYCLE_INTERVAL);
    return () => clearInterval(interval);
  }, [liveEvents]);"""
code = re.sub(r'const LiveEventFeed: React\.FC = \(\) => {.*?useEffect\(\(\) => {.*?return \(\) => clearInterval\(interval\);\n  }, \[\]\);', live_feed_replacement, code, flags=re.DOTALL)

# Replace RiskMap
risk_map_replacement = """const RiskMap: React.FC = () => {
  const navigate = useNavigate();
  const { agencies } = useData();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const regions = useMemo(() => [
    { name: 'North', agencies: agencies.filter((_, i) => i % 4 === 0) },
    { name: 'South', agencies: agencies.filter((_, i) => i % 4 === 1) },
    { name: 'East', agencies: agencies.filter((_, i) => i % 4 === 2) },
    { name: 'West', agencies: agencies.filter((_, i) => i % 4 === 3) },
  ], [agencies]);"""
code = re.sub(r'const regions = \[.*?\];\n\nconst RiskMap: React\.FC = \(\) => {\n  const navigate = useNavigate\(\);\n  const \[hoveredRegion, setHoveredRegion\] = useState<string \| null>\(null\);', risk_map_replacement, code, flags=re.DOTALL)

# Replace Dashboard Body Start
dash_body_repl = """const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { agencies, alerts, isLoading } = useData();
  const totalAgencies = agencies.length;
  const warningOrWorse = agencies.filter(a => ['WARNING', 'RESTRICTED', 'BLOCKED'].includes(a.band)).length;
  const totalExposure = agencies.reduce((s, a) => s + a.outstandingBalance, 0);

  const bandDistribution: { name: Band; value: number; color: string }[] = useMemo(() => [
    { name: 'CLEAR', value: agencies.filter(a => a.band === 'CLEAR').length, color: getBandColor('CLEAR') },
    { name: 'CAUTION', value: agencies.filter(a => a.band === 'CAUTION').length, color: getBandColor('CAUTION') },
    { name: 'WARNING', value: agencies.filter(a => a.band === 'WARNING').length, color: getBandColor('WARNING') },
    { name: 'RESTRICTED', value: agencies.filter(a => a.band === 'RESTRICTED').length, color: getBandColor('RESTRICTED') },
    { name: 'BLOCKED', value: agencies.filter(a => a.band === 'BLOCKED').length, color: getBandColor('BLOCKED') },
  ], [agencies]);

  const topAtRisk = useMemo(() => [...agencies].sort((a, b) => a.trustScore - b.trustScore).slice(0, 5), [agencies]);

  const kpiSparklines = useMemo(() => ({
    agencies: generateSparkline(totalAgencies || 10, 7, 0.05),
    warnings: generateSparkline(warningOrWorse || 5, 7, 0.2),
    alerts: generateSparkline(alerts.length || 8, 7, 0.4),
    exposure: generateSparkline((totalExposure || 100000) / 100000, 7, 0.12),
  }), [totalAgencies, warningOrWorse, alerts.length, totalExposure]);"""
code = re.sub(r'const Dashboard: React\.FC = \(\) => {', dash_body_repl, code)

# Fix loading variable name collision where it uses local state vs context
code = code.replace("const [loading, setLoading] = useState(true);", "")
code = code.replace("setLoading(true);", "")
code = code.replace("setLoading(false);", "")
code = code.replace("if (loading)", "if (isLoading)")

with open('../src/pages/Dashboard.tsx', 'w') as f:
    f.write(code)
