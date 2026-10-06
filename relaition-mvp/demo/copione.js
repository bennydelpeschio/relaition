// ═══════════════════════════════════════════════════════════════
// COPIONE DELLA DIMOSTRAZIONE
// ═══════════════════════════════════════════════════════════════
// Ogni passo e' una scheda: dove si trova, cosa fa, cosa illumina e cosa
// racconta. Il testo e' scritto in prima persona — «clicco qui», «tolgo questo
// nodo» — perche' la dimostrazione deve leggersi come qualcuno che sta usando
// la piattaforma, non come una didascalia che la descrive dall'esterno.
//
// Una `azione` che dichiara un argomento viene trattata come asincrona: riceve
// la funzione da chiamare quando ha finito. Serve dove bisogna aspettare che
// qualcosa compaia: un'esecuzione, una finestra, una scrittura a macchina.
//
// I selettori sono quelli VERI dell'applicazione, verificati uno per uno: un
// selettore inventato non fa fallire niente in modo rumoroso, semplicemente
// illumina il vuoto — ed e' il modo piu' facile di consegnare una demo che
// sembra funzionare e invece indica il posto sbagliato.

var COPIONE_CAPITOLI={
  1:{n:'1',t:'Accesso e orientamento'},
  2:{n:'2',t:'Marketplace: cercare e installare'},
  3:{n:'3',t:'Builder e Knowledge Base'},
  4:{n:'4',t:'Costruire a mano un caso semplice'},
  5:{n:'5',t:'Modello, chat builder, pianificazione'},
  6:{n:'6',t:'Eseguire e capire'},
  7:{n:'7',t:'Pubblicazione e revisione'},
  8:{n:'8',t:'Learning Hub, Sfide, Community'},
  9:{n:'9',t:'Profilo e monitoraggio'},
  10:{n:'10',t:'Un altro accesso: dati per persona'}
};

// Scorciatoie leggibili verso l'applicazione dentro il riquadro.
function W(){ return app() }
function Q(sel){ var d=doc(); return d&&d.querySelector(sel) }
function QQ(sel){ var d=doc(); return d?Array.prototype.slice.call(d.querySelectorAll(sel)):[] }

// Elemento che contiene un testo: i selettori per classe non bastano quando il
// bersaglio e' «la scheda che parla di fatture» e non «la terza scheda».
function perTesto(sel,testo){
  var t=String(testo).toLowerCase();
  return QQ(sel).filter(function(e){ return (e.textContent||'').toLowerCase().indexOf(t)>=0 })[0];
}

// Su quale sfida si mostra la candidatura. Si sceglie la prima sfida MISURATA
// dove chi presenta non si e' ancora candidato: cosi' il gesto raccontato e'
// una candidatura vera, con il pulsante che dice «Candida». Se fossero tutte
// gia' occupate si ripiega sulla prima misurata — il passo diventa una
// modifica della candidatura, che e' comunque una cosa che esiste. La scelta
// resta la stessa per tutti i passi che la usano: due passi che parlano di due
// sfide diverse racconterebbero una storia sconnessa.
var _sfidaScelta=null;
function sfidaDaCandidare(){
  var w=W(); if(!w||!w.SFIDE)return null;
  if(_sfidaScelta){ var g=w.sfidaById(_sfidaScelta); if(g)return g }
  var misurate=w.SFIDE.filter(function(x){return !!x.metrica});
  var libere=misurate.filter(function(x){ try{ return !w.sfCandidatura(x.id) }catch(e){ return false } });
  var s=libere[0]||misurate[0]||null;
  if(s)_sfidaScelta=s.id;
  return s;
}

// I titoli delle sfide finiscono dentro il testo della narrazione, che e' HTML.
function escapaTitolo(t){
  return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Ricaricamento controllato dell'app: serve per tornare alla schermata di
// accesso. Non si usa `logout()` dell'applicazione perche' apre un `confirm()`
// che bloccherebbe la dimostrazione in attesa di un clic che nessuno dara'.
function ricaricaApp(fine){
  var w=W();
  try{
    w.localStorage.removeItem('relaition_logged_in');
    // L'indirizzo comanda anche dopo l'accesso: se resta `#builder` da una
    // sessione precedente, l'utente entra e si ritrova nel Builder invece che
    // sulla dashboard, e la narrazione parlerebbe di una schermata diversa da
    // quella che si vede.
    try{ w.location.hash='' }catch(e){}
    // Il Builder apre da solo il proprio giro di benvenuto la prima volta che
    // lo si visita, e uscendo dalla sessione quel flag torna vuoto: la
    // dimostrazione se lo ritrovava sopra, con due guide sovrapposte che
    // spiegano cose diverse. Si segna come gia' visto — nella copia locale del
    // browser, non nel codice dell'app.
    w.localStorage.setItem('relaition_tour_seen','1');
    w.localStorage.setItem('relaition_tour_fatto','1');
  }catch(e){}
  var f=document.getElementById('app');
  var atteso=function(){
    f.removeEventListener('load',atteso);
    // Il flag va rimesso anche DOPO il ricaricamento: la pagina nuova legge il
    // proprio localStorage all'avvio, e fra la scrittura e il caricamento la
    // sessione e' stata azzerata.
    try{
      W().localStorage.setItem('relaition_tour_seen','1');
      W().localStorage.setItem('relaition_tour_fatto','1');
    }catch(e){}
    attendiApp(function(){ setTimeout(fine,600) });
  };
  f.addEventListener('load',atteso);
  try{ w.location.reload() }catch(e){ fine() }
}

// Se il giro del Builder si aprisse comunque, lo si chiude: meglio una rete di
// sicurezza che una dimostrazione con due riquadri sovrapposti.
function chiudiGiroBuilder(){
  var w=W(); if(!w)return;
  try{ if(typeof w.finishTour==='function'){ w.finishTour(); return } }catch(e){}
  var salta=perTesto('button','Salta il tour');
  if(salta)salta.click();
}

// ── Costruzione del flusso per nome logico ─────────────────────
// `F` tiene l'id del nodo dietro a ogni nome («maschera», «soglia»...). I passi
// riferivano i nodi per posizione nell'array, e bastava tornare indietro di un
// passo e riavanzare — cosa che un presentatore fa continuamente — per
// ritrovarsi un nodo in piu' e i collegamenti agganciati a quello sbagliato.
var F={};

// Crea il nodo solo se non c'e' gia': rieseguire un passo non deve duplicarlo.
function creaNodo(w,chiave,tipo,icona,nome,dettaglio,x,y){
  var esistente=w.B.nodes.filter(function(n){return n.id===F[chiave]})[0];
  if(esistente)return esistente.id;
  var id=w.b_addNode(tipo,icona,nome,dettaglio,x,y);
  F[chiave]=id;
  return id;
}

// Stessa regola per i collegamenti: uno solo fra due porte, anche se il passo
// viene rieseguito.
function collega(w,da,portaDa,a,portaA,etichetta){
  var i1=F[da], i2=F[a];
  if(i1===undefined||i2===undefined)return;
  var esiste=w.B.edges.some(function(e){
    return e.from===i1 && e.to===i2 && e.fp===portaDa && e.tp===portaA;
  });
  if(esiste)return;
  w.b_addEdge(i1,portaDa,i2,portaA,etichetta||'');
}

// Carica sulla tela un agente gia' salvato, cercandolo per pezzo di nome.
// Serve perche' ogni capitolo si deve poter aprire da solo: chi salta al
// capitolo 5 dall'indice non ha costruito il flusso del capitolo 4, e senza
// questo si ritroverebbe a sentir parlare di un pannello vuoto.
function caricaFlusso(w,pezzoDiNome){
  var f=null;
  try{ f=w.dbGetOne('SELECT * FROM agents WHERE name LIKE ? ORDER BY id DESC LIMIT 1',['%'+pezzoDiNome+'%']) }catch(e){}
  if(!f)return false;
  try{
    w.B.nodes=JSON.parse(f.nodes_json||'[]');
    w.B.edges=JSON.parse(f.edges_json||'[]');
    w.B.nextId=w.B.nodes.reduce(function(m,n){return Math.max(m,n.id||0)},0)+1;
    w.B.dbAgentId=f.id;
    w.B.context=f.context||'';
    w.currentAgentName=f.name;
    w.b_render();
    if(typeof w.bFitView==='function')w.bFitView();
  }catch(e){ return false }
  return true;
}

// Su quale pubblicazione lavora il capitolo della revisione.
// Se la pubblicazione del flusso appena costruito e' andata a buon fine si usa
// quella; altrimenti — tipicamente perche' senza modello collegato la
// validazione blocca la pubblicazione — si prosegue su una pubblicazione reale
// gia' presente. Meglio mostrare il ciclo su dati veri che simulare un
// passaggio che l'applicazione non avrebbe permesso.
function bersaglioRevisione(w){
  var r=null;
  try{ r=w.dbGetOne("SELECT id FROM published_agents WHERE name LIKE '%Screening CV%' ORDER BY id DESC LIMIT 1") }catch(e){}
  if(r)return r.id;
  try{ r=w.dbGetOne("SELECT id FROM published_agents WHERE status IN ('in_verifica','in_revisione','bozza') ORDER BY id DESC LIMIT 1") }catch(e){}
  return r?r.id:null;
}

// Seleziona un nodo come farebbe un clic sulla tela. L'applicazione non ha una
// `selectNode()`: la selezione e' lo stato `B.selId` piu' il ridisegno del
// pannello. Chiamare un nome inventato dentro un try/catch non falliva in modo
// rumoroso — semplicemente il pannello restava su un altro nodo, e la
// dimostrazione scriveva il prompt nel campo sbagliato o in nessun campo.
function selezionaNodo(w,id){
  try{
    w.B.selId=id;
    if(w.B.selIds)w.B.selIds=[];
    if(typeof w.b_render==='function')w.b_render();
    if(typeof w.renderProps==='function')w.renderProps(id);
    return true;
  }catch(e){ return false }
}

// Garantisce che si sia dentro l'applicazione. La schermata di accesso e' un
// sovrapposto a tutta pagina: se il presentatore salta a un capitolo qualsiasi
// dall'indice SENZA passare dal passo che effettua l'accesso, l'applicazione
// sotto funziona benissimo ma non si vede nulla — si illumina il vuoto e la
// narrazione parla di una schermata coperta. Vale per ogni capitolo dal
// secondo in poi; il primo racconta proprio l'accesso e va lasciato stare.
// Con quale account si rientra se la schermata di accesso ricompare. Vuoto
// significa «il primo», cioè la persona di cui parla la narrazione fino al
// capitolo 9. L'ultimo capitolo lo cambia.
var UTENTE_ATTESO=null;

function assicuraAccesso(fine){
  var d=doc(), w=W();
  var schermata=d&&d.getElementById('loginScreen');
  var visibile = schermata && getComputedStyle(schermata).display!=='none';
  if(!visibile){ fine(); return }
  try{
    // Di norma si entra con il primo account, che è quello di cui parla tutta
    // la narrazione. L'ultimo capitolo però mostra la piattaforma vista da
    // un'altra persona: da lì in poi il rientro automatico deve riportare
    // QUELLA, altrimenti il capitolo che parla di Giulia si riaprirebbe come
    // Mario e mostrerebbe i numeri sbagliati.
    var u=UTENTE_ATTESO || ((w.UTENTI&&w.UTENTI[0])?w.UTENTI[0].email:null);
    if(u&&typeof w.accediComeDemo==='function')w.accediComeDemo(u);
    else{
      var scheda=QQ('#accountDemo [onclick]')[0];
      if(scheda)scheda.click();
    }
  }catch(e){}
  setTimeout(fine,1200);
}

// ── Aiuti di scena ─────────────────────────────────────────────

// Chiude qualunque finestra sovrapposta. Serve PRIMA di parlare del registro:
// il passo su «Perche' questo risultato» apre una modale, e quello successivo
// raccontava il registro mentre la modale lo copriva per intero.
// Toglie tutto quello che sta SOPRA la schermata: finestre, pannello delle
// notifiche, suggerimenti dei grafici. In una dimostrazione un sovrapposto
// rimasto aperto e' il difetto piu' visibile che ci sia — il faretto illumina
// un elemento della pagina e davanti c'e' una finestra che parla d'altro.
// Viene chiamata dal motore all'inizio di ogni passo, non solo dove qualcuno
// si e' ricordato di scriverla.
function chiudiFinestre(){
  var w=W(); if(!w)return;
  // La sandbox didattica e' uno stato del Builder, non una finestra, ma per la
  // dimostrazione vale lo stesso: aperta in un passo, non deve sopravvivere al
  // passo dopo, altrimenti la palette resta ridotta per tutto il resto.
  try{
    var passo=(typeof COPIONE!=='undefined'&&typeof D!=='undefined')?COPIONE[D.passo]:null;
    if(w.SANDBOX&&w.SANDBOX.attiva&&!(passo&&passo.tieniSandbox)&&typeof w.closeSandbox==='function')w.closeSandbox();
  }catch(e){}
  try{ if(typeof w.closeModal==='function')w.closeModal() }catch(e){}
  try{
    var d=doc();
    var o=d.getElementById('modalOverlay');
    if(o)o.classList.remove('show');
    // Il pannello delle notifiche non e' una finestra modale: resta aperto
    // anche cambiando pagina, e la sua variabile va rimessa a posto o al clic
    // successivo si riapre invece di chiudersi.
    var np=d.getElementById('notifPanel');
    if(np&&np.classList.contains('show')){
      np.classList.remove('show');
      try{ w.notifOpen=false }catch(e2){}
    }
    if(typeof w.govTip==='function')w.govTip(null);
  }catch(e){}
}

// Apre il registro a un'altezza leggibile. Chiuso e' alto 36px e non si legge
// niente; troppo aperto copre il canvas di cui si sta parlando.
function apriRegistro(px){
  var w=W(); if(!w)return;
  try{ if(typeof w.impostaAltezzaRegistro==='function')w.impostaAltezzaRegistro(px||240) }catch(e){}
}

// Scorre il registro dall'alto verso il basso mentre chi guarda legge. In una
// registrazione un pannello fermo pieno di righe non si distingue da
// un'immagine: il movimento e' cio' che fa capire che le righe sono tante e
// che raccontano una sequenza.
function scorriRegistro(durata,fine){
  var body=Q('#execLogBody');
  if(!body){ if(fine)fine(); return }
  var massimo=body.scrollHeight-body.clientHeight;
  if(massimo<=8){ body.scrollTop=0; if(fine)fine(); return }
  body.scrollTop=0;
  var t0=Date.now(), ms=(durata||4000)/D.velocita;
  var passo=setInterval(function(){
    var q=Math.min(1,(Date.now()-t0)/ms);
    body.scrollTop=Math.round(massimo*q);
    if(q>=1){ clearInterval(passo); if(fine)fine() }
  },40);
}

// Numeri presi dall'applicazione invece che scritti nel copione. Dire «quindici
// discussioni» significa dover ricorreggere il testo ogni volta che il seme
// cambia, e prima o poi qualcuno mostra una demo che dichiara un numero e ne
// visualizza un altro.
function quanti(query){
  try{ return W().dbGetOne(query).c }catch(e){ return '' }
}
function quantiAgentiCatalogo(){
  try{ var w=W(); return (w.AGENTS||[]).length + (typeof w.getPublishedAgents==='function'?w.getPublishedAgents().length:0) }
  catch(e){ return '' }
}
function quanteLezioni(){
  try{ return (W().PATHS||[]).reduce(function(a,p){return a+p.lessons.length},0) }catch(e){ return '' }
}

// C'e' un fornitore AI collegato? Da questo dipende cosa la dimostrazione puo'
// mostrare davvero: il test del modello, la costruzione via chat e la
// pubblicazione funzionano solo con una chiave configurata.
function modelloCollegato(){
  try{
    var w=W();
    var p=(typeof w.anyProviderReady==='function') ? (w.anyProviderReady()||null) : null;
    // `anyProviderReady` restituisce l'identificativo interno — «openai» —
    // che nella narrazione si legge come un refuso: si usa il nome per esteso.
    return (p && typeof w.providerLabel==='function') ? w.providerLabel(p) : p;
  }catch(e){ return null }
}

var COPIONE=[

// ── CAPITOLO 1 · Accesso e orientamento ────────────────────────
{
  capitolo:1, titolo:'RelAItion in una frase',
  testo:'Un <strong>marketplace di agenti AI</strong> dove chi conosce il processo aziendale costruisce l\'automazione da solo, senza scrivere codice. Parto dall\'accesso, per mostrare l\'esperienza dal primo istante.',
  azione:function(fine){ ricaricaApp(fine) },
  sel:'#loginScreen', pos:'right', durata:7000
},
{
  capitolo:1, titolo:'Quattro persone, quattro punti di vista',
  testo:'Non c\'è un utente solo: <em>Mario costruisce</em>, <em>Giulia manda in produzione</em>, <em>Sara presidia</em>, <em>Marco sperimenta</em>. Ognuno vede i propri agenti, le proprie esecuzioni, i propri progressi. L\'autenticazione è simulata in locale, come dichiarato a schermo: **nessun dato lascia il browser**, il database gira interamente via WebAssembly.',
  sel:'#accountDemo', pos:'right', durata:8000
},
{
  capitolo:1, titolo:'Entro come Mario',
  testo:'Clicco la sua scheda: la piattaforma compila email e password al posto mio e accede. Da qui in avanti tutto quello che vedo è <strong>suo</strong>.',
  azione:function(fine){
    var el=perTesto('#accountDemo [onclick]','Mario') || QQ('#accountDemo [onclick]')[0];
    if(el)clicca(el);
    setTimeout(fine,2000);
  },
  sel:null, durata:5000
},
{
  capitolo:1, titolo:'La dashboard risponde a «come sto andando»',
  testo:'Quattro numeri: quanti agenti ho, quante volte sono stati eseguiti, a che punto sono con la formazione, quanta esperienza ho accumulato. Sono <strong>i miei</strong>, non una media: ogni persona entra e vede il proprio lavoro. Solo i consigli e le novità della piattaforma sono uguali per tutti.',
  pagina:'dashboard', sel:'.stats-row', pos:'bottom', durata:8000
},
{
  capitolo:1, titolo:'Il menu segue il ciclo di vita di un agente',
  testo:'Si <em>costruisce</em> nel Builder, si <em>riusa</em> dal Marketplace, si <em>controlla</em> in Log Esecuzioni e Monitoraggio. Sotto, la parte formativa e sociale: Learning Hub, Sfide, Community.',
  sel:'.sidebar', pos:'right', durata:7000
},
{
  capitolo:1, titolo:'Attività recente',
  testo:'La cronologia personale: cosa è stato eseguito, quali lezioni completate, quali badge sbloccati. Risponde alla domanda di chi torna dopo una settimana: <em>«a che punto ero rimasto?»</em>',
  sel:'#dash-activity', pos:'left', durata:6500
},

// ── CAPITOLO 2 · Marketplace ───────────────────────────────────
{
  capitolo:2, titolo:'Il catalogo',
  testo:function(){ return quantiAgentiCatalogo()+' agenti pronti all\'uso, divisi per funzione aziendale. È il punto di partenza di chi non vuole costruire da zero: <strong>si installa, si prova, e solo dopo si personalizza</strong>.' },
  pagina:'marketplace', sel:'.mkt-hero', pos:'bottom', durata:7000
},
{
  pagina:'marketplace', capitolo:2, titolo:'Filtro per categoria',
  testo:'Clicco su <em>Finance</em>: il catalogo si restringe agli agenti che lavorano su fatture, contratti e pagamenti.',
  azione:function(fine){
    var el=perTesto('#mkt-filters .mkt-filter','Finance');
    if(el)clicca(el);
    setTimeout(fine,1600);
  },
  sel:'#mkt-filters', pos:'bottom', durata:5500
},
{
  pagina:'marketplace', capitolo:2, titolo:'Il catalogo si è ristretto',
  testo:'Restano solo gli agenti di quella funzione. L\'ordinamento segue la <strong>valutazione reale</strong> calcolata dalle recensioni, non parametri fissi, per garantire trasparenza agli utenti.',
  sel:'#mkt-grid', pos:'top', durata:7500
},
{
  pagina:'marketplace', capitolo:2, titolo:'Ricerca',
  testo:function(){
    var n=QQ('#mkt-grid .agent-card').length;
    return 'Scrivo «fattura» e il catalogo <strong>si restringe davvero</strong>'+(n?(': '+n+' risultat'+(n===1?'o':'i')):'')+
      '. Cerca in nome, descrizione, categoria, autore ed etichette, e tollera le desinenze: «fattura» trova anche «fatture». '+
      'Sopra i risultati resta scritto cosa si sta cercando, con il modo per togliere il filtro.';
  },
  azione:function(fine){
    var el=perTesto('#mkt-filters .mkt-filter','Tutti');
    if(el)el.click();
    var inp=Q('#globalSearch');
    if(!inp){ fine(); return }
    scrivi(inp,'fattura',function(){ setTimeout(fine,1800) });
  },
  sel:'#mkt-ricerca', pos:'bottom', durata:9000
},
{
  pagina:'marketplace', capitolo:2, titolo:'La scheda dell\'agente',
  testo:'Cosa fa, chi l\'ha scritto, quante volte è stato installato e come è stato giudicato. Le stelle sono la media delle recensioni vere lasciate da chi lo usa, e la distribuzione dice se tutti sono d\'accordo o se i pareri si dividono.',
  azione:function(fine){
    var inp=Q('#globalSearch'); if(inp)inp.value='';
    var c=perTesto('.agent-card','Invoice Extractor') || QQ('#mkt-grid .agent-card')[0];
    if(c)clicca(c);
    setTimeout(fine,1800);
  },
  sel:'#modalContent', pos:'left', durata:8500
},
{
  pagina:'marketplace', capitolo:2, titolo:'Recensioni vere',
  testo:'Ogni utente può lasciare <em>una sola</em> recensione per agente e aggiornarla nel tempo, garantendo un sistema di feedback affidabile e dinamico.',
  sel:'#recBloccoWrap', pos:'left', durata:7500
},
{
  pagina:'marketplace', capitolo:2, titolo:'Installa nel Builder',
  testo:'Il pulsante dice <strong>Installa nel Builder</strong> e mi porta sull\'area di lavoro con il flusso già caricato sulla tela. A differenza di un catalogo chiuso, <em>qui quello che scarichi lo puoi esplorare e modificare</em>.',
  azione:function(fine){
    // Il passo si regge da solo: se la finestra dell'agente non e' aperta —
    // succede saltando qui dall'indice — la si apre prima. Poi si porta il
    // pulsante in vista PRIMA di annunciarlo: sta in fondo a una finestra che
    // scorre, e la narrazione parlava di un pulsante che chi guarda non vedeva.
    var apri=function(dopo){
      if(perTesto('#modalContent button','Installa')){ dopo(); return }
      var c=perTesto('#mkt-grid .agent-card','Invoice Extractor') || QQ('#mkt-grid .agent-card')[0];
      if(c)c.click();
      setTimeout(dopo,1400);
    };
    apri(function(){
      var b=perTesto('#modalContent button','Installa');
      window.__bersaglio=b||null;
      portaInVista(b);
      setTimeout(function(){ if(b)clicca(b); setTimeout(fine,2400) },900);
    });
  },
  sel:function(){ return window.__bersaglio || '#modalContent' },
  pos:'left', durata:8000
},
{
  capitolo:2, titolo:'Eccolo sulla tela',
  testo:'L\'agente del marketplace è ora un flusso modificabile: stessi nodi, stessi collegamenti, aperti nel Builder. Posso aggiungere un controllo, cambiare il modello, e salvarlo come <strong>mio</strong> senza toccare l\'originale del catalogo.',
  sel:'#canvasArea', pos:'left', durata:7500
},
{
  capitolo:2, titolo:'Lo configuro per me',
  testo:'Installato non vuol dire «da usare così com\'è». Cambio il <strong>modello</strong> sul nodo AI: la scelta è per singolo blocco, perché classificare e scrivere non costano uguale. Qui un agente del catalogo diventa <em>il mio</em>.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    try{
      var ai=(w.B&&w.B.nodes||[]).filter(function(n){return n.type==='ai'})[0];
      if(ai){
        selezionaNodo(w,ai.id);
        // Si apre la tendina dei modelli e se ne sceglie uno diverso dal
        // predefinito: il gesto deve vedersi, non essere raccontato.
        setTimeout(function(){
          try{
            var sel=QQ('#propsBody select').filter(function(s){
              return /bScegliModello/.test(s.getAttribute('onchange')||'');
            })[0];
            if(sel && sel.options.length>1){
              sel.selectedIndex=Math.min(1,sel.options.length-2);
              scatena(sel,'change');
            }
          }catch(e){}
        },700);
      }
    }catch(e){}
    setTimeout(fine,1700);
  },
  sel:'#propsBody', pos:'left', durata:9000
},
{
  capitolo:2, titolo:'E lo eseguo subito',
  testo:'Dall\'installazione all\'esecuzione senza passare da nessuno: nessun ticket all\'IT. Il registro sotto scrive cosa succede, nodo per nodo, <em>mentre</em> succede.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    // Se la tela e' vuota — ci si e' saltati dentro dall'indice, o
    // l'installazione del passo prima non e' andata a buon fine — premere
    // Esegui apre la finestra «workflow non valido», che poi resta aperta
    // sopra i passi successivi. Si carica un flusso prima: il passo deve
    // reggersi da solo, come tutti gli altri.
    var vuota=false;
    try{ vuota=!(w.B&&w.B.nodes&&w.B.nodes.length) }catch(e){}
    var parti=function(){
      apriRegistro(200);
      var b=Q('#btnRun');
      if(b)clicca(b);
      setTimeout(fine,5200);
    };
    if(vuota){ caricaFlusso(w,'fattura'); setTimeout(parti,900); return }
    parti();
  },
  sel:'#canvasArea', pos:'left', durata:9000
},
{
  capitolo:2, titolo:'Lo salvo come mio',
  testo:'Finché resta sulla tela è una prova. <strong>Salvandolo diventa mio</strong>: con il mio nome, nel mio elenco, e l\'originale del catalogo resta intatto per tutti gli altri.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    // Il salvataggio chiede il nome con una finestra del browser, che in una
    // dimostrazione bloccherebbe tutto e non si vedrebbe nemmeno nel video.
    // Si risponde al posto suo e la si rimette com'era: il percorso eseguito
    // e' quello vero, solo senza la finestra di sistema in mezzo.
    var nome=w.currentAgentName||'Estrazione dati da fattura';
    var p=w.prompt, c=w.confirm;
    try{
      w.prompt=function(){ return nome };
      w.confirm=function(){ return false };
      var b=perTesto('.props-actions button','Salva') || perTesto('#page-builder button','Salva');
      if(b)clicca(b); else if(typeof w.saveAgent==='function')w.saveAgent();
    }catch(e){}
    setTimeout(function(){
      try{ w.prompt=p; w.confirm=c }catch(e){}
      fine();
    },1500);
  },
  sel:'#canvasArea', pos:'left', durata:7000
},
{
  capitolo:2, titolo:'È fra i miei agenti',
  testo:'Qui stanno insieme gli agenti <em>installati dal marketplace</em>, quelli <em>creati da me</em> e le <em>pubblicazioni in revisione</em>. Ogni scheda dice quante volte è stato eseguito: <strong>quante da me e quante in tutto</strong>, perché sono due informazioni diverse.',
  pagina:'myagents', sel:'.page-pad', pos:'bottom', durata:8000
},
{
  capitolo:2, titolo:'E lo riapro quando voglio',
  testo:function(){
    var n=window.__riaperto;
    return 'Riapro <strong>l\'ultimo che ho salvato</strong>'+(n?(' — «'+escapaTitolo(n)+'»'):'')+
      ': torna sulla tela com\'era, pronto da modificare o da rieseguire. Il lavoro non vive in una sessione, vive nel database.';
  },
  pagina:'myagents',
  azione:function(fine){
    var w=W();
    try{
      // L'ultimo salvato di QUESTA persona. Si preferisce, se c'e', quello
      // delle fatture: e' il caso piu' facile da raccontare a voce, e la demo
      // lo ha appena installato ed eseguito. Se non c'e' si prende comunque il
      // piu' recente, invece di aprire niente e lasciare la narrazione a
      // parlare di un flusso che non si vede.
      var chi=w.utenteCorrente();
      var r=w.dbGetOne("SELECT name FROM agents WHERE author=? AND (lower(name) LIKE '%fattur%' OR lower(name) LIKE '%invoice%') ORDER BY updated_at DESC LIMIT 1",[chi])
         || w.dbGetOne('SELECT name FROM agents WHERE author=? ORDER BY updated_at DESC LIMIT 1',[chi]);
      if(r&&r.name){
        window.__riaperto=r.name;
        if(typeof w.loadSavedAgent==='function')w.loadSavedAgent(r.name);
      }
    }catch(e){}
    // La vista si rimette a misura DOPO che il flusso e' sulla tela: aprendo
    // un agente la piattaforma adatta lo zoom da sola, ma lo fa prima che il
    // disegno sia finito e a volte lo lascia minuscolo in un angolo. Mezzo
    // secondo dopo la tela e' quella definitiva.
    setTimeout(function(){
      try{ if(typeof w.bFitView==='function')w.bFitView() }catch(e){}
      setTimeout(fine,700);
    },900);
  },
  sel:'#canvasArea', pos:'left', durata:8000
},

