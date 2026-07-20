/**
 * Curated manager tenures, keyed by Transfermarkt club IDs.
 *
 * The Transfermarkt API exposes no coaches/managers endpoint, so this table is
 * hand-maintained. IMPORTANT: list a manager's FULL senior-club career, not
 * only the clubs in our bingo category set. A player's transfer history
 * contains every club they played for (tracked or not), and the join matches on
 * those real club IDs - so e.g. Bielsa's spell at Leeds (not one of our
 * categories) still correctly links to our players who were at Leeds under him.
 *
 * Dates are "YYYY-MM" (approximate is fine - the join uses interval overlap).
 * Use "present" for an ongoing stint. Club IDs match Transfermarkt / the
 * transfers feed (verified against the enrichment cache).
 *
 * A player gets the tag "Played under <name>" if any of their club tenures
 * overlaps one of that manager's stints at the same club.
 */
export interface ManagerStint {
  clubId: string
  from: string // "YYYY-MM"
  to: string // "YYYY-MM" | "present"
}

export interface Manager {
  name: string
  stints: ManagerStint[]
}

export const managers: Manager[] = [
  {
    name: 'Pep Guardiola',
    stints: [
      { clubId: '131', from: '2008-06', to: '2012-06' }, // Barcelona
      { clubId: '27', from: '2013-07', to: '2016-06' }, // Bayern
      { clubId: '281', from: '2016-07', to: 'present' }, // Man City
    ],
  },
  {
    name: 'José Mourinho',
    stints: [
      { clubId: '294', from: '2000-09', to: '2000-12' }, // Benfica
      { clubId: '2639', from: '2001-07', to: '2002-01' }, // União de Leiria
      { clubId: '720', from: '2002-01', to: '2004-06' }, // Porto
      { clubId: '631', from: '2004-06', to: '2007-09' }, // Chelsea
      { clubId: '46', from: '2008-06', to: '2010-06' }, // Inter
      { clubId: '418', from: '2010-06', to: '2013-06' }, // Real Madrid
      { clubId: '631', from: '2013-06', to: '2015-12' }, // Chelsea (2nd)
      { clubId: '985', from: '2016-05', to: '2018-12' }, // Man Utd
      { clubId: '148', from: '2019-11', to: '2021-04' }, // Tottenham
      { clubId: '12', from: '2021-07', to: '2024-01' }, // Roma
      { clubId: '36', from: '2024-06', to: 'present' }, // Fenerbahçe
    ],
  },
  {
    name: 'Sir Alex Ferguson',
    stints: [
      { clubId: '370', from: '1978-06', to: '1986-11' }, // Aberdeen
      { clubId: '985', from: '1986-11', to: '2013-06' }, // Man Utd
    ],
  },
  {
    name: 'Carlo Ancelotti',
    stints: [
      { clubId: '130', from: '1996-07', to: '1998-06' }, // Parma
      { clubId: '506', from: '1999-02', to: '2001-06' }, // Juventus
      { clubId: '5', from: '2001-11', to: '2009-05' }, // AC Milan
      { clubId: '631', from: '2009-06', to: '2011-05' }, // Chelsea
      { clubId: '583', from: '2011-12', to: '2013-06' }, // PSG
      { clubId: '418', from: '2013-06', to: '2015-06' }, // Real Madrid
      { clubId: '27', from: '2016-07', to: '2017-09' }, // Bayern
      { clubId: '6195', from: '2018-05', to: '2019-12' }, // Napoli
      { clubId: '29', from: '2019-12', to: '2021-06' }, // Everton
      { clubId: '418', from: '2021-06', to: '2025-05' }, // Real Madrid (2nd)
    ],
  },
  {
    name: 'Jürgen Klopp',
    stints: [
      { clubId: '39', from: '2001-02', to: '2008-06' }, // Mainz 05
      { clubId: '16', from: '2008-07', to: '2015-06' }, // Dortmund
      { clubId: '31', from: '2015-10', to: '2024-06' }, // Liverpool
    ],
  },
  {
    name: 'Arsène Wenger',
    stints: [
      { clubId: '1159', from: '1984-07', to: '1987-06' }, // Nancy
      { clubId: '162', from: '1987-07', to: '1994-09' }, // Monaco
      { clubId: '1066', from: '1995-01', to: '1996-09' }, // Nagoya Grampus
      { clubId: '11', from: '1996-10', to: '2018-06' }, // Arsenal
    ],
  },
  {
    name: 'Diego Simeone',
    stints: [
      { clubId: '288', from: '2006-02', to: '2007-12' }, // Estudiantes
      { clubId: '209', from: '2008-01', to: '2008-06' }, // River Plate
      { clubId: '1775', from: '2009-01', to: '2009-06' }, // San Lorenzo
      { clubId: '1444', from: '2011-01', to: '2011-06' }, // Racing Club
      { clubId: '13', from: '2011-12', to: 'present' }, // Atlético
    ],
  },
  {
    name: 'Antonio Conte',
    stints: [
      { clubId: '800', from: '2009-09', to: '2010-01' }, // Atalanta
      { clubId: '506', from: '2011-07', to: '2014-07' }, // Juventus
      { clubId: '631', from: '2016-07', to: '2018-07' }, // Chelsea
      { clubId: '46', from: '2019-06', to: '2021-05' }, // Inter
      { clubId: '148', from: '2021-11', to: '2023-03' }, // Tottenham
      { clubId: '6195', from: '2024-06', to: 'present' }, // Napoli
    ],
  },
  {
    name: 'Zinedine Zidane',
    stints: [
      { clubId: '418', from: '2016-01', to: '2018-05' }, // Real Madrid
      { clubId: '418', from: '2019-03', to: '2021-05' }, // Real Madrid (2nd)
    ],
  },
  {
    name: 'Massimiliano Allegri',
    stints: [
      { clubId: '1390', from: '2008-06', to: '2010-06' }, // Cagliari
      { clubId: '5', from: '2010-06', to: '2014-01' }, // AC Milan
      { clubId: '506', from: '2014-07', to: '2019-06' }, // Juventus
      { clubId: '506', from: '2021-06', to: '2024-05' }, // Juventus (2nd)
    ],
  },
  {
    name: 'Rafael Benítez',
    stints: [
      { clubId: '648', from: '2001-03', to: '2001-06' }, // Tenerife
      { clubId: '1049', from: '2001-07', to: '2004-06' }, // Valencia
      { clubId: '31', from: '2004-06', to: '2010-06' }, // Liverpool
      { clubId: '46', from: '2010-06', to: '2010-12' }, // Inter
      { clubId: '631', from: '2012-11', to: '2013-06' }, // Chelsea
      { clubId: '6195', from: '2013-06', to: '2015-06' }, // Napoli
      { clubId: '418', from: '2015-06', to: '2016-01' }, // Real Madrid
      { clubId: '762', from: '2016-03', to: '2019-06' }, // Newcastle
      { clubId: '29', from: '2021-06', to: '2022-01' }, // Everton
      { clubId: '940', from: '2023-07', to: '2024-03' }, // Celta
    ],
  },
  {
    name: 'Louis van Gaal',
    stints: [
      { clubId: '610', from: '1991-09', to: '1997-06' }, // Ajax
      { clubId: '131', from: '1997-07', to: '2000-06' }, // Barcelona
      { clubId: '131', from: '2002-07', to: '2003-01' }, // Barcelona (2nd)
      { clubId: '1090', from: '2005-07', to: '2009-06' }, // AZ Alkmaar
      { clubId: '27', from: '2009-07', to: '2011-04' }, // Bayern
      { clubId: '985', from: '2014-07', to: '2016-05' }, // Man Utd
    ],
  },
  {
    name: 'Frank Rijkaard',
    stints: [
      { clubId: '131', from: '2003-06', to: '2008-06' }, // Barcelona
      { clubId: '141', from: '2009-06', to: '2010-10' }, // Galatasaray
    ],
  },
  {
    name: 'Luis Enrique',
    stints: [
      { clubId: '12', from: '2011-07', to: '2012-06' }, // Roma
      { clubId: '940', from: '2013-07', to: '2014-06' }, // Celta
      { clubId: '131', from: '2014-07', to: '2017-06' }, // Barcelona
      { clubId: '583', from: '2023-07', to: 'present' }, // PSG
    ],
  },
  {
    name: 'Mauricio Pochettino',
    stints: [
      { clubId: '714', from: '2009-01', to: '2012-11' }, // Espanyol
      { clubId: '180', from: '2013-01', to: '2014-05' }, // Southampton
      { clubId: '148', from: '2014-05', to: '2019-11' }, // Tottenham
      { clubId: '583', from: '2021-01', to: '2022-06' }, // PSG
      { clubId: '631', from: '2023-07', to: '2024-05' }, // Chelsea
    ],
  },
  {
    name: 'Thomas Tuchel',
    stints: [
      { clubId: '39', from: '2009-08', to: '2014-05' }, // Mainz 05
      { clubId: '16', from: '2015-07', to: '2017-06' }, // Dortmund
      { clubId: '583', from: '2018-07', to: '2020-12' }, // PSG
      { clubId: '631', from: '2021-01', to: '2022-09' }, // Chelsea
      { clubId: '27', from: '2023-03', to: '2024-06' }, // Bayern
    ],
  },
  {
    name: 'Unai Emery',
    stints: [
      { clubId: '1049', from: '2008-06', to: '2012-06' }, // Valencia
      { clubId: '232', from: '2012-06', to: '2012-11' }, // Spartak Moscow
      { clubId: '368', from: '2013-01', to: '2016-06' }, // Sevilla
      { clubId: '583', from: '2016-06', to: '2018-06' }, // PSG
      { clubId: '11', from: '2018-05', to: '2019-11' }, // Arsenal
      { clubId: '1050', from: '2020-07', to: '2022-10' }, // Villarreal
      { clubId: '405', from: '2022-10', to: 'present' }, // Aston Villa
    ],
  },
  {
    name: 'Roberto Mancini',
    stints: [
      { clubId: '430', from: '2001-07', to: '2002-06' }, // Fiorentina
      { clubId: '398', from: '2002-07', to: '2004-06' }, // Lazio
      { clubId: '46', from: '2004-07', to: '2008-06' }, // Inter
      { clubId: '281', from: '2009-12', to: '2013-05' }, // Man City
      { clubId: '141', from: '2013-09', to: '2014-06' }, // Galatasaray
      { clubId: '964', from: '2017-06', to: '2018-05' }, // Zenit
    ],
  },
  {
    name: 'Fabio Capello',
    stints: [
      { clubId: '5', from: '1991-07', to: '1996-06' }, // AC Milan
      { clubId: '418', from: '1996-07', to: '1997-06' }, // Real Madrid
      { clubId: '12', from: '1999-07', to: '2004-03' }, // Roma
      { clubId: '506', from: '2004-07', to: '2006-06' }, // Juventus
      { clubId: '418', from: '2006-07', to: '2007-06' }, // Real Madrid (2nd)
    ],
  },
  {
    name: 'Marcello Lippi',
    stints: [
      { clubId: '800', from: '1992-07', to: '1993-06' }, // Atalanta
      { clubId: '6195', from: '1993-07', to: '1994-06' }, // Napoli
      { clubId: '506', from: '1994-07', to: '1999-06' }, // Juventus
      { clubId: '46', from: '1999-06', to: '2000-10' }, // Inter
      { clubId: '506', from: '2001-06', to: '2004-06' }, // Juventus (2nd)
    ],
  },
  {
    name: 'Vicente del Bosque',
    stints: [
      { clubId: '418', from: '1999-11', to: '2003-06' }, // Real Madrid
      { clubId: '114', from: '2004-08', to: '2005-01' }, // Beşiktaş
    ],
  },
  {
    name: 'Ronald Koeman',
    stints: [
      { clubId: '499', from: '2000-07', to: '2001-05' }, // Vitesse
      { clubId: '610', from: '2001-07', to: '2005-02' }, // Ajax
      { clubId: '294', from: '2005-07', to: '2006-01' }, // Benfica
      { clubId: '383', from: '2006-07', to: '2007-06' }, // PSV
      { clubId: '1049', from: '2007-07', to: '2008-04' }, // Valencia
      { clubId: '1090', from: '2009-05', to: '2010-12' }, // AZ Alkmaar
      { clubId: '234', from: '2011-07', to: '2014-06' }, // Feyenoord
      { clubId: '180', from: '2014-06', to: '2016-06' }, // Southampton
      { clubId: '29', from: '2016-06', to: '2017-10' }, // Everton
      { clubId: '131', from: '2020-08', to: '2021-10' }, // Barcelona
    ],
  },
  {
    name: 'Manuel Pellegrini',
    stints: [
      { clubId: '1775', from: '2001-01', to: '2002-06' }, // San Lorenzo
      { clubId: '209', from: '2002-07', to: '2003-12' }, // River Plate
      { clubId: '1050', from: '2004-07', to: '2009-06' }, // Villarreal
      { clubId: '418', from: '2009-06', to: '2010-05' }, // Real Madrid
      { clubId: '1084', from: '2010-11', to: '2013-05' }, // Málaga
      { clubId: '281', from: '2013-06', to: '2016-05' }, // Man City
      { clubId: '379', from: '2018-05', to: '2019-12' }, // West Ham
      { clubId: '150', from: '2020-07', to: 'present' }, // Real Betis
    ],
  },
  {
    name: 'Marcelo Bielsa',
    stints: [
      { clubId: '1286', from: '1990-07', to: '1992-06' }, // Newell's Old Boys
      { clubId: '1029', from: '1997-07', to: '1998-06' }, // Vélez Sarsfield
      { clubId: '714', from: '1998-07', to: '1998-12' }, // Espanyol
      { clubId: '621', from: '2011-07', to: '2013-06' }, // Athletic Bilbao
      { clubId: '244', from: '2014-07', to: '2015-08' }, // Marseille
      { clubId: '1082', from: '2017-07', to: '2018-05' }, // Lille
      { clubId: '399', from: '2018-06', to: '2022-02' }, // Leeds United
    ],
  },
]
