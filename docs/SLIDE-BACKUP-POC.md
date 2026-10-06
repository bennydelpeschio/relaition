# Slide di backup sul PoC

Tre slide da tenere **in appendice**, dopo il «Grazie». Non si mostrano: si
aprono solo se una domanda le chiama. Il professore ha chiesto esplicitamente
slide di backup strategiche, e queste sono quelle che coprono le domande più
probabili sul prototipo.

**Regola d'uso**: una domanda, una slide. Se apri la backup e poi parli tre
minuti, hai trasformato una risposta in una seconda presentazione.

---

## Slide B1 — «Come è fatto dentro»

**Si apre se chiedono**: architettura del prototipo, tecnologie, perché senza
server, quanto codice c'è.

### Titolo
> Il PoC sotto il cofano

### Contenuto (tre colonne)

**Come gira**
- Single Page Application, nessun framework
- SQLite compilato in WebAssembly, dentro il browser
- Progressive Web App: installabile, funziona offline
- Oltre 40 moduli JavaScript separati per responsabilità

**Perché così**
- Si apre da qualunque dispositivo, senza credenziali e senza installare
- Nessuno deve fidarsi di dove finiscono i suoi dati: restano sul dispositivo
- Lo schema dati è lo stesso che avrebbe il prodotto
- Esportabile in `.sqlite`, JSON e Markdown — nessun lock-in

**Cosa manca rispetto al prodotto** *(dichiarato)*
- Livello server, SSO aziendale, multi-tenant per tenant
- Proxy di inferenza e fatturazione a consumo
- Vector database per il RAG (nel PoC: TF-IDF + BM25)
- Suite di test automatici

### Nota a piè di slide
> Le semplificazioni del prototipo sono elencate per intero nel documento,
> capitolo 3.

**Come la commenti (20 secondi)**
> Abbiamo scelto la dimostrabilità sopra la completezza: volevamo che chiunque
> potesse aprirlo e provarlo, non che ci credesse sulla parola. Quello che
> manca è elencato, non nascosto.

---

## Slide B2 — «Il flusso di un'esecuzione»

**Si apre se chiedono**: come funziona davvero un agente, tracciabilità,
guardrail, AI Act, spiegabilità.

### Titolo
> Cosa succede quando un agente parte

### Contenuto (una catena orizzontale, con i presidi sopra e sotto)

```
   TRIGGER  →  CONTROLLO  →   NODO AI   →  CONDIZIONE  →  AZIONE  →  OUTPUT
      │           │              │             │            │          │
   dato in     maschera     fornitore e     ramo scelto   gate      traccia
   ingresso    i dati       modello per     e registrato  umano     completa
   (file, KB,  personali    singolo nodo                  se alto
   webhook)                 + RAG opz.                    rischio
```

**Sotto la catena, quattro righe:**
- **Validazione prima dell'esecuzione** — trigger, cicli, parametri
  obbligatori, raggiungibilità. Un flusso incompleto non parte.
- **Ordinamento topologico** — i nodi indipendenti girano in parallelo.
- **Eventi tipizzati** — ogni passaggio emette un evento: è quello che compone
  il registro e la risposta di «Perché questo risultato».
- **Ripiego fra fornitori** — se quello scelto non risponde, la chiamata passa
  a un altro collegato, e il registro lo dichiara.

**Come la commenti (25 secondi)**
> Il punto non è che l'agente funzioni: è che a esecuzione finita si possa
> ricostruire **perché** ha deciso così. Fonti usate, ramo scelto, controlli
> intervenuti. È la differenza fra automatizzare e potersene assumere la
> responsabilità.

---

## Slide B3 — «La Knowledge Base: dalla carta alla risposta»

**Si apre se chiedono**: RAG, allucinazioni, come fate a fidarvi delle
risposte, permessi sui documenti.

### Titolo
> Come un documento aziendale diventa una risposta affidabile

### Contenuto (pipeline in cinque fasi, poi il recupero in tre)

**Indicizzazione — cinque fasi**
1. **Acquisizione** con metadati di provenienza (business unit, riservatezza)
2. **Normalizzazione** in rappresentazione testuale uniforme
3. **Segmentazione differenziata per tipo**: normativa per articolo, contratto
   per clausola, procedura per passo, FAQ per scambio, tabella per riga
4. **Vettorizzazione** (TF-IDF nel PoC, embedding nel prodotto)
5. **Indicizzazione**

**Recupero — tre fasi**
1. **Filtro permessi** — applicato *prima* del punteggio: le porzioni non
   autorizzate non raggiungono né il calcolo né il modello
2. **Ricerca ibrida** semantica e lessicale (BM25) → punteggio combinato
3. **Riordino** sui soli candidati migliori: copertura dei termini, presenza
   esatta, vicinanza

**In fondo, la riga che conta:**
> Ogni porzione arriva al modello **con la citazione della fonte**, e il blocco
> «Verifica di fondatezza» confronta la risposta con le fonti recuperate.

**Come la commenti (25 secondi)**
> Il rischio di un agente non è che sbagli: è che sbagli in modo convincente.
> Qui ogni affermazione è riconducibile al documento che l'ha prodotta, e c'è
> un controllo che confronta la risposta con le fonti. Chi legge può risalire
> alla pagina.

---

## Se volete una quarta: «Il PoC in numeri»

Serve solo se la domanda è «quanto è grande questa cosa?». Numeri **veri**,
presi dalla piattaforma — se li metti, verificali il giorno prima perché
cambiano con l'uso.

| | |
|---|---|
| Agenti a catalogo | 20+ su 9 business unit |
| Blocchi nella palette | 78, in 11 categorie |
| Moduli JavaScript | 40+ |
| Tabelle nel database | 30 |
| Fornitori AI integrati | 4 + endpoint locale + custom |
| Modalità di avvio | 5 + webhook |
| Aree del monitoraggio | 7 |
| Livelli del Learning Hub | 4 |

**Attenzione**: non metterci metriche di adozione o ROI. Quelle sono del
capitolo 6 e hanno già la loro slide: ripeterle qui le indebolisce.

---

## Dove metterle nel mazzo

Dopo la slide «Grazie per l'attenzione», in una sezione **Appendice** separata
da una slide divisoria. Così:

1. Grazie per l'attenzione *(ultima slide "ufficiale")*
2. — Appendice —
3. B1 · Il PoC sotto il cofano
4. B2 · Cosa succede quando un agente parte
5. B3 · Dalla carta alla risposta
6. *(eventuale)* B4 · Il PoC in numeri

**Impostale come slide nascoste** nel software di presentazione: non compaiono
scorrendo, si raggiungono scrivendone il numero. Se scorri e ne mostri una per
sbaglio mentre chiudi, l'effetto è peggiore che non averle.
