// ══════════════════════════════════════════
// CONTENUTI DEL PERCORSO 6 — meccanismi propri della piattaforma.
// Ogni lezione rimanda a qualcosa che si può aprire e verificare
// nell'applicazione, invece di restare teoria generica sugli agenti.
// File separato perché LESSON_CONTENT in pages.js è già lungo e questi
// contenuti hanno un ciclo di vita proprio: cambiano quando cambia la
// piattaforma, non quando cambia il programma didattico.
// ══════════════════════════════════════════

LESSON_CONTENT['6-0']={title:'Knowledge Base: segmentare per struttura',content:
'<h3>Perché il taglio a lunghezza fissa non funziona</h3>'+
'<p>Il modo più comune di preparare documenti per un agente è spezzarli ogni N caratteri. È semplice e sbagliato: taglia un articolo di regolamento a metà frase, separa una domanda dalla sua risposta, stacca una riga di tabella dalle intestazioni che la rendono leggibile.</p>'+
'<p>Il risultato si vede solo a valle: l\'agente recupera un frammento che, letto da solo, non significa nulla, e risponde male senza che nessuno capisca perché.</p>'+
'<h3>Come la piattaforma segmenta</h3>'+
'<p>RelAItion riconosce la tipologia dal contenuto e usa l\'unità adatta:</p>'+
'<ul><li><strong>Normativa</strong> → articolo o comma</li>'+
'<li><strong>Contratto</strong> → clausola con la sua intestazione</li>'+
'<li><strong>Procedura</strong> → passo, con la gerarchia dei titoli superiori</li>'+
'<li><strong>Assistenza</strong> → scambio domanda-risposta completo</li>'+
'<li><strong>Tabella</strong> → riga con le intestazioni replicate</li>'+
'<li><strong>Non strutturato</strong> → paragrafo con sovrapposizione controllata</li></ul>'+
'<div class="concept-box"><strong>Arricchimento contestuale:</strong> prima di essere indicizzata, ogni porzione riceve una frase che dice da dove viene («Dal documento X, sezione 3 di 7: Recesso anticipato»). Il punteggio si calcola sul testo arricchito, ma <strong>all\'agente torna l\'originale</strong>: il contesto serve a trovare la porzione, non a inquinare la risposta.</div>'+
'<h3>Provalo adesso</h3>'+
'<p>Apri la Knowledge Base dalla barra in alto, carica un documento e aprilo: la scheda <strong>Porzioni</strong> mostra esattamente cosa riceverà l\'agente. Se la segmentazione ha sbagliato lo vedi lì, non dopo tre risposte sbagliate.</p>',
quiz:{q:'Perché il testo restituito all\'agente è l\'originale e non quello arricchito?',opts:['Per risparmiare token','Perché il contesto serve a trovare la porzione, non a rispondere','Perché l\'arricchimento è opzionale'],correct:1}};

LESSON_CONTENT['6-1']={title:'Recupero ibrido e filtro permessi',content:
'<h3>Due misure che sbagliano in modo diverso</h3>'+
'<p>La ricerca lessicale trova i documenti che contengono le parole della domanda: precisa quando l\'utente usa il vocabolario del documento, cieca davanti a una riformulazione. La ricerca vettoriale coglie la vicinanza complessiva ma può premiare testi genericamente simili e vuoti.</p>'+
'<p>Usarle insieme funziona perché sbagliano in direzioni diverse. La piattaforma fonde i due punteggi, poi riordina i primi candidati premiando la <strong>copertura dei termini</strong> (quanti termini della domanda compaiono, non quante volte) e la loro <strong>vicinanza nel testo</strong>.</p>'+
'<div class="concept-box"><strong>Un dettaglio che cambia i risultati:</strong> le parole interrogative, «quanto», «come», «quando», vengono scartate. Compaiono in mezzo archivio e spostano il punteggio verso porzioni che non c\'entrano. Una domanda sui rimborsi chilometrici pescava per prima una FAQ sui resi, solo per via del «quanto».</div>'+
'<h3>Il filtro permessi sta a monte</h3>'+
'<p>Le porzioni non autorizzate <strong>non entrano fra i candidati</strong>. Non vengono recuperate e poi nascoste: non sono mai considerate. È una differenza sostanziale, filtrare la sola visualizzazione lascerebbe comunque il contenuto entrare nel prompt del modello, e da lì potrebbe riaffiorare nella risposta.</p>'+
'<div class="warning-box">⚠️ <strong>Da sapere:</strong> in questo prototipo i vettori sono TF-IDF calcolati localmente, non embedding neurali. Coglie riformulazioni lessicali, non parafrasi vere. È dichiarato fra le semplificazioni: un modello di embedding richiederebbe decine di MB da scaricare, incompatibili con l\'apertura da file locale.</div>',
quiz:{q:'Perché il filtro permessi agisce prima del calcolo del punteggio?',opts:['Per velocizzare la ricerca','Perché altrimenti il contenuto entrerebbe comunque nel prompt del modello','Perché i punteggi non sarebbero affidabili'],correct:1}};

