// client.js
const WebSocket = require('ws');
const readline = require('readline');

// ANSI color codes for terminal colors
const colors = [
  '\x1b[31m', // red
  '\x1b[32m', // green
  '\x1b[33m', // yellow
  '\x1b[34m', // blue
  '\x1b[35m', // magenta
  '\x1b[36m', // cyan
  '\x1b[91m', // bright red
  '\x1b[92m', // bright green
  '\x1b[93m', // bright yellow
  '\x1b[94m', // bright blue
  '\x1b[95m', // bright magenta
  '\x1b[96m', // bright cyan
];
const resetColor = '\x1b[0m';

// Function to get a consistent color for a username
function getUserColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const name = process.argv[2] || 'anon';
const ws = new WebSocket('ws://localhost:8080');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

ws.on('open', () => {
  const userColor = getUserColor(name);
  console.log(`👋 connected as "${userColor}${name}${resetColor}" — type to chat. Commands: /quit`);
  rl.prompt();
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'message') {
      const t = new Date(msg.ts).toLocaleTimeString();
      const userColor = getUserColor(msg.name);
      console.log(`[${t}] ${userColor}${msg.name}${resetColor}: ${msg.text}`);
    } else if (msg.type === 'info') {
      console.log(`\x1b[90m(info) ${msg.text}${resetColor}`); // gray for info messages
    } else {
      console.log(data.toString());
    }
  } catch {
    console.log(data.toString());
  }
  rl.prompt();
});

rl.on('line', (line) => {
  const text = line.trim();
  if (text === '/quit') {
    rl.close();
    ws.close();
    return;
  }
  if (text.length) ws.send(JSON.stringify({ name, text }));
  rl.prompt();
});

ws.on('close', () => {
  console.log('🔌 disconnected');
  process.exit(0);
});
