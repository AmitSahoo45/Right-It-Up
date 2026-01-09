import { NextResponse } from 'next/server';
import { getCaseByCode } from '@/lib/db';
import { sanitizeCaseCode } from '@/lib/security';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code: rawCode } = await params;
    const code = sanitizeCaseCode(rawCode);

    if (!code) {
        return NextResponse.json(
            { error: 'Invalid case code format' },
            { status: 400 }
        );
    }

    try {
        const caseData = await getCaseByCode(code);

        if (!caseData) {
            return NextResponse.json(
                { error: 'Case not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: caseData.status,
            hasVerdict: caseData.status === 'complete'
        });
    } catch (error) {
        console.error('Error fetching case status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch case status' },
            { status: 500 }
        );
    }
}
