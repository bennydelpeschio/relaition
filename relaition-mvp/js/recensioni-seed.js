// ══════════════════════════════════════════
// SEME DELLE RECENSIONI
// ══════════════════════════════════════════
// Le tre recensioni scritte nel codice erano le stesse su tutti gli agenti:
// bastava aprire due schede di seguito per accorgersene. Qui ogni agente ha le
// sue, che parlano di quello che quell'agente fa davvero, con voti diversi e
// almeno un rilievo critico dove il catalogo dichiara una valutazione piu'
// bassa. Non sono decorazione: entrano nella stessa tabella `recensioni` in cui
// finiscono quelle scritte dall'utente, e nella stessa media.
//
// `g` = giorni fa. Le date sono relative all'esecuzione del seme, altrimenti
// una dimostrazione fatta fra sei mesi mostrerebbe solo recensioni vecchie.

var REC_SEMI={
  1:[ // Lead Qualifier Pro, Sales, 4.8
    {u:'Laura B.',   s:5, g:6,  t:'Il punteggio arriva con la motivazione accanto, e questo ci ha fatto accettare l’automazione anche dal commerciale piu’ diffidente.'},
    {u:'Paolo G.',   s:5, g:19, t:'Collegato a HubSpot in una mattina. Sui contatti da fiera sbaglia poco, e quando sbaglia si capisce perche’.'},
    {u:'Chiara V.',  s:4, g:33, t:'Ottimo, ma il punteggio e’ tarato sul B2B: sui contatti privati abbiamo dovuto riscrivere il prompt.'}
  ],
  2:[ // Invoice Extractor, Finance, 4.9
    {u:'Davide M.',  s:5, g:3,  t:'Su 400 fatture al mese l’estrazione di imponibile e scadenza e’ stata corretta praticamente sempre. Ci ha tolto due giorni di lavoro.'},
    {u:'Federica T.',s:5, g:11, t:'La cosa che mi ha convinta e’ che si ferma e segnala invece di inventare un numero quando il PDF e’ illeggibile.'},
    {u:'Stefano R.', s:5, g:27, t:'Funziona anche sulle fatture scansionate purche’ il testo ci sia. Sulle immagini pure no, ma e’ dichiarato.'}
  ],
  3:[ // HR Onboarding Agent, HR, 4.7
    {u:'Elena C.',   s:5, g:8,  t:'Il nuovo assunto riceve tutto il primo giorno senza che nessuno se ne ricordi. Da sola vale il tempo di configurazione.'},
    {u:'Marta F.',   s:4, g:22, t:'Buono. Avrei voluto poter differenziare il percorso per sede: adesso lo faccio con una condizione a valle.'},
    {u:'Giacomo P.', s:5, g:40, t:'Integrato con il gestionale presenze via webhook, zero attriti.'}
  ],
  4:[ // Support Ticket Triage, Customer Service, 4.6
    {u:'Silvia N.',  s:5, g:4,  t:'Smista per urgenza meglio di come facevamo a mano il lunedi’ mattina. I ticket critici non restano piu’ in coda.'},
    {u:'Andrea Z.',  s:4, g:16, t:'Sulle categorie standard e’ preciso. Sui reclami misti (fatturazione + tecnico) sceglie una categoria sola e a volte non e’ quella giusta.'},
    {u:'Roberto L.', s:5, g:29, t:'La revisione umana sui casi urgenti e’ la scelta giusta: non ci siamo mai sentiti scavalcati.'}
  ],
  5:[ // Content Calendar AI, Marketing, 4.5
    {u:'Giulia S.',  s:5, g:7,  t:'Il piano editoriale mensile esce gia’ impaginato e con i temi divisi per canale. Poi lo correggiamo, ma partiamo da qualcosa.'},
    {u:'Nicola V.',  s:4, g:18, t:'Utile per non partire dal foglio bianco. I titoli vanno quasi sempre riscritti, hanno tutti lo stesso ritmo.'},
    {u:'Alessia D.', s:4, g:35, t:'Buono per il blog, meno per i social: non tiene conto della lunghezza dei singoli formati.'}
  ],
  6:[ // Contract Reviewer, Legal, 4.8
    {u:'Avv. Marco T.', s:5, g:5,  t:'Trova le clausole di recesso e le penali anche quando sono scritte male. Resta una prima lettura, non un parere, ed e’ giusto cosi’.'},
    {u:'Barbara I.',    s:5, g:14, t:'Il punteggio di rischio ci fa decidere cosa mandare al legale esterno e cosa no. Da solo giustifica l’abbonamento.'},
    {u:'Luca F.',       s:4, g:31, t:'Sui contratti in inglese perde qualche sfumatura rispetto all’italiano.'}
  ],
  7:[ // Meeting Summarizer, Produttività, 4.7
    {u:'Sara G.',    s:5, g:2,  t:'La sintesi con le azioni assegnate e le scadenze e’ esattamente cio’ che serve. Nessuno prende piu’ appunti.'},
    {u:'Emanuele B.',s:4, g:13, t:'Ottimo con audio pulito. In riunione con sei persone che si sovrappongono confonde chi ha detto cosa.'},
    {u:'Ilaria M.',  s:5, g:26, t:'L’invio automatico ai partecipanti chiude il cerchio. Attenzione a chi mettete in copia.'}
  ],
  8:[ // DevOps Alert Manager, DevOps, 4.4
    {u:'Matteo K.',  s:5, g:9,  t:'Raggruppa gli allarmi correlati invece di svegliarti dodici volte per lo stesso incidente.'},
    {u:'Simone A.',  s:4, g:21, t:'Fa il suo. La classificazione della gravita’ va tarata sul proprio stack, di serie e’ troppo prudente.'},
    {u:'Valeria O.', s:3, g:37, t:'Nella nostra pipeline i falsi positivi notturni sono rimasti troppi. Utile di giorno, disattivato di notte.'}
  ],
  9:[ // Expense Report AI, Finance, 4.6
    {u:'Cristina P.',s:5, g:6,  t:'Legge gli scontrini fotografati e li mette in nota spese con la categoria giusta. I rimborsi sono passati da tre settimane a tre giorni.'},
    {u:'Fabio R.',   s:4, g:20, t:'Sugli scontrini stropicciati ogni tanto sbaglia la data. Se ne accorge il controllo a valle, ma va tenuto.'},
    {u:'Anna L.',    s:5, g:34, t:'La regola sui massimali per trasferta l’abbiamo messa con una condizione: dieci minuti di lavoro.'}
  ],
  10:[ // Competitor Watch, Marketing, 4.3
    {u:'Tommaso E.',s:4, g:10, t:'La battle card aggiornata ogni settimana e’ utile in trattativa. I dati sui prezzi vanno ricontrollati.'},
    {u:'Serena B.', s:4, g:23, t:'Il segnale sulle offerte di lavoro dei concorrenti si e’ rivelato piu’ predittivo di quanto pensassi.'},
    {u:'Michele D.',s:3, g:38, t:'Dipende molto da cosa i concorrenti pubblicano. Su quelli piccoli non trova quasi nulla e il report resta vuoto.'}
  ],
  11:[ // GDPR Data Mapper, Legal, 4.9
    {u:'Sara L.',    s:5, g:4,  t:'Ha prodotto il registro dei trattamenti in una settimana invece che in due mesi. Il DPO ha corretto, non riscritto.'},
    {u:'Giorgia V.', s:5, g:17, t:'La mappa dei flussi verso fornitori extra-UE e’ la parte che nessuno aveva mai messo per iscritto.'},
    {u:'Enrico M.',  s:5, g:30, t:'Costa, ma il primo audit superato senza rilievi lo ha ripagato.'}
  ],
  12:[ // Candidate Screener, HR, 4.5
    {u:'Marco R.',   s:5, g:5,  t:'Ordina i CV per aderenza al ruolo con una motivazione leggibile. Nessuna decisione automatica, e’ il punto.'},
    {u:'Chiara N.',  s:4, g:15, t:'Il mascheramento dei dati personali prima del modello ci ha permesso di usarlo senza discussioni interne.'},
    {u:'Diego F.',   s:4, g:28, t:'Sui profili atipici tende a penalizzare chi ha fatto percorsi non lineari. Lo teniamo come supporto, non come filtro.'}
  ],
  13:[ // Proposal Drafter AI, Sales, 4.7
    {u:'Riccardo T.',s:5, g:3,  t:'Prima bozza di proposta in due minuti, con i dati del CRM gia’ dentro. Il tempo lo spendiamo a rifinire, non a impaginare.'},
    {u:'Monica S.',  s:5, g:12, t:'Il passaggio in revisione al sales manager prima dell’invio evita le figuracce.'},
    {u:'Alberto C.', s:4, g:25, t:'Va data una traccia buona: se il template di partenza e’ debole, la proposta lo eredita.'}
  ],
  14:[ // SEO Content Optimizer, Marketing, 4.4
    {u:'Francesca A.',s:4, g:8,  t:'Le indicazioni su struttura e intenti di ricerca sono corrette. Sulle parole chiave suggerisce spesso le stesse.'},
    {u:'Gabriele P.', s:5, g:19, t:'Passati da pagina tre a pagina uno su quattro articoli in due mesi. Non e’ solo merito suo, ma ha aiutato.'},
    {u:'Elisa R.',    s:4, g:32, t:'Utile, ma va guidato: lasciato libero riempie il testo di ripetizioni.'}
  ],
  15:[ // Budget Variance Analyzer, Finance, 4.6
    {u:'Giulia D.',  s:5, g:7,  t:'Spiega gli scostamenti invece di limitarsi a segnalarli. In riunione di budget arriviamo con le risposte pronte.'},
    {u:'Paolo V.',   s:4, g:24, t:'Serve un piano dei conti pulito: sui centri di costo disordinati le analisi diventano rumore.'},
    {u:'Nadia F.',   s:5, g:36, t:'Il report mensile automatico ha sostituito quattro fogli di calcolo tenuti a mano.'}
  ],
  16:[ // CI/CD Deploy Agent, DevOps, 4.3
    {u:'Luca P.',    s:4, g:6,  t:'Il rollback automatico ha funzionato la prima volta che e’ servito davvero. Vale la configurazione.'},
    {u:'Dario S.',   s:4, g:18, t:'Fa quello che promette su pipeline semplici. Su monorepo con dipendenze incrociate va aiutato molto.'},
    {u:'Ivan G.',    s:3, g:41, t:'L’approvazione umana prima del rilascio in produzione e’ obbligatoria e non si puo’ togliere: giusto in generale, scomodo per gli ambienti di prova.'}
  ],
  17:[ // Competitive Analysis AI, Sales, 4.5
    {u:'Beatrice L.',s:5, g:9,  t:'Le obiezioni ricorrenti con la risposta pronta sono la parte che il team commerciale usa davvero.'},
    {u:'Claudio M.', s:4, g:20, t:'L’analisi e’ buona sui concorrenti grandi. Sui locali si basa su troppo poco materiale.'},
    {u:'Rita B.',    s:4, g:33, t:'Da rileggere sempre: due volte ha attribuito a un concorrente una funzione che non ha.'}
  ],
  18:[ // Document Clause Extractor, Legal, 4.8
    {u:'Avv. Elena V.',s:5, g:5,  t:'Estrae le clausole con il riferimento al punto del documento. Poter risalire alla fonte e’ cio’ che lo rende utilizzabile in studio.'},
    {u:'Pietro N.',    s:5, g:16, t:'Su capitolati di duecento pagine trova in un minuto quello che ci prendeva mezza giornata.'},
    {u:'Sofia G.',     s:4, g:29, t:'Sui PDF esportati male qualche clausola la salta. Consiglio di controllare il conteggio.'}
  ],
  19:[ // Claims Processor AI, Insurance, 4.7
    {u:'Sara L.',     s:5, g:4,  t:'L’istruttoria arriva al liquidatore gia’ completa: documenti, importi, incongruenze evidenziate. I tempi si sono dimezzati.'},
    {u:'Antonio D.',  s:5, g:13, t:'Le segnalazioni sui sinistri sospetti sono state pertinenti. La decisione resta a noi, come deve essere.'},
    {u:'Lucia M.',    s:4, g:27, t:'Sui sinistri con piu’ controparti va seguito: tende a trattarli come uno solo.'}
  ],
  20:[ // DORA Checker, Insurance, 4.6
    {u:'Sara L.',     s:5, g:6,  t:'Ha retto al primo controllo interno. La mappatura dei fornitori critici e’ quella che serviva.'},
    {u:'Massimo B.',  s:4, g:21, t:'Aiuta molto, ma non sostituisce chi conosce i contratti: alcune classificazioni le abbiamo corrette.'},
    {u:'Irene C.',    s:5, g:37, t:'Il registro esce in un formato che si puo’ consegnare, non da riformattare.'}
  ],
  21:[ // Polizza Analyzer, Insurance, 4.5
    {u:'Giorgio A.',  s:5, g:8,  t:'Confronta garanzie ed esclusioni fra due polizze in modo leggibile. Lo usiamo in consulenza davanti al cliente.'},
    {u:'Valentina M.',s:4, g:22, t:'Sulle polizze vecchie, scritte fitte, qualche esclusione la perde. Sulle nuove e’ preciso.'},
    {u:'Franco T.',   s:4, g:39, t:'Buono per una prima lettura. Sui massimali con sottolimiti va sempre verificato a mano.'}
  ],
  22:[ // Regulatory Report AI, Insurance, 4.6
    {u:'Giulia D.',   s:5, g:7,  t:'La segnalazione trimestrale esce con i controlli di quadratura gia’ fatti. Prima li facevamo dopo, e si scopriva tardi.'},
    {u:'Umberto S.',  s:4, g:23, t:'Costoso, ma il tempo risparmiato in chiusura lo giustifica. Va configurato con attenzione la prima volta.'},
    {u:'Paola R.',    s:5, g:35, t:'La tracciabilita’ di ogni dato fino alla fonte e’ quello che ci ha chiesto l’organo di vigilanza.'}
  ]
};

