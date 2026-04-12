import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const resolvedParams = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing user sessions.
                    }
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const path = resolvedParams.path.join('/');

    try {
        const res = await fetch(`${process.env.API_BASE_URL}/api/${path}`, {
            method: req.method,
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
                'X-Internal-Secret': process.env.INTERNAL_API_SECRET!,
            },
            body: req.method !== 'GET' ? await req.text() : undefined,
        });

        return new NextResponse(res.body, {
            status: res.status,
            headers: { 'Content-Type': res.headers.get('Content-Type')! },
        });
    } catch (err: any) {
        console.error('Proxy Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const GET = POST;
export const PUT = POST;
export const DELETE = POST;
