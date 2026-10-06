# Flussi di esempio

Quattro flussi completi, più articolati di quelli precaricati, pensati per essere
importati e provati. Si caricano da **Builder → Importa → «Oppure incolla il
JSON»**, oppure trascinando il file sul riquadro di importazione.

Importare è un'anteprima: il flusso finisce sulla tela ma **non** viene salvato
finché non si preme Salva.

| File | Cosa dimostra | Senza chiave API |
|---|---|---|
| `1-onboarding-fornitore.json` | Diramazione su soglia, approvazione umana, generazione di un documento e invio per email con allegati | **si ferma sulla convalida**, di proposito |
| `2-rassegna-settimanale.json` | Ciclo su un elenco prodotto dal modello, verifica di fondatezza, salvataggio in Knowledge Base, doppia distribuzione | gira per intero, 24 passi |
| `3-ticket-instradamento.json` | Due controlli in ingresso, classificazione, instradamento su due rami che si ricongiungono | gira per intero, 10 passi |
| `4-invoice-extractor.json` | Estrazione a schema JSON da fattura, convalida dei formati, diramazione su soglia fra registrazione automatica e approvazione umana | gira, ma la condizione senza modello è simulata |

## Perché il primo si ferma

Senza un modello collegato il nodo AI restituisce un avviso al posto del JSON
richiesto, e il controllo **Convalida output** — impostato su «Blocca il
flusso» — interrompe l'esecuzione. È il comportamento corretto: un dossier
fornitore costruito su dati illeggibili non deve uscire.

Il terzo flusso ha lo stesso controllo impostato su «Segnala e prosegui», ed è
altrettanto corretto per il suo caso: una richiesta di assistenza non si butta
via perché il classificatore era incerto, si annota e si prosegue con
prudenza. **La differenza fra i due non è tecnica, è una decisione di
processo**, e il nodo permette di dichiararla.

Con una chiave configurata tutti e tre completano.

## Allegati veri

Il flusso 1 usa la capacità nuova del nodo email: `attach: "Sì"` allega i file
prodotti durante l'esecuzione. Dal pannello del nodo si possono aggiungere
anche **allegati fissi** — un file preso dal computer o un documento della
Knowledge Base — che partono a ogni invio: un listino, un modulo, delle
condizioni contrattuali.

---

## Tre flussi per la presentazione (5, 6, 7)

Aggiunti per la discussione del capstone. **Collaudati uno per uno**: importati,
validati senza errori ed eseguiti fino in fondo *senza chiave AI collegata*.
Con una chiave collegata le risposte diventano vere e il comportamento non
cambia.

### Come si importano

«I miei agenti» → **📥 Importa JSON** → trascina il file, oppure incolla il
contenuto nel riquadro di testo e premi Importa. Il flusso arriva sulla tela
con il suo nome: si esegue subito, e si salva solo se lo si vuole tenere.

### 5 · Screening CV con tutela del candidato (HR) — 10 nodi

**Cosa dimostra**: la governance *prima* del modello, e il gate umano.

Il mascheramento dei dati personali sta fra il trigger e il nodo AI, quindi il
modello valuta competenze e non sa chi è il candidato; il prompt lo vincola
esplicitamente a ignorare dati anagrafici. Due rami: sopra soglia si apre
un'attività per il colloquio, sotto soglia si registra l'esito **e si chiede
una conferma umana** — nessuno viene scartato da una macchina.

**Esito atteso senza chiave**: la convalida passa — la risposta simulata ha la
forma che il prompt ha chiesto — e poi il flusso prende uno dei due rami. Sotto
soglia si ferma su «in attesa di approvazione»: non è un errore, è il gate umano
che funziona, ed è la cosa da far notare. Sopra soglia prosegue fino in fondo.
Senza modello collegato la condizione è valutata in modo simulato, quindi **il
ramo può cambiare da un'esecuzione all'altra**: autorizzando la sospensione il
flusso arriva comunque in fondo.