// ── CAPITOLO 3 · Il Builder e la Knowledge Base ────────────────
{
  capitolo:3, titolo:'Il Builder',
  testo:'Qui si costruisce. Tre zone: a sinistra i <em>blocchi</em>, al centro la <em>tela</em>, a destra le <em>proprietà</em> del nodo selezionato. Parto da una tela vuota.',
  pagina:'builder',
  azione:function(fine){
    chiudiGiroBuilder();
    chiudiFinestre();
    setTimeout(function(){
      try{ W().resetCanvasForNewAgent() }catch(e){}
      setTimeout(fine,700);
    },400);
  },
  sel:'#canvasArea', pos:'left', durata:7000
},
{
  capitolo:3, titolo:'La palette dei blocchi',
  testo:'Dieci categorie: trigger, AI, integrazioni, dati, output. E una fondamentale per l\'uso aziendale: i <strong>Controlli</strong>. Mascheramento dati, convalida, approvazione umana, limiti di frequenza, necessari per un governo reale dei flussi.',
  sel:'.builder-sidebar', pos:'right', durata:7500
},
{
  capitolo:3, titolo:'La Knowledge Base aziendale',
  testo:function(){
    var n=quanti('SELECT COUNT(*) c FROM kb_docs');
    var p=quanti('SELECT COUNT(*) c FROM kb_chunks');
    return 'Prima di costruire, vediamo <strong>cosa sa l\'azienda</strong>. I documenti si caricano una volta e si riusano in qualunque flusso: '+
      (n?('<em>'+n+' documenti</em> già indicizzati in <em>'+p+' porzioni</em>'):'qui si caricano i documenti')+'. Non è una cartella: è materiale segmentato e ricercabile.';
  },
  azione:function(fine){
    var w=W();
    try{ if(typeof w.openKnowledgeBaseModal==='function')w.openKnowledgeBaseModal() }catch(e){}
    setTimeout(fine,1600);
  },
  sel:'#modalContent', pos:'left', durata:9500
},
{
  capitolo:3, titolo:'Il recupero si prova prima di fidarsi',
  testo:function(){
    var r=window.__kbEsito;
    if(!r)return 'Cerco fra i documenti aziendali per vedere <strong>cosa verrebbe recuperato davvero</strong>.';
    return r.n
      ? 'Ho cercato «<em>'+r.q+'</em>»: la Knowledge Base restituisce <strong>'+r.n+' porzioni</strong>, ognuna con il documento di provenienza e quanto somiglia alla domanda. È questo che finisce nel prompt, non il documento intero, e non la conoscenza generale del modello.'
      : 'Ho cercato «<em>'+r.q+'</em>» e la Knowledge Base <strong>non ha trovato nulla</strong>. Lo dichiara in modo trasparente, evitando allucinazioni o risposte inventate dal modello AI.';
  },
  azione:function(fine){
    var w=W();
    // La domanda non e' inventata: si costruisce dal nome di un documento
    // davvero presente, cosi' il recupero ha qualcosa da trovare anche se
    // domani il seme cambia. `kbSearch` restituisce un oggetto con `results`,
    // non un array: leggerne `.length` dava sempre zero.
    var q='rimborso spese trasferta';
    try{
      var d=w.dbGetOne("SELECT name FROM kb_docs WHERE name LIKE '%rimbors%' LIMIT 1")
         || w.dbGetOne('SELECT name FROM kb_docs LIMIT 1');
      if(d&&d.name)q=String(d.name).replace(/\.[a-z]+$/i,'').replace(/[-_]+/g,' ');
      var res=(typeof w.kbSearch==='function')?w.kbSearch(q,{limit:4}):null;
      var righe=(res&&res.results)||[];
      window.__kbEsito={q:q, n:righe.length,
        primo:righe.length?(righe[0].docName||''):''};
    }catch(e){ window.__kbEsito={q:q,n:0,primo:''} }
    setTimeout(fine,1300);
  },
  sel:'#modalContent', pos:'left', durata:10000
},
{
  capitolo:3, titolo:'Cerco un documento fra tanti',
  testo:function(){
    var n=quanti('SELECT COUNT(*) c FROM kb_docs');
    return 'Con '+(n||'pochi')+' documenti si scorre; in azienda sono centinaia. La ricerca guarda <strong>anche dentro i documenti</strong>, non solo nei nomi — «dov\'era scritta la penale per il recesso?» non contiene la parola «contratto» — e mostra la riga in cui la trova.';
  },
  azione:function(fine){
    var w=W();
    // L'elenco dei documenti vive nella finestra «Carica/gestisci documenti»,
    // che e' un'altra rispetto a quella del passo precedente: va aperta qui,
    // altrimenti il campo di ricerca non esiste e il passo non fa niente.
    try{ if(typeof w.openKBDocsModal==='function')w.openKBDocsModal() }catch(e){}
    setTimeout(function(){
      try{
        // Si cerca una parola che sta nel TESTO di un documento e non nel suo
        // nome: è il caso che la ricerca per nome non risolve, ed è quello che
        // il testo del passo racconta. Si verifica che esista davvero prima di
        // usarla, altrimenti il giorno in cui il seme cambia il passo mostra
        // un elenco vuoto mentre la narrazione dice il contrario.
        var parola='recesso';
        var prova=w.dbGetOne("SELECT id FROM kb_docs WHERE lower(content) LIKE '%recesso%' LIMIT 1");
        if(!prova){
          var d=w.dbGetOne('SELECT name FROM kb_docs ORDER BY id LIMIT 1');
          parola=d&&d.name?String(d.name).replace(/\.[a-z]+$/i,'').split(/[-_\s]/)[0]:'';
        }
        var campo=Q('#kbDocsList input');
        if(campo&&parola){ scrivi(campo,parola,function(){ setTimeout(fine,800) }); return }
      }catch(e){}
      setTimeout(fine,800);
    },1200);
  },
  tieniAperto:true, sel:'#kbDocsList', pos:'left', durata:9500
},
{
  capitolo:3, titolo:'Dentro un documento: come è stato tagliato',
  testo:function(){
    var p=window.__kbPorzioni;
    return 'Apro un documento e vedo <strong>come è stato segmentato</strong>'+
      (p?(': <em>'+p+' porzioni</em>'):'')+
      '. Non tagli a lunghezza fissa: una normativa si taglia per articolo, un contratto per clausola, una procedura per passo. È la differenza fra una porzione che ha senso da sola e una che si interrompe a metà frase.';
  },
  azione:function(fine){
    var w=W();
    try{
      var d=w.dbGetOne('SELECT id FROM kb_docs ORDER BY id LIMIT 1');
      if(d){
        var c=w.dbGetOne('SELECT COUNT(*) c FROM kb_chunks WHERE doc_id=?',[d.id]);
        window.__kbPorzioni=c?c.c:0;
        if(typeof w.previewKBDoc==='function')w.previewKBDoc(d.id);
      }
    }catch(e){}
    setTimeout(fine,1500);
  },
  sel:'#modalContent', pos:'left', durata:10000
},
{
  capitolo:3, titolo:'E si porta via',
  testo:'Tutto quello che sta qui dentro <strong>si esporta in Markdown</strong>: documenti, agenti, esecuzioni. Un file di testo, leggibile ovunque. È la risposta a «e se domani cambiamo strumento?» — i dati non restano in ostaggio.',
  azione:function(fine){
    var w=W();
    // Il download parte davvero. In una dimostrazione registrata si vede la
    // barra del browser, ed e' esattamente il punto: il file esiste, non e'
    // un pulsante che racconta di esistere.
    try{ if(typeof w.exportWikiMarkdown==='function')w.exportWikiMarkdown() }catch(e){}
    setTimeout(fine,1400);
  },
  tieniAperto:true, sel:'#modalContent', pos:'left', durata:7500
},
{
  capitolo:3, titolo:'Chiudo e comincio a costruire',
  testo:'I documenti restano lì, disponibili a ogni flusso. Torno alla tela: adesso costruisco un agente <strong>a mano</strong>, trascinando i blocchi.',
  azione:function(fine){
    chiudiFinestre();
    setTimeout(fine,800);
  },
  sel:'#canvasArea', pos:'left', durata:7000
},

