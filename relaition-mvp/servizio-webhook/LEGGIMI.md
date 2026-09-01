# Ricevitore webhook locale

Permette a un flusso di **partire da una chiamata esterna**, con i dati che
arrivano dalla chiamata stessa — come in n8n.

## Perché serve un servizio separato

Una pagina web può *fare* chiamate, non *riceverne*: non può mettersi in
ascolto su un indirizzo. Questo servizio riceve le chiamate esterne e le tiene
in coda; il builder le preleva e avvia il flusso con i dati arrivati.

## Come si usa

1. Doppio click su **`AVVIA-RICEVITORE.cmd`**
2. Nel builder, seleziona il nodo **Webhook** e imposta il percorso
   (es. `/hooks/contatti`)
3. Premi **“Attendi una chiamata ed esegui”**
4. Fai la chiamata da dove vuoi

Alla prima chiamata il flusso parte da solo, con i dati ricevuti.

## Cosa puoi passare

**JSON nel corpo** — il caso normale:

```
curl -X POST http://127.0.0.1:8788/hooks/contatti ^
     -H "Content-Type: application/json" ^
     -d "{\"cliente\":\"ACME\",\"importo\":128400}"
```

**Parametri nell'indirizzo** — per le integrazioni che chiamano solo così:

```
curl -X POST "http://127.0.0.1:8788/hooks/contatti?cliente=ACME&importo=128400"
```

**Un file** — arriva ai nodi come un documento caricato a mano:

```
curl -X POST http://127.0.0.1:8788/hooks/documenti ^
     -H "Content-Type: text/plain" ^
     -H "X-Nome-File: contratto.txt" ^
     --data-binary "@contratto.txt"
```

I parametri dell'indirizzo e quelli del corpo vengono uniti: se una chiave
compare in entrambi, vince quella del corpo.

## Cosa succede alle chiamate

Restano **in coda** finché il builder non le preleva, e al prelievo vengono
rimosse: una chiamata avvia il flusso una volta sola. La coda tiene le ultime
50 chiamate per percorso, così un servizio lasciato aperto per giorni non
consuma memoria senza limite.

Se il ricevitore non è avviato il flusso funziona lo stesso, usando i parametri
inseriti a mano nel pannello del nodo.

## Sicurezza

- Ascolta solo su `127.0.0.1`: non è raggiungibile da altri computer
- Risponde al builder solo se servito da `localhost:8099`
- Non scrive nulla su disco: le chiamate vivono in memoria e spariscono
  chiudendo la finestra

Per esporlo a chiamate da fuori servirebbe un tunnel (ngrok o simili) e una
valutazione di sicurezza che va oltre lo scopo di un prototipo.
