/**
 * Analytics Dashboard - Whop App Experience Page
 * Enhanced with date ranges, new metrics, and advanced features
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Heading, Text, Badge, Button, Progress, Callout, Switch } from 'frosted-ui'
import {
	ArrowUpIcon,
	ArrowDownIcon,
	RefreshCwIcon,
	TrendingUpIcon,
	UsersIcon,
	PercentIcon,
	DollarSignIcon,
	RepeatIcon,
	DownloadIcon,
} from 'lucide-react'
import { useWhop } from '~/components/whop-context'
import { analyticsQuery } from '~/components/whop-context/whop-queries'
import { RevenueChart } from '~/components/dashboard/revenue-chart'
import { ProductsTable } from '~/components/dashboard/products-table'
import { SegmentationChart } from '~/components/analytics/segmentation-chart'
import {
	DateRangePicker,
	getDefaultDateRange,
	type DateRange,
} from '~/components/analytics/date-range-picker'
import { exportAnalyticsToCSV } from '~/lib/export'
import { ErrorBoundary } from '~/components/dashboard/error-boundary'
import { DashboardSkeleton } from '~/components/dashboard/loading-skeleton'

export default function AnalyticsDashboardPage() {
	return (
		<ErrorBoundary>
			<AnalyticsDashboardContent />
		</ErrorBoundary>
	)
}

function AnalyticsDashboardContent() {
	const { experience, user, access } = useWhop()
	const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
	const [compareWithPrevious, setCompareWithPrevious] = useState(false)
	const [autoRefresh, setAutoRefresh] = useState(false)

	const { data, isLoading, error, refetch } = useQuery(
		analyticsQuery(dateRange.startDate, dateRange.endDate, compareWithPrevious),
	)

	// Auto-refresh every 5 minutes
	useEffect(() => {
		if (!autoRefresh) return

		const interval = setInterval(() => {
			refetch()
		}, 5 * 60 * 1000) // 5 minutes

		return () => clearInterval(interval)
	}, [autoRefresh, refetch])

	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount)
	}

	// Format number
	const formatNumber = (num: number) => {
		return new Intl.NumberFormat('en-US').format(num)
	}

	// Format change indicator
	const formatChange = (change?: number) => {
		if (change === undefined || change === 0) return null
		const isPositive = change > 0

		return (
			<Badge color={isPositive ? 'green' : 'red'} variant="soft" radius="full">
				<span className="flex items-center gap-1">
					{isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
					{Math.abs(change).toFixed(1)}%
				</span>
			</Badge>
		)
	}

	// Get churn badge color
	const getChurnBadgeColor = (rate: number): 'green' | 'yellow' | 'red' => {
		if (rate < 5) return 'green'
		if (rate < 10) return 'yellow'
		return 'red'
	}

	if (isLoading) {
		return <DashboardSkeleton />
	}

	if (error) {
		return (
			<div
				className="min-h-screen flex items-center justify-center p-6"
				style={{ background: 'var(--gray-2)' }}
			>
				<Card size="3" style={{ maxWidth: '500px' }}>
					<div className="flex flex-col gap-4">
						<Callout.Root color="red" variant="surface">
							<Callout.Text>
								Failed to load analytics data. Please try again.
							</Callout.Text>
						</Callout.Root>
						<Button size="3" onClick={() => refetch()}>
							<RefreshCwIcon className="w-4 h-4 mr-2" />
							Try Again
						</Button>
					</div>
				</Card>
			</div>
		)
	}

	const analytics = data?.data
	const sync = data?.sync

	return (
		<div className="min-h-screen p-6" style={{ background: 'var(--gray-2)' }}>
			<div className="max-w-[1400px] mx-auto">
				<div className="flex flex-col gap-6">
					{/* Header */}
					<div className="flex justify-between items-start flex-wrap gap-4">
						<div className="flex flex-col gap-1">
							<Heading size="8" weight="bold">
								Analytics Dashboard
							</Heading>
							<Text size="3" color="gray">
								{experience.company.title} • {user.name}
							</Text>
						</div>
						<div className="flex items-center gap-3">
							<DateRangePicker value={dateRange} onChange={setDateRange} />
							{sync && (
								<div className="flex flex-col gap-1 items-end">
									<Text size="2" color="gray">
										Last synced: {new Date(sync.lastSynced).toLocaleTimeString()}
									</Text>
									<Text size="1" color="gray">
										{sync.paymentsCount} payments • {sync.membershipsCount} members
									</Text>
								</div>
							)}
						</div>
					</div>

					{/* Primary Metrics - First Row */}
					{analytics && (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* Revenue Card */}
							<Card size="3" variant="surface">
								<div className="flex flex-col gap-3">
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-2">
											<div
												className="flex items-center justify-center"
												style={{
													width: '32px',
													height: '32px',
													borderRadius: 'var(--radius-3)',
													background: 'var(--accent-3)',
												}}
											>
												<TrendingUpIcon
													className="w-4 h-4"
													style={{ color: 'var(--accent-11)' }}
												/>
											</div>
											<Text size="2" weight="medium" color="gray">
												Total Revenue
											</Text>
										</div>
										{formatChange(analytics.revenue.change)}
									</div>
									<Heading size="7" weight="bold">
										{formatCurrency(analytics.revenue.value)}
									</Heading>
									<Text size="1" color="gray">
										This month
									</Text>
								</div>
							</Card>

							{/* Members Card */}
							<Card size="3" variant="surface">
								<div className="flex flex-col gap-3">
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-2">
											<div
												className="flex items-center justify-center"
												style={{
													width: '32px',
													height: '32px',
													borderRadius: 'var(--radius-3)',
													background: 'var(--blue-3)',
												}}
											>
												<UsersIcon className="w-4 h-4" style={{ color: 'var(--blue-11)' }} />
											</div>
											<Text size="2" weight="medium" color="gray">
												Active Members
											</Text>
										</div>
										{formatChange(analytics.memberCount.change)}
									</div>
									<Heading size="7" weight="bold">
										{formatNumber(analytics.memberCount.value)}
									</Heading>
									<Text size="1" color="gray">
										Currently subscribed
									</Text>
								</div>
							</Card>

							{/* Churn Rate Card */}
							<Card size="3" variant="surface">
								<div className="flex flex-col gap-3">
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-2">
											<div
												className="flex items-center justify-center"
												style={{
													width: '32px',
													height: '32px',
													borderRadius: 'var(--radius-3)',
													background: 'var(--purple-3)',
												}}
											>
												<PercentIcon
													className="w-4 h-4"
													style={{ color: 'var(--purple-11)' }}
												/>
											</div>
											<Text size="2" weight="medium" color="gray">
												Churn Rate
											</Text>
										</div>
										<Badge color={getChurnBadgeColor(analytics.churnRate)} variant="soft" radius="full">
											{analytics.churnRate < 5 && 'Excellent'}
											{analytics.churnRate >= 5 && analytics.churnRate < 10 && 'Good'}
											{analytics.churnRate >= 10 && 'Needs attention'}
										</Badge>
									</div>
									<Heading
										size="7"
										weight="bold"
										style={{
											color:
												analytics.churnRate < 5
													? 'var(--green-11)'
													: analytics.churnRate < 10
														? 'var(--yellow-11)'
														: 'var(--red-11)',
										}}
									>
										{analytics.churnRate.toFixed(1)}%
									</Heading>
									<Text size="1" color="gray">
										Last 30 days
									</Text>
								</div>
							</Card>
						</div>
					)}

					{/* Secondary Metrics - Second Row */}
					{analytics && analytics.arpu && analytics.mrr && analytics.clv && (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* ARPU Card */}
							<Card size="3" variant="surface">
								<div className="flex flex-col gap-3">
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-2">
											<div
												className="flex items-center justify-center"
												style={{
													width: '32px',
													height: '32px',
													borderRadius: 'var(--radius-3)',
													background: 'var(--green-3)',
												}}
											>
												<DollarSignIcon
													className="w-4 h-4"
													style={{ color: 'var(--green-11)' }}
												/>
											</div>
											<Text size="2" weight="medium" color="gray">
												ARPU
											</Text>
										</div>
										{formatChange(analytics.arpu.change)}
									</div>
									<Heading size="7" weight="bold">
										{formatCurrency(analytics.arpu.value)}
									</Heading>
									<Text size="1" color="gray">
										Average revenue per user
									</Text>
								</div>
							</Card>

							{/* MRR Card */}
							<Card size="3" variant="surface">
								<div className="flex flex-col gap-3">
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-2">
											<div
												className="flex items-center justify-center"
												style={{
													width: '32px',
													height: '32px',
													borderRadius: 'var(--radius-3)',
													background: 'var(--orange-3)',
												}}
											>
												<RepeatIcon
													className="w-4 h-4"
													style={{ color: 'var(--orange-11)' }}
												/>
											</div>
											<Text size="2" weight="medium" color="gray">
												MRR
											</Text>
										</div>
										{formatChange(analytics.mrr.change)}
									</div>
									<Heading size="7" weight="bold">
										{formatCurrency(analytics.mrr.value)}
									</Heading>
									<Text size="1" color="gray">
										Monthly recurring revenue
									</Text>
								</div>
							</Card>

							{/* CLV Card */}
							<Card size="3" variant="surface">
								<div className="flex flex-col gap-3">
									<div className="flex justify-between items-center">
										<div className="flex items-center gap-2">
											<div
												className="flex items-center justify-center"
												style={{
													width: '32px',
													height: '32px',
													borderRadius: 'var(--radius-3)',
													background: 'var(--cyan-3)',
												}}
											>
												<TrendingUpIcon
													className="w-4 h-4"
													style={{ color: 'var(--cyan-11)' }}
												/>
											</div>
											<Text size="2" weight="medium" color="gray">
												CLV
											</Text>
										</div>
										{formatChange(analytics.clv.change)}
									</div>
									<Heading size="7" weight="bold">
										{formatCurrency(analytics.clv.value)}
									</Heading>
									<Text size="1" color="gray">
										Customer lifetime value
									</Text>
								</div>
							</Card>
						</div>
					)}

					{/* Charts Grid */}
					{analytics && (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<RevenueChart data={analytics.revenueTimeSeries} />
							<ProductsTable products={analytics.topProducts} />
						</div>
					)}

					{/* Customer Segmentation */}
					{analytics && analytics.customerSegments && (
						<div className="grid grid-cols-1 gap-6">
							<SegmentationChart segments={analytics.customerSegments} />
						</div>
					)}

					{/* Action Buttons & Auto-Refresh */}
					<div className="flex justify-center items-center gap-4 flex-wrap">
						{/* Auto-refresh toggle */}
						<div
							className="flex items-center gap-2 px-4 py-2 rounded-lg"
							style={{
								background: 'var(--gray-3)',
								border: '1px solid var(--gray-6)',
							}}
						>
							<Text size="2" weight="medium">
								Auto-refresh (5min)
							</Text>
							<Switch
								checked={autoRefresh}
								onCheckedChange={setAutoRefresh}
							/>
						</div>

						<Button
							size="3"
							variant="soft"
							onClick={() => {
								if (analytics) {
									exportAnalyticsToCSV(
										analytics,
										{
											start: dateRange.startDate.toISOString(),
											end: dateRange.endDate.toISOString(),
										},
										experience.company.title,
									)
								}
							}}
							disabled={!analytics}
						>
							<DownloadIcon className="w-4 h-4 mr-2" />
							Export to CSV
						</Button>
						<Button size="3" variant="solid" onClick={() => refetch()} disabled={isLoading}>
							<RefreshCwIcon className="w-4 h-4 mr-2" />
							{isLoading ? 'Refreshing...' : 'Refresh Data'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
