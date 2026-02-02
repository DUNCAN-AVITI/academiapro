import { apiClient } from './client';
import { Assignment, Submission } from '../types';

export const assignmentService = {
    getAll: async (): Promise<Assignment[]> => {
        return apiClient.get('/assignments');
    },

    create: async (data: any): Promise<Assignment> => {
        return apiClient.post('/assignments', data);
    },

    update: async (id: string, data: any): Promise<Assignment> => {
        return apiClient.put(`/assignments/${id}`, data);
    },

    delete: async (id: string): Promise<any> => {
        return apiClient.delete(`/assignments/${id}`);
    }
};

export const submissionService = {
    getAll: async (): Promise<Submission[]> => {
        return apiClient.get('/submissions');
    },

    submit: async (data: { assignmentId: string; fileIds: string[]; comment?: string }): Promise<Submission> => {
        return apiClient.post('/submissions', data);
    },

    grade: async (id: string, data: any): Promise<Submission> => {
        return apiClient.post(`/submissions/${id}/grade`, data);
    }
};

export const resourceService = {
    getAll: async (): Promise<any[]> => {
        return apiClient.get('/resources');
    },
    create: async (data: any) => apiClient.post('/resources', data)
};
