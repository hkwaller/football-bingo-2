#!/usr/bin/env python3
"""Inventory Transfermarkt history navigation and index linked matches (stdlib only)."""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.error
import urllib.request
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[2]
SITE = 'https://www.transfermarkt.com'
COMPETITIONS = [
    ('FIWC', 'World Cup', 'pokalwettbewerb'), ('EURO', 'Euros', 'pokalwettbewerb'),
    ('CL', 'Champions League', 'pokalwettbewerb'), ('EL', 'Europa League / UEFA Cup', 'pokalwettbewerb'),
    ('FAC', 'FA Cup', 'pokalwettbewerb'), ('CDR', 'Copa del Rey', 'pokalwettbewerb'),
    ('DFB', 'DFB-Pokal', 'pokalwettbewerb'), ('CIt', 'Coppa Italia', 'pokalwettbewerb'),
    ('FRC', 'Coupe de France', 'pokalwettbewerb'),
    ('GB1', 'Premier League', 'wettbewerb'), ('ES1', 'La Liga', 'wettbewerb'),
    ('L1', 'Bundesliga', 'wettbewerb'), ('IT1', 'Serie A', 'wettbewerb'), ('FR1', 'Ligue 1', 'wettbewerb'),
]
PRIORITY = re.compile(r'alleEndspiele|elfmeterschiessen|aufholjagden|/comebacks/|hoechsteSiege|rekordspiele|toreprospiel|juengstetorschuetzen|aeltestetorschuetzen|/erfolge/', re.I)


