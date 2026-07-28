const fs = require('fs');

const modalFile = './frontend/src/components/SectorProductionModal.tsx';
if (fs.existsSync(modalFile)) {
    let mContent = fs.readFileSync(modalFile, 'utf8');

    // Make sure createPortal is imported from react-dom
    if (!mContent.includes("import { createPortal } from 'react-dom'")) {
        mContent = mContent.replace(
            "import React, { useState, useEffect } from 'react';",
            "import React, { useState, useEffect } from 'react';\nimport { createPortal } from 'react-dom';"
        );
    }

    // Wrap the returned JSX in createPortal(..., document.body) with z-[99999]
    const oldReturn = `  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">`;

    const newReturn = `  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">`;

    if (mContent.includes(oldReturn)) {
        mContent = mContent.replace(oldReturn, newReturn);

        // Update the closing brace of the return to include , document.body)
        const oldClosing = `    </div>
  );
}`;
        const newClosing = `    </div>,
    document.body
  );
}`;
        if (mContent.includes(oldClosing)) {
            mContent = mContent.replace(oldClosing, newClosing);
            fs.writeFileSync(modalFile, mContent, 'utf8');
            console.log('✅ SectorProductionModal.tsx updated with createPortal and z-[99999]!');
        }
    }
}

console.log('🎉 React Portal & z-index patch completed!');
