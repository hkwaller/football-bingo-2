import { NextRequest, NextResponse } from 'next/server'
import { generateQuestions } from '@/lib/trivia/questionGenerators'
import type { TriviaConfig } from '@/lib/trivia/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      sessionId: string
      config: TriviaConfig
      count: number
      offset?: number
    }

    const { sessionId, config, count, offset = 0 } = body

    if (!sessionId || !config || !count) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (count > 50) {
      return NextResponse.json({ error: 'count must be ≤ 50' }, { status: 400 })
    }

    const questions = generateQuestions(config, sessionId, count, offset)
    return NextResponse.json({ questions })
  } catch {
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
  }
}
