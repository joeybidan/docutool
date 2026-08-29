export function Button({
  children,
  className = '',
  variant = 'secondary',
  size = 'medium',
  ...props
}) {
  return (
    <button
      className={`button button--${variant} button--${size} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
