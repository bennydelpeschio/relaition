# Domande attese e risposte

Preparate per la sessione di domande dopo la demo. Ordinate per probabilità.
Le risposte sono **brevi di proposito**: una risposta lunga invita a una
seconda domanda sullo stesso punto.

**Regola d'oro**: se non sai, dillo e di' come lo scopriresti. In una
commissione, «non lo so ma lo verifico così» vale più di una risposta inventata
— e una risposta inventata su un prototipo è l'unico modo di perdere la
credibilità costruita in venti minuti.

---

## A · Sul prototipo (le più probabili)

**«È un mockup o funziona davvero?»**
> Funziona. C'è un database vero — SQLite, dentro il browser — e i flussi si
> eseguono per davvero: ogni esecuzione lascia la sua traccia. Quello che
> avete visto nel video non è montato: è una registrazione di una sessione.

**«Dove girano i dati? Dove sta il database?»**
> Interamente sul dispositivo di chi la usa. Non c'è un server: è una scelta
> del prototipo, che serve a dimostrare il funzionamento senza chiedere a
> nessuno di fidarsi di un'infrastruttura. Nel prodotto, l'architettura è
> quella del capitolo 2: cloud multi-tenant con la parte on-premise per i dati
> sensibili.

**«Si collega a modelli AI veri?»**
> Sì. Anthropic, OpenAI, Google, Mistral, e un endpoint locale per chi vuole
> tenere tutto in casa — Ollama, vLLM, LM Studio. La chiave è di chi la usa e
> resta nella sua scheda del browser: non la salviamo e non esce negli export.
> La scelta del modello è **per singolo blocco**, non globale: un blocco che
> classifica non ha bisogno dello stesso modello di uno che scrive.

**«E se non collego nessuna chiave, come fa a funzionare?»**
> C'è una quota di prova che fa girare i flussi con risposte **simulate**, e
> la piattaforma lo dichiara in ogni riga del registro. Serve a far vedere la
> struttura di un flusso senza chiedere una carta di credito. Con una chiave
> vera, le risposte sono vere. Non abbiamo voluto nascondere la differenza.

**«Quanto ci avete messo? Quanto codice c'è?»**
> Oltre quaranta moduli JavaScript, organizzati per responsabilità:
> persistenza, adattatori AI, canvas, motore di esecuzione, guardrail,
> Knowledge Base, pubblicazione. Il dettaglio è nell'appendice 3.A.

**«Si installa?»**
> Sì, come applicazione sul computer e sul telefono — è una Progressive Web
> App — e funziona anche senza rete, perché il database è locale.

---

## B · Sulla governance e la conformità

**«Chi garantisce che un agente costruito da un dipendente non faccia danni?»**
> Tre cose, in ordine. Primo: i **controlli** sono blocchi della palette —
> mascheramento dati, validazione dell'output, approvazione umana, limiti di
> frequenza — e si vedono sulla tela, non sono nascosti in una
> configurazione. Secondo: la **validazione** blocca l'esecuzione di un flusso
> incompleto. Terzo: la **pubblicazione** passa da una persona, e chi
> costruisce non si approva da solo.

**«Come gestite l'AI Act?»**
> Il prototipo implementa i presidi applicativi: tracciabilità completa di
> ogni esecuzione, gate umano sulle azioni ad alto rischio, audit log,
> informazioni di governance visibili sulla scheda di ogni agente prima
> dell'installazione. La classificazione del rischio e la pipeline di
> validazione in sei fasi sono descritte nel capitolo 2.

**«Shadow AI: non rischiate di aumentarlo, dando a tutti uno strumento?»**
> È la domanda giusta, ed è il ragionamento opposto al nostro. Lo shadow AI
> nasce perché le persone usano strumenti che l'azienda non vede. Dare uno
> strumento **governato**, che è anche più comodo di quelli di nascosto, è il
> modo per far rientrare quell'uso dentro il perimetro. Infatti lo misuriamo:
> shadow AI rate sotto il 20% è uno dei target del cruscotto.

**«Cosa succede se un modello cambia o viene ritirato?»**
> La piattaforma non è legata a un fornitore: l'elenco dei modelli è in un
> punto solo del codice, e un flusso costruito su un fornitore si esegue su un
> altro cambiando una tendina. Se un fornitore non risponde, la chiamata passa
> automaticamente a un altro collegato, e il registro lo dichiara.

---

## C · Sul change management e l'adozione *(l'aggancio con Suzana)*

**«Perché un dipendente dovrebbe usarla?»**
> Perché gli risolve un problema suo, non uno dell'azienda. Il primo agente
> che costruisce è quello che gli toglie la cosa che odia fare. La
> gamification e le sfide servono dopo, per tenere viva l'abitudine — non per
> crearla.

**«Come evitate che la usino in dieci e poi muoia?»**
> Tre leve misurate: gli **AI Champion** per dipartimento, che sono persone
> non ruoli; gli **hackathon** quadrimestrali, che danno una scadenza e un
> pubblico; e il **riuso** — un agente che qualcuno pubblica e altri trenta
> installano vale molto più di trenta agenti costruiti una volta sola. Infatti
> l'Agent Reuse Rate è un KPI, non un effetto collaterale.

**«Il Learning Hub non è l'ennesimo corso che nessuno fa?»**
> Per questo non è un corso a parte. Si impara sugli schermi veri, e ogni
> lezione finisce con un pulsante che porta nel punto esatto della piattaforma
> di cui ha appena parlato. E c'è la **sandbox**: si prova davvero senza poter
> rompere niente, perché lì non si salva e non si pubblica. Il KPI che
> guardiamo è l'NPS, non le ore erogate: se il corso non piace, il problema è
> il corso.

**«E la resistenza dei manager intermedi?»**
> È il punto più delicato, e il piano di comunicazione lo tratta a parte: per
> loro il messaggio non è «imparate a usare l'AI», è «il vostro team recupera
> due ore a settimana e voi lo vedete su un cruscotto». La narrazione è su
> misura per quattro pubblici diversi, non una sola.

