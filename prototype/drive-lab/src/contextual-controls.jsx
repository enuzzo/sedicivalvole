import { createContext, useContext } from 'react';
export const ContextualControlsContext = createContext(false);
/** One visibility owner for field controls; hidden controls cannot receive input. */
export function useContextualControls() {
  const hidden = useContext(ContextualControlsContext);
  return { 'data-contextual-controls': true, 'aria-hidden': hidden || undefined, inert: hidden || undefined };
}
