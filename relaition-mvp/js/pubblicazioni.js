// ══════════════════════════════════════════
// PUBBLICATI E IN REVISIONE — la vista dell'AUTORE
// ══════════════════════════════════════════
// La coda di revisione mostra al REVISORE cosa deve decidere. Mancava il lato
// opposto: chi ha pubblicato non aveva modo di sapere com'era andata. Le
// decisioni finivano in `published_agents.review_note` e in `publications`, e
// nessuna schermata le leggeva: un agente rifiutato spariva dal Marketplace
// senza che l'autore ne conoscesse il motivo.

var PUB_STATO_ETICHETTA={
  in_verifica:  {t:'In verifica',       c:'#B45309', b:'#FEF3C7', i:'⏳',
                 d:'In attesa che un revisore la esamini.'},
  in_revisione: {t:'In revisione',      c:'#B45309', b:'#FEF3C7', i:'⏳',
                 d:'Un revisore la sta esaminando.'},
  pubblicato:   {t:'Pubblicato',        c:'#047857', b:'#D1FAE5', i:'✅',
                 d:'Visibile nel Marketplace secondo l’ambito richiesto.'},
  bozza:        {t:'Modifica richiesta',c:'#1D4ED8', b:'#DBEAFE', i:'✏️',
                 d:'Il revisore chiede una modifica prima di approvare.'},
  ritirato:     {t:'Rifiutato',         c:'#B91C1C', b:'#FEE2E2', i:'❌',
                 d:'Non pubblicato. Puoi correggerlo e ripresentarlo.'},
  sospeso:      {t:'Sospeso',           c:'#B91C1C', b:'#FEE2E2', i:'⏸️',
                 d:'Ritirato dal Marketplace dopo la pubblicazione.'}
};

// Ultima decisione presa su una pubblicazione: porta il nome del revisore e la
// data, senza i quali un feedback non si sa da chi venga ne' se sia attuale.
function pubUltimaDecisione(pubId){
  return dbGetOne('SELECT reviewer,decision,decided_at,notes FROM publications '+
    'WHERE agent_id=? AND decision IS NOT NULL ORDER BY id DESC LIMIT 1',[pubId]);
}

function pubNotaRevisore(a){
  var dec=pubUltimaDecisione(a.id);
  return a.review_note||(dec?dec.notes:null);
}

// Riga di dettaglio in stile «creati da te»: quanti nodi ha il workflow COME
// PUBBLICATO e da quanto tempo. Il conteggio si legge da `workflow_json`, non
// dall'agente locale: dopo aver pubblicato si continua a lavorare, e i due
// possono divergere — mostrare il numero locale accanto allo stato della
// pubblicazione direbbe una cosa per un'altra.
function pubDettaglioTecnico(a){
  var n=0;
  try{ var wf=JSON.parse(a.workflow_json||'{}'); n=(wf.nodes||[]).length }catch(e){}
  var parti=[];
  if(n)parti.push(n+' nod'+(n===1?'o':'i'));
  if(a.created_at)parti.push('pubblicato '+relTimeIt(new Date(a.created_at).getTime()));
  if(a.installs)parti.push(a.installs+' installazion'+(a.installs===1?'e':'i'));
  return escHtml(parti.join(' \u00B7 '));
}

