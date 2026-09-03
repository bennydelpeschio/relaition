// ═══════════════════════════════════════════
// PRECARICAMENTO DIMOSTRATIVO — Blocco F
// ═══════════════════════════════════════════
// Una dimostrazione che parte da un database vuoto costringe a costruire tutto
// davanti al pubblico: si perdono minuti e la prima impressione è di uno
// strumento che non ha mai lavorato. Qui, al primo avvio, vengono creati i
// cinque flussi di riferimento, una Knowledge Base popolata, uno storico di
// esecuzioni con fallimenti reali e una pubblicazione in attesa di revisione.
//
// Il seme gira UNA SOLA VOLTA: chi riapre l'applicazione ritrova il proprio
// lavoro, non dati d'esempio che ricompaiono sopra.

var SEED_FLAG='relaition_seed_demo_v1';

// Fattura di prova allegata al trigger del flusso 2: senza una sorgente il
// flusso non passa la validazione, e chiedere di caricarla a mano davanti al
// pubblico vanificherebbe il precaricamento. Gli importi quadrano di proposito,
// cosi il ramo della convalida riuscita e mostrabile senza aggiustamenti.
var SEED_FATTURA=[
  'FATTURA n. 2026/0447 del 12/08/2026',
  'Fornitore: Delta Componenti Srl',
  'Partita IVA: IT04729310158',
  'Sede: Via Tortona 27, 20144 Milano',
  '',
  'Descrizione                 Qta   Prezzo    Totale',
  'Kit sensori serie K          12    84,00   1008,00',
  'Cavi schermati 5m            30    12,50    375,00',
  'Spese di trasporto            1    45,00     45,00',
  '',
  'Imponibile: 1428,00 EUR',
  'IVA 22%: 314,16 EUR',
  'TOTALE: 1742,16 EUR',
  'Scadenza pagamento: 11/09/2026'
].join('\n');

// Costruttore compatto: le schede dei flussi restano leggibili come tabelle,
// e da qui escono nodi e archi nel formato del canvas.
function seedFlusso(spec){
  var nodes=[],edges=[],id=1,mappa={};
  spec.nodi.forEach(function(n,i){
    var nid=id++;
    mappa[n.k]=nid;
    nodes.push({
      id:nid, type:n.t, icon:n.ic, name:n.n, detail:n.d||'',
      x:n.x!==undefined?n.x:140, y:n.y!==undefined?n.y:(70+i*130),
      config:Object.assign({model:'auto',prompt:'',temperature:0.7},n.cfg||{})
    });
  });
  (spec.archi||[]).forEach(function(a){
    if(mappa[a.da]&&mappa[a.a])
      edges.push({from:mappa[a.da],fp:a.p||'out',to:mappa[a.a],tp:'in',label:a.l||''});
  });
  // I campi obbligatori dei connettori vengono completati qui, dai valori
  // predefiniti delle rispettive definizioni. Senza, ogni volta che un
  // connettore acquisisce un campo obbligatorio i flussi di riferimento
  // smettono di validare — ed e' successo davvero, con SAP, Jira, Teams e
  // il nodo di posta. Cosi' il seme resta corretto da solo.
  if(typeof fillRequiredDefaults==='function')fillRequiredDefaults(nodes);
  return {nodes:nodes,edges:edges,nextId:id};
}