---

## D · Sul business

**«Come guadagnate?»**
> Pricing modulare per componente attivo, con un assessment preliminare che
> qualifica la maturità del cliente e lo indirizza su tre percorsi. Chi non è
> pronto non lo vendiamo: un PoC fallito costa più di una vendita mancata.

**«Perché il mid-market e non le grandi aziende?»**
> Perché le grandi hanno già team dedicati e piattaforme loro. Il mid-market
> italiano è a 8,2% di adozione contro il 13,5% europeo: ha lo stesso problema
> e nessuno degli strumenti. Ed è abbastanza grande da avere processi
> strutturati, abbastanza piccolo da non avere un reparto AI.

**«Qual è la metrica che vi dice che sta funzionando?»**
> Ore di lavoro risparmiate per dipendente all'anno. Non il numero di agenti
> creati: quello si gonfia da solo e non vuol dire niente — è la legge di
> Goodhart. Il gate della fase due è due ore a settimana per utente.

**«Chi sono i concorrenti?»**
> Gli strumenti di automazione generalisti sanno costruire flussi ma non
> accompagnano le persone, e le piattaforme AI enterprise accompagnano le
> persone ma restano in mano all'IT. Il nostro spazio è nel mezzo: la
> costruzione e l'adozione nello stesso prodotto.

---

## E · Le domande scomode (preparale, arrivano)

**«La demo è registrata: perché non dal vivo?»**
> Per il tempo e per la rete. La piattaforma è aperta adesso e la trovate sul
> vostro telefono col QR: quello che volete vedere dal vivo, lo apriamo.

**«Questo prototipo è pronto per andare in produzione?»**
> No, ed è dichiarato. Mancano il livello server, l'autenticazione aziendale,
> il proxy di inferenza e la fatturazione: sono scritti nelle semplificazioni
> del prototipo. Quello che il prototipo dimostra è che il modello di
> interazione regge — che una persona non tecnica arriva davvero da un
> problema a un agente funzionante.

**«Quanto costa far girare tutto questo in token?»**
> La piattaforma conta i token di ogni chiamata, per utente, agente e
> fornitore: lo vedete nel profilo. Nel modello economico il budget è
> dimensionato su circa 3.000 utenti attivi con tariffa blended, e c'è una
> riserva per la volatilità dei consumi. Il numero è nel capitolo sei.

**«Chi di voi ha scritto il codice?»** *(se la domanda è sul contributo)*
> Rispondi con il vero riparto del lavoro del gruppo. Non improvvisare.

**«Un dipendente può esportarsi tutti i dati aziendali?»**
> Nel prototipo l'export esiste ed è voluto: serve a dimostrare che non c'è
> vendor lock-in. In un'installazione vera quella funzione è sotto RBAC, come
> tutto il resto: è il capitolo 2, controllo degli accessi basato sui ruoli.

---

## F · Se chiedono di vedere qualcosa dal vivo

Vedi `COLLAUDO-E-DEMO-DAL-VIVO.md` per il percorso da seguire. In sintesi, i
tre che reggono meglio una richiesta improvvisa:

1. **«Costruitene uno adesso»** → tre blocchi, Esegui, «Perché questo
   risultato». Due minuti.
2. **«Fatemi vedere la governance»** → aggiungi il mascheramento a un flusso
   esistente, eseguilo, mostra la riga nel registro. Un minuto.
3. **«Come si impara a usarla?»** → Learning Hub, apri una lezione, premi
   «Provalo adesso», entra in sandbox. Un minuto e mezzo.

---

# Parte tecnica approfondita

Per una commissione con più docenti, dove almeno uno entra nel merito. Le
risposte qui sotto sono **verificate sul codice**: ogni funzione citata esiste
e fa quello che è scritto. Se una domanda va oltre, la risposta onesta è
«questo nel prototipo non c'è, nel prodotto è previsto così» — con il
riferimento al capitolo.

## G · Knowledge Base: come è costruita davvero

**«Come segmentate i documenti? Chunk a lunghezza fissa?»**
> No, e di proposito. Il tipo di documento viene riconosciuto e la
> segmentazione cambia di conseguenza: una **normativa** si taglia per articolo
> o comma, un **contratto** per clausola conservando l'intestazione di sezione,
> una **procedura** per passo con il titolo gerarchico, una **FAQ** per scambio
> domanda-risposta, una **tabella** per riga replicando le intestazioni. Solo
> il testo non strutturato si taglia a paragrafi con sovrapposizione, con un
> tetto di 900 caratteri. Il motivo è semplice: un taglio a lunghezza fissa
> spezza un articolo di legge a metà frase, e la porzione recuperata diventa
> inutilizzabile.

**«Usate embedding veri o è ricerca lessicale?»**
> Il documento dice «vettorizzazione tramite TF-IDF **o** embedding». Nel
> prototipo è la prima: frequenze dei termini, BM25 con IDF, e un riordino
> finale. La ragione è architetturale, non di comodo — la piattaforma gira
> interamente nel browser, senza server, quindi non c'è un servizio di
> embedding da chiamare né un vector database dove scriverli. Nel prodotto, il
> capitolo 2 prevede il vector database con le tre partizioni logiche. Il
> punto che volevamo dimostrare — permessi applicati prima del punteggio,
> porzioni citate con la fonte, recupero ispezionabile — non cambia con il
> motore sotto.

**«Che cos'è esattamente il riordino?»**
> Un secondo passaggio **solo sui candidati migliori**, per non pagarlo su
> tutto l'insieme. Combina tre segnali: quanti termini della domanda compaiono
> davvero nel testo, se la domanda compare per intero, e quanto i termini sono
> vicini fra loro. Il punteggio finale pesa per il 60% il BM25 e per il 40%
> questi. Nel pannello si vedono entrambi i punteggi, prima e dopo.

