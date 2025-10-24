import { verifyUserToken } from '@whop/api'
import { NextRequest, NextResponse } from 'next/server'
import { type WhopAccess, type WhopUser, whop } from '~/lib/whop'

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ experienceId: string }> },
) {
	const { experienceId } = await params
	if (!experienceId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

	console.log('[USER API] Verifying token for experience:', experienceId)
	const { userId } = await verifyUserToken(req.headers)
	if (!userId) {
		console.error('[USER API] No userId found in token')
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		console.log('[USER API] Fetching user and access:', { userId, experienceId })
		const [user, access] = await Promise.all([
			whop.users.getUser({ userId }),
			whop.access.checkIfUserHasAccessToExperience({ experienceId, userId }),
		])
		console.log('[USER API] Success:', { userId: user.id, accessLevel: access.accessLevel })
		return NextResponse.json<{
			user: WhopUser
			access: WhopAccess
		}>({ user, access })
	} catch (error) {
		console.error('[USER API] Error details:', {
			userId,
			experienceId,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		})
		return NextResponse.json(
			{
				error: 'Failed to fetch user data',
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		)
	}
}
