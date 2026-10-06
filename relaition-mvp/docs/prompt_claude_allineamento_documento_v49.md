# Prompt per Claude, allineare il documento (v49): mobile, correzioni, demo breve

Da usare in una **conversazione Claude** allegando:

1. `relaition-mvp aggiornata 20260927.zip` (POC v108)
2. il master document della tesi — la versione **consegnata**, non una
   precedente

**Attenzione al punto di partenza.** Questo prompt presuppone che il
documento sia quello già consegnato, quindi con i capitoli 1-6 e le appendici
chiusi. Non chiede di riscrivere niente: chiede di verificare **quattro
affermazioni** che la POC ora onora meglio di prima, e di segnalare gli
screenshot da rifare. Se il documento è già andato in commissione e non si
tocca più, serve comunque come elenco di quello che è cambiato dopo la
consegna, da avere pronto in discussione.

Il v48 resta valido per tutto il resto (quota di prova, dashboard per
persona, aiuto alla scrittura, tendina dei modelli): questo aggiunge, non
sostituisce.

---

## PROMPT DA INCOLLARE

Ti allego lo zip della POC RelAItion (versione v108) e il master document
della tesi nella versione consegnata. Non riscrivere capitoli: verifica
quattro punti e dimmi, per ognuno, se il documento è già coerente, se va
ritoccato in una frase, o se va solo tenuto presente in discussione. Fonti
nello zip: `ARCHITECTURE.md` **§5.161-§5.165**, `NOTE-DI-RILASCIO.md`,
`css/mobile.css`, `js/mobile.js`, `demo/VOCE-DEMO-BREVE.md`.

### 1. «Interfaccia web e mobile» (capitolo 2, User Layer)

Il capitolo 2 mette l'interfaccia «web e mobile» nel primo livello
dell'architettura, e il capitolo 3 descrive il prototipo come Single Page
Application installabile come PWA. Fino alla versione consegnata il prototipo
era **solo da scrivania**: sotto i 768px il menu occupava due terzi dello
schermo, il Builder affiancava tre pannelli, e soprattutto il canvas non
rispondeva al tocco (trascinamento dei nodi, collegamento delle porte e
palette erano scritti per il mouse).

Ora il prototipo è **usabile da telefono**: menu a scomparsa, pannelli del
Builder a comparsa dal basso, finestre come fogli, e un ponte che traduce i
gesti a un dito negli eventi del mouse che il canvas già gestisce, con il
pizzico a due dita per ingrandire; dalla palette il blocco si aggiunge
toccandolo, perché il trascinamento HTML5 su telefono non esiste. La
dimostrazione guidata resta da scrivania e lo dichiara.

→ *Verifica*: (a) il capitolo 2 promette il mobile — ora è **mantenuto anche
nel prototipo**, non solo nell'architettura di destinazione: se c'è una
semplificazione dichiarata del tipo «il prototipo è ottimizzato per
desktop», **va tolta**; (b) se il capitolo 3 elenca le caratteristiche della
PWA, si può aggiungere mezza riga sull'uso da telefono; (c) controlla se in
appendice c'è una tabella dei limiti del prototipo che cita il mobile.

### 2. Quattro difetti corretti, che toccano affermazioni del capitolo 3

Il capitolo 3 dice che il motore di validazione verifica trigger, cicli,
parametri e raggiungibilità prima dell'esecuzione, e che ogni esecuzione
lascia una traccia granulare. Vero, ma fino alla v107:

- il **flusso di esempio** che si trova aprendo il Builder non passava la
  propria validazione (nodi con nomi non presenti in palette): il primo
  «Esegui» di chiunque rispondeva «workflow non valido, 3 problemi». Corretto:
  ora valida ed esegue;
- il registro dichiarava a ogni nodo AI che l'output vincolato «non è
  supportato da auto» — due avvisi **infondati** per esecuzione, perché `auto`
  è la scelta «usa il fornitore collegato» e non un fornitore. Corretto;
- un nome di nodo contenente **virgolette** veniva troncato alla prima, in
  silenzio, e il resto andava perso: valeva per nomi e descrizioni dei nodi,
  campi dei connettori, nome del profilo, titolo di un post, nome di una
  connessione. Corretto;
- il riquadro della guida interattiva usciva dallo schermo sui telefoni.

→ *Verifica*: nessuna di queste correzioni cambia quello che il documento
afferma — le rende vere. Controlla solo se in appendice ci sono **screenshot
del registro di esecuzione** che mostrano le righe «non supportato da auto»:
in quel caso vanno rifatti, perché quelle righe non compaiono più.

### 3. La demo: due versioni

La dimostrazione guidata ha ora due tagli dello stesso copione: **completa**
(101 passi, ~15 minuti di narrazione) e **breve** (34 passi, **5 minuti e 15
secondi** misurati, da `demo.html?breve`), quest'ultima pensata per un video
di presentazione e accompagnata da `demo/VOCE-DEMO-BREVE.md`, il copione per
la voce fuori campo. La breve passa da tutte e dieci le pagine.

→ *Verifica*: solo se l'appendice descrive la demo o ne riporta i passi.

### 4. Registro linguistico dei testi della demo

Una dozzina di passi erano scritti per contrasto negativo — «non è un
pulsante finto», «non nodi che le somigliano», «che i giocattoli non hanno».
Riscritti in positivo. → *Verifica*: se il documento **cita testualmente** un
passo della demo, la citazione va aggiornata; cerca le virgolette basse nel
capitolo 3 e in appendice.

### Cosa mi devi restituire

Per ognuno dei quattro punti: **già coerente** / **ritocco di una frase**
(con la frase pronta) / **solo da sapere in discussione**. Poi l'elenco degli
**screenshot da rifare**, con il motivo. Infine, in fondo, tre righe che
posso usare a voce in discussione se mi chiedono «cosa è cambiato dopo la
consegna».

### Regole

Non riscrivere capitoli e non proporre riorganizzazioni: il documento è
consegnato. Non inventare: se un punto non trova riscontro nel testo, dillo.
Italiano nel registro del documento, riferimenti ad appendice e bibliografia
coerenti con quelli esistenti.