**«E i permessi?»**
> Filtro **prima** del punteggio, non dopo: le porzioni non autorizzate non
> raggiungono mai né il calcolo né il modello. È una differenza che conta,
> perché nascondere un risultato in visualizzazione lascia comunque il
> contenuto dentro il prompt. Tre livelli di visibilità — aziendale, di
> reparto, personale — più la riservatezza del singolo documento.

**«Come fa un agente a usare un documento?»**
> Due strade. Il nodo trigger può prendere uno o più documenti dalla Knowledge
> Base e passarli come dato in ingresso, con un'intestazione per ciascuno, così
> il modello sa da dove viene ogni pezzo. Oppure il nodo AI attiva «Usa
> Knowledge Base»: prima della chiamata parte il recupero, e le porzioni
> entrano nel prompt **con la citazione della fonte accanto**. C'è poi un
> blocco di controllo, «Verifica di fondatezza», che confronta la risposta con
> le fonti recuperate: se dice cose che le fonti non supportano, lo segnala o
> blocca il flusso, a seconda di come è configurato.

**«Potete dimostrare che il recupero funziona, non solo dirlo?»**
> Sì, ed è nel pannello: «Prova il recupero». Si scrive una domanda e si vede
> quali porzioni di quali documenti escono, con il punteggio. È pensato
> esattamente per questo: rendere ispezionabile il RAG prima di affidargli un
> flusso.

## H · Integrazione dei modelli AI

**«Come integrate i fornitori? Usate una libreria?»**
> Nessun SDK: un **adattatore per fornitore**, perché i quattro parlano
> protocolli diversi. Anthropic vuole `x-api-key` e un campo `system`
> separato; OpenAI e Mistral usano `Authorization: Bearer` e il ruolo `system`
> dentro l'array dei messaggi; Google mette la chiave in query string e chiama
> i messaggi `contents`. L'adattatore traduce la stessa richiesta nei tre
> formati e normalizza la risposta — testo, token consumati, eventuale
> invocazione di strumenti — in una struttura unica. Il resto della
> piattaforma non sa quale fornitore ha risposto.

**«Il modello si sceglie globalmente o per nodo?»**
> Per nodo, ed è una scelta precisa: in uno stesso flusso una classificazione
> può girare su un modello economico e una stesura su uno più capace. La
> chiave invece sta sul fornitore, non sul nodo. Se il fornitore scelto non
> risponde — rete, limite di frequenza, servizio giù — la chiamata passa
> automaticamente a un altro collegato, e il registro lo dichiara: non si
> nasconde una sostituzione.

**«E se esce un modello nuovo dopo il rilascio?»**
> Ogni fornitore ha «Altro modello…» in fondo alla tendina: si incolla
> l'identificativo esatto preso dalla documentazione del fornitore e viene
> inviato così com'è. Abbiamo scelto di **non** scrivere a mano gli
> identificativi dei modelli annunciati di recente: un identificativo sbagliato
> di una lettera non dà un avviso, dà un errore al primo Esegui. Meglio un
> campo libero di una lista che invecchia.

**«Le chiavi dove finiscono?»**
> In `sessionStorage`: vivono in quella scheda del browser finché non la si
> chiude. Non vanno su disco, non entrano negli export, non sono condivise fra
> schede. E restano leggibili da chi apre la console di quella scheda: è una
> comodità da prototipo, e lo dichiariamo nel pannello stesso. In produzione è
> un secret manager lato server, capitolo 2.

**«Come gestite un rate limit o un errore 500?»**
> Il ripiego riguarda solo i guasti di trasporto. **Non** si ripiega su una
> chiave rifiutata — 401 o 403 — perché lì il problema è la configurazione di
> quel fornitore, e nasconderlo con un altro impedirebbe di accorgersene. E
> non si ripiega su un'interruzione voluta da chi sta usando la piattaforma.

**«Il tool calling come lo gestite, visto che ogni fornitore ha la sua
sintassi?»**
> È esattamente il lavoro dell'adattatore: la definizione dello strumento è
> una sola, e viene tradotta nel formato di ciascun fornitore. Quando il
> modello invoca uno strumento, il motore esegue il nodo corrispondente del
> flusso e gli restituisce l'esito. Se il modello richiede due volte lo stesso
> strumento con gli stessi argomenti, il ciclo si interrompe: è la protezione
> contro il loop che altrimenti consuma token all'infinito.

## I · La costruzione conversazionale

**«Come fa il modello a tradurre una frase in nodi della piattaforma?»**
> Non "conosce" la piattaforma: gliela diamo. Il system prompt contiene il
> **catalogo completo della palette**, generato al momento — nomi esatti dei
> trigger, dei controlli, degli output, e per ogni connettore le chiavi di
> configurazione con i campi obbligatori. Il modello deve rispondere con un
> JSON di nodi e archi usando solo quei nomi. C'è una regola vincolante
> esplicita: se una capacità non ha un blocco dedicato, non deve inventarne
> uno, deve usare il più vicino e mettere quella capacità nella sua
> configurazione. Un blocco con un nome fuori elenco non ha parametri, e il
> flusso non partirebbe.

**«E se lo inventa lo stesso?»**
> Succede, ed è il motivo per cui c'è un passaggio di normalizzazione dopo: i
> nomi generati vengono riallineati alla palette, e quello che non corrisponde
> resta visibile nella verifica con il blocco di ricambio già proposto. In più
> il risultato **non finisce sulla tela**: compare come anteprima con l'elenco
> dei nodi proposti, e si accetta o si annulla. Anche dopo aver accettato,
> Ctrl+Z torna indietro.

**«In modifica riscrive tutto il flusso?»**
> No, ed è la parte più delicata. In modifica il modello riceve il grafo con
> gli **id reali** dei nodi e deve restituire solo le operazioni minime —
> aggiungi, aggiorna, rimuovi, collega, scollega — riferite a quegli id. I nodi
> che la richiesta non riguarda devono restare intatti, e i controlli imposti
> da una politica organizzativa sono marcati: il modello non può rimuoverli.

