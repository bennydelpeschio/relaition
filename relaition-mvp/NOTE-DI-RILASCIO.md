# RelAItion, note di rilascio

**Versione del 6 settembre 2026**

Questo aggiornamento nasce quasi interamente dalle segnalazioni della sessione di test.
Qui sotto c'è cosa è cambiato e, dove utile, perché.

---

## Cose che non funzionavano

* **Il nodo Loop ora itera davvero.** Il blocco esisteva ma attraversava il flusso una volta sola: il registro riportava una riga e si proseguiva. Adesso conta gli elementi realmente prodotti dai nodi a monte e ripercorre i nodi a valle uno per ciascun elemento, scrivendo "Iterazione 3 di 50". Nel campo *lista* si indica il nome del campo che contiene l'elenco; in alternativa si dichiara un numero fisso di ripetizioni. C'è un tetto di sicurezza a 25 iterazioni, e quando interviene il registro lo dichiara invece di troncare in silenzio.

* **La ricerca del catalogo filtra i risultati.** Prima li calcolava e li scartava, mostrando un avviso e portando al marketplace non filtrato: in pratica bisognava conoscere il nome esatto dell'agente. Ora la ricerca cerca in nome, descrizione, categoria, autore ed etichette, si combina con il filtro di categoria, ignora gli accenti e confronta la radice della parola, quindi *fatture* trova quello che trovava *fattura*. Con più parole, se nulla le contiene tutte, ripiega sulle corrispondenze parziali dicendo che lo sta facendo. Se non trova nulla lo spiega e offre una via d'uscita, invece di lasciare una griglia vuota.

* **Le statistiche personali sono davvero personali.** Dashboard e Profilo mostravano i totali della piattaforma sotto l'etichetta "la tua attività": l'intestazione diceva 10 agenti e 50 esecuzioni mentre il corpo della stessa pagina ne contava 2 e 19. Ora ogni numero è filtrato sull'utente collegato.

* **Il pulsante Esegui in "I miei agenti" esegue.** Prima attendeva due secondi e registrava un successo con zero nodi attraversati: non eseguiva niente. Adesso usa lo stesso motore del builder, e al termine mostra dove è finito il risultato invece di lasciarti cercare.

* **La classifica esperienza è calcolata.** Conteneva sei nomi con punteggi scritti nel codice, due dei quali non corrispondevano ad alcun utente, e guadagnare esperienza non la spostava di una posizione. Ora somma i punti realmente registrati.

* **Rinominare il proprio profilo aggiorna tutto.** L'attribuzione seguiva 14 colonne su poche tabelle: dopo una rinomina alcuni contenuti restavano intestati al nome vecchio. Ora ne segue 23 su 22 tabelle.

---

## Cose che c'erano ma non si trovavano

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
