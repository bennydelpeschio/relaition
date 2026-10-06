# Prompt per Claude, allineare il documento (v46): quota di prova usabile, dashboard per persona

Da usare in una **conversazione Claude** allegando:

1. `relaition-mvp aggiornata 20260914.zip`
2. il master document della tesi (capitoli, appendice, bibliografia)

Incrementale: presuppone il documento allineato con il v45. Se non lo è, usa
prima il v45 (contatore dei token e modello commerciale) e poi questo. I due
si leggono insieme: il v45 introduce il contatore, questo dice che la quota
**si può usare** e come.

---

## PROMPT DA INCOLLARE

Ti allego lo zip della POC RelAItion e il master document della tesi. Ci sono
tre modifiche da portare nel documento; la prima cambia una frase che il
documento, se allineato col v45, dice ancora al contrario. Fonti nello zip:
`ARCHITECTURE.md` **§5.155 e §5.156**, `js/consumo.js`, `js/dashboard-utente.js`.
Il codice vince sulla documentazione.

### 1. La quota di prova si può usare (cambia una frase del v45)

Con il v45 il documento dice che la quota di prova è un contatore e che «per
eseguire serve comunque la chiave». Ora **non è più così**:

- senza chiave, i nodi AI **girano lo stesso con la quota di prova**, ma con
  risposte **simulate**, dichiarate quattro volte: nel registro prima del
  primo nodo, su ogni riga AI («[Quota di prova · risposta simulata]»), nel
  conto dei token (fornitore `quota-prova`, tenuto a parte) e nel riepilogo
  dell'esecuzione;
- il flusso mostra la **struttura**, non il contenuto: la risposta simulata è
  nel formato atteso dal nodo (JSON con `simulato:true`, o testo) e contiene
  la dichiarazione di essere simulata;
- la persona sceglie la **fonte** delle chiamate, nel pannello Integrazione AI
  o nel profilo: *automatico* (la chiave se collegata, altrimenti la quota),
  *sempre la quota*, *solo la mia chiave*. La quota si consuma solo con le
  chiamate a quota; con la chiave propria i token si contano ma la quota non si
  tocca, che è il comportamento dei crediti di benvenuto veri;
- tre eccezioni, tutte dichiarate: la costruzione via chat e l'aiuto alla
  scrittura **rifiutano** la quota (una risposta simulata non compone un
  flusso); la pubblicazione **non conta** un'esecuzione a quota come collaudo
  («eseguito solo con la quota di prova: nessun collaudo con un modello vero»);
- il vincolo resta: la quota **non compra inferenza**, non c'è un proxy con
  una chiave del fornitore della piattaforma. In un'installazione con il
  proxy, lo stesso bivio manderebbe la chiamata al proxy invece che alla
  simulazione.

→ *Dove*: (a) capitolo 3, dove il v45 ha messo la quota di prova nel profilo:
sostituire «serve comunque la chiave» con il bivio descritto sopra, in due o
tre frasi; (b) **modello commerciale** (paragrafo del v45): aggiungere che il
prototipo implementa già il bivio quota/chiave e che il proxy sostituirebbe la
simulazione, non il bivio; (c) **semplificazioni del prototipo**: «le
chiamate a quota di prova sono simulate; con un proxy di inferenza sarebbero
chiamate vere addebitate ai crediti»; (d) se il capitolo descrive la
**validazione** («il flusso non parte senza un modello collegato»): ora è
«non parte senza un modello collegato *né quota disponibile*; con la fonte su
"solo la mia chiave" torna a bloccare». Scrivimi ogni testo pronto.

### 2. Dashboard e profilo per persona (§5.155)

«Agenti più usati», «Attività recente» e il grafico delle esecuzioni della
settimana sono calcolati sulle righe della persona connessa (prima erano
fissi); chi non ha attività vede stati vuoti espliciti; «Attività recente» nel
profilo idem. «Consigliati per te» e «Novità» restano comuni. → *Dove*:
capitolo 3, dashboard e profilo; una riga ciascuno. Lo **screenshot della
dashboard** va rifatto (42/35/28/23 e «148 totali» non esistono più).

### 3. Demo

101 passi; il passo «Provo il collegamento» ora dice che senza chiave i nodi
usano la quota con risposte simulate; nel capitolo 7 il modulo di
pubblicazione si apre anche senza chiave e i controlli segnalano il collaudo
solo simulato. → *Dove*: solo se il documento descrive i passi della demo.

### Cosa mi devi restituire

Per ognuno dei punti (1a-1d, 2, 3): trovato / non trovato, punto esatto,
azione, testo pronto. Poi l'elenco degli **screenshot da rifare**: profilo
(riquadro «Consumo di token» con il selettore della fonte), pannello
Integrazione AI (riquadro «Fonte delle chiamate»), registro di un'esecuzione a
quota (con la riga di avviso in testa), dashboard. Tema chiaro, utente Mario R.

### Regole

Tieni in ogni frase la distinzione fra **simulato** (quota, prototipo) e
**vero** (chiave propria, o proxy nel prodotto): è l'unica cosa che in
commissione può fare male. Non inventare, non riscrivere capitoli, italiano
nel registro del documento.
