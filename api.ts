import { supabase } from './supabase';

const API_Base = '/api';

/**
 * --- Case Conversion Helpers ---
 * Frontend uses camelCase (simTypeId), Backend/DB uses snake_case (sim_type_id)
 */
const toCamel = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(toCamel);
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            acc[camelKey] = toCamel(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};

const toSnake = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(toSnake);
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
            acc[snakeKey] = toSnake(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};

const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

export const api = {
    get: async (endpoint: string) => {
        const headers = await getHeaders();
        const res = await fetch(`${API_Base}${endpoint}`, { headers });
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        const data = await res.json();
        return toCamel(data);
    },

    post: async (endpoint: string, body: any) => {
        const headers = await getHeaders();
        const res = await fetch(`${API_Base}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(toSnake(body)),
        });
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        const data = await res.json();
        return toCamel(data);
    },

    put: async (endpoint: string, body: any) => {
        const headers = await getHeaders();
        const res = await fetch(`${API_Base}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(toSnake(body)),
        });
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        const data = await res.json();
        return toCamel(data);
    },

    delete: async (endpoint: string) => {
        const headers = await getHeaders();
        const res = await fetch(`${API_Base}${endpoint}`, {
            method: 'DELETE',
            headers,
        });
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        return res.json();
    },
};
