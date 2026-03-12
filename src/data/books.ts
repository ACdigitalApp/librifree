import divinaCommedia from "@/assets/covers/divina-commedia.jpg";
import pinocchio from "@/assets/covers/pinocchio.jpg";
import promessiSposi from "@/assets/covers/promessi-sposi.jpg";
import sherlockHolmes from "@/assets/covers/sherlock-holmes.jpg";
import odissea from "@/assets/covers/odissea.jpg";
import iliade from "@/assets/covers/iliade.jpg";

export interface Book {
  slug: string;
  title: string;
  author: string;
  cover: string;
  description?: string;
  content: string;
}

export const books: Book[] = [
  {
    slug: "divina-commedia",
    title: "Divina Commedia",
    author: "Dante Alighieri",
    cover: divinaCommedia,
    description: "La Divina Commedia è il celebre poema di Dante Alighieri, considerato uno dei capolavori della letteratura mondiale. Racconta il viaggio immaginario di Dante attraverso Inferno, Purgatorio e Paradiso.",
    content: `<h2>Inferno – Canto I</h2>
<p>Nel mezzo del cammin di nostra vita<br/>mi ritrovai per una selva oscura,<br/>ché la diritta via era smarrita.</p>
<p>Ahi quanto a dir qual era è cosa dura<br/>esta selva selvaggia e aspra e forte<br/>che nel pensier rinova la paura!</p>
<p>Tant'è amara che poco è più morte;<br/>ma per trattar del ben ch'i' vi trovai,<br/>dirò de l'altre cose ch'i' v'ho scorte.</p>
<p>Io non so ben ridir com'i' v'intrai,<br/>tant'era pien di sonno a quel punto<br/>che la verace via abbandonai.</p>
<p>Ma poi ch'i' fui al piè d'un colle giunto,<br/>là dove terminava quella valle<br/>che m'avea di paura il cor compunto,</p>
<p>guardai in alto e vidi le sue spalle<br/>vestite già de' raggi del pianeta<br/>che mena dritto altrui per ogne calle.</p>
<p>Allor fu la paura un poco queta,<br/>che nel lago del cor m'era durata<br/>la notte ch'i' passai con tanta pieta.</p>
<p>E come quei che con lena affannata,<br/>uscito fuor del pelago a la riva,<br/>si volge a l'acqua perigliosa e guata,</p>
<p>così l'animo mio, ch'ancor fuggiva,<br/>si volse a retro a rimirar lo passo<br/>che non lasciò già mai persona viva.</p>`,
  },
  {
    slug: "pinocchio",
    title: "Le Avventure di Pinocchio",
    author: "Carlo Collodi",
    cover: pinocchio,
    content: `<h2>Capitolo I</h2>
<h3>Come andò che Maestro Ciliegia, falegname, trovò un pezzo di legno che piangeva e rideva come un bambino.</h3>
<p>C'era una volta...</p>
<p>— Un re! — diranno subito i miei piccoli lettori.</p>
<p>— No, ragazzi, avete sbagliato. C'era una volta un pezzo di legno.</p>
<p>Non era un legno di lusso, ma un semplice pezzo da catasta, di quelli che d'inverno si mettono nelle stufe e nei caminetti per accendere il fuoco e per riscaldare le stanze.</p>
<p>Non so come andasse, ma il fatto gli è che un bel giorno questo pezzo di legno capitò nella bottega di un vecchio falegname, il quale aveva nome Mastr'Antonio, se non che tutti lo chiamavano Maestro Ciliegia, per via della punta del suo naso, che era sempre lustra e paonazza, come una ciliegia matura.</p>
<p>Appena Maestro Ciliegia ebbe visto quel pezzo di legno, si rallegrò tutto; e dandosi una fregatina di mani per la contentezza, borbottò a mezza voce:</p>
<p>— Questo legno è capitato a tempo; voglio servirmene per fare una gamba di tavolino. —</p>
<p>Detto fatto, prese subito l'ascia arrotata per cominciare a levargli la scorza e a digrossarlo; ma quando fu lì per lasciare andare la prima asciata, rimase col braccio sospeso in aria, perché sentì una vocina sottile sottile, che disse raccomandandosi:</p>
<p>— Non mi picchiar tanto forte! —</p>`,
  },
  {
    slug: "promessi-sposi",
    title: "I Promessi Sposi",
    author: "Alessandro Manzoni",
    cover: promessiSposi,
    content: `<h2>Capitolo I</h2>
<p>Quel ramo del lago di Como, che volge a mezzogiorno, tra due catene non interrotte di monti, tutto a seni e a golfi, a seconda dello sporgere e del rientrare di quelli, vien, quasi a un tratto, a ristringersi, e a prender corso e figura di fiume, tra un promontorio a destra, e un'ampia costiera dall'altra parte; e il ponte, che ivi congiunge le due rive, par che renda ancor più sensibile all'occhio questa trasformazione, e segni il punto in cui il lago cessa, e l'Adda rincomincia, per ripigliar poi nome di lago dove le rive, allontanandosi di nuovo, lascian l'acqua distendersi e rallentarsi in nuovi golfi e in nuovi seni.</p>
<p>La costiera, formata dal deposito di tre grossi torrenti, scende appoggiata a due monti contigui, l'uno detto di san Martino, l'altro, con voce lombarda, il Resegone, dai molti suoi cocuzzoli in fila, che in vero lo fanno somigliare a una sega: talché non è chi, al primo vederlo, purché sia di fronte, come per esempio di su le mura di Milano che guardano a settentrione, non lo discerna tosto, a un tal contrassegno, in quella lunga e vasta giogaia, dagli altri monti di nome più oscuro e di forma più comune.</p>
<p>Per un buon pezzo, la costa sale con un pendìo lento e continuo; poi si rompe in poggi e in valloncelli, in erte e in ispianate, secondo l'ossatura de' due monti, e il lavoro dell'acque.</p>
<p>Il lembo estremo, tagliato dalle foci de' torrenti, è quasi tutto ghiaia e ciottoloni; il resto, campi e vigne, sparse di terre, di ville, di casali; in qualche parte, boschi di castagni. Lecco, la principale di quelle terre, e che dà nome al territorio, giace poco discosto dal ponte, alla riva del lago, anzi viene in parte a trovarsi nel lago stesso, quando questo ingrossa.</p>`,
  },
  {
    slug: "sherlock-holmes",
    title: "Sherlock Holmes",
    author: "Arthur Conan Doyle",
    cover: sherlockHolmes,
    content: `<h2>Uno Studio in Rosso – Parte I</h2>
<h3>Capitolo I – Il signor Sherlock Holmes</h3>
<p>Nell'anno 1878 mi laureai in medicina all'Università di Londra e mi recai a Netley per seguire il corso prescritto ai chirurghi militari. Compiuti i miei studi, fui debitamente aggregato al quinto reggimento fucilieri del Northumberland, in qualità di chirurgo aiutante.</p>
<p>Il reggimento era allora di stanza in India e, prima che potessi raggiungerlo, era scoppiata la seconda guerra afghana. Sbarcando a Bombay, venni a sapere che il mio corpo d'armata aveva oltrepassato le gole del nemico e si era spinto nel cuore dell'Afghanistan. Seguii tuttavia il mio destino con altri ufficiali nella mia stessa situazione e riuscii a raggiungere Candahar sano e salvo.</p>
<p>Trovai il mio reggimento e cominciai a compiere il mio servizio con la nuova campagna.</p>
<p>La campagna portò onori e promozioni a molti, ma a me non recò che sfortuna e disastri. Fui trasferito dalla mia brigata alla brigata Berkshires, con la quale presi parte alla fatale battaglia di Maiwand.</p>
<p>Lì fui colpito alla spalla da un proiettile Jazail, che mi spezzò l'osso e sfiorò l'arteria succlavia. Sarei caduto nelle mani dei Ghazi, se non fosse stato per la devozione e il coraggio del mio attendente Murray, che mi gettò attraverso un cavallo da soma e riuscì a portarmi in salvo nelle linee britanniche.</p>`,
  },
  {
    slug: "odissea",
    title: "Odissea",
    author: "Omero",
    cover: odissea,
    content: `<h2>Libro Primo – Concilio degli dèi</h2>
<p>Musa, quell'uom di multiforme ingegno<br/>dimmi, che molto errò, poich'ebbe a terra<br/>gittate d'Ilïòn le sacre torri;</p>
<p>che città vide molte, e delle genti<br/>l'indol conobbe; che patì nel mare<br/>dolori acerbi, e la sua vita e il ritorno<br/>de' suoi compagni a conservar s'affisse.</p>
<p>Ma i compagni salvar, benché volesse,<br/>non poté già: per le lor proprie follie<br/>periron essi, stolti! che del Sole<br/>Iperïone i buoi mangiaro; ed esso<br/>tolse ad essi il dì del ritornare.</p>
<p>Deh! parte almeno di sì gran vicende<br/>narra anco a noi, di Giove figlia e diva.</p>
<p>Tutti gli altri, che scansato aveano<br/>la nera morte, eran nelle lor case,<br/>della guerra e del mar fuori d'affanno:</p>
<p>sol lui, che tanto sospirava il ritorno<br/>e la consorte sua, tenea prigione<br/>la ninfa veneranda, la splendida Calipso,<br/>nelle cave sue grotte, bramosa<br/>di farlo suo marito.</p>
<p>Ma quando il tempo giunse, volgendo degli anni,<br/>nel quale i Numi gli filaron che tornasse<br/>alla sua patria Itaca, neppure allora<br/>era fuor degli affanni, anche fra i suoi.</p>`,
  },
  {
    slug: "iliade",
    title: "Iliade",
    author: "Omero",
    cover: iliade,
    content: `<h2>Libro Primo – La pestilenza e l'ira</h2>
<p>Cantami, o Diva, del Pelìde Achille<br/>l'ira funesta che infiniti addusse<br/>lutti agli Achei, molte anzi tempo all'Orco<br/>generose travolse alme d'eroi,</p>
<p>e di cani e d'augelli orrido pasto<br/>lor salme abbandonò (così di Giove<br/>l'alto consiglio s'adempìa), da quando<br/>primamente disgiunse aspra contesa<br/>il re de' prodi Atride e il divo Achille.</p>
<p>E qual de' numi li fe' in lite? Il figlio<br/>di Latona e di Giove. Irato al sire<br/>destò nel campo un feral morbo, e i forti<br/>perieno a schiere, perché il prete Crise<br/>trattato indegnamente avea l'Atride.</p>
<p>Al celere naviglio era de' Greci<br/>Crise venuto a riscattar la figlia<br/>con molto prezzo; e d'Apollo arciero<br/>in man recava le bende sacre e il serto<br/>sopra l'aureo scettro; e tutti i Greci<br/>supplicò, ma d'Atrèo più ch'altri i figli,<br/>condottier delle schiere:</p>
<p>— O Atrìdi, e voi tutti, Achei schinieri,<br/>concedanvi gli dèi che in Olimpo han sede<br/>di Priamo espugnar la rocca, e salvi<br/>ritornare alle case! A me la figlia<br/>deh! restituite, e il pregio mio accettate,<br/>del figlio di Latona in reverenza,<br/>di Febo Apollo arciero. —</p>`,
  },
];

export function getBookBySlug(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}
