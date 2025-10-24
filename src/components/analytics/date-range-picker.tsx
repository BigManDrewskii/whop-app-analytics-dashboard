/**
 * Date Range Picker Component
 * Provides preset and custom date range selection for analytics
 */

'use client'

import { Button, Badge } from 'frosted-ui'
import { CalendarIcon, ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'
import { subDays, format } from 'date-fns'

export type DateRangePreset = '7d' | '30d' | '90d' | 'all' | 'custom'

export interface DateRange {
	preset: DateRangePreset
	startDate: Date
	endDate: Date
	label: string
}

interface DateRangePickerProps {
	value: DateRange
	onChange: (range: DateRange) => void
}

const presets: Array<{ value: DateRangePreset; label: string; days?: number }> = [
	{ value: '7d', label: 'Last 7 days', days: 7 },
	{ value: '30d', label: 'Last 30 days', days: 30 },
	{ value: '90d', label: 'Last 90 days', days: 90 },
	{ value: 'all', label: 'All time' },
]

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
	const [isOpen, setIsOpen] = useState(false)

	const handlePresetClick = (preset: DateRangePreset, label: string, days?: number) => {
		const endDate = new Date()
		const startDate = days ? subDays(endDate, days) : new Date(2020, 0, 1) // All time starts from 2020

		onChange({
			preset,
			startDate,
			endDate,
			label,
		})
		setIsOpen(false)
	}

	return (
		<div className="relative">
			<Button
				variant="soft"
				size="2"
				onClick={() => setIsOpen(!isOpen)}
				style={{ minWidth: '160px' }}
			>
				<CalendarIcon className="w-4 h-4 mr-2" />
				{value.label}
				<ChevronDownIcon className="w-4 h-4 ml-2" />
			</Button>

			{isOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-10"
						onClick={() => setIsOpen(false)}
					/>

					{/* Dropdown Menu */}
					<div
						className="absolute top-full left-0 mt-2 z-20 min-w-[200px] rounded-lg border shadow-lg"
						style={{
							background: 'var(--gray-1)',
							borderColor: 'var(--gray-6)',
						}}
					>
						<div className="p-2 flex flex-col gap-1">
							{presets.map((preset) => (
								<button
									key={preset.value}
									onClick={() => handlePresetClick(preset.value, preset.label, preset.days)}
									className="text-left px-3 py-2 rounded-md transition-colors hover:bg-[var(--gray-3)] flex items-center justify-between"
									style={{
										background:
											value.preset === preset.value ? 'var(--accent-3)' : 'transparent',
									}}
								>
									<span className="text-sm">{preset.label}</span>
									{value.preset === preset.value && (
										<Badge color="blue" variant="soft" size="1">
											Active
										</Badge>
									)}
								</button>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	)
}

/**
 * Helper function to get default date range (last 30 days)
 */
export function getDefaultDateRange(): DateRange {
	return {
		preset: '30d',
		startDate: subDays(new Date(), 30),
		endDate: new Date(),
		label: 'Last 30 days',
	}
}
