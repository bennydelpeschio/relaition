// ══════════════════════════════════════════════════════════════
// CONTENUTI DELLE LEZIONI MANCANTI
// ══════════════════════════════════════════════════════════════
// Sei lezioni dei primi due percorsi non avevano testo: aprendole compariva
// il segnaposto "contenuto in preparazione", proprio all'inizio del percorso
// formativo — cioè dove un utente nuovo arriva per primo e si fa un'idea se
// la piattaforma sia curata o abbandonata.

LESSON_CONTENT['1-0']={title:'Cos\'è un AI Agent',content:
  '<h3>🤖 Non è un chatbot con un nome diverso</h3>'+
  '<p>Un chatbot risponde. Un agente <strong>agisce</strong>: riceve un obiettivo, decide quali passi compiere, usa strumenti esterni per compierli e si ferma quando l\'obiettivo è raggiunto — o quando capisce di non poterlo raggiungere.</p>'+
  '<p>La differenza pratica: a un chatbot chiedi "come faccio a registrare questa fattura?"; a un agente dai la fattura e lui la registra.</p>'+
  '<h3>I quattro pezzi che lo compongono</h3>'+
  '<p><strong>1. Il modello</strong> — la parte che interpreta linguaggio non strutturato: un\'email, un contratto, una descrizione libera. È bravo a capire, non a calcolare né a ricordare.</p>'+
  '<p><strong>2. Gli strumenti</strong> — ciò che gli permette di toccare il mondo: leggere un database, inviare un messaggio, scrivere un file. Senza strumenti un agente può solo produrre testo.</p>'+
  '<p><strong>3. Il flusso</strong> — l\'ordine dei passi e le diramazioni. È la parte che costruisci nel builder, ed è quella che rende il comportamento prevedibile.</p>'+
  '<p><strong>4. I controlli</strong> — i limiti entro cui può muoversi: cosa non deve dire, quali dati deve mascherare, quando deve fermarsi e chiedere a una persona.</p>'+
  '<div class="concept-box">💡 <strong>Da ricordare:</strong> il modello è il componente più visibile ma non il più importante. Un agente con un modello mediocre e un flusso ben disegnato funziona meglio di uno con il modello migliore e nessuna struttura.</div>'+
  '<h3>Quando conviene davvero</h3>'+
  '<p>Un agente ha senso dove l\'<strong>input è testo libero</strong> e le regole non si possono scrivere tutte: classificare richieste che arrivano scritte in mille modi diversi, estrarre dati da documenti che non hanno un formato fisso, riassumere materiale eterogeneo.</p>'+
  '<div class="warning-box">⚠️ <strong>Quando non conviene:</strong> se il processo ha sei casi possibili e li conosci tutti, sei condizioni funzionano meglio — costano zero, non variano, e non sbagliano mai in modo creativo.</div>',
  quiz:{q:'Qual è la differenza sostanziale fra un chatbot e un agente?',
    a:['L\'agente usa un modello più grande','L\'agente può compiere azioni tramite strumenti, non solo rispondere','L\'agente è più veloce','L\'agente costa meno'],c:1,
    exp:'La capacità di agire tramite strumenti è ciò che distingue un agente: un chatbot produce testo, un agente cambia lo stato di un sistema.'}};

