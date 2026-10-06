# Collaudo prima dell'esame, e cosa mostrare dal vivo

Due cose in un documento solo: la **lista di controllo** da fare il giorno
prima, e i **percorsi** da seguire se in sede di esame chiedono di vedere
qualcosa dal vivo.

---

# Parte 1 · Collaudo (40 minuti, il giorno prima)

Fallo sul dispositivo e sul browser che userai davvero. Se presenti dal
telefono, falla anche dal telefono: sono due collaudi diversi.

## 0 · Partenza pulita (5 min)

1. Chiudi tutte le schede di RelAItion e l'app installata, se c'è.
2. Riapri, **Ctrl+Shift+R**. In fondo al menu deve leggersi **v131**.
3. F12 → Console: nessun errore rosso al caricamento.
4. Giro veloce: Dashboard → Marketplace → Builder → I miei agenti → Log
   Esecuzioni → Monitoraggio → Learning Hub → Sfide → Community → Profilo.
   Nessuna pagina vuota, nessun errore.

## 1 · Il percorso centrale: costruisco ed eseguo (10 min)

Questo è il percorso che mostrerai. Deve funzionare tre volte di fila.

5. Builder → premi **Esegui** sul flusso di esempio che trovi già sulla tela.
   Deve dire **«Workflow completato»**, non «workflow non valido».
6. Nuovo agente: trascina un **Email trigger**, un blocco **AI**, un
   **Mascheramento dati** fra i due, e un **Output** in fondo.
7. Seleziona il blocco AI, scrivi un prompt nel campo, scegli formato **JSON**.
8. **Verifica**: deve dire «Struttura valida: il flusso è eseguibile».
9. **Esegui**: ogni nodo si accende, il registro si riempie, in fondo
   «Workflow completato».
10. Premi **«Perché questo risultato»**: si apre il riepilogo con fonti,
    decisioni e controlli.

## 2 · I due automatismi nuovi (5 min)

11. Costruisci un flusso con un nodo chiamato a mano `Webhook CRM` (nome che
    nella palette non esiste) → **Verifica** → deve comparire il pulsante
    **«Usa «Webhook»»**. Premilo: il nodo si sostituisce.
12. Se restano campi obbligatori vuoti, in fondo alla stessa finestra compare
    **«Compila»**: premilo e la verifica deve tornare pulita.

## 3 · Modelli AI e chiave (5 min, solo se mostrerai le risposte vere)

13. Pannello **Integrazione AI** → seleziona **OpenAI** → incolla una chiave
    **Anthropic**: deve dire che la chiave è di un altro fornitore, **senza**
    chiamare l'API.
14. Seleziona il fornitore giusto, incolla la chiave giusta, premi **Testa**:
    pallino verde.
15. Esegui un flusso: nel registro compare il nome del modello e i token.
16. **Rimuovi la chiave** («Rimuovila ora») prima di presentare, se non vuoi
    consumare credito durante la demo.

## 4 · Le sezioni di adozione (5 min)

17. Learning Hub → apri una lezione → rispondi al quiz → l'XP sale.
18. Premi **«Apri la sandbox didattica»**: i pulsanti Salva, Pubblica e
    Pianifica devono essere **spenti**. Esci: in «I miei agenti» non deve
    essere comparso niente.
19. Sfide → apri una sfida → iscriviti: il posto viene contato.
20. Community → scrivi un post → pubblicalo → il contatore in alto aumenta.
21. Profilo → i numeri in alto corrispondono al dettaglio sotto.

## 5 · Dal telefono (10 min) — *obbligatorio, inquadreranno il QR*

22. Inquadra il QR. Deve aprirsi la piattaforma, non una pagina di redirect
    con pubblicità.
23. Menu ☰ → si apre il pannello laterale → tocca una voce → si chiude da
    solo.
24. Builder → **🧩 Blocchi** → tocca un blocco: viene aggiunto al centro.
25. Trascina un nodo col dito: si sposta. Due dita: ingrandisce.
26. Tocca un nodo **una volta**: si seleziona e basta — il pannello **non**
    deve salire, e il pulsante in basso deve passare da «⚙️ Proprietà» al nome
    del nodo, colorato. È la cosa da verificare con più attenzione: prima il
    pannello saliva a ogni tocco e costruire un flusso era una lotta.
27. **Doppio tocco** sullo stesso nodo, oppure il pulsante in basso: *adesso*
    salgono le Proprietà. Trascinando due volte di seguito, invece, non deve
    aprirsi niente.
28. Esegui un flusso dal telefono: deve completarsi.
29. Marketplace, Learning Hub, Sfide, Community, Profilo: nessuna pagina deve
    scorrere in orizzontale.

## 6 · Prima di chiudere

30. Cancella gli agenti di prova creati durante il collaudo («I miei agenti»),
    così alla demo la piattaforma è nello stato pulito.
31. Ricarica una volta e rifai il punto 5: il flusso di esempio deve
    completarsi.

## 7 · Le correzioni dell'ultimo giro (10 min)

Cose cambiate negli ultimi giorni e che prima non c'erano nel collaudo.

