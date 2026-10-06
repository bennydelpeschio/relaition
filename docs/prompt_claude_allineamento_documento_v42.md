# Prompt per Claude — allineare il documento alla POC (v42)

Da usare in una **conversazione Claude** (non Claude Code) allegando due file:

1. `relaition-mvp aggiornata 20260909.zip` — la POC completa
2. il **master document** della tesi (capitoli + appendice + bibliografia)

Il prompt sotto va incollato così com'è.

---

## PROMPT DA INCOLLARE

Ti allego due cose: lo **zip della POC RelAItion** (la piattaforma vera,
client-side, che gira nel browser) e il **master document** della mia tesi di
Master. La POC è stata modificata parecchie volte dopo l'ultima stesura del
documento. Il tuo compito è **riallineare il documento alla POC**, non il
contrario: dove i due divergono, ha ragione il codice.

### Da dove ricavare i fatti

Prima di scrivere qualunque cosa, leggi in quest'ordine:

1. `ARCHITECTURE.md` — è il registro delle decisioni: ogni sezione numerata
   (`### 5.x`) racconta un cambiamento, perché è stato fatto e come è stato
   verificato. Le ultime sezioni sono le più recenti. Contiene anche il capitolo
   **"Semplificazioni del prototipo"**: quello che la POC dichiara di NON fare.
2. `NOTE-DI-RILASCIO.md` — le modifiche raggruppate per rilascio.
3. Il codice in `js/`, `css/`, `demo/`, `esempi/` — la fonte finale. Se
   `ARCHITECTURE.md` e il codice non concordano, vince il codice e me lo devi
   segnalare come **difetto di documentazione interna**.
4. `demo/copione.js` — il copione della dimostrazione guidata: è l'inventario
   più fedele di cosa la piattaforma sa fare, passo per passo.

**Non fidarti dei numeri scritti nel documento.** Ogni cifra che compare in tesi
(numero di agenti in catalogo, di nodi della palette, di sfide, di corsi, di
tabelle del database, di badge, di livelli, di modelli AI, di passi della demo)
va **ricontata sul codice** — di norma in `js/seed-demo.js`, `js/builder.js`
(`PALETTE`), `js/sfide.js` (`SFIDE`), `js/db.js` (`DB_TABLES`),
`js/pages.js` (`LIVELLI`, `PATHS`, badge), `js/ai-client.js` (modelli).
Dimmi cifra per cifra: valore in tesi → valore reale → dove l'hai contato.

### Cosa devi produrre

Un'unica risposta strutturata così.

**1. Che cosa è cambiato nella POC rispetto a quanto descritto nel documento**

Un elenco per area (Builder, esecuzione, Marketplace e pubblicazione,
Knowledge Base, Learning Hub, Sfide ed eventi, Community, profilo e
gamification, governance e monitoraggio, demo). Per ogni voce: cosa fa oggi la
POC, cosa dice oggi il documento, e se la differenza è **sostanziale**
(cambia un'affermazione della tesi) o **redazionale** (cambia solo un nome o un
numero).

**2. Capitolo 3 — modifiche puntuali**

Il capitolo 3 è quello tecnico ed è il più esposto. Per ogni intervento dammi:

- il **punto esatto** (paragrafo, titolo di sezione, o la frase da cercare);
- se è **da sostituire, da integrare o da togliere**;
- il **testo nuovo già scritto**, pronto da incollare, nello stile e nel
  registro del resto del capitolo — non un'indicazione generica del tipo
  «aggiornare la descrizione».

Se una parte del capitolo 3 descrive qualcosa che **la POC non fa più o non ha
mai fatto**, dillo esplicitamente: è la cosa più pericolosa in sede di
discussione.

**3. Appendice**

Stessa cosa per l'appendice: cosa va aggiornato, cosa va aggiunto, cosa va
tolto. In particolare verifica che:

- ogni elemento elencato in appendice **esista davvero** nella POC;
- l'appendice copra le cose nuove che oggi mancano;
- la numerazione delle voci di appendice sia coerente dopo le aggiunte;
- **ogni rimando dal corpo del testo all'appendice punti alla voce giusta**
  (Appendice A.3, B.1, ecc.): se una voce si sposta, elencami tutti i rimandi da
  correggere.

**4. Schemi, tabelle e screenshot**

Dimmi, in tre elenchi separati:

- **Schemi/diagrammi** da rifare (e perché: cosa mostrano che non è più vero),
  da aggiungere ex novo, da eliminare. Per quelli nuovi descrivimi cosa devono
  mostrare, non disegnarli.
- **Tabelle** da aggiornare (colonne, righe, valori) o da aggiungere. Se una
  tabella della tesi contiene numeri, ricontali sul codice.
- **Screenshot** da rifare: per ognuno, **quale schermata**, in **quale stato**
  (quale utente, quale pagina, cosa dev'essere visibile) e **perché** il
  precedente non va più bene. Tieni conto che l'interfaccia ha cambiato colori
  (blu/viola al posto del verde) e che diverse schermate hanno layout nuovi:
  quasi tutti gli screenshot vanno rifatti, ma dimmi quali sono
  **obbligatori** e quali solo desiderabili.

**5. Bibliografia e riferimenti**

- Ogni fonte citata nel testo deve stare in bibliografia e viceversa: elencami
  gli orfani nelle due direzioni.
- Se il testo nuovo che proponi introduce un'affermazione che **richiede** una
  fonte, dimmelo e proponi la fonte, senza inventarla: se non ne conosci una
  affidabile, scrivi «serve fonte» e basta.
- Controlla che i riferimenti a norme e framework citati dalla POC (per esempio
  l'AI Act, il NIST AI RMF, i materiali linkati nelle sfide in
  `js/sfide-contenuti.js`) siano citati in modo coerente fra codice, testo e
  bibliografia.

**6. Coerenza terminologica**

Un elenco dei termini che devono essere identici ovunque — nel documento, nella
POC e negli screenshot. In particolare i livelli del Learning Hub sono
**AI Aspirant, AI Translator, AI Creator, AI Ambassador**: verifica che il
documento non usi ancora i nomi vecchi. Segnalami ogni altro termine che nel
documento compare in due forme diverse.

**7. Verdetto finale**

Chiudi con una risposta secca a due domande:

- il documento, dopo gli interventi che proponi, descrive **esattamente** la POC
  che ti ho allegato? Se no, cosa resta scoperto;
- c'è qualcosa nella POC che **non conviene** portare in tesi (perché è una
  semplificazione dichiarata, o perché è un dettaglio implementativo)? Elencalo,
  così decido io.

### Regole di lavoro

- **Non scrivere per me i capitoli interi**: dammi interventi puntuali,
  ancorati a un punto preciso del documento.
- **Non inventare funzionalità.** Se non trovi una cosa nel codice, scrivi che
  non c'è. Meglio un buco dichiarato che una riga di tesi che non regge una
  domanda in commissione.
- Segnala le **semplificazioni del prototipo** dove il documento rischia di far
  credere che siano funzioni complete (per esempio: connessioni ai modelli AI
  che richiedono una chiave dell'utente, invio email simulato, nessun backend,
  dati che vivono nel browser).
- Se una tua proposta si basa su un'ipotesi, dichiarala invece di darla per
  buona.
- Scrivi in italiano, nello stesso registro del documento.
