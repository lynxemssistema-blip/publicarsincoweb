const { chromium } = require('playwright');
const jwt = require('jsonwebtoken');

(async () => {
    // Generate a valid superadmin token
    const token = jwt.sign({ username: 'superadmin', isSuperAdmin: true }, 'SincoWebSecret2026!KeySecure', { expiresIn: '12h' });

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message, error.stack));
    
    // Go to the domain first so we can set localStorage
    await page.goto('https://sinco.lynxems.com.br/login_inicial.html');
    
    // Set localStorage
    await page.evaluate((t) => {
        localStorage.setItem('superadmin_token', t);
        localStorage.setItem('bancoSelecionado', 'lynxlocal'); // Default banco?
    }, token);

    // Now go to ordens-servico
    await page.goto('https://sinco.lynxems.com.br/ordens-servico');
    
    await page.waitForTimeout(5000); 
    
    try {
        const errorText = await page.textContent('h2:has-text("Something went wrong")');
        if (errorText) {
            console.log("FOUND ERROR BOUNDARY TEXT:", errorText);
            const details = await page.textContent('details');
            console.log("ERROR DETAILS:", details);
        }
    } catch(e) {
        console.log("Error boundary not found");
    }

    await browser.close();
})();
