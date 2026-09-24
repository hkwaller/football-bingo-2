/**
 * Hand-set minimum fame scores (0-100, same scale as computeFameScore).
 *
 * The computed score leans on peak market value, club appearances and CL games,
 * which Transfermarkt barely records before ~2000 - so Pelé scored 20 and
 * Garrincha 5, and even un-decorated current stars sat far below their fame.
 * Bingo presets and trivia difficulty filter on fame (Classic >= 42, Legends
 * Only >= 70), so these decide who can be drawn. Values only ever raise a
 * player: the final score is max(computed, override).
 *
 * Curated players (MANUAL_PLAYERS) without an entry here get CURATED_FAME_FLOOR.
 */
export const CURATED_FAME_FLOOR = 42

export const FAME_OVERRIDES: Record<string, number> = {
  // ── 95 ──
  '17121': 95, // Pelé
  '8024': 95, // Diego Maradona
  // ── 90 ──
  '8021': 90, // Johan Cruyff
  '135778': 90, // Alfredo Di Stéfano
  '72347': 90, // Franz Beckenbauer
  '3140': 90, // Ronaldo
  '3111': 90, // Zinédine Zidane
  // ── 85 ──
  '103092': 85, // Ferenc Puskás
  '88994': 85, // Michel Platini
  '89230': 85, // Eusébio
  '74471': 85, // Marco van Basten
  '35604': 85, // Gerd Müller
  '5803': 85, // Paolo Maldini
  '3373': 85, // Ronaldinho
  '3207': 85, // Thierry Henry
  '151263': 85, // Garrincha
  '174987': 85, // Lev Yashin
  '174986': 85, // George Best
  '174874': 85, // Bobby Charlton
  // ── 82 ──
  '7607': 82, // Xavi
  '7600': 82, // Andrés Iniesta
  // ── 80 ──
  '4153': 80, // Roberto Baggio
  '42049': 80, // Franco Baresi
  '117619': 80, // Zico
  '7942': 80, // Romário
  '1527': 80, // Lothar Matthäus
  '3366': 80, // Kaká
  '5023': 80, // Gianluigi Buffon
  '101045': 80, // Ruud Gullit
  '3187': 80, // Dennis Bergkamp
  '3372': 80, // Rivaldo
  '196086': 80, // Bobby Moore
  '135269': 80, // Kenny Dalglish
  '5937': 80, // Cafu
  '7518': 80, // Roberto Carlos
  '5775': 80, // Fabio Cannavaro
  '3446': 80, // Luís Figo
  '5817': 80, // Andrea Pirlo
  '5958': 80, // Francesco Totti
  '4289': 80, // Alessandro Del Piero
  '12000': 80, // Éric Cantona
  '3522': 80, // Andriy Shevchenko
  '3465': 80, // Peter Schmeichel
  '206': 80, // Oliver Kahn
  '68290': 80, // Neymar
  '3109': 80, // Steven Gerrard
  '3979': 80, // Iker Casillas
  '7349': 80, // Raúl
  '3603': 80, // Pavel Nedved
  '25557': 80, // Sergio Ramos
  '117633': 80, // Sócrates
  '229662': 80, // Carlos Alberto Torres
  '3163': 80, // Frank Lampard
  '3332': 80, // Wayne Rooney
  '3139': 80, // David Beckham
  '3397': 80, // Paul Scholes
  // ── 78 ──
  '7938': 78, // Hristo Stoichkov
  '7939': 78, // Gheorghe Hagi
  '70667': 78, // Frank Rijkaard
  '72343': 78, // Karl-Heinz Rummenigge
  '89229': 78, // Dino Zoff
  '200627': 78, // Gordon Banks
  '145510': 78, // Jairzinho
  '10201': 78, // Rivellino
  '212779': 78, // Stanley Matthews
  '8542': 78, // George Weah
  '3924': 78, // Didier Drogba
  '4257': 78, // Samuel Eto'o
  '3406': 78, // Ryan Giggs
  '7594': 78, // Carles Puyol
  '4168': 78, // Clarence Seedorf
  '3396': 78, // Roy Keane
  '3183': 78, // Patrick Vieira
  '3110': 78, // Alan Shearer
  '5959': 78, // Gabriel Batistuta
  '1161': 78, // Javier Zanetti
  '3455': 78, // Zlatan Ibrahimović
  '116757': 78, // Paolo Rossi
  // ── 75 ──
  '22256': 75, // Gary Lineker
  '85458': 75, // Kevin Keegan
  '16980': 75, // Jürgen Klinsmann
  '8023': 75, // Michael Laudrup
  '3521': 75, // Lilian Thuram
  '3154': 75, // Marcel Desailly
  '4171': 75, // Alessandro Nesta
  '1397': 75, // Michael Owen
  '22068': 75, // Franck Ribéry
  '4360': 75, // Arjen Robben
  '2219': 75, // Philipp Lahm
  // ── 72 ──
  '937958': 72, // Lamine Yamal
  '145743': 72, // Ian Rush
  '3407': 72, // Ruud van Nistelrooy
  '3514': 72, // Henrik Larsson
  '37264': 72, // Mario Kempes
  '89550': 72, // Sepp Maier
  '145347': 72, // Gianni Rivera
  '151245': 72, // Just Fontaine
  '200633': 72, // Geoff Hurst
  '174867': 72, // Denis Law
  '3830': 72, // Paul Gascoigne
  '88998': 72, // Carlos Valderrama
  '7767': 72, // Fernando Torres
  '65230': 72, // Sergio Busquets
  '35518': 72, // David Silva
  '10': 72, // Miroslav Klose
  '63': 72, // Michael Ballack
  // ── 70 ──
  '116735': 70, // Daniel Passarella
  '38191': 70, // Uwe Seeler
  '200631': 70, // Jimmy Greaves
  '88989': 70, // Roger Milla
  '7940': 70, // Ronald Koeman
  '135643': 70, // Johan Neeskens
  '4673': 70, // Wesley Sneijder
  '7476': 70, // Xabi Alonso
  '7980': 70, // David Villa
  '8806': 70, // Cesc Fàbregas
  '18944': 70, // Gerard Piqué
  // ── 68 ──
  '3708': 68, // Jay-Jay Okocha
  '84528': 68, // Hugo Sánchez
  '3854': 68, // Juan Román Riquelme
  '5841': 68, // Diego Simeone
  '5950': 68, // Pep Guardiola
  '101383': 68, // Peter Shilton
  '3516': 68, // Edwin van der Sar
  // ── 66 ──
  '55838': 66, // René Higuita
  '1407': 66, // Davor Suker
  '26541': 66, // Bebeto
  '13775': 66, // Rudi Völler
  '101382': 66, // Bryan Robson
  '3177': 66, // Gianfranco Zola
  '7513': 66, // Fernando Hierro
  // ── 65 ──
  '17168': 65, // Jean-Pierre Papin
  '75553': 65, // Didier Deschamps
  '17965': 65, // Hugo Lloris
  '3141': 65, // David Seaman
  '28238': 65, // Tony Adams
  '77010': 65, // Matthias Sammer
  '3235': 65, // Rio Ferdinand
  '5354': 65, // Juninho Pernambucano
  // ── 64 ──
  '117193': 64, // Glenn Hoddle
  '87436': 64, // John Barnes
  '104637': 64, // Ian Wright
  '16036': 64, // Gianluca Vialli
  '5821': 64, // Filippo Inzaghi
  '5813': 64, // Gennaro Gattuso
  '3624': 64, // Rui Costa
  // ── 62 ──
  '96342': 62, // Dunga
  '79422': 62, // Keylor Navas
  '35894': 62, // Dejan Savicevic
  '116072': 62, // Enzo Francescoli
  '10367': 62, // Claudio Caniggia
  '5604': 62, // José Luis Chilavert
  '117501': 62, // Jean Tigana
  '3185': 62, // Robert Pirès
  '4182': 62, // Claude Makélélé
  '116155': 62, // Graeme Souness
  '16056': 62, // Andreas Brehme
  '13766': 62, // Paul Breitner
  '74842': 62, // Mario Götze
  '4385': 62, // Patrick Kluivert
  '5758': 62, // Edgar Davids
  '5797': 62, // Christian Vieri
  '117598': 62, // Emilio Butragueño
  '34495': 62, // Adriano
  '3143': 62, // Juan Sebastián Verón
  '3410': 62, // Hernán Crespo
  '3394': 62, // Ole Gunnar Solskjaer
  '3182': 62, // Ashley Cole
  // ── 60 ──
  '495666': 60, // William Saliba
  '325443': 60, // Viktor Gyökeres
  '89545': 60, // Zvonimir Boban
  '24481': 60, // Predrag Mijatović
  '3133': 60, // Nwankwo Kanu
  '3113': 60, // Laurent Blanc
  '4': 60, // Youri Djorkaeff
  '104897': 60, // David Ginola
  '101317': 60, // Stuart Pearce
  '3225': 60, // Robbie Fowler
  '3597': 60, // Jamie Carragher
  '3403': 60, // Gary Neville
  '176283': 60, // Nobby Stiles
  '140749': 60, // John Charles
  '212747': 60, // Billy Bremner
  '197': 60, // Stefan Effenberg
  '3513': 60, // Marc Overmars
  '3557': 60, // Jaap Stam
  '68204': 60, // Roberto Mancini
  '7601': 60, // Luis Enrique
  '39667': 60, // Brian Laudrup
  '117229': 60, // Zbigniew Boniek
  '9594': 60, // Vincent Kompany
  '15511': 60, // Robinho
  // ── 58 ──
  '687626': 58, // Moisés Caicedo
  '451276': 58, // Dominik Szoboszlai
  '861410': 58, // Arda Güler
  '8013': 58, // Robert Prosinecki
  '5834': 58, // Sinisa Mihajlovic
  '3363': 58, // Hakan Şükür
  '102150': 58, // Faustino Asprilla
  '129083': 58, // Iván Zamorano
  '3415': 58, // Marcelo Salas
  '117621': 58, // Falcão
  '22412': 58, // Júlio César
  '18301': 58, // Maicon
  '46741': 58, // David Luiz
  '210': 58, // Bixente Lizarazu
  '3289': 58, // Fabien Barthez
  '3226': 58, // Nicolas Anelka
  '3198': 58, // Sol Campbell
  '43705': 58, // Matt Le Tissier
  '3248': 58, // Paul Ince
  '135268': 58, // Alan Hansen
  '3518': 58, // Frank de Boer
  '27705': 58, // Paulo Futre
  '4675': 58, // Jari Litmanen
  '34572': 58, // Mario Mandžukić
  // ── 56 ──
  '102030': 56, // Peter Beardsley
  '3175': 56, // Jimmy Floyd Hasselbaink
  '3699': 56, // Paolo Di Canio
  // ── 55 ──
  '6657': 55, // Abédi Pelé
  '102704': 55, // Dragan Stojkovic
  '38593': 55, // Marek Hamsik
  '5875': 55, // Hidetoshi Nakata
  '28066': 55, // Cuauhtémoc Blanco
  '102513': 55, // Jorge Campos
  '3411': 55, // Pablo Aimar
  '7611': 55, // Javier Saviola
  '102586': 55, // Leonardo
  '3505': 55, // Juninho Paulista
  '77': 55, // Lúcio
  '5800': 55, // Dida
  '5855': 55, // Claudio Taffarel
  '116679': 55, // Carlo Ancelotti
  '5759': 55, // Antonio Conte
  '3166': 55, // Emmanuel Petit
  '101385': 55, // Chris Waddle
  '135910': 55, // Neville Southall
  '8022': 55, // Mark Hughes
  '3392': 55, // Teddy Sheringham
  '3238': 55, // Andy Cole
  '3144': 55, // Robbie Keane
  '56': 55, // Oliver Bierhoff
  '122': 55, // Jens Lehmann
  '15185': 55, // Lukas Podolski
  '26485': 55, // Jérôme Boateng
  '4192': 55, // Rafael van der Vaart
  '10055': 55, // Alessandro Costacurta
  '5778': 55, // Marco Materazzi
  '5980': 55, // Luca Toni
  '8117': 55, // Andoni Zubizarreta
  '15799': 55, // Santi Cazorla
  '9828': 55, // Ricardo Carvalho
  '96182': 55, // Preben Elkjær
  '3470': 55, // Sami Hyypiä
  '101091': 55, // Tomas Brolin
  '3134': 55, // Freddie Ljungberg
  // ── 52 ──
  '5796': 52, // Álvaro Recoba
  '4147': 52, // Ariel Ortega
  '5938': 52, // Walter Samuel
  '3645': 52, // Les Ferdinand
  '3980': 52, // Steve McManaman
  '3519': 52, // Ronald de Boer
  '4357': 52, // Klaas-Jan Huntelaar
  '119': 52, // Jürgen Kohler
  '553': 52, // Thomas Häßler
  '124': 52, // Andreas Möller
  '116754': 52, // Walter Zenga
  '4226': 52, // Fabrizio Ravanelli
  '5757': 52, // Gianluca Zambrotta
  '95378': 52, // Jean-Marie Pfaff
  '15378': 52, // Andrey Arshavin
  '132': 52, // Tomas Rosicky
  // ── 50 ──
  '117377': 50, // Rinat Dasaev
  '102200': 50, // Sergio Goycochea
  '7565': 50, // Roberto Ayala
  '117623': 50, // Junior
  '4151': 50, // Aldair
  '102590': 50, // Branco
  '7660': 50, // Denilson
  '4592': 50, // Ji-sung Park
  '335': 50, // Ali Daei
  '13556': 50, // Tim Cahill
  '3241': 50, // Harry Kewell
  '6069': 50, // Shunsuke Nakamura
  '68': 50, // Landon Donovan
  '44162': 50, // Miralem Pjanić
  '28021': 50, // Samir Handanovič
  '4077': 50, // Rüştü Reçber
  '21369': 50, // Arda Turan
  '128995': 50, // Marius Trésor
  '3156': 50, // William Gallas
  '101126': 50, // Ally McCoist
  '3146': 50, // Shay Given
  '33713': 50, // Theo Walcott
  '3876': 50, // Joe Cole
  '3878': 50, // Michael Carrick
  '3875': 50, // Jermain Defoe
  '4072': 50, // Peter Crouch
  '3259': 50, // Damien Duff
  '6710': 50, // Per Mertesacker
  '3515': 50, // Mark van Bommel
  '3191': 50, // Giovanni van Bronckhorst
  '3994': 50, // Roy Makaay
  '107860': 50, // Giuseppe Bergomi
  '102474': 50, // Roberto Donadoni
  '3390': 50, // Demetrio Albertini
  '3526': 50, // Giuseppe Signori
  '6031': 50, // Antonio Di Natale
  '117613': 50, // Míchel
  '7603': 50, // Gaizka Mendieta
  '7663': 50, // Joaquín
  '7530': 50, // Guti
  '8016': 50, // Vítor Baía
  '8019': 50, // Simão
  '118147': 50, // Jan Ceulemans
  '286': 50, // Marc Wilmots
  '16911': 50, // Kasper Schmeichel
  '4169': 50, // Jon Dahl Tomasson
  '3220': 50, // John Arne Riise
  '3742': 50, // Andrey Kanchelskis
  '3209': 50, // Jerzy Dudek
  '1157': 50, // Jan Koller
  '3216': 50, // Milan Baros
  '5879': 50, // Adrian Mutu
  '4314': 50, // Cristian Chivu
  '7451': 50, // Mikel Arteta
  // ── 48 ──
  '3242': 48, // Mark Viduka
  '66521': 48, // Keisuke Honda
  '4267': 48, // Tim Howard
  '3088': 48, // Lucas Radebe
  '8883': 48, // Emmanuel Adebayor
  '5299': 48, // Ludovic Giuly
  '5461': 48, // Florent Malouda
  '18935': 48, // Samir Nasri
  '3966': 48, // Djibril Cissé
  '33923': 48, // Blaise Matuidi
  '74223': 48, // Jack Wilshere
  '102492': 48, // Paul McGrath
  '217': 48, // Mehmet Scholl
  '5198': 48, // Phillip Cocu
  '4672': 48, // Nigel de Jong
  '5960': 48, // Vincenzo Montella
  '5769': 48, // Francesco Toldo
  '7562': 48, // Santiago Cañizares
  '5831': 48, // Fernando Couto
  '3626': 48, // Nuno Gomes
  '29364': 48, // João Moutinho
  '3623': 48, // Pauleta
  '3501': 48, // Stéphane Chapuisat
  '101104': 48, // Thomas Ravelli
  '21654': 48, // Martin Dahlin
  '3081': 48, // Tore André Flo
  '3420': 48, // Karel Poborský
  '14942': 48, // Darijo Srna
  '50570': 48, // Ezequiel Lavezzi
  // ── 40 ──
  '27577': 40, // Clint Dempsey
  '3476': 40, // Brad Friedel
  '1403': 40, // Taribo West
  '3091': 40, // Benni McCarthy
  '208': 40, // Samuel Kuffour
  '5486': 40, // Seydou Keita
  '1419': 40, // Rigobert Song
  '3604': 40, // El-Hadji Diouf
  '3700': 40, // Frédéric Kanouté
  '3237': 40, // Christophe Dugarry
  '5314': 40, // Frank Leboeuf
  '9209': 40, // Christian Karembeu
  '3459': 40, // Gary Speed
  '4280': 40, // Denis Irwin
  '3142': 40, // Emile Heskey
  '3297': 40, // Craig Bellamy
  '3360': 40, // Ledley King
  '3291': 40, // Gareth Barry
  '201': 40, // Owen Hargreaves
  '3184': 40, // Martin Keown
  '528': 40, // Torsten Frings
  '3520': 40, // Pierre van Hooijdonk
  '7515': 40, // Míchel Salgado
  '120627': 40, // Manolo Sanchís
  '4977': 40, // Alex Frei
  '3098': 40, // Olof Mellberg
  '3430': 40, // Kakhaber Kaladze
  '3217': 40, // Vladimir Smicer
  '3218': 40, // Patrik Berger
  '102023': 40, // Dan Petrescu
  '7427': 40, // Ivica Olic
  '9867': 40, // Theodoros Zagorakis
  '1519': 40, // Angelos Charisteas
  // ── 36 ──
  '91919': 36, // Alexi Lalas
  '3424': 36, // Jamie Redknapp
  '7453': 36, // Chris Sutton
  '3208': 36, // Ray Parlour
  '9822': 36, // Maniche
  '7514': 36, // Iván Helguera
  '24474': 36, // Bodo Illgner
  '15637': 36, // Franky Van der Elst
  '3570': 36, // John Carew
  '3823': 36, // Henning Berg
  '3578': 36, // Ronny Johnsen
  '5794': 36, // Obafemi Martins
  '4329': 36, // Mido
  // ── 34 ──
  '3131': 34, // Kevin Phillips
  '3478': 34, // Steffen Iversen
  '13804': 34, // Rune Bratseth
  // ── 32 ──
  '514': 32, // Jan Åge Fjørtoft
  '102510': 32, // Stig Inge Bjørnebye
  '25553': 32, // Brede Hangeland
}
