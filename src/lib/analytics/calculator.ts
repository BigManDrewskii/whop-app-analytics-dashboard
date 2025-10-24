/**
 * Analytics Calculator Module
 * Computes metrics from cached Supabase data
 */

import { supabase } from '../supabase/client'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

export interface MetricResult {
	value: number
	change?: number // Percentage change from previous period
}

export interface TimeSeriesPoint {
	date: string
	value: number
}

export interface ProductMetric {
	productId: string
	productName: string
	revenue: number
	count: number
}

export interface CustomerSegment {
	segment: 'new' | 'active' | 'at_risk' | 'churned'
	count: number
	percentage: number
	color: string
}

/**
 * Calculate total revenue for a date range
 * @param companyId - Whop company ID
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Revenue with percentage change
 */
export async function calculateRevenue(
	companyId: string,
	startDate: Date,
	endDate: Date,
): Promise<MetricResult> {
	// Get current period revenue
	const { data: currentPayments } = await supabase
		.from('payments')
		.select('final_amount')
		.eq('company_id', companyId)
		.eq('status', 'paid')
		.gte('paid_at', startDate.toISOString())
		.lte('paid_at', endDate.toISOString())

	const currentRevenue =
		currentPayments?.reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0

	// Calculate previous period for comparison
	const daysDiff = Math.ceil(
		(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
	)
	const prevStartDate = subDays(startDate, daysDiff)
	const prevEndDate = subDays(endDate, daysDiff)

	const { data: previousPayments } = await supabase
		.from('payments')
		.select('final_amount')
		.eq('company_id', companyId)
		.eq('status', 'paid')
		.gte('paid_at', prevStartDate.toISOString())
		.lte('paid_at', prevEndDate.toISOString())

	const previousRevenue =
		previousPayments?.reduce((sum, p) => sum + (p.final_amount || 0), 0) || 0

	const change =
		previousRevenue > 0
			? ((currentRevenue - previousRevenue) / previousRevenue) * 100
			: 0

	return {
		value: currentRevenue / 100, // Convert cents to dollars
		change,
	}
}

/**
 * Get active member count
 * @param companyId - Whop company ID
 * @returns Member count with percentage change
 */
export async function getActiveMemberCount(
	companyId: string,
): Promise<MetricResult> {
	// Current active members
	const { count: currentCount } = await supabase
		.from('memberships')
		.select('*', { count: 'exact', head: true })
		.eq('company_id', companyId)
		.eq('valid', true)
		.in('status', ['active', 'trialing'])

	// Members 30 days ago
	const thirtyDaysAgo = subDays(new Date(), 30)

	const { count: previousCount } = await supabase
		.from('memberships')
		.select('*', { count: 'exact', head: true })
		.eq('company_id', companyId)
		.eq('valid', true)
		.in('status', ['active', 'trialing'])
		.lt('created_at', thirtyDaysAgo.toISOString())

	const change =
		previousCount && previousCount > 0
			? (((currentCount || 0) - previousCount) / previousCount) * 100
			: 0

	return {
		value: currentCount || 0,
		change,
	}
}

/**
 * Calculate churn rate (last 30 days)
 * @param companyId - Whop company ID
 * @returns Churn rate as percentage
 */
export async function calculateChurnRate(companyId: string): Promise<number> {
	const thirtyDaysAgo = subDays(new Date(), 30)

	// Members that were active 30 days ago
	const { count: activeThirtyDaysAgo } = await supabase
		.from('memberships')
		.select('*', { count: 'exact', head: true })
		.eq('company_id', companyId)
		.eq('valid', true)
		.lt('created_at', thirtyDaysAgo.toISOString())

	// Members that churned in last 30 days
	const { count: churned } = await supabase
		.from('memberships')
		.select('*', { count: 'exact', head: true })
		.eq('company_id', companyId)
		.eq('valid', false)
		.in('status', ['cancelled', 'expired'])
		.gte('expires_at', thirtyDaysAgo.toISOString())
		.lte('expires_at', new Date().toISOString())

	if (!activeThirtyDaysAgo || activeThirtyDaysAgo === 0) return 0

	return ((churned || 0) / activeThirtyDaysAgo) * 100
}

/**
 * Get revenue time series for charts
 * @param companyId - Whop company ID
 * @param days - Number of days to include
 * @returns Array of date/revenue points
 */
export async function getRevenueTimeSeries(
	companyId: string,
	days: number = 30,
): Promise<TimeSeriesPoint[]> {
	const startDate = subDays(new Date(), days)

	const { data } = await supabase
		.from('payments')
		.select('paid_at, final_amount')
		.eq('company_id', companyId)
		.eq('status', 'paid')
		.gte('paid_at', startDate.toISOString())
		.not('paid_at', 'is', null)
		.order('paid_at', { ascending: true })

	if (!data || data.length === 0) return []

	// Group by date
	const grouped = data.reduce(
		(acc, payment) => {
			if (!payment.paid_at) return acc
			const date = format(new Date(payment.paid_at), 'yyyy-MM-dd')
			acc[date] = (acc[date] || 0) + (payment.final_amount || 0) / 100
			return acc
		},
		{} as Record<string, number>,
	)

	return Object.entries(grouped)
		.map(([date, value]) => ({
			date,
			value: Math.round(value * 100) / 100, // Round to 2 decimals
		}))
		.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get top products by revenue
 * @param companyId - Whop company ID
 * @param limit - Maximum number of products to return
 * @returns Array of products with revenue and count
 */
export async function getTopProducts(
	companyId: string,
	limit: number = 5,
): Promise<ProductMetric[]> {
	const { data: payments } = await supabase
		.from('payments')
		.select('product_id, final_amount')
		.eq('company_id', companyId)
		.eq('status', 'paid')
		.not('product_id', 'is', null)

	if (!payments || payments.length === 0) return []

	// Group by product
	const grouped = payments.reduce(
		(acc, payment) => {
			const productId = payment.product_id
			if (!productId) return acc

			if (!acc[productId]) {
				acc[productId] = { revenue: 0, count: 0 }
			}
			acc[productId].revenue += (payment.final_amount || 0) / 100
			acc[productId].count += 1
			return acc
		},
		{} as Record<string, { revenue: number; count: number }>,
	)

	// Get product names
	const productIds = Object.keys(grouped)
	const { data: products } = await supabase
		.from('products')
		.select('id, name')
		.in('id', productIds)

	const productMap = new Map(products?.map((p) => [p.id, p.name]) || [])

	// Combine and sort
	return Object.entries(grouped)
		.map(([productId, stats]) => ({
			productId,
			productName: productMap.get(productId) || 'Unknown Product',
			revenue: Math.round(stats.revenue * 100) / 100,
			count: stats.count,
		}))
		.sort((a, b) => b.revenue - a.revenue)
		.slice(0, limit)
}

/**
 * Get member growth time series
 * @param companyId - Whop company ID
 * @param days - Number of days to include
 * @returns Array of date/member count points
 */
export async function getMemberGrowthTimeSeries(
	companyId: string,
	days: number = 30,
): Promise<TimeSeriesPoint[]> {
	const startDate = subDays(new Date(), days)

	const { data } = await supabase
		.from('memberships')
		.select('created_at')
		.eq('company_id', companyId)
		.gte('created_at', startDate.toISOString())
		.not('created_at', 'is', null)
		.order('created_at', { ascending: true })

	if (!data || data.length === 0) return []

	// Group by date and count
	const grouped = data.reduce(
		(acc, membership) => {
			if (!membership.created_at) return acc
			const date = format(new Date(membership.created_at), 'yyyy-MM-dd')
			acc[date] = (acc[date] || 0) + 1
			return acc
		},
		{} as Record<string, number>,
	)

	return Object.entries(grouped)
		.map(([date, value]) => ({
			date,
			value,
		}))
		.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calculate ARPU (Average Revenue Per User)
 * @param companyId - Whop company ID
 * @param startDate - Start date
 * @param endDate - End date
 * @returns ARPU with percentage change
 */
export async function calculateARPU(
	companyId: string,
	startDate: Date,
	endDate: Date,
): Promise<MetricResult> {
	const revenue = await calculateRevenue(companyId, startDate, endDate)
	const members = await getActiveMemberCount(companyId)

	const arpu = members.value > 0 ? revenue.value / members.value : 0

	// Calculate previous period ARPU for comparison
	const daysDiff = Math.ceil(
		(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
	)
	const prevStart = subDays(startDate, daysDiff)
	const prevEnd = subDays(endDate, daysDiff)

	const prevRevenue = await calculateRevenue(companyId, prevStart, prevEnd)
	const prevMembers = await getActiveMemberCount(companyId)
	const prevARPU = prevMembers.value > 0 ? prevRevenue.value / prevMembers.value : 0

	const change = prevARPU > 0 ? ((arpu - prevARPU) / prevARPU) * 100 : 0

	return { value: arpu, change }
}

/**
 * Calculate MRR (Monthly Recurring Revenue)
 * @param companyId - Whop company ID
 * @returns MRR value
 */
export async function calculateMRR(companyId: string): Promise<MetricResult> {
	// Get all active subscriptions
	const { data } = await supabase
		.from('memberships')
		.select('product_id')
		.eq('company_id', companyId)
		.eq('valid', true)
		.in('status', ['active', 'trialing'])

	if (!data || data.length === 0) return { value: 0, change: 0 }

	// For simplicity, estimate MRR based on recent revenue divided by days
	const thirtyDaysAgo = subDays(new Date(), 30)
	const revenue = await calculateRevenue(companyId, thirtyDaysAgo, new Date())

	// Estimate monthly recurring revenue (actual calculation would need subscription pricing)
	const mrr = (revenue.value / 30) * 30 // Normalize to monthly

	return { value: mrr, change: revenue.change }
}

/**
 * Calculate CLV (Customer Lifetime Value)
 * @param companyId - Whop company ID
 * @returns CLV estimate
 */
export async function calculateCLV(companyId: string): Promise<MetricResult> {
	const arpu = await calculateARPU(companyId, subDays(new Date(), 90), new Date())
	const churnRate = await calculateChurnRate(companyId)

	// Simple CLV formula: ARPU / (Churn Rate / 100)
	// If churn is 5%, CLV = ARPU / 0.05 = ARPU * 20
	const clv = churnRate > 0 ? arpu.value / (churnRate / 100) : arpu.value * 12

	return { value: clv, change: arpu.change }
}

/**
 * Calculate customer segmentation
 * Only counts actual paying customers, not all community members
 * @param companyId - Whop company ID
 * @returns Customer segments breakdown
 */
export async function getCustomerSegmentation(
	companyId: string,
): Promise<CustomerSegment[]> {
	const now = new Date()
	const thirtyDaysAgo = subDays(now, 30)

	// Get memberships that have associated payments (actual customers)
	const { data: payments } = await supabase
		.from('payments')
		.select('membership_id, user_id, created_at')
		.eq('company_id', companyId)
		.eq('status', 'paid')

	// If no payments, no customers yet
	if (!payments || payments.length === 0) {
		return [
			{ segment: 'new', count: 0, percentage: 0, color: '#10b981' },
			{ segment: 'active', count: 0, percentage: 0, color: '#3b82f6' },
			{ segment: 'at_risk', count: 0, percentage: 0, color: '#f59e0b' },
			{ segment: 'churned', count: 0, percentage: 0, color: '#ef4444' },
		]
	}

	// Get unique customer IDs (by user_id)
	const uniqueCustomerIds = [...new Set(payments.map((p) => p.user_id).filter(Boolean))]

	// Get memberships for these actual customers
	const { data: customerMemberships } = await supabase
		.from('memberships')
		.select('id, user_id, created_at, valid, status, expires_at')
		.eq('company_id', companyId)
		.in('user_id', uniqueCustomerIds)

	if (!customerMemberships || customerMemberships.length === 0) {
		return [
			{ segment: 'new', count: 0, percentage: 0, color: '#10b981' },
			{ segment: 'active', count: 0, percentage: 0, color: '#3b82f6' },
			{ segment: 'at_risk', count: 0, percentage: 0, color: '#f59e0b' },
			{ segment: 'churned', count: 0, percentage: 0, color: '#ef4444' },
		]
	}

	const total = uniqueCustomerIds.length

	// Segment logic - group by user_id
	const customersByUserId = new Map<string, typeof customerMemberships[0]>()
	customerMemberships.forEach((m) => {
		if (m.user_id) {
			const existing = customersByUserId.get(m.user_id)
			// Keep the most recent membership per user
			if (!existing || (m.created_at && existing.created_at && m.created_at > existing.created_at)) {
				customersByUserId.set(m.user_id, m)
			}
		}
	})

	const uniqueCustomers = Array.from(customersByUserId.values())

	// New: Customers who joined in last 30 days and are active
	const newCustomers = uniqueCustomers.filter(
		(m) => m.created_at && new Date(m.created_at) > thirtyDaysAgo && m.valid,
	).length

	// Active: Customers older than 30 days and still valid
	const activeCustomers = uniqueCustomers.filter(
		(m) =>
			m.valid &&
			m.status === 'active' &&
			m.created_at &&
			new Date(m.created_at) <= thirtyDaysAgo,
	).length

	// At Risk: Valid but expiring soon (within 7 days)
	const atRiskCustomers = uniqueCustomers.filter(
		(m) =>
			m.valid &&
			m.expires_at &&
			new Date(m.expires_at) > now &&
			new Date(m.expires_at) < subDays(now, -7),
	).length

	// Churned: No longer valid or cancelled
	const churnedCustomers = uniqueCustomers.filter(
		(m) => !m.valid || m.status === 'cancelled' || m.status === 'expired',
	).length

	return [
		{
			segment: 'new',
			count: newCustomers,
			percentage: total > 0 ? (newCustomers / total) * 100 : 0,
			color: '#10b981',
		},
		{
			segment: 'active',
			count: activeCustomers,
			percentage: total > 0 ? (activeCustomers / total) * 100 : 0,
			color: '#3b82f6',
		},
		{
			segment: 'at_risk',
			count: atRiskCustomers,
			percentage: total > 0 ? (atRiskCustomers / total) * 100 : 0,
			color: '#f59e0b',
		},
		{
			segment: 'churned',
			count: churnedCustomers,
			percentage: total > 0 ? (churnedCustomers / total) * 100 : 0,
			color: '#ef4444',
		},
	]
}

/**
 * Get summary statistics for dashboard
 * @param companyId - Whop company ID
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Object with all key metrics
 */
export async function getDashboardSummary(
	companyId: string,
	startDate?: Date,
	endDate?: Date,
) {
	const defaultEndDate = endDate || new Date()
	const defaultStartDate =
		startDate ||
		new Date(defaultEndDate.getFullYear(), defaultEndDate.getMonth(), 1)

	const daysDiff = Math.ceil(
		(defaultEndDate.getTime() - defaultStartDate.getTime()) / (1000 * 60 * 60 * 24),
	)

	const [
		revenue,
		memberCount,
		churnRate,
		arpu,
		mrr,
		clv,
		revenueTimeSeries,
		topProducts,
		customerSegments,
	] = await Promise.all([
		calculateRevenue(companyId, defaultStartDate, defaultEndDate),
		getActiveMemberCount(companyId),
		calculateChurnRate(companyId),
		calculateARPU(companyId, defaultStartDate, defaultEndDate),
		calculateMRR(companyId),
		calculateCLV(companyId),
		getRevenueTimeSeries(companyId, daysDiff > 365 ? 365 : daysDiff),
		getTopProducts(companyId, 5),
		getCustomerSegmentation(companyId),
	])

	return {
		revenue,
		memberCount,
		churnRate,
		arpu,
		mrr,
		clv,
		revenueTimeSeries,
		topProducts,
		customerSegments,
		generatedAt: new Date().toISOString(),
	}
}
