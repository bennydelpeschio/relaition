# Prompt per Claude, allineare il documento alle ultime modifiche (v44)

Da usare in una **conversazione Claude** allegando:

1. `relaition-mvp aggiornata 20260912.zip`
2. il master document della tesi (capitoli, appendice, bibliografia)

Questo prompt è **incrementale**: presuppone che il documento sia già stato
allineato con il v43 (o comunque descriva la POC di inizio settembre). Se non
lo è, usa prima il v43, che fa il riallineamento completo, e poi questo.

---

## PROMPT DA INCOLLARE

Ti allego lo zip della POC RelAItion e il master document della tesi. Il
documento è stato riallineato di recente; da allora la POC ha avuto una serie
di modifiche **puntuali**, che ti elenco sotto una per una con il punto del
documento in cui intervenire. Il tuo compito non è rileggere tutto: è
applicare queste modifiche, verificare nel codice che siano vere, e dirmi se
toccano altro.

Fonti nello zip: `ARCHITECTURE.md` dalla sezione **§5.145 alla §5.150** (le
ultime sei), `NOTE-DI-RILASCIO.md` (blocco «Versione del 12 settembre 2026»),
`brand/LEGGIMI.md`, `demo/LEGGIMI.md`. Il codice vince sempre sulla
documentazione: se trovi una discordanza, segnalamela.

### Le modifiche, e dove intervenire

Per ognuna: trova il punto indicato nel documento, dimmi **se c'è** una frase
da cambiare, e **scrivi il testo nuovo** pronto da incollare, nello stile del
capitolo. Se il punto non esiste nel documento, dimmi dove andrebbe aggiunto.

