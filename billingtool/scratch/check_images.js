const fs = require('fs');

function checkPNG(filePath) {
    const buffer = fs.readFileSync(filePath);
    if (buffer.toString('ascii', 1, 4) !== 'PNG') {
        console.log(`${filePath} is not a valid PNG`);
        return;
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    console.log(`${filePath}: ${width}x${height}`);
}

try {
    checkPNG('public/images/logo.png');
    checkPNG('public/images/logo-main.png');
} catch (err) {
    console.error(err);
}
