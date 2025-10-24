/**
 * Metrics Cards Component
 * Displays key metrics in card format with trend indicators
 */

import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

interface MetricResult {
	value: number
	change?: number
}

interface MetricsCardsProps {
	revenue: MetricResult
	members: MetricResult
	churnRate: number
}

export function MetricsCards({ revenue, members, churnRate }: MetricsCardsProps) {
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount)
	}

	const formatNumber = (num: number) => {
		return new Intl.NumberFormat('en-US').format(num)
	}

	const formatChange = (change?: number) => {
		if (change === undefined || change === 0) return null
		const isPositive = change > 0

		return (
			<span
				className={`flex items-center gap-1 text-sm font-medium ${
					isPositive ? 'text-green-600' : 'text-red-600'
				}`}
			>
				{isPositive ? (
					<ArrowUpIcon className="w-4 h-4" />
				) : (
					<ArrowDownIcon className="w-4 h-4" />
				)}
				{Math.abs(change).toFixed(1)}%
			</span>
		)
	}

	const getChurnColor = (rate: number) => {
		if (rate < 5) return 'text-green-600'
		if (rate < 10) return 'text-yellow-600'
		return 'text-red-600'
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			{/* Revenue Card */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
					{formatChange(revenue.change)}
				</div>
				<p className="text-3xl font-bold text-gray-900">
					{formatCurrency(revenue.value)}
				</p>
				<p className="text-xs text-gray-500 mt-1">This month</p>
			</div>

			{/* Members Card */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-sm font-medium text-gray-500">Active Members</h3>
					{formatChange(members.change)}
				</div>
				<p className="text-3xl font-bold text-gray-900">
					{formatNumber(members.value)}
				</p>
				<p className="text-xs text-gray-500 mt-1">Currently subscribed</p>
			</div>

			{/* Churn Rate Card */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-sm font-medium text-gray-500">Churn Rate</h3>
				</div>
				<p className={`text-3xl font-bold ${getChurnColor(churnRate)}`}>
					{churnRate.toFixed(1)}%
				</p>
				<p className="text-xs text-gray-500 mt-1">
					Last 30 days
					{churnRate < 5 && ' • Excellent'}
					{churnRate >= 5 && churnRate < 10 && ' • Good'}
					{churnRate >= 10 && ' • Needs attention'}
				</p>
			</div>
		</div>
	)
}
