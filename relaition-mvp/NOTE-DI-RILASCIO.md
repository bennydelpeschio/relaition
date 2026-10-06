# RelAItion, note di rilascio

**Versione del 6 ottobre 2026 (v131)**

Rilascio preparato per la presentazione: la piattaforma si usa dal telefono
(verrà aperta da QR code davanti alla commissione), la demo breve copre tutte
le sezioni in sei minuti, un flusso che non parte si ripara da solo, e
l'esecuzione ora si ferma quando non ha i dati per andare avanti invece di
dichiarare fatto un lavoro mai fatto.

## Esecuzione dei flussi

- **Quando qualcosa si rompe, si vede dove.** A fine esecuzione si apre una
  finestra con l'elenco dei nodi che hanno avuto problemi — gemella di quella
  della validazione: stessi gesti, stessi nodi evidenziati sulla tela, un clic
  per saltare al nodo. Ogni riga porta il **rimedio**, e dove il caso lo
  consente il comando che lo risolve: «Compila» per i campi vuoti, «Apri il
  sotto-agente» per una delega fallita, «Riprova». Se il flusso era partito, la
  finestra si chiude ma non si perde: nel registro resta la riga «🔎 Dove si è
  rotto» che la riapre. Prima c'era solo un avviso che spariva in tre secondi e
  una riga rossa in mezzo a quaranta righe verdi.
- **Se il flusso non è partito, il registro resta vuoto e lo storico non
  registra niente.** Un tentativo mai cominciato non è un'esecuzione: nessun
  nodo è stato toccato, nessuna chiamata è uscita. Scriverci righe rosse faceva
  sembrare che qualcosa fosse stato tentato, e contarlo nello storico falsava i
  tassi di successo del Monitoraggio. Cosa manca e dove lo dice la finestra.
  Unica eccezione voluta: in esecuzione **pianificata** la riga si scrive lo
  stesso — una pianificata che non parte alle sette del mattino, senza traccia,
  sarebbe un silenzio indistinguibile da «tutto a posto».
- **Il registro scrive davvero tutto.** Alcune righe — il pre-volo, i nodi
  esclusi, i nodi saltati, l'interruzione — finivano nello storico ma **non**
  nel pannello a schermo: l'esecuzione si fermava e il pannello restava muto.
  Ora si vedono mentre succedono.
- **Gli errori dentro un sotto-agente risalgono all'orchestratore**, con il
  nome del flusso da cui vengono: la finestra non dice più soltanto «la delega
  è fallita», dice quale nodo del sotto-agente si è rotto e perché.
- **In esecuzione automatica** lo stesso elenco finisce nel registro salvato:
  senza, il giorno dopo si troverebbe una riga rossa senza spiegazione.
- **Convalida output: due regole su una riga sola.** `punteggio >= 0, punteggio
  <= 100` veniva letto come una regola unica e falliva **sempre**, segnalando
  come non rispettata una regola che il valore rispettava.
- **Un flusso senza i dati necessari non parte.** Se un connettore o un trigger
  ha un campo obbligatorio vuoto, l'esecuzione si ferma *prima* di eseguire
  qualunque nodo, e il registro dice quale campo manca su quale nodo. Vale per
  tutte le strade: il pulsante Esegui, la pianificazione, la scheda nel
  marketplace e la delega da un orchestratore. Prima il controllo esisteva solo
  nel Builder: da ogni altra strada il nodo partiva con il destinatario vuoto e
  l'esecuzione si chiudeva «conclusa» senza aver spedito niente a nessuno.
- **Lo stesso vale a metà corsa.** Se un campo obbligatorio risulta vuoto al
  momento della chiamata — una connessione cancellata, un segnaposto che non si
  risolve — il nodo interrompe il flusso invece di passare a valle l'input di un
  passaggio mai avvenuto.
- **All'importazione si dice cosa è stato riempito.** I campi obbligatori vuoti
  continuano a ricevere il predefinito del connettore, ma ora il messaggio dice
  quanti sono: sono valori messi dalla piattaforma, non scelti da chi ha scritto
  il flusso.

## Sotto-agenti

- **Si entra nel sotto-agente.** Dal pannello del nodo di delega si apre il
  flusso delegato nel Builder, e una riga in testa riporta all'orchestratore,
  sul nodo esatto da cui si era partiti. Il pannello mostra anche quanti nodi ha
  il sotto-agente, se è in produzione, e segnala in rosso un agente non più
  salvato.
- **L'esito della delega è l'ingresso del nodo a valle**, e il registro scrive
  quanti caratteri passano. Se il sotto-agente fallisce, il flusso si interrompe
  invece di proseguire sull'input non trasformato spacciato per risultato.
- **L'approvazione umana attraversa la delega.** Un sotto-agente che si ferma su
  un controllo umano sospende anche l'orchestratore; autorizzando, riprende
  prima il sotto-agente e poi il flusso chiamante. Prima la sospensione passava
  inosservata e i nodi a valle lavoravano su un testo che non era il risultato
  della delega.

## Esecuzione senza chiave collegata

- **La risposta simulata rispetta la forma chiesta dal prompt.** Un nodo che
  chiede «Rispondi SOLO JSON: {punteggio, motivazione}» riceve un oggetto con
  quei campi, così un nodo «Convalida output» a valle può fare il suo lavoro
  invece di respingere sempre. I valori restano dichiaratamente finti:
  `simulato:true` e la nota viaggiano dentro il JSON.
- **Lo strumento simulato viene invocato una volta sola**, come era previsto: il
  contrassegno si perdeva fra un'iterazione e l'altra, il ciclo si riapriva, e
  l'output del nodo finiva per essere la narrazione della chiamata invece della
  risposta.
- Effetto pratico: tutti e cinque gli agenti di esempio e tutti e quattro i
  flussi in `esempi/` arrivano in fondo senza collegare una chiave, compreso
  l'orchestratore che delega a tre sotto-agenti.

## Interfaccia

