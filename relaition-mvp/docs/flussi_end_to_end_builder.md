# Cinque flussi end-to-end per il Builder

Specifiche complete per costruire e dimostrare cinque agenti funzionanti.
Servono a due scopi: essere realizzati nella POC, e alimentare i par. 3.4 e
3.4.5 del capitolo con casi concreti anziché descrizioni generiche.

## Come leggere le schede

Ogni flusso indica: i nodi in sequenza, la configurazione essenziale di
ciascuno, il payload di prova da usare in demo, e cosa deve essere visibile
sul canvas durante l'esecuzione. I nodi di controllo sono indicati
esplicitamente perché senza di essi il flusso non supererebbe la verifica
automatica di pubblicazione (par. 3.8.2).

## Regola generale di costruzione

Un flusso ben formato rispetta cinque condizioni, verificate dal motore prima
dell'avvio:

1. Un solo nodo trigger, salvo che il flusso debba attivarsi da origini diverse
2. Ogni nodo raggiungibile a partire dal trigger
3. Ogni diramazione con entrambi i rami collegati, anche quando uno termina
   immediatamente
4. Almeno un nodo terminale che registri l'esito
5. I nodi che scrivono su sistemi esterni preceduti da un componente di
   controllo, se la politica dell'organizzazione lo impone

---

# Flusso 1 — Qualificazione dei contatti commerciali

**Business unit:** Sales
**Dimostra:** diramazione condizionale, scrittura su due sistemi diversi
**Durata attesa:** 8-12 secondi

## Nodi

| # | Tipo | Configurazione |
|---|---|---|
| 1 | Trigger — chiamata esterna | Riceve il contatto dal modulo web o dal gestionale commerciale |
| 2 | Controllo — mascheramento | Sostituisce nome, email e telefono con segnaposto prima del passaggio al modello |
| 3 | AI — classificazione | Assegna un punteggio da 0 a 100 valutando dimensione azienda, settore, ruolo dichiarato e testo della richiesta. Output vincolato a schema: `{punteggio, motivazione, settore_normalizzato}` |
| 4 | Condizione | `punteggio >= 70` |
| 5a | Action — messaggistica (ramo vero) | Notifica il canale commerciale con sintesi e punteggio |
| 5b | Action — gestionale (ramo falso) | Aggiorna il record con esito "da coltivare" e programma un richiamo |
| 6 | Output — registrazione | Scrive l'esito nella traccia |

## Payload di prova

```json
{
  "azienda": "Ferrarini Componenti SRL",
  "dipendenti": 140,
  "settore": "meccanica di precisione",
  "contatto": "Responsabile Produzione",
  "richiesta": "Vorremmo capire se riuscite a integrare il nostro gestionale per la programmazione della produzione. Abbiamo tre stabilimenti."
}
```

Con questo input il punteggio deve risultare alto e attivare il ramo vero.
Per mostrare l'altro ramo, ripetere con un'azienda di 4 dipendenti e una
richiesta generica.

## Cosa deve vedersi in demo

Il nodo di mascheramento che interviene prima del modello; la diramazione con
un ramo completato e l'altro marcato come saltato; l'output strutturato del
nodo di classificazione nel pannello di tracciamento.

---

# Flusso 2 — Estrazione dati da fattura passiva

**Business unit:** Finance
**Dimostra:** output vincolato da schema, validazione, ciclo di nuovo tentativo
**Durata attesa:** 10-15 secondi

## Nodi

| # | Tipo | Configurazione |
|---|---|---|
| 1 | Trigger — arrivo documento | Attivato dal caricamento di un file nella cartella monitorata |
| 2 | AI — estrazione | Estrae i campi dal documento. Output vincolato: `{fornitore, piva, numero, data, imponibile, iva, totale, righe[]}` |
| 3 | Controllo — convalida output | Verifica che `imponibile + iva = totale` con tolleranza di un centesimo, e che la partita IVA rispetti il formato |
| 4 | Condizione | Convalida superata? |
| 5a | Action — gestionale (ramo vero) | Crea la registrazione contabile in stato provvisorio |
| 5b | Controllo — approvazione umana (ramo falso) | Sospende e presenta il documento all'addetto con i campi estratti modificabili |
| 6 | Output — registrazione | Traccia l'esito con indicazione se l'estrazione ha richiesto intervento |

