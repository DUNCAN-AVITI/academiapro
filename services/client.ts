const API_URL = '/api';

export const apiClient = {
    get: async (endpoint: string) => {
        const token = localStorage.getItem('token');
        console.log(`[API] GET ${endpoint}, Token present: ${!!token}`);
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, { headers });
        if (!response.ok) {
            console.error(`[API] GET ${endpoint} failed: ${response.status} ${response.statusText}`);
            throw new Error(response.statusText);
        }
        return response.json();
    },

    post: async (endpoint: string, data: any) => {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(err.message || response.statusText);
        }
        return response.json();
    },

    put: async (endpoint: string, data: any) => {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
    },

    delete: async (endpoint: string) => {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
    },
};
