/**
 * Whop API Client
 * Handles all interactions with Whop's REST API for fetching payments, memberships, and products
 */

import { whop } from '~/lib/whop'

/**
 * Fetch all receipts (payments) for a company
 * Uses listReceiptsForCompany which returns payment/transaction data
 *
 * @param companyId - Whop company ID
 * @returns {Promise<any[]>} Array of all receipt/payment records
 */
export async function fetchAllPayments(companyId: string): Promise<any[]> {
	try {
		console.log(`Fetching receipts for company: ${companyId}`)

		const response = await whop.payments.listReceiptsForCompany({
			companyId,
			filter: {}, // Fetch ALL receipts regardless of status
		})

		const receipts = response?.receipts?.nodes ?? []
		console.log(`Fetched ${receipts.length} total receipts`)

		// Log first receipt to see actual status
		if (receipts.length > 0) {
			console.log('Sample receipt:', {
				id: receipts[0]?.id,
				status: receipts[0]?.status,
				finalAmount: receipts[0]?.finalAmount,
			})
		}

		return receipts
	} catch (error) {
		console.error('Error fetching receipts:', error)
		throw new Error('Failed to fetch receipts from Whop API')
	}
}

/**
 * Fetch all memberships for a company via members list
 * Members include membership information
 *
 * @param companyId - Whop company ID
 * @returns {Promise<any[]>} Array of all member/membership records
 */
export async function fetchAllMemberships(companyId: string): Promise<any[]> {
	try {
		console.log(`Fetching members for company: ${companyId}`)

		const response = await whop.companies.listMembers({
			companyId,
			filters: {},
		})

		const members = response?.members?.nodes ?? []
		console.log(`Fetched ${members.length} total members`)
		return members
	} catch (error) {
		console.error('Error fetching members:', error)
		throw new Error('Failed to fetch members from Whop API')
	}
}

/**
 * Fetch all products (access passes) for a company
 * We extract products from receipts since they're included there
 *
 * @param companyId - Whop company ID
 * @returns {Promise<any[]>} Array of unique product records
 */
export async function fetchAllProducts(companyId: string): Promise<any[]> {
	try {
		console.log(`Extracting products from receipts for company: ${companyId}`)

		// Get receipts which include product information
		const receipts = await fetchAllPayments(companyId)

		// Extract unique products from receipts
		const productMap = new Map()

		for (const receipt of receipts) {
			const product = receipt?.accessPass
			if (product && product.id) {
				if (!productMap.has(product.id)) {
					productMap.set(product.id, {
						id: product.id,
						name: product.name || 'Unnamed Product',
						visibility: product.visibility,
						stock: product.stock,
						initialStock: product.initialStock,
					})
				}
			}
		}

		const products = Array.from(productMap.values())
		console.log(`Found ${products.length} unique products`)

		return products
	} catch (error) {
		console.error('Error fetching products:', error)
		throw new Error('Failed to fetch products from Whop API')
	}
}