## Payload di prova

Preparare due file: una fattura leggibile e ben strutturata, e una con
importi che non quadrano o partita IVA malformata. Il secondo caso attiva la
sospensione ed è il più interessante da mostrare.

## Cosa deve vedersi in demo

Lo stato di attesa sul nodo di approvazione, con l'esecuzione ferma finché
l'operatore non interviene. È la dimostrazione più diretta del principio di
sorveglianza umana descritto al par. 3.3.7.

---

# Flusso 3 — Risposta a richiesta di assistenza con conoscenza aziendale

**Business unit:** Customer Service
**Dimostra:** recupero dalla Knowledge Base, tracciabilità della fonte,
verifica di fondatezza
**Durata attesa:** 12-18 secondi

## Prerequisito

Caricare nella Knowledge Base almeno tre documenti: condizioni di servizio,
procedura di reso, elenco domande frequenti. Devono contenere informazioni
non deducibili dal senso comune, altrimenti non si dimostra nulla: per
esempio una finestra di reso di 21 giorni anziché i consueti 14.

## Nodi

| # | Tipo | Configurazione |
|---|---|---|
| 1 | Trigger — posta in arrivo | Casella di assistenza |
| 2 | AI — classificazione | Determina categoria e urgenza. Output vincolato: `{categoria, urgenza, riassunto}` |
| 3 | AI — risposta con Knowledge Base | Opzione "Usa Knowledge Base" attiva, filtro sulla business unit. Istruzione: rispondere citando la fonte e dichiarare esplicitamente quando l'informazione non è disponibile |
| 4 | Controllo — verifica di fondatezza | Confronta la risposta con le porzioni recuperate e segnala affermazioni non supportate |
| 5 | Condizione | Urgenza alta o verifica non superata? |
| 6a | Controllo — approvazione umana (ramo vero) | Sottopone la bozza all'operatore |
| 6b | Action — invio risposta (ramo falso) | Invia la risposta al richiedente |
| 7 | Output — registrazione | Traccia porzioni utilizzate ed esito della verifica |

## Payload di prova

```
Oggetto: Reso prodotto acquistato

Buongiorno, ho acquistato il vostro prodotto il 3 del mese scorso
e vorrei restituirlo. Sono ancora in tempo? Come devo procedere?
```

Poi ripetere con una domanda a cui la Knowledge Base non risponde, per
mostrare che l'agente dichiara di non sapere anziché inventare.

## Cosa deve vedersi in demo

Le porzioni recuperate nel pannello di tracciamento, con nome del documento e
grado di affinità; la risposta che cita la fonte; il secondo caso in cui
l'agente dichiara l'assenza dell'informazione. Questo è il flusso che dimostra
la tesi centrale del par. 3.6.

---

# Flusso 4 — Istruttoria di sinistro assicurativo

**Business unit:** Insurance
**Dimostra:** invocazione autonoma degli strumenti, diramazione, tracciabilità
normativa
**Durata attesa:** 20-30 secondi

Questo è il flusso principale della dimostrazione, già descritto al par. 3.4.5.

## Nodi

| # | Tipo | Configurazione |
|---|---|---|
| 1 | Trigger — chiamata esterna | Riceve la denuncia dal portale o dall'intermediario |
| 2 | Controllo — mascheramento | Anonimizza dati anagrafici e identificativi di polizza |
| 3 | AI — normalizzazione | Estrae e uniforma i campi dalla descrizione libera. Output vincolato |
| 4 | AI — valutazione con strumenti abilitati | Calcola un indice di anomalia. **Strumenti resi disponibili al modello:** consultazione storico sinistri, verifica copertura, ricerca su Knowledge Base delle casistiche note. Il modello decide quali invocare |
| 5 | Condizione | `indice >= 75` oppure presenza di anomalie critiche |
| 6a | Action — apertura caso istruttorio (ramo vero) | Crea il caso con allegata la motivazione dell'agente |
| 6b | Action — avvio liquidazione (ramo falso) | Aggiorna lo stato e notifica il liquidatore |
| 7 | Output — registrazione | Traccia completa per audit |

## Payload di prova

```json
{
  "polizza": "RC-2026-847123",
  "importo_dichiarato": 18500,
  "data_evento": "2026-07-15",
  "data_denuncia": "2026-07-29",
  "descrizione": "Collisione in area di parcheggio, nessun testimone presente",
  "sinistri_ultimi_24_mesi": 3
}
```

