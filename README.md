# Simple CMS Frontend (University Project)

A minimal HTML/JS frontend that connects to the deployed NestJS Backend.

## 📁 Structure
*   `login.html` - Admin Login Page.
*   `dashboard.html` - Admin landing page.
*   `posts.html` - Manage posts (Create, Read, Delete).
*   `js/` - Logic for Auth, API, and Posts.

## 🚀 How to Run

Since we use ES6 modules and Fetch API, **you must serve this folder**. You cannot just double-click `.html` files.

### Option 1: Live Server (VS Code) - Recommended
1.  Install the "Live Server" extension in VS Code.
2.  Right-click `login.html` and select **"Open with Live Server"**.

### Option 2: Python (Terminal)
If you have Python installed:
\`\`\`bash
cd cms-frontend
python -m http.server 8000
\`\`\`
Then open: `http://localhost:8000/login.html`

## 🔑 Login
*   **Email:** `admin@cms.com`
*   **Password:** `admin`

## 🌐 Configuration
If you need to switch between Local and Render backend:
1.  Open `js/api.js`
2.  Change `API_BASE_URL`:
    *   **Render:** `https://cms-ck.onrender.com`
    *   **Local:** `http://localhost:3000`
