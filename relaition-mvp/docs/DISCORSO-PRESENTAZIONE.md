# Discorso per la slide 11 + demo

Traccia per **Benito**. Slide 11 («Il Proof of Concept») e poi il video della
demo breve. Durata complessiva **8 minuti circa**: 1'20" sulla slide, 6'50" di
video commentato.

---

## Prima di tutto: cosa NON dire

Il feedback del team era netto, e vale la pena tenerlo a mente mentre si parla:

- **non elencare i tab.** Nessun «qui c'è la dashboard, qui il marketplace».
  Chi guarda li vede;
- **non ripetere la slide 4.** La slide 4 dice *quali sono i quattro moduli*;
  la slide 11 e la demo dicono *cosa abbiamo costruito e si può toccare*. Se
  rielenchi i moduli, la commissione sente due volte la stessa cosa;
- **non raccontare i passaggi a memoria.** Il video li mostra. Tu racconti
  *perché* quel passaggio esiste;
- **non entrare nel dettaglio tecnico** se non te lo chiedono. Il dettaglio sta
  nelle domande, e lì sei pronto (`DOMANDE-ATTESE.md`).

Una frase da tenere in testa: **ogni cosa che mostro risponde a una delle
barriere del capitolo 1.** Se una frase non fa questo, si può togliere.

---

## Slide 11 — La slide del PoC (1'20")

La slide ha quattro riquadri: Marketplace, Builder, Knowledge Base, Learning
Hub + Sfide + Community. Sono **gli stessi quattro della slide 4**: su ognuno
non ripetere la funzione, di' **il numero, la prova o la scelta** che dimostra
che esiste davvero.

### Apertura (20")

> Fin qui abbiamo raccontato un modello. Da qui in avanti vi mostro che
> funziona.
>
> Non è un mockup e non è un video di montaggio: è un'applicazione che gira,
> con un database vero dentro il browser, oltre quaranta moduli di codice, e
> che costruisce ed esegue agenti veri. Potete aprirla adesso, dal QR code: si
> apre sul vostro telefono.

*[due secondi di silenzio: è il tempo in cui inquadrano]*

### I quattro riquadri (50")

> **Il Marketplace** è il punto di ingresso: oltre venti agenti su nove aree
> aziendali. Quello che conta non è il numero: è che un agente installato
> arriva **aperto** e modificabile, e che il catalogo cresce con quello che
> pubblicano le persone dell'azienda. Non è un negozio, è un patrimonio che si
> accumula.
>
> **Il Builder** è il cuore, e ha due modalità: si trascinano i blocchi, o si
> descrive a parole. Non sono due prodotti: producono **lo stesso grafo**,
> quindi si comincia a parole e si rifinisce a mano. Ed è qui che vivono i
> controlli — mascheramento dati, validazione, approvazione umana — che sono
> blocchi sulla tela, non impostazioni nascoste.
>
> **La Knowledge Base** è quello che separa un assistente generico da uno che
> sa come lavorate: i documenti aziendali diventano memoria consultabile, con i
> permessi applicati **prima** del recupero. E sempre esportabili: nessun
> vincolo con noi.
>
> **E il quarto riquadro è quello che di solito manca.** Formazione, sfide,
> community. Perché una piattaforma non si adotta perché esiste: si adotta se
> le persone imparano a usarla senza paura di rompere qualcosa. Ci torno fra
> poco: è la parte che secondo noi decide se il progetto vive o muore.

### Passaggio alla demo (10")

> Adesso basta slide. Vi faccio vedere **una storia**: una persona che non
> programma, con un problema concreto, che se lo risolve da sola — con
> l'azienda che resta in controllo.
>
> *[parte il video]*

**Se sei in ritardo**: taglia i riquadri uno e tre, che il video mostra
comunque. Tieni il due e il quattro: sono gli unici che il video non spiega.

---

## Il commento al video, per sezioni

