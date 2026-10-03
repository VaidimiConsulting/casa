const fs = require('fs');
const file = 'frontend/client/src/pages/Home.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove fetchBooks block
content = content.replace(/\s*fetchBooks\(\)[\s\S]*?catch\(\(err\) => console\.log\("Library books fetch error:", err\)\);/, '');

// Remove libraryBooks state definition
content = content.replace(/\s*const \[libraryBooks, setLibraryBooks\] = useState<LibraryBook\[\]>\(\[\]\);/, '');

// Remove library nav button
content = content.replace(/\s*<button onClick=\{\(\) => scrollTo\("library"\)\}>Library<\/button>/g, '');

// Remove library section
content = content.replace(/\s*\{\/\* Homestay Library & Reading Lounge Section \*\/\}\s*<section id="library"[\s\S]*?<\/section>/, '');

fs.writeFileSync(file, content);
