# Dimostrazione guidata di RelAItion

Una demo che **si guida da sola**: naviga l'applicazione vera, illumina
l'elemento di cui parla, compie le azioni e racconta cosa sta facendo, passo per
passo. Serve per registrare un video da mostrare a una commissione o a un
investitore senza dover guidare il mouse a mano.

**71 passi in 9 capitoli, circa 15 minuti** in riproduzione automatica. Il peso
sta sul Builder: costruzione a mano, costruzione conversazionale, dettaglio dei
nodi, esecuzione e pianificazione occupano da soli quattro capitoli su nove.

---

## Come si avvia

L'applicazione dev'essere servita via `http://`, non aperta come file.

```bash
powershell -ExecutionPolicy Bypass -File servi-locale.ps1
```

Poi apri:

```
http://localhost:8099/demo/demo.html
```

---

## Come si registra

1. Apri la pagina della demo e aspetta che compaia il primo riquadro.
2. Premi **H** per nascondere la barra dei comandi (nel video non serve).
3. Avvia il registratore. Su Windows 11: **Win + Alt + R** (Xbox Game Bar),
   che registra la finestra attiva in MP4 e, se vuoi, anche il microfono.
4. Premi **P**: la demo parte e va avanti da sola fino alla fine.
5. A fine demo premi di nuovo Win + Alt + R per fermare la registrazione.

Se preferisci commentare a voce, non premere P: avanza tu con **→** quando hai
finito di parlare su un passaggio.

### Comandi

| Tasto | Cosa fa |
|---|---|
| **→** o spazio | passo successivo |
| **←** | passo precedente |
| **P** | avvia o mette in pausa la riproduzione automatica |
| **I** | apre l'indice dei capitoli, per saltare dove serve |
| **H** | nasconde o rimostra la barra dei comandi |

Nella barra ci sono anche la **velocità** (1× → 1,5× → 2× → 0,75×) e il tasto
**⟲** che ricomincia da capo ripristinando lo stato.

---

## Cosa mostra

| Capitolo | Contenuto |
|---|---|
| 1 | Accesso, i quattro profili, dashboard, struttura del menu |
| 2 | Marketplace: filtri, ricerca, scheda agente, recensioni, installazione |
| 3 | Builder e **Knowledge Base**: le tre zone, la palette, i documenti aziendali e una ricerca vera fra le loro porzioni |
| 4 | **Costruzione a mano**: ricerca nella palette, blocchi trascinabili, nodo AI selezionato con i suoi campi spiegati, prompt **scritto a video**, un nodo di controllo **inserito fra due nodi esistenti**, output, annullamento |
| 5 | Collegamento e **test del modello**, scelta del modello per nodo, validazione, **costruzione via chat** con **anteprima da confermare o annullare**, richiesta di modifica a tela piena, e **pianificazione** (manuale, a intervallo, a orario, cron, su evento) |
| 6 | **Esecuzione** di due flussi completi, registro che **scorre riga per riga**, **interruzione a metà**, «Perché questo risultato», storico |
| 7 | Pubblicazione, coda di revisione, richiesta di modifica, correzione, ripresentazione, approvazione |
| 8 | Learning Hub, Sfide, Community |
| 9 | Profilo, obiettivi configurabili, Monitoraggio e le sue sette aree |

I numeri che compaiono nella narrazione — quanti agenti, quante lezioni, quante
discussioni, quante voci nel registro — **non sono scritti nel copione**: si
leggono dall'applicazione mentre la demo gira. Se domani il seme cambia, il
racconto resta vero senza doverlo ricorreggere.

---

## Due cose da sapere

### Non lascia traccia

All'avvio la demo **fotografa tutte le 29 tabelle** del database e le rimette
identiche alla fine, o quando premi ⟲. Puoi rilanciarla quante volte vuoi: la
piattaforma torna sempre nello stato di partenza, senza agenti di prova, post o
pubblicazioni rimasti in giro.

Se interrompi la demo chiudendo la scheda a metà, il ripristino non avviene:
riapri la demo e premi ⟲, oppure ricarica l'applicazione.

### Collega una chiave prima di registrare

Tre punti della demo **si adattano** a quello che la piattaforma permette
davvero, invece di simulare un passaggio che non sarebbe stato possibile:

| Passaggio | Con una chiave collegata | Senza |
|---|---|---|
| Test del modello (cap. 5) | dichiara il fornitore attivo | dichiara che non c'è chiave e che i nodi AI verranno bloccati |
| Costruzione via chat (cap. 5) | il modello compone il flusso sulla tela | la chat lo dichiara e non genera nulla |
| Pubblicazione (cap. 7) | modulo, controlli automatici, invio in revisione | mostra il rifiuto della validazione, e il ciclo di revisione prosegue su una pubblicazione reale già presente |

Il ciclo di revisione — richiesta di modifica, correzione, ripresentazione,
approvazione — si vede **in entrambi i casi**.

**Per una registrazione destinata a una commissione, collega una chiave nel
pannello «Integrazione AI» prima di premere P.** La demo diventa completa e
mostra chiamate al modello vere. Serve una chiave tua: incollane una solo sul
tuo computer, e ricorda che resta nel `localStorage` del browser finché non la
rimuovi dal pannello.

---

## Come è fatta

La demo vive **fuori** dall'applicazione: RelAItion viene caricata dentro un
riquadro e pilotata da queste pagine. Nessun file dell'app è stato modificato,
nessun pulsante aggiunto, nessuna riga di logica toccata. Cancellando la cartella
`demo/`, la piattaforma resta identica.

| File | Cosa contiene |
|---|---|
| `demo.html` | il palco: riquadro, faretto, riquadro di narrazione, comandi |
| `motore.js` | fotografia e ripristino, avanzamento, puntatore, posizionamento |
| `copione.js` | i 61 passi: cosa fa ognuno, cosa illumina, cosa racconta |

Funziona perché pagina e applicazione condividono l'origine: da lì si chiamano
`go()`, `dbAll()` e le altre funzioni esattamente come farebbe il codice
dell'app. Per lo stesso motivo **la demo va aperta dallo stesso server**
dell'applicazione: da `file://` non funziona.