- **Dal telefono, toccare un nodo non apre più le proprietà.** Il pannello
  saliva a coprire mezza tela a ogni tocco, e costruire un flusso era una lotta:
  ogni spostamento di un nodo lo faceva ricomparire. Ora la selezione seleziona
  e basta; le proprietà si aprono col **doppio tocco** o col pulsante in basso,
  che intanto porta il nome del nodo selezionato e si colora.
- **Pannello «Integrazione AI»**: il pulsante «🔄 Modelli» finiva fuori dal
  pannello — invisibile e non cliccabile — già alla larghezza predefinita della
  palette. Ora la riga va a capo: il campo della chiave prende la prima riga e i
  due pulsanti si dividono la seconda, e tornano affiancati quando la palette è
  abbastanza larga. Verificato con palette stretta, larga e sul telefono, su
  tutti i fornitori.

## Prima della presentazione

- **Un blocco fuori palette si ripara in un clic.** La verifica non dice più
  soltanto che «Webhook CRM» non esiste: propone «Webhook» e lo sostituisce,
  icona e descrizione comprese. Con più blocchi da sistemare c'è un comando
  solo. Accanto, «Compila» riempie i campi obbligatori rimasti vuoti con i
  predefiniti del connettore: un flusso importato rotto passa da sei errori a
  zero in due clic.
- **Chiave del fornitore sbagliato.** Incollando una chiave Anthropic avendo
  selezionato OpenAI, la piattaforma lo dice prima di chiamare l'API, invece
  di restituire un «chiave non valida» che fa pensare a una chiave scaduta.
- **Knowledge Base navigabile**: ricerca sul nome e filtro per business unit
  sopra l'elenco dei documenti.
- **Tablet in orizzontale**: palette e proprietà più strette, così al canvas
  del Builder resta spazio utile.
- **Schermata di accesso**: dice che è un ambiente dimostrativo con profili di
  esempio, senza entrare in dettagli che non riguardano quello che il
  prototipo dimostra.

## Accesso

- **«Crea un account»**: registra una persona nel database SQLite, con nome,
  ruolo e organizzazione. Da lì in avanti è un utente come gli altri — profilo
  proprio, dati separati, dashboard che parte da zero.
- **«Password dimenticata»**: modulo di recupero. Non finge di inviare
  un'email che non può inviare: dice che l'ambiente è locale e la nuova
  password si imposta sul dispositivo. Su un'email sconosciuta la risposta non
  conferma né smentisce che l'account esista.
- I **quattro profili dimostrativi restano invariati**: un clic sulla scheda e
  si entra.

## Rifiniture prima della presentazione

- **Le connessioni dicono prima cosa si può provare**: «provabile dal
  browser», «serve il servizio locale», «non su questo browser». Prima lo si
  scopriva premendo Prova e leggendo l'errore, che in una dimostrazione sembra
  un guasto invece di una condizione mancante.
- **La Knowledge Base si cerca anche dentro i documenti**, non solo nei nomi, e
  mostra la riga in cui trova la parola. In una KB vera il nome del file è
  l'ultima cosa che si ricorda.
- **L'elenco dei modelli rilevati dal fornitore sopravvive al ricaricamento**, e
  la tendina del nodo dice se sta mostrando l'elenco predefinito o quello
  rilevato.

## Demo breve: copre tutto il percorso

