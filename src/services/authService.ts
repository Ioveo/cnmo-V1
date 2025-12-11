
// src/services/authService.ts
import { User, AuthResponse } from '../types';

const API_BASE = ''; 

export const authService = {
    // Get headers with token
    getHeaders(): HeadersInit {
        const token = localStorage.getItem('nexus_auth_token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    },

    async register(email: string, password: string, username: string): Promise<AuthResponse> {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '注册失败');
        }
        
        const data = await res.json();
        this.setSession(data);
        return data;
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '登录失败');
        }

        const data = await res.json();
        this.setSession(data);
        return data;
    },

    async getMe(): Promise<User | null> {
        const token = localStorage.getItem('nexus_auth_token');
        if (!token) return null;

        try {
            const res = await fetch(`${API_BASE}/api/auth/me`, {
                headers: this.getHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                // Update local user data if valid
                localStorage.setItem('nexus_user', JSON.stringify(data.user));
                return data.user;
            } else {
                // Token invalid
                this.logout();
                return null;
            }
        } catch (e) {
            return null;
        }
    },
    
    async updateProfile(username: string, password?: string): Promise<User> {
        const res = await fetch(`${API_BASE}/api/auth/update`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ username, password })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '更新失败');
        }
        
        const data = await res.json();
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        return data.user;
    },

    setSession(data: AuthResponse) {
        localStorage.setItem('nexus_auth_token', data.token);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
    },

    logout() {
        localStorage.removeItem('nexus_auth_token');
        localStorage.removeItem('nexus_user');
        window.location.reload();
    },

    getCurrentUser(): User | null {
        const u = localStorage.getItem('nexus_user');
        return u ? JSON.parse(u) : null;
    }
};
