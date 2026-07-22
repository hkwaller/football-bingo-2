import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isClerkConfigured } from '@/lib/env'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { FB_TABLES } from '@/lib/supabase/tables'
import {
  accuracyPct,
  formatDuration,
  summarizeResults,
  type SoloResultRow,
} from '@/lib/soloStats'
import {
  summarizeTenableResults,
  type TenableResultRow,
} from '@/lib/tenableStats'
import { PLAY_MODE_LABEL, type PlayMode } from '@/lib/playMode'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RESULT_COLUMNS =
  'id, seed, play_mode, board_size, correct_count, wrong_count, total_cells, duration_ms, won, created_at'

const TENABLE_COLUMNS =
  'id, session_id, categories_played, categories_cleared, answers_found, total_answers, lives_used, score, won, duration_ms, created_at'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function AccountPage() {
  if (!isClerkConfigured()) redirect('/')
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const admin = getSupabaseAdmin()
  let rows: SoloResultRow[] = []
  let supabaseReady = false

  if (admin) {
    supabaseReady = true
    const { data } = await admin
      .from(FB_TABLES.soloResults)
      .select(RESULT_COLUMNS)
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    rows = (data as SoloResultRow[] | null) ?? []
  }

  let tenableRows: TenableResultRow[] = []
  if (admin) {
    const { data } = await admin
      .from(FB_TABLES.tenableResults)
      .select(TENABLE_COLUMNS)
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    tenableRows = (data as TenableResultRow[] | null) ?? []
  }

  const summary = summarizeResults(rows)
  const tenableSummary = summarizeTenableResults(tenableRows)

  const stat = (value: string, label: string, tint = 'text-card-ink') => (
    <div className="panel px-4 py-4">
      <div className={`font-mono text-[34px] font-bold leading-none ${tint}`}>{value}</div>
      <div className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-card-muted-2">
        {label}
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="eyebrow">Your profile</p>
      <h1 className="mt-3 font-display text-[52px] font-black uppercase leading-none text-white">
        Stats
      </h1>

      {!supabaseReady ? (
        <div className="panel mt-6 p-6">
          <p className="text-base font-semibold leading-relaxed text-card-muted">
            You are signed in. Game history will attach to your account once Supabase is configured.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="panel mt-6 p-6 text-center">
          <p className="text-base font-semibold leading-relaxed text-card-muted">
            No boards yet. Complete a line in a solo game and it&apos;ll show up here.
          </p>
          <Link href="/play/setup" className="btn btn-primary mt-4 inline-flex">
            Start a board
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {stat(String(summary.boardsCompleted), 'Boards won', 'text-card-ink')}
            {stat(`${summary.overallAccuracy}%`, 'Accuracy', 'text-pink')}
            {stat(String(summary.totalCorrect), 'Correct picks', 'text-green-go')}
            {stat(`${summary.bestAccuracy}%`, 'Best board', 'text-yellow-deep')}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] font-bold text-on-green-dim">
            <span>
              Total guesses:{' '}
              <span className="font-mono text-white">{summary.totalGuesses}</span>
            </span>
            {summary.fastestMs !== null ? (
              <span>
                Fastest board:{' '}
                <span className="font-mono text-white">{formatDuration(summary.fastestMs)}</span>
              </span>
            ) : null}
          </div>

          <h2 className="mt-10 font-display text-[26px] font-black uppercase leading-none text-white">
            History
          </h2>
          <div className="mt-4 flex flex-col gap-2.5">
            {rows.map((r) => {
              const mode = (r.play_mode === 'free' ? 'free' : 'draft') as PlayMode
              return (
                <div
                  key={r.id}
                  className="panel flex items-center justify-between gap-4 px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="chip -rotate-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-card-ink">
                        {PLAY_MODE_LABEL[mode]}
                      </span>
                      <span className="text-[12.5px] font-bold uppercase tracking-[0.05em] text-card-muted">
                        {r.board_size}×{r.board_size}
                      </span>
                    </div>
                    <div className="mt-1 text-[12px] font-semibold text-card-muted-2">
                      {formatDate(r.created_at)}
                      {r.duration_ms ? ` · ${formatDuration(r.duration_ms)}` : ''}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-5 text-right">
                    <div>
                      <div className="font-mono text-[18px] font-bold leading-none text-green-go">
                        {r.correct_count}
                      </div>
                      <div className="text-[9.5px] font-extrabold uppercase tracking-[0.08em] text-card-muted-2">
                        Correct
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[18px] font-bold leading-none text-pink">
                        {accuracyPct({ correctCount: r.correct_count, wrongCount: r.wrong_count })}%
                      </div>
                      <div className="text-[9.5px] font-extrabold uppercase tracking-[0.08em] text-card-muted-2">
                        Acc
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {supabaseReady && tenableRows.length > 0 && (
        <section className="mt-14">
          <p className="eyebrow">Tenable</p>
          <h2 className="mt-3 font-display text-[40px] font-black uppercase leading-none text-white">
            Name the ten
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {stat(String(tenableSummary.sessionsPlayed), 'Sessions', 'text-card-ink')}
            {stat(String(tenableSummary.categoriesCleared), 'Cleared', 'text-green-go')}
            {stat(String(tenableSummary.totalAnswersFound), 'Answers found', 'text-pink')}
            {stat(tenableSummary.bestScore.toLocaleString(), 'Best score', 'text-yellow-deep')}
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            {tenableRows.map((r) => (
              <div key={r.id} className="panel flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="chip -rotate-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-card-ink">
                      {r.categories_cleared}/{r.categories_played} cleared
                    </span>
                  </div>
                  <div className="mt-1 text-[12px] font-semibold text-card-muted-2">
                    {formatDate(r.created_at)}
                    {r.duration_ms ? ` · ${formatDuration(r.duration_ms)}` : ''}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-5 text-right">
                  <div>
                    <div className="font-mono text-[18px] font-bold leading-none text-green-go">
                      {r.answers_found}/{r.total_answers}
                    </div>
                    <div className="text-[9.5px] font-extrabold uppercase tracking-[0.08em] text-card-muted-2">
                      Found
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[18px] font-bold leading-none text-yellow-deep">
                      {r.score.toLocaleString()}
                    </div>
                    <div className="text-[9.5px] font-extrabold uppercase tracking-[0.08em] text-card-muted-2">
                      Score
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Link
        href="/"
        className="mt-10 inline-block text-sm font-bold uppercase tracking-[0.06em] text-yellow transition-colors hover:text-yellow-deep"
      >
        Back home
      </Link>
    </div>
  )
}
