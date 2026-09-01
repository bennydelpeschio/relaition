# RelAItion — Copione della dimostrazione (20 minuti)

Sequenza pensata per una presentazione dal vivo. Ogni passaggio indica cosa
fare, cosa dire e **cosa si vede sullo schermo**: se quello che compare non
corrisponde, qualcosa non ha funzionato e conviene accorgersene subito.

---

## Prima di iniziare (5 minuti, fuori dai 20)

### Preparazione obbligatoria

1. **Servire la cartella** invece di aprire il file. Da terminale, dentro
   `relaition-mvp/`:

   ```
   python -m http.server 8099
   ```

   Poi aprire `http://localhost:8099`. Serve per mostrare l'installazione come
   applicazione; il resto funziona anche col doppio click sul file.

2. **Collegare un modello.** Nel Builder, pannello *Integrazione AI* a
   sinistra: scegliere un fornitore, incollare la chiave, premere **Testa**.
   Attendere il segno verde.

   > ⚠️ **Senza questo passaggio metà della dimostrazione non parte**, ed è
   > voluto: i flussi con nodi AI vengono bloccati con un errore esplicito.
   > Se si vuole mostrare *anche* quel comportamento, farlo prima di collegare.

3. ~~Caricare documenti nella Knowledge Base~~ — **non serve più**: sei
   documenti sono già caricati e indicizzati al primo avvio.

### Preparazione consigliata

Nessuna: lo storico di esecuzioni è già presente, con esiti misti (riuscite,
fallite, interrotta, in attesa) perché Log e Monitoraggio abbiano cosa mostrare.

---

## Capitolo 1 — Costruire (0:00 → 4:00)

### 1.1 Il giro guidato, se il pubblico non conosce nulla

**Learning Hub → «Fai il giro guidato».**

Dodici passaggi sulle schermate vere: costruisce un flusso, lo esegue, mostra
dove si controlla cosa è successo. Al termine il canvas torna com'era.

> Da usare **solo** se restano 20 minuti pieni: occupa circa 3 minuti. Con
> pubblico tecnico saltarlo e andare al 1.2.

### 1.2 Costruire trascinando

**Builder → trascinare dalla palette:** `Webhook` → `Analisi lead` (AI) →
`Score > 70?` (condizione) → `Slack` → `Output`.

**Cosa dire:** dieci categorie, 79 componenti. La categoria che conta è
**Controlli**: è quella che separa un giocattolo da uno strumento aziendale.

**Cosa si vede:** i nodi si collegano trascinando dai pallini; la freccia si
seleziona con un click e si cancella con Canc.

### 1.3 Costruire parlando

**Barra chat in alto:** *«Quando arriva un reclamo via email, classificalo per
gravità e apri un ticket, avvisando il team se è grave»*.

**Cosa si vede:** compare **prima** un riepilogo — *«Ho interpretato così…»* —
con l'elenco dei nodi che verranno creati e i pulsanti Applica / Annulla.
**Nulla tocca il canvas finché non si conferma.**

**Cosa dire:** su un flusso già presente la stessa barra applica *modifiche
chirurgiche*: il riquadro dichiara quanti nodi restano intatti con la loro
configurazione. Non ricostruisce da capo.

> ⏱️ Con Gemini l'attesa è di ~30 secondi (il modello ragiona prima di
> rispondere). Riempirla parlando dei suggerimenti sotto la barra.

### 1.4 Selezione multipla

Trascinare sul canvas vuoto: compare il riquadro di selezione. `Ctrl+C` /
`Ctrl+V` duplicano mantenendo anche le connessioni interne.

---

## Capitolo 2 — Il presidio (4:00 → 8:00)

### 2.1 La validazione blocca, non avverte

**Cancellare il nodo Output** e premere **Esegui**.

**Cosa si vede:**
> *Il ramo che termina su «Slack» non si chiude con un nodo di output:
> aggiungine uno per registrare l'esito.*

**Cosa dire:** un flusso che non registra l'esito non lascia traccia di cosa ha
fatto. La validazione impedisce l'esecuzione, non la accompagna con un avviso.

### 2.2 Il controllo sul modello