// ── CAPITOLO 4 · Costruire a mano: un caso semplice ────────────
// Il caso e' volutamente elementare e replicabile: pochi nodi, una regola sola.
// Un flusso complicato mostrato in fretta non convince nessuno; uno semplice
// che si vede nascere pezzo per pezzo si', e la complessita' si aggiunge dopo.
{
  capitolo:4, titolo:'La palette: si cerca, non si scorre',
  testo:'Dieci categorie e settantotto blocchi. Il campo di ricerca in cima li filtra mentre scrivo: digito <em>email</em> e restano quelli che mi servono.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    chiudiGiroBuilder(); chiudiFinestre();
    setTimeout(function(){
      try{ w.resetCanvasForNewAgent(); w.currentAgentName='Smistamento richieste'; F={} }catch(e){}
      var campo=Q('#paletteSearch');
      if(!campo){ fine(); return }
      scrivi(campo,'email',function(){ setTimeout(fine,900) });
    },500);
  },
  sel:'.builder-sidebar', pos:'right', durata:9000
},
{
  capitolo:4, titolo:'I blocchi si trascinano sulla tela',
  testo:function(){
    var n=QQ('.palette-item').length;
    return 'Ogni riga è <strong>trascinabile</strong>: si prende e si lascia cadere dove serve. '+
      (n?('La ricerca ne ha lasciati <em>'+n+'</em>. '):'')+
      'Prendo il <em>trigger</em> che parte quando arriva un\'email: è ciò che fa scattare l\'agente.';
  },
  sel:'.palette-item', pos:'right', durata:9000
},
{
  capitolo:4, titolo:'Primo nodo sulla tela',
  testo:'Rilasciato. La tela lo accoglie con la sua icona, il nome e una riga di dettaglio. <strong>Nessuna riga di codice</strong>: chi conosce il processo può arrivare fin qui da solo.',
  // `pagina` mancava, e si vedeva solo nella versione breve: li' questo passo
  // arriva subito dopo la Knowledge Base, quindi il nodo veniva aggiunto
  // mentre a schermo c'era ancora un'altra pagina, e l'evidenziazione cadeva
  // su una tela che nessuno stava guardando. Dichiarare la pagina e' quello
  // che rimette in fila questo passo e i due successivi.
  pagina:'builder',
  azione:function(fine){
    var w=W();
    chiudiFinestre();
    try{
      var campo=Q('#paletteSearch'); if(campo){ campo.value=''; scatena(campo,'input') }
      // Primo anello della catena: azzera la tela e battezza l'agente. Stava
      // nel passo della ricerca in palette, che nella versione breve non c'e':
      // senza, i nodi costruiti a mano finivano sulla tela dell'agente
      // installato poco prima, e l'esecuzione veniva registrata col nome di
      // quello. Ogni passo si deve reggere da solo, anche saltandoci dentro
      // dall'indice.
      if(F.trigger===undefined){
        try{ w.resetCanvasForNewAgent(); w.currentAgentName='Smistamento richieste'; F={} }catch(e){}
      }
      creaNodo(w,'trigger','tr','📧','Email trigger','Richiesta in arrivo',200,80);
      w.b_render();
    }catch(e){}
    setTimeout(fine,1100);
  },
  sel:'#canvasArea', pos:'left', durata:8000
},
{
  capitolo:4, titolo:'Il nodo che capisce di cosa si tratta',
  testo:'Aggiungo un nodo AI e lo <strong>seleziono</strong>: a destra si apre il pannello delle sue proprietà. È lì che si decide cosa fa, e ogni tipo di nodo mostra i campi che gli servono.',
  azione:function(fine){
    var w=W();
    try{
      var id=creaNodo(w,'classifica','ai','🏷️','Classifica richiesta','Categoria e urgenza',200,230);
      collega(w,'trigger','out','classifica','in','');
      w.b_render();
      selezionaNodo(w,id);
    }catch(e){}
    setTimeout(fine,1300);
  },
  sel:'#propsBody', pos:'left', durata:8500
},
{
  capitolo:4, titolo:'Cosa contiene un nodo AI',
  testo:function(){
    var etichette=QQ('#propsBody .prop-label').map(function(e){return e.textContent.trim()}).filter(Boolean);
    var scelte=etichette.slice(0,7).join(', ');
    return 'Non una scatola nera: '+(scelte?('<em>'+scelte+'</em>'):'fornitore, modello, prompt, temperatura, formato di uscita')+
      '. <strong>Il fornitore dice con chi si parla, il modello quanto costa</strong>, la temperatura quanto è libero di variare, il formato se la risposta deve essere leggibile da un altro nodo.';
  },
  sel:'#propsBody', pos:'left', durata:11000
},
{
  capitolo:4, titolo:'Scrivo il prompt, lettera per lettera',
  testo:'Qui si scrive, in italiano, cosa deve fare il modello. È la parte che decide la qualità del risultato, e la scrive chi conosce il processo. Chiedo anche che <strong>la risposta arrivi in un formato fisso</strong> invece che in prosa: il blocco successivo deve poterla leggere come un dato, senza interpretarla.',
  azione:function(fine){
    var w=W();
    var campo=QQ('#propsBody textarea')[0];
    var testo='Classifica la richiesta ricevuta. Rispondi SOLO JSON: {"categoria": "amministrazione|tecnico|commerciale", "urgenza": "alta|media|bassa"}.';
    if(!campo){ fine(); return }
    // La narrazione va PRIMA della scrittura, non dopo. Il motore mostra il
    // testo quando l'azione ha finito: su un passo che scrive una riga intera
    // a macchina, significava vedere il prompt comparire sotto il testo del
    // passo PRECEDENTE, e leggere «Scrivo il prompt» a scrittura gia' finita.
    // Dichiarando subito la fine, il testo compare e il gesto avviene sotto gli
    // occhi di chi sta leggendo: e' il senso di un passo che si chiama «lettera
    // per lettera». La durata del passo copre la scrittura.
    fine();
    setTimeout(function(){
      scrivi(campo,testo,function(){
        try{
          var sel=QQ('#propsBody select').filter(function(s){return /outformat/.test(s.getAttribute('onchange')||'')})[0];
          if(sel){ sel.value='json'; scatena(sel,'change') }
        }catch(e){}
      });
    },500);
  },
  sel:'#propsBody', pos:'left', durata:11000
},
{
  capitolo:4, titolo:'E se non so scrivere un prompt?',
  testo:function(){
    var p=modelloCollegato();
    return 'Sotto ogni area di testo c\'è <strong>«Aiutami a scriverlo»</strong>: descrivo l\'obiettivo a parole e il modello AI genera o migliora il prompt sapendo in quale nodo sta operando. Il precedente si ripristina con un clic.'+
      (p?' Qui è collegato '+escapaTitolo(p)+': premendo «Scrivi da zero» il testo arriva nel campo.':' Senza un modello collegato non finge: dice dove collegarlo.');
  },
  pagina:'builder',
  azione:function(fine){
    var w=W();
    try{
      var ai=(w.B&&w.B.nodes||[]).filter(function(n){return n.type==='ai'})[0];
      if(ai)selezionaNodo(w,ai.id);
    }catch(e){}
    setTimeout(function(){
      var apri=Q('#propsBody .aiuto-testo-apri');
      if(apri)clicca(apri);
      setTimeout(function(){
        var r=Q('#propsBody .aiuto-testo-corpo textarea');
        if(r)scrivi(r,'classificare una richiesta in amministrazione, tecnico o commerciale, con urgenza',function(){ setTimeout(fine,600) });
        else fine();
      },900);
    },1000);
  },
  sel:'#propsBody', pos:'left', durata:11000
},
{
  capitolo:4, titolo:'Un nodo di controllo, essenziale per la Governance',
  testo:'Prima di far leggere il testo al modello, inserisco un <strong>mascheramento dei dati personali</strong>. È questo passaggio che rende lo strumento sicuro per l\'azienda: il modello elabora le informazioni, non i dati sensibili.',
  azione:function(fine){
    var w=W();
    try{
      var id=creaNodo(w,'maschera','gr','🎭','Mascheramento dati','Rimuove i dati personali',200,155);
      // Si inserisce FRA il trigger e il nodo AI: il collegamento diretto va
      // tolto, altrimenti resterebbero due strade e il mascheramento sarebbe
      // aggirabile — cioe' il controllo ci sarebbe ma non servirebbe a niente.
      w.B.edges=w.B.edges.filter(function(e){ return !(e.from===F.trigger&&e.to===F.classifica) });
      collega(w,'trigger','out','maschera','in','');
      collega(w,'maschera','out','classifica','in','');
      w.b_render();
      selezionaNodo(w,id);
    }catch(e){}
    setTimeout(fine,1300);
  },
  sel:'#canvasArea', pos:'left', durata:10000
},
{
  capitolo:4, titolo:'Chiudo con l\'output',
  testo:'Ogni ramo deve finire su un nodo di output, altrimenti l\'esecuzione <strong>non lascia traccia</strong> di cosa ha deciso. Quattro nodi, tre collegamenti: il flusso è completo.',
  azione:function(fine){
    var w=W();
    try{
      creaNodo(w,'esito','ou','📊','Esito','Registra la categoria',200,380);
      collega(w,'classifica','out','esito','in','');
      w.b_render();
      if(typeof w.fillRequiredDefaults==='function')w.fillRequiredDefaults(w.B.nodes);
      if(typeof w.bFitView==='function')w.bFitView();
    }catch(e){}
    setTimeout(fine,1200);
  },
  sel:'#canvasArea', pos:'left', durata:8500
},
{
  capitolo:4, titolo:'Annullare è sempre possibile',
  testo:'Ogni gesto sulla tela entra in una <strong>pila di annullamento</strong>: <em>Ctrl+Z</em> torna indietro, <em>Ctrl+Y</em> riavanti. E per muoversi sulla tela: <em>Ctrl</em> o <em>Shift</em> con il trascinamento, oppure il tasto centrale. Costruire senza paura di rompere è ciò che rende utilizzabile uno strumento del genere.',
  sel:'.canvas-controls', pos:'top', durata:9000
},
{
  capitolo:4, titolo:'E quando gli elementi sono tanti: il ciclo',
  testo:'Il caso concreto: <em>«analizza tutti i documenti della cartella, uno per uno»</em>. Aggiungo un nodo <strong>Loop</strong>: non ripete un numero fisso di volte, <strong>conta gli elementi che i nodi a monte hanno davvero prodotto</strong> e ripercorre i nodi a valle una volta per ciascuno.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    try{
      var id=creaNodo(w,'ciclo','cd','🔄','Loop','Per ogni documento',420,230);
      w.updConfig(id,'field','documenti');
      w.updConfig(id,'maxiter','25');
      w.b_render();
      selezionaNodo(w,id);
    }catch(e){}
    setTimeout(fine,1300);
  },
  sel:'#propsBody', pos:'left', durata:10000
},
{
  capitolo:4, titolo:'Con un tetto dichiarato',
  testo:'Il campo <em>Tetto di sicurezza</em> fissa un limite massimo di iterazioni, proteggendo l\'esecuzione da cicli anomali e garantendo stabilità. Se il limite viene superato, il registro <strong>lo segnala chiaramente</strong> invece di bloccarsi in silenzio.',
  pagina:'builder', sel:'#propsBody', pos:'left', durata:10000
},
// ── CAPITOLO 5 · Il modello, la chat, la pianificazione ────────
{
  capitolo:5, titolo:'Collegare un modello',
  testo:function(){
    var p=modelloCollegato();
    return 'Claude, OpenAI, Gemini, Mistral, oppure un <strong>modello che gira sul tuo computer</strong> (via endpoint compatibile). Si incolla la chiave e si preme <em>Testa</em>: la piattaforma esegue un test reale.'+
      (p ? (' In questa sessione è già collegato <strong>'+escapaTitolo(p)+'</strong>.')
         : ' <em>Per far girare la dimostrazione con un modello vero: metti in pausa qui, incolla la tua chiave nel pannello a sinistra, premi Testa e riprendi.</em>');
  },
  pagina:'builder',
  azione:function(fine){
    chiudiFinestre();
    setTimeout(fine,800);
  },
  sel:'.ai-panel, .builder-sidebar', pos:'right', durata:8500
},
{
  capitolo:5, titolo:'Provo il collegamento',
  testo:function(){
    var p=modelloCollegato();
    return p
      ? 'Collegamento <strong>riuscito</strong>: il fornitore attivo è <em>'+p+'</em>. Da qui in avanti i nodi AI chiamano il modello vero, e il registro lo dichiara.'
      : 'In questa sessione <strong>non c\'è nessuna chiave collegata</strong>, e la piattaforma non lo nasconde. I nodi AI possono girare lo stesso con la <strong>quota di prova</strong>, ma con risposte <em>simulate e dichiarate tali</em> in ogni riga del registro: si vede la struttura del flusso, non il contenuto. Chi vuole una risposta vera collega la sua chiave, e la quota non si tocca. <em>Con una chiave incollata qui, questo passaggio mostra il test che va a buon fine.</em>';
  },
  pagina:'builder', sel:'.ai-panel, .builder-sidebar', pos:'right', durata:10000
},
{
  capitolo:5, titolo:'La scelta del modello sta sul nodo',
  testo:'Non è un\'impostazione globale: <strong>ogni nodo AI sceglie il proprio</strong>. Su un flusso che classifica mille richieste al giorno il modello economico cambia il conto di fine mese; su una stesura di testo cambia il risultato. Con il fornitore su <em>Automatico</em> la tendina del modello resta bloccata: prima si sceglie con chi si parla, poi quale modello.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    try{
      if(!w.B.nodes.filter(function(n){return n.type==='ai'}).length) caricaFlusso(w,'Smistamento');
      setTimeout(function(){
        var ai=w.B.nodes.filter(function(n){return n.type==='ai'})[0];
        if(ai)selezionaNodo(w,ai.id);
        setTimeout(fine,700);
      },700);
    }catch(e){ fine() }
  },
  sel:'#propsBody', pos:'left', durata:9000
},
{
  capitolo:5, titolo:'Cambio fornitore, cambia l\'elenco dei modelli',
  testo:'Passo a Claude: la tendina sotto si aggiorna con i modelli di <em>quel</em> fornitore, e il modello scelto per il precedente viene azzerato, <strong>«GPT-4o mini» non esiste in casa Anthropic</strong>. L\'identificativo finisce davvero nel corpo della richiesta HTTP: non è un\'etichetta decorativa.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    try{
      var ai=w.B.nodes.filter(function(n){return n.type==='ai'})[0];
      if(ai)w.updConfig(ai.id,'model','claude');
    }catch(e){}
    setTimeout(fine,1200);
  },
  sel:'#propsBody', pos:'left', durata:9500
},
{
  capitolo:5, titolo:'La validazione, prima di eseguire',
  testo:function(){
    var e=window.__validazione;
    if(!e)return 'Controllo il flusso prima di lanciarlo.';
    return e.n===0
      ? '<strong>Nessun problema</strong>: struttura corretta, parametri compilati, modello collegato. Il flusso è eseguibile.'
      : 'La verifica segnala <strong>'+e.n+'</strong>: <em>'+e.primo+'</em>. La piattaforma <strong>si rifiuta di eseguire</strong> e di pubblicare, ma il flusso <strong>si salva e si esporta lo stesso</strong>: il lavoro a metà è comunque lavoro, e perderlo perché non è finito sarebbe il modo peggiore di segnalare un problema.';
  },
  pagina:'builder',
  azione:function(fine){
    var w=W();
    try{
      var err=w.validateWorkflow();
      window.__validazione={n:err.length, primo:err.length?String(err[0].msg||err[0]).substring(0,110):''};
    }catch(e){ window.__validazione={n:0,primo:''} }
    setTimeout(fine,1000);
  },
  sel:'#canvasArea', pos:'left', durata:10000
},

