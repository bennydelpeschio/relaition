// ══════════════════════════════════════════
// AUTOSAVE — prima un workflow esisteva solo sul canvas finché non si
// premeva esplicitamente "Salva" (con prompt del nome): chiudendo la
// scheda o navigando altrove senza salvare, il lavoro andava perso (l'unico
// backup era una copia in localStorage scritta solo DOPO un Esegui). Ora
// ogni modifica al canvas viene salvata nel database in automatico, con
// debounce per non scrivere ad ogni singolo frame durante un drag.
// ══════════════════════════════════════════

var _autosaveTimer=null;
function scheduleAutosave(){
  clearTimeout(_autosaveTimer);
  _autosaveTimer=setTimeout(autosaveAgentToDB,1200);
}

// Il nome identifica l'agente in "I miei agenti" e loadSavedAgent lo cerca per
// nome: due righe omonime rendono la seconda irraggiungibile e fanno sembrare
// che un agente sia sparito. I nomi restano quindi univoci.
function agentNameTaken(name,exceptId){
  var r=dbGetOne('SELECT id FROM agents WHERE name=? AND author=? AND id<>?',[name,utenteCorrente(),exceptId||-1]);
  return r?r.id:null;
}

function uniqueAgentName(base,exceptId){
  var nome=base,i=2;
  while(agentNameTaken(nome,exceptId)){nome=base+' ('+i+')';i++}
  return nome;
}

function autosaveAgentToDB(){
  // Il flusso di esempio caricato all apertura del Builder non e lavoro
  // dell utente: salvarlo creerebbe un agente che nessuno ha chiesto.
  if(B.effimero)return;
  // La sandbox dichiara di non toccare dati reali, ma azzerare `dbAgentId` non
  // bastava: senza riga a cui puntare l'autosalvataggio ne CREA una nuova, e
  // uscendo dalla sandbox comparivano in "I miei agenti" un "Prova in sandbox"
  // e una copia del flusso di esempio. Finche' la sandbox e' attiva non si
  // scrive, qualunque cosa accada sul canvas.
  if(typeof SANDBOX!=='undefined'&&SANDBOX&&SANDBOX.attiva)return;
  if(!DB||!B.nodes.length)return;
  var now=new Date().toISOString();
  var name=currentAgentName||'Workflow senza nome';
  // In creazione il nome predefinito è sempre lo stesso: senza distinzione si
  // accumulavano righe "Nuovo agente" indistinguibili fra loro.
  if(!B.dbAgentId)name=uniqueAgentName(name);
  else if(agentNameTaken(name,B.dbAgentId))name=uniqueAgentName(name,B.dbAgentId);
  currentAgentName=name;
  if(B.dbAgentId){
    dbRun('UPDATE agents SET name=?,nodes_json=?,edges_json=?,next_id=?,context=?,updated_at=? WHERE id=?',
      [name,JSON.stringify(B.nodes),JSON.stringify(B.edges),B.nextId,B.context||'',now,B.dbAgentId]);
  }else{
    dbRun('INSERT INTO agents (name,nodes_json,edges_json,next_id,context,created_at,updated_at,author) VALUES (?,?,?,?,?,?,?,?)',
      [name,JSON.stringify(B.nodes),JSON.stringify(B.edges),B.nextId,B.context||'',now,now,profileData.name]);
    B.dbAgentId=dbGetOne('SELECT last_insert_rowid() as id').id;
  }
}

function saveAgent(){
  var _errs=validateWorkflow();
  if(_errs.length){showValidationErrors(_errs);return}
  clearInvalidNodes();
  var name=prompt('Nome agente:',currentAgentName&&currentAgentName!=='Workflow Builder'?currentAgentName:'Mio agente');if(!name)return;
  name=name.trim();
  if(!name){showToast('⚠️ Il nome non può essere vuoto');return}

  // Il nome è già di un ALTRO agente: sovrascriverlo ne cancellerebbe uno
  // senza dirlo, tenerli entrambi renderebbe il secondo irraggiungibile.
  // Si chiede, e se non si sovrascrive si propone un nome libero.
  var altro=agentNameTaken(name,B.dbAgentId);
  if(altro){
    if(confirm('Esiste già un agente chiamato "'+name+'".\n\nOK = sostituisci quell\'agente con questo (il precedente va perso)\nAnnulla = salva con un nome libero')){
      dbRun('DELETE FROM agents WHERE id=?',[altro]);
    }else{
      name=uniqueAgentName(name,B.dbAgentId);
      showToast('ℹ️ Salvato come "'+name+'" per non sovrascrivere l\'altro');
    }
  }
  var now=new Date().toISOString();
  // Se il canvas è già collegato a una riga (autosave l'ha creata, oppure
  // era già stato caricato/salvato prima), rinomina/aggiorna QUELLA riga
  // invece di rischiare di crearne — o agganciarsi a — una diversa.
  var existing=B.dbAgentId?dbGetOne('SELECT id FROM agents WHERE id=?',[B.dbAgentId]):dbGetOne('SELECT id FROM agents WHERE name=?',[name]);
  if(existing){
    dbRun('UPDATE agents SET name=?,nodes_json=?,edges_json=?,next_id=?,context=?,updated_at=? WHERE id=?',
      [name,JSON.stringify(B.nodes),JSON.stringify(B.edges),B.nextId,B.context||'',now,existing.id]);
    B.dbAgentId=existing.id;
  }else{
    dbRun('INSERT INTO agents (name,nodes_json,edges_json,next_id,context,created_at,updated_at,author) VALUES (?,?,?,?,?,?,?,?)',
      [name,JSON.stringify(B.nodes),JSON.stringify(B.edges),B.nextId,B.context||'',now,now,profileData.name]);
    B.dbAgentId=dbGetOne('SELECT last_insert_rowid() as id').id;
    // Il capitolo 4.4 elenca «la creazione di un agente nell'Agent Builder»
    // fra le attività che generano esperienza, ed era l'unica delle due
    // nominate a non generarne. Solo alla PRIMA creazione: risalvare lo stesso
    // agente aggiorna la riga esistente e non passa di qui, altrimenti
    // basterebbe premere «Salva» a ripetizione.
    if(typeof addXP==='function')addXP(60,'Creato un agente: '+name);
  }
  currentAgentName=name;
  showToast('💾 Agente "'+name+'" salvato nel database!');
  addAct('Salvato agente: '+name);
}

// Ogni agente salvato ha ora la propria riga con nodi/archi completi (era
// il bug principale del vecchio sistema: tutti gli agenti condividevano
// un'unica chiave localStorage, quindi salvarne uno sovrascriveva
// silenziosamente il contenuto degli altri).
function loadSavedAgent(name){
  var row=dbGetOne('SELECT * FROM agents WHERE name=? AND author=?',[name,utenteCorrente()]);
  if(!row){showToast('⚠️ Agente non trovato nel database');return}
  try{
    B.nodes=JSON.parse(row.nodes_json);B.edges=JSON.parse(row.edges_json);B.nextId=row.next_id||1;
    B.selId=-1;B.selIds=[];B.selEdgeIdx=-1;currentAgentName=name;B.dbAgentId=row.id;B.context=row.context||'';
    go('builder');b_render();
    // Aprire un agente e trovarlo fuori schermo — perché la vista conservava
    // pan e zoom del flusso precedente — sembrava un flusso vuoto. La vista si
    // riporta sul flusso appena caricato, adattando lo zoom se non ci sta.
    if(typeof bResetView==='function')bResetView();
    // Il registro appartiene all'esecuzione, non all'agente: lasciare quello
    // del flusso precedente faceva leggere come propri dei passi altrui.
    if(typeof svuotaRegistroEsecuzione==='function')svuotaRegistroEsecuzione();
    showToast('📂 Caricato dal database: '+name);
  }catch(e){showToast('⚠️ Errore caricamento agente')}
}