Se si vuole mostrarlo: nel nodo AI scegliere un fornitore **diverso** da quello
collegato.

**Cosa si vede:**
> *«Analisi lead» è impostato su OpenAI, che non è connesso. Collega quel
> provider oppure scegline un altro già configurato (Gemini).*

**Cosa dire:** senza questo controllo il flusso girava lo stesso, producendo
testo `[Demo]` che sembrava una risposta vera.

### 2.3 Aggiungere i controlli

Trascinare **Mascheramento dati** prima del nodo AI e **Convalida output**
dopo. Premere **🔍 Verifica**.

**Cosa dire:** i suggerimenti sono basati sul rischio — la validazione guarda
*cosa il flusso tratta davvero*, non quali nodi contiene.

---

## Capitolo 3 — Conoscenza aziendale (8:00 → 12:00)

### 3.1 Come vengono segmentati i documenti

**Icona 📦 → aprire un documento caricato → scheda «Porzioni».**

**Cosa si vede:** il documento diviso per **articolo**, non ogni N caratteri,
con la contestualizzazione di ciascuna porzione.

**Cosa dire:** un contratto tagliato a lunghezza fissa produce frammenti che,
letti da soli, non significano nulla — e l'agente risponde male senza che
nessuno capisca perché. Qui la tipologia è riconosciuta dal contenuto e ogni
tipo usa la propria unità.

### 3.2 Provare il recupero prima di fidarsi

**Stessa schermata, riquadro «Prova il recupero»:** porre una domanda sul
contenuto del documento.

**Cosa si vede:** le porzioni recuperate con **punteggio, BM25 e coseno**, e
quante sono state escluse dal filtro permessi.

**Cosa dire:** il filtro permessi agisce **prima** del calcolo del punteggio.
Non nasconde risultati: le porzioni non autorizzate non entrano mai fra i
candidati, quindi non possono raggiungere il modello.

### 3.3 Il RAG nel flusso

Nel nodo AI attivare **📚 Usa Knowledge Base**, poi **Esegui**.

**Cosa si vede nel registro:**
```
📚 Knowledge Base: 2 porzioni su 15 candidate (TF-IDF + BM25 locale)
  ↳ "policy-resi.txt" — Art. 2 Penale · punteggio 0.63
  ↳ "policy-resi.txt" — Art. 1 Recesso · punteggio 0.41
```

**Cosa dire:** documento e punteggio di ogni porzione usata. Non è
diagnostica: è il requisito di trasparenza.

---

## Capitolo 4 — Eseguire e capire (12:00 → 16:00)

### 4.1 L'esecuzione si vede

**Esegui.** I nodi si illuminano uno alla volta.

**Cosa dire (importante):** i tempi che si vedono sui nodi simulati sono un
ritardo **dichiarato**, introdotto per rendere leggibile la dimostrazione. Non
è la latenza di un'integrazione reale.

### 4.2 Interrompere davvero

Rilanciare e premere **⏹️ Interrompi** mentre gira.

**Cosa si vede:**
```
⏹️ Esecuzione interrotta dall'utente — chiamate in corso annullate
⏹️ ═══ Esecuzione interrotta — 2 nodi completati ═══
```

**Cosa dire:** tronca anche una chiamata di rete già partita, non aspetta il
nodo successivo. L'esito viene registrato come `aborted`, distinto sia da `ok`
sia da `err`: interrompere non è fallire.

### 4.3 Perché questo risultato — il momento centrale

In fondo al registro: **🔍 Perché questo risultato?**

**Cosa si vede:** sette sezioni — fonti che hanno pesato con i punteggi;
decisioni con il valore su cui sono state prese e chi le ha valutate; cosa
**non** è stato eseguito e perché; strumenti scelti dal modello; controlli
intervenuti e cosa hanno cambiato.

**Il dettaglio da far notare:** nella riga della ricerca in Knowledge Base
l'email compare **già mascherata** (`[EMAIL_1]`). Significa che il controllo ha
agito prima del recupero. Nessun registro riga-per-riga lo rendeva evidente.

**Chiudere leggendo l'ultima riga del pannello:**
> *Spiega il percorso seguito e i dati usati; non spiega il funzionamento
> interno del modello linguistico, che resta opaco.*