var SEED_FLUSSI=[
  {
    nome:'1 · Qualificazione contatti commerciali',
    contesto:'Rispondi sempre in italiano. Non riportare mai dati personali nei messaggi verso canali condivisi.',
    nodi:[
      {k:'t', t:'tr',ic:'📥',n:'Webhook',            d:'Contatto dal sito',     cfg:{method:'POST',path:'/hooks/contatti',auth:'Bearer token'}},
      {k:'m', t:'gr',ic:'🎭',n:'Mascheramento dati', d:'PII prima del modello', cfg:{entities:'Tutti',restore:'No'}},
      {k:'ai',t:'ai',ic:'🧠',n:'Punteggio contatto', d:'0-100 con motivazione', cfg:{model:'auto',outformat:'json',prompt:'Valuta il contatto commerciale. Assegna un punteggio 0-100 su dimensione azienda, settore, ruolo e testo della richiesta. Rispondi SOLO JSON: {punteggio, motivazione, settore_normalizzato}.'}},
      {k:'v', t:'gr',ic:'📐',n:'Convalida output',   d:'Schema atteso',         cfg:{required:'punteggio, motivazione',rules:'punteggio >= 0\npunteggio <= 100',onfail:'Blocca il flusso'}},
      {k:'c', t:'cd',ic:'🔀',n:'Punteggio >= 70?',   d:'Soglia qualificazione', cfg:{condition:'punteggio >= 70'}},
      {k:'s', t:'ac',ic:'💬',n:'Slack',              d:'Avvisa il commerciale', x:420,y:660,cfg:{channel:'#commerciale',message:'🔥 Contatto qualificato: {{result}}'}},
      {k:'h', t:'ac',ic:'🟠',n:'HubSpot',            d:'Da coltivare',          x:20, y:660,cfg:{object:'Contact',operation:'update'}},
      {k:'o', t:'ou',ic:'📊',n:'Output',             d:'Registra esito',        x:220,y:800,cfg:{format:'JSON',destination:'Log esecuzioni'}}
    ],
    archi:[{da:'t',a:'m'},{da:'m',a:'ai'},{da:'ai',a:'v'},{da:'v',a:'c'},
           {da:'c',a:'s',p:'true',l:'Sì'},{da:'c',a:'h',p:'false',l:'No'},
           {da:'s',a:'o'},{da:'h',a:'o'}]
  },
  {
    nome:'2 · Estrazione dati da fattura',
    contesto:'Non inventare mai valori mancanti: se un campo non è leggibile, dichiaralo vuoto.',
    nodi:[
      {k:'t',  t:'tr',ic:'📎',n:'File upload',        d:'Fattura ricevuta',      cfg:{formats:'pdf, jpg, png',maxsize:'10',ocr:'Sì',filename:'fattura-2026-0447.txt',filedata:SEED_FATTURA}},
      {k:'ai', t:'ai',ic:'👁️',n:'Estrazione campi',   d:'Dati strutturati',      cfg:{model:'auto',outformat:'json',prompt:'Estrai dalla fattura: fornitore, piva, numero, data, imponibile, iva, totale. Rispondi SOLO JSON. Se un campo non è leggibile lascialo vuoto, non inventarlo.'}},
      {k:'v',  t:'gr',ic:'📐',n:'Convalida output',   d:'Quadratura importi',    cfg:{required:'fornitore, piva, totale',rules:'totale > 0',onfail:'Segnala e prosegui'}},
      {k:'c',  t:'cd',ic:'🔀',n:'Convalida ok?',      d:'Quality gate',          cfg:{condition:'convalida superata'}},
      {k:'sap',t:'ac',ic:'🏢',n:'SAP',                d:'Registrazione provvisoria',x:420,y:590,cfg:{bapi:'BAPI_ACC_DOCUMENT_POST'}},
      {k:'ap', t:'gr',ic:'✋',n:'Approvazione umana',  d:'Verifica addetto',      x:20, y:590,cfg:{approver:'Ufficio contabilità',message:'Verificare i campi estratti prima della registrazione',timeout:'24'}},
      {k:'o',  t:'ou',ic:'📊',n:'Output',             d:'Esito registrazione',   x:220,y:730,cfg:{format:'JSON',destination:'Log esecuzioni'}}
    ],
    archi:[{da:'t',a:'ai'},{da:'ai',a:'v'},{da:'v',a:'c'},
           {da:'c',a:'sap',p:'true',l:'Sì'},{da:'c',a:'ap',p:'false',l:'No'},
           {da:'sap',a:'o'},{da:'ap',a:'o'}]
  },
  {
    nome:'3 · Assistenza con conoscenza aziendale',
    contesto:'Rispondi citando sempre il documento e l\'articolo di riferimento. Se l\'informazione non è nelle fonti, dichiaralo apertamente invece di dedurla.',
    nodi:[
      {k:'t', t:'tr',ic:'📧',n:'Email trigger',        d:'Casella assistenza',   cfg:{mailbox:'assistenza@azienda.it',filter:'',attachments:'Includi'}},
      {k:'cl',t:'ai',ic:'🏷️',n:'Classifica richiesta', d:'Categoria e urgenza',  cfg:{model:'auto',outformat:'json',prompt:'Classifica la richiesta. Rispondi SOLO JSON: {categoria, urgenza, riassunto}.'}},
      {k:'ai',t:'ai',ic:'🧠',n:'Risposta con KB',      d:'Fondata sui documenti',cfg:{model:'auto',useKB:true,kbTopK:3,kbBusinessUnit:'Customer Service',prompt:'Rispondi alla richiesta usando SOLO le fonti fornite, citando documento e articolo. Se l\'informazione non è nelle fonti, dillo esplicitamente.'}},
      {k:'f', t:'gr',ic:'🔎',n:'Verifica di fondatezza',d:'Confronto con fonti', cfg:{threshold:'40',action:'Segnala e prosegui'}},
      {k:'c', t:'cd',ic:'🔀',n:'Serve revisione?',     d:'Urgente o non fondata',cfg:{condition:'urgenza alta oppure fondatezza sotto soglia'}},
      {k:'ap',t:'gr',ic:'✋',n:'Approvazione umana',    d:'Bozza all\'operatore', x:420,y:720,cfg:{approver:'Responsabile assistenza',message:'Rivedere la bozza prima dell\'invio',timeout:'4'}},
      {k:'em',t:'ac',ic:'📧',n:'Invia email',          d:'Risposta al cliente',  x:20, y:720,cfg:{to:'{{mittente}}',subject:'Risposta alla tua richiesta',body:'{{result}}'}},
      {k:'o', t:'ou',ic:'📊',n:'Output',               d:'Porzioni ed esito',    x:220,y:860,cfg:{format:'JSON',destination:'Log esecuzioni'}}
    ],
    archi:[{da:'t',a:'cl'},{da:'cl',a:'ai'},{da:'ai',a:'f'},{da:'f',a:'c'},
           {da:'c',a:'ap',p:'true',l:'Sì'},{da:'c',a:'em',p:'false',l:'No'},
           {da:'ap',a:'o'},{da:'em',a:'o'}]
  },
  {
    nome:'4 · Istruttoria sinistro assicurativo',
    contesto:'Motiva sempre l\'indice di anomalia elencando gli elementi che lo hanno determinato.',
    nodi:[
      {k:'t', t:'tr',ic:'📥',n:'Webhook',             d:'Denuncia dal portale', cfg:{method:'POST',path:'/hooks/sinistri',auth:'HMAC signature'}},
      {k:'m', t:'gr',ic:'🎭',n:'Mascheramento dati',  d:'Anagrafica e polizza', cfg:{entities:'Tutti',restore:'No'}},
      {k:'nz',t:'ai',ic:'🔍',n:'Normalizza denuncia', d:'Campi uniformi',       cfg:{model:'auto',outformat:'json',prompt:'Estrai e uniforma i campi dalla descrizione libera del sinistro. Rispondi SOLO JSON.'}},
      {k:'ai',t:'ai',ic:'⚠️',n:'Indice di anomalia',  d:'Con strumenti',        cfg:{model:'auto',useTools:true,maxIterations:'3',prompt:'Calcola un indice di anomalia 0-100. Puoi consultare gli strumenti disponibili per verificare storico e copertura. Motiva elencando gli elementi che lo determinano.'}},
      {k:'pg',t:'ac',ic:'🗄️',n:'PostgreSQL',          d:'Storico sinistri',     x:430,y:470,cfg:{host:'db.azienda.it',port:'5432',database:'assicurazioni',user:'app_agente',sslmode:'require',query:'SELECT * FROM sinistri WHERE polizza=$1',params:'{{result.polizza}}'}},
      {k:'c', t:'cd',ic:'🔀',n:'Anomalia >= 75?',     d:'Soglia istruttoria',   x:140,y:600,cfg:{condition:'indice >= 75'}},
      {k:'ji',t:'ac',ic:'🎫',n:'Jira',                d:'Apre caso istruttorio',x:420,y:730,cfg:{project:'SIU',issuetype:'Task'}},
      {k:'tm',t:'ac',ic:'💼',n:'Teams',               d:'Avvisa il liquidatore',x:20, y:730,cfg:{channel:'Liquidazioni',message:'Sinistro in liquidazione: {{result}}'}},
      {k:'o', t:'ou',ic:'📊',n:'Output',              d:'Traccia per audit',    x:220,y:870,cfg:{format:'JSON',destination:'Log esecuzioni'}}
    ],
    archi:[{da:'t',a:'m'},{da:'m',a:'nz'},{da:'nz',a:'ai'},{da:'ai',a:'pg'},{da:'pg',a:'c'},
           {da:'c',a:'ji',p:'true',l:'Sì'},{da:'c',a:'tm',p:'false',l:'No'},
           {da:'ji',a:'o'},{da:'tm',a:'o'}]
  },
  {
    nome:'5 · Rapporto settimanale multi-agente',
    contesto:'Il rapporto deve stare in una pagina: sintetizza, non elencare.',
    nodi:[
      {k:'t', t:'tr',ic:'⏰',n:'Scheduler',            d:'Lunedì 7:00',        x:230,y:60, cfg:{cron:'0 7 * * 1',timezone:'Europe/Rome',onmiss:'Esegui al riavvio'}},
      {k:'a1',t:'sa',ic:'🤝',n:'Riepilogo commerciale',d:'Delega',             x:20, y:200,cfg:{agentName:'1 · Qualificazione contatti commerciali'}},
      {k:'a2',t:'sa',ic:'🤝',n:'Riepilogo contabile',  d:'Delega',             x:230,y:200,cfg:{agentName:'2 · Estrazione dati da fattura'}},
      {k:'a3',t:'sa',ic:'🤝',n:'Riepilogo sinistri',   d:'Delega',             x:440,y:200,cfg:{agentName:'4 · Istruttoria sinistro assicurativo'}},
      {k:'mg',t:'cd',ic:'🔗',n:'Merge',                d:'Attende i tre rami', x:230,y:340,cfg:{strategy:'Concatena'}},
      {k:'ai',t:'ai',ic:'✍️',n:'Compone rapporto',     d:'Sintesi unitaria',   x:230,y:470,cfg:{model:'auto',outformat:'markdown',prompt:'Redigi un rapporto settimanale unitario dai tre contributi ricevuti. Massimo una pagina: sintetizza, non elencare.'}},
      {k:'rl',t:'gr',ic:'⏲️',n:'Limitatore frequenza', d:'Soglia durata',      x:230,y:600,cfg:{max_calls:'20',max_chars:'50000',max_seconds:'120'}},
      {k:'ex',t:'ou',ic:'💾',n:'Esporta file',         d:'Rapporto scaricabile',x:20, y:730,cfg:{filename:'rapporto-settimanale',format:'Markdown',title:'Rapporto settimanale',destination:'Entrambe',kbBusinessUnit:'Vendite'}},
      {k:'em',t:'ac',ic:'📧',n:'Invia email',          d:'Alla direzione',     x:440,y:730,cfg:{to:'direzione@azienda.it',subject:'Rapporto settimanale',body:'{{result}}'}},
      {k:'o', t:'ou',ic:'📊',n:'Output',               d:'Traccia sotto-agenti',x:230,y:870,cfg:{format:'JSON',destination:'Log esecuzioni'}}
    ],
    archi:[{da:'t',a:'a1'},{da:'t',a:'a2'},{da:'t',a:'a3'},
           {da:'a1',a:'mg'},{da:'a2',a:'mg'},{da:'a3',a:'mg'},
           {da:'mg',a:'ai'},{da:'ai',a:'rl'},{da:'rl',a:'ex'},{da:'rl',a:'em'},
           {da:'ex',a:'o'},{da:'em',a:'o'}]
  }
];

