import re

with open('../src/pages/Simulator.tsx', 'r') as f:
    code = f.read()

# Replace the agencies.map for the custom dropdown
repl_dropdown = """{agencies.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}"""
code = code.replace(repl_dropdown, "{agencies.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}")

# Ensure the mock agencies is removed if present anywhere
code = code.replace("import { getBandClass, type Band } from '@/data/mockData';", "import { getBandClass, type Band } from '@/data/mockData';")

with open('../src/pages/Simulator.tsx', 'w') as f:
    f.write(code)

