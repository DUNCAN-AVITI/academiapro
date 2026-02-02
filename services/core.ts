import { apiClient } from './client';
import { User, Subject, Group, Promotion, AuditLog } from '../types';

export const userService = {
    getAll: async (): Promise<User[]> => {
        return apiClient.get('/users');
    },
    me: async (): Promise<User> => {
        return apiClient.get('/auth/me');
    },
    create: async (data: any) => apiClient.post('/auth/register', data),
    update: async (id: string, data: any) => apiClient.put(`/users/${id}`, data), // Backend needs to implement PUT /users/:id
    delete: async (id: string) => apiClient.delete(`/users/${id}`) // Backend needs to implement DELETE /users/:id
};

export const subjectService = {
    getAll: async (): Promise<Subject[]> => {
        return apiClient.get('/subjects');
    },
    create: async (data: any) => apiClient.post('/subjects', data),
    delete: async (id: string) => apiClient.delete(`/subjects/${id}`)
};

export const groupService = {
    getAll: async (): Promise<Group[]> => {
        return apiClient.get('/groups');
    },
    create: async (data: any) => apiClient.post('/groups', data),
    update: async (id: string, data: any) => apiClient.put(`/groups/${id}`, data),
    delete: async (id: string) => apiClient.delete(`/groups/${id}`)
};

export const promotionService = {
    getAll: async (): Promise<Promotion[]> => {
        return apiClient.get('/promotions');
    },
    create: async (data: any) => apiClient.post('/promotions', data),
    update: async (id: string, data: any) => apiClient.put(`/promotions/${id}`, data),
    delete: async (id: string) => apiClient.delete(`/promotions/${id}`)
};

export const coreService = {
    getAuditLogs: async (): Promise<AuditLog[]> => {
        return apiClient.get('/audit-logs');
    }
};
