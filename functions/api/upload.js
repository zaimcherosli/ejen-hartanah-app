// Cloudflare Pages Function for R2 Image Uploads & Deletions (Hardened Security)

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB Limit

// Helper: Validate Origin / Referer against authorized domains
function isAuthorizedOrigin(request) {
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  const host = request.headers.get('host') || '';

  const allowedPatterns = [
    'corporateestatemalaysia.com',
    'ejen-hartanah-app.pages.dev',
    'localhost',
    '127.0.0.1'
  ];

  const checkString = `${origin} ${referer} ${host}`;
  return allowedPatterns.some(pattern => checkString.includes(pattern));
}

// Helper: Magic byte inspection to verify real image contents
function isValidImageMagicBytes(buffer) {
  if (!buffer || buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer.slice(0, 12));

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;

  // GIF: 47 49 46 (GIF)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true;

  // WEBP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return true;
  }

  return false;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Origin & Domain Security Verification
  if (!isAuthorizedOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden: Unauthorized upload origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const bucket = env.ejen_hartanah_storage;
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'R2 storage configuration missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const contentType = request.headers.get('content-type') || '';
    let fileBuffer;
    let mimeType = 'image/jpeg';
    let fileExt = 'jpg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file || typeof file === 'string') {
        return new Response(JSON.stringify({ error: 'Bad Request: No file provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      fileBuffer = await file.arrayBuffer();
      mimeType = (file.type || 'image/jpeg').toLowerCase();
      
      if (file.name) {
        const rawExt = file.name.split('.').pop().toLowerCase();
        if (ALLOWED_EXTENSIONS.has(rawExt)) {
          fileExt = rawExt === 'jpeg' ? 'jpg' : rawExt;
        }
      }
    } else {
      fileBuffer = await request.arrayBuffer();
      const rawMime = contentType.split(';')[0].trim().toLowerCase();
      if (ALLOWED_MIME_TYPES.has(rawMime)) {
        mimeType = rawMime;
        fileExt = mimeType.replace('image/', '').replace('jpeg', 'jpg');
      }
    }

    // 2. Server-side File Size Validation (Max 10MB)
    if (!fileBuffer || fileBuffer.byteLength === 0) {
      return new Response(JSON.stringify({ error: 'Bad Request: Empty file buffer' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (fileBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
      return new Response(JSON.stringify({ error: 'Payload Too Large: File size exceeds 10MB limit' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Server-side MIME & Magic Byte Validation
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return new Response(JSON.stringify({ error: 'Unsupported Media Type: Only JPG, PNG, WEBP, and GIF images are allowed' }), {
        status: 415,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!isValidImageMagicBytes(fileBuffer)) {
      return new Response(JSON.stringify({ error: 'Bad Request: Corrupted or unverified image file header' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Secure Random File Naming
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const fileName = `img_${Date.now()}_${randomSuffix}.${fileExt}`;

    // 5. Store File into Cloudflare R2 Bucket
    await bucket.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, immutable'
      }
    });

    const publicUrl = `https://pub-b41a57c40e74430eb994919066288290.r2.dev/${fileName}`;

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      sizeBytes: fileBuffer.byteLength
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: `Upload processing failed: ${err.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Delete file from R2 Bucket (with origin protection)
export async function onRequestDelete(context) {
  const { request, env } = context;

  if (!isAuthorizedOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden: Unauthorized request origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const bucket = env.ejen_hartanah_storage;
    const url = new URL(request.url);
    const fileName = url.searchParams.get('file');

    if (bucket && fileName) {
      // Prevent directory traversal attacks on filename
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '');
      await bucket.delete(sanitizedName);
      return new Response(JSON.stringify({ success: true, deleted: sanitizedName }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Missing bucket or file parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
