// api.js - Handles communication with the Backend

// 🟢 CONFIGURATION
// Change to 'http://localhost:3000' if running locally
const API_BASE_URL = 'https://cms-ck.onrender.com';

/**
 * Helper function to handle Fetch requests
 * @param {string} endpoint - The API endpoint (e.g., '/posts')
 * @param {string} method - HTTP Method (GET, POST, PATCH, DELETE)
 * @param {object} body - JSON body (optional)
 * @param {boolean} authRequired - Whether to send the JWT token
 */
async function apiRequest(endpoint, method = 'GET', body = null, authRequired = false) {
    const headers = {
        'Content-Type': 'application/json'
    };

    // If Auth is required, get token from localStorage
    if (authRequired) {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('You are not logged in!');
            window.location.replace('index.html');
            return;
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Handle errors (like 401 Unauthorized)
        if (!response.ok) {
            if (response.status === 401) {
                alert('Session expired. Please login again.');
                localStorage.removeItem('access_token');
                window.location.replace('index.html');
                return;
            }
            throw new Error(`API Error: ${response.statusText}`);
        }

        // Return JSON response if content exists
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        }
        return null; // No content (common for Delete)

    } catch (error) {
        console.error('Request failed:', error);
        alert('Something went wrong. Check console for details.');
        throw error;
    }
}

/**
 * Upload File Helper (Expects FormData)
 */
async function apiUpload(endpoint, formData) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert('Login required to upload!');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                // 'Content-Type': 'multipart/form-data' // ⚠️ Fetch sets this automatically with boundary
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Upload failed');
        return await response.json();
    } catch (error) {
        console.error('Upload Error:', error);
        alert('Upload failed!');
        throw error;
    }
}
