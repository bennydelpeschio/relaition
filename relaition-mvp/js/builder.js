// NB: ogni connettore elencato qui deve avere un record corrispondente in
// CONNECTOR_CONFIGS/TRIGGER_CONFIGS/LOGIC_CONFIGS più sotto — altrimenti il
// pannello proprietà si apre vuoto. In precedenza CONNECTOR_CONFIGS ne
// definiva ~35 ma la palette (e quindi il canvas) ne esponeva solo 8: le
// altre erano codice morto, irraggiungibile dal drag&drop. I tab categoria
// CRM/Comm/ERP/Data/DevOps nella sidebar filtrano per questi valori di
// `cat` — senza componenti con quel cat, il tab appariva vuoto cliccandolo.
var PALETTE=[
  {cat:'trigger',type:'tr',icon:'📥',name:'Webhook',desc:'Ricevi dati HTTP'},
  {cat:'trigger',type:'tr',icon:'⏰',name:'Scheduler',desc:'Cron/intervallo'},
  {cat:'trigger',type:'tr',icon:'📧',name:'Email trigger',desc:'Nuova email'},
  {cat:'trigger',type:'tr',icon:'📎',name:'File upload',desc:'Nuovo file caricato'},
  {cat:'trigger',type:'tr',icon:'📝',name:'Form submit',desc:'Invio form web'},
  {cat:'trigger',type:'tr',icon:'🗃️',name:'Database change',desc:'Insert/update/delete'},
  {cat:'trigger',type:'tr',icon:'🔔',name:'Event listener',desc:'Evento custom'},

  {cat:'ai',type:'ai',icon:'🧠',name:'LLM Prompt',desc:'Chiamata AI (Claude/GPT/Gemini)'},
  {cat:'ai',type:'ai',icon:'👁️',name:'Vision AI',desc:'Analisi immagini'},
  {cat:'ai',type:'ai',icon:'📝',name:'Summarizer',desc:'Riassumi testo'},
  {cat:'ai',type:'ai',icon:'🏷️',name:'Classifier',desc:'Classifica contenuto'},
  {cat:'ai',type:'ai',icon:'🔍',name:'Extractor',desc:'Estrai dati strutturati'},
  {cat:'ai',type:'ai',icon:'🌐',name:'Translator',desc:'Traduci testo'},
  {cat:'ai',type:'ai',icon:'💬',name:'Chat Agent',desc:'Conversazione multi-turn'},
  {cat:'ai',type:'ai',icon:'📊',name:'Analisi dati',desc:'Statistiche e anomalie da tabelle'},
  {cat:'ai',type:'ai',icon:'⚖️',name:'Confronto documenti',desc:'Differenze fra due testi'},

  {cat:'crm',type:'ac',icon:'🔗',name:'Salesforce',desc:'CRUD Salesforce'},
  {cat:'crm',type:'ac',icon:'🧲',name:'HubSpot',desc:'Contact/deal CRM'},
  {cat:'crm',type:'ac',icon:'📈',name:'Dynamics 365',desc:'CRM Microsoft'},
  {cat:'crm',type:'ac',icon:'🟢',name:'Pipedrive',desc:'Pipeline vendite'},
  {cat:'comm',type:'ac',icon:'📧',name:'Invia email',desc:'Invio via SMTP configurato'},
  {cat:'comm',type:'ac',icon:'💬',name:'Slack',desc:'Post su canale (webhook reale opz.)'},
  {cat:'comm',type:'ac',icon:'👥',name:'Teams',desc:'Card su Teams'},
  {cat:'comm',type:'ac',icon:'📱',name:'WhatsApp',desc:'Messaggio template'},
  {cat:'comm',type:'ac',icon:'🔔',name:'Push Notification',desc:'Notifica push app'},

  {cat:'erp',type:'ac',icon:'🏢',name:'SAP',desc:'BAPI/OData'},
  {cat:'erp',type:'ac',icon:'🏛️',name:'Oracle ERP',desc:'Modulo AP/GL/AR'},
  {cat:'erp',type:'ac',icon:'📒',name:'QuickBooks',desc:'Fatture/spese'},
  {cat:'erp',type:'ac',icon:'💳',name:'Stripe',desc:'Pagamenti/fatture'},

  {cat:'action',type:'ac',icon:'🌐',name:'HTTP Request',desc:'REST API call: esecuzione REALE'},
  {cat:'action',type:'ac',icon:'📊',name:'Google Sheets',desc:'Scrivi/leggi foglio'},
  {cat:'action',type:'ac',icon:'📄',name:'Google Docs',desc:'Genera documento'},
  {cat:'action',type:'ac',icon:'📋',name:'Notion',desc:'Crea/aggiorna pagine'},
  {cat:'action',type:'ac',icon:'🎫',name:'Jira',desc:'Issue/task tracking'},
  {cat:'action',type:'ac',icon:'✅',name:'Asana',desc:'Task management'},
  {cat:'action',type:'ac',icon:'🗂️',name:'Trello',desc:'Board Kanban'},
  {cat:'action',type:'ac',icon:'📚',name:'Confluence',desc:'Wiki aziendale'},
  {cat:'action',type:'ac',icon:'📁',name:'File operation',desc:'Crea/sposta/copia'},
  {cat:'action',type:'ac',icon:'☁️',name:'Google Drive',desc:'Archivia su Drive'},
  {cat:'action',type:'ac',icon:'🗄️',name:'SharePoint',desc:'Libreria documenti'},
  {cat:'action',type:'ac',icon:'📦',name:'AWS S3',desc:'Storage oggetti'},
  {cat:'action',type:'ac',icon:'🔗',name:'GraphQL',desc:'Query/mutation API'},
  {cat:'action',type:'ac',icon:'🐍',name:'Python Script',desc:'Codice custom'},
  {cat:'action',type:'ac',icon:'🔧',name:'n8n Workflow',desc:'Richiama workflow esterno'},

  {cat:'data',type:'ac',icon:'🐘',name:'PostgreSQL',desc:'Query SQL'},
  {cat:'data',type:'ac',icon:'🍃',name:'MongoDB',desc:'Query NoSQL'},
  {cat:'data',type:'ac',icon:'⚡',name:'Redis',desc:'Cache key/value'},
  {cat:'data',type:'ac',icon:'🔎',name:'Elasticsearch',desc:'Ricerca/indicizzazione'},
  {cat:'data',type:'ac',icon:'🟩',name:'Supabase',desc:'Postgres + realtime'},

  {cat:'devops',type:'ac',icon:'🐙',name:'GitHub',desc:'Issue/commenti repo'},
  {cat:'devops',type:'ac',icon:'🦊',name:'GitLab',desc:'Progetto/pipeline'},
  {cat:'devops',type:'ac',icon:'🐕',name:'Datadog',desc:'Metriche/monitoring'},
  {cat:'devops',type:'ac',icon:'📟',name:'PagerDuty',desc:'Escalation on-call'},
  {cat:'devops',type:'ac',icon:'🐳',name:'Docker/K8s',desc:'Deploy container'},
  {cat:'devops',type:'ac',icon:'▲',name:'Vercel',desc:'Deploy frontend'},

  {cat:'logic',type:'cd',icon:'🔀',name:'Condition',desc:'Se/altrimenti'},
  {cat:'logic',type:'cd',icon:'🔄',name:'Loop',desc:'Ripeti per ogni item'},
  {cat:'logic',type:'cd',icon:'⏳',name:'Delay',desc:'Aspetta N secondi'},
  {cat:'logic',type:'cd',icon:'🔃',name:'Switch',desc:'Multi-branch routing'},
  {cat:'logic',type:'cd',icon:'🔁',name:'Retry',desc:'Riprova con backoff'},
  {cat:'logic',type:'cd',icon:'🧯',name:'Error Handler',desc:'Gestione errori'},
  {cat:'logic',type:'cd',icon:'🔗',name:'Merge',desc:'Unisci più rami'},
  {cat:'logic',type:'cd',icon:'✂️',name:'Split',desc:'Dividi in batch'},
  {cat:'output',type:'ou',icon:'📊',name:'Output',desc:'Risultato finale'},
  {cat:'output',type:'ou',icon:'📝',name:'Logger',desc:'Log per debug'},
  {cat:'output',type:'ou',icon:'📈',name:'Analytics',desc:'Traccia metrica'},
  {cat:'output',type:'ou',icon:'💾',name:'Esporta file',desc:'Genera e scarica un file reale'},
  {cat:'output',type:'ou',icon:'☁️',name:'Salva su cloud',desc:'Scrivi su Drive, OneDrive o cartella'},
  {cat:'output',type:'ou',icon:'🏁',name:'Fine',desc:'Termina qui, nessuna azione'},
  {cat:'output',type:'ou',icon:'✅',name:'Esito positivo',desc:'Chiudi il ramo come riuscito'},
  {cat:'output',type:'ou',icon:'⛔',name:'Esito negativo',desc:'Chiudi il ramo come fallito'},

  // ── Controlli (blocco A2) ──
  // Definiti in js/guardrails.js: qui si dichiara solo la voce di palette,
  // così nome/icona/descrizione restano in un unico posto e non divergono.
  {cat:'guard',type:'gr',icon:'🛡️',name:'Filtro contenuti',desc:'Blocca o segnala categorie non ammesse'},
  {cat:'guard',type:'gr',icon:'🎭',name:'Mascheramento dati',desc:'Sostituisce gli identificatori personali'},
  {cat:'guard',type:'gr',icon:'🚧',name:'Difesa da istruzioni ostili',desc:'Rileva tentativi di manipolazione'},
  {cat:'guard',type:'gr',icon:'🔎',name:'Verifica di fondatezza',desc:'Confronta l\'output con le fonti KB'},
  {cat:'guard',type:'gr',icon:'📐',name:'Convalida output',desc:'Verifica schema, formati, intervalli'},
  {cat:'guard',type:'gr',icon:'📊',name:'Soglia di confidenza',desc:'Devia a revisione sotto soglia'},
  {cat:'guard',type:'gr',icon:'✋',name:'Approvazione umana',desc:'Sospende fino ad autorizzazione'},
  {cat:'guard',type:'gr',icon:'⏲️',name:'Limitatore frequenza',desc:'Interrompe oltre le soglie di consumo'},
  {cat:'guard',type:'gr',icon:'🧯',name:'Gestore eccezioni',desc:'Riprova, devia o notifica in caso di errore'},

  // Delega fra agenti (B7): invoca un agente salvato come sotto-agente.
  {cat:'logic',type:'sa',icon:'🤝',name:'Chiamata agente',desc:'Delega a un altro agente e attende il risultato'},
];


function renderPalette(){
  var list=PALETTE.filter(function(p){
    if(paletteCat!=='all'&&p.cat!==paletteCat)return false;
    if(paletteQ&&p.name.toLowerCase().indexOf(paletteQ)<0&&p.desc.toLowerCase().indexOf(paletteQ)<0)return false;
    return true;
  });
  var colors={trigger:'#F59E0B',ai:'#6366F1',action:'#10B981',logic:'#64748B',output:'#0F766E',crm:'#0EA5E9',comm:'#8B5CF6',erp:'#F97316',data:'#14B8A6',devops:'#EF4444',guard:'#D946EF'};
  document.getElementById('paletteList').innerHTML=list.map(function(p){
    return '<div class="palette-item" draggable="true" ondragstart="onPaletteDrag(event,\''+p.type+'\',\''+p.icon+'\',\''+p.name+'\',\''+p.desc+'\')">'+
      '<div class="p-ic" style="background:'+(colors[p.cat]||'#64748B')+'15;color:'+(colors[p.cat]||'#64748B')+'">'+p.icon+'</div>'+
      '<div><div class="p-name">'+p.name+'</div><div class="p-sub">'+p.desc+'</div></div></div>';
  }).join('');
}

function filterPalette(q){paletteQ=q.toLowerCase();renderPalette()}

function setPaletteCat(c,el){
  paletteCat=c;
  document.querySelectorAll('.palette-tab').forEach(function(t){t.classList.remove('active')});
  el.classList.add('active');
  renderPalette();
}


function initBuilder(){
  if(!B.init){
    B.init=true;
    renderPalette();
    initRegistroRidimensionabile();
    initDivisoriBuilder();
    // Lo stato del pulsante di esportazione va deciso subito: a registro vuoto
    // deve gia' risultare spento.
    if(typeof aggiornaBottoneEsportaRegistro==='function')aggiornaBottoneEsportaRegistro();
    initOrientamento();
    var ca=document.getElementById('canvasArea');
    ca.addEventListener('dragover',function(e){e.preventDefault()});
    ca.addEventListener('drop',onCanvasDrop);
    ca.addEventListener('mousedown',onCanvasMouseDown);
    ca.addEventListener('wheel',onCanvasWheel,{passive:false});
    document.addEventListener('mousemove',onCanvasMouseMove);
    document.addEventListener('mouseup',onCanvasMouseUp);
    // Load saved state
    // Ripresa della copia di lavoro: nodi, nome e riga di appartenenza.
    //
    // Il legame con la riga si accetta solo se quella riga esiste ANCORA ed è
    // di chi sta usando l'applicazione adesso. localStorage è per origine, non
    // per utente: senza questo controllo, entrando con un altro account il
    // Builder avrebbe puntato alla riga di qualcun altro e il primo
    // salvataggio automatico gliel'avrebbe sovrascritta.
    try{
      var s=(typeof chiaveCopiaDiLavoro==="function")?localStorage.getItem(chiaveCopiaDiLavoro()):null;
      if(s){
        var d=JSON.parse(s);
        B.nodes=d.nodes||[]; B.edges=d.edges||[]; B.nextId=d.nextId||1;
        var riga=null;
        if(d.dbAgentId && typeof dbGetOne==='function'){
          try{ riga=dbGetOne('SELECT id,name,author,context FROM agents WHERE id=?',[d.dbAgentId]) }catch(e){}
        }
        if(riga && riga.author===(typeof utenteCorrente==='function'?utenteCorrente():riga.author)){
          B.dbAgentId=riga.id;
          currentAgentName=riga.name||d.nome||currentAgentName;
          B.context=riga.context||B.context||'';
        }else if(d.nome){
          // La riga non c'è più (o è di un altro): il lavoro resta sulla tela
          // come bozza, con il suo nome, ma senza legame da sovrascrivere.
          currentAgentName=d.nome;
        }
      }
    }catch(e){}
    // Il canvas ripristinato dalla copia in localStorage non e' piu' un agente
    // di quanto lo sia il flusso di esempio: non ha una riga a cui puntare
    // (`dbAgentId` nullo) e l'utente non ha chiesto di salvarlo. Senza questa
    // riga bastava APRIRE il Builder perche' l'autosalvataggio creasse un
    // agente fantasma "Workflow Builder" a ogni sessione nuova. Resta effimero
    // finche' non lo si tocca: la prima modifica reale azzera il flag e da
    // quel momento il salvataggio automatico funziona come previsto.
    if(!B.dbAgentId)B.effimero=true;
    if(B.nodes.length===0){
      // Demo workflow
      var id0=b_addNode('tr','📥','Webhook CRM','Lead in arrivo',80,40);
      var id1=b_addNode('ai','🧠','Analisi Lead','Scoring con LLM',80,180);
      var id2=b_addNode('cd','🔀','Score > 70?','Routing',80,320);
      var id3=b_addNode('ac','📧','Email alert','Notifica sales',20,460);
      var id4=b_addNode('ou','📊','Update CRM','Salva score',240,460);
      b_addEdge(id0,'out',id1,'in','');
      b_addEdge(id1,'out',id2,'in','');
      b_addEdge(id2,'true',id3,'in','Sì');
      b_addEdge(id2,'false',id4,'in','No');
      // Questo flusso e un esempio, non un agente dell utente: finche non lo
      // tocca non deve comparire fra "I miei agenti" ne contare nelle
      // metriche. Il salvataggio automatico lo ignora finche resta effimero.
      B.effimero=true;
    }
    b_render();
    // I controlli imposti da politica vengono applicati all'apertura del
    // Builder: un flusso salvato prima che la politica esistesse deve
    // adeguarsi, non restare scoperto.
    if(typeof applyPoliciesToCanvas==='function')applyPoliciesToCanvas(true);
    if(!localStorage.getItem('relaition_tour_seen'))setTimeout(startOnboardingTour,500);
  }else{
    b_render();
    if(typeof applyPoliciesToCanvas==='function')applyPoliciesToCanvas(true);
  }
}

// ══════════════════════════════════════════
// TOUR GUIDATO — al primo accesso al Builder, spiega in pochi passaggi come
// costruire un workflow. Si mostra una sola volta (flag in localStorage);
// riapribile manualmente dal punto interrogativo nella topbar del Builder.
// ══════════════════════════════════════════

var TOUR_STEPS=[
  {title:'👋 Benvenuto nel Builder',body:'In meno di un minuto ti mostriamo come costruire il tuo primo agente AI: nessuna competenza di programmazione richiesta.'},
  {title:'1. Trascina i componenti',body:'Nella palette a sinistra trovi Trigger (eventi di partenza), nodi AI, Azioni verso sistemi esterni e blocchi di Logica. Trascina un componente sul canvas per aggiungerlo: ogni workflow deve iniziare con un Trigger.'},
  {title:'2. Collega i nodi',body:'Trascina dal pallino di uscita di un nodo fino al pallino di ingresso del successivo per creare il flusso. Su una connessione già disegnata puoi trascinare i pallini alle estremità per ricollegarla altrove, o cliccarla per eliminarla.'},
  {title:'3. Configura ogni nodo',body:'Clicca su un nodo per aprire il pannello Proprietà a destra: lì imposti il prompt per i nodi AI, i campi dei connettori (i campi con l\'asterisco * sono obbligatori), o la condizione per i nodi Logica.'},
  {title:'4. Prova la Chat AI',body:'Nella barra sopra il canvas puoi descrivere in linguaggio naturale cosa vuoi costruire: la Chat AI genera l\'intero workflow. Con un nodo selezionato, invece, modifica solo quello.'},
  {title:'5. Esegui, salva, pubblica',body:'▶️ Esegui testa il workflow con dati di esempio. Il salvataggio è automatico, ma 💾 ti permette di dargli un nome. Da lì puoi esportarlo, generarne il codice Python, pianificarne l\'esecuzione automatica (⏱️) o pubblicarlo nel Marketplace (🚀).'}
];
var tourStepIdx=0;

function startOnboardingTour(){tourStepIdx=0;renderTourStep()}

function renderTourStep(){
  var s=TOUR_STEPS[tourStepIdx];
  var isLast=tourStepIdx===TOUR_STEPS.length-1;
  openModal(
    '<div style="text-align:center;padding:6px 4px">'+
    '<div style="font-size:11px;color:var(--tx4);font-weight:600;margin-bottom:14px">Passo '+(tourStepIdx+1)+' di '+TOUR_STEPS.length+'</div>'+
    '<div style="font-size:17px;font-weight:800;margin-bottom:12px">'+s.title+'</div>'+
    '<div style="font-size:13px;color:var(--tx2);line-height:1.7;margin-bottom:24px;text-align:left">'+s.body+'</div>'+
    '<div style="height:4px;background:var(--bg3);border-radius:10px;overflow:hidden;margin-bottom:22px"><div style="height:100%;width:'+Math.round((tourStepIdx+1)/TOUR_STEPS.length*100)+'%;background:var(--ac);border-radius:10px;transition:width .3s"></div></div>'+
    '<div style="display:flex;gap:8px;justify-content:center">'+
      (tourStepIdx>0?'<button class="tb-btn" onclick="tourStepIdx--;renderTourStep()">← Indietro</button>':'')+
      (isLast?'<button class="tb-btn primary" onclick="finishTour()">🚀 Inizia a costruire</button>':'<button class="tb-btn primary" onclick="tourStepIdx++;renderTourStep()">Avanti →</button>')+
    '</div>'+
    (isLast?'':'<div style="margin-top:16px"><span onclick="finishTour()" style="font-size:11px;color:var(--tx4);cursor:pointer;text-decoration:underline">Salta il tour</span></div>')+
    '</div>'
  ,true);
}

function finishTour(){
  localStorage.setItem('relaition_tour_seen','1');
  closeModal();
}


// ══════════════════════════════════════════
// PILA DI ANNULLAMENTO (B10)
//
// Si registra lo stato PRIMA di ogni modifica strutturale. I controlli
// inseriti da politica obbligatoria non producono un passo proprio: sono
// parte della stessa transazione dell'azione che li ha fatti scattare,
// altrimenti un annullamento li rimuoverebbe aggirando il presidio.
// ══════════════════════════════════════════
var UNDO_LIMIT=40;

function snapshotCanvas(){
  return {nodes:JSON.stringify(B.nodes),edges:JSON.stringify(B.edges),nextId:B.nextId};
}
function restoreCanvas(s){
  B.nodes=JSON.parse(s.nodes);B.edges=JSON.parse(s.edges);B.nextId=s.nextId;
  B.selId=-1;B.selEdgeIdx=-1;B.selIds=[];clearInvalidNodes();
  b_render();renderProps(-1);
}
function pushUndo(label){
  // Qualunque modifica volontaria fa smettere il canvas di essere "solo un
  // esempio": da qui in poi e lavoro dell utente e va salvato.
  B.effimero=false;
  if(!B.undoStack)B.undoStack=[];
  if(!B.redoStack)B.redoStack=[];
  var s=snapshotCanvas();s.label=label||'modifica';
  B.undoStack.push(s);
  if(B.undoStack.length>UNDO_LIMIT)B.undoStack.shift();
  B.redoStack=[];   // una nuova modifica invalida il percorso di ripristino
  updateUndoButtons();
}
function undoCanvas(){
  if(!B.undoStack||!B.undoStack.length){showToast('Niente da annullare');return}
  B.redoStack.push(snapshotCanvas());
  var s=B.undoStack.pop();
  restoreCanvas(s);
  showToast('↩︎ Annullato: '+(s.label||'modifica'));
  updateUndoButtons();
}
function redoCanvas(){
  if(!B.redoStack||!B.redoStack.length){showToast('Niente da ripristinare');return}
  B.undoStack.push(snapshotCanvas());
  restoreCanvas(B.redoStack.pop());
  showToast('↪︎ Ripristinato');
  updateUndoButtons();
}
function updateUndoButtons(){
  var u=document.getElementById('btnUndo'),r=document.getElementById('btnRedo');
  if(u){u.disabled=!(B.undoStack&&B.undoStack.length);u.style.opacity=u.disabled?.35:1}
  if(r){r.disabled=!(B.redoStack&&B.redoStack.length);r.style.opacity=r.disabled?.35:1}
  // pushUndo non passa da b_render: la barra delle frecce va aggiornata qui.
  if(typeof renderComposeHistory==='function')renderComposeHistory();
}

// `opts` è opzionale e additivo (proprietà extra sul nodo, es. {locked:true,
// policyId:3} per i controlli imposti da politica): i chiamanti esistenti in
// builder.js, ai-client.js e marketplace.js restano invariati.
function b_addNode(type,icon,name,detail,x,y,opts){
  var id=B.nextId++;
  var node={id:id,type:type,icon:icon,name:name,detail:detail,x:x,y:y,config:nodoConfigIniziale(type,name)};
  if(opts)Object.keys(opts).forEach(function(k){node[k]=opts[k]});
  B.nodes.push(node);
  return id;
}

