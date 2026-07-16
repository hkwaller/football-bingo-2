/**
 * Hand-curated players: ID corrections from squad discovery, plus legendary
 * players to force-include. These IDs are ALWAYS kept in the output (they
 * bypass the popularity filter), so pre-market-value-era greats with sparse
 * API data are never dropped.
 */
export const MANUAL_PLAYERS: { id: string; name: string }[] = [
  // ── Corrections (wrong IDs from squad discovery) ──────────────────────────
  { id: "3140", name: "Ronaldo Nazário (R9)" }, // was wrongly mapped to Ronaldo Córdoba (421727)
  { id: "2904", name: "Rafael Márquez" }, // was wrongly mapped to lower-league player (310484)
  { id: "50935", name: "Javier Hernández (Chicharito)" }, // was wrongly mapped to amateur player (719927)
  { id: "7349", name: "Raúl González" }, // was wrongly mapped to Venezuelan Raúl (131754)
  { id: "181136", name: "Piotr Zieliński" }, // was wrongly mapped to Polish GK (528347)

  // ── FIFA 100 legends missing from squad discovery ─────────────────────────
  // Argentina
  { id: "135778", name: "Alfredo Di Stéfano" },
  { id: "37264", name: "Mario Kempes" },
  { id: "8024", name: "Diego Maradona" },
  { id: "7611", name: "Javier Saviola" },
  { id: "3143", name: "Juan Sebastián Verón" },
  // Brazil
  { id: "229662", name: "Carlos Alberto Torres" },
  { id: "17121", name: "Pelé" },
  { id: "10201", name: "Rivellino" },
  { id: "117633", name: "Sócrates" },
  { id: "117619", name: "Zico" },
  // Bulgaria
  { id: "7938", name: "Hristo Stoichkov" },
  // Cameroon
  { id: "88989", name: "Roger Milla" },
  // Chile
  { id: "129083", name: "Iván Zamorano" },
  // Colombia
  { id: "88998", name: "Carlos Valderrama" },
  // Croatia
  { id: "1407", name: "Davor Šuker" },
  // Denmark
  { id: "39667", name: "Brian Laudrup" },
  { id: "8023", name: "Michael Laudrup" },
  // England
  { id: "200627", name: "Gordon Banks" },
  { id: "174874", name: "Bobby Charlton" },
  { id: "85458", name: "Kevin Keegan" },
  { id: "22256", name: "Gary Lineker" },
  { id: "3110", name: "Alan Shearer" },
  // France
  { id: "12000", name: "Éric Cantona" },
  { id: "75553", name: "Didier Deschamps" },
  { id: "151245", name: "Just Fontaine" },
  { id: "17168", name: "Jean-Pierre Papin" },
  // Germany
  { id: "72347", name: "Franz Beckenbauer" },
  { id: "89550", name: "Sepp Maier" },
  { id: "35604", name: "Gerd Müller" },
  { id: "72343", name: "Karl-Heinz Rummenigge" },
  // Ghana
  { id: "6657", name: "Abedi Pelé" },
  // Hungary
  { id: "103092", name: "Ferenc Puskás" },
  // Italy
  { id: "42049", name: "Franco Baresi" },
  { id: "4289", name: "Alessandro Del Piero" },
  { id: "4171", name: "Alessandro Nesta" },
  { id: "116757", name: "Paolo Rossi" },
  { id: "5797", name: "Christian Vieri" },
  { id: "89229", name: "Dino Zoff" },
  // Liberia
  { id: "8542", name: "George Weah" },
  // Netherlands
  { id: "8021", name: "Johan Cruyff" },
  { id: "5758", name: "Edgar Davids" },
  { id: "135643", name: "Johan Neeskens" },
  { id: "70667", name: "Frank Rijkaard" },
  // Northern Ireland
  { id: "174986", name: "George Best" },
  // Poland
  { id: "117229", name: "Zbigniew Boniek" },
  // Portugal
  { id: "89230", name: "Eusébio" },
  // Republic of Ireland
  { id: "3396", name: "Roy Keane" },
  // Senegal
  { id: "54432", name: "El Hadji Diouf" },
  // Spain
  { id: "117598", name: "Emilio Butragueño" },
  { id: "7601", name: "Luis Enrique" },
  // Turkey
  { id: "4077", name: "Rüştü Reçber" },
  { id: "5782", name: "Emre Belözoğlu" },
  // Uruguay
  { id: "116072", name: "Enzo Francescoli" },

  // ── 1990s–2000s greats added to widen historical coverage (2026-07) ──
  { id: "4153", name: "Roberto Baggio" },
  { id: "7942", name: "Romário" },
  { id: "5959", name: "Gabriel Batistuta" },
  { id: "3187", name: "Dennis Bergkamp" },
  { id: "3446", name: "Luís Figo" },
  { id: "5958", name: "Francesco Totti" },
  { id: "3522", name: "Andriy Shevchenko" },
  { id: "3603", name: "Pavel Nedvěd" },
  { id: "5775", name: "Fabio Cannavaro" },
  { id: "5803", name: "Paolo Maldini" },
  { id: "101045", name: "Ruud Gullit" },
  { id: "74471", name: "Marco van Basten" },
  { id: "1161", name: "Javier Zanetti" },
  { id: "5817", name: "Andrea Pirlo" },
  { id: "4168", name: "Clarence Seedorf" },
  { id: "3366", name: "Kaká" },
  { id: "3373", name: "Ronaldinho" },
  { id: "7518", name: "Roberto Carlos" },
  { id: "5937", name: "Cafu" },
  { id: "3372", name: "Rivaldo" },
  { id: "3207", name: "Thierry Henry" },
  { id: "3183", name: "Patrick Vieira" },
  { id: "1527", name: "Lothar Matthäus" },
  { id: "16980", name: "Jürgen Klinsmann" },
  { id: "206", name: "Oliver Kahn" },
  { id: "10", name: "Miroslav Klose" },
  { id: "7939", name: "Gheorghe Hagi" },
  { id: "3708", name: "Jay-Jay Okocha" },
  { id: "3410", name: "Hernán Crespo" },
  { id: "3854", name: "Juan Román Riquelme" },
  { id: "3624", name: "Rui Costa" },
  { id: "5875", name: "Hidetoshi Nakata" },
  { id: "4257", name: "Samuel Eto'o" },
  { id: "3924", name: "Didier Drogba" },
  { id: "63", name: "Michael Ballack" },
];

export const MANUAL_PLAYER_IDS = new Set(MANUAL_PLAYERS.map((p) => p.id))
