const fs = require('fs');

const file = 'frontend/src/pages/OrdemServico.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(\`/api/ordemservico/\${os.IdOrdemServico}/relatorio/pdf\`, '_blank');
                        }}
                        className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Gerar Relatório PDF"
                    >
                        <FileText size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = \`/api/ordemservico/\${os.IdOrdemServico}/relatorio/excel\`;
                        }}
                        className="p-2 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Gerar Relatório Excel"
                    >
                        <FileSpreadsheet size={14} />
                    </button>`;

const replacementStr = `                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                addToast({ type: 'info', title: 'Aguarde', message: 'Gerando Relatório PDF...' });
                                const res = await fetch(\`/api/ordemservico/\${os.IdOrdemServico}/relatorio/pdf\`, {
                                    headers: { 'Authorization': \`Bearer \${token}\` }
                                });
                                if (!res.ok) throw new Error('Falha na autenticação ou servidor');
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                window.open(url, '_blank');
                                addToast({ type: 'success', title: 'Concluído', message: 'PDF gerado com sucesso!' });
                            } catch (err: any) {
                                addToast({ type: 'error', title: 'Falha', message: \`Ao gerar PDF: \${err.message}\` });
                            }
                        }}
                        className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                        title="Gerar Relatório PDF"
                    >
                        <FileText size={14} />
                    </button>
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                addToast({ type: 'info', title: 'Aguarde', message: 'Gerando Relatório Excel...' });
                                const res = await fetch(\`/api/ordemservico/\${os.IdOrdemServico}/relatorio/excel\`, {
                                    headers: { 'Authorization': \`Bearer \${token}\` }
                                });
                                if (!res.ok) throw new Error('Falha na autenticação ou servidor');
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = \`OS_\${os.IdOrdemServico}_Relatorio.xlsx\`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(url);
                                addToast({ type: 'success', title: 'Concluído', message: 'Excel gerado com sucesso!' });
                            } catch (err: any) {
                                addToast({ type: 'error', title: 'Falha', message: \`Ao gerar Excel: \${err.message}\` });
                            }
                        }}
                        className="p-2 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Gerar Relatório Excel"
                    >
                        <FileSpreadsheet size={14} />
                    </button>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Success: OrdemServico.tsx patched for authenticated download.');
} else {
    console.log('Error: target string not found in OrdemServico.tsx.');
}
