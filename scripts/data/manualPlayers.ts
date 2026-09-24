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

  // ── 2026-09 additions: missing legends + current stars ──────────────────
  // Argentina
  { id: "3411", name: "Pablo Aimar" },
  { id: "811779", name: "Alejandro Garnacho" },
  { id: "20007", name: "Pablo Zabaleta" },
  { id: "5841", name: "Diego Simeone" },
  { id: "4147", name: "Ariel Ortega" },
  { id: "5938", name: "Walter Samuel" },
  { id: "7565", name: "Roberto Ayala" },
  { id: "50570", name: "Ezequiel Lavezzi" },
  { id: "10367", name: "Claudio Caniggia" },
  { id: "948294", name: "Nico Paz" },
  { id: "102200", name: "Sergio Goycochea" },
  // Australia
  { id: "3357", name: "Mark Schwarzer" },
  // Belgium
  { id: "486049", name: "Jérémy Doku" },
  { id: "56416", name: "Dries Mertens" },
  { id: "42710", name: "Toby Alderweireld" },
  { id: "41982", name: "Radja Nainggolan" },
  { id: "286", name: "Marc Wilmots" },
  { id: "19368", name: "Moussa Dembélé" },
  // Bosnia-Herzegovina
  { id: "44162", name: "Miralem Pjanić" },
  // Brazil
  { id: "68290", name: "Neymar" },
  { id: "5800", name: "Dida" },
  { id: "411295", name: "Raphinha" },
  { id: "1056993", name: "Estêvão" },
  { id: "46741", name: "David Luiz" },
  { id: "52769", name: "Willian" },
  { id: "85314", name: "Oscar" },
  { id: "37579", name: "Alexandre Pato" },
  { id: "26267", name: "Fernandinho" },
  { id: "77100", name: "Lucas Moura" },
  { id: "517894", name: "Matheus Cunha" },
  { id: "971570", name: "Endrick" },
  { id: "4151", name: "Aldair" },
  { id: "743591", name: "Savinho" },
  { id: "22412", name: "Júlio César" },
  { id: "18301", name: "Maicon" },
  { id: "7660", name: "Denílson" },
  { id: "102586", name: "Leonardo" },
  { id: "626724", name: "João Pedro" },
  { id: "151263", name: "Garrincha" },
  { id: "145510", name: "Jairzinho" },
  { id: "26541", name: "Bebeto" },
  { id: "96342", name: "Dunga" },
  { id: "3505", name: "Juninho Paulista" },
  { id: "5855", name: "Taffarel" },
  { id: "102590", name: "Branco" },
  // Chile
  { id: "3415", name: "Marcelo Salas" },
  { id: "37666", name: "Arturo Vidal" },
  { id: "40423", name: "Claudio Bravo" },
  // Colombia
  { id: "91970", name: "Juan Cuadrado" },
  { id: "55838", name: "René Higuita" },
  { id: "102150", name: "Faustino Asprilla" },
  // Costa Rica
  { id: "79422", name: "Keylor Navas" },
  // Cote d'Ivoire
  { id: "145988", name: "Wilfried Zaha" },
  // Croatia
  { id: "89545", name: "Zvonimir Boban" },
  { id: "34572", name: "Mario Mandžukić" },
  { id: "14942", name: "Darijo Srna" },
  { id: "7427", name: "Ivica Olić" },
  { id: "8013", name: "Robert Prosinečki" },
  // Czech Republic
  { id: "1157", name: "Jan Koller" },
  { id: "3420", name: "Karel Poborský" },
  // Denmark
  { id: "4169", name: "Jon Dahl Tomasson" },
  { id: "16911", name: "Kasper Schmeichel" },
  { id: "96182", name: "Preben Elkjær" },
  // Ecuador
  { id: "687626", name: "Moisés Caicedo" },
  // Egypt
  { id: "445939", name: "Omar Marmoush" },
  // England
  { id: "3830", name: "Paul Gascoigne" },
  { id: "28238", name: "Tony Adams" },
  { id: "3141", name: "David Seaman" },
  { id: "3198", name: "Sol Campbell" },
  { id: "101317", name: "Stuart Pearce" },
  { id: "43705", name: "Matt Le Tissier" },
  { id: "820374", name: "Kobbie Mainoo" },
  { id: "3645", name: "Les Ferdinand" },
  { id: "40204", name: "Joe Hart" },
  { id: "33713", name: "Theo Walcott" },
  { id: "74223", name: "Jack Wilshere" },
  { id: "3291", name: "Gareth Barry" },
  { id: "207929", name: "Dele Alli" },
  { id: "177907", name: "Harry Maguire" },
  { id: "392757", name: "Marc Guéhi" },
  { id: "503733", name: "Anthony Gordon" },
  { id: "7453", name: "Chris Sutton" },
  { id: "3131", name: "Kevin Phillips" },
  { id: "3208", name: "Ray Parlour" },
  { id: "3184", name: "Martin Keown" },
  { id: "3360", name: "Ledley King" },
  { id: "503743", name: "Morgan Rogers" },
  { id: "744149", name: "Adam Wharton" },
  { id: "567576", name: "Elliot Anderson" },
  { id: "890721", name: "Myles Lewis-Skelly" },
  { id: "890719", name: "Ethan Nwaneri" },
  { id: "488362", name: "Conor Gallagher" },
  { id: "258889", name: "Dominic Solanke" },
  { id: "503987", name: "Noni Madueke" },
  { id: "196086", name: "Bobby Moore" },
  { id: "104637", name: "Ian Wright" },
  { id: "87436", name: "John Barnes" },
  { id: "101383", name: "Peter Shilton" },
  { id: "200633", name: "Geoff Hurst" },
  { id: "200631", name: "Jimmy Greaves" },
  { id: "101382", name: "Bryan Robson" },
  { id: "117193", name: "Glenn Hoddle" },
  { id: "3248", name: "Paul Ince" },
  { id: "101385", name: "Chris Waddle" },
  { id: "212779", name: "Stanley Matthews" },
  { id: "176283", name: "Nobby Stiles" },
  { id: "130319", name: "Trevor Francis" },
  { id: "102030", name: "Peter Beardsley" },
  // France
  { id: "104897", name: "David Ginola" },
  { id: "22068", name: "Franck Ribéry" },
  { id: "17965", name: "Hugo Lloris" },
  { id: "3113", name: "Laurent Blanc" },
  { id: "210", name: "Bixente Lizarazu" },
  { id: "3226", name: "Nicolas Anelka" },
  { id: "495666", name: "William Saliba" },
  { id: "566723", name: "Michael Olise" },
  { id: "914562", name: "Désiré Doué" },
  { id: "607223", name: "Rayan Cherki" },
  { id: "709726", name: "Hugo Ekitiké" },
  { id: "18935", name: "Samir Nasri" },
  { id: "3966", name: "Djibril Cissé" },
  { id: "3156", name: "William Gallas" },
  { id: "5461", name: "Florent Malouda" },
  { id: "33923", name: "Blaise Matuidi" },
  { id: "810092", name: "Warren Zaïre-Emery" },
  { id: "708265", name: "Bradley Barcola" },
  { id: "357119", name: "Ibrahima Konaté" },
  { id: "5299", name: "Ludovic Giuly" },
  { id: "5314", name: "Frank Leboeuf" },
  { id: "43907", name: "André-Pierre Gignac" },
  { id: "4", name: "Youri Djorkaeff" },
  { id: "420002", name: "Jean-Philippe Mateta" },
  { id: "117501", name: "Jean Tigana" },
  { id: "9209", name: "Christian Karembeu" },
  { id: "3237", name: "Christophe Dugarry" },
  // Georgia
  { id: "502670", name: "Khvicha Kvaratskhelia" },
  { id: "502676", name: "Giorgi Mamardashvili" },
  { id: "3430", name: "Kakha Kaladze" },
  // Germany
  { id: "74842", name: "Mario Götze" },
  { id: "26485", name: "Jérôme Boateng" },
  { id: "15185", name: "Lukas Podolski" },
  { id: "6710", name: "Per Mertesacker" },
  { id: "122", name: "Jens Lehmann" },
  { id: "580195", name: "Jamal Musiala" },
  { id: "197", name: "Stefan Effenberg" },
  { id: "119", name: "Jürgen Kohler" },
  { id: "792380", name: "Aleksandar Pavlović" },
  { id: "455661", name: "Nick Woltemade" },
  { id: "388198", name: "Nico Schlotterbeck" },
  { id: "124", name: "Andreas Möller" },
  { id: "217", name: "Mehmet Scholl" },
  { id: "528", name: "Torsten Frings" },
  { id: "496094", name: "Karim Adeyemi" },
  { id: "13775", name: "Rudi Völler" },
  { id: "77010", name: "Matthias Sammer" },
  { id: "16056", name: "Andreas Brehme" },
  { id: "553", name: "Thomas Hässler" },
  { id: "38191", name: "Uwe Seeler" },
  // Ghana
  { id: "208", name: "Samuel Kuffour" },
  { id: "583255", name: "Antoine Semenyo" },
  { id: "543499", name: "Mohammed Kudus" },
  { id: "255508", name: "Iñaki Williams" },
  // Greece
  { id: "1519", name: "Angelos Charisteas" },
  { id: "9867", name: "Theodoros Zagorakis" },
  // Hungary
  { id: "451276", name: "Dominik Szoboszlai" },
  // Ireland
  { id: "3146", name: "Shay Given" },
  { id: "102492", name: "Paul McGrath" },
  // Italy
  { id: "5813", name: "Gennaro Gattuso" },
  { id: "5821", name: "Filippo Inzaghi" },
  { id: "68204", name: "Roberto Mancini" },
  { id: "5778", name: "Marco Materazzi" },
  { id: "39983", name: "Leonardo Bonucci" },
  { id: "45146", name: "Mario Balotelli" },
  { id: "3699", name: "Paolo Di Canio" },
  { id: "5759", name: "Antonio Conte" },
  { id: "10055", name: "Alessandro Costacurta" },
  { id: "4226", name: "Fabrizio Ravanelli" },
  { id: "5980", name: "Luca Toni" },
  { id: "133964", name: "Lorenzo Insigne" },
  { id: "364135", name: "Moise Kean" },
  { id: "3390", name: "Demetrio Albertini" },
  { id: "5960", name: "Vincenzo Montella" },
  { id: "5769", name: "Francesco Toldo" },
  { id: "52312", name: "Sebastian Giovinco" },
  { id: "502821", name: "Riccardo Calafiori" },
  { id: "16036", name: "Gianluca Vialli" },
  { id: "116679", name: "Carlo Ancelotti" },
  { id: "116754", name: "Walter Zenga" },
  { id: "6031", name: "Antonio Di Natale" },
  { id: "102474", name: "Roberto Donadoni" },
  { id: "3526", name: "Giuseppe Signori" },
  // Japan
  { id: "66521", name: "Keisuke Honda" },
  { id: "6069", name: "Shunsuke Nakamura" },
  // Mali
  { id: "5486", name: "Seydou Keita" },
  // Mexico
  { id: "35773", name: "Carlos Vela" },
  { id: "206040", name: "Raúl Jiménez" },
  { id: "28066", name: "Cuauhtémoc Blanco" },
  { id: "102513", name: "Jorge Campos" },
  { id: "29559", name: "Guillermo Ochoa" },
  // Montenegro
  { id: "24481", name: "Predrag Mijatović" },
  { id: "35894", name: "Dejan Savićević" },
  // Morocco
  { id: "217111", name: "Hakim Ziyech" },
  // Netherlands
  { id: "3518", name: "Frank de Boer" },
  { id: "3513", name: "Marc Overmars" },
  { id: "4192", name: "Rafael van der Vaart" },
  { id: "3515", name: "Mark van Bommel" },
  { id: "478573", name: "Ryan Gravenberch" },
  { id: "3175", name: "Jimmy Floyd Hasselbaink" },
  { id: "3519", name: "Ronald de Boer" },
  { id: "3191", name: "Giovanni van Bronckhorst" },
  { id: "5198", name: "Phillip Cocu" },
  { id: "3994", name: "Roy Makaay" },
  { id: "4357", name: "Klaas-Jan Huntelaar" },
  { id: "4672", name: "Nigel de Jong" },
  { id: "557459", name: "Micky van de Ven" },
  { id: "460939", name: "Tijjani Reijnders" },
  { id: "3520", name: "Pierre van Hooijdonk" },
  { id: "7940", name: "Ronald Koeman" },
  // Nigeria
  { id: "3133", name: "Nwankwo Kanu" },
  { id: "406040", name: "Ademola Lookman" },
  { id: "30739", name: "John Obi Mikel" },
  { id: "1403", name: "Taribo West" },
  // Norway
  { id: "3081", name: "Tore André Flo" },
  { id: "3570", name: "John Carew" },
  { id: "3478", name: "Steffen Iversen" },
  { id: "238407", name: "Alexander Sørloth" },
  { id: "102510", name: "Stig Inge Bjørnebye" },
  { id: "13804", name: "Rune Bratseth" },
  { id: "514", name: "Jan Åge Fjørtoft" },
  { id: "25553", name: "Brede Hangeland" },
  // Paraguay
  { id: "215", name: "Roque Santa Cruz" },
  { id: "5604", name: "José Luis Chilavert" },
  // Peru
  { id: "532", name: "Claudio Pizarro" },
  { id: "3460", name: "Nolberto Solano" },
  { id: "2989", name: "Paolo Guerrero" },
  // Portugal
  { id: "487469", name: "Vitinha" },
  { id: "670681", name: "João Neves" },
  { id: "616341", name: "Nuno Mendes" },
  { id: "9828", name: "Ricardo Carvalho" },
  { id: "8019", name: "Simão" },
  { id: "29364", name: "João Moutinho" },
  { id: "8016", name: "Vítor Baía" },
  { id: "5831", name: "Fernando Couto" },
  { id: "9822", name: "Maniche" },
  { id: "7912", name: "Sérgio Conceição" },
  { id: "357153", name: "Diogo Costa" },
  { id: "27705", name: "Paulo Futre" },
  // Romania
  { id: "5879", name: "Adrian Mutu" },
  { id: "4314", name: "Cristian Chivu" },
  { id: "102023", name: "Dan Petrescu" },
  // Russia
  { id: "174987", name: "Lev Yashin" },
  { id: "3742", name: "Andrei Kanchelskis" },
  // Scotland
  { id: "174867", name: "Denis Law" },
  { id: "116155", name: "Graeme Souness" },
  { id: "212747", name: "Billy Bremner" },
  { id: "135268", name: "Alan Hansen" },
  { id: "101126", name: "Ally McCoist" },
  // Senegal
  { id: "776890", name: "Nicolas Jackson" },
  // Serbia
  { id: "5834", name: "Siniša Mihajlović" },
  { id: "46156", name: "Aleksandar Kolarov" },
  { id: "102704", name: "Dragan Stojković" },
  // Slovakia
  { id: "38593", name: "Marek Hamšík" },
  // Slovenia
  { id: "627442", name: "Benjamin Šeško" },
  { id: "28021", name: "Samir Handanović" },
  // South Africa
  { id: "3091", name: "Benni McCarthy" },
  { id: "3088", name: "Lucas Radebe" },
  // Spain
  { id: "65230", name: "Sergio Busquets" },
  { id: "18944", name: "Gerard Piqué" },
  { id: "35518", name: "David Silva" },
  { id: "69751", name: "Jordi Alba" },
  { id: "15799", name: "Santi Cazorla" },
  { id: "937958", name: "Lamine Yamal" },
  { id: "5950", name: "Pep Guardiola" },
  { id: "7451", name: "Mikel Arteta" },
  { id: "7603", name: "Gaizka Mendieta" },
  { id: "7663", name: "Joaquín" },
  { id: "65278", name: "Pedro" },
  { id: "85288", name: "Isco" },
  { id: "44779", name: "Diego Costa" },
  { id: "636703", name: "Fermín López" },
  { id: "962110", name: "Pau Cubarsí" },
  { id: "890290", name: "Dean Huijsen" },
  { id: "284857", name: "Marc Cucurella" },
  { id: "553875", name: "Pedro Porro" },
  { id: "262749", name: "David Raya" },
  { id: "262396", name: "Unai Simón" },
  { id: "7562", name: "Santiago Cañizares" },
  { id: "193082", name: "Alejandro Grimaldo" },
  { id: "548111", name: "Álex Baena" },
  { id: "74229", name: "Koke" },
  { id: "8117", name: "Andoni Zubizarreta" },
  { id: "117613", name: "Míchel" },
  // Sweden
  { id: "3134", name: "Freddie Ljungberg" },
  { id: "325443", name: "Viktor Gyökeres" },
  { id: "3098", name: "Olof Mellberg" },
  { id: "101091", name: "Tomas Brolin" },
  { id: "101104", name: "Thomas Ravelli" },
  { id: "21654", name: "Martin Dahlin" },
  // Switzerland
  { id: "42205", name: "Yann Sommer" },
  { id: "3501", name: "Stéphane Chapuisat" },
  { id: "4977", name: "Alexander Frei" },
  // Türkiye
  { id: "861410", name: "Arda Güler" },
  { id: "845654", name: "Kenan Yıldız" },
  { id: "21369", name: "Arda Turan" },
  // United States
  { id: "315779", name: "Christian Pulisic" },
  { id: "3476", name: "Brad Friedel" },
  { id: "91919", name: "Alexi Lalas" },
  { id: "332697", name: "Weston McKennie" },
  // Uruguay
  { id: "480267", name: "Ronald Araújo" },
  { id: "5796", name: "Álvaro Recoba" },
  // Wales
  { id: "3459", name: "Gary Speed" },
  { id: "8022", name: "Mark Hughes" },
  { id: "50057", name: "Aaron Ramsey" },
  { id: "140749", name: "John Charles" },
  { id: "135910", name: "Neville Southall" },
];

export const MANUAL_PLAYER_IDS = new Set(MANUAL_PLAYERS.map((p) => p.id))

/**
 * IDs that must never reach the output, even if they sit in the caches:
 *   131754 - Venezuelan Raúl González, confused with the Real Madrid Raúl (7349)
 *   54432  - journeyman wrongly entered as El Hadji Diouf (real one: 3604)
 */
export const EXCLUDED_IDS = new Set(['131754', '54432'])
