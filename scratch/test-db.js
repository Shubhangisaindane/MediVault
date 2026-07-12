const net = require('net');

const host = 'db.sbcotpccmckdtdydabxo.supabase.co';
const port = 5432;

console.log(`Attempting to connect to ${host}:${port}...`);

const socket = net.createConnection(port, host, () => {
  console.log('SUCCESS: Connected to host!');
  socket.end();
});

socket.on('error', (err) => {
  console.error('ERROR connecting to host:', err.message);
});

socket.setTimeout(10000, () => {
  console.log('TIMEOUT: Connection timed out.');
  socket.destroy();
});
