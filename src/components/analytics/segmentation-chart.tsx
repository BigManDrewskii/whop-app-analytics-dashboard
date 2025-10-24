/**
 * Customer Segmentation Chart
 * Donut chart showing customer distribution
 */

'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, Heading, Text, Badge } from 'frosted-ui'

interface CustomerSegment {
	segment: 'new' | 'active' | 'at_risk' | 'churned'
	count: number
	percentage: number
	color: string
}

interface SegmentationChartProps {
	segments: CustomerSegment[]
}

const SEGMENT_LABELS = {
	new: 'New Customers',
	active: 'Active',
	at_risk: 'At Risk',
	churned: 'Churned',
}

export function SegmentationChart({ segments }: SegmentationChartProps) {
	const chartData = segments.map((segment) => ({
		name: SEGMENT_LABELS[segment.segment],
		value: segment.count,
		percentage: segment.percentage,
		color: segment.color,
	}))

	const totalCustomers = segments.reduce((sum, s) => sum + s.count, 0)

	return (
		<Card size="3" variant="surface">
			<div className="flex flex-col gap-4">
				<div className="flex justify-between items-center">
					<Heading size="5" weight="medium">
						Customer Segmentation
					</Heading>
					<Badge color="purple" variant="soft" radius="full">
						{totalCustomers} total
					</Badge>
				</div>

				{totalCustomers > 0 ? (
					<>
						<ResponsiveContainer width="100%" height={280}>
							<PieChart>
								<Pie
									data={chartData}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={100}
									paddingAngle={2}
									dataKey="value"
								>
									{chartData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length) {
											const data = payload[0].payload
											return (
												<Card size="1" variant="classic" style={{ padding: '8px 12px' }}>
													<div className="flex flex-col gap-1">
														<Text size="1" color="gray">
															{data.name}
														</Text>
														<Text size="2" weight="bold">
															{data.value} customers ({data.percentage.toFixed(1)}%)
														</Text>
													</div>
												</Card>
											)
										}
										return null
									}}
								/>
							</PieChart>
						</ResponsiveContainer>

						{/* Legend */}
						<div className="grid grid-cols-2 gap-2">
							{segments.map((segment) => (
								<div key={segment.segment} className="flex items-center gap-2">
									<div
										style={{
											width: '12px',
											height: '12px',
											borderRadius: '3px',
											background: segment.color,
										}}
									/>
									<div className="flex flex-col">
										<Text size="1" weight="medium">
											{SEGMENT_LABELS[segment.segment]}
										</Text>
										<Text size="1" color="gray">
											{segment.count} ({segment.percentage.toFixed(0)}%)
										</Text>
									</div>
								</div>
							))}
						</div>
					</>
				) : (
					<div className="h-[280px] flex items-center justify-center">
						<div className="flex flex-col items-center gap-2">
							<Text size="2" color="gray">
								No customer data available
							</Text>
							<Text size="1" color="gray" style={{ opacity: 0.6 }}>
								Segments will appear as you gain customers
							</Text>
						</div>
					</div>
				)}
			</div>
		</Card>
	)
}
