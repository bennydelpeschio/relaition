# Note finali per aggiornare il Capitolo 3 (da v41 a v42)

Stato del codice alla consegna. Sostituisce le note parziali precedenti,
comprese `note_allineamento_blocchi_1-3.md`.

Come leggere questo file:

- **§ A** — numeri da correggere. Sono dati verificabili in trenta secondi da
  chi legge la tesi con l'applicazione aperta: se il capitolo ne sbaglia uno, è
  il tipo di errore che si nota.
- **§ B** — funzioni presenti nel codice che il capitolo non descrive.
- **§ C** — limiti da dichiarare, per non promettere più di quanto il codice fa.
- **§ D** — cosa è cambiato *dopo* la v41, in ordine di intervento.
- **§ E** — punti chiusi che nella v41 erano «Da decidere».

Tutti i numeri sono stati **misurati sull'applicazione in esecuzione**, non
dedotti dalla lettura del codice. La documentazione tecnica corrispondente è in
`ARCHITECTURE.md`, sezioni §5.89 → §5.98.

---

## A. Numeri da correggere

| Cosa | Valore verificato | Nota |
|---|---|---|
| Tipi di evento nella traccia di esecuzione | **22** | ✅ la v41 §3.3.5 dice già ventidue in sette famiglie — nessuna correzione |
| Modalità di avvio di un agente | **5** | ✅ la v41 §3.3.5 dice già cinque. Attenzione: elenca *webhook* fra le cinque, mentre nel pannello «Metti in produzione» le voci sono manuale, intervallo, orario, cron, evento — il webhook è un nodo trigger. Da uniformare |
| Nodi nella palette del Builder | **81**, in **11** categorie | trigger 7, AI 9, logica 9, controlli 9, azioni 15, output 8, dati 5, comunicazione 5, CRM 4, ERP 4, DevOps 6 |
| Controlli di governance (guardrail) | **9** | filtro contenuti, mascheramento dati, difesa da istruzioni ostili, verifica di fondatezza, convalida output, soglia di confidenza, approvazione umana, limitatore frequenza, gestore eccezioni |
| Tipi di trigger configurabili | **7** | webhook, scheduler, email, upload file, invio form, cambiamento su database, ascolto evento |
| Connettori con configurazione dedicata | **39** | di cui **12** con connessione riutilizzabile |
| Tipi di connessione riutilizzabile | **5** | cartella, HTTP, database, SMTP, webhook |
| Fornitori di inferenza | **6** | Claude, OpenAI, Gemini, Mistral, modello locale, endpoint personalizzato |
| Pagine di navigazione | **10** | dashboard, marketplace, builder, i miei agenti, log esecuzioni, monitoraggio, learning hub, sfide, community, profilo |
| Aree del cruscotto di Monitoraggio | **7** | ✅ ora hanno i nomi e l’ordine della v41 §3.5.4, numerati in pagina — nessuna correzione al capitolo (§D.4) |
| Lezioni del Learning Hub | **36**, tutte funzionanti | sei non si aprivano affatto — §G.1 |
| Percorsi formativi | **6**, da 6 lezioni ciascuno | |
| Sfide ed eventi | **7**, di cui **3** con classifica calcolata | §G.2 |
| Moduli JavaScript caricati | **35** | +5 rispetto alla v41 |
| Agenti nel catalogo | **22** | invariato |
| Stati di pubblicazione | **6** nel database, **4** etichette nell'interfaccia | §D.2 |
| Formati di export del registro | **3** — Markdown, CSV, JSON | §D.1 |
| Recensioni nel seme dimostrativo | **68** su **23** agenti, medie da **3.67 a 5.0** | §D.3 |

### A.1 I 22 tipi di evento

`node:start`, `node:complete`, `node:error`, `node:skipped`, `node:waiting`,
`branch:decided`, `wave:parallel`, `guardrail:triggered`, `error:handled`,
`kb:retrieved`, `kb:empty`, `tool:invoked`, `tool:loop`, `agent:handoff`,
`capability:degraded`, `file:generated`, `mail:sent`, `execution:queued`,
`execution:suspended`, `execution:aborted`, `execution:excluded`,
`execution:done`.

