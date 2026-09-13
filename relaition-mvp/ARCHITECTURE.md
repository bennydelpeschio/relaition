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

| Fornitore | Modelli selezionabili | Predefinito | Strumenti | Output vincolato | Immagini |
|---|---|---|:-:|:-:|:-:|
| Claude | `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5`, `claude-fable-5` | `claude-opus-5` | ✓ | ✓ | ✓ |
| OpenAI | `gpt-4o-mini`, `gpt-4o`, `gpt-4.1`, `gpt-4.1-mini` | `gpt-4o-mini` | ✓ | ✓ | ✓ |
| Gemini | `gemini-flash-latest`, `gemini-pro-latest`, `gemini-flash-lite-latest` | `gemini-flash-latest` | ✓ | ✓ | ✓ |
| Mistral | `mistral-large-latest`, `mistral-small-latest` | `mistral-large-latest` | ✓ | ✓ | ✗ |
| **Modello in locale** | rilevati dal server interrogandolo | il primo rilevato | ✗ | ✗ | ✗ |
| Endpoint personalizzato | indicato dall'utente | — | ✗ | ✗ | ✗ |

Una chiave dà accesso a più modelli dello stesso fornitore, e il modello si
sceglie **per nodo**: è la logica di n8n, dove la credenziale e la scelta del
modello sono due decisioni separate. Il catalogo per fornitore sta in
`AI_MODELLI_DISPONIBILI`; per i modelli locali l'elenco non è scritto da
nessuna parte, lo si chiede al server, che è l'unico a sapere cosa sia
installato. La scelta è reale: l'identificativo selezionato finisce nel corpo
della richiesta HTTP, non è un'etichetta decorativa.

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

### 5.0 Strumento da scrivania, non da telefono

Il progetto non contiene alcuna regola `@media`: la larghezza dello schermo non
è mai stata una variabile di progetto. È un tavolo di lavoro — una tela con
nodi da collegare, tabelle di esecuzioni, pannelli di proprietà — e su un
telefono quella modalità di lavoro non esiste.

Restano due accorgimenti perché una finestra stretta non renda l'applicazione
inservibile: il menu si comprime da solo sotto i 900px, e le griglie di schede
si incolonnano invece di stringersi. A larghezza da telefono le pagine si
leggono, ma **non sono state progettate per quel formato**, e il Builder in
particolare resta impraticabile.

Le due funzioni che dipendono da servizi locali (invio posta sulla porta 8787,
ricezione webhook sulla 8788) richiedono che quegli script siano in esecuzione:
non sono simulate, semplicemente non partono da sole.

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

L'allegato è **annunciato già nell'elenco**, non solo dentro al post: prima
bisognava aprirli uno per uno per scoprire quali ne avessero, cioè la funzione
esisteva ma non era reperibile. Accanto a «Scarica», un allegato `.json` mostra
**«Apri nel Builder»**, che passa dallo stesso `applicaImport()` del pulsante di
importazione: nessuna scorciatoia che salti i controlli di formato, e come una
qualsiasi importazione non salva nulla finché non si preme Salva.

Il workflow allegato al post dimostrativo **era una sagoma**: quattro voci
`{t,n}` che somigliavano a dei nodi senza esserlo. Chi lo scaricava e provava a
importarlo riceveva «formato non valido» — la funzione dimostrava il contrario
di ciò che il post prometteva. Ora è un export vero
(`flussoRiconciliazioneAllegato()` in `js/pages.js`), nella stessa forma
prodotta da `exportAgent()`: cinque nodi, quattro archi, contesto agente, si
importa e si esegue.

**Rispondere senza aprire il post.** Il commento costringeva ad aprire la
finestra sovrapposta e a chiuderla per tornare all'elenco: tre gesti per una
riga di testo. Sotto ogni scheda si apre ora un modulo con le ultime due
risposte, il collegamento a tutte le altre e un campo di scrittura. Una risposta
sotto i tre caratteri viene rifiutata: gonfiare il contatore senza dire niente è
il difetto che i numeri calcolati dovevano eliminare, non reintrodurre.

Il pulsante **«Nuovo post» è passato in cima**, accanto ai filtri: stava in
fondo alla lista, e con quindici post significava scorrere l'intera pagina per
scrivere. Chi vuole pubblicare lo decide prima di leggere, non dopo.

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
l'attribuzione in tutte le 22 tabelle coinvolte** (`IDENTITA_COLONNE` in
`js/utenti.js`). Prima di eseguirla il sistema dichiara quanti elementi
cambieranno intestatario e chiede conferma: su un profilo popolato sono
oltre cento righe, e farlo in silenzio sarebbe inaccettabile.

L'elenco delle colonne va tenuto allineato allo schema, e per un certo tempo
non lo è stato: le otto tabelle nate dopo — `recensioni`, le quattro delle
sfide (`challenge_submissions`, `challenge_votes`, `challenge_feedback`,
`challenge_questions`, quest'ultima con due colonne, chi domanda e chi
risponde), `challenge_winners`, `forum_likes`, `forum_views` — non c'erano.
Chi si rinominava perdeva la paternità delle proprie recensioni, candidature e
voti, che restavano nel database intestati a un nome non più esistente. Ora
sono 23 colonne su 22 tabelle, e il riepilogo pre-conferma somma invece di
assegnare, perché una tabella può comparirvi due volte.

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

**La scheda dice anche che cosa fa l'agente.** La colonna `desc` esisteva in
`published_agents` e non veniva mostrata: la scheda dichiarava lo stato della
pubblicazione ma non il suo contenuto, mentre le schede degli agenti creati nel
Builder lo dicono. Chi ha più pubblicazioni le distingueva solo dal nome. Sotto
la descrizione compare la stessa riga di dettaglio delle altre schede: quanti
nodi ha il workflow **come pubblicato** — letto da `workflow_json`, non
dall'agente locale, che dopo la pubblicazione può essere andato avanti per conto
suo — da quanto è pubblicato e quante installazioni ha.

I tre pulsanti si dividevano la larghezza della scheda con `flex:1` ciascuno:
dentro una colonna della griglia «Applica la correzione» andava a capo e
l'altezza fissa di 30px lo tagliava a metà, cioè **il pulsante più importante
era l'unico illeggibile**. L'azione principale sta ora su una riga propria, e
«Ripresenta» e «Dettagli» si dividono la riga sotto.

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

**Leggibilità delle intestazioni e densità della pagina.** Il numero d'area era
grigio e attaccato al titolo: si leggeva come una parola sola («4/7Presidio»), e
scorrendo non si capiva dove finisse un'area e cominciasse la successiva. Ora è
un contrassegno staccato, con una linea di separazione sopra ciascuna area.

I cinque valori del Presidio erano in coda alla propria etichetta su righe
strette: la cifra, che è il dato, spariva dentro la frase. Sono diventati
riquadri con il numero grande e l'etichetta sotto.

L'area *Uso* occupava tre righe di riquadri, l'ultima delle quali dedicava
l'intera larghezza a cinque barre: le tre righe sono diventate due, con i tre
grafici minori affiancati, e le altezze dei grafici sono scese (area 150→120,
anelli 170→136 e 110→96, indicatore 70→62). Il numero di aree, i dati e i
calcoli non cambiano: cambia soltanto quanto si deve scorrere per vederli.

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

### 5.100 Menu laterale collassabile e uscita leggibile

Il menu occupava 240px fissi anche mentre si disponevano i nodi sul canvas del
Builder, dove lo spazio orizzontale è esattamente ciò che manca. Un pulsante
hamburger lo riduce a 64px: **la navigazione si comprime, non sparisce**.
Restano le icone, con il nome come suggerimento al passaggio del mouse — dover
riaprire il menu per ogni spostamento sarebbe peggio del problema che risolve.

Il conteggio sulle voci diventa un punto colorato: perde il numero, non il
fatto che qualcosa richiede attenzione. La scelta è conservata in
`localStorage`, perché è una preferenza di postazione e ripeterla a ogni avvio
sarebbe una piccola tassa quotidiana. Alla chiusura il canvas viene ridisegnato:
calcola le proprie dimensioni sulla larghezza disponibile, e senza avvisarlo i
nodi resterebbero dove stavano.

**Uscita.** Era un'icona di porta 🚪, che nessuno associa a «esci» senza
passarci sopra. Sostituita da un controllo etichettato — freccia che esce da un
riquadro, più la parola «Esci» — che diventa rosso al passaggio del mouse.
Nel menu compatto resta la sola icona, dove il contesto è già dato dalla
posizione.

Verificato: le dieci voci restano su una riga sola a menu aperto, nessuna è
troncata, e nessuna pagina produce scorrimento orizzontale in nessuno dei due
stati.

### 5.101 Approfondimenti: materiale esterno, verificato

La scheda Risorse offriva un «Video Tutorial» che apriva soltanto un avviso —
*in un ambiente di produzione qui si aprirebbe la playlist*. Una promessa non
mantenuta insegna a non fidarsi nemmeno delle altre schede.

`js/lezioni-risorse.js` non finge di ospitare contenuti: rimanda a materiale
**esterno e pubblico** — gli articoli originali (Attention Is All You Need,
ReAct, RAG, Chain-of-Thought, Toolformer), la documentazione dei fornitori,
i testi normativi (AI Act, GDPR), NIST AI RMF, OWASP Top 10 per LLM, il corso
di NLP di Hugging Face e due canali video.

**Ogni indirizzo è stato interrogato e risponde.** Due candidati sono stati
scartati perché non verificabili: la scheda ISO/IEC 42001, che blocca le
richieste automatiche, e una pagina Wikipedia inesistente. Meglio una fonte in
meno che un collegamento morto in una tesi.

Le risorse sono dichiarate una volta e richiamate per sigla: le stesse fonti
servono più lezioni, e ripeterle per esteso significherebbe correggerle in
dieci punti quando un indirizzo cambia. Ciascuna porta il proprio tipo (video,
corso, articolo, guida, norma, strumento) e una riga che dice **perché**
aprirla — un elenco di collegamenti nudi costringe ad aprirli tutti per capire
quale serviva.

**Biblioteca.** Le risorse per lezione si trovano solo aprendo quella lezione:
chi cerca «il testo dell'AI Act» senza ricordare dove l'ha visto dovrebbe
riaprirle a una a una. La scheda Risorse ha ora una biblioteca che le raccoglie
tutte, raggruppate per tipo, ciascuna con l'indicazione delle lezioni che la
citano.

Verificato: 36 lezioni su 36 mostrano il riquadro, 80 collegamenti in totale,
26 risorse distinte, nessun riferimento a una sigla inesistente.

### 5.102 Ogni sfida ha un contenuto, e qualcosa su cui agire

Le sfide avevano già scheda, candidatura e classifica calcolata (§5.97), ma
restavano **annunci**: si leggevano una volta e non c'era motivo di tornarci.
Mancava ciò che in una vera iniziativa esiste sempre — il regolamento, le fasi
con le date, il programma di un evento, il materiale per cominciare — e
soprattutto mancava qualcosa da **fare** fra una scadenza e l'altra.

`js/sfide-contenuti.js` porta, per **tutte e sette**:

- **Regolamento** in punti numerati: da tre a cinque regole che dicono chi può
  partecipare, come si viene valutati e cosa non è ammesso.
- **Fasi** (sfide) o **Programma** (eventi). Le date delle fasi si calcolano
  dalla scadenza dichiarata sulla sfida, non sono scritte a mano: la fase
  passata è spenta, quella di oggi è evidenziata. Scrivere le date a mano
  avrebbe riprodotto lo stesso difetto già tolto dalle date fisse.
- **Materiale**: da uno a due riferimenti esterni, presi dallo stesso insieme
  verificato delle lezioni.
- **Domande frequenti**: due o tre, quelle che una persona si pone davvero
  prima di iscriversi.

**La parte interattiva.** Ogni sfida ha una sezione **Domande alla community**:
si scrive una domanda, si votano quelle degli altri, e l'elenco si riordina.
È l'unico blocco su cui si agisce — tutto il resto si legge — ed è quindi la
parte che in dimostrazione si può mostrare *mentre accade* invece di
raccontarla. L'ordinamento per voti non è decorativo: il regolamento
dell'incontro aperto dichiara che «le più votate aprono la sessione», e
l'elenco lo rispetta.

Un voto per persona e per oggetto (chiave primaria su `tipo, ref_id, user`):
senza il vincolo, «la più votata» misurerebbe soltanto chi ha cliccato più
volte. Il voto **si ritira ricliccando** — un voto irrevocabile fa esitare, e
chi esita non vota. Le domande sono cancellabili solo dal loro autore.

Il seme porta **16 domande distribuite sulle sette sfide, 25 voti e due
risposte già date**: una sezione vuota al primo avvio sembra una funzione che
nessuno usa, e i voti sono distribuiti in modo che l'ordine per voti risulti
visibilmente diverso da quello cronologico — che è esattamente il
comportamento da mostrare.

Verificato su tutte e sette: regolamento, fasi o programma, materiale, domande
frequenti e sezione domande sono presenti; il voto si dà e si ritira; una
domanda troppo corta viene rifiutata; pubblicandone una l'elenco si aggiorna.

### 5.103 Community: i numeri smettono di mentire

La Community non era indietro per quello che mancava — post, commenti,
allegati e composizione c'erano già. Era indietro perché **i numeri mostrati
non corrispondevano a niente**.

- **Il conteggio dei commenti era inventato su tutti e quindici i post.** Uno
  dichiarava 44 risposte e ne aveva zero; altri 31 contro 2, 27 contro 0, 8
  contro 3. Bastava aprire il post per vederlo.
- **Il «mi piace» era `p.likes++`**: un contatore cieco. Dieci clic della
  stessa persona facevano dieci, non si poteva togliere, e nessuno sapeva chi
  avesse apprezzato.
- **Le visualizzazioni erano numeri fissi** scritti nel seme — 142, 89, 287 —
  identici dopo cento aperture.

`js/community.js` trasforma i tre conteggi in interrogazioni: contano righe, e
le righe le scrivono le persone. È la stessa correzione già fatta sulle
recensioni degli agenti (§5.91) e sui voti delle sfide (§5.102): **un numero
mostrato dev'essere calcolato, non dichiarato.**

- `forum_likes` con chiave primaria `(post_id, user)`: un apprezzamento per
  persona, che si toglie ricliccando.
