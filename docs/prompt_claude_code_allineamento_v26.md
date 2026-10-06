# Prompt Claude Code — Allineamento POC al Capitolo 3 (v26)

## Stato rilevato dal file `index.html` fornito

Già presente e da **non rifare**:
- Struttura modulare: `state.js`, `db.js`, `storage.js`, `router.js`,
  `ai-client.js`, `builder.js`, `marketplace.js`, `pages.js`, `modals.js`,
  `main.js` + CSS separati
- SQLite via `sql-wasm.js` con schermata di boot
- 9 pagine, 9 categorie di palette, 4 fornitori di inferenza con endpoint
  personalizzato
- Modali: Knowledge Base, pubblicazione, coda di revisione, contesto globale,
  deploy, guida connessione
- AI Chat Builder (generazione del flusso da descrizione in linguaggio naturale)
- Export agente, generazione script Python, onboarding guidato

Da aggiungere: guardrail come categoria, retrieval semantico reale, tool
calling, esecuzione parallela, riesecuzione, verifiche di pubblicazione,
versionamento, export wiki Markdown, pacchetto di uscita.

---

## PROMPT DA INCOLLARE IN CLAUDE CODE

Contesto: RelAItion è una piattaforma no-code/low-code per creare e orchestrare
agenti AI. Il codice attuale è modulare, usa SQLite via WebAssembly e gira
interamente nel browser. Va esteso per allinearlo alla documentazione tecnica
di progetto.

Vincoli:
- Resta client-side, nessun backend, nessun build step obbligatorio
- Non modificare i 22 agenti del catalogo, i contenuti di Learning Hub e
  Community, la struttura di navigazione, l'AI Chat Builder
- Ogni funzione deve essere dimostrabile in una demo dal vivo
- Dove qualcosa non è realizzabile client-side, implementa la versione
  dimostrativa più fedele e annotala in `ARCHITECTURE.md` sotto
  "Semplificazioni del prototipo"
- Mantieni la separazione dei moduli esistente; i nuovi moduli seguono la
  stessa convenzione

Esegui i blocchi nell'ordine A, B, G, C, D, F, E, verificando la demo dopo ciascuno.

---

### BLOCCO A — Guardrail e schema dati esteso

**A1. Estendi lo schema SQLite** con le tabelle mancanti:

```
agent_versions (id, agent_id, version, definition_json, author, created_at, note)
kb_documents  (id, name, source_type, business_unit, confidentiality, ingested_at, chunk_count)
kb_chunks     (id, doc_id, ordinal, text, context_prefix, embedding, metadata_json)
agent_memory  (agent_id, key, value, updated_at)
publications  (id, agent_id, version, requested_scope, checks_json, reviewer, decision, decided_at, notes)
policies      (id, scope, condition_json, required_guardrail, active)
execution_events (id, execution_id, seq, event_type, node_id, payload_json, ts)
```

La tabella `executions` esistente va estesa con `trace_json` e `replay_seed`.

**A2. Nuova categoria "Controlli" nella palette** (decima scheda, accanto a
Logic). Nove componenti trascinabili sul canvas come nodi ordinari:

| id | Nome | Comportamento |
|---|---|---|
| `gr_filter` | Filtro contenuti | Blocca o segnala input contenenti categorie di dato non ammesse |
| `gr_mask` | Mascheramento dati personali | Sostituisce identificatori con segnaposto; ripristino opzionale a valle |
| `gr_injection` | Difesa da istruzioni ostili | Rileva tentativi di alterare le istruzioni dell'agente dal contenuto in ingresso |
| `gr_grounding` | Verifica di fondatezza | Confronta l'output con i chunk KB recuperati, segnala affermazioni non supportate |
| `gr_schema` | Convalida output | Verifica schema, formati, intervalli attesi dal sistema di destinazione |
| `gr_confidence` | Soglia di confidenza | Devia a revisione umana sotto la soglia impostata |
| `gr_approval` | Approvazione umana | Sospende l'esecuzione in stato di attesa fino ad autorizzazione |
| `gr_ratelimit` | Limitatore frequenza e consumo | Interrompe al superamento di soglie di chiamate, unità di testo o durata |
| `gr_error` | Gestore eccezioni | Collegato alla porta errore: nuovo tentativo, percorso alternativo, notifica |

**A3. Politiche obbligatorie.** Schermata amministrativa (nuova voce nel
Profilo o pagina dedicata) dove definire regole del tipo "ogni agente che
tratta dati cliente deve includere `gr_mask` prima dei nodi AI". Quando una
politica è attiva, il componente viene inserito automaticamente nel canvas in
forma **non rimovibile**, con marcatura visiva che lo distingue dai componenti
scelti dall'utente. L'utente può configurarne i parametri, non eliminarlo.

