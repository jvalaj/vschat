// server.js
const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });
console.log('✅ Chat server listening on ws://localhost:8080');

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    // Expect JSON: { name, text }
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const payload = JSON.stringify({
      type: 'message',
      name: msg.name || 'anon',
      text: msg.text || '',
      ts: new Date().toISOString(),
    });

    // Broadcast to everyone (including sender for consistency)
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(payload);
    });
  });

  ws.send(JSON.stringify({ type: 'info', text: 'connected to local chat' }));
});
