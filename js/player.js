/**
 * The Kaavish Radio — Music Player & YouTube API Audio Engine
 */

const KAAVISH_PLAYLIST = [
  {
    id: "-Ot2QrjWCzg",
    title: "Bachpan",
    subtitle: "Album: Gunkali",
    artist: "The Kaavish (Jaffer Zaidi & Maaz Maudood)",
    album: "Gunkali (2005)",
    quote: "Bachpan ki yaadein, woh pyaari pyaari yaadein...",
    lyrics: `Yeh wo jagah hai jis par kabhi
Khailay thay hum tum
Mil kar sabhi
Beeti hoi unn yadon mai
Pyaari pyaari unn baaton mai
Dhoondhoon tujhe har taraf
Dhoondhoon tujhe apna khwabon mai

Yaadon mai tu
Yaadon mai tu
Yaadon mai tu
Yaadon mai tu (x2)

Masoom sae hum khushion bharay
Inn titliyon kae sung urtay chalay
Jaanay kahan yeh sab kho gaey
Ab yeh dua hai...

Yoon he rahain hum
Mil kar sabhi
Chutay na ub yeh
Saath kabhi

Iss dosti ki chaoon talay
Sab mushkilon mai hum saath chalay
Ik dosray sae khushi sabhi
Dil yeh kahay ( hoOo )

Yaadon mai tu
Yaadon mai tu
Yaadon mai tu
Yaadon mai tu

Yeh wo jagah hai jis par kabhi
Khailay thay hum tum
Mil kar sabhi
Beeti hoi unn yadon mai
Pyaari pyaari unn baaton mai
Dhoondhoon tujhe har taraf
Dhoondhoon tujhe apna khwabon mai
`
  },
  {
    id: "kfKP4o-bXzM",
    title: "Tere Pyaar Main",
    subtitle: "Album: Gunkali",
    artist: "The Kaavish (Jaffer Zaidi & Maaz Maudood)",
    album: "Gunkali (2005)",
    quote: "Yeh woh jagah hai jis par kabhi khele the hum tum mil kar sabhi...",
    lyrics: `Yeh woh jagah hai jis par kabhi
Khele the hum tum mil kar sabhi
Beeti hui unn yaadon mein
Pyaari pyaari unn baaton mein
Dhoondhoon tujhe har taraf
Dhoondhoon tujhe apne khwaabon mein...

Yaadon mein tu...
Yaadon mein tu...
Yaadon mein tu...

Masoom se hum khushiyon bhare
Inn titliyon ke sang udte chale
Jaane kahaan yeh sab kho gaye
Ab yeh dua hai
Yoonhi rahein hum mil kar sabhi

Chhoote na ab yeh saath kabhi
Iss dosti ki chhaanv tale
Sab mushkilon mein hum saath chalein
Ik doosre se khushiyan sabhi
Dil yeh kahe...

Yeh woh jagah hai jis par kabhi
Khele the hum tum mil kar sabhi...`
  },
  {
    id: "2fVGYj1dWG8",
    title: "Chand Taare",
    subtitle: "Album: Gunkali",
    artist: "The Kaavish (Jaffer Zaidi & Maaz Maudood)",
    album: "Gunkali (2005)",
    quote: "Dekho yeh chaand taare kehte hain yeh bhi saare...",
    lyrics: `Dekho ye chaand taaray
Kehte hain ye bhi saaray

Mai kahin bhi jaa basonga
Mai rahunga sang tumhare
Dil mai jou pyaar hai wou
Tere hi liay hai

Dekho ye chaand taaray
Kehte hain ye bhi saaray

Meri ye raatien kese kaatin
Tere khayalon say ye basin

Ab tu man jaa re
Mujhko na yun sata re
Dil ne ye keh dia hai
Rehna hai saang tumhare
Dil mai jou pyar hai wou
Tere hi liay hai
You might also like
Tere Pyar Mein
Kaavish
Baat Unkahi
Kaavish
Dil Main Meray
Kaavish

Dekho ye chaand taaray
Kehte hain ye bhi saaray


Baatien teri, ye yaadien teri
Chehre sajalena, de khushi


Ab tu aa bhi jaa re
Dil mera ye pukare
Wou kahin bhi jaa basega
Rahega saang tumahre
Meri jou ye wafa hai
Tere hi liay hai
Dekho ye

Dekho ye chaand taaray
Dekho ye chaand taaray
Dekho ye chaand taaray
Dekho ye chaand taaray
Dekho ye chaand taaray
Dekho ye chaand taaray
Dekho ye chaand taaray
`
  },
  {
    id: "YE2Q5T4hap8",
    title: "Chaltay Rahein",
    subtitle: "Album: Gunkali",
    artist: "The Kaavish (Jaffer Zaidi & Maaz Maudood)",
    album: "Gunkali (2005)",
    quote: "Manzil hai tu meri jaan Sunle zameen aasman...",
    lyrics: `Kaise kahein, kisse kahein?
Kehna hai kya? Chalte rahein
Jo tu nahi is morr pe
Rehna hai kya? Chalte rahein

Manzil hai tu meri jaan
Sunle zameen aasman
Toofan se ab dar nahi
Hoga Khuda meherbaan

Shaam dhale, dil ye kahe
Chalna hai kya, chalte rahein
Nadiya koi, jaise bahein
Behna hai kya, chalte rahein

Dharkan hai tu, dil hun mai
Mil jaaye to jee uthein
Badal ke aanchal tale
Aajao phir kuch kahein

Kaise kahein, kisse kahein?
Kehna hai kya? Chalte rahein
Jo tu nahi is morr pe
Rehna hai kya? Chalte rahein
You might also like
Daikho
Kaavish
Tere Pyar Mein
Kaavish
Sun Zara
Kaavish
`
  },
  {
    id: "pU5xSm335pE",
    title: "Sunn Zaraa",
    subtitle: "Album: Gunkali",
    artist: "The Kaavish (Jaffer Zaidi & Maaz Maudood)",
    album: "Gunkali (2005)",
    quote: "Yaadon ke saaye phir se ghir aaye...",
    lyrics: `[Chorus]
Sun zara! Kyun mai dooba?
Sun zara!
In naino ke saagar mein
Sapne thay, kirnein thi
Kaise naina
Sun zara! Kyun mai dooba?
Sun zara!
In naino ke saagar mein
Sapne thay, kirnein thi
Kaise naina

[Verse 1]
Armaan dil ki phulwari mein
Kaliyon ke sang jhoom rahe hain
Mar gye hum ye maan le
Yun mil gye meri jaan

[Chorus]
Sun zara! Kyun mai khoya?
Sun zara!
Is aanchal ke saaye me
Ik ghar tha chahat thi
Koi apna

[Verse 2]
Roz kisi jungle mein jaa ke
Naam darakhton par likhte the
Bann gye wo pehchan re
Khil gye dil meri jaan

[Chorus]
Sun zara! Kyun mai dooba?
Sun zara!
In naino ke sagar mein
Sapne thay, kirnein thi
Kaise naina`
  },
  {
    id: "0dqleBxqXHI",
    title: "Piya Dekho Na",
    subtitle: "Album: Gunkali",
    artist: "The Kaavish (Jaffer Zaidi & Maaz Maudood)",
    album: "Gunkali (2005)",
    quote: "Piya dekho na, rangon mein ghol di hai zindagi...",
    lyrics: `[Chorus]
Piya dekho naa
Piya dekho naa
Piya dekho naa
Piya dekho naa

[Refrain]
Tumhe mausam saare yaad karein
Mausam saare yaad karein

[Chorus]
Piya dekho naa
Piya dekho naa
Piya dekho naa
Piya dekho naa

[Verse 1]
Saavan bhaado ki barsaatein
Jaaron mai ujli chaandni raatien
Tumko yeh sab yaad karein
Mausam saare yaad karein

[Chorus]
Piya dekho naa
Piya dekho naa
Piya dekho naa
Piya dekho naa

[Verse 2]
Kheton ki sarson, rut woh dhaani
Peron sai lipti, raat ki raani
Tumko yeh sab yaad karein
Mausam saare yaad karein

[Chorus]
Piya dekho naa
Piya dekho naa
Piya dekho naa
Piya dekho naa

[Refrain]
Tumhe mausam saare yaad karein
Mausam saare yaad karein

[Chorus]
Piya dekho naa
Piya dekho naa
Piya dekho naa
Piya dekho naa`
  },
  {
    id: "vlM0AnQUzKs",
    title: "Moray Sayyaan",
    subtitle: "Album: Gunkali",
    artist: "The Kaavish (Jaffer Zaidi & Maaz Maudood)",
    album: "Gunkali (2005)",
    quote: "Piya dekho na, rangon mein ghol di hai zindagi...",
    lyrics: `[Chorus]
Moray sayyaan baydardi ho gae
Koi jaa kae unn ko manaao
Moray sayyaan

[Verse 1]
Ho qadar na jaani ho
Milnay na aaey

[Chorus]
Moray sayyaan, baydardi ho gyi
Koi jaa kae unn ko manaao
Moray sayyaan

[Verse 2]
Sayyaan ko mein nae itna bulaaya
Sayyaan ko mein nae itna bulaaya
Meri arz suni na jaye
Moray sayyaan

[Verse 3]
Dekho piya tum ab laut aao
Dekho piya tum ab laut aao
Kaheen jaan chali na jaae
Moray sayyaan`
  },
  {
    id: "VsFjP58j5i8",
    title: "Dekho",
    subtitle: "Album: Gunkali",
    artist: "The Kaavish (Jaffer Zaidi & Maaz Maudood)",
    album: "Gunkali (2005)",
    quote: "Dekho ye chaand taaray kehte hain ye bhi saare...",
    lyrics: `[Chorus]
Dekho kya kahein ye aankhein
Kya kahein ye
Socho poochhti hain ye kya
Poochhti hain
Jaan lo ye baatein
Dekh lo bheegti hain aankhein
Bheegti hain
Socho kya kahein ye aankhein

[Verse 1]
Neer bahaayen aankhon se
Neer bahaayen aankhon se
Ek jhalak ki aas lagaayen
Ek jhalak ki aas lagaayen
Dil ko yoon bahlaayen
Dil ko yoon bahlaayen

[Chorus]
Dekho chhorrh kar ye baahen
Chal diye vo socho
Kya kahein ye aankhein
Kya kahein ye

[Verse 2]
Neend na aaye raaton ko
Neend na aaye raaton ko
Yaad jo aaye dil ghabraaye
Yaad jo aaye dil ghabraaye
Teri yaad jo aaye
Teri yaad jo aaye

[Chorus]
Dekho bhool gayе vo baatein
Bhool gaye vo
Socho kya kahein yе aankhein
Kya kahein ye`
  },
  {
    id: "eo15zjtbZLo",
    title: "Dil Main Meray",
    artist: "The Kaavish (Jaffer Zaidi & Maaz Maudood)",
    album: "Gunkali (2005)",
    quote: "Dil main meray, Jou raaz hain chhupe..",
    lyrics: `Chorus]
Dil mein meray
Jou raaz hain chhupe
Aa ja kabhi
Tou sunaaun main tujhe
Dil mein meray

[Verse]
Khushiyon ki duniya mein kahin
Tere sang kho gaya
Jeevan ka har masoom pal
Tere naam ho gaya
Khushboo tere pyaar ki
Mujhmein samaa gayi

[Chorus]
Dil mein meray
Jou phool hain khile
Aa ja kabhi
Wou dikhaaun main tujhe
Dil mein meray

[Outro]
Meri dharkanon mein aaj bhi
Teri yaad saath hai
Milte kabhi hum the tujhe
Dil mein yahi aas hai
Kya ho sakega ye kabhi?
Haan agar rahi ye zindagi
Mera pyaar har pal, har ghari
Meri zindagi, meri har khushi
Meri jaan tere liye`
  },
  {
    id: "W9jc_7KjO04",
    title: "Koi Hai To Sahee",
    artist: "The Kaavish (Jaffer Zaidi & Maaz Maudood)",
    album: "Gunkali (2005)",
    quote: "Koi hai to sahee, koi hai to sahee...",
    lyrics: `[Verse 1: Maaz Maudood, Jaffer Zaidi, Both]
Aksar kabhi (Aksar kabhi)
Sochta hoon mai (Sochta hoon mai)
Sab ke liye (Sab ke liye)
Koi hai toh sahi (Koi hai toh sahi)
Pass nahi (Pass nahi)
Par kyun itnay qareeb (Par kyun itnay qareeb)
Mera koi, kyun milta hi nahi?
Kyoon milta hi nahi?

[Chorus: Jaffer Zaidi, Maaz Maudood]
Koi hai toh sahi, koi hai toh sahi
Koi hai toh sahi, koi hai toh sahi
Koi hai toh sahi, koi hai toh sahi
Koi hai toh sahi, koi hai toh sahi

[Verse 2: Maaz Maudood, Jaffer Zaidi, Both]
Mehsoos ho (Mehsoos ho)
Ke sab kuch hai wohi (Ke sab kuch hai wohi)
Jis ki khushi (Jis ki khushi)
Se meri zindagi (Se meri zindagi)
Jis se nazar (Jis se nazar)
Kabhi hat'ti hi nahi (Kabhi hat'ti hi nahi)
Kyun yeh lagay jab thehray ajnabi
Jab thehray ajnabi

[Chorus: Jaffer Zaidi, Maaz Maudood]
Koi hai toh sahi, koi hai toh sahi
Koi hai toh sahi, koi hai toh sahi
Koi hai toh sahi, koi hai toh sahi
Koi hai toh sahi, koi hai toh sahi`


  },
  {
    id: "0jrikeZ7a5k",
    title: "Tere Pyaar Mein",
    subtitle: "Album: Gunkali",
    artist: "The Kaavish",
    album: "Gunkali (2005)",
    quote: "Tere pyaar mein dil haar ke maine kya paaya, kya gawaaya...",
    lyrics: `[Chorus]
Tere pyaar mein
Dil haar kay
Mein nai kya paaya
Kya gawaaya

[Verse 1]
Tujh ko chaaha
Tujh ko pooja
Mai nae tujhe dil mai basaaya
Tere liyay aye bewafa
Kaisay jiya haye
Kya kya kiya

[Chorus]
Tere pyaar mein
Dil haar kay
Mai nai kya paaya
Kya gawaaya

[Verse 2]
Teri yaadein
Woh saari baatain
Tu he bata kaisay bhulaaoon
Kis sae kahoon aye bewafa
Dil kis tarhaan haye
Toota mera

[Chorus]
Tere pyaar mein
Dil haar kay
Mai nai kya paaya
Kya gawaaya`
  },
  {
    id: "S0JEU3aRNSg",
    title: "Dareecha OST",
    artist: "The Kaavish",
    album: "Dareecha (2011)",
    quote: "Dareecha",
    lyrics: `Galion pe chaya hua hai
Dhuaan
Gum hain maazi ke
Nam-o-Nishaan
Galion pe chaya hua hai
Dhuaan
Gum hain maazi ke
Nam-o-Nishaan
Haaveli ke peechey
Kaachi puliyea taaley
Suyion mein soyi hui hai
Guriyaa
Galion pe chaya hua hai
Dhuaan
Gum hain maazi ke

Nam-o-Nishaan
Thandey chand ki
Raaton mein
Thamti Chalti Saanson mein
Chonk jaatey hain
Dareechey
Dharak jati hain seeriyan
Galion pe chaya hua hai
Dhuaan
Gum hain maazi ke
Nam-o-Nishaan
Seenay mein jam gai hai, Aag
Barf ki trhan, Pighalti nahi
Keerchiyan hain Maazi ki
Chubhti hain dil mein, niklati nhi
Galion pe chaya hua hai
Dhuaan
Gum hain maazi ke
Nam-o-Nishaan`
  },
  {
    id: "nAIxCBm3ULk",
    title: "Nindiya Re",
    subtitle: "Coke Studio Season 4",
    artist: "The Kaavish",
    album: "Coke Studio (2011)",
    quote: "Haule haule raaton ko chupke se aaja re... nindiya re",
    lyrics: `Haule haule raaton ko chupke se aaja re
Nindiya re nindiya re
Akhiyon mein samaaja re
Nindiya re
Nindiya re
Nindiya re
Nindiya re


Kahin door sitaaron pih
chanda ke ishaaron pih
Palne ko tere jo pariyon ne jhulaaya re
Nindiya re
Nindiya rey..

Nindiya re
Nindiya re


Jugnu panchi pyaare pyaare
Tere sapne bune
Neend bhari inn aankhon se teri
Chupke se kahte rahein
Sojaa re soja re
Sapno mein khoja re
Sojaa re soja re
Sapno mein khoja re
Nindiya re
Nindiya re
Nindiya re

Nindiya re`
  },
  {
    id: "SGjJn_QNXEs",
    title: "Nindiya Re-Studio Version",
    subtitle: "Studio Version",
    artist: "The Kaavish",
    album: "Nindiya Re-Studio Version",
    quote: "Haule haule raaton ko chupke se aaja re... nindiya re",
    lyrics: `Haule haule raaton ko chupke se aaja re
Nindiya re nindiya re
Akhiyon mein samaaja re
Nindiya re
Nindiya re
Nindiya re
Nindiya re


Kahin door sitaaron pih
chanda ke ishaaron pih
Palne ko tere jo pariyon ne jhulaaya re
Nindiya re
Nindiya rey..

Nindiya re
Nindiya re


Jugnu panchi pyaare pyaare
Tere sapne bune
Neend bhari inn aankhon se teri
Chupke se kahte rahein
Sojaa re soja re
Sapno mein khoja re
Sojaa re soja re
Sapno mein khoja re
Nindiya re
Nindiya re
Nindiya re

Nindiya re`
  },

  {
    id: "rn9aNVsABvc",
    title: "Baat Unkahi",
    artist: "The Kaavish feat. Samra Khan",
    album: "Gali main chaand nikla",
    quote: "Dil sae yeh poochay koi.. Guzri hai kya?",
    lyrics: `[Verse 1]
Tujh sae shuru
Tujh pae khatam
Meri zindagi ki daastaan
Ho...
Rooth gaee
Tu mujh sae
Aagaee hai duri darmiyaan
Ho...

Jo kuch mera hain
Tere liyay hai
Jaoon mein tere bin kahan
Lay chal mujhe tu
Aisee jagah pae
Pyaar he tera ho jahan

[Verse 2]
Tere pyaar main
Intizaar main
Khud ko fana mein kar gaee
Ho...
Chaahatain meri
Tujh sae he theen
Par ab woh baatain na raheen
O...

Ja ja kae aaee
Waapas yaheen pae
Reh na saki mein bin tere
Khushiyan bhi rootheen
Sapne bhi tootay
Saath raha na tu mere

[Verse 3]
Dil sae yeh poochay koi
Guzri hai kya
Bhujtay diay sae koi
Poochay zaraa
Chaahat kae darya main
Maujain hazaar
Hum toh uss he main doobay
Niklay na paar

Rastay yahan rukk gaey
Hum bhi yaheen tham gaey

Kitnay gaey
Mausam naey
Chup ke kaheen kho gaey
Ho...
Kaali kaali raat
Din sae kahay
Taaray sabhi so gaey
[Verse 4]
Din bhar teri sochon main
Rehna mera
Har pal meri aankhon main
Chehra tera
Sukh dukh kae lamhon main
Tera aasra
Maanga tha jab bhi tujh sae
Sath mila

Bhool na paoon gi kabhi
Reh gaeen jo baatain unkahi

[Verse 5]
O...
Phir bhi hai tu he
Kehna yeh he hain
Mit kae bhi mit na saki
Dil main jali jo
Aag andikhi si
Mar kae bhi bujh na saki`
  },
  {
    id: "9sekgEXGm-E",
    title: "Faasle",
    subtitle: "Coke Studio Season 10",
    artist: "The Kaavish & Quratulain Balouch",
    album: "Coke Studio (2017)",
    quote: "Hue faasle, jhoothe silsile... toote hue dil jaaein kahaan?",
    lyrics: `Huve faasale
Jhoothe silsile
Toote huve dil jaayein kahaan
Mujhe jo khushi mili naa kabhi
Jaaye tere sang jaaye tu jahaan

Meri yeh dua hai ke tera jeevan yunhi
Chalta rahe saari khwaahishen hon poori
Teri duniya mein na ho yeh kami
Na ho yeh kami

Yaad hai mujhe teri har adaa
Muskuraahatein teri
Tera mujh se chupke se yoon
Kehna ke “tu hai meri”

Jaane yeh kya ho gayaa
Ho gaye judaa
Tere waaste sab hi raaste
Chhod ke main aayi yahaan
Tu toh naa mila
Yoonhi chal diya
Leke mera dil jaane tu kahaan

Jaaunga kahaan
Main toh hoon yahaan
Tere dil ki aahaton mein hoon

Sapno mein tu
Sochon mein tu
Har lamhe mein tu
Dhadke yeh dil tere hi liye
Hoga kisi ka na ab yeh

Ja raha hoon main
Ja rahi hoon main
Ja raha hoon main
Ja rahi hoon main
`
  },
  {
    id: "4DVDFxiZKCg",
    title: "O Yaara",
    subtitle: "Coke Studio Season 15",
    artist: "Abdul Hannan & The Kaavish",
    album: "Coke Studio (2024)",
    quote: "Andar tere raaz kayi hain... dil se jo sun paayega, o yaara",
    lyrics: `Kiya baataon?
In sawalon main kab se yun phasa hun
Rakh saray safay par likh raha hun
Fasanay mein zindagi k
Mann ko kese or kese bhelaon

Tukre kaanch k bikhre zameen par
Chalna chahun par, chahaya hai har qadam
Ye dhu'an, hai sans lena saza
Oh, mmm...

Ye wafa tou bazar mai bikti ek chehra
Hakeekatain dher sari kyun lage hain
Khud ki khoj mai sab hi haal e dil mai
Ab kese samjhaon?
Hai ye uljhe daghon sa
Meri sochon ka jahan...

Andar tere raaz kayi hain
Andar tere raaz kayi hain
Khud se jo mil paayega
O yaara...
Dil se jo sun paayega
Na chhod aas ki dor ko
Sach tu samajh jaayega
O yaara, phir tu sambhal jaayega...`
  },
  {
    id: "Bqto9jnc-II",
    title: "Neun La Leya",
    subtitle: "Coke Studio Season 8",
    artist: "The Kaavish",
    album: "Coke Studio (2015)",
    quote: "Neun la leya be-parwaah de naal... os deen duni de shaah de naal",
    lyrics: `Nyoon la liya beparwaah de naal
Nyoon
Nyoon la liya – haaye
Nyoon
Nyoon la liya
Nyoon la liya
Nyoon la liya
Beparwaah de naal
Nyoon la liya beparwaah de naal
Os deen duni de shaah de naal
Deen duni de shaah de naal
Nyoon la liya beparwaah de naal

Nadyon paar raanjhan da thaana
Nadyon paar raanjhan da thaana
Keeta kaul zaroori jaana
Keeta kaul zaroori jaana
Mintaan karaan mallaah de naal
Mintaan karaan mallaah de naal

Nyoon la liya beparwaah de naal
Nyoon la liya beparwaah de naal
Os deen duni de shaah de naal
Deen duni de shaah de naal
Nyoon la liya beparwaah de naal
Nyoon la liya beparwaah de naal

Kahe husain faqeer nimaana
Kahe husain faqeer nimaana
Dunya chhoṛ aakhar mar jaana
Dunya chhoṛ aakhar mar jaana
Auṛak kam allaah de naal
Auṛak kam allaah de naal

Nyoon la liya beparwaah de naal
Nyoon la liya – haaye
Nyoon la liya
Nyoon la liya
Nyoon la liya
Nyoon la liya - haaye
Nyoon la liya beparwaah de naal
Nyoon la liya
Nyoon la liya beparwaah
Nyoon la liya

Nyoon la liya beparwaah de naal
Nyoon la liya beparwaah de naal
Os deen duni de shaah de naal
Deen duni de shaah de naal
Nyoon la liya beparwaah de naal
Nyoon la liya beparwaah de naal
Nyoon la liya beparwaah de naal`
  },
  {
    id: "YMz4y8rQ4kU",
    title: "Tairay Naam",
    subtitle: "Kaavish - Tairay Naam",
    artist: "The Kaavish",
    album: "Tairay Naam",
    quote: "",
    lyrics: `[Verse 1]
Kia naseeb hai? Tu qareeb hai
Kese dharke ye dil bin tere
Tere pyaar ka, jou khumar hai
Rom rom mai hai jaise mere

[Chorus]
Saans hai teri jee raha hun mai
Hai jaadu ye yaar ka
Pyaas hai teri, pee raha hun mai
Nasha hai ye pyaar ka

[Verse 2]
Geet mere, meri shayari
Naam hogaye hai sab tere
Mit si gayi hai meri hasti
Tu hi tu hai har suu mere

[Interlude]

[Bridge]
Dekh tere pyaar ne
Mujhko mujh hi sai
Kese begana kardala
Kuch khali kaghaz ke
Tukron ka tune
Jese afsana kardala

[Verse 4]
Hai musawarri, tere hath ki
Meri zindagi, har pal mera
Jou tu nahi tou kuch bhi nahi
Berang hai jeevan mera

[Guitar Solo]

[Bridge]
Apne dil ka pehra diay
Beth gaya hun mai
Tere siwa koi dastak na de
Bas yahi chahun mai
Khoya rahun mai
Pyaar mai tere
Koi sitaye na

[Verse 5]
Ajj mujhe pas tere
Rehne de, tu kahin na jaa
Tere qadmon mai dil rakh ke
Hou gaya hun mai tera ranjha

[Chorus]
Saans hai teri jee raha hun mai
Hai jaadu ye yaar ka
Pyaas hai teri, pee raha hun mai
Nasha hai ye pyaar ka`,


  },
  {
    id: "bYCz5ak_52Q",
    title: "Intezaar",
    subtitle: "Kaavish - Intezaar",
    artist: "The Kaavish",
    album: "Intezaar",
    quote: "Tere intezaar may aashiyaan sajaaunga... hoga yeh milan kabhi",
    lyrics: `Tere intezaar may aashiyaan sajaaunga
Hoga yeh milan kabhi, khud ko yeh bataunga
Tere hi visaal se dil sukoon paayega
Dard intezaar ka, kya kisay bataunga?
Hoke tere rubaru haal-e-dil sunaunga
Tab talak yeh dil teri yaad may hi gaayega

Tere intezaar may
Tere intezaar may
Tere intezaar may
Tere intezaar may

Bewajah se jeewan may jeenay ki wajah tu hai
Soonay-soonay aangan may pyaar ki hawa tu hai
Tere bina mar jaaun naa mein

Tere intezaar may
Tere intezaar may
Tere intezaar may
Tere intezaar may

Yeh aag yoon jalti rahay
Yeh dil mera mujhse yeh kahay
Ke mein jal jaaun
Paaun pyaar jo ho naa fanaa
Mein jal jaaun
Paaun pyaar jo ho naa fanaa

`
  },
];

