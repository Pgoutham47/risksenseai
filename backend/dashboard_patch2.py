import re

with open('../src/pages/AgencyDirectory.tsx', 'r') as f:
    code = f.read()

prefix = """import { useData } from '@/contexts/DataContext';"""
code = code.replace("import { agencies, getBandClass, getBorderBandClass, formatCurrency, generateAgencyScoreHistory, type Band, type Agency } from '@/data/mockData';", f"import {{ getBandClass, getBorderBandClass, formatCurrency, generateAgencyScoreHistory, type Band }} from '@/data/mockData';\n{prefix}")

repl = """const AgencyDirectory = () => {
  const navigate = useNavigate();
  const { agencies, isLoading } = useData();
"""
code = re.sub(r'const AgencyDirectory = \(\) => {\n  const navigate = useNavigate\(\);', repl, code)

code = code.replace("const [loading, setLoading] = useState(true);", "")
code = code.replace("useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);", "")
code = code.replace("if (loading)", "if (isLoading)")

with open('../src/pages/AgencyDirectory.tsx', 'w') as f:
    f.write(code)

with open('../src/pages/Simulator.tsx', 'r') as f:
    code = f.read()
code = code.replace("import { agencies, getBandClass, type Band } from '@/data/mockData';", f"import {{ getBandClass, type Band }} from '@/data/mockData';\n{prefix}\nimport {{ api }} from '@/lib/api';")
repl = """const Simulator = () => {
  const navigate = useNavigate();
  const { agencies, refetch } = useData();
"""
code = re.sub(r'const Simulator = \(\) => {\n  const navigate = useNavigate\(\);?', repl, code)
code = re.sub(r'const handleSimulate = \(\) => {.*?setTimeout\(\(\) => {.*?setSimulating\(false\).*?}, 2000\);\n  };', """const handleSimulate = async () => {
    if (!selectedAgency || !selectedScenario) return;
    setSimulating(true);
    try {
      await api.runTboSimulation(selectedAgency, selectedScenario.id);
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
      setCompleted(true);
      setTimeout(() => {
        setCompleted(false);
        navigate(`/agency/${selectedAgency}`);
      }, 2000);
    }
  };""", code, flags=re.DOTALL)
with open('../src/pages/Simulator.tsx', 'w') as f:
    f.write(code)

with open('../src/pages/AlertsCenter.tsx', 'r') as f:
    code = f.read()
code = code.replace("import { alerts, type AlertSeverity } from '@/data/mockData';", f"import {{ type AlertSeverity }} from '@/data/mockData';\n{prefix}\nimport {{ api }} from '@/lib/api';")
repl = """const AlertsCenter = () => {
  const { toast } = useToast();
  const { alerts, refetch } = useData();"""
code = re.sub(r'const AlertsCenter = \(\) => {\n  const { toast } = useToast\(\);', repl, code)

code = re.sub(r'const handleAcknowledge = \(id: string\) => {.*?toast\({.*?}\);\n  };', """const handleAcknowledge = async (id: string) => {
    await api.acknowledgeAlert(id);
    refetch();
    toast({
      title: "Alert Acknowledged",
      description: "The alert has been marked as acknowledged.",
    });
  };""", code, flags=re.DOTALL)

with open('../src/pages/AlertsCenter.tsx', 'w') as f:
    f.write(code)

