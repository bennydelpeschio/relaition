# RelAItion — Architettura del prototipo

Documentazione tecnica del proof of concept. I numeri riportati sono stati
letti dall'applicazione in esecuzione, non stimati.

---

## 1. Scelte architetturali

### 1.1 Interamente lato client

Non esiste un backend. L'applicazione è un insieme di file statici che il
browser esegue: `index.html`, cinque fogli di stile, ventidue moduli
JavaScript e la libreria SQLite compilata in WebAssembly.

La conseguenza pratica: **l'applicazione si apre con un doppio click sul file**
oppure servita da un qualsiasi server statico, senza installazione, senza
processo di compilazione, senza dipendenze da scaricare.

La conseguenza architetturale: tutto ciò che in un prodotto vero starebbe sul
server — persistenza, esecuzione dei flussi, indicizzazione documentale,
controlli di pubblicazione — qui vive nel browser. Dove questo comporta una
differenza sostanziale rispetto a un sistema di produzione, la differenza è
dichiarata nella sezione 5.

### 1.2 Caricamento a script classici, senza bundler

I moduli sono `<script>` in ordine di dipendenza, con le funzioni in ambito
globale. Nessun sistema di moduli ES, nessun impacchettatore.

Il motivo è il vincolo precedente: un bundler introdurrebbe un passo di
compilazione, e i moduli ES caricati da `file://` sono bloccati dalla politica
CORS del browser. **L'ordine di caricamento in `index.html` è quindi
significativo** e va rispettato quando si aggiungono moduli.

### 1.3 SQLite in WebAssembly, non localStorage

I dati stanno in un database relazionale reale (sql.js), esportato come blob
binario e conservato in IndexedDB. Non in `localStorage`.

La ragione è concreta: la versione precedente del prototipo teneva tutti gli
agenti sotto un'unica chiave `localStorage`, e salvarne uno sovrascriveva
silenziosamente gli altri. Con tabelle e righe distinte il problema non si pone,
e in più diventano possibili le interrogazioni aggregate su cui si reggono il
Monitoraggio e la spiegabilità.

**Dettaglio non ovvio**: il file `.wasm` di SQLite viene normalmente scaricato
con `fetch()`, che da `file://` è bloccato. Il binario è quindi incluso
pre-codificato in base64 (`lib/sqljs/sql-wasm-inline.js`) e decodificato in
memoria. Senza questo accorgimento il database non si inizializza affatto
aprendo il file localmente.

### 1.4 Un solo motore di esecuzione

`js/agent-runtime.js` contiene l'unica implementazione dell'esecuzione dei
flussi. Il Builder e lo scheduler sono due adattatori sottili sopra di esso.

In precedenza esistevano due copie divergenti del motore, una per l'esecuzione
interattiva e una per quella pianificata: correggere un difetto in una lasciava
l'altra rotta. L'unificazione ha eliminato la classe di problemi.

L'esecuzione procede per **ondate**: a ogni giro si raccolgono i nodi le cui
dipendenze sono soddisfatte e si eseguono insieme con `Promise.all`. È
concorrenza asincrona, non parallelismo su più processori (vedi 5.4).

### 1.5 Eventi tipizzati come base della tracciabilità

Ogni passaggio significativo emette un evento strutturato (`node:start`,
`kb:retrieved`, `branch:decided`, `guardrail:triggered`, `tool:invoked`,
`file:generated`, `capability:degraded`, `execution:aborted`…), persistito in
`execution_events`.

Su questo poggiano tre funzioni che altrimenti richiederebbero codice
dedicato: il registro di esecuzione, il pannello di spiegabilità e le metriche
di Monitoraggio. Nessuna delle tre ricostruisce nulla a posteriori.

### 1.6 I controlli sono nodi

I guardrail non sono impostazioni di un pannello: sono componenti della
palette, con la loro configurazione, che si collegano nel flusso come gli
altri. Chi costruisce vede dove agisce il presidio e in che ordine.

---

## 2. Schema del database

Diciassette tabelle. Riportate integralmente come esistono a runtime.

### 2.1 Agenti ed esecuzioni

```sql
agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,          -- UNIQUE via indice idx_agents_name
  nodes_json TEXT NOT NULL,
  edges_json TEXT NOT NULL,
  next_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  active INTEGER DEFAULT 0,    -- in produzione
  schedule_type TEXT,          -- manual | interval | cron
  schedule_value TEXT,
  last_run_at TEXT,
  context TEXT,                -- istruzioni generali dell'agente
  author TEXT                  -- per le medie per utente in Monitoraggio
)

exec_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent TEXT, nodes INTEGER,
  status TEXT,                 -- ok | err | waiting | aborted
  duration INTEGER,
  mode TEXT,                   -- builder | scheduled | replay
  summary TEXT, user TEXT, ts TEXT NOT NULL,
  steps_json TEXT,             -- righe del registro
  trace_json TEXT,             -- input/output di ogni chiamata (riesecuzione)
  replay_seed TEXT
)

execution_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id INTEGER NOT NULL,
  seq INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  node_id INTEGER,
  payload_json TEXT,
  ts TEXT NOT NULL
)
-- INDEX idx_exec_events_exec ON (execution_id, seq)
```

**Nota sul nome `exec_log`.** Il documento di specifica chiama questa tabella
`executions`. Nel codice si chiama `exec_log` ed è referenziata in una decina
di punti: è stata **estesa** (`trace_json`, `replay_seed`, `steps_json`) invece
che rinominata. Rinominarla avrebbe rotto codice funzionante senza vantaggio.

### 2.2 Knowledge Base

```sql
kb_docs (
  id TEXT PRIMARY KEY, name TEXT, size INTEGER, content TEXT,
  uploaded_at TEXT NOT NULL,
  source_type TEXT,        -- normativa|contratto|procedura|assistenza|tabella|non_strutturato
  business_unit TEXT, confidentiality TEXT,  -- pubblico|interno|riservato
  chunk_count INTEGER, indexed_at TEXT,
  origin TEXT,             -- caricato | agente: <nome> | sharepoint | drive
  origin_url TEXT
)

kb_chunks (
  id TEXT PRIMARY KEY, doc_id TEXT NOT NULL, ordinal INTEGER NOT NULL,
  text TEXT NOT NULL,        -- l'originale: è ciò che riceve l'agente
  context_prefix TEXT,       -- arricchimento contestuale
  embedding TEXT,            -- vettore TF-IDF serializzato
  metadata_json TEXT         -- etichetta sezione, tipologia, unità, riservatezza
)
-- INDEX idx_kb_chunks_doc ON (doc_id)
```

Il documento prevedeva una tabella `kb_documents` distinta. Nel codice i
documenti vivevano già in `kb_docs`, letta da caricamento, modale, export wiki,
pacchetto di uscita e statistiche del profilo: invece di affiancare un secondo
elenco degli stessi documenti, `kb_docs` è stata estesa.

### 2.3 Pubblicazione e governo

```sql
published_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, cat TEXT, icon TEXT, color TEXT, author TEXT,
  rating REAL, installs INTEGER, price TEXT, desc TEXT,
  tags_json TEXT, workflow_json TEXT, created_at TEXT NOT NULL,
  status TEXT,             -- bozza|in_verifica|in_revisione|pubblicato|sospeso|ritirato
  review_note TEXT,
  scope TEXT,              -- gruppo|business_unit|organizzazione|pubblico
  version TEXT,
  suspended_reason TEXT, suspended_at TEXT,
  source_agent_id INTEGER  -- collega alla riga in `agents` (non regressione)
)

publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT, agent_id INTEGER NOT NULL,
  version TEXT, requested_scope TEXT,
  checks_json TEXT,        -- esito dei controlli al momento della richiesta
  reviewer TEXT, decision TEXT, decided_at TEXT, notes TEXT,
  created_at TEXT NOT NULL
)

agent_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, agent_id INTEGER NOT NULL,
  version TEXT NOT NULL, definition_json TEXT NOT NULL,
  author TEXT, created_at TEXT NOT NULL, note TEXT
)

policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL, condition_json TEXT,
  required_guardrail TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  mode TEXT DEFAULT 'consigliata'   -- consigliata | obbligatoria
)

agent_memory (agent_id INTEGER, key TEXT, value TEXT, updated_at TEXT,
              PRIMARY KEY (agent_id, key))
my_agents (id INTEGER PRIMARY KEY AUTOINCREMENT, catalog_id INTEGER, installed_at TEXT)
```

### 2.4 Community e apprendimento

`forum_posts`, `forum_comments`, `learn_progress`, `quiz_done`,
`challenges_registered`, `xp_log`.

---

## 3. Connettori: conteggio esatto

**79 componenti** in 10 categorie di palette.

| Categoria | Componenti | Tipo nodo |
|---|---:|---|
| Trigger | 7 | `tr` |
| AI / LLM | 7 | `ai` |
| CRM | 4 | `ac` |
| Comunicazione | 6 | `ac` |
| ERP | 4 | `ac` |
| Azioni | 15 | `ac` |
| Dati | 5 | `ac` |
| DevOps | 6 | `ac` |
| Logica e output | 16 | `cd` `ou` `sa` |
| **Controlli** | **9** | `gr` |
| **Totale** | **79** | |

I nove controlli: Filtro contenuti · Mascheramento dati · Difesa da istruzioni
ostili · Verifica di fondatezza · Convalida output · Soglia di confidenza ·
Approvazione umana · Limitatore frequenza · Gestore eccezioni.

Il catalogo del Marketplace contiene **18 agenti** preconfezionati; il Learning
Hub **6 percorsi** da 6 lezioni ciascuno.

---

## 4. Fornitori di modelli

Sei voci configurabili, ciascuna con chiave e stato indipendenti, così che nodi
diversi dello stesso flusso possano usare fornitori diversi.

| Fornitore | Modello | Strumenti | Output vincolato | Immagini |
|---|---|:-:|:-:|:-:|
| Claude | `claude-sonnet-4-6` | ✓ | ✓ | ✓ |
| OpenAI | `gpt-4o-mini` | ✓ | ✓ | ✓ |
| Gemini | `gemini-flash-latest` | ✓ | ✓ | ✓ |
| Mistral | `mistral-large-latest` | ✓ | ✓ | ✗ |
| **Modello in locale** | rilevato dal server | ✗ | ✗ | ✗ |
| Endpoint personalizzato | indicato dall'utente | ✗ | ✗ | ✗ |

Gli identificativi stanno tutti in `AI_MODELS` (`js/ai-client.js`). Erano
ripetuti in otto punti: quando Google ha ritirato `gemini-2.0-flash`
l'integrazione ha iniziato a fallire riportando *«chiave non valida»* pur
avendo una chiave buona, perché il 404 sul modello veniva trattato come errore
di connessione.

Per i modelli locali (Ollama, LM Studio, LocalAI, Jan) l'elenco dei modelli
installati viene **interrogato** con `GET /v1/models` invece di essere digitato
a memoria.

Le capacità mancanti non impediscono l'esecuzione: **degradano in modo
esplicito e tracciato** (evento `capability:degraded`), mai in silenzio.

---

## 5. Semplificazioni del prototipo

Questa sezione elenca ciò che nel prototipo è dimostrativo o approssimato.
Nessuna delle voci seguenti è presentata come completa nell'applicazione.

### 5.1 Vettori TF-IDF, non embedding neurali

La ricerca semantica usa vettori TF-IDF calcolati localmente, combinati con
BM25. **Coglie riformulazioni lessicali, non parafrasi vere.**

Motivo: un modello di embedding (`transformers.js`) richiederebbe il download
di decine di megabyte da una CDN al primo utilizzo, incompatibile con
l'apertura da file locale e con i tempi di una dimostrazione.

Conseguenza sull'export: i vettori nel pacchetto di uscita sono riutilizzabili
solo con lo stesso metodo di calcolo; **le porzioni testuali consentono invece
la ricostruzione dell'indice con qualunque altro modello.**

### 5.2 Riordino deterministico

Il riordino dei primi candidati premia copertura dei termini e loro prossimità
nel testo. Non è una seconda valutazione fatta dal modello.

### 5.3 Invocazione strumenti: reale con chiave, simulata senza

Con un fornitore configurato il tool calling è nativo (formato Anthropic,
OpenAI o Gemini) e la scelta è del modello. Senza chiave la scelta è simulata
in modo deterministico e **marcata `[Demo]` nella traccia**: il pannello di
spiegabilità distingue sempre «scelto dal modello» da «simulato».

### 5.4 Concorrenza asincrona, non parallelismo

I nodi di un'ondata partono insieme con `Promise.all`. È concorrenza su un solo
thread JavaScript: due chiamate di rete si sovrappongono davvero, due
elaborazioni locali no.

### 5.5 Chiavi di idempotenza: contabilizzate, non applicate

Ogni invocazione genera una chiave `rel-{execId}-n{nodeId}-a{tentativo}`,
inviata come intestazione HTTP e registrata in traccia. **Nessun sistema
esterno la onora**: serve a dimostrare il meccanismo, non a deduplicare.

### 5.6 Esecuzioni sospese in memoria

Un flusso fermo su «Approvazione umana» conserva il proprio stato in memoria.
Chiudendo la scheda del browser va perso e va rilanciato.

### 5.7 Mascheramento a espressioni regolari

Riconosce codice fiscale, IBAN, partita IVA, email e telefono. **I nomi propri
non vengono mascherati**: servirebbe un riconoscimento di entità nominate.

### 5.8 Verifica di fondatezza per sovrapposizione lessicale

Misura quante parole dell'output compaiono nelle fonti recuperate. Dice se il
testo *pesca dalle fonti*, non se l'affermazione è vera. Senza porzioni
recuperate **dichiara di non poter verificare** invece di dare esito positivo.

### 5.9 Politiche: predefinito «consigliata»

Il documento di specifica prevedeva l'inserimento d'ufficio dei controlli
imposti. Il predefinito qui è **consigliata**: la validazione segnala e propone,
chi costruisce decide. La modalità obbligatoria esiste ed è selezionabile.

Motivo della divergenza: imporre un controllo dove il caso non lo richiede è
fuorviante e insegna a ignorare i presidi.

