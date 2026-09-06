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

* **I quattro livelli di certificazione sono collegati ai percorsi.** Il testo prometteva la progressione da AI Aspirant ad AI Ambassador senza che alcun percorso vi fosse associato: nessuno poteva raggiungerli. Ora ogni percorso dichiara il livello a cui appartiene, e un livello si considera raggiunto quando sono completi tutti i percorsi fino a quel punto.

* **L'attestato si scarica.** File grafico con nome, ruolo, organizzazione, data e codice di verifica. Se cambi il nome nel profilo e lo riscarichi, riporta quello nuovo.

* **La classifica compare anche in Sfide ed Eventi**, in cima, con la tua posizione sul totale.

---

## Community

* **Le immagini si aprono.** Clic su un'immagine di un post e si apre a schermo intero, con ingrandimento dal 25% al 400% e scorrimento fra le immagini degli altri post. Esc chiude, le frecce scorrono. Nel dettaglio del post l'immagine ora si vede intera invece che ritagliata.

* **Dieci post in più**, sui meccanismi che la piattaforma implementa davvero: il ciclo di pubblicazione, la spiegabilità delle esecuzioni, il recupero dalla Knowledge Base, i controlli sui dati personali. Tre includono uno schema.

---

## Aspetto

* **Nuova identità cromatica**, blu e viola su bianco, al posto del verde.

* **Il verde resta dove significa qualcosa.** Nel passaggio di tema alcuni indicatori di esito riuscito avevano preso il colore del marchio, diventando blu: un'esecuzione riuscita e una qualsiasi altra cosa si somigliavano troppo. Ora il colore identitario e quello semantico sono separati, e i pallini di successo sono di nuovo verdi.

---

## Corretto durante le verifiche

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
