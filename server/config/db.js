const mongoose = require('mongoose');
const dns = require('dns');

function isLoopbackDnsServer(server) {
  return server === '::1' || server === 'localhost' || server.startsWith('127.');
}

function configureSrvDns(uri) {
  if (!uri.startsWith('mongodb+srv://')) {
    return;
  }

  const envServers = (process.env.MONGODB_DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
  const currentServers = dns.getServers();
  const needsFallback =
    envServers.length > 0 ||
    currentServers.length === 0 ||
    currentServers.every(isLoopbackDnsServer);

  if (needsFallback) {
    dns.setServers(envServers.length > 0 ? envServers : ['1.1.1.1', '8.8.8.8']);
  }
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Copy server/.env.example to server/.env and add your MongoDB Atlas URI.');
  }

  configureSrvDns(uri);
  mongoose.set('strictQuery', true);

  const options = {};
  if (process.env.MONGODB_DB_NAME) {
    options.dbName = process.env.MONGODB_DB_NAME;
  }

  const connection = await mongoose.connect(uri, options);
  console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);

  return connection;
}

module.exports = connectDB;
