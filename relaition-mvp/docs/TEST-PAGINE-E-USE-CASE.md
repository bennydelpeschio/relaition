# Test completo della POC, pagina per pagina + tre use case end-to-end

Due parti. La **prima** è un giro su tutte e dieci le pagine, con il risultato
atteso scritto accanto: se una riga non si verifica, quella è la cosa da
sistemare. La **seconda** sono tre casi d'uso costruiti da zero e portati fino
all'esecuzione: servono a verificare che la piattaforma non solo mostri, ma
funzioni.

**Tempo**: 25 minuti la parte 1, 30 minuti la parte 2.
**Prima di cominciare**: Ctrl+Shift+R, e in fondo al menu deve leggersi
**v131**. Tieni F12 aperto sulla Console: alla fine non devono esserci errori
rossi nuovi.

---

# PARTE 1 · Le dieci pagine

## 1 · Accesso

| Cosa fai | Cosa deve succedere |
|---|---|
| Apri la piattaforma | Schermata di accesso con logo e quattro profili |
| Clicchi la scheda «Mario R.» | Email e password si compilano da sole |
| Clicchi **«Crea un account»**, compili e confermi | Entri con il nuovo profilo, e la dashboard è **a zero**: nessun agente, nessuna esecuzione |
| Esci, clicchi **«Password dimenticata»** con quella email | Chiede la nuova password e l'accesso funziona con quella |
| Premi **Accedi** | Entri sulla Dashboard, in alto a sinistra «Dashboard» |
| Esci (menu → Esci) e rientri come **Giulia D.** | Numeri della dashboard **diversi** da quelli di Mario |
| Rientra come Mario | I numeri di prima, invariati |

⚠️ Se i numeri sono identici fra due utenti, la separazione per persona non
sta funzionando: è la cosa peggiore che possano notare.

## 2 · Dashboard

| Cosa fai | Cosa deve succedere |
|---|---|
| Guardi i quattro riquadri | Numeri coerenti: «agenti creati» = quelli in «I miei agenti» |
| Guardi «Agenti più usati» | Elenco con il conteggio delle esecuzioni, non vuoto |
| Guardi «Attività recente» | Voci datate, la più recente in cima |
| Scorri in fondo | Grafico delle esecuzioni della settimana |

## 3 · Marketplace

| Cosa fai | Cosa deve succedere |
|---|---|
| Conti gli agenti | Più di 20 |
| Clicchi un filtro (es. **Finance**) | Il catalogo si restringe |
| Scrivi «fattura» nella ricerca in alto | Restano solo gli agenti pertinenti |
| Apri una scheda agente | Descrizione, autore, valutazione, **flusso a nodi visibile** |
| Scorri la scheda | Recensioni con stelle e distribuzione |
| Premi **Installa nel Builder** | Si apre il Builder con il flusso già sulla tela |
| Vai in «I miei agenti» | L'agente installato è nell'elenco |

## 4 · Builder (giro di controllo, non ancora costruzione)

| Cosa fai | Cosa deve succedere |
|---|---|
| Guardi le tre zone | Blocchi a sinistra, tela al centro, proprietà a destra |
| Cerchi «email» nella palette | L'elenco si filtra mentre scrivi |
| Clicchi le linguette (Trigger, AI, Controlli…) | Cambiano i blocchi mostrati |
| Clicchi un nodo sulla tela | A destra compaiono i suoi campi |
| Premi **Verifica** | «Struttura valida: il flusso è eseguibile» |
| Premi **Esegui** | Il registro si riempie, in fondo «Workflow completato» |
| Premi **Esporta** poi **Python** | Scaricano due file (JSON e `.py`) |

## 5 · I miei agenti

