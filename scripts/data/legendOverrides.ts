/**
 * Fallback profile data for legends whose Transfermarkt /profile endpoint
 * returns HTTP 500 (a parser bug for these very old players - confirmed on both
 * the local and hosted API). Their achievements/transfers/stats/jersey/market
 * endpoints all work, so we can still build a full entry - we just supply
 * name/nationality/position here (sourced from the /search endpoint).
 *
 * imageUrl is intentionally empty: the API exposes no portrait for them without
 * the profile, so the UI shows its placeholder.
 */
export interface LegendOverride {
  name: string
  nationality: string
  citizenship: string[]
  position: string // full Transfermarkt position label
}

export const LEGEND_OVERRIDES: Record<string, LegendOverride> = {
  '50935': {
    name: 'Javier Hernández',
    nationality: 'Mexico',
    citizenship: ['Mexico'],
    position: 'Centre-Forward',
  },
  '135778': {
    name: 'Alfredo Di Stéfano',
    nationality: 'Argentina',
    citizenship: ['Argentina', 'Spain'],
    position: 'Second Striker',
  },
  '8024': {
    name: 'Diego Maradona',
    nationality: 'Argentina',
    citizenship: ['Argentina'],
    position: 'Attacking Midfield',
  },
  '7611': {
    name: 'Javier Saviola',
    nationality: 'Argentina',
    citizenship: ['Argentina', 'Spain'],
    position: 'Second Striker',
  },
  '229662': {
    name: 'Carlos Alberto Torres',
    nationality: 'Brazil',
    citizenship: ['Brazil'],
    position: 'Right-Back',
  },
  '17121': {
    name: 'Pelé',
    nationality: 'Brazil',
    citizenship: ['Brazil'],
    position: 'Centre-Forward',
  },
  '117633': {
    name: 'Sócrates',
    nationality: 'Brazil',
    citizenship: ['Brazil'],
    position: 'Attacking Midfield',
  },
  '200627': {
    name: 'Gordon Banks',
    nationality: 'England',
    citizenship: ['England'],
    position: 'Goalkeeper',
  },
  '174874': {
    name: 'Bobby Charlton',
    nationality: 'England',
    citizenship: ['England'],
    position: 'Attacking Midfield',
  },
  '151245': {
    name: 'Just Fontaine',
    nationality: 'France',
    citizenship: ['France'],
    position: 'Centre-Forward',
  },
  '72347': {
    name: 'Franz Beckenbauer',
    nationality: 'Germany',
    citizenship: ['Germany'],
    position: 'Sweeper',
  },
  '35604': {
    name: 'Gerd Müller',
    nationality: 'Germany',
    citizenship: ['Germany'],
    position: 'Centre-Forward',
  },
  '103092': {
    name: 'Ferenc Puskás',
    nationality: 'Hungary',
    citizenship: ['Hungary', 'Spain'],
    position: 'Second Striker',
  },
  '116757': {
    name: 'Paolo Rossi',
    nationality: 'Italy',
    citizenship: ['Italy'],
    position: 'Centre-Forward',
  },
  '8021': {
    name: 'Johan Cruyff',
    nationality: 'Netherlands',
    citizenship: ['Netherlands'],
    position: 'Attacking Midfield',
  },
  '135643': {
    name: 'Johan Neeskens',
    nationality: 'Netherlands',
    citizenship: ['Netherlands'],
    position: 'Central Midfield',
  },
  '174986': {
    name: 'George Best',
    nationality: 'Northern Ireland',
    citizenship: ['Northern Ireland'],
    position: 'Right Winger',
  },
  '89230': {
    name: 'Eusébio',
    nationality: 'Portugal',
    citizenship: ['Portugal'],
    position: 'Centre-Forward',
  },
}