### 5.10 PDF generato a mano; estrazione senza librerie

**In uscita**: i PDF sono scritti direttamente (struttura 1.4, font Helvetica
standard, testo a capo calcolato). Sono file validi e apribili; non supportano
immagini, tabelle né stili. I caratteri fuori da Latin-1 vengono traslitterati.

**In ingresso**: PDF, DOCX, XLSX e PPTX **sono estraibili**, senza alcuna
libreria esterna. I formati Office sono contenitori ZIP, aperti con
`DecompressionStream` (nativa nel browser); dei PDF si scompattano gli stream
e si decodificano i caratteri leggendo le tabelle `ToUnicode`, con distinzione
fra codifica WinAnsi e Latin-1.

Il limite vero è un altro: **un PDF di sole immagini (una scansione) non
contiene testo da estrarre.** Non essendoci OCR, il caricatore lo dichiara
illeggibile invece di restituire caratteri casuali — `frLeggibile()` scarta le
estrazioni in cui prevalgono i simboli.

### 5.11 Tempi di esecuzione simulati

I nodi simulati completavano in millisecondi, rendendo illeggibile il registro.
È stato introdotto un ritardo dichiarato per tipo di nodo (60 ms per una
condizione, fino a ~1,4 s per un'azione verso un sistema esterno, ×1,9 per ERP
e data warehouse). **Non è la latenza di un'integrazione reale**: si applica
solo ai nodi simulati e solo in esecuzione interattiva.

### 5.12 Sospensione automatica delle pubblicazioni

La sorveglianza sul tasso di fallimento gira all'ingresso nel Marketplace, non
come servizio in ascolto. Nel prototipo non esiste un processo che possa
osservare continuamente.

### 5.13 Anagrafica dimostrativa, non un sistema di identità

Esistono quattro utenti registrati con credenziali (`js/utenti.js`) più un
profilo ospite, e ogni tabella porta la colonna `user`: agenti, esecuzioni,
progressi formativi, quiz, XP, iscrizioni e connessioni sono separati per
utente. Marketplace, Learning Hub e Community restano comuni.

Resta dimostrativo **come** l'identità è gestita: le password sono in chiaro
nel codice sorgente, il confronto avviene nel browser e l'isolamento fra utenti
è un `WHERE user = ?` sulle query. **Non è una misura di sicurezza**: chiunque
apra la console vede i dati di tutti. Serve a mostrare che la piattaforma è
multiutente, non a proteggere alcunché.

**Non esistono costi per token**, perché le chiavi sono dell'utente e la
piattaforma non le contabilizza.

### 5.14 Export: file singoli, non archivio

Il documento prevedeva un archivio ZIP (D5) e un pacchetto di uscita unico
(D6). Su indicazione esplicita l'export è rimasto a **file singoli**: JSON degli
agenti, script Python, wiki Markdown, documenti della Knowledge Base, log.

### 5.15 Applicazione installabile, non pacchetto dello Store

Manifest e service worker sono presenti: su Chrome o Edge serviti da un
indirizzo, RelAItion si installa come applicazione con finestra propria e
funziona offline. **Aprendo il file localmente non è installabile** — il
browser rifiuta il service worker da `file://`, ed è corretto che lo faccia.

Non è un pacchetto del Microsoft Store: servirebbe un MSIX firmato.

### 5.16 Autenticazione dimostrativa

La schermata di accesso non autentica: qualunque credenziale funziona, nessun
dato lascia il browser. Serve a dare completezza all'esperienza.

---

### 5.17 Dati dimostrativi precaricati

Al primo avvio `js/seed-demo.js` crea cinque flussi di riferimento, sei
documenti nella Knowledge Base, undici esecuzioni storiche con esiti misti e
due pubblicazioni (una in coda di revisione, una attiva).

Sono **dati costruiti**, non l'esito di un uso reale: le date sono retrodatate
e gli esiti scelti perché ogni schermata abbia qualcosa da mostrare. Il seme
gira una sola volta e mai sopra dati esistenti; `rimuoviDatiDemo()` li toglie
lasciando intatto ciò che l'utente ha costruito.

Il flusso di esempio che compare aprendo il Builder non viene invece salvato:
resta marcato come effimero finché non lo si modifica, altrimenti comparirebbe
fra gli agenti dell'utente e falserebbe le metriche di Monitoraggio.

## 6. Vincoli da rispettare nelle modifiche

1. **Nessun passo di compilazione.** Niente bundler, niente moduli ES, niente
   dipendenze da installare.
2. **L'ordine degli script in `index.html` conta.** Un modulo che usa funzioni
   di un altro va caricato dopo.
3. **Nessuna risorsa esterna obbligatoria.** Tutto ciò che serve
   all'avvio deve essere nella cartella.
4. **Prima di modificare una funzione, verificare chi la chiama.** Le funzioni
   sono in ambito globale: non c'è un compilatore che segnali le rotture.
5. **Ciò che è simulato va dichiarato.** In traccia, nell'interfaccia, o qui.

### 5.18 Estrazione documentale senza OCR

`js/fileread.js` estrae il testo direttamente nel browser, senza librerie
esterne: `DecompressionStream` scompatta gli archivi ZIP (`.docx`, `.xlsx`,
`.pptx`) e gli stream `FlateDecode` dei PDF. Un `.xlsx` viene convertito in CSV,
formato che i nodi AI e la Knowledge Base già leggono.

Per i PDF l'estrazione ricostruisce il testo dagli operatori `Tj`/`TJ` e applica
le tabelle **ToUnicode**: i PDF prodotti da Word incorporano sottoinsiemi di font
in cui il codice del carattere non è il suo valore Unicode, e senza quelle
tabelle il testo esce come sequenza di simboli. La codifica di riferimento è
WinAnsi, non Latin-1 — differenza che riguarda apostrofi e virgolette
tipografiche: letti come Latin-1 sparivano, e "l'art. 9" diventava "lart. 9".

Tre limiti dichiarati:

- **Nessun riconoscimento ottico.** Un PDF nato da scansione contiene immagini,
  non testo. L'estrattore misura la percentuale di caratteri leggibili e, se il
  risultato è illeggibile, **rifiuta il file spiegando perché** invece di
  consegnare simboli casuali al modello — che avrebbe comunque prodotto una
  risposta, plausibile e priva di fondamento.
- **Parole occasionalmente spezzate.** Senza le metriche dei font non si può
  sapere se due frammenti adiacenti appartengono alla stessa parola: in un PDF
  giustificato può comparire "secondo li vello". Si è preferito questo alla
  regola opposta, che unisce i frammenti e fonde insieme parole distinte —
  errore più dannoso per chi legge e per il modello.
- **Formati esclusi:** binari legacy (`.doc`, `.xls`, contenitore OLE) e immagini.

### 5.19 Segmentazione e riconoscimento del tipo di documento

Un documento va spezzato in porzioni prima di essere indicizzato, e la
segmentazione dipende dal tipo riconosciuto. Due regole meritano una nota
perché non sono ovvie:

- **Nessuna porzione supera i 900 caratteri.** Un `.docx` estratto arriva con i
  paragrafi separati da un solo a capo: prima veniva letto come un blocco unico
  e produceva porzioni da 45.000 caratteri, che recuperate riempivano l'intero
  prompt con testo in gran parte non pertinente. Ora i blocchi troppo lunghi
  vengono divisi sui confini di frase, riportando l'ultima frase nella porzione
  seguente perché una risposta a cavallo del taglio resti recuperabile.
- **Una tabella si riconosce dalla coerenza delle colonne, non dai separatori.**
  Contare le virgole classificava come tabella qualunque prosa italiana ben
  punteggiata; guardare solo la prima riga nascondeva ogni foglio di calcolo con
  un titolo in testa. Il criterio è duplice: lo stesso numero di colonne sulla
  maggioranza delle righe, e celle fatte di poche parole — in una tabella i
  campi sono etichette e valori, non proposizioni.

Un foglio di lavoro con più fogli di forma diversa non è una tabella sola:
viene trattato come testo strutturato, con porzioni da circa 800 caratteri.

### 5.20 Salvataggio su cloud tramite cartella sincronizzata

Il nodo **Salva su cloud** non parla con le API di Google Drive o SharePoint, e
non può: OAuth richiede un *client secret*, che in un'applicazione servita al
browser sarebbe leggibile da chiunque apra il codice sorgente. Non è una scelta
di semplificazione ma un vincolo dell'architettura senza backend.

La versione realizzata scrive **davvero** su disco tramite la File System Access
API: l'utente collega una volta una cartella — tipicamente quella sincronizzata
da Google Drive, OneDrive o Dropbox — e il flusso vi scrive dentro, creando le
sottocartelle indicate nel campo *Percorso*. Il client di sincronizzazione porta
poi il file sul cloud. Il permesso è concesso dall'utente, revocabile, e
l'handle della cartella è conservato in IndexedDB perché sopravviva alla
chiusura del browser.

Due limiti dichiarati anche nell'interfaccia:

- Un **percorso assoluto** (`C:\Users\…\Google Drive\Report`) non è scrivibile:
  il browser non esce dalla cartella autorizzata. Il percorso viene reinterpretato
  come relativo e lo scostamento è riportato nel registro di esecuzione.
- Da `file://` o da browser senza File System Access API la scrittura non è
  possibile: il nodo ripiega sul download e lo dichiara, invece di fallire.

La quinta destinazione, **Connessione API diretta**, è dichiaratamente simulata:
genera il file reale ma non effettua alcun caricamento, e il registro marca
l'esito come simulato con un identificativo `sim-…`. È lì per mostrare come si
presenterebbe l'integrazione vera, non per farla credere presente.

### 5.21 Troncamento dell'input ai modelli

Un documento esteso supera la finestra di contesto e farebbe fallire la chiamata
con un errore del fornitore, incomprensibile per chi usa la piattaforma. Il
motore tronca quindi l'input a 60.000 caratteri (~15.000 token, sotto il limite
di tutti i fornitori integrati) e **scrive nel registro quanti caratteri non
sono stati inviati**, indirizzando alla Knowledge Base per i documenti lunghi:
lì il recupero seleziona i passaggi pertinenti invece di troncare in coda.

### 5.22 Esclusione di un nodo dall'esecuzione

Un nodo può essere marcato `escluso` — l'equivalente di commentare una riga di
codice. Resta sul canvas con la sua configurazione e le sue connessioni, ma al
Run viene saltato: `rtGrafoEffettivo()` costruisce una **copia** del grafo in cui
le connessioni entranti del nodo sono ricucite su quelle uscenti, così il flusso
prosegue come se il nodo non fosse mai stato inserito. Il grafo sul canvas non
viene mai modificato: togliere il flag ripristina tutto senza perdite.

Tre conseguenze volute:

- **La convalida gira sul grafo effettivo**, non su quello disegnato. Un nodo
  escluso non segnala più i propri campi obbligatori, ma se la sua esclusione
  spezza il flusso — togliendo l'unico output, o l'unico trigger — l'errore
  compare prima del Run e non durante.
- **L'esclusione è dichiarata nel registro di esecuzione** come primo passo. Un
  risultato ottenuto saltando un controllo non è confrontabile con uno ottenuto
  a flusso intero, e chi legge deve saperlo prima di interpretarlo.
- **I controlli imposti da politica non sono escludibili**: sarebbero altrimenti
  un modo per aggirarli senza che ne resti traccia.

Comandi: pulsante nel pannello proprietà, azione sulla selezione multipla,
scorciatoia Ctrl+E.

### 5.23 Configurazione iniziale dei nodi

Ogni nodo trascinato dalla palette nasce con i propri campi obbligatori già
valorizzati, ricavati dai suggerimenti delle definizioni dei campi. Prima ne
riceveva una sola, `{model:'claude', prompt:'', temperature:0.7}`, qualunque
fosse il suo tipo: un "Esporta file" appena inserito non aveva né nome file né
formato, bloccava l'esecuzione al primo Run, e nulla lasciava capire che
bastasse aprirlo e compilarlo. Il nome del file predefinito deriva dal nome del
nodo, perché tre export nello stesso flusso non producano tre file omonimi.

### 5.24 Scelta automatica del fornitore su un nodo AI

Ogni nodo AI può indicare un fornitore preciso oppure restare su **Automatico**,
che è il valore predefinito: in quel caso `risolviProvider()` usa quello
effettivamente collegato. È ciò che rende eseguibile un flusso appena si integra
*una* chiave, senza dover aprire ogni nodo per cambiargli il fornitore.

Prima l'assenza di scelta significava `claude` in silenzio. Chi configurava
Gemini o GPT si trovava tutti i flussi bloccati da un errore di convalida che
citava un fornitore mai selezionato — e i flussi di riferimento precaricati, che
nascevano tutti pinnati su Claude, erano ineseguibili per chiunque usasse un
altro fornitore.

Due comportamenti volutamente distinti:

- **Automatico** non produce errori di convalida finché almeno un fornitore è
  collegato, e il registro annota quale è stato usato.
- **Un fornitore scelto esplicitamente ma non collegato** resta un errore
  bloccante in convalida. In esecuzione, se accade comunque, la sostituzione
  viene dichiarata nel registro (`↪️ Il nodo indica X, non collegato: eseguito
  con Y`): un risultato prodotto da un modello diverso da quello indicato va
  letto sapendolo.

Le capacità del fornitore (output strutturato nativo, chiamata a strumenti) si
interrogano sul fornitore **risolto**: chiedendole su `"auto"` la risposta era
sempre "non supportato", e ogni nodo con output vincolato ripiegava senza motivo
sul vincolo scritto nel prompt.

### 5.25 Parametri dei connettori: cosa è reale e cosa è simulato

I connettori hanno ora i parametri che servono davvero a una connessione, non
un campo simbolico. Ogni nodo dichiara nel proprio pannello — *prima* di essere
eseguito — se l'azione è reale o simulata e perché.

**Reali.** Google Drive e SharePoint scrivono sul disco tramite la File System
Access API, nella cartella locale sincronizzata dal client del servizio, che
carica poi il file sul cloud. Creano le sottocartelle del percorso indicato e
falliscono in modo esplicito se la cartella non è collegata.