// Un documento per tipologia, così la segmentazione per struttura si può
// mostrare senza doverne caricare altri durante la dimostrazione.
var SEED_DOCS=[
  {n:'regolamento-rimborsi.txt',bu:'Finance',c:'interno',t:
'Art. 1 Ambito di applicazione\nIl presente regolamento disciplina i rimborsi delle spese sostenute dai dipendenti in trasferta.\n\nArt. 2 Spese di trasporto\nSono rimborsate le spese documentate. Il rimborso chilometrico per uso del mezzo proprio e pari a 0,42 euro al chilometro.\n\nArt. 3 Vitto e alloggio\nIl massimale giornaliero per il vitto e di 50 euro. Per il pernottamento il massimale e di 130 euro in Italia e 180 euro all estero.\n\nArt. 4 Termini di presentazione\nLe note spese vanno presentate entro 30 giorni dal termine della trasferta. Oltre tale termine il rimborso non e dovuto.\n\nArt. 5 Anticipi\nSu richiesta puo essere concesso un anticipo fino al 70 per cento della spesa prevista.'},

  {n:'contratto-fornitura-tipo.md',bu:'Legal',c:'riservato',t:
'# Contratto di fornitura tipo\n\n1. Oggetto\nIl fornitore si impegna a consegnare i beni e i servizi indicati nell allegato tecnico.\n\n2. Durata\nIl contratto ha durata di 24 mesi decorrenti dalla sottoscrizione, rinnovabile tacitamente per uguale periodo.\n\n3.1 Recesso anticipato\nIn caso di recesso anticipato e dovuta una penale pari al 15 per cento del valore residuo del contratto.\n\n3.2 Preavviso\nIl recesso richiede un preavviso scritto di almeno 60 giorni, comunicato via posta elettronica certificata.\n\n4. Livelli di servizio\nIl fornitore garantisce una disponibilita del 99,5 per cento su base mensile. Sotto tale soglia si applica una riduzione del corrispettivo.\n\n5. Foro competente\nPer ogni controversia e competente in via esclusiva il Foro di Milano.'},

  {n:'faq-clienti.txt',bu:'Customer Service',c:'pubblico',t:
'D: Quanto tempo ho per recedere da un ordine?\nR: Hai 14 giorni dalla ricezione della merce per esercitare il diritto di recesso, come previsto dal codice del consumo.\n\nD: Le spese di reso sono a mio carico?\nR: Si, salvo il caso di prodotto difettoso o non conforme, in cui le spese sono a nostro carico.\n\nD: In quanto tempo ricevo il rimborso?\nR: Il rimborso avviene entro 10 giorni lavorativi dalla ricezione del reso presso il nostro magazzino.\n\nD: Come richiedo la fattura?\nR: La fattura si scarica dall area riservata, sezione Ordini, entro 48 ore dalla spedizione.\n\nD: Quali metodi di pagamento accettate?\nR: Carta di credito, bonifico bancario e PayPal. Il bonifico allunga i tempi di spedizione di due giorni lavorativi.'},

  {n:'procedura-onboarding.md',bu:'HR',c:'interno',t:
'# Procedura di onboarding\n\n1 Prima del primo giorno\nRaccogliere documento di identita, codice fiscale e coordinate bancarie. Verificare che il documento non sia scaduto.\n\n2 Primo giorno\nConsegnare la dotazione informatica e attivare gli accessi ai sistemi. La richiesta va inoltrata all IT almeno tre giorni prima.\n\n2.1 Accessi da attivare\nPosta elettronica, gestionale HR, cartella condivisa del reparto, sistema di rilevazione presenze.\n\n3 Prima settimana\nAffiancamento con il referente designato. Colloquio con il responsabile entro il quinto giorno.\n\n4 Dopo trenta giorni\nColloquio di verifica dell inserimento e raccolta del riscontro sulla procedura stessa.'},

  {n:'listino-prodotti.csv',bu:'Vendite',c:'interno',t:
'codice;prodotto;prezzo;scorta;referente\nA100;Licenza Base;490;disponibile;Anna Bianchi\nA200;Licenza Pro;1290;disponibile;Anna Bianchi\nA300;Licenza Enterprise;4900;su ordinazione;Marco Verdi\nS100;Supporto Standard;900;disponibile;Anna Bianchi\nS200;Supporto Premium;2400;disponibile;Marco Verdi\nF100;Formazione base due giorni;1800;su richiesta;Sara Neri'},

  {n:'casistiche-sinistri.txt',bu:'IT',c:'riservato',t:
'Art. 1 Sinistri con dinamica non coerente\nSono da segnalare i casi in cui la descrizione della dinamica non e compatibile con i danni riportati nella documentazione fotografica.\n\nArt. 2 Denunce ravvicinate\nPiu denunce dallo stesso contraente entro 90 giorni richiedono la verifica dello storico prima della liquidazione.\n\nArt. 3 Documentazione incompleta\nL assenza del verbale delle autorita nei sinistri con controparte comporta la sospensione dell istruttoria.\n\nArt. 4 Soglie di attenzione\nUn indice di anomalia pari o superiore a 75 comporta l apertura di un caso presso l unita antifrode.'}
];