| Cosa fai | Cosa deve succedere |
|---|---|
| Guardi le schede | Numero di nodi, data, quante esecuzioni |
| Apri un agente | Si apre nel Builder con i suoi nodi |
| Guardi un agente in revisione (se c'è) | Etichetta «in revisione» o «modifica richiesta» |

## 6 · Log Esecuzioni

| Cosa fai | Cosa deve succedere |
|---|---|
| Guardi i cinque riquadri in alto | Manuali, pianificate, successi, errori, durata media |
| Clicchi **Errori** | Restano solo le esecuzioni fallite |
| Apri una riga | Dettaglio con i nodi percorsi e gli esiti |
| Premi **Esporta CSV** | Scarica un file leggibile |

## 7 · Monitoraggio

| Cosa fai | Cosa deve succedere |
|---|---|
| Guardi le aree | Sette: popolazione, adozione, uso, presidio, modelli, conoscenza, pubblicazione |
| Cambi il periodo (7/14/30/90 giorni) | I numeri cambiano |
| Guardi «Richiede attenzione» | Segnalazioni con i pulsanti per andare a risolverle |
| Scorri in fondo | Il riquadro che dichiara i limiti di quello che il cruscotto può dire |

## 8 · Learning Hub

| Cosa fai | Cosa deve succedere |
|---|---|
| Guardi i quattro livelli | Il primo in corso, gli altri bloccati con il lucchetto |
| Apri un percorso, poi una lezione | Testo, esempi, e in fondo un quiz |
| Rispondi al quiz | XP assegnati, e **non** riassegnati se rifai il quiz |
| Premi **Provalo adesso** | Ti porta nel punto esatto della piattaforma |
| Torni e premi **Apri la sandbox didattica** | Builder con palette ridotta |
| Nella sandbox, guardi i pulsanti | **Salva, Pubblica e Pianifica spenti** |
| Esci dalla sandbox → «I miei agenti» | **Nessun agente nuovo** |

## 9 · Sfide & Eventi

| Cosa fai | Cosa deve succedere |
|---|---|
| Guardi gli obiettivi pratici | Barre di avanzamento calcolate, non a zero fisso |
| Apri una sfida | Pagina con regolamento, fasi, criteri, classifica |
| Premi **Iscriviti** | Il contatore dei partecipanti sale di uno |
| Candida un tuo agente (sfida misurata) | Compare nella classifica con il punteggio |
| Guardi la classifica XP | La tua posizione è coerente con i tuoi XP |

## 10 · Community

| Cosa fai | Cosa deve succedere |
|---|---|
| Guardi i contatori in alto | Contributi, risposte, apprezzamenti, persone |
| Filtri per tipo (Domanda, Soluzione…) | L'elenco si restringe |
| Apri un post con allegato | Si scarica, o si apre nel Builder se è un flusso |
| Premi **+ Nuovo post**, scrivi e pubblica | Compare in cima, e il contatore sale |
| Metti «mi piace» e rispondi a una discussione | Entrambi si registrano |
| Clicchi un nome utente | Profilo pubblico con badge e agenti |

## 11 · Profilo

| Cosa fai | Cosa deve succedere |
|---|---|
| Guardi l'intestazione | Agenti, esecuzioni, XP, livello |
| Confronti con «Il tuo lavoro» sotto | Gli stessi numeri, non diversi |
| Guardi «Consumo di token» | Totale, ultimi 30 giorni, barra della quota |
| Apri **Modifica profilo**, cambi ruolo | Si salva e si vede in alto |
| Guardi badge e obiettivi | Sbloccati coerenti con quello che hai fatto |
| **Esporta Database (.sqlite)** | Scarica un file apribile con DB Browser for SQLite |

## 12 · Trasversali

| Cosa fai | Cosa deve succedere |
|---|---|
| Interruttore ☾ in alto | Tutta la piattaforma passa al tema scuro, nessun testo illeggibile |
| 📦 Knowledge Base | Elenco documenti, **ricerca e filtro per business unit** funzionanti |
| «Prova il recupero» con una domanda | Porzioni con fonte e punteggio |
| 🔌 Connessioni | Elenco cartelle/endpoint/database |
| 🔔 Notifiche | Pannello che si apre e si chiude |
| Dal telefono (QR) | Menu ☰, Builder col dito, nessuna pagina che scorre in orizzontale |
| Dal telefono: tocco su un nodo | Si **seleziona e basta**; il pannello sale solo col doppio tocco o col pulsante in basso, che intanto porta il nome del nodo |
| Dal telefono: pannello «Integrazione AI» | Campo della chiave e pulsanti «Test» / «🔄 Modelli» tutti dentro il riquadro, niente tagliato |

---

# PARTE 2 · Tre use case end-to-end

Costruiti da zero, ognuno con più passaggi, portati fino all'esecuzione. Sono
anche i tre che reggono meglio se te li chiedono dal vivo.

> **Prima**: Builder → **Nuovo**. Se vuoi risposte vere dal modello, collega la
> chiave nel pannello «Integrazione AI» e premi **Test** (pallino verde).
> Senza chiave funziona lo stesso: le risposte sono simulate e dichiarate.

---

## Use case A — Smistamento richieste via email *(5 nodi, ~8 minuti)*

**La storia**: ogni mattina qualcuno apre la casella del supporto e smista a
mano. L'agente classifica, protegge i dati personali e instrada.

### Costruzione

1. Dalla palette, categoria **Trigger** → trascina **Email trigger**.
2. Categoria **Controlli** → trascina **Mascheramento dati**.
3. Categoria **AI** → trascina **LLM Prompt**.
4. Categoria **Controlli** → trascina **Convalida output**.
5. Categoria **Output** → trascina **Output**.
6. Collega in fila: `Email trigger → Mascheramento dati → LLM Prompt → Convalida output → Output`.
7. Seleziona il **nodo AI** e compila:
   - **Prompt**:
     > Classifica la richiesta ricevuta. Rispondi SOLO con JSON:
     > `{"categoria":"tecnico|amministrativo|commerciale","urgenza":"alta|media|bassa","motivo":"una frase"}`
   - **Formato di uscita**: `JSON`
8. Seleziona **Convalida output** e metti nei campi richiesti i nomi
   `categoria, urgenza`.
9. **Verifica** → se compaiono campi obbligatori vuoti, premi **Compila**.

### Esecuzione

10. **Esegui**.
11. **Cosa devi vedere nel registro**: il trigger che riceve i dati di esempio,
    la riga del mascheramento con **quanti identificatori ha nascosto**, il
    nodo AI con il modello usato, la convalida che controlla i campi, e in
    fondo **«Workflow completato»**.
12. Premi **«Perché questo risultato»**: ricostruisce fonti, decisioni e
    controlli intervenuti.
13. **Salva** con il nome `Smistamento richieste`. Finché non lo fai la testata dice **«bozza non salvata»** in arancione e il flusso **non compare** in «I miei agenti»: è una bozza locale, non una riga del database.

### Cosa hai dimostrato
Costruzione senza codice · governance in mezzo al flusso · output strutturato
riusabile dal nodo dopo · tracciabilità completa.

---

## Use case B — Risposta fondata sui documenti aziendali *(6 nodi, ~10 minuti)*

**La storia**: un cliente chiede le condizioni di recesso. La risposta deve
venire **dal contratto vero**, non dalla cultura generale del modello.

### Preparazione

1. 📦 in alto → **Carica/gestisci documenti**: controlla che ci siano documenti
   indicizzati (il seme ne ha sei). Se vuoi, caricane uno tuo in `.txt`.
2. Nella stessa finestra, **Prova il recupero**: scrivi *«penale per il recesso
   anticipato»* e guarda quali porzioni escono, con il punteggio. È la prova
   che l'indice funziona **prima** di costruirci sopra.

### Costruzione

3. Builder → **Nuovo**.
4. **Trigger** → **Webhook** (sarà la domanda del cliente).
5. **AI** → un blocco AI.
6. **Controlli** → **Verifica di fondatezza**.
7. **Comm** → **Invia email**.
8. **Output** → **Output**.
9. Collega: `Webhook → AI → Verifica di fondatezza → Invia email → Output`.
10. Sul **nodo AI**:
    - attiva **«Usa Knowledge Base»**
    - **Prompt**:
      > Rispondi alla domanda del cliente usando esclusivamente le porzioni di
      > documento fornite. Cita sempre il documento da cui prendi
      > l'informazione. Se le porzioni non contengono la risposta, dillo
      > esplicitamente invece di ipotizzare.
11. Su **Invia email**: destinatario, oggetto, e nel corpo usa `{{result}}`.
12. **Verifica** → **Compila** se servono campi.

### Esecuzione

13. **Esegui**.
14. **Cosa devi vedere**: una riga che elenca **quali porzioni di quali
    documenti** sono state recuperate e con quale punteggio; la risposta del
    nodo AI; la verifica di fondatezza che confronta risposta e fonti; l'invio
    (simulato se non hai configurato un servizio SMTP, e lo dichiara).

### Cosa hai dimostrato
RAG con permessi applicati prima del recupero · risposta ancorata a documenti
reali · controllo anti-allucinazione · azione finale su un sistema esterno.

---

## Use case C — Lo stesso agente, costruito parlando *(~7 minuti)*

**La storia**: la seconda modalità. Chi non vuole disegnare niente descrive il
risultato a parole.

> Richiede una chiave AI collegata: è il modello a interpretare la richiesta.
> Senza, la chat lo dichiara e non genera — ed è un comportamento corretto da
> mostrare, se te lo chiedono.

### Costruzione

1. Builder → **Nuovo** (tela vuota).
2. Nella barra sopra la tela scrivi:
   > Quando arriva una fattura via email, estrai fornitore, importo e scadenza.
   > Se l'importo supera i mille euro chiedi l'approvazione di una persona,
   > altrimenti registra e basta. Avvisami su Slack in entrambi i casi.
3. Premi **Genera**.
4. **Cosa devi vedere**: un'**anteprima** con l'elenco dei nodi proposti, non
   nodi che compaiono sulla tela. Due pulsanti: Applica e Annulla.
5. Premi **Applica**: i nodi arrivano sulla tela, con una **condizione** che
   separa i due rami.
6. Controlla che i nomi dei blocchi siano quelli della palette (icone
   riconoscibili). Se qualcuno non lo è, **Verifica** → pulsante **«Usa …»**.
7. Chiedi una modifica, sempre dalla chat:
   > Aggiungi la gestione degli errori sul nodo di invio.
8. **Cosa devi vedere**: il modello **non riscrive il flusso** — aggiunge un
   nodo e lo collega, lasciando intatto il resto.

### Esecuzione

9. **Verifica** → **Esegui**.
10. Guarda il ramo che la condizione ha scelto: il registro lo dichiara.

### Cosa hai dimostrato
Le due modalità producono lo stesso grafo · nessuna generazione finisce sulla
tela senza conferma · la modifica è incrementale, non una riscrittura.

---

## Use case D — Il flusso che non deve partire *(~4 minuti)*

Serve a far vedere che la piattaforma **si rifiuta** di dichiarare fatto un
lavoro che non ha fatto. È il collaudo più veloce e il più convincente.

1. Builder → nuovo agente → trascina **Webhook**, **Invia email**, **Output** e
   collegali in fila.
2. Apri **Invia email** e **svuota il campo «Destinatario»**.
3. Premi **▶ Esegui**.

**Atteso**: l'esecuzione non parte e si apre la finestra con il nodo in elenco,
l'etichetta *configurazione*, il rimedio e il pulsante **Compila**; il nodo è
evidenziato in rosso sulla tela.

**E il registro resta vuoto — «0 voci».** È la verifica più importante di
questa prova, e vale la pena dirla ad alta voce: *il registro racconta cosa è
successo mentre il flusso girava; qui non è successo niente*. Controlla anche
**Log Esecuzioni**: non deve esserci una riga nuova. Un tentativo mai partito
non è un'esecuzione, e contarlo falserebbe i tassi di successo del
Monitoraggio.

> Premendo **▶ Esegui** nel Builder la finestra che si apre è quella della
> verifica («⚠️ Workflow non valido»), perché il controllo scatta prima.
> La finestra «⛔ Il flusso non è partito» è la stessa cosa vista dal motore, e
> compare quando il flusso parte da un'altra strada — pianificazione, scheda
> del marketplace, delega da un orchestratore.

4. Compila il destinatario (o premi **Compila** nella finestra) e riesegui: ora
   completa, e **adesso** il registro si riempie e la riga compare nel Log
   Esecuzioni.

L'altro punto da dire ad alta voce: **nessun nodo è stato eseguito**. Non «è
partito e si è fermato al terzo»: un invio parziale lascerebbe metà del lavoro
fatto e metà no, e quello stato non sarebbe raccontabile.

> Variante, se chiedono «e se succede a metà corsa?»: cancella la connessione
> usata da un nodo mentre il flusso è pronto a partire. Il nodo si ferma e
> interrompe l'esecuzione, invece di passare a valle l'input di un passaggio
> mai avvenuto.

---

## Use case E — Orchestratore, sotto-agenti e ritorno *(~8 minuti)*

1. **I miei agenti → Importa** → incolla `esempi/8-orchestratore-sotto-agenti.json`.
2. **Verifica**: zero problemi.
3. Clicca il nodo **«Agente commerciale»**. Nel pannello a destra:
   - il nome del sotto-agente, quanti nodi ha, se è in produzione;
   - il pulsante **«Apri … nel Builder»**.
4. Premi il pulsante. **Atteso**: si apre il flusso del sotto-agente, e in testa
   al Builder compare la riga «🤝 Sei dentro un sotto-agente delegato da … ·
   ↩︎ torna all'orchestratore».
5. Premi **torna all'orchestratore**. **Atteso**: si torna sul flusso di
   partenza con **lo stesso nodo già selezionato** e la sua delega aperta.
6. Premi **▶ Esegui**. Nel registro, nell'ordine:
   - `🤝 Delega a "…": passaggio di controllo`
   - `↳ ha completato N nodi (done): controllo restituito`
   - **`↳ Esito della delega passato al nodo a valle (… caratteri)`**
   - `✋ Sospensione richiesta` → **Autorizza e riprendi** → completa.

La riga in grassetto è quella da indicare: risponde a «ma l'output del
sotto-agente dove finisce?».

### Prove di rottura, se c'è tempo

| Cosa fare | Atteso |
|---|---|
| Sul nodo di delega, svuota la tendina dell'agente | Il flusso **non parte**: «manca: Agente da chiamare» |
| Rinomina il sotto-agente da «I miei agenti» e riesegui l'orchestratore | Il flusso **non parte**: «Agente «…» non è fra quelli salvati». Il pannello del nodo lo segna in rosso |
| Nel sotto-agente, metti sul «Convalida output» la regola `punteggio >= 999` e `onfail` su «Blocca il flusso», poi esegui l'**orchestratore** | La finestra mostra **due righe**: la delega fallita (cliccabile, con «Apri il sotto-agente») e, sotto, la causa vera — «dentro «…»: Convalida fallita…» — non cliccabile, perché quel nodo non è su questa tela |
| Esegui l'agente di seme **5 · Rapporto settimanale multi-agente** | Si sospende perché un **sotto-agente** ha un controllo umano; autorizzando, riprende prima il sotto-agente e poi il flusso chiamante, e arriva a `done` |

---

## Prova di non regressione: tutto arriva in fondo

Senza alcuna chiave collegata, con la quota di prova, questi devono concludersi
(autorizzando le sospensioni quando compaiono):

| Flusso | Esito atteso |
|---|---|
| Agenti di seme 1, 2, 3, 4 | completato |
| Agente di seme 5 (multi-agente) | sospeso sulla delega → autorizzato → completato |
| `esempi/1-onboarding-fornitore.json` | **si ferma sulla convalida, di proposito** |
| `esempi/2`, `3`, `4` | completati |
| `esempi/5-hr-screening-cv.json` | completato (può passare da un'approvazione) |
| `esempi/6`, `7` | completati |
| `esempi/8-orchestratore-sotto-agenti.json` | sospeso → autorizzato → completato |

Se uno di questi finisce in errore senza che il registro dica **quale campo** o
**quale controllo**, è un difetto da segnalare: l'errore muto è esattamente la
cosa che questa versione ha tolto.
## Dopo i test: pulizia

Prima della presentazione, cancella quello che hai creato provando:

1. «I miei agenti» → elimina gli agenti di prova (`Smistamento richieste`,
   quelli generati dalla chat, eventuali «Nuovo agente»).
2. Community → elimina i post di prova.
3. Log Esecuzioni → **Svuota log** se le esecuzioni di prova sono tante e
   sporcano i numeri della dashboard.
4. Ricarica e controlla che la dashboard mostri numeri puliti.

> In alternativa, se hai esportato il database **prima** dei test
> (Profilo → Esporta Database), reimportalo: torna tutto come prima in un
> colpo solo. È il modo più sicuro, ed è anche una cosa che vale la pena
> mostrare se chiedono della portabilità.

---

## Se qualcosa non funziona

| Sintomo | Prima cosa da guardare |
|---|---|
| «Workflow non valido» | Premi Verifica: ora propone il blocco di ricambio e il riempimento dei campi |
| Il nodo AI non risponde | Pannello Integrazione AI: il pallino è verde? La chiave è del fornitore selezionato? |
| «Provider non configurato» | Il nodo ha un fornitore scelto che non è collegato: mettilo su Automatico |
| Un modello dà errore 404 | L'identificativo non esiste più: premi 🔄 nel pannello per chiedere l'elenco vero al fornitore |
| La pagina è vuota | F12 → Console: se c'è un errore rosso, segnalalo con il testo esatto |
| Dal telefono non si apre | Il QR punta all'indirizzo giusto? Provalo su rete dati, non solo in wi-fi |