**Simulati, per un vincolo di piattaforma.** SMTP, PostgreSQL, MongoDB, Redis e
S3 parlano protocolli su TCP, che una pagina web non può aprire: il browser
espone solo HTTP verso origini che lo consentono. Le credenziali, inoltre, non
possono stare in un file servito al client. I parametri sono però completi e
corretti — host e porte reali dei provider di posta, `sslmode` di PostgreSQL,
regione e classe di archiviazione di S3 — e lo **script Python esportato li usa
per connettersi davvero**. La simulazione riguarda l'esecuzione dentro il
browser, non la configurazione.

I preset SMTP (Gmail, Microsoft 365, Aruba, Register.it, SendGrid, SES)
compilano host, porta e cifratura, e riportano l'avvertenza specifica del
provider: la password per le app di Google, il tenant da abilitare su
Microsoft 365, l'utente letterale `apikey` di SendGrid. Sono le ragioni per cui
un invio non parte, e vanno lette mentre si configura, non dopo.

### 5.26 Parametri di ingresso dei trigger

Webhook e Form submit dichiarano i propri parametri (`nome | etichetta |
obbligatorio`). Il pannello genera da quella dichiarazione un modulo
compilabile, e i valori inseriti diventano il payload JSON che apre realmente
la pipeline: i numeri restano numeri, così i nodi a valle non devono
convertirli. Un parametro dichiarato obbligatorio e lasciato vuoto blocca la
convalida. Prima l'unico modo di passare dati propri era incollare un JSON
grezzo nel campo "payload di test", che resta disponibile per le strutture
annidate.

### 5.27 Istruzioni predefinite dei nodi AI

Ogni nodo AI nasceva con il prompt vuoto: trascinare "Summarizer" ed eseguire
produceva una risposta generica, perché al modello non era stato detto nulla.
Ora ogni nodo porta il proprio compito, il formato di uscita atteso e il divieto
esplicito di inventare dati assenti — tutto modificabile, ma già utile.

Due nodi nuovi per l'analisi: **Analisi dati** produce statistiche descrittive,
distribuzioni e anomalie da contenuto tabellare, in JSON perché il risultato
possa alimentare un export o un grafico; **Confronto documenti** produce una
tabella delle differenze fra due testi, separando quelle sostanziali da quelle
di sola forma.

### 5.28 Tassonomia della palette e distinzione fra connettori

I nodi terminali vivevano nella categoria "Logic" insieme al controllo di
flusso: **Output** è ora una categoria propria (8 nodi), e "Logic" contiene solo
ciò che governa il percorso — condizioni, cicli, attese, ritenta, unione e
divisione dei rami.

Molti connettori si somigliavano al punto da sembrare lo stesso nodo con
un'icona diversa: avevano uno o due campi generici ("progetto", "database") che
non riflettevano il rispettivo modello di dati. Ora ogni connettore espone i
parametri del proprio dominio — Jira ha priorità, assegnatario ed etichette;
Trello board, lista e posizione; Notion proprietà tipizzate; Teams una Adaptive
Card con titolo, importanza e pulsante; Stripe importo in centesimi, valuta e
metadati; SAP sistema, modulo, BAPI e codice società.

Due duplicati sono stati risolti alla radice:

- **"Invia email" e "Email SMTP"** facevano la stessa cosa con parametri
  diversi. Resta un solo nodo di posta, con la configurazione SMTP completa.
- **Google Drive e SharePoint** condividono volutamente gli stessi campi:
  usano lo stesso meccanismo (cartella locale sincronizzata) e differiscono solo
  per il servizio che la sincronizza.

Anche le **opzioni avanzate** non sono più identiche ovunque. Timeout e tentativi
hanno senso per chi attende una risposta dalla rete; su una scrittura locale non
significano nulla, e mostrarli suggeriva un comportamento che il nodo non ha.
Drive e SharePoint espongono quindi solo "Esegui solo se" e la gestione errori.

### 5.29 Chat builder: perché le modifiche non erano risolutive

Tre cause, tutte nel prompt della modalità *modifica*:

- **Al modello non venivano dati i nomi dei campi di configurazione.** Inventava
  chiavi plausibili ma inesistenti — `destinatario` invece di `to` — e il nodo
  aggiunto nasceva con i campi obbligatori vuoti: la modifica sembrava riuscita
  ma il flusso non partiva. Ora l'elenco dei connettori include le chiavi
  obbligatorie di ciascuno.
- **Mancava un esempio funzionante.** La modalità creazione ne aveva uno, la
  modifica no, ed era la meno affidabile delle due.
- **Non era spiegato dove inserire un nodo.** Un `add` senza `dopo`/`prima`
  produceva un nodo scollegato, che il motore non esegue mai. Ora la regola è
  esplicita, insieme agli invarianti che la modifica deve preservare (inizio con
  trigger, chiusura su output, nessun nodo isolato).

Infine, una modifica applicata che lascia il flusso non eseguibile **lo dichiara
subito**, elencando cosa manca, invece di lasciarlo scoprire premendo Esegui.

### 5.30 Dimensionamento dei grafici del Monitoraggio

I grafici occupavano una frazione del riquadro che li conteneva: l'area delle
esecuzioni riempiva il 42% dell'altezza, il calibro il 48%. Le colonne impilate
avevano larghezza fissa calcolata su un box di 680px — in un riquadro da 478 ne
restava metà vuota a destra, e il grafico sembrava tagliato.

Ora le colonne si dividono lo spazio disponibile (`flex:1`) e anche il distacco
fra loro è proporzionato al numero di giorni: su 90 giorni un valore fisso di
3px sommava 267px di soli vuoti e faceva debordare il riquadro. Verificato su
tutti i periodi selezionabili (7, 14, 30, 90 giorni): il grafico resta dentro il
proprio riquadro e nessuna scheda scorre in orizzontale.

### 5.31 Profili utente differenziati

Il cruscotto ricava gli utenti dalle tracce lasciate (autori di agenti,
esecutori, autori di pubblicazioni e post): non esiste un'anagrafica, ed è
dichiarato in 5.13. I quattro nomi presenti avevano però un'attività quasi
identica — 3, 3, 3 e 2 esecuzioni — quindi le medie per utente e la
distribuzione non dicevano nulla, e il cruscotto mostrava quattro colonne uguali.

I profili hanno ora comportamenti distinti, che è ciò che rende leggibili le
metriche di distribuzione:

| Profilo | Ruolo | Esecuzioni | Tratto |
|---|---|---|---|
| Mario R. | Automation Specialist | 17 | costruisce dal builder, qualche errore e un'interruzione |
| Giulia D. | Responsabile Operations | 15 | quasi tutto pianificato e riuscito |
| Marco R. | Analista processi | 9 | volumi bassi, un terzo di fallimenti |
| Sara L. | Compliance | 7 | poche esecuzioni, spesso in attesa di approvazione |

Le undici esecuzioni "narrate" (con riassunti scritti a mano) restano quelle
mostrate nei registri; le altre danno volume e differenze fra persone. Gli orari
sono distribuiti in fascia lavorativa, perché la mappa oraria mostri un uso
d'ufficio e non attività notturna casuale.

### 5.32 Community: post modificabili e con allegati

Un post può ora portare un **allegato** — il workflow esportato di cui parla, un
CSV di prova, una checklist — che gli altri scaricano con un click. È ciò che
distingue un racconto da un contributo utilizzabile: senza il file, un post che
descrive un flusso non permette a nessuno di provarlo.

Il contenuto è conservato come data URL nel database, quindi:

- **si riscarica identico**, anche per i formati binari, che una conversione a
  testo rovinerebbe;
- **rientra nell'esportazione del database**, l'unico backup che il prototipo ha;
- **è limitato a 500 KB**, perché il database vive in IndexedDB e viene
  serializzato per intero a ogni salvataggio.

L'autore può modificare ed eliminare i propri post; su quelli altrui i comandi
non compaiono. Una modifica viene **dichiarata con data e ora** sotto al testo:
chi ha già commentato deve poter capire che il contenuto a cui rispondeva
potrebbe non essere più quello.

### 5.33 Copertura dei contenuti formativi

Sei lezioni dei primi due percorsi — "Fondamenti AI Agent" e "Builder Avanzato"
— non avevano testo: aprendole compariva il segnaposto "contenuto in
preparazione", proprio all'inizio del percorso formativo, cioè dove arriva per
primo chi non conosce la piattaforma.

Sono ora scritte (`js/lessons-fondamenti.js`), ciascuna con il proprio quiz:
cos'è un agente e quando *non* conviene usarlo, come funziona un modello
linguistico e perché le allucinazioni non sono un difetto da correggere con un
prompt migliore, il ciclo ragiona-agisci-osserva e il suo rischio di non
terminare, la costruzione del primo flusso, le condizioni deterministiche
contro quelle valutate dal modello, e l'integrazione HTTP con il vincolo CORS
che si incontra al primo tentativo.

Copertura finale: **36 lezioni su 36**, tutte con contenuto e quiz.

### 5.34 Intestazione del builder: la chat non copre più il canvas

La barra della chat e i suoi suggerimenti stavano in posizione assoluta *sopra*
il canvas: coprivano i nodi più in alto, cioè proprio il trigger — l'inizio del
flusso. Il rimedio precedente era un margine calcolato (`ingombroChat`), che
funzionava solo finché qualcuno si ricordava di applicarlo.

La colonna centrale è ora divisa in due fasce: `.builder-header`, che contiene
la chat, e `.canvas-area` sotto. La sovrapposizione non è più possibile **per
costruzione**, non per calcolo. `ingombroChat()` resta ma misura la
sovrapposizione reale invece di darla per scontata: se un domani la barra
tornasse a galleggiare, il calcolo continuerebbe a funzionare.

Verificato che le coordinate di rilascio dalla palette restano esatte: il
`drop` cade dove ci si aspetta, perché sono sempre riferite a `canvasArea`, che
ora è un elemento proprio.

### 5.35 Inserimento assistito dei controlli richiesti

La verifica di pubblicazione elencava i controlli mancanti per l'ambito scelto,
ma lasciava all'utente il compito di capire **dove** metterli. Non è un
dettaglio: un mascheramento inserito dopo la chiamata al modello non protegge
nulla, e una convalida prima non ha niente da convalidare.

Il pannello offre ora un pulsante che li inserisce nel punto corretto, con la
motivazione accanto a ciascuno:

| Controllo | Posizione | Perché |
|---|---|---|
| Mascheramento dati, Filtro contenuti, Difesa da istruzioni ostili | prima del primo nodo AI | agiscono sul testo in ingresso |
| Convalida output, Verifica di fondatezza | dopo l'ultimo nodo AI | agiscono su ciò che il modello ha prodotto |
| Gestore eccezioni, Approvazione umana | prima del primo output | precedono la chiusura del flusso |

L'inserimento ricuce gli archi esistenti (il nodo entra *dentro* la catena, non
accanto) e sposta in basso i nodi a valle per fare spazio. Su un flusso
Webhook → AI → Output con ambito «Catalogo pubblico» il risultato è:
Webhook → **Mascheramento** → AI → **Convalida** → **Gestore eccezioni** → Output.

**Un falso positivo corretto nel farlo:** il controllo sulle credenziali
segnalava il campo `auth` del Webhook, che è una tendina e vale "Bearer token"
— il *metodo* di autenticazione, non un segreto. Ora i campi a scelta chiusa
sono esclusi dalla ricerca di credenziali: i loro valori sono quelli dichiarati
nella definizione e non possono contenere una chiave. Verificato che una chiave
vera incollata in un campo libero, o un campo chiamato `apikey`, restano
entrambi bloccanti.

### 5.36 Il seme si mantiene da solo

Ogni volta che un connettore acquisiva un campo obbligatorio, i cinque flussi di
riferimento smettevano di validare — è successo con SAP, Jira, Teams e il nodo
di posta. `seedFlusso()` completa ora i campi obbligatori dalle definizioni dei
connettori, quindi il seme resta corretto senza doverlo aggiornare a mano a ogni
modifica della palette.

### 5.37 Invio email reale tramite servizio locale

**Questa è l'unica deroga al vincolo "nessun backend", ed è stata richiesta
esplicitamente.** Una pagina web non può aprire una connessione SMTP: SMTP
viaggia su TCP, il browser parla solo HTTP. `servizio-mail/relaition-mail.ps1`
colma esattamente quel divario e nient'altro — riceve una richiesta HTTP dal
builder e la inoltra al server di posta con `System.Net.Mail.SmtpClient`.

È scritto in PowerShell perché è l'unico runtime presente di serie su Windows:
non richiede installazioni, e la macchina di sviluppo non ha né Node né .NET SDK.

**Le credenziali non passano mai dal browser.** È la scelta di fondo. La
password viene chiesta all'avvio del servizio, resta nella memoria di quel
processo e non entra mai nella pagina, nel database, nei flussi esportati o
nelle pubblicazioni. Il nodo invia solo destinatario, oggetto e corpo. È anche
la ragione per cui il nodo email ha perso i campi server, porta, cifratura e
utente: erano da compilare due volte e, se compilati, avrebbero portato una
password dentro il database.

Il servizio verifica la configurazione all'avvio inviando **un messaggio di
prova al proprietario dell'indirizzo**: se le credenziali sono sbagliate si
scopre subito, con il messaggio del server di posta sotto gli occhi, invece che
al primo Run dentro l'applicazione.

Con Gmail serve una **password per le app** (verifica in due passaggi attiva):
la password dell'account viene rifiutata. Le istruzioni sono in
`servizio-mail/LEGGIMI.md`.

**Senza il servizio avviato il flusso funziona lo stesso**: l'invio viene
registrato come simulato e il registro lo dichiara. Costruire un flusso non deve
dipendere dall'aver avviato un servizio.

### 5.38 Segnaposto risolti sui dati giusti

I campi dei connettori accettano `{{result}}`, `{{result.campo}}`, `{{oggi}}` e
segnaposto con nome libero come `{{mittente}}`.