function exportAgent(){
  var _errs=validateWorkflow();
  if(_errs.length){showValidationErrors(_errs);return}
  clearInvalidNodes();
  var data=JSON.stringify({name:currentAgentName,exported:new Date().toISOString(),nodes:B.nodes,edges:B.edges,nextId:B.nextId,context:B.context||''},null,2);
  var blob=new Blob([data],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;
  a.download='relaition_'+(currentAgentName||'agent').toLowerCase().replace(/[^a-z0-9]+/g,'_')+'.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url)},1000);
  showToast('📄 Agente esportato come JSON');
}
// ── AI INTEGRATION ──

function deleteMyAgent(name){
  if(!confirm('Eliminare "'+name+'"?'))return;
  var row=dbGetOne('SELECT id FROM agents WHERE name=? AND author=?',[name,utenteCorrente()]);
  dbRun('DELETE FROM agents WHERE name=? AND author=?',[name,utenteCorrente()]);
  if(row&&B.dbAgentId===row.id)B.dbAgentId=null; // evita che il prossimo autosave la ricrei
  renderMyAgents();showToast('🗑️ Agente eliminato');
}

function uninstallAgent(catalogId){
  dbRun('DELETE FROM my_agents WHERE catalog_id=? AND user=?',[catalogId,utenteCorrente()]);
  renderMyAgents();showToast('🗑️ Agente disinstallato');
}

function importAgentJSON(){
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>📥 Importa agente</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:12px 0">Carica un file JSON esportato dal builder per importare un workflow completo.</p>'+
    '<div class="import-drop" onclick="document.getElementById(\'importFileInput\').click()" id="importDrop">'+
      '<div style="font-size:32px;margin-bottom:8px">📁</div>'+
      '<div style="font-size:13px;font-weight:600">Clicca o trascina un file JSON</div>'+
      '<div style="font-size:11px;color:var(--tx4);margin-top:4px">Formato: export dal builder RelAItion</div>'+
    '</div>'+
    '<input type="file" id="importFileInput" accept=".json" style="display:none" onchange="handleImportFile(this)">'+
    '<div style="margin-top:16px"><div style="font-size:11px;font-weight:600;color:var(--tx3);margin-bottom:6px">Oppure incolla il JSON:</div>'+
    '<textarea class="prop-input" id="importJsonText" rows="6" placeholder=\'{"nodes":[...],"edges":[...]}\'></textarea>'+
    '<button class="tb-btn primary mt-12" onclick="importFromText()">Importa</button></div>'
  );
  // Setup drag & drop
  var drop=document.getElementById('importDrop');
  if(drop){
    drop.addEventListener('dragover',function(e){e.preventDefault();drop.classList.add('dragover')});
    drop.addEventListener('dragleave',function(){drop.classList.remove('dragover')});
    drop.addEventListener('drop',function(e){e.preventDefault();drop.classList.remove('dragover');if(e.dataTransfer.files.length)handleImportFileObj(e.dataTransfer.files[0])});
  }
}

function handleImportFile(input){if(input.files.length)handleImportFileObj(input.files[0])}

// Applicazione dell'import, condivisa fra file e testo incollato. Prima erano
// due percorsi separati e divergenti: quello da testo ignorava il nome, non
// ridisegnava il canvas e nessuno dei due salvava. Il flusso importato viveva
// quindi solo sul canvas, e bastava aprirne un altro per perderlo.
function applicaImport(data){
  if(!data||!data.nodes||!data.nodes.length){showToast('\u26a0\ufe0f Formato JSON non valido: manca l\u2019elenco dei nodi');return false}
  B.nodes=data.nodes;
  B.edges=data.edges||[];
  B.nextId=data.nextId||(B.nodes.reduce(function(m,n){return Math.max(m,n.id||0)},0)+1);
  B.selId=-1;B.selIds=[];B.selEdgeIdx=-1;
  B.dbAgentId=null;
  B.context=data.context||'';

  // Il nome dichiarato nel file diventa quello del flusso: cosi' compare nel
  // titolo del Builder e si ritrova gia' compilato quando si preme Salva.
  // NON si salva d'ufficio: importare e' un'anteprima, e scrivere una riga nel
  // database senza che nessuno l'abbia chiesto riempirebbe "I miei agenti" di
  // prove scartate.
  currentAgentName=String(data.name||'').trim()||'Agente importato';

  // I campi obbligatori acquisiti dai connettori dopo l'esportazione
  // resterebbero vuoti e bloccherebbero l'esecuzione di un flusso che era
  // valido quando e' stato esportato.
  if(typeof fillRequiredDefaults==='function')fillRequiredDefaults(B.nodes);

  closeModal();
  go('builder');
  if(typeof svuotaRegistroEsecuzione==='function')svuotaRegistroEsecuzione();
  b_render();
  if(typeof bResetView==='function')bResetView();
  if(typeof aggiornaTitoloBuilder==='function')aggiornaTitoloBuilder();

  showToast('\u2705 "'+currentAgentName+'" importato: '+B.nodes.length+' nodi. Premi \ud83d\udcbe Salva per conservarlo');
  addAct('Importato workflow: '+currentAgentName);
  return true;
}

function handleImportFileObj(file){
  var reader=new FileReader();
  reader.onload=function(e){
    try{ applicaImport(JSON.parse(e.target.result)) }
    catch(ex){ showToast('\u274c JSON non leggibile: '+ex.message) }
  };
  reader.readAsText(file);
}

function importFromText(){
  var el=document.getElementById('importJsonText');
  var text=el?el.value.trim():'';
  if(!text){showToast('\u26a0\ufe0f Incolla il JSON');return}
  try{ applicaImport(JSON.parse(text)) }
  catch(ex){ showToast('\u274c JSON non leggibile: '+ex.message) }
}



// ══════════════════════════════════════════
// AI CHAT BUILDER — genera workflow da linguaggio naturale
// ══════════════════════════════════════════

// `trace` contiene gli input esatti di ogni chiamata verso modello e
// connettori: è ciò che rende possibile la riesecuzione deterministica.
// Restituisce l'id della riga, che serve ad agganciarvi gli eventi.
function recordExecution(agentName,nodeCount,status,durationMs,mode,summary,steps,trace,utente){
  // Un'esecuzione pianificata appartiene al PROPRIETARIO dell'agente, non a chi
  // è connesso in quel momento: altrimenti comparirebbe nel registro di
  // chiunque avesse la scheda aperta quando lo scheduler è scattato.
  var attribuita=utente||profileData.name;
  dbRun('INSERT INTO exec_log (agent,nodes,status,duration,mode,summary,user,ts,steps_json,trace_json,replay_seed) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [agentName||'Workflow senza nome',nodeCount,status,durationMs,mode,(summary||'').substring(0,2000),attribuita,new Date().toISOString(),
     steps?JSON.stringify(steps):null,
     trace?JSON.stringify(trace):null,
     trace&&trace.seed?String(trace.seed):null]);
  var row=dbGetOne('SELECT last_insert_rowid() as id');
  // Lo storico è limitato: si eliminano anche gli eventi orfani, che
  // altrimenti resterebbero a gonfiare il database senza più una riga a cui
  // riferirsi.
  dbRun('DELETE FROM exec_log WHERE id NOT IN (SELECT id FROM exec_log ORDER BY id DESC LIMIT 200)');
  dbRun('DELETE FROM execution_events WHERE execution_id NOT IN (SELECT id FROM exec_log)');
  return row?row.id:null;
}


function clearExecLog(){
  if(!confirm('Eliminare tutto lo storico esecuzioni?'))return;
  dbRun('DELETE FROM exec_log');
  renderExecLogPage();showToast('🗑️ Log svuotato');
}

