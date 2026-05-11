'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ErrorFallbackProps {
  message?: string
  onRetry?: () => void
}

export function ErrorFallback({
  message = 'Failed to load data',
  onRetry,
}: ErrorFallbackProps) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Card>
  )
}
