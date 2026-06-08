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

    const contentType = req.headers.get('content-type') || 'application/json';
    
    const fetchOptions: RequestInit & { duplex?: 'half' } = {
        method: req.method,
        headers: {
            'Content-Type': contentType,
        },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        fetchOptions.body = req.body;
        fetchOptions.duplex = 'half';
    }

    try {
        const res = await fetch(`${apiBase}/api/${path}`, fetchOptions);

        return new NextResponse(res.body, {
            status: res.status,
            headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
        });
    } catch (err: any) {
        console.error('Proxy Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export const GET = POST;
export const PUT = POST;
export const DELETE = POST;

