import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query'
import { env } from '~/env'
import type { WhopAccess, WhopExperience, WhopUser } from '~/lib/whop'

export const serverQueryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000, // 1 minute
			retry: 1,
		},
		dehydrate: {
			shouldDehydrateQuery: (query) =>
				defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
		},
	},
})

export function getApiUrl(path: string): string {
	if (typeof window === 'undefined') {
		return `https://${env.NEXT_PUBLIC_VERCEL_URL}${path}`
	}
	return path
}

export const whopExperienceQuery = (experienceId: string) => ({
	queryKey: ['experience', experienceId],
	queryFn: async () => {
		const response = await fetch(getApiUrl(`/api/experience/${experienceId}`))
		if (!response.ok) throw new Error('Failed to fetch whop experience')
		const result = (await response.json()) as WhopExperience
		return result
	},
})

export const whopUserQuery = (experienceId: string) => ({
	queryKey: ['user', experienceId],
	queryFn: async () => {
		const response = await fetch(getApiUrl(`/api/experience/${experienceId}/user`))
		if (!response.ok) throw new Error('Failed to fetch whop user')
		return response.json() as Promise<{ user: WhopUser; access: WhopAccess }>
	},
})

export const receiptsQuery = () => ({
	queryKey: ['receipts'],
	queryFn: async () => {
		const response = await fetch(getApiUrl('/api/receipts'))
		if (!response.ok) throw new Error('Failed to fetch receipts')
		return response.json() as Promise<{
			accessPasses: Array<{
				id: string
				type: 'one-time' | 'subscription'
				receipts: Array<{
					amountPaid: number
					paidAt: string
					subscriptionStatus?: string | null
					membershipId?: string | null
					member?: {
						id: string
					} | null
				}>
			}>
		}>
	},
})

export const analyticsQuery = (startDate?: Date, endDate?: Date, compareWithPrevious = false) => ({
	queryKey: ['analytics', startDate?.toISOString(), endDate?.toISOString(), compareWithPrevious],
	queryFn: async () => {
		const params = new URLSearchParams()
		if (startDate) params.append('startDate', startDate.toISOString())
		if (endDate) params.append('endDate', endDate.toISOString())
		if (compareWithPrevious) params.append('compare', 'true')

		const url = getApiUrl(`/api/analytics${params.toString() ? `?${params.toString()}` : ''}`)
		const response = await fetch(url)
		if (!response.ok) throw new Error('Failed to fetch analytics')
		return response.json() as Promise<{
			success: boolean
			data: {
				revenue: { value: number; change?: number }
				memberCount: { value: number; change?: number }
				churnRate: number
				arpu: { value: number; change?: number }
				mrr: { value: number; change?: number }
				clv: { value: number; change?: number }
				revenueTimeSeries: Array<{ date: string; value: number }>
				topProducts: Array<{
					productId: string
					productName: string
					revenue: number
					count: number
					growthRate?: number
					refundRate?: number
				}>
				customerSegments: Array<{
					segment: 'new' | 'active' | 'at_risk' | 'churned'
					count: number
					percentage: number
					color: string
				}>
			}
			sync: {
				lastSynced: string
				paymentsCount: number
				membershipsCount: number
				productsCount: number
			}
			generatedAt: string
		}>
	},
})