- **43 passi, circa 6 minuti e 50 secondi.** Rispetto alla versione
  precedente aggiunge: installazione di un agente con configurazione del
  modello ed esecuzione; la Knowledge Base navigata davvero (filtro
  dell'elenco, dettaglio di un documento con la sua segmentazione); un flusso
  rotto che viene riparato in due gesti; le certificazioni del Learning Hub;
  la finestra delle connessioni.
- **Secondo giro sul telefono**: barra superiore che non perde le azioni sui
  titoli lunghi, i dieci pulsanti del pannello proprietà che stanno su una
  riga ciascuno, tendine dei connettori che non escono dal pannello, nodi più
  stretti sulla tela, tendine alte abbastanza per il pollice.

## Modelli AI

- **«Altro modello…»** in fondo alla tendina di ogni fornitore: si incolla
  l'identificativo esatto preso dalla documentazione del fornitore e viene
  inviato così com'è. Serve a usare un modello uscito dopo questa versione
  senza aspettare un aggiornamento del codice, e senza il rischio di una lista
  scritta a mano che contiene identificativi inesistenti.

## Demo breve, terza revisione

- **38 passi, circa 6 minuti** misurati, con i tempi di lettura al 72%: la
  versione precedente stava in 4:39 ma correva troppo per essere letta.
- **Chiude con il tema scuro**, che si vede da lontano e dice «prodotto
  finito» meglio di una frase.
- **Learning Hub, Sfide e Community passano da tre a nove passi**: lezione,
  quiz, sandbox, una sfida, un contributo scritto e pubblicato. È la parte che
  distingue una piattaforma da un editor di flussi.
- **Niente rientro con un altro account**: costava due passi e si racconta a
  voce in dieci secondi.
- **Testi rivisti per un pubblico non tecnico.**

## Telefono e tablet

- **Impaginazione per schermi stretti.** Sotto i 768px il menu diventa un
  pannello a scomparsa, la barra superiore tiene i comandi che servono e mette
  gli altri dietro «⋯», i due pannelli del Builder salgono dal basso quando li
  chiami, le finestre diventano fogli ancorati in basso, tabelle e linguette
  scorrono invece di andare a capo. Sopra i 768px non cambia niente.
- **Il Builder si usa col dito.** Trascinare un nodo, collegare due porte,
  spostare la vista e selezionare funzionano al tocco; due dita ingrandiscono.
  Il trascinamento dalla palette, che su telefono non esiste, è sostituito dal
  tocco: il blocco viene aggiunto al centro della vista.
- **La demo guidata resta da scrivania** e lo dice, invece di aprirsi
  sovrapposta: vuole due aree affiancate.

## Cose che non funzionavano e ora sì

- **Le virgolette nei nomi.** Chiamando un nodo `Analisi "urgente"`, il nome
  si troncava alla prima virgoletta appena si riapriva il pannello, e il resto
  era perso. Valeva per il nome e la descrizione dei nodi, i campi dei
  connettori, il nome del profilo, il titolo di un post e il nome di una
  connessione. Ora il testo arriva intero.
- **Il flusso di esempio si bloccava da solo.** Aprendo il Builder la prima
  volta, il primo Esegui rispondeva «workflow non valido (3 problemi)»: i nodi
  di quell'esempio avevano nomi che nella palette non esistevano. Ora si apre,
  valida ed esegue.
- **Due avvisi falsi su ogni nodo AI.** Senza modello collegato il registro
  dichiarava a ogni esecuzione che l'output vincolato «non è supportato da
  auto». `auto` non è un fornitore, è la scelta «usa quello collegato»: gli
  avvisi erano infondati e il nome, illeggibile.
- **Il riquadro della guida usciva dallo schermo** sui telefoni stretti.

## Demo, versione da cinque minuti

- **34 passi, 4 minuti e 39 secondi** misurati, contro i 101 della completa.
  Passa da tutte e dieci le pagine. Si apre con `demo.html?breve` o dal
  pulsante «breve» nella barra dei comandi.
- **Costruisce un agente e poi esegue quello.** Prima ne costruiva uno a mano
  e ne eseguiva un altro già pronto: ora parte il flusso appena costruito —
  trigger, mascheramento dei dati, nodo AI con il suo prompt, uscita.
- **Due passi mancanti che rompevano la sequenza**: il nodo AI non veniva
  aggiunto prima di scrivergli il prompt, e il riquadro dell'anteprima della
  chat non veniva chiuso, così la finestra di pianificazione ci si apriva
  sopra.
- **Copione per la voce fuori campo** in `demo/VOCE-DEMO-BREVE.md`, con i
  tempi presi dalla registrazione vera e le note per il montaggio.
- **Testi rivisti.** Una dozzina di passi erano scritti in negativo — «non è
  un pulsante finto», «non nodi che le somigliano», «che i giocattoli non
  hanno». Dette una volta sono retorica, dette dodici sembrano una difesa da
  un'accusa che nessuno ha fatto. Ora dicono la stessa cosa in positivo.

## Builder

- **Sandbox didattica davvero senza persistenza.** Salva, Pubblica e Pianifica
  non sono disponibili mentre la sandbox è attiva, e i pulsanti si vedono
  spenti. Prima funzionavano come sempre, e un flusso di prova poteva finire
  fra i tuoi agenti o in coda di revisione. Esporta e Python restano.
- **Aiuto alla scrittura.** Sotto il prompt di un nodo AI, sotto il contesto
  del flusso e sotto ogni area di testo dei nodi c'è «Aiutami a scriverlo»:
  dici a parole cosa vuoi ottenere, il modello collegato scrive il testo o
  migliora quello che c'è, e puoi ripristinare il precedente. Senza modello
  collegato lo dice, non finge.
- **A capo nella chat e nelle etichette delle frecce.** La chat cresce con il
  testo (Invio genera, Maiusc+Invio va a capo); l'etichetta di una freccia
  accetta fino a tre righe, anche sulla tela.
- **Registro di esecuzione.** Le righe lunghe si aprono con una freccia e
  mostrano il testo intero: prima veniva tagliato a 80 caratteri prima ancora
  di arrivare al registro.

## Dashboard

- **Tutta di chi è connesso.** Agenti più usati, attività recente e grafico
  della settimana ora sono calcolati sulle righe della persona: chi non ha
  ancora fatto niente vede tre riquadri vuoti che dicono cosa comparirà lì,
  non i numeri di qualcun altro. Consigli e novità restano comuni. Vale anche
  per «Attività recente» nel profilo, che senza attività non inventa più nulla.

## Consumo

- **Contatore dei token.** Ogni chiamata al modello viene contata per utente,
  agente, nodo e fornitore: misurata dove il fornitore riporta i token, stimata
  altrove (e lo dice). Si vede nel registro, nel profilo e nel Monitoraggio.
- **Quota di prova** di 100.000 token per utente. Senza chiave collegata i
  nodi AI usano la quota, con risposte simulate e dichiarate tali in ogni
  riga del registro; con la propria chiave le risposte sono vere e la quota
  non si tocca. La regola è automatica: il selettore «Fonte delle chiamate»
  della versione precedente è stato tolto. Esaurita la quota, serve la chiave.
- **Aiuto alla scrittura riparato.** Con la chiave collegata rispondeva
  «provider auto non configurato»: la scelta «automatico» non veniva risolta
  sul fornitore collegato. Ora scrive davvero nel campo; Ctrl+Invio invia.
- **Autosalvataggio sui nomi omonimi.** Aprendo un flusso di esempio con lo
  stesso nome di un agente di un altro utente, l'autosalvataggio falliva in
  silenzio a ogni modifica. Ora il nome prende il suffisso «(2)».
- **Tendina del modello a cascata.** Elenca i modelli del fornitore scelto
  sul nodo (prima poteva mostrare quelli di un altro fornitore); con
  «Automatico» resta bloccata finché non si sceglie il fornitore.

## Demo

- **Versione breve.** `demo.html?breve` o il pulsante «breve» nella barra:
  47 passi scelti dalla demo completa, tempi di lettura all'80%, otto minuti
  misurati. La versione completa resta com'è.

## Ingressi e aspetto

- **Identità visiva ufficiale.** Logo con il claim *Learn / Build / Share /
  Grow* in accesso, avvio e demo, segno nel menu, icona dell'app installabile
  dall'asset ufficiale. Tutto PNG con sfondo trasparente.
- **Tema scuro.** Interruttore nella barra in alto (☾/☀); la scelta resta nel
  browser. Predefinito chiaro. Finestre di verifica, avvisi, badge e quiz
  leggibili anche al buio.
- **Versione in fondo al menu**, letta dal service worker in esecuzione: dice
  quale build sta girando davvero.
- **Più fluida.** Tolte le animazioni che giravano sempre (marchio pulsante,
  gradienti in movimento) e la sfocatura dello sfondo dietro le finestre:
  finestre e transizioni non scattano più.
- **Icona installabile a misura piena** e logo di accesso nitido e centrato.
- **Sandbox senza tracce.** Eseguire nella sandbox non scrive più nello storico
  delle esecuzioni né nel Monitoraggio.

- **Sandbox didattica in evidenza** nel Learning Hub: pulsante proprio accanto al
  giro guidato, non più un collegamento in piccolo.
- **Testi puliti.** Niente trattini lunghi nei testi visibili, niente emoji nei
  titoli: le icone restano dove servono (palette, nodi, pulsanti, badge).
- **Finestre e pannelli si chiudono cambiando pagina.** Una finestra aperta non
  resta più sopra la schermata successiva.

## Sfide, formazione, community

- Il dettaglio della classifica scrive «1 controllo», non «1 controlli».
- Le iscrizioni alle sfide vengono ricostruite dalle candidature: in classifica
  comparivano persone che risultavano non iscritte.
- Demo guidata: 97 passi in 10 capitoli, con iscrizione, candidatura,
  classifica e domande nelle Sfide, quiz e post nella Community, e un capitolo
  finale con un secondo account per mostrare i dati per persona.

## Esempi

- `esempi/4-invoice-extractor.json`: il flusso della tabella 3.H.2 della tesi,
  importabile così com'è.

---


# Versione del 6 settembre 2026


## Cose che non funzionavano

* **La tela del Builder è di chi la sta usando.** Uscendo come Mario ed entrando come Giulia restavano sulla tela i nodi di Mario, nello stesso posto in cui si preme Salva. Ora ogni utente ha la propria copia di lavoro: chi entra ritrova la sua, chi entra per la prima volta parte pulito, e tornando indietro si ritrova la propria com'era.

* **Le iscrizioni alle sfide non passano più da un utente all'altro.** La mappa in memoria veniva ricaricata per chi entrava senza essere svuotata prima: si ereditavano le iscrizioni del precedente. Lezioni, quiz, esperienza, candidature, badge e livello erano già distinti e restano tali.

* **Un flusso salvato torna con il suo nome.** Chiudendo e riaprendo l'applicazione i nodi tornavano ma il titolo diventava «Workflow Builder · non ancora salvato»: sembrava di aver perso il lavoro, che invece era nel database. La copia di lavoro conservava solo la geometria, e veniva scritta soltanto dopo un'esecuzione — chi costruiva senza mai eseguire ritrovava una tela vecchia. Ora conserva anche nome e legame con la riga, e si aggiorna a ogni modifica.

* **Il legame non passa da un utente all'altro.** La copia di lavoro è per browser, non per persona: entrando con un altro account il Builder avrebbe potuto puntare alla riga di qualcun altro e sovrascriverla al primo salvataggio automatico. Ora il legame si accetta solo se la riga è di chi sta usando l'app.

* **Un post può portare fino a 5 allegati.** Chi racconta un flusso porta il JSON dell'agente, un CSV di prova e uno schema: prima serviva un post per file. Il compositore mostra i file scelti con un contatore, le immagini si aprono a schermo intero e si scorrono in fila, e un JSON allegato ha il pulsante che lo apre nel Builder.

* **Le schede degli agenti installati sono allineate.** «Apri nel Builder» andava a capo su alcune schede e no su altre, le larghezze dei pulsanti non tornavano e le altezze differivano. Ora sono uguali. Le date hanno un formato solo: prima si leggeva «29 giorni fa» accanto a «06/08/2026».

* **«Allega i file generati dal flusso» ti fa scegliere cosa generare.** Se a monte c'è già un blocco che produce file, il pannello elenca cosa verrà allegato, con i nomi dei file. Se non c'è, propone i formati e inserisce un «Esporta file» subito prima dell'invio, collegandolo al posto giusto. Nessun errore: la richiesta è legittima, e viene completata invece che vietata.

* **Esegui e Interrompi hanno la stessa larghezza** e si allineano con i pulsanti sotto. Prima erano uno elastico e uno fisso, e la fila non tornava con nessuna delle altre.

* **Il nodo email allega file veri.** Prima sapeva allegare solo i file prodotti dal flusso durante l'esecuzione. Ora dal suo pannello si aggiungono **allegati fissi**, presi dal computer o da un documento della Knowledge Base, che partono a ogni invio: un listino, un modulo, delle condizioni contrattuali. Si sommano ai file generati, e il pannello mostra peso e tetto (2 MB complessivi, perché restano dentro l'agente salvato).

