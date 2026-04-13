const fs = require('fs');
const path = require('path');

const traverse = (dir) => {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            traverse(p);
        } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
            let content = fs.readFileSync(p, 'utf8');
            if (content.match(/model:\s*google\(['"`]gemini-[\w.-]+['"`]\)/)) {
                
                // Add import if not exists
                if (!content.includes("DEFAULT_AI_MODEL")) {
                    const importStatement = `import { DEFAULT_AI_MODEL } from '@/constants/ai';\n`;
                    // find last import or top of file
                    const importPattern = /import\s+.*?;?\n/g;
                    let lastIndex = 0;
                    let match;
                    while ((match = importPattern.exec(content)) !== null) {
                        lastIndex = importPattern.lastIndex;
                    }
                    content = content.slice(0, lastIndex) + importStatement + content.slice(lastIndex);
                }

                // Replace model strings
                content = content.replace(/model:\s*google\(['"`]gemini-[\w.-]+['"`]\)/g, `model: google(DEFAULT_AI_MODEL)`);
                fs.writeFileSync(p, content, 'utf8');
                console.log(`Replaced in ${p}`);
            }
        }
    }
}

traverse('app');
traverse('lib/actions');