function exportExecLog(){
  var log=dbAll('SELECT * FROM exec_log ORDER BY id DESC');
  var csv='timestamp,agente,nodi,stato,durata_ms,modalita,utente\n'+log.map(function(l){
    return l.ts+',"'+(l.agent||'').replace(/"/g,'""')+'",'+l.nodes+','+l.status+','+(l.duration||0)+','+l.mode+',"'+(l.user||'')+'"';
  }).join('\n');
  var blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;
  a.download='relaition_execlog_'+new Date().toISOString().substring(0,10)+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url)},1000);
  showToast('📥 Log esportato in CSV ('+log.length+' righe)');
}

// ══════════════════════════════════════════
// GAMIFICATION — XP reale, persistente (tabella xp_log nel database), che
// alimenta i badge/livelli mostrati in Dashboard, Learning Hub, Community
// e Profilo. Prima questi numeri erano solo un toast cosmetico ("+50 XP")
// che non veniva mai sommato da nessuna parte: ora accumula davvero.
// ══════════════════════════════════════════

function getXP(){var r=dbGetOne('SELECT COALESCE(SUM(amount),0) as total FROM xp_log WHERE user=?',[utenteCorrente()]);return r?r.total:0}
function xpLevel(xp){return Math.max(1,Math.floor(xp/250)+1)}

function addXP(n,reason){
  dbRun('INSERT INTO xp_log (amount,reason,ts,user) VALUES (?,?,?,?)',[n,reason||'',new Date().toISOString(),utenteCorrente()]);
  updateXPDisplays();
  if(reason)addAct(reason+' (+'+n+' XP)');
  return getXP();
}

function updateXPDisplays(){
  var xp=getXP(),lvl=xpLevel(xp);
  var d1=document.getElementById('dashXPVal');if(d1)d1.textContent=xp.toLocaleString('it-IT');
  var d2=document.getElementById('dashXPLevel');if(d2)d2.textContent='Livello '+lvl;
  var d3=document.getElementById('profileLevelVal');if(d3)d3.textContent='Lv.'+lvl;
  var d4=document.getElementById('profileXPVal');if(d4)d4.textContent=xp.toLocaleString('it-IT');
}

// Numeri reali (non più hardcoded) per le card della Dashboard e del Profilo:
// agenti = creati dall'utente + installati da lui, esecuzioni = le sue righe
// nel log, corsi = percorsi Learning Hub completati al 100%.
//
// Il filtro sull'utente mancava su due delle quattro schede, e le due pagine
// che le ospitano dicono entrambe «la TUA attività»: l'intestazione del Profilo
// annunciava 10 agenti e 50 esecuzioni mentre il corpo della stessa pagina,
// poche righe sotto, contava correttamente 2 creati, 5 installati e 19
// esecuzioni. Stessa pagina, due risposte diverse alla stessa domanda: chi
// legge non sa quale credere, ed e' il tipo di incoerenza che si nota subito
// perche' i due numeri sono visibili insieme.
function updateStatCards(){
  var io=utenteCorrente();
  var savedAgents=dbGetOne('SELECT COUNT(*) c FROM agents WHERE author=?',[io]).c;
  var myAgents=dbGetOne('SELECT COUNT(*) c FROM my_agents WHERE user=?',[io]).c;
  var runs=dbGetOne('SELECT COUNT(*) c FROM exec_log WHERE user=?',[io]).c;
  var coursesTotal=(typeof PATHS!=='undefined'?PATHS.length:5);
  var coursesDone=(typeof PATHS!=='undefined')?PATHS.filter(function(p){return p.lessons.every(function(l){return l.done})}).length:0;
  var agentsTotal=savedAgents+myAgents;
  var set=function(id,val){var el=document.getElementById(id);if(el)el.textContent=val};
  set('dashAgentsVal',agentsTotal);
  // Il sottotitolo diceva «N totali», che ripeteva il numero grande senza
  // aggiungere niente. Dice invece com'e' composto, che e' l'unica cosa che
  // quel numero da solo non spiega.
  set('dashAgentsSub',agentsTotal?(savedAgents+' creat'+(savedAgents===1?'o':'i')+' · '+myAgents+' installat'+(myAgents===1?'o':'i')):'Nessuno ancora');
  set('dashRunsVal',runs);set('dashRunsSub',runs?runs+' registrate nel log':'Nessuna esecuzione ancora');
  set('dashCoursesVal',coursesDone);set('dashCoursesSub',coursesTotal?Math.round(coursesDone/coursesTotal*100)+'% completamento':'');
  set('profileAgentsVal',agentsTotal);set('profileRunsVal',runs);
  updateXPDisplays();
}

// ══════════════════════════════════════════
// KNOWLEDGE BASE DOCUMENTI — libreria di documenti aziendali (liste
// clienti, policy, contratti in formato testo, export da altri sistemi...)
// caricati UNA VOLTA e riutilizzabili in qualunque trigger di qualunque
// workflow, invece di ricaricare un file ogni volta. Righe nella tabella
// kb_docs del database.
// ══════════════════════════════════════════

var KB_DOC_ACCEPT='.pdf,.docx,.xlsx,.pptx,.txt,.csv,.tsv,.json,.md,.log,.xml,.html,.yml,.yaml';

function listKBDocs(){
  return dbAll('SELECT * FROM kb_docs ORDER BY uploaded_at DESC').map(function(d){
    return {id:d.id,name:d.name,size:d.size,content:d.content,uploaded:new Date(d.uploaded_at).getTime()};
  });
}

function addKBDocsFromFiles(fileList){
  if(!fileList||!fileList.length)return;
  // I metadati scelti nel pannello valgono per l'intero lotto caricato: nella
  // pratica si caricano insieme documenti della stessa unità e riservatezza.
  var bu=(document.getElementById('kbUploadBU')||{}).value||'Tutte';
  var conf=(document.getElementById('kbUploadConf')||{}).value||'interno';
  var porzioni=0, riusciti=0, falliti=[];

  showToast('📖 Lettura di '+fileList.length+' documento/i…');

  // Estrazione reale del testo, la stessa usata dal trigger File upload: prima
  // PDF e DOCX venivano rifiutati a priori, e la Knowledge Base accettava solo
  // testo semplice — cioè quasi nessun documento aziendale vero.
  // I file si elaborano in sequenza: l'inflate è sincrono sul thread principale
  // e lanciarne venti insieme bloccherebbe l'interfaccia.
  Array.prototype.reduce.call(fileList,function(catena,file){
    return catena.then(function(){
      return frExtract(file).then(function(r){
        var id='doc_'+Date.now()+'_'+Math.floor(Math.random()*9999);
        dbRun('INSERT INTO kb_docs (id,name,size,content,uploaded_at,business_unit,confidentiality) VALUES (?,?,?,?,?,?,?)',
          [id,file.name,file.size,r.testo,new Date().toISOString(),bu,conf]);
        // Un documento caricato ma non indicizzato non è raggiungibile dal
        // recupero: la segmentazione avviene subito, non alla prima ricerca.
        if(typeof kbIndexDocument==='function')porzioni+=kbIndexDocument(id).chunks;
        riusciti++;
      },function(err){
        falliti.push({nome:file.name,motivo:err.message||String(err)});
      });
    });
  },Promise.resolve()).then(function(){
    if(riusciti){
      showToast('📚 '+riusciti+' documento/i indicizzato/i: '+porzioni+' porzioni');
      addAct('Caricati documenti nella Knowledge Base');
      if(typeof fireEvent==='function')fireEvent('kbdoc_uploaded');
    }
    if(document.getElementById('kbDocsList'))renderKBDocsList();
    // I motivi del rifiuto vanno letti con calma, non inseguiti in un toast:
    // servono a capire se il file va convertito o se è una scansione.
    if(falliti.length)mostraErroriKBUpload(falliti);
  });
}

