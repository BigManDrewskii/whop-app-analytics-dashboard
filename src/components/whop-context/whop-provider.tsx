'use client'

import {
  DehydratedState,
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { WhopContext } from './whop-context'
import { whopExperienceQuery, whopUserQuery } from './whop-queries'

interface WhopProviderProps {
  children: ReactNode
  experienceId: string
  state: DehydratedState
}

export function WhopProvider({ children, experienceId, state }: WhopProviderProps) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: false, // CRITICAL: Prevent infinite retry loop
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={client}>
      <HydrationBoundary state={state}>
        <WhopProviderInner experienceId={experienceId}>{children}</WhopProviderInner>
      </HydrationBoundary>
    </QueryClientProvider>
  )
}

interface WhopProviderInnerProps {
  children: ReactNode
  experienceId: string
}

function WhopProviderInner({ children, experienceId }: WhopProviderInnerProps) {
  const { data: experience, isLoading: experienceLoading, error: experienceError } = useQuery({
    ...whopExperienceQuery(experienceId),
    retry: false,
  })

  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    ...whopUserQuery(experienceId),
    retry: false,
  })

  // Show loading state
  if (experienceLoading || userLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading app...</p>
      </div>
    )
  }

  // Show error state
  if (experienceError || userError || !experience || !userData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Failed to load app</h2>
        <p>{experienceError?.message || userError?.message || 'Unknown error'}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    )
  }

  return (
    <WhopContext.Provider value={{ experience, user: userData.user, access: userData.access }}>
      {children}
    </WhopContext.Provider>
  )
}