// ── Un flusso che non parte, e come si rimette in piedi ────────
// Il caso realistico non e' il flusso perfetto: e' quello importato da un
// collega, o arrivato da un esempio, che alla prima esecuzione si blocca.
// Mostrarlo e' piu' convincente di nasconderlo, a patto di mostrare anche
// quanto costa rimetterlo in piedi.
{
  capitolo:5, titolo:'E quando un flusso non parte?',
  testo:function(){
    var n=window.__rotto&&window.__rotto.n;
    return 'Il caso vero non è il flusso perfetto: è quello che arriva da un collega e alla prima esecuzione si ferma. Ne carico uno con dei problemi veri'+
      (n?(': la verifica ne trova <strong>'+n+'</strong>'):'')+
      ' — blocchi che non corrispondono a nessuna voce della palette e campi obbligatori vuoti. Senza quei nomi, i nodi <em>non hanno parametri</em>: un flusso così <strong>non parte affatto</strong>, e il motore lo dice prima di eseguire un solo nodo invece di chiudersi «completato» senza aver spedito niente a nessuno.';
  },
  pagina:'builder',
  azione:function(fine){
    var w=W();
    chiudiFinestre();
    try{
      w.resetCanvasForNewAgent();
      w.currentAgentName='Flusso importato';
      // Nomi di fantasia: e' esattamente come arriva un flusso scritto a mano
      // o esportato da un altro strumento.
      var a=w.b_addNode('tr','📥','Webhook CRM','Lead in arrivo',200,70);
      var b=w.b_addNode('ac','📧','Email alert','Avviso al commerciale',200,230);
      var c=w.b_addNode('ou','📊','Output','Esito',200,390);
      w.b_addEdge(a,'out',b,'in','');
      w.b_addEdge(b,'out',c,'in','');
      w.b_render();
      if(typeof w.bFitView==='function')w.bFitView();
      var err=w.validateWorkflow();
      window.__rotto={n:err.length};
      setTimeout(function(){ try{ w.checkWorkflow() }catch(e){} setTimeout(fine,900) },700);
      return;
    }catch(e){}
    setTimeout(fine,900);
  },
  sel:'#modalContent', pos:'left', durata:10500
},
{
  capitolo:5, titolo:'La piattaforma propone il ricambio',
  testo:'Non dice solo che c\'è un errore: propone <strong>il blocco giusto</strong> e lo sostituisce, poi riempie i campi obbligatori. <strong>Da sei problemi a zero in due gesti</strong>: la differenza fra uno strumento che segnala e uno che aiuta.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    try{
      if(typeof w.bApplicaTuttiIRicambi==='function')w.bApplicaTuttiIRicambi();
      setTimeout(function(){
        try{ if(typeof w.bCompilaObbligatori==='function')w.bCompilaObbligatori() }catch(e){}
        setTimeout(function(){
          try{
            window.__riparato=w.validateWorkflow().length;
            w.closeModal();
            if(typeof w.bFitView==='function')w.bFitView();
          }catch(e){}
          setTimeout(fine,700);
        },1100);
      },1100);
      return;
    }catch(e){}
    setTimeout(fine,900);
  },
  sel:'#canvasArea', pos:'left', durata:11000
},

// ── Costruzione conversazionale ────────────────────────────────
{
  capitolo:5, titolo:'Costruire parlando, invece che trascinando',
  testo:'Sopra la tela c\'è il <strong>Builder conversazionale</strong>: si descrive l\'agente a parole e lui lo compone. I suggerimenti qui sotto sono <em>letti dal flusso che hai sulla tela</em>: cambiano man mano che lo costruisci, e propongono il passo che manca.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    try{ w.resetCanvasForNewAgent(); w.b_render(); F={} }catch(e){}
    setTimeout(fine,1000);
  },
  sel:'#chatBuilderInput', pos:'bottom', durata:9000
},
{
  capitolo:5, titolo:'Descrivo l\'agente a parole',
  testo:'Scrivo una richiesta in italiano, come la direi a un collega: <em>«quando arriva una fattura, estrai importo e scadenza e avvisami se supera i mille euro»</em>. Nessuna sintassi da imparare.',
  pagina:'builder',
  azione:function(fine){
    var campo=Q('#chatBuilderInput');
    if(!campo){ fine(); return }
    scrivi(campo,'Quando arriva una fattura, estrai importo e scadenza e avvisami se supera i mille euro',function(){
      setTimeout(fine,900);
    });
  },
  sel:'#chatBuilderInput', pos:'bottom', durata:11000
},
{
  capitolo:5, titolo:'Genera, ma prima mostra un\'anteprima',
  testo:function(){
    var p=modelloCollegato();
    if(!p)return 'Premo <em>Genera</em>. Senza chiave collegata la chat <strong>lo dichiara e non genera nulla</strong>, invece di restare muta o inventare un flusso: la tela resta utilizzabile trascinando i blocchi. <em>Con una chiave, qui compare l\'anteprima dei nodi proposti.</em>';
    return 'Il modello non scrive direttamente sulla tela: propone un\'<strong>anteprima</strong> con l\'elenco dei nodi, e resta in attesa. È la differenza fra uno strumento che ti assiste e uno che decide al posto tuo.';
  },
  pagina:'builder',
  azione:function(fine){
    var b=perTesto('button','Genera');
    if(b)clicca(b);
    setTimeout(fine,4000);
  },
  sel:function(){ return Q('#composePreview') ? '#composePreview' : '#canvasArea' },
  pos:'bottom', durata:11000
},
{
  capitolo:5, titolo:'Applica, oppure annulla',
  testo:function(){
    var box=Q('#composePreview');
    var visibile = box && box.textContent && box.textContent.trim().length>10;
    return visibile
      ? 'Due pulsanti: <strong>Applica</strong> scrive i nodi sulla tela, <strong>Annulla</strong> butta via la proposta. E anche dopo aver applicato, <em>Ctrl+Z</em> torna indietro: nulla di quello che la chat propone è irreversibile.'
      : 'Quando l\'anteprima compare, due pulsanti decidono: <strong>Applica</strong> scrive i nodi sulla tela, <strong>Annulla</strong> butta via la proposta. E anche dopo aver applicato, <em>Ctrl+Z</em> torna indietro: <strong>nulla di quello che la chat propone è irreversibile</strong>.';
  },
  pagina:'builder',
  azione:function(fine){
    var b=perTesto('#composePreview button','Applica');
    if(b)clicca(b);
    setTimeout(fine,2600);
  },
  sel:function(){ return Q('#composePreview') ? '#composePreview' : '#canvasArea' },
  pos:'bottom', durata:11000
},
{
  capitolo:5, titolo:'Gli stessi nodi della palette',
  testo:function(){
    var w=W(), quanti=0, nomi=[];
    try{
      (w.B&&w.B.nodes||[]).forEach(function(n){
        var v=(typeof w.ccVoceDiPalette==='function')?w.ccVoceDiPalette(n.name,n.type):null;
        if(v && v.name===n.name && v.icon===n.icon){ quanti++; if(nomi.length<3)nomi.push(n.name) }
      });
    }catch(e){}
    return 'Un nodo scritto dal modello e uno trascinato dalla palette devono essere <strong>lo stesso nodo</strong>: '+
      'stesso nome, stessa icona, stessi campi da compilare. '+
      (quanti?('Qui '+quanti+' dei nodi appena creati corrispondono esattamente alla palette'+
               (nomi.length?(', '+nomi.join(', ')):'')+'.'):'')+
      ' Non è un dettaglio estetico: la chat genera blocchi reali con i campi di governo attesi (es. approvatori, scadenze). Un nodo simulato e non standard aggirerebbe i controlli di sicurezza.';
  },
  pagina:'builder',
  azione:function(fine){
    var w=W();
    // Si seleziona un controllo fra quelli appena generati: il pannello mostra
    // i suoi campi, che è la prova visibile di cui parla il testo.
    try{
      var g=(w.B&&w.B.nodes||[]).filter(function(n){return n.type==='gr'})[0];
      if(g)selezionaNodo(w,g.id);
    }catch(e){}
    setTimeout(fine,1400);
  },
  sel:'#propsBody', pos:'left', durata:12000
},
{
  capitolo:5, titolo:'E poi si chiede una modifica',
  testo:'La chat non serve solo a partire da zero: <strong>a tela piena capisce cosa c\'è già</strong>. Chiedo di aggiungere la gestione degli errori, e i suggerimenti qui sotto cambiano di conseguenza, sono completamenti letti dal grafo, non esempi fissi.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    try{ if(!w.B.nodes.length) caricaFlusso(w,'fattura') }catch(e){}
    var campo=Q('#chatBuilderInput');
    if(!campo){ setTimeout(fine,900); return }
    scrivi(campo,'Aggiungi la gestione degli errori sul nodo di invio',function(){
      setTimeout(fine,900);
    });
  },
  sel:'.chat-sugg, #chatSuggestions, #chatBuilderInput', pos:'bottom', durata:11000
},

// ── Pianificazione ─────────────────────────────────────────────
{
  capitolo:5, titolo:'Un agente non deve essere lanciato a mano',
  testo:'Finora ho premuto Esegui io. Ma un agente utile parte <strong>da solo</strong>: a orario, a intervallo, o quando arriva un evento esterno. Apro la pianificazione.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    try{
      if(!w.B.nodes.length) caricaFlusso(w,'fattura');
      // Un flusso nuovo non ha piu' una riga nel database finche' non lo si
      // salva, e la pianificazione ne ha bisogno: si salva prima, rispondendo al
      // posto della finestra del nome (che in una dimostrazione bloccherebbe
      // tutto e non si vedrebbe nel video).
      if(!w.B.dbAgentId){
        var p=w.prompt, c=w.confirm, nome=w.currentAgentName||'Il mio agente';
        try{ w.prompt=function(){ return nome }; w.confirm=function(){ return false }; w.saveAgent() }catch(e){}
        try{ w.prompt=p; w.confirm=c }catch(e){}
      }
      setTimeout(function(){
        try{ if(typeof w.openDeployModal==='function')w.openDeployModal() }catch(e){}
        setTimeout(fine,1500);
      },600);
    }catch(e){ fine() }
  },
  sel:'#modalContent', pos:'left', durata:9500
},
{
  capitolo:5, titolo:'Le modalità di avvio',
  testo:function(){
    var n=QQ('#modalContent select option').length;
    return 'Manuale, a intervallo, a orario fisso, su evento esterno via webhook'+(n?'':'')+
      '. La modalità scelta <strong>compare sulla scheda dell\'agente</strong> e nel Log Esecuzioni, che separa le esecuzioni manuali da quelle pianificate: quando qualcosa va storto alle tre di notte, la prima domanda è <em>«è partito da solo o l\'ha lanciato qualcuno?»</em>';
  },
  pagina:'builder', sel:'#modalContent', pos:'left', durata:11000
},
{
  capitolo:5, titolo:'Allegare un documento vero alla mail',
  testo:'Il nodo email non manda solo testo. <strong>«Allega i file generati dal flusso»</strong> spedisce ciò che l\'esecuzione ha appena prodotto, un rapporto, un CSV, un PDF, e se a monte non c\'è ancora niente che li produca, il pannello <strong>non dà un errore</strong>: propone i formati e inserisce il blocco che li genera, al posto giusto. Accanto ci sono gli <em>allegati fissi</em>: un listino, un modulo, delle condizioni contrattuali presi dal computer o dalla Knowledge Base, che partono a ogni invio.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    try{
      var mail=(w.B&&w.B.nodes||[]).filter(function(n){return n.name==='Invia email'})[0];
      if(mail)selezionaNodo(w,mail.id);
    }catch(e){}
    setTimeout(fine,1400);
  },
  sel:'#propsBody', pos:'left', durata:12000
},
{
  capitolo:5, titolo:'Chiudo e passo a eseguire',
  testo:'La pianificazione resta salvata sull\'agente. Adesso lo faccio partire e guardiamo <strong>cosa succede davvero</strong> mentre gira.',
  pagina:'builder',
  azione:function(fine){
    chiudiFinestre();
    setTimeout(fine,900);
  },
  sel:'#canvasArea', pos:'left', durata:8000
},

// ── CAPITOLO 6 · Eseguire e capire ─────────────────────────────
{
  capitolo:6, titolo:'Un flusso completo, già pronto',
  testo:'Carico uno dei flussi di riferimento: legge un <strong>file vero</strong>, ne estrae fornitore, imponibile e scadenza con output vincolato, confronta e decide. Lo eseguo così com\'è.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    chiudiGiroBuilder(); chiudiFinestre();
    // Si verifica che il flusso sia arrivato davvero sulla tela, e in caso si
    // riprova una volta: il passo precedente puo' aver azzerato il canvas un
    // istante dopo, e il capitolo si aprirebbe parlando di un flusso che non
    // c'e'. Un secondo tentativo costa mezzo secondo e toglie il caso.
    setTimeout(function(){
      caricaFlusso(w,'fattura');
      setTimeout(function(){
        if(!w.B.nodes.length)caricaFlusso(w,'fattura');
        apriRegistro(210);
        setTimeout(fine,900);
      },600);
    },500);
  },
  sel:'#canvasArea', pos:'left', durata:8500
},
{
  capitolo:6, titolo:'Eseguo',
  testo:'Premo <em>Esegui</em>. Ogni nodo si illumina mentre lavora, e sotto il registro scrive cosa sta succedendo <strong>passo per passo</strong>, non solo alla fine.',
  azione:function(fine){
    apriRegistro(240);
    var b=Q('#btnRun');
    if(b)clicca(b);
    setTimeout(fine,5000);
  },
  sel:'#canvasArea', pos:'left', durata:9000
},
{
  capitolo:6, titolo:'Il registro, riga per riga',
  testo:function(){
    var n=QQ('#execLogBody > *').length;
    return 'Non un «fatto» finale: '+(n?('<strong>'+n+' voci</strong>, '):'')+
      'ognuna con il proprio esito. Quali nodi hanno lavorato, quali sono stati <em>saltati</em> perché il ramo non era attivo, quanto è durato ciascuno, e dove un controllo è intervenuto.';
  },
  azione:function(fine){
    chiudiFinestre();
    apriRegistro(300);
    // Il registro scorre mentre chi guarda legge: un pannello fermo pieno di
    // righe, in un video, non si distingue da un'immagine.
    setTimeout(function(){ scorriRegistro(5000,fine) },700);
  },
  sel:'#execLog', pos:'top', durata:11000
},
{
  capitolo:6, titolo:'E si può fermare a metà',
  testo:'Accanto a Esegui c\'è <strong>Interrompi</strong>: ferma l\'esecuzione al nodo corrente, e il registro la conserva con esito <em>«interrotta»</em>. Su un agente che scrive su sistemi aziendali veri, poterlo fermare a metà conta quanto poterlo avviare.',
  pagina:'builder',
  sel:'#btnStop', pos:'top', durata:10000
},
{
  capitolo:6, titolo:'Perché questo risultato',
  testo:'Questo pulsante risponde alla domanda che blocca più progetti di AI in azienda: <em>«va bene, ma come c\'è arrivato?»</em>. Ricostruisce <strong>quali informazioni ha usato, quali decisioni ha preso e quali controlli sono intervenuti</strong>. Niente scatola nera: ogni passaggio resta verificabile.',
  azione:function(fine){
    var b=perTesto('#execLogBody a','Perché') || perTesto('#execLogBody span','Perché');
    if(b)clicca(b);
    setTimeout(fine,2000);
  },
  sel:'#modalContent', pos:'left', durata:10000
},
{
  capitolo:6, titolo:'Il flusso che risponde con i documenti aziendali',
  testo:'Il caso più richiesto: un assistente che risponde <strong>usando la Knowledge Base che abbiamo visto prima</strong>, non la conoscenza generale del modello. Chiudo la finestra e carico il flusso.',
  azione:function(fine){
    var w=W();
    chiudiFinestre();
    setTimeout(function(){
      caricaFlusso(w,'conoscenza');
      apriRegistro(210);
      setTimeout(fine,1100);
    },700);
  },
  sel:'#canvasArea', pos:'left', durata:9000
},
{
  capitolo:6, titolo:'Il recupero si verifica, non si assume',
  testo:'Il nodo di recupero dice <strong>quali porzioni di quali documenti</strong> ha trovato e con quanta somiglianza. Se non trova nulla lo dichiara, e la <em>verifica di fondatezza</em> confronta la risposta con le fonti: è così che si distingue una risposta fondata da una inventata.',
  azione:function(fine){
    apriRegistro(280);
    var b=Q('#btnRun');
    if(b)clicca(b);
    setTimeout(function(){ scorriRegistro(4500,fine) },5000);
  },
  sel:'#execLog', pos:'top', durata:11000
},
{
  capitolo:6, titolo:'Lo storico delle esecuzioni',
  testo:function(){
    var n=quanti('SELECT COUNT(*) c FROM exec_log');
    return 'Ogni esecuzione finisce qui'+(n?(', e ora ne conta <strong>'+n+'</strong>'):'')+
      ': manuali e pianificate separate, con esito, durata e dettaglio dei nodi. È l\'audit trail che serve quando qualcuno chiede <em>«cos\'è successo il 3 settembre?»</em>';
  },
  azione:function(fine){
    chiudiFinestre();
    setTimeout(fine,800);
  },
  pagina:'execlog', sel:'.page-pad', pos:'bottom', durata:9000
},

