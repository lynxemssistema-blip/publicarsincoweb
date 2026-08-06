const axios = require('axios');

async function run() {
  try {
    // 1. Login to get token
    const loginRes = await axios.post('http://localhost:3000/api/login', {
      email: 'admin', // assuming some admin user or I can use any valid endpoint
      senha: 'admin'
    });
    const token = loginRes.data.token;
    console.log('Login successful');
    
    // 2. Fetch tags
    const res = await axios.get('http://localhost:3000/api/acompanhamento/projeto/87/tags?limit=500', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const tags = res.data.data || res.data;
    console.log(`Fetched ${tags.length} tags`);
    if (tags.length > 0) {
      const t = tags[0];
      console.log('Sample tag txtCORTE:', t.txtCORTE);
      console.log('Sample tag D_E_L_E_T_E:', t.D_E_L_E_T_E);
    }
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
run();