function seedDemoData(){
  if(localStorage.getItem(SEED_FLAG))return {saltato:true,motivo:'seme già eseguito'};
  // Non si semina sopra il lavoro di qualcuno: se il database ha già
  // contenuti, il seme si considera fatto e non tocca nulla.
  var esistenti=dbGetOne('SELECT COUNT(*) c FROM agents');
  if(esistenti&&esistenti.c>0){localStorage.setItem(SEED_FLAG,'1');return {saltato:true,motivo:'database già popolato'}}

  var ora=Date.now();
  var iso=function(giorniFa,oreFa){
    return new Date(ora-(giorniFa||0)*86400000-(oreFa||0)*3600000).toISOString();
  };
  // Quattro profili con comportamenti DIVERSI, non quattro nomi sulla stessa
  // attivita': senza differenze le medie per utente e la distribuzione non
  // direbbero nulla, e il cruscotto mostrerebbe quattro colonne identiche.
  //   Mario R.  — chi costruisce: molte esecuzioni dal builder, qualche errore
  //   Giulia D. — chi manda in produzione: quasi tutto pianificato e riuscito
  //   Marco R.  — chi sperimenta: volumi bassi, tasso di errore alto
  //   Sara L.   — chi presidia: poche esecuzioni, spesso in attesa di approvare
  var PROFILI_UTENTE=[
    {nome:'Mario R.',  ruolo:'Automation Specialist', peso:14, erroreSu:6, modo:'builder'},
    {nome:'Giulia D.', ruolo:'Responsabile Operations', peso:12, erroreSu:12, modo:'scheduled'},
    {nome:'Marco R.',  ruolo:'Analista processi', peso:6,  erroreSu:3, modo:'builder'},
    {nome:'Sara L.',   ruolo:'Compliance', peso:5,  erroreSu:5, modo:'builder'}
  ];
  var autori=PROFILI_UTENTE.map(function(p){return p.nome});

  // ── 1. I cinque flussi di riferimento ──
  SEED_FLUSSI.forEach(function(f,i){
    var wf=seedFlusso(f);
    dbRun('INSERT INTO agents (name,nodes_json,edges_json,next_id,context,created_at,updated_at,author,active,schedule_type,schedule_value) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [f.nome,JSON.stringify(wf.nodes),JSON.stringify(wf.edges),wf.nextId,f.contesto||'',
       iso(20-i*3),iso(3-Math.min(i,2)),autori[i%autori.length],
       // Attivo E pianificato devono coincidere: prima il flusso 1 risultava
       // "in produzione" con pianificazione manuale, quindi non partiva mai —
       // e l'interfaccia diceva comunque che era attivo.
       i===4?1:0, i===4?'cron':'manual', i===4?'0 7 * * 1':'']);
  });

  // ── 2. Knowledge Base ──
  SEED_DOCS.forEach(function(d,i){
    var id='seed_doc_'+i;
    dbRun('INSERT INTO kb_docs (id,name,size,content,uploaded_at,business_unit,confidentiality,origin) VALUES (?,?,?,?,?,?,?,?)',
      [id,d.n,d.t.length,d.t,iso(15-i),d.bu,d.c,'caricato']);
    if(typeof kbIndexDocument==='function')kbIndexDocument(id);
  });

  // ── 3. Storico esecuzioni ──
  // Undici esecuzioni su sei giorni con esiti misti: due fallimenti reali, una
  // interruzione e una sospesa in attesa di approvazione. Uno storico tutto
  // verde non permetterebbe di mostrare né i registri d'errore né il
  // Monitoraggio, che su dati perfetti non ha nulla da dire.
  var storico=[
    {a:0,st:'ok',     d:2840,m:'builder',  g:6,s:'Contatto qualificato — punteggio 82, notificato su #commerciale'},
    {a:0,st:'ok',     d:3120,m:'scheduled',g:5,s:'Contatto da coltivare — punteggio 41, aggiornato su HubSpot'},
    {a:1,st:'err',    d:1450,m:'builder',  g:5,s:'Convalida output fallita: totale non quadra con imponibile piu IVA'},
    {a:0,st:'ok',     d:2610,m:'scheduled',g:4,s:'Contatto qualificato — punteggio 91'},
    {a:2,st:'ok',     d:4380,m:'builder',  g:4,s:'Risposta inviata citando regolamento-rimborsi.txt Art. 2'},
    {a:1,st:'waiting',d:1980,m:'builder',  g:3,s:'In attesa di approvazione: campi estratti da verificare'},
    {a:3,st:'ok',     d:5240,m:'builder',  g:3,s:'Indice di anomalia 34 — avviata la liquidazione'},
    {a:2,st:'ok',     d:3990,m:'scheduled',g:2,s:'Risposta inviata citando faq-clienti.txt'},
    {a:3,st:'err',    d:2210,m:'builder',  g:2,s:'PostgreSQL non raggiungibile: storico sinistri non consultabile'},
    {a:0,st:'aborted',d:1180,m:'builder',  g:1,s:'Interrotta dall utente dopo 2 nodi'},
    {a:4,st:'ok',     d:8760,m:'scheduled',g:1,s:'Rapporto settimanale composto dai tre sotto-agenti'}
  ];
  storico.forEach(function(e,i){
    var f=SEED_FLUSSI[e.a];
    dbRun('INSERT INTO exec_log (agent,nodes,status,duration,mode,summary,user,ts) VALUES (?,?,?,?,?,?,?,?)',
      [f.nome,f.nodi.length,e.st,e.d,e.m,e.s,autori[i%autori.length],iso(e.g,i)]);
  });

  // Storico aggiuntivo generato per profilo: e' cio' che rende leggibili le
  // metriche per utente. Le undici esecuzioni narrate sopra restano quelle
  // "raccontate" nei registri; queste danno volume e differenze fra persone.
  var esitiPerProfilo=function(p,indice){
    // Sara presidia: le sue esecuzioni si fermano spesso in attesa di firma.
    if(p.nome==='Sara L.'&&indice%3===1)return 'waiting';
    if(indice%p.erroreSu===0)return 'err';
    if(p.nome==='Mario R.'&&indice%11===5)return 'aborted';
    return 'ok';
  };
  PROFILI_UTENTE.forEach(function(p,pi){
    for(var k=0;k<p.peso;k++){
      var f=SEED_FLUSSI[(pi+k)%SEED_FLUSSI.length];
      var st=esitiPerProfilo(p,k);
      // Distribuite su tre settimane, in orario di lavoro: la mappa oraria
      // deve mostrare un uso lavorativo, non attivita' notturna casuale.
      var giorniFa=1+((k*3+pi)%20);
      var ore=(k%8)+9;
      dbRun('INSERT INTO exec_log (agent,nodes,status,duration,mode,summary,user,ts) VALUES (?,?,?,?,?,?,?,?)',
        [f.nome,f.nodi.length,st,
         1200+((k*137+pi*311)%6000),
         (k%4===0?'scheduled':p.modo),
         st==='ok'?'Elaborazione completata':
         st==='err'?'Interrotta da un errore nel nodo di integrazione':
         st==='waiting'?'In attesa di approvazione':'Interrotta manualmente',
         p.nome,
         new Date(Date.now()-giorniFa*86400000-(24-ore)*3600000).toISOString()]);
    }
  });

  // ── 4. Una richiesta in attesa di revisione ──
  var wf3=seedFlusso(SEED_FLUSSI[2]);
  dbRun('INSERT INTO published_agents (name,cat,icon,color,author,rating,installs,price,desc,tags_json,workflow_json,created_at,status,scope,version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    ['Assistenza con conoscenza aziendale','Customer Service','🎧','#EC4899','Giulia D.',0,0,'Gratis',
     'Risponde alle richieste di assistenza fondando ogni affermazione sui documenti aziendali, con verifica di fondatezza e revisione umana per i casi urgenti.\n\nPrerequisiti: Knowledge Base popolata, casella di assistenza configurata\nDati trattati: contenuto delle richieste dei clienti, mascherato prima del passaggio al modello',
     JSON.stringify(['Knowledge Base','Email','Customer Service']),
     JSON.stringify(wf3),iso(2),'in_verifica','organizzazione','1.0']);
  var pubId=dbGetOne('SELECT last_insert_rowid() as id').id;
  dbRun('INSERT INTO agent_versions (agent_id,version,definition_json,author,created_at,note) VALUES (?,?,?,?,?,?)',
    [pubId,'1.0',JSON.stringify(wf3),'Giulia D.',iso(2),'Prima pubblicazione']);
  dbRun('INSERT INTO publications (agent_id,version,requested_scope,checks_json,created_at) VALUES (?,?,?,?,?)',
    [pubId,'1.0','organizzazione','{}',iso(2)]);

  // ── 5. Un agente già pubblicato, per dare confronto al Monitoraggio ──
  var wf1=seedFlusso(SEED_FLUSSI[0]);
  dbRun('INSERT INTO published_agents (name,cat,icon,color,author,rating,installs,price,desc,tags_json,workflow_json,created_at,status,scope,version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    ['Qualificazione contatti','Sales','🎯','#10B981','Mario R.',4.6,7,'Gratis',
     'Qualifica i contatti commerciali in arrivo assegnando un punteggio motivato, con mascheramento dei dati personali prima del passaggio al modello.',
     JSON.stringify(['CRM','Slack','HubSpot']),JSON.stringify(wf1),iso(12),'pubblicato','business_unit','1.2']);
  var pubOk=dbGetOne('SELECT last_insert_rowid() as id').id;
  dbRun('INSERT INTO publications (agent_id,version,requested_scope,checks_json,created_at,reviewer,decision,decided_at,notes) VALUES (?,?,?,?,?,?,?,?,?)',
    [pubOk,'1.2','business_unit','{}',iso(13),'Sara L.','pubblicato',iso(12),
     'Mascheramento dei dati verificato, casi di regressione rigiocati senza divergenze.']);

  // ── 5b. Le due decisioni negative, che l'autore deve poter LEGGERE ──
  // Senza queste righe la sezione "Pubblicati e in revisione" resterebbe muta
  // in demo: si vedrebbe solo il caso felice, cioe' l'unico che non richiede
  // che il ciclo di revisione funzioni davvero.
  var wf2=seedFlusso(SEED_FLUSSI[1]);
  dbRun('INSERT INTO published_agents (name,cat,icon,color,author,rating,installs,price,desc,tags_json,workflow_json,created_at,status,scope,version,review_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    ['Estrazione dati da fatture','Finance','🧾','#6366F1','Mario R.',0,0,'Gratis',
     'Legge le fatture in arrivo ed estrae fornitore, imponibile e scadenza in un formato verificabile.',
     JSON.stringify(['Documenti','Finance']),JSON.stringify(wf2),iso(5),'bozza','organizzazione','1.0',
     'Il flusso invia la mail anche quando l\u2019estrazione fallisce: aggiungi una condizione che verifichi la presenza dell\u2019imponibile prima dell\u2019invio, e una nota di errore leggibile quando manca.']);
  var pubMod=dbGetOne('SELECT last_insert_rowid() as id').id;
  dbRun('INSERT INTO publications (agent_id,version,requested_scope,checks_json,created_at,reviewer,decision,decided_at,notes) VALUES (?,?,?,?,?,?,?,?,?)',
    [pubMod,'1.0','organizzazione','{}',iso(5),'Sara L.','bozza',iso(3),
     'Il flusso invia la mail anche quando l\u2019estrazione fallisce: aggiungi una condizione che verifichi la presenza dell\u2019imponibile prima dell\u2019invio, e una nota di errore leggibile quando manca.']);

  dbRun('INSERT INTO published_agents (name,cat,icon,color,author,rating,installs,price,desc,tags_json,workflow_json,created_at,status,scope,version,review_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    ['Sintesi riunioni con invio automatico','Produttivit\u00e0','📝','#F59E0B','Mario R.',0,0,'Gratis',
     'Riassume la trascrizione di una riunione e inoltra la sintesi a tutti i partecipanti.',
     JSON.stringify(['Riunioni','Email']),JSON.stringify(wf2),iso(9),'ritirato','pubblico','1.0',
     'Ambito pubblico non concedibile: il flusso inoltra trascrizioni integrali fuori dall\u2019organizzazione senza mascheramento. Ripresentalo con ambito interno oppure con un passo di anonimizzazione.']);
  var pubNo=dbGetOne('SELECT last_insert_rowid() as id').id;
  dbRun('INSERT INTO publications (agent_id,version,requested_scope,checks_json,created_at,reviewer,decision,decided_at,notes) VALUES (?,?,?,?,?,?,?,?,?)',
    [pubNo,'1.0','pubblico','{}',iso(9),'Sara L.','ritirato',iso(7),
     'Ambito pubblico non concedibile: il flusso inoltra trascrizioni integrali fuori dall\u2019organizzazione senza mascheramento. Ripresentalo con ambito interno oppure con un passo di anonimizzazione.']);

  // ── 6. Progressi formativi, differenziati per profilo ──
  // Erano scritti dentro PATHS come decorazione, quindi ogni utente ereditava
  // gli stessi sei corsi completati. Ora sono righe vere, di chi li ha fatti.
  var progressi=[
    {u:'Mario R.',  percorso:1, fino:3},   // ha finito i fondamenti
    {u:'Mario R.',  percorso:2, fino:2},
    {u:'Giulia D.', percorso:3, fino:2},   // le interessa il lato business
    {u:'Marco R.',  percorso:1, fino:1},
    {u:'Sara L.',   percorso:4, fino:4}    // sicurezza e governo, per intero
  ];
  progressi.forEach(function(p){
    for(var i=0;i<=p.fino;i++){
      dbRun('INSERT OR REPLACE INTO learn_progress (user,path_id,lesson_index,done) VALUES (?,?,?,1)',
        [p.u,p.percorso,i]);
    }
  });


  // ── 8b. Vincitori delle edizioni passate ──
  // Erano scritti nel markup della pagina: una Hall of Fame che non e' un dato
  // non si puo' interrogare, ne' estendere quando una sfida si chiude.
  [['Hackathon · edizione di primavera','Team Nexus','Smart Waste Sorting Agent',1],
   ['Sprint HR','Andrea L.','Onboarding Agent 3.0',1],
   ['Challenge Finance','Giulia D.','Invoice Extractor v1',1],
   ['Challenge Finance','Marco R.','Riconciliazione bancaria',2],
   ['Sprint HR','Sara L.','Screening candidati',2]
  ].forEach(function(v){
    dbRun('INSERT INTO challenge_winners (edizione,vincitore,agente,quando,posizione) VALUES (?,?,?,?,?)',
      [v[0],v[1],v[2],iso(120),v[3]]);
  });

  // ── 8c. Candidature alle sfide misurabili ──
  // Senza candidature la classifica sarebbe vuota su tutte e tre le sfide, e in
  // dimostrazione non si vedrebbe la cosa che la distingue da una bacheca: il
  // punteggio ricavato dalle esecuzioni reali dell'agente candidato.
  [['sprint1','Mario R.',1,'1 · Qualificazione contatti commerciali','Soglia alzata a 70 dopo i primi riscontri.'],
   ['sprint1','Giulia D.',2,'2 · Estrazione dati da fattura',''],
   ['sprint1','Marco R.',3,'3 · Assistenza con conoscenza aziendale',''],
   ['challenge1','Giulia D.',2,'2 · Estrazione dati da fattura','Convalida sullo schema dei campi obbligatori.'],
   ['challenge1','Sara L.',4,'4 · Istruttoria sinistro assicurativo',''],
   ['gov1','Sara L.',4,'4 · Istruttoria sinistro assicurativo','Approvazione umana sui casi sopra soglia.'],
   ['gov1','Marco R.',3,'3 · Assistenza con conoscenza aziendale',''],
   ['gov1','Giulia D.',2,'2 · Estrazione dati da fattura','']
  ].forEach(function(c){
    dbRun('INSERT OR IGNORE INTO challenge_submissions (challenge_id,user,agent_id,agent_name,nota,ts) VALUES (?,?,?,?,?,?)',
      [c[0],c[1],c[2],c[3],c[4],iso(4)]);
    dbRun('INSERT OR IGNORE INTO challenges_registered (user,challenge_id,ts) VALUES (?,?,?)',[c[1],c[0],iso(4)]);
  });

  // ── 8d. Domande e voti sulle sfide ──
  // Una sezione «domande» vuota al primo avvio sembra una funzione che nessuno
  // usa. Qui ce ne sono gia' alcune, con voti distribuiti in modo che l'ordine
  // per voti sia visibilmente diverso da quello cronologico: e' esattamente il
  // comportamento che si vuole mostrare.
  var DOMANDE=[
    ['ama1','Marco R.','Quanto costa davvero far girare un agente ogni giorno su cento documenti? Vorrei un ordine di grandezza, non una formula.',['Mario R.','Giulia D.','Sara L.']],
    ['ama1','Giulia D.','Come si convince il reparto legale che i dati non escono dall’azienda?',['Mario R.','Marco R.']],
    ['ama1','Sara L.','Quando conviene un modello in locale invece di una API a consumo?',['Giulia D.']],
    ['ama1','Mario R.','Che cosa si rompe per primo quando si passa da dieci a mille esecuzioni al giorno?',[]],

    ['hack1','Giulia D.','Il tema viene comunicato all’avvio o si può preparare qualcosa prima?',['Marco R.','Sara L.']],
    ['hack1','Marco R.','Se il team ha una persona che non usa la piattaforma, può occuparsi solo della presentazione?',['Mario R.']],

    ['sprint1','Marco R.','Le esecuzioni interrotte a mano contano come fallite?',['Mario R.','Giulia D.','Sara L.']],
    ['sprint1','Sara L.','Posso candidare un agente installato dal catalogo e poi modificato?',['Giulia D.']],

    ['challenge1','Sara L.','Il tetto a dieci esecuzioni vale per periodo o in assoluto?',['Mario R.','Marco R.']],
    ['challenge1','Mario R.','Un nodo di convalida che non blocca mai nulla conta comunque nel punteggio?',['Giulia D.']],

    ['gov1','Giulia D.','L’approvazione umana vale come controllo anche se nessuno l’ha mai dovuta usare?',['Mario R.','Sara L.','Marco R.']],
    ['gov1','Mario R.','La revisione fra pari è obbligatoria per restare in classifica?',[]],

    ['ws1','Marco R.','Se non ho una chiave API riesco comunque a seguire gli esercizi?',['Sara L.','Giulia D.']],
    ['ws1','Mario R.','Il pacchetto di modelli arriva anche a chi partecipa e poi deve andare via prima?',[]],

    ['demo1','Mario R.','Sei minuti sono pochi: si può portare un video registrato al posto della demo dal vivo?',['Giulia D.','Marco R.','Sara L.']],
    ['demo1','Giulia D.','Il voto della community è pubblico o anonimo?',['Mario R.']]
  ];
  DOMANDE.forEach(function(d,i){
    dbRun('INSERT INTO challenge_questions (challenge_id,user,testo,ts) VALUES (?,?,?,?)',
      [d[0],d[1],d[2],iso(9-Math.floor(i/2))]);
    var qid=dbGetOne('SELECT last_insert_rowid() as id').id;
    d[3].forEach(function(u){
      dbRun('INSERT OR IGNORE INTO challenge_votes (tipo,ref_id,user,ts) VALUES (?,?,?,?)',
        ['domanda',qid,u,iso(5)]);
    });
  });
  // Una risposta gia' data: mostra che il ciclo si chiude, non che si accumulano
  // domande senza seguito.
  dbRun("UPDATE challenge_questions SET risposta=?,risposta_di=? WHERE testo LIKE 'Le esecuzioni interrotte a mano%'",
    ['No. Le interruzioni volontarie non entrano nel tasso di successo: non sono fallimenti del flusso. Le trovi contate a parte nel Monitoraggio.','Sara L.']);
  dbRun("UPDATE challenge_questions SET risposta=?,risposta_di=? WHERE testo LIKE 'Il voto della community è pubblico%' OR testo LIKE 'Il voto della community è pubblico%'",
    ['Il conteggio è pubblico, chi ha votato cosa no. Ogni persona esprime un voto solo e può ritirarlo fino alla chiusura.','Sara L.']);

  // ── 8e. Apprezzamenti e visualizzazioni del forum ──
  // I «mi piace» erano un contatore cieco e le visualizzazioni numeri fissi.
  // Ora sono righe: qui se ne semina un numero plausibile, distribuito fra i
  // quattro profili, perche' un forum con zero apprezzamenti sembra abbandonato
  // — e perche' il conteggio mostrato dev'essere alto E vero, non alto e basta.
  var UTENTI_FORUM=['Mario R.','Giulia D.','Marco R.','Sara L.'];
  for(var pid=1; pid<=15; pid++){
    // Distribuzione irregolare: alcuni contributi piacciono a tutti, altri a
    // nessuno. Un numero uguale ovunque si riconosce come finto a colpo d'occhio.
    var quanti=[3,2,4,1,3,0,4,2,1,3,0,2,4,1,2][pid-1];
    for(var k=0;k<quanti;k++){
      dbRun('INSERT OR IGNORE INTO forum_likes (post_id,user,ts) VALUES (?,?,?)',
        [pid,UTENTI_FORUM[k%4],iso(12-pid%7)]);
    }
    // Le visualizzazioni per utente si sommano al valore di partenza del post.
    var visto=[4,3,4,2,4,1,4,3,2,4,1,3,4,2,3][pid-1];
    for(var v=0;v<visto;v++){
      dbRun('INSERT OR IGNORE INTO forum_views (post_id,user,ts) VALUES (?,?,?)',
        [pid,UTENTI_FORUM[v%4],iso(10-pid%6)]);
    }
  }
  // ── 7. Esperienza sulla piattaforma, diversa per ciascuno ──
  // Quiz, XP, agenti installati e iscrizioni erano vuoti per tutti: ogni
  // utente entrava con lo stesso curriculum azzerato, e "utenti diversi con
  // esperienza diversa" restava una dichiarazione senza dati dietro.
  // I numeri seguono i profili gia' definiti sopra, cosi' il cruscotto
  // racconta la stessa storia delle esecuzioni.
  var ESPERIENZA=[
    // Mario costruisce: molti agenti installati da cui prendere spunto,
    // parecchi quiz, XP alto.
    {u:'Mario R.',  installati:[1,2,4,7,12], quiz:['1-1','1-2','1-3','2-1','2-2'],
     sfide:['challenge1','ws1'],
     xp:[[50,'Primo agente costruito'],[80,'Cinque esecuzioni riuscite'],[100,'Flusso presidiato'],
         [125,'Quiz superati'],[150,'Agente portato in revisione'],[50,'Giro guidato completato']]},
    // Giulia manda in produzione: meno costruzione, piu' governo.
    {u:'Giulia D.', installati:[1,9,15],     quiz:['3-1','3-2'],
     sfide:['challenge1','demo1'],
     xp:[[50,'Primo agente costruito'],[80,'Cinque esecuzioni riuscite'],[50,'Quiz superati'],[120,'Risposte fondate sui documenti']]},
    // Marco sperimenta: appena arrivato, poco di tutto.
    {u:'Marco R.',  installati:[5],          quiz:['1-1'],
     sfide:['ws1'],
     xp:[[50,'Primo agente costruito'],[25,'Quiz superato']]},
    // Sara presidia: nessun agente costruito, ma formazione completa
    // sulla parte di sicurezza e governo.
    {u:'Sara L.',   installati:[6,11],       quiz:['4-1','4-2','4-3','4-4'],
     sfide:['ama1','challenge1'],
     xp:[[100,'Percorso Sicurezza completato'],[100,'Quiz superati'],[60,'Risultato interrogato']]}
  ];
  ESPERIENZA.forEach(function(e){
    e.installati.forEach(function(id,k){
      dbRun('INSERT INTO my_agents (catalog_id,installed_at,user) VALUES (?,?,?)',[id,iso(30-k*4),e.u]);
    });
    e.quiz.forEach(function(k){
      dbRun('INSERT OR IGNORE INTO quiz_done (user,quiz_key,ts) VALUES (?,?,?)',[e.u,k,iso(10)]);
    });
    e.sfide.forEach(function(s){
      dbRun('INSERT OR IGNORE INTO challenges_registered (user,challenge_id,ts) VALUES (?,?,?)',[e.u,s,iso(6)]);
    });
    e.xp.forEach(function(v,k){
      dbRun('INSERT INTO xp_log (amount,reason,ts,user) VALUES (?,?,?,?)',[v[0],v[1],iso(25-k*3),e.u]);
    });
  });

  localStorage.setItem(SEED_FLAG,'1');
  return {
    saltato:false,
    flussi:SEED_FLUSSI.length,
    documenti:SEED_DOCS.length,
    porzioni:(dbGetOne('SELECT COUNT(*) c FROM kb_chunks')||{c:0}).c,
    esecuzioni:storico.length,
    pubblicazioni:dbGetOne('SELECT COUNT(*) c FROM published_agents').c
  };
}

