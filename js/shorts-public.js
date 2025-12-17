window.addEventListener('DOMContentLoaded', () => {
    loadPublicShorts();
});

let observer;

async function loadPublicShorts() {
    const feed = document.getElementById('shortsFeed');
    feed.innerHTML = '<div class="no-shorts"><p>Loading...</p></div>';

    try {
        // Fetch all (public would ideally filter on backend)
        const shorts = await apiRequest('/shorts');
        const published = shorts.filter(s => s.status === 'published');

        // Sort newest first
        published.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (published.length === 0) {
            feed.innerHTML = '<div class="no-shorts"><p>No shorts available.</p></div>';
            return;
        }

        feed.innerHTML = '';
        published.forEach(short => {
            const item = createShortItem(short);
            feed.appendChild(item);
        });

        // Init Observer for Autoplay
        initScrollObserver();

    } catch (error) {
        console.error(error);
        feed.innerHTML = '<div class="no-shorts"><p>Failed to load shorts.</p></div>';
    }
}

function createShortItem(short) {
    const div = document.createElement('div');
    div.className = 'short-item';

    // Content Logic
    let contentHtml = '';

    if (short.platform === 'upload') {
        if (short.mediaType === 'image') {
            // Direct Image
            contentHtml = `<img src="${short.mediaUrl}" class="short-video" style="object-fit: cover;">`;
        } else {
            // Direct Video
            contentHtml = `
                <video src="${short.mediaUrl}" 
                    class="short-video" 
                    loop muted playsinline
                    onclick="togglePlay(this)">
                </video>
                <i class="fas fa-play play-icon"></i>
            `;
        }
    } else if (short.platform === 'youtube') {
        // YouTube Embed
        const videoId = getYouTubeId(short.mediaUrl);
        if (videoId) {
            // Note: Autoplay might be blocked by browser policy without mute
            const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=0&rel=0&showinfo=0&loop=1&playlist=${videoId}`;
            contentHtml = `<iframe class="short-embed" src="${embedUrl}" allow="autoplay; encrypted-media"></iframe>`;
        } else {
            contentHtml = renderExternalLink(short, "Invalid YouTube URL");
        }
    } else {
        // TikTok / Facebook / Other -> External Link fallback
        contentHtml = renderExternalLink(short);
    }

    const platformIcon = getPlatformIcon(short.platform);

    div.innerHTML = `
        ${contentHtml}
        <div class="overlay">
            <div class="platform-tag">
                <i class="${platformIcon}"></i> ${short.platform}
            </div>
            <div class="caption">${escapeHtml(short.caption)}</div>
        </div>
    `;

    return div;
}

function renderExternalLink(short, errorMsg) {
    const thumb = short.thumbnailUrl || 'img/default-video.png';
    return `
        <img src="${thumb}" class="short-video" style="filter: brightness(0.5);">
        <div style="position: absolute; text-align: center;">
            <p style="color:white; margin-bottom: 15px; font-weight: bold;">
                ${errorMsg ? errorMsg : 'External Platform'}
            </p>
            <a href="${short.mediaUrl}" target="_blank" 
                style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">
                Watch on ${short.platform}
            </a>
        </div>
    `;
}

function getPlatformIcon(platform) {
    switch (platform) {
        case 'youtube': return 'fab fa-youtube';
        case 'facebook': return 'fab fa-facebook';
        case 'tiktok': return 'fab fa-tiktok';
        default: return 'fas fa-video';
    }
}

function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function togglePlay(video) {
    const item = video.closest('.short-item');
    if (video.paused) {
        video.play();
        item.classList.remove('paused');
    } else {
        video.pause();
        item.classList.add('paused');
    }
}

function initScrollObserver() {
    const options = {
        root: document.getElementById('shortsFeed'),
        threshold: 0.6 // Play when 60% visible
    };

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            const iframe = entry.target.querySelector('iframe');

            if (entry.isIntersecting) {
                // Play
                if (video) video.play().catch(e => console.log("Autoplay blocked"));
                if (iframe) {
                    // PostMessage to play youtube? 
                    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                }
            } else {
                // Pause
                if (video) {
                    video.pause();
                    video.currentTime = 0; // Reset? Or just pause.
                }
                if (iframe) {
                    iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                }
            }
        });
    }, options);

    document.querySelectorAll('.short-item').forEach(item => {
        observer.observe(item);
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
