require('dotenv').config();
const WebSocket = require('ws');
const readline = require('readline');
const chalk = require('chalk');
const ENDPOINT = process.env.ENDPOINT;
const NAME = process.env.NAME || 'Anonymous';

if (!ENDPOINT) {
  console.error('Set ENDPOINT in .env'); process.exit(1);
}

let ws;
let reconnectTimer;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.gray('you> ')
});

function connect() {
  ws = new WebSocket(ENDPOINT, { handshakeTimeout: 15000 });

  ws.on('open', () => {
    clearTimeout(reconnectTimer);
    console.log(chalk.green(`connected as ${NAME}`));
    // Optional: tell backend our name once on connect (if you wire a "register" route)
    // ws.send(JSON.stringify({ action: 'register', name: NAME }));
    rl.prompt();
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const who = msg.name || 'someone';
      const text = msg.message ?? data.toString();
      const at = msg.at ? new Date(msg.at).toLocaleTimeString() : '';
      // Move cursor to new line if user is typing
      process.stdout.write('\n');
      console.log(chalk.cyan(`${who}${at ? ' @ ' + at : ''}: `) + text);
      rl.prompt();
    } catch {
      process.stdout.write('\n');
      console.log(chalk.cyan('server:'), data.toString());
      rl.prompt();
    }
  });

  ws.on('close', (code) => {
    console.log(chalk.yellow(`disconnected (${code}). reconnecting...`));
    reconnectTimer = setTimeout(connect, 1500);
  });

  ws.on('error', (err) => {
    console.log(chalk.red('ws error:'), err.message);
  });
}

connect();

// Readline -> send
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return rl.prompt();
  // Your backend already routes on "action":"sendMessage"
  const payload = {
    action: 'sendMessage',
    name: NAME,          // include name so others see it
    message: trimmed
  };
  try {
    ws.send(JSON.stringify(payload));
  } catch (e) {
    console.log(chalk.red('failed to send:'), e.message);
  }
  rl.prompt();
});

// Nice exit
process.on('SIGINT', () => {
  console.log('\nbye!');
  try { ws.close(); } catch {}
  process.exit(0);
});