function schedePubblicazioni(){
  var mie=dbAll('SELECT * FROM published_agents WHERE author=? ORDER BY id DESC',[utenteCorrente()]);
  if(!mie.length)return '';
  var daFare=mie.filter(function(a){return a.status==='bozza'||a.status==='ritirato'}).length;
  // Il filtro si applica DOPO aver contato: le etichette devono dire quante ce
  // ne sono in ciascuno stato, non quante ne restano dopo il filtro corrente.
  var filtro=PUB_FILTRI.filter(function(f){return f.id===pubFiltro})[0]||PUB_FILTRI[0];
  var visibili=filtro.stati?mie.filter(function(a){return filtro.stati.indexOf(a.status)>=0}):mie;

  var cards=visibili.map(function(a){
    var st=PUB_STATO_ETICHETTA[a.status]||{t:a.status,c:'#64748B',b:'#F1F5F9',i:'•',d:''};
    var dec=pubUltimaDecisione(a.id);
    var nota=pubNotaRevisore(a);

    // Correggere e ripresentare sono due gesti distinti: il primo porta la
    // richiesta nel Builder, il secondo rimette la pubblicazione in coda. Chi
    // corregge non si approva da solo: decide un revisore.
    //
    // L'azione principale sta su una RIGA PROPRIA. Con tre pulsanti a `flex:1`
    // nella stessa riga, dentro una colonna della griglia, «Applica la
    // correzione» andava a capo e l'altezza fissa di 30px lo tagliava a meta':
    // il pulsante piu' importante della scheda era l'unico illeggibile.
    var azioni='';
    if(a.status==='bozza'||a.status==='ritirato'){
      azioni+='<button class="tb-btn primary" style="width:100%;justify-content:center;height:32px;font-size:11.5px;margin-bottom:6px" '+
        'onclick="applicaModificaRichiesta('+a.id+')" title="Apre la richiesta del revisore nel Builder">'+
        '🤖 Applica la correzione</button>'+
      '<div style="display:flex;gap:6px">'+
        '<button class="tb-btn" style="flex:1;justify-content:center;height:30px;font-size:11px" '+
        'onclick="pubRipresenta('+a.id+')" title="Rimanda in coda di revisione">📤 Ripresenta</button>'+
        '<button class="tb-btn" style="flex:1;justify-content:center;height:30px;font-size:11px" '+
        'onclick="apriDettaglioPubblicazione('+a.id+')">🔍 Dettagli</button>'+
      '</div>';
    } else {
      azioni='<button class="tb-btn" style="width:100%;justify-content:center;height:30px;font-size:11px" '+
        'onclick="apriDettaglioPubblicazione('+a.id+')">🔍 Dettagli</button>';
    }

    // Il badge di stato sta su una riga propria: accanto al nome comprimeva il
    // titolo a due caratteri per riga nelle colonne strette della griglia.
    return '<div class="agent-card" style="display:flex;flex-direction:column">'+
      '<div class="agent-top">'+
        '<div class="agent-icon" style="background:'+(a.color||'#64748B')+'15;color:'+(a.color||'#64748B')+'">'+(a.icon||'📦')+'</div>'+
        '<div class="agent-info"><div class="agent-name">'+escHtml(a.name)+'</div>'+
        '<div class="agent-author">v'+escHtml(a.version||'1.0')+' · '+
          escHtml((typeof PUB_SCOPES==='object'&&PUB_SCOPES[a.scope])?PUB_SCOPES[a.scope].lab:(a.scope||'—'))+
          (a.installs?' · '+a.installs+' install.':'')+'</div></div>'+
      '</div>'+
      '<div style="padding:0 14px"><span class="badge" style="background:'+st.b+';color:'+st.c+'">'+st.i+' '+st.t+'</span></div>'+
      '<div class="agent-desc">'+
        // La descrizione era in `published_agents.desc` e non veniva mostrata:
        // la scheda diceva in che stato si trova la pubblicazione ma non che
        // cosa faccia l'agente, mentre le schede degli agenti creati nel
        // Builder lo dicono. Chi ha piu' pubblicazioni le distingueva solo dal
        // nome.
        (a.desc?'<div style="font-size:11.5px;color:var(--tx2);line-height:1.55;margin-bottom:7px">'+escHtml(a.desc)+'</div>':'')+
        '<div style="font-size:10.5px;color:var(--tx4);margin-bottom:7px">'+pubDettaglioTecnico(a)+'</div>'+
        '<div style="font-size:11px;color:var(--tx4);line-height:1.5">'+escHtml(st.d)+'</div>'+
        (nota
          ? '<div style="margin-top:8px;background:'+st.b+';border-radius:8px;padding:9px 11px;line-height:1.5">'+
            '<div style="font-size:10px;font-weight:700;color:'+st.c+';text-transform:uppercase;letter-spacing:.03em">Feedback del revisore</div>'+
            '<div style="font-size:11.5px;color:var(--tx2);margin-top:3px">'+escHtml(nota)+'</div>'+
            (dec&&dec.reviewer?'<div style="font-size:10px;color:var(--tx4);margin-top:4px">— '+escHtml(dec.reviewer)+
              (dec.decided_at?' · '+relTimeIt(new Date(dec.decided_at).getTime()):'')+'</div>':'')+
            '</div>'
          : ((a.status==='ritirato'||a.status==='bozza')
              ? '<div style="margin-top:8px;font-size:11px;color:var(--tx4);font-style:italic">Il revisore non ha lasciato una motivazione.</div>'
              : ''))+
      '</div>'+
      '<div class="agent-bottom" style="display:block;margin-top:auto">'+azioni+'</div>'+
    '</div>';
  }).join('');

  return '<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">'+
      '🚀 Pubblicati e in revisione ('+mie.length+')'+
      (daFare?' <span style="color:#B45309">· '+daFare+' richiede'+(daFare===1?'':'no')+' un tuo intervento</span>':'')+
    '</div>'+
    pubBarraFiltri(mie)+
    (visibili.length
      ? '<div class="mkt-grid" style="margin-bottom:28px">'+cards+'</div>'
      : '<div class="card" style="padding:22px;text-align:center;margin-bottom:28px">'+
        '<div style="font-size:12.5px;color:var(--tx3)">Nessuna pubblicazione in questo stato.</div>'+
        '<button class="tb-btn mt-12" onclick="pubImpostaFiltro(\'tutte\')">Mostra tutte</button></div>');
}

