# Flussi di esempio

Quattro flussi completi, più articolati di quelli precaricati, pensati per essere
importati e provati. Si caricano da **Builder → Importa → «Oppure incolla il
JSON»**, oppure trascinando il file sul riquadro di importazione.

Importare è un'anteprima: il flusso finisce sulla tela ma **non** viene salvato
finché non si preme Salva.

| File | Cosa dimostra | Senza chiave API |
|---|---|---|
| `1-onboarding-fornitore.json` | Diramazione su soglia, approvazione umana, generazione di un documento e invio per email con allegati | **si ferma sulla convalida**, di proposito |
| `2-rassegna-settimanale.json` | Ciclo su un elenco prodotto dal modello, verifica di fondatezza, salvataggio in Knowledge Base, doppia distribuzione | gira per intero, 24 passi |
| `3-ticket-instradamento.json` | Due controlli in ingresso, classificazione, instradamento su due rami che si ricongiungono | gira per intero, 10 passi |
| `4-invoice-extractor.json` | Estrazione a schema JSON da fattura, convalida dei formati, diramazione su soglia fra registrazione automatica e approvazione umana | gira, ma la condizione senza modello è simulata |

## Perché il primo si ferma

Senza un modello collegato il nodo AI restituisce un avviso al posto del JSON
richiesto, e il controllo **Convalida output** — impostato su «Blocca il
flusso» — interrompe l'esecuzione. È il comportamento corretto: un dossier
fornitore costruito su dati illeggibili non deve uscire.

Il terzo flusso ha lo stesso controllo impostato su «Segnala e prosegui», ed è
altrettanto corretto per il suo caso: una richiesta di assistenza non si butta
via perché il classificatore era incerto, si annota e si prosegue con
prudenza. **La differenza fra i due non è tecnica, è una decisione di
processo**, e il nodo permette di dichiararla.

Con una chiave configurata tutti e tre completano.

## Allegati veri

Il flusso 1 usa la capacità nuova del nodo email: `attach: "Sì"` allega i file
prodotti durante l'esecuzione. Dal pannello del nodo si possono aggiungere
anche **allegati fissi** — un file preso dal computer o un documento della
Knowledge Base — che partono a ogni invio: un listino, un modulo, delle
condizioni contrattuali.