**A4. Aggiorna il conteggio dei connettori.** Con la decima categoria il totale
cambia. Riporta in `ARCHITECTURE.md` il numero esatto per categoria: il
documento di tesi deve citare il valore reale.

---

### BLOCCO B — Runtime: tool calling, parallelismo, riesecuzione

**B1. Astrazione Agent** in un nuovo `agent-runtime.js`:

```js
{ id, systemPrompt, tools: [connectorId], memory: {}, 
  model: {provider, name, temperature, maxTokens},
  guardrails: [nodeId], canHandoffTo: [agentId],
  maxIterations, useKnowledgeBase: {enabled, businessUnit} }
```

**B2. Tool calling strutturato.** Ogni connettore della palette dichiara uno
schema JSON (nome, descrizione, parametri). Quando un nodo Action è collegato a
valle di un nodo AI, quel connettore va registrato tra gli strumenti
dell'agente e il suo schema trasmesso al modello con il function calling nativo
del fornitore. Il runtime intercetta la richiesta, applica i guardrail, esegue
(simulazione), restituisce l'esito al modello, che prosegue. Sostituisce le
attuali chiamate di simulazione post-prompt.

Nel pannello di configurazione del nodo AI: elenco con caselle di spunta degli
strumenti abilitati, e campo `maxIterations` per limitare il ciclo.

**B3. Output vincolato da schema.** Dove il fornitore lo supporta, usa la
modalità di output strutturato nativa invece di chiedere il formato nel prompt.
Dove non è supportato, ripiega su validazione con nuovo tentativo e **registra
la differenza nella traccia**.

**B4. Esecuzione parallela.** L'ordinamento topologico stabilisce le
precedenze, non la sequenzialità: avvia in parallelo i nodi privi di dipendenze
reciproche, attendi la convergenza solo ai punti di giunzione. Aggiungi un
interruttore per nodo che disattiva il parallelismo dove l'ordine conta.