Il punto non ovvio è **da dove** viene il valore. Un `{{mittente}}` su un nodo
email a valle di un modello non si riferisce all'output del modello — che a quel
punto ha sostituito la pipeline — ma a chi ha avviato il flusso. I dati
d'ingresso restano quindi disponibili per tutta l'esecuzione (`ctx.triggerData`)
e la risoluzione cerca prima nell'output del nodo a monte, poi lì.

Un segnaposto che non si risolve **non viene svuotato**: sparendo diventerebbe
un destinatario vuoto o un oggetto monco, e nessuno capirebbe da dove viene.
Resta scritto, e sul destinatario di un'email l'invio viene **bloccato** con la
spiegazione: meglio non inviare che inviare a un indirizzo inesistente.

Per lo stesso motivo il campione del trigger Email è ora strutturato
(`mittente`, `nome`, `oggetto`, `corpo`) invece di un blocco di testo: senza
quei campi un flusso che risponde al mittente non poteva funzionare.

### 5.39 Un solo costruttore di file

Scaricare un file e scriverlo sulla cartella sincronizzata seguivano due strade
diverse, e la seconda passava dal costruttore generico: **un PDF scritto su
Drive veniva salvato come UTF-8, cioè corrotto e non apribile**. Ora entrambe
passano da `foBlob()`, che applica al formato ciò che gli serve — byte Latin-1
per il PDF, BOM per il CSV perché Excel non mostri gli accenti corrotti.

Verificato su tutti i formati: il PDF generato è rileggibile dall'estrattore
dell'applicazione stessa, il CSV ha colonne coerenti, il JSON è valido, l'HTML
contiene una tabella vera e il Markdown ha il separatore di intestazione.

### 5.40 Registro ridimensionabile e ancorato alla colonna

Il registro era ancorato a coordinate fisse (`left:260 right:300`) invece che
ai bordi della colonna del canvas: cambiando la larghezza dei pannelli finiva
leggermente sotto la palette o sotto le proprietà. Ora sta dentro la colonna.

Tre modi di dimensionarlo, perché servono in momenti diversi: l'intestazione
apre e chiude, `⤢` porta a tutta altezza e riporta indietro, il bordo
superiore si trascina per una misura a scelta.

L'altezza viene scritta come **stile in linea**, non affidata alle sole classi:
alcuni browser non ricalcolano lo stile di un elemento assoluto quando cambia
soltanto la classe, e il pannello restava chiuso pur avendo ricevuto il comando.
Per la stessa ragione le decisioni ("è aperto? allora chiudilo") si basano
sull'altezza **voluta**, tenuta in stato, e non su quella misurata: leggere il
riquadro reso significa dipendere da quando il browser ricalcola il layout.

### 5.41 Orientamento del flusso

Il flusso può scorrere in verticale (porte sopra e sotto) o in orizzontale
(porte a sinistra e a destra, come in n8n). Il pulsante `⇅`/`⇄` cambia tre cose
insieme, e cambiarne una sola darebbe un risultato peggiore di prima:

- **dove stanno le porte**, via CSS;
- **come esce la curva** di collegamento — uscire nella direzione sbagliata
  produce cappi che attraversano i nodi;
- **come dispone il riordino automatico**, altrimenti i nodi resterebbero
  incolonnati con le porte laterali e le frecce tornerebbero indietro.

Il riordino è stato riscritto: prima incolonnava i nodi nell'ordine dell'array,
quindi su un flusso con diramazioni le frecce si incrociavano tutte. Ora assegna
a ogni nodo il livello del predecessore più uno e affianca quelli dello stesso
livello, centrati rispetto al nodo da cui si diramano.

### 5.42 Campi dipendenti dei nodi

Un nodo mostra parametri diversi a seconda di cosa si è scelto prima. Tre
dichiarazioni facoltative sulla definizione di un campo:

| Dichiarazione | Effetto |
|---|---|
| `mostraSe: {campo, vale:[…]}` | il campo compare solo per certi valori di un altro |
| `optsPer: {…}` con `dipendeDa` | l'elenco a tendina dipende da un'altra scelta |
| `reqSe: {campo, vale:[…]}` | obbligatorio solo in certi casi |

**Un campo nascosto non è mai obbligatorio**: chiedere un valore che non si può
nemmeno vedere renderebbe il flusso impossibile da convalidare. Il pannello si
ridisegna quando cambia un campo da cui altri dipendono.

Applicato dove cambia davvero qualcosa:

- **Notion** — "Crea pagina" chiede il titolo; "Aggiorna" chiede l'identificativo
  della pagina; "Aggiungi riga" chiede solo le proprietà.
- **MongoDB** — il filtro compare per aggiornare, cercare ed eliminare, non per
  inserire: inserendo non c'è nulla da selezionare.
- **Stripe** — un rimborso parte da un pagamento, non da importo e valuta;
  creare un cliente non ha un importo affatto.
- **Google Sheets** — leggendo serve l'intervallo, scrivendo servono le colonne.
- **Elasticsearch** — il documento per indicizzare, la query per cercare.

### 5.43 Webhook in ascolto

Una pagina web può *fare* chiamate, non *riceverne*. `servizio-webhook/` riceve
le chiamate esterne e le tiene in coda; il builder le preleva e avvia il flusso
con i dati arrivati. È il funzionamento di n8n riportato in un contesto senza
backend: chi chiama non parla col browser, ma lascia il messaggio a un
intermediario che il browser interroga.

Tre forme accettate, tutte verificate con chiamate reali:

| Forma | Come arriva al flusso |
|---|---|
| JSON nel corpo | payload strutturato, campi accessibili con `{{campo}}` |
| Parametri nell'indirizzo | uniti al corpo; in conflitto vince il corpo |
| File (`X-Nome-File`) | come un documento caricato a mano, con il prefisso `[FILE: nome]` |

Al prelievo la chiamata viene **rimossa dalla coda**: deve avviare il flusso una
volta sola, non a ogni controllo. L'ascolto parte solo quando l'utente lo chiede
e si ferma alla prima chiamata — il senso è vedere il flusso partire davvero,
non tenere un sondaggio acceso in permanenza.

Senza il ricevitore avviato il flusso funziona lo stesso, con i parametri
inseriti a mano nel pannello.

### 5.45 Scelta del modello, non solo del fornitore

Il fornitore dice *con chi* si parla, il modello dice *quanto costa* e quanto
bene risponde. Sono due decisioni diverse: su un flusso che classifica mille
richieste al giorno il modello economico cambia il conto di fine mese, su una
stesura di testo cambia il risultato.

Collegata la chiave, ogni nodo AI sceglie fra i modelli di quel fornitore, con
la descrizione accanto per decidere senza andare a cercare i listini. Il modello
scelto arriva davvero nella richiesta — verificato intercettando la chiamata:
`https://api.openai.com/v1/chat/completions` con `model: gpt-4o`.

Un modello scelto per un fornitore e poi usato con un altro **ricade sul
predefinito** invece di essere inviato così com'è: mandare `gpt-4o` a Gemini
produrrebbe un 404 che parla di modello inesistente invece che di scelta
incoerente. Il modello effettivo è scritto nel registro: due esecuzioni dello
stesso flusso con modelli diversi possono dare risultati diversi, e senza
saperlo il confronto fra due registri non significa nulla.

### 5.46 Analisi di più documenti: cartelle e indirizzi web

Un flusso che analizza documenti raramente ne analizza uno solo. Il trigger
File upload offre quindi tre sorgenti, con la stessa resa a valle:

- **File singolo** — come prima;
- **Cartella sul computer** — scelta con la File System Access API, con filtro
  per estensione e profondità di ricorsione selezionabile;
- **Indirizzi web** — scaricati e letti uno per riga.

Tre accortezze che contano più della funzione stessa:

1. **Limiti dichiarati**: 25 file e 20 MB per esecuzione. Oltre, la lettura
   bloccherebbe l'interfaccia e saturerebbe la memoria; il pannello lo dice
   prima, e i file esclusi sono elencati con il motivo.
2. **Un file illeggibile non ferma il lotto**: viene messo fra gli scartati e
   la lettura prosegue.
3. **Ogni documento porta la propria intestazione** nel testo composto
   (`===== DOCUMENTO: nome (tipo) =====`): senza, il modello non potrebbe
   attribuire un'informazione al documento da cui viene.

Per gli indirizzi web il limite è il browser: scarica solo da server che lo
consentono esplicitamente (CORS). È scritto nel pannello **prima** di provare,
perché l'errore di rete che si otterrebbe non dice "CORS" e manderebbe a
cercare la causa sbagliata.

### 5.47 Dati separati per utente

Ogni account ha i propri dati. Il criterio della separazione: **è comune ciò che
l'organizzazione mette a disposizione, è personale ciò che una persona
costruisce o fa.**

| Personale | Comune |
|---|---|
| Agenti creati | Marketplace |
| Esecuzioni e registro | Contenuti del Learning Hub |
| Agenti installati | Community |
| Progressi, quiz, sfide, punti | Knowledge Base aziendale |
| Profilo e statistiche | Politiche di governo |

Il **Monitoraggio resta trasversale**: serve proprio a guardare la piattaforma
nel suo insieme, e filtrarlo per utente lo renderebbe inutile.

Le tabelle personali hanno una colonna `user`. Tre di esse — progressi, quiz e
iscrizioni alle sfide — avevano una chiave primaria che non la comprendeva: due
persone non avrebbero potuto completare la stessa lezione. Sono state ricreate
con l'utente nella chiave, migrando le righe esistenti a Mario R., che è
l'account con cui la piattaforma è stata usata finora.

Anche l'univocità del nome di un agente è ora per utente: due persone possono
avere entrambe un flusso chiamato "Estrazione fatture" senza che l'una
sovrascriva l'altra.

Verificato entrando con i diversi account:

| Account | Agenti propri | Esecuzioni proprie |
|---|---|---|
| Mario R. | 2 | 18 |
| Giulia D. | 1 | 15 |
| Sara L. | 1 | 7 |

Marketplace (19 agenti) e Community (15 post) restano identici per tutti, e il
Monitoraggio continua a vedere 4 utenti e 49 esecuzioni.

### 5.48 Account e credenziali

| Email | Password | Ruolo |
|---|---|---|
| `mario.rossi@relaition.com` | `mario1234` | Automation Specialist |
| `giulia.deangelis@relaition.com` | `giulia1234` | Responsabile Operations |
| `marco.russo@relaition.com` | `marco1234` | Analista di processo |
| `sara.lombardi@relaition.com` | `sara1234` | Compliance & Data Protection |
| *Continua come ospite* | — | Visitatore, dati propri e vuoti |

La schermata di accesso li elenca cliccabili: in una demo nascondere le
credenziali significa solo impedire di provare i profili.

**L'autenticazione resta dimostrativa**: la password è confrontata in chiaro nel
client, dove chiunque può leggerla, e i dati sono separati da una clausola
`WHERE`, non da un permesso applicato dal database. Serve a mostrare che la
piattaforma distingue le persone e i loro dati, non a proteggerli: in un sistema
reale la separazione va applicata lato server, dove il client non può aggirarla.
Un indirizzo non riconosciuto entra come ospite; per un account noto la password
deve però corrispondere, altrimenti il controllo non significherebbe nulla.

### 5.49 Schermata di accesso e account ospite

Le schede degli account stavano in colonna con la password scritta sotto:
occupavano mezza schermata e mostravano una credenziale che non serve leggere,
visto che cliccando la scheda viene compilata da sola. Ora sono quattro riquadri
in due colonne di uguale larghezza, e la password non compare da nessuna parte.

**"Continua come ospite" ha un account proprio** (`Ospite`, ruolo Visitatore).
Prima entrava senza identità e finiva per usare quella predefinita: gli agenti
e le esecuzioni di chi provava la piattaforma venivano attribuiti a Mario R., e
l'ospite si trovava fra le mani il lavoro di qualcun altro. Ora parte da zero —
0 agenti, 0 esecuzioni — e quello che costruisce resta suo.

### 5.50 Connessioni riutilizzabili e provabili

Endpoint, cartelle e parametri di collegamento si configurano una volta e più
nodi li riusano. Prima ogni nodo portava i propri: bisognava ripetere gli stessi
valori su ogni flusso, e non c'era modo di sapere se funzionassero prima di
eseguire.

Si gestiscono da due punti — l'icona 🔌 nella barra in alto e **il pannello del
nodo stesso**, dove si può crearne una del tipo giusto e provarla senza
interrompere il lavoro.

**La prova è la parte che conta**, e fa ciò che è davvero verificabile:

| Tipo | Cosa fa la prova |
|---|---|
| Cartella | **scrive un file di verifica e lo rimuove** — l'unico modo onesto di dire "questa cartella è scrivibile" |
| Endpoint HTTP | **chiamata vera**; distingue un 401 (servizio raggiungibile, credenziale sbagliata) da un errore di rete |
| Database | verifica parametri e coerenza della porta col motore, e dichiara che la connessione vera non è eseguibile dal browser |
| Posta / Webhook | verifica che il servizio locale sia in ascolto |

Verificato con prove reali: endpoint raggiungibile → `Risposta 200 in 28 ms`;
irraggiungibile → spiegazione CORS; cartella → `mkdir Contratti · mkdir 2026 ·
file .relaition-prova-… · write 56B · rimosso`; PostgreSQL su porta 3306 →
`attenzione: la porta standard di PostgreSQL è 5432`.

Una connessione mai provata non blocca l'esecuzione ma **viene segnalata come
avviso** in convalida: potrebbe funzionare comunque, però è il momento giusto
per dirlo invece di scoprirlo a esecuzione fallita.

Conseguenza non secondaria: le credenziali non stanno più nella definizione di
un agente, quindi non finiscono nei suoi export né nelle pubblicazioni.

### 5.51 Il nome dell'utente ovunque

Il saluto della Dashboard era scritto nel markup: entrando come Giulia si
leggeva comunque "Buongiorno, Mario". Nome, ruolo, iniziali e saluto vengono ora
riscritti da `profileData` a ogni cambio pagina — alcune pagine ridisegnano la
propria intestazione, e senza questo tornerebbero al testo fisso.