* **Tre flussi di esempio da importare**, nella cartella `esempi/`: onboarding fornitore con dossier allegato, rassegna settimanale con ciclo sulle fonti, ticket di assistenza con instradamento. Importati, convalidati ed eseguiti prima di essere consegnati.

* **Il flusso si salva e si esporta sempre, anche incompleto.** Prima la convalida sbarrava allo stesso modo esecuzione, salvataggio ed export: il lavoro a metà non si poteva mettere via, e si finiva per costruire tutto in una sessione sola per paura di perderlo. Ora salvataggio, export JSON ed export Python passano comunque, dicendo quanti punti restano da sistemare; i nodi con problemi restano segnati sulla tela. Restano sbarrate **esecuzione** e **pubblicazione**: la prima perché un flusso rotto produce un errore e non un risultato, la seconda perché è l'unica azione rivolta ad altre persone.

* **I nodi generati dalla chat sono esattamente quelli della palette.** Un «Approvazione Umana» proposto dal modello nasceva con icona e descrizione sue e **senza i campi del controllo** — chi approva, quale messaggio, entro quando — perché quei campi vengono riconosciuti dal nome esatto. Sembrava un presidio e non lo era, che è peggio di un presidio assente. Ora ogni nodo proposto viene ricondotto alla voce di palette corrispondente prima ancora dell'anteprima, quindi quello che confermi è quello che ottieni. I valori specifici proposti dal modello restano.

* **Se la chat propone un blocco che non esiste, lo dice prima di applicare.** Capitava con richieste legittime formulate male — «Allega file mail» non è un blocco della palette, è un campo di «Invia email» — e il flusso andava in errore dopo. Ora l'anteprima segnala quali blocchi non esistono e perché il flusso non partirà, sopra i pulsanti Applica e Annulla. Non vengono scartati d'ufficio: la decisione resta a te.

