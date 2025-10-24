/**
 * Analytics API Route
 * Fetches and returns analytics data for the authenticated user's company
 */

import { verifyUserToken } from '@whop/api'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '~/env'
import { syncCompanyData } from '~/lib/analytics/sync'
import { getDashboardSummary } from '~/lib/analytics/calculator'

export async function GET(req: NextRequest) {
	// 1. Try to verify user (but don't block if not available)
	try {
		const { userId } = await verifyUserToken(req.headers)
		if (userId) {
			console.log('[ANALYTICS] Authenticated user:', userId)
		}
	} catch (error) {
		console.log('[ANALYTICS] No user auth - proceeding with API key only')
	}

	try {
		// 2. Use the configured company ID (from environment, not user)
		const companyId = env.NEXT_PUBLIC_WHOP_COMPANY_ID
		console.log('[ANALYTICS] Fetching analytics for company:', companyId)

		// 3. Parse date range from query parameters
		const { searchParams } = new URL(req.url)
		const startDateParam = searchParams.get('startDate')
		const endDateParam = searchParams.get('endDate')
		const compare = searchParams.get('compare') === 'true'

		const startDate = startDateParam ? new Date(startDateParam) : undefined
		const endDate = endDateParam ? new Date(endDateParam) : undefined

		// 4. Sync data from Whop API (uses 1-hour cache)
		const syncResult = await syncCompanyData({ companyId })

		// 5. Calculate all metrics with date range
		const summary = await getDashboardSummary(companyId, startDate, endDate)

		// 6. Return analytics data
		return NextResponse.json({
			success: true,
			data: {
				revenue: summary.revenue,
				memberCount: summary.memberCount,
				churnRate: summary.churnRate,
				arpu: summary.arpu,
				mrr: summary.mrr,
				clv: summary.clv,
				revenueTimeSeries: summary.revenueTimeSeries,
				topProducts: summary.topProducts,
				customerSegments: summary.customerSegments,
			},
			sync: {
				lastSynced: syncResult.syncedAt,
				paymentsCount: syncResult.paymentsCount,
				membershipsCount: syncResult.membershipsCount,
				productsCount: syncResult.productsCount,
			},
			dateRange: {
				start: startDate?.toISOString() || null,
				end: endDate?.toISOString() || null,
			},
			generatedAt: new Date().toISOString(),
		})
	} catch (error) {
		console.error('Analytics API error:', error)
		return NextResponse.json(
			{
				error: 'Failed to fetch analytics',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		)
	}
}
