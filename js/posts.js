// posts.js - Logic for Managing Posts

// Load all posts on start
let quill;
document.addEventListener('DOMContentLoaded', () => {
    initQuill();
    loadPosts();
});

function initQuill() {
    quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            imageResize: {
                displaySize: true
            },
            toolbar: {
                container: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'image', 'video']
                ],
                handlers: {
                    'image': selectLocalImage,
                    'video': selectVideo
                }
            }
        }
    });
}

// 🟢 Custom Image Handler for Quill
function selectLocalImage() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
        const file = input.files[0];
        if (/^image\//.test(file.type)) {
            await saveToServer(file);
        } else {
            console.warn('You could only upload images.');
        }
    };
}

// Upload to Server and insert URL
async function saveToServer(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const result = await apiUpload('/upload', formData);
        if (result && result.url) {
            insertToEditor(result.url);
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
    }
}

// Insert Image URL into Editor
// Insert Image URL into Editor
function insertToEditor(url) {
    const range = quill.getSelection();
    quill.insertEmbed(range.index, 'image', url);
}

// 🟢 Custom Video Handler
function selectVideo() {
    let url = prompt("Enter Video URL (YouTube, Facebook, TikTok):");
    if (!url) return;

    let embedUrl = null;

    // Detect Platform
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = url.split('v=')[1] || url.split('/').pop();
        const ampersandPosition = videoId.indexOf('&');
        if (ampersandPosition !== -1) {
            videoId = videoId.substring(0, ampersandPosition);
        }
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
        embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&t=0`;
    } else if (url.includes('tiktok.com')) {
        let videoId = url.split('/video/')[1];
        if (videoId) videoId = videoId.split('?')[0];
        embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
    }

    if (embedUrl) {
        const range = quill.getSelection(true); // true = focus
        // Insert clean Iframe wrapped in resizable container
        const iframeHTML = `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`;
        const wrappedHTML = getResizableWrapper(iframeHTML, 'video');
        quill.clipboard.dangerouslyPasteHTML(range.index, wrappedHTML);
    } else {
        alert("Invalid or Unsupported Video URL");
    }
}

// 🟢 Helper: Create Resizable Wrapper
function getResizableWrapper(content, type = 'image') {
    // Basic Style for Wrapper
    const minWidth = type === 'video' ? '300px' : '100px';
    const minHeight = type === 'video' ? '200px' : '100px';

    return `
    <div style="
        resize: both; 
        overflow: hidden; 
        display: inline-block; 
        border: 1px dashed #ccc; 
        margin: 10px; 
        vertical-align: top; 
        position: relative;
        min-width: ${minWidth};
        min-height: ${minHeight};
        max-width: 100%;">
        ${content}
    </div><p><br></p>`;
}

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
                <div class="post-content">${post.content}</div>
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

// 🟢 MODAL LOGIC
const modal = document.getElementById("postModal");
const modalTitle = document.getElementById("modalTitle");

window.openCreateModal = function () {
    resetForm();
    modalTitle.textContent = "Create New Post";
    modal.style.display = "block";
    quill.setSelection(0); // Focus
};

window.closeModal = function () {
    modal.style.display = "none";
    resetForm();
};

// Start Edit Mode (Modified for Modal)
window.startEdit = function (post) {
    isEditing = true;
    currentPostId = post._id;

    // Open Modal
    modal.style.display = "block";
    modalTitle.textContent = "Edit Post";

    // Populate Data
    document.getElementById('title').value = post.title;
    quill.root.innerHTML = post.content;
};

// Close modal if clicked outside
window.onclick = function (event) {
    if (event.target == modal) {
        closeModal();
    }
};

// 🟢 HANDLE FORM SUBMIT (CREATE OR UPDATE)
if (createPostForm) {
    createPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const content = quill.root.innerHTML;
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
                resetForm();
            }

            loadPosts();
            closeModal();

        } catch (error) {
            alert('Failed to save post: ' + error.message);
        }
    });
}

function resetForm() {
    isEditing = false;
    currentPostId = null;
    createPostForm.reset();
    quill.root.innerHTML = '';
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
