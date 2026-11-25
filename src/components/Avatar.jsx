import React, { useState } from 'react';
import { User } from 'lucide-react';
import { ProfileFrameWrapper } from './ProfileFrameAvatar.jsx';

export function Avatar({
  src,
  alt = 'User',
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
  seed = 'user',
  frame = null,
  style = {}
}) {
  const [errorCount, setErrorCount] = useState(0);

  const sizeClass = size === 'lg' ? 'avatar-lg' : size === 'sm' ? 'avatar-sm' : '';
  const pxSize = typeof style?.width === 'number'
    ? style.width
    : typeof style?.width === 'string' && style.width.endsWith('px')
      ? parseInt(style.width, 10)
      : (size === 'lg' ? 72 : size === 'sm' ? 32 : 42);

  const fallbackUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed || 'player')}`;

  let avatarEl;
  if (errorCount >= 2 || (!src && errorCount >= 1)) {
    avatarEl = (
      <div
        className={`avatar ${sizeClass} ${className}`.trim()}
        style={{
          width: `${pxSize}px`,
          height: `${pxSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-surface-hover)',
          color: 'var(--color-primary)',
          flexShrink: 0,
          ...style
        }}
      >
        <User size={size === 'lg' ? 36 : size === 'sm' ? 16 : 22} />
      </div>
    );
  } else {
    const currentSrc = errorCount === 0 && src ? src : fallbackUrl;
    avatarEl = (
      <img
        src={currentSrc}
        alt={alt}
        className={`avatar ${sizeClass} ${className}`.trim()}
        onError={() => setErrorCount(prev => prev + 1)}
        loading="lazy"
        style={style}
      />
    );
  }

  if (frame) {
    return (
      <ProfileFrameWrapper frame={frame} sizePx={pxSize}>
        {avatarEl}
      </ProfileFrameWrapper>
    );
  }

  return avatarEl;
}

export default Avatar;
