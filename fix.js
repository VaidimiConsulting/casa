const fs = require('fs');
const file = 'frontend/client/src/pages/Home.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\\s*fetchBooks\\(\\)[\\s\\S]*?catch\\(\\(err\\) => console\\.log\\("Library books fetch error:", err\\)\\);/, '');

fs.writeFileSync(file, content);
