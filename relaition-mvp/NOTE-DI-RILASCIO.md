# RelAItion, note di rilascio

**Versione del 6 settembre 2026**

Questo aggiornamento nasce quasi interamente dalle segnalazioni della sessione di test.
Qui sotto c'è cosa è cambiato e, dove utile, perché.

---

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
