const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const io = new Server(server);

// Liaison avec l'Arduino
const port = new SerialPort({ path: process.env.SERIAL || '/dev/ttyACM0', baudRate: 115200 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
port.on('error', (err) => console.error('Erreur série :', err.message));

parser.on('data', (line) => {
  line = line.trim();
  console.log('Arduino >', line);
  io.emit('arduino', line);            // envoie le message à toutes les pages ouvertes
});

io.on('connection', (socket) => {
  socket.on('cmd', (cmd) => port.write(cmd + '\n'));   // page → Arduino
  socket.on('chat', (msg) => io.emit('chat', msg));     // chat QG ↔ agents
});

server.listen(3000, () => console.log('Serveur prêt sur le port 3000'));