* **L'allineamento vale per tutte le 81 voci della palette**, non solo per i controlli: trigger, nodi AI, azioni, condizioni, output e sotto-agenti. Verificato uno per uno.

* **Un nodo con un nome inventato ora viene segnalato.** La convalida lo lasciava passare in silenzio: controllava i campi obbligatori della definizione, e un nome sconosciuto non ha definizione, quindi non ha campi, quindi non ha errori. Un'azione inventata passava il controllo e all'esecuzione non faceva quello che il nome prometteva. Restano libere di chiamarsi come vuoi le condizioni («Punteggio >= 70?») e i nodi AI, dove il nome è un'etichetta e non un'identità.

* **Il nodo Loop ora itera davvero.** Il blocco esisteva ma attraversava il flusso una volta sola: il registro riportava una riga e si proseguiva. Adesso conta gli elementi realmente prodotti dai nodi a monte e ripercorre i nodi a valle uno per ciascun elemento, scrivendo "Iterazione 3 di 50". Nel campo *lista* si indica il nome del campo che contiene l'elenco; in alternativa si dichiara un numero fisso di ripetizioni. C'è un tetto di sicurezza a 25 iterazioni, e quando interviene il registro lo dichiara invece di troncare in silenzio.

* **La ricerca del catalogo filtra i risultati.** Prima li calcolava e li scartava, mostrando un avviso e portando al marketplace non filtrato: in pratica bisognava conoscere il nome esatto dell'agente. Ora la ricerca cerca in nome, descrizione, categoria, autore ed etichette, si combina con il filtro di categoria, ignora gli accenti e confronta la radice della parola, quindi *fatture* trova quello che trovava *fattura*. Con più parole, se nulla le contiene tutte, ripiega sulle corrispondenze parziali dicendo che lo sta facendo. Se non trova nulla lo spiega e offre una via d'uscita, invece di lasciare una griglia vuota.

* **Le statistiche personali sono davvero personali.** Dashboard e Profilo mostravano i totali della piattaforma sotto l'etichetta "la tua attività": l'intestazione diceva 10 agenti e 50 esecuzioni mentre il corpo della stessa pagina ne contava 2 e 19. Ora ogni numero è filtrato sull'utente collegato.

* **Il pulsante Esegui in "I miei agenti" esegue.** Prima attendeva due secondi e registrava un successo con zero nodi attraversati: non eseguiva niente. Adesso usa lo stesso motore del builder, e al termine mostra dove è finito il risultato invece di lasciarti cercare.

* **La classifica esperienza è calcolata.** Conteneva sei nomi con punteggi scritti nel codice, due dei quali non corrispondevano ad alcun utente, e guadagnare esperienza non la spostava di una posizione. Ora somma i punti realmente registrati.

* **Rinominare il proprio profilo aggiorna tutto.** L'attribuzione seguiva 14 colonne su poche tabelle: dopo una rinomina alcuni contenuti restavano intestati al nome vecchio. Ora ne segue 23 su 22 tabelle.

---

## Cose che c'erano ma non si trovavano

* **Le frecce si possono etichettare.** L'etichetta esisteva già — i rami «Sì»/«No» di una condizione la portano — ma compariva solo dove la metteva il codice o un flusso importato: si vedeva e non si poteva scrivere. Ora selezionando una connessione c'è il campo per scriverla: serve a dire perché si prende quella strada, o a lasciarsi un promemoria su una tela grande.

Diverse segnalazioni riguardavano funzioni già presenti che nessuno riusciva a scoprire. Non le abbiamo rifatte: le abbiamo rese visibili.

* **Muoversi sulla tela del builder.** Quando non c'è alcun nodo selezionato, il pannello laterale ora elenca i gesti disponibili: **Ctrl + trascina** sposta la vista, il trascinamento semplice apre un riquadro di selezione multipla, la rotella ingrandisce.

* **La rotella sopra il registro di esecuzione** ora scorre il registro invece di ingrandire la tela sottostante.

* **I comandi dello zoom** si spostano quando il registro si apre, invece di restarci sotto.

* **Il tutorial iniziale e la sandbox di prova** erano già nel prodotto ma sepolti nella navigazione: ora sono raggiungibili dai punti in cui servono.

---

## Formazione

* **I livelli 2 e 3 hanno il nome giusto.** Erano «AI Practitioner» e «AI Professional» nella scheda Certificazioni, ma «AI Practitioner» e «AI Champion» nella fascia in cima alla stessa pagina: due nomi diversi per lo stesso livello, a due centimetri di distanza. Ora sono **AI Translator** (livello 2, usa gli agenti del Marketplace nel proprio reparto) e **AI Creator** (livello 3, costruisce agenti nel builder no-code e nella sandbox), ovunque.

* **I percorsi sono assegnati al livello che gli compete.** «Builder Avanzato» stava al livello 2, che riguarda chi usa gli agenti, non chi li costruisce. Ora: livello 2 raccoglie i percorsi d'uso per reparto (AI per il Business, Marketing AI Agent), livello 3 quelli di costruzione (Builder Avanzato, Padroneggiare RelAItion), livello 4 governo e conformità.

* **La fascia dei quattro livelli dice la verità.** Era scritta a mano: annunciava «Livello 1 Completato ✓» e «Livello 2 In corso: 40%» anche a chi non aveva completato una sola lezione. Ora mostra l'avanzamento reale di ciascun livello.

* **I quattro livelli di certificazione sono collegati ai percorsi.** Il testo prometteva la progressione da AI Aspirant ad AI Ambassador senza che alcun percorso vi fosse associato: nessuno poteva raggiungerli. Ora ogni percorso dichiara il livello a cui appartiene, e un livello si considera raggiunto quando sono completi tutti i percorsi fino a quel punto.

* **L'attestato si scarica.** File grafico con nome, ruolo, organizzazione, data e codice di verifica. Se cambi il nome nel profilo e lo riscarichi, riporta quello nuovo.

