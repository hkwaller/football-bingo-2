/** The event boundary shared by solo and room draft bingo. */
export function createSpaceToSkipHandler(
  onSkip: () => void,
  documentRoot: Pick<Document, 'querySelector'> = document,
) {
  return (event: KeyboardEvent) => {
    if (event.code !== 'Space' && event.key !== ' ') return
    if (event.defaultPrevented || event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    if (documentRoot.querySelector('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]')) return
    const target = event.target as HTMLElement | null
    const interactive = target?.closest('button, a[href], input, textarea, select, summary, [role="button"], [role="checkbox"], [role="switch"], [role="radio"], [role="slider"], [role="tab"], [role="combobox"]')
    // Bingo uses Enter to place; Space must still skip after a pointer click
    // leaves focus on an available square. Other controls keep native Space.
    if (target?.isContentEditable || (interactive && !interactive.matches('.bingo-cell'))) return
    event.preventDefault()
    onSkip()
  }
}
