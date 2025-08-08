#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up uploads directory structure...\n');

// Define the uploads directory structure
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const businessLogosDir = path.join(uploadsDir, 'business-logos');

// Create directories if they don't exist
const directories = [
  uploadsDir,
  businessLogosDir
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`ℹ️  Directory already exists: ${dir}`);
  }
});

// Create a .gitkeep file to ensure the directory is tracked by git
const gitkeepPath = path.join(uploadsDir, '.gitkeep');
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, '');
  console.log('✅ Created .gitkeep file');
}

console.log('\n🎉 Uploads directory structure setup complete!');
console.log('\n📁 Directory structure:');
console.log('public/');
console.log('└── uploads/');
console.log('    ├── .gitkeep');
console.log('    └── business-logos/');
console.log('        └── [business-id]/');
console.log('            └── [timestamp]-logo.[extension]');
console.log('\n💡 Note: The .gitignore file has been updated to exclude uploaded files from version control.'); 