Il saluto usa solo il nome proprio e l'ora del giorno: "Buongiorno, Mario"
anziché "Buongiorno, Mario R.", che suonerebbe come un richiamo.

### 5.52 Pianificazione: le espressioni cron non venivano valutate

`isScheduleDue` gestiva `interval` e `daily` ma non `cron` — e il flusso
precaricato usava proprio cron. Risultava attivo, l'interfaccia diceva
"pianificato", e non partiva mai: non c'era modo di accorgersene guardando
l'applicazione.

Ora le espressioni a cinque campi sono valutate per intero — `*`, valori
singoli, elenchi, intervalli `a-b` e passi `*/n` — con un controllo che impedisce
la doppia esecuzione nello stesso minuto (lo scheduler gira ogni 30 secondi, e
senza quel controllo un'espressione corrispondente farebbe partire il flusso due
volte). Verificato: `0 7 * * 1` scatta di lunedì alle 7 e non di martedì,
`*/15 * * * *` al minuto 30 ma non al 31, `0 9-17 * * *` alle 14 ma non alle 20.

**Due incoerenze corrette insieme:**

- Il seme marcava *attivo* il flusso 1 con pianificazione `manual`: attivo e
  pianificato ora coincidono. Un agente attivo senza pianificazione viene
  comunque segnalato in giallo nell'elenco, perché è lì che si guarda per
  capire perché non è successo nulla.
- Un'esecuzione pianificata veniva attribuita a **chi era connesso**, non al
  proprietario dell'agente: sarebbe comparsa nel registro di chiunque avesse la
  scheda aperta quando lo scheduler è scattato. Ora è dell'autore.

L'elenco mostra la pianificazione in italiano — "Ogni lunedì alle 07:00" — perché
`0 7 * * 1` non dice niente a chi non conosce cron.

### 5.53 Modifica del profilo

Le modifiche vivevano solo in memoria e sparivano al ricaricamento, il che
faceva sembrare che il salvataggio non funzionasse. Ora sono conservate nella
tabella `profili`, per utente, e rilette all'accesso.

**Il nome non è modificabile**, ed è dichiarato nel modulo: è la chiave con cui
agenti ed esecuzioni sono attribuiti, e cambiarlo li renderebbe orfani senza
dirlo a nessuno. Ruolo, organizzazione, email, LinkedIn e biografia si
modificano liberamente.

### 5.54 Progressi formativi davvero per utente

Il campo `done` delle lezioni era scritto dentro `PATHS` come decorazione della
demo, e il caricamento si limitava a sovrascriverlo dove esisteva una riga nel
database: **ogni utente ereditava gli stessi sei corsi completati**, compreso un
account appena creato. Ora i progressi vengono azzerati prima di applicare
quelli della persona.

Il seme assegna percorsi coerenti con i profili: Mario ha finito i fondamenti,
Sara ha completato Sicurezza & Governance, Marco ha appena iniziato. Verificato:
7, 3, 2, 5 lezioni rispettivamente, e **0 per l'ospite**.

### 5.55 Rami che non partono mai

Un ramo la cui condizione cita un campo che nessun nodo a monte produce non
fallisce: resta semplicemente spento, e il nodo a valle compare nel registro
come "saltato". È il modo più comune di ritrovarsi con un flusso che gira
regolarmente senza fare la cosa per cui era stato costruito — tipicamente
l'invio di una notifica.

