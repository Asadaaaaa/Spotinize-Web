import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'ghost'
  size = 'md',        // 'sm', 'md', 'lg'
  fullWidth = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  icon = null,
  ...props
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'lg' ? 'btn-lg' : size === 'sm' ? 'btn-sm' : '';
  const fullClass = fullWidth ? 'btn-full' : '';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn ${variantClass} ${sizeClass} ${fullClass} ${className}`.trim()}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}

export default Button;
