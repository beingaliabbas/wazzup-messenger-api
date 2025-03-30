
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const socketIO = require('socket.io');

let client = null;
let io = null;
let connectionStatus = 'disconnected';

// Initialize WhatsApp client and socket server
const initialize = (server) => {
  if (client) return;

  // Initialize socket.io
  io = socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Initialize WhatsApp client with local authentication
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './whatsapp-session'
    }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
  });

  // Event: QR code received
  client.on('qr', async (qr) => {
    console.log('QR Code received');
    connectionStatus = 'qr_received';
    
    try {
      const qrCodeDataUrl = await qrcode.toDataURL(qr);
      io.emit('qrCode', qrCodeDataUrl);
    } catch (err) {
      console.error('QR Code generation error:', err);
    }
  });

  // Event: Client is initializing
  client.on('loading_screen', (percent, message) => {
    console.log('Loading:', percent, message);
    connectionStatus = 'initializing';
    io.emit('status', { status: 'initializing', message: `Loading: ${percent}%` });
  });

  // Event: Client is ready
  client.on('ready', () => {
    console.log('WhatsApp client is ready!');
    connectionStatus = 'connected';
    io.emit('status', { status: 'connected', message: 'WhatsApp is connected!' });
  });

  // Event: Client is authenticated
  client.on('authenticated', () => {
    console.log('WhatsApp client is authenticated!');
    connectionStatus = 'authenticated';
    io.emit('status', { status: 'authenticated', message: 'WhatsApp is authenticated!' });
  });

  // Event: Authentication failed
  client.on('auth_failure', (msg) => {
    console.error('Authentication failure:', msg);
    connectionStatus = 'auth_failure';
    io.emit('status', { status: 'auth_failure', message: 'Authentication failed' });
  });

  // Event: Client disconnected
  client.on('disconnected', (reason) => {
    console.log('WhatsApp client disconnected:', reason);
    connectionStatus = 'disconnected';
    io.emit('status', { status: 'disconnected', message: 'WhatsApp disconnected' });
    
    // Reset client on disconnection
    client.destroy();
    client = null;
    
    // Reinitialize client
    initialize(server);
  });

  // Start the client
  client.initialize();
};

// Get current WhatsApp connection status
const getStatus = () => {
  return { status: connectionStatus };
};

// Send a WhatsApp message
const sendMessage = async (phone, message) => {
  if (!client || connectionStatus !== 'connected') {
    throw new Error('WhatsApp client is not connected');
  }

  try {
    // Format phone number (ensure it has country code and no special chars)
    const formattedPhone = phone.replace(/[^\d]/g, '');
    const chatId = `${formattedPhone}@c.us`;

    // Send the message
    const result = await client.sendMessage(chatId, message);
    return { success: true, messageId: result.id._serialized };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Logout and clear WhatsApp session
const logout = async () => {
  if (!client) {
    return { success: false, message: 'Client not initialized' };
  }

  try {
    await client.logout();
    client.destroy();
    client = null;
    connectionStatus = 'disconnected';
    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: error.message };
  }
};

module.exports = { 
  initialize, 
  getStatus, 
  sendMessage, 
  logout,
  getClient: () => client
};