**«Che succede se non c'è una chiave?»**
> La costruzione conversazionale si disattiva e lo dichiara, perché è il
> modello a interpretare la richiesta: senza, non c'è niente da interpretare.
> La tela resta usabile trascinando i blocchi. Non simuliamo una generazione.

## J · Esecuzione, codice esportato, architettura

**«Come eseguite il grafo? In che ordine?»**
> Ordinamento topologico: i nodi senza dipendenze reciproche partono in
> parallelo. Ogni esecuzione emette eventi tipizzati — avvio, esito di ogni
> nodo, ramo scelto da una condizione, recupero dalla Knowledge Base,
> intervento di un controllo — e sono quelli a comporre il registro e la
> risposta di «Perché questo risultato».

**«Dove sta il Python di cui parla la documentazione?»**
> È un **export**, non il motore. Dal Builder, «Python» genera uno script
> autonomo che riproduce quel flusso: chiamate HTTP ai fornitori con
> `requests`, la chiave letta da variabile d'ambiente, la stessa sequenza di
> nodi. Serve a due cose: dimostrare che non c'è lock-in — il flusso si porta
> via ed è leggibile da chiunque — e permettere di metterlo in uno scheduler o
> in una pipeline aziendale senza la piattaforma. Il motore che gira nel
> prototipo è JavaScript nel browser.

**«Perché un database SQLite nel browser e non un backend?»**
> Perché il prototipo deve poter essere aperto da chiunque, subito, senza
> credenziali e senza che nessuno debba fidarsi di dove finiscono i suoi dati
> — e lo state facendo adesso dal telefono. SQLite compilato in WebAssembly dà
> un database vero, con query vere: lo schema è lo stesso che avrebbe il
> prodotto, e si esporta in un file `.sqlite` apribile con qualunque client
> standard. È una scelta di dimostrabilità, ed è dichiarata fra le
> semplificazioni del prototipo.

**«Quindi i dati di due utenti stanno nello stesso database?»**
> Sì, con una colonna di attribuzione su ogni tabella: ogni query filtra sulla
> persona connessa. È la simulazione di un multi-tenant a livello di riga. Nel
> prodotto la separazione è per tenant con RBAC, capitolo 2. Nel prototipo si
> vede uscendo e rientrando con un altro account: cambiano agenti, esecuzioni,
> progressi, badge.

**«Come gestite un flusso che cicla all'infinito?»**
> Due presidi. Il nodo Loop non ripete un numero fisso di volte: conta gli
> elementi che i nodi a monte hanno davvero prodotto. E ha un **tetto di
> sicurezza** dichiarato: superato, l'esecuzione si ferma e il registro lo
> scrive, invece di bloccarsi in silenzio.

**«Quanto è grande il codice? Come è organizzato?»**
> Oltre quaranta moduli JavaScript, separati per responsabilità: persistenza,
> adattatori AI, canvas, motore di esecuzione, guardrail, Knowledge Base,
> pubblicazione, e i moduli delle singole sezioni. Niente framework: sono
> script classici, perché il prototipo deve aprirsi da un file server
> qualunque senza una build. La mappatura dei moduli sui livelli
> architetturali è in Appendice 3.A.

**«I numeri che mostrate — token, punteggi, percentuali — da dove vengono?»**
> Sono calcolati, non scritti. È stata una regola per tutto il progetto: un
> numero mostrato dev'essere calcolato dai dati, non dichiarato. I token sono
> contati per utente, agente, nodo e fornitore, misurati dove il fornitore li
> riporta e stimati altrove — e dove sono stimati la piattaforma lo scrive.

**«Avete fatto test automatici?»**
> No, e lo diciamo: non c'è una suite di test. La verifica è stata manuale e
> sistematica, con una lista di collaudo ripetuta a ogni rilascio. Su un
> prototipo di dimostrazione è stata una scelta di priorità; su un prodotto
> non lo sarebbe.

---

# Parte K · Domande su quello che si vede nella demo

Questa sezione segue l'ordine del video: se una domanda arriva «su quella cosa
che avete appena mostrato», è quasi certamente qui. Sono anche i punti dove
conviene **offrire** un approfondimento, se la discussione va bene e c'è tempo.

## Sull'installazione e configurazione dell'agente *(minuto 0:18–1:34)*

**«Quindi chiunque può installare qualsiasi agente?»**
> Nel prototipo sì, perché è una dimostrazione. In produzione l'installazione
> passa dai ruoli: il capitolo 2 definisce RBAC, e l'ambito di pubblicazione di
> un agente — reparto, organizzazione, pubblico — decide già chi lo vede. Un
> agente pubblicato solo per Finance non compare nel catalogo di HR.

**«Cambiando il modello cambia il risultato: come fate a saperlo?»**
> È proprio il motivo per cui la scelta è sul singolo nodo e non globale: lo
> stesso agente si esegue su due modelli e si confrontano i due registri, che
> riportano quale modello ha risposto. Senza quella riga, confrontare due
> esecuzioni non significherebbe niente.

**«L'agente installato è una copia o un collegamento?»**
> Una copia. L'originale nel catalogo resta intatto: si può modificare la
> propria senza toccare quella di nessun altro. Se l'autore pubblica una
> versione nuova, chi l'aveva installata riceve la notifica e decide se
> aggiornare — non viene aggiornato d'ufficio.

## Sulla Knowledge Base *(minuto 1:34–1:59)*

> **È la sezione su cui conviene offrire l'approfondimento**: nel video dura
> venticinque secondi di proposito — si vede che i documenti ci sono, che sono
> indicizzati e che si esportano, e basta — ma è quella dove un docente tecnico
> trova più da chiedere, ed è quella dove le risposte sono più solide. Se la
> discussione va bene, proponi tu: «se vi interessa, vi mostro come viene
> segmentato un documento e come si prova il recupero prima di fidarsene».

