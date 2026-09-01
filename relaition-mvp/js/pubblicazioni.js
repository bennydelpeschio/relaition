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

function schedePubblicazioni(){
  var mie=dbAll('SELECT * FROM published_agents WHERE author=? ORDER BY id DESC',[utenteCorrente()]);
  if(!mie.length)return '';
  var daFare=mie.filter(function(a){return a.status==='bozza'||a.status==='ritirato'}).length;

  var cards=mie.map(function(a){
    var st=PUB_STATO_ETICHETTA[a.status]||{t:a.status,c:'#64748B',b:'#F1F5F9',i:'•',d:''};
    var dec=pubUltimaDecisione(a.id);
    var nota=pubNotaRevisore(a);

    var azioni='';
    // Il pulsante porta la richiesta del revisore dentro la chat del Builder:
    // e' la scorciatoia fra "mi hanno chiesto una modifica" e "l'ho fatta".
    if(a.status==='bozza'||a.status==='ritirato'){
      azioni+='<button class="tb-btn primary" style="flex:1;justify-content:center;height:30px;font-size:11px" '+
        'onclick="applicaModificaRichiesta('+a.id+')">🤖 Applica la modifica</button>';
    }
    azioni+='<button class="tb-btn" style="flex:1;justify-content:center;height:30px;font-size:11px" '+
      'onclick="apriPubblicazioneNelBuilder('+a.id+')">✏️ Apri nel Builder</button>';

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
      '<div class="agent-bottom" style="display:flex;gap:6px;margin-top:auto">'+azioni+'</div>'+
    '</div>';
  }).join('');

  return '<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">'+
      '🚀 Pubblicati e in revisione ('+mie.length+')'+
      (daFare?' <span style="color:#B45309">· '+daFare+' richiede'+(daFare===1?'':'no')+' un tuo intervento</span>':'')+
    '</div><div class="mkt-grid" style="margin-bottom:28px">'+cards+'</div>';
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
  showToast('🤖 Richiesta del revisore pronta nella chat — premi Genera per vedere l’anteprima');
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