function mostraErroriKBUpload(falliti){
  var html='<div style="max-height:300px;overflow:auto">'+falliti.map(function(f){
    return '<div style="padding:10px 12px;background:var(--bg2);border-radius:8px;margin-bottom:8px">'+
      '<div style="font-weight:700;font-size:12.5px;margin-bottom:3px">📄 '+escHtml(f.nome)+'</div>'+
      '<div style="font-size:11.5px;color:var(--tx3);line-height:1.5">'+escHtml(f.motivo)+'</div></div>';
  }).join('')+'</div>';
  if(typeof openModal==='function'){
    openModal(
      '<div style="display:flex;justify-content:space-between;align-items:center">'+
        '<h2>⚠️ '+falliti.length+' documento/i non caricato/i</h2>'+
        '<button class="modal-close" onclick="closeModal()">✕</button></div>'+
      '<p style="font-size:12px;color:var(--tx3);margin:12px 0">Gli altri documenti del lotto sono stati indicizzati regolarmente.</p>'+
      html+
      '<button class="tb-btn primary mt-12" onclick="closeModal()">Ho capito</button>'
    );
  }else{
    showToast('⚠️ '+falliti.length+' documento/i non caricato/i: '+falliti[0].motivo);
  }
}

function deleteKBDoc(id){
  dbRun('DELETE FROM kb_docs WHERE id=?',[id]);
  renderKBDocsList();
  showToast('🗑️ Documento rimosso dalla Knowledge Base');
}

// Esplorazione di un documento: non basta vedere il testo grezzo: ciò che
// l'agente riceverà davvero sono le PORZIONI, con la loro etichetta. Vederle
// è l'unico modo per capire se la segmentazione ha funzionato su quel
// documento — un contratto tagliato male produce recuperi inutili.
function previewKBDoc(id,tab){
  var d=dbGetOne('SELECT * FROM kb_docs WHERE id=?',[id]);if(!d)return;
  tab=tab||'porzioni';
  var chunks=dbAll('SELECT * FROM kb_chunks WHERE doc_id=? ORDER BY ordinal',[id]);
  var tipo=(typeof KB_TYPE_LABEL!=='undefined'&&KB_TYPE_LABEL[d.source_type])||'—';
  var unita=(typeof KB_TYPE_UNIT!=='undefined'&&KB_TYPE_UNIT[d.source_type])||'';
  var corpo;
  if(tab==='porzioni'){
    corpo=chunks.length?chunks.map(function(c){
      var m={};try{m=JSON.parse(c.metadata_json||'{}')}catch(e){}
      return '<div style="background:var(--bg2);border:1px solid var(--bo);border-radius:8px;padding:9px 11px;margin-bottom:6px">'+
        '<div style="font-size:11px;font-weight:700">'+(c.ordinal+1)+'. '+escHtml(m.label||'Sezione')+'</div>'+
        '<div style="font-size:10px;color:var(--tx4);margin:3px 0 5px;font-style:italic">'+escHtml(c.context_prefix||'')+'</div>'+
        '<div style="font-size:11px;color:var(--tx2);line-height:1.5;white-space:pre-wrap">'+escHtml(c.text.substring(0,500))+(c.text.length>500?'…':'')+'</div>'+
      '</div>';
    }).join(''):'<div style="font-size:11px;color:#EF4444;padding:10px 0">Documento non ancora indicizzato: <span style="text-decoration:underline;cursor:pointer" onclick="kbIndexDocument(\''+id+'\');previewKBDoc(\''+id+'\')">indicizzalo ora</span></div>';
  }else{
    corpo='<pre style="white-space:pre-wrap;font-size:11px;background:var(--bg2);border-radius:8px;padding:12px;max-height:400px;overflow:auto">'+escHtml(d.content.substring(0,6000))+(d.content.length>6000?'\n\n… ('+(d.content.length-6000)+' caratteri troncati)':'')+'</pre>';
  }
  var tabBtn=function(k,l){return '<span onclick="previewKBDoc(\''+id+'\',\''+k+'\')" style="font-size:11px;font-weight:600;padding:5px 11px;border-radius:20px;cursor:pointer;'+(tab===k?'background:var(--ac2-l);color:var(--ac2)':'color:var(--tx4)')+'">'+l+'</span>'};
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>📄 '+escHtml(d.name)+'</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<div style="font-size:10.5px;color:var(--tx4);margin:6px 0 10px">'+tipo+(unita?': segmentato per '+unita:'')+' · '+escHtml(d.business_unit||'Tutte')+' · '+escHtml(d.confidentiality||'interno')+' · '+chunks.length+' porzioni</div>'+
    '<div style="display:flex;gap:4px;margin-bottom:10px">'+tabBtn('porzioni','🧩 Porzioni ('+chunks.length+')')+tabBtn('testo','📄 Testo originale')+'</div>'+
    corpo
  ,true);
}

// Alimentazione diretta: incollare un testo è spesso più rapido che creare un
// file per poi caricarlo, e permette di aggiungere conoscenza scritta al
// momento (una procedura dettata a voce, una risposta concordata).
function openKBPasteModal(){
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>✍️ Aggiungi testo alla Knowledge Base</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 12px">Il testo viene segmentato e indicizzato come un documento caricato. La tipologia è riconosciuta dal contenuto.</p>'+
    '<div class="prop-group"><div class="prop-label">Titolo *</div><input class="prop-input" id="kbPasteName" placeholder="es. Procedura resi 2026"></div>'+
    '<div style="display:flex;gap:8px;margin-bottom:10px">'+
      '<div style="flex:1"><div class="prop-label">Business unit</div><select class="prop-select" id="kbPasteBU">'+KB_BUSINESS_UNITS.map(function(b){return '<option>'+b+'</option>'}).join('')+'</select></div>'+
      '<div style="flex:1"><div class="prop-label">Riservatezza</div><select class="prop-select" id="kbPasteConf">'+KB_CONFIDENTIALITY.map(function(c){return '<option'+(c==='interno'?' selected':'')+'>'+c+'</option>'}).join('')+'</select></div>'+
    '</div>'+
    '<div class="prop-group"><div class="prop-label">Contenuto *</div><textarea class="prop-input" id="kbPasteText" rows="10" placeholder="Incolla qui il testo..."></textarea></div>'+
    '<button class="tb-btn primary" onclick="saveKBPaste()">📚 Aggiungi e indicizza</button>'
  ,true);
}

function saveKBPaste(){
  var nome=document.getElementById('kbPasteName').value.trim();
  var testo=document.getElementById('kbPasteText').value;
  if(!nome||!testo.trim()){showToast('⚠️ Titolo e contenuto sono obbligatori');return}
  var id='doc_'+Date.now()+'_'+Math.floor(Math.random()*9999);
  dbRun('INSERT INTO kb_docs (id,name,size,content,uploaded_at,business_unit,confidentiality) VALUES (?,?,?,?,?,?,?)',
    [id,/\.\w+$/.test(nome)?nome:nome+'.txt',testo.length,testo,new Date().toISOString(),
     document.getElementById('kbPasteBU').value,document.getElementById('kbPasteConf').value]);
  var r=kbIndexDocument(id);
  showToast('📚 "'+nome+'" aggiunto: '+r.chunks+' porzioni ('+((typeof KB_TYPE_LABEL!=='undefined'&&KB_TYPE_LABEL[r.tipo])||r.tipo)+')');
  addAct('Aggiunto testo alla Knowledge Base: '+nome);
  openKBDocsModal();
}

