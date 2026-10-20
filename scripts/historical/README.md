# Historical match research

Offline tooling for Famous 11s auditing and future Famous Moments content. These commands do not publish game content or change curated XIs, managers, formations, or pitch coordinates.

## Commands

```sh
# Collect competition navigation and first-page History tables (Python 3, stdlib only).
npm run historical:discover -- --online

# Validate the 12-match sample, then audit the bank and generate review material.
npm run historical:report -- --online

# Replay both steps without any network access once their responses are cached.
npm run historical:discover
npm run historical:report

npm run historical:test
```

`HISTORICAL_MATCH_API_URL` selects the match provider. The default is the public `https://transfermarkt-api.fly.dev` research service. A self-hosted compatible service is preferable for continued collection. The client checks `/openapi.json` for `/games/{id}` and rejects the old local player API; it does not upgrade or modify that service. Response shapes must match the checked schema. `--refresh` explicitly replaces cached responses and requires `--online` when a network read is needed.

Requests are sequential with timeouts and at most three attempts. Permanent HTTP errors fail without repeated retries. Failed sources are recorded as unavailable, never as empty answer sets. Discovery caches the original HTML/navigation responses; the match client caches API JSON with URL, fetch time and provider version under ignored `scripts/output/historical/`. Match cache keys include the provider URL. Reports and curated research inputs remain versioned.

## Outputs

`docs/historical/REPORT.md` summarizes the investigation. Its sibling JSON files contain:

- `source-inventory.json`: actual menu links, first-page headings, available filters, season options, pagination links, observed match counts and failure reasons. Large non-season filter option lists are summarized; full lists remain in raw cache.
- `discovered-matches.json`: deduplicated match IDs, participant IDs, source links and source row context. This is a discovery index, not validated match facts. Some historical pages include broader competition eras than their current labels imply.
- `sample-report.json`: the fixed 12-match cross-era sample and gaps in event coverage. Collection stops before expansion if the sample cannot be fetched.
- `lineup-audit.json`: fixture checks, ID/name comparisons, manager and formation differences, with separately sourced identity reviews.
- `famous11s-candidates.json`: 20 new matches, both XIs, managers, formations and player-pool coverage. Reused players need no new portraits; missing players need enrichment.
- `famous-moments-candidates.json`: 30 draft questions, accepted IDs/names/aliases, sources and explanations. Every question is marked for editorial review.
- `coverage-report.json`, `fetch-failures.json`, `unresolved-references.json`: coverage, limitations and unresolved work.

The report command also generates `src/data/famous11s/matchReferences.json`; the runtime exposes those optional match/team references as metadata only. A resolved fixture reference does not mean its XI or formation is approved.

## Editorial rules

`data/shortlist.json` selects memorable matches from the discovery inventory. `data/reviews.json` contains sourced supplements (currently the complete 2008 final shootout), including a separate match score and shootout score. `data/identity-reviews.json` records human-reviewed name/ID discrepancies. None of these overwrite raw provider evidence or silently correct existing player enrichment.

Scorer questions require a complete, sequential scoring record that reconciles with the match score. Missing goal identities, own-goal ambiguity or shootout score contamination suppress the candidate. Scoring-substitute questions require a recorded entry before the goal and complete identification of all bench scorers. Saved and missed shootout kicks count as failed conversions, only from a complete reviewed kick list that reconciles with the shootout score. Answer sets are deduplicated by player ID and accept any one member.

Season XIs are excluded. Positional labels from different sources need editorial interpretation; source formation labels do not drive automatic pitch changes. Tables are not exhaustively paginated: recorded coverage describes observed rows, not proof of a complete historical archive. Review content and data reuse terms before publishing any generated bank.