`verificaCondizioni()` (`js/builder.js`) intercetta il caso prima
dell'esecuzione. Il criterio non è sintattico ma di conoscenza: l'avviso
compare solo quando almeno un nodo AI a monte dichiara nel proprio prompt uno
schema JSON esplicito (`{campo: tipo, ...}`). In quel caso lo schema è
autoritativo e un campo fuori elenco è un errore vero. Se nessun nodo dichiara
nulla, il contenuto della pipeline è ignoto e il controllo tace: le condizioni
in italiano valutate dal modello ("urgenza alta oppure fondatezza sotto
soglia") sono legittime e non vanno segnalate. Le condizioni prive di
operatori di confronto sono escluse per lo stesso motivo.

L'avviso non blocca l'esecuzione — è un sospetto fondato, non una certezza —
e compare nel pannello «Verifica del flusso» sotto «Rami che non partiranno
mai». A runtime esiste il controllo gemello, ristretto ai casi in cui il dato
in ingresso è strutturato (JSON), dove i nomi dei campi devono comparire
letteralmente.

#### Limite noto

Il controllo legge lo schema dal testo del prompt, non da una dichiarazione
formale: un nodo AI che produce campi senza descriverli nel prompt resta
invisibile al controllo. È una lettura euristica, non una verifica di tipo.

### 5.56 Rilevamento del servizio di posta

Il nodo *Invia email* invia davvero solo se il relay locale è in ascolto,
altrimenti registra l'invio come simulato e prosegue: costruire un flusso non
deve dipendere dall'aver avviato un servizio.

La verifica non è più fatta una volta sola. Il servizio si avvia quando fa
comodo — quasi sempre *dopo* aver aperto l'app — e memorizzare il primo esito
negativo significava continuare a simulare a servizio acceso, dicendo
«simulato» in un registro che nessuno rilegge. Ora un esito negativo viene
sempre ricontrollato (una `fetch` su porta chiusa fallisce all'istante) e un
esito positivo dura `MAIL_TTL_MS` (30 s), così anche un servizio fermato a
metà sessione viene notato.

### 5.57 Sonda: prove di connessione reali

Il browser non apre socket TCP e non può aggirare CORS. Da solo non sa dire se
un database risponde, e soprattutto non distingue «servizio irraggiungibile»
da «servizio raggiungibile ma non autorizzato a parlare con questa pagina»:
i due casi producono la stessa `TypeError` e mandano a cercare il problema
dove non è.

I servizi locali (`relaition-webhook.ps1` e `relaition-mail.ps1`, indifferente
quale sia avviato) espongono `/sonda`:

- `tipo=tcp&host=&porta=` — `TcpClient.BeginConnect` con attesa di 5 secondi.
  È un handshake TCP vero. Distingue porta chiusa (RST), host non risolto
  (DNS) e porta filtrata (timeout).
- `tipo=http&url=&metodo=` — richiesta HTTP lato server, senza vincoli di
  origine. Un 401/403 è riportato come successo della sonda: il servizio ha
  risposto, è la credenziale a mancare.

Nessuna credenziale passa dalla sonda: verifica che la porta risponda, non che
l'accesso sia autorizzato. Il messaggio della prova database lo dice
esplicitamente — «porta aperta» e «database accessibile» non sono la stessa
cosa, e prometterlo sarebbe falso.

Se nessun servizio è in ascolto le prove ricadono su ciò che il browser sa
fare, dichiarandolo invece di fingere un esito.

#### Prova SMTP

Che il servizio sia in ascolto non dimostra che sappia inviare: la password
per le app può essere scaduta, il provider può bloccare l'accesso. Se la
connessione ha un destinatario di prova, la verifica **invia un'email vera**.
È l'unico esito che dimostra qualcosa.

### 5.58 Diagnosi dei fallimenti HTTP nei nodi

`Failed to fetch` copre due guasti opposti: endpoint inesistente ed endpoint
sano che non autorizza le chiamate da una pagina web. Dal browser sono
indistinguibili, e chi legge il registro va a cercare l'errore nell'URL quando
invece l'URL è corretto.

Il nodo *HTTP Request*, quando la `fetch` fallisce, interroga `/sonda`. Se
l'endpoint risponde, il registro lo dice esplicitamente — «l'URL è corretto,
manca l'autorizzazione CORS» — invece di lasciare il dubbio. Senza servizio
locale si ricade sul messaggio generico di prima.

### 5.59 Connessioni riusabili sui nodi

Host, porta, URL e database erano duplicati su ogni nodo che li usava.
Cambiare server significava riaprire tutti i flussi che lo toccavano, e
nessuno di quei valori era mai stato provato: si scopriva a esecuzione fatta.

`CONN_PER_CONNETTORE` (`js/builder.js`) dichiara, per ogni connettore, quale
tipo di connessione lo serve e quali suoi campi vengono da lì
(`campoDelNodo: campoDellaConnessione`):

| Connettore | Tipo | Campi forniti dalla connessione |
|---|---|---|
| PostgreSQL | database | host, port, database, user |
| MongoDB | database | uri, database |
| Redis | database | host, port |
| Elasticsearch, GraphQL | http | endpoint |
| HTTP Request | http | url, headers |
| n8n Workflow | http | baseurl |

Quando una connessione è scelta:

- i campi che fornisce **spariscono dal pannello** — lasciarli visibili
  farebbe credere che valgano, mentre il runtime usa quelli della connessione;
- la validazione smette di chiederli, e `fillRequiredDefaults` smette di
  riempirli con il segnaposto (incluso il ripiego «primo campo», che su
  *HTTP Request* è proprio l'URL);
- `configConConnessione()` li risolve al momento dell'esecuzione.

I campi restano nella definizione del connettore: senza connessione scelta si
compilano a mano come prima, così i flussi già salvati non cambiano
comportamento.

È anche ciò che rende un flusso davvero esportabile: chi lo importa lo fa
girare sul proprio server scegliendo la propria connessione, invece di
ereditare l'indirizzo di chi l'ha costruito.

### 5.60 Log esecuzioni: manuali e pianificate separate

Erano un elenco unico, distinte solo dalla pastiglia. Sono però due cose che
si leggono per motivi diversi — una l'hai appena lanciata e ne cerchi l'esito,
l'altra è partita da sola e controlli che sia andata bene — quindi il log le
mostra in due sezioni distinte, con i due totali in testa. Il filtro per
origine (`Ogni origine / Manuali / Pianificate`) si combina con quello di
stato.

### 5.61 Dati per utente

Ogni tabella aveva già la colonna `user`, ma il seme popolava un solo profilo:
tutti gli altri entravano con XP, quiz, iscrizioni e agenti installati a zero.

`obiettiviPratici()` aveva inoltre un difetto peggiore: contava agenti,
esecuzioni e pubblicazioni **senza filtro utente**, così chiunque si collegasse
vedeva i progressi di chi aveva popolato la piattaforma per primo e risultava
esperto senza aver fatto nulla.

Ora il seme assegna a ciascun profilo un'esperienza coerente con il suo modo
di lavorare, già usato per le esecuzioni:

| Utente | Agenti | Installati | Esecuzioni | Lezioni | Quiz | Sfide | XP |
|---|---|---|---|---|---|---|---|
| Mario R. — costruisce | 2 | 5 | 17 | 7 | 5 | 2 | 555 |
| Giulia D. — manda in produzione | 1 | 3 | 15 | 3 | 2 | 2 | 300 |
| Sara L. — presidia | 1 | 2 | 7 | 5 | 4 | 2 | 260 |
| Marco R. — sperimenta | 1 | 1 | 9 | 2 | 1 | 1 | 75 |
| Ospite | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
### 5.62 Connettori simulati: dichiarati nel registro

Trentacinque connettori su trentanove non eseguono alcuna azione: Slack, Jira,
Salesforce, SAP, Kubernetes e gli altri non sono raggiungibili da una pagina
web senza credenziali e senza un backend che le custodisca.

I loro messaggi però erano scritti come se l'azione fosse avvenuta — «Jira:
creata Task OPS-828», «K8s: 3/3 repliche ready», «Script eseguito — exit code
0». Chi leggeva il registro concludeva ragionevolmente che il ticket esistesse.
Ora **ogni riga di un connettore simulato porta il marchio `[simulato]`**,
applicato in un punto solo del runtime (`rtRunConnector`) e non dentro le
singole funzioni `sim()`: vale quindi anche per i connettori aggiunti in
seguito, che altrimenti nascerebbero muti.

Non lo prendono i connettori che agiscono davvero — invio email con il servizio
attivo, HTTP Request, scrittura su cartella cloud, esportazione file — che
escono da un altro ramo con `real: true`.

### 5.63 Ripiego fra fornitori AI

La chiave e i parametri sono **sempre dell'utente**: la piattaforma non
contiene credenziali e non ne fornisce di proprie. Il pannello «Integrazione
AI» accetta più fornitori contemporaneamente, e ogni nodo sceglie il proprio.

`risolviProvider()` sostituisce il fornitore PRIMA della chiamata, quando
quello scritto sul nodo non è collegato. Restava scoperto il caso peggiore:
fornitore collegato ma chiamata fallita a metà esecuzione — limite di
frequenza superato, 500 dal fornitore, rete caduta — con il flusso fermo anche
in presenza di un secondo fornitore pronto.

Ora `callAI()` avvolge il tentativo singolo (`callAIUnaVolta`) e, al
fallimento, prova gli altri fornitori collegati. Il ripiego riguarda **solo i
guasti di trasporto**. Non scatta su:

- un'interruzione voluta dall'utente, che non è un guasto;
- una risposta `[Demo]`, perché significa che nessun fornitore è configurato;
- una **chiave rifiutata (401/403)**: il problema è la configurazione di quel
  fornitore, e mascherarlo con un altro impedirebbe di accorgersene.

Ogni ripiego compare nel registro — `↻ Ripiego: Claude non ha risposto —
richiesta servita da Gemini`. Un esito prodotto da un modello diverso da quello
scritto sul nodo non può restare silenzioso.

### 5.64 La chiave sopravvive al ricaricamento

La chiave viveva solo in memoria: ogni ricaricamento la cancellava, e a metà
dimostrazione tutti i nodi AI risultavano scollegati senza spiegazione.

Ora è conservata in `sessionStorage`: resta finché la scheda è aperta e
sparisce quando la si chiude. **Non finisce su disco a tempo indeterminato,
non è condivisa con altre schede, non entra nel database, negli export o nelle
pubblicazioni.** Resta però leggibile da chi apre la console di quella scheda:
è una comodità da prototipo, non una custodia sicura, e il pannello lo
dichiara. Il collegamento «Rimuovila ora» la cancella subito.

La pastiglia di stato riflette la configurazione ripristinata: prima diceva
ancora «Non configurato» pur avendo un fornitore collegato, e chi leggeva
reinseriva la chiave credendola persa.

### 5.65 Estensibilità non implementata

Tre voci previste dal documento di progetto non sono state realizzate, e
nell'applicazione non ne compare traccia:

- **cache semantica** delle risposte del modello: ogni chiamata parte, anche
  se identica alla precedente;
- **descrittori di connettori esterni** caricabili a caldo: il catalogo dei
  connettori è quello dichiarato nel codice;
- **nodo codice in sandbox**: *Python Script* accetta il codice e lo mostra nel
  pannello ma **non lo esegue** — servirebbe un interprete (Pyodide, ~10 MB da
  CDN), incompatibile con l'apertura da file locale. Il registro lo marca
  `[simulato]` come ogni altro connettore che non agisce.

### 5.66 Segnaposto risolti risalendo il flusso

Un nodo che produce testo libero **sostituisce** la pipeline: da quel punto in
poi i campi prodotti prima non sono più raggiungibili. È il caso tipico di un
nodo «estrai i dati» inserito fra l'analisi e la notifica — l'email partiva con
`{{motivazione}}` scritto tale e quale, perché il nodo a monte immediato non
produceva quel campo.

`rtSostituisci()` ora risale ai nodi già completati, dal più recente al più
lontano (`ctx.ordineOutput`), interpretando l'uscita di ciascuno come JSON.
Chi ha prodotto quel campo per ultimo vince: è l'ordine in cui una persona se
lo aspetta leggendo il flusso.

L'ordine di risoluzione resta: uscita del nodo a monte immediato → dati del
trigger → risalita. I dati del trigger mantengono quindi la precedenza, perché
un segnaposto come `{{mittente}}` riguarda chi ha avviato il flusso, non un
risultato intermedio.

Un segnaposto che **non** trova corrispondenza da nessuna parte resta scritto:
svuotarlo produrrebbe un destinatario vuoto o un oggetto monco, senza che si
capisca da dove viene. Il registro però lo dichiara — «Segnaposto non risolti
nel messaggio: `{{…}}` — nessun nodo a monte produce quel campo» — perché
scoprirlo aprendo il messaggio ricevuto è troppo tardi.

### 5.67 Generazione da chat: topologia dichiarata e contratto dei dati

La composizione conversazionale aveva due difetti che producevano flussi
formalmente validi ma privi di senso.

**La topologia era dedotta dall'ordine dell'array.** Il modello restituiva una
lista piatta di nodi e le connessioni venivano indovinate dalla posizione: per
una condizione si collegava il nodo successivo al ramo «vero» e quello dopo al
ramo «falso», qualunque cosa significassero. È la ragione principale per cui
ogni flusso generato con una diramazione risultava incomprensibile.

Il modello ora dichiara `edges` esplicitamente — `{da, porta, a, etichetta}` —
sul modello di n8n, dove nodi e connessioni sono due cose distinte. Il codice
non si fida comunque di ciò che riceve: una porta `true`/`false` su un nodo che
non è una condizione viene riportata a `out` e viceversa, e un ramo di
condizione lasciato scoperto viene ricucito al primo nodo di output — un arco
incoerente verrebbe altrimenti ignorato dal motore in silenzio. In assenza di
`edges` si ricade sulla catena lineare, che resta corretta per i flussi senza
diramazioni.

**Il contratto fra i nodi non era dichiarato.** Il modello scriveva condizioni
e segnaposto su campi che nessun nodo produceva: la condizione risultava sempre
falsa e il ramo non partiva mai, il segnaposto finiva scritto tale e quale
dentro l'email. Il prompt ora enuncia la regola in entrambe le modalità
(creazione e modifica), con l'esempio di ciò che non va fatto:

- un nodo AI produce testo libero **a meno che** il prompt non chieda
  esplicitamente `Rispondi SOLO JSON: {campo: tipo}`;
- una condizione può usare **solo** campi dichiarati da un nodo AI a monte;
- un nodo AI che produce testo libero **sostituisce** i dati strutturati
  prodotti prima, e non va inserito fra chi produce i campi e chi li usa.

La disposizione dei nodi è infine calcolata da `bAutoLayout()` sul grafo reale,
invece di impilarli nell'ordine di arrivo.

### 5.68 Modifica da chat: porte delle condizioni

Inserendo una condizione da chat, il nodo ereditava archi con porta `out` —
che su una condizione **non esiste**. Il motore li ignorava e i due rami
restavano scollegati: il nodo a valle non veniva mai eseguito, senza che nulla
lo dicesse. Le uscite vengono ora riportate su `true`/`false`.

Un nodo aggiunto dopo una condizione occupa la prima porta libera, `true` e poi
`false`. **Se entrambe sono occupate non viene inventato un terzo arco**: una
condizione ha due uscite, e un arco in più duplicherebbe una porta rendendo il
ramo ambiguo. Il nodo resta sul canvas scollegato e l'operazione lo dichiara —
«aggiunto ma non collegato: "Compatibile?" ha già entrambi i rami occupati».

La ricucitura automatica del ramo scoperto vale **solo in creazione**, dove il
grafo è costruito tutto insieme. In modifica l'utente procede a passi, e un
arco messo d'ufficio verrebbe poi affiancato dall'inserimento successivo,
lasciando due archi sulla stessa porta: il ramo scoperto lo segnala invece la
verifica del flusso, che dice esattamente cosa manca.

### 5.69 Disposizione automatica: fratelli sovrapposti

`bAutoLayout()` applicava il margine minimo (`Math.max(20, …)`) **a ogni
nodo** invece che all'inizio del gruppo: con due rami il primo fratello veniva
spinto a x=20 mentre il secondo restava al suo posto, e la distanza fra i due
scendeva a 160 px — sotto la larghezza di un nodo (180 px minimi). Due schede
sovrapposte proprio sulla diramazione, cioè dove il flusso va letto con più
attenzione. Il vincolo si applica ora all'inizio del gruppo: la spaziatura
resta 240 px con qualunque numero di rami.

### 5.70 Profilo: salvato ma non riletto all'avvio

Le modifiche al profilo venivano scritte nella tabella `profili`, ma solo
`applicaUtente()` le rileggeva — cioè soltanto passando dal login. Aprendo
l'applicazione con un semplice ricaricamento il profilo tornava ai valori
scritti nel codice, e il salvataggio sembrava non aver avuto alcun effetto.

La lettura è ora in `caricaProfiloSalvato()`, chiamata sia al cambio utente sia
all'avvio. Ogni utente continua a vedere il proprio: le righe sono separate per
`user`, quindi un profilo modificato da uno non tocca quello degli altri.

### 5.71 Catalogo allineato alla Tab. 3.1

La business unit *Insurance* compariva fra i filtri del marketplace ma non
aveva agenti: selezionandola si otteneva una lista vuota, e il catalogo si
fermava a 18 agenti su 8 business unit contro i 22 su 9 dichiarati nel
capitolo. Sono stati aggiunti i quattro previsti — Claims Processor AI, DORA
Checker, Polizza Analyzer, Regulatory Report AI — nello stesso formato di
anteprima degli altri.

### 5.72 «Convalida output» non inventa più i campi da verificare

Il campo *Campi obbligatori* era dichiarato `req:true` con segnaposto
`punteggio, motivazione`. Il completamento automatico dei campi obbligatori ci
scriveva dentro quel segnaposto, e il presidio si metteva a pretendere campi
che l'agente non produce: **ogni agente installato dal catalogo che includesse
questo controllo si bloccava alla prima esecuzione**, con un messaggio che
parlava di campi mai nominati da nessuno.

Il segnaposto è un esempio, non un valore ragionevole da assumere: il campo non
è più obbligatorio. Quando non è configurato il controllo verifica solo che
l'output sia JSON e **lo dichiara** — «nessun campo o regola dichiarati: indica
cosa verificare nel pannello del nodo» — invece di annunciare una convalida
superata che non ha verificato nulla. Configurato, blocca esattamente come
prima.

### 5.73 Il nome è modificabile, e la rinomina si propaga

Il nome mostrato è anche la chiave con cui agenti, esecuzioni, pubblicazioni,
progressi formativi, quiz, XP e connessioni sono attribuiti: era stato reso
non modificabile proprio per questo, perché cambiarlo avrebbe reso orfano tutto
il resto.

Ora è modificabile, e la rinomina è **un'unica operazione che riscrive
l'attribuzione in tutte le 14 tabelle coinvolte** (`IDENTITA_COLONNE` in
`js/utenti.js`). Prima di eseguirla il sistema dichiara quanti elementi
cambieranno intestatario e chiede conferma: su un profilo popolato sono
sessanta righe, e farlo in silenzio sarebbe inaccettabile.

Il nome scelto è legato all'**account** (l'email, che non cambia) nella tabella
`identita`: senza quel legame un utente rinominato tornerebbe al nome scritto
nel codice al primo accesso, e i suoi contenuti — già riattribuiti — gli
sparirebbero dalla vista. Il ripristino avviene sia al login sia all'avvio,
perché aprire l'applicazione con un ricaricamento non passa dal login.

Il nome non può essere vuoto, superare 40 caratteri, né coincidere con quello
di un altro account (confronto senza distinzione di maiuscole): due utenti
omonimi condividerebbero agenti ed esecuzioni, che è esattamente il difetto che
l'attribuzione per nome deve evitare. Le iniziali dell'avatar seguono il nome.

### 5.74 Contenuti dell'utente ricaricati al cambio account

`loadPersistedContent()` girava **solo all'avvio**. Cambiando account, i
progressi formativi restavano in memoria dentro `PATHS` — quelli dell'utente
precedente — e il primo `saveLearnProgress()` li riscriveva sotto il nome
nuovo: un utente si ritrovava i corsi di un altro, e quell'altro li perdeva.

Il caricamento avviene ora anche dentro `applicaUtente()`. Verificato con un
giro completo fra i quattro account, salvando a ogni passaggio: la
distribuzione dei progressi resta identica.

### 5.75 Log esecuzioni: due sezioni non possono chiamarsi allo stesso modo

La pagina mostrava due intestazioni identiche — «Esecuzioni pianificate» — con
due conteggi diversi: in alto gli **agenti** che hanno una pianificazione
attiva, in basso le **esecuzioni** già avvenute. La prima si chiama ora «Agenti
con pianificazione attiva», con una riga che dice dove stanno le altre.

Il messaggio della sezione vuota diceva «attiva un agente con una
pianificazione» anche a chi ne aveva già uno attivo che semplicemente non era
ancora partito: ora distingue i due casi e suggerisce «Esegui ora».

### 5.76 Profilo: campi aggiuntivi e ricaricamento dopo il salvataggio

Al profilo si aggiungono **reparto**, **telefono** e **settore di interesse**.
Il settore non è decorativo: i suggerimenti della chat del Builder lo usano per
proporre per primi i casi d'uso di quell'ambito, ed è a scelta chiusa sulle
stesse business unit del marketplace.

Dopo il salvataggio la pagina si ricarica. Serve soprattutto dopo una
rinomina: decine di viste tengono in memoria il nome precedente, e ridisegnarle
una per una lascerebbe fuori proprio quella che nessuno ha pensato di
aggiornare. Il ricaricamento attende però la scrittura **effettiva** su
IndexedDB (`persistDatabaseNow()`): il salvataggio ordinario è ritardato di
150 ms per non riscrivere il database a ogni query, e ricaricare prima avrebbe
cancellato le modifiche appena fatte.

Le iniziali dell'avatar sono derivate dal nome quando il profilo non le porta,
così non compare più «MA» per «Mario R.» accanto a una barra laterale che
mostra «MR».

### 5.77 Suggerimenti della chat: più numerosi e pertinenti

I casi d'uso proposti a canvas vuoto passano da 20 a 30 e coprono tutte le
business unit del catalogo; i chip mostrati passano da quattro a sei. Chi ha
dichiarato un settore nel profilo vede per primi i tre casi del proprio ambito,
poi gli altri a rotazione: è l'uso concreto di quel campo, ed evita di proporre
a chi lavora in HR un esempio su DevOps.

### 5.78 Nome del flusso visibile nel Builder

Il nome dell'agente aperto viveva solo nella variabile `currentAgentName`, senza
comparire da nessuna parte: lavorando su più flussi non si sapeva quale fosse
sul canvas, e si finiva per salvare sopra quello sbagliato.

Una fascia in testa alla colonna centrale mostra ora nome, numero di nodi e
stato — «salvato», «non ancora salvato», e per gli agenti in produzione anche
la pianificazione in chiaro («⏰ in produzione · Ogni lunedì alle 07:00»).
Cliccandola si rinomina il flusso; se l'agente è già salvato il nome nuovo
viene scritto anche sulla sua riga, altrimenti la lista continuerebbe a
mostrare quello vecchio.

### 5.79 Divisori trascinabili

Le proporzioni giuste dipendono da cosa si sta facendo: chi costruisce con la
chat vuole spazio sopra, chi dispone i nodi lo vuole sul canvas, chi configura
un connettore vuole il pannello destro più largo. Tre divisori — palette ↔
canvas, chat ↔ canvas, canvas ↔ proprietà — si trascinano con il mouse.

Le misure sono limitate (una palette non può sparire) e **sopravvivono al
ricaricamento**: rifare lo stesso gesto a ogni apertura sarebbe peggio che non
poterlo fare. Il doppio clic su un divisore ripristina la misura predefinita.
Dopo ogni trascinamento il canvas viene ridisegnato, perché le frecce sono
disegnate in SVG su coordinate assolute e resterebbero dove stavano.

### 5.80 Suggerimenti della chat: dodici, brevi, scorrevoli

I chip erano in fila con `white-space:nowrap` dentro una colonna larga 560 px:
ogni frase occupava una riga intera, e otto suggerimenti diventavano otto righe
che spingevano il canvas in basso.

Il problema non era la forma della pastiglia — compatta e leggibile — ma la
lunghezza dell'etichetta. Ogni suggerimento porta ora due testi: l'etichetta
BREVE mostrata sulla pastiglia («Analizza un CV») e la richiesta COMPLETA
inviata al modello e mostrata come descrizione al passaggio del mouse
(«Analizza un CV e valuta la compatibilità con la posizione aperta»). Otto
pastiglie occupano così 136 px invece di 268.

I suggerimenti mostrati passano da quattro a otto e la selezione prende un
settore diverso a ogni giro: otto proposte tutte di vendite direbbero meno di
otto che coprono ambiti diversi, che è il punto — far capire l'ampiezza di ciò
che si può chiedere. Chi ha dichiarato un settore nel profilo vede comunque per
primi i due casi del proprio ambito.

La fascia della chat, larga 560 px fissi, occupa ora la larghezza della colonna
centrale (fino a 1040 px): anche la barra di ricerca ne beneficia.

### 5.81 Log esecuzioni paginato

Con decine di esecuzioni la pagina diventava un rotolo in cui l'unico modo di
raggiungere una riga vecchia era scorrere tutto. Le righe per pagina sono ora
fisse (10 di norma, modificabili a 20, 50 o 100 da una tendina accanto ai
filtri) e ogni sezione ha la **propria** pagina corrente: sfogliare le manuali
non sposta le pianificate.

Il paginatore mostra l'intervallo visibile («11–13 di 13») e una finestra di
cinque numeri attorno alla pagina corrente — con venti pagine l'elenco completo
dei numeri sarebbe più lungo delle righe. Se un filtro riduce l'elenco sotto la
pagina corrente, questa viene riportata dentro i limiti invece di mostrare il
vuoto. Cambiando pagina la vista torna in cima all'elenco.

### 5.82 Suggerimenti scorrevoli

I suggerimenti contestuali erano diciassette possibili ma se ne mostravano
**quattro**: la maggior parte non veniva mai vista. Il tetto sale a dodici in
entrambe le modalità, e l'area diventa scorrevole con un'altezza fissa di due
righe circa — così dodici proposte non spingono il canvas in basso e si
sfogliano come un elenco. Una sfumatura in fondo compare **solo** quando c'è
davvero altro sotto: mostrarla sempre suggerirebbe contenuto inesistente.

### 5.83 Connessioni riusabili per altri connettori

Quattro connettori in più leggono ora l'indirizzo da una connessione HTTP
provata: **Supabase** (che aveva già il campo `projecturl`), **Jira**,
**Confluence** e **GitLab**, ai quali è stato aggiunto l'URL dell'istanza —
una configurazione che nella realtà esiste e che prima mancava del tutto.

Restano connettori **simulati**, e il registro continua a marcarli come tali:
la connessione non li rende reali. Serve a due cose concrete: non riscrivere
l'indirizzo su ogni nodo, e far sì che lo script Python esportato punti
all'istanza giusta invece che a un segnaposto.

Non sono stati inventati nuovi *tipi* di connessione per i connettori che non
hanno un endpoint reale (Slack, Salesforce, SAP): darebbero l'apparenza di una
capacità che non esiste, che è esattamente ciò che questo prototipo evita.

### 5.84 Modifica da chat: inserire dentro un ramo, non accanto

Chiedendo «aggiungi un'email dopo la condizione» quando entrambi i rami erano
già occupati, il nodo veniva creato e **lasciato scollegato**: la modifica
sembrava applicata, ma il flusso diventava invalido e il nodo non veniva mai
eseguito. Era la causa più frequente di «la chat non applica le modifiche
correttamente».

L'interpretazione giusta è un'altra: «dopo la condizione» non può voler dire un
terzo ramo — una condizione ne ha due — e vuol dire invece *dentro* un ramo,
prima di quello che c'è già. L'arco viene quindi intercettato esattamente come
si fa con una porta normale. Il modello può indicare quale ramo con
`"porta":"true"` o `"porta":"false"`; in mancanza si usa il ramo vero, che è il
percorso principale. La regola è dichiarata anche nel prompt.

Verificato su dodici scenari di modifica — inserimento in testa, in mezzo e in
coda, su entrambi i rami, sostituzione, rimozione, collegamento e scollegamento
manuali, operazioni multiple, riferimenti a nodi inesistenti: nessuno produce
archi orfani, porte duplicate, porte incoerenti col tipo di nodo o nodi
irraggiungibili.

### 5.85 Importazione: il nome viene dal file

L'importazione aveva due percorsi separati e divergenti — da file e da testo
incollato — e nessuno dei due faceva la cosa giusta fino in fondo. Quello da
testo **ignorava il campo `name`** e non ridisegnava il canvas; entrambi
lasciavano il flusso importato **solo sul canvas**, senza riga nel database:
bastava aprire un altro agente per perderlo, e in «I miei agenti» non compariva.

Ora un unico `applicaImport()` serve entrambi:

- il nome dichiarato nel file diventa il nome del flusso — senza, l'agente
  importato erediterebbe quello aperto prima e verrebbe salvato sopra di esso;
- `fillRequiredDefaults()` completa i campi obbligatori che i connettori hanno
  acquisito dopo l'esportazione, altrimenti un flusso valido al momento
  dell'export si aprirebbe con errori bloccanti;
- la vista viene riportata sul grafo e il registro dell'esecuzione precedente
  svuotato. Il flusso NON viene salvato d'ufficio: importare e' un'anteprima, e
  scrivere una riga nel database senza che nessuno l'abbia chiesto riempirebbe
  «I miei agenti» di prove scartate. Il nome compare pero' nel titolo del
  Builder ed e' gia' proposto quando si preme Salva.

### 5.86 Lettura del JSON prodotto dal modello

I modelli non restituiscono quasi mai JSON nudo: lo racchiudono in un recinto
markdown (```` ```json … ``` ````) oppure lo fanno precedere da una frase
(«Ecco la valutazione:»). `JSON.parse` fallisce su entrambi.

La sostituzione dei segnaposto usava `JSON.parse` diretto, mentre il guardrail
«Convalida output» toglieva i recinti per conto proprio. Il risultato era la
combinazione più difficile da diagnosticare: **il registro mostrava un output
perfettamente corretto e la convalida passava, ma `{{motivazione}}` e
`{{competenze}}` restavano scritti tali e quali dentro l'email.** Tutto
sembrava a posto tranne il risultato.

`rtLeggiJson()` è ora l'unica lettura usata da entrambi: prova il testo così
com'è, poi senza recinto markdown, poi isolando la porzione dalla prima graffa
all'ultima. Non è un parser tollerante — è la copertura dei tre modi in cui un
modello impacchetta un oggetto. Un testo che JSON non è resta tale, e i
segnaposto non risolti vengono dichiarati nel registro.

### 5.87 Sorgente del trigger: rimovibile e multipla

**Togliere l'allegato.** Il file caricato su un nodo trigger non si poteva
rimuovere: per passare a un documento della Knowledge Base bisognava caricare
un altro file qualsiasi, e quello di prima restava comunque il dato in
ingresso. Un pulsante accanto al nome lo toglie, sgancia anche gli eventuali
documenti collegati — altrimenti le caselle resterebbero spuntate su una
sorgente che non c'è più — e riporta l'avviso «serve una sorgente».

**Più documenti dalla Knowledge Base.** La scelta era singola, da una tendina:
per far ragionare un agente su più documenti aziendali — il caso normale, non
l'eccezione — non c'era modo se non caricarli a mano uno per volta da una
cartella. L'elenco è ora a caselle multiple, con la dimensione di ciascun
documento accanto al nome.

I documenti scelti vengono composti con le **stesse intestazioni usate per la
lettura da cartella** (`===== DOCUMENTO: nome (Knowledge Base) =====`): un solo
formato da spiegare nei prompt, e il modello sa già come leggerlo. Con un solo
documento il contenuto resta nudo, senza intestazione inutile.

`kbDocIds` sostituisce `kbDocId`, che resta letto per i flussi salvati prima:
un flusso vecchio si apre con la sua casella già spuntata.

### 5.88 Esportazione del registro dal Builder

Il registro racconta **una** esecuzione, e quella appena conclusa è proprio
quella che serve allegare a un ticket o mostrare a un collega. L'unico export
disponibile era però quello dell'intera tabella dalla pagina Log Esecuzioni:
per portarsi via dieci righe bisognava esportarne mille e cercarle dentro.

Un pulsante nell'intestazione del registro offre tre formati, scelti per tre
usi diversi:

- **Markdown** — tabella leggibile con intestazione, esito e conteggi, da
  allegare a una relazione;
- **CSV** — un passo per riga, separatore `;` perché è quello che Excel in
  italiano si aspetta (col separatore sbagliato il file si apre tutto in una
  colonna);
- **JSON con traccia** — include gli input di ogni chiamata verso modello e
  connettori, cioè ciò che rende riproducibile l'esecuzione.

I messaggi contengono marcatura HTML — i collegamenti «Perché questo risultato»
e «riscarica il file» — che viene tolta nei formati testuali.

Il pulsante è spento finché non c'è un registro: offrirlo su un'esecuzione mai
avvenuta prometterebbe un file inesistente. Lo stato è deciso all'apertura del
Builder, a ogni voce aggiunta e allo svuotamento.

### 5.89 Ogni voce del registro dice da quale nodo viene

Una riga che dice «Convalida fallita» senza dire **quale** nodo l'ha prodotta
costringe a ricostruirlo a mente: su un flusso con tre chiamate AI e due
controlli non c'è modo di saperlo dal messaggio.

L'evento `step` del motore portava già `node_id`, ma il registro del Builder lo
scartava. Ora ogni voce lo conserva, mostra il nome del nodo accanto al
messaggio e, al clic, seleziona quel nodo, lo porta in vista e ne apre il
pannello — si passa dal sintomo alla configurazione che l'ha causato senza
cercarlo sul canvas.

Le righe di riepilogo («Workflow completato», «Perché questo risultato?») non
appartengono a un nodo e restano non cliccabili, senza etichetta.

Il nodo diventa anche una **colonna negli export** — CSV, Markdown e JSON, con
`nodeId` in quest'ultimo: è ciò che permette di filtrare per blocco un registro
lungo, fuori dall'applicazione.

### 5.90 L'esito della revisione torna all'autore

La coda di revisione mostrava al REVISORE cosa decidere, ma il lato opposto non
esisteva: la decisione veniva scritta in `published_agents.status` e
`review_note` e in `publications` (`reviewer`, `decision`, `decided_at`,
`notes`), e **nessuna schermata la leggeva**. Un agente rifiutato spariva dal
Marketplace senza che il suo autore ne conoscesse il motivo, e una richiesta di
modifica non arrivava a nessuno.

`js/pubblicazioni.js` aggiunge dentro «I miei agenti» la sezione **Pubblicati e
in revisione**, che per ciascuna pubblicazione dell'utente corrente
(`WHERE author = utenteCorrente()`) mostra stato, testo del feedback, nome del
revisore e data. I sei stati del database sono tradotti in quattro etichette
comprensibili: `in_verifica`/`in_revisione` → «In verifica», `pubblicato` →
«Pubblicato», `bozza` → «Modifica richiesta», `ritirato`/`sospeso` →
«Rifiutato»/«Sospeso».

Sugli agenti che richiedono un intervento, **«Applica la modifica»** carica nel
Builder il workflow *come pubblicato* — non l'agente locale, che può essere
stato modificato dopo la pubblicazione: è sulla versione vista dal revisore che
il suo commento si applica — e scrive la richiesta nella chat del Builder. Non
la applica da sola: passa dall'anteprima come qualunque altra modifica via
chat, e resta all'autore accettarla.

L'agente locale di partenza (`source_agent_id`, o in mancanza un agente
omonimo dello stesso autore) resta il bersaglio del salvataggio: senza questo
raccordo l'autosave del Builder creava una riga nuova a ogni apertura —
«Estrazione dati da fatture», poi «(2)», poi «(3)».

