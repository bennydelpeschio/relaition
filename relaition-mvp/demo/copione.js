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
  9:{n:'9',t:'Profilo e monitoraggio'}
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
function assicuraAccesso(fine){
  var d=doc(), w=W();
  var schermata=d&&d.getElementById('loginScreen');
  var visibile = schermata && getComputedStyle(schermata).display!=='none';
  if(!visibile){ fine(); return }
  try{
    var u=(w.UTENTI&&w.UTENTI[0])?w.UTENTI[0].email:null;
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
function chiudiFinestre(){
  var w=W(); if(!w)return;
  try{ if(typeof w.closeModal==='function')w.closeModal() }catch(e){}
  try{
    var o=doc().getElementById('modalOverlay');
    if(o)o.classList.remove('show');
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
    return (typeof w.anyProviderReady==='function') ? (w.anyProviderReady()||null) : null;
  }catch(e){ return null }
}

var COPIONE=[

// ── CAPITOLO 1 · Accesso e orientamento ────────────────────────
{
  capitolo:1, titolo:'RelAItion in una frase',
  testo:'Un <strong>marketplace di agenti AI</strong> dove chi conosce il processo aziendale costruisce l\'automazione da solo, senza scrivere codice. Parto dall\'accesso, come lo vedrebbe qualcuno che apre la piattaforma per la prima volta.',
  azione:function(fine){ ricaricaApp(fine) },
  sel:'#loginScreen', pos:'right', durata:7000
},
{
  capitolo:1, titolo:'Quattro persone, quattro punti di vista',
  testo:'Non c\'è un utente solo: <em>Mario costruisce</em>, <em>Giulia manda in produzione</em>, <em>Sara presidia</em>, <em>Marco sperimenta</em>. Ognuno vede i propri agenti, le proprie esecuzioni, i propri progressi. L\'autenticazione non è reale ed è dichiarato a schermo: <strong>nessun dato lascia il browser</strong>.',
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
  testo:'Quattro numeri: agenti, esecuzioni, corsi, esperienza. Sono <strong>calcolati sulle righe reali del database</strong> e filtrati sulla persona che ha effettuato l\'accesso. Il sottotitolo dice com\'è composto il totale: due creati da lui, cinque installati.',
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
  testo:'Restano solo gli agenti di quella funzione. L\'ordinamento in alto a destra segue la <strong>valutazione mostrata</strong>, non quella scritta nel catalogo: ordinare per un numero diverso da quello che si legge sulle schede sarebbe un piccolo inganno.',
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
  testo:'Descrizione, categoria, autore, installazioni e <strong>valutazione</strong>. Le stelle non sono decorative: sono la media delle recensioni scritte davvero, e la distribuzione dice se «4,5» significa tutti d\'accordo oppure metà entusiasti e metà delusi.',
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
  testo:'Ognuno può lasciarne <em>una sola</em> per agente, e può correggerla. Prima erano tre frasi scritte nel codice, identiche su tutti gli agenti del catalogo: aprendone due di seguito la finzione era evidente.',
  sel:'#recBloccoWrap', pos:'left', durata:7500
},
{
  pagina:'marketplace', capitolo:2, titolo:'Installa nel Builder',
  testo:'Il pulsante non dice «installa» e basta: dice <strong>installa nel Builder</strong>, e infatti mi ci porta con il flusso già montato sulla tela. È la differenza fra un catalogo di prodotti chiusi e una piattaforma: <em>quello che scarichi lo puoi aprire e cambiare</em>.',
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
  capitolo:2, titolo:'È fra i miei agenti',
  testo:'Qui stanno insieme gli agenti <em>installati dal marketplace</em>, quelli <em>creati da me</em> e le <em>pubblicazioni in revisione</em>. Ogni scheda dice quante volte è stato eseguito: <strong>quante da me e quante in tutto</strong>, perché sono due informazioni diverse.',
  pagina:'myagents', sel:'.page-pad', pos:'bottom', durata:8000
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
  testo:'Dieci categorie: trigger, AI, integrazioni, dati, output. E una che ai giocattoli manca: i <strong>Controlli</strong> — mascheramento dei dati personali, convalida dell\'output, approvazione umana, limitazione di frequenza.',
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
      ? 'Ho cercato «<em>'+r.q+'</em>»: la Knowledge Base restituisce <strong>'+r.n+' porzioni</strong>, ognuna con il documento di provenienza e quanto somiglia alla domanda. È questo che finisce nel prompt — non il documento intero, e non la conoscenza generale del modello.'
      : 'Ho cercato «<em>'+r.q+'</em>» e la Knowledge Base <strong>non ha trovato nulla</strong>. Lo dichiara invece di far rispondere il modello a caso: un recupero a vuoto è un\'informazione, non un fallimento da nascondere.';
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
  testo:'Dieci categorie e settantotto blocchi: scorrerli tutti sarebbe assurdo. C\'è un campo di ricerca. Scrivo <em>email</em> e resta quello che mi serve.',
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
  azione:function(fine){
    var w=W();
    try{
      var campo=Q('#paletteSearch'); if(campo){ campo.value=''; scatena(campo,'input') }
      creaNodo(w,'trigger','tr','📧','Email trigger','Richiesta in arrivo',200,80);
      w.b_render();
    }catch(e){}
    setTimeout(fine,1000);
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
  testo:'Il prompt è la parte che decide la qualità del risultato, e lo scrive chi conosce il processo. Chiedo anche <strong>output vincolato in JSON</strong>: il nodo successivo deve leggerlo come dato, non come racconto.',
  azione:function(fine){
    var w=W();
    var campo=QQ('#propsBody textarea')[0];
    var testo='Classifica la richiesta ricevuta. Rispondi SOLO JSON: {"categoria": "amministrazione|tecnico|commerciale", "urgenza": "alta|media|bassa"}.';
    if(!campo){ fine(); return }
    scrivi(campo,testo,function(){
      try{
        var sel=QQ('#propsBody select').filter(function(s){return /outformat/.test(s.getAttribute('onchange')||'')})[0];
        if(sel){ sel.value='json'; scatena(sel,'change') }
      }catch(e){}
      setTimeout(fine,900);
    });
  },
  sel:'#propsBody', pos:'left', durata:11000
},
{
  capitolo:4, titolo:'Un nodo di controllo, che i giocattoli non hanno',
  testo:'Prima di far leggere il testo al modello ci metto un <strong>mascheramento dei dati personali</strong>. È la categoria che distingue uno strumento aziendale da una demo: il modello valuta il contenuto, non chi lo ha scritto.',
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
  testo:'Il caso che serve sempre e che quasi nessuno mostra: <em>«analizza tutti i documenti della cartella, uno per uno»</em>. Aggiungo un nodo <strong>Loop</strong>: non ripete un numero fisso di volte, <strong>conta gli elementi che i nodi a monte hanno davvero prodotto</strong> e ripercorre i nodi a valle una volta per ciascuno.',
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
  testo:'Il campo <em>Tetto di sicurezza</em> non è burocrazia: un ciclo senza limite dentro una pagina web blocca il browser, e davanti a una commissione non si recupera. Se gli elementi superano il tetto, il registro <strong>lo dichiara</strong> invece di troncare in silenzio — che è la cosa peggiore che un motore possa fare.',
  pagina:'builder', sel:'#propsBody', pos:'left', durata:10000
},
// ── CAPITOLO 5 · Il modello, la chat, la pianificazione ────────
{
  capitolo:5, titolo:'Collegare un modello',
  testo:'Claude, OpenAI, Gemini, Mistral, oppure un <strong>modello che gira sul tuo computer</strong>. Si incolla la chiave e si preme <em>Testa</em>: la piattaforma fa una chiamata vera e dice se funziona.',
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
      : 'In questa sessione <strong>non c\'è nessuna chiave collegata</strong>, e la piattaforma non lo nasconde: i nodi AI verranno bloccati con un errore esplicito invece di restituire una risposta inventata. <em>Con una chiave incollata qui, questo passaggio mostra il test che va a buon fine.</em>';
  },
  pagina:'builder', sel:'.ai-panel, .builder-sidebar', pos:'right', durata:10000
},
{
  capitolo:5, titolo:'La scelta del modello sta sul nodo',
  testo:'Non è un\'impostazione globale: <strong>ogni nodo AI sceglie il proprio</strong>. Su un flusso che classifica mille richieste al giorno il modello economico cambia il conto di fine mese; su una stesura di testo cambia il risultato.',
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
  testo:'Passo a Claude: la tendina sotto si aggiorna con i modelli di <em>quel</em> fornitore, e il modello scelto per il precedente viene azzerato — <strong>«GPT-4o mini» non esiste in casa Anthropic</strong>. L\'identificativo finisce davvero nel corpo della richiesta HTTP: non è un\'etichetta decorativa.',
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
      : 'La verifica segnala <strong>'+e.n+'</strong>: <em>'+e.primo+'</em>. Non è un avviso da ignorare — la piattaforma <strong>si rifiuta di eseguire</strong>, ed è lo stesso controllo che blocca anche la pubblicazione.';
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

// ── Costruzione conversazionale ────────────────────────────────
{
  capitolo:5, titolo:'Costruire parlando, invece che trascinando',
  testo:'Sopra la tela c\'è il <strong>Builder conversazionale</strong>: si descrive l\'agente a parole e lui lo compone. I suggerimenti sotto non sono decorativi: sono <em>letti dal flusso che hai sulla tela</em>, quindi cambiano man mano che lo costruisci.',
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
  capitolo:5, titolo:'E poi si chiede una modifica',
  testo:'La chat non serve solo a partire da zero: <strong>a tela piena capisce cosa c\'è già</strong>. Chiedo di aggiungere la gestione degli errori, e i suggerimenti qui sotto cambiano di conseguenza — sono completamenti letti dal grafo, non esempi fissi.',
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
  testo:'Accanto a Esegui c\'è <strong>Interrompi</strong>, e non è un pulsante finto: ferma davvero l\'esecuzione al nodo corrente. Il registro lo <em>dichiara</em> — l\'esecuzione resta come «interrotta», non sparisce e non finge di essere riuscita. Su un agente che scrive su sistemi veri, poterlo fermare è più importante che farlo partire.',
  pagina:'builder',
  sel:'#btnStop', pos:'top', durata:10000
},
{
  capitolo:6, titolo:'Perché questo risultato',
  testo:'Il pulsante che una piattaforma di agenti deve avere: ricostruisce <strong>quali fonti sono state usate, quali decisioni prese e quali controlli sono intervenuti</strong>. Senza, un output resta una scatola nera che nessun responsabile può firmare.',
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
  testo:'Pubblicare non è premere un tasto: la piattaforma esegue prima <strong>controlli automatici</strong>, e poi manda l\'agente a una persona.',
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
      ? 'Presenza di un output, gestione degli errori, controlli sui dati personali, parametri compilati, almeno un\'esecuzione riuscita. <strong>Sono verifiche, non caselle da spuntare</strong>: chi non le passa non entra in catalogo.'
      : 'Il modulo <strong>non si è nemmeno aperto</strong>: la validazione ha bloccato prima. Senza un modello collegato due nodi non possono funzionare, e la piattaforma <em>non pubblica un flusso che non è in grado di eseguire</em>. Collegando una chiave, questo passaggio mostra il modulo con i controlli.';
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
  sel:null, durata:8000
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
  sel:null, durata:9000
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
  capitolo:8, titolo:'Il livello si conquista, non si dichiara',
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
  capitolo:8, titolo:'Entro in una sfida',
  testo:'Ogni sfida è una <em>pagina</em>, non una finestrella: regolamento, scadenze, domande e risposte, candidature con il voto della community. Il voto e il punteggio calcolato restano <strong>due colonne separate</strong>: uno dice cosa piace, l\'altro cosa fanno le esecuzioni.',
  azione:function(fine){
    var w=W();
    try{ if(w.SFIDE&&w.SFIDE[0])w.sfApriPagina(w.SFIDE[0].id) }catch(e){}
    setTimeout(fine,1400);
  },
  sel:'#challenges-detail', pos:'left', durata:9500
},
{
  capitolo:8, titolo:'Community',
  testo:function(){
    var img=(W().POSTS||[]).filter(function(p){return /^image\//.test(p.attach_mime||'')}).length;
    return (W().POSTS||[]).length+' discussioni con allegati scaricabili, risposte in linea, apprezzamenti e classifica'+
      (img?(', e '+img+' con contenuti visivi che si vedono direttamente nella scheda'):'')+
      '. <strong>Ogni numero è contato sulle righe reali</strong>: i «mi piace» non sono un contatore cieco che sale a ogni clic, e la classifica per esperienza è la somma vera dei punti guadagnati.';
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
  testo:'Questo porta un <strong>flusso esportato in JSON</strong>: si scarica, oppure si apre direttamente nel Builder. È ciò che distingue un racconto da un contributo utilizzabile.',
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

// ── CAPITOLO 9 · Profilo e monitoraggio ────────────────────────
{
  capitolo:9, titolo:'Il profilo',
  testo:'Il lavoro fatto, la governance applicata ai propri flussi, i badge e gli <em>obiettivi pratici</em>. I numeri dell\'intestazione coincidono con quelli del corpo, perché sono la stessa interrogazione: sarebbe imbarazzante il contrario.',
  pagina:'profile', sel:'.page-pad', pos:'bottom', durata:8500
},
{
  capitolo:9, titolo:'Cambio le mie informazioni',
  testo:'Modifico ruolo e organizzazione. Se cambiassi il <strong>nome</strong>, la piattaforma direbbe prima <em>quanti elementi cambieranno intestatario</em> — agenti, esecuzioni, pubblicazioni, recensioni, candidature — e chiederebbe conferma: il nome è la chiave di attribuzione in ventidue tabelle.',
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
  testo:'Popolazione, adozione, uso, presidio, modelli, conoscenza, pubblicazione. Sono le <strong>sette aree dichiarate nel documento di tesi</strong>, numerate in pagina: chi legge con l\'applicazione aperta le conta.',
  pagina:'monitoraggio', sel:'#monitoraggio-body', pos:'bottom', durata:9000
},
{
  capitolo:9, titolo:'Presidio',
  testo:'Quanti agenti hanno almeno un controllo, quante politiche sono attive, quanti mascheramenti sono avvenuti, quante esecuzioni sono state <strong>bloccate</strong> da un controllo. È la sezione che trasforma «abbiamo l\'AI» in «sappiamo cosa fa».',
  sel:'#monitoraggio-body', pos:'top', durata:9000
},
{
  capitolo:9, titolo:'Quello che questo cruscotto non può dirti',
  testo:'In fondo alla pagina c\'è il <strong>limite dichiarato</strong>: cosa è calcolato sui dati veri e cosa no. Un prototipo che dichiara i propri confini è più affidabile di uno che fa finta di non averne.',
  sel:'#monitoraggio-body', pos:'top', durata:9000
},
{
  capitolo:9, titolo:'Il giro è chiuso',
  testo:'Abbiamo <strong>costruito</strong> un agente da zero, <strong>configurato</strong> il modello, <strong>eseguito</strong> tre flussi, <strong>pubblicato</strong>, <strong>revisionato</strong>, corretto e approvato — e attraversato formazione, sfide, community, profilo e monitoraggio. Tutto in un\'applicazione che gira nel browser, senza server.',
  pagina:'dashboard', sel:'.stats-row', pos:'bottom', durata:10000
}

];
