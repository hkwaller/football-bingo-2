export type DraftPolicy = 'open' | 'placeable'

export const DRAFT_POLICY_LABEL: Record<DraftPolicy, string> = {
  open: 'Open draft',
  placeable: 'Placeable draft',
}

export const DRAFT_POLICY_HELP: Record<DraftPolicy, string> = {
  open: 'Random players from the full pool — some draws may not fit any open square.',
  placeable:
    'Only players who match at least one empty square. If several squares fit, pick the right one.',
}

export function parseDraftPolicy(raw: string | null): DraftPolicy {
  return raw === 'placeable' ? 'placeable' : 'open'
}