class KaavishMusicPlayer {
  constructor() {
    this.playlist = KAAVISH_PLAYLIST;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.ytPlayer = null;
    this.ytReady = false;
    this.isMuted = false;
    this.volume = 80;
    this.isShuffle = false;
    this.isRepeat = false;
    this.progressInterval = null;

    // Elements
    this.titleEl = document.getElementById('currentTitle');
    this.artistEl = document.getElementById('currentArtist');
    this.timeCurrentEl = document.getElementById('timeCurrent');
    this.timeTotalEl = document.getElementById('timeTotal');
    this.progressFillEl = document.getElementById('progressFill');
    this.progressTrackEl = document.getElementById('progressTrack');
    this.playBtn = document.getElementById('playMasterBtn');
    this.playIcon = document.getElementById('playIcon');
    this.prevBtn = document.getElementById('prevTrackBtn');
    this.nextBtn = document.getElementById('nextTrackBtn');
    this.volumeSlider = document.getElementById('masterVolumeSlider');
    this.volumeBtn = document.getElementById('volumeToggleBtn');
    this.vinylThumb = document.getElementById('vinylThumb');
    this.vinylCoverEl = document.getElementById('vinylCoverImg');
    this.heroQuoteEl = document.getElementById('heroQuote');

    // Background audio keeper to grant mobile browsers OS-level audio session priority
    try {
      this.bgAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
      this.bgAudio.loop = true;
      this.bgAudio.playsInline = true;
    } catch (e) {
      this.bgAudio = null;
    }

    this.bindEvents();
    this.updateTrackDisplay();
    this.updateMediaSession(this.playlist[this.currentIndex]);
  }