**Semplificazione.** L'autore non riceve una notifica al momento della
decisione: l'array `notifications` vive in memoria e non è per utente, quindi
una notifica creata durante la revisione la vedrebbe il revisore, non l'autore.
Al suo posto la voce di menu «I miei agenti» porta un **contatore ricavato dal
database** (`status IN ('bozza','ritirato')` per l'utente corrente), corretto
per chiunque acceda e in qualunque momento. Una notifica vera richiede un
canale per destinatario, che è lavoro da backend.

Il seme dimostrativo (`js/seed-demo.js`, §5b) include ora anche le **due
decisioni negative** — una richiesta di modifica e un rifiuto, entrambe con
motivazione e revisore — perché altrimenti in dimostrazione si vedrebbe solo il
caso felice, cioè l'unico che non richiede che il ciclo di revisione funzioni
davvero. Resta verificato che un agente `ritirato` o `bozza` **non compare nel
Marketplace**: `getPublishedAgents()` senza `includeAll` restituisce solo gli
approvati.

### 5.91 Recensioni: righe di database, non decorazione

Ogni scheda del Marketplace mostrava le stesse tre recensioni scritte nel
codice — «Implementato in produzione in 2 ore», «Ottimo agente, configurazione
semplice», «Perfetto per il nostro workflow» — **identiche su tutti e 22 gli
agenti del catalogo**. Bastava aprire due schede di seguito perché la finzione
fosse evidente. Gli agenti pubblicati dalla community, all'opposto, non
avevano recensioni affatto e mostravano un avviso fisso.

`js/recensioni.js` introduce la tabella `recensioni` (`agent_key`, `autore`,
`stelle`, `testo`, date) con un **indice UNIQUE su (agent_key, autore)**: una
persona ne scrive al massimo una per agente, e il secondo invio corregge la
propria invece di accumularne un'altra. Chi ha già scritto ritrova il modulo
compilato e i pulsanti diventano «Aggiorna» / «Elimina».

**La chiave è testuale, non l'id numerico.** Gli agenti della community
prendono l'id `1000+n` dalla riga di `published_agents`, e quel numero si
sposta quando una pubblicazione viene rimossa: le recensioni finirebbero
attaccate a un altro agente. Si usa quindi `cat:<id>` per il catalogo (id fisso
nel codice) e `pub:<nome>` per le pubblicazioni (nome già univoco).

**La valutazione mostrata è la media calcolata** quando esistono recensioni, e
solo in loro assenza il `rating` di catalogo (`recValutazione()`). Vale per la
scheda, per la card del Marketplace — dove compare anche il numero fra
parentesi — e per l'**ordinamento per valutazione**: ordinare per il `rating`
statico mentre le schede espongono la media darebbe un elenco che contraddice i
numeri scritti sopra. Verificato: una recensione da 2 stelle su *DevOps Alert
Manager* porta la media da 4.0 a 3.5, la correzione a 3 stelle la porta a 3.8,
l'eliminazione la riporta a 4.0 — in scheda, nella card e nell'ordinamento.

Le stelle sono disegnate **in frazioni**: cinque stelle grigie di fondo e una
copia dorata ritagliata alla percentuale esatta. Arrotondando, una media di 4.5
mostrava cinque stelle piene accanto al numero «4.5», cioè un disegno che
contraddiceva la cifra che aveva di fianco.

Il seme (`js/recensioni-seed.js`) porta **68 recensioni differenziate**: ogni
agente ha le sue, che parlano di ciò che quell'agente fa davvero, con voti
diversi e un rilievo critico dove il catalogo dichiara una valutazione più
bassa — le medie risultanti vanno da 3.67 a 5.0, non sono tutte uguali. Non
sono un elenco a parte: entrano nella stessa tabella in cui finiscono quelle
scritte dall'utente, e nella stessa media. Il seme **non tocca ciò che esiste**:
se un agente ha già una recensione, quell'agente si considera fatto, così
rilanciarlo dopo un aggiornamento non duplica né sovrascrive le recensioni
vere.

**Semplificazione.** Non c'è moderazione: una recensione appare appena
pubblicata, e non esiste una segnalazione di abuso né un limite di frequenza.
L'identità è quella dell'account demo scelto, quindi cambiando profilo si può
scrivere una seconda recensione sullo stesso agente — l'unicità è per
`(agente, autore)`, e in questo prototipo l'autore è un nome, non
un'autenticazione. È lo stesso limite già dichiarato per l'isolamento dei dati
per utente.

### 5.92 Il cruscotto di Monitoraggio dichiara le sue sette aree

I riquadri c'erano già, ma erano una sequenza di coppie senza nome: chi
guardava doveva ricostruire da solo perché due grafici stessero vicini, e il
numero di aree non era un dato osservabile — era una descrizione da prendere
per buona. Il Capitolo 3 della tesi (§3.5.4) ne elencava **sette**, con nomi
precisi, che nella pagina non esistevano.

Nomi e ordine sono ora quelli del capitolo (`GOV_AREE`, `govArea()` in
`js/governance.js`), numerati in pagina da 1/7 a 7/7:

1. **Popolazione** — utenti distinti e indicatori medi per utente
2. **Adozione** — agenti più eseguiti e modalità di avvio
3. **Uso** — andamento, esito complessivo, esito giorno per giorno, mappa
   oraria, distribuzione delle durate
4. **Presidio** — copertura dei controlli, politiche, approvazioni, blocchi ed
   errori gestiti
5. **Modelli** — nodi AI per fornitore, degradazioni, strumenti invocati
6. **Conoscenza** — uso della Knowledge Base, recuperi riusciti e a vuoto
7. **Pubblicazione e apprendimento** — imbuto degli stati, revisioni in coda,
   riuso del catalogo, formazione

Allineare la pagina al documento è costato meno che correggere il documento, e
rende quel paragrafo **verificabile** invece che da prendere per buono: chi
legge la tesi con l'applicazione aperta conta sette intestazioni numerate.

La riga di indicatori principali (esecuzioni, tasso di successo, agenti attivi,
durata media) resta **sopra** la numerazione, come intestazione della pagina.
Restano fuori anche la fascia «Richiede attenzione» (che compare solo se ci
sono segnali), il blocco «Cosa dicono questi numeri» e la dichiarazione dei
limiti: non sono aree di misura, sono rispettivamente un avviso, una lettura e
una cautela.

Nessun dato è cambiato: sono cambiati raggruppamento e intestazioni.

### 5.93 La quinta modalità di avvio era irraggiungibile

Il motore valuta le espressioni cron da sempre: `cronValida()`, `cronScaduto()`
e `descriviPianificazione()` gestiscono i cinque campi, e
`checkScheduledAgents()` interroga `cronScaduto` per le righe con
`schedule_type='cron'`. Il pannello «Metti in produzione» però offriva solo
quattro voci — manuale, ogni N minuti, giornaliera, per evento — quindi **la
quinta modalità esisteva nel codice e nessuno poteva sceglierla**.

Aggiunta la voce «Espressione cron» con etichetta e segnaposto dedicati
(`0 9 * * 1`), e la **validazione al salvataggio**: un'espressione malformata
verrebbe salvata in silenzio e l'agente non partirebbe mai, con l'unico sintomo
di un flusso «in produzione» che non si esegue. Verificato: `ogni lunedi` viene
rifiutata e il database resta invariato; `0 9 * * 1` viene salvata e descritta
come «Ogni lunedì alle 09:00».

Le modalità di avvio sono quindi **cinque**, e resta valido il limite già
dichiarato: la pianificazione gira finché la scheda del browser è aperta, non
essendoci un server dietro.

### 5.94 Sei lezioni non si aprivano affatto

I contenuti delle lezioni sono stati scritti in due momenti e con **due forme
di quiz**: `{q, opts, correct, explain}` in trenta lezioni,
`{q, a, c, exp}` nelle sei di `js/lessons-fondamenti.js`. Il renderer leggeva
solo la prima forma, quindi su quelle sei `lc.quiz.opts.map(...)` sollevava
un'eccezione **prima di disegnare qualunque cosa**: la lezione non si apriva.

Erano `1-0`, `1-1`, `1-2`, `1-3` (le prime quattro del primo percorso, cioè
quelle che un utente nuovo apre per prime), `2-0` e `2-2`.

Invece di riscrivere i dati si normalizza al momento della lettura
(`lezioneQuiz()`): entrambe le forme restano valide per chi scrive contenuti, e
a valle ne esiste una sola. Se un quiz è malformato la funzione restituisce
`null` e la lezione **si apre senza quiz** — un quiz rotto non deve poter
nascondere la lezione che lo contiene. Verificato: 36 lezioni su 36 si aprono,
tutte con quiz; la risposta corretta viene registrata in `quiz_done` e assegna
XP, quella sbagliata no.

### 5.95 Dalla lezione alla schermata

Le lezioni nominavano le schermate di cui parlano — la Knowledge Base, il
pannello di spiegabilità, la coda di revisione — ma chi leggeva doveva poi
cercarsele nel menu. Una formazione dentro il prodotto che rimanda al prodotto
solo a parole vale quanto un manuale in PDF.

`js/lezioni-pratica.js` associa a **ciascuna delle 36 lezioni** un gesto
concreto: cosa aprire e cosa guardarci. Il riquadro «Provalo adesso» compare in
fondo alla lezione con un pulsante che porta davvero lì. La mappa sta in un file
proprio perché cambia quando cambiano le schermate, non quando cambia il
programma didattico. Il riquadro si disegna **solo** se la lezione ha un gesto
dichiarato: un invito generico insegnerebbe a ignorare anche quelli buoni.
Verificato: 36 riquadri, e ogni gestore corrisponde a una funzione esistente.

**Chiusura di un percorso.** Completando l'ultima lezione compariva
«avanzamento aggiornato», lo stesso messaggio della prima: finire sei lezioni e
non finirle era indistinguibile. Ora arriva un riconoscimento con il conteggio
dei quiz effettivamente superati — che può essere inferiore alle lezioni lette —
e quanti percorsi mancano alla certificazione. Una volta sola per utente e
percorso: ripassare una lezione già fatta non lo rifà comparire.

**Scheda Risorse.** Diceva «guida integrazioni per i 63 connettori» (sono 39,
ora contati da `CONNECTOR_CONFIGS`) e offriva un «Video Tutorial» che apriva
solo un avviso: *in un ambiente di produzione qui si aprirebbe la playlist*. Una
scheda che promette un contenuto e non lo ha insegna a non fidarsi nemmeno delle
altre. Al suo posto ci sono le due cose che esistono davvero — il giro guidato e
la sandbox didattica — più un rimando al Monitoraggio.

### 5.96 La sandbox creava gli agenti che dichiarava di non creare

La sandbox didattica azzerava `B.dbAgentId` per impedire il salvataggio. Non
bastava: **senza riga a cui puntare, l'autosalvataggio ne crea una nuova**.
Uscendo comparivano in «I miei agenti» un «Prova in sandbox» e una copia del
flusso di esempio — cioè esattamente ciò che la sandbox prometteva di non fare.

Due correzioni: `autosaveAgentToDB()` non scrive finché `SANDBOX.attiva`,
qualunque cosa accada sul canvas; e lo stato `effimero` viene conservato e
ripristinato all'uscita, dalla sandbox e dal giro guidato — se il canvas era il
flusso di esempio, tornando indietro non deve essere diventato un agente
salvato. Verificato: aggiungendo un nodo in sandbox e uscendo, il numero di
agenti resta invariato.

### 5.97 Sfide: da bacheca a parte della piattaforma

Le sei iniziative erano sei riquadri di testo con un solo pulsante «Iscriviti»
che alzava una bandierina. Mancava tutto ciò che rende una sfida una sfida:
candidare qualcosa, vedere come si sta andando, potersi ritirare. E le **date
erano scritte a mano** («15-16 Luglio 2026»), quindi già nel passato:
l'hackathon risultava «Iscrizioni aperte» sei settimane dopo essersi svolto.

`js/sfide.js` porta:

**Scadenze relative** al giorno in cui si guarda, così la pagina non invecchia
fra una dimostrazione e l'altra. Lo stato («Iscrizioni aperte», «In chiusura»,
«Conclusa») ne discende, e le schede sono ordinate per scadenza.

