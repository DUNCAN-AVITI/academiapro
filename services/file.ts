import { apiClient } from './client';
import { FileMetadata } from '../types';

export const fileService = {
    upload: async (file: File, onProgress?: (p: number) => void): Promise<FileMetadata> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const base64 = reader.result as string;
                    const payload = {
                        name: file.name,
                        size: file.size,
                        mimeType: file.type,
                        data: base64
                    };
                    const result = await apiClient.post('/files/upload', payload);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    download: async (fileId: string, defaultName: string) => {
        try {
            const result = await apiClient.get(`/files/${fileId}/download`);
            if (result.data) {
                let dataUrl = result.data;
                const finalName = result.name || defaultName;

                // Ensure it's a valid Data URI for fetch
                if (!dataUrl.startsWith('data:')) {
                    const mimeType = result.mimeType || 'application/octet-stream';
                    dataUrl = `data:${mimeType};base64,${dataUrl}`;
                }

                // Definitive way to convert Data URI to Blob reliably without manual decoding
                const res = await fetch(dataUrl);
                const blob = await res.blob();

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = finalName;
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            }
        } catch (e) {
            console.error("Download failed", e);
            alert("Erreur de téléchargement");
        }
    }
};
