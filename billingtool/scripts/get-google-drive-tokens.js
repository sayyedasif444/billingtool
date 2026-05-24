#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const { exec } = require('child_process');
const { google } = require('googleapis');

const dotenvPath = path.join(__dirname, '..', '.env.local');

// 1. Read .env.local file
let env = {};
if (fs.existsSync(dotenvPath)) {
  const content = fs.readFileSync(dotenvPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    // Basic regex for key=value
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      // Remove quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      env[key] = value.trim();
    }
  });
}

const clientId = env.GOOGLE_DRIVE_CLIENT_ID;
const clientSecret = env.GOOGLE_DRIVE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('\n❌ Error: GOOGLE_DRIVE_CLIENT_ID or GOOGLE_DRIVE_CLIENT_SECRET is missing in .env.local.');
  console.error('Please add them to your .env.local file first:');
  console.error('  GOOGLE_DRIVE_CLIENT_ID=your_id_here');
  console.error('  GOOGLE_DRIVE_CLIENT_SECRET=your_secret_here\n');
  process.exit(1);
}

const PORT = 8085;
const REDIRECT_URI = `http://localhost:${PORT}`;

// 2. Set up Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  REDIRECT_URI
);

// 3. Create a temporary local HTTP server to receive the authorization code
const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = url.parse(req.url, true);
    if (reqUrl.pathname === '/') {
      const code = reqUrl.query.code;
      if (code) {
        console.log('🔄 Exchanging authorization code for tokens...');
        const { tokens } = await oauth2Client.getToken(code);
        
        if (!tokens.refresh_token) {
          console.warn('\n⚠️ Warning: No refresh token returned. If you are re-authorizing, please remove the app from your Google account settings first, or delete any previous approvals.');
        }

        // Read the env.local file again to ensure we don't overwrite concurrent changes
        let content = fs.readFileSync(dotenvPath, 'utf8');

        // Comment out old Service Account variables if present to avoid confusion
        content = content.replace(/^(GOOGLE_DRIVE_CLIENT_EMAIL=.*)/gm, '# $1');
        content = content.replace(/^(GOOGLE_DRIVE_PRIVATE_KEY=.*)/gm, '# $1');

        // Remove any existing GOOGLE_DRIVE_REFRESH_TOKEN lines
        content = content.replace(/\r?\nGOOGLE_DRIVE_REFRESH_TOKEN=.*\r?\n?/g, '\n');

        // Append the new refresh token (and also make sure it ends with a newline)
        if (!content.endsWith('\n')) {
          content += '\n';
        }
        content += `GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token || ''}\n`;

        fs.writeFileSync(dotenvPath, content, 'utf8');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding-top: 50px; background-color: #f3f4f6; margin: 0;">
              <div style="display: inline-block; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); max-width: 450px;">
                <div style="background-color: #D1FAE5; color: #059669; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 32px; font-weight: bold;">
                  ✓
                </div>
                <h1 style="color: #111827; font-size: 24px; margin-bottom: 10px; font-weight: 700;">OAuth Setup Completed!</h1>
                <p style="color: #4B5563; font-size: 16px; line-height: 1.5; margin-bottom: 25px;">The Google Drive refresh token has been successfully saved to your <code>.env.local</code> file.</p>
                <p style="color: #9CA3AF; font-size: 14px;">You can now close this browser tab and return to your terminal.</p>
              </div>
            </body>
          </html>
        `);

        console.log('\n✅ Successfully retrieved tokens from Google!');
        if (tokens.refresh_token) {
          console.log('📝 GOOGLE_DRIVE_REFRESH_TOKEN has been appended to .env.local');
        } else {
          console.log('ℹ️ Token retrieved successfully, but no new refresh token was provided (Google reused existing session).');
        }
        console.log('🚀 You are now ready to test the uploads endpoint!');

        // Wait a small moment before exiting to ensure response completes
        setTimeout(() => {
          server.close(() => {
            process.exit(0);
          });
        }, 1000);
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Authorization code is missing.');
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  } catch (error) {
    console.error('\n❌ Error during authorization exchange:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Internal Server Error: ${error.message}`);
    setTimeout(() => {
      server.close(() => {
        process.exit(1);
      });
    }, 1000);
  }
});

// 4. Start the server and trigger the browser authentication flow
server.listen(PORT, () => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Forces consent screen to ensure refresh token is returned
    scope: ['https://www.googleapis.com/auth/drive']
  });

  console.log('\n======================================================');
  console.log('🔑  GOOGLE DRIVE OAUTH2 AUTHORIZATION');
  console.log('======================================================');
  console.log('1. A browser tab should automatically open to log in.');
  console.log('2. Log in using your Google account and grant Drive access.');
  console.log('\nIf the browser does not open, copy & paste this URL:\n');
  console.log(authUrl);
  console.log('======================================================');
  console.log('⏳  Waiting for approval in browser...\n');

  // Attempt to auto-open browser depending on OS
  const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  try {
    exec(`${startCmd} "${authUrl}"`);
  } catch (e) {
    // Ignore opening failures (e.g. terminal context limitations)
  }
});