  initYouTubeAPI() {
    window.onYouTubeIframeAPIReady = () => {
      this.ytPlayer = new YT.Player('ytPlayerHost', {
        height: '200',
        width: '200',
        videoId: this.playlist[this.currentIndex].id,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1
        },
        events: {
          onReady: () => {
            this.ytReady = true;
            this.ytPlayer.setVolume(this.volume);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              this.setPlayingState(true);
              if (window.roomSync && window.roomSync.isActive()) {
                window.roomSync.onPlayerStatePlaying();
              }
            } else if (event.data === YT.PlayerState.PAUSED) {
              // If tab is hidden (user switched apps or locked screen), keep playing
              if (document.hidden && this.isPlaying) {
                setTimeout(() => {
                  if (this.isPlaying && this.ytPlayer && this.ytPlayer.playVideo) {
                    this.ytPlayer.playVideo();
                  }
                }, 150);
              } else {
                this.setPlayingState(false);
              }
            } else if (event.data === YT.PlayerState.ENDED) {
              this.handleTrackEnd();
            }
          },
          onError: (e) => {
            console.warn("YouTube player notice (Code: " + e.data + "), skipping or retrying...");
            setTimeout(() => this.nextTrack(), 1500);
          }
        }
      });
    };

    // Load YT Script
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  bindEvents() {
    this.playBtn?.addEventListener('click', () => this.togglePlay());
    this.prevBtn?.addEventListener('click', () => this.prevTrack());
    this.nextBtn?.addEventListener('click', () => this.nextTrack());

    this.volumeSlider?.addEventListener('input', (e) => {
      this.setVolume(parseInt(e.target.value, 10));
    });

    this.volumeBtn?.addEventListener('click', () => this.toggleMute());

    const handleSeek = (clientX) => {
      if (!this.progressTrackEl) return;
      if (window.roomSync) window.roomSync.isUserSeeking = true;
      const rect = this.progressTrackEl.getBoundingClientRect();
      const clickRatio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      this.seekTo(clickRatio);
      setTimeout(() => {
        if (window.roomSync) window.roomSync.isUserSeeking = false;
      }, 400);
    };

    this.progressTrackEl?.addEventListener('click', (e) => handleSeek(e.clientX));
    this.progressTrackEl?.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) handleSeek(e.touches[0].clientX);
    }, { passive: true });
    this.progressTrackEl?.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) handleSeek(e.touches[0].clientX);
    }, { passive: true });

    // Keyboard shortcuts: Space for Play/Pause, Arrow keys for tracks
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'ArrowRight' && e.ctrlKey) {
        this.nextTrack();
      } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
        this.prevTrack();
      }
    });

    // Auto-resume when coming back to tab if needed
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isPlaying && this.ytReady && this.ytPlayer) {
        if (this.ytPlayer.getPlayerState && this.ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING) {
          this.ytPlayer.playVideo();
        }
      }
    });
  }

  togglePlay() {
    if (!this.ytReady || !this.ytPlayer) {
      this.setPlayingState(!this.isPlaying);
      return;
    }

    if (this.isPlaying) {
      this.pauseTrack();
    } else {
      this.playTrack();
    }
  }

  getCurrentTime() {
    if (this.ytReady && this.ytPlayer && this.ytPlayer.getCurrentTime) {
      try {
        return this.ytPlayer.getCurrentTime() || 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  seekToTime(seconds) {
    if (this.ytReady && this.ytPlayer && this.ytPlayer.seekTo) {
      try {
        this.ytPlayer.seekTo(seconds, true);
        const dur = this.ytPlayer.getDuration ? this.ytPlayer.getDuration() : 0;
        if (dur > 0) {
          this.updateTimelineDisplay(seconds, dur);
        }
      } catch (e) {}
    }
  }

  playTrack(isFromSync = false) {
    if (this.ytReady && this.ytPlayer) {
      this.ytPlayer.playVideo();
    }
    this.setPlayingState(true);

    if (!isFromSync && window.roomSync && window.roomSync.isActive() && !window.roomSync.isApplyingRemoteSync) {
      window.roomSync.broadcastAction('PLAY', {
        trackIndex: this.currentIndex,
        currentTime: this.getCurrentTime()
      });
    }
  }

  pauseTrack(isFromSync = false) {
    if (this.ytReady && this.ytPlayer) {
      this.ytPlayer.pauseVideo();
    }
    this.setPlayingState(false);

    if (!isFromSync && window.roomSync && window.roomSync.isActive() && !window.roomSync.isApplyingRemoteSync) {
      window.roomSync.broadcastAction('PAUSE', {
        trackIndex: this.currentIndex,
        currentTime: this.getCurrentTime()
      });
    }
  }

  updateMediaSession(track) {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist || 'The Kaavish',
        album: track.album || track.subtitle || 'The Kaavish Radio',
        artwork: [
          { src: `https://img.youtube.com/vi/${track.id}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' },
          { src: 'assets/images/Img1.png', sizes: '512x512', type: 'image/png' },
          { src: 'assets/images/Img2.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => this.playTrack());
      navigator.mediaSession.setActionHandler('pause', () => this.pauseTrack());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && this.ytReady && this.ytPlayer) {
          this.seekToTime(details.seekTime);
        }
      });
    } catch (err) {
      console.warn('MediaSession notice:', err);
    }
  }

  setPlayingState(isPlaying) {
    this.isPlaying = isPlaying;
    if (this.playIcon) {
      this.playIcon.innerHTML = isPlaying
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    }

    if (this.vinylThumb) {
      if (isPlaying) {
        this.vinylThumb.classList.add('playing');
      } else {
        this.vinylThumb.classList.remove('playing');
      }
    }

    if (isPlaying) {
      if (this.bgAudio) {
        this.bgAudio.play().catch(() => { });
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      this.startProgressTracker();
    } else {
      if (this.bgAudio) {
        this.bgAudio.pause();
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      this.stopProgressTracker();
    }
  }

  loadTrack(index, autoPlay = true, isFromSync = false) {
    this.currentIndex = (index + this.playlist.length) % this.playlist.length;
    const track = this.playlist[this.currentIndex];

    this.updateTrackDisplay();
    this.updateMediaSession(track);

    if (this.ytReady && this.ytPlayer) {
      if (autoPlay) {
        this.ytPlayer.loadVideoById(track.id);
        this.setPlayingState(true);
      } else {
        this.ytPlayer.cueVideoById(track.id);
      }
    }

    // Dispatch event for playlist modal to highlight current song
    window.dispatchEvent(new CustomEvent('trackchange', { detail: { index: this.currentIndex } }));

    if (!isFromSync && window.roomSync && window.roomSync.isActive() && !window.roomSync.isApplyingRemoteSync) {
      window.roomSync.broadcastAction('TRACK_CHANGE', {
        trackIndex: this.currentIndex,
        autoPlay: autoPlay,
        currentTime: 0
      });
    }
  }

  nextTrack() {
    if (this.isShuffle) {
      let rand = Math.floor(Math.random() * this.playlist.length);
      if (rand === this.currentIndex) rand = (rand + 1) % this.playlist.length;
      this.loadTrack(rand);
    } else {
      this.loadTrack(this.currentIndex + 1);
    }
  }

  prevTrack() {
    this.loadTrack(this.currentIndex - 1);
  }

  handleTrackEnd() {
    if (this.isRepeat) {
      this.loadTrack(this.currentIndex);
    } else {
      this.nextTrack();
    }
  }

  seekTo(ratio, isFromSync = false) {
    if (this.ytReady && this.ytPlayer && this.ytPlayer.getDuration) {
      const dur = this.ytPlayer.getDuration();
      if (dur > 0) {
        const seekTime = dur * ratio;
        this.ytPlayer.seekTo(seekTime, true);
        this.updateTimelineDisplay(seekTime, dur);

        if (!isFromSync && window.roomSync && window.roomSync.isActive() && !window.roomSync.isApplyingRemoteSync) {
          window.roomSync.broadcastAction('SEEK', {
            trackIndex: this.currentIndex,
            currentTime: seekTime
          });
        }
      }
    }
  }

  setVolume(val) {
    this.volume = val;
    if (this.ytReady && this.ytPlayer && this.ytPlayer.setVolume) {
      this.ytPlayer.setVolume(val);
      if (val === 0) {
        this.ytPlayer.mute();
      } else {
        this.ytPlayer.unMute();
      }
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ytReady && this.ytPlayer) {
      if (this.isMuted) {
        this.ytPlayer.mute();
        if (this.volumeSlider) this.volumeSlider.value = 0;
      } else {
        this.ytPlayer.unMute();
        this.ytPlayer.setVolume(this.volume);
        if (this.volumeSlider) this.volumeSlider.value = this.volume;
      }
    }
  }

  updateTrackDisplay() {
    const track = this.playlist[this.currentIndex];
    if (this.titleEl) this.titleEl.textContent = track.title;
    if (this.artistEl) this.artistEl.textContent = `${track.artist} • ${track.subtitle}`;
    if (this.heroQuoteEl && track.quote) {
      this.heroQuoteEl.textContent = `“${track.quote}”`;
    }
    if (this.vinylCoverEl) {
      this.vinylCoverEl.src = track.cover || `https://img.youtube.com/vi/${track.id}/mqdefault.jpg`;
    }
  }

  startProgressTracker() {
    this.stopProgressTracker();
    this.progressInterval = setInterval(() => {
      if (this.ytReady && this.ytPlayer && this.ytPlayer.getCurrentTime) {
        const curr = this.ytPlayer.getCurrentTime() || 0;
        const dur = this.ytPlayer.getDuration() || 0;
        this.updateTimelineDisplay(curr, dur);
      }
    }, 500);
  }

  stopProgressTracker() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  updateTimelineDisplay(curr, dur) {
    if (this.timeCurrentEl) this.timeCurrentEl.textContent = this.formatTime(curr);
    if (this.timeTotalEl) this.timeTotalEl.textContent = this.formatTime(dur);
    if (this.progressFillEl && dur > 0) {
      const pct = Math.min(100, Math.max(0, (curr / dur) * 100));
      this.progressFillEl.style.width = `${pct}%`;
    }
  }

  formatTime(secs) {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}

window.kaavishPlayer = new KaavishMusicPlayer();