function renderKBDocsList(){
  var el=document.getElementById('kbDocsList');if(!el)return;
  var docs=dbAll('SELECT * FROM kb_docs ORDER BY uploaded_at DESC');
  if(!docs.length){el.innerHTML='<div style="font-size:11px;color:var(--tx4);padding:8px 0">Nessun documento caricato ancora.</div>';return}
  var st=typeof kbStats==='function'?kbStats():{documenti:docs.length,indicizzati:0,porzioni:0};
  el.innerHTML='<div style="font-size:11px;color:var(--tx3);margin-bottom:8px">'+
      st.documenti+' documenti · '+st.indicizzati+' indicizzati · <strong>'+st.porzioni+' porzioni</strong> ricercabili'+
      (st.indicizzati<st.documenti?' · <span style="color:var(--ac2);cursor:pointer;text-decoration:underline" onclick="kbReindexAllUI()">indicizza i mancanti</span>':'')+
    '</div>'+
    docs.map(function(d){
    var tipo=(typeof KB_TYPE_LABEL!=='undefined'&&KB_TYPE_LABEL[d.source_type])||'—';
    return '<div class="validation-item" style="background:var(--bg2);border-color:var(--bo);cursor:default;align-items:center">'+
      '<span class="vi-ic">📄</span>'+
      '<div class="vi-msg" style="cursor:pointer;flex:1" onclick="previewKBDoc(\''+d.id+'\')">'+
        '<div>'+escHtml(d.name)+'</div>'+
        '<div style="font-size:10px;color:var(--tx4);margin-top:2px">'+
          tipo+' · '+escHtml(d.business_unit||'Tutte')+' · '+escHtml(d.confidentiality||'interno')+' · '+
          Math.round(d.size/1024*10)/10+' KB · '+
          (d.chunk_count?d.chunk_count+' porzioni':'<span style="color:#EF4444">non indicizzato</span>')+' · '+
          new Date(d.uploaded_at).toLocaleDateString('it-IT')+
        '</div>'+
      '</div>'+
      '<span style="cursor:pointer;color:#EF4444;font-size:12px;padding:0 4px" onclick="deleteKBDoc(\''+d.id+'\')" title="Elimina">✕</span>'+
    '</div>';
  }).join('');
}

function kbReindexAllUI(){
  var r=kbReindexAll();
  showToast('🔁 Reindicizzati '+r.documenti+' documenti: '+r.porzioni+' porzioni');
  renderKBDocsList();
}

// Ricerca manuale di prova (C2): mostra le porzioni recuperate col loro
// punteggio. Serve a rendere ispezionabile il recupero prima di affidargli
// un flusso — senza, il RAG resta una scatola chiusa.
function runKBTestSearch(){
  var q=(document.getElementById('kbTestQuery')||{}).value||'';
  var bu=(document.getElementById('kbTestBU')||{}).value||'Tutte';
  var box=document.getElementById('kbTestResults');
  if(!box)return;
  if(!q.trim()){box.innerHTML='<div style="font-size:11px;color:var(--tx4)">Scrivi una domanda per provare il recupero.</div>';return}
  var res=kbSearch(q,{businessUnit:bu,limit:5});
  if(!res.results.length){
    box.innerHTML='<div style="font-size:11px;color:var(--tx4)">Nessuna porzione recuperata ('+escHtml(res.motore)+')'+
      (res.scartatiPermessi?' · '+res.scartatiPermessi+' scartate dal filtro permessi':'')+'.</div>';
    return;
  }
  box.innerHTML='<div style="font-size:10px;color:var(--tx4);margin-bottom:6px">'+
      res.results.length+' porzioni su '+res.candidati+' candidate · motore: '+escHtml(res.motore)+
      (res.scartatiPermessi?' · <strong>'+res.scartatiPermessi+' escluse dai permessi</strong>':'')+'</div>'+
    res.results.map(function(r){
      return '<div style="background:var(--bg2);border:1px solid var(--bo);border-radius:8px;padding:9px 11px;margin-bottom:6px">'+
        '<div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">'+
          '<div style="font-size:11px;font-weight:700">'+escHtml(r.docName)+': '+escHtml(r.label)+'</div>'+
          '<div style="font-size:10px;color:var(--ac2);font-weight:700;white-space:nowrap">'+r.score+'</div>'+
        '</div>'+
        '<div style="font-size:10px;color:var(--tx4);margin:2px 0 5px">BM25 '+r.bm25+' · coseno '+r.cosine+' · '+escHtml(r.businessUnit)+' · '+escHtml(r.confidentiality)+'</div>'+
        '<div style="font-size:11px;color:var(--tx2);line-height:1.45">'+escHtml(r.text.substring(0,260))+(r.text.length>260?'…':'')+'</div>'+
      '</div>';
    }).join('');
}

function openKBDocsModal(){
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>📚 Knowledge Base: Documenti aziendali</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 14px">Carica normative, contratti, procedure, FAQ, listini o liste clienti: ogni documento viene segmentato secondo la propria struttura e indicizzato per il recupero. Formati: txt, csv, json, md, xml, html, PDF e DOCX vanno convertiti in testo.</p>'+
    '<div style="display:flex;gap:8px;margin-bottom:10px">'+
      '<div style="flex:1"><div class="prop-label">Business unit</div>'+
        '<select class="prop-select" id="kbUploadBU">'+KB_BUSINESS_UNITS.map(function(b){return '<option>'+b+'</option>'}).join('')+'</select></div>'+
      '<div style="flex:1"><div class="prop-label">Riservatezza</div>'+
        '<select class="prop-select" id="kbUploadConf">'+KB_CONFIDENTIALITY.map(function(c){return '<option'+(c==='interno'?' selected':'')+'>'+c+'</option>'}).join('')+'</select></div>'+
    '</div>'+
    '<div class="import-drop" onclick="document.getElementById(\'kbDocFileInput\').click()" id="kbDocDrop">'+
      '<div style="font-size:32px;margin-bottom:8px">📁</div>'+
      '<div style="font-size:13px;font-weight:600">Clicca o trascina uno o più documenti</div>'+
      '<div style="font-size:11px;color:var(--tx4);margin-top:4px">'+KB_DOC_ACCEPT+'</div>'+
    '</div>'+
    '<div style="text-align:center;margin-top:8px"><button class="tb-btn" onclick="openKBPasteModal()">✍️ Oppure incolla un testo</button></div>'+
    '<input type="file" id="kbDocFileInput" accept="'+KB_DOC_ACCEPT+'" multiple style="display:none" onchange="addKBDocsFromFiles(this.files)">'+
    '<div id="kbDocsList" style="margin-top:16px"></div>'+
    // Prova del recupero: è la parte che rende ispezionabile ciò che il
    // modello riceverà davvero, prima di collegare la KB a un flusso.
    '<div style="margin-top:18px;border-top:1px solid var(--bo);padding-top:14px">'+
      '<div class="prop-label">Prova il recupero</div>'+
      '<div style="display:flex;gap:8px;margin-bottom:8px">'+
        '<input class="prop-input" id="kbTestQuery" style="flex:1" placeholder="es: qual è la penale per il recesso anticipato?" onkeydown="if(event.key===\'Enter\')runKBTestSearch()">'+
        '<select class="prop-select" id="kbTestBU" style="width:150px">'+KB_BUSINESS_UNITS.map(function(b){return '<option>'+b+'</option>'}).join('')+'</select>'+
        '<button class="tb-btn primary" onclick="runKBTestSearch()">🔍 Cerca</button>'+
      '</div>'+
      '<div id="kbTestResults"></div>'+
    '</div>'
  ,true);
  var drop=document.getElementById('kbDocDrop');
  if(drop){
    drop.addEventListener('dragover',function(e){e.preventDefault();drop.classList.add('dragover')});
    drop.addEventListener('dragleave',function(){drop.classList.remove('dragover')});
    drop.addEventListener('drop',function(e){e.preventDefault();drop.classList.remove('dragover');addKBDocsFromFiles(e.dataTransfer.files)});
  }
  renderKBDocsList();
}

