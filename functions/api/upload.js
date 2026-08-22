// Cloudflare Pages Function for R2 Image Uploads & Deletions (Enterprise Hardened Security)

const SUPABASE_AUTH_URL = 'https://csrzhidtzqxfbapsenhu.supabase.co/auth/v1/user';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcnpoaWR0enF4ZmJhcHNlbmh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0OTM3OTYsImV4cCI6MjEwMTA2OTc5Nn0.NnHFURbQTvsdgGbm1d_PC-hkOgQFQIHKTMQaS2n44SU';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB Limit
const MAX_UPLOADS_PER_MINUTE = 30; // Rate Limit

// In-Memory Rate Limiting Cache for Edge Instance
const ipRateLimits = new Map();

function checkRateLimit(clientIp) {
  const now = Date.now();
  const record = ipRateLimits.get(clientIp) || { count: 0, resetAt: now + 60000 };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + 60000;
  } else {
    record.count++;
  }
  ipRateLimits.set(clientIp, record);
  return record.count <= MAX_UPLOADS_PER_MINUTE;
}

// 1. Supabase JWT Authentication Gate
async function verifyAgentSession(request) {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const res = await fetch(SUPABASE_AUTH_URL, {
      headers: {
        'Authorization': authHeader,
        'apikey': SUPABASE_ANON_KEY
      }
    });

    if (res.ok) {
      const user = await res.json();
      if (user && user.id) {
        return user;
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

// 2. Validate Origin / Referer against authorized domains
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

// 3. Magic byte inspection to verify real image contents
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

  // A. Origin Verification
  if (!isAuthorizedOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden: Unauthorized upload origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // B. Rate Limiting Check (Max 30 uploads / min)
  const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({ error: 'Too Many Requests: Rate limit exceeded (Max 30 uploads per minute)' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // C. Authenticated Agent Session / JWT Check
  const authenticatedAgent = await verifyAgentSession(request);
  if (!authenticatedAgent) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Active Supabase agent session token required' }), {
      status: 401,
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

    // D. Server-side File Size Validation (Max 10MB)
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

    // E. Server-side MIME & Magic Byte Validation
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

    // F. Secure Random File Naming with Agent Traceability
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const fileName = `img_${Date.now()}_${randomSuffix}.${fileExt}`;

    // G. Store File into Cloudflare R2 Bucket
    await bucket.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, immutable'
      },
      customMetadata: {
        uploaderId: authenticatedAgent.id,
        uploaderEmail: authenticatedAgent.email || 'agent'
      }
    });

    const publicUrl = `https://pub-b41a57c40e74430eb994919066288290.r2.dev/${fileName}`;

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      sizeBytes: fileBuffer.byteLength,
      uploader: authenticatedAgent.email
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

// Delete file from R2 Bucket (with strict Agent Auth requirement)
export async function onRequestDelete(context) {
  const { request, env } = context;

  if (!isAuthorizedOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden: Unauthorized request origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const authenticatedAgent = await verifyAgentSession(request);
  if (!authenticatedAgent) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Active agent session required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const bucket = env.ejen_hartanah_storage;
    const url = new URL(request.url);
    const fileName = url.searchParams.get('file');

    if (bucket && fileName) {
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