// Recensioni sugli agenti pubblicati dalla community, per chiave testuale: sono
// i due agenti che il seme di dimostrazione pubblica, e senza queste righe la
// scheda di un agente approvato resterebbe vuota mentre quelle di catalogo sono
// piene — una differenza che sembrerebbe un difetto invece che una coincidenza.
var REC_SEMI_PUB={
  'pub:Qualificazione contatti':[
    {u:'Giulia D.', s:5, g:9,  t:'Preso dal marketplace interno e adattato in mezz’ora. Il mascheramento dei dati era gia’ dentro.'},
    {u:'Marco R.',  s:4, g:20, t:'Funziona. La soglia di punteggio l’ho alzata: di serie faceva passare troppi contatti.'}
  ]
};

// Il seme non tocca cio’ che esiste: se qualcuno ha gia’ scritto su un agente,
// quell'agente si considera fatto. Cosi’ rilanciarlo dopo un aggiornamento non
// duplica ne’ sovrascrive le recensioni vere.
function recSemina(){
  if(typeof DB==='undefined'||!DB)return {saltato:true,motivo:'database non pronto'};
  var ora=Date.now(),n=0;
  var inserisci=function(chiave,righe){
    var gia=dbGetOne('SELECT COUNT(*) c FROM recensioni WHERE agent_key=?',[chiave]);
    if(gia&&gia.c)return;
    righe.forEach(function(r){
      var d=new Date(ora-r.g*86400000-((r.s*7)%24)*3600000).toISOString();
      dbRun('INSERT OR IGNORE INTO recensioni (agent_key,autore,stelle,testo,created_at) VALUES (?,?,?,?,?)',
        [chiave,r.u,r.s,r.t,d]);
      n++;
    });
  };
  Object.keys(REC_SEMI).forEach(function(id){ inserisci('cat:'+id,REC_SEMI[id]) });
  Object.keys(REC_SEMI_PUB).forEach(function(k){ inserisci(k,REC_SEMI_PUB[k]) });
  return {saltato:false,inserite:n};
}
