import { NextRequest, NextResponse } from 'next/server'
import { WhopExperience, whop } from '~/lib/whop'

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ experienceId: string }> },
) {
	const { experienceId } = await params
	if (!experienceId)
		return NextResponse.json({ error: 'Missing params' }, { status: 400 })

	try {
		console.log('[EXPERIENCE API] Fetching experience:', experienceId)
		const experience = await whop.experiences.getExperience({ experienceId })
		console.log('[EXPERIENCE API] Success:', experience.id)
		return NextResponse.json<WhopExperience>(experience)
	} catch (error) {
		console.error('[EXPERIENCE API] Error details:', {
			experienceId,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{
				error: 'Failed to fetch experience',
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		)
	}
}
