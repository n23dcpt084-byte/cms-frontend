// posts.js - Logic for Managing Posts

// Load all posts on start
let quill;
document.addEventListener('DOMContentLoaded', () => {
    initQuill();
    loadPosts();
    setInterval(updateClock, 1000);
    updateClock();
});

function updateClock() {
    const clock = document.getElementById('clock');
    if (clock) {
        const now = new Date();
        // Format: DD/MM/YYYY HH:mm:ss
        clock.textContent = now.toLocaleString('vi-VN', { hour12: false });
    }
}

// 🟢 FILTER LOGIC
let allPosts = []; // Store fetch result
let currentFilter = 'all';

window.filterPosts = function (status) { // Status can be 'all', 'draft', 'scheduled', 'published', 'archived'
    currentFilter = status;

    // Update Active Tab // Status can be 'all', 'draft', 'scheduled', 'published', 'archived'
    currentFilter = status;

    // Update Active Tab
    currentFilter = status;

    // Update Active Tab
    document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    renderPosts();
};

function renderPosts() {
    let filtered = allPosts;
    if (currentFilter !== 'all') {
        filtered = allPosts.filter(p => p.status === currentFilter);
    }

    postsContainer.innerHTML = '';
    if (filtered.length === 0) {
        postsContainer.innerHTML = '<p>No posts found.</p>';
        return;
    }

    // 🟢 List View for 'All' Tab
    if (currentFilter === 'all') {
        filtered.forEach(post => {
            const row = document.createElement('div');
            row.className = 'post-row';
            row.onclick = (e) => {
                // Open edit if not clicking delete
                if (!e.target.closest('.btn-icon')) {
                    startEdit(post);
                }
            };
            row.style.cursor = 'pointer';

            // Image
            let imgHtml = `<div class="post-row-img">No Img</div>`;
            if (post.imageUrl) {
                imgHtml = `<img src="${post.imageUrl}" class="post-row-img" alt="Post">`;
            }

            // Snippet (Strip HTML)
            const div = document.createElement('div');
            div.innerHTML = post.content;
            let text = div.textContent || div.innerText || '';
            if (text.length > 80) text = text.substring(0, 80) + '...';

            // Status Badge
            const status = post.status || 'draft';
            const badgeClass = `badge-${status}`;

            row.innerHTML = `
                ${imgHtml}
                <div class="post-row-content">
                    <div class="post-row-header">
                        <span class="post-row-title">${escapeHtml(post.title)}</span>
                        <span class="badge ${badgeClass}" style="margin-bottom:0; font-size: 11px;">${status}</span>
                    </div>
                    <div class="post-row-snippet">${text}</div>
                </div>
                <div class="post-row-actions">
                     <button class="btn-icon" title="Delete" onclick="deletePost('${post._id}'); event.stopPropagation();">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                     </button>
                </div>
            `;
            postsContainer.appendChild(row);
        });
        return;
    }

    // 🟢 Card View for Other Tabs
    filtered.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        // Handle image
        const imgHtml = post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image" style="max-width: 200px; display:block; margin: 10px 0;">` : '';

        // Status Badge
        const status = post.status || 'draft';
        const badgeClass = `badge-${status}`;

        card.innerHTML = `
            <span class="badge ${badgeClass}">${status}</span>
            <h3>${escapeHtml(post.title)}</h3>
            <div class="post-content">${post.content}</div>
            ${imgHtml}
            <div style="margin-top: 15px;">
                <button class="secondary btn-equal" style="margin-right: 10px;" onclick='startEdit(${JSON.stringify(post).replace(/'/g, "&#39;")})'>Edit</button>
                <button class="secondary btn-equal" style="margin-right: 10px; background-color: #f39c12;" onclick="archivePost('${post._id}')">Archive</button>
                <button class="danger btn-equal" onclick="deletePost('${post._id}')">Delete</button>
            </div>
        `;
        postsContainer.appendChild(card);
    });
}

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

        allPosts = posts; // Store for filtering
        renderPosts(); // Initial Render



    } catch (error) {
        postsContainer.innerHTML = '<p style="color:red">Failed to load posts.</p>';
        console.error(error);
    }
}

// 🟢 MODAL LOGIC
// 🟢 MODAL LOGIC
const modal = document.getElementById("postModal");
const modalTitle = document.getElementById("modalTitle");
const confirmModal = document.getElementById("confirmModal");
let isMinimized = false;

window.openCreateModal = function () {
    if (isMinimized) {
        modal.style.display = "block";
        isMinimized = false;
        return;
    }
    resetForm();
    modalTitle.textContent = "Create New Post";
    modal.style.display = "block";
    quill.setSelection(0); // Focus
};

// Standard Close (Reset) - Used internally or by Discard
window.closeModal = function () {
    modal.style.display = "none";
    isMinimized = false;
    resetForm();
};

window.minimizeModal = function () {
    modal.style.display = "none";
    isMinimized = true;
};

// Request Close (Triggered by X)
window.requestCloseModal = function () {
    const hasContent = quill.getText().trim().length > 0 || document.getElementById('title').value.trim().length > 0;

    if (hasContent) {
        confirmModal.style.display = "block";
    } else {
        closeModal();
    }
};

window.closeConfirmModal = function () {
    confirmModal.style.display = "none";
};