Minutaggi della registrazione (circa 7', cronometrati). **Non leggere**: sono appoggi. Se resti
indietro, salta le frasi fra parentesi.

### 0:00–0:18 · Mario entra — *la barriera dell'accesso*

> Lui è Mario. Non è dell'IT: lavora nelle operations, e conosce i processi
> meglio di chiunque. È esattamente la persona che oggi l'intelligenza
> artificiale non riesce a raggiungere.
>
> Entra, e la prima cosa che vede sono i **suoi** numeri. Non un cruscotto
> aziendale: il suo lavoro.

*(Se qualcuno chiede dei profili già pronti: sono quattro account dimostrativi
per entrare in un clic. «Crea un account» registra una persona vera nel
database, e la sua dashboard parte da zero — vale la pena mostrarlo dal vivo,
è dieci secondi e chiude la domanda sulla separazione dei dati.)*

### 0:18–1:34 · Dal catalogo a un agente che è suo — *il percorso più breve*

**È il blocco più lungo del video e il più importante: fa vedere il ciclo di vita
completo di un agente. Non avere fretta, hai più di un minuto.**

> Va nel catalogo e cerca. *[pausa]* E qui succede la prima cosa che conta:
> installandolo, l'agente non arriva come una scatola chiusa — arriva **aperto**
> dentro lo strumento di costruzione.
>
> Lo adatta: cambia il modello AI su quel nodo, perché un blocco che classifica
> non ha bisogno dello stesso modello di uno che scrive un testo. La scelta è per
> singolo blocco.
>
> E lo esegue. Senza aprire un ticket all'IT, senza che nessuno configuri niente
> a livello di sistema.
>
> *[salvataggio]* Poi lo salva, ed è il momento che vale la pena indicare: **è
> qui che un agente del catalogo diventa suo**. Con il suo nome, nel suo elenco,
> mentre l'originale resta intatto per tutti gli altri. Lo ritrova fra i suoi
> agenti e lo riapre quando vuole, esattamente com'era.
>
> Questo è il minuto che risponde alla barriera principale: **il tempo fra
> l'idea e la cosa che funziona** — e che fa vedere che il lavoro non vive in una
> sessione, vive in un database.

### 1:34–1:59 · La Knowledge Base — *il dato aziendale*

**Venticinque secondi, di passaggio.** Il dettaglio su come funziona il recupero
è nelle domande attese (sezione G): se un tecnico lo chiede, c'è tutto. Qui serve
solo piantare tre idee.

> Gli agenti non lavorano nel vuoto: questa è la conoscenza dell'azienda.
> Procedure, contratti, casistiche.
>
> E non è una cartella di file: ogni documento è **indicizzato in porzioni**, ed
> è da quelle che un agente andrà a pescare. Non tagli a lunghezza fissa — una
> normativa si taglia per articolo, un contratto per clausola.
>
> *[esportazione]* E tutto quello che sta qui si porta via in un file di testo.
> È la risposta a «e se domani cambiamo strumento?»: i dati non restano in
> ostaggio.

### 1:59–3:00 · Costruisce da zero ed esegue — *il cuore*

> Adesso costruisce il suo. Il caso è banale e capita a tutti: le richieste che
> arrivano via email e che qualcuno smista a mano ogni mattina.
>
> Punto di partenza, blocco di intelligenza artificiale, e qui — *[indica]* —
> scrive in italiano cosa deve fare. Non codice: italiano. È la parte che
> decide la qualità del risultato, e la scrive **chi conosce il processo**.
>
> Poi, prima che il testo arrivi al modello, mette un controllo: maschera i
> dati personali. *[pausa]* Questo passaggio è il motivo per cui un'azienda può
> dire di sì. Il modello elabora l'informazione, non il dato sensibile. E non è
> un'opzione in un menu: è un blocco, sulla tela, che si vede.
>
> Chiude con un'uscita, e lo fa partire. Ogni blocco si accende mentre lavora.
>
> E questo pulsante — *[«Perché questo risultato»]* — risponde alla domanda che
> blocca più progetti di AI nelle aziende: *«va bene, ma come ci è arrivato?»*.
> Ricostruisce informazioni usate, decisioni prese, controlli intervenuti.

### 3:00–3:19 · Quando un flusso non parte — *l'onestà che convince*

**Questa sezione è nuova e vale la pena annunciarla.**

> E adesso la cosa che di solito nelle demo non si mostra: un flusso che **non
> funziona**. Perché il caso vero non è il flusso perfetto, è quello che arriva
> da un collega e alla prima esecuzione si ferma.
>
> *[si apre la verifica]* La piattaforma non si limita a dire che c'è un
> errore: accanto a ogni problema propone **il blocco giusto** e lo sostituisce
> con un clic. Poi riempie i campi obbligatori rimasti vuoti.
>
> Da sei problemi a zero in due gesti. È la differenza fra uno strumento che
> segnala e uno che aiuta — e, nella pratica, fra una persona che va avanti e
> una che chiama l'IT e si ferma lì.

**Se c'è tempo, o se qualcuno chiede**, questa è la frase che vale di più di
tutte — e si può dire indicando il registro vuoto:

> Notate una cosa: il registro è **vuoto**. Il flusso non è partito, e quindi
> non c'è niente da raccontare: nessun nodo eseguito, nessuna mail spedita,
> nessuna riga nello storico. Sembra un dettaglio ed è il punto: un sistema che
> scrivesse «esecuzione fallita» avrebbe dichiarato un tentativo che non è mai
> avvenuto, e avrebbe falsato i suoi stessi indicatori.
>
> Quando invece il flusso parte e si rompe **a metà**, il registro riporta
> tutto riga per riga e si apre l'elenco dei nodi coinvolti, con il rimedio per
> ciascuno. Sono due situazioni diverse e la piattaforma le tratta in modo
> diverso, perché per chi deve decidere cosa fare dopo *sono* diverse.

### 3:19–4:06 · La seconda modalità e la produzione

> Quella era la modalità per chi vuole vedere il disegno. C'è la seconda, per
> chi non vuole disegnare niente: **lo descrive a parole**, come lo direbbe a un
> collega. La piattaforma propone il flusso in anteprima, e lui accetta o
> rifiuta — niente finisce sulla tela senza conferma.
>
> Le due strade portano allo stesso risultato, quindi si può cominciare a
> parole e finire a mano.
>
> E un agente utile non si lancia a mano ogni mattina: parte a orario, a
> intervallo, o quando arriva un evento.

### 4:06–4:41 · Pubblicazione e revisione — *la governance che non blocca*

> L'agente funziona: diventa patrimonio dell'azienda. Lo propone al catalogo.
>
> Controlli automatici, poi sceglie chi potrà vederlo — il suo reparto, tutta
> l'azienda — e passa a **una persona**. Un revisore guarda e decide.
>
> Qui il bottom-up non diventa anarchia: chi costruisce non si approva da solo.
> Ma nessuno ha dovuto chiedere il permesso per cominciare.

### 4:41–6:20 · Formazione, sfide, community — *il change management*

**Non correre. È l'aggancio al capitolo di Suzana ed è la parte che
differenzia il progetto.**

> E qui arriviamo a quello che secondo noi fa la differenza fra una piattaforma
> che si compra e una che si usa.
>
> Perché il problema non è mai stato lo strumento: è che le persone non sanno
> da dove cominciare e hanno paura di rompere qualcosa.
>
> Allora si impara **dentro** la piattaforma, non in un corso a parte. Una
> lezione, un quiz. *[certificazioni]* E quattro livelli di certificazione, che
> non si regalano: un livello si ottiene completando tutti i percorsi fino a
> quel punto — finire solo i facili non porta avanti. Chi arriva in fondo
> scarica un attestato con un codice di verifica.
>
> *[sandbox]* E poi questa, che è la risposta alla paura: la **sandbox**. Si
> prova davvero, sugli schermi veri, ma non si salva e non si pubblica niente.
> Si impara sbagliando, senza conseguenze.
>
> *[sfide]* Le sfide interne trasformano tutto questo in qualcosa che le
> persone hanno voglia di fare. Ognuna ha le sue fasi, con le date, e i criteri
> di valutazione si leggono **prima** di iscriversi — non dopo, quando ormai si
> è lavorato per niente.
>
> *[community]* E la community è dove chi ha risolto un problema lo passa agli
> altri — con dentro l'agente, pronto da aprire. Non un racconto: una cosa
> riutilizzabile.
>
> È così che l'adozione sale dal basso: non perché qualcuno l'ha imposta, ma
> perché qualcuno l'ha resa facile e conveniente.

### 6:20–6:55 · Chiusura del video

> *[profilo, token]* Ogni persona vede il proprio lavoro — e quanto costa: la
> piattaforma conta i token di ogni chiamata, per persona, agente e fornitore.
> Perché «quanto ci costa» è la seconda domanda che fa un CFO, subito dopo
> «funziona».
>
> *[monitoraggio]* Chi deve rispondere dei risultati ha sette aree di
> monitoraggio, con ogni numero calcolato sui dati — e dove è una stima, la
> piattaforma lo dichiara.
>
> *[tema scuro]* E, visto che ci siamo: funziona anche così.
>
> *[cartello finale]* — e qui il video si chiude da solo.

*(Il cartello «Fine della dimostrazione» è il tuo segnale: non serve dire «e
questo è tutto», lo ha già detto lo schermo. Fai una pausa di un secondo e
attacca la chiusura.)*

*(Le **connessioni** ai sistemi aziendali sono uscite dal video: in una
presentazione sono un dettaglio che chi guarda non sa dove collocare. Se qualcuno
chiede come ci si collega a un ERP, la risposta è nelle domande attese — si
configurano una volta e più agenti le riusano, sono un oggetto della piattaforma
e non un campo dentro un nodo, ed è quello che le rende governabili da un reparto
IT.)*

---

## Chiusura (dopo il video, 20")

> In sette minuti abbiamo visto una persona che non programma prendere un agente
> dal catalogo e **farlo proprio**, costruirne uno da zero, ripararne uno rotto,
> proporlo all'azienda — e imparare a farlo dentro la piattaforma stessa. Con i
> controlli sempre in mezzo.
>
> Questo è il senso di RelAItion: **l'AI non la governano pochi specialisti, la
> governa un'organizzazione intera, in sicurezza**.
>
> La piattaforma è aperta sul vostro telefono, e resta aperta. **Ci sono
> domande?**

*(Il «grazie» viene dopo le domande: chiudere con «grazie» spegne la
conversazione.)*

---

## Promemoria operativi

| Cosa | Quando |
|---|---|
| QR a schermo e invito a inquadrarlo | prima di far partire il video |
| Piattaforma aperta in una finestra sotto | per tutta la presentazione |
| Il video parte già a tutto schermo | evita di mostrare la barra della demo |
| Se chiedono di provare dal vivo | apri la finestra già pronta, **non** ricaricare |
| Se il video va fuori sincrono | fermati, lascia finire la sezione, riprendi |

**Se la domanda arriva durante il video**: fermalo. Un video in sottofondo
mentre si risponde fa perdere entrambe le cose.

**Se chiedono una funzione che nel video non c'è**: «è nella piattaforma, ve la
mostro adesso» — e aprila. È il motivo per cui la tieni aperta sotto.

---

## Le tre frasi da non sbagliare

Se dimentichi tutto il resto, queste tre tengono in piedi la presentazione:

1. *«Non è un mockup: è un'applicazione che gira, e potete aprirla adesso.»*
2. *«Il modello elabora l'informazione, non il dato sensibile — e si vede, è un
   blocco sulla tela.»*
3. *«L'AI non la governano pochi specialisti: la governa un'organizzazione
   intera, in sicurezza.»*