// Carica nel Builder il workflow COME PUBBLICATO, non l'agente locale: sono due
// cose diverse quando si e' continuato a lavorare dopo aver pubblicato, ed e'
// sulla versione vista dal revisore che il suo commento si applica.
function apriPubblicazioneNelBuilder(pubId){
  var a=dbGetOne('SELECT * FROM published_agents WHERE id=?',[pubId]);
  if(!a){showToast('⚠️ Pubblicazione non trovata');return null}
  var wf={};try{wf=JSON.parse(a.workflow_json||'{}')}catch(e){}
  if(!wf.nodes||!wf.nodes.length){showToast('⚠️ La pubblicazione non contiene un workflow');return null}
  B.nodes=wf.nodes;B.edges=wf.edges||[];B.nextId=wf.nextId||wf.nodes.length+1;
  B.selId=-1;B.selIds=[];B.selEdgeIdx=-1;B.context=wf.context||'';
  currentAgentName=a.name;
  // L'agente locale di partenza resta il bersaglio del salvataggio. Se manca
  // (pubblicazione arrivata senza source_agent_id) si ripiega su un agente
  // omonimo dello stesso autore: senza questo, l'autosave del Builder creerebbe
  // una riga nuova a ogni apertura — "Qualificazione contatti", poi "(2)", "(3)".
  var locale=a.source_agent_id?dbGetOne('SELECT id FROM agents WHERE id=?',[a.source_agent_id]):null;
  if(!locale)locale=dbGetOne('SELECT id FROM agents WHERE name=? AND author=?',[a.name,utenteCorrente()]);
  B.dbAgentId=locale?locale.id:null;
  go('builder');
  if(typeof svuotaRegistroEsecuzione==='function')svuotaRegistroEsecuzione();
  if(typeof fillRequiredDefaults==='function')fillRequiredDefaults(B.nodes);
  b_render();
  if(typeof bResetView==='function')bResetView();
  if(typeof aggiornaTitoloBuilder==='function')aggiornaTitoloBuilder();
  return a;
}