- Il conteggio dei commenti è la lunghezza dell'elenco. Il campo `comments` non
  viene più incrementato: un contatore separato dai dati che conta è un
  contatore che prima o poi mente, ed è precisamente ciò che era successo.
- `forum_views` conta le persone, non le aperture: riaprire lo stesso post
  dieci volte non è dieci persone interessate. Il valore del seme resta come
  base, altrimenti un forum appena aperto mostrerebbe ovunque «1».

**Aggiunte.** Un riepilogo in cima alla pagina (contributi, risposte,
apprezzamenti, persone, i tuoi interventi) che dichiara esplicitamente di
essere contato sulle righe reali; il proprio commento è cancellabile, quello
altrui no.

**Dati dimostrativi.** I cinque post che non avevano nemmeno una risposta ora
ne hanno di vere e pertinenti — 36 commenti in totale — e il seme distribuisce
32 apprezzamenti e 44 visualizzazioni fra i quattro profili, con una
distribuzione irregolare: un numero uguale ovunque si riconosce come finto a
colpo d'occhio.

Verificato: zero discrepanze fra il conteggio mostrato e i commenti reali su
tutti e quindici i post; tre clic sul «mi piace» della stessa persona danno 1,
non 3; tutti i post si aprono senza eccezioni.

### 5.104 Modelli selezionabili e connessioni nel backup

**Modelli.** L'elenco per fornitore era fermo alla generazione precedente:
`claude-sonnet-4-6`, `claude-opus-4-1`. Aggiornato ai modelli correnti —
**Opus 5** (predefinito), **Sonnet 5**, **Haiku 4.5**, **Fable 5** — con lo
stesso ritocco nel generatore di script Python e nella lezione che mostra una
chiamata di esempio, dove l'identificativo vecchio sarebbe rimasto a fare da
documentazione sbagliata.

Per Gemini si usano gli **alias mobili** (`gemini-flash-latest`,
`gemini-pro-latest`, `gemini-flash-lite-latest`): seguono la generazione
corrente senza modifiche al codice. È la difesa contro il difetto già
sperimentato con `gemini-2.0-flash`, ritirato da Google, il cui 404 arrivava
all'utente come «chiave non valida».

Resta il limite strutturale, dichiarato: **l'elenco è scritto nel codice e
invecchia**. La soluzione industriale è chiederlo al fornitore dopo il test
della chiave — è ciò che la piattaforma già fa per i modelli locali
(`discoverLocalModels`), dove l'elenco lo conosce solo il server. Estenderlo
agli altri cinque fornitori richiede un adattatore per ciascuno e non è stato
fatto.

**Connessioni nel pacchetto JSON.** Erano l'unica tabella dello schema esclusa
dall'export, e l'esclusione non era dichiarata: chi esportava il proprio backup
e lo reimportava si ritrovava senza connessioni, senza che nulla glielo
dicesse.

Ora sono incluse **senza i campi che possono contenere un segreto**. La
configurazione di una connessione non ha campi password — quella al database
chiede l'utente e non la password, l'SMTP tiene le credenziali nel servizio
locale — ma l'intestazione HTTP è un testo libero dove qualcuno può aver
incollato un `Authorization: Bearer ...`. Un backup è un file che si gira: è
esattamente il posto in cui una credenziale non deve finire.

Ogni riga che ha perso qualcosa lo dichiara nel file stesso
(`_campi_esclusi: ["headers"]`), così chi reimporta sa che quel campo va
ricompilato invece di scoprirlo quando la connessione non funziona. Il
pacchetto porta anche una nota in chiaro sul motivo.

**Un difetto introdotto e corretto nello stesso passaggio:** il marcatore
`_campi_esclusi` faceva fallire la reimportazione con «no column named
_campi_esclusi», e le connessioni sparivano in silenzio. `dbInsertRow()` ignora
ora le chiavi che iniziano con `_`: sono annotazioni del pacchetto, non colonne.

Verificato: ogni identificativo scelto sul nodo arriva nel corpo della
richiesta (`claude-fable-5`, `claude-haiku-4-5`, `gpt-4.1`,
`gemini-flash-lite-latest`); il giro export → cancellazione → reimport su **27
tabelle** è integro; il segreto non compare nel file esportato.

### 5.105 Pubblicazioni: filtri, dettaglio e ripresentazione

Con cinque pubblicazioni in quattro stati diversi la sezione diventava un
elenco da leggere tutto per trovare l'unica che richiedeva qualcosa.

**Filtri** con il conteggio per gruppo. I gruppi non sono i sei stati del
database ma le **quattro situazioni in cui una persona si trova**: è
pubblicato, aspetta un revisore, aspetta me, è stato tolto. Filtrare per
`in_revisione` invece che per «In verifica» chiederebbe all'utente di conoscere
lo schema. Un filtro che non seleziona nulla resta visibile ma spento: sapere
che **non** hai nulla di sospeso è un'informazione.

**Dettaglio** con la storia completa delle decisioni, versione per versione,
con chi ha deciso e quando, più il flusso com'era al momento della
pubblicazione. La scheda mostra l'ultima nota; su una pubblicazione respinta e
ripresentata due volte, l'ultima nota da sola non dice come ci si è arrivati.

**Ripresentazione.** Applicare la correzione e farla approvare sono due gesti
distinti: `pubRipresenta()` riporta la pubblicazione a `in_verifica`, incrementa
la versione, porta con sé il flusso corretto dall'agente locale e inserisce una
nuova riga in `publications` — da cui la coda di revisione la ripesca.

Chi corregge **non si approva da solo**. Far passare la pubblicazione
direttamente fra le approvate renderebbe la coda di revisione una formalità
aggirabile da chi ha più fretta, che è esattamente il difetto che il ciclo di
vita del §3.8 esiste per evitare.

Verificato dall'inizio alla fine: `bozza v1.0` → Ripresenta → `in verifica
v1.1` → compare nella coda → il revisore approva → `pubblicato v1.1`, passa nel
filtro «Pubblicate» e diventa visibile nel Marketplace. La storia registra
entrambe le decisioni con autore e data.

### 5.106 La sfida diventa una pagina

Il dettaglio viveva in una finestra sovrapposta: si chiudeva solo con la ✕,
Indietro usciva dalla pagina invece di tornare all'elenco, e un contenuto lungo
— regolamento, fasi, classifica, domande — dentro un riquadro sovrapposto
obbliga a due scorrimenti annidati.

Ora entra ed esce come una lezione del Learning Hub: l'elenco si nasconde, il
dettaglio prende la pagina su **due colonne**, e l'indirizzo diventa
`#challenges/sprint1`. Il router è stato esteso per portare, oltre alla pagina,
il dettaglio aperto dentro di essa: Indietro torna all'elenco, il collegamento
si può mandare a qualcuno, e ricaricando si riapre dove si era.

Cambiando pagina il dettaglio si chiude da sé — un dettaglio di sfida non ha
senso mentre si guarda il Monitoraggio.

**Voto e revisione fra pari sulle candidature.** Due regolamenti promettevano
interazione che non esisteva: il Demo Day dichiara che «il voto della community
vale il 50%», la sfida sul presidio prevede che «ogni partecipante commenti il
presidio di un altro agente candidato».

Ogni riga della classifica ha ora un pollice e un contatore di commenti. Il
voto della community e il punteggio calcolato restano **due colonne separate**:
il primo dice cosa piace alle persone, il secondo cosa fanno le esecuzioni.
Sommarli in un numero solo nasconderebbe quale dei due sta parlando.

**Non si vota la propria candidatura** — senza questa regola il voto della
community misurerebbe soltanto quanti partecipanti ci sono — e sulla propria
riga il commento non si scrive: lo scrivono gli altri. Il voto si ritira
ricliccando; i commenti stanno in `challenge_feedback`, i voti in
`challenge_votes` (chiave primaria `(tipo, ref_id, user)`: un voto per persona
e per oggetto, il ritiro è la cancellazione della riga) e si cancellano solo se
propri. Si apre una candidatura alla volta, altrimenti la classifica diventa una
colonna di caselle di testo.

**Obiettivi pratici configurabili.** Gli obiettivi del profilo erano otto righe
scritte nel codice: soglia e XP fissi, nessun modo di sapere *come* un obiettivo
venisse misurato. Ogni riga si espande ora su una spiegazione della misura e,
dove ha senso, sui passi intermedi; soglia, XP e attivazione si modificano dal
profilo e finiscono in `obiettivi_config` (chiave testuale stabile, non
posizione: riordinare l'elenco non sposta le impostazioni su un altro
obiettivo). «Ripristina le soglie» cancella le righe e riporta ai valori del
codice — la configurazione è una sovrascrittura, non una copia.

Verificato: sette sfide su sette si aprono come pagina, Indietro torna
all'elenco, tre clic sul pollice danno 1, un commento troppo corto viene
rifiutato, e sulla propria candidatura il pulsante di voto è inerte.

### 5.107 Il canvas e il registro non si contendono più la rotella

Il registro di esecuzione vive **dentro** `canvasArea`, e questo produceva due
difetti che si vedevano solo usando il Builder sul serio, cioè con un flusso
appena eseguito e un registro pieno di voci da leggere.

**La rotella.** L'evento risaliva dal registro fino al gestore dello zoom: chi
teneva il puntatore sul registro e girava la rotella per rileggere le voci più
vecchie si ingrandiva il canvas sotto, mentre il registro restava fermo. La
regola non è scritta sul registro ma sulla situazione: prima di zoomare,
`onCanvasWheel()` risale dall'elemento sotto il puntatore fino al canvas e, se
incontra un contenitore che **può davvero scorrere** — `overflow-y` scorrevole
*e* contenuto più alto dello spazio disponibile — non fa nulla, nemmeno
`preventDefault()`, così il browser lo fa scorrere come su qualunque pagina. La
seconda condizione conta: su un registro corto, che non ha niente da scorrere,
la rotella torna a zoomare invece di morire lì. Se domani nascesse un altro
pannello scorrevole sopra il canvas, la regola varrebbe già per lui.

**I comandi dello zoom.** Stavano a `bottom:16px`, cioè sopra un registro che
parte da `bottom:0`: coprivano stabilmente le ultime due righe, proprio quelle
che si finisce di leggere quando un flusso termina con un errore. Ora si
appoggiano **sopra il pannello** e non sopra il suo testo:
`impostaAltezzaRegistro()` — l'unica funzione da cui passano tutti i cambi di
altezza, pulsanti, doppio clic e trascinamento della maniglia — pubblica la
misura come variabile CSS `--altezza-registro`, e la barra la usa nel proprio
`bottom`. Il valore di ripiego è l'altezza del registro chiuso, così la barra è
al posto giusto anche prima che il Builder si sia inizializzato.

Verificato con la rotella vera: sul registro le voci scorrono da 321 a 21 e lo
zoom resta a 1; sul canvas lo zoom passa da 1 a 1.1. E nei tre stati del
registro — chiuso a 36px, aperto a 220px, al massimo a 375px su un canvas di
441px — la barra sale con il pannello, non lo copre mai e non esce dal canvas.

### 5.108 La tendina dei modelli non seguiva il fornitore

Sul nodo AI, cambiare fornitore lasciava la tendina **Modello** ferma
sull'elenco precedente: chi passava da OpenAI a Claude o a Gemini continuava a
vedere `GPT-4o mini` e compagni, cioè modelli che quel fornitore non ha.

La causa non era nella tendina ma in `updConfig()`. Dopo aver scritto il valore,
ridisegna il pannello **solo se** `campoDaCuiDipendonoAltri()` riconosce una
dipendenza, e quella funzione legge l'elenco `fields` della definizione del
nodo. Il pannello del nodo AI è però scritto a mano, senza `fields`: nessuna
dipendenza dichiarata, nessun ridisegno, e la tendina restava quella di prima.
Il caso va nominato esplicitamente, ed è quello che ora fa la condizione
`n.type==='ai' && key==='model'`.

Contestualmente il modello scelto per il fornitore precedente viene
**azzerato**: `claude-sonnet-5` non ha senso sotto Gemini. In esecuzione non
cambiava nulla — `modelloEffettivo()` ricadeva già sul predefinito quando
l'identificativo non appartiene al fornitore — ma la configurazione salvata
conteneva un identificativo di un altro vendor, ed è il genere di incoerenza che
si scopre solo esportando il flusso.

Verificato passando fra tutti i fornitori: OpenAI mostra i quattro `gpt-*`,
Claude i quattro `claude-*`, Gemini i tre alias `-latest`, Mistral i due
`mistral-*`; per il fornitore locale compare un campo di testo, non una tendina
vuota, perché l'elenco lo conosce solo il server. Scelto `claude-sonnet-5`,
resta in configurazione, resta mostrato e `modelloEffettivo()` restituisce
proprio quello; cambiando poi fornitore la configurazione torna vuota e
subentra il predefinito del nuovo. L'identificativo finisce nel corpo della
richiesta HTTP di tutti i fornitori (`idModello` in `js/ai-client.js`): la
scelta è reale, non un'etichetta.

### 5.109 Le schede personali contavano la piattaforma intera

L'intestazione del Profilo annunciava **10 agenti e 50 esecuzioni** mentre il
corpo della stessa pagina, poche righe sotto, contava **2 creati, 5 installati e
19 esecuzioni**. Stessa pagina, due risposte diverse alla stessa domanda, e
visibili insieme senza scorrere. La Dashboard ripeteva gli stessi numeri sotto
la scritta «Ecco una panoramica della **tua** attività».

`updateStatCards()` (`js/storage.js`) filtrava per utente solo una delle tre
interrogazioni: gli agenti installati sì, ma gli agenti creati e le esecuzioni
no. Così il totale sommava i cinque agenti *di tutti* ai cinque installati da
Mario, e mostrava le cinquanta esecuzioni della piattaforma al posto delle sue.
Era la stessa classe di difetto già corretta per gli obiettivi pratici (§5.61),
sfuggita su queste due schede.

Il sottotitolo, già che c'era, ha smesso di dire «N totali» — che ripeteva il
numero grande senza aggiungere niente — e dice ora com'è composto: «2 creati ·
5 installati».

**La correzione ne apriva un'altra.** Rese personali le schede, restava il
numero di esecuzioni sulle carte di «I miei agenti», che era il totale
dell'agente: ogni agente del seme ha esecuzioni di quattro utenti diversi, e
quel numero smentiva la Dashboard appena sistemata. Ridurlo alle sole esecuzioni
proprie avrebbe però nascosto un'informazione vera, cioè quanto quell'agente
viene usato in azienda. Le carte mostrano quindi **entrambi** i conteggi
(«4 tue · 11 in tutto»), uno solo quando coincidono, e «mai eseguito» quando non
è mai partito.

