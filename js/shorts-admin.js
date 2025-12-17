let allShorts = [];
let isEditing = false;
let currentShortId = null;

window.addEventListener('DOMContentLoaded', () => {
    loadShorts();

    // Platform Toggle
    const platformSelect = document.getElementById('platform');
    if (platformSelect) platformSelect.addEventListener('change', toggleVideoInput);
    toggleVideoInput(); // Init state

    // Form Submit
    const form = document.getElementById('createShortForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        // Track changes for "dirty" check
        form.addEventListener('change', () => { isFormDirty = true; });
        form.addEventListener('input', () => { isFormDirty = true; });
    }

    // Thumbnail Preview Listener
    const thumbInput = document.getElementById('thumbnailFile');
    if (thumbInput) thumbInput.addEventListener('change', handleThumbnailFile);

    // Initial Status Check for Button Text
    toggleScheduleField();

    // Start Clock
    setInterval(updateClock, 1000);
    updateClock();
});

let isFormDirty = false;

function updateClock() {
    const clock = document.getElementById('clock');
    if (clock) {
        const now = new Date();
        clock.textContent = now.toLocaleString('vi-VN');
    }
}

async function loadShorts() {
    const container = document.getElementById('shortsContainer');
    container.innerHTML = '<p>Loading...</p>';

    try {
        const shorts = await apiRequest('/shorts');
        allShorts = shorts;
        renderShorts(shorts);
    } catch (error) {
        container.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
    }
}

