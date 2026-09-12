// ═══════════════════════════════════════════
// PUBBLICAZIONE E VALIDAZIONE — Blocco D
// ═══════════════════════════════════════════

// D1 — Sei stati. 'pubblicato' è l'unico visibile nel Marketplace pubblico.
var PUB_STATES={
  bozza:        {lab:'Bozza',        ic:'📝', col:'#94A3B8'},
  in_verifica:  {lab:'In verifica',  ic:'🔍', col:'#F59E0B'},
  in_revisione: {lab:'In revisione', ic:'🛡️', col:'#6366F1'},
  pubblicato:   {lab:'Pubblicato',   ic:'✅', col:'#10B981'},
  sospeso:      {lab:'Sospeso',      ic:'⏸️', col:'#EF4444'},
  ritirato:     {lab:'Ritirato',     ic:'🗄️', col:'#64748B'}
};
function pubStateLabel(s){var d=PUB_STATES[s];return d?d.ic+' '+d.lab:s}

// D1 — Quattro ambiti. L'ambito determina chi approva e quali controlli
// diventano bloccanti: pubblicare per il proprio gruppo di lavoro non può
// richiedere le stesse garanzie di un catalogo aperto a tutta l'azienda.
var PUB_SCOPES={
  gruppo:        {lab:'Gruppo di lavoro', approver:'Responsabile diretto',   guardrailRichiesti:[],                                  conformita:false},
  business_unit: {lab:'Business unit',    approver:'Workstream Owner',       guardrailRichiesti:['Gestore eccezioni'],               conformita:false},
  organizzazione:{lab:'Organizzazione',   approver:'Workstream Owner + Conformità', guardrailRichiesti:['Gestore eccezioni','Mascheramento dati'], conformita:true},
  pubblico:      {lab:'Catalogo pubblico',approver:'Autorizzazione superiore',guardrailRichiesti:['Gestore eccezioni','Mascheramento dati','Convalida output'], conformita:true}
};

// ── D2: CONTROLLI ──────────────────────────────────────────────────────────
// Ogni controllo restituisce voci {ok, msg, dettaglio}. La distinzione fra
// bloccante e segnalazione non è cosmetica: un blocco impedisce la richiesta,
// una segnalazione la accompagna fino al revisore.

// Integrità strutturale su nodi/archi ARBITRARI (non solo sul canvas
// corrente): il revisore deve poter ricontrollare un agente in coda.
function pubStructuralCheck(nodes,edges){
  var problemi=[];
  if(!nodes||!nodes.length)return ['Nessun nodo nella definizione'];
  var ids={};nodes.forEach(function(n){ids[n.id]=true});
  edges=edges||[];
  edges.forEach(function(e){
    if(!ids[e.from]||!ids[e.to])problemi.push('Connessione verso un nodo inesistente');
  });
  if(!nodes.some(function(n){return n.type==='tr'}))problemi.push('Manca un nodo trigger');

  // Raggiungibilità dai trigger: un nodo che nessuna esecuzione può toccare
  // è codice morto pubblicato.
  var visti={},coda=nodes.filter(function(n){return n.type==='tr'}).map(function(n){return n.id});
  while(coda.length){
    var cur=coda.shift();if(visti[cur])continue;visti[cur]=1;
    edges.filter(function(e){return e.from===cur}).forEach(function(e){coda.push(e.to)});
  }
  var irraggiungibili=nodes.filter(function(n){return !visti[n.id]});
  if(irraggiungibili.length)problemi.push(irraggiungibili.length+' nodi irraggiungibili dal trigger: '+irraggiungibili.slice(0,3).map(function(n){return '"'+n.name+'"'}).join(', '));

  // Campi obbligatori mancanti
  nodes.forEach(function(n){
    var def=null;
    if(n.type==='ac'&&typeof getConnectorConfig==='function')def=getConnectorConfig(n.name);
    else if(n.type==='gr'&&typeof getGuardrailConfig==='function')def=getGuardrailConfig(n.name);
    else if(n.type==='tr'&&typeof TRIGGER_CONFIGS!=='undefined')def=TRIGGER_CONFIGS[n.name];
    if(!def||!def.fields)return;
    def.fields.filter(function(f){return f.req}).forEach(function(f){
      var v=(n.config||{})[f.k];
      if(v===undefined||v===null||String(v).trim()==='')problemi.push('"'+n.name+'": campo obbligatorio "'+(f.l||f.k)+'" non compilato');
    });
  });
  return problemi;
}

