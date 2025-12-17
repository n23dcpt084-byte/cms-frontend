// auth.js - Handles Login and Logout

const loginForm = document.getElementById('loginForm');

// 🟢 JWT Helper
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Call Login API (Start with manual fetch to handle sensitive token logic)
            // Or use our apiRequest helper if adapted. Let's use fetch directly for clarity here.

            const response = await fetch('https://cms-ck.onrender.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Invalid Credentials');
            }

            const data = await response.json();

            // 🟢 SAVE TOKEN
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                alert('Login Successful!');
                window.location.href = 'posts.html';
            } else {
                throw new Error('No token received');
            }
        } catch (error) {
            alert(error.message);
        }
    });
}

// Check Access on Dashboard Protected Pages
function checkAuth() {
    function validate() {
        const token = localStorage.getItem('access_token');
        if (!token) {
            window.location.replace('login.html');
            return;
        }

        // Check Expiry
        const payload = parseJwt(token);
        if (!payload || !payload.exp || (Date.now() >= payload.exp * 1000)) {
            // Token expired or invalid
            alert('Session expired. Please login again.');
            localStorage.removeItem('access_token');
            window.location.replace('login.html');
        }
    }

    validate();
    // Ensure check runs even when loaded from bfcache (Back/Forward Cache)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            validate();
        }
    });

    // 🔒 DISABLE BROWSER BACK BUTTON
    // Pushing the current state into history so "Back" just reloads the same state
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = function () {
        window.history.pushState(null, "", window.location.href);
    };
}

// Logout Function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('access_token');
        // Use replace to clear the current history entry
        window.location.replace('index.html');
    }
}

// Redirect to Dashboard if already logged in (for Login page)
function checkAlreadyLoggedIn() {
    const token = localStorage.getItem('access_token');
    if (token) {
        // Validate before redirecting
        const payload = parseJwt(token);
        if (payload && payload.exp && (Date.now() < payload.exp * 1000)) {
            window.location.replace('posts.html');
        } else {
            // Invalid/Expired token on login page -> Clear it
            localStorage.removeItem('access_token');
        }
    }
}
