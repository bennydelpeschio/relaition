// ═══════════════════════════════════════════
// DASHBOARD PER PERSONA
// ═══════════════════════════════════════════
// Le quattro schede in alto erano gia' calcolate su chi e' connesso. I tre
// riquadri sotto no: «agenti piu' usati», «attivita' recente» e il grafico
// della settimana erano scritti nel codice, e Sara, che non ha mai eseguito
// niente, vedeva 42 esecuzioni di «Lead Qualifier Pro», 148 esecuzioni in
// settimana e un commento a un post che non ha scritto. Qui si calcolano
// sulle righe della persona connessa. «Consigliati per te» e «Novita'» restano
// comuni: sono cio' che la piattaforma propone, non cio' che la persona ha
// fatto.

function dashUtente(){ return (typeof utenteCorrente==='function')?utenteCorrente():'' }

// Grafico: esecuzioni della persona negli ultimi sette giorni, giorno per
// giorno. Se non ce ne sono lo dice, invece di disegnare barre di altri.
function renderDashChart(){
  var card=document.querySelector('#page-dashboard .card.mt-20');
  if(!card)return;
  var chi=dashUtente();
  var giorni=['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  var oggi=new Date(); oggi.setHours(0,0,0,0);
  var dati=[], tot=0;
  for(var i=6;i>=0;i--){
    var d=new Date(oggi); d.setDate(oggi.getDate()-i);
    var d2=new Date(d); d2.setDate(d.getDate()+1);
    var n=0;
    try{ n=dbGetOne('SELECT COUNT(*) c FROM exec_log WHERE user=? AND ts>=? AND ts<?',[chi,d.toISOString(),d2.toISOString()]).c }catch(e){}
    tot+=n;
    dati.push({label:giorni[d.getDay()],val:n});
  }
  var maxVal=Math.max(1,Math.max.apply(null,dati.map(function(x){return x.val})));
  card.innerHTML='<div class="card-header"><div class="card-title">Le tue esecuzioni, ultimi sette giorni</div><span class="badge '+(tot?'badge-g':'badge-gray')+'">'+tot+' in settimana</span></div>'+
    (tot?'':'<div style="font-size:11.5px;color:var(--tx4);margin:-4px 0 8px">Nessuna esecuzione negli ultimi sette giorni: esegui un agente dal Builder e comparirà qui.</div>')+
    '<div class="mini-chart">'+dati.map(function(x){
      var h=Math.round(x.val/maxVal*100);
      return '<div class="mini-bar" style="height:'+Math.max(h,2)+'%;'+(x.val?'':'opacity:.35')+'" title="'+x.label+': '+x.val+' esecuzioni"><span class="mini-bar-val">'+x.val+'</span><span class="mini-bar-label">'+x.label+'</span></div>';
    }).join('')+'</div>';
}

// Agenti piu' usati dalla persona, con l'andamento degli ultimi sette giorni
// contro i sette precedenti. L'icona viene dall'agente salvato o dal catalogo.
function dashAgentiPiuUsatiHTML(){
  var chi=dashUtente();
  var righe=[];
  try{ righe=dbAll("SELECT agent, COUNT(*) c, SUM(CASE WHEN status='ok' THEN 1 ELSE 0 END) ok FROM exec_log WHERE user=? AND agent IS NOT NULL AND agent<>'' GROUP BY agent ORDER BY c DESC LIMIT 4",[chi]) }catch(e){}
  if(!righe.length)return '<div style="font-size:12px;color:var(--tx4);padding:12px 0;line-height:1.6">Nessuna esecuzione ancora. Esegui un agente dal Builder, o installane uno dal Marketplace: i più usati compariranno qui.</div>';
  var sette=new Date(); sette.setDate(sette.getDate()-7);
  var quattordici=new Date(); quattordici.setDate(quattordici.getDate()-14);
  return righe.map(function(a,i){
    var icona='🤖';
    try{
      var r=dbGetOne('SELECT nodes_json FROM agents WHERE name=? AND author=?',[a.agent,chi])||dbGetOne('SELECT nodes_json FROM agents WHERE name=?',[a.agent]);
      if(r){ var ns=JSON.parse(r.nodes_json||'[]'); var ai=ns.filter(function(n){return n.type==='ai'})[0]||ns[0]; if(ai&&ai.icon)icona=ai.icon; }
      else if(typeof AGENTS!=='undefined'){ var m=AGENTS.filter(function(x){return x.name===a.agent})[0]; if(m&&m.icon)icona=m.icon; }
    }catch(e){}
    var rec=0,prec=0;
    try{
      rec=dbGetOne('SELECT COUNT(*) c FROM exec_log WHERE user=? AND agent=? AND ts>=?',[chi,a.agent,sette.toISOString()]).c;
      prec=dbGetOne('SELECT COUNT(*) c FROM exec_log WHERE user=? AND agent=? AND ts>=? AND ts<?',[chi,a.agent,quattordici.toISOString(),sette.toISOString()]).c;
    }catch(e){}
    var badge;
    if(prec){ var t=Math.round((rec-prec)/prec*100); badge=t>0?'<span class="badge badge-g">+'+t+'%</span>':(t<0?'<span class="badge badge-r">'+t+'%</span>':'<span class="badge badge-gray">stabile</span>'); }
    else badge=rec?'<span class="badge badge-b">nuovo</span>':'<span class="badge badge-gray">fermo</span>';
    var tasso=a.c?Math.round(a.ok/a.c*100):0;
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bg2);cursor:pointer" onclick="go(\'execlog\')" title="'+tasso+'% riuscite">'+
      '<span style="font-size:14px;font-weight:800;color:var(--tx4);width:16px">'+(i+1)+'</span>'+
      '<span style="font-size:18px">'+icona+'</span>'+
      '<span style="flex:1;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escHtml(a.agent)+'</span>'+
      badge+'<span style="font-size:12px;font-weight:700;color:var(--ac)">'+a.c+' run</span></div>';
  }).join('');
}

// Attivita' recente della persona: dalle righe che le sue azioni hanno
// lasciato (esecuzioni, esperienza, installazioni) e dai commenti di altri ai
// suoi post. Unite, ordinate per data, le cinque piu' recenti.
function dashAttivitaRecenteHTML(){
  var chi=dashUtente();
  var voci=[];
  var aggiungi=function(righe,fn){ try{ (righe||[]).forEach(function(r){ var v=fn(r); if(v&&v.ts)voci.push(v) }) }catch(e){} };
  try{
    aggiungi(dbAll("SELECT agent,status,ts FROM exec_log WHERE user=? ORDER BY id DESC LIMIT 5",[chi]),function(r){
      return {ts:r.ts,dot:r.status==='ok'?'#10B981':(r.status==='err'?'#EF4444':'#F59E0B'),
              text:(r.status==='ok'?'Eseguito ':(r.status==='err'?'Esecuzione fallita: ':'Esecuzione in attesa: '))+r.agent,action:"go('execlog')"};
    });
    aggiungi(dbAll("SELECT reason,amount,ts FROM xp_log WHERE user=? ORDER BY id DESC LIMIT 5",[chi]),function(r){
      return {ts:r.ts,dot:'#6366F1',text:r.reason+' (+'+r.amount+' XP)',action:"go('profile')"};
    });
    aggiungi(dbAll("SELECT catalog_id,installed_at FROM my_agents WHERE user=? ORDER BY installed_at DESC LIMIT 3",[chi]),function(r){
      var nome='un agente';
      try{ if(typeof AGENTS!=='undefined'){ var m=AGENTS.filter(function(x){return x.id===r.catalog_id})[0]; if(m)nome=m.name } }catch(e){}
      return {ts:r.installed_at,dot:'#F59E0B',text:'Installato '+nome+' dal Marketplace',action:"go('myagents')"};
    });
    aggiungi(dbAll("SELECT c.user cu, p.title, c.created_at FROM forum_comments c JOIN forum_posts p ON p.id=c.post_id WHERE p.user=? AND c.user<>? ORDER BY c.id DESC LIMIT 3",[chi,chi]),function(r){
      return {ts:r.created_at,dot:'#8B5CF6',text:'Nuovo commento di '+r.cu+' al tuo post «'+r.title+'»',action:"go('community')"};
    });
  }catch(e){}
  voci.sort(function(a,b){return String(b.ts).localeCompare(String(a.ts))});
  voci=voci.slice(0,5);
  if(!voci.length)return '<div style="font-size:12px;color:var(--tx4);padding:12px 0;line-height:1.6">Ancora niente: le esecuzioni, le lezioni completate, le installazioni e i commenti ai tuoi post compariranno qui.</div>';
  return voci.map(function(a){
    var quando=''; try{ quando=relTimeIt(new Date(a.ts).getTime()) }catch(e){}
    return '<div class="activity-item" style="cursor:pointer" onclick="'+a.action+'"><div class="activity-dot" style="background:'+a.dot+'"></div><div><div class="activity-text">'+escHtml(a.text)+'</div><div class="activity-time">'+quando+'</div></div></div>';
  }).join('');
}