// Chi vuole partire pulito deve poterlo fare senza svuotare a mano sei tabelle,
// e senza perdere ciò che ha costruito lui.
function rimuoviDatiDemo(){
  if(!confirm('Rimuovere i cinque flussi di esempio, i documenti dimostrativi e il relativo storico?\n\nGli agenti che hai creato tu non vengono toccati.'))return;
  var nomi=SEED_FLUSSI.map(function(f){return f.nome});
  var ph=nomi.map(function(){return '?'}).join(',');
  dbRun('DELETE FROM exec_log WHERE agent IN ('+ph+')',nomi);
  dbRun('DELETE FROM agents WHERE name IN ('+ph+')',nomi);
  dbRun('DELETE FROM kb_chunks WHERE doc_id LIKE \'seed_doc_%\'');
  dbRun('DELETE FROM kb_docs WHERE id LIKE \'seed_doc_%\'');
  dbRun('DELETE FROM published_agents WHERE name IN (\'Assistenza con conoscenza aziendale\',\'Qualificazione contatti\')');
  showToast('🧹 Dati dimostrativi rimossi');
  addAct('Rimossi i dati dimostrativi');
  go('dashboard');
}

// Ricarica il seme da zero: utile fra una prova e l'altra della dimostrazione.
function ricaricaDatiDemo(){
  if(!confirm('Ricaricare i dati dimostrativi da capo?\n\nI cinque flussi di esempio e il loro storico vengono ricreati.'))return;
  var nomi=SEED_FLUSSI.map(function(f){return f.nome});
  var ph=nomi.map(function(){return '?'}).join(',');
  dbRun('DELETE FROM exec_log WHERE agent IN ('+ph+')',nomi);
  dbRun('DELETE FROM agents WHERE name IN ('+ph+')',nomi);
  dbRun('DELETE FROM kb_chunks WHERE doc_id LIKE \'seed_doc_%\'');
  dbRun('DELETE FROM kb_docs WHERE id LIKE \'seed_doc_%\'');
  dbRun('DELETE FROM published_agents WHERE name IN (\'Assistenza con conoscenza aziendale\',\'Qualificazione contatti\')');
  localStorage.removeItem(SEED_FLAG);
  var r=seedDemoData();
  showToast('🌱 Dati dimostrativi ricaricati: '+r.flussi+' flussi, '+r.porzioni+' porzioni, '+r.esecuzioni+' esecuzioni');
  go('myagents');
}
