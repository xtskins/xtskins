'use client'

import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VisibilityToggleProps {
  isVisible: boolean
  onToggle: (visible: boolean) => void
  disabled?: boolean
  className?: string
}

export function VisibilityToggle({
  isVisible,
  onToggle,
  disabled = false,
  className,
}: VisibilityToggleProps) {
  const handleClick = () => {
    if (!disabled) {
      onToggle(!isVisible)
    }
  }

  return (
    <div
      className={cn(
        'flex h-8 w-16 cursor-pointer rounded-full p-1 transition-all duration-300',
        isVisible
          ? 'bg-green-100 border border-green-300 dark:bg-green-900 dark:border-green-700'
          : 'bg-red-100 border border-red-300 dark:bg-red-900 dark:border-red-700',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <div className="flex w-full items-center justify-between">
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300',
            isVisible
              ? 'translate-x-0 transform bg-green-600 dark:bg-green-500'
              : 'translate-x-8 transform bg-red-600 dark:bg-red-500',
          )}
        >
          {isVisible ? (
            <Eye className="h-4 w-4 text-white" strokeWidth={1.5} />
          ) : (
            <EyeOff className="h-4 w-4 text-white" strokeWidth={1.5} />
          )}
        </div>
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300',
            isVisible ? 'bg-transparent' : '-translate-x-8 transform',
          )}
        >
          {isVisible ? (
            <EyeOff
              className="h-4 w-4 text-gray-500 dark:text-gray-400"
              strokeWidth={1.5}
            />
          ) : (
            <Eye
              className="h-4 w-4 text-gray-600 dark:text-gray-300"
              strokeWidth={1.5}
            />
          )}
        </div>
      </div>
    </div>
  )
}