Verificato sui quattro profili dimostrativi: Mario 7 agenti e 17 esecuzioni,
Giulia 4 e 15, Sara 3 e 7, Marco 2 e 9 — ciascuno coincidente con il proprio
conteggio nel database e con il corpo della propria pagina.

### 5.110 La ricerca cercava e poi buttava via il risultato

`onGlobalSearch()` filtrava davvero il catalogo, contava i risultati e poi li
**scartava**: mostrava un avviso «3 agenti trovati per fattura» e portava al
Marketplace **non filtrato**, lasciando all'utente il compito di ritrovarli fra
ventitré schede. Il codice calcolava la risposta e non la usava.

Ora il testo cercato è un filtro come la categoria — vive nello stato
(`mktRicerca`), si combina con essa, e resta scritto sopra i risultati con il
numero trovato e un pulsante per toglierlo. Senza quella riga, chi non ricorda
di aver scritto qualcosa nella barra vede un catalogo dimezzato e crede sia
rotto.

**Le desinenze.** Con il confronto letterale «fattura» non trovava «fatture»:
non ne è una sottostringa. Chi cercava al singolare quello che il catalogo
scrive al plurale concludeva che la ricerca non funzionasse — ed è esattamente
il difetto segnalato dalle prove con utenti. Si confronta la **radice**, tolta
l'ultima vocale sopra i cinque caratteri: «fattur» copre entrambe. Gli accenti
vengono normalizzati.

**Il ripiego parziale.** Con più parole si pretende prima che ci siano tutte;
se così non si trova niente si ripiega su quelle che ci sono, ordinate per
quante ne corrispondono, **dichiarando** che il risultato è parziale. «Estrazione
fatture» dava zero perché la scheda dice *estrae*: meglio un elenco parziale
etichettato come tale che una pagina vuota. La ricerca guarda nome,
descrizione, categoria, autore ed etichette.

Verificato: `fattura` e `fatture` trovano entrambe *Invoice Extractor*,
`revisione contratti` cinque agenti in modalità parziale, `onboarding hr` uno
solo, una parola inventata mostra il messaggio con la via d'uscita.

### 5.111 La classifica per esperienza era scritta nel codice

Nella Community sei nomi con l'esperienza fissata nel sorgente — *Andrea L.
4820, Marco R. 4210, Giulia D. 3890* — mentre la piattaforma tiene i valori veri
in `xp_log`. Completare una lezione, vincere una sfida o pubblicare un agente
**non spostava la classifica di un punto**, e il proprio nome restava inchiodato
al quinto posto qualunque cosa si facesse. Due dei sei nomi non erano nemmeno
utenti della piattaforma.

`classificaXP()` (`js/utenti.js`) somma le righe di `xp_log` per utente e include
tutti gli account noti, anche a zero: una classifica che nasconde chi non ha
ancora fatto niente non è una classifica, e chi entra per la prima volta non si
troverebbe.

La stessa classifica compare ora anche **in cima alle Sfide**, con la propria
posizione dichiarata («Sei 1° su 4»): le classifiche già presenti misurano una
singola sfida, questa misura la persona. Stessa fonte e stesso ordine nelle due
pagine, così non si contraddicono fra loro.

