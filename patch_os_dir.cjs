const fs = require('fs');

const file = 'src/server.js';
let content = fs.readFileSync(file, 'utf8');

const targetRegex = /res\.json\(\{\s*success:\s*true,\s*message:\s*'OS cadastrada',\s*id:\s*result\.insertId\s*\}\);/g;

const replacementStr = `        const novoId = result.insertId;
        let enderecoBase = data.EnderecoOrdemServico || '';
        
        if (enderecoBase) {
            const format5 = (num) => String(num).padStart(5, '0');
            if (enderecoBase.endsWith('\\\\') || enderecoBase.endsWith('/')) {
                enderecoBase = enderecoBase.slice(0, -1);
            }
            const nomePastaOs = \`OS_\${format5(novoId)}\`;
            const novoEndereco = \`\${enderecoBase}\\\\\${nomePastaOs}\`;
            
            // Atualiza o banco com o caminho correto da pasta da OS
            await req.tenantDbPool.execute(
                'UPDATE ordemservico SET EnderecoOrdemServico = ? WHERE IdOrdemServico = ?',
                [novoEndereco, novoId]
            );

            // Cria fisicamente a pasta e subpastas
            try {
                const fsp = require('fs/promises');
                const p = require('path');
                await fsp.mkdir(novoEndereco, { recursive: true });
                const subdirs = ['DXF', 'PDF', 'DFT', 'PUNC', 'LASER', 'Projeto', 'PEÇAS DE ESTOQUE', 'LXDS'];
                for (const sd of subdirs) {
                    await fsp.mkdir(p.join(novoEndereco, sd), { recursive: true }).catch(() => {});
                }
            } catch (fsErr) {
                console.error('[CriarOS] Falha ao criar pastas:', fsErr.message);
            }
        }

        res.json({ success: true, message: 'OS cadastrada', id: novoId });`;

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, replacementStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Success: server.js patched for OS directory creation.');
} else {
    console.log('Error: target regex not found.');
}