// Ogni nodo nasce già configurato con i propri campi obbligatori. Prima
// riceveva {model:'claude',prompt:''} — la configurazione di un nodo AI —
// qualunque cosa fosse: un "Esporta file" appena trascinato non aveva nome
// file né formato, e bloccava l'esecuzione al primo Run senza che si capisse
// che bastava aprirlo e compilarlo. I valori sono i suggerimenti dei campi
// stessi, quindi restano coerenti se un domani cambiano le definizioni.
function nodoConfigIniziale(type,name){
  // "auto": il nodo usera' il fornitore collegato, qualunque sia.
  // Il prompt non e' vuoto: ogni nodo AI porta con se' il proprio compito e il
  // formato di uscita atteso, cosi' trascinarlo ed eseguire produce gia'
  // qualcosa di sensato invece di una risposta generica.
  if(type==='ai'){
    var pre=(typeof AI_NODE_PRESET!=='undefined'&&AI_NODE_PRESET[name])||{};
    return {model:'auto',prompt:pre.prompt||'',outformat:pre.outformat||'',temperature:0.7};
  }
  var def=type==='ac'?getConnectorConfig(name)
         :type==='tr'?(typeof TRIGGER_CONFIGS!=='undefined'?TRIGGER_CONFIGS[name]:null)
         :type==='gr'?getGuardrailConfig(name)
         :(typeof LOGIC_CONFIGS!=='undefined'?LOGIC_CONFIGS[name]:null);
  var cfg={};
  if(!def||!def.fields)return cfg;
  var req=def.fields.filter(function(f){return f.req});
  // I connettori non ancora annotati seguono la regola storica del primo campo.
  if(!req.length&&type==='ac'&&def.fields[0])req=[def.fields[0]];
  // Oltre ai campi obbligatori si precompilano TUTTE le tendine: un elenco
  // chiuso lasciato su "— seleziona —" è un valore mancante travestito, e su
  // parametri come porta o cifratura è proprio quello che fa fallire una
  // connessione. Il testo libero resta invece vuoto, con il suo suggerimento.
  var daRiempire=req.concat(def.fields.filter(function(f){
    return f.opts && req.indexOf(f) < 0;
  }));
  daRiempire.forEach(function(f){
    // Per una tendina si sceglie l'opzione suggerita, se esiste fra quelle
    // valide; per un campo libero il suggerimento è già un valore sensato.
    cfg[f.k]=f.opts?((f.ph&&f.opts.indexOf(f.ph)>=0)?f.ph:f.opts[0]):(f.ph||'');
  });
  // La porta è un campo libero ma senza di essa la connessione non parte:
  // vale il suggerimento, che è la porta standard del servizio.
  if(!cfg.port){
    var fp=def.fields.filter(function(f){return f.k==='port'})[0];
    if(fp)cfg.port=fp.ph||'';
  }
  // Il nome del file prende quello del nodo: "risultato-esecuzione" su tre
  // export diversi produrrebbe tre file indistinguibili.
  if(cfg.filename)cfg.filename=String(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return cfg;
}

function b_addEdge(fromId,fromPort,toId,toPort,label){
  B.edges.push({from:fromId,fp:fromPort,to:toId,tp:toPort,label:label||''});
  clearInvalidNodes();
}


function b_render(){
  var canvas=document.getElementById('builderCanvas');
  var svg=document.getElementById('edgeSvg');
  if(!canvas||!svg)return;
  if(typeof scheduleAutosave==='function')scheduleAutosave();
  canvas.style.transform='translate('+B.panX+'px,'+B.panY+'px) scale('+B.zoom+')';
  canvas.style.transformOrigin='0 0';

  // Render nodes
  var colors={tr:{bg:'#FEF3C7',border:'#F59E0B',text:'TRIGGER'},ai:{bg:'#EDE9FE',border:'#6366F1',text:'AI'},ac:{bg:'#D1FAE5',border:'#10B981',text:'ACTION'},cd:{bg:'#FEE2E2',border:'#EF4444',text:'CONDITION'},ou:{bg:'#F1F5F9',border:'#64748B',text:'OUTPUT'},gr:{bg:'#FAE8FF',border:'#D946EF',text:'CONTROLLO'},sa:{bg:'#CFFAFE',border:'#0891B2',text:'AGENTE'}};
  canvas.innerHTML=B.nodes.map(function(n){
    var c=colors[n.type]||colors.ou;
    var isInvalid=B._invalidIds&&B._invalidIds[n.id];
    var locked=n.locked?' policy-locked':'';
    var sel=(isNodeSelected(n.id)?' selected':'')+(n._execState==='executing'?' executing':n._execState==='done'?' exec-done':n._execState==='err'?' exec-err':n._execState==='skipped'?' exec-skipped':n._execState==='waiting'?' exec-waiting':'')+(isInvalid?' invalid':'')+locked;
    var ports='<div class="b-port b-port-in" data-nid="'+n.id+'" data-port="in"></div>';
    if(n.type==='cd'){
      ports+='<div class="b-port b-port-true" data-nid="'+n.id+'" data-port="true" title="True"></div>';
      ports+='<div class="b-port b-port-false" data-nid="'+n.id+'" data-port="false" title="False"></div>';
    }else{
      ports+='<div class="b-port b-port-out" data-nid="'+n.id+'" data-port="out"></div>';
    }
    var titolo=n.escluso?'Nodo escluso dall\'esecuzione: verrà saltato, il flusso passa oltre'
              :isInvalid?'Nodo non valido: apri i dettagli errore'
              :(n.locked?'Controllo imposto da politica organizzativa: configurabile ma non rimovibile':'');
    // Un nodo escluso deve essere riconoscibile a colpo d'occhio: resta al suo
    // posto, con le sue connessioni, ma smorzato — come una riga commentata.
    if(n.escluso)sel+=' escluso';
    return '<div class="b-node'+sel+'" id="node-'+n.id+'" data-nid="'+n.id+'" style="left:'+n.x+'px;top:'+n.y+'px" onmousedown="onNodeDown(event,'+n.id+')" title="'+titolo+'">'+
      (n.escluso?'<div class="b-node-escluso-badge" title="Escluso dall\'esecuzione">🚫</div>':'')+
      (isInvalid&&!n.escluso?'<div class="b-node-invalid-badge">!</div>':'')+
      (n.locked?'<div class="b-node-lock-badge" title="Imposto da politica">🔒</div>':'')+
      '<div class="b-node-head" style="background:'+c.bg+';color:'+c.border+'"><span>'+n.icon+'</span><span>'+escHtml(n.name)+'</span><span class="badge" style="margin-left:auto;background:'+c.border+'20;color:'+c.border+';font-size:9px">'+c.text+'</span></div>'+
      '<div class="b-node-body">'+escHtml(n.detail)+'</div>'+
      ports+'</div>';
  }).join('');

  // Render edges — posizioni reali dai port DOM (allineamento perfetto a ogni zoom/larghezza)
  var caRect=document.getElementById('canvasArea').getBoundingClientRect();
  // getBoundingClientRect forza un reflow: più archi che condividono lo
  // stesso nodo (es. due frecce dallo stesso output) richiedevano prima lo
  // stesso calcolo di layout più volte nello stesso render. Un cache per
  // singola chiamata di b_render() lo riduce a una volta per porta.
  var _portPosCache={};
  function portPos(nid,port){
    var cacheKey=nid+':'+port;
    if(_portPosCache[cacheKey]!==undefined)return _portPosCache[cacheKey];
    var el=canvas.querySelector('.b-port[data-nid="'+nid+'"][data-port="'+port+'"]');
    if(!el){
      // fallback: out/in generici
      el=canvas.querySelector('.b-port[data-nid="'+nid+'"][data-port="'+(port==='in'?'in':'out')+'"]')||
         canvas.querySelector('.b-port[data-nid="'+nid+'"]');
    }
    var pos=null;
    if(el){
      var r=el.getBoundingClientRect();
      pos={x:r.left+r.width/2-caRect.left,y:r.top+r.height/2-caRect.top};
    }
    _portPosCache[cacheKey]=pos;
    return pos;
  }
  var svgHtml='<defs>'+
    '<marker id="ah-gray" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0.5 L8,4.5 L0,8.5 Z" fill="#94A3B8"/></marker>'+
    '<marker id="ah-green" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0.5 L8,4.5 L0,8.5 Z" fill="#10B981"/></marker>'+
    '<marker id="ah-red" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0.5 L8,4.5 L0,8.5 Z" fill="#EF4444"/></marker>'+
    '<marker id="ah-sel" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0.5 L8,4.5 L0,8.5 Z" fill="#F59E0B"/></marker>'+
  '</defs>';
  B.edges.forEach(function(e,eIdx){
    var p1=portPos(e.from,e.fp);
    var p2=portPos(e.to,e.tp||'in');
    if(!p1||!p2)return;
    var x1=p1.x,y1=p1.y,x2=p2.x,y2=p2.y;
    var isSel=B.selEdgeIdx===eIdx;
    var baseColor=e.fp==='true'?'#10B981':e.fp==='false'?'#EF4444':'#94A3B8';
    var color=isSel?'#F59E0B':baseColor;
    var marker=isSel?'ah-sel':(e.fp==='true'?'ah-green':e.fp==='false'?'ah-red':'ah-gray');
    // La curva esce dalla porta nella direzione del flusso: verso il basso se
    // il flusso è verticale, verso destra se è orizzontale. Uscire nella
    // direzione sbagliata produce cappi che attraversano i nodi.
    var pathD=bCurva(x1,y1,x2,y2);
    // Alone sotto la freccia selezionata: su archi corti fra nodi vicini il
    // solo cambio di colore era troppo poco per accorgersi di quale fosse
    // selezionata.
    if(isSel){
      svgHtml+='<path d="'+pathD+'" fill="none" stroke="#F59E0B" stroke-width="11" stroke-linecap="round" opacity="0.22"/>';
    }
    // Niente filtro sull'ombra: la sua regione era espressa in percentuale del
    // riquadro del tracciato, e una freccia perfettamente verticale ha riquadro
    // di larghezza zero — quindi regione zero, e la freccia spariva finché non
    // la si spostava di lato. L'effetto di rilievo si ottiene con un tratto
    // chiaro appena più spesso disegnato sotto, che non dipende dal riquadro.
    svgHtml+='<path d="'+pathD+'" fill="none" stroke="#FFFFFF" stroke-width="'+(isSel?5.4:4.2)+'" stroke-linecap="round" opacity="0.55"/>';
    svgHtml+='<path d="'+pathD+'" fill="none" stroke="'+color+'" stroke-width="'+(isSel?3.4:2.2)+'" marker-end="url(#'+marker+')" stroke-linecap="round"'+(isSel?' stroke-dasharray="7 4"':'')+'/>';
    // Click = seleziona ed evidenzia; l'eliminazione avviene poi dalla ✕
    // sulla freccia, dal tasto Canc o dal pannello. Eliminare al primo click
    // rendeva troppo facile perdere un collegamento per sbaglio.
    svgHtml+='<path d="'+pathD+'" fill="none" stroke="transparent" stroke-width="16" style="pointer-events:stroke;cursor:pointer" onclick="selectEdge('+eIdx+')" ondblclick="deleteEdge('+eIdx+')" title="Click per selezionare · doppio click o ✕ per eliminare · trascina i pallini per ricollegare"/>';
    var mx=(x1+x2)/2, my=(y1+y2)/2;
    if(e.label){
      // L'etichetta puo' stare su piu' righe: si spezza sugli a capo e ogni
      // riga diventa un tspan, con il riquadro alto quanto serve. Il testo
      // passa da escHtml, perche' finisce dentro l'SVG cosi' com'e'.
      var righe=String(e.label).split('\n').slice(0,3);
      var piuLunga=righe.reduce(function(m,r){return Math.max(m,r.length)},0);
      var lw=piuLunga*6.6+16, lh=righe.length*13+6;
      svgHtml+='<rect x="'+(mx-lw/2)+'" y="'+(my-lh/2)+'" width="'+lw+'" height="'+lh+'" rx="9" fill="white" stroke="'+color+'" stroke-width="1.2"/>';
      svgHtml+='<text x="'+mx+'" y="'+(my-lh/2+13)+'" text-anchor="middle" fill="'+color+'" font-size="10.5" font-weight="700" font-family="Inter,sans-serif">'+
        righe.map(function(r,k){return '<tspan x="'+mx+'"'+(k?' dy="13"':'')+'>'+escHtml(r)+'</tspan>'}).join('')+'</text>';
    }
    // Sulla freccia selezionata compare la ✕ per eliminarla: l'affordance
    // dev'essere immediata e visibile, altrimenti "seleziona poi cancella"
    // diventa un passaggio in più senza indicazioni.
    if(isSel){
      var dbx=mx,dby=e.label?my-14-String(e.label).split('\n').slice(0,3).length*7:my;
      svgHtml+='<g style="cursor:pointer" onclick="deleteEdge('+eIdx+')">'+
        '<circle cx="'+dbx+'" cy="'+dby+'" r="11" fill="#EF4444" stroke="white" stroke-width="2"/>'+
        '<line x1="'+(dbx-4.5)+'" y1="'+(dby-4.5)+'" x2="'+(dbx+4.5)+'" y2="'+(dby+4.5)+'" stroke="white" stroke-width="2.2" stroke-linecap="round"/>'+
        '<line x1="'+(dbx-4.5)+'" y1="'+(dby+4.5)+'" x2="'+(dbx+4.5)+'" y2="'+(dby-4.5)+'" stroke="white" stroke-width="2.2" stroke-linecap="round"/>'+
        '<title>Elimina questa connessione</title></g>';
    }
    // Maniglie di ri-aggancio: sempre presenti (non solo da selezionata) —
    // trascinandone una su un'altra porta, la freccia si ricollega lì
    // invece di dover eliminare e ridisegnare da capo.
    if(!(B.reconnect&&B.reconnect.edgeIdx===eIdx&&B.reconnect.end==='from'))
      svgHtml+='<circle cx="'+x1+'" cy="'+y1+'" r="6" fill="white" stroke="'+color+'" stroke-width="2" opacity="0.65" style="cursor:grab" onmousedown="startReconnect(event,'+eIdx+',\'from\')"><title>Trascina per ricollegare la partenza</title></circle>';
    if(!(B.reconnect&&B.reconnect.edgeIdx===eIdx&&B.reconnect.end==='to'))
      svgHtml+='<circle cx="'+x2+'" cy="'+y2+'" r="6" fill="white" stroke="'+color+'" stroke-width="2" opacity="0.65" style="cursor:grab" onmousedown="startReconnect(event,'+eIdx+',\'to\')"><title>Trascina per ricollegare l\'arrivo</title></circle>';
  });
  // Anteprima connessione in corso (nuova freccia dalla palette porte)
  if(B.conn&&B.connMouse){
    var pf=portPos(B.conn.from,B.conn.port);
    if(pf){
      var mx2=B.connMouse.x, my2=B.connMouse.y;
      var dyp=Math.max(40,Math.abs(my2-pf.y)*0.5);
      svgHtml+='<path d="'+bCurva(pf.x,pf.y,mx2,my2)+'" fill="none" stroke="#6366F1" stroke-width="2.5" stroke-dasharray="6 4" opacity="0.7"/>';
      svgHtml+='<circle cx="'+mx2+'" cy="'+my2+'" r="5" fill="#6366F1" opacity="0.7"/>';
    }
  }
  // Anteprima ri-aggancio di una freccia esistente: l'estremo fisso resta
  // ancorato al suo nodo, l'altro estremo segue il mouse fino al rilascio.
  if(B.reconnect&&B.connMouse){
    var re=B.edges[B.reconnect.edgeIdx];
    if(re){
      var fixedPos=B.reconnect.end==='from'?portPos(re.to,re.tp||'in'):portPos(re.from,re.fp);
      if(fixedPos){
        var rmx=B.connMouse.x, rmy=B.connMouse.y;
        var rdy=Math.max(40,Math.abs(rmy-fixedPos.y)*0.5);
        svgHtml+='<path d="'+bCurva(fixedPos.x,fixedPos.y,rmx,rmy)+'" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-dasharray="6 4" opacity="0.8"/>';
        svgHtml+='<circle cx="'+rmx+'" cy="'+rmy+'" r="5" fill="#F59E0B" opacity="0.8"/>';
      }
    }
  }
  svg.innerHTML=svgHtml;

  // Update props
  if(B.selId>0) renderProps(B.selId);
  // Chat builder mode hint
  var provReady=typeof anyProviderReady==='function'?anyProviderReady():null;
  var hint=document.getElementById('chatBuilderHint');
  if(hint){
    var selNode=B.selId>0?B.nodes.find(function(n){return n.id===B.selId}):null;
    var modeTxt=selNode?'🎯 Modalità <strong>modifica singolo nodo</strong>: stai modificando solo "'+escHtml(selNode.name)+'" (deseleziona per modificare tutto il workflow)':
      B.nodes.length>0?'✏️ Modalità <strong>modifica workflow</strong>: es: "aggiungi una notifica Slack", oppure scrivi "da zero" per ricominciare':
      '✨ Modalità <strong>creazione</strong>: descrivi l\'agente che vuoi costruire';
    // La chat è AI-only: senza provider non si annuncia una modalità che non
    // è disponibile, si dice cosa manca.
    hint.innerHTML=provReady
      ? modeTxt+' · <span style="color:var(--ac)">AI attiva ('+providerLabel(provReady)+')</span>'
      : '🔌 <strong>Builder conversazionale disattivato</strong>, configura un provider AI nel pannello a sinistra. Il canvas resta utilizzabile trascinando i nodi dalla palette.';
  }
  // Esempi cliccabili. A canvas vuoto sono spunti di partenza; a canvas
  // popolato diventano completamenti letti dal grafo reale (G6).
  var chatSugg=document.getElementById('chatSuggestions');
  if(chatSugg){
    // I suggerimenti restano visibili e cliccabili anche senza provider: sono
    // il modo in cui si capisce cosa sa fare la chat. Senza chiave il click
    // non genera nulla e lo dice, invece di lasciare la barra muta e vuota.
    var examples=typeof ccContextualSuggestions==='function'?ccContextualSuggestions():[];
    var iconaSugg=B.nodes.length===0?'💡':'🔧';
    chatSugg.innerHTML=examples.map(function(ex,exIdx){
      // Lo stile vive nel foglio di stile (.chat-sugg): qui resta solo cio' che
      // dipende dallo stato, cioe' l'attenuazione quando non c'e' un provider.
      return '<span class="chip" onclick="useChatSuggestion('+exIdx+')" title="'+escHtml(ex.request||ex.label||ex)+'"'+
        (provReady?'':' style="opacity:.75"')+'><span class="ic">'+iconaSugg+'</span>'+escHtml(ex.label||ex)+'</span>';
    }).join('');
    window._chatSuggestionExamples=examples;
    // La sfumatura in basso compare solo quando c'e' davvero altro da vedere:
    // mostrarla sempre suggerirebbe contenuto inesistente.
    var wrap=document.getElementById('chatSuggWrap');
    if(wrap)wrap.classList.toggle('scorrevole',chatSugg.scrollHeight>chatSugg.clientHeight+2);
  }
  if(typeof updateChatBuilderGate==='function')updateChatBuilderGate();
  if(typeof renderComposeHistory==='function')renderComposeHistory();
  var dot=document.getElementById('chatAIStatusDot');
  if(dot)dot.style.background=provReady?'#10B981':aiConfig.status==='err'?'#EF4444':'var(--tx4)';
  if(typeof updateSuggestionBadge==='function')updateSuggestionBadge();
  // Il titolo segue il flusso: nome, numero di nodi e stato di salvataggio
  // cambiano a ogni modifica, e sono l'unica conferma visibile di quale
  // agente si sta toccando.
  if(typeof aggiornaTitoloBuilder==='function')aggiornaTitoloBuilder();
}


function startReconnect(e,edgeIdx,end){
  e.stopPropagation();e.preventDefault();
  B.reconnect={edgeIdx:edgeIdx,end:end};
  var caR=document.getElementById('canvasArea').getBoundingClientRect();
  B.connMouse={x:e.clientX-caR.left,y:e.clientY-caR.top};
  b_render();
}

// Il suggerimento SCRIVE nella barra e basta: la generazione parte quando
// l'utente preme Genera. Prima partiva da sola al click, quindi il testo non
// era né leggibile né modificabile prima di essere inviato al modello.
function useChatSuggestion(idx){
  var ex=(window._chatSuggestionExamples||[])[idx];if(!ex)return;
  // Al modello va l'istruzione operativa, non la diagnosi mostrata sul chip.
  var testo=ex.request||ex.label||ex;
  var input=document.getElementById('chatBuilderInput');
  if(!input)return;

  // Senza provider il campo è disabilitato: si scrive lo stesso il testo (così
  // resta pronto per quando la chiave ci sarà) e si indica cosa manca.
  if(typeof anyProviderReady==='function'&&!anyProviderReady()){
    input.value=testo; if(typeof adattaAltezza==='function')adattaAltezza(input);
    showToast('🔌 Testo inserito, ma manca un provider AI: apri il pannello <strong>Integrazione AI</strong> a sinistra, inserisci una API key e premi Testa.');
    var panel=document.querySelector('.ai-panel');
    if(panel){
      panel.scrollIntoView({behavior:'smooth',block:'nearest'});
      // Lampeggio breve: il pannello è in fondo alla colonna e senza un
      // richiamo visivo l'utente non lo trova.
      panel.style.transition='box-shadow .25s';
      panel.style.boxShadow='0 0 0 3px rgba(99,102,241,.55)';
      setTimeout(function(){panel.style.boxShadow=''},1600);
    }
    return;
  }
  input.value=testo; if(typeof adattaAltezza==='function')adattaAltezza(input);
  input.focus();
  // Il cursore va in fondo: il testo è una bozza da poter rifinire.
  try{input.setSelectionRange(testo.length,testo.length)}catch(e){}
  showToast('✍️ Inserito nella barra: modifica se serve, poi premi <strong>Genera</strong>');
}

function onNodeDown(e,nid){
  if(e.target.classList.contains('b-port')){
    // Start connection
    B.conn={from:nid,port:e.target.dataset.port};
    e.stopPropagation();return;
  }
  var inGruppo=B.selIds&&B.selIds.indexOf(nid)>=0;
  // Con Ctrl/Cmd si aggiunge o si toglie un nodo dalla selezione, senza
  // dover rifare il riquadro da capo.
  if(e.ctrlKey||e.metaKey){
    if(!B.selIds)B.selIds=[];
    if(B.selId>0&&B.selIds.indexOf(B.selId)<0){B.selIds.push(B.selId);B.selId=-1}
    var pos=B.selIds.indexOf(nid);
    if(pos>=0)B.selIds.splice(pos,1); else B.selIds.push(nid);
    e.stopPropagation();b_render();renderProps(-1);return;
  }
  // Premere su un nodo GIÀ nel gruppo non azzera la selezione: si trascina
  // l'insieme. Premere su un nodo fuori dal gruppo la sostituisce.
  if(!inGruppo){B.selIds=[];B.selId=nid}
  B.selEdgeIdx=-1;
  B.drag={nid:nid,ox:e.clientX,oy:e.clientY,node:B.nodes.find(function(n){return n.id===nid})};
  B.drag.sx=B.drag.node.x;B.drag.sy=B.drag.node.y;
  if(inGruppo){
    B.drag.gruppo=B.selIds.map(function(id){
      var nn=B.nodes.find(function(x){return x.id===id});
      return nn?{node:nn,sx:nn.x,sy:nn.y}:null;
    }).filter(Boolean);
  }
  e.stopPropagation();
  b_render();
  renderProps(inGruppo?-1:nid);
}

function onCanvasMouseDown(e){
  if(e.target.closest('.b-node'))return;
  if(e.target.closest('.canvas-controls'))return;
  if(e.target.closest('.exec-log'))return;
  // La barra chat e i suoi suggerimenti stanno DENTRO l'area canvas: senza
  // questa esclusione il mousedown su un chip chiamava b_render(), che
  // ricostruisce l'elenco dei suggerimenti — l'elemento cliccato spariva
  // prima che il browser potesse emettere il `click`, e il suggerimento
  // risultava non cliccabile. Stessa causa del bug delle frecce.
  if(e.target.closest('.chat-builder'))return;
  // Trascinando sul canvas vuoto si SELEZIONA (riquadro), non si sposta la
  // vista. Lo spostamento resta disponibile col tasto centrale o con
  // Shift+trascinamento: la selezione multipla è l'operazione frequente,
  // il pan quella occasionale.
  // Ctrl (o Cmd) tenuto premuto significa "sposta la vista", non "seleziona":
  // il riquadro di selezione catturava anche quel gesto e il pan era diventato
  // irraggiungibile. Restano tre modi per spostarsi: Ctrl, Shift, tasto centrale.
  if(!e.shiftKey&&!e.ctrlKey&&!e.metaKey&&e.button===0&&!e.target.ownerSVGElement&&e.target.id!=='edgeSvg'){
    var caR0=document.getElementById('canvasArea').getBoundingClientRect();
    B.selId=-1;B.selEdgeIdx=-1;B.selIds=[];
    B.marquee={x0:e.clientX-caR0.left,y0:e.clientY-caR0.top,x1:e.clientX-caR0.left,y1:e.clientY-caR0.top,moved:false};
    renderProps(-1);
    b_render();
    return;
  }
  // Un click su una freccia (o sulle sue maniglie) NON è un click sul
  // canvas vuoto. Senza questa esclusione il mousedown deselezionava la
  // connessione, avviava il trascinamento della vista e soprattutto
  // chiamava b_render(): l'elemento SVG veniva sostituito prima che il
  // browser potesse emettere il `click`, che quindi non arrivava mai —
  // le frecce risultavano non selezionabili.
  if(e.target.ownerSVGElement||e.target.id==='edgeSvg')return;
  B.selId=-1;B.selEdgeIdx=-1;
  B.panDrag={ox:e.clientX,oy:e.clientY,sx:B.panX,sy:B.panY};
  renderProps(-1);
  b_render();
}

// b_render() ricostruisce l'HTML dell'intero canvas e ricalcola le
// coordinate SVG di ogni freccia (con getBoundingClientRect per porta —
// forza un reflow del layout). mousemove può scattare molto più spesso di
// quanto lo schermo possa disegnare (anche >100 volte/sec durante un drag
// veloce): chiamare b_render() ad ogni evento sprecava lavoro ripetendo lo
// stesso reflow più volte per frame. Ora lo stato si aggiorna subito (calcolo
// numerico, economico) ma il render effettivo è raggruppato a un massimo di
// una volta per frame video con requestAnimationFrame.
var _renderFramePending=false;
function requestRenderFrame(){
  if(_renderFramePending)return;
  _renderFramePending=true;
  requestAnimationFrame(function(){_renderFramePending=false;b_render()});
}

function onCanvasMouseMove(e){
  if(B.conn||B.reconnect){
    var caR=document.getElementById('canvasArea').getBoundingClientRect();
    B.connMouse={x:e.clientX-caR.left,y:e.clientY-caR.top};
    requestRenderFrame();
  }
  if(B.marquee){
    var caM=document.getElementById('canvasArea').getBoundingClientRect();
    B.marquee.x1=e.clientX-caM.left;B.marquee.y1=e.clientY-caM.top;
    if(Math.abs(B.marquee.x1-B.marquee.x0)>3||Math.abs(B.marquee.y1-B.marquee.y0)>3)B.marquee.moved=true;
    drawMarquee();
  }
  if(B.drag){
    var n=B.drag.node;
    var nx=Math.round((B.drag.sx+(e.clientX-B.drag.ox)/B.zoom)/12)*12;
    var ny=Math.round((B.drag.sy+(e.clientY-B.drag.oy)/B.zoom)/12)*12;
    // Se il nodo trascinato fa parte di una selezione multipla, si muove
    // tutto il gruppo: spostarne uno solo scomporrebbe ciò che l'utente ha
    // appena selezionato proprio per trattarlo insieme.
    if(B.drag.gruppo&&B.drag.gruppo.length){
      var dx=nx-B.drag.sx, dy=ny-B.drag.sy;
      B.drag.gruppo.forEach(function(g){g.node.x=g.sx+dx;g.node.y=g.sy+dy});
    }else{
      n.x=nx;n.y=ny;
    }
    requestRenderFrame();
  }
  if(B.panDrag){
    B.panX=B.panDrag.sx+(e.clientX-B.panDrag.ox);
    B.panY=B.panDrag.sy+(e.clientY-B.panDrag.oy);
    requestRenderFrame();
  }
}

function onCanvasMouseUp(e){
  // Questo handler è su document (serve per rilasciare drag/pan/connessione
  // anche fuori dal canvas). Prima ri-renderizzava SEMPRE, anche per un
  // mouseup che non c'entrava nulla col canvas — es. il rilascio del click
  // sul pulsante "Elimina"/"Duplica" nel pannello proprietà, o su una
  // freccia SVG. Il re-render ricostruisce l'HTML di quell'elemento PRIMA
  // che l'evento "click" (che scatta dopo mouseup) venga consegnato: il
  // bottone/la freccia su cui si era premuto il mouse spariva dal DOM e il
  // click andava perso nel vuoto — bottoni "morti" senza errori in console.
  var wasActive=!!(B.drag||B.conn||B.reconnect||B.panDrag||B.marquee);
  if(B.marquee){
    if(B.marquee.moved)applyMarqueeSelection();
    B.marquee=null;
    var mEl=document.getElementById('marqueeBox');if(mEl)mEl.remove();
  }
  if(B.conn&&e.target.classList&&e.target.classList.contains('b-port')){
    var toId=parseInt(e.target.dataset.nid);
    var toPort=e.target.dataset.port;
    if(toId!==B.conn.from){
      pushUndo('nuova connessione');
      b_addEdge(B.conn.from,B.conn.port,toId,toPort,'');
    }
  }
  if(B.reconnect&&e.target.classList&&e.target.classList.contains('b-port')){
    var re=B.edges[B.reconnect.edgeIdx];
    var newNid=parseInt(e.target.dataset.nid);
    var newPort=e.target.dataset.port;
    if(re){
      if(B.reconnect.end==='to'){
        if(newNid!==re.from){pushUndo('riaggancio connessione');re.to=newNid;re.tp=newPort;clearInvalidNodes();showToast('🔗 Connessione ricollegata')}
      }else{
        if(newNid!==re.to){pushUndo('riaggancio connessione');re.from=newNid;re.fp=newPort;clearInvalidNodes();showToast('🔗 Connessione ricollegata')}
      }
    }
  }
  B.drag=null;B.conn=null;B.connMouse=null;B.panDrag=null;B.reconnect=null;
  if(wasActive)b_render();
}

// Applica un nuovo livello di zoom tenendo FERMO un punto dello schermo.
// Senza ancoraggio l'ingrandimento avviene rispetto all'angolo in alto a
// sinistra: il nodo che si sta guardando scivola via e bisogna inseguirlo
// trascinando. Con l'ancoraggio il punto sotto il puntatore resta dov'è.
function bApplicaZoom(nuovo,ancoraX,ancoraY){
  nuovo=Math.max(0.25,Math.min(3,nuovo));
  if(ancoraX!=null){
    // Coordinate del punto nel sistema del canvas, invariate per definizione:
    // si ricalcola il pan perché tornino sullo stesso punto dello schermo.
    var cx=(ancoraX-B.panX)/B.zoom, cy=(ancoraY-B.panY)/B.zoom;
    B.panX=ancoraX-cx*nuovo;
    B.panY=ancoraY-cy*nuovo;
  }
  B.zoom=nuovo;
  bAggiornaEtichettaZoom();
  b_render();
}

function bAggiornaEtichettaZoom(){
  var zl=document.getElementById('zoomLabel');
  if(zl)zl.textContent=Math.round(B.zoom*100)+'%';
}

// Un pannello che scorre dentro il canvas si prende la rotella. Il registro
// esecuzione vive dentro `canvasArea`, quindi l'evento risaliva fin qui: chi
// aveva il puntatore sul registro e girava la rotella per leggere le voci piu'
// vecchie si vedeva ingrandire il canvas sotto, e il registro fermo. Prima di
// zoomare si guarda da dove arriva l'evento: se sta dentro un contenitore che
// puo' scorrere davvero (contenuto piu' alto dello spazio disponibile), la
// rotella e' sua e noi non facciamo niente, nemmeno preventDefault, cosi' il
// browser la fa scorrere come su qualunque altra pagina.
function bRotellaAppartieneAUnPannello(e){
  var ca=document.getElementById('canvasArea');
  var n=e.target;
  while(n&&n!==ca&&n.nodeType===1){
    var st=window.getComputedStyle(n);
    var scorre=/(auto|scroll)/.test(st.overflowY);
    if(scorre&&n.scrollHeight>n.clientHeight+1)return true;
    n=n.parentNode;
  }
  return false;
}

function onCanvasWheel(e){
  if(bRotellaAppartieneAUnPannello(e))return;
  e.preventDefault();
  var ca=document.getElementById('canvasArea');
  var r=ca?ca.getBoundingClientRect():{left:0,top:0};
  // Passo moltiplicativo: a incrementi fissi un +0,08 vale il 32% quando si è
  // al 25% e il 2,7% quando si è al 300%, e la rotella sembra rotta agli
  // estremi. In proporzione il passo è invece uniforme.
  var fattore=e.deltaY>0?1/1.1:1.1;
  bApplicaZoom(B.zoom*fattore,e.clientX-r.left,e.clientY-r.top);
}

// I pulsanti +/− non hanno un puntatore a cui ancorarsi: si usa il centro
// dell'area visibile, che è ciò che l'utente sta guardando.
function bZoom(dir){
  var ca=document.getElementById('canvasArea');
  var cx=ca?ca.clientWidth/2:0, cy=ca?ca.clientHeight/2:0;
  bApplicaZoom(B.zoom*(dir>0?1.15:1/1.15),cx,cy);
}

// Reset vista: torna al 100% E riporta il flusso in vista. Prima impostava
// pan 0,0 alla cieca — con un flusso più alto della finestra (i flussi di
// riferimento arrivano a 890px) il risultato era un workflow tagliato, che è
// esattamente ciò da cui ci si aspetta che il Reset tiri fuori.
function bResetView(){
  B.zoom=1;
  var ca=document.getElementById('canvasArea');
  if(!B.nodes.length||!ca){B.panX=0;B.panY=0;bAggiornaEtichettaZoom();b_render();return}

  var b=bBoundsNodi();
  var pad=40, alto=pad+ingombroChat();
  // Se al 100% il flusso non ci sta, il Reset da solo non basta: si adatta,
  // perché "vedere il proprio flusso" conta più di restare a un numero tondo.
  if(b.w+pad*2>ca.clientWidth||b.h+alto+pad>ca.clientHeight){bFitView();return}
  B.panX=pad-b.minX+(ca.clientWidth-pad*2-b.w)/2;
  B.panY=alto-b.minY;
  bAggiornaEtichettaZoom();
  b_render();
}

// La barra della chat galleggia sopra il canvas: se la vista non le lascia
// spazio, i primi nodi del flusso finiscono nascosti sotto (ed è proprio dove
// sta il trigger, cioè l'inizio di tutto). Si misura l'ingombro reale invece di
// cablare un numero, così resta giusto anche quando compaiono i suggerimenti.
function ingombroChat(){
  var cb=document.querySelector('.chat-builder');
  var ca=document.getElementById('canvasArea');
  if(!cb||!ca||getComputedStyle(cb).display==='none')return 0;
  var b=cb.getBoundingClientRect(), a=ca.getBoundingClientRect();
  // Da quando la chat vive in una fascia propria sopra il canvas non c'è più
  // nulla da compensare. Si misura la sovrapposizione reale invece di darla
  // per scontata: se un domani la barra tornasse a galleggiare, il calcolo
  // continuerebbe a funzionare senza doverlo ricordare.
  var sovrapposizione=Math.min(b.bottom,a.bottom)-Math.max(b.top,a.top);
  return sovrapposizione>0?Math.round(sovrapposizione)+24:0;
}

function bBoundsNodi(){
  var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  B.nodes.forEach(function(n){
    minX=Math.min(minX,n.x);minY=Math.min(minY,n.y);
    maxX=Math.max(maxX,n.x+180);maxY=Math.max(maxY,n.y+80);
  });
  return {minX:minX,minY:minY,maxX:maxX,maxY:maxY,w:maxX-minX,h:maxY-minY};
}

// Dispone i nodi seguendo il grafo, non l'ordine in cui sono stati creati:
// si parte dai trigger e si assegna a ogni nodo il livello del suo predecessore
// più uno. I nodi dello stesso livello stanno affiancati. Prima venivano
// incolonnati nell'ordine dell'array, e su un flusso con diramazioni le frecce
// si incrociavano tutte.
function bAutoLayout(){
  if(!B.nodes.length){showToast('Nessun nodo da disporre');return}
  pushUndo('riordino automatico');

  var livello={}, coda=[];
  B.nodes.filter(function(n){return n.type==='tr'}).forEach(function(n){ livello[n.id]=0; coda.push(n.id) });
  // Nessun trigger: si parte da chi non ha frecce in ingresso, così il riordino
  // funziona anche su un flusso incompleto in costruzione.
  if(!coda.length){
    B.nodes.filter(function(n){return !B.edges.some(function(e){return e.to===n.id})})
      .forEach(function(n){ livello[n.id]=0; coda.push(n.id) });
  }
  if(!coda.length){ livello[B.nodes[0].id]=0; coda.push(B.nodes[0].id) }

  var guardia=0;
  while(coda.length && guardia++ < 500){
    var cur=coda.shift();
    B.edges.filter(function(e){return e.from===cur}).forEach(function(e){
      var prossimo=livello[cur]+1;
      if(livello[e.to]===undefined || livello[e.to]<prossimo){
        livello[e.to]=prossimo; coda.push(e.to);
      }
    });
  }
  // I nodi scollegati vanno comunque in fondo, non lasciati dove capita.
  var maxLiv=Math.max.apply(null,Object.keys(livello).map(function(k){return livello[k]}).concat([0]));
  B.nodes.forEach(function(n){ if(livello[n.id]===undefined) livello[n.id]=maxLiv+1 });

  var perLivello={};
  B.nodes.forEach(function(n){ (perLivello[livello[n.id]]=perLivello[livello[n.id]]||[]).push(n) });

  var passoAvanti = orizzontale() ? 300 : 150;   // lungo la direzione del flusso
  var passoLato   = orizzontale() ? 150 : 240;   // fra nodi dello stesso livello
  Object.keys(perLivello).forEach(function(l){
    var gruppo=perLivello[l];
    var avanti=60+(+l)*passoAvanti;
    // Centrati rispetto alla colonna/riga: un livello con tre rami resta
    // simmetrico rispetto al nodo da cui si diramano.
    // Il margine minimo va applicato all'INIZIO DEL GRUPPO, non a ogni nodo:
    // vincolando il singolo, il primo fratello veniva spinto a 20 mentre il
    // secondo restava al suo posto, e la distanza fra i due si riduceva sotto
    // la larghezza di un nodo — due schede sovrapposte proprio sulla
    // diramazione, cioe' dove il flusso va letto con piu' attenzione.
    var inizio=Math.max(20, 60-((gruppo.length-1)*passoLato)/2);
    gruppo.forEach(function(n,i){
      if(orizzontale()){ n.x=avanti; n.y=inizio+i*passoLato }
      else             { n.y=avanti; n.x=inizio+i*passoLato }
    });
  });

  clearInvalidNodes();
  b_render();
  bResetView();
  showToast('⊞ Flusso riordinato '+(orizzontale()?'in orizzontale':'in verticale'));
}


function onPaletteDrag(e,type,icon,name,desc){
  e.dataTransfer.setData('text/plain',JSON.stringify({type:type,icon:icon,name:name,desc:desc}));
}

function onCanvasDrop(e){
  B.effimero=false;
  e.preventDefault();
  try{
    var d=JSON.parse(e.dataTransfer.getData('text/plain'));
    var rect=document.getElementById('canvasArea').getBoundingClientRect();
    var x=(e.clientX-rect.left-B.panX)/B.zoom;
    var y=(e.clientY-rect.top-B.panY)/B.zoom;
    pushUndo('aggiunta "'+d.name+'"');
    b_addNode(d.type,d.icon,d.name,d.desc,x,y);
    b_render();
    showToast('➕ Nodo "'+d.name+'" aggiunto');
    addAct('Aggiunto nodo: '+d.name);
    // Aggiungere un nodo AI o un'azione può far scattare una politica:
    // il controllo va inserito subito, non al salvataggio.
    if(typeof applyPoliciesToCanvas==='function')applyPoliciesToCanvas();
  }catch(ex){}
}


function renderProps(nid){
  var body=document.getElementById('propsBody');
  if(nid<0){
    // Con più nodi selezionati il pannello non può mostrare la configurazione
    // di uno solo: mostra cosa è selezionato e le azioni che valgono per tutti.
    if(B.selIds&&B.selIds.length>1){
      var sel=B.nodes.filter(function(n){return B.selIds.indexOf(n.id)>=0});
      var bloccati=sel.filter(function(n){return n.locked}).length;
      body.innerHTML='<div class="prop-group"><div class="prop-label">Selezione multipla</div>'+
        '<div style="font-size:13px;font-weight:700;margin-bottom:8px">◻️ '+sel.length+' nodi selezionati</div>'+
        '<div style="max-height:220px;overflow-y:auto">'+sel.map(function(n){
          return '<div style="display:flex;gap:7px;align-items:center;font-size:11.5px;padding:4px 0;border-bottom:1px solid var(--bg2)">'+
            '<span>'+n.icon+'</span><span style="flex:1">'+escHtml(n.name)+'</span>'+
            (n.locked?'<span title="Imposto da politica">🔒</span>':'')+'</div>';
        }).join('')+'</div>'+
        (bloccati?'<div style="font-size:10px;color:#A21CAF;margin-top:8px">🔒 '+bloccati+' imposti da politica: non verranno eliminati.</div>':'')+
        '<div style="font-size:10px;color:var(--tx4);margin-top:8px;line-height:1.5">Trascina un nodo del gruppo per spostarli insieme. Ctrl+click per aggiungere o togliere un nodo.</div>'+
        '<div class="props-actions">'+
          '<button class="tb-btn" style="color:#EF4444;border-color:#FEE2E2" onclick="deleteSelectedNodes()">🗑️ Elimina '+(sel.length-bloccati)+' nodi</button>'+
          '<button class="tb-btn" onclick="clearMultiSelection();b_render();renderProps(-1)">Deseleziona</button>'+
        '</div>'+
        '<div class="props-actions" style="border-top:0;padding-top:0;margin-top:8px">'+
          '<button class="tb-btn wide" onclick="toggleEsclusoSelezione()">'+
            (sel.some(function(x){return !x.escluso&&!x.locked})?'🚫 Escludi dall\'esecuzione':'▶️ Reinserisci nell\'esecuzione')+'</button>'+
        '</div></div>';
      return;
    }
    // Il pannello vuoto e' il momento in cui si sta guardando la tela senza
    // sapere cosa fare: e' il posto giusto per dire come ci si muove. Lo
    // spostamento della vista c'era gia' (Ctrl, Shift o tasto centrale) ma non
    // era scritto da nessuna parte, e nelle prove risultava «frustrante» —
    // una funzione che non si scopre, per chi la usa, non esiste.
    body.innerHTML='<div style="text-align:center;padding:34px 20px;color:var(--tx4)">'+
      '<div style="font-size:32px;margin-bottom:8px">👈</div>'+
      '<div style="font-size:13px;font-weight:600">Seleziona un nodo</div>'+
      '<div style="font-size:11px;margin-top:4px">Clicca su un nodo, oppure trascina sul canvas vuoto per selezionarne più di uno</div>'+
      '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--bg2);text-align:left">'+
        '<div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:7px">Muoversi sulla tela</div>'+
        '<div style="font-size:11px;line-height:1.85">'+
          '<strong>Ctrl</strong> o <strong>Shift</strong> + trascina: sposta la vista<br>'+
          '<strong>Tasto centrale</strong> + trascina: sposta la vista<br>'+
          '<strong>Rotella</strong>: ingrandisci e riduci<br>'+
          '<strong>⛶</strong> in basso a destra: inquadra tutto il flusso'+
        '</div>'+
      '</div></div>';
    return;
  }
  var n=B.nodes.find(function(x){return x.id===nid});if(!n)return;
  var isAI=n.type==='ai';
  body.innerHTML=
    '<div class="prop-group"><div class="prop-label">Nome</div><input class="prop-input" value="'+escHtml(n.name)+'" onchange="updProp('+nid+',\'name\',this.value)"></div>'+
    '<div class="prop-group"><div class="prop-label">Descrizione</div><input class="prop-input" value="'+escHtml(n.detail)+'" onchange="updProp('+nid+',\'detail\',this.value)"></div>'+
    '<div class="prop-group"><div class="prop-label">Icona</div><input class="prop-input" value="'+n.icon+'" onchange="updProp('+nid+',\'icon\',this.value)" style="width:60px"></div>'+
    (isAI?
      '<div class="ai-panel"><div class="ai-panel-title"><span class="sparkle">✨</span> Configurazione AI</div>'+
      '<div class="prop-group"><div class="prop-label">Provider</div><select class="prop-select" onchange="updConfig('+nid+',\'model\',this.value)">'+
        // "Automatico" è il predefinito: un nodo che non sceglie deve usare il
        // fornitore che l'utente ha effettivamente collegato. Prima ricadeva su
        // Claude in silenzio, e chi configurava Gemini o GPT si trovava il
        // flusso bloccato su un fornitore che non aveva mai selezionato.
        '<option value="auto"'+(!n.config.model||n.config.model==='auto'?' selected':'')+'>⚡ Automatico: usa il fornitore collegato</option>'+
        '<option value="claude"'+(n.config.model==='claude'?' selected':'')+'>Claude: Anthropic</option>'+
        '<option value="openai"'+(n.config.model==='openai'||n.config.model==='gpt'?' selected':'')+'>GPT: OpenAI</option>'+
        '<option value="gemini"'+(n.config.model==='gemini'?' selected':'')+'>Gemini: Google</option>'+
        '<option value="mistral"'+(n.config.model==='mistral'?' selected':'')+'>Mistral AI</option>'+
        '<option value="locale"'+(n.config.model==='locale'?' selected':'')+'>💻 Modello in locale'+((aiConfig.providers.locale&&aiConfig.providers.locale.model)?': '+escHtml(aiConfig.providers.locale.model):'')+'</option>'+
        '<option value="custom"'+(n.config.model==='custom'?' selected':'')+'>🔧 Open source / Custom</option>'+
      '</select></div>'+
      // In automatico si mostra lo stato del fornitore che verrà usato davvero.
      '<div style="font-size:10px;color:var(--tx4);margin:-6px 0 8px">'+
        (function(){
          var s=(typeof risolviProvider==='function')?risolviProvider(n.config.model):null;
          if(s&&s.nessunoCollegato)return '⚠️ Nessun fornitore collegato: apri «Integrazione AI» e configurane uno.';
          if(s&&s.automatico)return '⚡ Verrà usato '+providerLabel(s.provider)+', l\'unico collegato o il primo disponibile.';
          return aiProviderStatusHint(n.config.model||'claude');
        })()+'</div>'+
      // Scelta del modello dentro il fornitore: la stessa chiave dà accesso a
      // modelli che costano e rendono in modo diverso, e un'estrazione di campi
      // non ha bisogno del più capace.
      renderSceltaModello(nid,n)+
      // Il prompt passa da escHtml: un `</textarea>` scritto nel prompt
      // spaccava il pannello. E sotto c'e' l'aiuto alla scrittura.
      '<div class="prop-group"><div class="prop-label">System Prompt</div><textarea class="prop-input" id="promptNodo'+nid+'" onchange="updConfig('+nid+',\'prompt\',this.value)" placeholder="Sei un assistente che...">'+escHtml(n.config.prompt||'')+'</textarea>'+
        (typeof aiutoTestoHTML==='function'?aiutoTestoHTML('promptNodo'+nid,'prompt',nid,'prompt'):'')+'</div>'+
      '<div class="prop-group"><div class="prop-label">Temperature ('+((n.config.temperature||0.7))+')</div><input type="range" min="0" max="1" step="0.1" value="'+(n.config.temperature||0.7)+'" onchange="updConfig('+nid+',\'temperature\',parseFloat(this.value))" style="width:100%"></div>'+
      '<div class="prop-group"><div class="prop-label">Max tokens output</div><input class="prop-input" type="number" value="'+(n.config.maxtokens||1024)+'" onchange="updConfig('+nid+',\'maxtokens\',parseInt(this.value))" min="64" max="8192"></div>'+
      '<div class="prop-group"><div class="prop-label">Formato output</div><select class="prop-select" onchange="updConfig('+nid+',\'outformat\',this.value)">'+
        '<option value="testo"'+((n.config.outformat||'testo')==='testo'?' selected':'')+'>Testo libero</option>'+
        '<option value="json"'+(n.config.outformat==='json'?' selected':'')+'>JSON strutturato</option>'+
        '<option value="markdown"'+(n.config.outformat==='markdown'?' selected':'')+'>Markdown</option>'+
      '</select></div>'+
      renderOutputConstraintHint(n)+
      renderKBPanel(nid,n)+
      renderToolPicker(nid,n)+
      '</div>':'')+
    (n.type==='sa'?renderSubAgentPanel(nid,n):'')+
    (n.type==='cd'?
      '<div class="prop-group"><div class="prop-label">Condizione</div><input class="prop-input" value="'+(n.config.condition||'result.score > 70')+'" onchange="updConfig('+nid+',\'condition\',this.value)" placeholder="result.score > 70"></div>':'')+
    (function(){
      var cfgDef=null,label='';
      if(n.type==='ac'){cfgDef=getConnectorConfig(n.name);label='Configurazione '+n.name}
      else if(n.type==='tr'){cfgDef=TRIGGER_CONFIGS[n.name];label='Configurazione trigger'}
      else if(n.type==='cd'||n.type==='ou'){cfgDef=LOGIC_CONFIGS[n.name];label='Parametri '+n.name}
      else if(n.type==='gr'){cfgDef=getGuardrailConfig(n.name);label='Controllo: '+n.name}
      if(!cfgDef&&n.type!=='tr'&&n.type!=='ac')return '';
      var extra='';
      if(n.type==='tr'&&n.name==='File upload'){
        var fs_=n.config.filestato;
        // Sorgente: un file solo, una cartella intera o indirizzi web. Ai nodi
        // a valle arriva comunque lo stesso testo composto.
        extra=(typeof frPannelloSorgente==='function')?frPannelloSorgente(nid,n):'';
        if((n.config.sorgente||'File singolo')!=='File singolo'){
          extra+=(fs_==='errore'?'<div style="font-size:10px;color:#991B1B;background:#FEE2E2;border-radius:6px;padding:6px 8px;margin-top:6px">❌ '+escHtml(n.config.fileerrore||'')+'</div>':'');
          return '<div class="connector-config"><div class="connector-config-title">'+n.icon+' Configurazione '+escHtml(n.name)+'</div>'+
            renderConfigFields((TRIGGER_CONFIGS[n.name]||{fields:[]}).fields,nid,n.config||{},true)+extra+'</div>';
        }
        extra+='<div class="prop-group"><div class="prop-label">📎 File di test (letto realmente)</div>'+
          '<input type="file" id="nodeFileInput-'+nid+'" accept=".txt,.csv,.tsv,.json,.md,.log,.xml,.html,.yml,.yaml,.pdf,.docx,.xlsx,.pptx" style="display:none" onchange="loadNodeFile('+nid+',this)">'+
          '<div style="display:flex;gap:6px">'+
            '<button class="tb-btn" style="flex:1;min-width:0" onclick="document.getElementById(\'nodeFileInput-'+nid+'\').click()">'+
              '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(n.config.filename?'📄 '+escHtml(n.config.filename)+': cambia':'Carica un file da elaborare')+'</span></button>'+
            // Togliere l'allegato deve essere possibile: senza, per passare a un
            // documento della Knowledge Base bisognava caricare un altro file
            // qualsiasi, e quello di prima restava comunque la sorgente.
            (n.config.filename?'<button class="tb-btn" title="Togli il file allegato" style="flex-shrink:0;color:#EF4444;border-color:#FECACA" onclick="svuotaFileNodo('+nid+')">✕</button>':'')+
          '</div>'+
          '<div style="font-size:10px;color:var(--tx4);margin-top:4px">PDF, Word, Excel, PowerPoint, testo, CSV, JSON, Markdown. Il testo viene estratto nel browser e passato realmente ai nodi AI.</div>'+
          (fs_==='lettura'?'<div style="font-size:10px;color:#1D4ED8;background:#DBEAFE;border-radius:6px;padding:6px 8px;margin-top:6px">⏳ Estrazione del testo in corso…</div>':'')+
          // L'errore di estrazione resta visibile nel pannello: e' l'unico posto
          // dove l'utente puo' capire perche' quel documento non e' utilizzabile.
          (fs_==='errore'?'<div style="font-size:10px;color:#991B1B;background:#FEE2E2;border-radius:6px;padding:6px 8px;margin-top:6px;line-height:1.45">❌ '+escHtml(n.config.fileerrore||'Lettura non riuscita')+'</div>':'')+
          ((!n.config.filedata&&!n.config.kbDocId&&!n.config.kbDocIds&&fs_!=='lettura')
            ? '<div style="font-size:10px;color:#B45309;background:#FEF3C7;border-radius:6px;padding:6px 8px;margin-top:6px;line-height:1.45">⚠️ Serve una sorgente: allega un file <strong>oppure</strong> scegli un documento della Knowledge Base qui sotto. Senza, il flusso girerebbe su dati campione.</div>'
            : '')+
          (n.config.filedata
            ? '<div style="font-size:10px;color:#047857;margin-top:5px">✅ '+escHtml(n.config.filetipo||'Testo')+': '+n.config.filedata.length.toLocaleString('it-IT')+' caratteri estratti'+
              '</div><details style="margin-top:5px"><summary style="font-size:10px;color:var(--tx4);cursor:pointer">Anteprima del testo estratto</summary>'+
              '<pre style="font-size:10px;max-height:150px;overflow:auto;background:var(--bg2);padding:8px;border-radius:6px;white-space:pre-wrap;margin:5px 0 0">'+escHtml(n.config.filedata.slice(0,1200))+(n.config.filedata.length>1200?'\n…':'')+'</pre></details>'
            : ((n.config.kbDocIds||n.config.kbDocId)?'<div style="font-size:10px;color:#047857;margin-top:5px">✅ Sorgente: Knowledge Base</div>':''))+
          '</div>';
      }
      if(n.type==='tr')extra+=renderParametriTrigger(nid,n);
      // Il webhook può anche RICEVERE: il pannello mostra l'indirizzo da
      // chiamare e mette il nodo in ascolto, così il flusso parte da una
      // chiamata esterna invece che da dati inseriti a mano.
      if(n.type==='tr'&&n.name==='Webhook'&&typeof whPannello==='function')extra+=whPannello(nid,n);
      if(n.type==='tr'&&(n.name==='Webhook'||n.name==='Form submit'||n.name==='Event listener')){
        extra+='<div class="prop-group"><div class="prop-label">🧪 Payload di test (JSON)</div><textarea class="prop-input" rows="4" placeholder=\'{"lead":{"nome":"...","azienda":"..."}}\' onchange="updConfig('+nid+',\'sample\',this.value)">'+escHtml(n.config.sample||'')+'</textarea><div style="font-size:10px;color:var(--tx4)">Se compilato, il Run usa questi dati come input reale del workflow.</div></div>';
      }
      if(n.type==='tr'){
        extra+=renderKBDocPicker(nid,n.config);
      }
      // Il collegamento alla cartella non è un campo di configurazione come gli
      // altri: è un permesso che il browser concede solo su click dell'utente,
      // quindi vive fuori da renderConfigFields.
      var cloudHtml=((n.type==='ou'||n.type==='ac')&&needsCloudFolder(n))?cloudFolderPanel(nid,n):'';
      // Selettore di connessione riusabile (database, endpoint, SMTP). Sta
      // sopra i campi perche' sceglierla cambia quali campi restano da
      // compilare: i suoi li fornisce lei.
      var connHtml='';
      var mappa=(typeof connessioneDelConnettore==='function')?connessioneDelConnettore(n.name):null;
      if(mappa&&n.type==='ac'&&typeof connSelettore==='function'){
        connHtml=connSelettore(nid,n,mappa.tipo,CONN_ETICHETTA[mappa.tipo]||'Connessione');
      }
      // L'asterisco "primo campo obbligatorio per default" ha senso solo per
      // i connettori Action, dove validateWorkflow() applica davvero quella
      // regola generica; per trigger/logic i requisiti sono gestiti caso per
      // caso (es. Webhook→path, Scheduler→cron), quindi qui niente asterisco
      // implicito fuorviante.
      // I controlli usano `req:true` esplicito sui campi obbligatori, quindi
      // niente asterisco implicito sul primo campo (come per trigger/logic).
      // I campi forniti dalla connessione si tolgono dall'elenco: lasciarli
      // visibili farebbe credere che valgano, mentre il runtime usa quelli
      // della connessione.
      var coperti=(typeof campiCopertiDaConnessione==='function')?campiCopertiDaConnessione(n.name,n.config):{};
      var campiVisibili=cfgDef?cfgDef.fields.filter(function(f){return !coperti[f.k]}):[];
      var fieldsHtml=cfgDef?renderConfigFields(campiVisibili,nid,n.config||{},n.type!=='ac'):'';
      if(n.type==='ac')fieldsHtml+='<div style="font-size:10px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin:12px 0 4px">Avanzate</div>'+renderConfigFields(advancedFieldsFor(n.name),nid,n.config||{},true);
      // `deferred` = non ancora implementato · `limite` = implementato, ma con
      // un confine noto. Due cose diverse, che meritano due avvisi diversi.
      // Il limite si dichiara anche sui connettori: sapere PRIMA di eseguire
      // che un invio è simulato, e perché, è il punto di tutta l'onestà del
      // prototipo. Scoprirlo dal registro a esecuzione finita è troppo tardi.
      if((n.type==='gr'||n.type==='ac')&&cfgDef&&cfgDef.limite){
        fieldsHtml+='<div style="font-size:10px;color:var(--tx3);background:var(--bg2);border-radius:6px;padding:8px 10px;margin-top:8px;line-height:1.5">ℹ️ '+escHtml(cfgDef.limite)+'</div>';
      }
      // Stato del servizio di invio: dice se l'email partirà davvero o sarà
      // registrata come simulata, prima di eseguire e non dopo.
      if(n.type==='ac'&&cfgDef&&cfgDef.servizioMail&&typeof mailPannelloStato==='function'){
        fieldsHtml+='<div style="margin-top:10px">'+mailPannelloStato()+'</div>';
      }
      if(n.type==='ac'&&cfgDef&&cfgDef.allegatiUI&&typeof mailPannelloAllegati==='function'){
        // Prima cosa verrà allegato dal flusso, poi gli allegati fissi: è
        // l'ordine in cui partono davvero.
        if(typeof mailPannelloFileDelFlusso==='function')fieldsHtml+=mailPannelloFileDelFlusso(nid);
        fieldsHtml+=mailPannelloAllegati(nid);
      }
      if(n.type==='gr'&&cfgDef&&cfgDef.deferred){
        fieldsHtml+='<div style="font-size:10px;color:#D97706;background:var(--ac3-l);border-radius:6px;padding:8px 10px;margin-top:8px">⚠️ '+escHtml(cfgDef.deferred)+'</div>';
      }
      if(!fieldsHtml&&!extra&&!cloudHtml&&!connHtml)return '';
      return '<div class="connector-config"><div class="connector-config-title">'+n.icon+' '+(label||'Configurazione')+'</div>'+
        connHtml+fieldsHtml+cloudHtml+extra+
        (n.type==='ac'?'<div style="font-size:10px;color:var(--tx4)">💡 I placeholder {{result}} vengono sostituiti con l\'output del nodo precedente</div>':'')+
      '</div>';
    })()+
    // Un controllo imposto da politica resta configurabile ma non eliminabile:
    // al posto dei pulsanti compare la motivazione, così chi costruisce sa
    // perché è lì invece di trovarsi un nodo che "non si cancella".
    (n.locked?
      '<div style="margin-top:16px;background:#FDF4FF;border:1px solid #F5D0FE;border-radius:8px;padding:10px 12px">'+
        '<div style="font-size:11px;font-weight:700;color:#A21CAF;display:flex;align-items:center;gap:6px">🔒 Controllo obbligatorio</div>'+
        '<div style="font-size:11px;color:var(--tx3);margin-top:4px;line-height:1.5">'+escHtml(typeof policyReasonFor==='function'?policyReasonFor(n):'Imposto da una politica organizzativa.')+'</div>'+
        '<div style="font-size:10px;color:var(--tx4);margin-top:6px">Puoi modificarne i parametri, non rimuoverlo. Per eliminarlo occorre disattivare la politica dal Profilo.</div>'+
      '</div>'
      :
      '<div class="props-actions">'+
        '<button class="tb-btn" style="color:#EF4444;border-color:#FEE2E2" onclick="deleteNode('+nid+')">🗑️ Elimina</button>'+
        '<button class="tb-btn" onclick="duplicateNode('+nid+')">📋 Duplica</button>'+
      '</div>'+
      '<div class="props-actions" style="border-top:0;padding-top:0;margin-top:8px">'+
        '<button class="tb-btn wide" onclick="toggleEsclusoNodo('+nid+')" title="Il nodo resta sul canvas ma viene saltato durante l\'esecuzione (Ctrl+E)">'+
          (n.escluso?'▶️ Reinserisci nell\'esecuzione':'🚫 Escludi dall\'esecuzione')+'</button>'+
      '</div>'+
      (n.escluso
        ? '<div style="font-size:10.5px;color:#B45309;background:#FEF3C7;border-radius:6px;padding:7px 9px;margin-top:8px;line-height:1.5">'+
          'Questo nodo verrà <strong>saltato</strong>: al Run il flusso collega direttamente i nodi a monte con quelli a valle. Configurazione e connessioni restano intatte.</div>'
        : ''));
}

// Strumenti a disposizione del nodo AI (B2). Sono i connettori Action
// raggiungibili a valle: il modello può invocarli autonomamente invece di
// essere seguito da un'azione eseguita comunque in sequenza.
function renderToolPicker(nid,n){
  var disponibili=(typeof toolsForAiNode==='function')?toolsForAiNode(nid,B.nodes,B.edges,null):[];
  if(!disponibili.length){
    return '<div style="font-size:10px;color:var(--tx4);margin-top:8px;line-height:1.5">💡 Collega dei connettori a valle di questo nodo per renderli invocabili dal modello come strumenti.</div>';
  }
  var abilitati=n.config.enabledTools?String(n.config.enabledTools).split(',').map(function(s){return s.trim()}):null;
  return '<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin:14px 0 6px">🔧 Strumenti invocabili</div>'+
    '<div style="font-size:10px;color:var(--tx4);margin-bottom:6px;line-height:1.5">Il modello decide autonomamente se e quale invocare, in base al compito.</div>'+
    disponibili.map(function(t){
      var on=!abilitati||abilitati.indexOf(t.name)>=0;
      return '<label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:12px;cursor:pointer">'+
        '<input type="checkbox" '+(on?'checked':'')+' onchange="toggleTool('+nid+',\''+t.name.replace(/'/g,"\\'")+'\',this.checked)" style="width:15px;height:15px">'+
        '<span>'+t.icon+' '+escHtml(t.name)+'</span></label>';
    }).join('')+
    '<div class="prop-group" style="margin-top:8px"><div class="prop-label">Iterazioni massime</div>'+
    '<input class="prop-input" type="number" min="1" max="10" value="'+(n.config.maxIterations||3)+'" onchange="updConfig('+nid+',\'maxIterations\',this.value)">'+
    '<div style="font-size:10px;color:var(--tx4);margin-top:3px">Limita il ciclo invoca-strumento → prosegui, per evitare cicli senza fine.</div></div>';
}

function toggleTool(nid,toolName,on){
  var n=B.nodes.find(function(x){return x.id===nid});if(!n)return;
  var disponibili=toolsForAiNode(nid,B.nodes,B.edges,null).map(function(t){return t.name});
  var cur=n.config.enabledTools?String(n.config.enabledTools).split(',').map(function(s){return s.trim()}).filter(Boolean):disponibili.slice();
  if(on){ if(cur.indexOf(toolName)<0)cur.push(toolName) }
  else { cur=cur.filter(function(x){return x!==toolName}) }
  updConfig(nid,'enabledTools',cur.join(', '));
}

// Avvisa quando il vincolo di formato non è garantito nativamente dal
// fornitore scelto: la degradazione dev'essere nota prima dell'esecuzione,
// non scoperta leggendo la traccia.
// C3 — RAG nel Builder. L'opzione sta nel pannello del nodo AI perché è il
// nodo che riceverà le porzioni: attivarla altrove renderebbe poco chiaro
// quale chiamata al modello viene arricchita.
function renderKBPanel(nid,n){
  var st=(typeof kbStats==='function')?kbStats():{documenti:0,porzioni:0};
  var attivo=!!n.config.useKB;
  var h='<div class="prop-group" style="border-top:1px solid var(--bo);padding-top:12px">'+
    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer">'+
      '<input type="checkbox"'+(attivo?' checked':'')+' onchange="updConfig('+nid+',\'useKB\',this.checked);renderProps('+nid+')">'+
      '<span style="font-size:12px;font-weight:600">📚 Usa Knowledge Base</span>'+
    '</label>'+
    '<div style="font-size:10px;color:var(--tx4);margin-top:4px">'+
      (st.porzioni?st.documenti+' documenti · '+st.porzioni+' porzioni indicizzate':
       '<span style="color:#EF4444">Nessun documento indicizzato</span>: <span style="text-decoration:underline;cursor:pointer" onclick="openKBDocsModal()">caricane uno</span>')+
    '</div>';
  if(attivo){
    h+='<div style="margin-top:10px"><div class="prop-label">Business unit</div>'+
      '<select class="prop-select" onchange="updConfig('+nid+',\'kbBusinessUnit\',this.value)">'+
        (typeof KB_BUSINESS_UNITS!=='undefined'?KB_BUSINESS_UNITS:['Tutte']).map(function(b){
          return '<option'+((n.config.kbBusinessUnit||'Tutte')===b?' selected':'')+'>'+b+'</option>';
        }).join('')+
      '</select></div>'+
      '<div style="margin-top:8px"><div class="prop-label">Porzioni da recuperare</div>'+
      '<input class="prop-input" type="number" min="1" max="10" value="'+(n.config.kbTopK||4)+'" onchange="updConfig('+nid+',\'kbTopK\',parseInt(this.value))"></div>'+
      '<div style="font-size:10px;color:var(--tx4);margin-top:6px">Le porzioni recuperate compaiono nel registro di esecuzione con documento e punteggio. Il filtro permessi si applica prima del recupero.</div>';
  }
  return h+'</div>';
}

function renderOutputConstraintHint(n){
  if(n.config.outformat!=='json')return '';
  // Con provider "Automatico" la capacità dipende da quello collegato: va
  // risolto prima, altrimenti il pannello dichiara un limite inesistente.
  var provQui=(typeof risolviProvider==='function')?(risolviProvider(n.config.model).provider||'claude'):(n.config.model||'claude');
  var caps=(typeof providerCapabilities==='function')?providerCapabilities(provQui):{structuredOutput:true};
  if(caps.structuredOutput){
    return '<div style="font-size:10px;color:var(--ac-d);margin:-6px 0 8px">✅ Output vincolato nativo supportato da questo fornitore</div>';
  }
  return '<div style="font-size:10px;color:#D97706;background:var(--ac3-l);border-radius:6px;padding:7px 9px;margin:-2px 0 10px;line-height:1.45">⚠️ Questo fornitore non garantisce l\'output vincolato nativo: si ripiega sul vincolo nel prompt con convalida. La differenza viene registrata nella traccia di esecuzione.</div>';
}

// Nodo Chiamata agente (B7): sceglie quale agente salvato invocare.
function renderSubAgentPanel(nid,n){
  var agenti=[];
  try{ agenti=dbAll('SELECT name FROM agents ORDER BY name') }catch(e){}
  var opts='<option value="">seleziona un agente</option>'+agenti.map(function(a){
    return '<option value="'+escHtml(a.name)+'"'+(n.config.agentName===a.name?' selected':'')+'>'+escHtml(a.name)+'</option>';
  }).join('');
  return '<div class="connector-config"><div class="connector-config-title">🤝 Delega a sotto-agente</div>'+
    '<div class="prop-group"><div class="prop-label">Agente da invocare <span style="color:#EF4444">*</span></div>'+
    '<select class="prop-select" onchange="updConfig('+nid+',\'agentName\',this.value)">'+opts+'</select></div>'+
    (agenti.length?'':'<div style="font-size:10px;color:#D97706;margin-top:4px">Nessun agente salvato: salvane uno (💾) per poterlo invocare da qui.</div>')+
    '<div style="font-size:10px;color:var(--tx4);margin-top:6px;line-height:1.5">L\'output di questo nodo è il risultato del sotto-agente. La traccia mostra il passaggio di controllo e il ritorno.</div></div>';
}

function updProp(nid,key,val){B.effimero=false;var n=B.nodes.find(function(x){return x.id===nid});if(n){n[key]=val;b_render()}}

function updConfig(nid,key,val){
  B.effimero=false;
  var n=B.nodes.find(function(x){return x.id===nid});
  if(!n)return;
  if(!n.config)n.config={};
  n.config[key]=val;
  if(B._invalidIds)delete B._invalidIds[nid];
  // Cambiando fornitore su un nodo AI, il modello scelto per il fornitore
  // precedente non ha piu' senso: «GPT-4o mini» non esiste in casa Anthropic.
  // Si azzera, cosi' subentra il predefinito del nuovo fornitore invece di
  // restare in configurazione un identificativo di un altro vendor. In
  // esecuzione non cambiava nulla (modelloEffettivo() ricadeva gia' sul
  // predefinito), ma la configurazione salvata diceva una cosa falsa.
  if(n.type==='ai'&&key==='model')delete n.config.modelId;
  b_render();
  // Se altri campi dipendono da questo, il pannello va ridisegnato: è ciò che
  // fa comparire i parametri giusti e sparire quelli che non c'entrano più.
  //
  // Il pannello del nodo AI è scritto a mano e non ha un elenco `fields`, per
  // cui la regola generica non poteva vederne le dipendenze: la tendina dei
  // modelli restava quella del fornitore precedente, e chi passava a Claude o
  // a Gemini continuava a vedere i modelli OpenAI. Il caso va nominato.
  if(campoDaCuiDipendonoAltri(n,key)||(n.type==='ai'&&key==='model'))renderProps(nid);
}

// Vero se qualche campo dello stesso nodo cambia in funzione di `chiave`.
function campoDaCuiDipendonoAltri(n,chiave){
  var def=n.type==='ac'?getConnectorConfig(n.name)
        :n.type==='tr'?(typeof TRIGGER_CONFIGS!=='undefined'?TRIGGER_CONFIGS[n.name]:null)
        :n.type==='gr'?getGuardrailConfig(n.name)
        :(typeof LOGIC_CONFIGS!=='undefined'?LOGIC_CONFIGS[n.name]:null);
  if(!def||!def.fields)return false;
  return def.fields.some(function(f){
    return (f.mostraSe&&f.mostraSe.campo===chiave)
        || (f.dipendeDa===chiave)
        || (f.reqSe&&f.reqSe.campo===chiave);
  });
}

// ── SELEZIONE MULTIPLA ──────────────────────────────────────────────────
// Il riquadro vive come elemento a sé sopra il canvas: ridisegnarlo dentro
// b_render lo farebbe lampeggiare a ogni movimento del mouse.
function drawMarquee(){
  var m=B.marquee;if(!m)return;
  var box=document.getElementById('marqueeBox');
  if(!box){
    box=document.createElement('div');
    box.id='marqueeBox';box.className='marquee-box';
    document.getElementById('canvasArea').appendChild(box);
  }
  box.style.left=Math.min(m.x0,m.x1)+'px';
  box.style.top=Math.min(m.y0,m.y1)+'px';
  box.style.width=Math.abs(m.x1-m.x0)+'px';
  box.style.height=Math.abs(m.y1-m.y0)+'px';
}

// Un nodo entra in selezione se il suo rettangolo INTERSECA il riquadro:
// pretendere che sia interamente contenuto obbligherebbe a inquadrature
// larghissime su un canvas fitto.
function applyMarqueeSelection(){
  var m=B.marquee;if(!m)return;
  var x0=Math.min(m.x0,m.x1),x1=Math.max(m.x0,m.x1);
  var y0=Math.min(m.y0,m.y1),y1=Math.max(m.y0,m.y1);
  B.selIds=[];
  B.nodes.forEach(function(n){
    var el=document.getElementById('node-'+n.id);
    var w=el?el.offsetWidth:180, h=el?el.offsetHeight:70;
    var nx=n.x*B.zoom+B.panX, ny=n.y*B.zoom+B.panY;
    var nw=w*B.zoom, nh=h*B.zoom;
    if(nx<x1&&nx+nw>x0&&ny<y1&&ny+nh>y0)B.selIds.push(n.id);
  });
  if(B.selIds.length===1){B.selId=B.selIds[0];B.selIds=[];renderProps(B.selId)}
  else if(B.selIds.length>1){B.selId=-1;renderProps(-1)}
  b_render();
  if(B.selIds.length>1)showToast('◻️ '+B.selIds.length+' nodi selezionati: Canc per eliminarli');
}

function isNodeSelected(nid){
  return B.selId===nid||(B.selIds&&B.selIds.indexOf(nid)>=0);
}

function clearMultiSelection(){
  B.selIds=[];
}

// Eliminazione del gruppo: i nodi imposti da politica restano, e lo si dice.
// Cancellarli in silenzio insieme agli altri aggirerebbe il presidio.
function deleteSelectedNodes(){
  var ids=(B.selIds&&B.selIds.length)?B.selIds.slice():(B.selId>0?[B.selId]:[]);
  if(!ids.length)return;
  var nodi=B.nodes.filter(function(n){return ids.indexOf(n.id)>=0});
  var bloccati=nodi.filter(function(n){return n.locked});
  var eliminabili=nodi.filter(function(n){return !n.locked});
  if(!eliminabili.length){
    showToast('🔒 I nodi selezionati sono imposti da una politica e non possono essere rimossi');
    return;
  }
  pushUndo('eliminazione di '+eliminabili.length+' nodi');
  var da=eliminabili.map(function(n){return n.id});
  B.nodes=B.nodes.filter(function(n){return da.indexOf(n.id)<0});
  B.edges=B.edges.filter(function(e){return da.indexOf(e.from)<0&&da.indexOf(e.to)<0});
  B.selId=-1;B.selIds=[];B.selEdgeIdx=-1;
  clearInvalidNodes();b_render();renderProps(-1);
  showToast('🗑️ '+eliminabili.length+' nodi eliminati'+(bloccati.length?' · '+bloccati.length+' mantenuti perché imposti da politica':''));
}

// ── COPIA / INCOLLA ──────────────────────────────────────────────────────
// Appunti interni, non quelli di sistema: incollare fra due schede diverse
// del builder non avrebbe senso (gli id andrebbero comunque rigenerati) e
// l'accesso agli appunti del browser richiede un permesso esplicito.
var B_CLIPBOARD={nodes:[],edges:[]};

function copySelection(){
  var ids=(B.selIds&&B.selIds.length)?B.selIds.slice():(B.selId>0?[B.selId]:[]);
  if(!ids.length){showToast('Nessun nodo selezionato da copiare');return}
  B_CLIPBOARD.nodes=B.nodes.filter(function(n){return ids.indexOf(n.id)>=0})
    .map(function(n){return JSON.parse(JSON.stringify(n))});
  // Si copiano anche le connessioni INTERNE alla selezione: incollare due
  // nodi collegati e ritrovarli scollegati costringerebbe a rifare il lavoro.
  B_CLIPBOARD.edges=B.edges.filter(function(e){return ids.indexOf(e.from)>=0&&ids.indexOf(e.to)>=0})
    .map(function(e){return JSON.parse(JSON.stringify(e))});
  showToast('📋 '+B_CLIPBOARD.nodes.length+' nodi copiati: Ctrl+V per incollare');
}

function pasteSelection(){
  if(!B_CLIPBOARD.nodes.length){showToast('Appunti vuoti');return}
  pushUndo('incolla '+B_CLIPBOARD.nodes.length+' nodi');
  var mappa={},nuovi=[];
  B_CLIPBOARD.nodes.forEach(function(n){
    // Sfalsati rispetto agli originali, altrimenti la copia finirebbe
    // esattamente sotto e sembrerebbe che non sia successo nulla.
    var id=b_addNode(n.type,n.icon,n.name,n.detail,n.x+40,n.y+40);
    var nn=B.nodes.find(function(x){return x.id===id});
    nn.config=JSON.parse(JSON.stringify(n.config||{}));
    // Un controllo imposto da politica resta legato all'originale: la copia
    // è un nodo ordinario, altrimenti si moltiplicherebbero i non rimovibili.
    delete nn.locked; delete nn.policyId;
    mappa[n.id]=id; nuovi.push(id);
  });
  B_CLIPBOARD.edges.forEach(function(e){
    if(mappa[e.from]&&mappa[e.to])b_addEdge(mappa[e.from],e.fp,mappa[e.to],e.tp,e.label||'');
  });
  B.selIds=nuovi.length>1?nuovi:[];
  B.selId=nuovi.length===1?nuovi[0]:-1;
  clearInvalidNodes();b_render();renderProps(B.selId);
  showToast('📌 '+nuovi.length+' nodi incollati');
}

function deleteNode(nid){
  var n=B.nodes.find(function(x){return x.id===nid});
  // Vale anche per il tasto Canc (main.js), non solo per il pulsante: il
  // presidio non deve dipendere da quale strada si usa per eliminare.
  if(n&&n.locked){
    showToast('🔒 "'+n.name+'" è imposto da una politica organizzativa e non può essere rimosso');
    return;
  }
  pushUndo('eliminazione "'+(n?n.name:'nodo')+'"');
  B.nodes=B.nodes.filter(function(x){return x.id!==nid});
  B.edges=B.edges.filter(function(e){return e.from!==nid&&e.to!==nid});
  B.selId=-1;clearInvalidNodes();b_render();renderProps(-1);
  showToast('🗑️ Nodo eliminato');
}

function duplicateNode(nid){
  var n=B.nodes.find(function(x){return x.id===nid});if(!n)return;
  pushUndo('duplicazione "'+n.name+'"');
  // La copia è un nodo scelto dall'utente: non eredita il vincolo di
  // politica dell'originale (che resta comunque presente e bloccato).
  var newId=b_addNode(n.type,n.icon,n.name,n.detail,n.x+40,n.y+40);
  var copy=B.nodes.find(function(x){return x.id===newId});
  copy.config=JSON.parse(JSON.stringify(n.config||{}));
  B.selId=newId;B.selEdgeIdx=-1;
  b_render();renderProps(newId);
  showToast('📋 Nodo duplicato con la sua configurazione');
}


// Palette dei tag della traccia, condivisa fra il pannello live del Builder e
// la vista di dettaglio nel Log Esecuzioni: un unico posto evita che le due
// viste della stessa esecuzione usino colori diversi.
var EXEC_TAG_COLORS={TRIGGER:'#F59E0B','LLM AI':'#6366F1',ACTION:'#10B981',LOGIC:'#EF4444',OUTPUT:'#64748B',CONTROLLO:'#D946EF'};
function execStatusColor(s){
  return s==='OK'?'#10B981':s==='WARN'?'#D97706':s==='SKIP'?'#94A3B8':'#EF4444';
}

// L'altezza viene scritta come stile in linea invece di affidarla alle sole
// classi: alcune versioni di browser non ricalcolano lo stile di un elemento
// assoluto quando cambia solo la classe, e il pannello restava chiuso. Scritta
// così è la stessa istruzione in ogni caso, e resta prevedibile.
var LOG_ALTEZZE={ridotto:36,normale:220};

function altezzaMassimaRegistro(){
  var a=document.getElementById('canvasArea');
  return a?Math.round(a.clientHeight*0.85):560;
}

function impostaAltezzaRegistro(px){
  var l=document.getElementById('execLog');
  if(!l)return;
  var v=Math.max(LOG_ALTEZZE.ridotto,Math.min(altezzaMassimaRegistro(),Math.round(px)));
  l.style.height=v+'px';
  l.classList.toggle('collapsed',v<=LOG_ALTEZZE.ridotto+2);
  l.classList.remove('espanso');
  B.logH=v;                    // stato: è questo a decidere il prossimo comando
  // I comandi dello zoom stavano a `bottom:16px`, cioe' SOPRA il registro, che
  // parte da `bottom:0`: coprivano sempre le ultime due righe, proprio quelle
  // che si e' appena finito di leggere quando un flusso termina con un errore.
  // Qui si pubblica l'altezza del registro come variabile CSS, e i comandi si
  // appoggiano sopra al pannello invece che sopra al testo. Passa da questa
  // funzione ogni cambio di altezza — pulsanti, doppio clic e trascinamento
  // della maniglia — quindi non serve un secondo punto di aggiornamento.
  var ca=document.getElementById('canvasArea');
  if(ca)ca.style.setProperty('--altezza-registro',v+'px');
  return v;
}

// L'altezza voluta, non quella misurata. Basare le decisioni sul riquadro reso
// significa dipendere da quando il browser ricalcola il layout: su un elemento
// assoluto la lettura può arrivare in ritardo, e il pannello sembrava non
// rispondere ai pulsanti pur avendo ricevuto il comando.
function altezzaRegistro(){
  if(B.logH)return B.logH;
  var l=document.getElementById('execLog');
  if(!l)return LOG_ALTEZZE.ridotto;
  return l.classList.contains('collapsed')?LOG_ALTEZZE.ridotto
       : Math.round(l.getBoundingClientRect().height)||LOG_ALTEZZE.normale;
}

function toggleExecLog(){
  impostaAltezzaRegistro(altezzaRegistro()>LOG_ALTEZZE.ridotto+2
    ? LOG_ALTEZZE.ridotto : LOG_ALTEZZE.normale);
}

// ── Dimensione del registro ───────────────────────────────────
// Tre modi, perché servono in momenti diversi: ridotto mentre si costruisce,
// a tutta altezza quando si sta leggendo un errore lungo, e a misura scelta
// trascinando il bordo per tutto il resto.
function espandiRegistro(){
  var max=altezzaMassimaRegistro();
  // Secondo click: torna alla misura normale, così il pulsante fa avanti e
  // indietro invece di essere un vicolo cieco.
  impostaAltezzaRegistro(altezzaRegistro()>=max-4?LOG_ALTEZZE.normale:max);
}

function riduciRegistro(){ impostaAltezzaRegistro(LOG_ALTEZZE.ridotto) }

function initRegistroRidimensionabile(){
  var grip=document.getElementById('execLogGrip');
  var log=document.getElementById('execLog');
  if(!grip||!log||grip._pronto)return;
  grip._pronto=true;
  var trascino=null;

  grip.addEventListener('mousedown',function(e){
    // Trascinare il bordo mentre il registro e' chiuso lo apre: e' il gesto
    // naturale, e non obbliga a cliccare prima l'intestazione.
    trascino={y:e.clientY,h:altezzaRegistro()};
    log.style.transition='none';           // niente inerzia mentre si trascina
    e.preventDefault();e.stopPropagation();
  });

  document.addEventListener('mousemove',function(e){
    if(!trascino)return;
    impostaAltezzaRegistro(trascino.h+(trascino.y-e.clientY));
  });

  document.addEventListener('mouseup',function(){
    if(!trascino)return;
    trascino=null;
    log.style.transition='';               // ripristina l'animazione dei pulsanti
  });
}

// Svuota il registro visibile nel builder. Il registro racconta UNA esecuzione:
// tenerlo quando si apre un altro agente o se ne crea uno nuovo faceva leggere
// come propri dei passi appartenenti al flusso precedente.
function svuotaRegistroEsecuzione(){
  if(typeof execEntries!=='undefined')execEntries=[];
  var body=document.getElementById('execLogBody');
  if(body)body.innerHTML='';
  if(typeof aggiornaBottoneEsportaRegistro==='function')aggiornaBottoneEsportaRegistro();
  var dot=document.getElementById('execDot');
  if(dot)dot.className='exec-log-dot';
  var log=document.getElementById('execLog');
  if(log)impostaAltezzaRegistro(LOG_ALTEZZE.ridotto);
  if(typeof LAST_RUN_FILES!=='undefined')LAST_RUN_FILES.length=0;
  B.nodes.forEach(function(n){delete n._execState});
}

function addExecEntry(type,msg,status,nodeId){
  var now=new Date();
  var time=now.toTimeString().substring(0,8);
  var colors=EXEC_TAG_COLORS;
  // L'id del nodo viaggia con la voce: e' cio' che permette di risalire dal
  // messaggio al blocco che l'ha prodotto. Senza, su un flusso con dodici nodi
  // e tre chiamate AI non c'e' modo di sapere QUALE nodo ha scritto quella riga.
  execEntries.push({time:time,type:type,msg:msg,status:status,nodeId:(nodeId==null?null:nodeId)});
  // Il pulsante di esportazione si accende alla prima voce.
  if(typeof aggiornaBottoneEsportaRegistro==='function')aggiornaBottoneEsportaRegistro();
  var body=document.getElementById('execLogBody');
  var nodo=(nodeId!=null)?B.nodes.find(function(x){return x.id===nodeId}):null;
  var cliccabile=!!nodo;
  // La freccia di espansione compare solo dove serve davvero. Misurare
  // l'overflow reale (scrollWidth) qui non e' affidabile: il pannello puo'
  // essere chiuso o alto zero quando la voce arriva, e la misura verrebbe
  // falsata. Si guarda quindi il testo senza tag: oltre gli ~85 caratteri, o
  // se contiene un a capo, su una riga sola non ci sta.
  var nudo=String(msg).replace(/<[^>]*>/g,'');
  var lunga=nudo.length>85||nudo.indexOf('\n')>=0;
  body.innerHTML+=
    '<div class="exec-entry'+(cliccabile?' con-nodo':'')+'"'+
      (cliccabile?' onclick="vaiAlNodoDalRegistro('+nodeId+')" title="Vai al nodo «'+escHtml(nodo.name)+'»"':'')+'>'+
    '<span class="exec-time">'+time+'</span>'+
    '<span class="exec-tag" style="background:'+(colors[type]||'#64748B')+'20;color:'+(colors[type]||'#64748B')+'">'+type+'</span>'+
    // Il messaggio sta su una riga sola: un output di mille caratteri non deve
    // far franare il registro. La riga si apre al clic sulla freccia, e allora
    // il testo si vede tutto, a capo compresi.
    '<span class="exec-msg">'+msg+'</span>'+
    (lunga?'<span class="exec-exp" onclick="event.stopPropagation();apriRigaRegistro(this)" title="Espandi/riduci il dettaglio">▾</span>':'')+
    // Il nome del nodo accanto al messaggio: leggendo il registro si capisce
    // subito la provenienza, senza doverci cliccare sopra.
    (cliccabile?'<span class="exec-nodo">'+nodo.icon+' '+escHtml(nodo.name)+'</span>':'')+
    '<span style="font-size:10px;color:'+execStatusColor(status)+'">'+status+'</span></div>';
  body.scrollTop=body.scrollHeight;
  document.getElementById('execCount').textContent=execEntries.length+' voci';
}

// Apre o richiude il dettaglio di una singola riga del registro. Il clic non
// deve propagare alla riga, altrimenti espandere significherebbe anche saltare
// al nodo: due azioni diverse sullo stesso gesto.
function apriRigaRegistro(el){
  var riga=el.closest('.exec-entry');
  if(!riga)return;
  riga.classList.toggle('aperta');
  el.textContent=riga.classList.contains('aperta')?'▴':'▾';
}

// Dal registro al canvas: seleziona il nodo, lo porta in vista e ne apre il
// pannello, cosi' si passa dal sintomo alla configurazione che l'ha causato.
function vaiAlNodoDalRegistro(nodeId){
  var n=B.nodes.find(function(x){return x.id===nodeId});
  if(!n){showToast('\u26a0\ufe0f Quel nodo non esiste pi\u00f9 nel flusso');return}
  B.selId=nodeId;B.selIds=[];B.selEdgeIdx=-1;
  if(typeof jumpToNode==='function')jumpToNode(nodeId);
  else{b_render();renderProps(nodeId)}
}
// ══════════════════════════════════════════
// ESECUZIONE — adattatore verso il motore unico (js/agent-runtime.js).
//
// Il motore non sa nulla di canvas né di pannelli: emette eventi tipizzati.
// Qui li si traduce in stati dei nodi e righe della traccia. La versione
// schedulata (runAgentHeadless) usa lo stesso motore con un ascoltatore
// diverso: prima erano due copie della stessa logica, che divergevano.
// ══════════════════════════════════════════

// Traduce gli eventi del runtime in effetti visibili nel Builder.
function builderRuntimeListener(evt,ctx){
  if(evt.event_type==='step'){
    addExecEntry(evt.payload.type,evt.payload.msg,evt.payload.status,evt.node_id);
    return;
  }
  var n=evt.node_id!=null?B.nodes.find(function(x){return x.id===evt.node_id}):null;
  if(evt.event_type==='node:start'&&n){n._execState='executing';b_render()}
  else if(evt.event_type==='node:complete'&&n){n._execState='done';b_render()}
  else if(evt.event_type==='node:error'&&n){n._execState='err';b_render()}
  else if(evt.event_type==='node:skipped'&&n){n._execState='skipped';b_render()}
  else if(evt.event_type==='node:waiting'&&n){n._execState='waiting';b_render()}
  else if(evt.event_type==='wave:parallel'){
    addExecEntry('LOGIC','⚡ '+evt.payload.conteggio+' nodi indipendenti avviati in parallelo','OK');
  }
  else if(evt.event_type==='capability:degraded'){
    addExecEntry('LLM AI','⚠️ Capacità "'+evt.payload.capability+'" non supportata da '+evt.payload.provider+': ripiego: '+evt.payload.fallback,'WARN');
  }
}

async function runAgent(){
  var _errs=validateWorkflow();
  if(_errs.length){
    // Il blocco va tracciato anche nel pannello e nello storico, non solo
    // nel modale: l'utente deve poterlo ritrovare dopo averlo chiuso.
    execEntries=[];
    document.getElementById('execLogBody').innerHTML='';
    impostaAltezzaRegistro(LOG_ALTEZZE.normale);
    document.getElementById('execDot').className='exec-log-dot err';
    addExecEntry('OUTPUT','⛔ Esecuzione bloccata: workflow non valido ('+_errs.length+' problema/i)','ERR');
    _errs.forEach(function(er){addExecEntry('LOGIC','• '+er.msg,'ERR')});
    recordExecution(currentAgentName,B.nodes.length,'err',0,'builder',
      'Bloccato da validazione: '+_errs.map(function(er){return er.msg}).join(' | ').substring(0,200),execEntries.slice());
    showValidationErrors(_errs);
    return;
  }
  clearInvalidNodes();
  var _t0=Date.now();
  execEntries=[];
  document.getElementById('execLogBody').innerHTML='';
  impostaAltezzaRegistro(LOG_ALTEZZE.normale);
  document.getElementById('execDot').className='exec-log-dot running';
  B.nodes.forEach(function(n){delete n._execState});
  if(typeof LAST_RUN_FILES!=='undefined')LAST_RUN_FILES.length=0;
  toggleRunControls(true);
  b_render();

  var res=await executeGraph({
    nodes:B.nodes, edges:B.edges, context:B.context,
    agentName:currentAgentName, agentId:B.dbAgentId,
    onEvent:builderRuntimeListener
  });

  finalizeBuilderRun(res,_t0);
  return res;
}

// Chiusura comune a esecuzione iniziale e ripresa dopo autorizzazione.
function finalizeBuilderRun(res,_t0){
  var dot=document.getElementById('execDot');
  var inAttesa=res.status==='waiting';
  var interrotta=res.status==='aborted';
  dot.className='exec-log-dot '+(res.status==='error'?'err':inAttesa?'running':'ok');
  toggleRunControls(false);

  if(interrotta){
    addExecEntry('OUTPUT','⏹️ ═══ Esecuzione interrotta: '+res.stepsCount+' nodi completati ═══','WARN');
    showToast('⏹️ Esecuzione interrotta: '+res.stepsCount+' nodi completati, i restanti non sono partiti');
    addAct('Interrotta esecuzione: '+res.stepsCount+' nodi');
    hideApprovalPrompt();
  }else if(inAttesa){
    addExecEntry('CONTROLLO','⏸️ ═══ Esecuzione sospesa: in attesa di autorizzazione ═══','WARN');
    showToast('⏸️ Esecuzione sospesa: serve un\'autorizzazione');
    renderApprovalPrompt(res);
  }else{
    addExecEntry('OUTPUT','═══ Workflow '+(res.status==='error'?'terminato con errori':'completato')+': '+res.stepsCount+' nodi ═══',
      res.status==='error'?'ERR':'OK');
    showToast(res.status==='error'?'⚠️ Workflow con errori':'✅ Workflow eseguito: '+res.stepsCount+' nodi');
    addAct('Eseguito workflow: '+res.stepsCount+' nodi');
    hideApprovalPrompt();
  }

  var execRowId=recordExecution(currentAgentName,res.stepsCount,
    res.status==='error'?'err':inAttesa?'waiting':interrotta?'aborted':'ok',
    res.duration||(Date.now()-_t0),'builder',
    res.pipeline?String(res.pipeline).substring(0,2000):'',
    execEntries.slice(),res.trace);
  if(execRowId&&typeof persistExecutionEvents==='function')persistExecutionEvents(execRowId,res.ctx);

  // La spiegazione si offre subito dopo il risultato: è il momento in cui ci
  // si chiede perché sia venuto così, non mezz'ora dopo nel registro storico.
  if(!inAttesa&&typeof explainExecution==='function'){
    window.__ultimaEsecuzione=res;
    addExecEntry('SISTEMA','🔍 <span style="text-decoration:underline;cursor:pointer" onclick="explainExecution(window.__ultimaEsecuzione)">Perché questo risultato?</span>: fonti usate, decisioni prese, controlli intervenuti','OK');
  }

  // I file prodotti restano riscaricabili: un download partito e perso
  // (finestra chiusa, blocco del browser) altrimenti richiederebbe di
  // rieseguire tutto il flusso per riaverlo.
  if(typeof LAST_RUN_FILES!=='undefined'&&LAST_RUN_FILES.length){
    addExecEntry('OUTPUT','📦 '+LAST_RUN_FILES.length+' file prodotti in questa esecuzione:','OK');
    LAST_RUN_FILES.forEach(function(f,i){
      addExecEntry('OUTPUT','   💾 <span style="text-decoration:underline;cursor:pointer" onclick="foRedownload('+i+')">'+escHtml(f.nome)+'</span>: clicca per riscaricare','OK');
    });
  }
  // A fine esecuzione la copia di lavoro si riallinea: la funzione sta in
  // storage.js, accanto al salvataggio automatico che la tiene aggiornata
  // durante la costruzione.
  if(typeof salvaCopiaDiLavoro==='function')salvaCopiaDiLavoro();
  if(!inAttesa)setTimeout(function(){B.nodes.forEach(function(n){delete n._execState});b_render()},4000);
}

// I due pulsanti stanno affiancati: Interrompi è sempre visibile ma attivo
// solo mentre qualcosa gira, così si sa che esiste prima di averne bisogno.
function toggleRunControls(inCorso){
  var run=document.getElementById('btnRun'), stop=document.getElementById('btnStop');
  if(run){run.disabled=inCorso;run.style.opacity=inCorso?.45:1;run.style.cursor=inCorso?'not-allowed':'pointer'}
  if(stop){stop.disabled=!inCorso;stop.style.opacity=inCorso?1:.4;stop.style.cursor=inCorso?'pointer':'not-allowed'}
}

function stopAgentRun(){
  if(typeof abortExecution!=='function')return;
  var n=abortExecution();
  if(!n){showToast('Nessuna esecuzione in corso');toggleRunControls(false);return}
  // L'interruzione tronca anche le chiamate di rete già partite: il registro
  // lo dice subito, nello stesso istante in cui succede.
  addExecEntry('SISTEMA','⏹️ Esecuzione interrotta dall\'utente: chiamate in corso annullate, i nodi successivi non partiranno','WARN');
  showToast('⏹️ Esecuzione interrotta');
}

// Richiesta di autorizzazione: compare sul canvas mentre l'esecuzione è
// ferma. È il punto in cui il sesto stato diventa visibile e azionabile.
function renderApprovalPrompt(res){
  hideApprovalPrompt();
  var node=B.nodes.find(function(n){return n.id===res.waiting.nodeId})||{};
  var cfg=node.config||{};
  var d=document.createElement('div');
  d.id='approvalPrompt';
  d.style.cssText='position:absolute;bottom:210px;left:50%;transform:translateX(-50%);z-index:40;width:440px;max-width:92%;background:var(--card);border:2px solid #D946EF;border-radius:14px;box-shadow:var(--sh-xl);padding:16px';
  d.innerHTML=
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
      '<span style="font-size:18px">✋</span>'+
      '<strong style="font-size:13px">Autorizzazione richiesta</strong>'+
      '<span class="badge badge-p" style="margin-left:auto;font-size:9px">in attesa</span></div>'+
    '<div style="font-size:12px;color:var(--tx2);line-height:1.5;margin-bottom:4px">'+escHtml(cfg.message||'Il flusso è sospeso su "'+(node.name||'controllo')+'" e riprenderà solo dopo autorizzazione.')+'</div>'+
    '<div style="font-size:11px;color:var(--tx4);margin-bottom:12px">Approvatore atteso: <strong>'+escHtml(cfg.approver||'—')+'</strong></div>'+
    '<div style="display:flex;gap:8px">'+
      '<button class="tb-btn primary" style="flex:1;justify-content:center" onclick="resolveApproval(\''+res.execId+'\',true)">✅ Autorizza e riprendi</button>'+
      '<button class="tb-btn" style="flex:1;justify-content:center;color:#EF4444;border-color:#FEE2E2" onclick="resolveApproval(\''+res.execId+'\',false)">⛔ Nega</button>'+
    '</div>';
  var ca=document.getElementById('canvasArea');
  if(ca)ca.appendChild(d);
}
function hideApprovalPrompt(){
  var e=document.getElementById('approvalPrompt');
  if(e)e.remove();
}

async function resolveApproval(execId,autorizzato){
  hideApprovalPrompt();
  document.getElementById('execDot').className='exec-log-dot running';
  var res=await resumeSuspendedRun(execId,autorizzato);
  if(!res){showToast('⚠️ Esecuzione non più sospesa');return}
  finalizeBuilderRun(res,Date.now());
}

// ══════════════════════════════════════════
// CONTESTO DEL WORKFLOW — istruzioni generali valide per l'intero agente
// (tono, vincoli, terminologia aziendale, cosa non fare) che ogni nodo AI
// del workflow deve rispettare, senza doverle ripetere nel system prompt di
// ciascun nodo singolarmente. Applicato in runAgent()/runAgentHeadless()
// anteponendolo al system prompt di ogni nodo AI eseguito.
// ══════════════════════════════════════════

function openContextModal(){
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>Contesto del workflow</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 16px">Istruzioni generali che si applicano a <strong>tutti</strong> i nodi AI di questo agente: tono di voce, terminologia aziendale, vincoli, cosa evitare. Vengono anteposte al system prompt di ogni singolo nodo AI durante l\'esecuzione, così non devi ripeterle nodo per nodo.</p>'+
    '<textarea class="prop-input" id="workflowContextInput" rows="8" placeholder="Es: Rispondi sempre in italiano, tono professionale e diretto. Non inventare mai numeri o dati che non sono nel contesto fornito. Il nome azienda è \'Acme SpA\', non usare altri nomi. Non menzionare mai i concorrenti per nome.">'+escHtml(B.context||'')+'</textarea>'+
    (typeof aiutoTestoHTML==='function'?aiutoTestoHTML('workflowContextInput','contesto',null,''):'')+
    '<button class="tb-btn primary mt-16" onclick="saveContext()">💾 Salva contesto</button>'
  ,true);
}

function saveContext(){
  B.context=document.getElementById('workflowContextInput').value.trim();
  closeModal();
  scheduleAutosave();
  showToast(B.context?'📋 Contesto salvato: verrà applicato a tutti i nodi AI':'📋 Contesto rimosso');
  addAct('Aggiornato contesto workflow: '+currentAgentName);
}

// ══════════════════════════════════════════
// PRODUZIONE — far girare un agente in automatico (intervallo o orario
// fisso) senza dover premere Esegui a mano. Limite onesto: gira solo
// finché QUESTA scheda del browser resta aperta, perché il POC non ha un
// server dietro le quinte (scelta architetturale del Cap. 3). Per un vero
// scheduling 24/7 la via già prevista dalla piattaforma è generare lo
// script Python (🐍) e pianificarlo con cron/Task Scheduler/CI — sezione 5
// del README.
// ══════════════════════════════════════════

// Eventi client-side reali a cui un agente può abbonarsi (nessun webhook
// server-side possibile in un'app senza backend, ma eventi generati DENTRO
// la piattaforma stessa sì): oggi solo "nuovo documento in Knowledge Base",
// estendibile con altre chiavi in futuro senza toccare lo scheduler.
var EVENT_TYPES={kbdoc_uploaded:'📚 Nuovo documento caricato in Knowledge Base'};

function fireEvent(eventKey){
  if(!DB)return;
  var due=dbAll('SELECT * FROM agents WHERE active=1 AND schedule_type=?',['event']).filter(function(r){return r.schedule_value===eventKey});
  due.forEach(function(row){runAgentHeadless(row)});
}

function openDeployModal(){
  if(typeof sandboxBlocca==='function'&&sandboxBlocca('pianificare'))return;
  if(!B.dbAgentId){showToast('⚠️ Salva prima l\'agente (💾) per poterlo mettere in produzione');return}
  var row=dbGetOne('SELECT * FROM agents WHERE id=?',[B.dbAgentId]);
  if(!row)return;
  var type=row.schedule_type||'manual';
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>Metti in produzione</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 16px">Fai girare "'+escHtml(row.name)+'" in automatico, senza premere Esegui ogni volta.</p>'+
    '<div class="prop-group"><div class="prop-label">Quando eseguire</div><select class="prop-select" id="deployType" onchange="onDeployTypeChange()">'+
      '<option value="manual"'+(type==='manual'?' selected':'')+'>Solo manuale (comportamento attuale)</option>'+
      '<option value="interval"'+(type==='interval'?' selected':'')+'>Ogni N minuti</option>'+
      '<option value="daily"'+(type==='daily'?' selected':'')+'>Una volta al giorno, a un orario fisso</option>'+
      // Il motore valuta le espressioni cron da sempre (`cronValida`,
      // `cronScaduto`, `descriviPianificazione`), ma il pannello non le offriva:
      // la quinta modalita' esisteva nel codice ed era irraggiungibile
      // dall'interfaccia.
      '<option value="cron"'+(type==='cron'?' selected':'')+'>Espressione cron (min ora giorno mese g.sett.)</option>'+
      '<option value="event"'+(type==='event'?' selected':'')+'>In base a un evento (trigger)</option>'+
    '</select></div>'+
    '<div id="deployValueWrap" class="prop-group" style="display:'+(type==='manual'?'none':'block')+'">'+
      '<div class="prop-label" id="deployValueLabel">'+(type==='daily'?'Orario (HH:MM)':type==='event'?'Evento':type==='cron'?'Espressione cron':'Ogni quanti minuti')+'</div>'+
      (type==='event'?
        '<select class="prop-select" id="deployValue">'+Object.keys(EVENT_TYPES).map(function(k){return '<option value="'+k+'"'+(row.schedule_value===k?' selected':'')+'>'+EVENT_TYPES[k]+'</option>'}).join('')+'</select>':
        '<input class="prop-input" id="deployValue" value="'+escHtml(row.schedule_value||'')+'" placeholder="'+(type==='daily'?'08:00':type==='cron'?'0 9 * * 1':'60')+'">'
      )+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:8px;margin:12px 0"><input type="checkbox" id="deployActive" '+(row.active?'checked':'')+' style="width:16px;height:16px"><label for="deployActive" style="font-size:12px">Attiva subito</label></div>'+
    '<div style="background:var(--ac2-l);border-radius:8px;padding:10px 14px;font-size:11px;color:var(--tx2);margin-bottom:16px">⚠️ Intervallo/orario/evento funzionano finché questa scheda del browser resta aperta (nessun server dietro le quinte: scelta di design del POC). Per esecuzione reale 24/7 su server: genera lo script Python (🐍) e pianificalo con cron / Task Scheduler / CI, guida nel README, sezione 5.</div>'+
    (row.last_run_at?'<div style="font-size:11px;color:var(--tx4);margin-bottom:12px">Ultima esecuzione automatica: '+new Date(row.last_run_at).toLocaleString('it-IT')+'</div>':'')+
    '<button class="tb-btn primary" onclick="saveDeploySettings()">💾 Salva impostazioni</button>'
  ,true);
}

