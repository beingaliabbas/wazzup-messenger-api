
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const whatsappService = require('./services/whatsappService');

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize WhatsApp service
whatsappService.initialize(server);

// API Routes
// Get WhatsApp connection status
app.get('/api/status', (req, res) => {
  const status = whatsappService.getStatus();
  res.json(status);
});

// Send a WhatsApp message
app.post('/api/send_message', async (req, res) => {
  const { phone, message } = req.body;
  
  if (!phone || !message) {
    return res.status(400).json({ success: false, message: 'Phone number and message are required' });
  }
  
  try {
    const result = await whatsappService.sendMessage(phone, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Logout and clear session
app.get('/api/logout', async (req, res) => {
  try {
    const result = await whatsappService.logout();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
