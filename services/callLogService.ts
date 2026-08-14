import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/config.constants';

export class CallLogService {
  public static async getHistory() {
    const token = await SecureStore.getItemAsync('authToken');
    const response = await fetch(`${API_URL}/call-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const text = await response.text();
      console.error(`CallLogService GET /call-logs failed: ${response.status} - ${text}`);
      throw new Error(`Failed to fetch call history: ${response.status}`);
    }
    return await response.json();
  }

  public static async deleteLog(id: string) {
    const token = await SecureStore.getItemAsync('authToken');
    const response = await fetch(`${API_URL}/call-logs/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to delete call log');
    return await response.json();
  }

  public static async clearHistory() {
    const token = await SecureStore.getItemAsync('authToken');
    const response = await fetch(`${API_URL}/call-logs`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to clear call history');
    return await response.json();
  }
  public static async markSeen() {
    const token = await SecureStore.getItemAsync('authToken');
    const response = await fetch(`${API_URL}/call-logs/seen`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to mark calls as seen');
    return await response.json();
  }
}