**«Perché segmentare in modo diverso a seconda del documento?»**
> Perché un taglio a lunghezza fissa spezza un articolo di legge a metà frase,
> e la porzione recuperata diventa inutilizzabile: il modello la riceve senza
> il soggetto. Una normativa si taglia per articolo, un contratto per clausola
> conservando l'intestazione di sezione, una procedura per passo, una FAQ per
> scambio domanda-risposta. Solo il testo libero si taglia a paragrafi con
> sovrapposizione.

**«Come fa a sapere che tipo di documento è?»**
> Lo riconosce dalla struttura: un documento con «Art. 1», «Art. 2» è una
> normativa; uno con una riga di intestazioni e righe separate da punto e
> virgola è una tabella. Non è una classificazione semantica, è il
> riconoscimento di una forma — ed è volutamente conservativo: nel dubbio
> ricade sul taglio a paragrafi.

**«E se il documento è riservato?»**
> Il filtro sui permessi è applicato **prima** del punteggio: le porzioni non
> autorizzate non raggiungono né il calcolo né il modello. È diverso da
> nasconderle in visualizzazione, che le lascerebbe comunque dentro il prompt.
> Tre livelli — aziendale, reparto, personale — più la riservatezza del
> singolo documento.

**«Da dove arrivano i documenti in un'installazione vera?»**
> SharePoint, Google Drive, CRM/ERP, object storage S3, oltre al caricamento
> manuale e alla conoscenza prodotta dagli agenti stessi. Nel prototipo c'è il
> caricamento manuale, perché gli altri richiedono il livello server.

## Sulla riparazione di un flusso *(minuto 3:00–3:19)*

**«Come fa a sapere qual è il blocco giusto?»**
> Con un punteggio semplice e prevedibile, calcolato **solo fra i blocchi dello
> stesso tipo**: contenimento di una stringa nell'altra — che è il caso più
> frequente, «Webhook CRM» → «Webhook» — parole in comune, prefissi. Sotto una
> soglia non propone niente: un suggerimento sbagliato è peggio di nessun
> suggerimento.

**«E se sbaglia?»**
> È un pulsante, non un automatismo: si vede cosa propone prima di premerlo, e
> dopo Ctrl+Z torna indietro. Abbiamo scelto deliberatamente di non ripararlo
> da solo all'apertura.

**«Non è un modo per nascondere che la piattaforma genera flussi rotti?»**
> No, e la distinzione è importante: i flussi che la piattaforma genera dalla
> chat vengono riallineati alla palette prima di arrivare sulla tela. Quello
> che si ripara qui è un flusso **importato** — scritto a mano, esportato da
> un altro strumento, o arrivato da un collega. È il caso reale di
> un'organizzazione in cui gli agenti circolano.

## Sulla formazione e le certificazioni *(minuto 4:41–6:20)*

**«Le certificazioni valgono qualcosa fuori dall'azienda?»**
> No, e non lo pretendiamo: sono interne, e certificano l'uso della
> piattaforma. Il valore è dentro l'organizzazione — un livello sblocca
> privilegi reali, come poter pubblicare nel catalogo aziendale o revisionare
> le pubblicazioni di altri. Non è un diploma, è un permesso guadagnato.

**«Chi garantisce che il quiz non venga passato a caso?»**
> Niente, ed è una scelta: l'obiettivo non è selezionare, è accompagnare. Il
> controllo vero è a valle — un agente pubblicato passa dalla revisione di una
> persona, indipendentemente dai badge di chi lo ha scritto.

**«La sandbox è un ambiente separato?»**
> No, ed è il punto: è la stessa piattaforma, con la palette ridotta, dati
> finti e salvataggio e pubblicazione disattivati. Un ambiente separato
> costringe a reimparare tutto al primo uso vero. Qui si impara sugli stessi
> schermi.

**«Come misurate che la formazione funziona?»**
> NPS del Learning Hub come KPI primario, non le ore erogate. Se il corso non
> piace, il problema è il corso. Più completion rate e skill coverage, che sono
> nel cruscotto del capitolo 6.

## Sul consumo e le connessioni *(minuto 6:20–6:55)*

> **Le connessioni non sono più nel video.** In una presentazione sono un
> dettaglio che chi guarda non sa dove collocare, quindi sono uscite dalla demo
> breve — ma la domanda su «come vi collegate a un ERP» arriva lo stesso, e la
> risposta è qui sotto. Se vogliono vederlo, il pannello è a due clic dalla
> piattaforma aperta.

**«Quei numeri di token sono reali?»**
> Sono contati su ogni chiamata: misurati dove il fornitore li riporta nella
> risposta, stimati altrove — e dove sono stimati la piattaforma lo scrive
> accanto. È stata una regola per tutto il progetto: un numero mostrato
> dev'essere calcolato, non dichiarato.

**«Quanto costerebbe davvero in azienda?»**
> Il dimensionamento è nel capitolo 6: il budget è costruito su circa 3.000
> utenti attivi con una tariffa blended, più una riserva per la volatilità dei
> consumi. Il prototipo dà il contatore su cui quel modello si appoggia.

**«Le connessioni contengono credenziali: dove stanno?»**
> Nel prototipo nel database locale, come tutto il resto, ed è dichiarato. In
> produzione è un secret manager lato server con rotazione automatica dei
> token OAuth: capitolo 2, e la tabella delle connessioni certificate in
> appendice.

---

## Cosa offrire di approfondire, e in che ordine

Se la discussione va bene e c'è tempo, **proponi tu** un approfondimento: è il
modo per guidare le domande invece di subirle. In ordine di resa:

1. **La Knowledge Base dentro** — apri un documento, mostra la segmentazione,
   fai una ricerca dal vivo. È la cosa più tecnica che regge meglio.
2. **La riparazione di un flusso** — costruisci un nodo con un nome sbagliato
   e fallo riparare. Dura un minuto e fa un effetto sproporzionato.
