/**
 * Products Table Component
 * Sortable table with Frosted UI styling + Tailwind layouts
 */

'use client'

import { useState } from 'react'
import { Card, Heading, Text, Badge } from 'frosted-ui'
import { TrophyIcon, ArrowUpDownIcon } from 'lucide-react'

interface ProductMetric {
	productId: string
	productName: string
	revenue: number
	count: number
	growthRate?: number
	refundRate?: number
}

interface ProductsTableProps {
	products: ProductMetric[]
}

type SortField = 'name' | 'revenue' | 'count'
type SortDirection = 'asc' | 'desc'

export function ProductsTable({ products }: ProductsTableProps) {
	const [sortField, setSortField] = useState<SortField>('revenue')
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount)
	}

	const formatNumber = (num: number) => {
		return new Intl.NumberFormat('en-US').format(num)
	}

	const getRankColor = (index: number): 'gold' | 'gray' | 'bronze' => {
		if (index === 0) return 'gold'
		if (index === 1) return 'gray'
		if (index === 2) return 'bronze'
		return 'gray'
	}

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			// Toggle direction
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortDirection('desc') // Default to descending for new field
		}
	}

	// Sort products
	const sortedProducts = [...products].sort((a, b) => {
		let comparison = 0

		switch (sortField) {
			case 'name':
				comparison = a.productName.localeCompare(b.productName)
				break
			case 'revenue':
				comparison = a.revenue - b.revenue
				break
			case 'count':
				comparison = a.count - b.count
				break
		}

		return sortDirection === 'asc' ? comparison : -comparison
	})

	const hasData = products.length > 0

	return (
		<Card size="3" variant="surface">
			<div className="flex flex-col gap-4">
				{/* Header */}
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-2">
						<TrophyIcon className="w-5 h-5" style={{ color: 'var(--accent-11)' }} />
						<Heading size="5" weight="medium">
							Top Products by Revenue
						</Heading>
					</div>
					{hasData && (
						<Badge color="purple" variant="soft">
							{sortedProducts.length} products
						</Badge>
					)}
				</div>

				{/* Sort Controls */}
				{hasData && (
					<div className="flex gap-2 flex-wrap">
						<button
							onClick={() => handleSort('revenue')}
							className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
							style={{
								background:
									sortField === 'revenue' ? 'var(--accent-3)' : 'var(--gray-3)',
								color: sortField === 'revenue' ? 'var(--accent-11)' : 'var(--gray-11)',
								border: '1px solid',
								borderColor:
									sortField === 'revenue' ? 'var(--accent-6)' : 'var(--gray-6)',
							}}
						>
							<span className="flex items-center gap-1">
								Revenue
								<ArrowUpDownIcon className="w-3 h-3" />
							</span>
						</button>
						<button
							onClick={() => handleSort('count')}
							className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
							style={{
								background: sortField === 'count' ? 'var(--accent-3)' : 'var(--gray-3)',
								color: sortField === 'count' ? 'var(--accent-11)' : 'var(--gray-11)',
								border: '1px solid',
								borderColor: sortField === 'count' ? 'var(--accent-6)' : 'var(--gray-6)',
							}}
						>
							<span className="flex items-center gap-1">
								Orders
								<ArrowUpDownIcon className="w-3 h-3" />
							</span>
						</button>
						<button
							onClick={() => handleSort('name')}
							className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
							style={{
								background: sortField === 'name' ? 'var(--accent-3)' : 'var(--gray-3)',
								color: sortField === 'name' ? 'var(--accent-11)' : 'var(--gray-11)',
								border: '1px solid',
								borderColor: sortField === 'name' ? 'var(--accent-6)' : 'var(--gray-6)',
							}}
						>
							<span className="flex items-center gap-1">
								Name
								<ArrowUpDownIcon className="w-3 h-3" />
							</span>
						</button>
						<Badge
							color={sortDirection === 'desc' ? 'blue' : 'gray'}
							variant="soft"
							size="1"
						>
							{sortDirection === 'desc' ? 'High to Low' : 'Low to High'}
						</Badge>
					</div>
				)}

				{/* Products List */}
				{hasData ? (
					<div className="flex flex-col gap-2">
						{sortedProducts.map((product, index) => (
							<div
								key={product.productId}
								className="product-row"
								style={{
									padding: '12px',
									borderRadius: 'var(--radius-3)',
									background: 'var(--gray-3)',
									border: '1px solid var(--gray-4)',
									transition: 'all 0.2s ease',
								}}
							>
								<div className="flex justify-between items-center">
									<div className="flex items-center gap-3 flex-1">
										{/* Rank Badge */}
										<Badge
											color={getRankColor(index)}
											variant="solid"
											size="2"
											style={{
												width: '24px',
												height: '24px',
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'center',
											}}
										>
											{index + 1}
										</Badge>

										{/* Product Name */}
										<div className="flex flex-col gap-1 flex-1 min-w-0">
											<Text
												size="2"
												weight="medium"
												style={{
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												}}
											>
												{product.productName}
											</Text>
											<Text size="1" color="gray">
												{product.productId.slice(0, 16)}...
											</Text>
										</div>
									</div>

									<div className="flex items-center gap-4">
										{/* Order Count */}
										<div className="flex flex-col items-end gap-1">
											<Text size="1" color="gray">
												Orders
											</Text>
											<Badge color="blue" variant="soft">
												{formatNumber(product.count)}
											</Badge>
										</div>

										{/* Revenue */}
										<div className="flex flex-col items-end gap-1">
											<Text size="1" color="gray">
												Revenue
											</Text>
											<Text size="2" weight="bold">
												{formatCurrency(product.revenue)}
											</Text>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="h-[320px] flex items-center justify-center">
						<div className="flex flex-col items-center gap-2">
							<Text size="2" color="gray">
								No product data available
							</Text>
							<Text size="1" color="gray" style={{ opacity: 0.6 }}>
								Data will appear once you have sales
							</Text>
						</div>
					</div>
				)}
			</div>

			<style jsx>{`
				.product-row:hover {
					background: var(--gray-4) !important;
					transform: translateY(-1px);
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
				}
			`}</style>
		</Card>
	)
}
