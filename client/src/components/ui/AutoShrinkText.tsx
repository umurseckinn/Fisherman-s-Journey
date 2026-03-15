
import React, { useRef, useState, useEffect } from 'react';

interface AutoShrinkTextProps {
  children: string;
  className?: string;
  maxFontSize?: number;
  minFontSize?: number;
}

/**
 * Automatically shrinks font size if the text exceeds its container's width.
 */
export const AutoShrinkText: React.FC<AutoShrinkTextProps> = ({ 
  children, 
  className = "", 
  maxFontSize = 24, 
  minFontSize = 10 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    let currentSize = maxFontSize;
    text.style.fontSize = `${currentSize}px`;

    // Wait for DOM to update then measure
    const adjustFontSize = () => {
      while (text.offsetWidth > container.offsetWidth && currentSize > minFontSize) {
        currentSize -= 1;
        text.style.fontSize = `${currentSize}px`;
      }
      setFontSize(currentSize);
    };

    adjustFontSize();
    
    // Optional: Re-adjust on window resize
    const observer = new ResizeObserver(() => adjustFontSize());
    observer.observe(container);
    
    return () => observer.disconnect();
  }, [children, maxFontSize, minFontSize]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full overflow-hidden whitespace-nowrap ${className}`}
      style={{ display: 'flex', alignItems: 'center' }}
    >
      <span 
        ref={textRef} 
        style={{ fontSize: `${fontSize}px`, display: 'inline-block' }}
      >
        {children}
      </span>
    </div>
  );
};
