/**
 * Loading Skeleton Components
 * Displays skeleton loaders while data is being fetched
 */

'use client'

import { Card } from 'frosted-ui'

/**
 * Shimmer effect styles
 */
const shimmerStyles = `
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    to right,
    var(--gray-3) 0%,
    var(--gray-4) 20%,
    var(--gray-3) 40%,
    var(--gray-3) 100%
  );
  background-size: 1000px 100%;
}
`

/**
 * Skeleton box component
 */
function SkeletonBox({
	width,
	height,
	className = '',
}: {
	width?: string
	height: string
	className?: string
}) {
	return (
		<>
			<style>{shimmerStyles}</style>
			<div
				className={`shimmer ${className}`}
				style={{
					width: width || '100%',
					height,
					borderRadius: 'var(--radius-2)',
				}}
			/>
		</>
	)
}

/**
 * Metric card skeleton
 */
export function MetricCardSkeleton() {
	return (
		<Card size="3" variant="surface">
			<div className="flex flex-col gap-3">
				<div className="flex justify-between items-center">
					<div className="flex items-center gap-2">
						<SkeletonBox width="32px" height="32px" />
						<SkeletonBox width="120px" height="16px" />
					</div>
					<SkeletonBox width="80px" height="24px" />
				</div>
				<SkeletonBox width="140px" height="36px" />
				<SkeletonBox width="80px" height="14px" />
			</div>
		</Card>
	)
}

/**
 * Revenue chart skeleton
 */
export function RevenueChartSkeleton() {
	return (
		<Card size="3" variant="surface">
			<div className="flex flex-col gap-4">
				{/* Header */}
				<div className="flex justify-between items-center">
					<div className="flex flex-col gap-2">
						<SkeletonBox width="180px" height="24px" />
						<SkeletonBox width="140px" height="14px" />
					</div>
					<SkeletonBox width="100px" height="32px" />
				</div>

				{/* Chart area */}
				<div className="mt-4" style={{ height: '300px', position: 'relative' }}>
					{/* Y-axis labels */}
					<div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between">
						<SkeletonBox width="40px" height="14px" />
						<SkeletonBox width="40px" height="14px" />
						<SkeletonBox width="40px" height="14px" />
						<SkeletonBox width="40px" height="14px" />
						<SkeletonBox width="40px" height="14px" />
					</div>

					{/* Chart bars */}
					<div
						className="absolute left-12 right-0 top-0 bottom-8 flex items-end justify-around gap-2"
						style={{ paddingBottom: '20px' }}
					>
						{[60, 75, 50, 85, 65, 90, 55, 80, 70, 95].map((height, i) => (
							<SkeletonBox
								key={i}
								width="100%"
								height={`${height}%`}
							/>
						))}
					</div>

					{/* X-axis labels */}
					<div
						className="absolute left-12 right-0 bottom-0 flex justify-around"
						style={{ height: '20px' }}
					>
						{[...Array(5)].map((_, i) => (
							<SkeletonBox key={i} width="50px" height="14px" />
						))}
					</div>
				</div>
			</div>
		</Card>
	)
}

/**
 * Products table skeleton
 */
export function ProductsTableSkeleton() {
	return (
		<Card size="3" variant="surface">
			<div className="flex flex-col gap-4">
				{/* Header */}
				<div className="flex justify-between items-center">
					<SkeletonBox width="180px" height="24px" />
					<SkeletonBox width="100px" height="32px" />
				</div>

				{/* Table */}
				<div className="flex flex-col gap-3">
					{/* Table header */}
					<div className="flex gap-3 pb-2" style={{ borderBottom: '1px solid var(--gray-5)' }}>
						<SkeletonBox width="40%" height="14px" />
						<SkeletonBox width="20%" height="14px" />
						<SkeletonBox width="20%" height="14px" />
						<SkeletonBox width="20%" height="14px" />
					</div>

					{/* Table rows */}
					{[...Array(5)].map((_, i) => (
						<div key={i} className="flex gap-3 items-center">
							<SkeletonBox width="40%" height="16px" />
							<SkeletonBox width="20%" height="16px" />
							<SkeletonBox width="20%" height="16px" />
							<SkeletonBox width="20%" height="16px" />
						</div>
					))}
				</div>
			</div>
		</Card>
	)
}

/**
 * Customer segmentation chart skeleton
 */
export function SegmentationChartSkeleton() {
	return (
		<Card size="3" variant="surface">
			<div className="flex flex-col gap-4">
				{/* Header */}
				<div className="flex flex-col gap-2">
					<SkeletonBox width="240px" height="24px" />
					<SkeletonBox width="180px" height="14px" />
				</div>

				{/* Chart container */}
				<div className="flex items-center justify-between gap-8 mt-4">
					{/* Donut chart */}
					<div className="flex items-center justify-center" style={{ width: '200px', height: '200px' }}>
						<SkeletonBox width="200px" height="200px" />
					</div>

					{/* Legend */}
					<div className="flex-1 flex flex-col gap-3">
						{[...Array(4)].map((_, i) => (
							<div key={i} className="flex items-center justify-between gap-4">
								<div className="flex items-center gap-2">
									<SkeletonBox width="12px" height="12px" />
									<SkeletonBox width="80px" height="16px" />
								</div>
								<SkeletonBox width="60px" height="16px" />
							</div>
						))}
					</div>
				</div>
			</div>
		</Card>
	)
}

/**
 * Full dashboard skeleton
 */
export function DashboardSkeleton() {
	return (
		<div className="min-h-screen p-6" style={{ background: 'var(--gray-2)' }}>
			<div className="max-w-[1400px] mx-auto">
				<div className="flex flex-col gap-6">
					{/* Header */}
					<div className="flex justify-between items-start flex-wrap gap-4">
						<div className="flex flex-col gap-2">
							<SkeletonBox width="300px" height="40px" />
							<SkeletonBox width="200px" height="20px" />
						</div>
						<SkeletonBox width="200px" height="40px" />
					</div>

					{/* Primary Metrics */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<MetricCardSkeleton />
						<MetricCardSkeleton />
						<MetricCardSkeleton />
					</div>

					{/* Secondary Metrics */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<MetricCardSkeleton />
						<MetricCardSkeleton />
						<MetricCardSkeleton />
					</div>

					{/* Charts */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<RevenueChartSkeleton />
						<ProductsTableSkeleton />
					</div>

					{/* Customer Segmentation */}
					<div className="grid grid-cols-1 gap-6">
						<SegmentationChartSkeleton />
					</div>

					{/* Action Buttons */}
					<div className="flex justify-center items-center gap-4">
						<SkeletonBox width="150px" height="40px" />
						<SkeletonBox width="150px" height="40px" />
					</div>
				</div>
			</div>
		</div>
	)
}
