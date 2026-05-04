import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}

const base = 'inline-flex items-center gap-1 rounded font-medium cursor-pointer border-0 transition-opacity disabled:opacity-50'

const variants = {
  primary:   { background: '#2563eb', color: '#fff' },
  secondary: { background: '#e2e8f0', color: '#1e293b' },
  danger:    { background: '#dc2626', color: '#fff' },
  ghost:     { background: 'transparent', color: '#2563eb' },
}

const sizes = {
  sm: { padding: '4px 10px', fontSize: 12 },
  md: { padding: '7px 16px', fontSize: 14 },
}

export function Button({ variant = 'primary', size = 'md', className, style, ...props }: Props) {
  return (
    <button
      className={clsx(base, className)}
      style={{ ...variants[variant], ...sizes[size], ...style }}
      {...props}
    />
  )
}
