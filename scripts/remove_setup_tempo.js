const fs = require('fs');

function cleanServer() {
    let content = fs.readFileSync('src/server.js', 'utf8');

    content = content.replace(
        /"INSERT INTO processofabricacao \(processofabricacao, CodigoProcessoFabricacao, Fabrica, DataLiberada, Setup, TempoPadrao, CriadoPor, DataCriacao, IdMatriz\) VALUES \(\?, \?, \?, \?, \?, \?, \?, \?, \?\)"/g,
        '"INSERT INTO processofabricacao (processofabricacao, CodigoProcessoFabricacao, Fabrica, DataLiberada, CriadoPor, DataCriacao, IdMatriz) VALUES (?, ?, ?, ?, ?, ?, ?)"'
    );

    content = content.replace(
        /const params = \[processofabricacao, CodigoProcessoFabricacao \|\| '', Fabrica \|\| 'NAO', DataLiberada \|\| 'NAO', Setup \|\| null, TempoPadrao \|\| null, usuario, nowFormat, idMatriz\];/g,
        "const params = [processofabricacao, CodigoProcessoFabricacao || '', Fabrica || 'NAO', DataLiberada || 'NAO', usuario, nowFormat, idMatriz];"
    );

    content = content.replace(
        /"UPDATE processofabricacao SET processofabricacao = \?, CodigoProcessoFabricacao = \?, Fabrica = \?, DataLiberada = \?, Setup = \?, TempoPadrao = \? WHERE IdProcessoFabricacao = \?"/g,
        '"UPDATE processofabricacao SET processofabricacao = ?, CodigoProcessoFabricacao = ?, Fabrica = ?, DataLiberada = ? WHERE IdProcessoFabricacao = ?"'
    );

    content = content.replace(
        /const params = \[processofabricacao, CodigoProcessoFabricacao \|\| '', Fabrica \|\| 'NAO', DataLiberada \|\| 'NAO', Setup \|\| null, TempoPadrao \|\| null, id\];/g,
        "const params = [processofabricacao, CodigoProcessoFabricacao || '', Fabrica || 'NAO', DataLiberada || 'NAO', id];"
    );

    fs.writeFileSync('src/server.js', content, 'utf8');
    console.log('Cleaned server.js');
}

function cleanFrontend() {
    let content = fs.readFileSync('frontend/src/pages/RecursoFabricacao.tsx', 'utf8');

    // Remove Setup and TempoPadrao from interface and empty form
    content = content.replace(/  Setup\?: number;\n/g, '');
    content = content.replace(/  TempoPadrao\?: number;\n/g, '');
    content = content.replace(/  Setup: 0,\n/g, '');
    content = content.replace(/  TempoPadrao: 0\n/g, '');

    // Remove modal inputs
    const modalInputs = `                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Setup (min)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="Setup"
                        value={formData.Setup === undefined ? '' : formData.Setup}
                        onChange={handleInputChange}
                        className={inputBaseClass + " border-gray-200"}
                        placeholder="Ex: 15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tempo Padrão (min)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="TempoPadrao"
                        value={formData.TempoPadrao === undefined ? '' : formData.TempoPadrao}
                        onChange={handleInputChange}
                        className={inputBaseClass + " border-gray-200"}
                        placeholder="Ex: 5"
                      />
                    </div>
                  </div>`;
    content = content.replace(modalInputs, '');

    // Remove table headers
    content = content.replace(/<th className="px-2 py-1 text-right text-\[9px\] font-semibold text-white uppercase tracking-wider hidden sm:table-cell w-20">Setup<\/th>\n/g, '');
    content = content.replace(/<th className="px-2 py-1 text-right text-\[9px\] font-semibold text-white uppercase tracking-wider hidden sm:table-cell w-20">T. PADRÃO<\/th>\n/g, '');

    // Remove inline edit inputs
    const inlineEditSetup = `                  <td className="px-2 py-1 hidden sm:table-cell w-20 align-middle">
                    <input
                      type="number"
                      step="0.01"
                      name="Setup"
                      value={editFormData.Setup === undefined ? '' : editFormData.Setup}
                      onChange={handleInputInline}
                      className={inputBaseClass + " border-gray-200 w-full"}
                    />
                  </td>`;
    content = content.replace(inlineEditSetup, '');
    
    const inlineEditTempo = `                  <td className="px-2 py-1 hidden sm:table-cell w-20 align-middle">
                    <input
                      type="number"
                      step="0.01"
                      name="TempoPadrao"
                      value={editFormData.TempoPadrao === undefined ? '' : editFormData.TempoPadrao}
                      onChange={handleInputInline}
                      className={inputBaseClass + " border-gray-200 w-full"}
                    />
                  </td>`;
    content = content.replace(inlineEditTempo, '');

    // Remove table view cells
    content = content.replace(/                  <td className="px-2 py-2 text-right whitespace-nowrap text-xs text-gray-600 hidden sm:table-cell w-20 align-middle">\n                    \{recurso\.Setup \?\? '-'\}\n                  <\/td>\n/g, '');
    content = content.replace(/                  <td className="px-2 py-2 text-right whitespace-nowrap text-xs text-gray-600 hidden sm:table-cell w-20 align-middle">\n                    \{recurso\.TempoPadrao \?\? '-'\}\n                  <\/td>\n/g, '');

    fs.writeFileSync('frontend/src/pages/RecursoFabricacao.tsx', content, 'utf8');
    console.log('Cleaned RecursoFabricacao.tsx');
}

cleanServer();
cleanFrontend();
