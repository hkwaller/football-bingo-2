# Club crest coverage

Extend the existing football-logos.cc downloads with a generated local crest manifest. Collect club names from curated clubs, Careers (including loans), player histories, and Famous 11s. Match names conservatively, keep explicit overrides for ambiguous names, and store downloaded PNGs locally. Resolve canonical names and aliases through the shared lookup. Only return paths for verified downloaded assets.

The fetch command can refresh coverage; a separate offline verification command reports unresolved clubs and missing files. Validate alias resolution and missing-file behavior, run the coverage check and TypeScript checks. Preserve existing unrelated workspace edits.

Implementation: inventory names; discover the source catalogue; download unambiguous matches; generate manifest and source records; update shared lookup; verify coverage and document remaining exceptions.