function onDeployTypeChange(){
  var type=document.getElementById('deployType').value;
  var wrap=document.getElementById('deployValueWrap');
  wrap.style.display=type==='manual'?'none':'block';
  document.getElementById('deployValueLabel').textContent=type==='daily'?'Orario (HH:MM)':type==='event'?'Evento':type==='cron'?'Espressione cron':'Ogni quanti minuti';
  if(type==='event'){
    document.getElementById('deployValue').outerHTML='<select class="prop-select" id="deployValue">'+Object.keys(EVENT_TYPES).map(function(k){return '<option value="'+k+'">'+EVENT_TYPES[k]+'</option>'}).join('')+'</select>';
  }else{
    var existing=document.getElementById('deployValue');
    if(existing.tagName==='SELECT'){
      existing.outerHTML='<input class="prop-input" id="deployValue" placeholder="'+(type==='daily'?'08:00':type==='cron'?'0 9 * * 1':'60')+'">';
    }else{
      existing.placeholder=type==='daily'?'08:00':type==='cron'?'0 9 * * 1':'60';
    }
  }
}

function saveDeploySettings(){
  var type=document.getElementById('deployType').value;
  var valEl=document.getElementById('deployValue');
  var val=valEl?valEl.value.trim():'';
  var active=document.getElementById('deployActive').checked?1:0;
  if(type!=='manual'&&!val){showToast('⚠️ Specifica il valore della pianificazione');return}
  // Un'espressione cron sbagliata verrebbe salvata in silenzio e l'agente non
  // partirebbe mai, senza che nulla lo dica: l'unico sintomo sarebbe un flusso
  // "in produzione" che non si esegue.
  if(type==='cron'&&typeof cronValida==='function'&&!cronValida(val)){
    showToast('\u26a0\ufe0f Espressione cron non valida: cinque campi, es. "0 9 * * 1" (lunedi\u0300 alle 9)');return;
  }
  dbRun('UPDATE agents SET active=?,schedule_type=?,schedule_value=? WHERE id=?',[active,type,val,B.dbAgentId]);
  closeModal();
  showToast(active?'🚀 Agente in produzione: verrà eseguito automaticamente':'⏸️ Pianificazione disattivata');
  addAct((active?'Attivato':'Disattivato')+' in produzione: '+currentAgentName);
  if(currentPage==='execlog')renderExecLogPage();
}

