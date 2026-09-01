# RelAItion — AI Agent Marketplace (MVP)

Piattaforma no-code per costruire, eseguire, pubblicare e portare con sé workflow di
agenti AI. Questo documento è la guida di riferimento del progetto: architettura,
come lavorarci, come estenderlo e come presentarlo.

---

## 1. Architettura

Il progetto è **statico, senza build tool**: HTML/CSS/JS puro, apribile da qualunque
server statico (o direttamente da file system per test rapidi). Nessuna dipendenza
npm da installare — scelta deliberata per restare un MVP semplice da mantenere e
documentare da soli.

```
relaition-mvp/
  index.html              markup di tutte le pagine + modali (nessun contenuto è generato server-side)
  lib/sqljs/               sql.js (SQLite compilato in WebAssembly) — motore del database, gira nel browser
  css/
    base.css               reset, variabili CSS (:root), layout (.app/.sidebar/.main/.topbar)
    components.css         card, badge, tab, modali, bottoni
    marketplace.css        hero, filtri e card del marketplace
    builder.css             canvas, nodi, porte, pannello proprietà, log esecuzione
    pages.css               stili specifici di dashboard/learning/community/profilo/ecc.
  js/
    state.js                stato globale (currentPage, B = stato del builder, aiConfig, ecc.)
    db.js                    database SQLite in-browser (sql.js): schema, query, persistenza su IndexedDB, export/import .sqlite
    storage.js                salvataggio/caricamento agenti, log, knowledge base — legge/scrive sul database via db.js
    router.js                  go(page): switch tra le pagine via classi CSS
    ai-client.js                client AI agnostico (Claude/OpenAI/Gemini/endpoint custom)
    builder.js                  motore del builder: nodi, edge, canvas, validazione, export codice
    marketplace.js               catalogo agenti, pubblicazione community
    pages.js                     dashboard, learning hub, community, profilo, ecc.
    modals.js                    helper generici per modali/toast/notifiche
    main.js                      inizializza il database, poi i listener globali — caricato per ultimo
```

### Il database (sql.js / SQLite via WebAssembly)

