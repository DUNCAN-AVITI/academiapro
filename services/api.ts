

import { AppNotification } from '../types';
import { apiClient } from './client';

/**
 * Service API Simulé
 * Imite des appels réseau asynchrones vers un backend
 */
export const notificationApi = {
  getNotifications: async (userId: string): Promise<AppNotification[]> => {
    return apiClient.get('/notifications');
  },

  markAsRead: async (id: string): Promise<void> => {
    return apiClient.put(`/notifications/${id}/read`, {});
  },

  clearAll: async (userId: string): Promise<void> => {
    return apiClient.delete('/notifications');
  }
};
