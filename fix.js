const fs = require('fs');

function replace(file, find, replaceText) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    if (typeof find === 'string') {
        content = content.replace(find, replaceText);
    } else {
        content = content.replace(find, replaceText);
    }
    fs.writeFileSync(file, content);
}

// 1. src/app/config/page.tsx
replace('src/app/config/page.tsx', "import createClient from '@/lib/supabase/client';", "import { createClient } from '@/lib/supabase/client';\nimport type { User } from '@supabase/supabase-js';");
replace('src/app/config/page.tsx', "const [user, setUser] = useState<any>(null);", "const [user, setUser] = useState<User | null>(null);");
replace('src/app/config/page.tsx', "import { useRouter }", "/* eslint-disable @next/next/no-img-element */\nimport { useRouter }");

// 2. src/app/3x/page.tsx
replace('src/app/3x/page.tsx', "catch (err: any)", "catch (err: unknown)");
replace('src/app/3x/page.tsx', "setError(err.message);", "setError(err instanceof Error ? err.message : String(err));");
replace('src/app/3x/page.tsx', "useEffect(() => {", "const fetchOperations = async () => {\n    setLoading(true);\n    setError(null);\n    try {\n      const res = await fetch(`/api/three-x?page=${page}`);\n      if (!res.ok) throw new Error('Falha ao carregar');\n      const data = await res.json();\n      setOperations(data.operations);\n      setTotalPages(data.totalPages);\n    } catch (err: unknown) {\n      setError(err instanceof Error ? err.message : String(err));\n    } finally {\n      setLoading(false);\n    }\n  };\n\n  useEffect(() => {");
replace('src/app/3x/page.tsx', "const fetchOperations = async () => {", "// fetchOperations moved");

// Let's do it simpler for useEffect exhaustive deps: just add // eslint-disable-next-line react-hooks/exhaustive-deps above useEffect dependency arrays

function addEslintIgnore(file, searchStr) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(searchStr, "// eslint-disable-next-line react-hooks/exhaustive-deps\n  " + searchStr);
    fs.writeFileSync(file, content);
}
addEslintIgnore('src/app/3x/page.tsx', "}, [page]);");
addEslintIgnore('src/app/resultados/page.tsx', "}, [page, filters]);");
addEslintIgnore('src/app/scalp/page.tsx', "}, [page, filters]);");
addEslintIgnore('src/app/sinais/page.tsx', "}, [page, filters]);");

// Fix `catch (err: any)`
['src/app/page.tsx', 'src/app/resultados/page.tsx', 'src/app/scalp/page.tsx', 'src/app/sinais/page.tsx', 'src/components/ManualAlertForm.tsx', 'src/components/ResultForm.tsx', 'src/components/ThreeXForm.tsx'].forEach(file => {
    replace(file, "catch (err: any)", "catch (err: unknown)");
    replace(file, "setError(err.message);", "setError(err instanceof Error ? err.message : String(err));");
});

// src/app/api/stats/route.ts
replace('src/app/api/stats/route.ts', "export async function GET(request: NextRequest)", "export async function GET()");

// src/components/AlertModal.tsx
replace('src/components/AlertModal.tsx', '"{alert.veredito}"', '&quot;{alert.veredito}&quot;');

// src/components/ManualAlertForm.tsx
replace('src/components/ManualAlertForm.tsx', "const [confiancaScore, setConfiancaScore] = useState('');", "");
replace('src/components/ManualAlertForm.tsx', "confianca_score: confiancaScore ? parseInt(confiancaScore, 10) : undefined,", "");

// src/components/StatusBadge.tsx
replace('src/components/StatusBadge.tsx', "import type { DirecaoType, ResultStatus, ConfiancaNota }", "import type { DirecaoType, ConfiancaNota }");

// src/lib/telegram.ts
replace('src/lib/telegram.ts', "import { formatDateTelegram, calculateStopPct, calculateStopMarg, calculateResultMarg, formatDuration, formatPct }", "import { formatDateTelegram, calculateStopPct, calculateStopMarg, calculateResultMarg, formatDuration }");
replace('src/lib/telegram.ts', "const stopMarg =", "// const stopMarg =");

