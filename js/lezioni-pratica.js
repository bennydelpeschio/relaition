// ══════════════════════════════════════════
// DALLA LEZIONE ALLA SCHERMATA
// ══════════════════════════════════════════
// Le lezioni nominano le schermate di cui parlano — la Knowledge Base, il
// pannello di spiegabilita', la coda di revisione — ma chi legge doveva poi
// cercarsele da solo nel menu. Una formazione dentro il prodotto che rimanda
// al prodotto solo a parole vale quanto un manuale in PDF.
//
// Qui ogni lezione dichiara UN gesto concreto: cosa aprire, e cosa guardarci.
// Non e' decorazione — e' il punto in cui la lezione smette di essere teoria.
// La mappa sta in un file suo perche' cambia quando cambiano le schermate,
// non quando cambia il programma didattico.

var LEZIONE_PRATICA={
  // ── 1 · Fondamenti ──
  '1-0':{t:'Guarda un agente vero',   d:'Apri un flusso del catalogo e riconosci i quattro pezzi: modello, strumenti, flusso, controlli.', l:'Apri il Marketplace', a:"go('marketplace')"},
  '1-1':{t:'Vedi cosa riceve il modello', d:'Nel Builder, seleziona un nodo AI: il prompt di sistema e quello utente sono due campi distinti, ed è lì che si decide il comportamento.', l:'Apri il Builder', a:"go('builder')"},
  '1-2':{t:'Osserva il ciclo ragiona-agisci', d:'Esegui un flusso con strumenti e apri la traccia: ogni invocazione mostra cosa il modello ha chiesto e cosa gli è tornato.', l:'Vai al Log Esecuzioni', a:"go('execlog')"},
  '1-3':{t:'Costruiscine uno adesso', d:'Trigger, un nodo AI, un output. Tre nodi bastano per avere qualcosa che gira.', l:'Nuovo agente', a:"startNewAgent()"},
  '1-4':{t:'Riscrivi un prompt e confronta', d:'Cambia il prompt di un nodo AI, riesegui, e leggi i due esiti uno accanto all’altro nel registro.', l:'Apri il Builder', a:"go('builder')"},
  '1-5':{t:'Metti alla prova il flusso', d:'Premi Valida: la piattaforma segnala i rami che citano campi che nessun nodo a monte produce.', l:'Apri il Builder', a:"go('builder')"},

  // ── 2 · Builder avanzato ──
  '2-0':{t:'Crea una diramazione',    d:'Aggiungi una condizione e collega i due rami: il Builder avvisa se uno dei due resta scoperto.', l:'Apri il Builder', a:"go('builder')"},
  '2-1':{t:'Itera su più elementi', d:'Un nodo Ciclo su una lista: guarda nel registro quante volte il corpo viene eseguito.', l:'Apri il Builder', a:"go('builder')"},
  '2-2':{t:'Chiama un servizio esterno', d:'Configura un nodo HTTP con una connessione riutilizzabile, così la stessa impostazione serve più flussi.', l:'Apri le Connessioni', a:"openConnessioni()"},
  '2-3':{t:'Assorbi un errore',       d:'Aggiungi un Gestore eccezioni e forza un guasto: il flusso deve proseguire, e la traccia deve dirlo.', l:'Apri il Builder', a:"go('builder')"},
  '2-4':{t:'Risali dal sintomo al nodo', d:'Nel registro dell’esecuzione, clicca una riga in errore: la piattaforma seleziona il nodo che l’ha prodotta.', l:'Vai al Log Esecuzioni', a:"go('execlog')"},
  '2-5':{t:'Guarda dove si perde tempo', d:'La distribuzione delle durate nel Monitoraggio dice quali esecuzioni sono lente, che la media nasconde.', l:'Apri il Monitoraggio', a:"go('monitoraggio')"},

  // ── 3 · AI per il business ──
  '3-0':{t:'Installa un qualificatore', d:'Prendi «Lead Qualifier Pro» dal catalogo e leggi come assegna il punteggio: la motivazione è parte dell’output.', l:'Apri il Marketplace', a:"go('marketplace')"},
  '3-1':{t:'Guarda un onboarding reale', d:'«HR Onboarding Agent» mostra come si concatenano raccolta documenti, verifica e aggiornamento del gestionale.', l:'Apri il Marketplace', a:"go('marketplace')"},
  '3-2':{t:'Estrai dati da una fattura', d:'Il flusso «2 · Estrazione dati da fattura» è già nei tuoi agenti: eseguilo e guarda i campi estratti.', l:'I miei agenti', a:"go('myagents')"},
  '3-3':{t:'Leggi un contratto',      d:'«Contract Reviewer» produce un punteggio di rischio: serve a decidere cosa mandare al legale, non a sostituirlo.', l:'Apri il Marketplace', a:"go('marketplace')"},
  '3-4':{t:'Calcola il tuo ritorno',  d:'Il Monitoraggio dice quante esecuzioni sono andate a buon fine e quanto sono durate: sono i due numeri da cui parte ogni stima.', l:'Apri il Monitoraggio', a:"go('monitoraggio')"},
  '3-5':{t:'Parti da un caso solo',   d:'Guarda quali agenti vengono usati davvero: l’adozione si costruisce su pochi casi che funzionano.', l:'Apri il Monitoraggio', a:"go('monitoraggio')"},

  // ── 4 · Sicurezza e governance ──
  '4-0':{t:'Maschera i dati personali', d:'Aggiungi il controllo «Mascheramento dati» prima del nodo AI e riesegui: nella traccia i dati partono già oscurati.', l:'Apri il Builder', a:"go('builder')"},
  '4-1':{t:'Decidi cosa non esce',    d:'Le politiche impongono controlli obbligatori in base all’ambito: guarda quali sono attive.', l:'Apri le Politiche', a:"openPoliciesModal()"},
  '4-2':{t:'Blocca un output malformato', d:'«Convalida output» ferma il flusso quando la risposta non rispetta lo schema dichiarato. Provalo con uno schema che non torna.', l:'Apri il Builder', a:"go('builder')"},
  '4-3':{t:'Esporta una traccia',     d:'Il registro di un’esecuzione si esporta in Markdown, CSV o JSON, con il nodo di provenienza su ogni riga.', l:'Vai al Log Esecuzioni', a:"go('execlog')"},
  '4-4':{t:'Cerca lo squilibrio',     d:'Rigioca la stessa esecuzione con input diversi e confronta gli esiti: è il modo più diretto per accorgersi di un trattamento diverso.', l:'Vai al Log Esecuzioni', a:"go('execlog')"},
  '4-5':{t:'Verifica la copertura',   d:'L’area «Presidio e governance» dice quanti agenti hanno almeno un controllo attivo, e quante volte sono intervenuti.', l:'Apri il Monitoraggio', a:"go('monitoraggio')"},

  // ── 5 · Marketing ──
  '5-0':{t:'Genera con un vincolo',   d:'Imposta il formato di uscita su JSON in un nodo AI: il testo libero non si può passare al nodo successivo.', l:'Apri il Builder', a:"go('builder')"},
  '5-1':{t:'Pianifica una pubblicazione', d:'Metti un agente in produzione con un’espressione cron: la pianificazione è descritta in italiano prima di essere salvata.', l:'I miei agenti', a:"go('myagents')"},
  '5-2':{t:'Manda una mail vera',     d:'Con il servizio di posta locale attivo l’invio è reale; senza, il flusso mostra l’anteprima e la marca come simulata.', l:'Apri il Builder', a:"go('builder')"},
  '5-3':{t:'Confronta due varianti',  d:'Una condizione che alterna due prompt, e il registro che dice quale ramo ha preso ogni esecuzione.', l:'Apri il Builder', a:"go('builder')"},
  '5-4':{t:'Leggi l’andamento',     d:'L’area «Volumi e affidabilità» separa la crescita fatta di successi da quella fatta di fallimenti.', l:'Apri il Monitoraggio', a:"go('monitoraggio')"},
  '5-5':{t:'Orchestra più agenti',  d:'Il flusso «5 · Rapporto settimanale multi-agente» passa il lavoro fra agenti diversi: guarda i passaggi di consegne nella traccia.', l:'I miei agenti', a:"go('myagents')"},

  // ── 6 · Padroneggiare RelAItion ──
  '6-0':{t:'Guarda le porzioni',      d:'Carica un documento e apri la scheda Porzioni: è esattamente ciò che riceverà l’agente.', l:'Apri la Knowledge Base', a:"openKBDocsModal()"},
  '6-1':{t:'Interroga la conoscenza', d:'Prova una ricerca con parole diverse da quelle del documento: è lì che il recupero ibrido si vede.', l:'Apri la Knowledge Base', a:"openKBDocsModal()"},
  '6-2':{t:'Apri «Perché questo risultato»', d:'Su un’esecuzione conclusa: mostra le porzioni usate, gli strumenti invocati e i controlli intervenuti.', l:'Vai al Log Esecuzioni', a:"go('execlog')"},
  '6-3':{t:'Guarda le politiche attive', d:'Ogni politica impone un controllo a un ambito: sono la ragione per cui certe pubblicazioni non passano.', l:'Apri le Politiche', a:"openPoliciesModal()"},
  '6-4':{t:'Pubblica un agente',      d:'Scegli l’ambito e leggi quali controlli richiede: la verifica avviene prima dell’invio, non dopo il rifiuto.', l:'I miei agenti', a:"go('myagents')"},
  '6-5':{t:'Leggi le sette aree',     d:'Il cruscotto dichiara a quale domanda risponde ciascuna area, e cosa non può dirti.', l:'Apri il Monitoraggio', a:"go('monitoraggio')"}
};

