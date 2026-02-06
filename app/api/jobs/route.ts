import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const location = searchParams.get('location') || '';
        const sortBy = searchParams.get('sort_by') || 'date_posted';
        const page = searchParams.get('page') || '1';

        const apiKey = process.env.FINDWORK_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'Server Configuration Error: Missing Jobs API Key' }, { status: 500 });
        }

        const apiUrl = new URL('https://findwork.dev/api/jobs/');
        if (search) apiUrl.searchParams.set('search', search);
        if (location) apiUrl.searchParams.set('location', location);
        if (sortBy) apiUrl.searchParams.set('sort_by', sortBy);
        if (page) apiUrl.searchParams.set('page', page);

        const remote = searchParams.get('remote');
        if (remote === 'true') apiUrl.searchParams.set('remote', 'true');

        const res = await fetch(apiUrl.toString(), {
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Jobs API Error:", res.status, errorText);
            return NextResponse.json({ error: `External API Error: ${res.statusText}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Jobs Proxy Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
