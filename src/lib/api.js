/**
 * PharmaLync API Client
 * Full-featured client with JWT interceptors, auto-refresh, and error normalization
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Core fetch wrapper with auth and error handling
 */
const apiClient = async (endpoint, options = {}) => {
    const token = localStorage.getItem('access_token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
    } catch (networkError) {
        throw new Error('Network error — please check your connection');
    }

    // Handle 401 — attempt token refresh
    if (response.status === 401 && !options._isRetry) {
        const refreshed = await attemptTokenRefresh();
        if (refreshed) {
            // Retry with new token
            return apiClient(endpoint, { ...options, _isRetry: true });
        }
        // Refresh failed — clear auth and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
    }

    let data;
    try {
        data = await response.json();
    } catch {
        data = { error: `Server returned ${response.status}` };
    }

    if (!response.ok) {
        let errorMessage = data.error || data.message || `Request failed (${response.status})`;
        
        // Extract specific validation error if present
        if (data.details && data.details.body && data.details.body.length > 0) {
            errorMessage = data.details.body[0].message;
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
};

/**
 * Attempt to refresh the access token
 */
async function attemptTokenRefresh() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) return false;

        const data = await response.json();
        localStorage.setItem('access_token', data.accessToken);
        return true;
    } catch {
        return false;
    }
}

/**
 * API namespace with all endpoints
 */
export const api = {
    // === Auth (Email OTP) ===
    auth: {
        checkEmail: (email) => apiClient('/auth/check-email', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
        register: (userData) => apiClient('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        }),
        sendOtp: (email) => apiClient('/auth/send-otp', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
        verifyOtp: (email, otp) => apiClient('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
        }),
        resendOtp: (email) => apiClient('/auth/resend-otp', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
        refresh: (refreshToken) => apiClient('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        }),
        logout: () => apiClient('/auth/logout', { method: 'POST' }),
    },

    // === Patients ===
    patients: {
        list: () => apiClient('/patients'),
        getById: (id) => apiClient(`/patients/${id}`),
        create: (data) => apiClient('/patients', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id, data) => apiClient(`/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id) => apiClient(`/patients/${id}`, { method: 'DELETE' }),
        getAadhaar: (id, consentToken) => apiClient(`/patients/${id}/aadhaar`, {
            headers: { 'X-Consent-Token': consentToken }
        }),
    },

    // === Prescriptions ===
    prescriptions: {
        list: () => apiClient('/prescriptions/my-prescriptions'),
        create: (data) => apiClient('/prescriptions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        verifyQr: (qrToken) => apiClient('/prescriptions/verify-qr', {
            method: 'POST',
            body: JSON.stringify({ qrToken }),
        }),
    },

    // === Medicines ===
    medicines: {
        list: () => apiClient('/medicines'),
        getById: (id) => apiClient(`/medicines/${id}`),
        register: (data) => apiClient('/medicines', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        dispense: (id) => apiClient(`/medicines/${id}/dispense`, {
            method: 'POST',
        }),
        getQr: (id) => apiClient(`/medicines/${id}/qr`),
        verifyQr: (qrToken) => apiClient('/medicines/verify-qr', {
            method: 'POST',
            body: JSON.stringify({ qrToken }),
        }),
    },

    // === Consent ===
    consent: {
        grant: (data) => apiClient('/consent/grant', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        revoke: (consentId) => apiClient('/consent/revoke', {
            method: 'POST',
            body: JSON.stringify({ consentId }),
        }),
        getForPatient: (patientId) => apiClient(`/consent/${patientId}`),
    },

    // === Audit ===
    audit: {
        getLogs: (filters = {}) => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, val]) => {
                if (val) params.set(key, val);
            });
            const query = params.toString();
            return apiClient(`/audit/logs${query ? `?${query}` : ''}`);
        },
        getById: (id) => apiClient(`/audit/logs/${id}`),
        verify: (id) => apiClient(`/audit/verify/${id}`),
    },

    // === Health ===
    health: () => fetch(`${API_BASE_URL.replace('/api', '')}/health`).then(r => r.json()),
};
