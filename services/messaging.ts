import { apiClient } from './client';

export const messagingService = {
    getAll: async (): Promise<any[]> => {
        return apiClient.get('/messages');
    },

    getConversation: async (userId: string): Promise<any[]> => {
        return apiClient.get(`/messages/${userId}`);
    },

    send: async (data: { receiverId: string; subject: string; content: string }): Promise<any> => {
        return apiClient.post('/messages', data);
    },

    markAsRead: async (messageId: string): Promise<any> => {
        return apiClient.put(`/messages/${messageId}/read`, {});
    },

    markAllAsRead: async (senderId: string): Promise<any> => {
        return apiClient.put(`/messages/read-all/${senderId}`, {});
    }
};

export const attendanceService = {
    getAll: async (filters?: { subjectId?: string; studentId?: string; date?: string }): Promise<any[]> => {
        const params = new URLSearchParams(filters as any).toString();
        return apiClient.get(`/attendance?${params}`);
    },

    mark: async (data: { subjectId: string; date: string; records: Array<{ studentId: string; status: string }> }): Promise<any> => {
        return apiClient.post('/attendance', data);
    }
};

export const emailService = {
    getAll: async (): Promise<any[]> => {
        return apiClient.get('/emails');
    },

    markAsRead: async (emailId: string): Promise<any> => {
        return apiClient.put(`/emails/${emailId}/read`, {});
    }
};
