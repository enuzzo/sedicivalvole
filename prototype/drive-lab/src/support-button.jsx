function SupportCupMark() {
  return (
    <svg className="support-cup-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 8.5h15l-1.6 14.2c-.2 2-1.9 3.5-3.9 3.5h-4c-2 0-3.7-1.5-3.9-3.5L8 8.5Z" />
      <path d="M22.7 11h2.1a3.7 3.7 0 0 1 0 7.4h-2.9" />
      <path d="M10.3 5.3c3.7-1.4 7.6-1.4 11.4 0" />
    </svg>
  );
}

export function SupportButton({ onClick }) {
  return <button className="coffee-support-button" type="button" onClick={onClick}
    aria-label="Open Buy Me a Coffee support panel" aria-haspopup="dialog" title="Buy Me a Coffee">
    <SupportCupMark /><span>Buy Me a Coffee</span>
  </button>;
}
