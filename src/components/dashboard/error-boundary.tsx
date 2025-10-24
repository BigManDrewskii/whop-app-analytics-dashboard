/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly error messages
 */

'use client'

import { Component, type ReactNode } from 'react'
import { Card, Heading, Text, Button, Callout } from 'frosted-ui'
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react'

interface ErrorBoundaryProps {
	children: ReactNode
	fallback?: ReactNode
}

interface ErrorBoundaryState {
	hasError: boolean
	error: Error | null
	errorInfo: string | null
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		}
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return {
			hasError: true,
			error,
		}
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('[ErrorBoundary] Caught error:', error)
		console.error('[ErrorBoundary] Error info:', errorInfo)

		this.setState({
			error,
			errorInfo: errorInfo.componentStack || null,
		})
	}

	handleReset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		})
		// Reload the page to reset state
		window.location.reload()
	}

	render() {
		if (this.state.hasError) {
			// Custom fallback UI
			if (this.props.fallback) {
				return this.props.fallback
			}

			// Default error UI
			return (
				<div
					className="min-h-screen flex items-center justify-center p-6"
					style={{ background: 'var(--gray-2)' }}
				>
					<Card size="4" style={{ maxWidth: '600px', width: '100%' }}>
						<div className="flex flex-col gap-6">
							{/* Error Icon */}
							<div className="flex items-center gap-3">
								<div
									className="flex items-center justify-center"
									style={{
										width: '48px',
										height: '48px',
										borderRadius: 'var(--radius-3)',
										background: 'var(--red-3)',
									}}
								>
									<AlertCircleIcon
										className="w-6 h-6"
										style={{ color: 'var(--red-11)' }}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<Heading size="6" weight="bold">
										Something went wrong
									</Heading>
									<Text size="2" color="gray">
										The dashboard encountered an unexpected error
									</Text>
								</div>
							</div>

							{/* Error Details */}
							<Callout.Root color="red" variant="surface">
								<Callout.Text>
									<strong>Error:</strong>{' '}
									{this.state.error?.message || 'Unknown error occurred'}
								</Callout.Text>
							</Callout.Root>

							{/* Error Stack (Development Only) */}
							{process.env.NODE_ENV === 'development' &&
								this.state.errorInfo && (
									<details className="mt-2">
										<summary
											className="cursor-pointer text-sm"
											style={{ color: 'var(--gray-11)' }}
										>
											Show error details (development only)
										</summary>
										<pre
											className="mt-2 p-3 rounded text-xs overflow-auto"
											style={{
												background: 'var(--gray-3)',
												border: '1px solid var(--gray-6)',
												maxHeight: '200px',
											}}
										>
											{this.state.errorInfo}
										</pre>
									</details>
								)}

							{/* Actions */}
							<div className="flex gap-3">
								<Button
									size="3"
									variant="solid"
									onClick={this.handleReset}
									style={{ flex: 1 }}
								>
									<RefreshCwIcon className="w-4 h-4 mr-2" />
									Reload Dashboard
								</Button>
								<Button
									size="3"
									variant="soft"
									onClick={() => window.history.back()}
									style={{ flex: 1 }}
								>
									Go Back
								</Button>
							</div>

							{/* Help Text */}
							<Text size="1" color="gray" style={{ textAlign: 'center' }}>
								If this problem persists, please contact support or check the
								browser console for more details.
							</Text>
						</div>
					</Card>
				</div>
			)
		}

		return this.props.children
	}
}

/**
 * Functional error boundary for use with Suspense
 */
export function ErrorFallback({
	error,
	resetErrorBoundary,
}: {
	error: Error
	resetErrorBoundary: () => void
}) {
	return (
		<div
			className="min-h-screen flex items-center justify-center p-6"
			style={{ background: 'var(--gray-2)' }}
		>
			<Card size="4" style={{ maxWidth: '600px', width: '100%' }}>
				<div className="flex flex-col gap-6">
					<div className="flex items-center gap-3">
						<div
							className="flex items-center justify-center"
							style={{
								width: '48px',
								height: '48px',
								borderRadius: 'var(--radius-3)',
								background: 'var(--red-3)',
							}}
						>
							<AlertCircleIcon
								className="w-6 h-6"
								style={{ color: 'var(--red-11)' }}
							/>
						</div>
						<div className="flex flex-col gap-1">
							<Heading size="6" weight="bold">
								Something went wrong
							</Heading>
							<Text size="2" color="gray">
								{error.message}
							</Text>
						</div>
					</div>

					<div className="flex gap-3">
						<Button
							size="3"
							variant="solid"
							onClick={resetErrorBoundary}
							style={{ flex: 1 }}
						>
							<RefreshCwIcon className="w-4 h-4 mr-2" />
							Try Again
						</Button>
					</div>
				</div>
			</Card>
		</div>
	)
}
