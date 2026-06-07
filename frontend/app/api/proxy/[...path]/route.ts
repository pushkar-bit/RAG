import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const resolvedParams = await params;
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let path = resolvedParams.path.join('/');
    if (path.startsWith('api/')) {
        path = path.slice(4);
    }
    
    // Use the backend server's direct port (5001), fallback to API_BASE_URL, avoid loop
    const apiBase = process.env.API_BASE_URL || 'http://localhost:5001';

    try {
        const headers = new Headers(req.headers);
        headers.delete('host'); // Let fetch set the proper host for the backend

        const res = await fetch(`${apiBase}/api/${path}`, {
            method: req.method,
            headers: headers,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
            ...(req.method !== 'GET' && req.method !== 'HEAD' ? { duplex: 'half' } : {})
        });

        const responseHeaders = new Headers(res.headers);
        return new NextResponse(res.body, {
            status: res.status,
            headers: responseHeaders,
        });
    } catch (err: any) {
        console.error('Proxy Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const GET = POST;
export const PUT = POST;
export const DELETE = POST;

