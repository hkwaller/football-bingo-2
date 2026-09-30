import { tenableQuestions } from './src/data/tenable'
import { enrichedFootballPlayers } from './src/data/players'
import * as f11 from './src/data/famous11s'
const c=(a:any[],k:string)=>a.reduce((m:any,x:any)=>{m[x[k]]=(m[x[k]]||0)+1;return m},{})
console.log('tenable',tenableQuestions.length, c(tenableQuestions,'group'), c(tenableQuestions,'difficulty'), c(tenableQuestions.map((q:any)=>({k:q.kind??'ranked'})),'k'))
console.log('players',enrichedFootballPlayers.length)
console.log('f11 exports',Object.keys(f11))
