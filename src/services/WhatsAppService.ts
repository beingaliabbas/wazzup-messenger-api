
import axios from 'axios';

// Backend API URL (change as needed for production)
const API_URL = 'http://localhost:3001/api';

export interface WhatsAppStatus {
  status: 'disconnected' | 'qr_received' | 'initializing' | 'connected' | 'authenticated' | 'auth_failure';
}

export interface MessageResponse {
  success: boolean;
  messageId?: string;
  message?: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// Get WhatsApp connection status
export const getStatus = async (): Promise<WhatsAppStatus> => {
  const response = await axios.get(`${API_URL}/status`);
  return response.data;
};

// Send a WhatsApp message
export const sendMessage = async (phone: string, message: string): Promise<MessageResponse> => {
  const response = await axios.post(`${API_URL}/send_message`, { phone, message });
  return response.data;
};

// Logout and clear session
export const logout = async (): Promise<LogoutResponse> => {
  const response = await axios.get(`${API_URL}/logout`);
  return response.data;
};
