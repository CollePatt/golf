import { useEffect, useRef } from 'react';

// A pop-up sheet over the current view; Escape or the X closes it.
export default function Overlay({ title, onClose, children }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="panel overlay-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={event => event.stopPropagation()}
      >
        <div className="overlay-head">
          <button ref={closeRef} type="button" className="btn small" onClick={onClose} aria-label={`Close ${title}`}>
            X
          </button>
        </div>
        <div className="overlay-body">{children}</div>
      </div>
    </div>
  );
}