LESSON_CONTENT['1-1']={title:'LLM: come funzionano',content:
  '<h3>🧠 Una macchina che continua il testo</h3>'+
  '<p>Un modello linguistico fa una cosa sola: dato un testo, calcola quale sia la continuazione più probabile. Tutto il resto — rispondere, riassumere, tradurre, estrarre — è quella stessa operazione applicata a un testo costruito in modo che la continuazione più probabile sia la risposta che serve.</p>'+
  '<h3>Perché conta saperlo</h3>'+
  '<p>Tre conseguenze pratiche che spiegano quasi tutti i comportamenti strani:</p>'+
  '<p><strong>Non sa di non sapere.</strong> Se chiedi un dato che non ha, la continuazione più probabile resta una risposta plausibile. Non c\'è nel modello un meccanismo che produca "non lo so" a meno che non glielo si chieda esplicitamente.</p>'+
  '<p><strong>Non ha memoria fra una chiamata e l\'altra.</strong> Ogni richiesta parte da zero: ciò che sa della conversazione precedente è solo quello che gli rimandi nel testo.</p>'+
  '<p><strong>Ha una finestra limitata.</strong> Il testo che può considerare in una volta ha un tetto. Oltre quello, qualcosa va tagliato — ed è meglio decidere tu cosa, invece di lasciarlo troncare in coda.</p>'+
  '<div class="concept-box">💡 <strong>La conseguenza operativa:</strong> le allucinazioni non sono un difetto da correggere con un prompt migliore. Sono il comportamento normale di una macchina che completa testo. Si contengono dandole le fonti (Knowledge Base) e verificando l\'output (controlli), non chiedendole di non sbagliare.</div>'+
  '<h3>Token, costi e temperatura</h3>'+
  '<p>Il testo viene diviso in <strong>token</strong>, pezzi di parola: circa 4 caratteri l\'uno in italiano. Si paga per token in ingresso e in uscita, quindi un prompt lungo ripetuto mille volte costa più di quanto sembri.</p>'+
  '<p>La <strong>temperatura</strong> regola quanto il modello si allontani dalla continuazione più probabile. Vicino a zero è ripetitivo e prevedibile — ed è quello che vuoi per estrarre dati. Più alta è più vario, utile per scrivere testo, dannoso per compiti che devono dare sempre lo stesso risultato.</p>',
  quiz:{q:'Perché un modello linguistico produce risposte inventate ma plausibili?',
    a:['Perché è stato addestrato male','Perché completa il testo con la continuazione più probabile, e non ha un meccanismo per riconoscere ciò che non sa','Perché la temperatura è troppo alta','Perché manca la connessione a internet'],c:1,
    exp:'È il funzionamento normale, non un guasto: si contiene fornendo fonti verificabili e controllando l\'output, non chiedendo al modello di non sbagliare.'}};

LESSON_CONTENT['1-2']={title:'Architettura ReAct',content:
  '<h3>🔁 Ragiona, agisci, osserva</h3>'+
  '<p>ReAct è il nome del ciclo che sta sotto quasi tutti gli agenti che usano strumenti. Il modello alterna tre momenti: <strong>ragiona</strong> su cosa serve, <strong>agisce</strong> invocando uno strumento, <strong>osserva</strong> il risultato e ricomincia.</p>'+
  '<div class="code-block">Obiettivo: "Questo sinistro è anomalo?"\n\nRagiona → mi serve lo storico del contraente\nAgisce  → interroga il database polizze\nOsserva → 3 denunce negli ultimi 90 giorni\nRagiona → la soglia interna è 2, quindi è anomalo\nRisponde → indice 78, motivo: denunce ravvicinate</div>'+
  '<h3>Cosa cambia rispetto a una singola chiamata</h3>'+
  '<p>Con una chiamata sola il modello deve rispondere con ciò che sa. Con il ciclo può <strong>andare a cercare</strong> quello che gli manca. È la differenza fra un\'opinione e una risposta fondata.</p>'+
  '<h3>Il rischio del ciclo</h3>'+
  '<p>Un agente che decide da solo quando fermarsi può non fermarsi: chiedere lo stesso strumento all\'infinito, o rimbalzare fra due strumenti senza concludere. Per questo ogni nodo AI che usa strumenti ha un <strong>limite di iterazioni</strong>, ed è un parametro da impostare consapevolmente, non un dettaglio.</p>'+
  '<div class="warning-box">⚠️ In RelAItion il limite predefinito è 3 iterazioni. Se un flusso ne richiede molte di più, di solito il problema non è il limite: è che il compito andava spezzato in nodi diversi, ciascuno con un obiettivo chiaro.</div>',
  quiz:{q:'Qual è il rischio principale del ciclo ragiona-agisci-osserva?',
    a:['Consuma troppa memoria','L\'agente può non fermarsi, ripetendo invocazioni senza concludere','Non funziona con modelli piccoli','Richiede una connessione veloce'],c:1,
    exp:'Per questo esiste un limite di iterazioni: senza, un agente può rimbalzare fra strumenti senza mai chiudere il compito.'}};

