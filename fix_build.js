const fs = require('fs');

function replace(file, find, replaceText) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(find, replaceText);
    fs.writeFileSync(file, content);
}

// 1. Fix stats dynamic usage
let statsPath = 'src/app/api/stats/route.ts';
let statsContent = fs.readFileSync(statsPath, 'utf8');
if (!statsContent.includes('force-dynamic')) {
    fs.writeFileSync(statsPath, "export const dynamic = 'force-dynamic';\n" + statsContent);
}

// 2. Fix login Suspense
let loginPath = 'src/app/login/page.tsx';
let loginContent = fs.readFileSync(loginPath, 'utf8');
if (!loginContent.includes('Suspense')) {
    loginContent = loginContent.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect, Suspense } from 'react';");
    loginContent = loginContent.replace("export default function LoginPage() {", "function LoginContent() {");
    loginContent += `
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
`;
    fs.writeFileSync(loginPath, loginContent);
}
