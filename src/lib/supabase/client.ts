/**
 * Supabase Client & Database Helpers
 * Handles all database operations for caching Whop data
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for full access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
	throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
})

// ============================================================================
// COMPANY OPERATIONS
// ============================================================================

/**
 * Upsert a company record (create or update)
 * @param companyId - Whop company ID
 * @returns Company record
 */
export async function upsertCompany(companyId: string) {
	const { data, error } = await supabase
		.from('companies')
		.upsert({ id: companyId }, { onConflict: 'id' })
		.select()
		.single()

	if (error) {
		console.error('Error upserting company:', error)
		throw error
	}

	return data
}

/**
 * Update the last sync timestamp for a company
 * @param companyId - Whop company ID
 */
export async function updateLastSync(companyId: string) {
	const { error } = await supabase
		.from('companies')
		.update({ last_sync: new Date().toISOString() })
		.eq('id', companyId)

	if (error) {
		console.error('Error updating last sync:', error)
		throw error
	}
}

/**
 * Get the last sync timestamp for a company
 * @param companyId - Whop company ID
 * @returns Last sync date or null if never synced
 */
export async function getLastSync(companyId: string): Promise<Date | null> {
	const { data, error } = await supabase
		.from('companies')
		.select('last_sync')
		.eq('id', companyId)
		.single()

	if (error) {
		// If company doesn't exist yet, return null
		if (error.code === 'PGRST116') {
			return null
		}
		console.error('Error getting last sync:', error)
		throw error
	}

	return data?.last_sync ? new Date(data.last_sync) : null
}

// ============================================================================
// PAYMENT OPERATIONS
// ============================================================================

/**
 * Bulk insert payments (using upsert to handle duplicates)
 * @param payments - Array of payment records
 */
export async function bulkInsertPayments(payments: any[]) {
	if (payments.length === 0) return

	const { error } = await supabase
		.from('payments')
		.upsert(payments, { onConflict: 'company_id,id' })

	if (error) {
		console.error('Error bulk inserting payments:', error)
		throw error
	}

	console.log(`Successfully upserted ${payments.length} payments`)
}

/**
 * Get all payments for a company
 * @param companyId - Whop company ID
 * @returns Array of payment records
 */
export async function getPayments(companyId: string) {
	const { data, error } = await supabase
		.from('payments')
		.select('*')
		.eq('company_id', companyId)
		.order('created_at', { ascending: false })

	if (error) {
		console.error('Error fetching payments:', error)
		throw error
	}

	return data
}

// ============================================================================
// MEMBERSHIP OPERATIONS
// ============================================================================

/**
 * Bulk insert memberships (using upsert to handle duplicates)
 * @param memberships - Array of membership records
 */
export async function bulkInsertMemberships(memberships: any[]) {
	if (memberships.length === 0) return

	const { error } = await supabase
		.from('memberships')
		.upsert(memberships, { onConflict: 'company_id,id' })

	if (error) {
		console.error('Error bulk inserting memberships:', error)
		throw error
	}

	console.log(`Successfully upserted ${memberships.length} memberships`)
}

/**
 * Get all memberships for a company
 * @param companyId - Whop company ID
 * @returns Array of membership records
 */
export async function getMemberships(companyId: string) {
	const { data, error } = await supabase
		.from('memberships')
		.select('*')
		.eq('company_id', companyId)
		.order('created_at', { ascending: false })

	if (error) {
		console.error('Error fetching memberships:', error)
		throw error
	}

	return data
}

// ============================================================================
// PRODUCT OPERATIONS
// ============================================================================

/**
 * Bulk insert products (using upsert to handle duplicates)
 * @param products - Array of product records
 */
export async function bulkInsertProducts(products: any[]) {
	if (products.length === 0) return

	const { error } = await supabase.from('products').upsert(products, {
		onConflict: 'id',
	})

	if (error) {
		console.error('Error bulk inserting products:', error)
		throw error
	}

	console.log(`Successfully upserted ${products.length} products`)
}

/**
 * Get all products for a company
 * @param companyId - Whop company ID
 * @returns Array of product records
 */
export async function getProducts(companyId: string) {
	const { data, error } = await supabase
		.from('products')
		.select('*')
		.eq('company_id', companyId)
		.order('created_at', { ascending: false })

	if (error) {
		console.error('Error fetching products:', error)
		throw error
	}

	return data
}

// ============================================================================
// METRICS CACHE OPERATIONS
// ============================================================================

/**
 * Cache a computed metric
 * @param companyId - Whop company ID
 * @param date - Date for the metric
 * @param metricType - Type of metric (e.g., 'daily_revenue')
 * @param value - Metric value
 * @param metadata - Additional metadata
 */
export async function cacheMetric(
	companyId: string,
	date: Date,
	metricType: string,
	value: number,
	metadata?: any,
) {
	const { error } = await supabase.from('metrics_cache').upsert(
		{
			company_id: companyId,
			date: date.toISOString().split('T')[0], // YYYY-MM-DD format
			metric_type: metricType,
			value,
			metadata,
			computed_at: new Date().toISOString(),
		},
		{ onConflict: 'company_id,date,metric_type' },
	)

	if (error) {
		console.error('Error caching metric:', error)
		throw error
	}
}

/**
 * Get cached metrics for a company
 * @param companyId - Whop company ID
 * @param metricType - Type of metric
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Array of cached metrics
 */
export async function getCachedMetrics(
	companyId: string,
	metricType: string,
	startDate?: Date,
	endDate?: Date,
) {
	let query = supabase
		.from('metrics_cache')
		.select('*')
		.eq('company_id', companyId)
		.eq('metric_type', metricType)

	if (startDate) {
		query = query.gte('date', startDate.toISOString().split('T')[0])
	}

	if (endDate) {
		query = query.lte('date', endDate.toISOString().split('T')[0])
	}

	const { data, error } = await query.order('date', { ascending: true })

	if (error) {
		console.error('Error fetching cached metrics:', error)
		throw error
	}

	return data
}
