import re

with open('../src/pages/Dashboard.tsx', 'r') as f:
    code = f.read()

# Fix loading variable name collision where it uses local state vs context
code = code.replace("const [loading, setLoading] = useState(true);", "")
code = code.replace("setLoading(true);", "")
code = code.replace("setLoading(false);", "")
code = code.replace("if (loading)", "if (isLoading)")

with open('../src/pages/Dashboard.tsx', 'w') as f:
    f.write(code)