// Porta la richiesta del revisore nella chat del Builder, gia' scritta. Non la
// applica da sola: passa dall'anteprima come qualunque altra modifica, ed e'
// l'autore a decidere se accettarla.
function applicaModificaRichiesta(pubId){
  var a=apriPubblicazioneNelBuilder(pubId);
  if(!a)return;
  var nota=pubNotaRevisore(a);
  var campo=document.getElementById('chatBuilderInput');
  if(!campo)return;
  if(!nota){
    showToast('ℹ️ Il revisore non ha scritto una richiesta: descrivi tu la modifica');
    campo.focus();return;
  }
  campo.value=nota;
  campo.focus();
  showToast('🤖 Richiesta del revisore pronta nella chat: premi Genera per vedere l’anteprima');
  addAct('Ripresa la richiesta di modifica su "'+a.name+'"');
}

// Contatore sulla voce di menu: una decisione del revisore arriva mentre
// l'autore non sta guardando, e `notifications` vive in memoria e non e' per
// utente — una notifica creata al momento della decisione la vedrebbe il
// revisore, non l'autore. Il contatore si ricava invece dal database a ogni
// avvio, quindi resta corretto per chiunque acceda.
function aggiornaBadgePubblicazioni(){
  var b=document.getElementById('pubBadge');
  if(!b)return;
  var n=0;
  try{
    n=dbGetOne("SELECT COUNT(*) c FROM published_agents WHERE author=? AND status IN ('bozza','ritirato')",
      [utenteCorrente()]).c;
  }catch(e){ n=0 }
  if(n){b.textContent=n;b.style.display='';b.title=n+' pubblicazione/i in attesa di una tua correzione'}
  else b.style.display='none';
}

// ══════════════════════════════════════════
// FILTRI, DETTAGLIO E RIPRESENTAZIONE
// ══════════════════════════════════════════
// Con cinque pubblicazioni in quattro stati diversi la sezione diventa un
// elenco da leggere tutto per trovare l'unica che richiede qualcosa. I filtri
// rispondono alla domanda con cui ci si arriva: «cosa devo fare?».
//
// I gruppi non sono i sei stati del database ma le quattro SITUAZIONI in cui
// una persona si trova: e' pubblicato, aspetta un revisore, aspetta me, e' stato
// tolto. Filtrare per `in_revisione` invece che per «in verifica» chiederebbe
// all'utente di conoscere lo schema.
var PUB_FILTRI=[
  {id:'tutte',      l:'Tutte',                   stati:null},
  {id:'intervento', l:'Richiedono un intervento',stati:['bozza','ritirato']},
  {id:'verifica',   l:'In verifica',             stati:['in_verifica','in_revisione']},
  {id:'approvate',  l:'Pubblicate',              stati:['pubblicato']},
  {id:'sospese',    l:'Sospese',                 stati:['sospeso']}
];
var pubFiltro='tutte';

function pubImpostaFiltro(f){
  pubFiltro=f;
  if(typeof renderMyAgents==='function')renderMyAgents();
}

function pubBarraFiltri(mie){
  var conta=function(f){
    if(!f.stati)return mie.length;
    return mie.filter(function(a){return f.stati.indexOf(a.status)>=0}).length;
  };
  return '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">'+
    PUB_FILTRI.map(function(f){
      var n=conta(f);
      // Un filtro che non seleziona nulla resta visibile ma spento: sapere che
      // NON hai nulla di sospeso e' un'informazione, nasconderlo la toglie.
      var attivo=(pubFiltro===f.id);
      return '<div class="mkt-filter'+(attivo?' active':'')+'" '+
        (n?'':'style="opacity:.45"')+' onclick="pubImpostaFiltro(\''+f.id+'\')">'+
        escHtml(f.l)+' <span style="opacity:.7">'+n+'</span></div>';
    }).join('')+'</div>';
}

// ── DETTAGLIO ──
// La scheda mostra l'ultimo feedback. Il dettaglio mostra la STORIA: chi ha
// deciso cosa e quando, versione per versione. Su una pubblicazione respinta e
// ripresentata due volte, l'ultima nota da sola non dice come ci si e' arrivati.
function pubStoria(pubId){
  return dbAll('SELECT * FROM publications WHERE agent_id=? ORDER BY id DESC',[pubId]);
}