**Cosa dire:** molta «AI spiegabile» promette la seconda cosa e consegna la
prima. Qui la distinzione è scritta nel prodotto.

---

## Capitolo 5 — Pubblicare e governare (16:00 → 20:00)

### 5.1 I controlli di pubblicazione

**Builder → Pubblica.** Scegliere ambito **Organizzazione**.

**Cosa si vede:** i controlli girano mentre si compila il modulo. Se il flusso
contiene una chiave o un indirizzo interno:
```
⛔ Assenza di credenziali ed endpoint interni
   "HTTP Request" → campo "url" punta a un endpoint interno
   "HTTP Request" → campo "api_key" contiene un valore che sembra una credenziale
```
Il pulsante resta **⛔ Risolvi i controlli bloccanti**.

**Cosa dire:** l'ambito determina chi approva e quali controlli sono bloccanti.
Pubblicare per il proprio gruppo non richiede le stesse garanzie di un catalogo
aperto a tutta l'azienda.

### 5.2 La vista del revisore

**Marketplace → 🛡️ Revisiona pubblicazioni.**

**Cosa si vede:** struttura del flusso, esito dei controlli, e per gli
aggiornamenti il **confronto con la versione in uso**:
```
🔀 Confronto con la versione in uso (1.0)
+ Slack
~ configurazione modificata: Mascheramento dati
```
E il pulsante **↻ Esegui la non regressione**, che rigioca le esecuzioni
tracciate con la nuova definizione e mostra le divergenze.

### 5.3 Il monitoraggio

**Menu → 📡 Monitoraggio.**

**Cosa si vede, in cima:** non i numeri, ma **cosa richiede un'azione**, con il
pulsante che lo chiude.

**Le due metriche da commentare:**
- **Copertura dei controlli** — dice se la governance è applicata o solo
  disponibile nella palette.
- **Recuperi a vuoto** — nodi con Knowledge Base attiva che hanno risposto
  senza fonti: risposte non fondate che *sembrano* fondate.

**Chiudere leggendo il riquadro finale:** cosa il cruscotto **non** può dire —
niente utenti da anagrafica, niente costi per token. *Meglio che manchi
piuttosto che sia stimato.*

---

## Se qualcosa va storto

| Sintomo | Causa | Rimedio in diretta |
|---|---|---|
| «Nessun modello collegato» all'Esegui | chiave non testata | Pannello AI → Testa. È il comportamento voluto: usarlo come dimostrazione del blocco |
| La chat non genera nulla | errore del fornitore | Il pannello mostra il messaggio testuale (credito esaurito, chiave rifiutata, modello ritirato): leggerlo ad alta voce |
| La generazione impiega 30 s | modello che ragiona | Previsto. Riempire parlando dei suggerimenti |
| Il recupero KB non trova nulla | documenti non indicizzati | 📦 → «indicizza i mancanti» |
| «Installa app» non compare | pagina aperta da `file://` | Servire la cartella (vedi preparazione) |

---

## Cosa non mostrare

- **Non promettere il Microsoft Store.** È un'applicazione web installabile;
  il pacchetto MSIX non esiste.
- **Non presentare i tempi di esecuzione come reali.** Sono un ritardo
  dichiarato per la leggibilità.
- **Non chiamare «semantica» la ricerca in Knowledge Base senza aggiungere che
  usa TF-IDF**, non embedding neurali.
- **Non aprire PDF o DOCX** nella Knowledge Base: vengono rifiutati per scelta.

---

## Nota sullo stato

Il **Blocco F è implementato**: al primo avvio l'applicazione crea da sola i
cinque flussi di riferimento, sei documenti nella Knowledge Base, uno storico
di undici esecuzioni con esiti misti e una richiesta di pubblicazione in coda.

Il seme gira **una sola volta** e mai sopra dati esistenti: chi riapre
l'applicazione ritrova il proprio lavoro.

Due comandi utili fra una prova e l'altra, dalla console del browser:

```
ricaricaDatiDemo()   // ricrea i dati dimostrativi da capo
rimuoviDatiDemo()    // li toglie, lasciando i tuoi agenti
```
