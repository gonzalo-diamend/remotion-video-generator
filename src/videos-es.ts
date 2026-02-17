import {QuizVideoPayload} from './quiz-schema';
import {buildHashtags, buildSeoDescription, buildTags} from './quiz-metadata';
import {buildRenderCatalog} from './render-catalog';

type BankQuestion = {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
};

const TOPICS = [
  'historia',
  'geografía',
  'ciencia',
  'cultura general',
  'España',
  'fútbol',
  'tecnología',
  'cine',
  'anime',
  'videojuegos',
  'misterio',
  'conocimiento general',
] as const;

const BANK: Record<(typeof TOPICS)[number], BankQuestion[]> = {
  historia: [
    {question: '¿En qué año cayó Roma de Occidente?', options: ['476', '1066', '1492', '1914'], correctIndex: 0, explanation: 'La fecha aceptada es 476.'},
    {question: '¿Quién fue el primer emperador romano?', options: ['Nerón', 'Augusto', 'Trajano', 'Julio César'], correctIndex: 1, explanation: 'Augusto fue el primer emperador.'},
    {question: '¿Qué civilización construyó Machu Picchu?', options: ['Maya', 'Azteca', 'Inca', 'Olmeca'], correctIndex: 2, explanation: 'Machu Picchu pertenece al mundo inca.'},
    {question: '¿Dónde inició la Revolución Industrial?', options: ['Francia', 'Alemania', 'Reino Unido', 'EE. UU.'], correctIndex: 2, explanation: 'Comenzó en Reino Unido.'},
    {question: '¿Qué muro cayó en 1989?', options: ['Adriano', 'Berlín', 'China', 'Jericó'], correctIndex: 1, explanation: 'El Muro de Berlín cayó en 1989.'},
    {question: '¿Qué guerra cerró el Tratado de Versalles?', options: ['I Guerra Mundial', 'II Guerra Mundial', 'Crimea', 'Guerra de los 30 años'], correctIndex: 0, explanation: 'Versalles cerró la I Guerra Mundial.'},
    {question: '¿Quién llegó a India por África para Portugal?', options: ['Colón', 'Magallanes', 'Vasco da Gama', 'Cabral'], correctIndex: 2, explanation: 'Vasco da Gama logró esa ruta.'},
    {question: '¿De quién era la tumba descubierta en 1922?', options: ['Ramsés II', 'Tutankamón', 'Akenatón', 'Keops'], correctIndex: 1, explanation: 'Fue la tumba de Tutankamón.'},
    {question: '¿Qué evento inició la Revolución Francesa?', options: ['Bastilla', 'Reinado del Terror', 'Golpe de Napoleón', 'Congreso de Viena'], correctIndex: 0, explanation: 'La toma de la Bastilla.'},
    {question: '¿Qué imperio tuvo capital en Constantinopla?', options: ['Bizantino', 'Mongol', 'Persa', 'Sacro Romano'], correctIndex: 0, explanation: 'El Imperio Bizantino.'},
    {question: '¿Quién escribió El Príncipe?', options: ['Maquiavelo', 'Dante', 'Erasmo', 'Petrarca'], correctIndex: 0, explanation: 'Nicolás Maquiavelo.'},
    {question: '¿Qué líder impulsó la no violencia en India?', options: ['Nehru', 'Gandhi', 'Patel', 'Bose'], correctIndex: 1, explanation: 'Mahatma Gandhi.'},
  ],
  geografía: [
    {question: '¿Cuál es el río más largo (medición tradicional)?', options: ['Amazonas', 'Nilo', 'Yangtsé', 'Misisipi'], correctIndex: 1, explanation: 'Tradicionalmente se cita el Nilo.'},
    {question: '¿Desierto cálido más grande?', options: ['Gobi', 'Kalahari', 'Sahara', 'Atacama'], correctIndex: 2, explanation: 'Es el Sahara.'},
    {question: '¿Qué país tiene más husos horarios?', options: ['Rusia', 'Francia', 'EE. UU.', 'China'], correctIndex: 1, explanation: 'Francia por sus territorios.'},
    {question: '¿Qué cordillera separa Europa y Asia en Rusia?', options: ['Alpes', 'Urales', 'Cárpatos', 'Cáucaso'], correctIndex: 1, explanation: 'Los Urales.'},
    {question: '¿Capital de Australia?', options: ['Sídney', 'Melbourne', 'Canberra', 'Perth'], correctIndex: 2, explanation: 'Es Canberra.'},
    {question: '¿Qué océano baña el este de América?', options: ['Índico', 'Pacífico', 'Ártico', 'Atlántico'], correctIndex: 3, explanation: 'El Atlántico.'},
    {question: '¿País más poblado en 2024?', options: ['India', 'China', 'EE. UU.', 'Indonesia'], correctIndex: 0, explanation: 'India superó a China.'},
    {question: '¿Isla más grande del mundo?', options: ['Groenlandia', 'Borneo', 'Madagascar', 'Nueva Guinea'], correctIndex: 0, explanation: 'Groenlandia.'},
    {question: '¿Qué estrecho separa Europa y África en España?', options: ['Bósforo', 'Malaca', 'Gibraltar', 'Bering'], correctIndex: 2, explanation: 'Gibraltar.'},
    {question: '¿Montaña más alta sobre el nivel del mar?', options: ['K2', 'Everest', 'Lhotse', 'Makalu'], correctIndex: 1, explanation: 'El Everest.'},
    {question: '¿Surinam está en qué continente?', options: ['África', 'Asia', 'Oceanía', 'América del Sur'], correctIndex: 3, explanation: 'América del Sur.'},
    {question: '¿Mar entre Europa y África?', options: ['Rojo', 'Mediterráneo', 'Negro', 'Arábigo'], correctIndex: 1, explanation: 'Mar Mediterráneo.'},
  ],
  ciencia: [
    {question: 'Unidad básica de la vida', options: ['Molécula', 'Célula', 'Átomo', 'Tejido'], correctIndex: 1, explanation: 'La célula.'},
    {question: 'Planeta rojo', options: ['Venus', 'Marte', 'Júpiter', 'Mercurio'], correctIndex: 1, explanation: 'Marte.'},
    {question: 'Gas más abundante en la atmósfera', options: ['Oxígeno', 'Nitrógeno', 'Argón', 'CO2'], correctIndex: 1, explanation: 'Nitrógeno.'},
    {question: 'Autor de la relatividad', options: ['Newton', 'Einstein', 'Bohr', 'Galileo'], correctIndex: 1, explanation: 'Albert Einstein.'},
    {question: 'Número atómico del oxígeno', options: ['6', '7', '8', '16'], correctIndex: 2, explanation: 'Es 8.'},
    {question: 'Partícula de carga negativa', options: ['Protón', 'Neutrón', 'Electrón', 'Positrón'], correctIndex: 2, explanation: 'Electrón.'},
    {question: 'Órgano que bombea sangre', options: ['Pulmón', 'Hígado', 'Corazón', 'Riñón'], correctIndex: 2, explanation: 'Corazón.'},
    {question: 'Tipo de energía del Sol', options: ['Fisión', 'Fusión', 'Química', 'Geotérmica'], correctIndex: 1, explanation: 'Fusión nuclear.'},
    {question: 'Fórmula del agua', options: ['CO2', 'H2O', 'O2', 'NaCl'], correctIndex: 1, explanation: 'H2O.'},
    {question: 'Velocidad de la luz aproximada', options: ['300.000 km/s', '30.000 km/s', '3.000 km/s', '3.000.000 km/s'], correctIndex: 0, explanation: 'Aprox. 300.000 km/s.'},
    {question: 'La genética estudia', options: ['Rocas', 'Heredencia', 'Estrellas', 'Volcanes'], correctIndex: 1, explanation: 'Genes y herencia.'},
    {question: 'pH neutro', options: ['0', '7', '10', '14'], correctIndex: 1, explanation: 'El pH neutro es 7.'},
  ],
  'cultura general': [
    {question: 'Autor de Don Quijote', options: ['Lope', 'Cervantes', 'Quevedo', 'Góngora'], correctIndex: 1, explanation: 'Miguel de Cervantes.'},
    {question: 'Idioma nativo más hablado', options: ['Inglés', 'Hindi', 'Mandarín', 'Español'], correctIndex: 2, explanation: 'Mandarín.'},
    {question: 'Pintor de la Mona Lisa', options: ['Miguel Ángel', 'Leonardo', 'Rafael', 'Donatello'], correctIndex: 1, explanation: 'Leonardo da Vinci.'},
    {question: 'Moneda de Japón', options: ['Won', 'Yuan', 'Yen', 'Dólar'], correctIndex: 2, explanation: 'Yen.'},
    {question: 'Compositor de la Novena Sinfonía', options: ['Mozart', 'Bach', 'Beethoven', 'Chopin'], correctIndex: 2, explanation: 'Beethoven.'},
    {question: 'Llegada del hombre a la Luna', options: ['1965', '1969', '1972', '1959'], correctIndex: 1, explanation: 'Año 1969.'},
    {question: 'País del tango', options: ['México', 'Argentina', 'Colombia', 'Chile'], correctIndex: 1, explanation: 'Argentina.'},
    {question: 'Color al mezclar azul y amarillo', options: ['Rojo', 'Verde', 'Naranja', 'Morado'], correctIndex: 1, explanation: 'Verde.'},
    {question: 'Lados de un hexágono', options: ['5', '6', '7', '8'], correctIndex: 1, explanation: 'Tiene 6 lados.'},
    {question: 'Océano más grande', options: ['Atlántico', 'Índico', 'Pacífico', 'Ártico'], correctIndex: 2, explanation: 'Pacífico.'},
    {question: 'UNESCO es un organismo de la', options: ['ONU', 'UE', 'OTAN', 'OCDE'], correctIndex: 0, explanation: 'ONU.'},
    {question: 'Modelo escolar común de continentes', options: ['5', '6', '7', '8'], correctIndex: 1, explanation: 'Modelo de 6.'},
  ],
  España: [
    {question: 'Capital de España', options: ['Barcelona', 'Valencia', 'Madrid', 'Sevilla'], correctIndex: 2, explanation: 'Madrid.'},
    {question: 'Río que pasa por Zaragoza', options: ['Duero', 'Ebro', 'Tajo', 'Guadalquivir'], correctIndex: 1, explanation: 'Ebro.'},
    {question: 'Santiago de Compostela está en', options: ['Galicia', 'Asturias', 'Cantabria', 'Navarra'], correctIndex: 0, explanation: 'Galicia.'},
    {question: 'Monumento de Granada', options: ['Mezquita', 'Alhambra', 'Sagrada Familia', 'Acueducto'], correctIndex: 1, explanation: 'Alhambra.'},
    {question: 'Archipiélago español atlántico', options: ['Baleares', 'Canarias', 'Azores', 'Madeira'], correctIndex: 1, explanation: 'Canarias.'},
    {question: 'Fiesta típica de Pamplona', options: ['Fallas', 'San Fermín', 'Tomatina', 'Abril'], correctIndex: 1, explanation: 'San Fermín.'},
    {question: 'Lengua cooficial en Cataluña', options: ['Euskera', 'Gallego', 'Catalán', 'Bable'], correctIndex: 2, explanation: 'Catalán.'},
    {question: 'Rey actual de España', options: ['Juan Carlos I', 'Felipe VI', 'Alfonso XIII', 'Amadeo I'], correctIndex: 1, explanation: 'Felipe VI.'},
    {question: 'Mar de la Costa Brava', options: ['Cantábrico', 'Mediterráneo', 'Atlántico', 'Negro'], correctIndex: 1, explanation: 'Mediterráneo.'},
    {question: 'Ciudad del Guggenheim español', options: ['Bilbao', 'Málaga', 'Madrid', 'Toledo'], correctIndex: 0, explanation: 'Bilbao.'},
    {question: 'Ruta de peregrinación histórica', options: ['Vía de la Plata', 'Camino de Santiago', 'Ruta de la Seda', 'Camino Real'], correctIndex: 1, explanation: 'Camino de Santiago.'},
    {question: 'Plato valenciano emblemático', options: ['Cocido', 'Paella', 'Fabada', 'Gazpacho manchego'], correctIndex: 1, explanation: 'Paella.'},
  ],
  fútbol: [
    {question: 'Jugadores por equipo al inicio', options: ['9', '10', '11', '12'], correctIndex: 2, explanation: '11 jugadores.'},
    {question: 'Ganador del Mundial 2010', options: ['Alemania', 'Brasil', 'España', 'Argentina'], correctIndex: 2, explanation: 'España.'},
    {question: 'Posición que evita goles', options: ['Delantero', 'Portero', 'Extremo', 'Mediapunta'], correctIndex: 1, explanation: 'Portero.'},
    {question: 'Tarjeta de expulsión directa', options: ['Azul', 'Verde', 'Roja', 'Naranja'], correctIndex: 2, explanation: 'Roja.'},
    {question: 'Duración reglamentaria', options: ['80', '90', '100', '70'], correctIndex: 1, explanation: '90 minutos.'},
    {question: 'Torneo europeo de clubes top', options: ['Europa League', 'Champions', 'Conference', 'Supercopa'], correctIndex: 1, explanation: 'Champions League.'},
    {question: 'VAR significa', options: ['Video Assistant Referee', 'Virtual Attack Rule', 'Verified Replay', 'Video Arena'], correctIndex: 0, explanation: 'Video Assistant Referee.'},
    {question: 'Reanudación por línea de banda', options: ['Córner', 'Saque de banda', 'Saque de meta', 'Bote neutral'], correctIndex: 1, explanation: 'Saque de banda.'},
    {question: 'Club del Camp Nou', options: ['Real Madrid', 'Atlético', 'FC Barcelona', 'Sevilla'], correctIndex: 2, explanation: 'FC Barcelona.'},
    {question: 'Origen del fútbol moderno', options: ['Italia', 'Brasil', 'Inglaterra', 'Uruguay'], correctIndex: 2, explanation: 'Inglaterra.'},
    {question: 'Distancia del penal', options: ['11 m', '9 m', '13 m', '15 m'], correctIndex: 0, explanation: '11 metros.'},
    {question: 'Torneo UEFA de selecciones', options: ['Copa América', 'Eurocopa', 'Copa Oro', 'AFCON'], correctIndex: 1, explanation: 'Eurocopa.'},
  ],
  tecnología: [
    {question: 'CPU significa', options: ['Central Process Unit', 'Central Processing Unit', 'Computer Primary Unit', 'Core Power Unit'], correctIndex: 1, explanation: 'Central Processing Unit.'},
    {question: 'Lenguaje base para estructurar web', options: ['Python', 'HTML', 'SQL', 'C'], correctIndex: 1, explanation: 'HTML.'},
    {question: 'Empresa creadora del iPhone', options: ['Samsung', 'Apple', 'Google', 'Sony'], correctIndex: 1, explanation: 'Apple.'},
    {question: 'Generación previa al 5G', options: ['2G', '3G', '4G', '6G'], correctIndex: 2, explanation: '4G.'},
    {question: 'Almacenamiento no volátil', options: ['RAM', 'SSD', 'Cache', 'Registro'], correctIndex: 1, explanation: 'SSD.'},
    {question: 'SO open source usado en servidores', options: ['iOS', 'Linux', 'Windows Phone', 'HarmonyOS'], correctIndex: 1, explanation: 'Linux.'},
    {question: 'Protocolo web seguro', options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'], correctIndex: 2, explanation: 'HTTPS.'},
    {question: 'Android pertenece a', options: ['Microsoft', 'Google', 'Meta', 'Intel'], correctIndex: 1, explanation: 'Google.'},
    {question: 'IA generativa', options: ['Hardware de red', 'IA que crea contenido', 'Base de datos', 'Antivirus'], correctIndex: 1, explanation: 'Genera contenido nuevo.'},
    {question: 'Unidad mínima de información', options: ['Byte', 'Bit', 'Pixel', 'Hertz'], correctIndex: 1, explanation: 'Bit.'},
    {question: 'Pagos móviles sin contacto', options: ['NFC', 'VGA', 'USB-A', 'SATA'], correctIndex: 0, explanation: 'NFC.'},
    {question: 'Computación en la nube', options: ['Servidores remotos', 'Disco local', 'Cable', 'GPU'], correctIndex: 0, explanation: 'Recursos remotos por internet.'},
  ],
  cine: [
    {question: 'Premio más famoso de Hollywood', options: ['Goya', 'Palma de Oro', 'Óscar', 'BAFTA'], correctIndex: 2, explanation: 'Óscar.'},
    {question: 'Director de Titanic', options: ['Spielberg', 'Cameron', 'Nolan', 'Scott'], correctIndex: 1, explanation: 'James Cameron.'},
    {question: 'Saga de Darth Vader', options: ['Star Trek', 'Star Wars', 'Dune', 'Matrix'], correctIndex: 1, explanation: 'Star Wars.'},
    {question: 'País del festival de Cannes', options: ['Italia', 'Francia', 'España', 'Alemania'], correctIndex: 1, explanation: 'Francia.'},
    {question: 'Qué es un cameo', options: ['Plano largo', 'Aparición breve', 'Error continuidad', 'Postcréditos'], correctIndex: 1, explanation: 'Aparición breve de alguien conocido.'},
    {question: 'Largometraje suele ser', options: ['Más de 40 min', 'Menos de 10 min', '20 min exactos', '3 h mínimas'], correctIndex: 0, explanation: 'Generalmente más de 40 min.'},
    {question: 'Actor de Jack en Titanic', options: ['Brad Pitt', 'Leonardo DiCaprio', 'Matt Damon', 'Tom Cruise'], correctIndex: 1, explanation: 'Leonardo DiCaprio.'},
    {question: 'Película Pixar sobre emociones', options: ['Coco', 'Inside Out', 'Up', 'Cars'], correctIndex: 1, explanation: 'Inside Out.'},
    {question: 'CGI significa', options: ['Computer Generated Imagery', 'Cinema Global Index', 'Color Grade Input', 'Creative Graphic Interface'], correctIndex: 0, explanation: 'Imágenes generadas por ordenador.'},
    {question: 'Director de LOTR trilogía', options: ['Peter Jackson', 'Ridley Scott', 'George Lucas', 'Tim Burton'], correctIndex: 0, explanation: 'Peter Jackson.'},
    {question: 'Premios del cine español', options: ['César', 'Ariel', 'Goya', 'Gaudí'], correctIndex: 2, explanation: 'Premios Goya.'},
    {question: 'Óscar a mejor película 2020', options: ['1917', 'Joker', 'Parasite', 'Ford v Ferrari'], correctIndex: 2, explanation: 'Parasite.'},
  ],
  anime: [
    {question: 'Autor de One Piece', options: ['Kishimoto', 'Oda', 'Toriyama', 'Isayama'], correctIndex: 1, explanation: 'Eiichiro Oda.'},
    {question: 'Aldea de Naruto', options: ['Hoja', 'Arena', 'Niebla', 'Roca'], correctIndex: 0, explanation: 'Aldea de la Hoja.'},
    {question: 'Ataque famoso de Goku', options: ['Rasengan', 'Kamehameha', 'Getsuga', 'Chidori'], correctIndex: 1, explanation: 'Kamehameha.'},
    {question: 'Anime del cuaderno mortal', options: ['Bleach', 'Death Note', 'Monster', 'Psycho-Pass'], correctIndex: 1, explanation: 'Death Note.'},
    {question: 'Estudio de El viaje de Chihiro', options: ['MAPPA', 'Toei', 'Ghibli', 'Bones'], correctIndex: 2, explanation: 'Studio Ghibli.'},
    {question: 'Capitán Sombrero de Paja', options: ['Zoro', 'Luffy', 'Sanji', 'Usopp'], correctIndex: 1, explanation: 'Monkey D. Luffy.'},
    {question: 'Titán de Eren', options: ['Acorazado', 'Colosal', 'De Ataque', 'Bestia'], correctIndex: 2, explanation: 'Titán de Ataque.'},
    {question: 'Pokémon eléctrico icónico', options: ['Eevee', 'Pikachu', 'Snorlax', 'Mew'], correctIndex: 1, explanation: 'Pikachu.'},
    {question: 'Anime de hermanos Elric', options: ['Hunter x Hunter', 'Fullmetal Alchemist', 'D.Gray-man', 'Blue Exorcist'], correctIndex: 1, explanation: 'Fullmetal Alchemist.'},
    {question: 'Shonen está orientado a', options: ['Adultos', 'Chicas jóvenes', 'Chicos jóvenes', 'Niños pequeños'], correctIndex: 2, explanation: 'Chicos jóvenes.'},
    {question: 'Familia Forger aparece en', options: ['Jujutsu Kaisen', 'Spy x Family', 'Haikyuu!!', 'Dr. Stone'], correctIndex: 1, explanation: 'Spy x Family.'},
    {question: 'Tanjiro es protagonista de', options: ['Demon Slayer', 'Tokyo Ghoul', 'Claymore', 'Inuyasha'], correctIndex: 0, explanation: 'Demon Slayer.'},
  ],
  videojuegos: [
    {question: 'Compañía creadora de Mario', options: ['Sega', 'Nintendo', 'Sony', 'Capcom'], correctIndex: 1, explanation: 'Nintendo.'},
    {question: 'Consola Sony actual', options: ['PS4', 'PS5', 'PS3', 'Vita'], correctIndex: 1, explanation: 'PS5.'},
    {question: 'Sandbox de bloques más vendido', options: ['Roblox', 'Terraria', 'Minecraft', 'Fortnite'], correctIndex: 2, explanation: 'Minecraft.'},
    {question: 'Battle royale de Epic', options: ['Apex', 'Fortnite', 'PUBG', 'Warzone'], correctIndex: 1, explanation: 'Fortnite.'},
    {question: 'Saga de Link', options: ['Final Fantasy', 'Zelda', 'Elder Scrolls', 'Kingdom Hearts'], correctIndex: 1, explanation: 'The Legend of Zelda.'},
    {question: 'Plataforma de Valve', options: ['Origin', 'Uplay', 'Steam', 'GOG'], correctIndex: 2, explanation: 'Steam.'},
    {question: 'Juego de Lands Between', options: ['Dark Souls 3', 'Sekiro', 'Elden Ring', 'Bloodborne'], correctIndex: 2, explanation: 'Elden Ring.'},
    {question: 'League of Legends es un', options: ['FPS', 'MOBA', 'RPG', 'RTS'], correctIndex: 1, explanation: 'MOBA.'},
    {question: 'Rival clásico de Mario', options: ['Wario', 'Luigi', 'Yoshi', 'Toad'], correctIndex: 0, explanation: 'Wario.'},
    {question: 'Juego que explotó el BR moderno', options: ['PUBG', 'H1Z1', 'Apex', 'Valorant'], correctIndex: 0, explanation: 'PUBG.'},
    {question: 'Nombre de saga EA fútbol desde 2023', options: ['PES', 'FC', 'FIFA Street', 'Top Spin'], correctIndex: 1, explanation: 'EA Sports FC.'},
    {question: 'Plataforma líder de streaming gaming', options: ['Netflix', 'Twitch', 'Vimeo', 'Deezer'], correctIndex: 1, explanation: 'Twitch.'},
  ],
  misterio: [
    {question: 'Triángulo famoso de desapariciones', options: ['Coral', 'Bermudas', 'Drake', 'Negro'], correctIndex: 1, explanation: 'Bermudas.'},
    {question: 'Lago asociado a Nessie', options: ['Morar', 'Ness', 'Lomond', 'Tay'], correctIndex: 1, explanation: 'Loch Ness.'},
    {question: 'Stonehenge pertenece a cultura', options: ['Maya', 'Neolítica británica', 'Romana', 'Vikinga'], correctIndex: 1, explanation: 'Neolítica británica.'},
    {question: 'Críptido del Himalaya', options: ['Bigfoot', 'Yeti', 'Mokele', 'Chupacabras'], correctIndex: 1, explanation: 'Yeti.'},
    {question: 'Barco hallado sin tripulación en 1872', options: ['Beagle', 'Mary Celeste', 'Endurance', 'Bounty'], correctIndex: 1, explanation: 'Mary Celeste.'},
    {question: 'Líneas misteriosas del Perú', options: ['Cusco', 'Nazca', 'Arequipa', 'Puno'], correctIndex: 1, explanation: 'Nazca.'},
    {question: 'Manuscrito medieval sin descifrar', options: ['Rosetta', 'Voynich', 'Codex Gigas', 'Dead Sea'], correctIndex: 1, explanation: 'Voynich.'},
    {question: 'Críptido norteamericano famoso', options: ['Yeti', 'Bigfoot', 'Kraken', 'Mothman'], correctIndex: 1, explanation: 'Bigfoot.'},
    {question: 'Isla famosa por moáis', options: ['Chiloé', 'Pascua', 'Juan Fernández', 'Tierra del Fuego'], correctIndex: 1, explanation: 'Isla de Pascua.'},
    {question: 'Luces de Hessdalen se reportan en', options: ['Noruega', 'Canadá', 'Perú', 'India'], correctIndex: 0, explanation: 'Noruega.'},
    {question: 'Detective de Conan Doyle', options: ['Poirot', 'Holmes', 'Lupin', 'Marlowe'], correctIndex: 1, explanation: 'Sherlock Holmes.'},
    {question: 'Base militar ligada a teorías OVNI', options: ['Area 51', 'Pentágono Sur', 'Base Echo', 'Camp Delta'], correctIndex: 0, explanation: 'Area 51.'},
  ],
  'conocimiento general': [
    {question: 'Días de un año bisiesto', options: ['364', '365', '366', '367'], correctIndex: 2, explanation: '366 días.'},
    {question: 'Planeta más cercano al Sol', options: ['Venus', 'Mercurio', 'Tierra', 'Marte'], correctIndex: 1, explanation: 'Mercurio.'},
    {question: 'Animal terrestre más rápido', options: ['León', 'Guepardo', 'Antílope', 'Caballo'], correctIndex: 1, explanation: 'Guepardo.'},
    {question: 'Capital de Italia', options: ['Milán', 'Roma', 'Nápoles', 'Turín'], correctIndex: 1, explanation: 'Roma.'},
    {question: 'Instrumento con teclas blancas y negras', options: ['Guitarra', 'Piano', 'Violín', 'Flauta'], correctIndex: 1, explanation: 'Piano.'},
    {question: 'Minutos de una hora', options: ['50', '60', '70', '100'], correctIndex: 1, explanation: '60 minutos.'},
    {question: 'Metal líquido a temperatura ambiente', options: ['Hierro', 'Mercurio', 'Aluminio', 'Plomo'], correctIndex: 1, explanation: 'Mercurio.'},
    {question: 'Idioma oficial de Brasil', options: ['Español', 'Portugués', 'Inglés', 'Francés'], correctIndex: 1, explanation: 'Portugués.'},
    {question: 'Órgano principal para respirar', options: ['Corazón', 'Pulmones', 'Estómago', 'Páncreas'], correctIndex: 1, explanation: 'Pulmones.'},
    {question: 'Patas de una araña', options: ['6', '8', '10', '12'], correctIndex: 1, explanation: '8 patas.'},
    {question: 'Estrella central del sistema solar', options: ['Sirio', 'Sol', 'Polaris', 'Betelgeuse'], correctIndex: 1, explanation: 'El Sol.'},
    {question: 'País con forma de bota en Europa', options: ['Grecia', 'Italia', 'Portugal', 'Croacia'], correctIndex: 1, explanation: 'Italia.'},
  ],
};

const TITLE_PATTERNS = [
  '12 PREGUNTAS IMPOSIBLES DE {TOPIC} – ¿Podrás acertar todas?',
  'Solo el 1% puede acertar estas preguntas de {TOPIC}',
  'Demuestra tu inteligencia con este quiz de {TOPIC}',
] as const;

export const generateSpanishQuizVideos = (): QuizVideoPayload[] => {
  return Array.from({length: 50}, (_, i) => {
    const topic = TOPICS[i % TOPICS.length];
    const bank = BANK[topic];

    const questions = bank.map((item, idx) => {
      const difficulty = idx < 4 ? 'easy' : idx < 8 ? 'medium' : 'hard';
      return {
        id: idx + 1,
        question: `${item.question} (V${i + 1})`,
        options: item.options,
        correct_index: item.correctIndex,
        explanation: item.explanation,
        difficulty,
        duration_frames: 1350,
      } as const;
    });

    const title = TITLE_PATTERNS[i % TITLE_PATTERNS.length].replace('{TOPIC}', topic.toUpperCase());

    return {
      video: {
        id: `quiz-${String(i + 1).padStart(3, '0')}`,
        title,
        description: buildSeoDescription(topic, title),
        tags: buildTags(topic),
        hashtags: buildHashtags(topic),
        duration_seconds: 550,
        difficulty: 'mixed',
        topic,
        language: 'es',
        target_audience: 'general',
      },
      intro: {
        text: `¡Bienvenido al reto de ${topic}! Responde rápido y demuestra tu nivel.`,
        duration_frames: 150,
      },
      questions,
      outro: {
        text: '¿Cuántas acertaste? Escribe tu puntuación, suscríbete y vuelve para el próximo quiz.',
        duration_frames: 150,
      },
      render: {
        fps: 30,
        width: 1080,
        height: 1920,
        background_style: 'gradient',
        voice_style: 'energetic',
        music_style: 'quiz',
      },
    };
  });
};

export const spanishQuizVideos = generateSpanishQuizVideos();

export const quizRenderCatalog = buildRenderCatalog(spanishQuizVideos);
