/**
 * Test Data Seeding Script
 * Populates Supabase with realistic fake data for testing the analytics dashboard
 */

import { createClient } from '@supabase/supabase-js'
import { subDays, format } from 'date-fns'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env file
function loadEnv() {
	try {
		const envPath = join(process.cwd(), '.env')
		const envFile = readFileSync(envPath, 'utf8')
		envFile.split('\n').forEach((line) => {
			const match = line.match(/^([^=:#]+)=(.*)$/)
			if (match) {
				const key = match[1].trim()
				const value = match[2].trim()
				process.env[key] = value
			}
		})
	} catch (error) {
		console.error('❌ Error loading .env file:', error)
	}
}

loadEnv()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
	console.error('❌ Missing Supabase environment variables')
	console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing')
	console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? 'Found' : 'Missing')
	process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
})

// Company ID from .env
const COMPANY_ID = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || 'biz_5I0ycVO1857oWD'

// Test products
const TEST_PRODUCTS = [
	{
		id: 'prod_test_premium',
		company_id: COMPANY_ID,
		name: 'Premium Monthly',
		created_at: new Date().toISOString(),
		metadata: {
			price: 9.99,
			interval: 'monthly',
		},
	},
	{
		id: 'prod_test_pro',
		company_id: COMPANY_ID,
		name: 'Pro Annual',
		created_at: new Date().toISOString(),
		metadata: {
			price: 99.99,
			interval: 'yearly',
		},
	},
	{
		id: 'prod_test_lifetime',
		company_id: COMPANY_ID,
		name: 'Lifetime Access',
		created_at: new Date().toISOString(),
		metadata: {
			price: 299.0,
			interval: 'one-time',
		},
	},
]

// Helper: Generate random date in last N days
function randomDateInLastNDays(days: number): Date {
	const randomDays = Math.floor(Math.random() * days)
	return subDays(new Date(), randomDays)
}

// Helper: Generate random amount based on product
function getProductPrice(productId: string): number {
	const prices: Record<string, number> = {
		prod_test_premium: 999, // $9.99 in cents
		prod_test_pro: 9999, // $99.99 in cents
		prod_test_lifetime: 29900, // $299.00 in cents
	}
	return prices[productId] || 999
}

// Helper: Generate random payment status (mostly succeeded)
function randomPaymentStatus(): 'paid' | 'refunded' | 'failed' {
	const rand = Math.random()
	if (rand < 0.85) return 'paid' // 85% success
	if (rand < 0.95) return 'refunded' // 10% refunded
	return 'failed' // 5% failed
}

// Helper: Generate random membership status
function randomMembershipStatus(): {
	status: string
	valid: boolean
} {
	const rand = Math.random()
	if (rand < 0.7) return { status: 'active', valid: true } // 70% active
	if (rand < 0.85) return { status: 'trialing', valid: true } // 15% trialing
	if (rand < 0.95) return { status: 'cancelled', valid: false } // 10% cancelled
	return { status: 'expired', valid: false } // 5% expired
}

