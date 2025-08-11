import React from 'react';

interface SearchButtonProps {
  href: string;
  children: React.ReactNode;
  icon?: string; // SVG string
  className?: string;
  style?: React.CSSProperties;
}

export function SearchButton({ 
  href, 
  children, 
  icon, 
  className = "course-btns",
  style = {}
}: SearchButtonProps) {
  const defaultStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '8px 16px',
    backgroundColor: '#0073e6',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    ...style
  };

  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={defaultStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#005bb5';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = style.backgroundColor || '#0073e6';
      }}
    >
      {icon && (
        <span 
          dangerouslySetInnerHTML={{ __html: icon }}
          style={{ marginRight: '6px' }}
        />
      )}
      {children}
    </a>
  );
}

export default SearchButton;