function apriDettaglioPubblicazione(pubId){
  var a=dbGetOne('SELECT * FROM published_agents WHERE id=?',[pubId]);
  if(!a){showToast('⚠️ Pubblicazione non trovata');return}
  var st=PUB_STATO_ETICHETTA[a.status]||{t:a.status,c:'#64748B',b:'#F1F5F9',i:'•',d:''};
  var wf={};try{wf=JSON.parse(a.workflow_json||'{}')}catch(e){}
  var nodi=wf.nodes||[];
  var storia=pubStoria(pubId);
  var ambito=(typeof PUB_SCOPES==='object'&&PUB_SCOPES[a.scope])?PUB_SCOPES[a.scope]:null;

  var righeStoria=storia.length? storia.map(function(p){
    var d=p.decision?(PUB_STATO_ETICHETTA[p.decision]||{t:p.decision,c:'#64748B'}):null;
    return '<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--bg2)">'+
      '<span style="font-size:11px;font-weight:700;color:var(--tx4);flex-shrink:0;width:34px">v'+escHtml(p.version||'—')+'</span>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:12px;font-weight:700">'+
          (d?'<span style="color:'+d.c+'">'+escHtml(d.t)+'</span>':'<span style="color:#B45309">In attesa di decisione</span>')+
          (p.requested_scope?' <span style="font-weight:400;color:var(--tx4)">· ambito '+escHtml(ambito&&p.requested_scope===a.scope?ambito.lab:p.requested_scope)+'</span>':'')+
        '</div>'+
        (p.notes?'<div style="font-size:11.5px;color:var(--tx3);line-height:1.5;margin-top:2px">'+escHtml(p.notes)+'</div>':'')+
        '<div style="font-size:10.5px;color:var(--tx4);margin-top:2px">'+
          (p.reviewer?escHtml(p.reviewer)+' · ':'')+
          (p.decided_at?relTimeIt(new Date(p.decided_at).getTime()):('richiesta '+relTimeIt(new Date(p.created_at).getTime())))+
        '</div>'+
      '</div></div>';
  }).join('') : '<div style="font-size:11.5px;color:var(--tx4);font-style:italic">Nessuna decisione registrata: la pubblicazione non è ancora passata da un revisore.</div>';

  var azioni='';
  if(a.status==='bozza'||a.status==='ritirato'){
    azioni+='<button class="tb-btn primary" onclick="closeModal();applicaModificaRichiesta('+a.id+')">🤖 Applica la modifica</button>'+
      '<button class="tb-btn" onclick="pubRipresenta('+a.id+')">📤 Ripresenta per la revisione</button>';
  }
  azioni+='<button class="tb-btn" onclick="closeModal();apriPubblicazioneNelBuilder('+a.id+')">✏️ Apri nel Builder</button>'+
    '<button class="tb-btn" onclick="closeModal()">Chiudi</button>';

  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:flex-start">'+
      '<div style="display:flex;gap:14px;align-items:center">'+
        '<div class="agent-icon" style="background:'+(a.color||'#64748B')+'15;color:'+(a.color||'#64748B')+';width:50px;height:50px;font-size:26px">'+(a.icon||'📦')+'</div>'+
        '<div><h2 style="margin:0">'+escHtml(a.name)+'</h2>'+
          '<div style="font-size:12px;color:var(--tx3)">v'+escHtml(a.version||'1.0')+' · '+
            escHtml(ambito?ambito.lab:(a.scope||'—'))+(a.installs?' · '+a.installs+' installazioni':'')+'</div></div>'+
      '</div><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<div style="display:flex;gap:8px;margin:14px 0;flex-wrap:wrap">'+
      '<span class="badge" style="background:'+st.b+';color:'+st.c+'">'+st.i+' '+st.t+'</span>'+
      (ambito?'<span class="badge badge-gray">Approva: '+escHtml(ambito.approver)+'</span>':'')+
    '</div>'+
    '<div style="font-size:12px;color:var(--tx2);line-height:1.6">'+escHtml(st.d)+'</div>'+
    sfTitolettoPub('🧾 Storia delle decisioni')+righeStoria+
    sfTitolettoPub('🔧 Il flusso come pubblicato ('+nodi.length+' nodi)')+
    (nodi.length
      ? '<div style="display:flex;gap:6px;overflow-x:auto;padding:6px 0">'+nodi.map(function(n,i){
          var col={tr:'#F59E0B',ai:'#6366F1',cd:'#EF4444',ac:'#10B981',ou:'#64748B',gr:'#0D9488'}[n.type]||'#94A3B8';
          return '<div style="background:'+col+'10;border:1px solid '+col+'30;border-radius:8px;padding:8px 11px;min-width:96px;text-align:center;font-size:10.5px;flex-shrink:0">'+
            '<div style="font-size:16px">'+(n.icon||'▫️')+'</div>'+
            '<div style="font-weight:700;margin-top:2px">'+escHtml(n.name||'')+'</div>'+
            (n.detail?'<div style="color:var(--tx4);margin-top:1px">'+escHtml(n.detail)+'</div>':'')+
          '</div>';
        }).join('')+'</div>'
      : '<div style="font-size:11.5px;color:var(--tx4);font-style:italic">La pubblicazione non contiene un workflow.</div>')+
    '<div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap">'+azioni+'</div>',true);
}

