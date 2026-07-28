const db = require('../src/config/db.js');

async function findUsers() {
  try {
    const [centralUsers] = await db.executeOnDefault("SELECT id, login, superadmin FROM usuarios_central");
    console.log('Central Users:', centralUsers);

    const [localUsers] = await db.executeOnDefault("SELECT idUsuario, Login, TipoUsuario FROM usuario");
    console.log('Local Users:', localUsers);
  } catch (err) {
    console.error('Error finding users:', err);
  } finally {
    process.exit(0);
  }
}

findUsers();