I tre elementi che devono far salire l'indice: scarto di due settimane fra
evento e denuncia, assenza di testimoni, tre sinistri recenti. Preparare anche
un caso ordinario per mostrare il ramo di liquidazione rapida.

## Cosa deve vedersi in demo

Il nodo di valutazione che invoca due o tre strumenti in sequenza, visibili
nel pannello di tracciamento come chiamate distinte, con la motivazione di
ciascuna. È l'unico punto della demo in cui si vede che il modello sceglie
autonomamente cosa fare, ed è il fondamento del par. 3.3.5.

---

# Flusso 5 — Rapporto settimanale con delega a sotto-agenti

**Business unit:** Trasversale
**Dimostra:** orchestrazione multi-agente, esecuzione pianificata, esecuzione
parallela
**Durata attesa:** 30-45 secondi

## Prerequisito

I flussi 1, 2 e 4 devono essere già pubblicati, poiché questo agente li invoca.

## Nodi

| # | Tipo | Configurazione |
|---|---|---|
| 1 | Trigger — pianificato | Ogni lunedì alle 7:00 |
| 2a | Chiamata agente | Invoca un sotto-agente che riepiloga l'attività commerciale della settimana |
| 2b | Chiamata agente | Invoca un sotto-agente che riepiloga le registrazioni contabili |
| 2c | Chiamata agente | Invoca un sotto-agente che riepiloga i sinistri trattati |
| 3 | Logica — convergenza | Attende il completamento dei tre rami e ne unisce gli output |
| 4 | AI — composizione | Redige il rapporto unitario a partire dai tre contributi |
| 5 | Controllo — limitatore | Interrompe se la durata complessiva supera la soglia |
| 6 | Action — invio | Recapita il rapporto alla direzione |
| 7 | Output — registrazione | Traccia con riferimento alle esecuzioni dei sotto-agenti |

## Cosa deve vedersi in demo

I tre nodi di chiamata che passano in elaborazione contemporaneamente anziché
in sequenza, e il nodo di convergenza che attende il più lento. Il pannello di
tracciamento deve mostrare il passaggio di controllo verso ciascun
sotto-agente e il ritorno. Questo flusso dimostra insieme il parallelismo
descritto al par. 3.3.4 e la delega fra agenti del par. 3.3.5.

---

# Ordine consigliato per la presentazione

| Ordine | Flusso | Motivo |
|---|---|---|
| 1 | Qualificazione contatti | Il più semplice; introduce nodi, diramazione ed esecuzione |
| 2 | Assistenza con Knowledge Base | Introduce la conoscenza aziendale, che è l'elemento distintivo |
| 3 | Istruttoria sinistro | Il caso completo; dimostra l'autonomia del modello nella scelta degli strumenti |
| 4 | Estrazione fattura | Mostra la sospensione per approvazione umana |
| 5 | Rapporto settimanale | Chiude mostrando che gli agenti si compongono fra loro |

Se il tempo è limitato, i flussi 2 e 3 sono sufficienti: coprono conoscenza
aziendale, invocazione autonoma degli strumenti, diramazione e tracciabilità.

# Cosa preparare prima della presentazione

- Knowledge Base popolata con almeno cinque documenti reali o verosimili
- Chiave di accesso al fornitore di inferenza inserita e connessione verificata
- I cinque flussi già costruiti e salvati, non da comporre dal vivo
- Almeno una decina di esecuzioni pregresse nella traccia, così che il quadro
  di sintesi non mostri valori a zero
- Un'esecuzione fallita fra quelle pregresse, per mostrare che la traccia
  registra anche gli insuccessi
- Un flusso in coda di revisione, per mostrare la pubblicazione senza doverla
  avviare dal vivo

# Uso nel capitolo

I flussi 1 e 4 sono già richiamati ai par. 3.4.1 e 3.4.5. Il flusso 3 andrebbe
aggiunto al par. 3.6 come esempio applicativo del recupero semantico, e il
flusso 5 al par. 3.3.5 come illustrazione della delega fra agenti. Il flusso 2
può restare confinato alla dimostrazione, oppure sostituire l'attuale
descrizione dell'estrazione fatture al par. 3.4.3, che è più generica.
