/**
 * Whop Authentication Module
 * Handles user authentication and authorization for the analytics dashboard
 */

import { verifyUserToken } from '@whop/api'
import { headers } from 'next/headers'

export interface WhopUser {
	userId: string
	companyId: string
}

/**
 * Authenticate user from Whop headers
 * Call this in Server Components or API routes
 *
 * @returns {Promise<WhopUser>} User ID and Company ID
 * @throws {Error} If authentication fails
 */
export async function authenticateUser(): Promise<WhopUser> {
	try {
		const headersList = await headers()
		const { userId } = await verifyUserToken(headersList)

		if (!userId) {
			throw new Error('Unauthorized: No user ID found')
		}

		// For analytics dashboard, we use the configured company ID
		// In production, you might want to check user's access to multiple companies
		const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID

		if (!companyId) {
			throw new Error('Company ID not configured')
		}

		return {
			userId,
			companyId,
		}
	} catch (error) {
		console.error('Authentication error:', error)
		throw new Error('Failed to authenticate user')
	}
}

/**
 * Check if user has access to a specific company
 * For MVP, this checks if user is accessing their configured company
 * In production, expand this to check multiple companies or use Whop's access API
 *
 * @param userId - Whop user ID
 * @param companyId - Whop company ID
 * @returns {Promise<boolean>} True if user has access
 */
export async function checkCompanyAccess(
	userId: string,
	companyId: string,
): Promise<boolean> {
	try {
		// For MVP, we assume user has access to the configured company
		// In production, you would:
		// 1. Check if user is a member of the company
		// 2. Check their access level (admin, member, etc.)
		// 3. Use whop.access.checkIfUserHasAccessToExperience() if needed

		return companyId === process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
	} catch (error) {
		console.error('Access check error:', error)
		return false
	}
}

/**
 * Check subscription tier for a company
 * For MVP, defaults to 'free' tier
 * In production, implement actual tier checking via Stripe or Whop subscriptions
 *
 * @param companyId - Whop company ID
 * @returns {Promise<'free' | 'pro' | 'agency'>} Subscription tier
 */
export async function checkSubscriptionTier(
	companyId: string,
): Promise<'free' | 'pro' | 'agency'> {
	try {
		// For MVP, default to free
		// In production, query your payments table or Stripe API
		// to determine the company's subscription tier

		return 'free'
	} catch (error) {
		console.error('Subscription tier check error:', error)
		return 'free'
	}
}