Se il capitolo li elenca, conviene raggrupparli per famiglia (nodo, controllo,
conoscenza, strumenti, esecuzione) invece di elencarne nove: è la struttura che
li rende leggibili, e regge anche se il numero cambierà.

---

## B. Funzioni presenti nel codice e assenti dal capitolo

1. **Dal messaggio di errore al nodo.** Ogni voce del registro porta il nodo da
   cui proviene; al clic seleziona quel nodo, lo porta in vista e apre il suo
   pannello. È il passaggio che collega osservabilità e correzione, ed è la
   funzione che in demo si nota di più.
2. **Export del registro dell'esecuzione corrente dal Builder**, senza passare
   dalla pagina Log Esecuzioni, in tre formati, con il nodo come colonna.
3. **Lato autore del ciclo di revisione**: feedback leggibile, chi ha deciso,
   quando, e ripresa della modifica con supporto AI (§D.2).
4. **Recensioni reali con media calcolata** (§D.3).
5. **Lettura di più file dalla stessa cartella** in un unico flusso, tramite
   connessione di tipo cartella.
6. **Selezione multipla di documenti dalla Knowledge Base** su un singolo nodo,
   e possibilità di rimuovere un file allegato per usare al suo posto la KB
   aziendale.
7. **Rinomina dell'utente con ricascata** su agenti e contenuti pubblicati: il
   nome è la chiave di attribuzione in 14 tabelle, e cambiarlo le aggiorna
   tutte.
8. **Divisori trascinabili** fra i pannelli del Builder, con le proporzioni
   conservate fra una sessione e l'altra.
9. **Verifica dei rami morti**: prima di eseguire, il Builder segnala le
   condizioni che citano campi che nessun nodo a monte produce — era la causa
   più frequente di «il flusso gira ma non manda la mail».

---

## C. Limiti da dichiarare

Alcuni sono già nel capitolo; questi non lo sono, e vanno aggiunti perché
altrimenti il testo promette più di quanto il codice fa.

1. **Nessuna notifica all'autore** quando arriva una decisione di revisione:
   l'elenco delle notifiche vive in memoria e non è separato per utente. Al suo
   posto un contatore ricavato dal database sulla voce di menu.
2. **Nessuna moderazione delle recensioni**: appaiono appena pubblicate, non
   c'è segnalazione di abuso né limite di frequenza. L'autore è un nome di
   profilo, non un'autenticazione: cambiando profilo demo si può scrivere una
   seconda recensione sullo stesso agente.
3. **La pianificazione gira finché la scheda del browser resta aperta.** Non
   c'è un server: per un'esecuzione continuativa si genera lo script Python e
   lo si pianifica fuori. Vale per tutte e cinque le modalità di avvio.
4. **Estrazione da PDF**: il testo si legge quando è testo. Sui PDF che sono
   immagini scansionate non c'è OCR, e le mappe di codifica non standard
   possono restituire caratteri sbagliati. Il flusso lo segnala invece di
   proseguire su un testo vuoto.
5. **La ricerca semantica usa TF-IDF con BM25, non embedding neurali**: coglie
   riformulazioni lessicali, non parafrasi. Già dichiarato in
   `ARCHITECTURE.md` §5.1; se il capitolo parla di «ricerca semantica» senza
   qualificarla, va qualificata.
6. **L'isolamento per utente non è sicurezza**: è un filtro `WHERE`, in un
   database che chiunque apra quel browser può leggere.

---

## D. Cosa è cambiato dopo la v41

### D.1 Export del registro e voci collegate al nodo

Il registro dell'esecuzione corrente si esporta dal Builder in Markdown, CSV e
JSON; il nome del file contiene flusso, data e esito (`riuscita` / `con
avvisi` / `con errori`). Ogni voce mostra il nodo di provenienza ed è
cliccabile; il nodo è una colonna negli export (`nodeId` in JSON). Le righe di
riepilogo, che non appartengono a un nodo, restano senza etichetta.

**Paragrafi da toccare:** registro di esecuzione nel Builder, osservabilità.

### D.2 Ciclo di pubblicazione e feedback

Il capitolo descrive la coda di revisione, cioè il lato del **revisore**. Il
lato dell'**autore** non esisteva: la decisione veniva scritta in
`published_agents` e `publications`, e nessuna schermata la leggeva — un agente
rifiutato spariva dal Marketplace senza che il suo autore ne conoscesse il
motivo.

