import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Solo procesar si es realmente una imagen
    if (!contentType.startsWith('image/')) {
       throw new Error('URL is not an image');
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, staled-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Proxy Image Timeout for:', url);
      return new NextResponse('Timeout fetching image', { status: 504 });
    }
    console.error('Proxy Image Error:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
