// posts.js - Logic for Managing Posts

// Load all posts on start
document.addEventListener('DOMContentLoaded', loadPosts);

const postsContainer = document.getElementById('postsContainer');
const createPostForm = document.getElementById('createPostForm');
const submitBtn = createPostForm ? createPostForm.querySelector('button[type="submit"]') : null;
const formTitle = createPostForm ? createPostForm.parentElement.querySelector('h2') : null;

let isEditing = false;
let currentPostId = null;

// 🟢 FETCH & DISPLAY POSTS
async function loadPosts() {
    postsContainer.innerHTML = '<p>Loading posts...</p>';
    try {
        const posts = await apiRequest('/posts');

        if (!posts || posts.length === 0) {
            postsContainer.innerHTML = '<p>No posts found.</p>';
            return;
        }

        postsContainer.innerHTML = '';
        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'post-card';
            // Handle image
            const imgHtml = post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image" style="max-width: 200px; display:block; margin: 10px 0;">` : '';

            card.innerHTML = `
                <h3>${escapeHtml(post.title)}</h3>
                <p style="white-space: pre-wrap;">${escapeHtml(post.content)}</p>
                ${imgHtml}
                <div style="margin-top: 15px;">
                    <button class="secondary" style="width: auto; margin-right: 10px;" onclick='startEdit(${JSON.stringify(post).replace(/'/g, "&#39;")})'>Edit</button>
                    <button class="danger" onclick="deletePost('${post._id}')">Delete</button>
                </div>
            `;
            postsContainer.appendChild(card);
        });

    } catch (error) {
        postsContainer.innerHTML = '<p style="color:red">Failed to load posts.</p>';
        console.error(error);
    }
}

// 🟢 START EDIT MODE
window.startEdit = function (post) {
    isEditing = true;
    currentPostId = post._id;

    // Populate Form
    document.getElementById('title').value = post.title;
    document.getElementById('content').value = post.content;

    // Update UI
    if (submitBtn) submitBtn.textContent = 'Update Post';
    if (formTitle) formTitle.textContent = 'Edit Post';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 🟢 HANDLE FORM SUBMIT (CREATE OR UPDATE)
if (createPostForm) {
    createPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const fileInput = document.getElementById('imageFile');
        let imageUrl = undefined; // Undefined means don't update image if not provided

        try {
            // 1. Upload Image (If selected)
            if (fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                const uploadResult = await apiUpload('/upload', formData);
                if (uploadResult && uploadResult.url) {
                    imageUrl = uploadResult.url;
                }
            }

            const postData = { title, content };
            if (imageUrl) postData.imageUrl = imageUrl;

            if (isEditing) {
                // UPDATE (PATCH)
                await apiRequest(`/posts/${currentPostId}`, 'PATCH', postData, true);
                alert('Post Updated Successfully!');
                resetForm();
            } else {
                // CREATE (POST)
                if (!imageUrl) delete postData.imageUrl; // Don't send undefined
                await apiRequest('/posts', 'POST', postData, true);
                alert('Post Created Successfully!');
                createPostForm.reset();
            }

            loadPosts();

        } catch (error) {
            alert('Failed to save post: ' + error.message);
        }
    });
}

function resetForm() {
    isEditing = false;
    currentPostId = null;
    createPostForm.reset();
    if (submitBtn) submitBtn.textContent = 'Publish Post';
    if (formTitle) formTitle.textContent = 'Create New Post';
}

// 🟢 DELETE POST
window.deletePost = async function (id) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        await apiRequest(`/posts/${id}`, 'DELETE', null, true);
        alert('Post Deleted');
        loadPosts();
    } catch (error) {
        alert('Failed to delete post');
    }
};

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