window.discardAndClose = function () {
    closeConfirmModal();
    closeModal();
};

window.saveDraftAndClose = async function () {
    document.getElementById('status').value = 'draft';
    // Trigger submit manually or call logic? 
    // Easier to reuse submit handler logic properly or just simulate submit
    // Simulating submit via button
    closeConfirmModal();

    // We need to trigger the submit handler.
    // Let's create a fake event or just call button click
    const submitBtn = createPostForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
};

// Close modal if clicked outside - DISABLED as requested
// window.onclick = function (event) {
//     if (event.target == modal) {
//         // Do nothing or minimize? User asked to fix data loss. 
//         // Doing nothing is safest.
//     }
// };

// Start Edit Mode (Restored)
window.startEdit = function (post) {
    isEditing = true;
    currentPostId = post._id;

    // Open Modal
    modal.style.display = "block";
    modalTitle.textContent = "Edit Post";

    // Populate Data
    document.getElementById('title').value = post.title;
    quill.root.innerHTML = post.content;

    // 🟢 Restrict Status for Published Posts
    const statusSelect = document.getElementById('status');
    statusSelect.value = post.status || 'draft';

    if (post.status === 'published') {
        statusSelect.disabled = true; // Lock status
        // Create an info message if not exists
        let info = document.getElementById('editInfo');
        if (!info) {
            info = document.createElement('p');
            info.id = 'editInfo';
            info.style.color = '#e67e22';
            info.style.fontSize = '13px';
            info.style.marginBottom = '10px';
            statusSelect.parentNode.insertBefore(info, statusSelect.nextSibling);
        }
        info.textContent = "Note: You are editing a published post. Status/Scheduling cannot be changed.";
        info.style.display = 'block';
    } else {
        statusSelect.disabled = false;
        const info = document.getElementById('editInfo');
        if (info) info.style.display = 'none';
    }

    updateSubmitButton(); // Update button text based on initial status

    // Date formatting for datetime-local
    if (post.publishedAt) {
        const date = new Date(post.publishedAt);
        const localIsoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        document.getElementById('publishedAt').value = localIsoString;
    }

    toggleScheduleField();
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

            const status = document.getElementById('status').value;
            let publishedAt = null;

            if (status === 'scheduled') {
                const localDateVal = document.getElementById('publishedAt').value;
                if (!localDateVal) {
                    alert("Please select a date and time for scheduling.");
                    return;
                }

                // 🟢 SAFE PARSING
                // localDateVal is "YYYY-MM-DDTHH:mm"
                const [datePart, timePart] = localDateVal.split('T');
                const [year, month, day] = datePart.split('-').map(Number);
                const [hour, minute] = timePart.split(':').map(Number);

                // Create Date using Local Constructor
                // Month is 0-indexed in JS
                const localDateObj = new Date(year, month - 1, day, hour, minute);

                // 🟢 VALIDATION: Check if time is in the past
                const now = new Date();
                const errorSpan = document.getElementById('scheduleError');
                errorSpan.style.display = 'none'; // Reset

                if (localDateObj <= now) {
                    errorSpan.textContent = "Invalid Time: Please select a future date and time.";
                    errorSpan.style.display = 'block';
                    return;
                }

                publishedAt = localDateObj.toISOString();

                publishedAt = localDateObj.toISOString();
            } else if (status === 'published') {
                publishedAt = new Date().toISOString();
            }

            const postData = { title, content, status, publishedAt };
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
    if (submitBtn) submitBtn.textContent = 'Publish Post'; // Default
    if (formTitle) formTitle.textContent = 'Create New Post';
    updateSubmitButton(); // Ensure correct default text (e.g. Save Draft if default is draft)
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

// 🟢 ARCHIVE POST
window.archivePost = async function (id) {
    if (!confirm('This post will be moved to the archive and only admins can view it.\nAre you sure completely?')) return;

    try {
        await apiRequest(`/posts/${id}`, 'PATCH', { status: 'archived' }, true);
        alert('Post Archived Successfully');
        loadPosts();
    } catch (error) {
        alert('Failed to archive post: ' + error.message);
    }
};

// 🟢 TOGGLE SCHEDULE FIELD
// 🟢 TOGGLE SCHEDULE FIELD & BUTTON TEXT
window.toggleScheduleField = function () {
    const status = document.getElementById('status').value;
    const scheduleField = document.getElementById('scheduleField');

    if (status === 'scheduled') {
        scheduleField.style.display = 'block';
    } else {
        scheduleField.style.display = 'none';
    }
    updateSubmitButton();
};

function updateSubmitButton() {
    const status = document.getElementById('status').value;
    const submitBtn = document.querySelector('#createPostForm button[type="submit"]');
    if (!submitBtn) return;

    if (status === 'draft') {
        submitBtn.textContent = 'Save Draft';
    } else if (status === 'scheduled') {
        submitBtn.textContent = 'Set Post';
    } else if (status === 'published') {
        submitBtn.textContent = 'Publish Now';
    }
}

// Ensure the helper works on init too - add listener to status change?
// It's already called by toggleScheduleField which is called by startEdit.
// But we need to call it when user manually changes status dropdown.
document.getElementById('status').addEventListener('change', window.toggleScheduleField);

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