> **Variante da mostrare se chiedono della governance**: sul nodo «Convalida
> output» aggiungi la regola `punteggio >= 90` e metti `onfail` su «Blocca il
> flusso». Il valore simulato sta sotto quella soglia, quindi il controllo
> **ferma l'esecuzione** e lo scrive nel registro: è la dimostrazione più
> diretta che il guardrail non è decorativo. Rimettendo la regola com'era, il
> flusso riparte.
>
> Attenzione a una vecchia variante che girava: cambiare solo `onfail` non
> basta più. Fino alla versione precedente la risposta simulata non conteneva i
> campi richiesti e la convalida falliva **sempre** — il blocco non diceva
> niente sul flusso, diceva solo che la simulazione ignorava il prompt.

### 6 · Assistenza clienti fondata sui documenti — 7 nodi

**Cosa dimostra**: il RAG, con le fonti visibili nel registro.

Il nodo AI ha «Usa Knowledge Base» attivo: prima della chiamata parte il
recupero, e nel registro compaiono **le porzioni recuperate con documento,
sezione e punteggio** — BM25 e coseno, entrambi. Un controllo di fondatezza
confronta la risposta con quelle fonti. Davanti c'è la difesa da istruzioni
ostili, perché il testo che arriva da un cliente è un dato, non un comando.

**Esito atteso senza chiave**: completato, 7 nodi. Nel registro si leggono le
quattro porzioni recuperate con i loro punteggi: **è la riga da indicare se
qualcuno chiede «ma il RAG funziona davvero?»**.

### 7 · Sorveglianza scadenze contrattuali (Legal) — 8 nodi

**Cosa dimostra**: l'automazione che vale per la *costanza*, non per la
difficoltà, più la gestione degli errori.

Parte da sola ogni lunedì (`0 7 * * 1`): nessuno deve ricordarsene. Un gestore
eccezioni assorbe i guasti di rete invece di far fallire tutta l'esecuzione.
Il prompt vincola il modello a riportare **solo date scritte nel testo**, mai
calcolate, e a citare la clausola: è il modo di scrivere un prompt quando
l'errore costa.

**Esito atteso senza chiave**: completato, 8 nodi, con le porzioni della
Knowledge Base nel registro e il ramo della condizione dichiarato.

---

### Cosa dire mentre girano

| Momento | La frase |
|---|---|
| Il mascheramento interviene | «Il modello elabora l'informazione, non il dato sensibile. E non è un'impostazione nascosta: è un blocco sulla tela.» |
| Compaiono le porzioni della KB | «Queste sono le porzioni che finiscono nel prompt, con il documento da cui vengono e quanto somigliano alla domanda. Non il documento intero, e non la conoscenza generale del modello.» |
| Il flusso si ferma sull'approvazione | «Non è un errore: è il gate umano. Una decisione che riguarda una persona non la chiude una macchina.» |
| A fine esecuzione | «E questo pulsante ricostruisce fonti, decisioni e controlli intervenuti: è la risposta a *come ci è arrivato*.» |

### Avvertenza onesta

Senza chiave collegata le risposte dei nodi AI sono **simulate e dichiarate**
in ogni riga del registro: il flusso mostra la struttura e il comportamento dei
controlli, non la qualità del contenuto. Per far vedere risposte vere, collega
la tua chiave nel pannello «Integrazione AI» e premi Testa prima di eseguire.

---

## 8 · Sportello unico: orchestratore di agenti specializzati — 14 nodi

Il caso complesso. Si distingue dal numero 5 — che è un **ventaglio**, tre
sotto-agenti invocati tutti insieme per comporre un rapporto — perché qui la
delega è **condizionale**: si decide *a quale* specialista passare la pratica.

### Cosa succede

