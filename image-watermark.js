/**
 * ImageWatermark Module
 * Production-Ready, Reusable Image Overlay & Watermarking Utility
 *
 * Stamping official Corporate Estate Malaysia watermark onto uploaded property images
 */

const DEFAULT_WATERMARK_OPTIONS = {
  src: 'assets/watermark.png?v=2',
  position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left', 'center'
  opacity: 0.85,        // High-contrast, clear visibility
  margin: 0.03,         // 3% margin from container edges
  scale: 0.28,          // 28% of canvas width
  minScale: 0.22,       // For canvas width < 600px
  maxScale: 0.32,       // For canvas width > 3000px
  rotation: 0,          // Rotation in degrees (0 = no rotation)
  debug: true           // Enable debug console logs
};

// Singleton overlay image cache
const _overlayImageCache = new Map();

/**
 * Loads an overlay image asset asynchronously with singleton caching.
 * @param {string} src 
 * @param {boolean} debug 
 * @returns {Promise<HTMLImageElement|null>}
 */
function loadOverlayAsset(src, debug = false) {
  if (_overlayImageCache.has(src)) {
    return Promise.resolve(_overlayImageCache.get(src));
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      _overlayImageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (err) => {
      if (debug) {
        console.warn(`[ImageWatermark] Failed to load asset '${src}'. Using fallback text watermark.`, err);
      }
      resolve(null);
    };
  });
}

/**
 * Applies an image overlay / watermark to a Canvas (HTMLCanvasElement or OffscreenCanvas).
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas 
 * @param {Object} customOptions 
 * @returns {Promise<HTMLCanvasElement|OffscreenCanvas>}
 */
async function applyWatermark(canvas, customOptions = {}) {
  const opts = Object.assign({}, DEFAULT_WATERMARK_OPTIONS, customOptions);

  try {
    if (!canvas || !canvas.getContext) {
      if (opts.debug) console.warn('[ImageWatermark] Invalid canvas provided.');
      return canvas;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const width = canvas.width;
    const height = canvas.height;

    const overlayImg = await loadOverlayAsset(opts.src, opts.debug);

    if (overlayImg) {
      // 1. Image Watermark Asset Mode
      let scaleRatio = opts.scale;
      if (width < 600) {
        scaleRatio = opts.minScale;
      } else if (width > 3000) {
        scaleRatio = opts.maxScale;
      }

      // Maintain Overlay Aspect Ratio
      const wmWidth = Math.round(width * scaleRatio);
      const aspect = overlayImg.height / overlayImg.width;
      const wmHeight = Math.round(wmWidth * aspect);

      const marginX = Math.round(width * opts.margin);
      const marginY = Math.round(height * opts.margin);

      let x = width - wmWidth - marginX;
      let y = height - wmHeight - marginY;

      const pos = (opts.position || 'bottom-right').toLowerCase();
      if (pos === 'bottom-left') {
        x = marginX; y = height - wmHeight - marginY;
      } else if (pos === 'top-right') {
        x = width - wmWidth - marginX; y = marginY;
      } else if (pos === 'top-left') {
        x = marginX; y = marginY;
      } else if (pos === 'center') {
        x = Math.round((width - wmWidth) / 2); y = Math.round((height - wmHeight) / 2);
      }

      x = Math.max(0, Math.min(x, width - wmWidth));
      y = Math.max(0, Math.min(y, height - wmHeight));

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.globalAlpha = Math.max(0, Math.min(1, opts.opacity));
      ctx.drawImage(overlayImg, x, y, wmWidth, wmHeight);
      ctx.restore();

      if (opts.debug) {
        console.log(`[ImageWatermark] Success: Applied '${opts.src}' (${wmWidth}x${wmHeight}px)`);
      }
    } else {
      // 2. High-Quality Text Fallback Watermark Mode
      ctx.save();
      const fontSize = Math.max(14, Math.round(width * 0.035));
      ctx.font = `900 ${fontSize}px sans-serif`;
      const text = 'CORPORATE ESTATE MALAYSIA';
      const metrics = ctx.measureText(text);
      const padX = fontSize * 0.6;
      const padY = fontSize * 0.35;
      const boxWidth = metrics.width + padX * 2;
      const boxHeight = fontSize + padY * 2;
      
      const margin = Math.round(width * 0.03);
      const x = width - boxWidth - margin;
      const y = height - boxHeight - margin;

      // Draw Dark Background Pill
      ctx.fillStyle = 'rgba(10, 25, 47, 0.85)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, boxWidth, boxHeight, 6) : ctx.rect(x, y, boxWidth, boxHeight);
      ctx.fill();

      // Draw White Text with Red Accent Dot
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, x + padX, y + padY + fontSize * 0.8);
      ctx.restore();

      if (opts.debug) {
        console.log(`[ImageWatermark] Applied Text Fallback Watermark: '${text}'`);
      }
    }

    return canvas;
  } catch (err) {
    if (opts.debug) {
      console.error('[ImageWatermark] Error in applyWatermark:', err);
    }
    return canvas;
  }
}

// Export for ES Module or Global Window environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { applyWatermark, DEFAULT_WATERMARK_OPTIONS };
} else if (typeof window !== 'undefined') {
  window.applyWatermark = applyWatermark;
  window.DEFAULT_WATERMARK_OPTIONS = DEFAULT_WATERMARK_OPTIONS;
}
