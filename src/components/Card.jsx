import React from 'react';

export function Card({
  children,
  interactive = false,
  selected = false,
  className = '',
  onClick,
  style = {},
  ...props
}) {
  const interactiveClass = interactive ? 'card-interactive' : '';
  const selectedClass = selected ? 'card-selected' : '';

  return (
    <div
      onClick={onClick}
      className={`card ${interactiveClass} ${selectedClass} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
