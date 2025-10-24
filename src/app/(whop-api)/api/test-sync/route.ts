/**
 * Test Sync Endpoint
 * Debug endpoint to test Whop API sync without caching
 */

import { NextRequest, NextResponse } from 'next/server'
import { env } from '~/env'
import { whop } from '~/lib/whop'

export async function GET(req: NextRequest) {
	console.log('[TEST-SYNC] Starting diagnostic test...')

	const results = {
		timestamp: new Date().toISOString(),
		environment: {
			WHOP_API_KEY: env.WHOP_API_KEY ? '✓ Set' : '✗ Missing',
			NEXT_PUBLIC_WHOP_APP_ID: env.NEXT_PUBLIC_WHOP_APP_ID || '✗ Missing',
			NEXT_PUBLIC_WHOP_COMPANY_ID: env.NEXT_PUBLIC_WHOP_COMPANY_ID || '✗ Missing',
		},
		tests: {} as any,
	}

	const companyId = env.NEXT_PUBLIC_WHOP_COMPANY_ID

	// Test 1: Fetch receipts
	try {
		console.log('[TEST-SYNC] Test 1: Fetching receipts...')
		const receiptsResponse = await whop.payments.listReceiptsForCompany({
			companyId,
			filter: {
				statuses: ['succeeded', 'failed', 'refunded'],
			},
		})

		const receipts = receiptsResponse?.receipts?.nodes ?? []
		console.log(`[TEST-SYNC] Found ${receipts.length} receipts`)

		results.tests.receipts = {
			success: true,
			count: receipts.length,
			sample: receipts.slice(0, 2).map((r) => ({
				id: r?.id,
				status: r?.status,
				finalAmount: r?.finalAmount,
				createdAt: r?.createdAt,
				product: r?.accessPass?.name,
			})),
		}
	} catch (error) {
		console.error('[TEST-SYNC] Receipts fetch failed:', error)
		results.tests.receipts = {
			success: false,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		}
	}

	// Test 2: Fetch members
	try {
		console.log('[TEST-SYNC] Test 2: Fetching members...')
		const membersResponse = await whop.companies.listMembers({
			companyId,
			filters: {},
		})

		const members = membersResponse?.members?.nodes ?? []
		console.log(`[TEST-SYNC] Found ${members.length} members`)

		results.tests.members = {
			success: true,
			count: members.length,
			sample: members.slice(0, 2).map((m) => ({
				id: m?.id,
				status: m?.status,
				userId: m?.user?.id,
				email: m?.user?.email,
			})),
		}
	} catch (error) {
		console.error('[TEST-SYNC] Members fetch failed:', error)
		results.tests.members = {
			success: false,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		}
	}

	// Test 3: Check if receipts have product data
	try {
		if (results.tests.receipts?.success && results.tests.receipts.count > 0) {
			console.log('[TEST-SYNC] Test 3: Checking product data in receipts...')
			const receiptsResponse = await whop.payments.listReceiptsForCompany({
				companyId,
				filter: { statuses: ['succeeded'] },
			})
			const receipts = receiptsResponse?.receipts?.nodes ?? []

			const productsFound = receipts.filter((r) => r?.accessPass?.id).length

			results.tests.products = {
				success: true,
				totalReceipts: receipts.length,
				receiptsWithProducts: productsFound,
				productIds: [...new Set(receipts.map((r) => r?.accessPass?.id).filter(Boolean))],
			}
		}
	} catch (error) {
		console.error('[TEST-SYNC] Product check failed:', error)
		results.tests.products = {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		}
	}

	// Summary
	results.tests.summary = {
		allTestsPassed:
			results.tests.receipts?.success && results.tests.members?.success,
		readyToSync:
			results.tests.receipts?.success &&
			results.tests.members?.success &&
			results.tests.receipts.count > 0,
	}

	console.log('[TEST-SYNC] Test complete:', results.tests.summary)

	return NextResponse.json(results, {
		headers: {
			'Cache-Control': 'no-store, no-cache, must-revalidate',
		},
	})
}
