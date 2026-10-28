import { bingoActions } from './bingoActions'
import { triviaActions } from './triviaActions'
import { tenableActions } from './tenableActions'
import { elevenActions } from './elevenActions'
import { connectionsActions } from './connectionsActions'
import { careersActions } from './careersActions'
import { createInitialGameStorage } from './bingoModel'
import { createInitialTriviaStorage } from './triviaModel'
import { createInitialTenableStorage } from './tenableModel'
import { createInitialElevenStorage } from './elevenModel'
import { createInitialConnectionsStorage } from './connectionsModel'
import { createInitialCareersStorage } from './careersModel'
import type { GameKind } from './types'
import type { ActionTable } from './reducer'

export const initialStorage = {
  bingo: createInitialGameStorage,
  trivia: createInitialTriviaStorage,
  tenable: createInitialTenableStorage,
  eleven: createInitialElevenStorage,
  connections: createInitialConnectionsStorage,
  careers: createInitialCareersStorage,
}
const tables = {
  bingo: bingoActions,
  trivia: triviaActions,
  tenable: tenableActions,
  eleven: elevenActions,
  connections: connectionsActions,
  careers: careersActions,
}
// The room's kind is fixed by its URL; action functions only receive their own storage type.
export function actionsFor(kind: GameKind): ActionTable<object> {
  return tables[kind] as unknown as ActionTable<object>
}
