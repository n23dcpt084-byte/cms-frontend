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
let currentEmbeds = []; // 🟢 Store active embeds
let currentFilter = 'all';
let originalSnapshot = ''; // 🟢 For Dirty Check

// 🟢 Helper: Get Current Form Snapshot
function getFormSnapshot() {
    return JSON.stringify({
        title: document.getElementById('title').value,
        slug: document.getElementById('slug').value,
        sourceType: document.getElementById('sourceType').value,
        sourceUrl: document.getElementById('sourceUrl').value,
        mediaRatio: document.getElementById('mediaRatio').value || '16:9',
        content: quill.root.innerHTML,
        status: document.getElementById('status').value,
        publishedAt: document.getElementById('publishedAt').value,
        seoTitle: document.getElementById('seoTitle').value,
        seoDescription: document.getElementById('seoDescription').value,
        seoKeywords: document.getElementById('seoKeywords').value,
        embeds: currentEmbeds
        // Note: imageUrl/File upload is hard to snapshot without complexity, ignoring for now or just checking if file selected
    });
}

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
            // Removed global row.onclick

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
                <div class="post-row-actions" style="gap: 5px;">
                     <!-- Edit Button -->
                     <button class="btn-icon" title="Edit" onclick="triggerEdit('${post._id}'); event.stopPropagation();" style="color: #3498db;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                     </button>
                     
                     <!-- Archive Button -->
                     <button class="btn-icon" title="Archive" onclick="archivePost('${post._id}'); event.stopPropagation();" style="color: #f1c40f;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-archive"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                     </button>

                     <!-- Delete Button -->
                     <button class="btn-icon" title="Delete" onclick="deletePost('${post._id}'); event.stopPropagation();" style="color: #e74c3c;">
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
                    [{ 'align': [] }], // 🟢 Text Alignment
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
    } else if (url.includes('drive.google.com')) {
        // 🟢 GOOGLE DRIVE SUPPORT
        // Pattern: drive.google.com/file/d/VIDEO_ID/view...
        const match = url.match(/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            embedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    }

    if (embedUrl) {
        const range = quill.getSelection(true);
        // 🟢 Use Standard Video Wrapper (Responsive 16:9)
        // Note: Quill might strip complex divs. We try to insert as HTML.
        const videoHTML = `
            <div class="video-wrapper" style="aspect-ratio: 16/9; max-width: 100%;">
                <iframe src="${embedUrl}" allowfullscreen></iframe>
            </div>
            <p><br></p>`; // Add breakline
        quill.clipboard.dangerouslyPasteHTML(range.index, videoHTML);
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
// Helper to trigger edit from ID
window.triggerEdit = function (id) {
    const post = allPosts.find(p => p._id === id);
    if (post) {
        startEdit(post);
    } else {
        console.error("Post not found:", id);
    }
};

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
    document.getElementById('modalTitle').textContent = "Create New Post";
    modal.style.display = "block";
    quill.setSelection(0);

    // 🟢 Snapshot Initial State
    originalSnapshot = getFormSnapshot();
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
// Request Close (Triggered by X)
window.requestCloseModal = function () {
    const currentSnapshot = getFormSnapshot();

    // 🟢 SMART CLOSE: Only confirm if changed
    if (currentSnapshot !== originalSnapshot) {
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
    document.getElementById('slug').value = post.slug || '';
    document.getElementById('sourceType').value = post.sourceType || 'original';
    document.getElementById('sourceUrl').value = post.sourceUrl || '';
    document.getElementById('mediaRatio').value = post.mediaRatio || '16:9';
    quill.root.innerHTML = post.content;

    // 🟢 Restrict Status for Published Posts
    const statusSelect = document.getElementById('status');
    statusSelect.value = post.status || 'draft';

    // 🟢 POPULATE SEO fields
    if (post.seo) {
        document.getElementById('seoTitle').value = post.seo.title || '';
        document.getElementById('seoDescription').value = post.seo.description || '';
        document.getElementById('seoKeywords').value = post.seo.keywords || '';
    } else {
        document.getElementById('seoTitle').value = '';
        document.getElementById('seoDescription').value = '';
        document.getElementById('seoKeywords').value = '';
    }

    // 🟢 POPULATE EMBEDS
    if (post.embeds && Array.isArray(post.embeds)) {
        currentEmbeds = post.embeds;
    } else {
        currentEmbeds = [];
    }
    renderEmbeds();

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

    // 🟢 Ensure UI is consistent
    toggleScheduleField();
    updateVideoPreview();

    // 🟢 Snapshot Initial State (Correctly placed at end)
    originalSnapshot = getFormSnapshot();
};

// 🟢 LIVE PREVIEW LOGIC
const sourceUrlInput = document.getElementById('sourceUrl');
const sourceTypeSelect = document.getElementById('sourceType');
const mediaRatioSelect = document.getElementById('mediaRatio');

function updateVideoPreview() {
    const url = sourceUrlInput.value.trim();
    const type = sourceTypeSelect.value;
    const ratio = mediaRatioSelect.value;
    const container = document.getElementById('videoPreviewContainer');
    const wrapper = document.getElementById('previewWrapper');

    if (!url || type === 'original') {
        container.style.display = 'none';
        wrapper.innerHTML = '';
        return;
    }

    let embedUrl = '';
    // Reuse logic roughly (or cleaner extraction)
    if (type === 'youtube' && (url.includes('youtube') || url.includes('youtu.be'))) {
        let vId = url.split('v=')[1] || url.split('/').pop();
        if (vId) vId = vId.split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${vId}`;
    } else if (type === 'facebook') {
        embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&t=0`;
    } else if (type === 'tiktok') {
        let vId = url.split('/video/')[1];
        if (vId) vId = vId.split('?')[0];
        embedUrl = `https://www.tiktok.com/embed/v2/${vId}`;
    } else if (type === 'googledrive' && url.includes('drive.google.com')) {
        const match = url.match(/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            embedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    }

    if (embedUrl) {
        container.style.display = 'block';

        // Calculate Ratio
        let paddingBottom = '56.25%'; // 16:9
        if (ratio === '4:3') paddingBottom = '75%';
        if (ratio === '1:1') paddingBottom = '100%';
        if (ratio === '9:16') paddingBottom = '177.77%';
        if (ratio === '21:9') paddingBottom = '42.85%';

        wrapper.style.paddingBottom = paddingBottom;
        // Only update innerHTML if URL changed (to prevent flickering on ratio change) 
        // simplifies complexity: just update always on change
        wrapper.innerHTML = `<iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe>`;
    } else {
        container.style.display = 'none';
    }
}

sourceUrlInput.addEventListener('input', updateVideoPreview);
sourceTypeSelect.addEventListener('change', updateVideoPreview);
// mediaRatioSelect listener removed as we use buttons now, but we update preview when buttons change select

// 🟢 RATIO BUTTON LOGIC
document.querySelectorAll('.btn-ratio').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // UI Request: Visual Selection
        const ratio = e.target.getAttribute('data-ratio');

        // 1. Update Hidden Select
        mediaRatioSelect.value = ratio;

        // 2. Visual Feedback
        document.querySelectorAll('.btn-ratio').forEach(b => {
            b.style.background = '#fff';
            b.classList.remove('active');
        });
        e.target.style.background = '#ddd'; // Active highlight
        e.target.classList.add('active');

        // 3. Update Preview
        updateVideoPreview();
    });
});