// ── Gestione dalla sezione "Esecuzioni pianificate" nel Log Esecuzioni —
// azioni rapide senza dover riaprire ogni agente nel Builder uno per uno. ──

// "Esegui ora" dalla sezione pianificate: prima girava headless in
// background e si vedeva solo un toast a fine corsa — l'utente voleva
// invece la STESSA esperienza di premere Esegui nel Builder (log con
// avanzamento nodo-per-nodo in tempo reale). Carichiamo quindi l'agente nel
// canvas e lanciamo il motore interattivo runAgent(), non quello headless.
function triggerScheduledAgentNow(id){
  var row=dbGetOne('SELECT * FROM agents WHERE id=?',[id]);
  if(!row){showToast('⚠️ Agente non trovato');return}
  try{
    B.nodes=JSON.parse(row.nodes_json);B.edges=JSON.parse(row.edges_json);B.nextId=row.next_id||1;
    B.selId=-1;currentAgentName=row.name;B.dbAgentId=row.id;B.context=row.context||'';
    go('builder');b_render();
    runAgent();
  }catch(e){showToast('⚠️ Errore caricamento agente')}
}

function editScheduledAgent(id){
  var row=dbGetOne('SELECT * FROM agents WHERE id=?',[id]);
  if(!row){showToast('⚠️ Agente non trovato');return}
  try{
    B.nodes=JSON.parse(row.nodes_json);B.edges=JSON.parse(row.edges_json);B.nextId=row.next_id||1;
    B.selId=-1;currentAgentName=row.name;B.dbAgentId=row.id;B.context=row.context||'';
    go('builder');b_render();
    openDeployModal();
  }catch(e){showToast('⚠️ Errore caricamento agente')}
}

function deactivateScheduledAgent(id){
  dbRun('UPDATE agents SET active=0 WHERE id=?',[id]);
  showToast('⏸️ Pianificazione disattivata');
  if(B.dbAgentId===id){/* nessun cambio al canvas se è l'agente aperto */}
  if(currentPage==='execlog')renderExecLogPage();
}

function isScheduleDue(row){
  if(!row.active)return false;
  var now=new Date();
  if(row.schedule_type==='interval'){
    var mins=parseInt(row.schedule_value)||60;
    if(!row.last_run_at)return true;
    return (now-new Date(row.last_run_at))>=mins*60000;
  }
  if(row.schedule_type==='daily'){
    var parts=(row.schedule_value||'08:00').split(':');
    var hh=parseInt(parts[0])||0,mm=parseInt(parts[1])||0;
    var scheduled=new Date(now.getFullYear(),now.getMonth(),now.getDate(),hh,mm);
    if(now<scheduled)return false;
    if(row.last_run_at&&new Date(row.last_run_at)>=scheduled)return false;
    return true;
  }
  // Le espressioni cron non erano gestite: un agente pianificato con cron
  // risultava attivo ma non partiva mai, e non c'era modo di accorgersene
  // guardando l'interfaccia — diceva "pianificato" e basta.
  if(row.schedule_type==='cron')return cronScaduto(row.schedule_value,row.last_run_at,now);
  return false;
}

// Valutazione di un'espressione cron a cinque campi: minuto, ora, giorno del
// mese, mese, giorno della settimana. Sono ammessi `*`, valori singoli, elenchi
// separati da virgola, intervalli `a-b` e passi `*/n` — cioè tutto ciò che si
// scrive normalmente. Costrutti più esotici non sono supportati e vengono
// dichiarati come tali invece di essere ignorati in silenzio.
function cronCampoCorrisponde(campo,valore){
  if(campo==='*')return true;
  return String(campo).split(',').some(function(p){
    var passo=p.split('/');
    var base=passo[0], n=passo[1]?parseInt(passo[1],10):1;
    if(base==='*')return n>0&&(valore%n===0);
    if(base.indexOf('-')>0){
      var ab=base.split('-'), a=parseInt(ab[0],10), b=parseInt(ab[1],10);
      return valore>=a&&valore<=b&&((valore-a)%n===0);
    }
    return parseInt(base,10)===valore;
  });
}

function cronValida(espr){
  var c=String(espr||'').trim().split(/\s+/);
  if(c.length!==5)return false;
  return c.every(function(x){return /^[\d*,\-\/]+$/.test(x)});
}

function cronCorrispondeOra(espr,d){
  var c=String(espr||'').trim().split(/\s+/);
  if(c.length!==5)return false;
  return cronCampoCorrisponde(c[0],d.getMinutes())
      && cronCampoCorrisponde(c[1],d.getHours())
      && cronCampoCorrisponde(c[2],d.getDate())
      && cronCampoCorrisponde(c[3],d.getMonth()+1)
      // Nel cron la domenica è 0; JavaScript usa la stessa convenzione.
      && cronCampoCorrisponde(c[4],d.getDay());
}

function cronScaduto(espr,ultimaEsecuzione,adesso){
  if(!cronValida(espr))return false;
  // Lo scheduler gira ogni 30 secondi: si guarda al minuto corrente, e si
  // controlla di non aver già eseguito in QUESTO minuto. Senza, un'espressione
  // che corrisponde farebbe partire il flusso due volte di fila.
  if(!cronCorrispondeOra(espr,adesso))return false;
  if(!ultimaEsecuzione)return true;
  var u=new Date(ultimaEsecuzione);
  return !(u.getFullYear()===adesso.getFullYear()&&u.getMonth()===adesso.getMonth()&&
           u.getDate()===adesso.getDate()&&u.getHours()===adesso.getHours()&&
           u.getMinutes()===adesso.getMinutes());
}

