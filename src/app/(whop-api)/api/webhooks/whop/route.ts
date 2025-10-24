/**
 * Whop Webhook Handler
 * Receives and processes webhook events from Whop API
 * Events: payment.succeeded, payment.failed, membership.created, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncCompanyData } from '~/lib/analytics/sync'
import { supabase } from '~/lib/supabase/client'

/**
 * Verify webhook signature from Whop
 * @param payload - Raw request body
 * @param signature - x-whop-signature header
 * @returns True if signature is valid
 */
async function verifyWebhookSignature(
	payload: string,
	signature: string | null,
): Promise<boolean> {
	// Note: Whop webhook signature verification
	// For now, we'll check if signature exists
	// In production, implement proper HMAC verification with WHOP_WEBHOOK_SECRET

	if (!signature) {
		console.warn('[WEBHOOK] No signature provided')
		return false
	}

	// TODO: Implement proper signature verification
	// const secret = process.env.WHOP_WEBHOOK_SECRET
	// const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
	// return signature === expectedSignature

	return true // For now, accept all webhooks
}

/**
 * Handle webhook events from Whop
 */
export async function POST(req: NextRequest) {
	try {
		// 1. Get raw body and signature
		const body = await req.text()
		const signature = req.headers.get('x-whop-signature')

		console.log('[WEBHOOK] Received webhook event')
		console.log('[WEBHOOK] Signature:', signature ? 'Present' : 'Missing')

		// 2. Verify signature
		const isValid = await verifyWebhookSignature(body, signature)
		if (!isValid) {
			console.error('[WEBHOOK] Invalid signature')
			return NextResponse.json(
				{ error: 'Invalid signature' },
				{ status: 401 },
			)
		}

		// 3. Parse event
		const event = JSON.parse(body)
		const eventType = event.type
		const eventData = event.data

		console.log(`[WEBHOOK] Event type: ${eventType}`)

		// 4. Extract company ID from event data
		let companyId: string | null = null

		if (eventData?.company?.id) {
			companyId = eventData.company.id
		} else if (eventData?.companyId) {
			companyId = eventData.companyId
		}

		if (!companyId) {
			console.error('[WEBHOOK] No company ID in event data')
			return NextResponse.json(
				{ error: 'No company ID found' },
				{ status: 400 },
			)
		}

		console.log(`[WEBHOOK] Company ID: ${companyId}`)

		// 5. Store event in database for audit trail
		try {
			await supabase.from('webhook_events').insert({
				company_id: companyId,
				event_type: eventType,
				event_data: eventData,
				received_at: new Date().toISOString(),
			})
		} catch (error) {
			console.warn('[WEBHOOK] Failed to store event (table may not exist):', error)
		}

		// 6. Handle different event types
		switch (eventType) {
			case 'payment.succeeded':
				console.log('[WEBHOOK] Processing payment.succeeded')
				// Force sync to get latest payment data
				await syncCompanyData({ companyId, force: true })
				break

			case 'payment.failed':
				console.log('[WEBHOOK] Processing payment.failed')
				// Optionally handle failed payments
				await syncCompanyData({ companyId, force: true })
				break

			case 'payment.refunded':
				console.log('[WEBHOOK] Processing payment.refunded')
				// Update payment records
				await syncCompanyData({ companyId, force: true })
				break

			case 'membership.created':
				console.log('[WEBHOOK] Processing membership.created')
				// Sync to get new membership
				await syncCompanyData({ companyId, force: true })
				break

			case 'membership.updated':
				console.log('[WEBHOOK] Processing membership.updated')
				// Sync to get updated membership status
				await syncCompanyData({ companyId, force: true })
				break

			case 'membership.cancelled':
				console.log('[WEBHOOK] Processing membership.cancelled')
				// Sync to reflect cancellation
				await syncCompanyData({ companyId, force: true })
				break

			case 'membership.expired':
				console.log('[WEBHOOK] Processing membership.expired')
				// Sync to reflect expiration
				await syncCompanyData({ companyId, force: true })
				break

			default:
				console.log(`[WEBHOOK] Unhandled event type: ${eventType}`)
				// Still acknowledge the webhook
				break
		}

		// 7. Return success response
		console.log('[WEBHOOK] Webhook processed successfully')
		return NextResponse.json({
			success: true,
			message: 'Webhook processed',
			eventType,
		})
	} catch (error) {
		console.error('[WEBHOOK] Error processing webhook:', error)
		return NextResponse.json(
			{
				error: 'Failed to process webhook',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 },
		)
	}
}

/**
 * Handle GET requests (for testing)
 */
export async function GET() {
	return NextResponse.json({
		message: 'Whop webhook endpoint',
		status: 'active',
		note: 'POST webhook events to this endpoint',
	})
}
