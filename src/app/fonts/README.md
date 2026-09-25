# Self-hosted fonts

Vendored from [google/fonts](https://github.com/google/fonts) (SIL OFL, licences alongside) and
subset with fontTools to Latin + Latin Extended (+ Vietnamese, arrows, punctuation) so player names
like Modrić or Çalhanoğlu render in the brand fonts. Loaded via `next/font/local` in `../layout.tsx`.

| File | Source | Notes |
| --- | --- | --- |
| `Archivo-Variable.woff2` | `ofl/archivo/Archivo[wdth,wght].ttf` | instanced to wdth=100, wght 400–800 |
| `BigShoulders-Variable.woff2` | `ofl/bigshoulders/BigShoulders[opsz,wght].ttf` | full opsz + wght axes |
| `IBMPlexMono-{Medium,SemiBold,Bold}.woff2` | `ofl/ibmplexmono/IBMPlexMono-*.ttf` | static |

Unicode ranges kept: `U+0000-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1EFF, U+2000-206F,
U+20A0-20C0, U+2113, U+2122, U+2190-2193, U+2212, U+2215, U+2C60-2C7F, U+A720-A7FF, U+FEFF, U+FFFD`
(`pyftsubset --flavor=woff2 --layout-features='*' --unicodes=...`; Archivo first via
`fonttools varLib.instancer`).