1. Una richiesta arriva allo sportello (webhook).
2. La difesa da istruzioni ostili tratta il testo come dato, non come comando.
3. Un nodo di **triage** classifica categoria e livello di rischio.
4. Due condizioni annidate instradano a **uno** di tre sotto-agenti:
   commerciale, sinistri, amministrativo. Ognuno è un agente già pubblicato e
   mantenuto dal suo reparto: l'orchestratore non ne duplica la logica.
5. I tre rami **riconvergono** su un nodo che compone la risposta.
6. Un controllo verifica la struttura.
7. Se il rischio è alto, la decisione passa a **una persona**; altrimenti si
   invia direttamente.

### Esito atteso senza chiave

L'esecuzione si ferma su **«in attesa di autorizzazione»**, e sul canvas
compare il riquadro con due pulsanti. Premendo **«Autorizza e riprendi»** il
flusso riparte e completa.

**È il momento migliore da mostrare dal vivo**, perché si vedono tre cose in
sequenza che da sole varrebbero tre spiegazioni:

- `🤝 Delega a "1 · Qualificazione contatti commerciali": passaggio di controllo`
- `↳ ha completato 7 nodi (done): controllo restituito`
- `↳ Esito della delega passato al nodo a valle (610 caratteri)` — è la riga che
  risponde a «ma l'output del sotto-agente dove finisce?»: finisce nel nodo
  collegato a valle, e il registro dice quanto ne è passato
- `✋ Sospensione richiesta` → si autorizza → `✅ Autorizzato: l'esecuzione riprende`

### Entrare nel sotto-agente

Selezionando un nodo **Chiamata agente** il pannello a destra mostra quanti
nodi ha il sotto-agente, se è in produzione, e un pulsante **«Apri … nel
Builder»**. Entrando, in testa al Builder compare una riga «sei dentro un
sotto-agente delegato da …» con il ritorno all'orchestratore, che riporta sul
nodo esatto da cui si era partiti.

È la risposta migliore a «ma il sotto-agente è una scatola nera?»: no, è un
flusso come gli altri, aperto da chi lo mantiene, e da qui si guarda senza
perdere il posto.

### Se la delega non riesce

Tre casi, tutti visibili nel registro invece che taciuti:

- il nodo non indica quale agente chiamare, o l'agente non è più fra quelli
  salvati → **il flusso non parte affatto**, e il messaggio dice quale nodo;
- il sotto-agente termina in errore → il flusso dell'orchestratore **si
  interrompe**, invece di passare al nodo a valle l'input non trasformato
  spacciandolo per il risultato della delega;
- il sotto-agente incontra a sua volta un'**approvazione umana** → si sospende
  anche l'orchestratore; autorizzando, riprende prima il sotto-agente e poi il
  flusso chiamante. È quello che succede nel flusso 5 del seme, che delega a un
  agente con un controllo umano dentro.

### Perché conta, se ve lo chiedono

Il capitolo 2 cita la misura di Anthropic: un sistema multi-agente consuma
circa **quindici volte** i token di una conversazione singola, e conviene solo
quando il valore del task supera quel costo. Questo flusso è il caso in cui si
giustifica: tre competenze diverse, mantenute da tre reparti diversi, con
un'unica porta d'ingresso per chi scrive. Non è multi-agente per moda — è
multi-agente perché le alternative sono tre caselle di posta separate o un
unico agente che nessuno sa più mantenere.

E il gate umano non è un'aggiunta: il capitolo 2 lo chiede **obbligatorio per
le categorie ad alto rischio**. Qui la soglia la decide il triage, e il gate si
apre solo quando serve.

### Dipendenze

Il flusso invoca per nome tre agenti del seme: `1 · Qualificazione contatti
commerciali`, `2 · Estrazione dati da fattura`, `4 · Istruttoria sinistro
assicurativo`. Se sono stati rinominati o cancellati, il nodo «Chiamata
agente» va riaperto e il sotto-agente riselezionato dalla tendina.