function sfTitolettoPub(t){
  return '<div style="font-size:12px;font-weight:700;margin:18px 0 6px">'+t+'</div>';
}

// ── RIPRESENTAZIONE ──
// Chi corregge NON si approva da solo: la pubblicazione torna in coda e un
// revisore decide. Farla passare direttamente fra le approvate renderebbe la
// coda di revisione una formalita' aggirabile da chi ha piu' fretta — che e'
// esattamente il difetto che il ciclo di vita del capitolo esiste per evitare.
function pubRipresenta(pubId){
  var a=dbGetOne('SELECT * FROM published_agents WHERE id=?',[pubId]);
  if(!a)return;
  if(a.status!=='bozza'&&a.status!=='ritirato'){
    showToast('ℹ️ Questa pubblicazione non è in attesa di una correzione');return;
  }
  if(!confirm('Ripresentare «'+a.name+'» per la revisione?\n\nTornerà in coda: un revisore la esaminerà e deciderà se pubblicarla.'))return;
  // Il workflow ripresentato e' quello dell'agente locale se esiste — cioe' la
  // versione appena corretta — altrimenti resta quello gia' pubblicato.
  var locale=a.source_agent_id?dbGetOne('SELECT * FROM agents WHERE id=?',[a.source_agent_id]):null;
  if(!locale)locale=dbGetOne('SELECT * FROM agents WHERE name=? AND author=?',[a.name,utenteCorrente()]);
  var wf=null;
  if(locale){
    try{ wf={nodes:JSON.parse(locale.nodes_json),edges:JSON.parse(locale.edges_json||'[]'),nextId:locale.next_id||1} }catch(e){}
  }
  var versione=(typeof pubNextVersion==='function')?pubNextVersion(a.version):(a.version||'1.0');
  var ora=new Date().toISOString();
  dbRun("UPDATE published_agents SET status='in_verifica',review_note=NULL,version=?"+(wf?',workflow_json=?':'')+' WHERE id=?',
    wf?[versione,JSON.stringify(wf),pubId]:[versione,pubId]);
  if(wf&&typeof pubSaveVersion==='function')pubSaveVersion(pubId,versione,wf,'Ripresentata dopo la correzione');
  dbRun('INSERT INTO publications (agent_id,version,requested_scope,checks_json,created_at) VALUES (?,?,?,?,?)',
    [pubId,versione,a.scope,'{}',ora]);
  persistDatabaseNow();
  addXP(40,'Ripresentata dopo la correzione: '+a.name);
  addAct('Ripresentata per la revisione: '+a.name+' v'+versione);
  showToast('📤 «'+a.name+'» v'+versione+' è tornata in coda di revisione');
  closeModal();
  if(typeof aggiornaBadgePubblicazioni==='function')aggiornaBadgePubblicazioni();
  if(currentPage==='myagents'&&typeof renderMyAgents==='function')renderMyAgents();
}