3. **Perché questo risultato** — su un'esecuzione già fatta. Risponde da solo
   alla domanda sull'AI Act.
4. **La sandbox** — se la commissione è più orientata al change management che
   alla tecnica.

E uno da **non** offrire mai spontaneamente: il database (📦). È affascinante
per un tecnico e apre tre domande scomode con tutti gli altri.

---

# Parte L · Implementazione: «ma l'AI c'è davvero?»

È la domanda sotto tutte le domande tecniche. Le risposte qui sono verificabili
aprendo il codice: ogni funzione citata esiste con quel nome.

## L1 · Dove sta, materialmente, la parte AI

**«Fatemi capire: il modello dove gira e chi lo chiama?»**
> Il modello gira dal fornitore, e lo chiama il browser. In `js/ai-client.js`
> c'è una funzione per fornitore che costruisce la richiesta HTTP nel formato
> che quel fornitore si aspetta, la manda con `fetch` e normalizza la risposta.
> Non c'è un server nostro in mezzo: è una scelta del prototipo — nel prodotto
> quella chiamata passa dal proxy di inferenza del Model Layer, capitolo 2,
> punto 5.

**«Mi fate vedere il punto esatto in cui parte la chiamata?»**
> Sì: `callAIUnaVolta(prompt, systemPrompt, config)`. Dentro c'è un `if` per
> fornitore. Per Anthropic: `POST https://api.anthropic.com/v1/messages`, header
> `x-api-key` e `anthropic-version`, corpo con `system` separato dai `messages`.
> Per OpenAI e Mistral: `/chat/completions`, header `Authorization: Bearer`, il
> system prompt come primo elemento dell'array `messages`. Per Google:
> `generativelanguage.googleapis.com`, chiave in query string, i messaggi si
> chiamano `contents`. Tre dialetti, una sola struttura di ritorno:
> `{text, usage, provider}`.

**«E se la chiamata fallisce?»**
> Sopra `callAIUnaVolta` c'è `callAIConRipiego`, che su un guasto di
> **trasporto** riprova con un altro fornitore collegato e lo dichiara nel
> registro. Non ripiega su un 401 o 403: lì il problema è la configurazione di
> quel fornitore, e nasconderlo con un altro impedirebbe di accorgersene. Non
> ripiega nemmeno su un'interruzione voluta. Sopra ancora c'è `callAI`, in
> `js/consumo.js`, che registra i token consumati.

**«Il conteggio dei token come lo fate?»**
> Dove il fornitore li riporta nella risposta — `usage.input_tokens` per
> Anthropic, `usage.prompt_tokens` per OpenAI, `usageMetadata` per Google — si
> prendono quelli. Dove non li riporta, si stimano a circa quattro caratteri
> per token e la riga viene **marcata come stimata**. Ovunque si mostrano, si
> dice quanti sono misurati e quanti stimati.

**«Il tool calling è vero o simulato?»**
> Vero: la definizione dello strumento è una sola e l'adattatore la traduce nel
> formato di ciascun fornitore. Quando il modello invoca uno strumento, il
> motore esegue il nodo corrispondente del flusso e gli restituisce l'esito,
> poi il ciclo riparte. Lo si vede nel registro: «Il modello invoca lo
> strumento X» seguito dall'esito. C'è una protezione: se il modello richiede
> due volte lo stesso strumento con gli stessi argomenti, il ciclo si
> interrompe — altrimenti consumerebbe token all'infinito.

**«E senza chiave, cosa succede davvero?»**
> La chiamata non parte. Il nodo restituisce una risposta **simulata**,
> dichiarata in ogni riga del registro, con il fornitore `quota-prova` nel
> conto dei token tenuto separato. Il flusso mostra la struttura e il
> comportamento dei controlli, non la qualità del contenuto. Abbiamo preferito
> dichiararlo quattro volte piuttosto che lasciare il dubbio.

**«Ma se la risposta è finta, come fa il controllo a valle a convalidarla?»**
> Perché la risposta simulata ha la **forma** che il prompt ha chiesto, non una
> forma propria. Se il nodo scrive «Rispondi SOLO JSON: {punteggio,
> motivazione}», la simulazione legge quelle chiavi dal prompt e produce un
> oggetto con quei campi (`chiaviRichiesteDalPrompt` in `js/consumo.js`). Senza,
> un nodo «Convalida output» a valle avrebbe respinto **sempre**, e il blocco
> non avrebbe detto niente sul flusso: avrebbe detto solo che la simulazione
> ignorava il prompt.
>
> I valori restano dichiaratamente finti — `simulato:true` e la nota viaggiano
> dentro il JSON, quindi anche un file o una mail prodotti dal flusso lo dicono.
> È la distinzione che tiene: la simulazione serve a mostrare che il flusso
> **regge**, non a far credere che il contenuto sia vero.

## L2 · Il motore di esecuzione

**«Come eseguite il grafo?»**
> `js/agent-runtime.js`. Ordinamento topologico sul grafo (`rtGrafoEffettivo`):
> i nodi senza dipendenze reciproche partono in parallelo. Ogni tipo di nodo ha
> la sua funzione di esecuzione — `rtRunAiNode`, `rtRunConnector`,
> `rtRunSubAgent` — e ogni passaggio emette un **evento tipizzato** (`rtEmit`). Il
> registro, la traccia e la risposta di «Perché questo risultato» leggono
> quegli eventi: non sono tre meccanismi, è uno solo.

**«Cosa succede se un nodo non ha i dati per lavorare?»**
> Il flusso **non parte**. Non «parte e fallisce al terzo nodo»: un invio
> parziale lascia metà del lavoro fatto e metà no, e quello stato non sarebbe
> descrivibile nel registro. Il controllo (`rtPrevolo`) sta nel motore e non nel
> Builder, perché lì passano tutte le strade — il pulsante Esegui, la
> pianificazione, la scheda del marketplace, la delega da un orchestratore.
> Prima esisteva solo nel Builder: da ogni altra strada il nodo partiva con il
> destinatario vuoto e l'esecuzione si chiudeva «conclusa» senza aver spedito
> niente a nessuno.