async function seedTestData() {
	console.log('🌱 Starting test data seeding...\n')

	try {
		// 1. Ensure company exists
		console.log('1️⃣  Creating company record...')
		const { error: companyError } = await supabase
			.from('companies')
			.upsert({ id: COMPANY_ID }, { onConflict: 'id' })

		if (companyError) {
			console.error('❌ Error creating company:', companyError)
			throw companyError
		}
		console.log('✅ Company created\n')

		// 2. Create test products
		console.log('2️⃣  Creating test products...')
		const { error: productsError } = await supabase
			.from('products')
			.upsert(TEST_PRODUCTS, { onConflict: 'id' })

		if (productsError) {
			console.error('❌ Error creating products:', productsError)
			throw productsError
		}
		console.log(`✅ Created ${TEST_PRODUCTS.length} products\n`)

		// 3. Generate test payments (20 payments over last 30 days)
		console.log('3️⃣  Generating test payments...')
		const payments = []
		const numPayments = 20

		for (let i = 0; i < numPayments; i++) {
			const product =
				TEST_PRODUCTS[Math.floor(Math.random() * TEST_PRODUCTS.length)]
			const paymentDate = randomDateInLastNDays(30)
			const status = randomPaymentStatus()

			payments.push({
				id: `pay_test_${Date.now()}_${i}`,
				company_id: COMPANY_ID,
				product_id: product.id,
				membership_id: `mem_test_${i}`,
				user_id: `user_test_${i % 10}`, // 10 different users
				status,
				final_amount: getProductPrice(product.id),
				currency: 'usd',
				created_at: paymentDate.toISOString(),
				paid_at: status === 'paid' ? paymentDate.toISOString() : null,
				refunded_at:
					status === 'refunded'
						? subDays(paymentDate, -2).toISOString()
						: null,
			})
		}

		const { error: paymentsError } = await supabase
			.from('payments')
			.upsert(payments, { onConflict: 'company_id,id' })

		if (paymentsError) {
			console.error('❌ Error creating payments:', paymentsError)
			throw paymentsError
		}

		// Calculate total revenue
		const totalRevenue = payments
			.filter((p) => p.status === 'paid')
			.reduce((sum, p) => sum + p.final_amount, 0)

		console.log(`✅ Created ${numPayments} payments`)
		console.log(`   💰 Total Revenue: $${(totalRevenue / 100).toFixed(2)}\n`)

		// 4. Generate test memberships (15 members)
		console.log('4️⃣  Generating test memberships...')
		const memberships = []
		const numMembers = 15

		for (let i = 0; i < numMembers; i++) {
			const product =
				TEST_PRODUCTS[Math.floor(Math.random() * TEST_PRODUCTS.length)]
			const createdDate = randomDateInLastNDays(90)
			const { status, valid } = randomMembershipStatus()

			memberships.push({
				id: `mem_test_${i}`,
				company_id: COMPANY_ID,
				product_id: product.id,
				user_id: `user_test_${i}`,
				status,
				valid,
				created_at: createdDate.toISOString(),
				expires_at:
					valid && status === 'active'
						? subDays(new Date(), -30).toISOString()
						: subDays(new Date(), -1).toISOString(),
				renewal_period_start: createdDate.toISOString(),
				renewal_period_end:
					status === 'active'
						? subDays(new Date(), -30).toISOString()
						: null,
				cancel_at_period_end: status === 'cancelled',
			})
		}

		const { error: membershipsError } = await supabase
			.from('memberships')
			.upsert(memberships, { onConflict: 'company_id,id' })

		if (membershipsError) {
			console.error('❌ Error creating memberships:', membershipsError)
			throw membershipsError
		}

		const activeMembers = memberships.filter((m) => m.valid).length
		console.log(`✅ Created ${numMembers} memberships`)
		console.log(`   👥 Active Members: ${activeMembers}\n`)

		// 5. Update last sync timestamp
		console.log('5️⃣  Updating last sync timestamp...')
		const { error: syncError } = await supabase
			.from('companies')
			.update({ last_sync: new Date().toISOString() })
			.eq('id', COMPANY_ID)

		if (syncError) {
			console.error('❌ Error updating sync:', syncError)
			throw syncError
		}
		console.log('✅ Sync timestamp updated\n')

		// Summary
		console.log('🎉 Test data seeding completed successfully!\n')
		console.log('📊 Summary:')
		console.log(`   • Products: ${TEST_PRODUCTS.length}`)
		console.log(`   • Payments: ${numPayments}`)
		console.log(`   • Memberships: ${numMembers}`)
		console.log(`   • Total Revenue: $${(totalRevenue / 100).toFixed(2)}`)
		console.log(`   • Active Members: ${activeMembers}`)
		console.log(
			`   • Churn Rate: ~${(((numMembers - activeMembers) / numMembers) * 100).toFixed(1)}%`,
		)
		console.log('\n✨ Your dashboard is ready to view!')
		console.log(
			'   Visit: http://localhost:3000/experiences/exp_OwYC7DUWv3ol0Y\n',
		)
	} catch (error) {
		console.error('\n❌ Seeding failed:', error)
		process.exit(1)
	}
}

// Run the seeding
console.log('╔═══════════════════════════════════════════════════════╗')
console.log('║     Whop Analytics Dashboard - Test Data Seeder      ║')
console.log('╚═══════════════════════════════════════════════════════╝\n')

seedTestData()
	.then(() => {
		console.log('✅ Done!')
		process.exit(0)
	})
	.catch((error) => {
		console.error('❌ Fatal error:', error)
		process.exit(1)
	})
