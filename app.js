import dotenv from 'dotenv';
import express from 'express';
import { Readable } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import EventEmitter from 'events';
import axios from 'axios';
import expressWs from 'express-ws'; // Import express-ws

import { streamAudioToA2F } from './grpcClient.js';

dotenv.config();
EventEmitter.defaultMaxListeners = 100;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3001;

// Use express-ws middleware
expressWs(app);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/public')));

// Endpoint to start the streaming process
app.post('/startStreaming', async (req, res) => {
  const { ttsStream } = req.body;

  try {
    // Stream audio to Audio2Face if the toggle is enabled
    streamAudioToA2F(ttsStream);
    res.json({
      message: 'Audio streaming initiated to Audio2Face',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// WebSocket route
app.ws('/websocket', (ws, req) => {
  ws.on('message', (msg) => {
    // Handle WebSocket messages here
    console.log('Received message:', msg);
    streamAudioToA2F(msg);
  });

  // You can add more WebSocket handling code here

  // Close the WebSocket connection
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