// Update Preview Function (Enhanced)
function updateVideoPreview() {
    const url = sourceUrlInput.value.trim();
    const type = sourceTypeSelect.value;
    const ratio = mediaRatioSelect.value;
    const container = document.getElementById('videoPreviewContainer');
    const wrapper = document.getElementById('previewWrapper');

    // Sync Buttons Visual State (in case loaded from edit)
    document.querySelectorAll('.btn-ratio').forEach(b => {
        if (b.getAttribute('data-ratio') === ratio) {
            b.style.background = '#ddd';
        } else {
            b.style.background = '#fff';
        }
    });

    if (!url || type === 'original') {
        container.style.display = 'none';
        wrapper.innerHTML = '';
        return;
    }
    let embedUrl = '';
    if (type === 'youtube' && (url.includes('youtube') || url.includes('youtu.be'))) {
        let vId = url.split('v=')[1] || url.split('/').pop();
        if (vId) vId = vId.split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${vId}`;
    } else if (type === 'facebook') {
        embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&t=0`;
    } else if (type === 'tiktok') {
        let vId = url.split('/video/')[1];
        if (vId) vId = vId.split('?')[0];
        embedUrl = `https://www.tiktok.com/embed/v2/${vId}`;
    } else if (type === 'googledrive' && url.includes('drive.google.com')) {
        const match = url.match(/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            embedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    }

    if (embedUrl) {
        container.style.display = 'block';

        // 🟢 Calculate Aspect Ratio & Max Width
        let aspectRatio = '16 / 9';
        let maxWidth = '100%';

        if (ratio === '4:3') aspectRatio = '4 / 3';
        if (ratio === '1:1') { aspectRatio = '1 / 1'; maxWidth = '600px'; }
        if (ratio === '9:16') { aspectRatio = '9 / 16'; maxWidth = '420px'; } // Vertical Focus
        if (ratio === '21:9') aspectRatio = '21 / 9';

        // Use the new class logic
        wrapper.className = 'video-wrapper'; // Apply standard class
        wrapper.style.aspectRatio = aspectRatio;
        wrapper.style.maxWidth = maxWidth;
        wrapper.style.paddingBottom = '0'; // Reset old padding style
        wrapper.style.height = 'auto'; // Let aspect-ratio handle it

        wrapper.innerHTML = `<iframe src="${embedUrl}" allowfullscreen></iframe>`;
    } else {
        container.style.display = 'none';
    }
} // 🟢 Closing updateVideoPreview

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

            const slug = document.getElementById('slug').value || '';
            const sourceType = document.getElementById('sourceType').value;
            const sourceUrl = document.getElementById('sourceUrl').value;
            const mediaRatio = document.getElementById('mediaRatio').value;

            const postData = { title, content, status, publishedAt, slug, sourceType, sourceUrl, mediaRatio };

            // 🟢 COLLECT SEO DATA
            const seo = {
                title: document.getElementById('seoTitle').value,
                description: document.getElementById('seoDescription').value,
                keywords: document.getElementById('seoKeywords').value
            };
            if (seo.title || seo.description || seo.keywords) {
                postData.seo = seo;
            }

            // 🟢 COLLECT EMBEDS
            postData.embeds = currentEmbeds;

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
    }); // Close submit listener
} // Close createPostForm check