1. **Identità visiva ufficiale.** Il logo con il claim *Learn / Build / Share
   / Grow* compare nella schermata di accesso, in quella di avvio, nella demo;
   il segno nel menu laterale; l'icona dell'app installabile viene dall'asset
   ufficiale. → *Dove*: capitolo 3, sezione sull'interfaccia e sul design
   system (palette, tipografia); appendice, elenco degli asset se esiste. Se il
   documento mostra la palette colori, verifica che coincida con quella del
   foglio di brand (#4F46E5, #6366F1, #A855F7, #E9E7FF, #0F172A). **Tutti gli
   screenshot con il vecchio logo (fulmine) o con il vecchio verde vanno
   rifatti**: elencameli.

2. **Tema chiaro/scuro.** Interruttore nella barra in alto, scelta salvata nel
   browser, predefinito chiaro; applicato prima del primo disegno. Le finestre
   di verifica, gli avvisi, i badge e i quiz sono leggibili in entrambi i temi.
   → *Dove*: capitolo 3, interfaccia/accessibilità; se c'è una tabella delle
   funzionalità trasversali, aggiungere una riga. Limite da dichiarare: i
   riquadri di avviso ambra/rossi restano volutamente riconoscibili, non
   «armonizzati».

3. **Sandbox didattica senza persistenza.** Salva, Pubblica e Pianifica non
   disponibili (pulsanti spenti, messaggio esplicito); Esporta e Python
   restano; **le esecuzioni nella sandbox non entrano nello storico né nel
   Monitoraggio**; cambiare persona con la sandbox aperta la chiude prima. →
   *Dove*: capitolo 3 dove si descrive la sandbox (probabilmente accanto al
   Learning Hub o alla governance); capitolo 4 se la sandbox è citata nel
   percorso formativo AI Creator. Se il documento dice «palette ridotta» e
   basta, va aggiunto che è anche senza persistenza per scelta.

4. **Ingresso alla sandbox.** Pulsante proprio nel Learning Hub, accanto al
   giro guidato (era un collegamento in piccolo). Un pulsante «Impara» nella
   barra in alto è stato provato e tolto: se per caso il documento lo cita,
   va rimosso. → *Dove*: capitolo 3, Learning Hub.

5. **Aiuto alla scrittura** (`js/aiuto-testo.js`): sotto il prompt di ogni nodo
   AI, sotto il contesto del flusso e sotto ogni area di testo dei nodi, un
   collegamento «Aiutami a scriverlo» che chiede l'obiettivo a parole e fa
   scrivere o migliorare il testo al modello collegato, con contesto del nodo
   e campi a monte; risultato ripristinabile; senza modello lo dichiara. →
   *Dove*: capitolo 3, Builder, accanto alla costruzione conversazionale. È
   una funzione **nuova**: quasi certamente assente. Vale una figura (il
   pannello sotto il prompt) e una riga nella tabella delle funzioni del
   Builder, se c'è.

6. **A capo nella chat del Builder e nelle etichette delle frecce** (fino a tre
   righe, disegnate anche sulla tela). → *Dove*: capitolo 3, Builder; se c'è
   una figura della chat o di una freccia etichettata, va rifatta.

7. **Registro di esecuzione espandibile**: righe su una riga sola che si aprono
   al clic con il testo intero; il taglio alla fonte (80 caratteri) non c'è
   più, resta un tetto dichiarato di 4000. → *Dove*: capitolo 3, esecuzione e
   tracciabilità.

8. **Demo guidata**: 97 passi in 10 capitoli; il capitolo 10 esce e rientra con
   un altro account per mostrare i dati per persona; nelle Sfide si vede
   iscrizione, candidatura, classifica calcolata e domande all'AMA; nel
   Learning Hub il quiz viene risposto davvero; in Community un post viene
   scritto e pubblicato. → *Dove*: capitolo 3 o appendice, dove si descrive la
   demo o la validazione; aggiornare il numero di passi e capitoli se citato.

9. **Dati**: le iscrizioni alle sfide vengono ricostruite dalle candidature
   (migrazione in `js/db.js`); il dettaglio della classifica usa il singolare
   corretto («1 controllo»). → *Dove*: capitolo 3, modello dati / migrazioni,
   solo se il documento entra a quel livello; altrimenti niente.

10. **Pulizia tipografica**: nei testi visibili non ci sono più trattini
    lunghi né emoji nei titoli. → *Dove*: nessun paragrafo da cambiare, ma
    **gli screenshot con titoli che iniziano con un'emoji sono vecchi**:
    segnalameli insieme a quelli del punto 1.

11. **Esempio `esempi/4-invoice-extractor.json`**, che corrisponde alla tabella
    3.H.2 (Invoice Extractor, Finance). → *Dove*: verifica che tabella e flusso
    coincidano passo per passo (nodo 1 Email trigger, 2 Estrazione a schema
    JSON, 3 Convalida output, 4 Condizione sulla soglia, 5a QuickBooks + email
    al responsabile, 5b Approvazione umana + email al richiedente, 6 Output);
    aggiungere il file all'appendice se l'appendice elenca gli esempi.

### Cosa mi devi restituire

- Per ognuno degli 11 punti: **trovato / non trovato** nel documento, punto
  esatto (titolo di sezione o frase da cercare), azione (sostituisci /
  integra / togli), **testo nuovo pronto**.
- L'elenco degli **screenshot da rifare**, con la schermata, lo stato in cui
  farla (utente, pagina, tema chiaro) e il motivo. Se un solo screenshot
  copre più punti, dillo.
- Le **figure** da aggiungere (al massimo due: aiuto alla scrittura, tema
  scuro).
- I **rimandi all'appendice** che cambiano numerazione, se ne aggiungi voci.
- Una riga finale: dopo questi interventi, c'è **altro** nel documento che non
  corrisponde alla POC? Se sì, cosa.

### Regole

Non inventare funzionalità: se un punto non trova riscontro nel codice, dillo.
Non riscrivere capitoli: interventi puntuali. Se il documento è ancora fermo a
prima di settembre, fermati e dimmelo: serve prima il prompt completo (v43).
Scrivi in italiano, nel registro del documento.