Dentro «I miei agenti» c'è ora la sezione **Pubblicati e in revisione**: per
ogni pubblicazione dell'utente, stato, testo del feedback, nome del revisore e
data. I sei stati del database diventano quattro etichette: «In verifica»,
«Pubblicato», «Modifica richiesta», «Rifiutato» (più «Sospeso»).

Il pulsante **«Applica la modifica»** carica nel Builder il workflow *come
pubblicato* — non l'agente locale, che può essere cambiato dopo — e scrive la
richiesta del revisore nella chat. Non la applica da sola: passa dall'anteprima
come ogni altra modifica via chat. È il punto che realizza il «con supporto AI».

**Verificato:** un agente rifiutato o rimandato in modifica **non compare nel
Marketplace**. Se il capitolo lo afferma, ora l'affermazione è sostenuta dal
codice.

Il seme dimostrativo contiene anche le **due decisioni negative**, con
motivazione e revisore: senza, in demo si vedrebbe solo il caso approvato, cioè
l'unico che non richiede che il ciclo funzioni davvero.

**Paragrafi da toccare:** pubblicazione, ambiti e approvazione, coda di
revisione.

### D.3 Recensioni

Se il capitolo attribuisce agli agenti una valutazione media o parla di
recensioni degli utenti, va sottolineato che **fino alla v41 quel dato era un
numero scritto nel codice accanto a tre recensioni identiche su tutti e 22 gli
agenti**. Ora sono righe di database, con indice UNIQUE per (agente, autore):
una persona ne scrive al massimo una, e il secondo invio corregge la propria.

La **valutazione mostrata è la media calcolata** quando esistono recensioni —
in scheda, sulla card e nell'ordinamento per valutazione. Le stelle sono
disegnate in frazioni: 4.5 mostra quattro stelle e mezza, non cinque piene.

**Prova riproducibile in demo:** una recensione da 2 stelle su *DevOps Alert
Manager* porta la media da 4.0 a 3.5; correggendola a 3 stelle va a 3.8;
eliminandola torna a 4.0 — contemporaneamente in scheda, card e ordinamento.

**Paragrafi da toccare:** scheda dell'agente nel Marketplace, valutazione e
adozione, dimensione community.

### D.4 Il cruscotto di Monitoraggio: nessuna modifica al capitolo

La v41 §3.5.4 elencava sette aree — Popolazione, Adozione, Uso, Presidio,
Modelli, Conoscenza, Pubblicazione e apprendimento — che nella pagina non
esistevano: c'erano coppie di riquadri senza nome.

**È stata allineata l'applicazione, non il documento.** La pagina ora dichiara
quelle sette aree con quei nomi, in quell'ordine, numerate da 1/7 a 7/7. Il
paragrafo del capitolo **resta com'è** ed è diventato verificabile: chi legge
con l'applicazione aperta conta sette intestazioni numerate.

Unico ritocco facoltativo: si può aggiungere che le aree sono numerate
nell'interfaccia, e che la riga di indicatori principali (esecuzioni, tasso di
successo, agenti attivi, durata media) sta sopra la numerazione come
intestazione della pagina.

### D.5 La quinta modalità di avvio è ora raggiungibile

Il motore valutava le espressioni cron da sempre, ma il pannello «Metti in
produzione» offriva solo quattro voci: la quinta modalità **esisteva nel codice
e nessuno poteva sceglierla**. Aggiunta la voce «Espressione cron» con
segnaposto `0 9 * * 1` e **validazione al salvataggio** — un'espressione
malformata verrebbe salvata in silenzio e l'agente non partirebbe mai, con
l'unico sintomo di un flusso «in produzione» che non si esegue.

**Verificato:** `ogni lunedi` viene rifiutata e il database resta invariato;
`0 9 * * 1` viene salvata e descritta come «Ogni lunedì alle 09:00».

Se il capitolo dice cinque modalità, ora è corretto. Se ne dice quattro, va
portato a cinque.

---

## E. Punti chiusi che nella v41 erano «Da decidere»

