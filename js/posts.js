// posts.js - Logic for Managing Posts

// Load all posts on start
document.addEventListener('DOMContentLoaded', loadPosts);

const postsContainer = document.getElementById('postsContainer');
const createPostForm = document.getElementById('createPostForm');

// 🟢 FETCH & DISPLAY POSTS
async function loadPosts() {
    postsContainer.innerHTML = '<p>Loading posts...</p>';
    try {
        // GET /posts (Public endpoint, but we are admin here)
        const posts = await apiRequest('/posts');

        if (!posts || posts.length === 0) {
            postsContainer.innerHTML = '<p>No posts found.</p>';
            return;
        }

        postsContainer.innerHTML = ''; // Clear loading
        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = `
                <h3>${escapeHtml(post.title)}</h3>
                <p>${escapeHtml(post.content)}</p>
                ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image" style="max-width: 200px;">` : ''}
                <div style="margin-top: 10px;">
                    <button class="danger" onclick="deletePost('${post._id}')">Delete</button>
                </div>
            `;
            postsContainer.appendChild(card);
        });

    } catch (error) {
        postsContainer.innerHTML = '<p style="color:red">Failed to load posts.</p>';
    }
}

// 🟢 CREATE POST
if (createPostForm) {
    createPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const fileInput = document.getElementById('imageFile');
        let imageUrl = '';

        try {
            // 1. Upload Image First (If selected)
            if (fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);

                const uploadResult = await apiUpload('/upload', formData);
                if (uploadResult && uploadResult.url) {
                    imageUrl = uploadResult.url;
                }
            }

            // 2. Create Post with the Image URL
            const postData = { title, content, imageUrl };

            // POST /posts (Requires Token)
            await apiRequest('/posts', 'POST', postData, true);

            alert('Post Created Successfully!');
            createPostForm.reset();
            loadPosts(); // Refresh list

        } catch (error) {
            alert('Failed to create post: ' + error.message);
        }
    });
}

// 🟢 DELETE POST
async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        // DELETE /posts/:id (Requires Token)
        await apiRequest(`/posts/${id}`, 'DELETE', null, true);
        alert('Post Deleted');
        loadPosts(); // Refresh list
    } catch (error) {
        alert('Failed to delete post');
    }
}

// Helper to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
