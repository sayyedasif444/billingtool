const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Remove console.log, console.error, console.warn
    // We use a regex that handles multi-line if needed, but simple one-liners are most common.
    // Also handling the semicolon if present.
    const newContent = content.replace(/console\.(log|error|warn)\((?:[^)(]|\((?:[^)(]|\([^)(]*\))*\))*\);?/g, '');
    if (content !== newContent) {
        fs.writeFileSync(file, newContent);
        process.stdout.write(`Cleaned: ${path.relative(process.cwd(), file)}\n`);
    }
});