* **La classifica compare anche in Sfide ed Eventi**, in cima, con la tua posizione sul totale.

---

## Riconoscimenti ed eventi

* **I badge hanno i nomi giusti.** «Prompt Master», «Ethical AI Guardian» e «Automation Hero» erano nominati nella documentazione del progetto ma non esistevano nel prodotto. Due c'erano sotto un altro nome e sono stati rinominati; **Prompt Master** è nuovo e conta i prompt scritti a mano nei nodi AI dei tuoi flussi.

* **Il badge «7-Day Streak» ora esiste, e si chiama «Costanza».** Le notifiche annunciavano di averlo sbloccato e chi cliccava arrivava a un profilo dove quel badge non c'era. Ora i giorni consecutivi si contano davvero, dalle date della tua attività, con soglia a 5 giorni.

* **L'esperienza sblocca qualcosa.** Prima gli XP erano solo un punteggio. Ora il profilo mostra una scala di privilegi con quanto manca al prossimo, e due sono reali: il **voto sulle candidature** alle sfide si apre a 250 XP, la **revisione fra pari** a 500. Restano fuori dai cancelli installare agenti, seguire i percorsi e scrivere in Community: mettere una soglia davanti alla partecipazione di base sarebbe stato il contrario del punto.

* **Gli agenti installati e recensiti fruttano a chi li ha scritti.** Chi installa un tuo agente ti porta 15 XP, una recensione da 4 stelle in su ne porta 10. Una volta sola per persona, così non si gonfia il punteggio installando e disinstallando.

* **Le sfide non promettono più badge che non esistono.** «badge Esperto Finance», «badge Governance», «badge Ambassador»: nessuno dei tre era nel prodotto. I premi ora sono coerenti con quanto previsto, e l'unico badge citato è uno che esiste.

* **Hackathon e Demo Day più completi**: durata di tre giorni (era «48 ore»), tre binari tematici, mentori dichiarati, cadenza degli eventi e supporto ai vincitori per portare il prototipo in esercizio.

* **Corretto un conteggio.** «I controlli che hai inserito nei flussi», nel profilo, contava anche quelli scritti dagli altri.

* **Creare un agente dà esperienza** (60 XP, solo alla prima creazione). Era l'unica delle attività previste a non darne.

* **I badge si vedono anche da fuori.** Ogni riga della classifica apre il profilo pubblico di quella persona con i suoi riconoscimenti, tutti calcolati sulla sua attività. Un badge che vede solo chi lo possiede non riconosce niente davanti a nessuno.

* **Demo Day**: quattro criteri (impatto sul business, scalabilità, etica e presidio, presentazione), presentazione come dimostrazione dal vivo del flusso, giuria con esperti esterni.

* **Il verde è sparito da tutte le parti in cui era il colore del prodotto.** Il cambio di tema era stato fatto sostituendo le variabili dei fogli di stile, ma un colore scritto per esteso non segue una variabile che non usa: erano rimasti verdi la schermata di accesso, l'icona dell'app, il colore della barra del browser, la **voce di menu attiva**, l'ombra del **pulsante primario**, il battito del logo, il fuoco dei campi, l'intestazione del Marketplace e quella del Learning Hub. Ora sono blu e viola. Restano verdi solo le cose che significano «è andata bene»: esiti riusciti, ramo «sì» di una condizione, risposta corretta di un quiz, indicatori in crescita.

* **L'icona dell'app installata e il marchio nel menu sono la stessa cosa.** L'icona disegnava un fulmine bianco vettoriale, l'interfaccia usava l'emoji ⚡, che i sistemi disegnano gialla: chi installava l'app trovava sulla schermata iniziale un simbolo diverso da quello dentro il prodotto. Ora barra laterale, schermata di accesso e velo di avvio usano lo stesso tracciato del file dell'icona. Il marchio non cambia più aspetto fra Windows, macOS e Android.

* **Nota sull'app installata.** Barra del titolo e icona vengono fotografate dal sistema operativo al momento dell'installazione e **non si aggiornano mai da sole**: per vederle cambiare bisogna disinstallare e reinstallare. Il contenuto invece si aggiorna, ma solo se il server locale è in esecuzione: se non risponde, l'app usa la copia salvata e mostra la versione precedente. In quel caso: chiudi l'app, avvia il server, riapri e premi Ctrl+Shift+R.

## Community

* **Le immagini si aprono.** Clic su un'immagine di un post e si apre a schermo intero, con ingrandimento dal 25% al 400% e scorrimento fra le immagini degli altri post. Esc chiude, le frecce scorrono. Nel dettaglio del post l'immagine ora si vede intera invece che ritagliata.

* **Dieci post in più**, sui meccanismi che la piattaforma implementa davvero: il ciclo di pubblicazione, la spiegabilità delle esecuzioni, il recupero dalla Knowledge Base, i controlli sui dati personali. Tre includono uno schema.

---

## Aspetto

* **Nuova identità cromatica**, blu e viola su bianco, al posto del verde.

* **Il verde resta dove significa qualcosa.** Nel passaggio di tema alcuni indicatori di esito riuscito avevano preso il colore del marchio, diventando blu: un'esecuzione riuscita e una qualsiasi altra cosa si somigliavano troppo. Ora il colore identitario e quello semantico sono separati, e i pallini di successo sono di nuovo verdi.

---

## Corretto durante le verifiche

* **Gli errori di convalida non ripetono più la stessa spiegazione.** Con tre blocchi affetti dallo stesso problema si leggevano tre volte le stesse due righe, e i nomi — l'unica cosa che cambiava — annegavano nel testo. Ora i blocchi sono raccolti sotto un'intestazione che li conta, i nomi sono pastiglie che portano al nodo con un clic, e il perché è scritto una volta sola.

* **Al cambio pagina l'evidenziazione non indica più il punto sbagliato.** Restava accesa sul bersaglio del passo precedente mentre la schermata cambiava, e si riposizionava a scorrimento non ancora finito: misurati 114px di scarto per due decimi di secondo. Ora si spegne all'istante e si aggancia al nuovo bersaglio prima dello scorrimento, accompagnandolo.

