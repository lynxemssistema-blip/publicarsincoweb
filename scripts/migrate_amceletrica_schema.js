require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");

async function run() {
  const lynx = await mysql.createConnection({
    host: "lynxlocal.mysql.uhserver.com", user: "lynxlocal",
    password: "jHAzhFG848@yN@U", database: "lynxlocal", port: 3306
  });
  const amc = await mysql.createConnection({
    host: "amceletrica.mysql.uhserver.com", user: "brunoamc",
    password: "jHAzhFG848@yN@U", database: "amceletrica", port: 3306
  });
  console.log("[OK] Conectado a ambos os bancos");
  const [lynxCols] = await lynx.execute("DESCRIBE ordemservicoitem");
  const [amcCols]  = await amc.execute("DESCRIBE ordemservicoitem");
  const amcColSet  = new Set(amcCols.map(c => c.Field));
  const missing    = lynxCols.filter(c => !amcColSet.has(c.Field));
  console.log("Colunas ausentes em AMCELETRICA: " + missing.length);
  let ok = 0, fail = 0;
  for (const col of missing) {
    const field    = col.Field;
    const type     = col.Type;
    const nullable = col.Null === "YES" ? "NULL" : "NOT NULL";
    let defVal = " DEFAULT NULL";
    if (col.Default !== null && col.Default !== undefined) {
      const d = col.Default;
      defVal   = " DEFAULT " + (isNaN(Number(d)) || d === "" ? ("'" + d + "'") : d);
    }
    const sql = "ALTER TABLE `ordemservicoitem` ADD COLUMN `" + field + "` " + type + " " + nullable + defVal;
    try {
      await amc.execute(sql);
      console.log("[ADD] " + field);
      ok++;
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") { console.log("[SKIP] " + field + " (ja existe)"); }
      else { console.error("[FAIL] " + field + ": " + e.message); fail++; }
    }
  }
  console.log("=== Adicionadas: " + ok + "  |  Falhas: " + fail + " ===");
  await lynx.end();
  await amc.end();
}
run().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
