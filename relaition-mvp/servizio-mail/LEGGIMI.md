# Servizio locale di invio email

Permette ai flussi di RelAItion di **inviare email vere** via SMTP.

## Perché serve un servizio separato

Una pagina web non può aprire una connessione SMTP: SMTP viaggia su TCP, il
browser parla solo HTTP. Questo servizio colma esattamente quel divario e
nient'altro — riceve una richiesta HTTP dal builder e la inoltra al server di
posta.

## Come si usa

1. Doppio click su **`AVVIA-SERVIZIO-MAIL.cmd`**
2. Scegli il provider, inserisci utente e password
3. Il servizio invia subito **un messaggio di prova a te stesso**: se arriva, la
   configurazione è corretta
4. Lascia la finestra aperta mentre usi RelAItion

Nel pannello del nodo "Invia email" comparirà `✅ Invio reale attivo`.
Senza il servizio avviato il flusso funziona lo stesso: l'invio viene registrato
come **simulato**, e il registro lo dichiara.

## Le credenziali non passano dal browser

È la scelta di fondo di questo servizio. La password viene chiesta nella
finestra di PowerShell, resta nella memoria di quel processo e non entra mai:

- nella pagina web
- nel database dell'applicazione
- nei flussi esportati o pubblicati

Il nodo del builder invia solo destinatario, oggetto e corpo. Chiudendo la
finestra, la password sparisce: non viene scritta da nessuna parte.

## Gmail: la password normale non funziona

Google rifiuta la password dell'account su SMTP. Serve una **password per le
app**, che si ottiene così:

1. L'account deve avere la **verifica in due passaggi** attiva
2. Vai su <https://myaccount.google.com/apppasswords>
3. Crea una password per l'app (16 caratteri, senza spazi)
4. Usa **quella** quando il servizio te la chiede

Se salti questo passaggio il servizio fallisce subito, alla verifica iniziale,
con il messaggio del server di Google sotto gli occhi.

## Gli altri provider

| Provider | Server | Porta | Nota |
|---|---|---|---|
| Gmail | smtp.gmail.com | 587 | password per le app (vedi sopra) |
| Outlook / Microsoft 365 | smtp.office365.com | 587 | SMTP di base va abilitato dall'amministratore del tenant |
| Aruba | smtps.aruba.it | 465 | — |
| SendGrid | smtp.sendgrid.net | 587 | utente letteralmente `apikey`, la chiave al posto della password |

Per altri provider scegli l'opzione **[5] Altro** e inserisci host e porta
indicati dal tuo fornitore di posta.

## Allegati

Se sul nodo imposti *Allega i file generati dal flusso* su **Sì**, i file
prodotti dai nodi di esportazione durante quella esecuzione vengono allegati al
messaggio. Non vengono scritti su disco: passano in memoria dal browser al
servizio e da lì al server di posta.

## Sicurezza

- Ascolta solo su `127.0.0.1`: non è raggiungibile da altri computer
- Accetta richieste solo dall'applicazione in esecuzione su `localhost:8099`
- Non scrive nulla su disco, né i messaggi né le credenziali

Se cambi la porta dell'applicazione, avvialo così:

```
powershell -ExecutionPolicy Bypass -File relaition-mail.ps1 -Origine http://localhost:PORTA
```
