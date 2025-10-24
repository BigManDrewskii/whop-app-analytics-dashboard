/**
 * Analytics Data Sync Module
 * Handles syncing data from Whop API to Supabase cache
 */

import {
	fetchAllPayments,
	fetchAllMemberships,
	fetchAllProducts,
} from '../whop/client'
import {
	upsertCompany,
	updateLastSync,
	getLastSync,
	bulkInsertPayments,
	bulkInsertMemberships,
	bulkInsertProducts,
} from '../supabase/client'

export interface SyncOptions {
	companyId: string
	force?: boolean // Force sync even if data is recent
}

export interface SyncResult {
	success: boolean
	paymentsCount: number
	membershipsCount: number
	productsCount: number
	syncedAt: Date
	error?: string
}

/**
 * Sync company data from Whop API to Supabase
 * Only syncs if data is older than 1 hour (unless force=true)
 *
 * @param options - Sync options
 * @returns Sync result with counts and status
 */
export async function syncCompanyData({
	companyId,
	force = false,
}: SyncOptions): Promise<SyncResult> {
	const startTime = Date.now()
	console.log(`[SYNC] Starting sync for company: ${companyId}`)

	try {
		// 1. Check if sync is needed
		const lastSync = await getLastSync(companyId)
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

		if (!force && lastSync && lastSync > oneHourAgo) {
			const minutesAgo = Math.floor(
				(Date.now() - lastSync.getTime()) / (1000 * 60),
			)
			console.log(
				`[SYNC] Data is fresh (synced ${minutesAgo} minutes ago). Skipping sync.`,
			)
			return {
				success: true,
				paymentsCount: 0,
				membershipsCount: 0,
				productsCount: 0,
				syncedAt: lastSync,
			}
		}

		// 2. Ensure company exists in database
		await upsertCompany(companyId)
		console.log(`[SYNC] Company record ready`)

		// 3. Fetch all data from Whop API (in parallel for speed)
		console.log(`[SYNC] Fetching data from Whop API...`)
		const [payments, memberships, products] = await Promise.all([
			fetchAllPayments(companyId),
			fetchAllMemberships(companyId),
			fetchAllProducts(companyId),
		])

		console.log(`[SYNC] Fetched from Whop API:`)
		console.log(`  - ${payments.length} payments`)
		console.log(`  - ${memberships.length} memberships`)
		console.log(`  - ${products.length} products`)

		// 4. Transform data for Supabase
		console.log(`[SYNC] Transforming data...`)

		// Transform receipts (payments) - these come from listReceiptsForCompany
		const paymentsFormatted = payments.map((p: any) => ({
			id: p.id,
			company_id: companyId,
			product_id: p.accessPass?.id || null,
			membership_id: p.membership?.id || null,
			user_id: p.member?.user?.id || null,
			status: p.status === 'succeeded' ? 'paid' : p.status || 'unknown',
			final_amount: Math.round((p.finalAmount || 0) * 100), // Convert dollars to cents
			currency: p.currency || 'usd',
			created_at: p.createdAt ? new Date(p.createdAt * 1000).toISOString() : null,
			paid_at: p.paidAt ? new Date(p.paidAt * 1000).toISOString() : null,
			refunded_at: p.refundedAt
				? new Date(p.refundedAt * 1000).toISOString()
				: null,
		}))

		// Transform members (which contain membership data)
		const membershipsFormatted = memberships
			.filter((m: any) => m?.id) // Only include members with IDs
			.map((m: any) => ({
				id: m.id,
				company_id: companyId,
				product_id: m.accessPasses?.[0]?.id || null, // First access pass
				user_id: m.user?.id || null,
				status: m.status || 'unknown',
				valid: m.valid ?? false,
				created_at: m.createdAt ? new Date(m.createdAt * 1000).toISOString() : null,
				expires_at: m.expiresAt ? new Date(m.expiresAt * 1000).toISOString() : null,
				renewal_period_start: m.renewalPeriodStart
					? new Date(m.renewalPeriodStart * 1000).toISOString()
					: null,
				renewal_period_end: m.renewalPeriodEnd
					? new Date(m.renewalPeriodEnd * 1000).toISOString()
					: null,
				cancel_at_period_end: m.cancelAtPeriodEnd || false,
			}))

		const productsFormatted = products.map((p: any) => ({
			id: p.id,
			company_id: companyId,
			name: p.title || p.name || 'Unnamed Product',
			created_at: new Date().toISOString(), // Use current time as we don't have creation date
			metadata: {
				visibility: p.visibility,
				stock: p.stock,
				initial_stock: p.initialStock,
			},
		}))

		// 5. Insert into Supabase (in parallel for speed)
		console.log(`[SYNC] Inserting into Supabase...`)
		await Promise.all([
			bulkInsertPayments(paymentsFormatted),
			bulkInsertMemberships(membershipsFormatted),
			bulkInsertProducts(productsFormatted),
		])

		// 6. Update last sync timestamp
		await updateLastSync(companyId)

		const duration = Date.now() - startTime
		console.log(`[SYNC] Sync completed successfully in ${duration}ms`)

		return {
			success: true,
			paymentsCount: payments.length,
			membershipsCount: memberships.length,
			productsCount: products.length,
			syncedAt: new Date(),
		}
	} catch (error) {
		console.error(`[SYNC] Sync failed:`, error)
		return {
			success: false,
			paymentsCount: 0,
			membershipsCount: 0,
			productsCount: 0,
			syncedAt: new Date(),
			error: error instanceof Error ? error.message : 'Unknown error',
		}
	}
}

/**
 * Get sync status for a company
 * @param companyId - Whop company ID
 * @returns Last sync time and whether sync is needed
 */
export async function getSyncStatus(companyId: string) {
	const lastSync = await getLastSync(companyId)
	const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

	return {
		lastSync,
		needsSync: !lastSync || lastSync < oneHourAgo,
		minutesSinceSync: lastSync
			? Math.floor((Date.now() - lastSync.getTime()) / (1000 * 60))
			: null,
	}
}
