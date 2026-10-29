/*
 * Search test catalog: no audio, no covers, only rows.
 *
 *   pnpm seed               -> refuses if the catalog already has data
 *   pnpm seed --reset       -> wipes Music / Album / Artist first
 *   pnpm seed --filler=300  -> number of generated artists (default 150, 0 to disable)
 *
 * The curated part is built to exercise the search: accents (Beyoncé, Sigur Rós),
 * features (Get Lucky), homonyms (two Nirvana), near names for fuzzy (Back in Black /
 * Back to Black, The Weeknd), same word in several tables (Time, Feeling Good, Homework),
 * symbols only (†, ÷, ×), numbers (1999, 21) and non-latin scripts (宇多田ヒカル, 夜に駆ける).
 * searchArtists / searchAlbum are filled by the database triggers.
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// title, then featured artists
type Track = string | [string, ...string[]];

interface SeedAlbum {
	name: string;
	year: number;
	tracks: Track[];
}

interface SeedArtist {
	name: string;
	bio?: string;
	albums?: SeedAlbum[];
	singles?: Track[];
}

const CATALOG: SeedArtist[] = [
	{
		name: "Daft Punk",
		bio: "French electronic duo formed in Paris in 1993 by Thomas Bangalter and Guy-Manuel de Homem-Christo.",
		albums: [
			{ name: "Homework", year: 1997, tracks: ["Revolution 909", "Da Funk", "Around the World", "Rollin' & Scratchin'", "Burnin'", "Homework"] },
			{ name: "Discovery", year: 2001, tracks: ["One More Time", "Aerodynamic", "Digital Love", "Harder, Better, Faster, Stronger", "Something About Us", "Veridis Quo"] },
			{
				name: "Random Access Memories",
				year: 2013,
				tracks: [
					"Give Life Back to Music",
					["Instant Crush", "Julian Casablancas"],
					["Lose Yourself to Dance", "Pharrell Williams", "Nile Rodgers"],
					["Get Lucky", "Pharrell Williams", "Nile Rodgers"],
					"Touch",
					"Contact",
				],
			},
		],
	},
	{
		name: "The Weeknd",
		bio: "Canadian singer Abel Tesfaye.",
		albums: [
			{ name: "After Hours", year: 2020, tracks: ["Alone Again", "Blinding Lights", "In Your Eyes", "Save Your Tears", "Heartless", "After Hours"] },
			{ name: "Starboy", year: 2016, tracks: [["Starboy", "Daft Punk"], ["I Feel It Coming", "Daft Punk"], "Party Monster", "Reminder"] },
		],
	},
	{
		name: "Beyoncé",
		bio: "American singer, songwriter and businesswoman.",
		albums: [
			{ name: "Lemonade", year: 2016, tracks: ["Formation", "Hold Up", "Sorry", ["Freedom", "Kendrick Lamar"]] },
			{ name: "Renaissance", year: 2022, tracks: ["Break My Soul", "Cuff It", "Alien Superstar", "Virgo's Groove"] },
		],
	},
	{
		name: "Stromae",
		bio: "Belgian singer Paul Van Haver.",
		albums: [
			{ name: "Cheese", year: 2010, tracks: ["Alors on danse", "Te quiero", "House'llelujah"] },
			{ name: "Racine carrée", year: 2013, tracks: ["Papaoutai", "Formidable", "Tous les mêmes", "Ta fête", "Quand c'est ?"] },
			{ name: "Multitude", year: 2022, tracks: ["Santé", "L'enfer", "Fils de joie", "Invaincu"] },
		],
	},
	{
		name: "Björk",
		albums: [
			{ name: "Debut", year: 1993, tracks: ["Human Behaviour", "Venus as a Boy", "Big Time Sensuality"] },
			{ name: "Homogenic", year: 1997, tracks: ["Hunter", "Jóga", "Bachelorette", "All Is Full of Love"] },
		],
	},
	{
		name: "Sigur Rós",
		bio: "Icelandic post-rock band from Reykjavík.",
		albums: [
			{ name: "Ágætis byrjun", year: 1999, tracks: ["Svefn-g-englar", "Starálfur", "Viðrar vel til loftárása"] },
			{ name: "Takk...", year: 2005, tracks: ["Glósóli", "Hoppípolla", "Sæglópur"] },
		],
	},
	{ name: "Mötley Crüe", albums: [{ name: "Dr. Feelgood", year: 1989, tracks: ["Dr. Feelgood", "Kickstart My Heart", "Without You"] }] },
	{ name: "Motörhead", albums: [{ name: "Ace of Spades", year: 1980, tracks: ["Ace of Spades", "Love Me Like a Reptile"] }] },
	{
		name: "AC/DC",
		albums: [
			{ name: "Back in Black", year: 1980, tracks: ["Hells Bells", "Shoot to Thrill", "Back in Black", "You Shook Me All Night Long"] },
			{ name: "Highway to Hell", year: 1979, tracks: ["Highway to Hell", "Touch Too Much"] },
		],
	},
	{
		name: "Amy Winehouse",
		albums: [{ name: "Back to Black", year: 2006, tracks: ["Rehab", "You Know I'm No Good", "Back to Black", "Tears Dry on Their Own"] }],
	},
	{ name: "Guns N' Roses", albums: [{ name: "Appetite for Destruction", year: 1987, tracks: ["Welcome to the Jungle", "Sweet Child o' Mine", "Paradise City"] }] },
	{
		name: "Queen",
		albums: [
			{ name: "A Night at the Opera", year: 1975, tracks: ["Bohemian Rhapsody", "Love of My Life", "You're My Best Friend"] },
			{ name: "News of the World", year: 1977, tracks: ["We Will Rock You", "We Are the Champions"] },
		],
	},
	{
		name: "The Beatles",
		albums: [
			{ name: "Revolver", year: 1966, tracks: ["Taxman", "Eleanor Rigby", "Yellow Submarine"] },
			{ name: "Abbey Road", year: 1969, tracks: ["Come Together", "Something", "Here Comes the Sun", "Octopus's Garden"] },
		],
	},
	{
		name: "Pink Floyd",
		albums: [
			{ name: "The Dark Side of the Moon", year: 1973, tracks: ["Speak to Me", "Breathe", "Time", "Money", "Us and Them", "Brain Damage", "Eclipse"] },
			{ name: "The Wall", year: 1979, tracks: ["Another Brick in the Wall, Pt. 2", "Comfortably Numb", "Hey You"] },
		],
	},
	{
		name: "Radiohead",
		albums: [
			{ name: "OK Computer", year: 1997, tracks: ["Airbag", "Paranoid Android", "Karma Police", "No Surprises"] },
			{ name: "Kid A", year: 2000, tracks: ["Everything in Its Right Place", "Kid A", "Idioteque"] },
			{ name: "In Rainbows", year: 2007, tracks: ["15 Step", "Nude", "Weird Fishes/Arpeggi", "Reckoner"] },
		],
	},
	{
		name: "Nirvana",
		bio: "American grunge band from Aberdeen, Washington.",
		albums: [{ name: "Nevermind", year: 1991, tracks: ["Smells Like Teen Spirit", "In Bloom", "Come as You Are", "Lithium"] }],
	},
	{
		name: "Nirvana",
		bio: "British psychedelic pop band formed in London in 1967.",
		albums: [{ name: "The Story of Simon Simopath", year: 1968, tracks: ["Wings of Love", "Pentecost Hotel"] }],
	},
	{
		name: "Michael Jackson",
		albums: [
			{ name: "Thriller", year: 1982, tracks: ["Wanna Be Startin' Somethin'", "Thriller", "Beat It", "Billie Jean", "Human Nature"] },
			{ name: "Bad", year: 1987, tracks: ["Bad", "Smooth Criminal", "Man in the Mirror"] },
		],
	},
	{
		name: "Prince",
		albums: [
			{ name: "1999", year: 1982, tracks: ["1999", "Little Red Corvette", "Delirious"] },
			{ name: "Purple Rain", year: 1984, tracks: ["Let's Go Crazy", "When Doves Cry", "Purple Rain"] },
		],
	},
	{ name: "Phoenix", albums: [{ name: "Wolfgang Amadeus Phoenix", year: 2009, tracks: ["Lisztomania", "1901", "Love Like a Sunset"] }] },
	{
		name: "Taylor Swift",
		albums: [
			{ name: "1989", year: 2014, tracks: ["Blank Space", "Style", "Shake It Off", ["Bad Blood", "Kendrick Lamar"]] },
			{ name: "folklore", year: 2020, tracks: ["cardigan", ["exile", "Bon Iver"], "august"] },
		],
	},
	{
		name: "Kendrick Lamar",
		albums: [
			{ name: "good kid, m.A.A.d city", year: 2012, tracks: ["Money Trees", "Swimming Pools (Drank)", ["Poetic Justice", "Drake"]] },
			{ name: "To Pimp a Butterfly", year: 2015, tracks: ["King Kunta", "Alright", "The Blacker the Berry"] },
			{ name: "DAMN.", year: 2017, tracks: ["DNA.", "HUMBLE.", ["LOYALTY.", "Rihanna"]] },
		],
	},
	{
		name: "Drake",
		albums: [
			{ name: "Views", year: 2016, tracks: ["One Dance", "Hotline Bling", "Controlla"] },
			{ name: "Scorpion", year: 2018, tracks: ["God's Plan", "In My Feelings", "Nice for What"] },
		],
	},
	{
		name: "Rihanna",
		albums: [
			{ name: "Loud", year: 2010, tracks: ["Only Girl (In the World)", ["What's My Name?", "Drake"], "S&M"] },
			{ name: "Anti", year: 2016, tracks: [["Work", "Drake"], "Needed Me", "Love on the Brain"] },
		],
	},
	{
		name: "Bon Iver",
		albums: [
			{ name: "For Emma, Forever Ago", year: 2007, tracks: ["Flume", "Skinny Love", "Re: Stacks"] },
			{ name: "Bon Iver, Bon Iver", year: 2011, tracks: ["Perth", "Holocene"] },
		],
	},
	{ name: "Pharrell Williams", albums: [{ name: "G I R L", year: 2014, tracks: ["Happy", "Marilyn Monroe"] }] },
	{ name: "Nile Rodgers", bio: "Guitarist, co-founder of Chic." },
	{ name: "The Strokes", albums: [{ name: "Is This It", year: 2001, tracks: ["Is This It", "Someday", "Last Nite", "Hard to Explain"] }] },
	{ name: "Julian Casablancas", bio: "Lead singer of The Strokes." },
	{
		name: "Bob Marley & The Wailers",
		albums: [{ name: "Legend", year: 1984, tracks: ["Is This Love", "No Woman, No Cry", "Three Little Birds", "Redemption Song", "One Love/People Get Ready"] }],
	},
	{
		name: "Édith Piaf",
		bio: "Chanteuse française, la Môme.",
		albums: [{ name: "La Vie en rose", year: 1947, tracks: ["La Vie en rose", "Hymne à l'amour", "Milord", "Non, je ne regrette rien"] }],
	},
	{ name: "Louis Armstrong", albums: [{ name: "What a Wonderful World", year: 1968, tracks: ["What a Wonderful World", "La Vie en rose", "Hello, Dolly!"] }] },
	{
		name: "Céline Dion",
		albums: [
			{ name: "D'eux", year: 1995, tracks: ["Pour que tu m'aimes encore", "Je sais pas"] },
			{ name: "Let's Talk About Love", year: 1997, tracks: ["My Heart Will Go On"] },
		],
	},
	{ name: "Jacques Brel", albums: [{ name: "Ne me quitte pas", year: 1972, tracks: ["Ne me quitte pas", "Amsterdam", "Quand on n'a que l'amour"] }] },
	{ name: "Serge Gainsbourg", albums: [{ name: "Histoire de Melody Nelson", year: 1971, tracks: ["Melody", "Ballade de Melody Nelson", "Cargo culte"] }] },
	{
		name: "Angèle",
		albums: [
			{ name: "Brol", year: 2018, tracks: ["La Thune", "Balance ton quoi", ["Tout oublier", "Roméo Elvis"]] },
			{ name: "Nonante-Cinq", year: 2021, tracks: ["Bruxelles je t'aime", ["Démons", "Damso"]] },
		],
	},
	{ name: "Roméo Elvis", albums: [{ name: "Chocolat", year: 2019, tracks: ["Malade", "Soleil"] }] },
	{ name: "Damso", albums: [{ name: "Ipséité", year: 2017, tracks: ["Macarena", "Signaler"] }, { name: "Lithopédion", year: 2018, tracks: ["Mosaïque solitaire", "Smog"] }] },
	{
		name: "PNL",
		albums: [
			{ name: "Dans la légende", year: 2016, tracks: ["DA", "Naha", "Jusqu'au dernier gramme"] },
			{ name: "Deux frères", year: 2019, tracks: ["Au DD", "Deux frères", "Celsius"] },
		],
	},
	{
		name: "Orelsan",
		albums: [
			{ name: "La fête est finie", year: 2017, tracks: ["Basique", "Tout va bien", "La fête est finie"] },
			{ name: "Civilisation", year: 2021, tracks: ["L'odeur de l'essence", "Jour meilleur"] },
		],
	},
	{ name: "Aya Nakamura", albums: [{ name: "Nakamura", year: 2018, tracks: ["Djadja", "Copines", "Pookie"] }] },
	{ name: "Christine and the Queens", albums: [{ name: "Chaleur humaine", year: 2014, tracks: ["Tilted", "Saint Claude", "Christine"] }] },
	{
		name: "Justice",
		albums: [
			{ name: "†", year: 2007, tracks: ["Genesis", "D.A.N.C.E.", "Phantom"] },
			{ name: "Woman", year: 2016, tracks: ["Safe and Sound"] },
		],
	},
	{ name: "Air", albums: [{ name: "Moon Safari", year: 1998, tracks: ["La femme d'argent", "Sexy Boy", "Kelly Watch the Stars"] }] },
	{
		name: "Coldplay",
		albums: [
			{ name: "Parachutes", year: 2000, tracks: ["Shiver", "Yellow", "Trouble"] },
			{ name: "A Rush of Blood to the Head", year: 2002, tracks: ["In My Place", "The Scientist", "Clocks"] },
			{ name: "Viva la Vida or Death and All His Friends", year: 2008, tracks: ["Lovers in Japan", "Viva la Vida", "Violet Hill"] },
		],
	},
	{
		name: "Muse",
		albums: [
			{ name: "Origin of Symmetry", year: 2001, tracks: ["New Born", "Plug In Baby", "Feeling Good"] },
			{ name: "Black Holes and Revelations", year: 2006, tracks: ["Starlight", "Supermassive Black Hole", "Knights of Cydonia"] },
		],
	},
	{ name: "Nina Simone", albums: [{ name: "I Put a Spell on You", year: 1965, tracks: ["I Put a Spell on You", "Feeling Good"] }] },
	{
		name: "Arctic Monkeys",
		albums: [
			{ name: "Whatever People Say I Am, That's What I'm Not", year: 2006, tracks: ["I Bet You Look Good on the Dancefloor", "Mardy Bum"] },
			{ name: "AM", year: 2013, tracks: ["Do I Wanna Know?", "R U Mine?", "Why'd You Only Call Me When You're High?"] },
		],
	},
	{
		name: "Billie Eilish",
		albums: [
			{ name: "When We All Fall Asleep, Where Do We Go?", year: 2019, tracks: ["bad guy", "bury a friend", "when the party's over"] },
			{ name: "Happier Than Ever", year: 2021, tracks: ["NDA", "Happier Than Ever"] },
		],
	},
	{ name: "Dua Lipa", albums: [{ name: "Future Nostalgia", year: 2020, tracks: ["Don't Start Now", "Physical", "Levitating"] }] },
	{
		name: "Ed Sheeran",
		albums: [
			{ name: "×", year: 2014, tracks: ["Sing", "Thinking Out Loud"] },
			{ name: "÷", year: 2017, tracks: ["Castle on the Hill", "Shape of You", "Perfect"] },
		],
	},
	{
		name: "Adele",
		albums: [
			{ name: "21", year: 2011, tracks: ["Rolling in the Deep", "Someone Like You", "Set Fire to the Rain"] },
			{ name: "25", year: 2015, tracks: ["Hello", "Send My Love (To Your New Lover)"] },
			{ name: "30", year: 2021, tracks: ["Easy on Me"] },
		],
	},
	{
		name: "Eminem",
		albums: [
			{ name: "The Marshall Mathers LP", year: 2000, tracks: ["The Real Slim Shady", ["Stan", "Dido"], "The Way I Am"] },
			{ name: "The Eminem Show", year: 2002, tracks: ["Without Me", ["'Till I Collapse", "Nate Dogg"]] },
		],
	},
	{ name: "Dido", albums: [{ name: "No Angel", year: 1999, tracks: ["Here with Me", "Thank You"] }] },
	{ name: "Nate Dogg" },
	{ name: "Pusha T" },
	{
		name: "Kanye West",
		albums: [{ name: "My Beautiful Dark Twisted Fantasy", year: 2010, tracks: ["Power", ["All of the Lights", "Rihanna"], ["Runaway", "Pusha T"]] }],
	},
	{
		name: "Frank Ocean",
		albums: [
			{ name: "channel ORANGE", year: 2012, tracks: ["Thinkin Bout You", "Pyramids"] },
			{ name: "Blonde", year: 2016, tracks: ["Nikes", "Pink + White", "Self Control", "Nights"] },
		],
	},
	{ name: "Tame Impala", albums: [{ name: "Currents", year: 2015, tracks: ["Let It Happen", "The Less I Know the Better", "Eventually"] }] },
	{ name: "Gorillaz", albums: [{ name: "Demon Days", year: 2005, tracks: ["Kids with Guns", "DARE", "Feel Good Inc."] }] },
	{
		name: "Metallica",
		albums: [
			{ name: "Master of Puppets", year: 1986, tracks: ["Battery", "Master of Puppets"] },
			{ name: "Metallica", year: 1991, tracks: ["Enter Sandman", "Nothing Else Matters"] },
		],
	},
	{ name: "Iron Maiden", albums: [{ name: "The Number of the Beast", year: 1982, tracks: ["Run to the Hills", "The Number of the Beast"] }] },
	{
		name: "Rammstein",
		albums: [
			{ name: "Sehnsucht", year: 1997, tracks: ["Engel", "Du hast"] },
			{ name: "Mutter", year: 2001, tracks: ["Mein Herz brennt", "Sonne", "Ich will"] },
		],
	},
	{ name: "Bad Bunny", albums: [{ name: "Un Verano Sin Ti", year: 2022, tracks: ["Tití Me Preguntó", "Me Porto Bonito", "Ojitos Lindos"] }] },
	{
		name: "Rosalía",
		albums: [
			{ name: "El mal querer", year: 2018, tracks: ["Malamente", "Pienso en tu mirá"] },
			{ name: "Motomami", year: 2022, tracks: ["Saoko", "Candy", "Despechá"] },
		],
	},
	{ name: "Shakira", albums: [{ name: "Laundry Service", year: 2001, tracks: ["Whenever, Wherever", "Underneath Your Clothes"] }] },
	{ name: "Ryuichi Sakamoto", albums: [{ name: "Merry Christmas Mr. Lawrence", year: 1983, tracks: ["Merry Christmas Mr. Lawrence"] }] },
	{
		name: "Hans Zimmer",
		albums: [
			{ name: "Inception", year: 2010, tracks: ["Dream Is Collapsing", "Time"] },
			{ name: "Interstellar", year: 2014, tracks: ["Cornfield Chase", "No Time for Caution", "S.T.A.Y."] },
		],
	},
	{ name: "Ludovico Einaudi", albums: [{ name: "Le Onde", year: 1996, tracks: ["Le onde"] }, { name: "Divenire", year: 2006, tracks: ["Divenire", "Primavera"] }] },
	{ name: "Wolfgang Amadeus Mozart", albums: [{ name: "Requiem", year: 1791, tracks: ["Dies irae", "Lacrimosa"] }] },
	{ name: "Johann Sebastian Bach", albums: [{ name: "Goldberg Variations", year: 1741, tracks: ["Aria", "Variation 1"] }] },
	{ name: "Ludwig van Beethoven", albums: [{ name: "Symphony No. 5", year: 1808, tracks: ["Allegro con brio"] }], singles: ["Für Elise"] },
	{ name: "Frédéric Chopin", albums: [{ name: "Nocturnes", year: 1832, tracks: ["Nocturne Op. 9 No. 2"] }] },
	{ name: "Miles Davis", albums: [{ name: "Kind of Blue", year: 1959, tracks: ["So What", "Freddie Freeloader", "Blue in Green", "All Blues"] }] },
	{
		name: "John Coltrane",
		albums: [
			{ name: "Giant Steps", year: 1960, tracks: ["Giant Steps", "Naima"] },
			{ name: "A Love Supreme", year: 1965, tracks: ["Acknowledgement", "Resolution"] },
		],
	},
	{ name: "Lana Del Rey", albums: [{ name: "Born to Die", year: 2012, tracks: ["Born to Die", "Video Games", "Summertime Sadness"] }] },
	{
		name: "David Bowie",
		albums: [
			{ name: "The Rise and Fall of Ziggy Stardust and the Spiders from Mars", year: 1972, tracks: ["Five Years", "Starman", "Ziggy Stardust"] },
			{ name: "\"Heroes\"", year: 1977, tracks: ["\"Heroes\""] },
		],
	},
	{ name: "Fleetwood Mac", albums: [{ name: "Rumours", year: 1977, tracks: ["Dreams", "The Chain", "Go Your Own Way"] }] },
	{ name: "ABBA", albums: [{ name: "Arrival", year: 1976, tracks: ["Dancing Queen", "Money, Money, Money", "Knowing Me, Knowing You"] }] },
	{
		name: "BTS",
		albums: [
			{ name: "Map of the Soul: 7", year: 2020, tracks: ["Black Swan", "ON"] },
			{ name: "BE", year: 2020, tracks: ["Life Goes On", "Dynamite"] },
		],
	},
	{ name: "BLACKPINK", albums: [{ name: "The Album", year: 2020, tracks: ["How You Like That", "Lovesick Girls"] }] },
	{ name: "宇多田ヒカル", bio: "Utada Hikaru, Japanese singer-songwriter.", albums: [{ name: "First Love", year: 1999, tracks: ["Automatic", "First Love"] }] },
	{ name: "YOASOBI", albums: [{ name: "THE BOOK", year: 2021, tracks: ["夜に駆ける", "群青", "ハルジオン"] }] },
	{ name: "Fairuz", bio: "فيروز, Lebanese singer.", singles: ["Li Beirut", "Nassam Alayna El Hawa"] },
	{ name: "P!nk", albums: [{ name: "Funhouse", year: 2008, tracks: ["So What", "Sober"] }] },
	{ name: "Sia", singles: ["Chandelier", "Cheap Thrills", "Unstoppable"] },
	{ name: "Lizzo", singles: ["Juice", "About Damn Time"] },
	{
		name: "Various Artists",
		bio: "Compilations.",
		albums: [{ name: "Now That's What I Call Music! 100", year: 2018, tracks: ["Intro", "Interlude", "Outro", "Untitled", "Track 1", "Track 2"] }],
	},
];

// Rows with no artist at all, a common case after an upload without metadata
const ORPHANS = ["Untitled", "Intro", "Unknown Track", "Enregistrement 001", "New Recording 12", "audio_final_v2", "Sans titre"];

const FILLER_WORDS = {
	adjectives: ["Electric", "Midnight", "Golden", "Silent", "Neon", "Broken", "Velvet", "Crystal", "Wild", "Lonely", "Burning", "Frozen", "Hidden", "Crimson", "Endless", "Lost", "Sacred", "Savage", "Gentle", "Hollow", "Cosmic", "Rusty", "Bitter", "Sweet", "Ancient", "Electrique", "Éternel", "Sombre", "Brûlant", "Doux"],
	nouns: ["Dreams", "Heart", "Ocean", "River", "Fire", "Shadow", "City", "Night", "Sun", "Moon", "Stars", "Rain", "Storm", "Road", "Mirror", "Garden", "Ghost", "Wolves", "Echoes", "Waves", "Horizon", "Desert", "Machine", "Paradise", "Kingdom", "Lumière", "Cœur", "Rêve", "Été", "Forêt"],
	places: ["Paris", "Lyon", "Tokyo", "Berlin", "Brooklyn", "Montréal", "Bruxelles", "Lagos", "Seoul", "Detroit", "Marseille", "Reykjavík", "São Paulo", "Kingston", "Nashville"],
	first: ["Léa", "Hugo", "Chloé", "Nina", "Max", "Sam", "Jules", "Inès", "Noah", "Zoé", "Oscar", "Maya", "Liam", "Jade", "Elias", "Rosa", "Tom", "Lou", "Anaïs", "Kenji"],
	last: ["Martin", "Bernard", "Dubois", "Moreau", "Laurent", "Rivera", "Kim", "Okafor", "Nakamura", "Schmidt", "Rossi", "Silva", "Novak", "Jensen", "Müller", "Lefèvre", "Garcia", "Haddad"],
	suffixes: ["", "", "", " (Remix)", " (Live)", " (Acoustic)", " - Radio Edit", " (feat. Unknown)", " Pt. 2", " (Demo)", " (Remastered 2011)", " (Extended Mix)"],
};

// mulberry32: deterministic so two seeds give the same catalog
const rng = (() => {
	let state = 0x2a2a2a2a;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
})();

const pick = <T>(list: T[]) => list[Math.floor(rng() * list.length)];
const between = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

function fillerArtistName() {
	const { adjectives, nouns, places, first, last } = FILLER_WORDS;
	switch (between(0, 5)) {
		case 0: return `${pick(first)} ${pick(last)}`;
		case 1: return `The ${pick(adjectives)} ${pick(nouns)}`;
		case 2: return `${pick(nouns)} of ${pick(places)}`;
		case 3: return `DJ ${pick(first)}`;
		case 4: return `${pick(first)} & the ${pick(nouns)}`;
		default: return `${pick(adjectives)}${pick(nouns).toLowerCase()}`;
	}
}

function fillerTitle() {
	const { adjectives, nouns, places, suffixes } = FILLER_WORDS;
	const base = (() => {
		switch (between(0, 5)) {
			case 0: return `${pick(adjectives)} ${pick(nouns)}`;
			case 1: return `${pick(nouns)} in ${pick(places)}`;
			case 2: return `The ${pick(nouns)}`;
			case 3: return `${pick(adjectives)} ${pick(adjectives)} ${pick(nouns)}`;
			case 4: return `${pick(nouns)} & ${pick(nouns)}`;
			default: return `${pick(places)} ${between(1990, 2025)}`;
		}
	})();
	return base + pick(suffixes);
}

function fillerCatalog(count: number, featurable: string[]): SeedArtist[] {
	const used = new Set<string>();
	const artists: SeedArtist[] = [];

	while (artists.length < count) {
		const name = fillerArtistName();
		if (used.has(name)) continue;
		used.add(name);

		const albums = Array.from({ length: between(0, 3) }, () => ({
			name: fillerTitle(),
			year: between(1965, 2025),
			tracks: Array.from({ length: between(4, 14) }, (): Track => {
				const title = fillerTitle();
				return rng() < 0.12 ? [title, pick([...featurable, ...used])] : title;
			}),
		}));
		const singles = Array.from({ length: between(albums.length === 0 ? 1 : 0, 3) }, fillerTitle);
		artists.push({ name, albums, singles, bio: rng() < 0.3 ? `${pick(FILLER_WORDS.adjectives)} sounds from ${pick(FILLER_WORDS.places)}.` : undefined });
	}
	return artists;
}

const CHUNK = 1000;

async function insertChunks<T>(rows: T[], insert: (data: T[]) => Promise<unknown>) {
	for (let i = 0; i < rows.length; i += CHUNK) await insert(rows.slice(i, i + CHUNK));
}

async function main() {
	const args = process.argv.slice(2);
	const reset = args.includes("--reset");
	const fillerArg = args.find((arg) => arg.startsWith("--filler="));
	const fillerCount = fillerArg ? Number(fillerArg.split("=")[1]) : 150;
	if (!Number.isInteger(fillerCount) || fillerCount < 0) throw new Error(`Invalid --filler value: ${fillerArg}`);

	const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env["DATABASE_URL"] }) });

	try {
		const existing = await prisma.music.count() + await prisma.album.count() + await prisma.artist.count();
		if (existing > 0 && !reset) throw new Error("Catalog is not empty, run with --reset to wipe Music / Album / Artist first");
		if (reset) {
			await prisma.$transaction([prisma.music.deleteMany(), prisma.album.deleteMany(), prisma.artist.deleteMany()]);
			console.log("Catalog wiped");
		}

		const seeds = [...CATALOG, ...fillerCatalog(fillerCount, CATALOG.map((artist) => artist.name))];

		// Features point to artists by name; the first artist with that name wins (homonyms are on purpose)
		const artists: { uuid: string; name: string; biography: string | null }[] = [];
		const uuidByName = new Map<string, string>();
		const artistUuid = (name: string) => {
			let uuid = uuidByName.get(name);
			if (!uuid) {
				uuid = randomUUID();
				uuidByName.set(name, uuid);
				artists.push({ uuid, name, biography: null });
			}
			return uuid;
		};

		const albums: { uuid: string; name: string; publishedAt: Date }[] = [];
		const albumArtists: { albumUuid: string; artistUuid: string }[] = [];
		const musics: { uuid: string; name: string; duration: number; albumUuid: string | null; publishedAt: Date | null }[] = [];
		const musicArtists: { musicUuid: string; artistUuid: string }[] = [];

		const addTrack = (track: Track, mainUuid: string | null, album: { uuid: string; publishedAt: Date } | null) => {
			const [name, ...featuring] = typeof track === "string" ? [track] : track;
			const uuid = randomUUID();
			musics.push({ uuid, name, duration: between(90, 480), albumUuid: album?.uuid ?? null, publishedAt: album?.publishedAt ?? null });

			const linked = new Set([...mainUuid ? [mainUuid] : [], ...featuring.map(artistUuid)]);
			for (const artist of linked) musicArtists.push({ musicUuid: uuid, artistUuid: artist });
		};

		// Main artists are registered before any feature, so homonyms each keep their own row
		const mainUuids = seeds.map((seed) => {
			const uuid = randomUUID();
			artists.push({ uuid, name: seed.name, biography: seed.bio ?? null });
			if (!uuidByName.has(seed.name)) uuidByName.set(seed.name, uuid);
			return uuid;
		});

		seeds.forEach((seed, index) => {
			const mainUuid = mainUuids[index];
			for (const { name, year, tracks } of seed.albums ?? []) {
				const album = { uuid: randomUUID(), name, publishedAt: new Date(Date.UTC(year, between(0, 11), between(1, 28))) };
				albums.push(album);
				albumArtists.push({ albumUuid: album.uuid, artistUuid: mainUuid });
				for (const track of tracks) addTrack(track, mainUuid, album);
			}
			for (const single of seed.singles ?? []) addTrack(single, mainUuid, null);
		});
		for (const orphan of ORPHANS) addTrack(orphan, null, null);

		// Albums before musics (searchAlbum trigger on insert), links last (searchArtists triggers)
		await insertChunks(artists, (data) => prisma.artist.createMany({ data }));
		await insertChunks(albums, (data) => prisma.album.createMany({ data }));
		await insertChunks(albumArtists, (data) => prisma.albumArtist.createMany({ data }));
		await insertChunks(musics, (data) => prisma.music.createMany({ data }));
		await insertChunks(musicArtists, (data) => prisma.musicArtist.createMany({ data, skipDuplicates: true }));

		console.log(`Seeded ${artists.length} artists, ${albums.length} albums, ${musics.length} musics (${musicArtists.length} music/artist links)`);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
