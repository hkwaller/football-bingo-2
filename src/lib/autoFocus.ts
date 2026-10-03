/**
 * Whether to put the cursor in a field without the player asking. On touch
 * screens focusing pops the keyboard, which covers the career, the list or
 * the lobby the player still needs to read, so there they tap the field.
 */
export function canAutoFocus(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
}