**B5. Macchina a stati a sei stati** con marcatura distinta nel canvas:
inattivo, in elaborazione, completato, in errore, saltato, **in attesa**
(quest'ultimo per `gr_approval`).

**B6. Eventi di esecuzione.** Il motore emette e persiste in
`execution_events`: `execution:queued`, `node:start`, `node:complete`,
`tool:invoked`, `guardrail:triggered`, `node:waiting`, `agent:handoff`,
`node:error`, `execution:done`. La stessa sequenza alimenta canvas, traccia e
consuntivazione.

**B7. Nodo "Chiamata agente".** Nuovo tipo che invoca un altro agente
pubblicato come sotto-agente. Il pannello di tracciamento mostra il passaggio
di controllo e il ritorno.

**B8. Riesecuzione deterministica.** La traccia registra gli input esatti di
ogni chiamata verso modello o connettore. Aggiungi nel Log Esecuzioni un
pulsante "Riesegui" che ripete l'esecuzione sostituendo le chiamate reali con
gli esiti registrati. Serve a diagnosticare e alimenta B9.

**B9. Idempotenza.** Ogni chiamata verso un sistema esterno porta una chiave
derivata da identificativo di esecuzione più posizione del nodo, così che un
nuovo tentativo non duplichi l'effetto.

**B10. Riordino annulla/ripristina.** Ogni modifica strutturale del flusso
(aggiunta, spostamento, collegamento, cancellazione) va in una pila di
annullamento. Salvataggio automatico dopo intervallo di inattività.

---

### BLOCCO C — Knowledge Base con retrieval reale

**C1. Modulo `kb.js`.**
- Caricamento documenti: txt, md, e PDF se riesci con estrazione client-side
- **Segmentazione per struttura**, non a lunghezza fissa, differenziata per
  tipologia:

| Tipologia | Unità |
|---|---|
| Normativa | Articolo o comma |
| Contratti | Clausola con intestazione di sezione |
| Procedure | Passo o sotto-sezione con titolo gerarchico |
| Assistenza | Scambio domanda-risposta completo |
| Tabelle | Riga con intestazioni di colonna replicate |
| Non strutturato | Paragrafo con sovrapposizione controllata |

- **Arricchimento contestuale**: prima della vettorializzazione, ogni porzione
  riceve una breve contestualizzazione generata dal documento completo che ne
  esplicita collocazione e riferimento. Il vettore è calcolato sulla porzione
  arricchita, il testo restituito all'agente resta l'originale. Salva la
  contestualizzazione in `context_prefix`.
- **Embedding in-browser**: prova `transformers.js` con un modello piccolo
  quantizzato. Se troppo pesante per la demo, ripiega su TF-IDF locale e
  **dichiaralo nelle semplificazioni**.
- **Ricerca ibrida**: combina punteggio semantico e lessicale (BM25 o simile),
  poi riordina i primi candidati con una valutazione congiunta più accurata.
- **Filtro permessi a monte**: i chunk non autorizzati per l'utente che avvia
  l'esecuzione non entrano nell'insieme dei candidati e non raggiungono il
  modello. Non basta filtrare la visualizzazione del documento.

**C2. Schermata Knowledge Base** (estendi il modale esistente o promuovilo a
pagina): elenco documenti con provenienza, business unit, data, numero di
porzioni; caricamento; ricerca manuale di prova che mostra porzioni e
punteggio.

**C3. RAG nel Builder.** Nel pannello del nodo AI: opzione "Usa Knowledge Base"
con selezione facoltativa della business unit. Quando attiva, prima della
chiamata esegue la ricerca, inietta le porzioni con citazione della fonte, e
**mostra nel pannello di tracciamento quali porzioni sono state usate, con
nome documento e punteggio**. Questa visualizzazione non è opzionale: è il
requisito di trasparenza.

---

### BLOCCO D — Pubblicazione, validazione, portabilità

**D1. Ciclo di vita.** Sei stati: bozza, in verifica, in revisione, pubblicato,
sospeso, ritirato. Quattro ambiti di diffusione con approvatore diverso: gruppo
di lavoro (responsabile diretto), business unit (Workstream Owner),
organizzazione (+ verifica conformità), catalogo pubblico (autorizzazione
superiore).

**D2. Verifica automatica** alla richiesta di pubblicazione, con esito
strutturato che distingue **bloccante** da **segnalazione**:

| Controllo | Esito negativo |
|---|---|
| Integrità strutturale (trigger, raggiungibilità, config complete) | Bloccante |
| Guardrail obbligatori presenti per l'ambito richiesto | Bloccante |
| Assenza di credenziali ed endpoint interni nelle configurazioni | Bloccante |
| Esecuzione di prova in sandbox completata | Segnalazione |
| Documentazione minima (descrizione, prerequisiti, dati trattati) | Segnalazione |
| Sovrapposizione con agenti già pubblicati | Segnalazione, con proposta di contribuire all'esistente |
| **Non regressione** (solo per aggiornamenti): rigioca i casi di riferimento con B8 e confronta gli esiti | Segnalazione, divergenze mostrate al revisore |

**D3. Vista revisore** (estendi la coda esistente): struttura del flusso, esito
dei controlli, log dell'esecuzione di prova, **confronto con la versione in
uso**, azioni approva / richiedi modifica / rifiuta. La richiesta di modifica
riporta in bozza conservando lo scambio.

**D4. Post-pubblicazione.** Monitoraggio del tasso di fallimento, delle
valutazioni e dell'inattività; sospensione manuale o automatica sopra soglia
critica (l'agente non è più installabile, chi lo ha già adottato riceve la
segnalazione e decide); versionamento con notifica agli installatori e
ripristino di una versione precedente.

**D5. Export wiki Markdown.** Accanto a CSV e JSONL esistenti, genera uno ZIP
(JSZip) con:
- un `.md` per agente pubblicato: frontmatter YAML (tipo, id, business unit,
  conformità, versione, data), istruzioni, strumenti abilitati, guardrail
  presenti, cronologia esecuzioni in tabella
- un `.md` indice della Knowledge Base con i documenti e i metadati
- un `index.md` di navigazione con collegamenti relativi

Pulsante "Esporta Wiki (Markdown)" nel Log Esecuzioni.

**D6. Pacchetto di uscita.** Nel Profilo, un'unica azione che esporta:
definizioni agenti (JSON), script Python, documenti KB originali, porzioni con
vettori e metadati, wiki Markdown, log esecuzioni, badge. Self-service, in
qualsiasi momento, senza limitazioni. Includi nel pacchetto un `README.md` che
documenta i formati, e **dichiara esplicitamente** che i vettori sono
riutilizzabili solo con lo stesso modello di embedding, mentre le porzioni
testuali consentono la ricostruzione con qualunque altro.

---

### BLOCCO E — Estensibilità e servizio dei modelli

**E1. Matrice delle capacità per fornitore.** L'adattatore dichiara per ogni
fornitore quali capacità supporta: invocazione strumenti, output vincolato,
trasmissione incrementale, elaborazione immagini, riuso del contesto,
elaborazione in blocco. Nessuna capacità mancante deve impedire l'esecuzione:
il comportamento degrada in modo **esplicito e tracciato**, mai silenzioso. La
palette segnala i nodi non configurabili con il fornitore selezionato.

**E2. Ripiego fra fornitori.** Ogni nodo può dichiarare un modello alternativo
verso cui commutare al superamento di soglie di errore o latenza, con la
commutazione registrata nella traccia. Disattivabile sui nodi soggetti a
vincolo di residenza dei dati.

**E3. Conservazione semantica delle risposte.** Cache che confronta la
richiesta in arrivo con quelle già elaborate tramite rappresentazione
vettoriale, riutilizzando l'esito sopra una soglia di affinità. La variante a
corrispondenza esatta è inefficace sui documenti reali, che differiscono per
dettagli irrilevanti. Disattivabile per nodo.

**E4. Connettori via protocollo aperto.** Oltre ai connettori nativi, supporta
la dichiarazione di strumenti da parte di un servizio esterno auto-descrittivo:
la piattaforma ne interroga la descrizione, deriva i campi di configurazione e
lo rende disponibile in palette senza che sia stato scritto un connettore
dedicato. Nel prototipo puoi dimostrarlo con un descrittore JSON caricato
manualmente.

**E5. Isolamento del nodo di codice.** Se implementi il livello L4, esegui il
codice utente entro un runtime a bytecode isolato (WebAssembly), non in un
contesto separato del medesimo interprete. Solo input del nodo precedente,
nessun accesso a rete o file system, limiti dichiarati di memoria e tempo.

---

### BLOCCO G — Composizione conversazionale (AI Chat Builder)

L'AI Chat Builder già presente nel codice va portato da funzione accessoria a
**modalità di composizione paritaria rispetto al drag and drop**. Il capitolo
lo documenta al par. 3.3.2 come alternativa, non come accessorio.

**G1. Generazione completa ed eseguibile.** Da una descrizione in linguaggio
corrente (es. "quando arriva un lead dal sito valuta se è interessante e
avvisa il commerciale") produci un grafo già avviabile: nodi tipizzati,
collegamenti, istruzioni preimpostate sui nodi AI, connettori suggeriti sulle
azioni, condizioni configurate con soglie sensate. Non una bozza da
completare: l'utente deve poter premere Esegui subito e vedere cosa fa.

**G2. Modifica del flusso esistente.** La barra opera sul grafo già presente,
non solo su canvas vuoto. Richieste tipiche da supportare:
- "aggiungi un controllo di approvazione prima dell'invio"
- "inserisci una diramazione per i casi urgenti"
- "questo nodo deve usare la Knowledge Base"
- "sostituisci l'invio email con una notifica su messaggistica"

L'intervento conserva ciò che l'utente ha già configurato sui nodi non
interessati. È il requisito che distingue una modalità alternativa da un
semplice avviatore: senza, l'utente passa al canvas alla prima modifica e non
torna più.

**G3. Reversibilità e anteprima del cambiamento.** Ogni intervento entra nella
pila di annullamento del blocco B. Prima di consolidare, mostra un riepilogo
di cosa cambia: nodi aggiunti, rimossi, modificati, collegamenti alterati.
L'utente conferma o annulla.

**G4. Nessun artefatto speciale.** Il grafo generato deve essere
indistinguibile da uno composto a mano: stessa struttura JSON, nessun nodo di
tipo riservato, nessuna configurazione nascosta, nessun vincolo residuo che
impedisca la modifica manuale successiva. Le due modalità restano
intercambiabili in qualsiasi momento e in entrambe le direzioni.

**G5. Le politiche di controllo si applicano comunque.** Un guardrail imposto
da politica organizzativa (A3) viene inserito nel flusso generato anche se
l'utente non lo ha menzionato nella descrizione. Il presidio non può dipendere
da come è formulata la richiesta.

**G6. Suggerimenti contestuali.** Su canvas vuoto: esempi di descrizione
tratti dai casi d'uso reali delle business unit presenti a catalogo. Su canvas
popolato: completamenti pertinenti al flusso corrente, del tipo "manca la
gestione degli errori", "questo ramo non termina in un nodo di registrazione",
"il nodo AI non ha alcun controllo a valle".

**G7. Trasparenza dell'interpretazione.** Quando genera, il sistema dichiara
in forma sintetica come ha interpretato la richiesta, così che l'utente possa
riconoscere una divergenza dall'intento prima di eseguire. Il grafo visuale
assolve alla stessa funzione: è ispezionabile anche da chi non saprebbe
costruirlo.

---

### BLOCCO F — Flussi dimostrativi precaricati

Precarica cinque agenti già costruiti e salvati, non da comporre dal vivo.
Le specifiche complete sono nel file `flussi_end_to_end_builder.md`:

1. **Qualificazione contatti** — diramazione, scrittura su due sistemi
2. **Estrazione fattura** — output vincolato, convalida, sospensione per
   approvazione umana
3. **Assistenza con Knowledge Base** — recupero, citazione fonte, verifica di
   fondatezza
4. **Istruttoria sinistro** — il modello invoca autonomamente più strumenti
5. **Rapporto settimanale** — chiamata a sotto-agenti in parallelo

Precarica anche: Knowledge Base con almeno cinque documenti, una decina di
esecuzioni pregresse di cui **almeno una fallita**, e un agente in coda di
revisione.

---

### Output atteso

1. Codice funzionante, nessun errore in console, demo eseguibile
2. `ARCHITECTURE.md`: scelte architetturali, schema DB completo, elenco esatto
   dei connettori per categoria con totale, sezione "Semplificazioni del
   prototipo" che dichiara cosa è simulato
3. `DEMO.md`: script di demo in 20 minuti passo per passo
4. Non generare testo per la tesi, solo codice e documentazione tecnica

---

## Checklist di verifica (per Benito)

| # | Verifica | Par. cap. 3 |
|---|---|---|
| 1 | La palette ha la categoria Controlli con i nove componenti | 3.3.7 |
| 2 | Un guardrail imposto da politica appare non rimovibile | 3.3.7 |
| 3 | Un nodo AI decide autonomamente quale strumento invocare | 3.3.5 |
| 4 | Il canvas mostra i sei stati, incluso "in attesa" | 3.3.1 |
| 5 | Nodi indipendenti girano in parallelo | 3.3.4 |
| 6 | Esiste il nodo Chiamata agente e la traccia mostra la delega | 3.3.5 |
| 7 | La riesecuzione produce lo stesso esito dalla traccia | 3.3.4 |
| 8 | L'output vincolato usa la modalità nativa dove disponibile | 3.3.3 |
| 9 | Il conteggio connettori nel doc coincide con quello reale | 3.3.2 |
| 10 | La KB segmenta per struttura, non a lunghezza fissa | 3.6.1 |
| 11 | Le porzioni hanno arricchimento contestuale | 3.6.1 |
| 12 | La ricerca è ibrida con riordino | 3.6.2 |
| 13 | Il tracciamento mostra le porzioni KB usate, con fonte | 3.6.2 |
| 14 | I permessi filtrano il recupero, non solo la visualizzazione | 3.6.2 |
| 15 | La pubblicazione ha 4 ambiti con approvatori diversi | 3.8.1 |
| 16 | La verifica distingue bloccante da segnalazione | 3.8.2 |
| 17 | Gli aggiornamenti hanno verifica di non regressione | 3.8.2 |
| 18 | La vista revisore mostra il confronto con la versione in uso | 3.8.3 |
| 19 | Esiste la sospensione di un agente già pubblicato | 3.8.4 |
| 20 | L'export wiki produce file leggibili fuori dalla piattaforma | 3.7.2 |
| 21 | Il pacchetto di uscita è un'unica azione self-service | 3.7.3 |
| 22 | Lo stesso agente gira con fornitori diversi senza modifiche | 3.7.1 |
| 23 | Le capacità mancanti degradano in modo tracciato | 3.3.3 |
| 24 | I cinque flussi dimostrativi sono precaricati e funzionanti | 3.4 |
| 25 | La composizione per descrizione genera un flusso già eseguibile | 3.3.2 |
| 26 | La barra modifica anche un flusso esistente, non solo ne crea di nuovi | 3.3.2 |
| 27 | Il grafo generato è indistinguibile da uno composto a mano | 3.3.2 |
| 28 | I guardrail imposti da politica compaiono anche nei flussi generati | 3.3.2 |

Le voci non spuntate vanno riformulate nel capitolo come estensioni previste
dall'architettura, non lasciate come affermazioni scoperte.

## Da riportarmi

- File aggiornati e `ARCHITECTURE.md`
- Conteggio esatto dei connettori per categoria
- Checklist compilata
- **Nota**: l'AI Chat Builder presente nel codice non è ancora documentato nel
  capitolo. Confermami se resta, così aggiungo un paragrafo al 3.3 — è una
  funzione che vale la pena descrivere, poiché rappresenta un ulteriore
  abbassamento della barriera rispetto al drag and drop.
