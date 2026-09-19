import { createContext, useContext } from 'react';
export const ContextualControlsContext = createContext(false);
/** One visibility owner for field controls; hidden controls cannot receive input. */
export function useContextualControls() {
  const hidden = useContext(ContextualControlsContext);
  return { 'data-contextual-controls': true, 'aria-hidden': hidden || undefined, inert: hidden || undefined };
}

/** Shared reserved lane: identity and speed own the left; field actions reflow at right. */
export function ContextualRail({ children, className = "", ...props }) {
  return <div className={`contextual-rail ${className}`} {...props}>{children}</div>;
}
