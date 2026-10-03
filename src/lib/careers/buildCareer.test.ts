import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildCareer, rowCount, type RawTransfer } from './buildCareer'

/** [iso date, from name, from id, to name, to id, fee] - oldest first, like reading a career. */
type Row = [string, string, string, string, string, string]
function raw(rows: Row[]): RawTransfer[] {
  return rows
    .map(([date, fromName, fromId, toName, toId, fee]) => ({
      from: { clubName: fromName, href: `/x/transfers/verein/${fromId}` },
      to: { clubName: toName, href: `/x/transfers/verein/${toId}` },
      date: date.split('-').reverse().join('/'),
      dateUnformatted: date,
      upcoming: false,
      season: '',
      fee,
    }))
    .reverse() // Transfermarkt lists newest first
}

const TODAY = '2026-10-03'

test('nests back-to-back loans under the parent club (Rashford)', () => {
  const career = buildCareer(
    raw([
      ['2005-07-01', 'Fletcher Moss', '1', 'Man Utd Youth', '50672', 'free transfer'],
      ['2014-07-01', 'Man Utd Youth', '50672', 'Man Utd U18', '5242', '-'],
      ['2016-01-01', 'Man Utd U18', '5242', 'Man Utd', '985', '-'],
      ['2025-02-02', 'Man Utd', '985', 'Aston Villa', '405', 'loan transfer'],
      ['2025-06-30', 'Aston Villa', '405', 'Man Utd', '985', 'End of loan'],
      ['2025-07-23', 'Man Utd', '985', 'Barcelona', '131', 'loan transfer'],
      ['2026-06-30', 'Barcelona', '131', 'Man Utd', '985', 'End of loan'],
    ]),
    '1997-10-31',
    TODAY,
  )
  assert.equal(career.length, 1)
  assert.equal(career[0]!.clubId, '985')
  assert.equal(career[0]!.from, 2016)
  assert.equal(career[0]!.to, null)
  assert.deepEqual(
    career[0]!.loans.map((l) => [l.clubId, l.from, l.to]),
    [
      ['405', 2025, 2025],
      ['131', 2025, 2026],
    ],
  )
  assert.equal(rowCount(career), 3)
})

test('a loan with a fee is still a loan, and ends at a permanent move (Lukaku)', () => {
  const career = buildCareer(
    raw([
      ['2009-07-01', 'Anderlecht U17', '49390', 'RSC Anderlecht', '58', '-'],
      ['2011-08-08', 'RSC Anderlecht', '58', 'Chelsea', '631', '€15.00m'],
      ['2013-08-02', 'Chelsea', '631', 'Everton', '29', 'Loan fee:<br /><i>€3.50m</i>'],
      ['2014-05-31', 'Everton', '29', 'Chelsea', '631', 'End of loan'],
      ['2014-07-30', 'Chelsea', '631', 'Everton', '29', '€35.36m'],
    ]),
    '1993-05-13',
    TODAY,
  )
  assert.deepEqual(
    career.map((s) => [s.clubId, s.from, s.to, s.loans.length]),
    [
      ['58', 2009, 2011, 0],
      ['631', 2011, 2014, 1],
      ['29', 2014, null, 0],
    ],
  )
})

test('drops boyhood clubs, reserve sides and non-clubs; merges a return after a break', () => {
  const career = buildCareer(
    raw([
      ['1991-07-01', 'Boyhood FC', '1', 'FBK Balkan', '2', '-'],
      ['1999-07-01', 'FBK Balkan', '2', 'Real Madrid Castilla', '6767', '-'],
      ['2001-07-01', 'Real Madrid Castilla', '6767', 'Boca Juniors', '189', '€1.00m'],
      ['2003-07-01', 'Boca Juniors', '189', 'Career break', '2113', '-'],
      ['2004-07-01', 'Career break', '2113', 'Boca Juniors', '189', '-'],
      ['2006-07-01', 'Boca Juniors', '189', 'Napoli', '6195', '€5.00m'],
      ['2009-07-01', 'Napoli', '6195', 'Retired', '123', '-'],
    ]),
    '1981-01-01',
    TODAY,
  )
  assert.deepEqual(
    career.map((s) => [s.clubId, s.from, s.to]),
    [
      ['189', 2001, 2006],
      ['6195', 2006, 2009],
    ],
  )
})

test('ignores transfers after today', () => {
  const career = buildCareer(
    raw([
      ['2020-07-01', 'Alpha', '10', 'Bravo', '11', '€1.00m'],
      ['2027-07-01', 'Bravo', '11', 'Charlie', '12', '€1.00m'],
    ]),
    '2000-01-01',
    TODAY,
  )
  assert.deepEqual(
    career.map((s) => [s.clubId, s.to]),
    [['11', null]],
  )
})

test('a renewed loan out of the academy is one row (Simpson at Antwerp)', () => {
  const career = buildCareer(
    raw([
      ['2005-07-01', 'Man Utd U18', '5242', 'Man Utd Res.', '10', '-'],
      ['2006-01-01', 'Man Utd Res.', '10', 'Royal Antwerp', '1096', 'loan transfer'],
      ['2006-06-30', 'Royal Antwerp', '1096', 'Man Utd Res.', '10', 'End of loan'],
      ['2006-07-01', 'Man Utd Res.', '10', 'Royal Antwerp', '1096', 'loan transfer'],
      ['2007-06-30', 'Royal Antwerp', '1096', 'Man Utd Res.', '10', 'End of loan'],
      ['2007-07-01', 'Man Utd Res.', '10', 'Man Utd', '985', '-'],
    ]),
    '1987-01-04',
    TODAY,
  )
  assert.deepEqual(
    career.map((s) => [s.clubId, s.from, s.to, !!s.loan]),
    [
      ['1096', 2006, 2007, true],
      ['985', 2007, null, false],
    ],
  )
})
