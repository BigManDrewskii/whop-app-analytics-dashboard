/**
 * Analytics Dashboard Page
 * Main dashboard displaying all key metrics and charts
 */

import { authenticateUser } from '~/lib/whop/auth'
import { syncCompanyData } from '~/lib/analytics/sync'
import { getDashboardSummary } from '~/lib/analytics/calculator'
import { MetricsCards } from '~/components/dashboard/metrics-cards'
import { RevenueChart } from '~/components/dashboard/revenue-chart'
import { ProductsTable } from '~/components/dashboard/products-table'

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
	try {
		// 1. Authenticate user
		const { companyId, userId } = await authenticateUser()

		// 2. Sync data (uses cache if recent)
		const syncResult = await syncCompanyData({ companyId })

		// 3. Calculate metrics
		const summary = await getDashboardSummary(companyId)

		// 4. Render dashboard
		return (
			<div className="min-h-screen bg-gray-50 p-6">
				<div className="max-w-7xl mx-auto space-y-6">
					{/* Header */}
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">
								Analytics Dashboard
							</h1>
							<p className="text-gray-500 mt-1">
								Track your business performance
							</p>
						</div>
						<div className="text-sm text-gray-500">
							{syncResult.success && (
								<span>
									Last synced:{' '}
									{new Date(syncResult.syncedAt).toLocaleTimeString()}
								</span>
							)}
						</div>
					</div>

					{/* Metrics Cards */}
					<MetricsCards
						revenue={summary.revenue}
						members={summary.memberCount}
						churnRate={summary.churnRate}
					/>

					{/* Charts Grid */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Revenue Chart */}
						<RevenueChart data={summary.revenueTimeSeries} />

						{/* Top Products */}
						<ProductsTable products={summary.topProducts} />
					</div>

					{/* Debug Info (remove in production) */}
					{process.env.NODE_ENV === 'development' && (
						<div className="bg-white rounded-lg shadow p-4">
							<h3 className="text-sm font-semibold text-gray-700 mb-2">
								Debug Info
							</h3>
							<pre className="text-xs text-gray-600">
								{JSON.stringify(
									{
										userId,
										companyId,
										syncResult: {
											...syncResult,
											syncedAt: new Date(
												syncResult.syncedAt,
											).toISOString(),
										},
									},
									null,
									2,
								)}
							</pre>
						</div>
					)}
				</div>
			</div>
		)
	} catch (error) {
		console.error('Dashboard error:', error)
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center max-w-md mx-auto p-6">
					<div className="bg-red-50 border border-red-200 rounded-lg p-4">
						<h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
						<p className="text-gray-700">
							Failed to load dashboard. Please try again.
						</p>
						{error instanceof Error && (
							<p className="text-sm text-gray-500 mt-2">{error.message}</p>
						)}
					</div>
				</div>
			</div>
		)
	}
}
