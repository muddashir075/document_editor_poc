import clsx from 'clsx'

const variants = {
  draft:        'background:#e2e8f0;color:#475569',
  under_review: 'background:#fef3c7;color:#92400e',
  approved:     'background:#dcfce7;color:#166534',
  rejected:     'background:#fee2e2;color:#991b1b',
  pending:      'background:#fef3c7;color:#92400e',
  accepted:     'background:#dcfce7;color:#166534',
  in_favor:     'background:#dcfce7;color:#166534',
  against:      'background:#fee2e2;color:#991b1b',
  observed:     'background:#e0f2fe;color:#075985',
  standard:     'background:#ede9fe;color:#5b21b6',
  matrix:       'background:#fce7f3;color:#9d174d',
  regulation:   'background:#e0f2fe;color:#075985',
}

interface Props {
  label: string
  variant?: keyof typeof variants
  className?: string
}

export function Badge({ label, variant, className }: Props) {
  const style = variant ? variants[variant] : undefined
  return (
    <span
      className={clsx('badge', className)}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        ...(style ? Object.fromEntries(style.split(';').map(s => s.split(':'))) : {}),
      }}
    >
      {label.replace(/_/g, ' ')}
    </span>
  )
}
