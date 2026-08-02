const fs = require('fs');
const file = 'frontend/src/pages/VisaoGeralProducao.tsx';
let code = fs.readFileSync(file, 'utf8');
const target = code.split('\n').find(l => l.includes('const [actionModal, setActionModal] = useState'));

const stateCode = `
  const [temposProducaoRecursos, setTemposProducaoRecursos] = useState<any[]>([]);
  const [temposProducaoSelId, setTemposProducaoSelId] = useState('');
  const [temposProducaoValores, setTemposProducaoValores] = useState({ setup: 0, padrao: 0, total: 0 });

  useEffect(() => {
    if (actionModal === 'temposProducao') {
      fetch(\`\${API_BASE}/recursos\`, { headers: getHeaders() })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const list = data.data.filter((r:any) => r.Fabrica === 'SIM' || r.Fabrica === 'S' || r.Fabrica === true);
            setTemposProducaoRecursos(list);
            setTemposProducaoSelId('');
            setTemposProducaoValores({ setup: 0, padrao: 0, total: 0 });
          }
        })
        .catch(console.error);
    }
  }, [actionModal]);

  const handleSelectRecursoTempos = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const recId = e.target.value;
    setTemposProducaoSelId(recId);
    const rec = temposProducaoRecursos.find(r => String(r.IdProcessoFabricacao) === String(recId));
    if (rec && selTag) {
      try {
        const res = await fetch(\`\${API_BASE}/ordemservico/\${selTag.IdTag}/tempos-producao?recurso=\${encodeURIComponent(rec.processofabricacao)}\`, { headers: getHeaders() });
        const json = await res.json();
        if (json.success) {
          setTemposProducaoValores({
            setup: json.data.Setup || 0,
            padrao: json.data.Padrao || 0,
            total: json.data.Total || 0
          });
        }
      } catch(err) {
        console.error(err);
      }
    } else {
        setTemposProducaoValores({ setup: 0, padrao: 0, total: 0 });
    }
  };
`;

if (!code.includes('setTemposProducaoSelId')) {
    code = code.replace(target, target + '\\n' + stateCode);
    fs.writeFileSync(file, code, 'utf8');
    console.log('State injected successfully.');
} else {
    console.log('State already exists.');
}