// 🟢 PREVIEW POST
window.previewPost = function () {
    const postData = {
        title: document.getElementById('title').value || '(No Title)',
        content: quill.root.innerHTML,
        slug: document.getElementById('slug').value,
        sourceType: document.getElementById('sourceType').value,
        sourceUrl: document.getElementById('sourceUrl').value,
        mediaRatio: document.getElementById('mediaRatio').value,
        publishedAt: new Date().toISOString(),
        author: { username: 'Admin (Preview)' }, // Mock author
        embeds: currentEmbeds
        // Image preview logic omitted for simplicity unless base64
    };

    localStorage.setItem('cms_preview_data', JSON.stringify(postData));
    window.open('post.html?preview=true', '_blank');
};

function resetForm() {
    try {
        isEditing = false;
        currentPostId = null;
        if (createPostForm) createPostForm.reset();

        document.getElementById('slug').value = '';

        const typeSelect = document.getElementById('sourceType');
        if (typeSelect) typeSelect.value = 'original';

        const urlInput = document.getElementById('sourceUrl');
        if (urlInput) urlInput.value = '';

        const ratioSelect = document.getElementById('mediaRatio');
        if (ratioSelect) ratioSelect.value = '16:9'; // Default

        // Reset Ratio Buttons Visual State
        document.querySelectorAll('.btn-ratio').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = '#fff';
            if (btn.getAttribute('data-ratio') === '16:9') {
                btn.classList.add('active');
                btn.style.background = '#ddd';
            }
        });

        quill.root.innerHTML = '';

        const submitBtn = document.querySelector('#createPostForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Publish Post';

        const formTitle = document.getElementById('modalTitle');
        if (formTitle) formTitle.textContent = 'Create New Post';

        // Reset SEO
        if (document.getElementById('seoTitle')) document.getElementById('seoTitle').value = '';
        if (document.getElementById('seoDescription')) document.getElementById('seoDescription').value = '';
        if (document.getElementById('seoKeywords')) document.getElementById('seoKeywords').value = '';

        // Reset Embeds
        currentEmbeds = [];
        renderEmbeds();

        const mediaUrlInput = document.getElementById('mediaUrl');
        if (mediaUrlInput) mediaUrlInput.value = '';

        const scheduleError = document.getElementById('scheduleError');
        if (scheduleError) scheduleError.style.display = 'none';

        // 🟢 Reset Video Preview
        updateVideoPreview();

        // 🟢 Reset Schedule Field Visibility
        toggleScheduleField();

        updateSubmitButton();
    } catch (e) {
        console.warn("Error resetting form: ", e);
    }
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
    const dateInput = document.getElementById('publishedAt');

    if (status === 'scheduled') {
        scheduleField.style.display = 'block';

        // 🟢 RESTRICT PAST DATES
        const now = new Date();
        // Adjust to local timezone ISO string
        const localIsoString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        dateInput.min = localIsoString;

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

// 🟢 MULTI-PLATFORM EMBEDS LOGIC

window.addEmbed = function () {
    const input = document.getElementById('mediaUrl');
    const url = input.value.trim();
    if (!url) return;

    if (typeof EmbedParser === 'undefined') {
        alert('EmbedParser not loaded!');
        return;
    }

    const embedData = EmbedParser.parse(url);
    if (!embedData) {
        alert('Invalid URL');
        return;
    }

    currentEmbeds.push(embedData);
    input.value = '';
    renderEmbeds();
};

window.removeEmbed = function (index) {
    currentEmbeds.splice(index, 1);
    renderEmbeds();
};

function renderEmbeds() {
    const list = document.getElementById('embedsList');
    list.innerHTML = '';

    currentEmbeds.forEach((item, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'background: #f9f9f9; border: 1px solid #ddd; padding: 10px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;';

        let icon = '🔗';
        if (item.platform === 'youtube') icon = '▶️';
        if (item.platform === 'tiktok') icon = '🎵';
        if (item.platform === 'facebook') icon = '📘';

        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
                <span style="font-size: 20px;">${icon}</span>
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <a href="${item.url}" target="_blank" style="font-weight: bold; color: #333; text-decoration: none;">${item.platform.toUpperCase()} Link</a>
                    <div style="font-size: 12px; color: #888; overflow: hidden; text-overflow: ellipsis;">${item.url}</div>
                </div>
            </div>
            <button type="button" onclick="removeEmbed(${index})" style="background: none; border: none; color: red; font-size: 20px; cursor: pointer;">&times;</button>
        `;
        list.appendChild(div);
    });
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

