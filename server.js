const WebSocket = require('ws');
const express = require('express');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/audio' });

const ELEVENLABS_SOCKET_BASE = 'wss://api.elevenlabs.io/v1/convai/conversation';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

wss.on('connection', (twilioSocket, req) => {
  const params = new URLSearchParams(req.url.split('?')[1]);
  const lang = params.get('lang') || 'en';

  console.log(`[+] New Twilio connection, language: ${lang}`);

  const elevenSocket = new WebSocket(`${ELEVENLABS_SOCKET_BASE}?agent_id=${ELEVENLABS_AGENT_ID}`, {
    headers: { 'xi-api-key': ELEVENLABS_API_KEY }
  });

  elevenSocket.on('open', () => console.log('Connected to ElevenLabs'));
  elevenSocket.on('message', data => twilioSocket.readyState === WebSocket.OPEN && twilioSocket.send(data));
  twilioSocket.on('message', data => elevenSocket.readyState === WebSocket.OPEN && elevenSocket.send(data));

  const closeAll = () => {
    if (twilioSocket.readyState === WebSocket.OPEN) twilioSocket.close();
    if (elevenSocket.readyState === WebSocket.OPEN) elevenSocket.close();
  };

  twilioSocket.on('close', closeAll);
  elevenSocket.on('close', closeAll);
  twilioSocket.on('error', console.error);
  elevenSocket.on('error', console.error);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Bridge server listening on port ${PORT}`));
