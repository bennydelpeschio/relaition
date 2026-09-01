# RelAItion — marketplace no-code di agenti AI

**[▶ Prova l'applicazione](https://bennydelpeschio.github.io/relaition/relaition-mvp/)** — si apre nel browser, nessuna installazione richiesta.

Prototipo funzionante di una piattaforma aziendale per costruire, eseguire e
condividere agenti AI senza scrivere codice. Realizzato come Capstone Project
del Master in Artificial Intelligence della Rome Business School.

Gira **interamente nel browser**: nessun server, nessun backend, nessun dato
che lascia il computer di chi lo usa.

---

## Cosa fa

**Marketplace** — 22 agenti pronti divisi per business unit (Sales, Finance,
HR, Legal, Customer Service, Marketing, DevOps, Produttività, Insurance), con
valutazioni reali, recensioni e workflow visibile prima dell'installazione.

**Builder no-code** — 81 blocchi in 11 categorie da comporre su un canvas, o
descritti a parole a una chat che genera il flusso. Trigger, nodi AI, logica,
controlli di governance, connettori, output.

**Motore di esecuzione** — ordinamento topologico con esecuzione parallela per
ondate, sei stati per nodo, approvazione umana che sospende il flusso, ripresa
riproducibile di un'esecuzione passata.

**Knowledge Base** — documenti aziendali segmentati per struttura (articoli,
clausole, passi di procedura), recupero ibrido lessicale + vettoriale, filtro
per permessi, tracciabilità delle porzioni usate in ogni risposta.

**Governance** — 9 controlli configurabili (mascheramento dati, convalida
output, approvazione umana, difesa da istruzioni ostili, gestione eccezioni…),
politiche che li impongono per ambito di pubblicazione, e un cruscotto di
monitoraggio in sette aree calcolato sui dati reali.

**Ciclo di vita** — pubblicazione con verifica automatica, coda di revisione,
feedback all'autore, versionamento e sospensione post-pubblicazione.

**Learning Hub** — sei percorsi da sei lezioni con quiz, ognuna collegata alla
schermata di cui parla.

---

## Provarlo

### Nel browser (consigliato)

Apri **https://bennydelpeschio.github.io/relaition/relaition-mvp/** ed entra
con uno dei profili di prova (Mario R., Giulia D., Marco R., Sara L.).
Trovi già dentro dati dimostrativi: 5 flussi, 22 agenti a catalogo,
48 esecuzioni, documenti indicizzati, recensioni e pubblicazioni in revisione.

### Installarlo come applicazione

Dalla pagina, **Installa app** nella barra in alto — oppure l'icona di
installazione nella barra degli indirizzi di Chrome o Edge. RelAItion finisce
fra le applicazioni del computer e si apre in finestra propria, funzionando
anche offline.

### In locale

```bash
# Windows, senza dipendenze
powershell -ExecutionPolicy Bypass -File servi-locale.ps1
# poi apri http://localhost:8099
```

Aprendo `index.html` con un doppio clic l'applicazione funziona ugualmente, ma
il browser non ne consente l'installazione: è una regola di sicurezza che vale
per tutti i siti aperti da `file://`.

---

## Collegare un modello

La piattaforma è **agnostica rispetto al fornitore**: Claude, OpenAI, Gemini,
Mistral, un modello in locale (Ollama, LM Studio, LocalAI, Jan) o un endpoint
compatibile.

Nel Builder, pannello **Integrazione AI**: scegli il fornitore, incolla la tua
chiave, premi *Testa*. Ogni fornitore conserva la propria chiave in modo
indipendente. Sul singolo nodo puoi poi scegliere il modello specifico, oppure
lasciare `auto`.

> La chiave resta **nella scheda del browser** e sparisce chiudendola. Non
> viene scritta su disco, non finisce negli export, non passa da nessun server.
> Resta leggibile da chi apre la console di quella scheda: è una comodità da
> prototipo, dichiarata come tale.

Senza chiave l'applicazione funziona lo stesso: i nodi AI producono risposte
dimostrative, marcate come tali nel registro.

---

## Servizi locali opzionali (Windows)

Due script PowerShell che rendono reali due integrazioni, senza che le
credenziali passino mai dal browser:

```bash
powershell -ExecutionPolicy Bypass -File servizio-mail/relaition-mail.ps1
```
Invio email vero via SMTP. Le credenziali restano nel processo.

```bash
powershell -ExecutionPolicy Bypass -File servizio-webhook/relaition-webhook.ps1
```
Ricevitore di webhook per far partire i flussi da chiamate esterne.

Senza questi servizi le stesse azioni funzionano in modo dimostrativo e il
registro le marca `[simulato]`.

---

## Architettura

Nessun framework, nessun passo di build. HTML, CSS e JavaScript in moduli
caricati come script classici, più SQLite compilato in WebAssembly.

```
index.html            struttura e punti di innesto
css/                  5 fogli di stile
js/                   35 moduli — motore, builder, marketplace, KB, governance…
lib/sqljs/            SQLite via WebAssembly
servizio-mail/        relay SMTP locale (opzionale)
servizio-webhook/     ricevitore webhook locale (opzionale)
sw.js                 service worker: installabilità e funzionamento offline
ARCHITECTURE.md       come è fatto e perché, incluse le semplificazioni
```

Il database vive in **IndexedDB**, nel browser. Ogni origine
(`file://`, `localhost`, l'app installata) ha il proprio, perché il browser
isola i dati per origine: passando dall'una all'altra si trova una piattaforma
vuota, e non è un difetto.

---

## Portabilità

Dal Profilo, sezione *Backup e portabilità*, tre formati:

| Formato | Contenuto |
|---|---|
| `.sqlite` | copia 1:1 del database, apribile con qualunque client SQLite |
| `.json` | dati strutturati, re-importabili in un'altra installazione |
| `.md` | documentazione leggibile, pensata per sopravvivere alla piattaforma |

I flussi si esportano anche singolarmente in JSON, e ogni agente può essere
tradotto in uno **script Python equivalente**, eseguibile e pianificabile
fuori dal browser.

---

## Limiti dichiarati

Il prototipo dichiara ciò che non fa, invece di nasconderlo.

- **35 connettori su 39** non compiono azioni reali: Slack, Jira, Salesforce,
  SAP e gli altri non sono raggiungibili da una pagina web priva di backend.
  Ogni riga di registro che producono porta il marchio `[simulato]`. Agiscono
  davvero: invio email (con il servizio locale), richiesta HTTP, scrittura su
  cartella sincronizzata, esportazione file.
- **La ricerca semantica** usa TF-IDF combinato con BM25, non embedding
  neurali: coglie riformulazioni lessicali, non parafrasi.
- **Le esecuzioni pianificate** girano finché la scheda del browser resta
  aperta. Per un'esecuzione continua si genera lo script Python.
- **L'isolamento fra utenti** è un filtro sulle interrogazioni, non una misura
  di sicurezza: le password dei profili dimostrativi sono in chiaro nel codice.
- **Sui PDF che sono scansioni** non c'è OCR: il flusso dichiara il documento
  illeggibile invece di restituire caratteri casuali.
- **Il nodo Python Script** accetta e mostra il codice ma non lo esegue.

L'elenco completo, con le ragioni tecniche di ciascuna scelta, è in
[`ARCHITECTURE.md`](relaition-mvp/ARCHITECTURE.md).

---

## Contesto

Capstone Project — Master in Artificial Intelligence, Rome Business School.

Il Capitolo 3 della tesi descrive questa implementazione: struttura, builder,
motore di esecuzione, knowledge base, indipendenza dal fornitore e ciclo di
vita degli agenti.

## Licenza

Progetto accademico. Il codice è consultabile a scopo di studio e valutazione.