LESSON_CONTENT['1-3']={title:'Il tuo primo workflow',content:
  '<h3>🛠️ Costruiamone uno vero</h3>'+
  '<p>L\'obiettivo: ricevere una richiesta di assistenza scritta a mano libera, capire di cosa parla e quanto è urgente, e instradarla di conseguenza.</p>'+
  '<h3>I cinque nodi</h3>'+
  '<p><strong>1. Trigger — Form submit.</strong> Dichiara i parametri che il modulo raccoglie: <code>cliente</code>, <code>messaggio</code>, <code>email</code>. I valori inseriti diventano il JSON che apre il flusso.</p>'+
  '<p><strong>2. Controllo — Mascheramento dati.</strong> Prima che il testo raggiunga il modello, gli identificatori personali vengono sostituiti. È il primo nodo perché il mascheramento serve <em>prima</em> della chiamata, non dopo.</p>'+
  '<p><strong>3. AI — Classifier.</strong> Il prompt predefinito chiede categoria, urgenza e riassunto in JSON. Lascia il formato di uscita vincolato: serve a rendere il risultato leggibile dal nodo successivo.</p>'+
  '<p><strong>4. Condizione.</strong> <code>urgenza == "alta"</code> apre due rami: uno che notifica subito, uno che accoda.</p>'+
  '<p><strong>5. Output.</strong> Entrambi i rami devono chiudersi su un nodo di output, altrimenti l\'esito non resta scritto da nessuna parte.</p>'+
  '<div class="concept-box">💡 <strong>Prova subito:</strong> apri il Builder, trascina questi cinque blocchi e collegali. Ogni nodo nasce già configurato con i propri campi: devi solo compilare il prompt e la condizione.</div>'+
  '<h3>L\'errore più comune la prima volta</h3>'+
  '<p>Dimenticare un ramo scollegato. Se la condizione ha due uscite e ne colleghi una sola, l\'altra metà delle richieste finisce nel vuoto — e il flusso <em>sembra</em> funzionare, perché i casi che provi passano dal ramo collegato. La convalida lo segnala prima dell\'esecuzione: leggila.</p>',
  quiz:{q:'Perché il nodo di mascheramento va messo prima del nodo AI?',
    a:['Perché è più veloce','Perché i dati personali devono essere sostituiti prima di essere inviati al modello','Perché altrimenti il flusso non valida','Perché il modello lo richiede'],c:1,
    exp:'Mascherare dopo la chiamata non protegge nulla: i dati sono già usciti. L\'ordine dei nodi è una scelta di sostanza, non estetica.'}};