// Usato nel pannello proprietà di OGNI nodo Trigger nel Builder: selezionare
// un documento imposta config.filedata/filename, gli stessi campi che il
// motore di esecuzione (runAgent, js/builder.js) già legge per iniettare
// contenuto REALE nella pipeline invece dei dati di esempio simulati.
// Selezione MULTIPLA di documenti dalla Knowledge Base. Prima era una tendina
// a scelta singola: per far ragionare l'agente su piu' documenti aziendali —
// il caso normale, non l'eccezione — non c'era modo se non caricarli a mano
// uno per volta da una cartella. I documenti scelti sono composti con le
// stesse intestazioni usate per la lettura da cartella, cosi' il modello sa da
// quale documento viene ogni porzione e i prompt restano gli stessi.
function kbDocSelezionati(config){
  if(!config)return [];
  if(config.kbDocIds)return String(config.kbDocIds).split(',').filter(Boolean);
  // Compatibilita' con i flussi salvati prima della selezione multipla.
  return config.kbDocId?[config.kbDocId]:[];
}

function renderKBDocPicker(nid,config){
  var docs=listKBDocs();
  var scelti=kbDocSelezionati(config);
  if(!docs.length){
    return '<div class="prop-group"><div class="prop-label">📚 Documenti dalla Knowledge Base</div>'+
      '<div style="font-size:10px;color:var(--tx4)">Nessun documento caricato: aprila dal pulsante 📦 Knowledge Base nella barra in alto.</div></div>';
  }
  var righe=docs.map(function(d){
    var on=scelti.indexOf(d.id)>=0;
    return '<label style="display:flex;align-items:center;gap:7px;padding:4px 2px;cursor:pointer;font-size:11px">'+
      '<input type="checkbox"'+(on?' checked':'')+' onchange="kbDocAlterna('+nid+',\''+d.id+'\',this.checked)">'+
      '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escHtml(d.name)+'</span>'+
      '<span style="color:var(--tx4);font-size:10px;flex-shrink:0">'+Math.round((d.content||'').length/1000)+'k</span></label>';
  }).join('');
  return '<div class="prop-group"><div class="prop-label">📚 Documenti dalla Knowledge Base'+
      (scelti.length?' <span style="color:var(--ac-d);font-weight:600">('+scelti.length+' scelt'+(scelti.length===1?'o':'i')+')</span>':'')+'</div>'+
    '<div style="max-height:150px;overflow-y:auto;border:1px solid var(--bo);border-radius:8px;padding:6px 8px;background:var(--bg2)">'+righe+'</div>'+
    (scelti.length
      ? '<button class="tb-btn" style="width:100%;margin-top:6px;font-size:11px;height:28px" onclick="kbDocSvuota('+nid+')">✕ Togli tutti i documenti</button>'
      : '')+
    '<div style="font-size:10px;color:var(--tx4);margin-top:5px;line-height:1.45">I documenti scelti diventano il dato in ingresso del flusso. Selezionandone più di uno, il modello li riceve insieme, separati da un\u2019intestazione con il nome di ciascuno.</div></div>';
}

// Compone i documenti scelti in un testo unico e lo scrive sul nodo.
function kbDocApplica(nid){
  var n=B.nodes.find(function(x){return x.id===nid});if(!n)return;
  if(!n.config)n.config={};
  var scelti=kbDocSelezionati(n.config);
  if(!scelti.length){
    delete n.config.kbDocIds; delete n.config.kbDocId;
    n.config.filedata='';n.config.filename='';n.config.filetipo='';
    b_render();renderProps(nid);return;
  }
  var tutti=listKBDocs();
  var doc=scelti.map(function(id){return tutti.find(function(x){return x.id===id})}).filter(Boolean);
  var testo,nome;
  if(doc.length===1){
    testo=doc[0].content; nome=doc[0].name;
  }else{
    // Stesse intestazioni della lettura da cartella: un solo formato da
    // spiegare nei prompt, e il modello sa gia' come leggerlo.
    testo=doc.map(function(d){
      return '\n===== DOCUMENTO: '+d.name+' (Knowledge Base) =====\n'+d.content;
    }).join('\n');
    nome=doc.length+' documenti dalla Knowledge Base';
  }
  n.config.kbDocIds=scelti.join(',');
  delete n.config.kbDocId;
  n.config.filedata=testo;
  n.config.filename=nome;
  n.config.filetipo='Knowledge Base';
  n.config.filestato='pronto';
  delete n.config.fileerrore;
  b_render();renderProps(nid);
}

function kbDocAlterna(nid,docId,attivo){
  var n=B.nodes.find(function(x){return x.id===nid});if(!n)return;
  if(!n.config)n.config={};
  var scelti=kbDocSelezionati(n.config);
  var i=scelti.indexOf(docId);
  if(attivo&&i<0)scelti.push(docId);
  if(!attivo&&i>=0)scelti.splice(i,1);
  n.config.kbDocIds=scelti.join(',');
  kbDocApplica(nid);
  showToast(scelti.length?'📚 '+scelti.length+' documento/i collegato/i al trigger':'📚 Nessun documento collegato');
}

function kbDocSvuota(nid){
  var n=B.nodes.find(function(x){return x.id===nid});if(!n)return;
  if(!n.config)n.config={};
  n.config.kbDocIds='';
  kbDocApplica(nid);
  showToast('📚 Documenti rimossi dal trigger');
}

// Compatibilita': il nome vecchio resta valido per i flussi gia' salvati e per
// eventuali richiami esterni.
function useKBDocAsTrigger(nid,docId){
  var n=B.nodes.find(function(x){return x.id===nid});if(!n)return;
  if(!n.config)n.config={};
  n.config.kbDocIds=docId||'';
  kbDocApplica(nid);
}

// ══════════════════════════════════════════
// KNOWLEDGE BASE — export/import completo dei dati utente
// Tutto ciò che l'utente crea sulla piattaforma vive ora nel database
// SQLite locale (js/db.js). Tre modi di portarselo via, in ordine di
// fedeltà: 🗄️ file .sqlite (backup 1:1, riapribile con qualunque client
// SQL), 📥 JSON (leggibile, re-importabile su un'altra installazione),
// 📚 Markdown (pensato per essere letto da un umano, non per il re-import).
// ══════════════════════════════════════════

// Le connessioni erano l'unica tabella dello schema esclusa dal pacchetto
// JSON, e l'esclusione non era dichiarata da nessuna parte: chi esportava il
// proprio backup e lo reimportava si ritrovava senza, e nulla glielo diceva.
//
// Ora ci sono, ma SENZA i campi che possono contenere un segreto. La
// configurazione di una connessione non ha campi password — la connessione al
// database chiede l'utente e non la password, l'SMTP tiene le credenziali nel
// servizio locale — ma l'intestazione HTTP e' un testo libero dove qualcuno
// puo' aver incollato un `Authorization: Bearer ...`. Un backup e' un file che
// si gira: e' esattamente il posto in cui una credenziale non deve finire.
var CONN_CAMPI_SEGRETI=['headers','token','apikey','api_key','password','secret','authorization'];

function connessioniPerExport(){
  return dbAll('SELECT * FROM connessioni').map(function(c){
    var copia={},rimossi=[];
    Object.keys(c).forEach(function(k){ copia[k]=c[k] });
    try{
      var cfg=JSON.parse(c.config_json||'{}');
      Object.keys(cfg).forEach(function(k){
        if(CONN_CAMPI_SEGRETI.indexOf(String(k).toLowerCase())>=0&&cfg[k]){
          delete cfg[k]; rimossi.push(k);
        }
      });
      copia.config_json=JSON.stringify(cfg);
    }catch(e){}
    // Dichiarato nel file stesso: chi reimporta deve sapere che quel campo va
    // ricompilato, invece di scoprirlo quando la connessione non funziona.
    if(rimossi.length)copia._campi_esclusi=rimossi;
    return copia;
  });
}

