# Prompt per Claude, allineare il documento (v48): stato finale della POC v105

Da usare in una **conversazione Claude** allegando:

1. `relaition-mvp aggiornata 20260914b.zip` (POC v105)
2. il master document della tesi (capitoli, appendice, bibliografia)

**Sostituisce il v46 e il v47**, che non vanno usati. Presuppone il documento
allineato con il **v45** (contatore dei token e modello commerciale). Se il
v46 o il v47 sono già stati applicati, questo prompt li corregge dove
serve: Claude deve controllare lo stato del documento, non presumerlo.

---

## PROMPT DA INCOLLARE

Ti allego lo zip della POC RelAItion (versione v105) e il master document
della tesi. Devi allineare il documento allo stato attuale della POC, con
focus su **capitolo 3 e appendice**. Le fonti nello zip sono
`ARCHITECTURE.md` **§5.154–§5.159**, `NOTE-DI-RILASCIO.md`, `js/consumo.js`,
`js/ai-client.js`, `js/aiuto-testo.js`, `js/dashboard-utente.js`,
`js/builder.js` (funzione `renderSceltaModello`), `demo/LEGGIMI.md`. Il
codice vince sulla documentazione, e la documentazione vince sul documento.

Prima di tutto dimmi, per ognuno dei sei punti sotto, cosa il documento dice
**oggi** (citando la frase), poi proponi la modifica. Non presumere che i
prompt precedenti siano stati applicati.

### 1. Quota di prova: automatica, senza selettore (§5.156)

Stato della POC:

- ogni chiamata al modello è **contata** per utente, agente, nodo e
  fornitore (`consumo_token`), misurata dove il fornitore riporta i token,
  stimata altrove e marcata come stimata (già nel v45);
- **quota di prova** di 100.000 token per persona, visibile nel profilo
  («Consumo di token»: totale, ultimi 30 giorni, «con la tua chiave», barra
  della quota);
- la regola è **una sola e automatica** (`usaQuota()`): con un fornitore
  collegato i nodi AI usano quello e la quota non si tocca; senza fornitore,
  finché resta quota, usano la quota di prova, con risposte **simulate** e
  dichiarate tali in quattro punti (riga SISTEMA in testa al registro,
  prefisso «[Quota di prova · risposta simulata]» sulle righe AI, fornitore
  `quota-prova` nel conto dei token tenuto a parte, prefisso «[quota di
  prova]» nel riepilogo, che la pubblicazione **non conta** come collaudo:
  «eseguito solo con la quota di prova: nessun collaudo con un modello
  vero»);
- la validazione blocca solo se non c'è **né chiave né quota**;
- costruzione via chat e aiuto alla scrittura **rifiutano** la quota (una
  risposta simulata non compone un flusso);
- **non esiste** nessun selettore «Fonte delle chiamate» né scelta
  «automatico / sempre la quota / solo la mia chiave»: una versione
  intermedia lo aveva ed è stato tolto;
- il vincolo resta: la quota **non compra inferenza**, non c'è un proxy con
  una chiave del fornitore della piattaforma; in un'installazione con il
  proxy lo stesso bivio manderebbe la chiamata al proxy invece che alla
  simulazione. **Non è un credito**: nessuno paga i token al posto
  dell'utente.

→ *Dove*: (a) capitolo 3, profilo: due o tre frasi sul riquadro e sulla
regola automatica; (b) capitolo 3, Builder/validazione: «il flusso non parte
senza un modello collegato né quota disponibile»; se il testo dice ancora
«per eseguire serve comunque la chiave» (v45) va corretto; se dice che
«la persona sceglie la fonte» (v46) va **cancellato**; (c) **modello
commerciale** (paragrafo del v45): il prototipo implementa già il bivio
quota/chiave e il proxy sostituirebbe la simulazione, non il bivio; (d)
**semplificazioni del prototipo**: «le chiamate a quota di prova sono
simulate; con un proxy di inferenza sarebbero chiamate vere addebitate ai
crediti; le chiamate con strumenti non sono contate a quota; nessuna
conversione in costo».

### 2. Dashboard e profilo per persona (§5.155)