- **«Sette aree» del Monitoraggio** → chiuso allineando l'applicazione (§D.4).
- **Modalità di avvio, quattro o cinque** → chiuso: sono cinque, e la quinta
  ora si può scegliere (§D.5).
- **Recensioni dichiarate ma finte** → chiuso: sono reali (§D.3).

Resta un solo intervento non tecnico: **togliere dal documento i marcatori
editoriali** (note di lavoro, commenti fra parentesi quadre, segnaposto)
prima della consegna.

---

## F. Stato di verifica alla consegna

Misurato sull'applicazione in esecuzione, con il modello sostituito da una
risposta fissa: **nessuna chiave API è stata usata per le prove**.

- **5 flussi di riferimento su 5** superano la validazione; 4 completano, 1
  resta in attesa sul nodo di approvazione umana — comportamento corretto.
  **41 nodi su 42** percorsi.
- Le **10 pagine** si aprono senza eccezioni.
- Le **23 schede agente**, le **36 lezioni** e le **7 schede sfida** si aprono
  senza eccezioni.
- Elenco dei moduli in `sw.js` allineato a `index.html`: **35 su 35**, cache
  `relaition-v6`. È l'invariante che, quando era saltato, faceva vedere
  all'app installata meno funzioni che nel browser.
- La navigazione non crea agenti spuri (vedi §G.4).

⚠️ **Le chiavi API incollate in chat durante lo sviluppo vanno considerate
compromesse e ruotate prima della consegna.**

---

## G. Aggiunta — Learning Hub e Sfide (dopo la stesura di §A-§F)

Due interventi successivi. Aggiornano i numeri della tabella §A dove indicato.
Documentazione tecnica in `ARCHITECTURE.md` §5.94-5.98.

### G.1 Sei lezioni non si aprivano

**Da dire nel capitolo solo se descrive il Learning Hub come funzionante**: lo è
ora, non lo era. Sei lezioni su 36 — `1-0`, `1-1`, `1-2`, `1-3`, `2-0`, `2-2` —
si aprivano su un'eccezione JavaScript e non mostravano nulla. Le prime quattro
sono l'ingresso del primo percorso. Causa: due forme di quiz incompatibili nei
contenuti, e un renderer che ne leggeva una sola.

Ora **36 lezioni su 36** si aprono, tutte con quiz; la risposta corretta viene
registrata e assegna XP. Ogni lezione termina con un rimando operativo alla
schermata di cui parla, e il completamento di un percorso produce un
riconoscimento con il conteggio dei quiz effettivamente superati.

### G.2 Le sfide non erano interattive

Erano sei riquadri con un pulsante «Iscriviti», e **date scritte a mano già
scadute**. Ora: scadenze relative, scheda di dettaglio con regolamento e pesi,
candidatura di un proprio agente, **classifica calcolata sulle esecuzioni
reali**, iscrizione annullabile, Hall of Fame ricavata dal database.

Il punto utilizzabile nel capitolo: **i pesi di valutazione mostrati sono la
formula del punteggio**. Non c'è un numero dichiarato accanto a un calcolo

diverso.
### G.3 Numeri

La tabella §A è già aggiornata con questi valori: **35** moduli, **36** lezioni
tutte funzionanti, **7** sfide di cui **3** con classifica calcolata. La cache
del service worker è `relaition-v6`. Non ci sono numeri diversi fra §A e §G: se
ne trovi due, quello giusto è §A.

### G.4 Due difetti trovati e corretti, da citare fra i limiti superati

1. **La sandbox didattica creava gli agenti che dichiarava di non creare.**
   Azzerare il riferimento alla riga non basta: senza riga, l'autosalvataggio
   ne crea una nuova. Uscendo comparivano in «I miei agenti» un «Prova in
   sandbox» e una copia del flusso di esempio.
2. **Aprire il Builder creava un agente fantasma** di nome «Workflow Builder» a
   ogni sessione nuova, perché il flusso ripristinato dalla copia di sicurezza
   non veniva marcato come effimero.

Entrambi gonfiavano il conteggio degli agenti — quindi anche i numeri del
cruscotto di Monitoraggio. Se il capitolo riporta cifre di agenti creati
ricavate da una sessione precedente, **vanno rilette dopo questa correzione**.

### G.5 Verifica

Lo stato completo è in §F, già aggiornato dopo questi due interventi.