// Il riquadro si disegna solo se la lezione ha un gesto dichiarato: un invito
// generico («esplora la piattaforma!») sarebbe rumore, e insegnerebbe a
// ignorare anche quelli buoni.
function bloccoPratica(key){
  var p=LEZIONE_PRATICA[key];
  if(!p)return '';
  return '<div class="card" style="margin-top:18px;padding:14px 16px;border-left:3px solid var(--ac2);display:flex;gap:14px;align-items:center;flex-wrap:wrap">'+
    '<div style="font-size:24px">🧪</div>'+
    '<div style="flex:1;min-width:200px">'+
      '<div style="font-size:13px;font-weight:800">Provalo adesso, '+escHtml(p.t)+'</div>'+
      '<div style="font-size:11.5px;color:var(--tx3);margin-top:3px;line-height:1.55">'+escHtml(p.d)+'</div>'+
    '</div>'+
    '<button class="tb-btn primary" style="flex-shrink:0" onclick="'+p.a+'">'+escHtml(p.l)+' →</button>'+
  '</div>';
}

// ══════════════════════════════════════════
// CHIUSURA DI UN PERCORSO
// ══════════════════════════════════════════
// Completando l'ultima lezione compariva "avanzamento aggiornato", lo stesso
// messaggio della prima: finire sei lezioni e non finirle era indistinguibile.
// Il riconoscimento arriva una volta sola per utente e percorso — ripassare una
// lezione gia' fatta non deve rifar comparire i coriandoli.
function percorsoCompletato(p){
  if(!p||!p.lessons.every(function(l){return l.done}))return false;
  var chiave='relaition_percorso_'+p.id+'_'+utenteCorrente();
  if(localStorage.getItem(chiave))return false;
  try{localStorage.setItem(chiave,new Date().toISOString())}catch(e){}
  return true;
}

