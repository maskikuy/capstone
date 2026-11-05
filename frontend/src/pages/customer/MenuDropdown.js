
import React, { useEffect, useRef, useState } from 'react';

const MenuDropdown = ({ onHistoryClick, onAboutClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const menuItemStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 12px',
    border: 0,
    borderRadius: '9px',
    backgroundColor: 'transparent',
    color: '#cbd5e1',
    fontSize: '0.88rem',
    fontWeight: '600',
    textAlign: 'left',
    cursor: 'pointer'
  };

  const iconStyle = {
    width: '20px',
    height: '20px',
    minWidth: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((previous) => !previous)}
        style={{
          width: '44px',
          height: '44px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#222433',
          border: '1px solid #2c2f40',
          borderRadius: '13px',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ width: '19px', height: '2px', borderRadius: '3px', backgroundColor: '#cbd5e1' }} />
          <span style={{ width: '19px', height: '2px', borderRadius: '3px', backgroundColor: '#cbd5e1' }} />
          <span style={{ width: '19px', height: '2px', borderRadius: '3px', backgroundColor: '#cbd5e1' }} />
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Menu Billion Cafe"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '184px',
            padding: '6px',
            backgroundColor: '#161720',
            border: '1px solid #2c2f40',
            borderRadius: '13px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.38)',
            zIndex: 1080
          }}
        >
          <button
            type="button"
            role="menuitem"
            style={menuItemStyle}
            onClick={() => {
              setIsOpen(false);
              onHistoryClick();
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = '#222433';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={iconStyle}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d8a744"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
            Riwayat
          </button>

          <button
            type="button"
            role="menuitem"
            style={menuItemStyle}
            onClick={() => {
              setIsOpen(false);
              onAboutClick();
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = '#222433';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={iconStyle}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d8a744"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5" />
                <path d="M12 8h.01" />
              </svg>
            </span>
            Tentang Kami
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuDropdown;