// ── CAPITOLO 7 · Pubblicazione e revisione ─────────────────────
// Questo capitolo si adatta a cio' che la piattaforma consente davvero.
// `openPublishModal()` RIFIUTA di aprirsi se la validazione ha errori, e senza
// un modello collegato l'errore c'e' sempre: sarebbe scorretto fingere una
// pubblicazione che l'applicazione non permetterebbe. Quindi:
//   · con un modello collegato, si pubblica il flusso appena costruito;
//   · senza, si mostra il rifiuto — che e' un punto di governo, non un
//     incidente — e il ciclo di revisione prosegue su una pubblicazione reale
//     gia' presente, con il suo commento del revisore.
{
  capitolo:7, titolo:'Propongo il mio agente al Marketplace',
  testo:'Pubblicare non è solo premere un tasto: la piattaforma esegue <strong>controlli automatici di conformità</strong> prima di instradare l\'agente alla revisione umana.',
  pagina:'builder',
  azione:function(fine){
    var w=W();
    chiudiGiroBuilder();
    try{
      if(!w.B.nodes.length) caricaFlusso(w,'Screening CV');
      setTimeout(function(){
        try{ w.openPublishModal() }catch(e){}
        setTimeout(function(){
          // Se il modulo non si e' aperto, la validazione ha bloccato: si
          // registra, e i passi successivi raccontano quello che e' successo
          // davvero invece di quello che era previsto.
          window.__pubAperta = !!Q('#pubSubmitBtn');
          fine();
        },1200);
      },600);
    }catch(e){ fine() }
  },
  sel:'#modalContent', pos:'left', durata:8500
},
{
  capitolo:7, titolo:'I controlli di pubblicazione',
  testo:function(){
    return window.__pubAperta
      ? 'Presenza di un output, gestione degli errori, controlli sui dati personali, parametri compilati, almeno un\'esecuzione riuscita. <strong>Sono regole vincolanti</strong>: chi non le supera non entra in catalogo.'
      : 'Il modulo <strong>non si è nemmeno aperto</strong>: la validazione ha bloccato prima. Senza chiave né quota residua due nodi non possono funzionare, e la piattaforma <em>non pubblica un flusso che non è in grado di eseguire</em>. Con la quota di prova il modulo si apre, ma i controlli segnalano che il collaudo è avvenuto solo con risposte simulate.';
  },
  sel:'#modalContent', pos:'left', durata:9500
},
{
  capitolo:7, titolo:'Scelgo l\'ambito e invio',
  testo:'Decido chi potrà vederlo: solo il mio reparto, tutta l\'organizzazione, o il catalogo pubblico. <strong>L\'ambito decide anche chi approva</strong> e quali controlli diventano bloccanti. Poi invio: da questo momento l\'agente è <em>in verifica</em>, non pubblicato.',
  azione:function(fine){
    var w=W();
    if(window.__pubAperta){
      try{
        var n=Q('#pubName'), d=Q('#pubDesc');
        if(n)n.value='Screening CV';
        if(d)d.value='Legge i curriculum in arrivo, ne estrae le competenze mascherando i dati personali, assegna un punteggio motivato e risponde al candidato.';
        var b=Q('#pubSubmitBtn');
        if(b)clicca(b);
      }catch(e){}
    }
    setTimeout(function(){ try{ W().closeModal() }catch(e){} fine() },2400);
  },
  // Compila e invia il modulo aperto dal passo precedente: la finestra deve
  // restare in piedi finché non è questo passo a chiuderla.
  tieniAperto:true, sel:null, durata:8000
},
{
  capitolo:7, titolo:'Ora cambio cappello: sono il revisore',
  testo:'La coda di revisione mostra cosa aspetta una decisione. Il revisore vede <strong>la struttura del flusso, gli esiti delle esecuzioni e i controlli attivi</strong>, e può rieseguire la non regressione prima di decidere.',
  pagina:'marketplace',
  azione:function(fine){
    var w=W();
    try{ if(typeof w.openReviewQueue==='function')w.openReviewQueue() }catch(e){}
    setTimeout(fine,1500);
  },
  sel:'#modalContent', pos:'left', durata:9000
},
{
  capitolo:7, titolo:'Chiedo una modifica',
  testo:'Non approvo: scrivo <em>cosa</em> va cambiato. La richiesta resta allegata alla pubblicazione, con nome del revisore e data, e torna all\'autore. <strong>Rispondo io al posto suo</strong> per non fermare la dimostrazione.',
  azione:function(fine){
    var w=W();
    var originale=w.prompt;
    // La revisione chiede il motivo con un `prompt()`, che bloccherebbe la
    // dimostrazione: si fornisce la risposta come se fosse stata digitata, e
    // subito dopo la funzione originale torna al suo posto.
    try{
      w.prompt=function(){ return 'Aggiungere la gestione degli errori sul nodo di invio: se la mail non parte, il candidato non deve restare senza risposta.' };
      var id=bersaglioRevisione(w);
      if(id&&typeof w.reviewPublishedAgent==='function')w.reviewPublishedAgent(id,'bozza');
    }catch(e){}
    try{ w.prompt=originale }catch(e){}
    setTimeout(function(){ try{ W().closeModal() }catch(e){} fine() },2000);
  },
  // Decide dentro la coda di revisione aperta dal passo precedente.
  tieniAperto:true, sel:null, durata:9000
},
{
  capitolo:7, titolo:'L\'autore vede la richiesta',
  testo:'Torno dalla parte di chi ha costruito. La scheda dice <strong>«modifica richiesta»</strong> e riporta per esteso il commento del revisore, con il suo nome e da quanto tempo. Nessuna notifica generica: la richiesta è lì, sulla scheda dell\'agente.',
  pagina:'myagents', sel:'.page-pad', pos:'bottom', durata:9000
},
{
  capitolo:7, titolo:'Applico la correzione e ripresento',
  testo:'«Applica la correzione» porta la richiesta nel Builder sulla versione <em>vista dal revisore</em>, non sull\'agente locale che nel frattempo può essere andato avanti. Poi ripresento: la versione sale e torna in coda. <strong>Chi corregge non si approva da solo</strong>.',
  azione:function(fine){
    var w=W();
    try{
      var id=bersaglioRevisione(w);
      if(id&&typeof w.pubRipresenta==='function'){
        var c=w.confirm; w.confirm=function(){ return true };
        w.pubRipresenta(id);
        w.confirm=c;
      }
    }catch(e){}
    setTimeout(fine,2000);
  },
  sel:'.page-pad', pos:'bottom', durata:9000
},
{
  capitolo:7, titolo:'Il revisore approva',
  testo:'Ultimo giro: la pubblicazione torna in coda, il revisore la esamina e la approva. Da questo momento è <strong>nel Marketplace</strong> secondo l\'ambito richiesto, e chi l\'aveva già installata riceve la notifica della nuova versione.',
  pagina:'marketplace',
  azione:function(fine){
    var w=W();
    try{
      var id=bersaglioRevisione(w);
      if(id&&typeof w.reviewPublishedAgent==='function')w.reviewPublishedAgent(id,'pubblicato');
    }catch(e){}
    setTimeout(function(){ try{ W().closeModal() }catch(e){} fine() },2200);
  },
  sel:null, durata:9000
},