a. **Bozza e chiusura.** Builder → «Nuovo» → trascina due blocchi e
   collegali. La testata dice **«bozza non salvata»** in arancione. Attendi
   due secondi: in «I miei agenti» **non** deve comparire niente. Prova a
   chiudere la scheda: il browser deve **fermarti**. Premi 💾, salva, chiudi di
   nuovo: ora si chiude libera. Modificando il flusso salvato più volte non
   devono nascere altri agenti.
b. **Collegare i nodi.** Tira una freccia dall'uscita di un nodo e rilascia
   **sul testo del nodo di destinazione**, non sulla porta: il collegamento si
   crea. Rilasciando nel vuoto non succede niente, e su sé stesso neanche.
c. **Trascinamento.** Sposta un nodo selezionato: il movimento deve restare
   fluido anche con un flusso da una dozzina di nodi.
d. **Ricerca nei documenti.** Knowledge Base → «Carica/gestisci documenti» →
   scrivi nel campo di ricerca: la digitazione non deve scattare, nemmeno col
   documento grande.
e. **Telefono (dal tuo telefono vero).** Tocca un nodo una volta: si seleziona
   e **non** sale il pannello; doppio tocco: sale. Trascina un nodo col dito.
   Tira una freccia fino dentro un altro nodo: si collega. Il pannello
   «Integrazione AI» è chiuso di default e si apre toccando il titolo. In alto
   ci sono 🔍 (ricerca), «+» (nuovo agente) e «⋯», con le icone centrate. Login
   scorrevole, anche in orizzontale.
f. **Profilo.** Accanto a «Modifica profilo» c'è **Esci** (anche su desktop).
g. **Dashboard.** Il grafico della settimana ha le date sotto i giorni e
   «oggi» evidenziato.

---

# Parte 2 · Cosa mostrare dal vivo, se chiedono

Tre percorsi pronti. Scegli in base alla domanda, **non** farli tutti.
Ognuno parte dalla piattaforma già aperta: non ricaricare, non rifare il login.

## Percorso A — «Costruitene uno adesso» (2 minuti)

Il più richiesto. Mostra la cosa centrale: una persona non tecnica che arriva
da un problema a un agente che gira.

1. Builder → **Nuovo**.
2. Dalla palette: **Email trigger**, poi un blocco **AI**, poi **Output**.
3. Collega i tre.
4. Seleziona il blocco AI → scrivi il prompt a voce alta mentre lo digiti:
   *«classifica questa richiesta e dimmi quanto è urgente»*.
5. **Esegui**.
6. Mentre gira: *«ogni blocco si accende quando lavora, e sotto il registro
   scrive cosa sta facendo mentre lo fa»*.
7. **«Perché questo risultato»**.

**Da dire alla fine**: «Nessuna riga di codice, e resta tutto tracciato.»

## Percorso B — «Fatemi vedere la governance» (1 minuto)

Se la domanda è su sicurezza, AI Act, dati personali.

1. Builder, flusso già sulla tela.
2. Dalla palette, categoria **Controlli** → trascina **Mascheramento dati
   personali** fra il trigger e il nodo AI.
3. **Esegui**.
4. Nel registro, indica la riga: *«identificatori mascherati»*.
5. Apri la palette dei Controlli e scorrila: *«questi sono tutti blocchi, non
   impostazioni nascoste: chi guarda la tela vede quali controlli ci sono.»*

**Da dire alla fine**: «Il modello elabora l'informazione, non il dato
sensibile. E si vede.»

## Percorso C — «Come si impara a usarla?» (90 secondi)

Se la domanda è su change management e adozione.

1. Learning Hub → quattro livelli → apri una lezione.
2. Scendi fino al quiz → rispondi → XP.
3. Premi **«Provalo adesso»**: porta nel punto esatto della piattaforma.
4. Torna indietro → **«Apri la sandbox didattica»** → indica i pulsanti
   spenti: *«qui si prova davvero, ma non si salva e non si pubblica niente.»*

**Da dire alla fine**: «Si impara sugli schermi veri, non in un ambiente
finto. E non si può rompere niente.»

## Percorso D — se chiedono il ciclo di pubblicazione (90 secondi)

1. Builder, flusso valido → **Pubblica**.
2. Mostra i controlli automatici, scegli l'ambito, invia.
3. Marketplace → **Revisiona pubblicazioni** → apri la richiesta.
4. *«Chi costruisce non si approva da solo»* → approva.

---

## Cosa NON aprire dal vivo

- **La demo guidata** (`demo.html`): è lo strumento con cui è stato fatto il
  video, non una funzione della piattaforma. Se parte, confonde.
- **Monitoraggio**, se non te lo chiedono: è denso e porta a domande di
  dettaglio che allungano senza aggiungere.
- **Il database** (📦 in alto): bellissimo per un tecnico, pericoloso con
  tutti gli altri.

## Se qualcosa non funziona dal vivo

Non insistere e non ricaricare davanti a tutti. Di': *«questa parte ve la
mostro dopo, intanto rispondo alla domanda»*, e continua a voce. Una
dimostrazione che si inceppa si recupera; una che si inceppa due volte, no.