function exportKnowledgeBase(){
  var kb={schema:'relaition.kb.v2',exported:new Date().toISOString(),profile:profileData,
          nota:'Le connessioni sono incluse senza i campi che possono contenere credenziali (intestazioni HTTP, token): vanno ricompilate dopo l\'importazione. Le chiavi dei fornitori AI non sono mai nel database e quindi non sono in questo file.',
          data:{}};
  DB_TABLES.forEach(function(t){
    kb.data[t]= (t==='connessioni') ? connessioniPerExport() : dbAll('SELECT * FROM '+t);
  });
  var json=JSON.stringify(kb,null,2);
  var blob=new Blob([json],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;
  a.download='relaition_knowledge_base_'+new Date().toISOString().substring(0,10)+'.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url)},1000);
  showToast('📦 Dati esportati: connessioni incluse senza credenziali');
  addAct('Esportato il pacchetto dati completo');
}

function importKnowledgeBase(input){
  if(!input.files||!input.files[0])return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var kb=JSON.parse(e.target.result);
      if(!kb.data||kb.schema!=='relaition.kb.v2'){showToast('⚠️ Formato non riconosciuto. Per un backup completo usa 🗄️ Esporta/Importa Database (.sqlite).');return}
      if(!confirm('Importare questo backup sovrascriverà TUTTI i dati attuali nel database. Continuare?'))return;
      DB_TABLES.forEach(function(t){dbRun('DELETE FROM '+t)});
      DB_TABLES.forEach(function(t){(kb.data[t]||[]).forEach(function(row){dbInsertRow(t,row)})});
      if(kb.profile)profileData=kb.profile;
      showToast('✅ Knowledge base importata: ricarico...');
      setTimeout(function(){location.reload()},900);
    }catch(ex){showToast('❌ Errore import: '+ex.message)}
  };
  reader.readAsText(input.files[0]);
}

// ══════════════════════════════════════════
// WIKI MARKDOWN — esporta la conoscenza costruita sulla piattaforma
// (workflow, agenti pubblicati, log) come documento .md leggibile,
// per condividerla o archiviarla fuori da RelAItion.
// ══════════════════════════════════════════

var NODE_TYPE_LABELS={tr:'Trigger',ai:'AI / ML',ac:'Action',cd:'Condition',ou:'Output'};

function workflowToMarkdown(nodes,edges){
  if(!nodes||!nodes.length)return '_Nessun nodo nel workflow._\n';
  var md='| # | Tipo | Nodo | Dettaglio | Configurazione |\n|---|------|------|-----------|------------------|\n';
  nodes.forEach(function(n,i){
    var cfg=n.config?Object.keys(n.config).filter(function(k){return n.config[k]!==''&&n.config[k]!=null}).map(function(k){return '`'+k+'='+String(n.config[k]).substring(0,60)+'`'}).join(', '):'';
    md+='| '+(i+1)+' | '+(NODE_TYPE_LABELS[n.type]||n.type)+' | '+n.icon+' '+(n.name||'')+' | '+(n.detail||'')+' | '+(cfg||'—')+' |\n';
  });
  md+='\n**Flusso:**\n\n';
  if(edges&&edges.length){
    edges.forEach(function(e){
      var from=nodes.find(function(n){return n.id===e.from});
      var to=nodes.find(function(n){return n.id===e.to});
      md+='- '+(from?from.name:e.from)+(e.fp&&e.fp!=='out'?' _('+e.fp+')_':'')+' → '+(to?to.name:e.to)+'\n';
    });
  }else{
    md+='_Nessuna connessione definita._\n';
  }
  return md;
}

function exportWikiMarkdown(){
  var now=new Date();
  var md='# 📚 RelAItion: Wiki della Knowledge Base\n\n';
  md+='Generato il '+now.toLocaleString('it-IT')+' da **'+(profileData.name||'utente')+'**\n\n---\n\n';

  md+='## Profilo\n\n';
  md+='- **Nome:** '+(profileData.name||'—')+'\n';
  md+='- **Ruolo:** '+(profileData.role||'—')+'\n';
  md+='- **Organizzazione:** '+(profileData.org||'—')+'\n';
  md+='- **Bio:** '+(profileData.bio||'—')+'\n\n---\n\n';

  var builder=null;try{builder=JSON.parse(localStorage.getItem('relaition_builder')||'null')}catch(e){}
  md+='## Workflow corrente nel Builder: '+(currentAgentName||'Senza nome')+'\n\n';
  md+=builder?workflowToMarkdown(builder.nodes,builder.edges):'_Nessun workflow nel builder._\n';
  md+='\n---\n\n';

  var agents=dbAll('SELECT * FROM agents ORDER BY updated_at DESC');
  md+='## Agenti salvati nel database ('+agents.length+')\n\n';
  if(!agents.length)md+='_Nessun agente salvato._\n\n';
  agents.forEach(function(a){
    md+='### 🔧 '+a.name+'\n\n';
    md+=workflowToMarkdown(JSON.parse(a.nodes_json),JSON.parse(a.edges_json));
    md+='\n';
  });
  md+='---\n\n';

  var published=dbAll('SELECT * FROM published_agents ORDER BY created_at DESC');
  md+='## Agenti pubblicati nel Marketplace ('+published.length+')\n\n';
  if(!published.length)md+='_Nessun agente pubblicato._\n\n';
  published.forEach(function(a){
    var wf=JSON.parse(a.workflow_json||'{}');
    md+='### '+a.icon+' '+a.name+': '+a.cat+'\n\n';
    md+=(a.desc||'')+'\n\n';
    md+='Integrazioni: '+JSON.parse(a.tags_json||'[]').join(', ')+' · Prezzo: '+a.price+'\n\n';
    md+=workflowToMarkdown(wf.nodes,wf.edges);
    md+='\n';
  });
  md+='---\n\n';

  var myagents=dbAll('SELECT * FROM my_agents');
  md+='## Agenti installati dal Marketplace ('+myagents.length+')\n\n';
  if(myagents.length){
    myagents.forEach(function(m){md+='- ID catalogo `'+m.catalog_id+'`: installato il '+new Date(m.installed_at).toLocaleDateString('it-IT')+'\n'});
  }else{md+='_Nessun agente installato._\n'}
  md+='\n---\n\n';

  var docs=listKBDocs();
  md+='## Documenti caricati nella Knowledge Base ('+docs.length+')\n\n';
  if(docs.length){
    docs.forEach(function(d){
      md+='### 📄 '+d.name+'\n\n';
      md+='_'+Math.round(d.size/1024*10)/10+' KB: caricato il '+new Date(d.uploaded).toLocaleDateString('it-IT')+'_\n\n';
      md+='```\n'+d.content.substring(0,1000)+(d.content.length>1000?'\n… (troncato)':'')+'\n```\n\n';
    });
  }else{md+='_Nessun documento caricato._\n\n'}
  md+='---\n\n';

  var log=dbAll('SELECT * FROM exec_log ORDER BY id DESC LIMIT 30');
  var logTotal=dbGetOne('SELECT COUNT(*) c FROM exec_log').c;
  md+='## Log Esecuzioni recenti ('+logTotal+' totali)\n\n';
  if(log.length){
    md+='| Data | Agente | Nodi | Esito | Durata (ms) |\n|------|--------|------|-------|-------------|\n';
    log.forEach(function(l){
      md+='| '+new Date(l.ts).toLocaleString('it-IT')+' | '+(l.agent||'')+' | '+l.nodes+' | '+(l.status==='ok'?'✅ OK':'❌ ERR')+' | '+(l.duration||0)+' |\n';
    });
  }else{md+='_Nessuna esecuzione registrata._\n'}

  var blob=new Blob([md],{type:'text/markdown;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;
  a.download='relaition_wiki_'+now.toISOString().substring(0,10)+'.md';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url)},1000);
  showToast('📚 Wiki esportata in Markdown');
  addAct('Esportata wiki Markdown della knowledge base');
}

