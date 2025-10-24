/**
 * Revenue Chart Component
 * Area chart with Frosted UI styling + Tailwind layouts
 */

'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, Heading, Text, Badge } from 'frosted-ui'
import { format } from 'date-fns'

interface TimeSeriesPoint {
	date: string
	value: number
}

interface RevenueChartProps {
	data: TimeSeriesPoint[]
}

// Custom tooltip with Frosted UI styling
function CustomTooltip(props: any) {
	const { active, payload } = props
	if (active && payload && payload.length) {
		const data = payload[0]
		const payloadData = data?.payload as any
		return (
			<Card size="1" variant="classic" style={{ padding: '8px 12px' }}>
				<div className="flex flex-col gap-1">
					<Text size="1" color="gray">
						{payloadData?.date && format(new Date(payloadData.date), 'MMM dd, yyyy')}
					</Text>
					<Text size="2" weight="bold">
						${(data.value || 0).toFixed(2)}
					</Text>
				</div>
			</Card>
		)
	}
	return null
}

export function RevenueChart({ data }: RevenueChartProps) {
	const chartData = data.map((point) => ({
		date: point.date,
		revenue: point.value,
	}))

	const hasData = chartData.length > 0

	return (
		<Card size="3" variant="surface">
			<div className="flex flex-col gap-4">
				<div className="flex justify-between items-center">
					<Heading size="5" weight="medium">
						Revenue Trend (30 Days)
					</Heading>
					{hasData && (
						<Badge color="blue" variant="soft" radius="full">
							{chartData.length} data points
						</Badge>
					)}
				</div>

				{hasData ? (
					<ResponsiveContainer width="100%" height={320}>
						<AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
							<defs>
								<linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="var(--accent-9)" stopOpacity={0.3} />
									<stop offset="95%" stopColor="var(--accent-9)" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="var(--gray-6)" vertical={false} />
							<XAxis
								dataKey="date"
								stroke="var(--gray-9)"
								fontSize={11}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value) => {
									try {
										return format(new Date(value), 'MMM dd')
									} catch {
										return value
									}
								}}
							/>
							<YAxis
								stroke="var(--gray-9)"
								fontSize={11}
								tickLine={false}
								axisLine={false}
								tickFormatter={(value) => `$${value}`}
							/>
							<Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--accent-9)', strokeWidth: 1 }} />
							<Area
								type="monotone"
								dataKey="revenue"
								stroke="var(--accent-9)"
								strokeWidth={2.5}
								fill="url(#revenueGradient)"
								dot={false}
								activeDot={{
									r: 5,
									fill: 'var(--accent-9)',
									strokeWidth: 2,
									stroke: 'var(--accent-1)',
								}}
							/>
						</AreaChart>
					</ResponsiveContainer>
				) : (
					<div className="h-[320px] flex items-center justify-center">
						<div className="flex flex-col items-center gap-2">
							<Text size="2" color="gray">
								No revenue data available
							</Text>
							<Text size="1" color="gray" style={{ opacity: 0.6 }}>
								Data will appear once you have payments
							</Text>
						</div>
					</div>
				)}
			</div>
		</Card>
	)
}
