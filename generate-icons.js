const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIcon(size, emoji) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(0, 0, size, size);

    // Draw emoji
    ctx.font = `${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(emoji, size / 2, size / 2);

    // Save to file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`icon-${size}.png`, buffer);
}

// Generate icons
generateIcon(192, '🧠'); // Brain emoji for 192x192
generateIcon(512, '🧠'); // Brain emoji for 512x512 