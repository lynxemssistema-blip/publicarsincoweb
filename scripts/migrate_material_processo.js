/**
 * migrate_material_processo.js
 * 
 * Cria a tabela material_processo nos tenants que não a possuem
 * e popula com dados migrados dos campos txtCorte/txtDobra/txtSolda/txtPintura/TxtMontagem
 * de ordemservicoitem.
 * 
 * Uso: node scripts/migrate_material_processo.js [--dry-run] [--tenant=alfatec2]
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const isDryRun = process.argv.includes('--dry-run');
const tenantFilter = process.argv.find(a => a.startsWith('--tenant='))?.split('=')[1];

const tenants = [
  { nome: 'Lynx (central)', host: 'lynxlocal.mysql.uhserver.com', user: 'lynxlocal', pass: 'jHAzhFG848@yN@U', db: 'lynxlocal' },
  { nome: 'Alfatec2', host: 'alfatec2.mysql.uhserver.com', user: 'alfateccozinhas', pass: 'jHAzhFG848@yN@U', db: 'alfatec2' },
  { nome: 'Bruno AMC', host: 'amceletrica.mysql.uhserver.com', user: 'brunoamc', pass: 'jHAzhFG848@yN@U', db: 'amceletrica' },
  { nome: 'Metta Paineis', host: 'mettapaineis.mysql.uhserver.com', user: 'rubensmetta', pass: 'jHAzhFG848@yN@U', db: 'mettapaineis' },
  { nome: 'Ecoindustria', host: 'ecoindustria.mysql.uhserver.com', user: 'wesley2', pass: 'jHAzhFG848@yN@U', db: 'ecoindustria' },
  { nome: 'TCM Lafayete', host: 'tcm.mysql.uhserver.com', user: 'tcmlafayete', pass: 'jHAzhFG848@yN@U', db: 'tcm' },
];

// Mapeamento: campo txt -> nome do processo (hint para busca em processofabricacao)
const TXT_FIELD_MAP = [
  { field: 'txtCorte',         nameHint: 'corte',         execField: 'CorteTotalExecutado',    planIni: 'PlanejadoInicioCorte',    planFim: 'PlanejadoFinalCorte' },
  { field: 'txtDobra',         nameHint: 'dobra',         execField: 'DobraTotalExecutado',    planIni: 'PlanejadoInicioDobra',    planFim: 'PlanejadoFinalDobra' },
  { field: 'txtSolda',         nameHint: 'solda',         execField: 'SoldaTotalExecutado',    planIni: 'PlanejadoInicioSolda',    planFim: 'PlanejadoFinalSolda' },
  { field: 'txtPintura',       nameHint: 'pintura',       execField: 'PinturaTotalExecutado',  planIni: 'PlanejadoInicioPintura',  planFim: 'PlanejadoFinalPintura' },
  { field: 'TxtMontagem',      nameHint: 'montagem',      execField: 'MontagemTotalExecutado', planIni: 'PlanejadoInicioMontagem', planFim: 'PlanejadoFinalMontagem' },
  { field: 'txtCorteaLaser',   nameHint: 'laser',         execField: null, planIni: null, planFim: null },
  { field: 'txtGALVANIZAR',    nameHint: 'galvanizar',    execField: null, planIni: null, planFim: null },
  { field: 'txtPUNSIONADEIRA', nameHint: 'punsionadeira', execField: null, planIni: null, planFim: null },
  { field: 'txtENGENHARIA',    nameHint: 'engenharia',    execField: null, planIni: null, planFim: null },
];

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS material_processo (
  IdMaterialProcesso INT NOT NULL AUTO_INCREMENT,
  IdOrdemServico     INT NOT NULL,
  codmatFabricante   VARCHAR(60) DEFAULT NULL,
  IdProcesso         INT DEFAULT NULL,
  SequenciaExecucao  INT DEFAULT NULL,
  TotalExecutar      DECIMAL(10,2) DEFAULT NULL,
  TotalExecutado     DECIMAL(10,2) DEFAULT 0,
  RealizadoInicio    DATETIME DEFAULT NULL,
  RealizadoFinal     DATETIME DEFAULT NULL,
  UsuarioRealizadoInicio VARCHAR(100) DEFAULT NULL,
  UsuarioRealizadoFinal  VARCHAR(100) DEFAULT NULL,
  PlanejadoInicio    DATETIME DEFAULT NULL,
  PlanejadoFinal     DATETIME DEFAULT NULL,
  TempoEstimadoMin   DECIMAL(10,2) DEFAULT NULL,
  TempoPadraoMin     DECIMAL(10,2) DEFAULT NULL,
  MinutosProducao    DECIMAL(10,2) DEFAULT 0,
  IdTag              INT DEFAULT NULL,
  IdProjeto          INT DEFAULT NULL,
  CriadoPor          VARCHAR(100) DEFAULT NULL,
  DataCriacao        DATETIME DEFAULT NULL,
  D_E_L_E_T_E        VARCHAR(10) DEFAULT '',
  PRIMARY KEY (IdMaterialProcesso),
  KEY idx_mp_os_mat (IdOrdemServico, codmatFabricante),
  KEY idx_mp_processo (IdProcesso),
  KEY idx_mp_seq (SequenciaExecucao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

async function getTableColumns(conn, tableName) {
  try {
    const [cols] = await conn.execute(`SHOW COLUMNS FROM \`${tableName}\``);
    return cols.map(c => c.Field.toLowerCase());
  } catch {
    return [];
  }
}

async function migrateTenant(tenant) {
  console.log('\n' + '='.repeat(60));
  console.log(`[${tenant.nome}] Iniciando migração...`);
  if (isDryRun) console.log(`[${tenant.nome}] MODO DRY-RUN — nenhuma alteração será feita`);

  let conn;
  try {
    conn = await mysql.createConnection({
      host: tenant.host, user: tenant.user, password: tenant.pass, database: tenant.db,
      connectTimeout: 15000
    });

    // 1. Verificar se tabela existe
    const [tables] = await conn.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'material_processo'`,
      [tenant.db]
    );
    const tableExists = tables.length > 0;

    if (!tableExists) {
      console.log(`[${tenant.nome}] Tabela material_processo NAO existe. Criando...`);
      if (!isDryRun) {
        await conn.execute(CREATE_TABLE_SQL);
        console.log(`[${tenant.nome}] OK Tabela criada.`);
      } else {
        console.log(`[${tenant.nome}] [DRY-RUN] Executaria: CREATE TABLE material_processo`);
      }
    } else {
      const [cnt] = await conn.execute('SELECT COUNT(*) as c FROM material_processo');
      console.log(`[${tenant.nome}] Tabela ja existe com ${cnt[0].c} registros.`);
      if (cnt[0].c > 0) {
        console.log(`[${tenant.nome}] Ja tem dados. Pulando. Para forcar, delete registros e rode novamente.`);
        await conn.end();
        return;
      }
    }

    // 2. Buscar processos do tenant
    const [processos] = await conn.execute(
      `SELECT IdProcessoFabricacao, processofabricacao FROM processofabricacao WHERE D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = ''`
    );
    console.log(`[${tenant.nome}] Processos: ${processos.map(p => p.processofabricacao).join(', ')}`);

    // 3. Verificar colunas existentes em ordemservicoitem e material_processo
    const osiCols = await getTableColumns(conn, 'ordemservicoitem');
    const mpCols  = await getTableColumns(conn, 'material_processo');

    // Detectar tipo de schema:
    // schema_antigo: tem 'idmaterial' como campo obrigatorio (NOT NULL sem default)
    // schema_novo: sem 'idmaterial' ou idmaterial permite NULL
    const hasIdMaterial = mpCols.includes('idmaterial');
    let [mpDescribe] = await conn.execute('DESCRIBE material_processo');
    const idMaterialNotNull = mpDescribe.find(c => c.Field.toLowerCase() === 'idmaterial' && c.Null === 'NO');
    const isSchemaAntigo = hasIdMaterial && idMaterialNotNull;

    console.log(`[${tenant.nome}] Schema: ${isSchemaAntigo ? 'ANTIGO (IdMaterial obrigatorio)' : 'NOVO'}`);

    // Para todos os schemas: verificar se codmatFabricante precisa ser ampliado
    {
      const mpDescribe2 = mpDescribe || [];
      const mpCodField = mpDescribe2.find(c => c.Field.toLowerCase() === 'codmatfabricante');
      const mpCodLen = mpCodField ? parseInt(mpCodField.Type.match(/\d+/)?.[0] || '60') : 60;
      const [maxLen] = await conn.execute(`SELECT MAX(LENGTH(CodMatFabricante)) as m FROM ordemservicoitem`);
      const realMax = maxLen[0].m || 0;
      if (realMax > mpCodLen) {
        const newLen = Math.min(191, Math.max(191, realMax + 20)); // 191 = max para VARCHAR em utf8mb4 com índice 767 bytes
        console.log(`[${tenant.nome}] Ampliando codmatFabricante de ${mpCodLen} para ${newLen} chars...`);
        if (!isDryRun) {
          // Remover índices que referenciam codmatFabricante para permitir ALTER
          try {
            const [idxRows] = await conn.execute(`SHOW INDEX FROM material_processo WHERE Column_name = 'codmatFabricante'`);
            const indexNames = [...new Set(idxRows.map(r => r.Key_name).filter(n => n !== 'PRIMARY'))];
            for (const idxName of indexNames) {
              await conn.execute(`ALTER TABLE material_processo DROP INDEX \`${idxName}\``);
              console.log(`[${tenant.nome}]   Removido índice ${idxName}`);
            }
          } catch(e) { console.log(`[${tenant.nome}]   (sem índices a remover: ${e.message})`); }
          await conn.execute(`ALTER TABLE material_processo MODIFY codmatFabricante VARCHAR(${newLen})`);
          console.log(`[${tenant.nome}] codmatFabricante ampliado para ${newLen}.`);
        } else {
          console.log(`[${tenant.nome}] [DRY-RUN] Ampliaria codmatFabricante para ${newLen}`);
        }
      }
    }

    // 4. Mapear campos txt -> processo
    const fieldToProcesso = {};
    let seqCounter = 1;
    for (const mapping of TXT_FIELD_MAP) {
      if (!osiCols.includes(mapping.field.toLowerCase())) continue;
      const proc = processos.find(p =>
        p.processofabricacao.toLowerCase().includes(mapping.nameHint.toLowerCase())
      );
      if (proc) {
        fieldToProcesso[mapping.field] = { ...mapping, processo: proc, seq: seqCounter++ };
        console.log(`[${tenant.nome}]   ${mapping.field} -> [${proc.IdProcessoFabricacao}] ${proc.processofabricacao} (seq ${seqCounter - 1})`);
      }
    }

    if (Object.keys(fieldToProcesso).length === 0) {
      console.log(`[${tenant.nome}] Nenhum campo mapeavel. Encerrando.`);
      await conn.end();
      return;
    }

    // 5. Buscar itens com ao menos um campo ativo
    const activeMappings = Object.values(fieldToProcesso);
    const txtConditions = activeMappings.map(m => `osi.\`${m.field}\` = '1'`).join(' OR ');

    // Colunas extras para o SELECT
    const txtCols = activeMappings.map(m => `osi.\`${m.field}\``).join(', ');
    const execCols = activeMappings
      .filter(m => m.execField && osiCols.includes(m.execField.toLowerCase()))
      .map(m => `COALESCE(osi.\`${m.execField}\`, 0) AS \`${m.execField}\``)
      .join(', ');
    const planCols = activeMappings
      .filter(m => m.planIni && osiCols.includes(m.planIni.toLowerCase()))
      .map(m => `osi.\`${m.planIni}\`, osi.\`${m.planFim}\``)
      .join(', ');

    // Para schema antigo: fazer JOIN com tabela material para obter IdMaterial
    const matJoin = isSchemaAntigo ? `LEFT JOIN material mat ON mat.CodMatFabricante = osi.CodMatFabricante` : '';
    const matCol  = isSchemaAntigo ? `, mat.IdMaterial` : '';

    const extraCols = [txtCols, execCols, planCols].filter(Boolean).join(', ');
    const allSelectCols = ['osi.IdOrdemServicoItem', 'osi.IdOrdemServico', 'osi.CodMatFabricante', 'osi.QtdeTotal', 'os.IdTag', 'os.IdProjeto'];
    if (matCol) allSelectCols.push('mat.IdMaterial');
    allSelectCols.push(extraCols);

    const [items] = await conn.execute(`
      SELECT ${allSelectCols.join(', ')}
      FROM ordemservicoitem osi
      JOIN ordemservico os ON os.IdOrdemServico = osi.IdOrdemServico
      ${matJoin}
      WHERE (osi.D_E_L_E_T_E IS NULL OR osi.D_E_L_E_T_E = '' OR osi.D_E_L_E_T_E != '*')
        AND osi.Liberado_engenharia = 'S'
        AND (${txtConditions})
      LIMIT 200000
    `);

    console.log(`[${tenant.nome}] ${items.length} itens encontrados para migrar.`);
    if (items.length === 0) { await conn.end(); return; }

    // 6. Inserir em material_processo
    let insertCount = 0;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    for (const item of items) {
      for (const mapping of activeMappings) {
        const fieldVal = String(item[mapping.field] || '').trim();
        if (fieldVal !== '1') continue;

        const executado = mapping.execField ? (parseFloat(item[mapping.execField]) || 0) : 0;
        const qtde = parseFloat(item.QtdeTotal) || 0;
        const executar = Math.max(0, qtde - executado);
        const realIni = executado > 0 ? now : null;
        const realFim = executado >= qtde && executado > 0 ? now : null;
        // Converter datas BR (dd/mm/yyyy) para formato MySQL (yyyy-mm-dd hh:mm:ss)
        const toMySQLDate = (val) => {
          if (!val) return null;
          const s = String(val).trim();
          // Ja esta em formato ISO ou MySQL
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 19);
          // Formato BR: dd/mm/yyyy ou dd/mm/yyyy hh:mm:ss
          const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
          if (m) return `${m[3]}-${m[2]}-${m[1]} 00:00:00`;
          return null;
        };

        const planIni = mapping.planIni ? toMySQLDate(item[mapping.planIni]) : null;
        const planFim = mapping.planFim ? toMySQLDate(item[mapping.planFim]) : null;

        if (!isDryRun) {
          // Montar INSERT dinamicamente baseado nas colunas que existem
          const insertCols = [
            'IdOrdemServico', 'codmatFabricante', 'IdProcesso', 'SequenciaExecucao',
            'TotalExecutar', 'TotalExecutado', 'RealizadoInicio', 'RealizadoFinal',
            'PlanejadoInicio', 'PlanejadoFinal', 'IdTag', 'IdProjeto'
          ];
          const insertVals = [
            item.IdOrdemServico, item.CodMatFabricante,
            mapping.processo.IdProcessoFabricacao, mapping.seq,
            executar, executado, realIni, realFim,
            planIni, planFim,
            item.IdTag || null, item.IdProjeto || null
          ];
          // Schema antigo: IdMaterial obrigatorio
          if (isSchemaAntigo && mpCols.includes('idmaterial')) {
            insertCols.splice(1, 0, 'IdMaterial'); // inserir apos IdOrdemServico
            insertVals.splice(1, 0, item.IdMaterial || 0);
          }
          // Adicionar D_E_L_E_T_E apenas se existir na tabela
          if (mpCols.includes('d_e_l_e_t_e')) {
            insertCols.push('D_E_L_E_T_E');
            insertVals.push('');
          }
          const placeholders = insertCols.map(() => '?').join(', ');
          await conn.execute(
            `INSERT INTO material_processo (${insertCols.join(', ')}) VALUES (${placeholders})`,
            insertVals
          );
        }
        insertCount++;
      }
    }

    if (isDryRun) {
      console.log(`[${tenant.nome}] [DRY-RUN] Seriam inseridos ${insertCount} registros.`);
    } else {
      console.log(`[${tenant.nome}] OK ${insertCount} registros inseridos em material_processo.`);
    }

    await conn.end();
  } catch (e) {
    console.error(`[${tenant.nome}] ERRO: ${e.message}`);
    if (conn) await conn.end().catch(() => {});
  }
}

(async () => {
  console.log('\n' + '='.repeat(60));
  console.log(`MIGRACAO material_processo${isDryRun ? ' [DRY-RUN]' : ''}`);
  console.log('='.repeat(60));

  const toProcess = tenantFilter
    ? tenants.filter(t => t.db.toLowerCase() === tenantFilter.toLowerCase() ||
        t.nome.toLowerCase().includes(tenantFilter.toLowerCase()))
    : tenants;

  if (toProcess.length === 0) {
    console.log(`Tenant '${tenantFilter}' nao encontrado.`);
    process.exit(1);
  }

  for (const tenant of toProcess) {
    await migrateTenant(tenant);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Migracao concluida.');
})();
