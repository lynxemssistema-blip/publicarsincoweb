const fs = require('fs');

const file = 'frontend/src/pages/OrdemServico.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                    {os.EnderecoOrdemServico && (
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    addToast({ type: 'info', title: 'Aguarde', message: 'Gerando Relatório Excel...' });
                                    const res = await fetch(\`/api/ordemservico/\${os.IdOrdemServico}/excel\`, { 
                                        method: 'POST',
                                        headers: { 'Authorization': \`Bearer \${token}\` }
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        addToast({ type: 'success', title: 'Concluído', message: 'Excel gerado e pasta aberta!' });
                                    } else {
                                        throw new Error(data.message || 'Erro do servidor');
                                    }
                                } catch (err: any) {
                                    addToast({ type: 'error', title: 'Falha', message: \`Ao gerar Excel: \${err.message}\` });
                                }
                            }}
                            className="p-2 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Gerar Relatório Excel"
                        >
                            <FileSpreadsheet size={14} />
                        </button>
                    )}`;

const replacementStr = `                    <button
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

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    
    // Ensure FileText is imported
    if (!content.includes('FileText,')) {
        content = content.replace('FileSpreadsheet,', 'FileSpreadsheet, FileText,');
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Success: OrdemServico.tsx patched with new icons.');
} else {
    console.log('Error: target string not found in OrdemServico.tsx.');
}