**Candidatura di un proprio agente** (`challenge_submissions`, UNIQUE su
`(sfida, utente)`): si sceglie fra i propri flussi, si allega una nota, e il
secondo invio **corregge** la candidatura invece di duplicarla. Candidare
implica iscriversi: chiedere due gesti per la stessa intenzione fa dimenticare
il secondo.

**Classifica calcolata sui dati reali.** Non un punteggio dichiarato: si
misurano le esecuzioni dell'agente candidato in `exec_log` e i controlli
configurati nel suo flusso. **I pesi mostrati nella scheda sono la formula** —
«Esecuzioni riuscite 60% · Assenza di errori 40%» significa 0,6 e 0,4 su una
scala 0-100. Un punteggio calcolato in un modo e dichiarato in un altro sarebbe
peggio di nessun punteggio. Ogni criterio è normalizzato con un tetto
dichiarato (dieci esecuzioni, quattro controlli): senza tetto, chi esegue cento
volte rende la classifica insensibile a tutto il resto. A parità decide il
numero di esecuzioni riuscite, poi il nome — mai l'ordine di inserimento, che
non è un merito.

Tre sfide su sette hanno una classifica; le altre sono eventi e si prenotano
soltanto. La distinzione è dichiarata sulla scheda.

**Iscrizione annullabile.** Era a senso unico, il che rende il conteggio dei
partecipanti una misura che può solo salire. Annullando si ritira anche la
candidatura, ed è detto nella conferma.

**Hall of Fame da database** (`challenge_winners`) invece che scritta nel
markup: una classifica che non è un dato non si può né interrogare né estendere
quando una sfida si chiude.

Il numero di partecipanti somma la base redazionale del bando e gli iscritti
veri: senza la base un hackathon avrebbe due iscritti e non sembrerebbe
un'iniziativa aperta; senza i veri, iscriversi non cambierebbe nulla di
visibile.

### 5.98 Il Builder creava un agente fantasma a ogni sessione

`initBuilder()` marca come **effimero** il flusso di esempio, così
l'autosalvataggio lo ignora finché l'utente non lo tocca. Ma quel flag veniva
impostato **solo** nel ramo in cui il canvas è vuoto. Quando il canvas veniva
ripristinato dalla copia di sicurezza in `localStorage`, il ramo non si
eseguiva, `effimero` restava indefinito e `dbAgentId` nullo: **bastava aprire
il Builder** perché l'autosalvataggio inserisse un agente di nome «Workflow
Builder», a ogni sessione nuova.

Un canvas ripristinato dalla copia non è più un agente di quanto lo sia il
flusso di esempio: nessuno ha chiesto di salvarlo. Ora è effimero anch'esso
finché non lo si tocca. Verificato: aprire il Builder e uscirne non crea nulla;
modificare un nodo sì — il salvataggio automatico continua a fare il suo
mestiere.

### 5.99 Indietro e Avanti tornano a funzionare

La piattaforma è una pagina sola: il browser non registrava i cambi di
schermata. **Indietro usciva dall'applicazione** invece di tornare alla pagina
precedente, i due tasti laterali del mouse non facevano nulla, e per tornare
sui propri passi bisognava ricliccare la voce di menu.

Ogni cambio pagina scrive ora `#nome` nell'indirizzo (`navRegistra()` in
`js/router.js`): il browser crea da sé la voce di cronologia, e Indietro/Avanti
— da tastiera, dal menu contestuale o **dai tasti laterali del mouse**, che
producono la stessa navigazione — funzionano di nuovo.

Si usa l'hash e non `pushState` perché `pushState` solleva un errore di
sicurezza quando la pagina è aperta da `file://`, che è uno dei modi previsti
per aprire questo prototipo.

Il gestore di `hashchange` non ha bisogno di sentinelle né di temporizzatori:
quando è `go()` a scrivere l'hash, `currentPage` vale già la pagina nuova e il
gestore non ha nulla da fare. Scatta solo quando l'hash cambia per volontà di
chi naviga.

**Effetto collaterale utile:** gli indirizzi diventano condivisibili.
`index.html#monitoraggio` apre il Monitoraggio, anche passando dalla schermata
di accesso — `completeLogin()` rispetta l'hash invece di forzare la dashboard.

Verificato: dieci pagine visitate in sequenza e nove passi indietro
ripercorrono l'elenco esattamente al contrario, con la voce di menu evidenziata
che segue.