**«E se non parte, dove lo vedo?»**
> Nella finestra degli errori, non nel registro. Il registro di esecuzione
> racconta cosa è successo mentre il flusso girava: se non è partito non è
> successo niente, e riempirlo di righe rosse farebbe sembrare che qualcosa sia
> stato *tentato*. Per la stessa ragione non viene registrata nemmeno
> un'esecuzione nello storico: contarla come fallita falserebbe i tassi di
> successo che il Monitoraggio calcola su quelle righe.
>
> Quando invece il flusso parte e **poi** si rompe, il registro riporta tutto
> riga per riga e la finestra elenca i nodi coinvolti, con il tipo di guasto —
> configurazione, controllo, delega, azione esterna, errore interno, decisione —
> e il rimedio per ciascuno. Un errore dentro un sotto-agente risale
> all'orchestratore con il nome del flusso da cui viene.
>
> L'unica eccezione è l'esecuzione **pianificata**: lì la riga si scrive anche
> se il flusso non parte, perché una pianificata che non parte alle sette del
> mattino senza lasciare traccia sarebbe un silenzio indistinguibile da «tutto a
> posto».

**«Un agente può chiamarne un altro?»**
> Sì: il blocco «Chiamata agente» (`rtRunSubAgent`). È l'orchestrazione
> multi-agente del capitolo 2, nella forma minima: un agente delega a un altro
> agente salvato e ne attende il risultato, con il passaggio di controllo e il
> ritorno visibili nella traccia. Quello che il prototipo **non** fa è il
> routing automatico — decidere da solo se scomporre un task fra più agenti:
> quella è la parte Model Abstraction, e richiede il server.

**«E il sotto-agente è una scatola nera?»**
> No. Dal pannello del nodo di delega c'è «Apri … nel Builder»: si entra nel
> flusso delegato, lo si guarda com'è fatto, e una riga in testa riporta
> all'orchestratore sul nodo esatto da cui si era partiti. Il pannello mostra
> anche quanti nodi ha e se è in produzione.

**«L'output del sotto-agente dove finisce?»**
> Diventa l'input del nodo collegato a valle, e il registro scrive quanti
> caratteri sono passati — così il travaso si verifica leggendo, non per
> fiducia. Se la delega **fallisce**, il flusso dell'orchestratore si
> interrompe: prima passava a valle l'input che il sotto-agente aveva
> *ricevuto*, presentato come il risultato che non aveva prodotto, e il nodo
> successivo lavorava su quel testo senza che niente lo dicesse.
>
> E se il sotto-agente incontra un'**approvazione umana**, l'orchestratore si
> sospende insieme a lui: autorizzando, riprende prima il sotto-agente e poi il
> flusso chiamante. È il caso dell'agente «Rapporto settimanale multi-agente»,
> che si può mostrare dal vivo.

**«Come gestite i cicli infiniti?»**
> Tre punti. Il nodo Loop conta gli elementi che i nodi a monte hanno davvero
> prodotto, non un numero fisso, e ha un tetto di sicurezza dichiarato:
> superato, l'esecuzione si ferma e il registro lo scrive. Il ciclo
> modello-strumento si interrompe sulla richiesta ripetuta. E la validazione
> pre-esecuzione rifiuta i cicli nel grafo.

**«Il codice Python esportato è lo stesso motore?»**
> No, ed è importante dirlo: è una **traduzione**. Lo script riproduce quel
> flusso con `requests` e la chiave da variabile d'ambiente, per dimostrare
> che non c'è lock-in e per poterlo mettere in uno scheduler aziendale. Il
> motore del prototipo è JavaScript nel browser. Sono due implementazioni
> della stessa sequenza, non lo stesso codice.

## L3 · I guardrail: come sono fatti dentro

**«Il mascheramento dei dati come funziona?»**
> Espressioni regolari su categorie dichiarate — codice fiscale, IBAN, partita
> IVA, email, telefono — applicate al testo **prima** che entri nel prompt. Il
> registro dice quanti identificatori ha mascherato, e c'è l'opzione di
> ripristinarli nell'output finale: il modello lavora sul testo mascherato, chi
> legge il risultato rivede il dato. È un presidio applicativo, non crittografia:
> in produzione si affianca alla cifratura del Data Layer.

**«La verifica di fondatezza come fa a dire che una risposta regge?»**
> Confronta la risposta con le porzioni recuperate: quanta parte delle
> affermazioni trova riscontro nelle fonti. Sotto la soglia configurata
> segnala o blocca, a scelta sul nodo. Non è un giudizio semantico profondo —
> è una misura di sovrapposizione — e per questo la soglia è un parametro
> visibile e non un numero nascosto nel codice.

**«L'approvazione umana sospende davvero l'esecuzione?»**
> Sì: l'esecuzione va in stato `waiting` e resta lì. Non è un avviso che si
> può ignorare: il flusso non prosegue finché qualcuno non decide, e nel Log
> Esecuzioni quella riga è distinguibile da un successo e da un errore. È il
> gate umano che il capitolo 2 chiede obbligatorio per i task ad alto rischio.

---

# Parte M · Coerenza con il capitolo 2

Il capitolo 2 descrive l'architettura di **destinazione**; il prototipo ne
implementa la parte applicativa. Questa tabella è la risposta a «quanto di
quello che avete scritto esiste davvero?», ed è meglio averla in testa che
improvvisarla.

