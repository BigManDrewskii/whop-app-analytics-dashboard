/**
 * Export Utilities
 * Functions for exporting analytics data to CSV
 */

import { format } from 'date-fns'

interface AnalyticsData {
	revenue: { value: number; change?: number }
	memberCount: { value: number; change?: number }
	churnRate: number
	arpu?: { value: number; change?: number }
	mrr?: { value: number; change?: number }
	clv?: { value: number; change?: number }
	revenueTimeSeries: Array<{ date: string; value: number }>
	topProducts: Array<{
		productId: string
		productName: string
		revenue: number
		count: number
	}>
}

/**
 * Convert analytics data to CSV format
 */
export function exportAnalyticsToCSV(
	data: AnalyticsData,
	dateRange: { start: string | null; end: string | null },
	companyName: string,
): void {
	const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss')
	const filename = `whop-analytics-${companyName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.csv`

	// Build CSV content
	let csv = 'Whop Analytics Export\n'
	csv += `Company: ${companyName}\n`
	csv += `Date Range: ${dateRange.start ? format(new Date(dateRange.start), 'MMM dd, yyyy') : 'N/A'} - ${dateRange.end ? format(new Date(dateRange.end), 'MMM dd, yyyy') : 'N/A'}\n`
	csv += `Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm:ss')}\n`
	csv += '\n'

	// Summary Metrics
	csv += 'Summary Metrics\n'
	csv += 'Metric,Value,Change %\n'
	csv += `Total Revenue,$${data.revenue.value.toFixed(2)},${data.revenue.change?.toFixed(1) || '0'}%\n`
	csv += `Active Members,${data.memberCount.value},${data.memberCount.change?.toFixed(1) || '0'}%\n`
	csv += `Churn Rate,${data.churnRate.toFixed(1)}%,N/A\n`

	if (data.arpu) {
		csv += `ARPU,$${data.arpu.value.toFixed(2)},${data.arpu.change?.toFixed(1) || '0'}%\n`
	}
	if (data.mrr) {
		csv += `MRR,$${data.mrr.value.toFixed(2)},${data.mrr.change?.toFixed(1) || '0'}%\n`
	}
	if (data.clv) {
		csv += `CLV,$${data.clv.value.toFixed(2)},${data.clv.change?.toFixed(1) || '0'}%\n`
	}

	csv += '\n'

	// Revenue Time Series
	csv += 'Revenue Over Time\n'
	csv += 'Date,Revenue\n'
	data.revenueTimeSeries.forEach((point) => {
		csv += `${point.date},$${point.value.toFixed(2)}\n`
	})

	csv += '\n'

	// Top Products
	csv += 'Top Products by Revenue\n'
	csv += 'Rank,Product ID,Product Name,Revenue,Orders\n'
	data.topProducts.forEach((product, index) => {
		csv += `${index + 1},${product.productId},"${product.productName}",$${product.revenue.toFixed(2)},${product.count}\n`
	})

	// Create download link
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
	const link = document.createElement('a')
	const url = URL.createObjectURL(blob)

	link.setAttribute('href', url)
	link.setAttribute('download', filename)
	link.style.visibility = 'hidden'

	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)

	// Cleanup
	URL.revokeObjectURL(url)
}

/**
 * Export products to CSV
 */
export function exportProductsToCSV(
	products: Array<{
		productId: string
		productName: string
		revenue: number
		count: number
		growthRate?: number
		refundRate?: number
	}>,
	companyName: string,
): void {
	const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss')
	const filename = `whop-products-${companyName.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.csv`

	let csv = 'Whop Product Analytics Export\n'
	csv += `Company: ${companyName}\n`
	csv += `Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm:ss')}\n\n`

	csv += 'Rank,Product ID,Product Name,Revenue,Orders,Growth Rate,Refund Rate\n'

	products.forEach((product, index) => {
		csv += `${index + 1},${product.productId},"${product.productName}",$${product.revenue.toFixed(2)},${product.count},${product.growthRate?.toFixed(1) || '0'}%,${product.refundRate?.toFixed(1) || '0'}%\n`
	})

	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
	const link = document.createElement('a')
	const url = URL.createObjectURL(blob)

	link.setAttribute('href', url)
	link.setAttribute('download', filename)
	link.style.visibility = 'hidden'

	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)

	URL.revokeObjectURL(url)
}
