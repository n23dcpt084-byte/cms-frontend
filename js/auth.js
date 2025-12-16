// auth.js - Handles Login and Logout

const loginForm = document.getElementById('loginForm');

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
                window.location.href = 'dashboard.html';
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
            window.location.replace('index.html');
        }
    }

    validate();
    // Ensure check runs even when loaded from bfcache (Back/Forward Cache)
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            validate();
        }
    });
}

// Logout Function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('access_token');
        window.location.replace('index.html');
    }
}

// Redirect to Dashboard if already logged in (for Login page)
function checkAlreadyLoggedIn() {
    const token = localStorage.getItem('access_token');
    if (token) {
        window.location.replace('dashboard.html');
    }
}