| Capitolo 2 | Nel prototipo | Cosa manca e perché |
|---|---|---|
| **User Layer** — web e mobile via SSO | Interfaccia web e mobile, installabile come PWA | L'SSO: richiede un identity provider. Nel PoC profili dimostrativi |
| **Application Layer** — microservizi Marketplace, Builder, Learning, Community, Orchestration | Tutti e cinque presenti come moduli separati per responsabilità | Sono moduli nello stesso processo, non microservizi distribuiti |
| **Integration Layer** — API Gateway, connettori certificati, event bus, secrets manager | 60+ connettori con configurazione e campi obbligatori; eventi tipizzati per ogni esecuzione | Gateway e secrets manager: sono lato server |
| **Data Layer** — PostgreSQL + Data Lake + Vector DB | SQLite via WebAssembly con lo **stesso schema** relazionale; indice lessicale per il RAG | Vector DB e Data Lake. Il PoC usa TF-IDF + BM25, come il capitolo 3 dichiara |
| **Model Layer** — registro LLM-agnostic, routing, endpoint locale | 4 fornitori + endpoint locale + custom, scelta per nodo, ripiego automatico | Il routing automatico verso il modello più economico idoneo |
| **Agent Identity e Governance** — gate umano | Blocco «Approvazione umana» che sospende davvero l'esecuzione | L'identità per agente: serve il livello server |
| **Agent Runtime isolato** | Sandbox didattica: palette ridotta, dati finti, salvataggio e pubblicazione disattivati | L'isolamento vero è di processo, non applicativo |
| **Communication Fabric** — invocazione strumenti, comunicazione fra agenti | Tool calling verso i nodi del flusso; blocco «Chiamata agente» | MCP come protocollo: previsto, non implementato |
| **Observability e Safety** | Traccia granulare, Monitoraggio a sette aree, consumo token per utente/agente/fornitore | Misure di drift e latenza aggregata |
| **RAG a tre livelli** | Tre livelli di visibilità applicati, filtro permessi **prima** del punteggio | Le partizioni logiche su Vector DB |
| **Pipeline di validazione** | Validazione pre-esecuzione + controlli automatici alla pubblicazione + revisione umana | Le sei fasi complete e i controlli di equità |
| **Sandbox prima della pubblicazione** | Sandbox nel Learning Hub; la pubblicazione verifica che ci sia stata almeno un'esecuzione riuscita | L'esecuzione obbligatoria in sandbox isolata |

**La frase che tiene insieme tutto, se ve lo chiedono in una riga:**
> Il capitolo 2 descrive dove deve arrivare la piattaforma; il prototipo
> dimostra che il **modello di interazione** regge — che una persona non
> tecnica arriva davvero da un problema a un agente governato. Quello che manca
> è il livello infrastrutturale, ed è elencato, non nascosto: server, SSO,
> vector database, proxy di inferenza, fatturazione.

## Le tre domande scomode su questa tabella

**«Quindi il RAG non è semantico come scritto nel capitolo 2?»**
> Il capitolo 3, che descrive il PoC, dice «vettorizzazione tramite TF-IDF **o**
> embedding»: le due architetture sono entrambe previste, e il prototipo
> implementa la prima perché gira senza server. Il capitolo 2 descrive il
> prodotto. Non è una discrepanza, è la differenza fra i due capitoli — ed è
> dichiarata in entrambi.

**«Microservizi che però girano tutti insieme: non è un po' una forzatura?»**
> La separazione per responsabilità c'è ed è reale: quaranta moduli con confini
> netti, che è la precondizione per estrarli. Quello che non c'è è il
> deployment distribuito, che senza server non ha senso dimostrare. Chiamarli
> microservizi nel capitolo 2 è corretto perché quello descrive il prodotto;
> nel PoC sono moduli, e nell'appendice 3.A sono mappati sui livelli uno per
> uno.

**«L'orchestrazione multi-agente: ce l'avete o no?»**
> Nella forma che si può dimostrare senza server: un agente ne chiama un altro
> e ne aspetta il risultato, con il passaggio tracciato. Quello che manca è la
> parte che **decide** quando conviene scomporre un task — e lì il capitolo 2
> è esplicito sul perché conta: Anthropic ha misurato che un sistema
> multi-agente consuma circa quindici volte i token di una conversazione
> singola, quindi la decisione va presa con un criterio di costo, non per
> default. Quel criterio è lavoro da prodotto.

---

# Parte N · Sull'accesso

**«C'è una registrazione vera o sono solo quattro profili finti?»**
> Entrambe le cose, e servono a scopi diversi. I quattro profili dimostrativi
> sono scritti nel codice perché chiunque apra il link possa entrare in un
> clic, senza registrarsi: è quello che vi ha permesso di aprire la
> piattaforma dal telefono un minuto fa. «Crea un account» invece registra
> davvero una persona nel database SQLite, con nome, ruolo e organizzazione, e
> da lì in avanti è un utente come gli altri — profilo proprio, dati separati,
> dashboard che parte da zero.

**«Il recupero password manda davvero un'email?»**
> No, e lo dice. Un'applicazione che gira solo nel browser non ha un server che
> possa inviare posta: mostrare «ti abbiamo inviato le istruzioni» senza
> inviare niente sarebbe la scorciatoia disonesta. Il modulo spiega che in
> un'installazione aziendale il collegamento arriva per email, mentre qui
> l'ambiente è locale e la nuova password si imposta sul dispositivo.

**«Chiunque può resettare la password di chiunque, allora?»**
> Solo degli account creati su quel dispositivo, e in quel database che è già
> interamente nelle mani di chi lo apre: non c'è un'informazione da proteggere
> che non sia già sua. Due accorgimenti li abbiamo comunque tenuti, perché sono
> buone pratiche a costo zero: su un'email sconosciuta la risposta **non
> conferma né smentisce** che l'account esista — un modulo di recupero che lo
> fa regala l'elenco degli iscritti a chiunque provi — e sui profili
> dimostrativi la password non si può cambiare, altrimenti il primo che apre il
> link li renderebbe inaccessibili a tutti gli altri.

**«Come sarebbe in produzione?»**
> SSO aziendale: il capitolo 2 mette l'autenticazione nel User Layer, con le
> credenziali aziendali. Niente password gestite da noi, niente recupero
> gestito da noi — l'identità la possiede l'azienda, e questo risolve anche la
> domanda di prima.
