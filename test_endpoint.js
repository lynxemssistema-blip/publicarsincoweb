const fs = require('fs');

async function testFetch() {
    try {
        const idTag = 556;
        console.log(`Fetching OS for Tag ${idTag} from local API...`);
        const res = await fetch(`http://localhost:3000/api/visao-geral/tag/${idTag}/ordens-servico`, {
            headers: {
                'tenant': 'amceletrica',
                'authorization': 'Bearer MOCK_TOKEN' // If auth is needed, though middleware might just check tenant
            }
        });
        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text}`);
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testFetch();