* **Ogni passo della demo è più svelto di un quarto di secondo.** Il controllo che aspettava la fine di un'eventuale esecuzione partiva sempre con un'attesa, anche nei moltissimi passi che non eseguono niente.

* **L'evidenziazione della demo segue lo scorrimento.** Scorrendo a mano, il riquadro che indica la sezione restava indietro: veniva posizionato una volta e non si aggiornava più, e la sua transizione di 0,4s aggiungeva altro ritardo. Ora si aggancia al bersaglio e lo segue senza ritardo, insieme al riquadro della narrazione.

* **L'accesso non mostra più il contenuto precedente.** La pagina di destinazione ora si disegna mentre la schermata di accesso è ancora davanti: quando si dissolve, sotto c'è già il contenuto giusto. Prima si toglieva il velo e poi si disegnava, e per un istante restavano visibili i dati e la voce di menu di chi c'era prima.

* **Uscire è immediato.** Prima ricaricava tutta la pagina, rifacendo da zero l'inizializzazione del database: qualche secondo di attesa. Ora la schermata di accesso torna subito.

* **Transizioni più morbide.** La schermata di accesso esce con una dissolvenza invece che di colpo, e il cambio pagina è più breve (0,22s invece di 0,35s). Chi ha ridotto le animazioni nelle impostazioni del sistema le trova ridotte anche qui.

* **Il player della demo si può nascondere senza restare senza player.** C'era un pulsante che toglieva la barra dei comandi, e l'unico modo di riaverla era un tasto scritto nella barra appena sparita: chi lo premeva per sbaglio restava senza avanti, indietro e indice. Ora, mentre è nascosta, muovendo il mouse compare in basso una maniglia «⌃ comandi» che la riporta. Se durante la registrazione non tocchi il mouse, la maniglia non compare e non finisce nel video.

* **La demo ha i colori nuovi.** Il palco che circonda l'applicazione — riquadro della narrazione, alone che illumina gli elementi, indice dei capitoli — era rimasto verde: non eredita gli stili dell'app, quindi il cambio di tema non l'aveva toccato. Ora è blu e viola, e la schermata di attesa porta lo stesso marchio dell'applicazione.

* **Aprire la demo con il server spento non mostra più l'app al suo posto.** Quando la rete non rispondeva, la copia di riserva restituiva la pagina dell'applicazione per qualunque richiesta: si apriva la demo e compariva l'app, senza errori e senza spiegazioni. Ora la riserva vale solo per le pagine, e ciascuna ripiega sulla propria. I file della demo sono inclusi nella copia offline.

* **Finestre strette e schermi piccoli.** Sotto i 900px di larghezza il menu si comprime da solo, e le schede dei numeri si incolonnano invece di stringersi fino a spezzare le parole. Prima, a larghezza da telefono, il menu si prendeva due terzi dello schermo e il contenuto era illeggibile. Resta uno strumento da scrivania, ma ora una finestra affiancata o uno schermo piccolo non lo rendono inservibile.

* **Il pallino sul menu Monitoraggio si aggiorna.** Veniva calcolato una volta sola all'avvio e non spariva mai: se i segnali si risolvevano durante la sessione, il numero restava a indicare un problema che non c'era più.

* **Due numeri che sembravano contraddirsi.** Il menu diceva «2», la pagina «4 segnali»: erano corretti entrambi, ma nessuno lo spiegava. Ora la pagina dichiara tutti e due e dice quale finisce nel menu.

Segnalazioni emerse mentre si controllavano le modifiche precedenti.

* **La proposta del builder conversazionale non passa più inosservata.** Compariva dentro la fascia scorrevole della chat, spesso sotto il bordo visibile: si premeva Genera e sembrava non fosse successo nulla. Ora è un riquadro sovrapposto, con Applica e Annulla espliciti.

* **Il riepilogo dell'esecuzione è leggibile.** Un esito lungo, CSV o JSON, usciva dal riquadro. Ora va a capo e scorre dentro il suo contenitore.

* **Le esecuzioni manuali sono classificate come manuali.** Finivano fra le pianificate e venivano attribuite all'autore dell'agente invece che a chi le aveva avviate.

---

## Non ancora fatto

* **Il logo definitivo.** L'attuale è provvisorio.

---

## Come ottenere l'aggiornamento

L'applicazione conserva una copia locale per funzionare offline, quindi un ricaricamento normale può restituire la versione precedente.

* Premi **Ctrl + Shift + R**.
* Se dopo questo qualcosa appare ancora come prima: **F12**, scheda *Application*, *Service Workers*, *Unregister*, poi ricarica.

I dati locali (agenti, progressi, cronologia) restano dove sono.

---

Grazie a chi ha provato la piattaforma e ha scritto cosa non tornava. Quasi tutto quello che c'è qui sopra viene da lì.

## Dashboard

- **Il grafico della settimana porta le date.** I soli nomi dei giorni si
  ripetono ogni settimana: chi rientra dopo un po' vedeva «Mar, Mer, Gio…» senza
  sapere di quale martedì si parlasse. Ora sotto ogni giorno c'è la data, in
  testa al riquadro c'è l'intervallo («30 set – 6 ott»), l'ultima barra dice
  **oggi** ed è evidenziata, e il suggerimento del mouse porta la data per
  esteso.

## Dimostrazione guidata (versione breve)

Rifatta su indicazione di chi la presenterà. **48 passi, circa 7 minuti**,
cronometrati su due giri interi.

- **I testi sono più corti.** La versione breve adesso ha un testo proprio: dice
  cosa si sta vedendo in una riga e lascia alla voce il perché. Chi presenta
  parla sopra, e un riquadro lungo gli faceva concorrenza. La versione completa
  resta com'era.
- **Il percorso del catalogo è intero**: si cerca dalla barra, si apre la scheda,
  si installa, si configura, si esegue, **si salva**, lo si ritrova nell'elenco e
  lo si riapre. Il flusso che si riapre è quello delle fatture, il più facile da
  raccontare.
