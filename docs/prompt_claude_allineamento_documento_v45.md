# Prompt per Claude, allineare il documento (v45): contatore dei token e modello commerciale

Da usare in una **conversazione Claude** allegando:

1. `relaition-mvp aggiornata 20260913.zip`
2. il master document della tesi (capitoli, appendice, bibliografia)

Incrementale: presuppone il documento allineato con il v44 (o il v43 + v44).
Copre una sola modifica, ma con una parte di **modello commerciale** che
probabilmente nel documento non c'è ancora, quindi la tratta per esteso.

---

## PROMPT DA INCOLLARE

Ti allego lo zip della POC RelAItion e il master document della tesi. C'è una
modifica nuova da portare nel documento, e una parte di modello commerciale da
scrivere in modo che resti **coerente con quello che la POC fa davvero**. Le
fonti nello zip sono `ARCHITECTURE.md` **§5.154** e `js/consumo.js`; il codice
vince sulla documentazione.

### Cosa fa la POC (verificalo nel codice)

- Ogni chiamata al modello viene **contata** per utente, agente, nodo e
  fornitore, nella tabella `consumo_token`: token in ingresso e in uscita
  presi dalla risposta del fornitore quando ci sono (`usage`,
  `usageMetadata`), altrimenti **stimati** dai caratteri (circa 4 per token)
  e marcati come stimati. Ovunque si mostrano, si dice quanti sono misurati e
  quanti stimati. Le chiamate simulate (nessuna chiave) non si contano.
- Si vede nel **registro dell'esecuzione** (per nodo AI), nel **profilo**
  (totale, ultimi 30 giorni, chiamate, barra della quota) e nel
  **Monitoraggio**, area Modelli (totale e per fornitore).
- C'è una **quota di prova** di 100.000 token per utente: superata, la
  piattaforma lo dice una volta e continua. **Non è un credito**: nessuno paga
  i token al posto dell'utente, la chiave resta la sua. È il contatore su cui
  un piano aziendale addebiterebbe il consumo oltre i crediti di benvenuto.
- Limiti dichiarati: le chiamate con strumenti (`callAIWithTools`) non sono
  ancora contate; i token non vengono tradotti in euro.

### Dove intervenire

1. **Capitolo 3, sezione su Monitoraggio / governance.** Il documento
   probabilmente riporta il limite «la piattaforma non contabilizza i token
   perché le chiavi sono dell'utente»: quella frase ora è **falsa**. Va
   sostituita con: contati per utente e fornitore, misurati o stimati e
   dichiarati tali, non tradotti in costo. Se c'è la tabella delle sette aree
   del Monitoraggio, l'area «Modelli» acquista la voce «token contati».
   Scrivimi il testo.

2. **Capitolo 3, Builder / esecuzione e tracciabilità.** Una riga: il
   registro dell'esecuzione riporta i token per ogni nodo AI, con
   l'indicazione «stimati» dove il fornitore non li riporta.

3. **Capitolo 3, profilo utente.** Una riga sul riquadro «Consumo di token» e
   sulla quota di prova, con la precisazione che non è un credito.

4. **Modello commerciale (nuovo).** Trova se il documento ha una sezione di
   business model, go-to-market o sostenibilità economica. Se c'è, integra;
   se non c'è, proponi dove metterla (di norma alla fine del capitolo 3, prima
   delle semplificazioni, o nel capitolo conclusivo se il capitolo 3 è solo
   tecnico). Il contenuto, in questi termini e non oltre:
   - fase di adozione: **crediti di benvenuto** per utente o azienda, erogati
     attraverso un **proxy di inferenza** gestito dal fornitore della
     piattaforma, che contabilizza i token per tenant e li addebita ai crediti;
   - esauriti i crediti, due strade: l'azienda collega i **propri fornitori**
     (BYOK, chiavi sue, costi suoi, che è ciò che il prototipo implementa) o
     attiva un **piano a consumo** sul proxy;
   - in entrambi i casi il **contatore** è lo stesso, ed è quello che il
     prototipo ha già: la quota di prova ne è la versione senza addebito;
   - cosa richiede il passaggio dal prototipo al prodotto: un componente server
     (proxy + metering per tenant + fatturazione), fuori dal perimetro
     client-side dichiarato. Va detto esplicitamente: **il prototipo non
     eroga crediti**, mostra il contatore.
   Scrivi il paragrafo pronto, nello stile del documento, senza cifre di prezzo
   inventate: se serve un esempio numerico, usa la quota di prova (100.000
   token) e basta.

5. **Semplificazioni del prototipo.** Una riga: proxy di inferenza, crediti e
   fatturazione non sono implementati; le chiamate con strumenti non sono
   contate; nessuna conversione in costo.

6. **Appendice.** Se elenca le tabelle del database, aggiungi `consumo_token`
   (user, agent, node, provider, tokens_in, tokens_out, stimato, ts): 30
   tabelle, non 29. Se elenca i moduli JavaScript, aggiungi `js/consumo.js`.
   Aggiorna i rimandi se la numerazione cambia.

7. **Screenshot.** Due nuovi: il riquadro «Consumo di token» nel profilo e la
   riga «token contati» nell'area Modelli del Monitoraggio. Tema chiaro, utente
   Mario R.

8. **Demo.** Se il documento cita i passi della dimostrazione: ora sono 101.

### Cosa mi devi restituire

Per ognuno degli 8 punti: trovato / non trovato, punto esatto, azione, testo
pronto. Poi una riga: c'è **altro** nel documento che, letto oggi, prometta
crediti, costi o contabilità che la POC non ha? Se sì, dove.

### Regole

Non inventare: se un punto non trova riscontro nel codice, dillo. Non
riscrivere capitoli. In italiano, nel registro del documento. Tieni la
distinzione fra «contatore» (c'è) e «crediti» (modello, non c'è) in ogni frase
che scrivi: è l'unica cosa che in commissione può fare male.

### Aggiunta del 14 settembre (stesso prompt, un punto in più)

9. **Dashboard per persona.** I riquadri «Agenti più usati», «Attività
   recente» e il grafico delle esecuzioni della settimana sono calcolati sulle
   righe della persona connessa (prima erano fissi); chi non ha attività vede
   stati vuoti espliciti. «Consigliati per te» e «Novità» restano comuni. →
   *Dove*: capitolo 3, dashboard; se c'è una frase che descrive la dashboard
   come «panoramica personale», ora è vera per intero, e va detto che
   consigli e novità sono l'unica parte comune. Vale anche per «Attività recente» nel profilo. Lo **screenshot della
   dashboard** va rifatto (i numeri vecchi 42/35/28/23 e «148 totali» non
   esistono più). `ARCHITECTURE.md` §5.155.