LESSON_CONTENT['6-2']={title:'Leggere «Perché questo risultato»',content:
'<h3>Il registro dice cosa, non perché</h3>'+
'<p>Un log riga-per-riga racconta la sequenza: nodo avviato, nodo concluso. Non risponde alla domanda che ci si pone davvero davanti a un output inatteso: <em>perché è venuto così?</em></p>'+
'<h3>Cosa ricostruisce il pannello</h3>'+
'<ul><li><strong>Fonti che hanno pesato</strong>: quali porzioni sono entrate nel prompt, da quale documento, con quale punteggio</li>'+
'<li><strong>Decisioni</strong>: su quale valore è stato scelto un ramo, e chi l\'ha valutato: un modello o una simulazione deterministica</li>'+
'<li><strong>Cosa non è stato eseguito</strong>: i nodi saltati, come conseguenza delle decisioni, non come errore</li>'+
'<li><strong>Strumenti</strong>: quali il modello ha deciso di invocare, con quali argomenti</li>'+
'<li><strong>Controlli</strong>: cosa hanno cambiato: quanti identificatori mascherati, cosa hanno bloccato</li></ul>'+
'<div class="concept-box"><strong>Un esempio che vale più della spiegazione:</strong> aprendo il pannello si può vedere che la ricerca in Knowledge Base è partita con l\'email <em>già mascherata</em>. Significa che il controllo ha agito prima del recupero. Nessun registro riga-per-riga lo rendeva evidente.</div>'+
'<h3>Il limite, dichiarato</h3>'+
'<p>Il pannello spiega <strong>il percorso seguito e i dati usati</strong>. Non spiega il funzionamento interno del modello linguistico, che resta opaco. È una distinzione che vale la pena tenere: molta «AI spiegabile» promette la seconda e consegna la prima.</p>',
quiz:{q:'Cosa NON può spiegare il pannello?',opts:['Quali documenti sono stati usati','Il ragionamento interno del modello linguistico','Quale ramo è stato scelto'],correct:1}};

LESSON_CONTENT['6-3']={title:'Politiche e controlli obbligatori',content:
'<h3>Consigliata o obbligatoria</h3>'+
'<p>Una politica organizzativa può agire in due modi. In modalità <strong>consigliata</strong> la validazione segnala che manca un controllo e propone di inserirlo con un click: chi costruisce decide. In modalità <strong>obbligatoria</strong> il controllo viene inserito d\'ufficio e reso non rimovibile, con lucchetto e motivazione visibili sul nodo.</p>'+
'<div class="concept-box"><strong>Perché il predefinito è «consigliata»:</strong> imporre un controllo che il caso non richiede è fuorviante. Un flusso che non tocca dati personali non ha bisogno di mascheramento, e trovarselo imposto insegna a ignorare i presidi invece che a usarli.</div>'+
'<h3>Il suggerimento è basato sul rischio</h3>'+
'<p>La validazione non guarda quali nodi ci sono, ma <strong>cosa il flusso tratta davvero</strong>: se dati personali raggiungono un nodo AI senza mascheramento, se un\'azione scrive su un sistema esterno senza approvazione umana, se un output AI prosegue senza alcuna verifica a valle.</p>'+
'<h3>Cosa succede in eliminazione</h3>'+
'<p>Un controllo imposto resiste al tasto Canc e alla selezione multipla. Nella copia diventa invece un nodo ordinario: altrimenti si moltiplicherebbero i non rimovibili. Per toglierlo si disattiva la politica, non si aggira il nodo.</p>',
quiz:{q:'Perché la modalità predefinita è «consigliata» e non «obbligatoria»?',opts:['Per non rallentare la costruzione','Perché un controllo imposto dove non serve insegna a ignorare i presidi','Perché le politiche obbligatorie non sono implementate'],correct:1}};