Verificato: l'ordine coincide riga per riga con `SELECT user, SUM(amount) FROM
xp_log GROUP BY user`; aggiungendo 400 punti a un altro utente la classifica si
riordina davvero e lo mostra a schermo.

### 5.112 Il Loop dichiarava di iterare e non iterava

Il blocco *Loop* esisteva nella palette dal principio, ma a runtime si limitava
a scrivere una riga — *«🔄 Loop: iterazioni entro il guardrail di 100»* — e il
flusso proseguiva dritto. Chi lo metteva per analizzare una sequenza di
documenti ne vedeva analizzare **uno solo**, e nulla lo segnalava: il registro
diceva «concluso» avendo fatto un giro invece di venti.

Ora itera davvero, e il meccanismo segue la natura del motore. Il nodo Loop
**dichiara** quanti giri servono; a ripeterli pensa `rtRiarmaCicli()`, chiamata
dal motore **quando l'ondata si esaurisce** — cioè quando tutto ciò che poteva
girare ha girato. È l'unico ordine corretto: nel primo tentativo il nodo
azzerava sé stesso e i nodi a valle insieme, e il ciclo ripartiva *prima* che
quei nodi girassero, producendo quattro iterazioni tutte vuote con il registro
che dichiarava un lavoro mai fatto.

**Quanti giri.** Se il nodo dichiara un `field`, si contano gli elementi che i
nodi a monte hanno davvero prodotto — è ciò che distingue «ripeti cinque volte»
da «ripeti per ogni documento». La pipeline è una stringa: quando contiene JSON
viene interpretata (`rtInterpreta`), altrimenti la ricerca del campo non
troverebbe mai nulla e il ciclo ricadrebbe in silenzio sul numero fisso.

**Il tetto.** `LOOP_TETTO = 25`. Un ciclo senza limite dentro una pagina web
blocca il browser, e durante una dimostrazione dal vivo non si recupera: il
superamento è **dichiarato nel registro**, non nascosto. Il numero massimo di
ondate del motore cresce con i cicli presenti, altrimenti un ciclo lungo veniva
troncato a metà in silenzio.

Verificato: una lista di quattro elementi produce quattro iterazioni e
**quattro chiamate al modello** sul nodo a valle; cento elementi vengono
limitati a venticinque con l'avviso; senza `field` si usa il numero dichiarato.

### 5.113 I quattro livelli di certificazione esistevano solo nel testo

La pagina del Learning Hub prometteva *«i 4 livelli di certificazione, da AI
Aspirant ad AI Ambassador»* e nessun percorso era associato a un livello: chi
leggeva cercava una struttura che non esisteva da nessuna parte. I due riquadri
della scheda Certificazioni — «AI Agent Practitioner» e «Builder Expert» — non
avevano alcun rapporto con quei livelli, e nessuno dei due era scaricabile.

Ogni percorso dichiara ora il proprio `livello`, le schede lo mostrano, e il
livello raggiunto si **calcola**: è il più alto per cui *tutti* i percorsi fino a
quel livello sono completati. Basarsi su una percentuale complessiva avrebbe
dato «AI Ambassador» a chi ha finito solo i percorsi facili.

**L'attestato si scarica.** Un livello raggiunto e non portabile fuori dalla
piattaforma vale poco: `scaricaAttestato()` genera un SVG con nome, ruolo,
organizzazione, data di rilascio e un codice derivato da nome e livello. Nessuna
libreria esterna, il documento è testo generato. In fondo dichiara di provenire
da un prototipo: un attestato che si spacciasse per un titolo rilasciato da un
ente sarebbe un problema, non una funzione.

### 5.114 «Esegui» da «I miei agenti» non eseguiva niente

`quickRunAgent()` aspettava due secondi con un `setTimeout` e registrava
un'esecuzione **riuscita con zero nodi**. Chi lo premeva vedeva «completato con
successo» e poi cercava invano il risultato: non c'era, perché non era successo
nulla. Nelle prove con utenti la domanda ricorrente era *«dove trovo l'esito?»*,
e la risposta onesta era che non esisteva.

Ora usa lo stesso motore del Builder (`runAgentHeadless`) e, a fine corsa, apre
un riepilogo di **dove è finito** ciò che ha prodotto: file scaricato, documento
in Knowledge Base, email inviata, oppure — quando il flusso non produce nulla di
esterno — lo dice e mostra l'esito finale con il collegamento al registro. Le
azioni simulate restano dichiarate come tali.

Verificato: l'esecuzione registra **7 nodi** e una durata reale, e il riepilogo
compare.

### 5.115 Cose che c'erano e non si trovavano

Lo **spostamento della vista** sul canvas esisteva da sempre — Ctrl, Shift o
tasto centrale con trascinamento — e non era scritto da nessuna parte: nelle
prove risultava «frustrante», che è il giudizio giusto su una funzione che non
si scopre. Le scorciatoie sono ora elencate nel pannello delle proprietà quando
nessun nodo è selezionato, cioè esattamente quando si sta guardando la tela
senza sapere cosa fare.

La **sandbox** aveva già il proprio banner con la differenza dichiarata (palette
ridotta, nessuna scrittura esterna, nessun salvataggio): non è stata toccata.

### 5.116 Immagini nella Community

Le immagini si **mostrano**, non si annunciano: una community in cui ogni
contenuto visivo è una riga «📎 schema.svg — Scarica» somiglia a un archivio.
Gli allegati con tipo `image/*` compaiono in linea nella scheda del post; gli
altri formati restano una riga con il pulsante, che per un CSV o un JSON è
giusto.

I due post aggiunti portano **grafica vettoriale generata nel codice**, non
fotografie: uno schema di flusso e un grafico di andamento. Riempire la
dimostrazione di immagini inventate o di finte schermate avrebbe arredato la
piattaforma con cose che non esistono.

### 5.117 Il colore del marchio separato da quello del successo

La tinta della piattaforma era verde, che in questo settore si legge come
«riuscito» più che come «innovazione» — e infatti il colore del marchio finiva
per confondersi con lo stato dei flussi. Il marchio è ora **blu con secondo
viola**; il verde resta, ma solo come semantica.

La separazione andava fatta **prima** di cambiare tinta: `--ac` faceva da colore
del marchio *e* da colore del successo, e cambiarlo avrebbe reso blu anche
«Pubblicato» e «Esecuzione riuscita». Le nuove variabili `--ok*` tengono la
semantica; i verdi rimasti nei fogli di stile sono soltanto quelli: ramo «sì» di
una condizione, indicatore di provider attivo, valore in crescita, risposta
corretta di un quiz. `govColori()` usava già un verde esplicito e non è stata
toccata.

### 5.118 I nomi dei livelli, e i percorsi assegnati al livello sbagliato

Il capitolo 4.2 del documento di tesi nomina i quattro livelli del Learning Hub
come *AI Aspirant*, *AI Translator*, *AI Creator*, *AI Ambassador*. Il codice ne
portava altri due, e non gli stessi in tutti i punti: `LIVELLI` in `pages.js`
diceva «AI Practitioner» (2) e «AI Professional» (3), mentre la fascia in cima
alla pagina, scritta a mano dentro `index.html`, diceva «AI Practitioner» (2) e
«AI Champion» (3). Due nomi diversi per lo stesso livello, visibili insieme
nella stessa schermata.

«AI Champion» era anche il nome del programma di promotori interni descritto
nel capitolo 4.2, che è un ruolo organizzativo e non un livello formativo: la
collisione spariva solo rinominando.

`LIVELLI` ora riporta i nomi del documento, con le descrizioni prese dai ruoli
che il capitolo assegna a ciascun livello (livello 2: usa gli agenti del
Marketplace nel proprio reparto; livello 3: costruisce nel builder no-code e
nella sandbox).

**I percorsi seguivano la vecchia semantica.** «Builder Avanzato» era al livello
2 e «AI per il Business» al livello 3: con i nomi nuovi significava chiedere di
costruire flussi a chi è ancora un utilizzatore, e di leggere casi d'uso di
reparto a chi è già un costruttore. La mappatura è stata invertita dove serviva:

| Livello | Percorsi |
|---|---|
| 1 · AI Aspirant | Fondamenti AI Agent |
| 2 · AI Translator | AI per il Business, Marketing AI Agent |
| 3 · AI Creator | Builder Avanzato, Padroneggiare RelAItion |
| 4 · AI Ambassador | Sicurezza & Governance |

**La fascia dei livelli era statica.** I quattro riquadri di `#levelTrack`
vivevano in `index.html` con gli stati incisi nel markup: «Livello 1 ·
Completato ✓», «Livello 2 · In corso: 40%», gli altri due bloccati. Nessun
codice li aggiornava, quindi dichiaravano un livello completato anche con zero
lezioni fatte, e la barra di avanzamento sotto (quella sì calcolata) poteva
leggere «0% completato» a due centimetri da «Completato ✓». Ora i riquadri sono
prodotti da `disegnaLivelli()` a partire da `livelloRaggiunto()` e
`avanzamentoLivello()`, e `index.html` conserva solo il contenitore vuoto.

`festeggiaPercorso()` in `lezioni-pratica.js` annunciava a percorsi completi la
certificazione «AI Agent Practitioner», un nome che non esisteva in nessun altro
punto del prodotto: ora nomina il livello effettivamente raggiunto.

### 5.119 Gamification allineata al capitolo 4.4

Il documento descrive un impianto di riconoscimento in tre parti: badge per
milestone, meccanismi che premiano la costanza, e privilegi che l'accumulo di
esperienza sblocca. Il prototipo aveva solo la prima, e nemmeno con i nomi
giusti.

**I badge del documento non esistevano.** Il capitolo nomina «Prompt Master»,
«Ethical AI Guardian» e «Automation Hero». Due corrispondevano a badge già
presenti sotto un nome italiano — «Attento ai presidi» e «In produzione» — e
sono stati rinominati senza toccarne la soglia. «Prompt Master» non esisteva:
ora conta i nodi AI dei propri flussi che portano un prompt scritto a mano,
cioè lungo almeno 25 caratteri. Sotto quella soglia è un titolo, non una
consegna, e contarlo gonfierebbe il badge con i segnaposto lasciati dal builder.

**La costanza era il caso peggiore.** Le notifiche e il registro attività
annunciavano *«Badge sbloccato: 7-Day Streak 🔥»* con un'azione che portava al
profilo, dove quel badge non esisteva: un premio dichiarato, annunciato e
irraggiungibile. `giorniConsecutivi()` in `storage.js` conta ora i giorni
consecutivi di attività dalle date già presenti in `xp_log` ed `exec_log` — non
serviva una nuova tracciatura, i dati c'erano — e il badge «Costanza» usa la
soglia del documento, cinque giorni. La serie parte da oggi, oppure da ieri se
oggi non c'è ancora attività: va interrotta da un giorno saltato per intero,
non dal fatto che si stia guardando la pagina di mattina presto.

**Gli XP non sbloccavano niente.** Il capitolo dice che l'accumulo di punti
«permette di sbloccare funzionalità avanzate o privilegi all'interno della
community»; nel prototipo erano un punteggio e basta. `PRIVILEGI` dichiara ora
una scala di quattro gradini, mostrata nel profilo con quanto manca al
prossimo, e due di essi filtrano davvero un'azione: il voto sulle candidature
alle sfide (250 XP) e la revisione fra pari (500 XP).

Le soglie stanno dove stanno per una ragione. Mettere un cancello davanti alla
partecipazione di base — installare un agente, scrivere in Community, seguire
un percorso — contraddirebbe l'abbattimento delle barriere che è il senso
dichiarato del prodotto. Quello che si sblocca è il ruolo di chi **giudica il
lavoro altrui**, che è l'unica cosa per cui l'esperienza accumulata sia
davvero un requisito e non un pedaggio. Il voto sulle *domande* resta libero:
serve a far emergere cosa si vuole chiedere, non a valutare qualcuno.

**L'esperienza dal merito altrui.** Il capitolo prevede che gli agenti più
installati e meglio valutati generino punti per chi li ha scritti. `addXPa()`
scrive nel registro XP di un utente diverso da quello collegato: l'installazione
di un agente porta 15 punti al suo autore, una recensione da quattro stelle in
su ne porta 10. Entrambe valgono una volta sola per persona — l'installazione
perché il controllo su `my_agents` la rende idempotente, la recensione perché
il bonus scatta solo alla prima e non alle modifiche: se contasse anche quelle,
si potrebbe far salire un autore alzando e riabbassando il voto.

**Un difetto trovato per strada.** `profileStats()` leggeva i nodi con
`SELECT nodes_json FROM agents` senza filtro sull'autore: «i controlli che hai
inserito nei flussi» contava anche quelli scritti dagli altri. Ora filtra su
`author`, come le altre statistiche del profilo.

### 5.120 Eventi allineati al capitolo 4.3

L'impianto c'era già e regge il confronto: hackathon, Demo Day e incontro aperto
esistono come eventi con iscrizione, candidatura e ritiro, e i criteri di
valutazione con i loro pesi sono visibili **prima** di iscriversi, che è
esattamente quello che il capitolo chiede. Mancavano quattro dettagli.

| Dettaglio del 4.3 | Stato precedente | Ora |
|---|---|---|
| Hackathon di tre giorni | «48 ore», in due punti | tre giorni, nella descrizione e nella scaletta |
| Binari tematici | assenti | tre binari sulla scheda dell'hackathon |
| Mentori durante l'evento | assenti | dichiarati per hackathon e incontro aperto |
| Cadenza (quadrimestrale, mensile) | assente | dichiarata dove il capitolo la prevede |

I campi `binari`, `mentori` e `cadenza` sono opzionali e compaiono solo dove
sono dichiarati: una scheda non mostra sezioni vuote per uniformità.

**I premi nominavano badge inesistenti.** «badge Esperto Finance», «badge
Governance», «badge Ambassador»: nessuno dei tre esisteva nel prodotto, e
«Ambassador» era per giunta il nome di un livello formativo, non di un badge.
I premi seguono ora le categorie che il capitolo elenca — dispositivi, voucher,
borse di studio — e l'unico badge citato è «Ethical AI Guardian», che esiste ed
è pertinente alla sfida sul presidio. Il Demo Day e l'hackathon promettono ai
vincitori budget e supporto per portare il prototipo in esercizio, che è il
piano di follow-up descritto nel capitolo.

### 5.121 Le ultime voci del 4.3 e del 4.4

Il confronto voce per voce con i due capitoli ha lasciato scoperte quattro cose,
tutte chiuse qui.

**Creare un agente non dava esperienza.** Il capitolo 4.4 nomina due attività
per esempio — «completamento di moduli formativi nel Learning Hub o creazione di
un agente nell'Agent Builder» — e la seconda era l'unica delle due a non
generare punti. `saveAgent()` ne assegna ora 60, solo al primo salvataggio:
risalvare aggiorna la riga esistente e non passa di lì, altrimenti basterebbe
premere «Salva» a ripetizione.

**I badge li vedeva solo chi li possedeva.** Il capitolo dice che sono
«visualizzabili sui profili aziendali» e che «forniscono un riconoscimento
immediato del talento»: metà del meccanismo è che li veda qualcun altro. Ogni
riga della classifica apre ora il profilo pubblico di quella persona.
`profileStatsDi(utente)` ricalcola tutto per lei, comprese lezioni e percorsi,
che stanno in `learn_progress` per utente e non nell'array `PATHS` in memoria —
quello riflette solo chi è collegato adesso.

**Demo Day.** I criteri erano *Impatto reale · Innovazione · Presentazione*; il
capitolo indica per esempio impatto sul business, scalabilità ed etica. Ora sono
quattro e li comprendono. Il regolamento dichiara che la presentazione è una
dimostrazione dal vivo del flusso in esecuzione, e la giuria comprende esperti
esterni: entrambe erano richieste esplicite del 4.3 che il prototipo non
riportava.

**L'incontro aperto si chiama AMA**, come nel capitolo.

### 5.122 Il verde rimasto, e quanto ne era rimasto

Il cambio di identità cromatica da verde a blu/viola era stato fatto
**sostituendo le variabili** in `base.css`. Tutto ciò che leggeva `var(--ac)` è
diventato blu insieme a loro. Ma un colore scritto per esteso non segue la
variabile che non usa, e di verdi scritti per esteso ce n'erano ovunque.

La cosa è emersa in due passaggi, entrambi segnalati da chi guardava le
schermate e non il codice.

**Primo passaggio, il guscio.** Schermata di accesso, `icon.svg` e il
`theme-color` del manifesto portavano il gradiente `#10B981 → #059669` scritto a
mano dentro `index.html`, `icon.svg` e `manifest.webmanifest`. Sono fuori dai
fogli di stile, quindi la sostituzione delle variabili non li aveva sfiorati.
È il posto peggiore in cui lasciare un colore vecchio: la schermata di accesso è
la prima cosa che si vede.

**Secondo passaggio, e qui il conto era più lungo.** Un rastrellamento su tutti
i fogli di stile ha trovato altre tredici occorrenze di `rgba(16,185,129,…)` in
posizioni di **marchio**, cioè dove il colore dice «questo è il prodotto» e non
«questo è andato bene»:

| File | Cosa era ancora verde |
|---|---|
| `base.css` | voce di menu **attiva** nella barra laterale, fuoco della ricerca in alto, ombra del **pulsante primario**, voce attiva a barra compressa |
| `builder.css` | fuoco dei campi della palette e del pannello proprietà, trascinatore del pannello |
| `components.css` | **battito del logo**, velo della scheda agente, alone della scheda statistica, ombra del pulsante di accesso |
| `marketplace.css` | sfondo e alone dell'intestazione del catalogo |
| `pages.css` | sfondo dell'intestazione del Learning Hub, barre del grafico settimanale |

Più due colori d'identità: il colore d'avatar di un utente dimostrativo, che
sulla schermata di accesso metteva una scheda verde in mezzo alle altre tre, e
il colore predefinito dell'avatar nel registro attività.

Tutti portati su `rgba(37,99,235,…)` e sui gradienti blu/viola del marchio. I
verdi rimasti nei fogli di stile sono ora **soltanto** quelli semantici, e
devono restare: `--ok*`, ramo «sì» di una condizione (`.b-port-true`),
indicatore di provider attivo (`.ai-dot.ok`), variazione in crescita
(`.stat-up`), risposta corretta di un quiz (`.quiz-option.correct`).

Restano verdi anche parecchi valori dentro il codice JavaScript, ma sono di due
tipi che non c'entrano con il marchio: **esiti** (spunte, stato «pubblicato»,
righe OK del registro) e **tavolozze categoriali**, dove il verde è uno dei
colori che distinguono un agente, un nodo o un autore dagli altri. Cambiarli
non renderebbe il prodotto più coerente: toglierebbe soltanto un colore alla
tavolozza.

**La lezione, per chi legge questo file dopo.** Un cambio di tema fatto sulle
variabili non è finito quando le variabili sono cambiate: è finito quando si è
cercato il valore vecchio scritto per esteso in tutti i file, e si è deciso caso
per caso se quell'occorrenza significava *marchio* o *esito*. La prima volta
non l'ho fatto, e il difetto è stato trovato da chi apriva l'applicazione.

### 5.123 Un solo fulmine, non due

L'icona dell'applicazione installata e il marchio dentro l'applicazione
disegnavano lo stesso simbolo in due modi diversi. `icon.svg` traccia un
fulmine **bianco** su tessera blu/viola; l'interfaccia scriveva l'emoji `⚡`,
che quasi tutti i sistemi disegnano **gialla**. Stesso concetto, due marchi:
chi installava l'applicazione trovava sulla schermata iniziale un'icona che non
corrispondeva a quella che vedeva nel menu.

L'emoji non era riproducibile nell'icona: dentro un SVG dipenderebbe dal font
installato, e in un contesto di icona di sistema è proprio il caso in cui non
si può contare su nulla. La direzione dell'allineamento era quindi obbligata,
ed è anche quella giusta: **il tracciato vettoriale diventa la fonte unica**, e
l'interfaccia lo riusa.

Le tre tessere del marchio — barra laterale, schermata di accesso, velo di
avvio — portano ora lo stesso `<path>` di `icon.svg`, con lo stesso gradiente
`#2563EB → #7C3AED`. Verificato a confronto: il tracciato nel menu è
carattere per carattere quello del file dell'icona.

Effetto collaterale utile: il marchio non dipende più da come un sistema
operativo decide di disegnare un'emoji. Prima cambiava aspetto fra Windows,
macOS e Android senza che nessuno lo avesse scelto.

### 5.124 L'applicazione installata mostrava ancora la versione vecchia

Segnalazione: nel browser i colori sono giusti, nell'applicazione installata
è tutto ancora verde — barra del titolo, tessera del marchio, pulsante di
accesso. Due cause distinte, che vanno separate perché hanno rimedi diversi.

**La barra del titolo e l'icona non si aggiornano mai da sole.** Sono proprietà
del manifesto (`theme_color`, `icons`), e il sistema operativo le fotografa **al
momento dell'installazione**. Nessuna modifica al codice può cambiarle in
un'installazione già fatta: l'unico rimedio è disinstallare e reinstallare. È
un limite della piattaforma, non un difetto da correggere.

**Il contenuto era vecchio perché serviva la cache.** Il service worker è
`network-first`: chiede prima alla rete e usa la copia locale solo quando la
rete non risponde. Nell'applicazione installata la rete è il server locale, e se
`servi-locale.ps1` non è in esecuzione **ogni richiesta fallisce e ogni file
arriva dalla copia vecchia**. L'applicazione parte, funziona, e sembra
soltanto che le modifiche non siano state fatte. È la modalità di guasto
peggiore: silenziosa e verosimile.

**Come si verifica quale versione è servita**, senza aggiungere niente
all'interfaccia: `F12` → *Application* → *Cache Storage*, oppure in console
`caches.keys()`. Il nome che compare è quello del service worker che sta
effettivamente rispondendo, e se è vecchio si vede subito.

Era stata provata la strada opposta — una riga nell'interfaccia con il nome
della cache servita — ed è stata **tolta**: in un prodotto da presentare, un
numero di versione in fondo al menu è rumore per chiunque non stia facendo
diagnosi, e la diagnosi la fanno gli strumenti del browser meglio di una riga
di testo. Il rimedio resta lo stesso: ricaricare con Ctrl+Shift+R con il server
attivo, oppure disinstallare e reinstallare.

### 5.125 Audit finale: cosa ha trovato e cosa ha lasciato aperto

Un giro di controllo sistematico prima della consegna, cercando le tre classi
di difetto che in questo progetto si sono ripetute: riferimenti morti, numeri
dichiarati invece che calcolati, e resti del vecchio tema.

**Riferimenti morti: nessuno.** Sono stati raccolti tutti i gestori di evento
scritti negli attributi (`onclick`, `onchange`, `oninput`, `onsubmit`,
`onkeydown`) su tutte e dieci le pagine dopo il disegno, estratti i nomi di
funzione e verificato che ciascuno esista davvero: 103 su 103. Nessun pulsante
che non fa niente.

**Numeri dichiarati: nessuno rimasto nel markup.** Gli unici valori numerici in
`index.html` sono segnaposto `0` che il codice sovrascrive, più l'etichetta
dello zoom del Builder. I contatori del menu sono tutti calcolati.

**Due numeri veri che sembravano contraddirsi.** Il pallino sul menu
Monitoraggio diceva «2», la pagina «4 segnali». Entrambi corretti — il pallino
conta i segnali di livello medio o alto, la pagina li elenca tutti — ma messi
uno accanto all'altro sembravano un errore. Ora il sottotitolo della pagina
dichiara entrambi i numeri e spiega quale finisce nel menu.

Nello stesso punto è emerso un difetto vero: il pallino veniva calcolato **una
volta sola all'avvio** e non veniva mai nascosto. Se durante la sessione i
segnali si risolvevano, il numero restava lì a indicare un problema che non
c'era più. Ora `aggiornaBadgeMonitoraggio()` viene richiamata anche quando si
apre la pagina, e si nasconde a zero.

**L'impaginazione stretta non esisteva.** Il progetto non ha **nessuna**
`@media`: la larghezza non è mai stata una variabile. A 375px il menu esteso si
prendeva due terzi dello schermo e il contenuto restava in una colonna con le
parole spezzate, illeggibile.

Non è stata scritta un'impaginazione per telefono — è uno strumento da
scrivania e riprogettarlo alla vigilia della consegna sarebbe stato il rischio
sbagliato da correre. Sono stati fatti i due interventi che costano poco e
tolgono l'inutilizzabilità:

- il menu **si comprime da solo** sotto i 900px, riusando la modalità compatta
  che esisteva già. La preferenza salvata non viene sovrascritta: sotto soglia
  si comprime comunque, sopra soglia si torna a quello che l'utente aveva
  scelto;
- le griglie a numero fisso di colonne (`.stats-row` a quattro, `.grid-2` a
  due) diventano `auto-fit`, quindi le schede si incolonnano invece di
  stringersi fino a spezzare le parole.

Con questi due, a 375px la Dashboard è leggibile. **Non** è un'applicazione
progettata per telefono, e resta dichiarato fra le semplificazioni.

Una nota sul guardiano: `adattaMenuALarghezza()` esce subito se
`window.innerWidth` vale 0. Una larghezza nulla non è uno schermo stretto, è
una pagina non ancora disegnata — scheda in secondo piano, riquadro nascosto —
e comprimere il menu in quel caso lo farebbe trovare compresso a chi non ha
ridotto niente. È lo stesso inganno che durante lo sviluppo ha già prodotto
misurazioni false.

### 5.126 La demo aveva ancora i colori vecchi, e il ripiego offline la faceva sparire

Due difetti trovati insieme, mentre si controllava la demo dopo il cambio di
tema.

**Il palco della demo era rimasto verde.** `demo/demo.html` non eredita niente
dall'applicazione — è deliberato: l'app vive dentro il riquadro e il palco che
le sta intorno ha i propri stili — ma proprio per questo il cambio di tema non
l'aveva toccato. Le sue variabili (`--acc`, `--acc-l`, `--viola`), l'alone del
faro che illumina gli elementi e il colore del testo sulla voce attiva
dell'indice erano tutti tarati sul verde. Il testo della voce attiva era
`#062E22`, un verde quasi nero scelto per leggersi su fondo verde: su fondo blu
sarebbe rimasto scuro su scuro.

Ora il palco usa il blu e il viola del marchio, e la schermata di attesa porta
la stessa tessera con il fulmine vettoriale dell'applicazione.

**Il ripiego offline sostituiva un documento con un altro.** Il gestore
`fetch` del service worker, quando la rete non risponde e la richiesta non è in
cache, restituiva `index.html`. Per qualunque richiesta. Aprendo
`demo/demo.html` con il server locale spento **compariva l'applicazione al
posto della demo**: stesso indirizzo nella barra, titolo diverso, nessun
errore. È lo stesso difetto trovato per l'applicazione installata, dallo stesso
meccanismo, e stavolta è stato osservato dal vivo perché il server era caduto
durante una verifica.

Peggio ancora per i file non-documento: un `.js` che falliva riceveva HTML, e
il browser tentava di eseguirlo — da cui una fila di
`SyntaxError: Unexpected token '<'`, che è un modo particolarmente opaco di
dire «il server non risponde».

Il ripiego vale ora **solo per le navigazioni**, e sceglie il documento
dell'area richiesta: `/demo/` ripiega sulla demo, tutto il resto
sull'applicazione. Le altre richieste ricevono `Response.error()`, cioè un
errore vero, che si diagnostica in dieci secondi invece che in mezz'ora. I tre
file della demo sono stati aggiunti al guscio in cache: fanno parte della
consegna, e senza copia di riserva la demo offline sarebbe una pagina bianca.

Verificato nella condizione che lo aveva rivelato: **server spento**,
`demo/demo.html` apre la demo dalla cache e non l'applicazione.

### 5.127 Nascondere i comandi senza restare senza comandi

La barra dei comandi della demo si poteva nascondere con `✕` o con `H`: serve a
chi registra, perché nel video la barra non serve.

Il difetto era che **l'unico modo di riaverla era il tasto `H`, scritto nella
barra appena sparita**. Chi lo premeva per sbaglio si trovava una demo senza
avanti, senza indietro, senza indice e senza alcuna indicazione su come
recuperarli. Un comando che cancella il proprio modo di essere annullato non è
una scorciatoia, è una trappola.

La prima correzione è stata togliere del tutto la possibilità di nascondere.
Sbagliata: risolveva il problema eliminando una funzione utile a chi deve
registrare, che è il motivo per cui la demo esiste.

La soluzione tiene entrambe le cose. Mentre i comandi sono nascosti esiste una
maniglia «⌃ comandi» che:

- resta **trasparente e non cliccabile** finché il mouse è fermo, quindi chi
  registra senza toccare il mouse non se la ritrova nel video;
- **compare al primo movimento** del mouse e torna trasparente dopo 2,6 secondi
  di immobilità.

Quando i comandi sono visibili la maniglia è `display:none`, non solo
trasparente: un pulsante invisibile ma presente, nella stessa posizione della
barra, ne avrebbe intercettato i clic.

Il riquadro dei comandi sta a `z-index` 95, sopra la schermata di attesa: è
raggiungibile dal primo istante.

Verificato: con i comandi visibili la maniglia non esiste nel documento; una
volta nascosti compare, resta cliccabile, torna trasparente da sola dopo
l'attesa e riappare al movimento del mouse. La barra torna al suo posto e la
maniglia sparisce.

### 5.128 Le transizioni dell'accesso

Segnalazione: entrando, la transizione è lenta e per qualche istante resta
visibile il contenuto precedente, con la voce di menu di prima ancora
evidenziata. Sotto c'erano quattro cose diverse.

**L'ordine era sbagliato.** `completeLogin()` toglieva il velo e *poi*
chiamava `go()` per disegnare la pagina. Fra le due cose il browser dipingeva
quello che stava dietro: la pagina disegnata all'avvio, con i dati e la voce di
menu di prima. Ora si disegna prima e si scopre dopo — quando il velo si
dissolve, sotto c'è già il contenuto giusto. Misurato: dall'inizio dell'accesso
al contenuto pronto passano **circa 30 millisecondi**, quindi non era mai stata
una questione di lentezza del disegno.

**L'uscita era un taglio secco.** La schermata entrava con una dissolvenza e
spariva di colpo: l'asimmetria si legge come uno scatto. Ora esce come è
entrata, in 0,28 secondi.

**Uscire ricaricava la pagina.** `logout()` faceva `location.reload()`, cioè
rifaceva da zero l'inizializzazione di SQLite — qualche secondo di schermata
vuota per tornare a una schermata che era già lì. La schermata di accesso non
viene più rimossa dal documento ma nascosta, e l'uscita la riporta: **da
secondi a un millisecondo**. Chi rientra passa comunque da `applicaUtente()`,
che ricarica i contenuti dell'utente scelto, quindi nessun dato dell'uno resta
in mano all'altro.

**Due residui della dissolvenza rinascondevano la schermata.** Emersi provando
l'uscita subito dopo l'accesso. Il primo è il temporizzatore di sicurezza: se
scatta dopo che l'uscita ha già riportato la schermata, la nasconde di nuovo.
Il secondo è più insidioso — l'ascoltatore `transitionend`, registrato con
`once` ma **mai consumato** quando la transizione non arriva in fondo, resta
appeso e si aggancia alla transizione *successiva*, che è proprio quella di
riapparizione, spegnendola sul nascere. Sintomo di entrambi: si preme «Esci» e
sembra che non succeda niente. `fermaDissolvenza()` annulla ora l'uno e l'altro
prima di ogni cambio di stato.

**Il cambio pagina** passa da 0,35 a 0,22 secondi, con uno scorrimento di 4px
invece di 8: la durata di prima si notava come attesa.

**Chi ha ridotto le animazioni a livello di sistema** ora le ha ridotte anche
qui: una regola `prefers-reduced-motion` spegne le animazioni di pagina, velo,
finestre e sfondi animati. Per alcune persone non è una preferenza estetica.

Una nota di metodo. Le misure di opacità prese durante le transizioni, in
questo ambiente di prova, restituiscono valori fermi al primo fotogramma:
quando il riquadro non dipinge, le animazioni non avanzano. Le schermate
catturate restano attendibili, i valori calcolati no — ed è lo stesso inganno
che in questo progetto ha già prodotto misurazioni false sulle dimensioni.
La verifica finale è stata fatta guardando le schermate.

### 5.129 L'evidenziazione della demo non seguiva lo scorrimento

Segnalazione: scorrendo a mano durante la demo, c'è un ritardo fra quello che
si sta guardando e il riquadro che evidenzia la sezione. Tre cause sovrapposte.

**Il faretto veniva posizionato una volta e restava lì.** `illumina()`
calcolava il rettangolo del bersaglio e scriveva le coordinate; poi nessuno le
ricalcolava più. Scorrendo dentro l'applicazione il contenuto si muoveva e
l'evidenziazione no: dopo mezzo schermo di scorrimento indicava tutt'altro.

**La transizione lavorava contro.** Il faretto aveva `transition:all .4s`, il
riquadro della narrazione `transition:left .4s, top .4s`. Una transizione di
quattro decimi significa, per definizione, arrivare quattro decimi dopo il
contenuto: è precisamente il ritardo percepito. Ora la transizione resta per il
**salto da un bersaglio all'altro**, dove serve a far seguire il movimento con
l'occhio, e viene disattivata (classe `.segue`) mentre si insegue lo
scorrimento, dove serve solo aderire.

**Il ciclo a fotogrammi da solo non basta.** La prima versione dell'inseguimento
usava `requestAnimationFrame`: corretto finché la finestra dipinge, inerte
quando non lo fa. Lo scorrimento va **ascoltato**, non solo campionato. I
gestori sono registrati in **cattura** sul documento dell'applicazione, perché a
scorrere non è la finestra ma i contenitori interni (`.page`, i pannelli del
Builder, il registro di esecuzione) e i loro eventi non risalgono. Il ciclo a
fotogrammi resta accanto agli eventi: copre i casi in cui la posizione cambia
senza uno scorrimento, come una pagina che finisce di disegnarsi.

Faretto e riquadro della narrazione si spostano insieme: il calcolo della
posizione del riquadro è stato estratto in `posizionaNarrazione()`, che ora
serve sia la narrazione sia l'inseguimento. Senza, i due si sarebbero separati
al primo scorrimento.

**Un difetto trovato per strada.** `disponiFaretto()` spegne il faretto quando
il bersaglio è grande quasi quanto lo schermo — illuminarlo tutto non
indicherebbe niente. Il confronto era `r.height > window.innerHeight*0.92`
senza guardia: quando la misura della finestra vale zero, perché la pagina non
è ancora dipinta, **ogni** elemento risulta più grande dello schermo e il
faretto si spegne sempre. Ora la regola si applica solo a finestra misurabile.

Verificato: bersaglio agganciato e faretto acceso su cinque passi di capitoli
diversi; scorrendo di 300px il faretto si sposta esattamente di 300px, con la
classe `.segue` attiva e quindi senza transizione.

### 5.130 Il disallineamento al cambio pagina

Dopo aver agganciato l'evidenziazione allo scorrimento manuale (§5.129),
restava un disallineamento **al cambio di passo**. Misurandolo si è visto che
non era lo stesso difetto: 200 millisecondi dopo l'inizio di un passo il
faretto era 114px fuori posto, e da mezzo secondo in poi tornava esatto.

**Il faretto restava acceso sul bersaglio precedente.** `vaiA()` cambiava
pagina, eseguiva l'azione e solo dopo riposizionava. Nel frattempo
l'evidenziazione — mai spenta — continuava a indicare le coordinate del passo
prima, che sulla schermata nuova sono un punto qualunque. Ora si spegne
**subito**, come prima riga del passo. Un istante senza evidenziazione si legge
come «sto passando ad altro»; un'evidenziazione sbagliata si legge come un
errore.

**Ci si agganciava dopo lo scorrimento, non prima.** `portaInVista()` usa uno
scorrimento morbido, che dura qualche decimo; il faretto veniva posizionato
520ms dopo, cioè spesso a scorrimento non finito, e restava lì fino al
ricontrollo. Ora ci si aggancia **prima** di scorrere: l'inseguimento
accompagna lo scorrimento fino in fondo, invece di fotografarne un fotogramma
intermedio.

**Ogni passo pagava un quarto di secondo che non serviva.**
`attendiFineEsecuzione()` controllava a intervalli di 250ms *se* un'esecuzione
fosse in corso — anche nei moltissimi passi che non eseguono niente, dove la
risposta era «no» già alla partenza. Ora la prima verifica è immediata e si
entra nel ciclo solo se c'è davvero qualcosa da attendere; l'intervallo scende
a 120ms.

**Un bersaglio staccato dal documento** — perché la schermata è stata
ridisegnata — restituisce un rettangolo tutto a zero. Seguirlo porterebbe il
faretto nell'angolo in alto a sinistra: ora l'inseguimento lo ignora e resta
dov'era, lasciando che sia il ricontrollo del passo a riagganciare.

Misurato prima e dopo, sullo stesso passo:

| Istante | Prima | Dopo |
|---|---|---|
| 60 ms | evidenziazione del passo precedente | spenta |
| 200-260 ms | 114px fuori posto | 0px |
| 660 ms | 0px | 0px |

Scarto nullo anche a regime su cinque passi di capitoli diversi.

### 5.131 I nodi generati dalla chat non erano quelli della palette

Segnalazione, con due schermate a confronto: un «Approvazione Umana» generato
dalla chat e un «Approvazione umana» trascinato dalla palette. Stesso nome a
occhio, prodotti diversi. Il primo aveva l'icona ✅, la descrizione scritta dal
modello e **nessun campo di configurazione**; il secondo l'icona ✋, la
descrizione canonica e il blocco completo — chi deve approvare, messaggio
all'approvatore, scadenza attesa.

**Perché succedeva.** `nodoConfigIniziale(type,name)` riconosce controlli,
connettori e trigger **dal nome**, confrontandolo con le definizioni in
`guardrails.js`, `CONNECTOR_CONFIGS` e simili. Il confronto è esatto. Il piano
proposto dal modello portava nome, icona e descrizione a modo suo: bastava una
maiuscola di differenza perché il nodo non venisse riconosciuto e nascesse
senza i propri campi.

Questo è il caso peggiore di tutta la famiglia: non un errore visibile, ma un
nodo che **sembra** un presidio e non lo è. Un flusso con dentro
un'approvazione finta supera l'ispezione a occhio e non ferma niente.

**Come è stato chiuso.** `ccAllineaPiano()` riconduce ogni nodo proposto alla
voce di palette che gli corrisponde, prima che l'anteprima venga mostrata —
così quello che si conferma è esattamente quello che si ottiene. Il
riconoscimento procede in due passi: prima il nome normalizzato (minuscole,
accenti e punteggiatura tolti), poi, **solo fra i nodi dello stesso tipo**, una
corrispondenza per contenimento, accettata unicamente se identifica una sola
voce. Un nome inventato resta com'è: il modello può proporre un nodo generico,
e forzarlo dentro una voce a caso sarebbe peggio.

Da quel momento il nodo prende tipo, nome, icona e descrizione dalla palette.
**La configurazione proposta dal modello non viene toccata**: è lì che sta la
specificità del caso — chi approva, quale soglia — ed è l'unico posto in cui ha
senso.

**Un secondo difetto nello stesso punto.** `ccApplyCreate()` scriveva
`node.config = Object.assign({model:'auto',temperature:0.7}, n.config)`:
**sostituiva** la configurazione iniziale del nodo partendo dai valori di un
nodo AI, qualunque fosse il tipo. Un controllo perdeva così i propri campi e ne
guadagnava due che non gli appartengono. Ora la configurazione proposta si
somma a quella iniziale invece di rimpiazzarla.

Verificato a confronto diretto: creato lo stesso controllo dalla palette e
dalla chat con nome storpiato e icona sbagliata, i due nodi risultano identici
in nome, icona, descrizione e campi di configurazione, e il valore proposto dal
modello per «chi approva» viene conservato.

La demo ha un passo in più che mostra la cosa dal vivo: seleziona un controllo
appena generato e ne apre i campi.

### 5.132 Vale per tutti i nodi, e il buco che restava sotto

Domanda legittima dopo §5.131: l'allineamento vale solo per i controlli o per
tutta la palette? Verificato per costruzione, non per impressione: per ognuna
delle **81 voci di palette** il nome è stato storpiato (maiuscole, accenti
tolti) e fatto passare dal riconoscimento, poi il nodo risultante è stato
confrontato con quello creato direttamente dalla voce di palette.

| Tipo | Voci | Riconosciute | Nodi identici |
|---|---|---|---|
| Trigger | 7 | 7 | 7 |
| AI | 9 | 9 | 9 |
| Azioni | 39 | 39 | 39 |
| Condizioni | 8 | 8 | 8 |
| Output | 8 | 8 | 8 |
| Controlli | 9 | 9 | 9 |
| Sotto-agente | 1 | 1 | 1 |

Il confronto riguarda tipo, nome, icona, descrizione e **chiavi della
configurazione**: nessuna differenza su nessuna delle 81.

**Il buco sotto.** Provando cosa succede a un nodo il cui nome NON corrisponde
a niente — il caso che l'allineamento lascia passare di proposito, perché il
modello può proporre un blocco generico — è emerso che la convalida del flusso
lo accettava **senza dire niente**. La ragione è meccanica: la convalida
controlla i campi obbligatori *della definizione*, e un nome sconosciuto non ha
definizione, quindi non ha campi obbligatori, quindi non ha errori. Un'azione
inventata passava il controllo, si pubblicava, e all'esecuzione non faceva
quello che il nome prometteva.

La convalida ora segnala i nodi il cui nome non corrisponde a nessuna voce di
palette, limitatamente ai tipi la cui **identità sta nel nome**: azioni,
trigger e controlli. È da quel nome che l'applicazione risale ai loro
parametri.

**Condizioni e nodi AI restano fuori, ed è deliberato.** Il nome di una
condizione è l'etichetta del test — «Punteggio >= 70?», «Convalida ok?» — e va
scritta da chi costruisce; quello di un nodo AI descrive il compito. Per
entrambi il comportamento sta nella configurazione, non nell'etichetta.
Includerli avrebbe segnalato come errore la cosa giusta: i cinque flussi di
riferimento, che rinominano tutte le proprie condizioni, risultavano
improvvisamente tutti difettosi. Se ne è accorta la prova di regressione, non
il ragionamento.

Verificato dopo la correzione: cinque flussi di riferimento su cinque senza
segnalazioni spurie; un'azione inventata e un controllo inventato segnalati;
una condizione rinominata non segnalata.

### 5.133 Segnalare tre volte lo stesso problema

La convalida introdotta in §5.132 ha prodotto subito il proprio difetto di
presentazione: con tre azioni non riconosciute, il riquadro mostrava tre punti
elenco con dentro la **stessa frase di due righe**, ripetuta identica. L'unica
cosa che cambiava — il nome del blocco — era la prima parola di un paragrafo
che il lettore, alla seconda ripetizione, smetteva di leggere.

I nodi vanno elencati tutti, perché sono tutti da sistemare. È la
**spiegazione** che va detta una volta.

Il messaggio dell'errore è stato accorciato a ciò che cambia davvero —
*«Crea Denuncia» non corrisponde a un'azione della palette* — e la parte comune
si è spostata dove appartiene, insieme a un campo `kind` che dichiara la
famiglia dell'errore. Da lì le due schermate che mostrano gli errori la
compongono ciascuna a modo proprio:

- il **riquadro della chat** raccoglie gli errori della stessa famiglia sotto
  un'intestazione che li conta, trasforma i nomi in pastiglie **cliccabili che
  portano al nodo**, e scrive il perché una volta sola in fondo al gruppo;
- la **finestra di convalida** tiene l'elenco riga per riga — lì serve la
  precisione — e aggiunge un riquadro con la spiegazione condivisa sotto
  l'elenco.

`kind` è un'aggiunta piccola con una conseguenza utile: raggruppare non
richiede di riconoscere le famiglie leggendo il testo dei messaggi, che è il
genere di espediente che si rompe alla prima riformulazione.

Verificato: tre azioni non riconosciute producono un gruppo, tre pastiglie con
i tre nomi e **una** spiegazione; cliccando una pastiglia si viene portati sul
nodo giusto.

### 5.134 Blocchi inventati: dirlo prima, non dopo

Segnalazione: la chat genera nodi come «Allega file mail» che poi mandano il
flusso in errore. È il rovescio della convalida di §5.132 — ora il difetto si
vede, ma si vede **tardi**, dopo aver applicato.

Il caso è istruttivo. «Allega file mail» non è una richiesta assurda: allegare
un file a una email è una cosa che si vuole fare. Sbagliato è il modo — nella
palette non è un blocco, è un **campo** del blocco «Invia email». Il modello
non trovando un blocco con quel nome se lo inventa, ed è il comportamento che
ci si deve aspettare da un generatore quando l'elenco non gli basta.

Tre difese, in ordine di quanto sono affidabili.

**Nel prompt** — la meno affidabile, ma gratuita. Alle istruzioni è stata
aggiunta una regola esplicita sul caso osservato: se una capacità non ha un
blocco dedicato — un allegato, una copia, un formato — non se ne crea uno
nuovo, si usa il blocco esistente più vicino e la si mette nella sua
configurazione. Un modello che segue le istruzioni non sbaglia più; su questo
non si può però costruire una garanzia.

**Nell'anteprima** — dove la garanzia sta davvero. Un nodo di tipo azione,
trigger o controllo che non corrisponde a nessuna voce viene marcato
`fuoriPalette`, e l'anteprima lo dichiara **prima** dei pulsanti Applica e
Annulla: quanti sono, quali sono, perché il flusso non partirà, e il consiglio
di annullare e richiedere usando il nome del blocco.

Non vengono scartati d'ufficio. Scartare significherebbe decidere al posto di
chi guarda, e quel nodo rappresenta comunque un'intenzione: chi vuole applicare
lo stesso — magari per sistemare a mano — deve poterlo fare. Ciò che non deve
succedere è **applicare senza saperlo**.

**Nella convalida** — l'ultima rete, già descritta in §5.132, per i casi che
arrivano da un'altra strada (un flusso importato, un nodo rinominato a mano).

Verificato con un piano che contiene «Allega file mail» accanto a nodi validi:
i nodi riconoscibili vengono allineati alla palette («Approvazione Umana» →
«Approvazione umana» ✋), il solo blocco inventato compare nell'avviso, e
l'avviso sta sopra i pulsanti di conferma.

### 5.135 Salvare non è eseguire

La convalida sbarrava cinque strade allo stesso modo: esecuzione, salvataggio,
export JSON, export Python e pubblicazione. Trattare il salvataggio come
l'esecuzione ha una conseguenza pratica sgradevole: **il lavoro a metà non si
può mettere via**. Chi costruisce un flusso in due sedute deve o finirlo o
perderlo, e finisce per costruire tutto in una volta sola per paura di non
poter salvare — che è l'opposto di quello che serve a uno strumento di
composizione.

Ora le cinque strade sono divise per **cosa producono**:

| Azione | Con problemi aperti | Perché |
|---|---|---|
| Salva | **passa**, dicendo quanti punti restano | mette via lavoro proprio |
| Esporta JSON | **passa**, dicendo quanti punti restano | idem, su file |
| Esporta Python | **passa** | idem: uno script incompleto è ciò che serve a chi continua altrove |
| Esegui | **sbarrato** | un flusso rotto non produce un risultato, produce un errore |
| Pubblica | **sbarrato** | è l'unica azione rivolta ad altri |

I nodi con problemi restano **segnati sulla tela** anche dopo il salvataggio:
`markInvalidNodes()` viene chiamata comunque, e solo un flusso pulito azzera le
marcature. Il messaggio di conferma dichiara il numero dei punti aperti — un
salvataggio silenzioso su un flusso rotto farebbe credere che sia pronto.

La finestra di convalida non dice più *«risolvi prima di eseguire, salvare,
esportare o pubblicare»*: dice che il flusso si salva e si esporta comunque, e
che i punti vanno risolti prima di eseguirlo o pubblicarlo. Un messaggio che
elenca divieti inesistenti insegna a non fidarsi degli altri che elenca.

**Sulla pubblicazione la scelta è deliberata.** È l'unica delle cinque che porta
il flusso davanti ad altre persone, e l'intero impianto descritto nel capitolo —
sette controlli automatici, poi un revisore — poggia sul fatto che ciò che entra
nel catalogo sia stato verificato. Toglierle lo sbarramento avrebbe reso falsa
quella descrizione.

Verificato su un flusso con un blocco non riconosciuto: salvataggio riuscito
(agente scritto nel database, avviso «1 punto da sistemare»), export JSON
riuscito con lo stesso avviso, export Python riuscito, esecuzione sbarrata,
pubblicazione sbarrata.

### 5.136 Allegati veri sul nodo email

Il nodo «Invia email» sapeva allegare soltanto i file **prodotti dal flusso**
durante l'esecuzione (`attach: Sì`, che raccoglie `LAST_RUN_FILES`). Utile per
un report generato al momento, inutile per un listino, un modulo o delle
condizioni contrattuali: documenti sempre uguali, che si scelgono una volta e
partono a ogni invio.

Si aggiungono ora **allegati fissi**, da due sorgenti:

- **dal computer**, con una vera selezione di file: il contenuto viene letto e
  conservato in base64 dentro la configurazione del nodo;
- **dalla Knowledge Base**, scegliendo un documento già caricato: è già nel
  database, non passa dal disco.

Le due sorgenti convivono con i file del flusso: al momento dell'invio il nodo
concatena le due liste, e i fissi partono anche quando l'esecuzione non ha
generato niente.

**Il prezzo, e perché lo si paga.** I file vivono dentro la configurazione del
nodo, quindi dentro l'agente salvato. È l'unico posto possibile in un prodotto
interamente client-side — non c'è un server dove depositarli — ma un agente che
si porta dietro dieci megabyte rallenta salvataggio, esportazione e
importazione. Da qui il tetto di **2 MB complessivi**, dichiarato nel pannello
insieme al motivo, e il peso mostrato accanto a ogni allegato.

Sulla coerenza con la chat: il campo `attach` è già nel catalogo che il modello
riceve, quindi una richiesta come «allega il file» si traduce in una proprietà
del nodo email esistente invece che in un blocco inventato — che era
esattamente il caso «Allega file mail» di §5.134.

### 5.137 Tre flussi di esempio, e cosa dimostrano

In `esempi/` ci sono tre flussi completi da importare, più articolati dei
cinque precaricati. Non sono illustrazioni: sono stati **importati, convalidati
ed eseguiti** prima di essere consegnati.

| Flusso | Nodi | Meccanismi |
|---|---|---|
| Onboarding fornitore | 10 | webhook con campi dichiarati, mascheramento, diramazione su soglia, approvazione umana, generazione PDF, email con allegati |
| Rassegna settimanale | 10 | ciclo su un elenco prodotto dal modello, verifica di fondatezza, salvataggio in Knowledge Base, doppia distribuzione |
| Ticket di assistenza | 12 | difesa da istruzioni ostili, mascheramento, classificazione, instradamento su due rami che si ricongiungono |

Convalida: **tutti e tre senza errori**. Esecuzione senza chiave API: la
rassegna completa in 24 passi, il ticket in 10, l'onboarding **si ferma sulla
convalida dell'output** — e va bene così.

La differenza fra i due comportamenti non è tecnica ma di processo, ed è
dichiarata nel nodo: l'onboarding ha «Convalida output» su *Blocca il flusso*,
perché un dossier costruito su dati illeggibili non deve uscire; il ticket l'ha
su *Segnala e prosegui*, perché una richiesta di assistenza non si butta via
perché il classificatore era incerto. Lo stesso controllo, due decisioni
diverse, entrambe scritte dove si vedono.

### 5.138 Gli altri nodi: verificati, nessuna modifica

Rastrellamento su tutte le 81 voci per trovarne altre nella condizione del nodo
email — una capacità mancante che porta a inventare blocchi. Per ciascuna si è
verificato che esista una definizione di configurazione con almeno un campo.

Cinque risultavano senza campi: `Condition`, `Fine`, `Esito positivo`,
`Esito negativo`, `Chiamata agente`. Aprendole nel pannello, tre sono
**terminali** e non hanno niente da configurare per costruzione, mentre
`Condition` e `Chiamata agente` hanno un pannello **dedicato** — il campo della
condizione la prima, il selettore dell'agente da invocare la seconda — che non
passa dal meccanismo generico dei campi.

Nessun nodo richiede modifiche. È il tipo di verifica che vale soprattutto
quando non trova niente: senza, «gli altri nodi vanno bene» sarebbe stata
un'impressione.

### 5.139 «Allega i file generati dal flusso»: quali, esattamente

Attivare l'opzione non basta: qualcuno, a monte, deve produrre quei file. Se
non c'è, l'email parte senza allegati e nessuno lo dice — chi la riceve trova
un messaggio che ne annuncia uno.

La prima correzione è stata un errore di convalida che sbarrava l'esecuzione.
Sbagliata, e per una ragione precisa: **la richiesta è legittima**. Chi attiva
quell'opzione sta dicendo «voglio allegare qualcosa», e la risposta giusta a una
richiesta legittima non è un divieto, è permettere di completarla.

Il pannello del nodo email mostra ora, sotto l'opzione:

- **se a monte ci sono blocchi che producono file**, l'elenco di ciò che verrà
  allegato, con il nome del file che ciascuno genererà. Le pastiglie portano al
  nodo che lo produce, perché è lì che si cambia il nome;
- **se non ce n'è nessuno**, un menu dei formati (PDF, Markdown, CSV, JSON,
  HTML, Testo) e un pulsante che inserisce un «Esporta file» **subito prima**
  dell'invio, lo configura con un nome derivato dall'oggetto dell'email e lo
  ricollega intercettando gli archi entranti.

Il flusso resta valido a ogni passaggio: il nodo nuovo si inserisce sull'arco,
non accanto. Verificato: da `Webhook → LLM Prompt → Invia email → Fine` si
ottiene `Webhook → LLM Prompt → Esporta file → Invia email → Fine`, con
l'export configurato su PDF e nome `allegato-riassunto-riunione`, convalida
senza errori, e il pannello che passa da «Nessun file da allegare» a
«Verranno allegati · 1».

Sul confine, per onestà: la chat può **attivare** l'opzione e **aggiungere** un
«Esporta file», perché sono entrambe cose che vivono nel flusso. Non può
allegare un file dal tuo disco: quella resta un'azione umana, e il pannello è
l'unico posto in cui si fa.

### 5.140 La fila di Esegui e Interrompi

I due pulsanti stavano in una riga flessibile: Esegui elastico, Interrompi
fisso a 116px. Larghezze diverse fra loro e diverse da tutte le file sotto, che
sono griglie a due colonne uguali. Ora la fila usa la stessa griglia, quindi i
due pulsanti hanno la stessa larghezza e si allineano con quelli che seguono.
Restano alti 36px invece di 32: sono le due azioni che si premono davvero.

### 5.141 Allegati multipli sui post, e schede che si allineano

**Fino a cinque allegati per post.** Un post ne portava uno. Ma chi racconta un
flusso porta il JSON dell'agente, un CSV di prova e uno schema: tre cose che si
spiegano insieme e che, una alla volta, costringevano a tre post o a una scelta.

Il modello nuovo è `p.allegati`, un elenco. I campi `attach_name/mime/data`
**restano allineati al primo**: sono letti in una decina di punti — la scheda,
il dettaglio, il visore delle immagini, l'esportazione della Knowledge Base — e
riscriverli tutti per un cambiamento di forma sarebbe stato il modo più costoso
di introdurre un difetto. Chi legge il campo singolo continua a funzionare; chi
vuole l'elenco chiama `allegatiDiPost()`, che ricostruisce la lista anche dai
post vecchi.

La persistenza aggiunge una colonna `allegati_json`; al ricaricamento, se manca,
l'elenco si ricostruisce dal campo singolo. Nessun post scritto prima perde il
proprio file.

Scheda e dettaglio disegnano gli allegati con **la stessa funzione**
(`allegatiHTMLPost`): erano due blocchi quasi uguali, ed erano già divergenti su
un dettaglio — `object-fit` diverso fra i due. Una funzione sola non può
divergere da sé stessa.

Il visore raccoglie ora **tutte le immagini di tutti i post**, non una per post:
un racconto con tre schemi li ha tutti e tre, e si scorrono in fila.

**Le schede degli agenti installati.** La fila di comandi era elastica sul
contenuto: «Apri nel Builder» andava a capo su alcune schede e no su altre, le
larghezze non tornavano fra loro e le schede avevano altezze diverse. Ora la
fila è una griglia `1fr 1fr auto`, le etichette non vanno a capo, la scheda è
una colonna flex con la descrizione elastica: quattro schede affiancate
misurano tutte 162px di altezza e 129/129/34 di larghezza dei pulsanti.

**Le date erano di due formati.** `relTimeIt()` passava alla data assoluta dopo
trenta giorni: in una fila si leggeva «29 giorni fa» accanto a «06/08/2026».
Ora la scala relativa arriva a mesi e anni, e la fila si legge come una fila.

### 5.142 L'etichetta sulla freccia si può finalmente scrivere

Domanda arrivata guardando una tela: perché quella freccia ha scritto
«allegato», e si può metterne una altrove?

La ricognizione ha trovato che l'etichetta compariva in **tre soli casi**, tutti
imposti dal codice:

1. i due rami di una condizione, etichettati `Sì` e `No` alla creazione;
2. l'arco che collega l'«Esporta file» inserito automaticamente al nodo email,
   etichettato `allegato` (§5.139);
3. quello che dichiara un JSON importato o un piano proposto dalla chat.

Il campo `label` era quindi **nel modello, disegnato sulla tela, esportato e
reimportato — e non scrivibile**. Selezionando una connessione il pannello
offriva «Da», «A» ed «Elimina»: si poteva vedere un'etichetta e non toccarla,
che è il modo peggiore di avere un campo.

Ora il pannello della connessione ha il campo **Etichetta sulla freccia**, con
un limite di 24 caratteri. Serve a dire *perché* si prende quella strada — o
semplicemente a lasciarsi un promemoria su una tela grande, che è la ragione
per cui è stato chiesto.

Un dettaglio di comportamento: la scrittura aggiorna la tela ma **non ridisegna
il pannello**. Ridisegnarlo a ogni tasto farebbe perdere il fuoco dopo la prima
lettera — difetto piccolo e infuriante, del tipo che si nota solo provando a
scrivere davvero.

Verificato: etichetta scritta, comparsa sulla freccia, sopravvissuta a
esportazione e reimportazione.

### 5.143 Il flusso tornava senza nome

Segnalazione: un flusso salvato, chiudendo e riaprendo l'applicazione, torna
sulla tela con tutti i suoi nodi ma si chiama «Workflow Builder» e dichiara
«non ancora salvato». Come ricominciare da zero, tranne che il lavoro c'è.

Due difetti sovrapposti, entrambi nella copia di lavoro tenuta in
`localStorage`.

**La copia conteneva solo la geometria.** Veniva scritta come
`{nodes, edges, nextId}`: al ritorno i nodi c'erano, il **nome** e il legame
con la riga del database no. `currentAgentName` ripartiva dal suo valore
iniziale e `B.dbAgentId` restava nullo — da cui «non ancora salvato», e da cui
`B.effimero=true`, che marca la tela come non-lavoro. Il flusso salvato era nel
database, intatto, ma niente sulla tela lo diceva.

**La copia si scriveva in un punto solo: dopo un'esecuzione.** Chi costruiva
senza mai premere Esegui, riaprendo, trovava una tela vecchia o vuota. Ora la
scrittura è agganciata al salvataggio automatico, quindi segue le modifiche;
la funzione è una sola (`salvaCopiaDiLavoro`) e vive accanto all'autosalvataggio
che la tiene aggiornata.

**Il legame con la riga si verifica prima di accettarlo.** `localStorage` è per
**origine**, non per utente: la copia scritta da uno resta lì quando entra un
altro. Senza controllo, il Builder di Giulia avrebbe puntato alla riga di
Mario, e il primo salvataggio automatico gliel'avrebbe sovrascritta — un difetto
silenzioso e distruttivo. Il legame si accetta solo se la riga **esiste ancora**
ed è **di chi sta usando l'applicazione adesso**; altrimenti i nodi restano
sulla tela come bozza, con il loro nome, ma senza legame da sovrascrivere.

Verificato: salvato «Riassunto riunioni e invio mail», ricaricata la pagina —
titolo, nodi e stato «salvato» tornano, `dbAgentId` è quello giusto. Entrando
come un'altra persona con la stessa copia di lavoro, i nodi restano ma il
legame è nullo e la riga altrui non viene toccata.

### 5.144 La tela appartiene a chi la sta usando

Seguito di §5.143. Conservare nome e legame nella copia di lavoro non bastava:
la copia era **una sola per browser**. Uscendo come Mario ed entrando come
Giulia, sulla tela restavano i nodi di Mario — non solo disordine, ma il lavoro
di una persona mostrato a un'altra, nello stesso posto in cui si preme Salva.

La chiave è ora **per utente** (`relaition_builder__<nome>`): chi entra ritrova
la propria tela dove l'aveva lasciata, e chi entra per la prima volta parte
pulito. Il controllo di proprietà sulla riga del database resta, come seconda
rete.

**Il cambio di utente non passa da `initBuilder()`**, che gira una volta sola
per sessione: senza un intervento esplicito il canvas restava quello di prima
anche con la chiave giusta. `ricaricaTelaPerUtente()`, chiamata da
`applicaUtente()`, azzera lo stato e ricarica la copia dell'utente entrante.

**Un secondo travaso, trovato controllando.** `challengeRegistered` è una mappa
in memoria delle iscrizioni alle sfide. `loadPersistedContent()` la ripopolava
per l'utente entrante **senza svuotarla prima**: chi entrava dopo Mario
ereditava le sue sei iscrizioni. Il resto della pagina legge dal database e non
se ne accorgeva — ma un difetto che dipende da quale schermata si guarda è
peggio di uno visibile sempre.

Verificato passando fra i quattro profili: lezioni completate, quiz superati,
esperienza, iscrizioni alle sfide, candidature, badge e livello sono **tutti
diversi per utente**, e la tela segue chi entra.

| | Mario | Giulia | Marco | Sara |
|---|---|---|---|---|
| Lezioni | 15 | 0 | 0 | 0 |
| Quiz | 11 | 0 | 0 | 0 |
| XP | 735 | 300 | 75 | 260 |
| Iscrizioni a sfide | 6 | 0 | 0 | 0 |
| Candidature | 1 | 3 | 2 | 2 |
| Badge ottenuti | 8 | 4 | 3 | 3 |

Ciclo completo: Mario costruisce due nodi → entra Giulia, tela **vuota** e zero
iscrizioni in memoria → torna Mario, **ritrova i suoi due nodi** con il nome.

### 5.145 Il registro non taglia più il testo alla fonte

Nel registro di esecuzione le voci lunghe finivano con «…»: l'output di un
nodo AI si leggeva per i primi ottanta caratteri e basta. La segnalazione
dell'utente chiedeva di poter espandere la singola riga.

Guardando dove avveniva il taglio, il problema non era grafico. In
`js/agent-runtime.js` cinque punti scrivevano `String(x).substring(0,80)+'…'`
**prima** di consegnare il messaggio: il testo intero non arrivava nemmeno al
registro, quindi non c'era niente da espandere — e non si recuperava nemmeno
esportando il log. L'accorciamento è una scelta di presentazione, e stava nel
motore.

Il taglio è stato spostato dove appartiene:

- nel motore resta solo un tetto di sicurezza, `REGISTRO_TETTO = 4000`
  caratteri applicato da `rtTesto()`, perché una pipeline da centomila
  caratteri dentro il DOM rallenta il pannello. Quando interviene lo dichiara
  nel testo stesso (`[…troncato a 4000 caratteri]`), invece di far sparire il
  resto in silenzio;
- nel Builder, `addExecEntry()` mette il messaggio in `.exec-msg`, che sta su
  una riga sola con ellissi. Se il testo senza tag supera gli ~85 caratteri o
  contiene un a capo, accanto compare una freccia: `apriRigaRegistro()`
  aggiunge `.aperta` alla voce e il testo si mostra intero, a capo compresi, in
  un riquadro a larghezza fissa.

Due dettagli non scontati. La freccia si decide sulla lunghezza del testo, non
misurando `scrollWidth`: quando la voce arriva il pannello del registro può
essere chiuso, e una misura fatta a larghezza zero direbbe sempre «non serve».
E il clic sulla freccia chiama `event.stopPropagation()`, perché la riga ha già
un suo clic — `vaiAlNodoDalRegistro()` — e lo stesso gesto non può significare
due cose diverse.

Verifica in browser: riga lunga alta 25 px da chiusa, freccia presente; aperta
mostra tutti i 703 caratteri del messaggio; riga corta senza freccia. Cache
`relaition-v88`.

### 5.146 Il capitolo delle Sfide raccontava la vetrina, non i gesti

La dimostrazione dedicava a Sfide ed Eventi tre passi: l'elenco, l'apertura di
una sfida, i criteri di valutazione. Tutto vero, ma tutto *da guardare*. Le
cose che il capitolo 4.3 chiede — iscriversi, candidare un proprio agente,
essere misurati sulle esecuzioni reali, votare, portare una domanda a un AMA —
restavano descritte a parole e mai compiute. Chi guardava la registrazione
vedeva una bacheca ben fatta.

Sei passi nuovi, tutti che *fanno* qualcosa:

| Passo | Cosa compie davvero |
|---|---|
| Tre formati | distingue hackathon, sfide misurate ed eventi (Workshop, AMA, Demo Day) contando le schede, non elencandole a memoria |
| Le fasi | mostra `sfBloccoFasi` e il fatto che le date sono relative al giorno in cui si guarda |
| Mi iscrivo | clicca «Iscriviti»: il conteggio dei posti sale di uno e il nome compare fra gli iscritti |
| Candido un agente | apre la finestra di candidatura, sceglie l'agente e scrive la nota per la giuria |
| Il punteggio | conferma la candidatura e mostra la classifica con il punteggio calcolato accanto al voto della community |
| Le domande | pubblica una domanda su un AMA, dove l'ordinamento è per voti |

Tre dettagli che rendono i passi affidabili invece che decorativi:

- la sfida su cui si candida non è scelta a mano ma da `sfidaDaCandidare()`, che
  prende la prima sfida **misurata dove chi presenta non si è ancora
  candidato**: così il pulsante dice «Candida» e non «Modifica la candidatura».
  La scelta è memorizzata, perché due passi che parlassero di due sfide diverse
  racconterebbero una storia sconnessa;
- i testi si calcolano dopo l'azione — «i posti occupati sono 48 su 80», «la mia
  candidatura è entrata con 74 punti» — quindi la narrazione dice quello che è
  successo, non quello che ci si aspettava;
- nulla resta appiccicato: la fotografia dello stato fatta all'avvio (§5.99)
  copre `challenges_registered`, `challenge_submissions`, `challenge_questions`
  e `xp_log`, quindi iscrizione, candidatura e domanda spariscono alla fine e la
  demo successiva riparte identica.

Verificato passo per passo nel browser: iscrizione 47 → 48 posti, candidatura
salvata su «finanza senza errori» con Mario primo in classifica a 74 punti,
domande dell'AMA da 4 a 5, e ripristino che riporta tutto com'era.

Nel farlo è saltato fuori un difetto vero della piattaforma, non della demo: il
dettaglio del punteggio scriveva «1 controlli» e «1 esecuzioni». Ora passa da
`sfPlur()`. È il genere di sciatteria che fa dubitare anche del numero che ha
accanto. Cache `relaition-v89`.

### 5.147 Il giro completo, e i sovrapposti che restavano aperti

Tre cose in un colpo solo: la dimostrazione copriva le pagine ma non i **gesti**
di Learning Hub e Community, non mostrava mai la piattaforma vista da un'altra
persona, e — difetto segnalato guardandola — una finestra aperta da un passo
restava sopra la schermata del passo successivo.

**I sovrapposti.** La chiusura era scritta a mano dentro le azioni di alcuni
passi: bastava saltare da indice, o aggiungere un passo dimenticandosene, e la
finestra restava lì. È stata spostata dove il problema nasce davvero, cioè in
due punti:

- in `go()` (`js/router.js`): cambiando pagina si chiudono la finestra modale e
  il pannello delle notifiche. Non è una toppa per la demo — vale per il menu,
  l'indirizzo, il tasto Indietro. L'ordine usato ovunque nel codice è già
  `go()` prima di `openModal()`, quindi nessun percorso legittimo si rompe;
- nel motore della demo: `chiudiFinestre()` all'inizio di **ogni** passo, con
  due eccezioni che il passo dichiara da sé — chi illumina `#modalContent` sta
  parlando proprio della finestra, e chi dichiara `tieniAperto` ci lavora
  dentro (compila un modulo aperto prima, preme Invia, poi chiude).

**La sincronia.** Il faretto veniva riagganciato 620 millisecondi dopo uno
scorrimento, misura scelta a occhio: se lo scorrimento finiva prima restava
indietro. Ora si aspetta `scrollend`, con la scadenza come rete di sicurezza per
i browser che non lo emettono. E quando il bersaglio era stato trovato come
elemento — «il pulsante che contiene Installa» — un ridisegno dell'applicazione
lo staccava dal documento e il faretto restava acceso sul posto sbagliato: ora
si prova a ritrovarlo con la stessa regola del passo, e solo se non si trova si
resta fermi. La transizione del salto scende da 0,4 a 0,26 secondi.

**Il giro completo.** Undici passi nuovi: nel Learning Hub si **risponde al
quiz** (la risposta giusta si ricava dal contenuto della lezione, non da un
indice scritto nel copione: se il quiz cambia, la demo continua a rispondere
bene) e si mostra l'esercizio pratico; in Community si **scrive e pubblica** un
post, si mette «mi piace» al post di un altro e si risponde in una discussione.

**Il capitolo 10** esce e rientra come Giulia: dashboard, profilo, badge, sfide
e formazione con i suoi numeri. Perché reggesse serviva una cosa in più —
`assicuraAccesso()` rientrava sempre con il primo account, quindi un capitolo
che parla di Giulia si sarebbe riaperto come Mario: ora c'è un utente atteso,
che quel capitolo imposta.

Verificato in browser: quiz corretto con esperienza da 675 a 700, post da 25 a
26, iscrizione 47 → 48 posti, candidatura salvata, accesso come Giulia con 4
agenti, 15 esecuzioni, 300 XP e 4 badge su 12, finestra chiusa al cambio
pagina, capitolo 7 ancora funzionante grazie a `tieniAperto`.

Nel farlo è emerso un difetto dei dati, non della demo: le candidature di
Giulia, Marco e Sara esistevano senza la relativa iscrizione, perché la
migrazione che ha introdotto la separazione per utente aveva attribuito tutte le
iscrizioni preesistenti a Mario. In classifica comparivano quindi persone che
risultavano non iscritte. Si ricostruiscono da ciò che hanno candidato — che è
un fatto, e la regola che la piattaforma applica già quando si candida — con una
migrazione in più in `js/db.js`. Cache `relaition-v90`.

### 5.148 Sandbox davvero didattica, aiuto alla scrittura, pulizia tipografica

Quattro interventi dell'ultimo giro, in ordine di peso.

**La sandbox non lasciava salvare: falso.** Prometteva «nulla viene salvato»,
ma la promessa era mantenuta solo dall'autosalvataggio. I pulsanti Salva,
Pubblica e Pianifica funzionavano come sempre, e un flusso di prova poteva
finire in «I miei agenti» o in coda di revisione. Un banco di prova dove si può
pubblicare non è un banco di prova. Ora le tre azioni passano da
`sandboxBlocca()` (`js/tour.js`), che spiega e rifiuta; i pulsanti si vedono
spenti mentre la sandbox è attiva, così il limite si scopre prima del clic.
Esporta e Python restano liberi: producono un file per chi impara e non
toccano niente. E se cambia la persona con la sandbox aperta, `applicaUtente()`
la chiude prima: altrimenti la chiusura successiva rimetteva sulla tela il
canvas di chi c'era prima e l'autosalvataggio lo scriveva sopra la copia di
lavoro di chi c'è adesso.

**Aiuto alla scrittura** (`js/aiuto-testo.js`). Sotto il prompt di un nodo AI,
sotto il contesto del flusso e sotto ogni area di testo dei nodi (il corpo di
un'email, un messaggio) c'è «Aiutami a scriverlo»: si dice a parole cosa si
vuole ottenere, e il modello collegato scrive il testo o migliora quello che
c'è. Il modello sa dove sta scrivendo: nome e tipo del nodo, contesto del
flusso, campi disponibili dai nodi a monte. Il risultato entra nel campo e
nella configurazione; il precedente si può ripristinare. Senza un modello
collegato non si finge: si dice dove collegarlo. Verificato in browser fino a
quel messaggio; la generazione vera richiede una chiave, che resta dell'utente.

**A capo dove serve.** La chat del Builder è un'area di testo che cresce con il
contenuto (Invio genera, Maiusc+Invio va a capo); l'etichetta di una freccia
accetta fino a tre righe e sulla tela si disegna con un `tspan` per riga. Nel
farlo: il prompt del nodo AI e l'etichetta finivano nell'HTML e nell'SVG senza
`escHtml`. Ora ci passano.

**Ingresso alla sandbox.** Il collegamento alla sandbox didattica nel Learning
Hub era sottolineato in piccolo sotto il giro guidato: ora è un pulsante con il
proprio colore, accanto alla guida. (Un pulsante «Impara» nella barra in alto,
provato per un giro, è stato tolto: la richiesta era rendere visibile la
sandbox, non il Learning Hub.)

**Pulizia tipografica.** Nei testi visibili (lezioni, recensioni, post, sfide,
narrazione della demo, etichette) i trattini lunghi sono stati sostituiti con
la punteggiatura che intendevano — due punti dopo un termine in grassetto,
virgola in un inciso — e i titoli (h2, h3, titoli di scheda e di sezione,
riquadri «da ricordare») non iniziano più con un'emoji: le icone restano dove
hanno un significato, cioè su palette, nodi, pulsanti e badge. I commenti nel
codice non sono stati toccati. Cache `relaition-v91`.

### 5.149 Identità visiva dal foglio di brand, e il tema scuro

**Il marchio.** Il foglio di identità è arrivato come immagine: non c'era un
file da ritagliare. Il segno («AI» dentro un triangolo arrotondato fatto di tre
petali semitrasparenti dal blu al viola) è stato ricostruito in vettoriale
(`brand/mark.svg`), l'icona dell'app lo mette su quadrato scuro arrotondato
come nel foglio (`icon.svg`), e i due PNG per il manifest sono renderizzati
dal vettoriale con Edge senza interfaccia. Il wordmark «Rel[AI]tion» e il
claim *Learn / Build / Share / Grow* sono HTML e CSS, non immagini: il testo
usa il font dell'applicazione e segue il tema. Compaiono nella schermata di
accesso, in quella di avvio, nel menu laterale e nello splash della demo.
`brand/LEGGIMI.md` spiega cosa sostituire se arriva il sorgente del designer.

**Il tema scuro.** L'interfaccia leggeva già tutti i colori dalle variabili
CSS, quindi il tema scuro è una sola regola (`html[data-theme="dark"]`) che le
ridefinisce, più sei eccezioni puntuali per i pannelli con un gradiente
proprio (hero del Marketplace e del Learning Hub, pannello AI, connettori,
aiuto alla scrittura). La scelta sta in `localStorage` e viene applicata da
uno script in testa a `index.html`, prima del primo disegno: messo dopo, la
pagina comparirebbe chiara e diventerebbe scura un istante dopo. Il
predefinito resta chiaro e non si segue la preferenza di sistema: gli
screenshot e la dimostrazione devono venire uguali su ogni macchina.

Due limiti dichiarati: i riquadri di avviso con colore proprio (ambra, rosso)
restano chiari anche nel tema scuro, di proposito, perché un segnale deve
restare riconoscibile; e i colori scritti in linea nei template JavaScript
(circa sedici sfondi ambra, otto rossi) non passano dalle variabili, quindi
nel tema scuro sono isole chiare leggibili ma non armonizzate. Verificato in
browser su dashboard, Builder, Marketplace e Learning Hub. Cache
`relaition-v92`.

### 5.150 Asset ufficiali del marchio, tema scuro completato, sandbox senza tracce

**Il marchio, quello vero.** Sono arrivati i tre file ufficiali (logo per sfondo
chiaro, logo per sfondo scuro, icona dell'app), e la ricostruzione vettoriale
del §5.149 è stata messa da parte. Due cose non ovvie, scoperte lavorandoci: il
logo per sfondo scuro ha lo sfondo blu **dipinto dentro** (non è trasparente),
e nel logo chiaro le lettere «AI» dentro il segno sono un **foro**, non pixel
bianchi: su fondo chiaro si leggono, su fondo scuro sparirebbero. Il logo scuro
usato dall'app è quindi ricavato dal chiaro con uno script (`brand/
prepara-logo-scuro.ps1`): lettere blu notte rese bianche, foro riempito di
bianco, alfa conservato. Il segno del menu è un ritaglio di quello. L'icona
installabile usa l'app icon ufficiale, in due forme: così com'è (`any`) e su
quadrato pieno con margine (`maskable`), perché Android ritaglia la forma e con
gli angoli trasparenti avrebbe messo il suo sfondo. `brand/LEGGIMI.md` elenca
cosa viene da cosa.

**Tema scuro, seconda passata.** La prima copriva le variabili; restavano i
riquadri con una tinta scritta a mano, nel foglio di stile o in linea: la
finestra «Workflow non valido» aveva le voci rosa con il testo chiaro del tema
sopra, illeggibili. Ora c'è un blocco che intercetta le tinte pastello dallo
stile in linea (`[style*="background:#FEF3C7"]` e simili) e le porta alla
tinta scura con il testo alzato di tono, più le classi con tinta propria
(`warning-box`, `validation-item`, badge, stati delle connessioni, quiz). Il
toast, scuro con testo bianco, nel tema scuro si inverte. È un rimedio
dichiarato: la lista di quei selettori è la lista dei riquadri a cui manca una
classe. Verifica automatica su tutte e dieci le pagine: nessun testo con
contrasto insufficiente sul proprio sfondo, tolti i contenitori di emoji, il
cui colore non conta.

**Sandbox: confermato, con un'eccezione trovata.** Prova con conteggio delle
tabelle prima e dopo: agenti, installazioni, Knowledge Base, pubblicazioni,
esperienza e copia di lavoro tornano identici. L'unica riga che sfuggiva era
l'**esecuzione**: eseguire nella sandbox scriveva nello storico, e da lì nel
Monitoraggio. `recordExecution()` ora non scrive con la sandbox attiva; il
registro dentro il Builder resta, perché è ciò che chi impara sta guardando.
Cache `relaition-v96`.

### 5.151 Icona piccola, logo sfocato, animazioni a scatti

Tre segnalazioni dopo l'arrivo degli asset ufficiali, tutte vere.

**L'icona installata era più piccola delle altre.** L'app icon ufficiale ha un
margine trasparente attorno al quadrato arrotondato: 164 pixel di contenuto su
210. Windows e Android riscalano il file intero, margine compreso, quindi
l'icona usciva al 78%. `brand/prepara-icone.ps1` ora ritaglia al contenuto e
da lì produce le due forme del manifest (`any` a tutto campo, `maskable` con
l'8% di margine sul blu dell'icona). L'icona già installata resta quella
vecchia finché non si disinstalla e reinstalla: i sistemi la congelano
all'installazione.

**Il logo di accesso sembrava sfocato e fuori centro.** Due cause. Attorno
alle lettere il logo chiaro ha un alone grigio semitrasparente (antialiasing
verso il bianco) che, reso bianco per il fondo scuro, si vedeva come una
sfumatura sporca: sotto una certa opacità ora si azzera. E il file portava con
sé un margine trasparente asimmetrico, per cui «centrato» non lo era: si
ritaglia al contenuto (907×303) e si centra con i margini automatici. Tolto
anche il `backdrop-filter` della scheda di accesso, invisibile su un gradiente
piatto e costoso.

**Le finestre si aprivano a scatti.** Non era JavaScript (aprire una finestra
costa 0,1 ms): erano tre cose che il browser ridisegnava di continuo. Il
marchio nel menu pulsava con un `filter: drop-shadow` animato all'infinito, su
ogni pagina, sempre; le intestazioni di Marketplace e Learning Hub facevano
scorrere un gradiente a tutta larghezza per dodici secondi e poi da capo; e la
finestra modale sfocava tutto lo sfondo con `backdrop-filter: blur`, cioè
rifiltrava l'intera pagina a ogni apertura. Tolte tutte e tre: la pulsazione
resta solo sulla schermata di avvio, che dura un secondo, e come opacità; il
gradiente è fermo; la modale scurisce lo sfondo senza sfocarlo. Verifica:
`document.getAnimations()` a regime non contiene più animazioni infinite
(prima due). Cache `relaition-v97`.

### 5.152 «Le finestre si aprono lente»: cosa era e cosa no

Segnalazione dopo il §5.151. Misure prima di toccare: il ricalcolo degli stili
con i selettori `[style*=…]` del tema scuro costa 0,02 ms su 1 125 elementi
(sospettati, scagionati); aprire una finestra costa 0,1 ms di JavaScript;
nessuna animazione infinita a regime. Restavano due cose, entrambe di
percezione più che di carico:

- la curva di apertura delle finestre aveva una sovraelongazione (1,4): la
  finestra arrivava e poi «si assestava», e quel rimbalzo di un quarto di
  secondo si legge come lentezza. Ora 160 ms, curva senza rimbalzo;
- le transizioni generiche (`--trans`) erano di 200 ms: portate a 140, e il
  cambio pagina da 220 a 150.

E una cosa che non si poteva sapere: se il browser stesse ancora servendo una
versione precedente. Il numero della cache in esecuzione ora compare in fondo
al menu, chiesto al service worker che sta servendo la pagina (non
un'etichetta scritta a mano, che resta indietro): se la segnalazione dice
«v96», la causa è già nota. Cache `relaition-v98`.
