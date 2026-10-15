const API_BASE_URL = "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Request failed: ${response.status}`);
    }

    return response.json();
}

export const api = {
    getTickets: (filters = {}) => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        const query = params.toString();

        return request(`/tickets${query ? `?${query}` : ""}`);
    },

    createTicket: (ticket) =>
        request("/tickets", {
            method: "POST",
            body: JSON.stringify(ticket),
        }),

    closeTicket: (id) =>
        request(`/tickets/${id}/close`, {
            method: "PATCH",
        }),

    getStats: () => request("/dashboard/stats"),

    health: () => request("/health"),
};