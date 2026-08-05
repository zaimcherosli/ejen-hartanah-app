// Cloudflare Pages Function for R2 Image Uploads & Deletions
export async function onRequestPost(context) {
  try {
    const bucket = context.env.ejen_hartanah_storage;
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'R2 bucket binding not found in environment' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const contentType = context.request.headers.get('content-type') || '';
    let fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
    let fileBuffer;
    let mimeType = 'image/png';

    if (contentType.includes('multipart/form-data')) {
      const formData = await context.request.formData();
      const file = formData.get('file');
      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided in form-data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      fileBuffer = await file.arrayBuffer();
      mimeType = file.type || 'image/png';
      if (file.name) {
        const ext = file.name.split('.').pop();
        fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      }
    } else {
      fileBuffer = await context.request.arrayBuffer();
    }

    // Save to R2 Bucket
    await bucket.put(fileName, fileBuffer, {
      httpMetadata: { contentType: mimeType }
    });

    const publicUrl = `https://pub-268e365cedb9412fbed8d5bf3fa79b26.r2.dev/${fileName}`;

    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// Delete file from R2 Bucket
export async function onRequestDelete(context) {
  try {
    const bucket = context.env.ejen_hartanah_storage;
    const url = new URL(context.request.url);
    const fileName = url.searchParams.get('file');

    if (bucket && fileName) {
      await bucket.delete(fileName);
      return new Response(JSON.stringify({ success: true, deleted: fileName }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ error: 'Missing bucket or file parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
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