LESSON_CONTENT['6-4']={title:'Pubblicare: ambiti e revisione',content:
'<h3>Quattro ambiti, quattro livelli di garanzia</h3>'+
'<p>Pubblicare per il proprio gruppo di lavoro non può richiedere le stesse garanzie di un catalogo aperto a tutta l\'azienda. L\'ambito scelto determina <strong>chi approva</strong> e <strong>quali controlli diventano bloccanti</strong>:</p>'+
'<ul><li><strong>Gruppo di lavoro</strong>: responsabile diretto, nessun controllo obbligatorio</li>'+
'<li><strong>Business unit</strong>: Workstream Owner, richiede la gestione errori</li>'+
'<li><strong>Organizzazione</strong>: più verifica di conformità, richiede anche il mascheramento dati</li>'+
'<li><strong>Catalogo pubblico</strong>: autorizzazione superiore, richiede anche la convalida output</li></ul>'+
'<h3>Bloccante contro segnalazione</h3>'+
'<p>Un <strong>blocco</strong> impedisce la richiesta: integrità strutturale, controlli obbligatori mancanti, credenziali o endpoint interni trovati nelle configurazioni. Una <strong>segnalazione</strong> accompagna la richiesta fino al revisore: mai eseguito, documentazione incompleta, sovrapposizione con un agente già pubblicato.</p>'+
'<div class="warning-box">⚠️ <strong>Il controllo sulle credenziali</strong> cerca chiavi in chiaro e indirizzi interni (<code>.local</code>, <code>.intranet</code>, IP privati) dentro le configurazioni dei nodi. Chi installa l\'agente riceverebbe segreti altrui: è bloccante, non negoziabile.</div>'+
'<h3>Non regressione</h3>'+
'<p>Per gli aggiornamenti, il revisore può rigiocare le ultime esecuzioni tracciate con la nuova definizione e confrontare gli esiti. Le divergenze vengono mostrate, non nascoste.</p>',
quiz:{q:'Cosa distingue un controllo bloccante da una segnalazione?',opts:['La gravità del messaggio','Il blocco impedisce la richiesta, la segnalazione la accompagna al revisore','Il bloccante riguarda solo la sicurezza'],correct:1}};

LESSON_CONTENT['6-5']={title:'Monitorare l\'adozione',content:
'<h3>Domande diverse da quelle di chi costruisce</h3>'+
'<p>A chi costruisce interessa il proprio agente. A chi amministra interessa se la piattaforma <strong>viene adottata</strong>, se quello che ci gira è <strong>presidiato</strong>, e dove si sta <strong>accumulando rischio</strong>. Sono tre domande a cui nessuna dashboard personale risponde.</p>'+
'<h3>Le metriche che dicono qualcosa</h3>'+
'<ul><li><strong>Copertura dei controlli</strong>: quanti agenti hanno almeno un guardrail. Dice se la governance è applicata o solo disponibile nella palette</li>'+
'<li><strong>Agenti mai eseguiti</strong>: costruiti e abbandonati: adozione incompleta, non successo</li>'+
'<li><strong>Concentrazione</strong>: quanta parte delle esecuzioni fa capo a un solo agente. Sopra il 70% la piattaforma regge su un unico caso d\'uso</li>'+
'<li><strong>Recuperi a vuoto</strong>: nodi con Knowledge Base attiva che hanno risposto senza fonti: risposte non fondate che sembrano fondate</li>'+
'<li><strong>Media per utente</strong>: il totale dice la dimensione, la media dice se l\'uso è diffuso o concentrato su poche persone</li></ul>'+
'<div class="concept-box"><strong>I segnali stanno in cima, non i numeri.</strong> Un cruscotto che si apre su venti indicatori richiede di sapere già cosa cercare. Qui la prima cosa che si legge è cosa richiede un\'azione, con accanto il pulsante che la chiude.</div>'+
'<div class="warning-box">⚠️ <strong>Cosa non può dire:</strong> gli utenti sono ricavati dalle tracce lasciate nei dati, non da un\'anagrafica; non esistono costi per token, perché le chiavi sono dell\'utente e la piattaforma non le contabilizza. Meglio che manchi piuttosto che sia stimato.</div>',
quiz:{q:'Cosa indica una concentrazione delle esecuzioni superiore al 70%?',opts:['Che la piattaforma è molto usata','Che regge in gran parte su un solo caso d\'uso','Che gli agenti sono affidabili'],correct:1}};