// Credenziali ed endpoint interni non devono viaggiare dentro la definizione
// pubblicata: chi installa l'agente riceverebbe segreti altrui.
var PUB_SECRET_KEYS=/(^|_)(key|token|secret|password|passwd|pwd|apikey|api_key|credential|auth)($|_)/i;
var PUB_SECRET_VALUE=/\b(sk-[A-Za-z0-9_-]{16,}|AIza[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|ghp_[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,})\b/;
var PUB_INTERNAL_HOST=/(https?:\/\/)?(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[\w-]+\.(intranet|local|internal|corp|lan))\b/i;

// Un campo a scelta chiusa non può contenere un segreto: i suoi valori sono
// quelli dichiarati nella definizione. Serve a distinguere il campo "auth" del
// Webhook — che dice *quale metodo* di autenticazione si usa, e vale
// "Bearer token" — da un campo dove qualcuno ha incollato il token vero.
function pubCampoAScelteChiuse(nodo,chiave){
  var def=null;
  if(nodo.type==='ac'&&typeof getConnectorConfig==='function')def=getConnectorConfig(nodo.name);
  else if(nodo.type==='gr'&&typeof getGuardrailConfig==='function')def=getGuardrailConfig(nodo.name);
  else if(nodo.type==='tr'&&typeof TRIGGER_CONFIGS!=='undefined')def=TRIGGER_CONFIGS[nodo.name];
  else if(typeof LOGIC_CONFIGS!=='undefined')def=LOGIC_CONFIGS[nodo.name];
  if(!def||!def.fields)return false;
  var f=def.fields.filter(function(x){return x.k===chiave})[0];
  return !!(f&&f.opts&&f.opts.indexOf(nodo.config[chiave])>=0);
}

function pubCredentialsCheck(nodes){
  var trovati=[];
  (nodes||[]).forEach(function(n){
    var cfg=n.config||{};
    Object.keys(cfg).forEach(function(k){
      var v=cfg[k];
      if(typeof v!=='string'||!v.trim())return;
      if(pubCampoAScelteChiuse(n,k))return;
      if(PUB_SECRET_KEYS.test(k)&&v.trim().length>8)
        trovati.push('"'+n.name+'" → campo "'+k+'" contiene un valore che sembra una credenziale');
      else if(PUB_SECRET_VALUE.test(v))
        trovati.push('"'+n.name+'" → campo "'+k+'" contiene una chiave in chiaro');
      else if(PUB_INTERNAL_HOST.test(v))
        trovati.push('"'+n.name+'" → campo "'+k+'" punta a un endpoint interno ('+v.substring(0,44)+')');
    });
  });
  return trovati;
}

function pubGuardrailCheck(nodes,scope){
  var def=PUB_SCOPES[scope]||PUB_SCOPES.organizzazione;
  var presenti={};(nodes||[]).forEach(function(n){if(n.type==='gr')presenti[n.name]=1});
  return def.guardrailRichiesti.filter(function(g){return !presenti[g]})
    .map(function(g){return 'Controllo "'+g+'" richiesto per l\'ambito «'+def.lab+'» ma non presente'});
}

// Sovrapposizione: se esiste già un agente che fa la stessa cosa, contribuire
// a quello è preferibile a pubblicarne un secondo quasi identico.
function pubOverlapCheck(name,desc,tags,excludeId){
  var parole=function(s){return String(s||'').toLowerCase().replace(/[^a-zà-ú0-9\s]/g,' ').split(/\s+/).filter(function(t){return t.length>3})};
  var mie=parole(name+' '+desc+' '+(tags||[]).join(' '));
  if(!mie.length)return [];
  var simili=[];
  dbAll("SELECT id,name,desc,tags_json FROM published_agents WHERE status='pubblicato'").forEach(function(a){
    if(excludeId&&a.id===excludeId)return;
    var sue=parole(a.name+' '+a.desc+' '+(a.tags_json||''));
    var comuni=mie.filter(function(w){return sue.indexOf(w)>=0});
    var pct=Math.round(comuni.length/mie.length*100);
    if(pct>=35)simili.push({name:a.name,id:a.id,pct:pct});
  });
  simili.sort(function(a,b){return b.pct-a.pct});
  return simili.slice(0,3).map(function(s){
    return 'Sovrapposizione '+s.pct+'% con "'+s.name+'" già pubblicato: valuta se contribuire a quello invece di pubblicarne un secondo';
  });
}

// Esecuzione di prova: si guarda se l'agente è stato eseguito almeno una volta
// con esito positivo. Un agente mai eseguito può comunque essere pubblicato,
// ma il revisore deve saperlo.
function pubSandboxCheck(agentName){
  var r=dbGetOne("SELECT COUNT(*) c FROM exec_log WHERE agent=? AND status='ok'",[agentName]);
  if(r&&r.c)return [];
  var tot=dbGetOne('SELECT COUNT(*) c FROM exec_log WHERE agent=?',[agentName]);
  return [(tot&&tot.c)?'Eseguito '+tot.c+' volte ma mai con esito positivo':'Mai eseguito: nessuna prova disponibile'];
}

function pubDocCheck(meta){
  var out=[];
  if(!meta.desc||meta.desc.trim().length<60)out.push('Descrizione troppo breve (min. 60 caratteri): spiega cosa fa, quali sistemi tocca e quali dati tratta');
  if(!meta.prerequisiti||!meta.prerequisiti.trim())out.push('Prerequisiti non indicati (credenziali, accessi, dati necessari)');
  if(!meta.datiTrattati||!meta.datiTrattati.trim())out.push('Dati trattati non dichiarati (personali, aziendali, nessuno)');
  return out;
}

// Casi di riferimento per la non regressione: le ultime esecuzioni tracciate.
// Il confronto vero avviene nella vista revisore (pubRunRegression).
//
// Le esecuzioni sono registrate col NOME dell'agente, che al momento della
// pubblicazione può essere diverso da quello scelto per il catalogo. Quando
// la pubblicazione conserva il riferimento all'agente salvato (source_agent_id)
// si risale al nome vero, altrimenti nessun caso verrebbe trovato e la non
// regressione risulterebbe "non verificabile" pur avendo esecuzioni tracciate.
function pubRegressionCases(agentName,sourceAgentId){
  var nomi=[agentName];
  if(sourceAgentId){
    var src=dbGetOne('SELECT name FROM agents WHERE id=?',[sourceAgentId]);
    if(src&&nomi.indexOf(src.name)<0)nomi.push(src.name);
  }
  var ph=nomi.map(function(){return '?'}).join(',');
  return dbAll('SELECT id,status,ts FROM exec_log WHERE agent IN ('+ph+') AND trace_json IS NOT NULL ORDER BY id DESC LIMIT 3',nomi);
}

function runPublishChecks(payload){
  var nodes=payload.nodes||[],edges=payload.edges||[];
  var bloccanti=[],segnalazioni=[];

  var s=pubStructuralCheck(nodes,edges);
  bloccanti.push({nome:'Integrità strutturale',ok:!s.length,voci:s});

  var g=pubGuardrailCheck(nodes,payload.scope);
  bloccanti.push({nome:'Controlli obbligatori per l\'ambito',ok:!g.length,voci:g});

  var c=pubCredentialsCheck(nodes);
  bloccanti.push({nome:'Assenza di credenziali ed endpoint interni',ok:!c.length,voci:c});

  var sb=pubSandboxCheck(payload.name);
  segnalazioni.push({nome:'Esecuzione di prova',ok:!sb.length,voci:sb});

  var d=pubDocCheck(payload);
  segnalazioni.push({nome:'Documentazione minima',ok:!d.length,voci:d});

  var o=pubOverlapCheck(payload.name,payload.desc,payload.tags,payload.excludeId);
  segnalazioni.push({nome:'Sovrapposizione con agenti pubblicati',ok:!o.length,voci:o});

  // La non regressione riguarda solo gli aggiornamenti di un agente già
  // pubblicato: su una prima pubblicazione non esiste nulla con cui confrontare.
  if(payload.isUpdate){
    var casi=pubRegressionCases(payload.name,payload.sourceAgentId);
    segnalazioni.push({nome:'Non regressione',ok:casi.length>0,
      voci:casi.length?[casi.length+' casi di riferimento pronti: verranno rigiocati dal revisore']
                      :['Nessuna esecuzione tracciata disponibile: la non regressione non è verificabile']});
  }

  var haBlocchi=bloccanti.some(function(b){return !b.ok});
  return {bloccanti:bloccanti,segnalazioni:segnalazioni,puoiProcedere:!haBlocchi};
}

function renderChecksHtml(res){
  function gruppo(titolo,voci,tipo){
    return '<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--tx3);margin-bottom:5px">'+titolo+'</div>'+
      voci.map(function(v){
        var col=v.ok?'#10B981':(tipo==='block'?'#EF4444':'#F59E0B');
        var ic=v.ok?'✅':(tipo==='block'?'⛔':'⚠️');
        return '<div style="border-left:3px solid '+col+';padding:5px 0 5px 9px;margin-bottom:5px">'+
          '<div style="font-size:11.5px;font-weight:600">'+ic+' '+escHtml(v.nome)+'</div>'+
          v.voci.map(function(t){return '<div style="font-size:10.5px;color:var(--tx3);margin-top:2px">'+escHtml(t)+'</div>'}).join('')+
        '</div>';
      }).join('')+'</div>';
  }
  return gruppo('Controlli bloccanti',res.bloccanti,'block')+gruppo('Segnalazioni',res.segnalazioni,'warn');
}

// ── D3: CONFRONTO CON LA VERSIONE IN USO ──
function pubDiff(nuovo,vecchio){
  var vn=(nuovo.nodes||[]),vv=(vecchio.nodes||[]);
  var perNome=function(arr){var m={};arr.forEach(function(n){m[n.name]=n});return m};
  var mn=perNome(vn),mv=perNome(vv);
  var aggiunti=vn.filter(function(n){return !mv[n.name]}).map(function(n){return n.name});
  var rimossi=vv.filter(function(n){return !mn[n.name]}).map(function(n){return n.name});
  var modificati=[];
  vn.forEach(function(n){
    var o=mv[n.name];if(!o)return;
    if(JSON.stringify(n.config||{})!==JSON.stringify(o.config||{}))modificati.push(n.name);
  });
  return {aggiunti:aggiunti,rimossi:rimossi,modificati:modificati,
    archiPrima:(vecchio.edges||[]).length,archiDopo:(nuovo.edges||[]).length};
}

// ── D4: SALUTE POST-PUBBLICAZIONE ──
// Tasso di fallimento, valutazione e inattività calcolati sui dati reali.
var PUB_SOGLIA_FALLIMENTI=40;   // percentuale oltre la quale si sospende
var PUB_GIORNI_INATTIVITA=90;

function pubAgentHealth(a){
  var tot=dbGetOne('SELECT COUNT(*) c FROM exec_log WHERE agent=?',[a.name]);
  var ko =dbGetOne("SELECT COUNT(*) c FROM exec_log WHERE agent=? AND status='err'",[a.name]);
  var ult=dbGetOne('SELECT ts FROM exec_log WHERE agent=? ORDER BY id DESC LIMIT 1',[a.name]);
  var n=(tot&&tot.c)||0,e=(ko&&ko.c)||0;
  var pct=n?Math.round(e/n*100):0;
  var giorni=ult?Math.floor((Date.now()-new Date(ult.ts).getTime())/86400000):null;
  return {
    esecuzioni:n, fallite:e, tassoFallimento:pct,
    giorniInattivo:giorni, valutazione:a.rating||0, installazioni:a.installs||0,
    critico:n>=5&&pct>=PUB_SOGLIA_FALLIMENTI,
    inattivo:giorni!==null&&giorni>=PUB_GIORNI_INATTIVITA
  };
}

function pubSuspend(id,motivo,automatica){
  dbRun("UPDATE published_agents SET status='sospeso',suspended_reason=?,suspended_at=? WHERE id=?",
    [motivo||'Sospensione manuale',new Date().toISOString(),id]);
  var a=dbGetOne('SELECT name,installs FROM published_agents WHERE id=?',[id]);
  // Chi lo ha già installato non lo perde: riceve la segnalazione e decide.
  if(a&&typeof addNotif==='function')
    addNotif('⏸️ "'+a.name+'" sospeso: non più installabile. Chi lo usa già può continuare, valutando il motivo: '+(motivo||''));
  addAct((automatica?'Sospensione automatica: ':'Sospeso agente: ')+(a?a.name:'#'+id));
  showToast('⏸️ Agente sospeso'+(automatica?' automaticamente':''));
}

function pubResume(id){
  dbRun("UPDATE published_agents SET status='pubblicato',suspended_reason=NULL,suspended_at=NULL WHERE id=?",[id]);
  showToast('✅ Agente riattivato');
}

// Sospensione automatica: gira quando si apre il pannello o allo scheduler.
// Nel prototipo non esiste un servizio in ascolto — è una fedeltà
// dimostrativa, dichiarata in ARCHITECTURE.md.
function pubAutoSuspendScan(){
  var sospesi=[];
  dbAll("SELECT * FROM published_agents WHERE status='pubblicato'").forEach(function(a){
    var h=pubAgentHealth(a);
    if(h.critico){
      pubSuspend(a.id,'Tasso di fallimento '+h.tassoFallimento+'% su '+h.esecuzioni+' esecuzioni (soglia '+PUB_SOGLIA_FALLIMENTI+'%)',true);
      sospesi.push(a.name);
    }
  });
  return sospesi;
}

// ── VERSIONAMENTO ──
function pubSaveVersion(agentId,version,definizione,nota){
  dbRun('INSERT INTO agent_versions (agent_id,version,definition_json,author,created_at,note) VALUES (?,?,?,?,?,?)',
    [agentId,version,JSON.stringify(definizione),profileData.name,new Date().toISOString(),nota||'']);
}

function pubVersions(agentId){
  return dbAll('SELECT * FROM agent_versions WHERE agent_id=? ORDER BY id DESC',[agentId]);
}

function pubRestoreVersion(versionRowId){
  var v=dbGetOne('SELECT * FROM agent_versions WHERE id=?',[versionRowId]);
  if(!v){showToast('⚠️ Versione non trovata');return}
  var def=JSON.parse(v.definition_json);
  dbRun('UPDATE published_agents SET workflow_json=?,version=? WHERE id=?',[JSON.stringify(def),v.version,v.agent_id]);
  var a=dbGetOne('SELECT name,installs FROM published_agents WHERE id=?',[v.agent_id]);
  if(a&&typeof addNotif==='function')
    addNotif('↩︎ "'+a.name+'" riportato alla versione '+v.version+(a.installs?': '+a.installs+' installazioni interessate':''));
  showToast('↩︎ Ripristinata la versione '+v.version);
  addAct('Ripristinata versione '+v.version+' di '+(a?a.name:'#'+v.agent_id));
}

// Pannello di sorveglianza post-pubblicazione (D4)
function openPublishHealthPanel(){
  var righe=dbAll("SELECT * FROM published_agents WHERE status IN ('pubblicato','sospeso') ORDER BY status,name");
  var html='<div style="display:flex;justify-content:space-between;align-items:center"><h2>Salute delle pubblicazioni</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 16px">Tasso di fallimento, valutazione e inattività calcolati sulle esecuzioni reali. Oltre il '+PUB_SOGLIA_FALLIMENTI+'% di fallimenti (su almeno 5 esecuzioni) l\'agente viene sospeso: non è più installabile, chi lo usa già riceve la segnalazione e decide.</p>';
  if(!righe.length){
    html+='<div style="text-align:center;padding:40px;color:var(--tx4)"><div style="font-size:32px;margin-bottom:8px">📭</div><div style="font-size:13px">Nessun agente pubblicato</div></div>';
  }else{
    html+=righe.map(function(a){
      var h=pubAgentHealth(a);
      var versioni=pubVersions(a.id);
      var col=h.critico?'#EF4444':(h.inattivo?'#F59E0B':'#10B981');
      return '<div class="card mb-16" style="padding:13px;border-left:3px solid '+col+'">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">'+
          '<div><div style="font-weight:700;font-size:13px">'+a.icon+' '+escHtml(a.name)+' <span style="font-size:10px;color:var(--tx4)">v'+escHtml(a.version||'1.0')+'</span></div>'+
          '<div style="font-size:10.5px;color:var(--tx4);margin-top:3px">'+
            h.esecuzioni+' esecuzioni · <strong style="color:'+(h.tassoFallimento>=PUB_SOGLIA_FALLIMENTI?'#EF4444':'var(--tx3)')+'">'+h.tassoFallimento+'% fallite</strong> · '+
            h.installazioni+' installazioni · valutazione '+(h.valutazione||'—')+
            (h.giorniInattivo===null?' · mai eseguito':' · ultima esecuzione '+h.giorniInattivo+' giorni fa')+
          '</div>'+
          (a.suspended_reason?'<div style="font-size:10.5px;color:#EF4444;margin-top:4px">⏸️ '+escHtml(a.suspended_reason)+'</div>':'')+
          (h.inattivo&&a.status==='pubblicato'?'<div style="font-size:10.5px;color:#F59E0B;margin-top:4px">⚠️ Inattivo da oltre '+PUB_GIORNI_INATTIVITA+' giorni</div>':'')+
          '</div>'+
          '<span class="badge" style="flex-shrink:0;background:'+col+'22;color:'+col+'">'+pubStateLabel(a.status)+'</span>'+
        '</div>'+
        '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">'+
          (a.status==='pubblicato'
            ? '<button class="tb-btn" style="font-size:11px;color:#EF4444;border-color:#FEE2E2" onclick="pubSuspendUI('+a.id+')">⏸️ Sospendi</button>'
            : '<button class="tb-btn primary" style="font-size:11px" onclick="pubResume('+a.id+');openPublishHealthPanel()">▶️ Riattiva</button>')+
          (versioni.length>1?'<button class="tb-btn" style="font-size:11px" onclick="pubVersionsUI('+a.id+')">🗂️ Versioni ('+versioni.length+')</button>':'')+
        '</div></div>';
    }).join('');
  }
  openModal(html,true);
}

function pubSuspendUI(id){
  var motivo=prompt('Motivo della sospensione:','')||'Sospensione manuale';
  pubSuspend(id,motivo,false);
  openPublishHealthPanel();
  if(currentPage==='marketplace')renderMkt();
}

function pubVersionsUI(id){
  var vs=pubVersions(id);
  var a=dbGetOne('SELECT name,version FROM published_agents WHERE id=?',[id]);
  var html='<div style="display:flex;justify-content:space-between;align-items:center"><h2>Versioni di '+escHtml(a.name)+'</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 14px">Il ripristino di una versione precedente notifica chi ha installato l\'agente.</p>'+
    vs.map(function(v){
      var def=JSON.parse(v.definition_json||'{}');
      var inUso=v.version===a.version;
      return '<div class="validation-item" style="background:var(--bg2);border-color:var(--bo);cursor:default;align-items:center">'+
        '<span class="vi-ic">'+(inUso?'✅':'🗄️')+'</span>'+
        '<div class="vi-msg" style="flex:1"><div><strong>v'+escHtml(v.version)+'</strong>'+(inUso?' <span style="color:var(--ac);font-size:10px">in uso</span>':'')+'</div>'+
        '<div style="font-size:10px;color:var(--tx4);margin-top:2px">'+(def.nodes||[]).length+' nodi · '+escHtml(v.author||'')+' · '+new Date(v.created_at).toLocaleDateString('it-IT')+(v.note?' · '+escHtml(v.note):'')+'</div></div>'+
        (inUso?'':'<button class="tb-btn" style="font-size:11px" onclick="pubRestoreVersion('+v.id+');pubVersionsUI('+id+')">↩︎ Ripristina</button>')+
      '</div>';
    }).join('');
  openModal(html,true);
}

function pubNextVersion(corrente){
  var m=String(corrente||'1.0').match(/^(\d+)\.(\d+)$/);
  return m?(m[1]+'.'+(parseInt(m[2],10)+1)):'1.1';
}

// ══════════════════════════════════════════
// INSERIMENTO DEI CONTROLLI RICHIESTI DALL'AMBITO
// ══════════════════════════════════════════
// La verifica di pubblicazione diceva quali controlli mancano ma lasciava
// all'utente il compito di capire DOVE metterli: un mascheramento dopo la
// chiamata al modello non protegge nulla, e una convalida prima non ha niente
// da convalidare. Il punto d'inserimento non e' un dettaglio, quindi lo decide
// la piattaforma invece di lasciarlo indovinare.

// Dove va ciascun controllo, e perche'.
var PUB_POSIZIONE_CONTROLLO={
  'Mascheramento dati':   {dove:'prima-ai',   perche:'i dati vanno sostituiti prima di raggiungere il modello'},
  'Filtro contenuti':     {dove:'prima-ai',   perche:'il filtro va applicato sul testo in ingresso'},
  'Difesa da istruzioni ostili':{dove:'prima-ai',perche:'le istruzioni ostili vanno intercettate prima della chiamata'},
  'Convalida output':     {dove:'dopo-ai',    perche:'si convalida cio' + "'" + ' che il modello ha prodotto'},
  'Verifica di fondatezza':{dove:'dopo-ai',   perche:'si verifica la risposta contro le fonti recuperate'},
  'Gestore eccezioni':    {dove:'prima-output',perche:'intercetta gli errori prima che il flusso si chiuda'},
  'Approvazione umana':   {dove:'prima-output',perche:'l' + "'" + 'approvazione precede la chiusura del flusso'}
};

// Inserisce un nodo NEL MEZZO di una connessione esistente, ricucendo gli archi.
function pubInserisciTra(nodo,idMonte,idValle){
  var arco=B.edges.filter(function(e){return e.from===idMonte&&e.to===idValle})[0];
  B.nodes.push(nodo);
  if(arco){
    var portaOrig=arco.fp;
    arco.to=nodo.id;                    // monte -> nuovo, conservando la porta
    B.edges.push({from:nodo.id,to:idValle,fp:'out'});
    return portaOrig;
  }
  // Nessun arco diretto: si collega comunque al nodo indicato per non
  // lasciare il controllo isolato, che il motore non eseguirebbe mai.
  if(idMonte)B.edges.push({from:idMonte,to:nodo.id,fp:'out'});
  if(idValle)B.edges.push({from:nodo.id,to:idValle,fp:'out'});
  return 'out';
}

function aggiungiControlliRichiesti(scope){
  var def=PUB_SCOPES[scope]||PUB_SCOPES.organizzazione;
  var presenti={};B.nodes.forEach(function(n){if(n.type==='gr')presenti[n.name]=1});
  var mancanti=def.guardrailRichiesti.filter(function(g){return !presenti[g]});
  if(!mancanti.length){showToast('Tutti i controlli richiesti sono gia' + "'" + ' presenti');return}

  if(typeof pushUndo==='function')pushUndo('inserimento controlli richiesti');
  var aggiunti=[];

  mancanti.forEach(function(nome){
    var pos=PUB_POSIZIONE_CONTROLLO[nome]||{dove:'prima-output'};
    var ai=B.nodes.filter(function(n){return n.type==='ai'});
    var out=B.nodes.filter(function(n){return n.type==='ou'});
    var ancora=null,valle=null;

    if(pos.dove==='prima-ai'&&ai.length){
      valle=ai[0];
      var e1=B.edges.filter(function(e){return e.to===valle.id})[0];
      ancora=e1?B.nodes.filter(function(n){return n.id===e1.from})[0]:null;
    }else if(pos.dove==='dopo-ai'&&ai.length){
      ancora=ai[ai.length-1];
      var e2=B.edges.filter(function(e){return e.from===ancora.id})[0];
      valle=e2?B.nodes.filter(function(n){return n.id===e2.to})[0]:null;
    }else if(out.length){
      valle=out[0];
      var e3=B.edges.filter(function(e){return e.to===valle.id})[0];
      ancora=e3?B.nodes.filter(function(n){return n.id===e3.from})[0]:null;
    }
    if(!ancora&&!valle)return;

    var rif=valle||ancora;
    var voce=(typeof PALETTE!=='undefined')?PALETTE.filter(function(p){return p.name===nome})[0]:null;
    var nodo={id:B.nextId++,type:'gr',name:nome,icon:voce?voce.icon:'\ud83d\udee1\ufe0f',
      detail:voce?voce.desc:'Controllo richiesto',
      x:rif.x, y:rif.y,
      config:(typeof nodoConfigIniziale==='function')?nodoConfigIniziale('gr',nome):{}};

    // Spazio verticale per il nuovo nodo: senza, finisce sopra a quello a valle.
    var da=valle?valle.y:(ancora.y+130);
    B.nodes.forEach(function(n){if(n.y>=da)n.y+=130});
    nodo.y=da;
    nodo.x=rif.x;

    pubInserisciTra(nodo,ancora?ancora.id:null,valle?valle.id:null);
    aggiunti.push(nome+': '+(pos.perche||''));
  });

  if(typeof fillRequiredDefaults==='function')fillRequiredDefaults();
  if(typeof clearInvalidNodes==='function')clearInvalidNodes();
  if(typeof b_render==='function')b_render();
  if(typeof scheduleAutosave==='function')scheduleAutosave();
  if(typeof refreshPublishChecks==='function')refreshPublishChecks();

  showToast('\u2705 '+aggiunti.length+' controllo/i inserito/i nel flusso');
  if(typeof addAct==='function')addAct('Inseriti i controlli richiesti per la pubblicazione');
  return aggiunti;
}
