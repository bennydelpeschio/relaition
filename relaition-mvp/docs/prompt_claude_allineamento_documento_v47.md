# Prompt per Claude, allineare il documento (v47): quota automatica senza selettore, aiuto alla scrittura

Da usare in una **conversazione Claude** allegando:

1. `relaition-mvp aggiornata 20260914b.zip`
2. il master document della tesi (capitoli, appendice, bibliografia)

Incrementale: presuppone il documento allineato con il v46 (quota di prova
usabile). Se il v46 non è stato applicato, applicalo prima e poi questo:
il v47 **toglie una cosa** dal v46 (il selettore della fonte) e ne aggiunge
due piccole.

---

## PROMPT DA INCOLLARE

Ti allego lo zip della POC RelAItion e il master document della tesi. Tre
punti, con focus su **capitolo 3 e appendice**. Fonti nello zip:
`ARCHITECTURE.md` **§5.156 (riscritto), §5.157, §5.158**, `js/consumo.js`,
`js/ai-client.js`, `js/aiuto-testo.js`. Il codice vince sulla documentazione.

### 1. Il selettore «Fonte delle chiamate» non esiste più (corregge il v46)

Il v46 descriveva tre scelte per persona (automatico, sempre la quota, solo la
mia chiave), nel pannello Integrazione AI e nel profilo. **Tolto.** La regola
è una sola e automatica, `usaQuota()`:

- con un fornitore collegato i nodi AI usano quello, e la quota non si tocca;
- senza fornitore, finché resta quota, usano la quota di prova: risposte
  **simulate** e dichiarate tali (riga SISTEMA in testa al registro, prefisso
  su ogni riga AI, fornitore `quota-prova` nel conto dei token, prefisso
  «[quota di prova]» nel riepilogo, che la pubblicazione non conta come
  collaudo);
- la validazione blocca solo se non c'è **né chiave né quota**;
- costruzione via chat e aiuto alla scrittura continuano a rifiutare la quota.

Tutto il resto del v46 resta vero. Motivo del ritiro, se serve una frase: il
selettore non copriva nessun caso d'uso reale (con la chiave nessuno vuole
risposte simulate; senza chiave l'alternativa alla quota è non eseguire) e
confondeva.

→ *Dove*: (a) capitolo 3, profilo e Builder: **cancella** ogni frase su «la
persona sceglie la fonte», «automatico / sempre la quota / solo la mia
chiave», «riquadro Fonte delle chiamate»; riscrivi in una frase la regola
automatica; (b) **validazione**: «non parte senza un modello collegato né
quota disponibile» resta, togli il pezzo «con la fonte su "solo la mia
chiave" torna a bloccare»; (c) modello commerciale e semplificazioni: nessun
cambiamento se non citano il selettore. Scrivimi ogni testo pronto.

### 2. Aiuto alla scrittura (§5.157), se il capitolo lo descrive

Il blocco «Aiutami a scriverlo» sotto il prompt di un nodo AI, sotto il
contesto del flusso e sotto le aree di testo dei nodi: si scrive a parole
cosa si vuole, il modello collegato scrive il testo o migliora quello che
c'è, il risultato finisce nel campo e nella configurazione del nodo, si può
ripristinare il precedente; Ctrl+Invio invia; senza modello collegato (o con
la sola quota) lo dice e non scrive. Un difetto lo rendeva inutilizzabile
anche con la chiave collegata: corretto. → *Dove*: capitolo 3, Builder,
pannello proprietà del nodo AI: una o due frasi se non c'è; se c'è, verifica
che non prometta altro (per esempio suggerimenti automatici mentre si
scrive: non ci sono).

### 3. Autosalvataggio (§5.158): solo se il documento entra nel dettaglio

Il nome di un agente è univoco su tutta la piattaforma; un flusso aperto con
un nome già usato da un'altra persona riceve il suffisso «(2)». → *Dove*:
solo se il capitolo 3 descrive l'autosalvataggio o l'unicità dei nomi.

### Cosa mi devi restituire

Per ognuno dei punti (1a-1c, 2, 3): trovato / non trovato, punto esatto,
azione, testo pronto nello stile del documento. Per il punto 1 elenca ogni
occorrenza che rimuovi, con la frase prima e dopo. Poi gli **screenshot**:
quelli del v46 che mostravano il selettore (profilo con «Per le chiamate
usa», pannello Integrazione AI con «Fonte delle chiamate») vanno **rifatti
senza**; il registro di un'esecuzione a quota (riga SISTEMA in testa) e la
dashboard restano validi se già fatti. Tema chiaro, utente Mario R. Aggiungi
uno screenshot del blocco «Aiutami a scriverlo» aperto sotto il prompt di un
nodo AI, con l'esito «Fatto (OpenAI) · Ripristina il precedente».

### Regole

In ogni frase, distinzione fra **simulato** (quota, prototipo) e **vero**
(chiave propria, o proxy nel prodotto). Nessuna frase in cui l'utente
sceglie la fonte. Non inventare, non riscrivere capitoli, italiano nel
registro del documento, riferimenti ad appendice e bibliografia coerenti con
quelli esistenti.

---

## Aggiunta (v104): tendina del modello

Nel pannello del nodo AI la tendina «Modello» è a cascata sul fornitore
scelto e usa esattamente i modelli della tabella dei fornitori del capitolo
(Anthropic, OpenAI, Google, Mistral); con «Automatico» è bloccata finché non
si sceglie il fornitore; locale e custom sono campo libero. Fonte:
`ARCHITECTURE.md` §5.159. → *Dove*: solo se il capitolo 3 descrive il
pannello del nodo AI o la tabella dice «selezionabili dall'utente»: verifica
che la frase sia coerente («selezionabili dopo aver scelto il fornitore»).
Lo screenshot del pannello del nodo AI, se c'è, va rifatto con un fornitore
scelto e la tendina dei suoi modelli aperta.
