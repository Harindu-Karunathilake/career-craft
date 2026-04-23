const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (file === 'page.tsx' || file === 'layout.tsx') {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const appDir = path.join(process.cwd(), 'app');
const files = getFiles(appDir);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('Career Craft - ')) {
    // This is one of my generated files or injected blocks
    if (file.endsWith('layout.tsx')) {
        // If it's a simple layout wrapper I created, delete it
        if (content.includes('export default function Layout({ children }')) {
             fs.unlinkSync(file);
             console.log(`Deleted layout: ${file}`);
             continue;
        }
    }
    
    // Otherwise it's an injected block in page.tsx or an existing layout.tsx
    const newContent = content.replace(/import type { Metadata } from "next";\s+export const metadata: Metadata = {[\s\S]*?};\s+/, '');
    if (newContent !== content) {
        fs.writeFileSync(file, newContent);
        console.log(`Cleaned file: ${file}`);
    }
  }
}