var KB_TABLE_LABELS={agents:'Agenti salvati',exec_log:'Log esecuzioni',published_agents:'Agenti pubblicati nel marketplace',my_agents:'Agenti installati',kb_docs:'Documenti aziendali caricati',forum_posts:'Post community',forum_comments:'Commenti community',learn_progress:'Lezioni Learning Hub completate',quiz_done:'Quiz superati',challenges_registered:'Iscrizioni a sfide/eventi',xp_log:'Voci XP accumulate'};

function openKnowledgeBaseModal(){
  var sizeInfo=DB_TABLES.map(function(t){
    var c=dbGetOne('SELECT COUNT(*) c FROM '+t);
    return {t:t,n:c?c.c:0};
  });
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>🗄️ Il tuo Database</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 16px">Tutto ciò che crei su RelAItion (workflow, agenti, log, pubblicazioni, documenti caricati, progressi Learning Hub e Community) vive in un vero database SQLite eseguito nel tuo browser (nessun server). Puoi esportarlo in qualsiasi momento e portarlo con te: anche se lasci la piattaforma.</p>'+
    '<div class="validation-list" style="margin-top:0">'+
    sizeInfo.map(function(s){return '<div class="validation-item" style="background:var(--bg2);border-color:var(--bo);cursor:default"><span class="vi-ic">🗂️</span><span class="vi-msg">'+(KB_TABLE_LABELS[s.t]||s.t)+': '+s.n+' righe</span></div>'}).join('')+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">'+
      '<button class="tb-btn primary" onclick="openKBDocsModal()">📚 Carica/gestisci documenti</button>'+
    '</div>'+
    '<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin:16px 0 6px">Backup e portabilità</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
      '<button class="tb-btn primary" onclick="exportDatabaseFile()">🗄️ Esporta Database (.sqlite)</button>'+
      '<button class="tb-btn" onclick="document.getElementById(\'dbImportInput\').click()">📤 Importa .sqlite</button>'+
      '<button class="tb-btn" onclick="exportKnowledgeBase()">📥 Esporta JSON</button>'+
      '<button class="tb-btn" onclick="exportWikiMarkdown()">📚 Esporta Wiki (Markdown)</button>'+
      '<button class="tb-btn" onclick="document.getElementById(\'kbImportInput\').click()">📤 Importa JSON</button>'+
    '</div>'+
    '<input type="file" id="dbImportInput" accept=".sqlite,.db" style="display:none" onchange="importDatabaseFile(this)">'+
    '<div style="font-size:11px;color:var(--tx4);margin-top:8px">Il file <strong>.sqlite</strong> è un backup 1:1 apribile con qualunque client SQLite standard (DB Browser for SQLite, ecc.): la forma più portabile, nessun vendor lock-in. Il JSON è leggibile e re-importabile su un\'altra installazione di RelAItion. Il Markdown è pensato per essere letto da un umano, non re-importato.</div>'+
    '<input type="file" id="kbImportInput" accept=".json" style="display:none" onchange="importKnowledgeBase(this)">'+
    '<div style="background:var(--ac2-l);border-radius:8px;padding:10px 14px;font-size:11px;color:var(--tx2);margin-top:14px">💡 Nessun dato lascia il tuo browser finché non esporti tu stesso il file: il database è locale e sotto il tuo controllo.</div>'
  ,true);
}

// ══════════════════════════════════════════
// PUBLISH AGENT — pubblica nel marketplace
// ══════════════════════════════════════════

// ══════════════════════════════════════════
// COSTANZA E PRIVILEGI
// ══════════════════════════════════════════
// Il capitolo 4.4 chiede due cose che il prodotto prometteva e non faceva:
// premiare la costanza, e far sbloccare qualcosa all'accumulo di XP.
//
// La costanza era il caso peggiore: le notifiche annunciavano «Badge sbloccato:
// 7-Day Streak», e chi cliccava arrivava a un profilo dove quel badge non
// esisteva. Qui i giorni consecutivi si CONTANO, dalle date che l'attività ha
// gia' lasciato nel database (xp_log ed exec_log): non serve una nuova
// tracciatura, e il numero non puo' allontanarsi da cio' che e' successo.

// Giorni consecutivi di attivita' che terminano oggi o ieri. Ieri conta perche'
// una serie va spezzata da un giorno saltato per intero, non dal fatto che si
// stia guardando la pagina di mattina presto.
function giorniConsecutivi(utente){
  var chi=utente||utenteCorrente();
  var giorni={};
  try{
    dbAll('SELECT ts FROM xp_log WHERE user=?',[chi]).concat(
    dbAll('SELECT ts FROM exec_log WHERE user=?',[chi])).forEach(function(r){
      if(r.ts)giorni[String(r.ts).substring(0,10)]=1;
    });
  }catch(e){ return 0 }
  var oggi=new Date(); oggi.setHours(12,0,0,0);
  var iso=function(d){ return d.toISOString().substring(0,10) };
  // Il punto di partenza e' oggi se c'e' attivita' oggi, altrimenti ieri: se
  // manca anche ieri la serie e' interrotta e vale zero.
  var cursore=new Date(oggi);
  if(!giorni[iso(cursore)]){
    cursore.setDate(cursore.getDate()-1);
    if(!giorni[iso(cursore)])return 0;
  }
  var n=0;
  while(giorni[iso(cursore)]){ n++; cursore.setDate(cursore.getDate()-1) }
  return n;
}

// Soglia del documento: «accedere per 5 giorni consecutivi».
var COSTANZA_SOGLIA=5;

// XP a un utente diverso da quello collegato. Serve quando il merito e' di
// qualcun altro: chi installa un agente non e' chi lo ha scritto.
function addXPa(utente,n,reason){
  if(!utente)return;
  dbRun('INSERT INTO xp_log (amount,reason,ts,user) VALUES (?,?,?,?)',
    [n,reason||'',new Date().toISOString(),utente]);
  if(utente===utenteCorrente())updateXPDisplays();
}

// I privilegi che l'accumulo di XP sblocca davvero. Sono pochi e periferici di
// proposito: mettere una soglia davanti alla partecipazione di base (installare
// un agente, scrivere in Community) contraddirebbe l'abbattimento delle
// barriere che e' il senso del prodotto. Qui si sblocca il ruolo di chi
// GIUDICA il lavoro altrui, che e' l'unica cosa per cui l'esperienza accumulata
// sia davvero un requisito.
var PRIVILEGI=[
  {xp:0,    nome:'Partecipare',            desc:'Installare agenti, seguire i percorsi, scrivere in Community'},
  {xp:250,  nome:'Votare le candidature',  desc:'Esprimere il voto della community sulle candidature alle sfide'},
  {xp:500,  nome:'Revisione fra pari',     desc:'Commentare le candidature altrui e contribuire alla valutazione'},
  {xp:1000, nome:'Proporsi come revisore', desc:'Candidarsi a revisore delle pubblicazioni nel Marketplace'}
];
function privilegioSbloccato(xpRichiesti,utente){
  var xp=utente?(dbGetOne('SELECT COALESCE(SUM(amount),0) t FROM xp_log WHERE user=?',[utente])||{t:0}).t:getXP();
  return xp>=xpRichiesti;
}
// Quanto manca al prossimo privilegio: senza, la scala e' un elenco di regole
// invece di un obiettivo.
function prossimoPrivilegio(){
  var xp=getXP();
  for(var i=0;i<PRIVILEGI.length;i++) if(xp<PRIVILEGI[i].xp) return {p:PRIVILEGI[i], manca:PRIVILEGI[i].xp-xp};
  return null;
}