Tutti i dati "a righe" della piattaforma (agenti salvati, log esecuzioni, agenti
pubblicati/installati, documenti caricati, post/commenti community, avanzamento
Learning Hub, XP) vivono in un **vero database SQLite**, eseguito interamente nel
browser via WebAssembly (libreria [sql.js](https://sql.js.org)) — non c'è un server
di mezzo, coerente con la scelta "zero dipendenze" del progetto.

- **Funziona anche aprendo `index.html` come file locale** (doppio click, senza
  server): il binario `.wasm` del motore SQLite è incluso pre-codificato in
  base64 in `lib/sqljs/sql-wasm-inline.js` e decodificato in memoria, quindi
  non serve una `fetch()` di rete che il browser bloccherebbe sotto `file://`.
- **Schema**: definito in `js/db.js` (`SCHEMA`), una tabella per tipo di dato
  (`agents`, `exec_log`, `published_agents`, `my_agents`, `kb_docs`, `forum_posts`,
  `forum_comments`, `learn_progress`, `quiz_done`, `challenges_registered`, `xp_log`).
- **Persistenza**: sql.js tiene il database in memoria; ad ogni scrittura
  (`dbRun`) viene esportato come blob binario e salvato in **IndexedDB** (più
  adatto di localStorage per dati binari), così sopravvive ai refresh e alla
  chiusura del browser.
- **Migrazione automatica**: se nel browser esistono ancora dati della versione
  precedente (basata su localStorage), `migrateFromLocalStorageOnce()` li importa
  nel database al primo avvio — nessun lavoro perso.
- **Perché non solo localStorage**: la vecchia versione salvava "gli agenti
  salvati" in un'unica chiave condivisa — salvarne uno sovrascriveva
  silenziosamente il contenuto completo (nodi/archi) di quelli precedenti. Con
  una riga per agente nella tabella `agents`, il problema è risolto alla radice.
- **Backup e portabilità**: dal pulsante 🗄️ nella topbar, `exportDatabaseFile()`
  scarica il database come file `.sqlite` — apribile con qualunque client SQLite
  standard (es. DB Browser for SQLite), indipendente da RelAItion: è la forma più
  portabile di backup offerta dalla piattaforma, oltre a JSON e Markdown.

I file JS sono caricati come `<script>` classici (nessun bundler, nessun modulo ES):
condividono lo stesso scope globale, quindi **l'ordine di caricamento in `index.html`
conta** — rispetta l'ordine già impostato se aggiungi nuovi file.

### Perché questa struttura e non un framework

Con un solo sviluppatore e l'obiettivo di un MVP da presentare, un framework
(React/Vite/ecc.) avrebbe aggiunto una toolchain da installare, configurare e
documentare senza benefici immediati. Questa struttura:
- è **versionabile con git in modo pulito** (ogni modulo è un file piccolo, i diff
  restano leggibili);
- si esegue con un qualunque server statico, es. `python -m http.server 8080` dentro
  `relaition-mvp/`, oppure l'estensione VS Code "Live Server";
- si spiega in una pagina di documentazione (questa).

Se in futuro il progetto crescerà oltre il POC (più sviluppatori, componenti
riutilizzabili complessi, test automatici estesi), il passo successivo naturale è
migrare a Vite + moduli ES, mantenendo la stessa suddivisione logica dei file.

### Come avviarlo

```bash
cd relaition-mvp
python -m http.server 8080
# apri http://localhost:8080
```

Qualsiasi altro server statico va bene (`npx serve`, estensione Live Server, ecc.).
Non serve build, non servono variabili d'ambiente per l'avvio: le eventuali API key
AI si inseriscono da interfaccia (vedi sezione 3).

---

## 2. Il Builder: come funziona e come si estende

### Modello dati

Lo stato del workflow vive nell'oggetto globale `B` (`js/state.js`):

```js
B = {
  nodes: [{id, type, icon, name, detail, x, y, config}],
  edges: [{from, fp /*from-port*/, to, tp /*to-port*/, label}],
  ...
}
```

- `type` è uno tra `tr` (trigger), `ai`, `ac` (action/connector), `cd` (logica /
  condizione), `ou` (output).
- I nodi condizione (`cd` con nome `Condition`) hanno due porte in uscita, `true` e
  `false`; tutti gli altri hanno `in`/`out`.

### Sistema di configurazione dichiarativo (già flessibile)

Ogni tipo di nodo espone i propri campi tramite un oggetto dichiarativo — **non
serve scrivere HTML custom per aggiungere un campo o un connettore**:

- `CONNECTOR_CONFIGS` (`js/builder.js`) — un connettore per ogni sistema esterno
  (Slack, Salesforce, PostgreSQL, HTTP Request, ecc.), ciascuno con `fields: [...]`
  e una funzione `sim()` che genera l'output simulato per la demo.
- `TRIGGER_CONFIGS` — stessa logica per i trigger (Webhook, Scheduler, ecc.).
- `LOGIC_CONFIGS` — stessa logica per i nodi di logica (Loop, Delay, Switch, ecc.).

`renderConfigFields()` trasforma la lista `fields` in input/textarea/select in modo
automatico. **Per aggiungere un nuovo connettore basta un nuovo oggetto**, es.:

```js
CONNECTOR_CONFIGS['Zendesk'] = {
  fields: [
    {k:'subdomain', l:'Subdomain', ph:'azienda'},
    {k:'action', l:'Azione', ph:'create ticket', opts:['create ticket','update ticket']}
  ],
  sim: function(c){ return '🎫 Zendesk: ticket creato su '+(c.subdomain||'subdomain') }
};
```

e aggiungere una riga al `PALETTE` array con `{cat:'action', type:'ac', icon:'🎫',
name:'Zendesk', desc:'Ticketing'}`. Nessun'altra modifica è necessaria: proprietà,
validazione (vedi sotto) ed export codice lo raccolgono automaticamente dal primo
campo definito.

Per un connettore non previsto, il nodo generico **HTTP Request** copre qualunque
integrazione REST via URL/metodo/headers custom — è il modo per restare "agnostici"
senza dover creare un connettore dedicato per ogni servizio.

### Validazione del workflow

Prima di **Esegui / Salva / Esporta JSON / Genera codice / Pubblica**, il builder
esegue `validateWorkflow()` (`js/builder.js`) che controlla:

- presenza di almeno un nodo Trigger;
- nessun nodo orfano (senza connessione in ingresso, tranne i trigger);
- nessun "vicolo cieco" su nodi trigger/AI/condizione (devono avere un'uscita — i
  nodi azione/output possono legittimamente essere terminali);
- nodi Condition con entrambi i rami (Sì/No) collegati;
- nodi AI con un modello selezionato;
- connettori con il campo obbligatorio principale compilato;
- edge che puntano a nodi inesistenti (edge orfani).

Se la validazione fallisce, l'azione viene bloccata, i nodi incriminati vengono
evidenziati in rosso sul canvas (badge "!") e si apre un pannello con l'elenco dei
problemi, cliccabile per saltare al nodo incriminato (`showValidationErrors()` /
`jumpToNode()`).

**Per aggiungere una nuova regola di validazione**: aggiungi un controllo dentro
`validateWorkflow()`, pushando `{nodeId, msg}` in `errors`. Non serve toccare altro:
l'hook è già collegato a tutte le azioni critiche.

Quando **Esegui** viene bloccato da un workflow non valido, il blocco non resta solo
nel pop-up: viene scritto anche nel pannello di esecuzione (`addExecEntry`) e nello
storico permanente (`relaition_execlog`, visibile nella pagina Log Esecuzioni), così
resta tracciabile anche dopo aver chiuso il modale.

### Modificare/eliminare le connessioni

Una freccia puó essere eliminata in quattro modi equivalenti: tasto **Canc/Backspace**
dopo averla selezionata, **doppio click** sulla freccia, click sul **✕ rosso** che
appare sulla freccia selezionata, oppure dal **pulsante "Elimina connessione"** nel
pannello proprietà a destra (compare automaticamente quando selezioni una connessione
con un singolo click).

---

## 2bis. AI Chat Builder — tre modalità distinte

La chat del builder distingue automaticamente cosa vuole fare l'utente, in base allo
stato del canvas al momento dell'invio (`js/ai-client.js`, `aiGenerateWorkflow()`):

1. **Creazione da zero** — canvas vuoto: l'AI genera un workflow completo nuovo.
2. **Modifica dell'intero workflow** — canvas con nodi, nessun nodo selezionato:
   l'AI riceve il workflow attuale e restituisce la versione aggiornata (aggiunta di
   nodi, rimozione, ecc.). Scrivendo frasi come "da zero" o "ricomincia" si forza
   comunque la modalità creazione, anche a canvas pieno.
3. **Modifica di un singolo componente** — un nodo è selezionato sul canvas: la
   richiesta viene instradata a `aiModifySingleNode()`, che aggiorna **solo quel
   nodo** (nome, descrizione, config) lasciando intatti tutti gli altri nodi e le
   connessioni. Il banner sopra la chat indica sempre la modalità attiva.

Senza API key configurata, entrambe le modalità di modifica hanno un fallback
euristico (parole chiave / aggiornamento diretto della descrizione) così il builder
resta utilizzabile anche in modalità demo.

---

## 3. Integrazione modelli AI — linee guida (piattaforma agnostica)

L'obiettivo è che l'utente possa collegare **qualsiasi modello**: Claude, GPT,
Gemini via API key, oppure un modello locale/self-hosted (Ollama, LM Studio, vLLM,
Azure OpenAI, ecc.) via endpoint compatibile OpenAI.

### Come è oggi (client-side, va bene per una demo/POC)

`js/ai-client.js` espone `callAI(prompt, systemPrompt, config)` che instrada la
chiamata in base a `aiConfig.provider`:

| Provider | Endpoint | Note |
|---|---|---|
| `claude` | `api.anthropic.com/v1/messages` | richiede header `anthropic-dangerous-direct-browser-access` per funzionare da browser |
| `openai` | `api.openai.com/v1/chat/completions` | **blocca le richieste dirette da browser (CORS)** — vedi sotto |
| `gemini` | `generativelanguage.googleapis.com` | funziona da browser |
| `custom` | `aiConfig.customUrl + '/chat/completions'` | qualunque endpoint **OpenAI-compatible**: Ollama (`http://localhost:11434/v1`), LM Studio, vLLM, Azure OpenAI, OpenRouter, ecc. |

Questo è ciò che rende la piattaforma "agnostica": il nodo AI nel builder non è
legato a un provider — l'utente sceglie il modello nel pannello proprietà del nodo
(`config.model`) e la mappatura al provider reale avviene in un unico punto
(`callAI`).

⚠️ **Limite noto**: le chiamate partono dal browser con la chiave inserita
dall'utente, visibile in chiaro nel traffico di rete e in `localStorage`. Accettabile
per una demo locale/monoutente, **non adatto a un ambiente multi-utente o di
produzione**. La UI mostra un avviso "modalità demo" per onestà verso chi testa la
piattaforma.

### Come evolverlo verso produzione (backend proxy)

Quando il progetto supererà la fase di POC, introdurre un piccolo backend proxy che:

1. riceve `{provider, model, systemPrompt, prompt, temperature}` dal frontend;
2. tiene le API key **solo lato server** (variabili d'ambiente / secret manager);
3. inoltra la chiamata al provider corretto e restituisce la risposta.

Esempio minimo (Node/Express, ~30 righe), da mettere in `server/index.js`:

```js
import express from 'express';
const app = express(); app.use(express.json());

const PROVIDERS = {
  claude: (body) => fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: body.maxtokens||1024, system: body.systemPrompt, messages: [{role:'user', content: body.prompt}] })
  }),
  openai: (body) => fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{role:'system',content:body.systemPrompt},{role:'user',content:body.prompt}] })
  }),
  // gemini, custom/ollama: stesso pattern
};

app.post('/api/ai/:provider', async (req, res) => {
  const fn = PROVIDERS[req.params.provider];
  if (!fn) return res.status(400).json({error: 'provider sconosciuto'});
  const r = await fn(req.body);
  res.status(r.status).send(await r.text());
});

app.listen(3000);
```

Sul frontend basterebbe cambiare `callAI()` per puntare a `/api/ai/:provider`
invece che direttamente ai provider — il resto della piattaforma (builder, nodi,
validazione) **non cambia**, perché il concetto di "provider agnostico" è già
isolato in un solo file.

Questo risolve anche il blocco CORS di OpenAI (oggi aggirabile solo con estensioni
browser o un proxy esterno, vedi `openConnectionGuide()` nella UI).

### Aggiungere un nuovo provider

1. In `ai-client.js`, aggiungi un branch in `callAI()` e in `testAIKey()` con
   l'endpoint del nuovo provider.
2. Aggiungi l'opzione nel `<select id="aiProvider">` in `index.html`.
3. (Opzionale) aggiungi il branch corrispondente in `buildPythonCode()`
   (`js/builder.js`) così il codice esportato userà lo stesso provider.

---

## 4. Knowledge Base portabile

Tutto ciò che l'utente crea (workflow nel builder, agenti salvati, log esecuzioni,
agenti pubblicati/installati) è già persistito in `localStorage` sotto chiavi
`relaition_*`. Il pulsante **📦 nella topbar** apre la Knowledge Base:

- **Esporta tutto**: `exportKnowledgeBase()` (`js/storage.js`) raccoglie tutte le
  chiavi in un unico file `relaition_knowledge_base_YYYY-MM-DD.json` (schema
  `relaition.kb.v1`).
- **Importa**: `importKnowledgeBase()` ripristina lo stato da un file esportato in
  precedenza, su qualunque installazione della piattaforma (anche un'altra macchina
  o un fork del progetto).

Questo è il meccanismo che garantisce all'utente di "portarsi via" il proprio
lavoro se un domani lascia la piattaforma: nessun dato è mai bloccato lato server,
perché non esiste un server — tutto è nel browser dell'utente e esportabile a
piacere.

**Nota per l'evoluzione futura**: se in produzione si introduce un backend con
account utente, lo stesso export JSON può diventare il payload di un endpoint
`POST /api/import` per migrare l'utente da locale a cloud senza perdita di dati —
lo schema (`relaition.kb.v1`) è già pensato per essere version-friendly (bump dello
schema quando cambia la struttura).

---

## 5. Codice scaricabile, eseguibile e automatizzabile

Dal builder, **Genera codice Python** (`generatePythonCode()` in `js/builder.js`)
converte il workflow visuale in uno script Python standalone (`agent.py`):

- ogni nodo diventa una funzione Python;
- i nodi AI chiamano il provider configurato (stesso pattern agnostico di
  `ai-client.js`, ma lato script: la chiave si legge da variabile d'ambiente, mai
  hardcoded);
- i nodi condizione valutano il branching chiamando il modello con un prompt
  booleano;
- i nodi azione includono i parametri configurati e un punto di integrazione
  marcato `# TODO` per collegare l'SDK/API reale del sistema esterno.

### Eseguirlo in locale

```bash
pip install requests
export ANTHROPIC_API_KEY=sk-ant-...     # o OPENAI_API_KEY / GEMINI_API_KEY / LLM_API_KEY per endpoint custom
python agent.py                          # usa dati di esempio
python agent.py input.json               # oppure passa un file di input reale
```

### Automatizzarlo — linee guida

| Scenario | Come |
|---|---|
| **Esecuzione periodica su una macchina personale** | `cron` (Linux/Mac): `0 8 * * 1-5 /usr/bin/python3 /path/agent.py >> log.txt 2>&1`; Task Scheduler su Windows con azione `python agent.py` |
| **Esecuzione su trigger esterno (webhook)** | wrappare `agent.py` in un piccolo server (Flask/FastAPI) che chiama `main()` alla ricezione della richiesta, oppure deploy come funzione serverless (AWS Lambda / Cloud Functions) |
| **Pipeline CI/CD** | GitHub Actions con uno step `run: python agent.py`, secret del provider AI salvato nei repository secrets e passato come env var |
| **Esecuzione containerizzata** | `Dockerfile` minimale (`FROM python:3.12-slim`, `pip install requests`, `CMD ["python","agent.py"]`), utile per deploy su qualunque orchestratore |

Il punto chiave: **lo script esportato non ha alcuna dipendenza dalla piattaforma
RelAItion** — nessuna chiamata torna verso il builder, nessuna licenza runtime.
L'utente lo scarica e lo esegue dove vuole, con la sola dipendenza da `requests` e
dalla propria API key.

### Limiti noti dello script generato (da comunicare in demo)

- I connettori (Slack, Salesforce, ecc.) generano solo un placeholder `# TODO`: il
  workflow visuale simula l'azione, lo script reale richiede di collegare l'SDK
  vero (intenzionale — evita di impacchettare decine di SDK non necessari
  all'utente).
- Il trigger nello script legge da file/argv invece che da un webhook reale: per un
  trigger HTTP vero va aggiunto un piccolo server (vedi tabella sopra).

---

## 6. Versionamento del progetto (git)

Essendo ora una struttura multi-file, il progetto è pronto per essere messo sotto
git. Linee guida essenziali per un solo sviluppatore:

1. **Inizializza il repo** nella cartella `relaition-mvp/` (o alla radice del
   progetto, includendo questa cartella):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: RelAItion MVP multi-file"
   ```
2. **`.gitignore`** minimale (crealo se non esiste):
   ```
   .DS_Store
   *.log
   node_modules/
   .env
   ```
   (utile fin da ora se in futuro aggiungi il backend proxy della sezione 3, per
   non versionare mai le API key).
3. **Commit atomici e frequenti**: un commit per feature/fix (es. "fix: validazione
   nodi orfani nel builder", "feat: export knowledge base"), non un unico commit
   gigante — rende possibile tornare indietro a un punto preciso durante lo
   sviluppo o la demo.
4. **Branch semplice**: per un solo sviluppatore, `main` per lo stato stabile
   (quello da mostrare in demo) + branch temporanei per feature rischiose
   (`feature/nome-cosa`), merge quando la feature è testata. Evita di lavorare a
   lungo su `main` con modifiche a metà.
5. **Tag delle versioni presentabili**: quando raggiungi uno stato stabile da
   mostrare (es. prima della presentazione), crea un tag:
   ```bash
   git tag -a v0.1-mvp -m "Versione MVP per presentazione capstone"
   ```
   così puoi sempre tornare a "la versione che ho presentato" anche se il lavoro
   continua dopo.
6. **Non versionare dati generati/personali**: `localStorage` non è un file, quindi
   non c'è rischio diretto, ma se aggiungi export automatici di knowledge base o
   log su disco, tienili fuori da git (aggiungili al `.gitignore`).

---

## 7. Stato dell'MVP e limiti noti

- Nessun backend: autenticazione, marketplace "reale" e pubblicazione multi-utente
  sono simulati in `localStorage` — coerente con un MVP dimostrativo, da sostituire
  con API reali se il progetto va oltre il POC (vedi sezione 3 per il pattern da
  seguire).
- Le integrazioni con sistemi esterni (Slack, Salesforce, ecc.) sono **simulate**
  nel builder (funzione `sim()` per ogni connettore) — l'esecuzione reale avviene
  solo per le chiamate ai modelli AI, se è stata configurata una API key valida.
- Import/export JSON e Knowledge Base non fanno validazione di schema stringente
  oltre al controllo `schema: 'relaition.kb.v1'` — sufficiente per un MVP
  monoutente, da rafforzare se diventa multi-utente.

## Avvio locale

L'app funziona anche aperta da `file://`, ma il service worker e le chiamate ai
servizi locali richiedono un'origine `http`. Per servirla:

```
powershell -ExecutionPolicy Bypass -File servi-locale.ps1
```

Poi apri <http://localhost:8099/>. La porta si cambia con `-Porta 9000`.

Servizi opzionali, ognuno con il suo launcher:

| Servizio | Serve a | Porta |
|---|---|---|
| `servizio-mail/AVVIA-SERVIZIO-MAIL.cmd` | inviare email vere via SMTP | 8787 |
| `servizio-webhook/AVVIA-RICEVITORE.cmd` | ricevere webhook e **provare le connessioni** (`/sonda`) | 8788 |

Per le prove di connessione reali (TCP verso un database, distinzione fra
blocco CORS e indirizzo errato) basta che uno dei due sia in ascolto.
