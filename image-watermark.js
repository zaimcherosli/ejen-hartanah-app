/**
 * ImageWatermark Module
 * Production-Ready, Reusable Image Overlay & Watermarking Utility
 *
 * Supports:
 * - Singleton image asset caching
 * - OffscreenCanvas & HTMLCanvasElement
 * - Multi-positioning (bottom-right, bottom-left, top-right, top-left, center)
 * - Dynamic resolution scaling (small <600px: 12%, normal: 18%, large >3000px: 22%)
 * - Optional rotation
 * - Strict boundary overflow protection
 * - High-DPI anti-aliasing (imageSmoothingQuality = "high")
 */

const DEFAULT_WATERMARK_OPTIONS = {
  src: 'assets/watermark.png?v=1',
  position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left', 'center'
  opacity: 0.15,
  margin: 0.03,         // 3% margin from container edges
  scale: 0.18,          // Default 18% of canvas width
  minScale: 0.12,       // For canvas width < 600px
  maxScale: 0.22,       // For canvas width > 3000px
  rotation: 0,          // Rotation in degrees (0 = no rotation)
  debug: false          // Set true to enable debug console logs
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
        console.warn(`[ImageWatermark] Failed to load asset '${src}'. Skipping overlay.`, err);
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

    const overlayImg = await loadOverlayAsset(opts.src, opts.debug);
    if (!overlayImg) {
      // Graceful fallback: continue without watermark if asset loading fails
      return canvas;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Calculate Dynamic Scale Ratio based on canvas width thresholds
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

    // 2. Calculate Margins (3% default)
    const marginX = Math.round(width * opts.margin);
    const marginY = Math.round(height * opts.margin);

    // 3. Position Calculation
    let x = 0;
    let y = 0;

    const pos = (opts.position || 'bottom-right').toLowerCase();
    switch (pos) {
      case 'bottom-left':
        x = marginX;
        y = height - wmHeight - marginY;
        break;
      case 'top-right':
        x = width - wmWidth - marginX;
        y = marginY;
        break;
      case 'top-left':
        x = marginX;
        y = marginY;
        break;
      case 'center':
        x = Math.round((width - wmWidth) / 2);
        y = Math.round((height - wmHeight) / 2);
        break;
      case 'bottom-right':
      default:
        x = width - wmWidth - marginX;
        y = height - wmHeight - marginY;
        break;
    }

    // 4. Strict Boundary Protection (Ensure watermark never overflows image boundaries)
    x = Math.max(0, Math.min(x, width - wmWidth));
    y = Math.max(0, Math.min(y, height - wmHeight));

    // 5. Draw Watermark with High Quality & Anti-aliasing Settings
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = Math.max(0, Math.min(1, opts.opacity));

    // 6. Optional Rotation Support
    if (opts.rotation && opts.rotation !== 0) {
      const cx = x + wmWidth / 2;
      const cy = y + wmHeight / 2;
      const rad = (opts.rotation * Math.PI) / 180;

      ctx.translate(cx, cy);
      ctx.rotate(rad);
      ctx.drawImage(overlayImg, -wmWidth / 2, -wmHeight / 2, wmWidth, wmHeight);
    } else {
      ctx.drawImage(overlayImg, x, y, wmWidth, wmHeight);
    }

    ctx.restore();

    if (opts.debug) {
      console.log(`[ImageWatermark] Applied '${opts.src}' at '${pos}' (${wmWidth}x${wmHeight}px, opacity=${opts.opacity})`);
    }

    return canvas;
  } catch (err) {
    if (opts.debug) {
      console.error('[ImageWatermark] Unexpected error in applyWatermark:', err);
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