function renderShorts(shorts) {
    const container = document.getElementById('shortsContainer');
    container.innerHTML = '';

    if (!shorts || shorts.length === 0) {
        container.innerHTML = '<p>No short videos found.</p>';
        return;
    }

    shorts.forEach(short => {
        const row = document.createElement('div');
        row.className = 'post-row'; // Reuse styles

        let thumb = short.thumbnailUrl || 'img/default-video.png'; // Fallback

        row.innerHTML = `
            <div class="post-row-image">
                <img src="${thumb}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; background: #333;">
            </div>
            <div class="post-row-content">
                <div class="post-row-header">
                     <span style="font-weight: bold; margin-right: 10px;">${escapeHtml(short.platform.toUpperCase())}</span>
                     ${getStatusBadge(short.status)}
                </div>
                <div class="post-row-snippet">${escapeHtml(short.caption)}</div>
            </div>
            <div class="post-row-actions">
                <button class="btn-icon" onclick="triggerEdit('${short._id}')">✏️</button>
                <button class="btn-icon" onclick="deleteShort('${short._id}')" style="color: #e74c3c;">🗑️</button>
            </div>
        `;
        container.appendChild(row);
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function getStatusBadge(status) {
    let color = status === 'published' ? '#2ecc71' : '#95a5a6';
    return `<span style="background:${color}; color:white; padding:2px 6px; border-radius:4px; font-size: 11px;">${status}</span>`;
}

function toggleVideoInput() {
    const platform = document.getElementById('platform').value;
    const urlGroup = document.getElementById('urlInputContainer');
    const fileGroup = document.getElementById('fileInputContainer');

    if (platform === 'upload') {
        urlGroup.style.display = 'none';
        fileGroup.style.display = 'block';
    } else {
        urlGroup.style.display = 'block';
        fileGroup.style.display = 'none';
    }
}

window.openCreateModal = function () {
    if (isFormDirty && !confirm('Discard unsaved changes?')) return;

    isEditing = false;
    currentShortId = null;
    isFormDirty = false; // Reset dirty flag

    document.getElementById('createShortForm').reset();
    document.getElementById('shortModal').style.display = 'flex';
    document.getElementById('modalTitle').textContent = 'Create New Short Video';

    // Reset Thumbnail UI
    removeThumbnail();

    // Reset Status & Schedule
    document.getElementById('status').value = 'draft';
    toggleScheduleField();

    toggleVideoInput();
};

window.triggerEdit = function (id) {
    const short = allShorts.find(s => s._id === id);
    if (!short) return;

    isEditing = true;
    currentShortId = id;

    document.getElementById('caption').value = short.caption;
    document.getElementById('platform').value = short.platform;
    document.getElementById('status').value = short.status;

    if (short.platform !== 'upload') {
        document.getElementById('videoUrl').value = short.mediaUrl;
    }

    // 🟢 Restrict Status for Published Shorts (Mirroring Post Logic if desired, but user didn't explicitly ask to LOCK it, just add Schedule)
    document.getElementById('status').value = short.status || 'draft';

    // 🟢 Populate Schedule Time
    if (short.publishedAt) {
        const date = new Date(short.publishedAt);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        document.getElementById('publishedAt').value = date.toISOString().slice(0, 16);
    } else {
        document.getElementById('publishedAt').value = '';
    }

    // 🟢 Populate Thumbnail Preview
    const imgPreview = document.getElementById('imagePreviewContainer');
    const currentImg = document.getElementById('currentImagePreview');
    if (short.thumbnailUrl) {
        imgPreview.style.display = 'flex';
        currentImg.src = short.thumbnailUrl;
    } else {
        imgPreview.style.display = 'none';
    }

    toggleScheduleField();
    toggleVideoInput();

    document.getElementById('modalTitle').textContent = 'Edit Short Video';
    document.getElementById('shortModal').style.display = 'flex';

    isFormDirty = false; // Reset after populate
};

window.closeModal = function () {
    if (isFormDirty) {
        if (!confirm('You have unsaved changes. Do you want to discard them?')) return;
    }
    document.getElementById('shortModal').style.display = 'none';
    isFormDirty = false;
}

window.deleteShort = async function (id) {
    if (!confirm('Delete this short video?')) return;
    try {
        await apiRequest(`/shorts/${id}`, 'DELETE', null, true);
        loadShorts();
    } catch (err) {
        alert(err.message);
    }
}

// 🟢 SUBMIT
async function handleFormSubmit(e) {
    e.preventDefault();

    const caption = document.getElementById('caption').value;
    const platform = document.getElementById('platform').value;
    const status = document.getElementById('status').value;
    const videoFile = document.getElementById('videoFile').files[0];
    const thumbFile = document.getElementById('thumbnailFile').files[0];
    const urlInput = document.getElementById('videoUrl').value;
    const publishedAt = document.getElementById('publishedAt').value; // Get Date

    if (platform === 'upload' && !videoFile && !isEditing) {
        alert("Please upload a video file.");
        return;
    }

    let mediaUrl = isEditing ? (allShorts.find(s => s._id === currentShortId).mediaUrl) : '';
    let mediaType = isEditing ? (allShorts.find(s => s._id === currentShortId).mediaType) : 'video'; // Default
    let thumbnailUrl = isEditing ? (allShorts.find(s => s._id === currentShortId).thumbnailUrl) : '';

    try {
        // Upload Video if new file
        if (platform === 'upload' && videoFile) {
            const formData = new FormData();
            formData.append('file', videoFile);
            const res = await apiUpload('/upload', formData); // Use upload module
            mediaUrl = res.url;
            mediaType = res.resource_type || 'video'; // image | video
        } else if (platform !== 'upload') {
            mediaUrl = urlInput;
            mediaType = 'video'; // External links are assumed video for now
        }

        // Upload Thumbnail if new file
        if (thumbFile) {
            const formData = new FormData();
            formData.append('file', thumbFile);
            const res = await apiUpload('/upload', formData);
            thumbnailUrl = res.url;
        }

        const data = { caption, platform, status, mediaUrl, mediaType, thumbnailUrl, publishedAt };

        if (isEditing) {
            await apiRequest(`/shorts/${currentShortId}`, 'PATCH', data, true);
        } else {
            await apiRequest('/shorts', 'POST', data, true);
        }

        closeModal();
        loadShorts();
        isFormDirty = false;
        alert('Short Video Saved!');
    } catch (err) {
        alert("Error saving: " + err.message);
    }
}

// Helper filter (basic)
window.filterShorts = function (status) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    if (status === 'all') {
        renderShorts(allShorts);
    } else {
        renderShorts(allShorts.filter(s => s.status === status));
    }
}
};

function setMinScheduleDate() {
    const input = document.getElementById('publishedAt');
    if (!input) return;

    const now = new Date();
    // Adjust to local ISO string (handling timezone offset manually for input type=datetime-local)
    // Actually simpler: just use current time in local timezone
    const tzOffset = now.getTimezoneOffset() * 60000; // in ms
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 16);
    input.min = localISOTime;
}
// 🟢 THUMBNAIL LOGIC
window.handleThumbnailFile = function () {
    const input = document.getElementById('thumbnailFile');
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('currentImagePreview').src = e.target.result;
            document.getElementById('imagePreviewContainer').style.display = 'flex';
        }
        reader.readAsDataURL(file);
    }
}

window.removeThumbnail = function () {
    document.getElementById('thumbnailFile').value = '';
    document.getElementById('imagePreviewContainer').style.display = 'none';
    document.getElementById('currentImagePreview').src = '';
}

// 🟢 SCHEDULE LOGIC
window.toggleScheduleField = function () {
    const status = document.getElementById('status').value;
    const scheduleField = document.getElementById('scheduleField');
    const saveBtn = document.getElementById('saveBtn'); // Must add ID to button in HTML

    if (status === 'scheduled') {
        scheduleField.style.display = 'block';
        saveBtn.innerText = 'Schedule Short';
        setMinScheduleDate(); // 🟢 Set Min Date
    } else if (status === 'published') {
        scheduleField.style.display = 'none';
        saveBtn.innerText = 'Publish Short';
    } else {
        scheduleField.style.display = 'none';
        saveBtn.innerText = 'Save Draft';
    }
}
