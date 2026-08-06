const fs = require('fs');
const path = 'c:/SincoWeb/SINCO-WEB/SINCO-WEB/frontend/src/components/SectorProductionModal.tsx';
let code = fs.readFileSync(path, 'utf8');

const styleBlock = `
        <style>
          {\`
            input[type="date"]::-webkit-calendar-picker-indicator {
              display: block !important;
              opacity: 1 !important;
              cursor: pointer !important;
              background-image: url('data:image/svg+xml;utf8,<svg fill="%2332423D" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>') !important;
            }
          \`}
        </style>
`;

if (!code.includes('<style>')) {
  code = code.replace('{/* MODAL BODY */}', styleBlock + '\n        {/* MODAL BODY */}');
  fs.writeFileSync(path, code);
  console.log('Injected custom CSS to force calendar icon visibility');
}