// ── CAPITOLO 8 · Learning Hub, Sfide, Community ────────────────
{
  capitolo:8, titolo:'Learning Hub',
  testo:function(){ return (W().PATHS||[]).length+' percorsi, '+quanteLezioni()+' lezioni, organizzati su <strong>quattro livelli</strong>: da <em>AI Aspirant</em> ad <em>AI Ambassador</em>. Ogni scheda dichiara il proprio livello, e non si impara su un corso a parte: ogni lezione ha un pulsante che apre il punto dell\'applicazione di cui parla.' },
  pagina:'learning', sel:'.page-pad', pos:'bottom', durata:9000
},
{
  capitolo:8, titolo:'Il livello si conquista completando i percorsi',
  testo:function(){
    var r=(typeof W().livelloRaggiunto==='function')?W().livelloRaggiunto():0;
    return 'Un livello si ottiene completando <strong>tutti</strong> i percorsi fino a quel punto, non una percentuale complessiva: finire solo i percorsi facili non porta in cima. '+
      (r?('Qui il livello raggiunto è <em>'+W().livelloInfo(r).nome+'</em>, e l\'attestato si scarica.')
        :'Quando un livello è raggiunto compare il pulsante per <strong>scaricare l\'attestato</strong>, con nome, data e codice.');
  },
  pagina:'learning',
  azione:function(fine){
    var w=W();
    try{
      var tab=QQ('#page-learning .tab')[1];
      if(tab && typeof w.setLearnTab==='function')w.setLearnTab('certs',tab);
    }catch(e){}
    setTimeout(fine,1400);
  },
  sel:'#learn-tab-content', pos:'left', durata:10000
},
{
  capitolo:8, titolo:'Apro una lezione',
  testo:'Testo, esempi, e in fondo un <em>quiz</em> che sblocca esperienza. Il pulsante <strong>«Provalo adesso»</strong> porta esattamente dove serve: non spiega dove trovare una cosa, ci porta.',
  pagina:'learning',
  azione:function(fine){
    var w=W();
    try{
      var tab=QQ('#page-learning .tab')[0];
      if(tab && typeof w.setLearnTab==='function')w.setLearnTab('paths',tab);
      setTimeout(function(){ try{ w.openLesson(0,0) }catch(e){} setTimeout(fine,900) },700);
    }catch(e){ fine() }
    setTimeout(fine,1500);
  },
  sel:'#learn-detail', pos:'left', durata:9000
},
{
  capitolo:8, titolo:'Rispondo al quiz',
  testo:function(){
    var w=W(), xp='';
    try{ if(window.__xpPrima!=null) xp=' L\'esperienza è passata da <strong>'+window.__xpPrima+'</strong> a <strong>'+w.profileStats().xp+'</strong>.' }catch(e){}
    return 'La risposta giusta dà <strong>25 punti esperienza</strong>, una volta sola: il quiz già superato non si ripaga rifacendolo.'+xp+
      ' Quella sbagliata non si limita a dire «no»: <em>spiega il perché</em>, trasformando l\'errore in un\'opportunità di apprendimento.';
  },
  pagina:'learning',
  azione:function(fine){
    var w=W();
    try{ window.__xpPrima=w.profileStats().xp }catch(e){ window.__xpPrima=null }
    // La risposta giusta si ricava dal contenuto della lezione aperta, non da
    // un indice scritto nel copione: se un domani il quiz cambia, la
    // dimostrazione continua a rispondere bene invece di sbagliare in scena.
    var opzioni=QQ('#learn-detail .quiz-option');
    if(!opzioni.length){ setTimeout(fine,600); return }
    var m=/checkQuiz\('([^']+)'/.exec(opzioni[0].getAttribute('onclick')||'');
    var chiave=m?m[1]:null, giusta=0;
    try{ var q=w.lezioneQuiz(w.LESSON_CONTENT[chiave].quiz); if(q)giusta=q.correct }catch(e){}
    clicca(opzioni[giusta]||opzioni[0]);
    setTimeout(function(){
      var b=chiave?Q('#quizSubmit-'+chiave):null;
      if(b)clicca(b);
      setTimeout(fine,1200);
    },1100);
  },
  sel:'#learn-detail', pos:'left', durata:9500
},
{
  capitolo:8, titolo:'«Provalo adesso»: dalla lezione al prodotto',
  testo:'Ogni lezione finisce con un <strong>esercizio praticabile</strong> e il pulsante che apre il punto esatto dell\'applicazione di cui ha appena parlato. È la differenza fra un corso <em>sulla</em> piattaforma e un corso <em>dentro</em> la piattaforma: non c\'è un ambiente di esercitazione separato, si impara sugli stessi schermi in cui poi si lavora.',
  pagina:'learning',
  azione:function(fine){
    var el=perTesto('#learn-detail .card','Provalo adesso');
    if(el)el.scrollIntoView({block:'center'});
    setTimeout(fine,900);
  },
  sel:'#learn-detail', pos:'left', durata:9000
},
{
  capitolo:8, titolo:'Le certificazioni, e perché non si regalano',
  testo:function(){
    var w=W(), r=0;
    try{ r=(typeof w.livelloRaggiunto==='function')?w.livelloRaggiunto():0 }catch(e){}
    return 'Quattro livelli, da <em>AI Aspirant</em> ad <em>AI Ambassador</em>. Un livello si ottiene completando <strong>tutti</strong> i percorsi fino a quel punto, non una percentuale complessiva: finire solo i facili non porta avanti. '+
      (r?('Qui il livello raggiunto è il <strong>'+r+'°</strong>, e l\'attestato si scarica — con nome, data e un codice di verifica.')
        :'Raggiunto un livello compare il pulsante per scaricare l\'attestato, con nome, data e un codice di verifica.');
  },
  pagina:'learning',
  azione:function(fine){
    var w=W();
    try{
      var tab=QQ('#page-learning .tab').filter(function(t){return /Certificaz/i.test(t.textContent)})[0];
      if(tab&&typeof w.setLearnTab==='function')w.setLearnTab('certs',tab);
    }catch(e){}
    setTimeout(fine,1200);
  },
  sel:'#learn-tab-content', pos:'left', durata:10000
},
{
  capitolo:8, titolo:'La sandbox: sbagliare senza conseguenze',
  testo:function(){
    var w=W(), n=0; try{ n=w.PALETTE.length }catch(e){}
    return 'Dal Learning Hub si accede alla <strong>sandbox didattica</strong>: un Builder isolato e semplificato'+(n?' a '+n+' blocchi':'')+', con dati simulati. <strong>Nessun salvataggio o impatto sulle esecuzioni reali</strong>: i tre pulsanti sono spenti, e un\'esecuzione fatta qui non entra nello storico. Serve solo per esercitarsi in totale sicurezza. Esco, e ritrovo il mio agente com\'era.';
  },
  pagina:'learning',
  azione:function(fine){
    var w=W();
    try{ if(typeof w.renderLearning==='function')w.renderLearning() }catch(e){}
    setTimeout(function(){
      var b=perTesto('#page-learning .tb-sandbox','sandbox');
      if(b)clicca(b); else { try{ w.openSandbox() }catch(e){} }
      setTimeout(fine,1500);
    },800);
  },
  tieniSandbox:true, sel:'#canvasArea', pos:'left', durata:11000
},
{
  capitolo:8, titolo:'Sfide ed eventi',
  testo:function(){
    var pos='';
    try{
      var c=W().classificaXP(), io=W().utenteCorrente();
      var i=c.map(function(r){return r.nome}).indexOf(io);
      if(i>=0)pos=' In cima c\'è la <strong>classifica generale per esperienza</strong>: qui sei '+(i+1)+'° su '+c.length+', ed è la somma vera dei punti guadagnati, non un elenco fisso.';
    }catch(e){}
    return (W().SFIDE||[]).length+' sfide a tema, ognuna con regolamento, criteri, premi e classifica. Non sono una bacheca: ci si <strong>iscrive, si candida un proprio agente, si vota e si commenta</strong> il lavoro degli altri.'+pos;
  },
  pagina:'challenges',
  azione:function(fine){
    var w=W();
    try{ if(typeof w.renderChallenges==='function')w.renderChallenges() }catch(e){}
    setTimeout(fine,900);
  },
  sel:'#challenges-content', pos:'bottom', durata:8000
},
{
  capitolo:8, titolo:'Tre formati, ciascuno con le sue regole',
  testo:function(){
    var s=W().SFIDE||[];
    var n=function(t){ return s.filter(function(x){return x.tipo===t}).length };
    var conMetrica=s.filter(function(x){return !!x.metrica}).length;
    return 'Un <strong>hackathon</strong> a cadenza quadrimestrale, con binari tematici e mentori di reparto. '+
      n('sfida')+' <strong>sfide</strong> a classifica, '+
      (conMetrica===n('sfida')?'tutte misurate':('di cui '+conMetrica+' misurate'))+' sulle esecuzioni reali degli agenti candidati. '+
      'E '+n('evento')+' <strong>eventi</strong>: il <em>Workshop</em> in presenza, l\'<em>AMA</em> con le domande raccolte prima, il <em>Demo Day</em> al termine di ogni hackathon. '+
      'Ogni formato ha uno scopo chiaro: dove è prevista una metrica si compete con le prestazioni reali degli agenti, negli altri eventi ci si confronta sui temi e le best practice.';
  },
  pagina:'challenges',
  azione:function(fine){
    // Si porta in vista la scheda dell'AMA: e' quella che rende evidente che
    // non sono tutte gare — un evento non ha classifica, ha una prenotazione.
    var el=perTesto('#challenges-content .card','AMA');
    if(el)el.scrollIntoView({block:'center'});
    setTimeout(fine,900);
  },
  sel:'#challenges-content', pos:'bottom', durata:9000
},
{
  capitolo:8, titolo:'Entro in una sfida',
  testo:'Ogni sfida è una <em>pagina</em>, non una finestrella: regolamento, scadenze, domande e risposte, candidature con il voto della community. Il voto e il punteggio calcolato sono <strong>separati</strong>: uno esprime il gradimento, l\'altro le performance oggettive misurate dal motore.',
  azione:function(fine){
    var w=W();
    try{ if(w.SFIDE&&w.SFIDE[0])w.sfApriPagina(w.SFIDE[0].id) }catch(e){}
    setTimeout(fine,1400);
  },
  sel:'#challenges-detail', pos:'left', durata:9500
},
{
  capitolo:8, titolo:'Le fasi, con date che non invecchiano',
  testo:function(){
    var w=W(), s=(w.SFIDE||[])[0]||{}, n=0, oggi='';
    try{
      var c=w.SFIDA_CONTENUTI[s.id];
      if(c&&c.fasi){
        n=c.fasi.length;
        var f=c.fasi.filter(function(x){return w.sfStatoFase(s,x.q)==='oggi'})[0];
        if(f)oggi=' In questo momento siamo a «<strong>'+f.t+'</strong>».';
      }
    }catch(e){}
    return 'Un hackathon si svolge in fasi'+(n?(': qui sono '+n+', da «iscrizioni aperte» alla premiazione'):'')+
      '. Le date sono <strong>dinamiche e relative al giorno corrente</strong>, per garantire che la timeline della dimostrazione sia sempre coerente e attuale.'+oggi;
  },
  azione:function(fine){
    var w=W();
    try{
      var d=w.document.querySelector('#challenges-detail');
      if((!d||!d.innerText.trim())&&w.SFIDE&&w.SFIDE[0])w.sfApriPagina(w.SFIDE[0].id);
    }catch(e){}
    setTimeout(function(){
      try{ w.scrollTo(0,0) }catch(e){}
      fine();
    },1000);
  },
  pagina:'challenges', sel:'#challenges-detail', pos:'left', durata:9000
},
{
  capitolo:8, titolo:'Come si vince, dichiarato prima',
  testo:function(){
    var s=(W().SFIDE||[])[0]||{};
    var b=(s.binari||[]).length;
    return 'I <strong>criteri con i loro pesi</strong> sono visibili prima di iscriversi, non comunicati dopo: chi partecipa sa su cosa verra\u0300 giudicato.'+
      (b?(' Sopra ci sono i <strong>'+b+' binari tematici</strong> che indirizzano l\'innovazione verso obiettivi aziendali, e i <em>mentori</em> disponibili durante l\'evento.'):'')+
      ' I premi seguono tre categorie: sviluppo personale, dispositivi, tempo libero.';
  },
  azione:function(fine){
    var w=W();
    // Se si arriva qui saltando dall'indice, la pagina della sfida non e'
    // aperta: la si apre, invece di illuminare un contenitore vuoto.
    try{
      var d=w.document.querySelector('#challenges-detail');
      if((!d || !d.innerText.trim()) && w.SFIDE && w.SFIDE[0]) w.sfApriPagina(w.SFIDE[0].id);
    }catch(e){}
    setTimeout(function(){
      try{ var el=w.document.querySelector('#challenges-detail'); if(el)el.scrollTop=Math.round(el.scrollHeight*0.35) }catch(e){}
      fine();
    },1200);
  },
  pagina:'challenges', sel:'#challenges-detail', pos:'left', durata:9000
},
{
  capitolo:8, titolo:'Mi iscrivo, e il posto viene contato',
  testo:function(){
    var w=W(), s=(w.SFIDE||[])[0]||{}, q='';
    try{ q=' Ora i posti occupati sono <strong>'+w.sfConteggio(s)+' su '+s.posti+'</strong>, e la barra della partecipazione si è mossa di conseguenza.' }catch(e){}
    return 'Un clic, e l\'iscrizione è <strong>registrata davvero</strong>: compare il contrassegno «sei iscritto», arrivano 50 punti esperienza e il conteggio sale.'+q+
      ' L\'azione è sempre reversibile, per riflettere un interesse genuino.';
  },
  azione:function(fine){
    var w=W();
    try{
      var d=w.document.querySelector('#challenges-detail');
      if((!d||!d.innerText.trim())&&w.SFIDE&&w.SFIDE[0])w.sfApriPagina(w.SFIDE[0].id);
    }catch(e){}
    setTimeout(function(){
      // Se il presentatore ha gia' fatto girare la demo, l'iscrizione puo'
      // esserci gia': in quel caso il pulsante non c'e' e non si finge un clic.
      var b=perTesto('#challenges-detail .tb-btn','Iscriviti');
      if(b)clicca(b);
      setTimeout(fine,1500);
    },900);
  },
  pagina:'challenges', sel:'#challenges-detail', pos:'left', durata:9000
},
{
  capitolo:8, titolo:'Candido un mio agente',
  testo:function(){
    var s=sfidaDaCandidare()||{};
    return 'È il gesto che distingue una sfida da una bacheca: su «'+escapaTitolo(s.titolo)+'» si sceglie <strong>uno dei propri agenti</strong>, si lascia una nota per la giuria, e da quel momento il flusso viene misurato sulle sue esecuzioni reali'+
      (s.metrica?(', qui su <em>'+escapaTitolo(s.metrica.l).toLowerCase()+'</em>'):'')+
      '. Candidare implica partecipare: l\'iscrizione si registra da sola, perché chiedere due gesti per la stessa intenzione fa solo dimenticare il secondo.';
  },
  azione:function(fine){
    var w=W();
    // Si passa a una sfida CON metrica: sull'hackathon non c'e' niente da
    // candidare, e mostrare il pulsante dove non esiste sarebbe una bugia.
    try{
      var s=sfidaDaCandidare();
      if(s)w.sfApriPagina(s.id);
    }catch(e){}
    setTimeout(function(){
      var b=perTesto('#challenges-detail .tb-btn','Candida');
      if(b)clicca(b);
      setTimeout(function(){
        scrivi('#sfNota','Gira ogni mattina sui contatti della notte, con il mascheramento prima del nodo AI.',function(){
          // Si conferma qui, dentro il passo che ha compilato: lasciare il
          // salvataggio al passo dopo significava tenere aperta una finestra
          // a cavallo fra due passi, e se qualcuno saltava da indice la
          // candidatura non veniva mai registrata.
          setTimeout(function(){
            var salva=perTesto('#modalContent .tb-btn','Candida');
            if(salva)clicca(salva);
            setTimeout(fine,1400);
          },900);
        });
      },1400);
    },1000);
  },
  pagina:'challenges', sel:'#modalContent', pos:'left', durata:11000
},
{
  capitolo:8, titolo:'Il punteggio lo calcolano le esecuzioni',
  testo:function(){
    var w=W(), s=sfidaDaCandidare()||{}, mio='';
    try{
      var c=w.sfClassifica(s), r=c.filter(function(x){return x.io})[0];
      if(r)mio=' La mia candidatura è entrata in classifica con <strong>'+r.punti+' punti</strong>: '+r.det+'. Non l\'ho dichiarato io, è la lettura delle sue esecuzioni.';
    }catch(e){}
    return 'La formula è quella scritta nei criteri, applicata alle righe del registro esecuzioni.'+mio+
      ' Accanto, il <strong>👍 della community</strong> resta una colonna a parte: uno dice cosa piace alle persone, l\'altro cosa fanno le esecuzioni, sommarli in un numero solo nasconderebbe quale dei due sta parlando. E la propria candidatura non si vota, altrimenti il voto misurerebbe quanti partecipanti ci sono.';
  },
  azione:function(fine){
    var w=W();
    try{
      var s=sfidaDaCandidare();
      var d=w.document.querySelector('#challenges-detail');
      if(s&&(!d||!d.innerText.trim()))w.sfApriPagina(s.id);
    }catch(e){}
    setTimeout(function(){
      var el=perTesto('#challenges-detail .card','Classifica');
      if(el)el.scrollIntoView({block:'center'});
      setTimeout(fine,900);
    },1000);
  },
  pagina:'challenges', sel:'#challenges-detail', pos:'left', durata:10000
},
{
  capitolo:8, titolo:'Le domande si raccolgono prima dell\'incontro',
  testo:function(){
    var w=W(), n=0;
    try{ n=w.sfDomande('ama1').length }catch(e){}
    return 'L\'AMA promette che «le domande più votate aprono la sessione»: qui quella promessa ha un posto dove avverarsi. '+
      (n?('Ce ne sono <strong>'+n+'</strong>, '):'Le domande sono ')+'ordinate <strong>per voti</strong> e non per data, che è il criterio dichiarato nel regolamento, quindi va rispettato anche nell\'elenco, non solo a parole. Chiunque può votarne una, e ritirare il proprio voto.';
  },
  azione:function(fine){
    var w=W();
    try{ w.sfApriPagina('ama1') }catch(e){}
    setTimeout(function(){
      scrivi('#sfDomandaTesto','Quanto costa davvero tenere in esercizio un agente che gira ogni ora?',function(){
        var b=perTesto('#challenges-detail .tb-btn','Pubblica');
        if(b)clicca(b);
        setTimeout(fine,1500);
      });
    },1200);
  },
  pagina:'challenges', sel:'#challenges-detail', pos:'left', durata:9500
},
{
  capitolo:8, titolo:'Community',
  testo:function(){
    var img=(W().POSTS||[]).filter(function(p){return /^image\//.test(p.attach_mime||'')}).length;
    return (W().POSTS||[]).length+' discussioni con allegati scaricabili, risposte in linea, apprezzamenti e classifica'+
      (img?(', e '+img+' con contenuti visivi che si vedono direttamente nella scheda'):'')+
      '. <strong>Ogni interazione è tracciata sul database</strong>: classifiche ed engagement misurano attività reali.';
  },
  pagina:'community',
  azione:function(fine){
    var w=W();
    try{ if(typeof w.sfChiudiPagina==='function')w.sfChiudiPagina(true) }catch(e){}
    setTimeout(fine,900);
  },
  sel:'#posts-list', pos:'right', durata:8500
},
{
  capitolo:8, titolo:'Un post con dentro un agente',
  testo:'Questo porta un <strong>flusso esportato in JSON</strong>: si scarica, oppure si apre direttamente nel Builder. Il contributo è quindi riutilizzabile, non solo leggibile.',
  azione:function(fine){
    var w=W();
    try{
      var p=(w.POSTS||[]).filter(function(x){return x.attach_name&&/\.json$/i.test(x.attach_name)})[0];
      var el=p?perTesto('.post-card',p.title.substring(0,20)):null;
      if(el)el.scrollIntoView({block:'center'});
    }catch(e){}
    setTimeout(fine,1200);
  },
  sel:'#posts-list', pos:'right', durata:8500
},
{
  capitolo:8, titolo:'Più file nello stesso racconto',
  testo:function(){
    var w=W(), n=0;
    try{ (w.POSTS||[]).forEach(function(p){ n=Math.max(n,(w.allegatiDiPost?w.allegatiDiPost(p).length:0)) }) }catch(e){}
    return 'Un post porta fino a <strong>cinque allegati</strong>, non uno. Chi racconta un flusso porta il '+
      '<em>JSON dell\'agente</em>, un <em>CSV di prova</em> e uno <em>schema</em>: tre cose che si spiegano insieme, e che '+
      'una alla volta costringevano a tre post o a una scelta. Le immagini si aprono a schermo intero e si scorrono in fila; '+
      'un JSON allegato ha il pulsante che lo apre nel Builder.';
  },
  pagina:'community',
  azione:function(fine){
    var w=W();
    try{
      var p=(w.POSTS||[]).filter(function(x){return x.attach_name&&/\.json$/i.test(x.attach_name)})[0];
      var el=p?perTesto('.post-card',p.title.substring(0,20)):null;
      if(el)el.scrollIntoView({block:'center'});
    }catch(e){}
    setTimeout(fine,1200);
  },
  sel:'#posts-list', pos:'right', durata:10000
},
{
  capitolo:8, titolo:'Scrivo io un contributo',
  testo:'Titolo, tipo, tag, testo e fino a <strong>cinque allegati</strong>. Il tipo distingue una <em>domanda</em> da una <em>soluzione</em> da un <em>tutorial</em>, e permette di cercare per intenzione oltre che per parole.',
  pagina:'community',
  azione:function(fine){
    var w=W();
    try{ if(typeof w.openNewPost==='function')w.openNewPost() }catch(e){}
    setTimeout(function(){
      scrivi('#newPostTitle','Come ho tagliato di due giorni l\'onboarding di un fornitore',function(){
        scrivi('#newPostBody','Il flusso legge i dati dal portale, verifica la partita IVA, chiede l\'approvazione solo sopra i cinque milioni e genera il dossier. Il tempo se ne andava tutto nell\'attesa di una firma che nel 90% dei casi non serviva.',function(){
          setTimeout(fine,600);
        });
      });
    },1100);
  },
  sel:'#modalContent', pos:'left', durata:11000
},
{
  capitolo:8, titolo:'Pubblicato, e il conto torna',
  testo:function(){
    var w=W(), n=0, mio=0;
    try{ n=(w.POSTS||[]).length; mio=(typeof w.fmMieiPost==='function')?w.fmMieiPost():0 }catch(e){}
    return 'Il post entra nell\'elenco: ora sono <strong>'+n+'</strong>, di cui <strong>'+mio+'</strong> miei. '+
      'Pubblicare vale <strong>20 punti esperienza</strong>, e il contributo compare anche nel mio profilo pubblico, chi guarda la classifica vede da dove arrivano i punti, non solo il totale.';
  },
  pagina:'community',
  // Pubblica dentro la finestra aperta dal passo precedente, poi la chiude.
  tieniAperto:true,
  azione:function(fine){
    var b=perTesto('#modalContent .tb-btn','Pubblica');
    if(b)clicca(b);
    setTimeout(function(){ chiudiFinestre(); setTimeout(fine,700) },1600);
  },
  sel:'#posts-list', pos:'right', durata:9000
},
{
  capitolo:8, titolo:'Apro una discussione e rispondo',
  testo:function(){
    var w=W(), c=0;
    try{ c=(typeof w.fmMieiCommenti==='function')?w.fmMieiCommenti():0 }catch(e){}
    return 'Il post si apre per esteso, con le <strong>risposte in fila</strong> e il campo per aggiungerne una. '+
      (c?('Di risposte mie ora ce ne sono <strong>'+c+'</strong>. '):'')+
      'Il <strong>«mi piace» si conta una volta sola</strong>: è una riga con il nome di chi l\'ha messo, non un contatore che sale a ogni clic, ricliccando si toglie. E anche la <em>visualizzazione</em> si registra una volta per persona: riaprire lo stesso post dieci volte non fa dieci lettori.';
  },
  pagina:'community',
  azione:function(fine){
    var w=W();
    try{
      // Un post di qualcun altro: mettere «mi piace» al proprio, e commentarsi
      // da soli, racconterebbe l'esatto contrario di una community.
      var altrui=(w.POSTS||[]).filter(function(x){return x.user!==w.utenteCorrente()});
      var p=altrui[0]||(w.POSTS||[])[0];
      if(!p){ setTimeout(fine,600); return }
      if(typeof w.fmAlternaLike==='function')w.fmAlternaLike(p.id);
      if(typeof w.openPostDetail==='function')w.openPostDetail(p.id);
      setTimeout(function(){
        if(!Q('#newCommentInput')){ setTimeout(fine,500); return }
        scrivi('#newCommentInput','Ci ho provato anch\'io: il pezzo che cambia tutto è mettere il mascheramento PRIMA del nodo AI.',function(){
          try{ if(typeof w.addComment==='function')w.addComment(p.id) }catch(e){}
          setTimeout(fine,1100);
        });
      },1200);
    }catch(e){ setTimeout(fine,600) }
  },
  sel:'#modalContent', pos:'left', durata:10000
},
{
  capitolo:8, titolo:'I riconoscimenti si vedono da fuori',
  testo:'La classifica permette di accedere ai <strong>profili pubblici</strong>. I badge sono basati sull\'attività reale: agenti creati, controlli di sicurezza usati, log. Certificano una competenza dimostrata sull\'uso reale della piattaforma.',
  azione:function(fine){
    var w=W();
    try{
      var righe=w.document.querySelectorAll('#leaderboard .leaderboard-row');
      for(var i=0;i<righe.length;i++){
        var nome=righe[i].querySelector('.lb-name');
        if(nome && nome.innerText.trim()!==w.utenteCorrente()){ clicca(righe[i]); break }
      }
    }catch(e){}
    setTimeout(fine,1500);
  },
  pagina:'community', sel:'#modalContent', pos:'left', durata:9500
},

// ── CAPITOLO 9 · Profilo e monitoraggio ────────────────────────
{
  capitolo:9, titolo:'Il profilo',
  testo:'Il lavoro fatto, i controlli applicati ai propri flussi, i riconoscimenti ottenuti e gli <em>obiettivi</em> ancora aperti. I numeri in alto e il dettaglio sotto raccontano la stessa cosa, perché vengono dallo stesso posto.',
  pagina:'profile', sel:'.page-pad', pos:'bottom', durata:8500
},
{
  capitolo:9, titolo:'Quanto costa un uso reale',
  testo:function(){
    var w=W(), c=null; try{ c=w.consumoUtente() }catch(e){}
    var f=function(n){return Number(n||0).toLocaleString('it-IT')};
    return 'La piattaforma <strong>conta i token</strong> di ogni chiamata al modello: misurati dove il fornitore li riporta, stimati altrove, e lo dice.'+
      (c?' Qui sono <strong>'+f(c.tot)+'</strong> su '+f(c.chiamate)+' chiamate'+(c.stimati?', '+f(c.stimati)+' stimati':'')+'.':'')+
      ' La <strong>quota di prova</strong> di '+f(w.QUOTA_PROVA_TOKEN||100000)+' token non paga niente al posto di nessuno: la chiave resta di chi la usa. Serve a far vedere quanto costa un uso reale, ed è il contatore su cui un piano aziendale addebiterebbe il consumo oltre i crediti di benvenuto.';
  },
  pagina:'profile',
  azione:function(fine){
    var el=Q('#profile-consumo'); if(el)el.scrollIntoView({block:'center'});
    setTimeout(fine,800);
  },
  sel:'#profile-consumo', pos:'left', durata:10000
},
{
  capitolo:9, titolo:'Badge e privilegi',
  testo:function(){
    var w=W(), p='';
    try{ var pr=w.prossimoPrivilegio(); if(pr)p=' Al momento mancano <strong>'+pr.manca+' XP</strong> per \u00ab'+pr.p.nome+'\u00bb.' }catch(e){}
    return 'Ogni riconoscimento si basa su parametri misurabili e <strong>sblocca nuove funzionalità</strong>: il voto sulle candidature a 250 punti, la revisione fra pari a 500.'+p+
      ' I ruoli chiave dipendono dalla competenza dimostrata sulla piattaforma: l\'innovazione resta libera, ma il governo segue regole certe.';
  },
  azione:function(fine){
    var w=W();
    try{ if(typeof w.closeModal==='function')w.closeModal(); var el=w.document.getElementById('badge-shelf'); if(el)el.scrollIntoView({block:'center'}) }catch(e){}
    setTimeout(fine,1200);
  },
  pagina:'profile', sel:'#badge-shelf', pos:'right', durata:9500
},
{
  capitolo:9, titolo:'Cambio le mie informazioni',
  testo:'Modifico ruolo e organizzazione. Se cambiassi il <strong>nome</strong>, la piattaforma direbbe prima <em>quanti elementi cambieranno intestatario</em>: agenti, esecuzioni, pubblicazioni, recensioni, candidature, e chiederebbe conferma: il nome è la chiave di attribuzione in ventidue tabelle.',
  azione:function(fine){
    var w=W();
    try{
      if(typeof w.openEditProfile==='function')w.openEditProfile();
      else if(typeof w.apriModificaProfilo==='function')w.apriModificaProfilo();
      else { var b=perTesto('button','Modifica profilo'); if(b)clicca(b) }
    }catch(e){}
    setTimeout(fine,1600);
  },
  sel:'#modalContent', pos:'left', durata:9500
},
{
  capitolo:9, titolo:'Obiettivi configurabili',
  testo:'Non otto righe scritte nel codice: ogni obiettivo dice <strong>come viene misurato</strong>, e soglia, esperienza e attivazione si modificano da qui. «Ripristina le soglie» rimette i valori di partenza.',
  azione:function(fine){
    try{ W().closeModal() }catch(e){}
    setTimeout(fine,800);
  },
  sel:'.page-pad', pos:'bottom', durata:8000
},
{
  capitolo:9, titolo:'Monitoraggio: sette aree',
  testo:'Popolazione, adozione, uso, presidio, modelli, conoscenza, pubblicazione. Sono le <strong>sette aree chiave</strong> previste dalla piattaforma: chi analizza la dashboard ha subito il polso completo e strutturato del sistema.',
  pagina:'monitoraggio', sel:'#monitoraggio-body', pos:'bottom', durata:9000
},
{
  capitolo:9, titolo:'Presidio',
  testo:'Mostra quanti agenti integrano policy attive, mascheramenti sui dati, e quante esecuzioni sono state <strong>bloccate preventivamente</strong> da un controllo. È la sezione che traduce l\'AI sperimentale in vera e propria AI Governata.',
  sel:'#monitoraggio-body', pos:'top', durata:9000
},
{
  capitolo:9, titolo:'Quello che questo cruscotto non può dirti',
  testo:'In fondo alla pagina sono esposti in totale trasparenza i <strong>limiti del sistema</strong>, specificando chiaramente quali metriche sono basate su dati reali e quali sono stimate. Una chiarezza essenziale per un\'analisi affidabile.',
  sel:'#monitoraggio-body', pos:'top', durata:9000
},
{
  capitolo:9, titolo:'Le connessioni si provano una volta sola',
  testo:'Cartelle, endpoint, database, posta: si configurano <strong>una volta</strong> e più agenti li riusano, così una credenziale non finisce dentro la definizione di un flusso. Ogni scheda dichiara <em>cosa si può provare davvero da qui</em>: la cartella si verifica scrivendoci un file, il database vuole il servizio locale. Dirlo prima è più onesto che farlo fallire dopo.',
  azione:function(fine){
    var w=W();
    chiudiFinestre();
    try{ if(typeof w.openConnessioni==='function')w.openConnessioni() }catch(e){}
    setTimeout(fine,1600);
  },
  sel:'#modalContent', pos:'left', durata:10000
},
{
  capitolo:9, titolo:'Anche al buio',
  testo:'Un interruttore in alto e la piattaforma passa al <strong>tema scuro</strong>: tutti i colori vengono dalle stesse variabili, quindi cambia la tavolozza e non un componente per volta. La scelta resta nel browser. Lo rimetto chiaro: gli screenshot e questa dimostrazione devono venire uguali su ogni macchina.',
  pagina:'monitoraggio',
  azione:function(fine){
    var w=W();
    try{ if(typeof w.applicaTema==='function')w.applicaTema('dark') }catch(e){}
    setTimeout(function(){
      try{ if(typeof w.applicaTema==='function')w.applicaTema('light') }catch(e){}
      fine();
    },4200);
  },
  sel:'#monitoraggio-body', pos:'top', durata:9000
},
{
  capitolo:9, titolo:'Fine della dimostrazione',
  testo:'Questo è tutto. Da qui in poi, le domande.',
  azione:function(fine){
    var w=W();
    // Un cartello esplicito in chiusura. Senza, l'ultimo passo si confonde con
    // una pausa e chi guarda non sa se e' finita o se manca qualcosa: in una
    // sala, quel dubbio dura abbastanza da rovinare il momento in cui si
    // dovrebbe cominciare a parlare.
    try{
      if(typeof w.openModal==='function')w.openModal(
        '<div style="text-align:center;padding:18px 6px 10px">'+
          '<div style="font-size:40px;line-height:1;margin-bottom:14px">🎬</div>'+
          '<h2 style="margin-bottom:10px">Fine della dimostrazione</h2>'+
          '<p style="font-size:13px;color:var(--tx3);line-height:1.65;max-width:440px;margin:0 auto">'+
            'Abbiamo installato un agente dal catalogo, costruito un flusso da zero, riparato '+
            'un flusso rotto, pubblicato e fatto approvare, e attraversato formazione, sfide, '+
            'community e monitoraggio.</p>'+
          '<p style="font-size:13px;color:var(--tx2);line-height:1.6;margin-top:14px;font-weight:700">'+
            'RelAItion · AI per tutti, valore per l\'impresa</p>'+
          '<p style="font-size:11px;color:var(--tx4);margin-top:16px">'+
            'La piattaforma resta aperta: si può provare adesso.</p>'+
        '</div>');
    }catch(e){}
    setTimeout(fine,1200);
  },
  sel:'#modalContent', pos:'left', durata:11000
},
{
  capitolo:9, titolo:'Il giro è chiuso',
  testo:'Abbiamo <strong>costruito</strong> un agente da zero, <strong>configurato</strong> il modello, <strong>eseguito</strong> tre flussi, <strong>pubblicato</strong>, <strong>revisionato</strong>, corretto e approvato, e attraversato formazione, sfide, community, profilo e monitoraggio. Tutto in un\'applicazione che gira nel browser, senza server.',
  pagina:'dashboard', sel:'.stats-row', pos:'bottom', durata:10000
},

// ── CAPITOLO 10 · La stessa piattaforma, un'altra persona ──────
// Serve a mostrare che la separazione dei dati non e' una promessa scritta
// nella documentazione: si esce, si rientra come qualcun altro, e i numeri
// cambiano davanti agli occhi di chi guarda.
{
  capitolo:10, titolo:'Esco',
  testo:function(){
    var w=W(), n='';
    // I nomi finiscono con un punto — «Mario R.» — e aggiungerne un altro
    // fa «Mario R..»: il punto della frase c'e' gia'.
    try{ n=String(w.utenteCorrente()||'').replace(/\.$/,'') }catch(e){}
    return 'Fin qui la piattaforma l\'ha usata <strong>'+escapaTitolo(n||'una persona sola')+'</strong>. Adesso esco e rientro come qualcun altro, '+
      'mostrando in tempo reale che <strong>l\'ambiente è multi-utente e i dati sono rigorosamente compartimentati</strong> per singola persona.';
  },
  azione:function(fine){
    UTENTE_ATTESO=null;
    ricaricaApp(function(){ setTimeout(fine,600) });
  },
  sel:'#loginScreen', pos:'right', durata:8500
},
{
  capitolo:10, titolo:'Entro come Giulia',
  testo:function(){
    var w=W(), r='';
    try{
      var g=(w.UTENTI||[]).filter(function(u){return /giulia/i.test(u.email)})[0];
      if(g)r=' <em>'+escapaTitolo(g.role)+'</em>, '+escapaTitolo(g.org)+'.';
    }catch(e){}
    return 'Le quattro schede sotto il modulo sono <strong>account veri</strong>, ciascuno con i propri dati.'+r+
      ' Nessuna password da leggere a voce: la scheda compila il modulo e accede.';
  },
  azione:function(fine){
    var w=W();
    try{
      var g=(w.UTENTI||[]).filter(function(u){return /giulia/i.test(u.email)})[0];
      UTENTE_ATTESO = g ? g.email : null;
      var scheda=perTesto('#accountDemo .account-scheda','Giulia');
      if(scheda)clicca(scheda);
      else if(g&&typeof w.accediComeDemo==='function')w.accediComeDemo(g.email);
    }catch(e){}
    setTimeout(fine,2200);
  },
  sel:'#accountDemo', pos:'right', durata:9000
},
{
  capitolo:10, titolo:'Gli stessi riquadri, altri numeri',
  testo:function(){
    var w=W(), t='';
    try{
      var s=w.profileStats();
      // Gli stessi numeri che il riquadro illuminato sta mostrando, composti
      // allo stesso modo: la scheda «agenti» conta creati piu' installati, e
      // dire un numero diverso da quello che si vede sarebbe la cosa peggiore
      // da fare mentre lo si indica.
      t=' Agenti <strong>'+(s.agenti+s.installati)+'</strong>: '+s.agenti+(s.agenti===1?' creato':' creati')+' e '+s.installati+(s.installati===1?' installato':' installati')+' —, '+
        'esecuzioni <strong>'+s.esecuzioni+'</strong>, esperienza <strong>'+s.xp+'</strong>: '+
        'sono le righe del database filtrate su di lei, non un secondo insieme di dati finti.';
    }catch(e){}
    return 'Stessa applicazione, stessa dashboard, <strong>contenuto diverso</strong>.'+t+
      ' Anche l\'attività recente racconta il suo lavoro, non quello di prima.';
  },
  pagina:'dashboard', sel:'.stats-row', pos:'bottom', durata:9500
},
{
  capitolo:10, titolo:'Un altro profilo, altri riconoscimenti',
  testo:function(){
    var w=W(), b='';
    try{
      var tutti=w.profileBadges(w.profileStats());
      var presi=tutti.filter(function(x){return x.ok});
      b=' Dei <strong>'+tutti.length+'</strong> riconoscimenti ne ha ottenuti <strong>'+presi.length+'</strong>, e non sono gli stessi di prima: ognuno ha una soglia calcolata sulla <em>sua</em> attività.';
    }catch(e){}
    return 'Il profilo è specifico: ruolo, badge e obiettivi rispecchiano le azioni di Giulia, a conferma che l\'intero sistema di gamification è <strong>calcolato dinamicamente</strong> e non assegnato in modo statico.'+b;
  },
  pagina:'profile', sel:'.page-pad', pos:'bottom', durata:9500
},
{
  capitolo:10, titolo:'Sfide e formazione ripartono da dove è lei',
  testo:function(){
    var w=W(), s='', l='';
    try{
      var isc=(w.SFIDE||[]).filter(function(x){ try{ return w.sfIscritto(x.id) }catch(e){ return false } }).length;
      var cand=(w.SFIDE||[]).filter(function(x){ try{ return !!w.sfCandidatura(x.id) }catch(e){ return false } }).length;
      s=' Risulta iscritta a <strong>'+isc+'</strong> iniziative e ha <strong>'+cand+'</strong> agenti in gara: sono le sue, non quelle di Mario.';
    }catch(e){}
    try{
      var n=w.livelloRaggiunto();
      l=n ? (' Nel Learning Hub ha raggiunto <strong>'+w.livelloInfo(n).nome+'</strong>.')
          : ' Nel Learning Hub non ha ancora completato il primo livello: la barra riparte da lì.';
    }catch(e){}
    return 'Le iscrizioni, le candidature e i progressi dei corsi sono per persona.'+s+l+
      ' Il catalogo, i contenuti dei corsi e le discussioni restano invece <strong>in comune</strong>: è ciò che l\'organizzazione mette a disposizione, e non avrebbe senso duplicarlo per ognuno.';
  },
  pagina:'challenges',
  azione:function(fine){
    var w=W();
    try{ if(typeof w.renderChallenges==='function')w.renderChallenges() }catch(e){}
    setTimeout(fine,900);
  },
  sel:'#challenges-content', pos:'bottom', durata:10000
},
{
  capitolo:10, titolo:'Fine',
  testo:'Una piattaforma sola, dati separati per persona, tutto dentro il browser. Da qui si ricomincia: <strong>il ripristino</strong> rimette lo stato com\'era prima della dimostrazione, così la prossima parte identica a questa.',
  azione:function(fine){
    UTENTE_ATTESO=null;
    setTimeout(fine,400);
  },
  pagina:'dashboard', sel:'.stats-row', pos:'bottom', durata:9000
}

];

// ══════════════════════════════════════════
// VERSIONE BREVE
// ══════════════════════════════════════════
// La demo completa dura un quarto d'ora di sola narrazione, e non tutte le
// occasioni lo concedono: una presentazione commerciale sta in quattro o
// cinque minuti, e un video piu' lungo non lo guarda nessuno fino in fondo.
// La versione breve e' una SELEZIONE della stessa demo — stessi passi, stesso
// codice — con i tempi di lettura piu' stretti. Si attiva con
// `demo.html?breve` o con il pulsante nella barra dei comandi; la versione
// completa resta intatta.
//
// ── Cosa si e' imparato dalla prima versione breve ──────────────
// Filtrare per titolo, e basta, non funziona: alcuni passi sono anelli di una
// CATENA e da soli non hanno senso. La prima selezione ne aveva rotte due.
//   · «Scrivo il prompt» scriveva in un pannello vuoto, perche' il passo che
//     AGGIUNGE il nodo AI era stato tolto: si vedeva un suggerimento per un
//     prompt senza nessun nodo AI a cui darlo;
//   · «Genera» mostrava l'anteprima della chat e il passo che la CHIUDE non
//     c'era: il riquadro restava a video e la finestra di pianificazione si
//     apriva sopra, sovrapposta.
// Da qui le due regole di questa lista: le catene si tengono intere, e chi la
// modifica deve sapere quali sono. Sono segnate qui sotto con «catena».
//
// ── L'altra correzione: il flusso costruito a mano si esegue ────
// Nella prima versione si costruiva un agente a mano e poi se ne eseguiva un
// ALTRO, gia' pronto. Il momento piu' convincente di una dimostrazione di
// prodotto e' vedere partire quello che si e' appena costruito, quindi ora i
// tre passi dell'esecuzione seguono direttamente la costruzione: «Eseguo»
// preme Esegui su quello che c'e' sulla tela, che a quel punto e' il flusso
// fatto a mano — trigger, mascheramento, nodo AI con il suo prompt, output.
// Per questo la lista e' ORDINATA e alcuni passi cambiano capitolo: senza, il
// contatore dei capitoli tornerebbe indietro a meta' demo.
//
// ── Cosa resta fuori ────────────────────────────────────────────
// Ricerca e filtri del catalogo, recensioni, palette e annullamento, ciclo e
// tetto di sicurezza, aiuto alla scrittura, validazione, modifica via chat,
// allegati alla mail, interruzione a meta', flusso con Knowledge Base,
// richiesta di modifica in revisione, sandbox didattica, dettaglio di sfide e
// community, badge e obiettivi, tema scuro. Tutto nella versione completa,
// che resta la dimostrazione vera.
//
// Ogni voce e' il titolo del passo, oppure [titolo, capitolo] per cambiargli
// capitolo, oppure {t, cap, testo, durata} per riscrivere anche testo e tempo
// senza toccare la versione completa.
var COPIONE_BREVE_PASSI=[
  // ── 1 · Accesso e panoramica
  {t:'RelAItion in una frase', durata:7000},
  {t:'Entro come Mario', durata:6500},
  {t:'La dashboard risponde a «come sto andando»',
   testo:'Quattro indicatori, calcolati sull\'attività vera di questa persona. Non numeri d\'esempio: righe del database.',
   durata:7000},

  // ── 2 · Dal catalogo a un agente che gira
  // CATENA: si cerca, si apre la scheda, si installa, si configura, si esegue,
  // si salva, lo si ritrova e lo si riapre. È il percorso più breve fra «non ho
  // niente» e «ho un agente mio che funziona», e va mostrato per intero.
  // I tre passi centrali hanno tempi più larghi degli altri: aprire una
  // finestra, portare un pulsante in vista, premerlo e caricare il Builder sono
  // quattro gesti, e con otto secondi si accavallavano fra loro.
  {t:'Ricerca',
   testo:'Il catalogo si cerca: scrivo «fattura» e si restringe. Cerca nel nome, nella descrizione, nella categoria e nelle etichette.',
   durata:8500},
  {t:'La scheda dell\'agente',
   testo:'Cosa fa, chi l\'ha scritto, quante installazioni e che giudizio ha avuto. Le stelle sono recensioni vere di chi lo usa.',
   durata:8000},
  {t:'Installa nel Builder',
   testo:'<strong>Installa nel Builder</strong>: non compro una scatola chiusa, me lo ritrovo sulla tela, aperto e modificabile.',
   durata:11000},
  {t:'Lo configuro per me',
   testo:'Installato non vuol dire «così com\'è». Cambio il <strong>modello</strong> sul nodo AI: la scelta è per singolo blocco.',
   durata:10000},
  {t:'E lo eseguo subito',
   testo:'Dall\'installazione all\'esecuzione senza passare da nessuno. Il registro sotto scrive cosa succede <em>mentre</em> succede.',
   durata:11000},
  'Lo salvo come mio',
  {t:'È fra i miei agenti',
   testo:'Qui stanno insieme gli agenti installati dal catalogo, quelli creati da me e le pubblicazioni in revisione.',
   durata:7000},
  'E lo riapro quando voglio',

  // ── 3 · La conoscenza aziendale, di passaggio
  // Volutamente breve: due gesti e un'esportazione. Il dettaglio su come il
  // recupero funziona sta nella versione completa — qui basta far vedere che i
  // documenti ci sono, che sono indicizzati e che si possono portare via.
  {t:'Cerco un documento fra tanti',
   testo:'La conoscenza aziendale sta qui. La ricerca guarda <strong>anche dentro i documenti</strong>, non solo nei nomi.',
   durata:8000},
  {t:'Dentro un documento: come è stato tagliato',
   testo:function(){
     var p=window.__kbPorzioni;
     return 'Ogni documento è <strong>indicizzato in porzioni</strong>'+(p?(': '+p+' per questo'):'')+
       '. Sono quelle che un agente andrà a pescare, non il documento intero.';
   },
   durata:8000},
  'E si porta via',

  // ── 4 · Costruisco a mano ed eseguo
  // CATENA COMPLETA, da non spezzare: azzera la tela, aggiunge il trigger,
  // aggiunge e seleziona il nodo AI, gli scrive il prompt, inserisce il
  // controllo fra i due, chiude con l'output. Togliendone uno, i successivi
  // lavorano su un nodo che non c'è.
  {t:'Primo nodo sulla tela',
   testo:'Adesso ne costruisco uno da zero. Primo blocco sulla tela: icona, nome, dettaglio. <strong>Nessuna riga di codice.</strong>',
   durata:7500},
  {t:'Il nodo che capisce di cosa si tratta',
   testo:'Aggiungo un nodo AI e lo seleziono: a destra si aprono le sue proprietà. È lì che si decide cosa fa.',
   durata:7500},
  {t:'Scrivo il prompt, lettera per lettera',
   testo:'Il prompt lo scrive chi conosce il processo. E chiedo una risposta <strong>in formato fisso</strong>: il blocco dopo deve leggerla come un dato.',
   durata:12000},
  {t:'Un nodo di controllo, essenziale per la Governance',
   testo:'In mezzo, un controllo: il <strong>mascheramento dei dati personali</strong>. Il modello elabora l\'informazione, non il dato sensibile. E non è un\'impostazione nascosta: è un blocco sulla tela.',
   durata:9000},
  {t:'Chiudo con l\'output', durata:7000},
  {t:'Eseguo', cap:4,
   testo:'Eseguo quello che ho appena costruito. Ogni nodo si illumina mentre lavora.',
   durata:10000},
  {t:'Perché questo risultato', cap:4,
   testo:'E questo è il pulsante che in azienda fa la differenza: <strong>fonti usate, decisioni prese, controlli intervenuti</strong>. È la risposta a «non sappiamo cosa fa davvero».',
   durata:9500},

  // ── 5 · Un flusso rotto, e come si rimette in piedi
  {t:'E quando un flusso non parte?',
   testo:'Il caso vero non è il flusso perfetto: è quello che arriva da un collega e non parte. Ne carico uno con problemi veri.',
   durata:9000},
  {t:'La piattaforma propone il ricambio',
   testo:'Non dice solo che c\'è un errore: propone <strong>il blocco giusto</strong> e lo sostituisce, poi riempie i campi vuoti. Da sei problemi a zero in due gesti.',
   durata:9000},

  // ── 6 · Costruire a parole, e mettere in produzione
  // CATENA: azzera la tela e apre la chat, scrive la richiesta, genera
  // l'anteprima, la applica CHIUDENDO il riquadro, e solo dopo si apre la
  // pianificazione. Senza «Applica» il riquadro resta aperto e la finestra
  // successiva gli si apre sopra.
  {t:'Costruire parlando, invece che trascinando', cap:5,
   testo:'Seconda strada: per chi non vuole trascinare niente, si descrive l\'agente <strong>a parole</strong>.',
   durata:7500},
  {t:'Descrivo l\'agente a parole', cap:5, durata:9000},
  {t:'Genera, ma prima mostra un\'anteprima', cap:5,
   testo:'Propone il flusso <strong>in anteprima</strong>: si accetta o si annulla. Niente arriva sulla tela senza conferma.',
   durata:9000},
  {t:'Applica, oppure annulla', cap:5, durata:8000},
  {t:'Un agente non deve essere lanciato a mano', cap:5,
   testo:'E un agente utile non si lancia a mano ogni volta: parte a orario, a intervallo, o quando arriva un evento.',
   durata:8500},

  // ── 7 · Storico, pubblicazione, revisione
  // CATENA: si propone, si invia in revisione, si approva. Senza l'invio non
  // c'è niente in coda da approvare. I tre passi della revisione hanno tempi
  // più larghi: ognuno cambia pagina e carica un elenco, e con gli otto secondi
  // di prima la narrazione arrivava mentre la schermata si stava ancora
  // disegnando.
  {t:'Lo storico delle esecuzioni', cap:6,
   testo:'Ogni esecuzione finisce qui: esito, durata, dettaglio per nodo. Un registro consultabile, non un log da sviluppatori.',
   durata:8000},
  {t:'Propongo il mio agente al Marketplace',
   testo:'Un agente che funziona diventa patrimonio dell\'azienda: lo propongo al catalogo.',
   durata:9500},
  {t:'Scelgo l\'ambito e invio',
   testo:'Scelgo chi potrà usarlo — il reparto, l\'organizzazione, il catalogo pubblico — e lo mando in revisione.',
   durata:9500},
  {t:'Il revisore approva',
   testo:'Passa da una persona, che vede il flusso, gli esiti e i controlli attivi. <strong>Chi costruisce non si approva da solo.</strong>',
   durata:10000},

  // ── 8 · Adozione: formazione, sfide, community
  // È la parte che il documento mette sullo stesso piano della tecnologia, e in
  // una presentazione commerciale è quella che distingue una piattaforma da un
  // editor di flussi. Qui la demo rallenta invece di correre.
  // I punteggi NON si nominano: sono tarature che cambiano, e una demo che
  // dichiara un numero che domani sarà diverso invecchia male.
  {t:'Learning Hub',
   testo:function(){ return (W().PATHS||[]).length+' percorsi di formazione, su quattro livelli. E non si impara su un corso a parte: ogni lezione apre il punto dell\'applicazione di cui parla.' },
   durata:8000},
  {t:'Apro una lezione', durata:8000},
  {t:'Rispondo al quiz',
   testo:'Ogni lezione si chiude con un quiz. Si sbaglia, si corregge, si riprova.',
   durata:8500},
  {t:'Le certificazioni, e perché non si regalano',
   testo:'Quattro livelli, da <em>AI Aspirant</em> ad <em>AI Ambassador</em>. Un livello si ottiene completando <strong>tutti</strong> i percorsi fino a quel punto: finire solo i facili non porta avanti.',
   durata:9000},
  {t:'La sandbox: sbagliare senza conseguenze',
   testo:'E c\'è un\'area di prova dove sbagliare non costa niente, prima di toccare un flusso vero.',
   durata:8000},
  {t:'Sfide ed eventi',
   testo:'Le sfide interne trasformano l\'apprendimento in competizione sana.',
   durata:7500},
  {t:'Entro in una sfida', durata:8000},
  {t:'Le fasi, con date che non invecchiano',
   testo:'Ogni sfida ha le sue fasi, con le date e la fase in corso evidenziata.',
   durata:8000},
  {t:'Come si vince, dichiarato prima',
   testo:'E i criteri di valutazione si leggono <strong>prima</strong> di iscriversi, non dopo.',
   durata:8000},
  {t:'Community',
   testo:'La community è il posto dove gli agenti si scambiano.',
   durata:7000},
  {t:'Scrivo io un contributo', durata:9000},
  {t:'Pubblicato, e il conto torna',
   testo:'Pubblicato, e il contatore sale: è calcolato, non dichiarato.',
   durata:7500},

  // ── 9 · Profilo, monitoraggio, chiusura
  {t:'Quanto costa un uso reale',
   testo:'Quanto costa usarlo davvero: i token consumati, separati fra misurati e stimati.',
   durata:8000},
  {t:'Monitoraggio: sette aree',
   testo:'E per chi deve rispondere dei risultati: sette aree di presidio, ogni numero calcolato sui dati.',
   durata:8000},
  // Chiude con il tema scuro e con un cartello esplicito: è il momento in cui
  // chi presenta deve poter cominciare a parlare sapendo che la demo è finita.
  {t:'Anche al buio',
   testo:'Un interruttore e la piattaforma passa al <strong>tema scuro</strong>: cambia la tavolozza, non un componente per volta.',
   durata:8500},
  'Fine della dimostrazione'
];

// Nome del capitolo 4 nella versione breve: qui dentro non si costruisce
// soltanto, si esegue anche.
var COPIONE_BREVE_CAPITOLI={ 4:'Costruisco un agente e lo eseguo' };

// Tempi di lettura al 72%. La versione precedente stava al 62% e risultava
// affrettata: chi guarda deve poter leggere il riquadro mentre la voce
// racconta, e un passo che sparisce prima di essere letto vale meno di un
// passo in meno. Il motore applica questa scala a ogni passo.
var COPIONE_BREVE_SCALA=0.70;
var DEMO_BREVE=/[?&]breve\b/.test(location.search);

// Quanti passi ha la versione completa, letto prima che la breve sostituisca
// COPIONE. Serve al pulsante «completa», che prima dichiarava un numero scritto
// a mano e rimasto indietro di otto passi: un numero mostrato dev'essere
// calcolato, non dichiarato.
var COPIONE_COMPLETO=COPIONE;

if(DEMO_BREVE){
  // Una voce della lista breve puo' essere:
  //   'Titolo'                      il passo com'e' nella demo completa
  //   ['Titolo', capitolo]          con il capitolo cambiato
  //   {t:'Titolo', cap, testo, durata}   con testo e tempo riscritti
  //
  // L'ultima forma esiste perche' le due versioni hanno due scopi diversi:
  // nella completa la narrazione e' il commento, e puo' permettersi il
  // dettaglio; nella breve qualcuno parla sopra, e un testo lungo sullo schermo
  // gli fa concorrenza invece di accompagnarlo. Riscrivere il testo QUI invece
  // che nel passo lascia la versione completa come documentata: un passo solo,
  // due registri.
  var _titolo=function(v){ return (v instanceof Array)?v[0]:(v&&v.t?v.t:v) };
  var _capitolo=function(v){
    if(v instanceof Array)return v[1];
    return (v&&v.cap!=null)?v.cap:null;
  };
  var _riscritture=function(v){
    if(!v||v instanceof Array||typeof v==='string')return null;
    var o={};
    if(v.testo!==undefined)o.testo=v.testo;
    if(v.durata!==undefined)o.durata=v.durata;
    if(v.sel!==undefined)o.sel=v.sel;
    return Object.keys(o).length?o:null;
  };
  var _perTitolo={};
  COPIONE.forEach(function(s){ if(!_perTitolo[s.titolo])_perTitolo[s.titolo]=s });

  var _mancanti=COPIONE_BREVE_PASSI.filter(function(v){ return !_perTitolo[_titolo(v)] });
  if(_mancanti.length)console.warn('Demo breve: passi non trovati nel copione', _mancanti.map(_titolo));

  // Si costruisce nell'ordine della lista, non in quello del copione: e'
  // l'ordine che sposta l'esecuzione subito dopo la costruzione.
  COPIONE=COPIONE_BREVE_PASSI.map(function(v){
    var s=_perTitolo[_titolo(v)];
    if(!s)return null;
    var c=_capitolo(v), r=_riscritture(v);
    if(c==null&&!r)return s;
    // Copia superficiale: cambiare capitolo o testo sull'oggetto originale
    // altererebbe anche la versione completa, che condivide questo array.
    var copia={}; for(var k in s)copia[k]=s[k];
    if(c!=null)copia.capitolo=c;
    if(r)for(var k2 in r)copia[k2]=r[k2];
    return copia;
  }).filter(Boolean);

  Object.keys(COPIONE_BREVE_CAPITOLI).forEach(function(k){
    if(COPIONE_CAPITOLI[k])COPIONE_CAPITOLI[k]={n:COPIONE_CAPITOLI[k].n,t:COPIONE_BREVE_CAPITOLI[k]};
  });
}
