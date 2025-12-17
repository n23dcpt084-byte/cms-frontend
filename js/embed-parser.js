/**
 * Embed Parser Utility
 * Handles detection and formatting of social media URLs.
 */

const EmbedParser = {
    parse(url) {
        url = url.trim();

        if (!url) return null;

        // 1. YouTube
        // Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
        const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (ytMatch) {
            return {
                platform: 'youtube',
                url: url,
                embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`
            };
        }

        // 2. TikTok
        // Supports: tiktok.com/@user/video/ID
        const tiktokMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
        if (tiktokMatch) {
            return {
                platform: 'tiktok',
                url: url,
                embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`
            };
        }

        // 3. Facebook
        // Supports: facebook.com/watch/?v=ID, facebook.com/page/videos/ID, facebook.com/reel/ID
        if (url.includes('facebook.com') || url.includes('fb.watch')) {
            // Facebook uses a generic plugin endpoint that takes the href as a param
            // We just encode the full URL
            return {
                platform: 'facebook',
                url: url,
                embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`
            };
        }

        // 4. External / Fallback
        return {
            platform: 'external',
            url: url,
            embedUrl: url // Render as link
        };
    }
};