- **La Knowledge Base passa in fretta**: documento cercato, indicizzazione
  mostrata, esportazione in Markdown. Il dettaglio sul recupero resta nella
  versione completa.
- **Il pannello delle connessioni è uscito.**
- **Formazione e sfide hanno due passi in più** (le fasi di una sfida, i criteri
  di valutazione) e **non nominano più i punteggi**: sono tarature che cambiano.
- **Chiude con il tema scuro e un cartello «Fine della dimostrazione»**, così chi
  presenta sa quando attaccare.
- **Tre difetti di sincronia corretti**: la costruzione a mano partiva mentre a
  schermo c'era ancora un'altra pagina; «Scrivo il prompt» mostrava il testo a
  scrittura già finita; i passi dell'installazione e della revisione erano
  stretti e accumulavano ritardo.
- **Nessun pop-up resta aperto**: verificato passo per passo su tutti e 48.

Aggiornati di conseguenza il copione parlato (`demo/VOCE-DEMO-BREVE.md`), il
discorso di presentazione e i minutaggi nelle domande attese.

## Telefono (v124)

- **I nodi si spostano col dito.** Toccando un nodo il Builder lo ridisegna e
  l'elemento originale esce dal documento: i suoi eventi di spostamento non
  arrivavano più alla tela. Ora si ascoltano sull'elemento toccato.
- **La selezione non si perde più** aprendo le proprietà: i click «di
  compatibilità» del browser cadevano sulla tela vuota e la deselezionavano.
- **Pannello «Integrazione AI» richiudibile** (chiuso di default sul telefono):
  nel foglio dei blocchi lasciava poco spazio ai connettori.
- **Più tela**: della chat del Builder resta la barra di scrittura; suggerimenti
  e cronologia compaiono solo mentre la si usa.
- **Accesso scorrevole**, in verticale e in orizzontale, con logo ridotto.
- **Tasto «Esci» nel profilo**, accanto a «Modifica profilo» (anche su desktop).

## Telefono, barra superiore (v125)

- **Ricerca di nuovo raggiungibile**: un'icona 🔍 nella testata apre la barra a
  tutta larghezza (prima era nascosta e basta). Si richiude toccando fuori.
- **«+ Nuovo Agente» mostra un «+»** vero, grande e centrato: il segno era un
  `::after` che sul telefono non sempre compariva.
- **Icone centrate** in tutti i pulsanti della testata e nel menu «⋯».

## Trascinamento dei nodi (v126)

- **Spostare un nodo costa meno.** A ogni fotogramma si ricostruiva l'HTML di
  tutti i nodi; ora, mentre si trascina, si aggiornano solo le posizioni degli
  elementi esistenti, e le porte degli archi si cercano in una mappa invece che
  con tre ricerche per freccia. Il disegno resta identico (verificato a
  confronto diretto con quello completo).

## Trascinamento fluido (v127)

- **Causa trovata**: a ogni fotogramma `b_render` ridisegnava anche il pannello
  proprietà del nodo selezionato. Premendo su un nodo lo si seleziona, quindi
  durante ogni spostamento il pannello veniva ricostruito 60 volte al secondo:
  il costo di un fotogramma saliva da ~4 a ~15 ms, oltre il budget di 16 ms.
  Ora il pannello (e la cronologia della chat) si ridisegnano al rilascio.
  Misurato: 15,5 → 7,1 ms a fotogramma. Resta in v126 la ricostruzione dei soli
  nodi spostati, e la testata non viene più riscritta durante il trascinamento.

## Ricerca nella Knowledge Base (v128)

- **La digitazione non va più a scatti.** A ogni lettera si ricaricavano dal
  database tutti i documenti con l'intero testo (uno di 3,7 MB), si rifaceva il
  minuscolo su ognuno, si ricalcolavano le statistiche e si ricostruiva anche il
  campo di ricerca. Ora: documenti e testo minuscolo in cache (si ricalcolano
  solo se la tabella cambia), pausa di 140 ms che raccoglie le lettere, e si
  ridisegna la sola lista, non il campo. Con un documento da 4 MB: 1,6 ms per
  lettera.

## Salvataggi e bozze (v129)

- **Niente più «Nuovo agente (2), (3)…».** Un flusso mai salvato non crea più una
  riga nel database alla prima modifica: resta **bozza** (una per utente, in
  locale, ripristinata alla riapertura). L'autosave aggiorna soltanto agenti già
  salvati, **sul posto**: nessuna versione in più. La riga nasce quando premi 💾
  o metti il flusso in produzione.
- **Avviso alla chiusura.** Con un flusso nuovo non salvato nel Builder, chiudere
  o ricaricare la scheda viene fermato dal browser («vuoi uscire?»). Il browser
  non permette pulsanti «Salva / Non salvare» in quella finestra: restando, 💾 è
  a un clic. Uscendo dall'account compare lo stesso avviso, scritto per esteso.
- **La testata lo dice**: «bozza non salvata», in arancione.
- **«Pianifica» su un flusso nuovo propone il salvataggio** invece di rifiutare.

## Telefono: collegare i nodi (v130)

- **Le frecce si tirano col dito.** Due cause insieme: le porte, a zoom basso,
  sono grandi pochi pixel e il dito prendeva il nodo (selezionandolo); e al
  rilascio il collegamento non si chiudeva mai, perché il builder lo accetta solo
  se si rilascia *su una porta* e il ponte tocco rilasciava sul documento. Ora un
  tocco vicino a una porta tira la freccia (raggio proporzionato al nodo, così il
  corpo resta trascinabile), e al rilascio si aggancia l'ingresso più vicino
  entro 44 px.

## Collegare i nodi: basta entrare nel nodo (v131)

- **Su desktop e su telefono**, tirando una freccia il collegamento si crea
  rilasciando **ovunque dentro il nodo di destinazione**, non solo sulla porta di
  12 px. Si collega al suo ingresso. Vale anche riagganciando una freccia già
  esistente. Non si collega un nodo a sé stesso e non nascono archi doppi
  identici; rilasciando nel vuoto non succede niente.