function festeggiaPercorso(p){
  var quiz=0;
  p.lessons.forEach(function(l,i){
    if(dbGetOne('SELECT 1 x FROM quiz_done WHERE quiz_key=? AND user=?',[p.id+'-'+i,utenteCorrente()]))quiz++;
  });
  // Quanti percorsi restano: dice se la certificazione e' vicina, che e'
  // l'unica cosa che uno voglia sapere in quel momento.
  var fatti=PATHS.filter(function(x){return x.lessons.every(function(l){return l.done})}).length;
  addXP(150,'Completato il percorso: '+p.name);
  openModal(
    '<div style="text-align:center;padding:6px 4px 2px">'+
      '<div style="font-size:44px">'+p.icon+'</div>'+
      '<h2 style="margin:8px 0 2px">Percorso completato</h2>'+
      '<div style="font-size:13px;color:var(--tx3)">'+escHtml(p.name)+'</div>'+
      '<div style="display:flex;gap:8px;justify-content:center;margin:16px 0;flex-wrap:wrap">'+
        '<span class="badge badge-g">'+p.lessons.length+' lezioni</span>'+
        '<span class="badge '+(quiz===p.lessons.length?'badge-g':'badge-y')+'">'+quiz+'/'+p.lessons.length+' quiz superati</span>'+
        '<span class="badge badge-b">+150 XP</span>'+
      '</div>'+
      (quiz<p.lessons.length
        ? '<div style="font-size:11.5px;color:var(--tx3);line-height:1.6;margin-bottom:14px">Restano '+(p.lessons.length-quiz)+' quiz da superare: le lezioni sono segnate come lette, ma la verifica non e\u0300 stata fatta.</div>'
        : '<div style="font-size:11.5px;color:var(--tx3);line-height:1.6;margin-bottom:14px">Tutti i quiz superati.</div>')+
      '<div style="font-size:12px;color:var(--tx2);margin-bottom:16px">'+
        (fatti>=PATHS.length
          ? 'Sono completi tutti e '+PATHS.length+' i percorsi: il livello <strong>'+livelloInfo(livelloRaggiunto()||4).nome+'</strong> è raggiunto.'
          : fatti+' percorsi su '+PATHS.length+'. Ne mancano '+(PATHS.length-fatti)+' per la certificazione.')+
      '</div>'+
      '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'+
        '<button class="tb-btn primary" onclick="closeModal();go(\'learning\')">Torna ai percorsi</button>'+
        '<button class="tb-btn" onclick="closeModal();setLearnTab(\'certs\',null);go(\'learning\')">Vedi le certificazioni</button>'+
      '</div>'+
    '</div>',true);
}
