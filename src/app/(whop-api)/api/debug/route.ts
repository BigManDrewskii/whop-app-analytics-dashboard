/**
 * Debug Endpoint - Test Whop API directly
 */

import { NextResponse } from 'next/server'
import { env } from '~/env'
import { whop } from '~/lib/whop'

export async function GET() {
	const companyId = env.NEXT_PUBLIC_WHOP_COMPANY_ID

	const debug = {
		config: {
			companyId,
			apiKeySet: !!env.WHOP_API_KEY,
			appId: env.NEXT_PUBLIC_WHOP_APP_ID,
		},
		tests: {} as any,
	}

	// Test receipts
	try {
		const response = await whop.payments.listReceiptsForCompany({
			companyId,
			filter: {},
		})

		debug.tests.receipts = {
			success: true,
			raw: response,
			count: response?.receipts?.nodes?.length || 0,
		}
	} catch (error: any) {
		debug.tests.receipts = {
			success: false,
			error: error.message,
			details: error.toString(),
		}
	}

	return NextResponse.json(debug, { status: 200 })
}