class TableParser(HTMLParser):
    """Keep table row context; nested lineup tables do not create duplicate matches."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows, self.links, self.selects = [], [], []
        self.stack, self.select, self.option, self.heading = [], None, None, None
        self.headings = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'tr': self.stack.append({'text': [], 'links': []})
        if tag == 'a':
            link = {'url': a.get('href', ''), 'title': a.get('title', ''), 'text': ''}
            self.links.append(link)
            for row in self.stack: row['links'].append(link)
            self.active_link = link
        if tag == 'select':
            self.select = {'name': a.get('name', ''), 'options': []}
            self.selects.append(self.select)
        if tag == 'option' and self.select is not None:
            self.option = {'value': a.get('value', ''), 'label': ''}
            self.select['options'].append(self.option)
        if tag in ('h1', 'h2'): self.heading = ''

    def handle_data(self, data):
        for row in self.stack: row['text'].append(data)
        if getattr(self, 'active_link', None) is not None: self.active_link['text'] += data
        if self.option is not None: self.option['label'] += data
        if self.heading is not None: self.heading += data

    def handle_endtag(self, tag):
        if tag == 'a': self.active_link = None
        if tag == 'option': self.option = None
        if tag == 'select': self.select = self.option = None
        if tag == 'tr' and self.stack:
            row = self.stack.pop()
            row['text'] = ' '.join(' '.join(row['text']).split())
            self.rows.append(row)
        if tag in ('h1', 'h2') and self.heading is not None:
            self.headings.append(' '.join(self.heading.split())); self.heading = None


def parse_page(html):
    p = TableParser(); p.feed(html)
    for field in p.selects:
        for option in field['options']: option['label'] = ' '.join(option['label'].split())
    if not p.headings or 'verify that you' in html.lower() or 'captcha' in ' '.join(p.headings).lower():
        raise ValueError('Blocked/challenge or unrecognized page; not an empty table')
    matches = {}
    for row in p.rows:
        ids = set(re.findall(r'/spielbericht/(\d+)', ' '.join(x['url'] for x in row['links'])))
        if len(ids) != 1: continue
        mid = next(iter(ids))
        teams = {}
        for link in row['links']:
            found = re.search(r'/verein/(\d+)', link['url'])
            if found and (link['title'] or link['text'].strip()):
                teams[found[1]] = link['title'] or link['text'].strip()
        if len(teams) != 2: continue
        matches[mid] = {'id': mid, 'teams': [{'id': k, 'name': v} for k, v in teams.items()], 'context': row['text']}
    return {'headings': p.headings, 'filters': p.selects, 'matches': list(matches.values()),
            'pagination': sorted(set(SITE + x['url'] for x in p.links if re.search(r'/page/\d+', x['url'])))}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--online', action='store_true', help='Explicitly allow network reads; default is cached-only')
    ap.add_argument('--refresh', action='store_true')
    args = ap.parse_args()
    cache = ROOT / 'scripts/output/historical/sources'; cache.mkdir(parents=True, exist_ok=True)
    output = ROOT / 'docs/historical'; output.mkdir(parents=True, exist_ok=True)

    def fetch(url, json_response=False):
        path = cache / (hashlib.sha256(url.encode()).hexdigest() + '.json')
        if path.exists() and not args.refresh: return json.loads(path.read_text())
        if not args.online: raise ValueError('Not cached (run with --online)')
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' if json_response else 'text/html'})
                with urllib.request.urlopen(req, timeout=25) as response:
                    body = response.read().decode()
                result = {'url': url, 'fetchedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
                          'providerVersion': 'Transfermarkt website (unversioned)', 'payload': json.loads(body) if json_response else body}
                path.write_text(json.dumps(result, ensure_ascii=False))
                time.sleep(.4)
                return result
            except urllib.error.HTTPError as e:
                if e.code not in (429, 500, 502, 503, 504) or attempt == 2: raise
            except (TimeoutError, urllib.error.URLError):
                if attempt == 2: raise
            time.sleep(2 ** attempt)

    inventory, matches = [], {}
    for cid, name, controller in COMPETITIONS:
        nav_url = f'{SITE}/navigation/getSubNavigation?controller={controller}&season=2026&id={cid}'
        comp = {'id': cid, 'name': name, 'navigationUrl': nav_url, 'tables': [], 'status': 'available'}
        try:
            nav = fetch(nav_url, True)
            entries = nav['payload'].get('results', [])
            if not entries: raise ValueError('No competition navigation returned')
            # Existing non-final fixtures: Swedish bronze match and the October 2024 Clásico.
            supplemental = []
            for entry in entries:
                for group in entry.get('open', []):
                    for item in group.get('group', []):
                        if '/gesamtspielplan/' in item.get('link', '') and cid in ('FIWC', 'ES1'):
                            supplemental.append({'text': 'Existing-bank fixture season', 'link': re.sub(r'/saison_id/\d+', '/saison_id/' + ('1993' if cid == 'FIWC' else '2024'), item['link'])})
            entries.append({'text': 'Audit support', 'open': [{'group': supplemental}]})
            for entry in entries:
                for group in entry.get('open', []):
                    for item in group.get('group', []):
                        href = item.get('link', '')
                        if not PRIORITY.search(href) and entry['text'] != 'Audit support': continue
                        url = SITE + href
                        if any(t['url'] == url for t in comp['tables']): continue
                        table = {'label': item['text'], 'menu': entry['text'], 'url': url}
                        try:
                            source = fetch(url)
                            parsed = parse_page(source['payload'])
                            filters = [{**f, 'optionCount': len(f['options']), 'options': f['options'] if 'saison' in f['name'] else f['options'][:10],
                                        'optionsTruncated': 'saison' not in f['name'] and len(f['options']) > 10} for f in parsed['filters']]
                            table.update({k: v for k, v in parsed.items() if k not in ('matches', 'filters')}, filters=filters)
                            table.update(status='available', fetchedAt=source['fetchedAt'], matchCount=len(parsed['matches']),
                                         coverage='Observed rows on first page only; filters/options recorded; pagination is not exhausted')
                            observed_years = set()
                            for match in parsed['matches']:
                                observed_years.update(int(y) for y in re.findall(r'\b(18\d{2}|19\d{2}|20\d{2})\b', match['context']))
                                for start, _ in re.findall(r'\b(\d{2})/(\d{2})(?![\d/])', match['context']):
                                    observed_years.add((1900 if int(start) > 26 else 2000) + int(start))
                            table['observedYearRange'] = [min(observed_years), max(observed_years)] if observed_years else None
                            table['yearRangeNote'] = 'Years/season starts observed in match rows only; not complete competition coverage'
                            for match in parsed['matches']:
                                existing = matches.setdefault(match['id'], {**match, 'competitionId': cid, 'sources': []})
                                existing['sources'].append({'url': url, 'label': item['text'], 'context': match['context']})
                        except Exception as e: table.update(status='unavailable', reason=str(e), coverage='Unknown')
                        comp['tables'].append(table)
        except Exception as e: comp.update(status='unavailable', reason=str(e))
        inventory.append(comp)
        (output / 'source-inventory.json').write_text(json.dumps(inventory, indent=2, ensure_ascii=False) + '\n')
        (output / 'discovered-matches.json').write_text(json.dumps(list(matches.values()), indent=2, ensure_ascii=False) + '\n')
        print(f'{cid}: {len(comp["tables"])} tables; {len(matches)} unique matches total', flush=True)


if __name__ == '__main__': main()