LESSON_CONTENT['2-0']={title:'Nodi condizionali e branching',content:
  '<h3>🔀 Dove il flusso si divide</h3>'+
  '<p>Un nodo condizione valuta un\'espressione sui dati in transito e apre due strade: <strong>vero</strong> e <strong>falso</strong>. Entrambe devono portare da qualche parte.</p>'+
  '<div class="code-block">result.punteggio > 70\nresult.categoria == "reclamo"\nresult.importo >= 1000 && result.cliente_nuovo</div>'+
  '<h3>Condizione deterministica o valutata dal modello</h3>'+
  '<p>Se il dato in ingresso è già strutturato — un numero, un\'etichetta prodotta da un nodo AI a monte — la condizione si valuta <strong>senza chiamare il modello</strong>: è immediata, gratuita e non varia.</p>'+
  '<p>Se invece la condizione riguarda il senso di un testo ("il cliente è insoddisfatto?"), serve il modello. Costa una chiamata e può dare risposte diverse sullo stesso input.</p>'+
  '<div class="concept-box">💡 <strong>Regola pratica:</strong> fai produrre a un nodo AI un\'etichetta strutturata, poi ramifica su quella. Costa una chiamata sola e il comportamento diventa ripetibile.</div>'+
  '<h3>Più di due strade</h3>'+
  '<p>Per tre o più esiti c\'è <strong>Switch</strong>: elenca i casi e il ramo di destinazione, con un ramo di default per ciò che non rientra in nessun caso. Una catena di condizioni annidate fa lo stesso lavoro ma diventa illeggibile dopo il terzo livello.</p>'+
  '<div class="warning-box">⚠️ Il ramo di default non è un dettaglio: senza, un valore imprevisto fa finire il flusso nel nulla senza che nessuno se ne accorga.</div>',
  quiz:{q:'Quando conviene far valutare una condizione al modello invece che deterministicamente?',
    a:['Sempre, è più accurato','Solo quando la condizione riguarda il senso di un testo libero, non un dato già strutturato','Mai','Quando il flusso è lento'],c:1,
    exp:'Su un dato strutturato la valutazione deterministica è immediata, gratuita e ripetibile: chiamare il modello aggiungerebbe costo e variabilità senza guadagno.'}};

LESSON_CONTENT['2-2']={title:'Integrare API REST',content:
  '<h3>🌐 Il nodo HTTP Request</h3>'+
  '<p>È il connettore che permette a un flusso di parlare con qualsiasi servizio che esponga un\'interfaccia web, anche quando non esiste un connettore dedicato in palette.</p>'+
  '<p>I parametri sono quelli di una richiesta HTTP: <strong>URL</strong>, <strong>metodo</strong>, <strong>header</strong> (dove va l\'autenticazione) e <strong>corpo</strong>. Nel corpo il segnaposto <code>{{result}}</code> viene sostituito con l\'uscita del nodo precedente.</p>'+
  '<div class="code-block">POST https://api.crm.aziendale.it/v1/lead\nHeaders: {"Authorization":"Bearer ..."}\nBody: {"punteggio": "{{result.score}}",\n       "note": "{{result.motivazione}}"}</div>'+
  '<h3>Il vincolo che scoprirai subito: CORS</h3>'+
  '<p>Un browser non può chiamare qualsiasi indirizzo. Il servizio di destinazione deve dichiarare esplicitamente di accettare richieste da altre origini. Se non lo fa, la chiamata fallisce prima ancora di partire — e l\'errore non dice "permesso negato", dice genericamente che la rete non ha risposto.</p>'+
  '<div class="warning-box">⚠️ Non è un limite di RelAItion: è una regola di sicurezza del browser. Le API pubbliche pensate per essere chiamate da pagine web funzionano; quelle interne aziendali quasi mai. Lo script Python esportato non ha questo vincolo, perché non gira in un browser.</div>'+
  '<h3>Idempotenza</h3>'+
  '<p>Ogni chiamata porta una chiave di idempotenza generata dal motore. Serve a questo: se un flusso viene rieseguito dopo un errore a metà, il servizio di destinazione può riconoscere che quella richiesta l\'ha già ricevuta e non creare due volte lo stesso ordine.</p>',
  quiz:{q:'Perché una chiamata a un\'API interna aziendale spesso fallisce dal browser?',
    a:['Perché l\'URL è sbagliato','Perché il servizio non dichiara di accettare richieste da altre origini (CORS)','Perché manca l\'autenticazione','Perché il browser è lento'],c:1,
    exp:'È una regola di sicurezza del browser, non un difetto della piattaforma: lo script Python esportato non ha questo vincolo perché non gira in un browser.'}};