«Agenti più usati», «Attività recente» e il grafico delle esecuzioni della
settimana sono calcolati sulle righe della persona connessa; chi non ha
attività vede stati vuoti espliciti; «Attività recente» nel profilo idem.
«Consigliati per te» e «Novità» restano comuni. → *Dove*: capitolo 3,
dashboard e profilo, una riga ciascuno. Se lo screenshot della dashboard
mostra 42/35/28/23 o «148 totali», va rifatto.

### 3. Aiuto alla scrittura (§5.148 e §5.157)

Sotto il prompt di un nodo AI, sotto il contesto del flusso e sotto le aree
di testo dei nodi c'è «Aiutami a scriverlo»: si scrive a parole cosa si
vuole, il modello collegato scrive il testo o migliora quello che c'è, il
risultato finisce nel campo e nella configurazione del nodo, si può
ripristinare il precedente, Ctrl+Invio invia. Senza modello collegato (o con
la sola quota) lo dice e non scrive. **Non** ci sono suggerimenti automatici
mentre si digita. → *Dove*: capitolo 3, Builder, pannello del nodo AI: una o
due frasi se manca; se c'è, verifica che non prometta altro.

### 4. Tendina del modello a cascata (§5.159)

Nel pannello del nodo AI il fornitore si sceglie per nodo («Automatico» è il
predefinito e usa il fornitore collegato). La tendina «Modello» elenca **i
modelli del fornitore scelto**, esattamente quelli della tabella dei
fornitori del capitolo: Anthropic (claude-opus-5 predefinito, claude-sonnet-5,
claude-haiku-4-5, claude-fable-5), OpenAI (gpt-4o-mini predefinito, gpt-4o,
gpt-4.1, gpt-4.1-mini), Google (gemini-flash-latest predefinito,
gemini-pro-latest, gemini-flash-lite-latest), Mistral (mistral-large-latest,
mistral-small-latest); locale e custom sono campo libero. Con «Automatico» la
tendina è **bloccata** e dice quale predefinito seguirà. Cambiando fornitore
il modello scelto per il precedente viene azzerato. → *Dove*: verifica la
tabella dei fornitori (deve coincidere con l'elenco sopra) e la frase che
descrive la scelta del modello sul nodo: «selezionabili dopo aver scelto il
fornitore». Se c'è uno screenshot del pannello del nodo AI, va rifatto con un
fornitore scelto e la tendina dei suoi modelli.

### 5. Autosalvataggio (§5.158): solo se il documento entra nel dettaglio

Il nome di un agente è univoco su tutta la piattaforma; un flusso aperto con
un nome già usato da un'altra persona riceve il suffisso «(2)». → *Dove*:
solo se il capitolo 3 descrive l'autosalvataggio o l'unicità dei nomi.

### 6. Demo (solo se il documento descrive i passi)

101 passi in 10 capitoli. I passi «La scelta del modello sta sul nodo» e
«Cambio fornitore, cambia l'elenco dei modelli» mostrano la tendina bloccata
in automatico e la cascata sul fornitore; «Provo il collegamento» e «I
controlli di pubblicazione» raccontano il caso senza chiave con la quota di
prova; il capitolo 9 mostra il riquadro «Consumo di token» senza selettore;
il capitolo 10 rientra con un altro account. → *Dove*: appendice o capitolo
che descrive la demo, se esiste.

### Cosa mi devi restituire

Per ognuno dei punti (1a–1d, 2, 3, 4, 5, 6): **stato attuale** del documento
(frase citata) → trovato / non trovato → punto esatto → azione → testo pronto
nello stile del documento. Poi l'elenco degli **screenshot da rifare**, tema
chiaro, utente Mario R.: profilo con «Consumo di token» (senza selettore),
pannello Integrazione AI (senza riquadro «Fonte delle chiamate»), registro di
un'esecuzione a quota (riga SISTEMA in testa), pannello del nodo AI con
fornitore scelto e tendina dei modelli, blocco «Aiutami a scriverlo» aperto
con l'esito «Fatto (OpenAI) · Ripristina il precedente», dashboard. Segnala
ogni screenshot esistente che mostra il selettore della fonte: va sostituito.

### Regole

In ogni frase, distinzione fra **simulato** (quota, prototipo) e **vero**
(chiave propria, o proxy nel prodotto). Nessuna frase in cui l'utente sceglie
la fonte delle chiamate. Nessuna frase in cui la quota è un credito. Non
inventare, non riscrivere capitoli, italiano nel registro del documento,
riferimenti ad appendice e bibliografia coerenti con quelli esistenti.