// Descrizione leggibile di una pianificazione, usata nell'elenco: "0 7 * * 1"
// non dice niente a chi non conosce cron.
function descriviPianificazione(tipo,valore){
  if(tipo==='interval')return 'Ogni '+(valore||'60')+' minuti';
  if(tipo==='daily')return 'Ogni giorno alle '+(valore||'08:00');
  if(tipo==='cron'){
    if(!cronValida(valore))return 'Espressione cron non valida: '+(valore||'(vuota)');
    var c=String(valore).trim().split(/\s+/);
    var giorni=['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
    var ora=(c[1]==='*'?'ogni ora':c[1].padStart(2,'0')+':'+(c[0]==='*'?'00':String(c[0]).padStart(2,'0')));
    if(c[4]!=='*'&&/^\d$/.test(c[4]))return 'Ogni '+giorni[+c[4]]+' alle '+ora;
    if(c[2]!=='*')return 'Il giorno '+c[2]+' di ogni mese alle '+ora;
    return 'Ogni giorno alle '+ora;
  }
  return 'Manuale: non parte da sola';
}

var _schedulerTimer=null;
function startScheduler(){
  if(_schedulerTimer)return;
  _schedulerTimer=setInterval(checkScheduledAgents,30000);
  checkScheduledAgents();
}

async function checkScheduledAgents(){
  if(!DB)return;
  var due;
  try{due=dbAll('SELECT * FROM agents WHERE active=1').filter(isScheduleDue)}catch(e){return}
  for(var i=0;i<due.length;i++){await runAgentHeadless(due[i])}
}

// Esegue un workflow salvato SENZA toccare il canvas del builder (l'utente
// potrebbe avere in corso la modifica di un agente diverso): usato dallo
// scheduler per l'esecuzione automatica in background. Duplica una
// versione semplificata del motore di runAgent() invece di riusarlo
// direttamente perché quest'ultimo è accoppiato al rendering del canvas
// (B, b_render, addExecEntry) — qui serve solo il risultato finale, loggato
// in Log Esecuzioni con modalità "scheduled".
// Esecuzione automatica (scheduler, eventi, "Esegui ora" da elenco).
// Stesso motore dell'esecuzione interattiva, senza canvas: cambia solo
// l'ascoltatore degli eventi, che qui non deve disegnare nulla.
// `modo` distingue l'avvio automatico dello scheduler da quello premuto a mano
// dalla pagina «I miei agenti». Prima era fisso a 'scheduled': una corsa
// lanciata da una persona finiva fra le PIANIFICATE, e il Log Esecuzioni —
// che separa le due proprio per rispondere a «e' partito da solo o l'ha
// lanciato qualcuno?» — dava la risposta sbagliata. Anche l'attribuzione
// cambia: una pianificata appartiene all'autore dell'agente, una manuale a
// chi l'ha premuta.
async function runAgentHeadless(row, modo){
  var nodes,edges;
  try{nodes=JSON.parse(row.nodes_json);edges=JSON.parse(row.edges_json)}catch(e){return}
  if(!nodes||!nodes.length)return;
  var _t0=Date.now();

  var res=await executeGraph({
    nodes:nodes, edges:edges, context:row.context||'',
    agentName:row.name, agentId:row.id, headless:true,
    onEvent:function(){}
  });

  // In esecuzione automatica non c'è nessuno che possa autorizzare: la
  // sospensione viene registrata come tale invece di essere scavalcata.
  var stato=res.status==='waiting'?'waiting':(res.status==='error'?'err':'ok');
  if(res.status==='waiting'){
    res.steps.push({time:new Date().toTimeString().substring(0,8),type:'CONTROLLO',
      msg:'⏸️ Sospeso in attesa di approvazione: nessun operatore in esecuzione automatica',status:'WARN'});
  }

  // Attribuita all'autore dell'agente: è il suo flusso che è partito, non
  // quello di chi si trovava connesso quando lo scheduler è scattato.
  var manuale=(modo==='manual');
  var execRowId=recordExecution(row.name,res.stepsCount,stato,res.duration||(Date.now()-_t0),manuale?'manual':'scheduled',
    res.pipeline?String(res.pipeline).substring(0,2000):'',res.steps,res.trace,manuale?utenteCorrente():row.author);
  if(execRowId&&typeof persistExecutionEvents==='function')persistExecutionEvents(execRowId,res.ctx);

  dbRun('UPDATE agents SET last_run_at=? WHERE id=?',[new Date().toISOString(),row.id]);
  if(typeof updateStatCards==='function')updateStatCards();
  if(typeof renderExecLogPage==='function'&&currentPage==='execlog')renderExecLogPage();
  return res;
}

// ══════════════════════════════════════════
// VALIDAZIONE WORKFLOW — impedisce run/save/export/publish
// su grafi incoerenti (nodi orfani, rami mancanti, config incompleta)
// ══════════════════════════════════════════

function validateWorkflow(){
  var errors=[];
  // Si convalida il grafo EFFETTIVO, cioè quello che verrà eseguito davvero:
  // i nodi esclusi sono già ricuciti fuori. Così un nodo escluso non genera
  // errori sui propri campi, ma se la sua esclusione spezza il flusso — per
  // esempio togliendo l'unico output — il problema emerge qui e non al Run.
  var eff=(typeof rtGrafoEffettivo==='function')
    ? rtGrafoEffettivo(B.nodes,B.edges)
    : {nodes:B.nodes,edges:B.edges,esclusi:[]};
  var nodes=eff.nodes,edges=eff.edges;
  if(nodes.length===0){
    errors.push({nodeId:null,msg: B.nodes.length
      ? 'Tutti i nodi del flusso sono esclusi dall\'esecuzione: reinseriscine almeno uno (Ctrl+E).'
      : 'Il canvas è vuoto, aggiungi almeno un nodo trigger per iniziare.'});
    return errors;
  }

  var ids={};nodes.forEach(function(n){ids[n.id]=true});
  var hasIncoming={},outByNode={};
  edges.forEach(function(e){
    if(!ids[e.from]||!ids[e.to]){
      errors.push({nodeId:null,msg:'Una connessione punta a un nodo che non esiste più (edge orfano): rimuovila e ricollega.'});
      return;
    }
    hasIncoming[e.to]=true;
    (outByNode[e.from]=outByNode[e.from]||[]).push(e.fp);
  });

  // ── Nodi che non corrispondono a nessuna voce di palette ──
  // Un nodo il cui nome non è riconosciuto non ha definizione: nessun campo
  // obbligatorio da compilare, quindi nessun errore da segnalare, quindi la
  // convalida lo lasciava passare in silenzio. All'esecuzione non fa niente di
  // ciò che il suo nome promette. È il caso dei nomi inventati dalla chat, ma
  // vale anche per un nodo rinominato a mano.
  //
  // Riguarda solo i tipi la cui identità sta nel nome — azioni, trigger,
  // controlli, condizioni. I nodi AI e di output hanno un nome libero per
  // costruzione: quello che fanno sta nella loro configurazione, non
  // nell'etichetta.
  if(typeof PALETTE!=='undefined'){
    // Le CONDIZIONI restano fuori: il loro nome e' l'etichetta del test
    // («Punteggio >= 70?») e va scritta da chi costruisce, come per i nodi AI.
    // Sono azioni, trigger e controlli ad avere il nome come identità: è da
    // quello che l'applicazione risale ai loro parametri.
    var conNomeVincolante={ac:"un'azione",tr:'un trigger',gr:'un controllo'};
    nodes.forEach(function(n){
      var etichetta=conNomeVincolante[n.type];
      if(!etichetta)return;
      var noto=PALETTE.some(function(p){ return p.type===n.type && p.name===n.name });
      if(noto)return;
      // Messaggio BREVE e specifico. La spiegazione — identica per tutti i
      // nodi di questa famiglia — viaggia in `kind`, e chi mostra l'elenco la
      // scrive una volta sola: ripeterla su ogni riga la rendeva illeggibile
      // proprio quando i nodi da sistemare erano più di uno.
      errors.push({nodeId:n.id, kind:'nome-ignoto',
        msg:'"'+n.name+'" non corrisponde a '+etichetta+' della palette'});
    });
  }

  var triggers=nodes.filter(function(n){return n.type==='tr'});
  if(triggers.length===0)errors.push({nodeId:null,msg:'Manca un nodo Trigger: ogni workflow deve partire da un evento (Webhook, Scheduler, Email...).'});

  // ── Il flusso deve CHIUDERSI su un output ──
  // Un ramo che finisce su un'azione lascia l'esito da nessuna parte: non
  // resta traccia di cosa è stato prodotto né di come è andata.
  var terminali=nodes.filter(function(n){return !edges.some(function(e){return e.from===n.id})});
  terminali.forEach(function(n){
    if(n.type==='ou')return;
    if(n.type==='tr'){
      errors.push({nodeId:n.id,msg:'"'+n.name+'" è un trigger ma non porta da nessuna parte: un flusso non può iniziare e finire sullo stesso nodo.'});
    }else if(n.type==='cd'){
      errors.push({nodeId:n.id,msg:'"'+n.name+'" è una condizione senza rami collegati: collega le uscite Sì e No.'});
    }else{
      errors.push({nodeId:n.id,msg:'Il ramo che termina su "'+n.name+'" non si chiude con un nodo di output: aggiungine uno per registrare l\'esito.'});
    }
  });

  // ── Nodi AI senza modello collegato ──
  // Eseguire lo stesso produrrebbe testo [Demo] che sembra una risposta vera:
  // il flusso "funzionerebbe" restituendo un risultato inventato. Meglio
  // fermarsi e dire quale nodo e quale fornitore mancano.
  var nodiAI=nodes.filter(function(n){return n.type==='ai'||n.type==='sa'});
  if(nodiAI.length){
    var pronto=(typeof anyProviderReady==='function')?anyProviderReady():null;
    if(!pronto){
      errors.push({nodeId:nodiAI[0].id,msg:'Il flusso contiene '+nodiAI.length+' nodo/i che usano l\'AI ma nessun modello è collegato: apri il pannello «Integrazione AI» a sinistra, configura un provider (o un modello in locale) e premi Testa.'});
    }else{
      // Con "Automatico" (predefinito) basta che UN fornitore sia collegato,
      // già verificato qui sopra. Si segnala solo chi ha scelto esplicitamente
      // un fornitore diverso da quelli connessi: lì la sostituzione va decisa
      // dall'utente, non subita in silenzio.
      nodiAI.forEach(function(n){
        var scelta=(n.config&&n.config.model)||'auto';
        if(scelta==='auto')return;
        var prov=(typeof normalizeProviderName==='function')?normalizeProviderName(scelta):scelta;
        var pc=aiConfig.providers&&aiConfig.providers[prov];
        if(!pc||pc.status!=='ok'){
          errors.push({nodeId:n.id,msg:'"'+n.name+'" è impostato su '+providerLabel(prov)+', che non è connesso. Collega quel provider, scegli '+providerLabel(pronto)+', oppure imposta il provider su «Automatico».'});
        }
      });
    }
  }

  nodes.forEach(function(n){
    if(n.type!=='tr'&&!hasIncoming[n.id]){
      errors.push({nodeId:n.id,msg:'"'+n.name+'" non ha nessuna freccia in ingresso: collegalo al resto del workflow o eliminalo.'});
    }
    // NB: la chiusura del ramo è verificata più sotto da un'unica regola sui
    // nodi terminali. Qui resta solo il caso della condizione, che ha due
    // porte e va segnalata anche quando una sola delle due è scollegata.
    if(n.type==='cd'&&n.name==='Condition'){
      var outs=outByNode[n.id]||[];
      if(outs.indexOf('true')<0||outs.indexOf('false')<0){
        errors.push({nodeId:n.id,msg:'"'+n.name+'" ha bisogno di entrambi i rami collegati (Sì e No) per essere valutabile.'});
      }
    }
    // Un nodo senza provider scelto non è più un errore: vale "Automatico",
    // cioè il fornitore collegato. Che almeno uno lo sia è già verificato sopra.
    if(n.type==='ac'){
      var cc=getConnectorConfig(n.name);
      if(cc&&cc.fields&&cc.fields.length){
        // Ogni campo marcato req:true è obbligatorio; se nessuno lo è
        // esplicitamente, si presume obbligatorio il primo campo (era il
        // comportamento originale, mantenuto per i connettori non ancora
        // annotati).
  // Un campo fornito dalla connessione non e' "non compilato": e' compilato
        // altrove. Chiederlo di nuovo bloccherebbe un flusso valido.
        var copertiV=(typeof campiCopertiDaConnessione==='function')?campiCopertiDaConnessione(n.name,n.config):{};
        var reqFields=campiObbligatoriEffettivi(cc,n.config||{}).filter(function(f){return !copertiV[f.k]});
        if(!reqFields.length)reqFields=[cc.fields[0]];
        reqFields.forEach(function(f){
          if(!n.config||!n.config[f.k]||!String(n.config[f.k]).trim()){
            errors.push({nodeId:n.id,msg:'"'+n.name+'": compila il campo obbligatorio "'+f.l+'".'});
          }
        });
      }
    }
    // Trigger: stessa regola dei connettori, guidata da TRIGGER_CONFIGS invece
    // che da due casi cablati a mano (prima solo Webhook e Scheduler venivano
    // controllati, e gli altri cinque passavano senza sorgente dichiarata).
    if(n.type==='tr'){
      var td=TRIGGER_CONFIGS[n.name];
      if(td&&td.fields){
        campiObbligatoriEffettivi(td,n.config||{}).forEach(function(f){
          if(!n.config||!n.config[f.k]||!String(n.config[f.k]).trim()){
            errors.push({nodeId:n.id,msg:'"'+n.name+'": compila il campo obbligatorio "'+f.l+'".'});
          }
        });
      }
      // Parametri dichiarati e marcati obbligatori: se mancano, il flusso
      // partirebbe con dati incompleti e il risultato non direbbe nulla.
      if(n.config&&n.config.campi&&typeof parseCampiTrigger==='function'){
        var valori=n.config.valori||{};
        parseCampiTrigger(n.config.campi).filter(function(c){return c.req}).forEach(function(c){
          if(!String(valori[c.k]||'').trim()){
            errors.push({nodeId:n.id,msg:'"'+n.name+'": manca il parametro obbligatorio "'+c.l+'" ('+c.k+').'});
          }
        });
      }
      // Requisito alternativo: basta uno dei campi elencati.
      if(td&&td.reqAny){
        td.reqAny.forEach(function(g){
          var soddisfatto=g.ks.some(function(k){return n.config&&n.config[k]&&String(n.config[k]).trim()});
          if(!soddisfatto){
            errors.push({nodeId:n.id,msg:'"'+n.name+'": serve '+g.l+', senza sorgente il flusso girerebbe su dati campione.'});
          }
        });
      }
    }
    // Nodi terminali: i campi obbligatori vivono in LOGIC_CONFIGS, e chi scrive
    // su cloud ha un requisito in più che nessun campo di testo può esprimere —
    // il permesso sulla cartella, che si ottiene solo con un click dell'utente.
    if(n.type==='ou'){
      var od=LOGIC_CONFIGS[n.name];
      if(od&&od.fields){
        campiObbligatoriEffettivi(od,n.config||{}).forEach(function(f){
          if(!n.config||!n.config[f.k]||!String(n.config[f.k]).trim()){
            errors.push({nodeId:n.id,msg:'"'+n.name+'": compila il campo obbligatorio "'+f.l+'".'});
          }
        });
      }
    }
    // Il requisito della cartella collegata vale per QUALSIASI nodo che scriva
    // su disco — terminali e connettori Drive/SharePoint allo stesso modo — e
    // non è esprimibile con un campo di testo: il permesso si ottiene solo con
    // un click dell'utente sul selettore di sistema.
    if(typeof needsCloudFolder==='function'&&needsCloudFolder(n)){
      var dst=csDestinazione(cloudDestKey(n.config||{}));
      var dest=(typeof connCartellaDelNodo==='function')
        ? connCartellaDelNodo(n.config||{}) : {alias:(n.config||{}).cloudAlias,provata:false};
      if(dst.reale&&csSupportata()&&!dest.alias){
        errors.push({nodeId:n.id,msg:'"'+n.name+'": scegli una connessione a cartella, senza, il file non può essere scritto. Creane una dal pannello del nodo.'});
      }else if(dst.reale&&dest.alias&&dest.nome&&!dest.provata){
        // Non è bloccante: la connessione potrebbe funzionare comunque. È però
        // il momento giusto per dirlo, invece di scoprirlo a esecuzione fallita.
        errors.push({nodeId:n.id,tipo:'avviso',
          msg:'"'+n.name+'": la connessione "'+dest.nome+'" non è mai stata provata. Premi «Prova la connessione» nel pannello.'});
      }
    }
    // Controlli: stessa regola dei connettori sui campi obbligatori.
    if(n.type==='gr'){
      var gd=getGuardrailConfig(n.name);
      if(gd&&gd.fields){
        campiObbligatoriEffettivi(gd,n.config||{}).forEach(function(f){
          if(!n.config||!n.config[f.k]||!String(n.config[f.k]).trim()){
            errors.push({nodeId:n.id,msg:'"'+n.name+'": compila il campo obbligatorio "'+f.l+'".'});
          }
        });
      }
    }
  });

  // Raggiungibilità dal trigger: i controlli precedenti intercettano il nodo
  // isolato (nessuna freccia in ingresso), ma non due catene separate
  // entrambe collegate al proprio interno — quella a valle non partirebbe
  // mai e il flusso girerebbe monco senza dirlo.
  if(triggers.length){
    var raggiunti={};
    (function esplora(id){
      if(raggiunti[id])return;
      raggiunti[id]=true;
      edges.filter(function(e){return e.from===id}).forEach(function(e){esplora(e.to)});
    });
    triggers.forEach(function(t){
      (function esplora(id){
        if(raggiunti[id])return;
        raggiunti[id]=true;
        edges.filter(function(e){return e.from===id}).forEach(function(e){esplora(e.to)});
      })(t.id);
    });
    nodes.forEach(function(n){
      if(!raggiunti[n.id]){
        errors.push({nodeId:n.id,msg:'"'+n.name+'" non è raggiungibile dal trigger: fa parte di un ramo scollegato dal resto del flusso e non verrebbe mai eseguito.'});
      }
    });
  }

  // `severity` distingue ciò che impedisce l'esecuzione da ciò che va solo
  // segnalato (serve alla verifica di pubblicazione, blocco D2). Default
  // 'blocking' così i chiamanti esistenti — che leggono solo .length e .msg —
  // si comportano esattamente come prima.
  errors.forEach(function(e){ if(!e.severity) e.severity='blocking' });
  return errors;
}

function markInvalidNodes(errors){
  B._invalidIds={};
  errors.forEach(function(e){if(e.nodeId!=null)B._invalidIds[e.nodeId]=true});
  b_render();
}

function clearInvalidNodes(){B._invalidIds=null}

// Il pannello distingue due piani, perché hanno conseguenze diverse:
// i problemi BLOCCANTI impediscono l'esecuzione, i SUGGERIMENTI di presidio
// sono raccomandazioni motivate dal rischio del flusso, accettabili a un
// click o ignorabili. Mescolarli renderebbe le seconde rumore da chiudere.
function showValidationErrors(errors){
  errors=errors||[];
  markInvalidNodes(errors);
  var sugg=(typeof suggestGuardrails==='function')?suggestGuardrails():[];
  var ok=errors.length===0;

  var html='<div style="display:flex;justify-content:space-between;align-items:center">'+
    '<h2>'+(ok?'🔍 Verifica del flusso':'⚠️ Workflow non valido')+'</h2>'+
    '<button class="modal-close" onclick="closeModal()">✕</button></div>';

  if(errors.length){
    html+='<p style="font-size:12px;color:var(--tx3);margin:10px 0 4px">Il flusso si salva e si esporta comunque. Questi punti vanno risolti prima di <strong>eseguirlo</strong> o <strong>pubblicarlo</strong>:</p>'+
      '<div class="validation-list">'+
      errors.map(function(e){
        return '<div class="validation-item" onclick="'+(e.nodeId!=null?'jumpToNode('+e.nodeId+');':'')+'closeModal()">'+
          '<span class="vi-ic">'+(e.nodeId!=null?'📍':'🔴')+'</span><span class="vi-msg">'+escHtml(e.msg)+'</span></div>';
      }).join('')+
      '</div>';
    // La spiegazione dei blocchi non riconosciuti è la stessa per tutti: sta
    // sotto l'elenco, scritta una volta. Ripeterla su ogni riga rendeva
    // l'elenco illeggibile proprio quando i nodi da sistemare erano parecchi.
    if(errors.some(function(e){return e.kind==='nome-ignoto'})){
      html+='<div style="display:flex;gap:9px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:9px;'+
        'padding:10px 12px;margin-top:10px;font-size:11px;color:#92400E;line-height:1.5">'+
        '<span style="flex-shrink:0">💡</span><span>I blocchi elencati non corrispondono a nessuna voce della '+
        'palette: non hanno parametri da configurare e all’esecuzione non faranno quello che il nome promette. '+
        'Sostituiscili con i blocchi corrispondenti presi dalla palette.</span></div>';
    }
  }else{
    html+='<div style="display:flex;gap:10px;align-items:center;background:var(--ac-l);border-radius:8px;padding:12px 14px;margin:12px 0">'+
      '<span style="font-size:18px">✅</span><span style="font-size:12px;color:var(--ac-d);font-weight:600">Struttura valida: il flusso è eseguibile</span></div>';
  }

  // Condizioni che citano campi inesistenti: non impediscono l'esecuzione (il
  // flusso gira lo stesso), ma spengono per sempre un ramo. Vanno mostrate
  // anche quando la struttura e' valida, perche' e' proprio quello il caso in
  // cui nessun altro controllo dice niente e il nodo a valle sembra "inerte".
  var avvCond=(typeof verificaCondizioni==='function')?verificaCondizioni(B.nodes,B.edges):[];
  if(avvCond.length){
    html+='<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin:18px 0 8px">'+
      '\u26a0\ufe0f Rami che non partiranno mai ('+avvCond.length+')</div>'+
      '<div class="validation-list">'+
      avvCond.map(function(a){
        return '<div class="validation-item" style="background:#FFFBEB;border-color:#FDE68A" onclick="jumpToNode('+a.nodeId+');closeModal()">'+
          '<span class="vi-ic">\u26a0\ufe0f</span><span class="vi-msg">'+escHtml(a.msg)+'</span></div>';
      }).join('')+
      '</div>';
  }

  if(sugg.length){
    html+='<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin:18px 0 8px">'+
      '🛡️ Presidi consigliati ('+sugg.length+')</div>'+
      '<p style="font-size:11px;color:var(--tx4);margin:0 0 10px;line-height:1.5">Suggerimenti basati su ciò che il flusso tratta davvero. Non bloccano l\'esecuzione: valuta caso per caso se sono pertinenti.</p>'+
      '<div class="validation-list">'+
      sugg.map(function(s){
        var g=getGuardrailConfig(s.guardrail);
        return '<div class="validation-item" style="background:#FDF4FF;border-color:#F5D0FE;cursor:default;align-items:center">'+
          '<span class="vi-ic">'+(g?g.icon:'🛡️')+'</span>'+
          '<span class="vi-msg" style="flex:1">'+
            '<strong>'+escHtml(s.guardrail)+'</strong>'+(s.from==='politica'?' <span class="badge badge-p" style="font-size:9px">politica</span>':'')+
            '<div style="font-size:11px;color:var(--tx3);margin-top:2px;line-height:1.45">'+escHtml(s.reason)+'</div>'+
          '</span>'+
          '<button class="tb-btn" style="font-size:11px;height:26px;flex-shrink:0" onclick="jumpToNode('+s.nodeId+')">📍</button>'+
          '<button class="tb-btn primary" style="font-size:11px;height:26px;flex-shrink:0" onclick="insertSuggestedGuardrail('+s.nodeId+',\''+s.guardrail.replace(/'/g,"\\'")+'\',\''+s.placement+'\')">+ Inserisci</button>'+
        '</div>';
      }).join('')+
      '</div>';
  }else if(ok){
    html+='<div style="font-size:11px;color:var(--tx4);margin-top:14px">Nessun presidio aggiuntivo consigliato per questo flusso.</div>';
  }

  openModal(html,true);
  if(errors.length)showToast('⚠️ '+errors.length+' problema/i da risolvere nel workflow');
}

// Completa i campi obbligatori rimasti vuoti con i valori suggeriti dalla
// definizione del componente (`ph`). Serve ai flussi generati — dalla Chat
// AI o dai template — che devono essere ESEGUIBILI subito: un flusso appena
// generato che si apre con un errore bloccante ("specifica il path
// dell'endpoint") non è generato, è abbozzato. Non tocca i campi che
// l'utente ha già compilato.
// Accetta un elenco di nodi: serve anche a migrare i flussi già salvati quando
// un connettore acquisisce nuovi campi obbligatori, senza che l'utente debba
// riaprirli uno per uno per scoprire che ora manca qualcosa.
function fillRequiredDefaults(elenco){
  var toccati=0;
  (elenco||B.nodes).forEach(function(n){
    var def=n.type==='ac'?getConnectorConfig(n.name)
           :n.type==='tr'?(typeof TRIGGER_CONFIGS!=='undefined'?TRIGGER_CONFIGS[n.name]:null)
           :n.type==='gr'?getGuardrailConfig(n.name)
           :(typeof LOGIC_CONFIGS!=='undefined'?LOGIC_CONFIGS[n.name]:null);
    if(!def||!def.fields)return;
    if(!n.config)n.config={};
    // Stessa regola della validazione: req espliciti, altrimenti il primo
    // campo per i soli connettori Action.
    var req=campiObbligatoriEffettivi(def,n.config);
    // Stessa regola del controllo: non si riempie con un segnaposto un campo
    // che la connessione fornisce gia'.
    var copertiR=(typeof campiCopertiDaConnessione==='function')?campiCopertiDaConnessione(n.name,n.config):{};
    req=req.filter(function(f){return !copertiR[f.k]});
    if(!req.length&&n.type==='ac'&&def.fields[0])req=[def.fields[0]];
    // Il ripiego "primo campo" va filtrato anche lui: su HTTP Request il primo
    // campo e' proprio l'URL, che la connessione fornisce. Riempirlo con il
    // segnaposto lascerebbe sul nodo un indirizzo finto e mai usato.
    req=req.filter(function(f){return !copertiR[f.k]});
    req.forEach(function(f){
      if(n.config[f.k]&&String(n.config[f.k]).trim())return;
      n.config[f.k]=(function(){var o=opzioniDelCampo(f,n.config);return o?((f.ph&&o.indexOf(f.ph)>=0)?f.ph:o[0]):(f.ph||'')})();
      toccati++;
    });
    // Valori fuori dall'elenco delle scelte: capitano con i flussi importati o
    // generati, dove un campo a scelta chiusa si ritrova con un valore tecnico
    // ("text/plain" invece di "Testo"). La tendina lo mostra vuoto e non si
    // capisce perche', quindi si riporta dentro l'elenco.
    def.fields.forEach(function(f){
      var o=opzioniDelCampo(f,n.config);
      if(!o||!o.length)return;
      var v=n.config[f.k];
      if(v===undefined||v===null||v===''||o.indexOf(v)>=0)return;
      var s=String(v).toLowerCase();
      var vicino=o.filter(function(x){var t=String(x).toLowerCase();return s.indexOf(t)>=0||t.indexOf(s)>=0})[0];
      if(!vicino&&/html/.test(s))vicino=o.filter(function(x){return /html/i.test(x)})[0];
      n.config[f.k]=vicino||((f.ph&&o.indexOf(f.ph)>=0)?f.ph:o[0]);
      toccati++;
    });
    // Il path di un webhook non può essere il testo di esempio: si deriva
    // dal nome del nodo, così resta sensato e distinto per flusso.
    if(n.type==='tr'&&n.name==='Webhook'&&/^\/hooks\/lead-intake$/.test(n.config.path||'')){
      n.config.path='/hooks/'+(currentAgentName||'flusso').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').substring(0,28);
    }
  });
  return toccati;
}

// Verifica su richiesta: mostra anche i suggerimenti quando il flusso è già
// valido, che altrimenti resterebbero invisibili (il pannello si apriva solo
// in caso di errore bloccante).
function checkWorkflow(){
  var errs=validateWorkflow();
  if(!errs.length)clearInvalidNodes();
  showValidationErrors(errs);
}

// Indicatore discreto nell'intestazione del pannello proprietà: segnala che
// ci sono presidi consigliati senza interrompere chi sta lavorando.
function updateSuggestionBadge(){
  var el=document.getElementById('suggBadge');
  if(!el)return;
  var n=(typeof suggestGuardrails==='function'&&B.nodes.length)?suggestGuardrails().length:0;
  el.style.display=n?'inline-flex':'none';
  el.textContent='🛡️ '+n;
  el.title=n+' presidio/i consigliato/i per questo flusso: clicca per vederli';
}

function jumpToNode(nid){
  B.selId=nid;
  var n=B.nodes.find(function(x){return x.id===nid});
  if(n){B.panX=-n.x*B.zoom+240;B.panY=-n.y*B.zoom+140}
  b_render();renderProps(nid);
}

// Azzeramento completo dello stato di composizione. Usato sia dal pulsante
// "🆕 Nuovo" nel Builder sia da "+ Nuovo Agente" nella topbar: un solo punto,
// così le due strade non possono divergere.
//
// `dbAgentId` e `context` vanno azzerati insieme ai nodi: restando agganciati
// all'agente precedente, il primo salvataggio automatico ne sovrascriveva la
// riga (perdita silenziosa dell'agente salvato) e il nuovo flusso ereditava
// il contesto globale del vecchio.
function resetCanvasForNewAgent(){
  B.effimero=false;
  B.nodes=[];B.edges=[];B.nextId=1;B.selId=-1;B.selEdgeIdx=-1;B.selIds=[];
  B.zoom=1;B.panX=0;B.panY=0;
  B.dbAgentId=null;B.context='';
  currentAgentName='Nuovo agente';
  var zl=document.getElementById('zoomLabel');if(zl)zl.textContent='100%';
  svuotaRegistroEsecuzione();
  b_render();renderProps(-1);
}

function newBlankAgent(){
  if(B.nodes.length>0&&!confirm('Svuotare il canvas e iniziare un nuovo agente da zero?\n(Il workflow attuale resta salvato in "I miei agenti": questo pulisce solo il canvas)'))return;
  resetCanvasForNewAgent();
  showToast('🆕 Canvas pronto: trascina i blocchi dalla palette o usa l\'AI Chat Builder');
  addAct('Nuovo agente da zero');
}

// ══════════════════════════════════════════
// EXECUTION LOG STORE — persistenza per utente
// ══════════════════════════════════════════

// Campi comuni a tutti i nodi Action, aggiunti in coda ai campi specifici
// del connettore: coprono le opzioni di robustezza/error-handling che prima
// mancavano in ogni connettore (timeout, retry, esecuzione condizionale).
// Le opzioni avanzate NON sono uguali per tutti i connettori: comparivano
// identiche su ognuno e questo faceva sembrare i nodi copie l'uno dell'altro.
// Timeout e tentativi hanno senso solo per chi attende una risposta dalla rete;
// su una scrittura locale sono parametri privi di significato, e mostrarli
// suggerisce un comportamento che il nodo non ha.
var ADV_CONDIZIONE={k:'condition',l:'Esegui solo se (opzionale)',ph:'result.score > 50: vuoto = esegui sempre'};
var ADV_TIMEOUT   ={k:'timeout',l:'Timeout risposta (secondi)',ph:'30'};
var ADV_ONERROR   ={k:'onerror',l:'In caso di errore',ph:'Ferma il workflow',opts:['Ferma il workflow','Salta e continua','Riprova poi ferma']};
var ADV_RETRIES   ={k:'retries',l:'Tentativi in caso di errore',ph:'0'};

var ADVANCED_CONNECTOR_FIELDS=[ADV_CONDIZIONE,ADV_TIMEOUT,ADV_ONERROR,ADV_RETRIES];

// Connettori che scrivono in locale: nessuna attesa di rete da regolare.
var ADV_LOCALE=[ADV_CONDIZIONE,ADV_ONERROR];

function advancedFieldsFor(nome){
  var d=(typeof getConnectorConfig==='function')?getConnectorConfig(nome):null;
  if(d&&d.avanzate)return d.avanzate;
  if(d&&d.cartella)return ADV_LOCALE;      // Drive, SharePoint: scrittura locale
  return ADVANCED_CONNECTOR_FIELDS;
}

var CONNECTOR_CONFIGS={
  'Slack':{fields:[{k:'channel',l:'Canale',ph:'#sales'},{k:'message',l:'Template messaggio',ph:'Nuovo lead: {{result}}',ta:true}],
    sim:function(c){return '✉️ Messaggio inviato su '+(c.channel||'#general')+' (ts: '+Date.now()+'.'+Math.floor(Math.random()*999)+')'}},
  // Teams non manda testo semplice come Slack: manda una Adaptive Card, con
  // titolo, corpo e pulsanti. Dare a entrambi "canale + messaggio" li rendeva
  // lo stesso nodo con un'icona diversa.
  'Teams':{fields:[
      {k:'team',l:'Team',ph:'Direzione Commerciale',req:true},
      {k:'channel',l:'Canale',ph:'Generale',req:true},
      {k:'cardtitle',l:'Titolo della card',ph:'Nuovo lead qualificato',req:true},
      {k:'message',l:'Corpo della card',ph:'{{result}}',ta:true,req:true},
      {k:'importance',l:'Importanza',ph:'Normale',opts:['Normale','Alta','Urgente']},
      {k:'actionlabel',l:'Etichetta del pulsante (facoltativo)',ph:'Apri il dettaglio'},
      {k:'actionurl',l:'Link del pulsante',ph:'https://crm.azienda.it/lead/{{result.id}}'}],
    sim:function(c){return '👥 Teams: card "'+(c.cardtitle||'Notifica')+'" su '+(c.team||'Team')+' › '+(c.channel||'Generale')+
      ' ['+(c.importance||'Normale')+']'}},
  // Parametri SMTP completi. L'invio vero non è possibile da una pagina web —
  // SMTP è un protocollo su TCP e il browser non apre socket — ma i preset
  // riportano host e porta corretti dei provider più diffusi, e lo script
  // Python esportato invia realmente con questi stessi valori.
  // Un solo nodo di posta. Prima ce n'erano due, "Invia email" e "Email SMTP",
  // che facevano la stessa cosa con parametri diversi: era il caso più evidente
  // di nodi che sembravano copie l'uno dell'altro.
  // Il nodo dichiara SOLO il messaggio. Server, porta, cifratura e credenziali
  // vivono nel servizio locale (servizio-mail/): erano campi che l'utente
  // doveva compilare due volte e che, se compilati qui, avrebbero portato una
  // password dentro il database e dentro i flussi esportati.
  'Invia email':{fields:[
      {k:'to',l:'Destinatario',ph:'team@azienda.it',req:true},
      {k:'cc',l:'Cc (facoltativo)',ph:'responsabile@azienda.it'},
      {k:'subject',l:'Oggetto',ph:'Esito elaborazione automatica',req:true},
      {k:'body',l:'Corpo del messaggio',ph:'{{result}}',ta:true,req:true},
      {k:'bodytype',l:'Formato corpo',ph:'Testo',opts:['Testo','HTML']},
      {k:'attach',l:'Allega i file generati dal flusso',ph:'No',opts:['No','Sì']}],
    servizioMail:true,
    // Pannello degli allegati fissi: file presi dal computer o documenti della
    // Knowledge Base, scelti una volta e spediti a ogni esecuzione. Sono cosa
    // diversa dai file generati dal flusso, che cambiano a ogni giro: qui si
    // allega un listino, un modulo, delle condizioni contrattuali.
    allegatiUI:true,
    sim:function(c){
      var fissi=(c.allegatiFissi||[]).length;
      var parti=[];
      if(c.attach==='Sì')parti.push('file del flusso');
      if(fissi)parti.push(fissi+' allegato'+(fissi===1?'':'i')+' fisso'+(fissi===1?'':'i'));
      return '📧 → '+(c.to||'destinatario')+': "'+(c.subject||'Notifica')+'"'+
        (parti.length?' con '+parti.join(' e '):'');
    }},
  'WhatsApp':{fields:[{k:'to',l:'Numero',ph:'+39 333 1234567'},{k:'template',l:'Template',ph:'notifica_ordine'}],
    sim:function(c){return '📱 WhatsApp inviato a '+(c.to||'+39 3xx xxxxxxx')+' via Twilio (SID: SM'+Math.random().toString(36).substring(2,12)+')'}},
  'Salesforce':{fields:[{k:'object',l:'Oggetto SF',ph:'Lead',req:true},{k:'operation',l:'Operazione',ph:'update / create',req:true},{k:'mapping',l:'Field mapping',ph:'Score__c = {{result.score}}',ta:true}],
    sim:function(c){return '☁️ Salesforce: '+(c.operation||'update')+' su '+(c.object||'Lead')+' completato (Id: 00Q'+Math.random().toString(36).substring(2,14).toUpperCase()+')'}},
  'HubSpot':{fields:[{k:'object',l:'Oggetto',ph:'contact / deal'},{k:'pipeline',l:'Pipeline',ph:'Sales Pipeline'}],
    sim:function(c){return '🟠 HubSpot: '+(c.object||'contact')+' aggiornato (vid: '+Math.floor(Math.random()*90000+10000)+')'}},
  'Dynamics 365':{fields:[
      {k:'entity',l:'Entità',ph:'lead',opts:['lead','account','contact','opportunity','incident'],req:true},
      {k:'operation',l:'Operazione',ph:'Crea',opts:['Crea','Aggiorna','Aggiorna o crea','Leggi'],req:true},
      {k:'keyfield',l:'Campo chiave per aggiornamento',ph:'emailaddress1'},
      {k:'mapping',l:'Mappatura campi (uno per riga: campo = valore)',ph:'name = {{result.azienda}}\nrevenue = {{result.fatturato}}',ta:true,req:true}],
    sim:function(c){return '📈 Dynamics: '+(c.operation||'Crea')+' su '+(c.entity||'lead')+', id '+Math.random().toString(36).substring(2,10)}},
  'Pipedrive':{fields:[
      {k:'pipeline',l:'Pipeline',ph:'Vendite dirette',req:true},
      {k:'stage',l:'Fase',ph:'Qualificato',opts:['Contatto iniziale','Qualificato','Proposta inviata','Negoziazione','Vinto','Perso'],req:true},
      {k:'dealtitle',l:'Titolo trattativa',ph:'{{result.azienda}}',req:true},
      {k:'value',l:'Valore in euro',ph:'{{result.importo}}'},
      {k:'owner',l:'Assegnata a',ph:'nome@azienda.it'}],
    sim:function(c){return '🟢 Pipedrive: "'+(c.dealtitle||'trattativa')+'" in '+(c.pipeline||'Pipeline')+' › '+(c.stage||'Qualificato')+(c.value?', €'+c.value:'')}},
  'Google Sheets':{fields:[
      {k:'sheet',l:'Spreadsheet',ph:'Lead Tracker 2026',req:true},
      {k:'tab',l:'Foglio',ph:'Foglio1',req:true},
      {k:'operation',l:'Operazione',ph:'Aggiungi riga',opts:['Aggiungi riga','Aggiorna riga','Leggi intervallo'],req:true},
      // Leggendo serve l'intervallo; scrivendo servono le colonne. Chiedere
      // entrambi in ogni caso lasciava sempre meta' pannello senza senso.
      {k:'range',l:'Intervallo (notazione A1)',ph:'A2:F200',
       mostraSe:{campo:'operation',vale:['Leggi intervallo','Aggiorna riga']},
       reqSe:{campo:'operation',vale:['Leggi intervallo']}},
      {k:'chiaveriga',l:'Colonna che identifica la riga',ph:'Email',
       mostraSe:{campo:'operation',vale:['Aggiorna riga'],seVuoto:false},
       reqSe:{campo:'operation',vale:['Aggiorna riga']},
       aiuto:'La riga da aggiornare viene cercata confrontando questa colonna.'},
      {k:'columns',l:'Colonne da scrivere (una per riga: intestazione = valore)',
       ph:'Cliente = {{result.cliente}}\nImporto = {{result.importo}}\nData = {{oggi}}',ta:true,
       mostraSe:{campo:'operation',vale:['Aggiungi riga','Aggiorna riga']},
       reqSe:{campo:'operation',vale:['Aggiungi riga','Aggiorna riga']}}],
    sim:function(c){return '📊 Sheets: '+(c.operation||'Aggiungi riga')+' su "'+(c.sheet||'Spreadsheet')+'" › '+(c.tab||'Foglio1')+
      ': riga #'+Math.floor(Math.random()*400+100)}},
  'Google Docs':{fields:[
      {k:'operation',l:'Operazione',ph:'Crea da template',opts:['Crea da template','Crea vuoto','Aggiungi in coda'],req:true},
      {k:'template',l:'Documento template',ph:'Proposta commerciale v3',req:true},
      {k:'title',l:'Titolo del nuovo documento',ph:'Proposta cliente',req:true},
      {k:'folder',l:'Cartella di destinazione',ph:'Proposte/2026'},
      {k:'replacements',l:'Segnaposto da sostituire (uno per riga: TAG = valore)',ph:'CLIENTE = {{result.cliente}}\nIMPORTO = {{result.importo}}',ta:true}],
    sim:function(c){return '📝 Docs: "'+(c.title||'Documento')+'" da template "'+(c.template||'—')+'" (docs.google.com/d/'+Math.random().toString(36).substring(2,12)+')'}},
  // Ogni gestore di attività ha il proprio modello di dati: Notion ha proprietà
  // tipizzate, Jira ha priorità e assegnatario, Trello board e lista, Asana
  // progetto e scadenza. Prima avevano tutti "progetto/database" e basta, ed è
  // il motivo per cui sembravano lo stesso nodo con un'icona diversa.
  // I campi cambiano con l'operazione: creare una pagina chiede un titolo,
  // aggiungere una riga a un database chiede le proprieta' della riga, e
  // l'identificativo serve solo quando si aggiorna qualcosa che esiste gia'.
  'Notion':{fields:[
      {k:'database',l:'Database',ph:'CRM Leads',req:true},
      {k:'operation',l:'Operazione',ph:'Crea pagina',opts:['Crea pagina','Aggiorna pagina','Aggiungi riga al database'],req:true},
      {k:'pageid',l:'ID della pagina da aggiornare',ph:'{{result.notion_id}}',
       mostraSe:{campo:'operation',vale:['Aggiorna pagina'],seVuoto:false},
       reqSe:{campo:'operation',vale:['Aggiorna pagina']}},
      {k:'title',l:'Titolo della pagina',ph:'{{result.cliente}}',
       mostraSe:{campo:'operation',vale:['Crea pagina','Aggiorna pagina']},
       reqSe:{campo:'operation',vale:['Crea pagina']}},
      {k:'properties',l:'Proprietà (una per riga: nome = valore)',ph:'Stato = Da valutare\nPunteggio = {{result.score}}',ta:true,
       reqSe:{campo:'operation',vale:['Aggiungi riga al database']},
       aiuto:'I nomi devono corrispondere alle colonne del database in Notion.'},
      {k:'content',l:'Contenuto del corpo',ph:'{{result}}',ta:true,
       mostraSe:{campo:'operation',vale:['Crea pagina','Aggiorna pagina']}}],
    sim:function(c){return '📋 Notion: '+(c.operation||'Crea pagina')+' in "'+(c.database||'Database')+'", "'+(c.title||c.pageid||'senza titolo')+'"'}},
  'Jira':{fields:[
      {k:'baseurl',l:'URL istanza Jira',ph:'https://azienda.atlassian.net'},
      {k:'project',l:'Chiave progetto',ph:'OPS',req:true},
      {k:'issuetype',l:'Tipo issue',ph:'Task',opts:['Task','Bug','Story','Incident','Sub-task'],req:true},
      {k:'summary',l:'Titolo (summary)',ph:'{{result.titolo}}',req:true},
      {k:'description',l:'Descrizione',ph:'{{result}}',ta:true},
      {k:'priority',l:'Priorità',ph:'Medium',opts:['Highest','High','Medium','Low','Lowest']},
      {k:'assignee',l:'Assegnatario',ph:'nome.cognome'},
      {k:'labels',l:'Etichette (separate da virgola)',ph:'automazione, da-verificare'}],
    sim:function(c){return '✅ Jira: creata '+(c.issuetype||'Task')+' '+(c.project||'OPS')+'-'+Math.floor(Math.random()*900+100)+
      ' ['+(c.priority||'Medium')+']'+(c.assignee?' → '+c.assignee:'')}},
  'Asana':{fields:[
      {k:'project',l:'Progetto',ph:'Onboarding Q3',req:true},
      {k:'section',l:'Sezione',ph:'Da fare'},
      {k:'taskname',l:'Nome attività',ph:'{{result.titolo}}',req:true},
      {k:'notes',l:'Note',ph:'{{result}}',ta:true},
      {k:'assignee',l:'Assegnatario',ph:'nome@azienda.it'},
      {k:'duedate',l:'Scadenza (giorni da oggi)',ph:'7'}],
    sim:function(c){return '📌 Asana: "'+(c.taskname||'attività')+'" creata in '+(c.project||'Progetto')+
      (c.section?' › '+c.section:'')+(c.duedate?': scadenza fra '+c.duedate+' giorni':'')}},
  'Trello':{fields:[
      {k:'board',l:'Board',ph:'Pipeline Vendite',req:true},
      {k:'list',l:'Lista',ph:'In lavorazione',req:true},
      {k:'cardname',l:'Titolo della card',ph:'{{result.cliente}}',req:true},
      {k:'desc',l:'Descrizione',ph:'{{result}}',ta:true},
      {k:'position',l:'Posizione nella lista',ph:'In cima',opts:['In cima','In fondo']},
      {k:'labels',l:'Etichette',ph:'urgente, cliente-nuovo'}],
    sim:function(c){return '🗂️ Trello: card "'+(c.cardname||'senza titolo')+'" aggiunta a '+(c.board||'Board')+' › '+(c.list||'Lista')}},
  'Confluence':{fields:[
      {k:'baseurl',l:'URL istanza Confluence',ph:'https://azienda.atlassian.net/wiki'},
      {k:'space',l:'Spazio',ph:'DOCS',req:true},
      {k:'parent',l:'Pagina padre',ph:'Rapporti automatici'},
      {k:'title',l:'Titolo della pagina',ph:'Rapporto settimanale',req:true},
      {k:'body',l:'Contenuto',ph:'{{result}}',ta:true,req:true},
      {k:'labels',l:'Etichette',ph:'automazione, rapporti'}],
    sim:function(c){return '📘 Confluence: pagina "'+(c.title||'senza titolo')+'" pubblicata in '+(c.space||'SPACE')}},
  // I parametri sono quelli che servono davvero a una connessione PostgreSQL.
  // L'esecuzione resta simulata: un browser non apre socket TCP, e le
  // credenziali di un database non possono stare in una pagina servita al
  // client. La configurazione è però completa e viene usata sul serio
  // dall'export Python, che si connette davvero.
  'PostgreSQL':{fields:[
      {k:'host',l:'Host',ph:'db.azienda.it',req:true},
      {k:'port',l:'Porta',ph:'5432'},
      {k:'database',l:'Database',ph:'produzione',req:true},
      {k:'user',l:'Utente',ph:'app_agente',req:true},
      {k:'sslmode',l:'SSL',ph:'require',opts:['require','prefer','disable','verify-full']},
      {k:'query',l:'Query SQL (parametrica)',ph:'INSERT INTO leads (nome, score) VALUES ($1, $2)',ta:true,req:true},
      {k:'params',l:'Parametri, uno per riga',ph:'{{result.nome}}\n{{result.score}}',ta:true}],
    limite:'Connessione simulata: il browser non può aprire socket TCP verso un database. I parametri sono completi e lo script Python esportato si connette realmente.',
    sim:function(c){return '🐘 PostgreSQL '+(c.host||'host')+':'+(c.port||'5432')+'/'+(c.database||'db')+': query eseguita, '+Math.floor(Math.random()*5+1)+' righe interessate ('+Math.floor(Math.random()*40+5)+'ms) [simulato]'}},
  'MongoDB':{fields:[
      {k:'uri',l:'Connection string',ph:'mongodb+srv://cluster.mongodb.net',req:true},
      {k:'database',l:'Database',ph:'produzione',req:true},
      {k:'collection',l:'Collection',ph:'leads',req:true},
      {k:'operation',l:'Operazione',ph:'insertOne',opts:['insertOne','insertMany','updateOne','updateMany','findOne','find','deleteOne'],req:true},
      // Il filtro seleziona i documenti su cui agire: inserendo non c'e' nulla
      // da selezionare, e chiederlo confonderebbe soltanto.
      {k:'filter',l:'Filtro (JSON)',ph:'{"email":"{{result.email}}"}',ta:true,
       mostraSe:{campo:'operation',vale:['updateOne','updateMany','findOne','find','deleteOne'],seVuoto:false},
       reqSe:{campo:'operation',vale:['updateOne','updateMany','deleteOne']},
       aiuto:'Senza filtro un aggiornamento colpirebbe l\u2019intera collection.'},
      {k:'document',l:'Documento (JSON)',ph:'{"nome":"{{result.nome}}","score":{{result.score}}}',ta:true,
       mostraSe:{campo:'operation',vale:['insertOne','insertMany','updateOne','updateMany']},
       reqSe:{campo:'operation',vale:['insertOne','insertMany','updateOne','updateMany']}},
      {k:'limit',l:'Numero massimo di risultati',ph:'50',
       mostraSe:{campo:'operation',vale:['find'],seVuoto:false}}],
    limite:'Connessione simulata: nessun driver MongoDB può girare nel browser. Parametri completi e utilizzabili dallo script Python esportato.',
    sim:function(c){return '🍃 MongoDB '+(c.database||'db')+'.'+(c.collection||'collection')+': '+(c.operation||'insertOne')+', ack: true [simulato]'}},
  'Redis':{fields:[
      {k:'host',l:'Host',ph:'cache.azienda.it',req:true},
      {k:'port',l:'Porta',ph:'6379'},
      {k:'operation',l:'Operazione',ph:'SET',opts:['SET','GET','DEL','INCR','EXPIRE','HSET','HGET'],req:true},
      {k:'key',l:'Chiave',ph:'lead:{{result.id}}',req:true},
      {k:'value',l:'Valore',ph:'{{result}}'},
      {k:'ttl',l:'TTL (secondi)',ph:'3600'}],
    limite:'Connessione simulata: Redis usa un protocollo su TCP non raggiungibile dal browser.',
    sim:function(c){return '⚡ Redis '+(c.host||'host')+': '+(c.operation||'SET')+' '+(c.key||'key')+(c.ttl?' (TTL '+c.ttl+'s)':'')+', OK [simulato]'}},
  'AWS S3':{fields:[
      {k:'bucket',l:'Bucket',ph:'relaition-documents',req:true},
      {k:'region',l:'Regione',ph:'eu-south-1',req:true},
      {k:'path',l:'Prefisso oggetto',ph:'fatture/2026/',req:true},
      {k:'acl',l:'Visibilità',ph:'private',opts:['private','public-read','bucket-owner-full-control']},
      {k:'storageclass',l:'Classe di archiviazione',ph:'STANDARD',opts:['STANDARD','STANDARD_IA','GLACIER_IR']}],
    limite:'Caricamento simulato: la firma AWS SigV4 richiede una chiave segreta, che non può stare in una pagina servita al browser.',
    sim:function(c){return '☁️ S3: oggetto scritto su s3://'+(c.bucket||'bucket')+'/'+(c.path||'')+'doc_'+Date.now()+'.pdf ('+(c.region||'eu-south-1')+') [simulato]'}},
  // Drive e SharePoint scrivono DAVVERO, tramite la cartella sincronizzata dal
  // client desktop del servizio: è la stessa strada del nodo "Salva su cloud".
  'Google Drive':{fields:[
      {k:'cloudPath',l:'Percorso dentro la cartella',ph:'Contratti/2026'},
      {k:'filename',l:'Nome file (senza estensione)',ph:'documento',req:true},
      {k:'format',l:'Formato',ph:'PDF',opts:['PDF','CSV','JSON','Markdown','Testo','HTML'],req:true},
      {k:'conflitto',l:'Se il file esiste già',ph:'Aggiungi data e ora',opts:['Aggiungi data e ora','Sovrascrivi']}],
    cartella:true,
    limite:'Scrittura reale nella cartella locale sincronizzata da Google Drive: il client Drive carica poi il file sul cloud. L\'API Drive diretta richiederebbe OAuth con client secret, impossibile senza backend.',
    sim:function(c){return '☁️ Drive: file salvato in "'+(c.cloudPath||'/')+'"'}},
  'SharePoint':{fields:[
      {k:'cloudPath',l:'Percorso dentro la cartella',ph:'Documenti condivisi/Contratti'},
      {k:'filename',l:'Nome file (senza estensione)',ph:'documento',req:true},
      {k:'format',l:'Formato',ph:'PDF',opts:['PDF','CSV','JSON','Markdown','Testo','HTML'],req:true},
      {k:'conflitto',l:'Se il file esiste già',ph:'Aggiungi data e ora',opts:['Aggiungi data e ora','Sovrascrivi']}],
    cartella:true,
    limite:'Scrittura reale nella cartella locale sincronizzata da OneDrive: la sincronizzazione porta il file nella libreria SharePoint collegata.',
    sim:function(c){return '🗄️ SharePoint: documento archiviato in "'+(c.cloudPath||'/')+'"'}},
  'Elasticsearch':{fields:[
      {k:'endpoint',l:'Endpoint',ph:'https://es.azienda.it:9200',req:true},
      {k:'index',l:'Indice',ph:'esecuzioni-agenti',req:true},
      {k:'operation',l:'Operazione',ph:'Indicizza documento',opts:['Indicizza documento','Cerca','Elimina'],req:true},
      {k:'documento',l:'Documento da indicizzare (JSON)',ph:'{"esito":"{{result.esito}}"}',ta:true,
       mostraSe:{campo:'operation',vale:['Indicizza documento']},
       reqSe:{campo:'operation',vale:['Indicizza documento']}},
      {k:'query',l:'Query (JSON)',ph:'{"match":{"esito":"errore"}}',ta:true,
       mostraSe:{campo:'operation',vale:['Cerca','Elimina'],seVuoto:false},
       reqSe:{campo:'operation',vale:['Cerca','Elimina']}}],
    sim:function(c){return '🔎 Elasticsearch: '+(c.operation||'Indicizza documento')+' su "'+(c.index||'index')+'", _id '+Math.random().toString(36).substring(2,12)}},
  'Supabase':{fields:[
      {k:'projecturl',l:'URL progetto',ph:'https://xyz.supabase.co',req:true},
      {k:'table',l:'Tabella',ph:'esecuzioni',req:true},
      {k:'operation',l:'Operazione',ph:'Inserisci',opts:['Inserisci','Aggiorna','Inserisci o aggiorna','Seleziona','Elimina'],req:true},
      {k:'filter',l:'Filtro (colonna = valore)',ph:'id = {{result.id}}'},
      {k:'columns',l:'Colonne (una per riga: nome = valore)',ph:'cliente = {{result.cliente}}\nesito = {{result.esito}}',ta:true}],
    sim:function(c){return '🟩 Supabase: '+(c.operation||'Inserisci')+' su "'+(c.table||'table')+'", 201 Created'}},
  'GitHub':{fields:[{k:'repo',l:'Repository',ph:'org/repo'},{k:'action',l:'Azione',ph:'create issue / comment'}],
    sim:function(c){return '🐙 GitHub: '+(c.action||'issue creata')+' su '+(c.repo||'org/repo')+' (#'+Math.floor(Math.random()*400+1)+')'}},
  'GitLab':{fields:[
      {k:'baseurl',l:'URL istanza GitLab',ph:'https://gitlab.azienda.it'},
      {k:'project',l:'Progetto (group/project)',ph:'ops/automazioni',req:true},
      {k:'ref',l:'Branch o tag',ph:'main',req:true},
      {k:'action',l:'Azione',ph:'Avvia pipeline',opts:['Avvia pipeline','Crea issue','Crea merge request'],req:true},
      {k:'variables',l:'Variabili pipeline (una per riga: NOME = valore)',ph:'AMBIENTE = produzione\nESITO = {{result}}',ta:true}],
    sim:function(c){return '🦊 GitLab: '+(c.action||'Avvia pipeline')+' su '+(c.project||'project')+'@'+(c.ref||'main')}},
  'Datadog':{fields:[
      {k:'metric',l:'Nome metrica',ph:'relaition.esecuzioni.durata',req:true},
      {k:'type',l:'Tipo',ph:'gauge',opts:['gauge','count','rate'],req:true},
      {k:'value',l:'Valore',ph:'{{result.durata}}',req:true},
      {k:'tags',l:'Tag (separati da virgola)',ph:'agente:{{agentName}}, ambiente:produzione'}],
    sim:function(c){return '🐕 Datadog: '+(c.type||'gauge')+' '+(c.metric||'metric')+' = '+(c.value||Math.floor(Math.random()*900+100))}},
  'PagerDuty':{fields:[{k:'service',l:'Servizio',ph:'Production API'},{k:'severity',l:'Severity',ph:'critical / warning'}],
    sim:function(c){return '📟 PagerDuty: incident aperto su "'+(c.service||'Service')+'" ('+(c.severity||'warning')+'), on-call notificato'}},
  'Docker/K8s':{fields:[{k:'deployment',l:'Deployment',ph:'api-server'},{k:'namespace',l:'Namespace',ph:'production'}],
    sim:function(c){return '🐳 K8s: rollout di '+(c.deployment||'deployment')+' in '+(c.namespace||'default')+', 3/3 repliche ready'}},
  'Vercel':{fields:[
      {k:'project',l:'Progetto',ph:'relaition-app',req:true},
      {k:'environment',l:'Ambiente',ph:'production',opts:['production','preview','development'],req:true},
      {k:'branch',l:'Branch da distribuire',ph:'main'},
      {k:'waitready',l:'Attendi il completamento del deploy',ph:'Sì',opts:['Sì','No']}],
    sim:function(c){return '▲ Vercel: deploy '+(c.environment||'production')+' di '+(c.project||'project')+
      ' → '+(c.project||'app')+'-'+Math.random().toString(36).substring(2,8)+'.vercel.app'}},
  'HTTP Request':{fields:[{k:'url',l:'URL',ph:'https://api.example.com/v1/data'},{k:'method',l:'Metodo',ph:'POST',opts:['GET','POST','PUT','PATCH','DELETE']},{k:'headers',l:'Headers (JSON)',ph:'{"Authorization":"Bearer ..."}',ta:true},{k:'body',l:'Body (JSON, per POST/PUT/PATCH: {{result}} = output nodo precedente)',ph:'{"score":"{{result}}"}',ta:true}],
    sim:function(c){return '🌐 '+(c.method||'POST')+' '+(c.url||'https://api...')+' → 200 OK ('+Math.floor(Math.random()*300+50)+'ms)'}},
  'GraphQL':{fields:[{k:'endpoint',l:'Endpoint',ph:'https://api.example.com/graphql'},{k:'query',l:'Query',ph:'mutation { ... }',ta:true}],
    sim:function(c){return '🔗 GraphQL: mutation eseguita, data returned'}},
  'Python Script':{fields:[{k:'code',l:'Codice',ph:'def process(data):\n    return transform(data)',ta:true}],
    sim:function(c){return '🐍 Script eseguito: exit code 0, output: processed'}},
  'n8n Workflow':{fields:[
      {k:'baseurl',l:'URL istanza n8n',ph:'https://n8n.azienda.it',req:true},
      {k:'workflow',l:'ID workflow',ph:'wf_abc123',req:true},
      {k:'mode',l:'Modalità',ph:'Attendi il risultato',opts:['Attendi il risultato','Avvia e prosegui'],req:true},
      {k:'payload',l:'Dati da passare (JSON)',ph:'{"origine":"relaition","dati":"{{result}}"}',ta:true}],
    sim:function(c){return '🔗 n8n: workflow '+(c.workflow||'wf')+' avviato ('+(c.mode||'Attendi il risultato')+'), exec '+Math.floor(Math.random()*90000+10000)}},
  'SAP':{fields:[
      {k:'system',l:'Sistema',ph:'PRD',opts:['DEV','QAS','PRD'],req:true},
      {k:'module',l:'Modulo',ph:'FI (contabilità)',opts:['FI (contabilità)','CO (controlling)','MM (materiali)','SD (vendite)','HR'],req:true},
      {k:'bapi',l:'BAPI o servizio OData',ph:'BAPI_ACC_DOCUMENT_POST',req:true},
      {k:'company',l:'Codice società',ph:'IT01',req:true},
      {k:'params',l:'Parametri (uno per riga: nome = valore)',ph:'DOC_DATE = {{result.data}}\nAMOUNT = {{result.importo}}',ta:true}],
    sim:function(c){return '🏢 SAP '+(c.system||'PRD')+'/'+(c.module||'FI')+': '+(c.bapi||'BAPI')+' eseguita, documento '+Math.floor(Math.random()*9000000+1000000)}},
  'Oracle ERP':{fields:[
      {k:'module',l:'Modulo',ph:'AP',opts:['AP (fornitori)','AR (clienti)','GL (contabilità generale)','INV (magazzino)'],req:true},
      {k:'operation',l:'Operazione',ph:'Crea',opts:['Crea','Aggiorna','Interroga'],req:true},
      {k:'businessunit',l:'Business unit',ph:'Italia',req:true},
      {k:'payload',l:'Dati (uno per riga: campo = valore)',ph:'Supplier = {{result.fornitore}}\nAmount = {{result.importo}}',ta:true}],
    sim:function(c){return '🔶 Oracle ERP '+(c.module||'AP')+': '+(c.operation||'Crea')+' su '+(c.businessunit||'BU')+', rif. '+Math.floor(Math.random()*90000+10000)}},
  'QuickBooks':{fields:[
      {k:'type',l:'Documento',ph:'Fattura',opts:['Fattura','Nota spese','Pagamento ricevuto','Cliente','Fornitore'],req:true},
      {k:'operation',l:'Operazione',ph:'Crea',opts:['Crea','Aggiorna','Annulla'],req:true},
      {k:'customer',l:'Cliente',ph:'{{result.cliente}}',req:true},
      {k:'amount',l:'Importo',ph:'{{result.totale}}',req:true},
      {k:'account',l:'Conto contabile',ph:'Ricavi da servizi'},
      {k:'duedate',l:'Scadenza (giorni)',ph:'30'}],
    sim:function(c){return '💰 QuickBooks: '+(c.operation||'Crea')+' '+(c.type||'Fattura')+' per '+(c.customer||'cliente')+', n. '+Math.floor(Math.random()*9000+1000)}},
  // Ogni azione ha i suoi parametri: un rimborso parte da un pagamento, non da
  // un importo e una valuta; creare un cliente non ha un importo affatto.
  'Stripe':{fields:[
      {k:'action',l:'Azione',ph:'Crea fattura',opts:['Crea fattura','Crea cliente','Incassa pagamento','Rimborso','Crea abbonamento'],req:true},
      {k:'customer',l:'Cliente (email o customer id)',ph:'{{result.email}}',req:true},
      {k:'paymentid',l:'ID del pagamento da rimborsare',ph:'{{result.payment_intent}}',
       mostraSe:{campo:'action',vale:['Rimborso'],seVuoto:false},
       reqSe:{campo:'action',vale:['Rimborso']}},
      {k:'amount',l:'Importo in centesimi',ph:'12840',
       mostraSe:{campo:'action',vale:['Crea fattura','Incassa pagamento','Rimborso']},
       reqSe:{campo:'action',vale:['Crea fattura','Incassa pagamento']},
       aiuto:'In centesimi: 128,40 euro si scrive 12840. Su un rimborso, vuoto significa rimborso totale.'},
      {k:'currency',l:'Valuta',ph:'eur',opts:['eur','usd','gbp','chf'],
       mostraSe:{campo:'action',vale:['Crea fattura','Incassa pagamento','Crea abbonamento']},
       reqSe:{campo:'action',vale:['Crea fattura','Incassa pagamento']}},
      {k:'piano',l:'Piano di abbonamento',ph:'price_1Nabc...',
       mostraSe:{campo:'action',vale:['Crea abbonamento'],seVuoto:false},
       reqSe:{campo:'action',vale:['Crea abbonamento']}},
      {k:'description',l:'Descrizione',ph:'Canone annuale {{result.piano}}'},
      {k:'metadata',l:'Metadati (uno per riga: chiave = valore)',ph:'agente = {{agentName}}',ta:true}],
    sim:function(c){
      var imp=c.amount?((parseInt(c.amount,10)/100).toFixed(2)+' '+(c.currency||'eur').toUpperCase()):'importo totale';
      return '💳 Stripe: '+(c.action||'Crea fattura')+', '+imp+' · '+(c.customer||'cliente')}},
  'File operation':{fields:[{k:'operation',l:'Operazione',ph:'move / copy / rename'},{k:'path',l:'Path',ph:'/archive/2026/'}],
    sim:function(c){return '📁 File '+(c.operation||'spostato')+' in '+(c.path||'/path/')}},
  'Push Notification':{fields:[
      {k:'audience',l:'Destinatari',ph:'Tutti',opts:['Tutti','Segmento','Utente singolo'],req:true},
      {k:'segment',l:'Segmento o identificativo utente',ph:'reparto:vendite'},
      {k:'title',l:'Titolo',ph:'Nuovo lead assegnato',req:true},
      {k:'message',l:'Testo',ph:'{{result}}',ta:true,req:true},
      {k:'deeplink',l:'Apri al tocco',ph:'app://lead/{{result.id}}'}],
    sim:function(c){return '🔔 Push "'+(c.title||'Notifica')+'" → '+(c.audience||'Tutti')+(c.segment?' ('+c.segment+')':'')+': '+Math.floor(Math.random()*400+30)+' dispositivi'}},
};


function getConnectorConfig(nodeName){
  return CONNECTOR_CONFIGS[nodeName]||null;
}


// ══════════════════════════════════════════
// TEMPLATE GALLERY + DOCS + OFFICE HOURS
// ══════════════════════════════════════════

var WF_TEMPLATES=[
  {name:'Lead Scoring Base',icon:'🎯',cat:'Sales',desc:'Webhook → analisi AI → routing condizionale → notifica',
   nodes:[{t:'tr',ic:'📥',n:'Webhook CRM',d:'Lead in arrivo'},{t:'ai',ic:'🧠',n:'Analisi Lead',d:'Scoring 0-100'},{t:'cd',ic:'🔀',n:'Score > 70?',d:'Gate qualifica'},{t:'ac',ic:'💬',n:'Slack',d:'Notifica sales'},{t:'ou',ic:'📊',n:'Output',d:'Salva risultato'}]},
  {name:'Document Processing',icon:'📄',cat:'Operations',desc:'Upload → OCR AI → validazione → archiviazione',
   nodes:[{t:'tr',ic:'📎',n:'File upload',d:'PDF/immagine'},{t:'ai',ic:'👁️',n:'Vision AI',d:'OCR + parsing'},{t:'cd',ic:'🔀',n:'Dati validi?',d:'Quality gate'},{t:'ac',ic:'☁️',n:'AWS S3',d:'Archivia originale'},{t:'ou',ic:'📊',n:'Output',d:'Record strutturato'}]},
  {name:'Daily Report AI',icon:'📈',cat:'Analytics',desc:'Scheduler → query dati → sintesi LLM → invio email',
   nodes:[{t:'tr',ic:'⏰',n:'Scheduler',d:'Ogni giorno 8:00'},{t:'ac',ic:'🗄️',n:'PostgreSQL',d:'Query KPI giornalieri'},{t:'ai',ic:'📝',n:'Summarizer',d:'Sintesi esecutiva'},{t:'ac',ic:'📧',n:'Invia email',d:'Invia al management'},{t:'ou',ic:'📊',n:'Output',d:'Log invio'}]},
  {name:'Approval Flow (Human-in-the-loop)',icon:'✋',cat:'Governance',desc:'Richiesta → analisi AI → checkpoint umano → esecuzione',
   nodes:[{t:'tr',ic:'📥',n:'Richiesta',d:'Da form/webhook'},{t:'ai',ic:'🧠',n:'Pre-analisi',d:'Valutazione AI'},{t:'ac',ic:'💬',n:'Slack',d:'Chiedi approvazione'},{t:'cd',ic:'🔀',n:'Approvato?',d:'Human checkpoint'},{t:'ac',ic:'⚙️',n:'Esegui azione',d:'Processo approvato'},{t:'ou',ic:'📝',n:'Logger',d:'Audit trail'}]},
  {name:'Incident Response',icon:'🚨',cat:'DevOps',desc:'Alert → correlazione AI → severity gate → escalation',
   nodes:[{t:'tr',ic:'🔔',n:'Alert webhook',d:'Da monitoring'},{t:'ai',ic:'🔗',n:'Correla eventi',d:'Dedup + contesto'},{t:'cd',ic:'🔀',n:'Severity P1?',d:'Priority gate'},{t:'ac',ic:'📟',n:'PagerDuty',d:'Page on-call'},{t:'ac',ic:'💬',n:'Slack',d:'Canale #incidents'},{t:'ou',ic:'📊',n:'Output',d:'Timeline incidente'}]},
  {name:'Content Pipeline',icon:'✍️',cat:'Marketing',desc:'Scheduler → generazione AI → review → pubblicazione',
   nodes:[{t:'tr',ic:'⏰',n:'Scheduler',d:'Piano editoriale'},{t:'ai',ic:'✍️',n:'Content Gen',d:'Bozza articolo/post'},{t:'ai',ic:'🎭',n:'Sentiment',d:'Check tone of voice'},{t:'cd',ic:'🔀',n:'Quality OK?',d:'Editorial gate'},{t:'ac',ic:'📋',n:'Notion',d:'Coda pubblicazione'},{t:'ou',ic:'📈',n:'Analytics',d:'Traccia performance'}]}
];

function openTemplateGallery(){
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>Template Gallery</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 16px">Workflow pre-costruiti basati su pattern architetturali consolidati. Clicca per caricarli nel Builder.</p>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'+
    WF_TEMPLATES.map(function(t,i){
      return '<div class="card" style="cursor:pointer;padding:16px" onclick="loadTemplate('+i+')">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="font-size:22px">'+t.icon+'</span><div><div style="font-size:13px;font-weight:700">'+t.name+'</div><span class="badge badge-gray" style="font-size:9px">'+t.cat+'</span></div></div>'+
        '<div style="font-size:11px;color:var(--tx3);line-height:1.5">'+t.desc+'</div>'+
        '<div style="font-size:10px;color:var(--ac);font-weight:600;margin-top:8px">'+t.nodes.length+' nodi → Carica nel Builder</div>'+
      '</div>';
    }).join('')+'</div>',true
  );
}

function loadTemplate(idx){
  var t=WF_TEMPLATES[idx];if(!t)return;
  B.nodes=[];B.edges=[];B.nextId=1;B.selId=-1;
  var startX=120,startY=90,gapY=135;
  t.nodes.forEach(function(n,i){b_addNode(n.t,n.ic,n.n,n.d,startX,startY+i*gapY)});
  for(var i=0;i<B.nodes.length-1;i++){
    var from=B.nodes[i],port=from.type==='cd'?'true':'out';
    b_addEdge(from.id,port,B.nodes[i+1].id,'in',from.type==='cd'?'Sì':'');
  }
  currentAgentName=t.name;
  closeModal();go('builder');b_render();
  showToast('💡 Template "'+t.name+'" caricato!');
  addAct('Caricato template: '+t.name);
}

function buildPythonCode(){
  var P=aiConfig.provider==='custom'?'custom':aiConfig.provider;
  var nodes=[];
  // topological order (same as runAgent)
  var visited={},hasIncoming={};
  B.edges.forEach(function(e){hasIncoming[e.to]=true});
  var starts=B.nodes.filter(function(n){return !hasIncoming[n.id]});
  if(starts.length===0&&B.nodes.length>0)starts=[B.nodes[0]];
  function visit(node){
    if(visited[node.id])return;visited[node.id]=true;nodes.push(node);
    B.edges.filter(function(e){return e.from===node.id}).forEach(function(e){
      var nx=B.nodes.find(function(n){return n.id===e.to});if(nx)visit(nx);
    });
  }
  starts.forEach(visit);
  B.nodes.forEach(function(n){if(!visited[n.id])nodes.push(n)});

  var L=[];
  L.push('#!/usr/bin/env python3');
  L.push('# ═══════════════════════════════════════════════');
  L.push('# Agente: '+(currentAgentName||'RelAItion Agent'));
  L.push('# Generato da RelAItion Builder: '+new Date().toISOString().substring(0,16).replace('T',' '));
  L.push('# Esecuzione:  pip install requests  →  python agent.py');
  L.push('# ═══════════════════════════════════════════════');
  L.push('import os, sys, json, requests');
  L.push('');
  if(P==='claude'){
    L.push('API_KEY = os.environ.get("ANTHROPIC_API_KEY", "'+ (aiConfig.key?'<inserisci-o-usa-env>':'') +'")');
    L.push('');
    L.push('def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:');
    L.push('    """Chiama Anthropic Claude."""');
    L.push('    r = requests.post("https://api.anthropic.com/v1/messages",');
    L.push('        headers={"x-api-key": API_KEY, "anthropic-version": "2023-06-01",');
    L.push('                 "content-type": "application/json"},');
    L.push('        json={"model": "claude-opus-5", "max_tokens": 1024,');
    L.push('              "system": system_prompt, "temperature": temperature,');
    L.push('              "messages": [{"role": "user", "content": user_prompt}]}, timeout=60)');
    L.push('    r.raise_for_status()');
    L.push('    return r.json()["content"][0]["text"]');
  } else if(P==='gemini'){
    L.push('API_KEY = os.environ.get("GEMINI_API_KEY", "")');
    L.push('');
    L.push('def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:');
    L.push('    """Chiama Google Gemini."""');
    L.push('    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}"');
    L.push('    r = requests.post(url, json={"contents": [{"parts": [{"text": system_prompt + "\\n\\n" + user_prompt}]}],');
    L.push('        "generationConfig": {"temperature": temperature, "maxOutputTokens": 1024}}, timeout=60)');
    L.push('    r.raise_for_status()');
    L.push('    return r.json()["candidates"][0]["content"]["parts"][0]["text"]');
  } else if(P==='locale'){
    var _lb=(aiConfig.providers.locale&&aiConfig.providers.locale.baseUrl)||'http://localhost:11434';
    var _lm=(aiConfig.providers.locale&&aiConfig.providers.locale.model)||'llama3.1';
    L.push('BASE_URL = os.environ.get("LOCAL_LLM_URL", "'+_lb.replace(/\/+$/,'')+'/v1")');
    L.push('MODEL = os.environ.get("LOCAL_LLM_MODEL", "'+_lm+'")');
    L.push('');
    L.push('def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:');
    L.push('    """Chiama un modello in esecuzione locale (Ollama, LM Studio, LocalAI)."""');
    L.push('    r = requests.post(BASE_URL + "/chat/completions",');
    L.push('        json={"model": MODEL, "temperature": temperature, "max_tokens": 1024,');
    L.push('              "messages": [{"role": "system", "content": system_prompt},');
    L.push('                           {"role": "user", "content": user_prompt}]}, timeout=300)');
    L.push('    r.raise_for_status()');
    L.push('    return r.json()["choices"][0]["message"]["content"]');
  } else if(P==='mistral'){
    L.push('API_KEY = os.environ.get("MISTRAL_API_KEY", "")');
    L.push('');
    L.push('def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:');
    L.push('    """Chiama Mistral AI (API OpenAI-compatible)."""');
    L.push('    r = requests.post("https://api.mistral.ai/v1/chat/completions",');
    L.push('        headers={"Authorization": f"Bearer {API_KEY}"},');
    L.push('        json={"model": "mistral-large-latest", "temperature": temperature, "max_tokens": 1024,');
    L.push('              "messages": [{"role": "system", "content": system_prompt},');
    L.push('                           {"role": "user", "content": user_prompt}]}, timeout=60)');
    L.push('    r.raise_for_status()');
    L.push('    return r.json()["choices"][0]["message"]["content"]');
  } else if(P==='custom'){
    L.push('BASE_URL = "'+(aiConfig.customUrl||'http://localhost:11434/v1')+'"  # endpoint OpenAI-compatible');
    L.push('MODEL = "'+(aiConfig.customModel||'llama3.1')+'"');
    L.push('API_KEY = os.environ.get("LLM_API_KEY", "")  # vuoto per endpoint locali');
    L.push('');
    L.push('def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:');
    L.push('    """Chiama endpoint OpenAI-compatible (Ollama/Azure/Mistral...)."""');
    L.push('    headers = {"Content-Type": "application/json"}');
    L.push('    if API_KEY: headers["Authorization"] = f"Bearer {API_KEY}"');
    L.push('    r = requests.post(BASE_URL + "/chat/completions", headers=headers,');
    L.push('        json={"model": MODEL, "temperature": temperature, "max_tokens": 1024,');
    L.push('              "messages": [{"role": "system", "content": system_prompt},');
    L.push('                           {"role": "user", "content": user_prompt}]}, timeout=120)');
    L.push('    r.raise_for_status()');
    L.push('    return r.json()["choices"][0]["message"]["content"]');
  } else {
    L.push('API_KEY = os.environ.get("OPENAI_API_KEY", "")');
    L.push('');
    L.push('def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> str:');
    L.push('    """Chiama OpenAI."""');
    L.push('    r = requests.post("https://api.openai.com/v1/chat/completions",');
    L.push('        headers={"Authorization": f"Bearer {API_KEY}"},');
    L.push('        json={"model": "gpt-4o-mini", "temperature": temperature, "max_tokens": 1024,');
    L.push('              "messages": [{"role": "system", "content": system_prompt},');
    L.push('                           {"role": "user", "content": user_prompt}]}, timeout=60)');
    L.push('    r.raise_for_status()');
    L.push('    return r.json()["choices"][0]["message"]["content"]');
  }
  L.push('');
  L.push('def eval_condition(condition: str, context: str) -> bool:');
  L.push('    """Valuta una condizione sui dati usando il LLM (risponde TRUE/FALSE)."""');
  L.push('    out = call_llm("Sei un valutatore booleano. Rispondi SOLO TRUE o FALSE.",');
  L.push('                   f"Contesto:\\n{context[:1500]}\\n\\nCondizione: {condition}", 0.0)');
  L.push('    return "TRUE" in out.upper()');
  L.push('');
  L.push('');
  L.push('# ─── NODI DEL WORKFLOW ───');
  L.push('');

  var fnNames={};
  nodes.forEach(function(n,i){
    var safe='node_'+(i+1)+'_'+(n.name||'step').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/_+$/,'');
    fnNames[n.id]=safe;
    var cfg=n.config||{};
    if(n.type==='tr'){
      L.push('def '+safe+'() -> str:');
      L.push('    """['+n.name+'] Trigger: '+(n.detail||'ingresso dati')+'"""');
      L.push('    # In produzione: webhook/scheduler/watcher. Per il test: input da file o argv.');
      L.push('    if len(sys.argv) > 1:');
      L.push('        with open(sys.argv[1]) as f: return f.read()');
      L.push('    return json.dumps({"esempio": "dati di test", "fonte": "'+(n.name||'trigger')+'"})');
    } else if(n.type==='ai'){
      var sp=(cfg.prompt||('Sei un nodo AI in un workflow aziendale. Compito: '+n.name+', '+(n.detail||'')+'. Rispondi in modo conciso e strutturato in italiano.')).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n');
      L.push('def '+safe+'(data: str) -> str:');
      L.push('    """['+n.name+'] Nodo AI: '+(n.detail||'')+'"""');
      L.push('    system_prompt = "'+sp+'"');
      L.push('    return call_llm(system_prompt, f"Dati in input:\\n{data}\\n\\nEsegui il tuo compito.", '+(cfg.temperature!==undefined?cfg.temperature:0.3)+')');
    } else if(n.type==='cd'){
      var cond=(cfg.condition||n.name).replace(/"/g,'\\"');
      L.push('def '+safe+'(data: str) -> bool:');
      L.push('    """['+n.name+'] Condizione: '+cond+'"""');
      L.push('    return eval_condition("'+cond+'", data)');
    } else if(n.type==='ac'){
      var cc=CONNECTOR_CONFIGS[n.name];
      L.push('def '+safe+'(data: str) -> str:');
      L.push('    """['+n.name+'] Azione: '+(n.detail||'')+'"""');
      if(cc){
        cc.fields.forEach(function(f){
          var v=(cfg[f.k]||'').toString().replace(/"/g,'\\"').replace(/\n/g,'\\n');
          L.push('    '+f.k+' = "'+v+'"'+(v?'':'  # TODO: configura'));
        });
      }
      L.push('    # TODO: integrazione reale con '+n.name+' (API/SDK). Qui logghiamo l\'azione:');
      L.push('    print(f"  [ACTION] '+n.name+': eseguito su {len(data)} chars")');
      L.push('    return data');
    } else {
      L.push('def '+safe+'(data: str) -> str:');
      L.push('    """['+n.name+'] Output finale"""');
      L.push('    print("\\n═══ OUTPUT FINALE ═══")');
      L.push('    print(data)');
      L.push('    return data');
    }
    L.push('');
  });

  // main: chain with branch awareness
  L.push('');
  L.push('def main():');
  L.push('    print("▶ Avvio agente: '+(currentAgentName||'RelAItion Agent').replace(/"/g,'')+'")');
  L.push('    pipeline = ""');
  var branchVar=0;
  nodes.forEach(function(n,i){
    var fn=fnNames[n.id];
    if(n.type==='tr'){
      L.push('    pipeline = '+fn+'()');
      L.push('    print(f"  [TRIGGER] '+n.name+': {pipeline[:80]}...")');
    } else if(n.type==='cd'){
      branchVar++;
      L.push('    cond_'+branchVar+' = '+fn+'(pipeline)');
      L.push('    print(f"  [CONDITION] '+n.name+': {cond_'+branchVar+'}")');
      // find true/false targets
      var tEdge=B.edges.find(function(e){return e.from===n.id&&e.fp==='true'});
      var fEdge=B.edges.find(function(e){return e.from===n.id&&e.fp==='false'});
      if(tEdge&&fEdge){
        var tFn=fnNames[tEdge.to],fFn=fnNames[fEdge.to];
        if(tFn&&fFn){
          L.push('    pipeline = '+tFn+'(pipeline) if cond_'+branchVar+' else '+fFn+'(pipeline)');
          // mark handled targets so linear chain skips them
          n._pyHandled=[tEdge.to,fEdge.to];
        }
      }
    } else {
      // skip if handled by a previous condition branch
      var handled=nodes.some(function(p){return p._pyHandled&&p._pyHandled.indexOf(n.id)>=0});
      if(handled)return;
      L.push('    pipeline = '+fn+'(pipeline)');
      if(n.type==='ai')L.push('    print(f"  [AI] '+n.name+': {pipeline[:80]}...")');
    }
  });
  nodes.forEach(function(n){delete n._pyHandled});
  L.push('    print("\\n✅ Workflow completato.")');
  L.push('');
  L.push('if __name__ == "__main__":');
  L.push('    main()');
  return L.join('\n');
}


function generatePythonCode(){
  // Anche questo è un export: produce un file da portarsi via, non mette
  // niente in esercizio. Un flusso incompleto genera uno script incompleto,
  // ed è esattamente quello che serve a chi vuole continuare a lavorarci
  // altrove. I punti aperti restano segnati sui nodi.
  var _errs=validateWorkflow();
  if(_errs.length)markInvalidNodes(_errs); else clearInvalidNodes();
  var code=buildPythonCode();
  var esc=code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>Codice Python eseguibile</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 12px">Script generato dal workflow corrente ('+B.nodes.length+' nodi, provider: <strong>'+(aiConfig.provider||'claude')+'</strong>). I nodi AI chiamano il modello reale; le azioni hanno i parametri configurati e i punti di integrazione marcati TODO.</p>'+
    '<div style="display:flex;gap:8px;margin-bottom:12px">'+
      '<button class="tb-btn primary" onclick="downloadPythonCode()">📥 Scarica agent.py</button>'+
      '<button class="tb-btn" onclick="copyPythonCode()">📋 Copia codice</button>'+
    '</div>'+
    '<div style="background:var(--ac2-l);border-radius:8px;padding:10px 14px;font-size:11px;margin-bottom:12px">💻 <strong>Per eseguirlo:</strong> <code>pip install requests</code> → imposta la env var della API key → <code>python agent.py [file_input_opzionale]</code></div>'+
    '<pre class="code-modal-pre" id="pyCodePre">'+esc+'</pre>'
  ,true);
  window._lastPyCode=code;
  addAct('Generato codice Python: '+currentAgentName);
}

function downloadPythonCode(){
  var code=window._lastPyCode||buildPythonCode();
  var blob=new Blob([code],{type:'text/x-python'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;
  a.download=(currentAgentName||'agent').toLowerCase().replace(/[^a-z0-9]+/g,'_')+'.py';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url)},1000);
  showToast('📥 agent.py scaricato: pronto per l\'esecuzione');
}

function copyPythonCode(){
  var code=window._lastPyCode||buildPythonCode();
  navigator.clipboard.writeText(code).then(function(){showToast('📋 Codice copiato negli appunti')},function(){showToast('⚠️ Copia non riuscita: usa Scarica')});
}


// ══════════════════════════════════════════
// CANVAS UX — delete key, edge deletion, snap, fit view
// ══════════════════════════════════════════

function selectEdge(idx){
  B.selEdgeIdx=idx;B.selId=-1;
  renderEdgeProps(idx);
  b_render();
}

function renderEdgeProps(idx){
  var body=document.getElementById('propsBody');
  var e=B.edges[idx];
  if(!body||!e)return;
  var from=B.nodes.find(function(n){return n.id===e.from});
  var to=B.nodes.find(function(n){return n.id===e.to});
  body.innerHTML=
    '<div style="text-align:center;padding:8px 4px 16px"><div style="font-size:26px;margin-bottom:8px">🔗</div><div style="font-size:13px;font-weight:700">Connessione selezionata</div></div>'+
    '<div class="prop-group"><div class="prop-label">Da</div><div class="prop-input" style="background:var(--bg2);cursor:default">'+(from?escHtml(from.icon+' '+from.name):'—')+(e.fp&&e.fp!=='out'?' <span style="color:var(--tx4)">('+e.fp+')</span>':'')+'</div></div>'+
    '<div class="prop-group"><div class="prop-label">A</div><div class="prop-input" style="background:var(--bg2);cursor:default">'+(to?escHtml(to.icon+' '+to.name):'—')+'</div></div>'+
    // L'etichetta esisteva nel modello, si disegnava sulla freccia, si
    // esportava e si reimportava — ma non c'era modo di scriverla. Compariva
    // solo dove la metteva il codice (i rami «Sì»/«No» di una condizione, o
    // l'«allegato» inserito automaticamente) o un JSON importato: visibile e
    // intoccabile, che è il modo peggiore di avere un campo.
    '<div class="prop-group"><div class="prop-label">Etichetta sulla freccia</div>'+
      '<textarea class="prop-input" id="edgeLabel'+idx+'" rows="1" maxlength="72" style="resize:none;max-height:72px;line-height:1.4" '+
        'placeholder="es. sopra soglia, approvato, scarto (Invio per andare a capo, fino a 3 righe)" '+
        'oninput="aggiornaEtichettaArco('+idx+',this.value);adattaAltezza(this)">'+escHtml(e.label||'')+'</textarea>'+
      '<div style="font-size:10px;color:var(--tx4);margin-top:5px;line-height:1.45">'+
        'Serve a dire <em>perché</em> si prende questa strada. Sui rami di una condizione è già compilata; '+
        'lasciala vuota e la freccia resta pulita.</div>'+
    '</div>'+
    '<div class="props-actions"><button class="tb-btn wide" style="color:#EF4444;border-color:#FEE2E2" onclick="deleteEdge('+idx+')">🗑️ Elimina connessione</button></div>'+
    '<div style="font-size:10px;color:var(--tx4);margin-top:10px;text-align:center">Puoi anche premere Canc, doppio click sulla freccia, o cliccare la ✕ rossa sul canvas</div>';
  // Un'etichetta gia' su due righe deve aprirsi su due righe, non su una con
  // la seconda nascosta.
  var ta=document.getElementById('edgeLabel'+idx);
  if(ta&&typeof adattaAltezza==='function')adattaAltezza(ta);
}

function deleteEdge(idx){
  pushUndo('eliminazione connessione');
  B.edges.splice(idx,1);B.selEdgeIdx=-1;clearInvalidNodes();b_render();renderProps(-1);showToast('🗑️ Connessione eliminata');
}

function bFitView(){
  var ca=document.getElementById('canvasArea');
  if(!B.nodes.length||!ca){B.zoom=1;B.panX=0;B.panY=0;bAggiornaEtichettaZoom();b_render();return}
  var b=bBoundsNodi();
  var pad=40, alto=pad+ingombroChat();          // spazio libero sotto la barra chat
  var w=ca.clientWidth, h=ca.clientHeight;
  var zx=(w-pad*2)/b.w, zy=(h-alto-pad)/b.h;
  B.zoom=Math.max(0.25,Math.min(1.5,Math.min(zx,zy)));
  // Centrato su entrambi gli assi: prima il flusso restava incollato in alto,
  // e su un flusso corto sembrava che la vista non fosse stata adattata.
  B.panX=pad-b.minX*B.zoom+(w-pad*2-b.w*B.zoom)/2;
  B.panY=alto-b.minY*B.zoom+(h-alto-pad-b.h*B.zoom)/2;
  bAggiornaEtichettaZoom();
  b_render();
}


// ══════════════════════════════════════════
// EXTENDED CONFIGS — trigger, AI e logic avanzati
// ══════════════════════════════════════════

var TRIGGER_CONFIGS={
  'Webhook':{fields:[{k:'method',l:'Metodo HTTP',ph:'POST',opts:['POST','GET','PUT']},{k:'path',l:'Endpoint path',ph:'/hooks/lead-intake',req:true},
      {k:'campi',l:'Parametri attesi (uno per riga: nome | etichetta | obbligatorio)',
       ph:'cliente | Ragione sociale | si\nimporto | Importo | si\nnote | Note | no',ta:true},
      {k:'auth',l:'Autenticazione',ph:'Bearer token',opts:['Nessuna','Bearer token','API Key header','HMAC signature']}],
    parametri:true,
    sim:function(c){return '📥 Webhook '+(c.method||'POST')+' '+(c.path||'/hooks/...')+': payload ricevuto'}},
  'Scheduler':{fields:[{k:'cron',l:'Espressione cron',ph:'0 8 * * 1-5 (8:00 lun-ven)',req:true},{k:'timezone',l:'Timezone',ph:'Europe/Rome'},{k:'onmiss',l:'Se il sistema era spento',ph:'Esegui al riavvio',opts:['Esegui al riavvio','Salta','Notifica soltanto']}],
    sim:function(c){return '⏰ Trigger schedulato: '+(c.cron||'0 8 * * *')+' ('+(c.timezone||'Europe/Rome')+')'}},
  'Email trigger':{fields:[{k:'mailbox',l:'Casella monitorata',ph:'support@azienda.it',req:true},{k:'filter',l:'Filtro oggetto/mittente',ph:'oggetto contiene "urgente"'},{k:'attachments',l:'Allegati',ph:'Includi',opts:['Includi','Ignora']}],
    sim:function(c){return '📧 Email ricevuta su '+(c.mailbox||'casella')+(c.filter?' (filtro: '+c.filter+')':'')}},
  // Un trigger di caricamento senza sorgente non carica niente: l'esecuzione
  // ripiegava sui dati campione, e il flusso sembrava funzionare mentre stava
  // elaborando un contenuto inventato. Serve un file allegato oppure un
  // documento della Knowledge Base — l'uno o l'altro, non entrambi.
  // I formati elencati sono quelli da cui il browser sa davvero estrarre testo
  // (js/fileread.js). Le immagini non ci sono e l'OCR non è offerto: senza
  // riconoscimento ottico, un PDF scansionato non è analizzabile, e prometterlo
  // qui avrebbe solo spostato il fallimento al momento dell'esecuzione.
  'File upload':{fields:[
    {k:'formats',l:'Formati ammessi',ph:'PDF, Word, Excel, PowerPoint, testo',
     opts:['Tutti i formati leggibili','Solo PDF','Solo documenti Office','Solo testo e CSV']},
    {k:'maxsize',l:'Dimensione max (MB)',ph:'8'}],
    reqAny:[{ks:['filedata','kbDocId','kbDocIds'],l:'un file allegato oppure uno o più documenti della Knowledge Base'}],
    sim:function(c){return '📎 File accettato ('+(c.formats||'tutti i formati leggibili')+', max '+(c.maxsize||'8')+' MB)'}},
  // I campi dichiarati diventano i parametri reali del flusso: il pannello
  // genera un modulo da compilare e il valore inserito viaggia davvero nella
  // pipeline. Prima l'unico modo era incollare un JSON grezzo.
  'Form submit':{fields:[
      {k:'formid',l:'ID form',ph:'richiesta-preventivo',req:true},
      {k:'campi',l:'Campi del modulo (uno per riga: nome | etichetta | obbligatorio)',
       ph:'nome | Nome e cognome | si\nemail | Email | si\nmessaggio | Richiesta | no',ta:true,req:true},
      {k:'redirect',l:'Redirect dopo invio',ph:'/grazie'}],
    parametri:true,
    sim:function(c){return '📝 Form "'+(c.formid||'form')+'" inviato'}},
  'Database change':{fields:[{k:'table',l:'Tabella',ph:'orders',req:true},{k:'event',l:'Evento',ph:'INSERT',opts:['INSERT','UPDATE','DELETE','Qualsiasi'],req:true},{k:'batchsize',l:'Batch (righe per invocazione)',ph:'1'}],
    sim:function(c){return '🔄 Evento '+(c.event||'INSERT')+' sulla tabella '+(c.table||'table')}},
  'Event listener':{fields:[{k:'event',l:'Nome evento',ph:'order.completed',req:true},{k:'source',l:'Sorgente/namespace',ph:'orders-service'}],
    sim:function(c){return '🔔 Evento "'+(c.event||'custom.event')+'" ricevuto'}}
};


var LOGIC_CONFIGS={
  // Il Loop ripercorre davvero i nodi a valle.  e' il campo prodotto a
  // monte che contiene l'elenco su cui ciclare: se c'e', il numero di giri lo
  // decidono gli elementi trovati; altrimenti si usa il numero dichiarato.
  'Loop':{fields:[{k:'field',l:'Campo con la lista su cui ciclare',ph:'es. documenti'},{k:'iterations',l:'Oppure quante volte ripetere',ph:'3'},{k:'maxiter',l:'Tetto di sicurezza',ph:'25'},{k:'onitemerror',l:'Se un elemento fallisce',ph:'Salta e continua',opts:['Salta e continua','Ferma il loop']}]},
  'Delay':{fields:[{k:'seconds',l:'Attesa',ph:'30'},{k:'unit',l:'Unità',ph:'Secondi',opts:['Secondi','Minuti','Ore']}]},
  'Retry':{fields:[{k:'attempts',l:'Tentativi max',ph:'3'},{k:'backoff',l:'Backoff (sec, raddoppia)',ph:'2'},{k:'strategy',l:'Strategia backoff',ph:'Esponenziale',opts:['Esponenziale','Fisso','Lineare']}]},
  'Switch':{fields:[{k:'cases',l:'Casi (uno per riga: valore → ramo)',ph:'billing → Finance\ntechnical → IT\naltro → Support',ta:true},{k:'default',l:'Ramo di default',ph:'Support'}]},
  'Error Handler':{fields:[{k:'fallback',l:'Azione di fallback',ph:'notifica admin e continua',opts:['Notifica e continua','Notifica e ferma','Riprova poi ferma','Ignora']},{k:'notifychannel',l:'Notifica su',ph:'#incidents'}]},
  'Merge':{fields:[{k:'strategy',l:'Strategia',ph:'concatena',opts:['Concatena','Primo disponibile','Combina JSON']},{k:'timeout',l:'Timeout attesa rami (sec)',ph:'30'}]},
  'Split':{fields:[{k:'size',l:'Dimensione batch',ph:'10'},{k:'parallel',l:'Esecuzione batch',ph:'Parallela',opts:['Parallela','Sequenziale']}]},
  'Output':{fields:[{k:'format',l:'Formato output',ph:'JSON',opts:['JSON','Testo','CSV','Markdown']},{k:'destination',l:'Destinazione',ph:'Log esecuzioni',opts:['Log esecuzioni','Email','Webhook','Dashboard']}]},
  // Il nome del file è obbligatorio: senza, l'utente si ritroverebbe in
  // Download un file con un nome generato che non sa ricondurre al flusso.
  'Esporta file':{fields:[
    {k:'filename',l:'Nome file (senza estensione)',ph:'risultato-esecuzione',req:true},
    {k:'format',l:'Formato',ph:'CSV',opts:['CSV','JSON','Markdown','Testo','HTML','PDF'],req:true},
    {k:'title',l:'Titolo nel documento',ph:'Report esecuzione'},
    {k:'separator',l:'Separatore CSV',ph:';',opts:[';',',','\t']},
    {k:'destination',l:'Destinazione',ph:'Scarica sul computer',req:true,
     opts:['Scarica sul computer','Salva nella Knowledge Base','Salva su cloud / cartella','Entrambe','Solo genera (link nel registro)']}
  ]},
  // Stesso motore di "Esporta file", ma con la destinazione già impostata sul
  // cloud: chi cerca "salva su Drive" nella palette non deve indovinare che si
  // trova dentro un nodo chiamato Esporta.
  'Salva su cloud':{fields:[
    {k:'filename',l:'Nome file (senza estensione)',ph:'report-mensile',req:true},
    {k:'format',l:'Formato',ph:'PDF',opts:['CSV','JSON','Markdown','Testo','HTML','PDF'],req:true},
    {k:'title',l:'Titolo nel documento',ph:'Report mensile'},
    {k:'cloudDest',l:'Servizio di destinazione',ph:'Google Drive',req:true,
     opts:CS_DESTINAZIONI.map(function(d){return d.l})},
    {k:'cloudPath',l:'Percorso dentro la cartella',ph:'Report/2026/Agosto'},
    {k:'alsoDownload',l:'Scarica anche in locale',ph:'No',opts:['Sì','No']}
  ]},
  'Logger':{fields:[{k:'level',l:'Livello log',ph:'info',opts:['debug','info','warning','error']},{k:'includepayload',l:'Includi payload completo',ph:'No',opts:['Sì','No']}]},
  'Analytics':{fields:[{k:'metric',l:'Nome metrica',ph:'leads_qualificati_totali'},{k:'aggregation',l:'Aggregazione',ph:'Conteggio',opts:['Conteggio','Somma','Media']}]}
};


function renderConfigFields(fields,nid,config,noImplicitReq){
  // Un campo è obbligatorio se marcato req:true, oppure — per compatibilità
  // con i connettori non ancora annotati — se è il primo campo dell'array
  // e nessun altro campo è marcato esplicitamente. L'asterisco rosso lo
  // rende visibile SUBITO nel pannello, non solo dopo aver premuto Esegui.
  // noImplicitReq disattiva questo fallback per array di campi che non
  // rappresentano "il connettore" (es. i campi Avanzati comuni a tutti i
  // nodi Action), dove il primo campo non ha motivo di essere obbligatorio.
  var anyExplicitReq=fields.some(function(x){return x.req});
  return fields.filter(function(f){return campoVisibile(f,config)}).map(function(f,idx){
    var val=config[f.k]||'';
    var opzioni=opzioniDelCampo(f,config);
    var isReq=campoObbligatorio(f,config)||(!noImplicitReq&&!anyExplicitReq&&idx===0);
    var label=f.l+(isReq?' <span style="color:#EF4444" title="Campo obbligatorio">*</span>':'');
    var aiuto=f.aiuto?'<div style="font-size:10px;color:var(--tx4);margin-top:3px;line-height:1.45">'+escHtml(f.aiuto)+'</div>':'';
    if(opzioni){
      return '<div class="prop-group"><div class="prop-label">'+label+'</div><select class="prop-select" onchange="updConfig('+nid+',\''+f.k+'\',this.value)">'+
        '<option value="">'+(f.ph||'seleziona')+'</option>'+
        opzioni.map(function(o){return '<option'+(val===o?' selected':'')+'>'+escHtml(o)+'</option>'}).join('')+
      '</select>'+aiuto+'</div>';
    }
    if(f.ta)return '<div class="prop-group"><div class="prop-label">'+label+'</div><textarea class="prop-input" id="campo_'+nid+'_'+f.k+'" rows="3" placeholder="'+escHtml(f.ph||'')+'" onchange="updConfig('+nid+',\''+f.k+'\',this.value)">'+escHtml(val)+'</textarea>'+aiuto+
      (typeof aiutoTestoHTML==='function'?aiutoTestoHTML('campo_'+nid+'_'+f.k,'testo',nid,f.k):'')+'</div>';
    return '<div class="prop-group"><div class="prop-label">'+label+'</div><input class="prop-input" value="'+escHtml(val)+'" placeholder="'+escHtml(f.ph||'')+'" onchange="updConfig('+nid+',\''+f.k+'\',this.value)">'+aiuto+'</div>';
  }).join('');
}

// ══════════════════════════════════════════
// CAMPI DIPENDENTI
// ══════════════════════════════════════════
// Un nodo mostra parametri diversi a seconda di cosa si è scelto prima: su
// Notion "Crea pagina" chiede il titolo, "Aggiungi riga" no; su MongoDB il
// filtro serve per aggiornare e cercare, non per inserire. Senza questo,
// ogni nodo mostrava sempre tutti i campi e metà non avevano senso — e quelli
// obbligatori bloccavano l'esecuzione anche quando erano irrilevanti.
//
// Tre dichiarazioni, tutte facoltative:
//   mostraSe: {campo:'operation', vale:['Crea','Aggiorna']}   → visibilità
//   optsPer:  {'Jira':[...], 'Trello':[...]}  con dipendeDa   → elenco a cascata
//   reqSe:    {campo:'action', vale:['Rimborso']}             → obbligatorio solo lì

function campoVisibile(f,config){
  if(!f.mostraSe)return true;
  var v=(config||{})[f.mostraSe.campo];
  // Finché il campo da cui dipende non è stato scelto, si mostra: nascondere
  // tutto lascerebbe il pannello vuoto e l'utente senza da dove cominciare.
  if(v===undefined||v==='')return f.mostraSe.seVuoto!==false;
  return f.mostraSe.vale.indexOf(v)>=0;
}

function opzioniDelCampo(f,config){
  if(f.optsPer&&f.dipendeDa){
    var chiave=(config||{})[f.dipendeDa];
    var elenco=f.optsPer[chiave];
    // Nessuna corrispondenza: si ricade sull'elenco generico se c'è, altrimenti
    // il campo diventa libero — meglio scrivibile che vuoto e inservibile.
    if(elenco)return elenco;
    return f.opts||null;
  }
  return f.opts||null;
}

function campoObbligatorio(f,config){
  if(f.reqSe){
    var v=(config||{})[f.reqSe.campo];
    return f.reqSe.vale.indexOf(v)>=0;
  }
  return !!f.req;
}

// Un campo nascosto non è obbligatorio: chiedere un valore che non si può
// nemmeno vedere renderebbe il flusso impossibile da convalidare.
function campiObbligatoriEffettivi(def,config){
  if(!def||!def.fields)return [];
  return def.fields.filter(function(f){
    return campoVisibile(f,config)&&campoObbligatorio(f,config);
  });
}


// ══════════════════════════════════════════
// REAL FILE LOADING per il trigger File upload
// ══════════════════════════════════════════

function loadNodeFile(nid,input){
  if(!input.files||!input.files[0])return;
  var file=input.files[0];
  var node=B.nodes.find(function(x){return x.id===nid});
  if(!node)return;
  if(!node.config)node.config={};

  // Estrazione vera del contenuto: readAsText su un PDF o un .docx consegnava
  // al modello byte binari, e l'analisi documentale sembrava rotta pur essendo
  // il flusso corretto. frExtract riconosce il formato dalla firma del file.
  node.config.filename=file.name;
  node.config.filestato='lettura';
  renderProps(nid);
  showToast('Lettura di "'+file.name+'" in corso...');

  frExtract(file).then(function(r){
    node.config.filedata=r.testo;
    node.config.filetipo=r.tipo;
    node.config.filestato='pronto';
    delete node.config.fileerrore;
    renderProps(nid);
    showToast('OK "'+file.name+'" letto - '+r.tipo+', '+r.testo.length.toLocaleString('it-IT')+' caratteri');
    addAct('Caricato file di test: '+file.name+' ('+r.tipo+')');
  },function(err){
    // L'errore resta nel pannello, non in un toast che sparisce: l'utente deve
    // poter leggere perche' quel file non e' utilizzabile.
    delete node.config.filedata;
    node.config.filestato='errore';
    node.config.fileerrore=err.message||String(err);
    renderProps(nid);
    showToast('Lettura non riuscita');
  });
}


// ══════════════════════════════════════════
// CORS / CONNESSIONE — proxy OpenAI + guida
// ══════════════════════════════════════════

// ══════════════════════════════════════════
// PANNELLO CARTELLA DI DESTINAZIONE
// ══════════════════════════════════════════
// Compare sui nodi che scrivono su cloud. Il collegamento alla cartella e' un
// permesso concesso dall'utente al browser: non puo' essere aperto da codice,
// serve un click. Per questo e' un pulsante e non un campo di testo.

function needsCloudFolder(n){
  if(n.name==='Salva su cloud')return true;
  // Anche i connettori Drive e SharePoint scrivono su cartella sincronizzata:
  // sono marcati `cartella:true` nella loro definizione.
  if(n.type==='ac'){
    var d=(typeof getConnectorConfig==='function')?getConnectorConfig(n.name):null;
    if(d&&d.cartella)return true;
  }
  return n.name==='Esporta file'&&(n.config||{}).destination==='Salva su cloud / cartella';
}

function cloudFolderPanel(nid,n){
  var cfg=n.config||{};
  // Una connessione già configurata e provata evita di rifare il collegamento
  // su ogni nodo: è il motivo per cui la sezione Connessioni esiste.
  if(typeof connSelettore==='function'){
    var scelta=connParametri(cfg);
    var sel=connSelettore(nid,n,'cartella','📁 Cartella di destinazione');
    if(scelta){
      sel+='<div style="font-size:10.5px;color:'+(scelta._stato==='ok'?'#047857':'#B45309')+';margin:-4px 0 10px;line-height:1.45">'+
        (scelta._stato==='ok'?'✅ Connessione provata':'⚠️ Connessione non ancora verificata: aprila e premi Prova')+
        ': cartella "'+escHtml(scelta.alias||'?')+'"'+(scelta.percorso?' › '+escHtml(scelta.percorso):'')+'</div>';
    }
    return sel;
  }
  var alias=cfg.cloudAlias||'';
  var d=(typeof csDestinazione==='function')?csDestinazione(cloudDestKey(cfg)):null;
  var simulato=d&&!d.reale;

  var testa='<div class="prop-group"><div class="prop-label">📁 Cartella collegata'+
    (simulato?'':' <span style="color:#EF4444" title="Campo obbligatorio">*</span>')+'</div>';

  if(simulato){
    return testa+'<div style="font-size:10.5px;color:#B45309;background:#FEF3C7;border-radius:6px;padding:7px 9px;line-height:1.5">'+
      escHtml(d.nota)+'</div></div>';
  }

  if(!csSupportata()){
    // Meglio dire subito perche' non si puo' fare, invece di offrire un pulsante
    // che apre una finestra di errore.
    return testa+'<div style="font-size:10.5px;color:#991B1B;background:#FEE2E2;border-radius:6px;padding:7px 9px;line-height:1.5">'+
      escHtml(csMotivoNonSupportata())+'<br>Il file sar&agrave; comunque generato e scaricato normalmente.</div></div>';
  }

  return testa+
    '<button class="tb-btn" style="width:100%" onclick="scegliCartellaNodo('+nid+')">'+
      (alias?'📂 '+escHtml(alias)+': cambia':'Scegli cartella…')+'</button>'+
    (alias
      ? '<div style="font-size:10px;color:#047857;margin-top:5px;line-height:1.45">✅ Il file verra\' scritto in <code>'+escHtml(alias+(cfg.cloudPath?'/'+String(cfg.cloudPath).replace(/^\/+|\/+$/g,''):''))+'</code></div>'
      : '<div style="font-size:10px;color:#B45309;background:#FEF3C7;border-radius:6px;padding:6px 8px;margin-top:6px;line-height:1.45">⚠️ Nessuna cartella collegata: senza, il nodo non puo\' scrivere. Scegli la cartella locale sincronizzata dal servizio (es. <code>Google Drive</code> o <code>OneDrive</code>).</div>')+
    (d?'<div style="font-size:10px;color:var(--tx4);margin-top:6px;line-height:1.45">'+escHtml(d.nota)+'</div>':'')+
    '</div>';
}

// Il campo memorizza l'etichetta leggibile; il resto del codice ragiona per
// chiave, quindi la conversione avviene in un punto solo.
function cloudDestKey(cfg){
  var l=cfg.cloudDest||'';
  var d=(typeof CS_DESTINAZIONI!=='undefined')?CS_DESTINAZIONI.filter(function(x){return x.l===l})[0]:null;
  return d?d.k:'cartella';
}

function scegliCartellaNodo(nid){
  var n=B.nodes.find(function(x){return x.id===nid});
  if(!n)return;
  csScegliCartella().then(function(h){
    if(!n.config)n.config={};
    n.config.cloudAlias=h.name;
    if(typeof pushUndo==='function')pushUndo('collegamento cartella');
    renderProps(nid);
    showToast('Cartella collegata: '+h.name);
  },function(err){
    // L'annullamento del selettore non e' un errore da segnalare.
    if(err&&err.name==='AbortError')return;
    showToast('Cartella non collegata: '+(err.message||err));
  });
}

// ══════════════════════════════════════════
// ESCLUSIONE DI UN NODO DALL'ESECUZIONE
// ══════════════════════════════════════════
// Equivale a commentare una riga di codice: il nodo resta sul canvas con le sue
// connessioni e la sua configurazione, ma al Run viene saltato e il flusso
// prosegue collegando chi sta a monte con chi sta a valle. Serve per provare
// una variante senza smontare il grafo e senza perdere quanto configurato.

function toggleEsclusoNodo(nid){
  var n=B.nodes.find(function(x){return x.id===nid});
  if(!n)return;
  // Un controllo imposto da politica non e' escludibile: sarebbe un modo per
  // aggirarlo senza che risulti da nessuna parte.
  if(n.locked&&!n.escluso){
    showToast('Questo controllo e\u0300 imposto da politica: non puo\u0300 essere escluso');
    return;
  }
  pushUndo(n.escluso?'reinclusione nodo':'esclusione nodo');
  n.escluso=!n.escluso;
  clearInvalidNodes();
  b_render();renderProps(nid);
  showToast(n.escluso?'\ud83d\udeab "'+n.name+'" escluso dall\'esecuzione':'\u2705 "'+n.name+'" di nuovo attivo');
}

function toggleEsclusoSelezione(){
  var ids=(B.selIds&&B.selIds.length)?B.selIds:(B.selId>0?[B.selId]:[]);
  if(!ids.length)return;
  var nodi=B.nodes.filter(function(n){return ids.indexOf(n.id)>=0&&!n.locked});
  if(!nodi.length){showToast('Nessun nodo escludibile nella selezione');return}
  // Se anche uno solo e' attivo si escludono tutti; altrimenti si riattivano.
  var attiva=nodi.some(function(n){return !n.escluso});
  pushUndo(attiva?'esclusione nodi':'reinclusione nodi');
  nodi.forEach(function(n){n.escluso=attiva});
  clearInvalidNodes();
  b_render();renderProps(B.selId>0?B.selId:-1);
  showToast((attiva?'\ud83d\udeab ':'\u2705 ')+nodi.length+' nodo/i '+(attiva?'escluso/i dall\'esecuzione':'riattivato/i'));
}

// Quanti nodi sono attualmente esclusi: serve all'avviso in barra strumenti.
function contaEsclusi(){
  return B.nodes.filter(function(n){return n.escluso}).length;
}

// ══════════════════════════════════════════
// PRESET SMTP
// ══════════════════════════════════════════
// Host e porte reali dei provider piu' diffusi. Scegliere il provider compila
// i campi tecnici: sono valori che nessuno ricorda a memoria e sbagliarli e' il
// modo piu' comune di non far partire un invio.
var SMTP_PRESET={
  'Gmail':{host:'smtp.gmail.com',port:'587',security:'STARTTLS',
    nota:'Google richiede una "password per le app" (con verifica in due passaggi attiva): la password normale dell\u2019account viene rifiutata.'},
  'Outlook / Microsoft 365':{host:'smtp.office365.com',port:'587',security:'STARTTLS',
    nota:'Microsoft 365 disabilita SMTP di base sui tenant nuovi: va riabilitato dall\u2019amministratore o usato OAuth2.'},
  'Aruba':{host:'smtps.aruba.it',port:'465',security:'SSL/TLS',nota:'Aruba usa SMTP su SSL diretto, porta 465.'},
  'Register.it':{host:'authsmtp.securemail.pro',port:'465',security:'SSL/TLS',nota:''},
  'SendGrid':{host:'smtp.sendgrid.net',port:'587',security:'STARTTLS',
    nota:'L\u2019utente e\u0300 letteralmente "apikey"; la chiave API va al posto della password.'},
  'Amazon SES':{host:'email-smtp.eu-south-1.amazonaws.com',port:'587',security:'STARTTLS',
    nota:'Le credenziali SMTP di SES sono diverse dalle chiavi IAM e vanno generate a parte.'},
  'Altro (manuale)':{nota:'Inserisci host, porta e cifratura indicati dal tuo provider di posta.'}
};

// Applicata quando cambia il campo "preset": compila gli altri campi solo se
// il preset li definisce, cosi' "Altro (manuale)" non cancella quanto scritto.
function applicaPresetSmtp(nid,nome){
  var p=SMTP_PRESET[nome];
  var n=B.nodes.find(function(x){return x.id===nid});
  if(!p||!n)return;
  if(!n.config)n.config={};
  if(p.host){n.config.host=p.host;n.config.port=p.port;n.config.security=p.security}
  renderProps(nid);
}

// ══════════════════════════════════════════
// PARAMETRI DI INGRESSO DI TRIGGER E FORM
// ══════════════════════════════════════════
// I campi dichiarati sul nodo diventano un modulo compilabile nel pannello: il
// valore inserito viaggia DAVVERO nella pipeline come JSON, ed e' cio' che
// permette di far proseguire il flusso con parametri propri invece che con un
// payload di esempio incollato a mano.

// "nome | etichetta | obbligatorio" -> {k, l, req}
function parseCampiTrigger(testo){
  return String(testo||'').split('\n').map(function(r){return r.trim()}).filter(Boolean).map(function(r){
    var p=r.split('|').map(function(x){return x.trim()});
    return {k:p[0], l:p[1]||p[0], req:/^(si|s\u00ec|yes|y|true|1)$/i.test(p[2]||'')};
  }).filter(function(c){return c.k});
}

function renderParametriTrigger(nid,n){
  var campi=parseCampiTrigger((n.config||{}).campi);
  if(!campi.length)return '';
  var val=(n.config&&n.config.valori)||{};
  var mancanti=campi.filter(function(c){return c.req&&!String(val[c.k]||'').trim()}).length;
  return '<div class="prop-group"><div class="prop-label">\u25b6\ufe0f Parametri di ingresso</div>'+
    '<div style="font-size:10px;color:var(--tx4);margin-bottom:8px;line-height:1.45">Questi valori vengono passati realmente al flusso come JSON alla partenza.</div>'+
    campi.map(function(c){
      return '<div style="margin-bottom:8px"><div style="font-size:11px;font-weight:600;margin-bottom:3px">'+
        escHtml(c.l)+(c.req?' <span style="color:#EF4444">*</span>':'')+
        ' <span style="color:var(--tx4);font-weight:400">('+escHtml(c.k)+')</span></div>'+
        '<input class="prop-input" value="'+escHtml(val[c.k]||'')+'" placeholder="'+escHtml(c.l)+'" '+
        'onchange="updParametroTrigger('+nid+',\''+c.k+'\',this.value)"></div>';
    }).join('')+
    (mancanti
      ? '<div style="font-size:10px;color:#B45309;background:#FEF3C7;border-radius:6px;padding:6px 8px;line-height:1.45">\u26a0\ufe0f '+mancanti+' parametro/i obbligatorio/i da compilare prima di eseguire.</div>'
      : '<details style="margin-top:4px"><summary style="font-size:10px;color:var(--tx4);cursor:pointer">JSON che verr\u00e0 passato al flusso</summary>'+
        '<pre style="font-size:10px;background:var(--bg2);padding:8px;border-radius:6px;white-space:pre-wrap;margin:5px 0 0">'+
        escHtml(JSON.stringify(costruisciPayload(n),null,2))+'</pre></details>')+
    '</div>';
}

function updParametroTrigger(nid,chiave,valore){
  B.effimero=false;
  var n=B.nodes.find(function(x){return x.id===nid});
  if(!n)return;
  if(!n.config)n.config={};
  if(!n.config.valori)n.config.valori={};
  n.config.valori[chiave]=valore;
  if(B._invalidIds)delete B._invalidIds[nid];
  renderProps(nid);
}

// Costruisce il payload dai valori inseriti. I numeri restano numeri: un
// importo passato come stringa costringerebbe ogni nodo a valle a convertirlo.
function costruisciPayload(n){
  var campi=parseCampiTrigger((n.config||{}).campi);
  var val=(n.config&&n.config.valori)||{};
  var out={};
  campi.forEach(function(c){
    var v=val[c.k];
    if(v===undefined||v==='')return;
    out[c.k]=(/^-?\d+([.,]\d+)?$/.test(String(v).trim()))?parseFloat(String(v).replace(',','.')):v;
  });
  return out;
}

// ══════════════════════════════════════════
// ISTRUZIONI PREDEFINITE DEI NODI AI
// ══════════════════════════════════════════
// Ogni nodo AI nasceva con il prompt VUOTO: trascinare "Summarizer" e premere
// Esegui produceva una risposta generica, perche' al modello non veniva detto
// nulla. Qui ogni nodo porta con se' il proprio compito, il formato di uscita
// atteso e il divieto di inventare — restano modificabili, ma partono utili.
var AI_NODE_PRESET={
  'Summarizer':{outformat:'markdown',prompt:
    'Riassumi il testo ricevuto in modo fedele. Struttura: 3-5 punti chiave, poi una riga di conclusione. Non aggiungere informazioni assenti dal testo. Se il testo e\u0300 troppo breve per essere riassunto, dillo.'},
  'Classifier':{outformat:'json',prompt:
    'Classifica il contenuto ricevuto. Rispondi SOLO JSON: {"categoria":"...","urgenza":"bassa|media|alta","confidenza":0-1,"motivazione":"..."}. Se il contenuto non e\u0300 classificabile usa categoria "non_determinata" con confidenza bassa.'},
  'Extractor':{outformat:'json',prompt:
    'Estrai i dati strutturati presenti nel testo. Rispondi SOLO JSON con una chiave per ogni dato trovato. Un campo non presente va lasciato vuoto: non dedurlo e non inventarlo.'},
  'Translator':{prompt:
    'Traduci il testo ricevuto in italiano, mantenendo terminologia tecnica, formattazione e nomi propri. Se il testo e\u0300 gia\u0300 in italiano, restituiscilo invariato.'},
  'Vision AI':{prompt:
    'Descrivi il contenuto del documento ricevuto ed estrai le informazioni rilevanti. Se ricevi solo testo estratto e non un\u2019immagine, lavora su quello dichiarandolo.'},
  'Chat Agent':{prompt:
    'Rispondi alla richiesta dell\u2019utente in modo diretto e cortese, usando esclusivamente le informazioni ricevute in input. Se manca un dato per rispondere, chiedilo invece di supporre.'},
  'LLM Prompt':{prompt:
    'Elabora i dati ricevuti in input secondo le istruzioni che seguono. Sii conciso e non introdurre informazioni non presenti nei dati.'},
  // I due nodi di analisi: il formato di uscita e' tabellare/JSON perche' il
  // risultato deve poter alimentare un export o un grafico, non solo essere letto.
  'Analisi dati':{outformat:'json',prompt:
    'Analizza i dati tabellari ricevuti (CSV o JSON). Calcola: numero di righe, statistiche descrittive per ogni colonna numerica (minimo, massimo, media, somma), la distribuzione delle colonne categoriali, e segnala i valori anomali o mancanti. Rispondi SOLO JSON: {"righe":N,"colonne":[...],"statistiche":{...},"categorie":{...},"anomalie":[...],"osservazioni":["..."]}. Calcola sui dati realmente ricevuti: non stimare e non completare i valori mancanti.'},
  'Confronto documenti':{outformat:'markdown',prompt:
    'Confronta i due testi ricevuti in input. Riporta in tabella Markdown: elemento, versione A, versione B, tipo di differenza (aggiunta, rimozione, modifica). Elenca poi le differenze sostanziali separandole da quelle di sola forma. Se ricevi un solo documento, dillo invece di confrontarlo con se stesso.'}
};

// ══════════════════════════════════════════
// ORIENTAMENTO DEL FLUSSO
// ══════════════════════════════════════════
// Verticale: il flusso scende, porte sopra e sotto. Orizzontale: scorre da
// sinistra a destra, porte a sinistra e a destra — la disposizione di n8n.
// La scelta cambia tre cose insieme: dove stanno le porte (CSS), come esce la
// curva di collegamento, e come dispone i nodi il riordino automatico. Se
// cambiasse solo una delle tre, il risultato sarebbe peggiore di prima.

function orizzontale(){ return B.orientamento==='orizzontale' }

// Curva di collegamento fra due porte, coerente con l'orientamento.
function bCurva(x1,y1,x2,y2){
  if(orizzontale()){
    var dx=Math.max(40,Math.abs(x2-x1)*0.5);
    return 'M'+x1+','+y1+' C'+(x1+dx)+','+y1+' '+(x2-dx)+','+y2+' '+x2+','+y2;
  }
  var dy=Math.max(40,Math.abs(y2-y1)*0.5);
  return 'M'+x1+','+y1+' C'+x1+','+(y1+dy)+' '+x2+','+(y2-dy)+' '+x2+','+y2;
}

function impostaOrientamento(v){
  B.orientamento = (v==='orizzontale') ? 'orizzontale' : 'verticale';
  var ca=document.getElementById('canvasArea');
  if(ca)ca.classList.toggle('orizzontale',orizzontale());
  var b=document.getElementById('btnOrientamento');
  if(b){
    b.textContent = orizzontale() ? '⇄' : '⇅';
    b.title = orizzontale()
      ? 'Flusso orizzontale: clicca per passare a verticale'
      : 'Flusso verticale, clicca per passare a orizzontale';
  }
  try{ localStorage.setItem('relaition_orientamento', B.orientamento) }catch(e){}
  b_render();
}

function cambiaOrientamento(){
  impostaOrientamento(orizzontale()?'verticale':'orizzontale');
  // Il flusso viene ridisposto subito: lasciare i nodi incolonnati con le
  // porte laterali darebbe frecce che tornano indietro, e sembrerebbe rotto.
  if(B.nodes.length)bAutoLayout();
  else bResetView();
  showToast(orizzontale()?'\u21c4 Flusso orizzontale':'\u21c5 Flusso verticale');
}

// Ripristina la scelta all'apertura del builder.
function initOrientamento(){
  var salvato=null;
  try{ salvato=localStorage.getItem('relaition_orientamento') }catch(e){}
  impostaOrientamento(salvato||'verticale');
}

// ══════════════════════════════════════════
// SCELTA DEL MODELLO SUL NODO AI
// ══════════════════════════════════════════
// Il fornitore dice CON CHI si parla, il modello dice QUANTO si spende e quanto
// bene risponde. Sono due decisioni diverse e vanno prese separatamente: su un
// flusso che classifica mille richieste al giorno il modello economico cambia
// il conto di fine mese, su una stesura di testo cambia il risultato.
function renderSceltaModello(nid,n){
  if(typeof modelliDelProvider!=='function')return '';
  var ris=(typeof risolviProvider==='function')?risolviProvider(n.config.model):null;
  var prov=ris&&ris.provider;
  if(!prov)return '';

  var elenco=modelliDelProvider(prov);
  if(!elenco.length){
    // Fornitore locale senza modelli rilevati: si dice cosa fare, invece di
    // mostrare una tendina vuota.
    if(prov==='locale'||prov==='custom'){
      return '<div class="prop-group"><div class="prop-label">Modello</div>'+
        '<input class="prop-input" value="'+escHtml(n.config.modelId||'')+'" placeholder="nome del modello sul server"'+
        ' onchange="updConfig('+nid+',\'modelId\',this.value)">'+
        '<div style="font-size:10px;color:var(--tx4);margin-top:3px">Rileva i modelli disponibili dal pannello «Integrazione AI».</div></div>';
    }
    return '';
  }

  var scelto=(typeof modelloEffettivo==='function')?modelloEffettivo(prov,n.config.modelId):elenco[0].id;
  var corrente=elenco.filter(function(m){return m.id===scelto})[0]||elenco[0];
  return '<div class="prop-group"><div class="prop-label">Modello</div>'+
    '<select class="prop-select" onchange="updConfig('+nid+',\'modelId\',this.value)">'+
      elenco.map(function(m){
        return '<option value="'+escHtml(m.id)+'"'+(m.id===scelto?' selected':'')+'>'+escHtml(m.nome)+'</option>';
      }).join('')+
    '</select>'+
    (corrente.nota?'<div style="font-size:10px;color:var(--tx4);margin-top:3px;line-height:1.45">'+escHtml(corrente.nota)+'</div>':'')+
  '</div>';
}

// ══════════════════════════════════════════
// CAMPI CITATI DALLE CONDIZIONI
// ══════════════════════════════════════════
// Una condizione che nomina un campo che nessun nodo a monte produce e' sempre
// falsa: il ramo non parte mai e il nodo a valle risulta "saltato", senza che
// nulla dica perche'. E' il modo piu' comune di ritrovarsi con un flusso che
// gira senza fare niente.

// Identificatori usati in un'espressione, tolti i letterali e le parole chiave.
function campiCitati(espressione){
  var testo=String(espressione||'');
  // Le stringhe fra apici sono valori, non nomi di campo.
  testo=testo.replace(/'[^']*'/g,' ').replace(/"[^"]*"/g,' ');
  var riservate=['true','false','null','undefined','and','or','not','e','o','oppure','result'];
  return (testo.match(/[a-zA-Z_][a-zA-Z0-9_.]*/g)||[])
    .map(function(x){return x.split('.')[0]})
    .filter(function(x){return riservate.indexOf(x.toLowerCase())<0})
    .filter(function(x,i,a){return a.indexOf(x)===i});
}

// Campi che un nodo dichiara di produrre: dallo schema JSON scritto nel prompt
// ({campo: tipo, ...}) e, per i trigger, dai parametri dichiarati.
function campiProdotti(n){
  var out=[];
  if(n.type==='ai'){
    var p=String((n.config&&n.config.prompt)||'');
    // Si prende l'ULTIMA graffa: i prompt descrivono prima il compito e poi lo
    // schema atteso, e la prima graffa e' spesso un esempio parziale.
    var graffe=p.match(/\{[^{}]*\}/g)||[];
    graffe.forEach(function(g){
      (g.slice(1,-1).split(',')||[]).forEach(function(coppia){
        var nome=coppia.split(':')[0].trim().replace(/["']/g,'');
        if(/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nome))out.push(nome);
      });
    });
  }
  if(n.type==='tr'&&n.config&&n.config.campi&&typeof parseCampiTrigger==='function'){
    parseCampiTrigger(n.config.campi).forEach(function(c){out.push(c.k)});
  }
  if(n.type==='tr'&&n.config&&n.config.sample){
    try{ Object.keys(JSON.parse(n.config.sample)).forEach(function(k){out.push(k)}) }catch(e){}
  }
  return out;
}

// Percorre il grafo a ritroso. Restituisce i campi dichiarati dai nodi a monte
// e — altrettanto importante — se qualcuno di quei nodi produce testo libero.
function campiDisponibiliAMonte(nodes,edges,idNodo){
  var visti={}, coda=[idNodo], campi=[], guardia=0, liberi=false;
  while(coda.length&&guardia++<200){
    var cur=coda.shift();
    edges.filter(function(e){return e.to===cur}).forEach(function(e){
      if(visti[e.from])return;
      visti[e.from]=1;
      var n=nodes.filter(function(x){return x.id===e.from})[0];
      if(n){
        var c=campiProdotti(n);
        if(n.type==='ai'&&!c.length)liberi=true;   // prompt senza schema: contenuto ignoto
        c.forEach(function(x){campi.push(x)});
      }
      coda.push(e.from);
    });
  }
  return {campi:campi, liberi:liberi};
}

// Verifica delle condizioni. Il criterio non e' sintattico ma di conoscenza:
// si segnala un campo mancante SOLO se ogni nodo AI a monte dichiara nel
// proprio prompt uno schema JSON esplicito. In quel caso lo schema e'
// autoritativo e un campo fuori elenco e' un errore vero. Se anche un solo
// nodo a monte produce testo libero non si puo' sapere cosa contenga, e
// tacere e' l'unica risposta onesta: un avviso sbagliato su un flusso che
// funziona vale meno di nessun avviso.
function verificaCondizioni(nodes,edges){
  var avvisi=[];
  nodes.filter(function(n){return n.type==='cd'&&n.config&&n.config.condition}).forEach(function(n){
    // Una condizione senza operatori di confronto e' scritta in italiano
    // ("convalida superata"): la valuta il modello, non c'e' nessun nome di
    // campo da controllare.
    if(!/(==|!=|>=|<=|>|<)/.test(String(n.config.condition)))return;
    var monte=campiDisponibiliAMonte(nodes,edges,n.id);
    // Se nessun nodo a monte dichiara uno schema non si sa cosa arrivi al nodo:
    // ogni segnalazione sarebbe un'ipotesi. Basta pero' che UNO lo dichiari
    // perche' un campo fuori da quell'elenco diventi un sospetto fondato.
    if(!monte.campi.length)return;
    var ignoti=campiCitati(n.config.condition).filter(function(c){return monte.campi.indexOf(c)<0});
    if(!ignoti.length)return;
    var aValle=edges.filter(function(e){return e.from===n.id&&e.fp==='true'})
      .map(function(e){var t=nodes.filter(function(x){return x.id===e.to})[0];return t?t.name:null})
      .filter(Boolean);
    avvisi.push({nodeId:n.id,severity:'warning',
      msg:'"'+n.name+'": la condizione usa '+ignoti.map(function(c){return '"'+c+'"'}).join(', ')+
          ', che nessun nodo a monte dichiara di produrre. La condizione sara\u0300 sempre falsa'+
          (aValle.length?' e "'+aValle.join('", "')+'" non verr'+(aValle.length>1?'anno':'à')+' mai eseguit'+(aValle.length>1?'i':'o'):'')+
          '. Controlla il nome del campo, oppure chiedi al nodo AI a monte di produrlo.'});
  });
  return avvisi;
}

// ══════════════════════════════════════════════════════════════
// CONNETTORI CHE POSSONO RIUSARE UNA CONNESSIONE
// ══════════════════════════════════════════════════════════════
// Host, porta e URL erano duplicati su ogni nodo: cambiare server voleva dire
// riaprire tutti i flussi che lo usavano, e nessuno di quei campi era mai
// stato provato. Qui si dichiara quali campi del nodo li fornisce invece la
// connessione — `campoDelNodo: campoDellaConnessione`.
// I campi restano nella definizione del connettore: senza connessione scelta
// si compilano a mano come prima, cosi' i flussi gia' salvati non cambiano
// comportamento.
var CONN_PER_CONNETTORE={
  'PostgreSQL':   {tipo:'database', campi:{host:'host',port:'port',database:'database',user:'user'}},
  'MongoDB':      {tipo:'database', campi:{uri:'host',database:'database'}},
  'Redis':        {tipo:'database', campi:{host:'host',port:'port'}},
  'Elasticsearch':{tipo:'http',     campi:{endpoint:'baseurl'}},
  'HTTP Request': {tipo:'http',     campi:{url:'baseurl',headers:'headers'}},
  'GraphQL':      {tipo:'http',     campi:{endpoint:'baseurl'}},
  'n8n Workflow': {tipo:'http',     campi:{baseurl:'baseurl'}},
  'Invia email':  {tipo:'smtp',     campi:{}},
  // Questi restano connettori SIMULATI — il registro li marca come tali — ma
  // l'indirizzo dell'istanza e' una configurazione reale: sceglierlo da una
  // connessione provata evita di riscriverlo su ogni nodo, e lo script Python
  // esportato punta all'istanza giusta invece che a un segnaposto.
  'Supabase':     {tipo:'http',     campi:{projecturl:'baseurl'}},
  'Jira':         {tipo:'http',     campi:{baseurl:'baseurl'}},
  'Confluence':   {tipo:'http',     campi:{baseurl:'baseurl'}},
  'GitLab':       {tipo:'http',     campi:{baseurl:'baseurl'}}
};
var CONN_ETICHETTA={database:'🗄️ Connessione al database',http:'🌐 Endpoint',
                    smtp:'📧 Posta in uscita',webhook:'📡 Webhook',cartella:'📁 Cartella'};

function connessioneDelConnettore(nome){ return CONN_PER_CONNETTORE[nome]||null }

// Config del nodo con i valori presi dalla connessione scelta. Il runtime la
// usa al posto di node.config: cosi' un flusso esportato e reimportato su un
// altro ambiente punta al server di QUELLA installazione, non a quello di chi
// l'ha costruito.
function configConConnessione(nome,config){
  var m=connessioneDelConnettore(nome);
  if(!m||!config||!config.connessioneId)return config;
  var par=(typeof connParametri==='function')?connParametri(config):null;
  if(!par)return config;
  var fuso=Object.assign({},config);
  Object.keys(m.campi).forEach(function(kNodo){
    var v=par[m.campi[kNodo]];
    if(v!==undefined&&v!==null&&String(v).trim()!=='')fuso[kNodo]=v;
  });
  return fuso;
}

// I campi che arrivano dalla connessione non vanno mostrati sul nodo: due
// posti dove leggere lo stesso valore, con quello del nodo ignorato, e'
// esattamente il disallineamento che questa modifica elimina.
function campiCopertiDaConnessione(nome,config){
  var m=connessioneDelConnettore(nome);
  if(!m||!config||!config.connessioneId)return {};
  return (typeof connParametri==='function'&&connParametri(config))?m.campi:{};
}

// ══════════════════════════════════════════
// NOME DEL FLUSSO IN TESTA AL BUILDER
// ══════════════════════════════════════════
// Il nome viveva solo in `currentAgentName`, senza comparire da nessuna parte:
// aprendo un agente non si sapeva quale fosse, e con piu' flussi salvati si
// finiva per salvare sopra quello sbagliato.
function aggiornaTitoloBuilder(){
  var el=document.getElementById('builderTitoloNome');
  if(el)el.textContent=currentAgentName||'Nuovo agente';
  var st=document.getElementById('builderTitoloStato');
  if(!st)return;
  var parti=[];
  parti.push(B.nodes.length+' nod'+(B.nodes.length===1?'o':'i'));
  // Salvato o no: e' l'informazione che manca quando si chiude il Builder
  // senza sapere se il lavoro e' al sicuro.
  if(B.dbAgentId){
    var r=dbGetOne('SELECT active,schedule_type,schedule_value FROM agents WHERE id=?',[B.dbAgentId]);
    parti.push('salvato');
    if(r&&r.active)parti.push('\u23f0 in produzione'+
      (typeof descriviPianificazione==='function'&&r.schedule_type!=='manual'
        ? ' \u00b7 '+descriviPianificazione(r.schedule_type,r.schedule_value) : ''));
  }else if(B.nodes.length){
    parti.push('non ancora salvato');
  }
  st.textContent='\u00b7 '+parti.join(' \u00b7 ');
}

// Rinomina dal titolo: e' il posto dove uno cerca di cambiarlo.
function rinominaFlusso(){
  var n=prompt('Nome del flusso:',currentAgentName||'');
  if(n===null)return;
  n=String(n).trim();
  if(!n){showToast('\u26a0\ufe0f Il nome non pu\u00f2 essere vuoto');return}
  currentAgentName=n;
  // Se l'agente e' gia' salvato, il nome nuovo va anche sulla riga: altrimenti
  // la lista continuerebbe a mostrare quello vecchio.
  if(B.dbAgentId)dbRun('UPDATE agents SET name=?,updated_at=? WHERE id=?',[n,new Date().toISOString(),B.dbAgentId]);
  aggiornaTitoloBuilder();
  showToast('\u270f\ufe0f Flusso rinominato: '+n);
}

// ══════════════════════════════════════════
// DIVISORI TRASCINABILI DEL BUILDER
// ══════════════════════════════════════════
// Le proporzioni giuste dipendono da cosa si sta facendo: costruire con la
// chat, disporre i nodi, configurare un connettore. Le misure scelte
// sopravvivono al ricaricamento, altrimenti si rifarebbe lo stesso gesto ogni
// volta che si riapre il Builder.
var BGRIP_LIMITI={
  gripPalette:{sel:'.builder-sidebar',prop:'width', min:180,max:460,verso:1},
  gripProps:  {sel:'.builder-props',  prop:'width', min:240,max:560,verso:-1},
  gripHeader: {sel:'.builder-header', prop:'height',min:70, max:520,verso:1}
};
var BGRIP_CHIAVE='relaition_builder_misure';

function bgripMisure(){
  try{ return JSON.parse(localStorage.getItem(BGRIP_CHIAVE)||'{}') }catch(e){ return {} }
}
function bgripSalva(id,valore){
  try{ var m=bgripMisure(); m[id]=valore; localStorage.setItem(BGRIP_CHIAVE,JSON.stringify(m)) }catch(e){}
}

function bgripApplica(id,valore){
  var def=BGRIP_LIMITI[id]; if(!def)return;
  var el=document.querySelector(def.sel); if(!el)return;
  var v=Math.max(def.min,Math.min(def.max,Math.round(valore)));
  el.style[def.prop]=v+'px';
  // Il pannello della chat ha un tetto in vh che vincerebbe sull'altezza
  // impostata a mano: va rimosso quando l'utente decide la sua misura.
  if(def.prop==='height')el.style.maxHeight='none';
  return v;
}

function initDivisoriBuilder(){
  var misure=bgripMisure();
  Object.keys(BGRIP_LIMITI).forEach(function(id){
    var grip=document.getElementById(id);
    if(!grip||grip._pronto)return;
    grip._pronto=true;
    var def=BGRIP_LIMITI[id];
    if(misure[id])bgripApplica(id,misure[id]);

    grip.addEventListener('mousedown',function(e){
      var el=document.querySelector(def.sel); if(!el)return;
      var partenza=def.prop==='width'?el.offsetWidth:el.offsetHeight;
      var origine=def.prop==='width'?e.clientX:e.clientY;
      grip.classList.add('attivo');
      document.body.classList.add('bgrip-trascino',def.prop==='width'?'col':'row');

      function muovi(ev){
        var delta=((def.prop==='width'?ev.clientX:ev.clientY)-origine)*def.verso;
        var v=bgripApplica(id,partenza+delta);
        // Le frecce sono disegnate in SVG sulle coordinate correnti: senza
        // ridisegnare restano dove stavano mentre i nodi si spostano.
        if(typeof b_render==='function')b_render();
        grip._ultima=v;
      }
      function stacca(){
        document.removeEventListener('mousemove',muovi);
        document.removeEventListener('mouseup',stacca);
        grip.classList.remove('attivo');
        document.body.classList.remove('bgrip-trascino','col','row');
        if(grip._ultima)bgripSalva(id,grip._ultima);
      }
      document.addEventListener('mousemove',muovi);
      document.addEventListener('mouseup',stacca);
      e.preventDefault();e.stopPropagation();
    });

    // Doppio clic: torna alla misura predefinita. Serve quando si e' trascinato
    // troppo e non si sa piu' quale fosse la larghezza di partenza.
    grip.addEventListener('dblclick',function(e){
      var el=document.querySelector(def.sel); if(!el)return;
      el.style[def.prop]='';
      if(def.prop==='height')el.style.maxHeight='';
      try{ var m=bgripMisure(); delete m[id]; localStorage.setItem(BGRIP_CHIAVE,JSON.stringify(m)) }catch(err){}
      if(typeof b_render==='function')b_render();
      showToast('\u21a9\ufe0f Dimensione ripristinata');
      e.preventDefault();e.stopPropagation();
    });
  });
}

// Toglie il file allegato a un nodo trigger. Serve a cambiare sorgente: senza,
// per usare un documento della Knowledge Base bisognava caricare un altro file
// qualsiasi, e quello precedente restava comunque il dato in ingresso.
function svuotaFileNodo(nid){
  var n=B.nodes.find(function(x){return x.id===nid});
  if(!n||!n.config)return;
  // Se il contenuto veniva dalla Knowledge Base, si sganciano anche i
  // documenti: altrimenti le caselle resterebbero spuntate su una sorgente
  // che non c'e' piu'.
  if(n.config.kbDocIds||n.config.kbDocId){
    n.config.kbDocIds='';delete n.config.kbDocId;
  }
  n.config.filedata='';n.config.filename='';n.config.filetipo='';
  delete n.config.filestato; delete n.config.fileerrore; delete n.config.lottoEsito;
  b_render(); renderProps(nid);
  showToast('🗑️ Sorgente rimossa: scegli un file o un documento della Knowledge Base');
}

// ══════════════════════════════════════════
// ESPORTAZIONE DEL REGISTRO CORRENTE
// ══════════════════════════════════════════
// Il registro racconta UNA esecuzione, e quella appena conclusa e' proprio
// quella che serve allegare a un ticket o mostrare a un collega. Finora
// l'unico export era quello dell'intera tabella dalla pagina Log Esecuzioni:
// per portarsi via dieci righe bisognava esportarne mille e cercarle dentro.

// Il messaggio puo' contenere marcatura HTML (i collegamenti "Perche' questo
// risultato" e "riscarica il file"): in un file di testo va tolta.
function regTestoPulito(msg){
  return String(msg||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
}

function regEsportabile(){
  return (typeof execEntries!=='undefined') && execEntries.length>0;
}

function esportaRegistro(formato){
  if(!regEsportabile()){showToast('\u26a0\ufe0f Nessuna esecuzione da esportare');return}
  var nome=(currentAgentName||'flusso').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').substring(0,40);
  var quando=new Date();
  var marca=quando.toISOString().slice(0,19).replace(/[:T]/g,'-');
  var esito=execEntries.some(function(e){return e.status==='ERR'})?'con errori'
           :execEntries.some(function(e){return e.status==='WARN'})?'con avvisi':'riuscita';

  if(formato==='CSV'){
    // Il separatore e' il punto e virgola: e' quello che Excel in italiano si
    // aspetta, e senza il file si apre tutto in una colonna.
    var righe=[['ora','tipo','esito','nodo','messaggio']].concat(execEntries.map(function(e){
      // Il nodo di provenienza serve anche fuori dall'applicazione: e' la
      // colonna che permette di filtrare un registro lungo per blocco.
      var nn=(e.nodeId!=null)?(B.nodes.find(function(x){return x.id===e.nodeId})||{}).name:'';
      return [e.time,e.type,e.status,nn||'',regTestoPulito(e.msg)];
    }));
    var csv=righe.map(function(r){
      return r.map(function(c){var s=String(c==null?'':c);
        return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}).join(';');
    }).join('\n');
    foDownload('registro-'+nome+'_'+marca+'.csv','text/csv;charset=utf-8',csv);
  }
  else if(formato==='JSON'){
    // Con la traccia completa: e' cio' che permette di rieseguire l'esecuzione
    // sostituendo le chiamate reali con gli esiti registrati.
    var ultima=window.__ultimaEsecuzione||{};
    foDownload('registro-'+nome+'_'+marca+'.json','application/json;charset=utf-8',
      JSON.stringify({
        agente:currentAgentName, esportato:quando.toISOString(), esito:esito,
        nodi:B.nodes.length, passi:execEntries.length,
        registro:execEntries.map(function(e){
          var nn=(e.nodeId!=null)?(B.nodes.find(function(x){return x.id===e.nodeId})||{}).name:null;
          return {ora:e.time,tipo:e.type,esito:e.status,nodo:nn,nodeId:e.nodeId,messaggio:regTestoPulito(e.msg)}}),
        traccia:ultima.trace||null, eventi:ultima.events||null
      },null,2));
  }
  else{
    var L=['# Registro di esecuzione: '+(currentAgentName||'flusso'),'',
      '**Eseguito il** '+quando.toLocaleString('it-IT'),
      '**Esito** '+esito+'  ·  **Nodi** '+B.nodes.length+'  ·  **Passi** '+execEntries.length,'',
      '| Ora | Tipo | Esito | Nodo | Messaggio |','|---|---|---|---|---|'];
    execEntries.forEach(function(e){
      var nn=(e.nodeId!=null)?((B.nodes.find(function(x){return x.id===e.nodeId})||{}).name||''):'';
      L.push('| '+e.time+' | '+e.type+' | '+e.status+' | '+nn.replace(/\|/g,'\|')+' | '+regTestoPulito(e.msg).replace(/\|/g,'\|')+' |');
    });
    L.push('','---','','_Esportato da RelAItion._');
    foDownload('registro-'+nome+'_'+marca+'.md','text/markdown;charset=utf-8',L.join('\n'));
  }
  showToast('\ud83d\udce5 Registro esportato in '+formato);
  addAct('Esportato registro di esecuzione ('+formato+')');
}

// Menu dei formati: tre destinazioni d'uso diverse, e sceglierle a priori
// eviterebbe di indovinare quale serve.
function menuEsportaRegistro(e){
  if(e)e.stopPropagation();
  if(!regEsportabile()){showToast('\u26a0\ufe0f Esegui il flusso: non c\u2019e\u0300 ancora un registro da esportare');return}
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center">'+
      '<h2>\ud83d\udce5 Esporta il registro</h2><button class="modal-close" onclick="closeModal()">\u2715</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 16px;line-height:1.6">'+
      'L\u2019esecuzione appena conclusa di <strong>'+escHtml(currentAgentName||'flusso')+'</strong>: '+
      execEntries.length+' passi. Non l\u2019intero storico: per quello c\u2019\u00e8 l\u2019esportazione dal Log Esecuzioni.</p>'+
    '<div style="display:grid;gap:8px">'+
      ['<button class="tb-btn" style="justify-content:flex-start;height:auto;padding:10px 12px" onclick="closeModal();esportaRegistro(\'Markdown\')">'+
        '<span style="font-size:16px;margin-right:9px">\ud83d\udcdd</span><span style="text-align:left">'+
        '<span style="display:block;font-weight:700;font-size:12px">Markdown</span>'+
        '<span style="display:block;font-size:10.5px;color:var(--tx4);margin-top:2px">Tabella leggibile, da allegare a un ticket o a una relazione</span></span></button>',
       '<button class="tb-btn" style="justify-content:flex-start;height:auto;padding:10px 12px" onclick="closeModal();esportaRegistro(\'CSV\')">'+
        '<span style="font-size:16px;margin-right:9px">\ud83d\udcca</span><span style="text-align:left">'+
        '<span style="display:block;font-weight:700;font-size:12px">CSV</span>'+
        '<span style="display:block;font-size:10.5px;color:var(--tx4);margin-top:2px">Un passo per riga, separatore \u00ab;\u00bb per Excel in italiano</span></span></button>',
       '<button class="tb-btn" style="justify-content:flex-start;height:auto;padding:10px 12px" onclick="closeModal();esportaRegistro(\'JSON\')">'+
        '<span style="font-size:16px;margin-right:9px">\ud83e\uddea</span><span style="text-align:left">'+
        '<span style="display:block;font-weight:700;font-size:12px">JSON con traccia</span>'+
        '<span style="display:block;font-size:10.5px;color:var(--tx4);margin-top:2px">Include gli input di ogni chiamata: \u00e8 ci\u00f2 che rende riproducibile l\u2019esecuzione</span></span></button>'
      ].join('')+
    '</div>'
  );
}

// Il pulsante si accende solo quando c'e' qualcosa da esportare: offrirlo su un
// registro vuoto prometterebbe un file inesistente.
function aggiornaBottoneEsportaRegistro(){
  var b=document.getElementById('execLogExport');
  if(!b)return;
  var ok=regEsportabile();
  b.style.opacity=ok?'':'0.35';
  b.style.pointerEvents=ok?'':'none';
  b.title=ok?'Esporta il registro di questa esecuzione':'Esegui il flusso per avere un registro da esportare';
}

// Scrittura dell'etichetta di un arco. Non si ridisegna il pannello a ogni
// tasto — si perderebbe il fuoco dopo la prima lettera — ma solo la tela.
function aggiornaEtichettaArco(idx,val){
  var e=B.edges[idx];
  if(!e)return;
  // Fino a tre righe e 72 caratteri: abbastanza per un promemoria, non per
  // un paragrafo che coprirebbe la tela.
  e.label=String(val||'').split('\n').slice(0,3).join('\n').substring(0,72);
  b_render();
}

// Un'area di testo che cresce con quello che contiene, fino a un tetto oltre il
// quale scorre. Serve alla chat del Builder e alle etichette degli archi: una
// riga sola quando c'è una riga, di più quando serve, senza maniglie da tirare.
function adattaAltezza(el){
  if(!el)return;
  el.style.height='auto';
  var max=parseInt(getComputedStyle(el).maxHeight,10)||132;
  el.style.height=Math.min(el.scrollHeight,max)+'px';
}
