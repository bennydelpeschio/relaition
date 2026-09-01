// ═══════════════════════════════════════════
// CRUSCOTTO DI GOVERNO DELLA PIATTAFORMA
// ═══════════════════════════════════════════
// Chi amministra non ha le stesse domande di chi costruisce. A un builder
// interessa il proprio agente; a chi governa interessa se la piattaforma
// viene adottata, se quello che ci gira è presidiato, e dove si sta
// accumulando rischio.
//
// Ogni numero qui è calcolato sui dati reali del database locale. Dove un
// dato non esiste in un prototipo mono-utente (utenti distinti, costi reali),
// la scheda lo dichiara invece di stimarlo.

function govStats(){
  var q=function(sql,p){var r=dbGetOne(sql,p);return r?(r.c||0):0};
  var s={};

  // ── POPOLAZIONE ──
  // Gli utenti non stanno in una tabella dedicata: si ricavano da chi ha
  // effettivamente lasciato traccia (autori di agenti, esecutori, autori di
  // pubblicazioni e post). È l'unico modo onesto di contarli senza inventare
  // un'anagrafica che il prototipo non ha.
  var utenti={};
  var aggiungi=function(v){ if(v&&String(v).trim())utenti[String(v).trim()]=1 };
  dbAll('SELECT DISTINCT author u FROM agents WHERE author IS NOT NULL').forEach(function(r){aggiungi(r.u)});
  dbAll('SELECT DISTINCT user u FROM exec_log WHERE user IS NOT NULL').forEach(function(r){aggiungi(r.u)});
  dbAll('SELECT DISTINCT author u FROM published_agents').forEach(function(r){aggiungi(r.u)});
  dbAll('SELECT DISTINCT user u FROM forum_posts').forEach(function(r){aggiungi(r.u)});
  aggiungi(typeof profileData!=='undefined'?profileData.name:null);
  s.utenti=Object.keys(utenti);
  s.nUtenti=Math.max(1,s.utenti.length);
  // Utenti che hanno davvero costruito qualcosa, non solo commentato.
  s.utentiCostruttori=dbAll('SELECT DISTINCT author u FROM agents WHERE author IS NOT NULL').length||
                      (dbGetOne('SELECT COUNT(*) c FROM agents').c?1:0);

  // ── ADOZIONE ──
  s.agenti          = q('SELECT COUNT(*) c FROM agents');
  s.agentiEseguiti  = q('SELECT COUNT(DISTINCT agent) c FROM exec_log');
  s.agentiMaiUsati  = q('SELECT COUNT(*) c FROM agents WHERE name NOT IN (SELECT DISTINCT agent FROM exec_log)');
  s.inProduzione    = q('SELECT COUNT(*) c FROM agents WHERE active=1');
  s.installati      = q('SELECT COUNT(*) c FROM my_agents');

  // ── USO ──
  s.esecuzioni      = q('SELECT COUNT(*) c FROM exec_log');
  s.esecuzioniOk    = q("SELECT COUNT(*) c FROM exec_log WHERE status='ok'");
  s.esecuzioniKo    = q("SELECT COUNT(*) c FROM exec_log WHERE status='err'");
  s.esecuzioniStop  = q("SELECT COUNT(*) c FROM exec_log WHERE status='aborted'");
  s.esecuzioniAttesa= q("SELECT COUNT(*) c FROM exec_log WHERE status='waiting'");
  s.tassoSuccesso   = s.esecuzioni?Math.round(s.esecuzioniOk/s.esecuzioni*100):0;
  var dur=dbGetOne('SELECT AVG(duration) d FROM exec_log WHERE duration>0');
  s.durataMedia     = dur&&dur.d?Math.round(dur.d):0;
  s.perModalita     = dbAll('SELECT mode, COUNT(*) c FROM exec_log GROUP BY mode ORDER BY c DESC');
  s.ultimi7gg       = q("SELECT COUNT(*) c FROM exec_log WHERE ts >= datetime('now','-7 days')");

  // ── PRESIDIO ──
  // Copertura dei controlli: quanti agenti hanno almeno un guardrail. È la
  // metrica che dice se la governance è applicata o solo disponibile.
  var conControlli=0, totali=0, senzaControlli=[];
  dbAll('SELECT name,nodes_json FROM agents').forEach(function(a){
    totali++;
    var ns=[];try{ns=JSON.parse(a.nodes_json||'[]')}catch(e){}
    if(ns.some(function(n){return n.type==='gr'}))conControlli++;
    else senzaControlli.push(a.name);
  });
  s.coperturaControlli = totali?Math.round(conControlli/totali*100):0;
  s.agentiSenzaControlli = senzaControlli;
  s.politicheAttive  = q('SELECT COUNT(*) c FROM policies WHERE active=1');
  s.politicheImposte = q("SELECT COUNT(*) c FROM policies WHERE active=1 AND mode='obbligatoria'");
  s.mascheramenti    = q("SELECT COUNT(*) c FROM execution_events WHERE event_type='guardrail:triggered' AND payload_json LIKE '%ascheramento%'");
  s.approvazioni     = q("SELECT COUNT(*) c FROM execution_events WHERE event_type='node:waiting'");
  s.bloccatiDaControlli = q("SELECT COUNT(*) c FROM execution_events WHERE event_type='guardrail:triggered' AND payload_json LIKE '%\"esito\":\"blocca\"%'");
  s.erroriAssorbiti  = q("SELECT COUNT(*) c FROM execution_events WHERE event_type='error:handled'");

  // ── MODELLI ──
  s.chiamateAI       = q("SELECT COUNT(*) c FROM execution_events WHERE event_type='node:start' AND payload_json LIKE '%\"tipo\":\"ai\"%'");
  s.degradazioni     = q("SELECT COUNT(*) c FROM execution_events WHERE event_type='capability:degraded'");
  s.strumentiInvocati= q("SELECT COUNT(*) c FROM execution_events WHERE event_type='tool:invoked'");
  s.cicliStrumenti   = q("SELECT COUNT(*) c FROM execution_events WHERE event_type='tool:loop'");
  s.providerConfigurati=Object.keys(aiConfig.providers||{}).filter(function(p){
    return aiConfig.providers[p].status==='ok';
  });
  // Il modello scelto sui nodi, aggregato: dice su cosa poggia davvero la
  // piattaforma, non su cosa è stato configurato una volta.
  var perModello={};
  dbAll('SELECT nodes_json FROM agents').forEach(function(a){
    var ns=[];try{ns=JSON.parse(a.nodes_json||'[]')}catch(e){}
    ns.filter(function(n){return n.type==='ai'}).forEach(function(n){
      var m=(n.config&&n.config.model)||'claude';
      perModello[m]=(perModello[m]||0)+1;
    });
  });
  s.nodiPerModello=Object.keys(perModello).map(function(k){return {modello:k,n:perModello[k]}})
    .sort(function(a,b){return b.n-a.n});

  // ── CONOSCENZA ──
  s.kbDocumenti  = q('SELECT COUNT(*) c FROM kb_docs');
  s.kbPorzioni   = q('SELECT COUNT(*) c FROM kb_chunks');
  s.kbRecuperi   = q("SELECT COUNT(*) c FROM execution_events WHERE event_type='kb:retrieved'");
  s.kbVuoti      = q("SELECT COUNT(*) c FROM execution_events WHERE event_type='kb:empty'");
  s.kbDaAgenti   = q("SELECT COUNT(*) c FROM kb_docs WHERE origin LIKE 'agente:%'");

  // ── PUBBLICAZIONE ──
  s.perStato=dbAll('SELECT status, COUNT(*) c FROM published_agents GROUP BY status');
  s.sospesi = q("SELECT COUNT(*) c FROM published_agents WHERE status='sospeso'");
  s.inAttesaRevisione = q("SELECT COUNT(*) c FROM published_agents WHERE status IN ('in_verifica','in_revisione')");

  // ── APPRENDIMENTO ──
  s.lezioniFatte = q('SELECT COUNT(*) c FROM learn_progress WHERE done=1');
  s.quizSuperati = q('SELECT COUNT(*) c FROM quiz_done');
  s.sfideIscritte= q('SELECT COUNT(*) c FROM challenges_registered');

  // ── MEDIE PER UTENTE ──
  // Il totale dice quanto è grande la piattaforma; la media dice se l'uso è
  // diffuso o concentrato su poche persone. Sono due domande diverse.
  var media=function(v){return Math.round(v/s.nUtenti*10)/10};
  s.mediaAgenti     = media(s.agenti);
  s.mediaEsecuzioni = media(s.esecuzioni);
  s.mediaDocumenti  = media(s.kbDocumenti);
  s.mediaLezioni    = media(s.lezioniFatte);
  // Concentrazione: quanta parte delle esecuzioni fa capo all'agente più
  // usato. Alta significa che la piattaforma regge su un solo caso d'uso.
  var top=dbGetOne('SELECT agent, COUNT(*) c FROM exec_log GROUP BY agent ORDER BY c DESC LIMIT 1');
  s.agentePiuUsato  = top?top.agent:null;
  s.concentrazione  = (top&&s.esecuzioni)?Math.round(top.c/s.esecuzioni*100):0;
  s.classificaAgenti= dbAll('SELECT agent, COUNT(*) c, SUM(CASE WHEN status=\'err\' THEN 1 ELSE 0 END) ko FROM exec_log GROUP BY agent ORDER BY c DESC LIMIT 5');

  return s;
}

// Segnali di rischio: non metriche da guardare, cose da fare. Ordinati per
// gravità, ciascuno con l'azione che li chiude.
function govRischi(s){
  var r=[];
  if(s.sospesi)
    r.push({liv:'alto',t:s.sospesi+' agenti sospesi automaticamente',d:'Superata la soglia di fallimento: non sono più installabili.',azione:'openPublishHealthPanel()',lab:'Apri salute pubblicazioni'});
  if(s.esecuzioni>=5&&s.tassoSuccesso<60)
    r.push({liv:'alto',t:'Tasso di successo al '+s.tassoSuccesso+'%',d:'Più di un\'esecuzione su tre non arriva a termine.',azione:"go('execlog')",lab:'Esamina i log'});
  if(s.agentiSenzaControlli.length)
    r.push({liv:'medio',t:s.agentiSenzaControlli.length+' agenti senza alcun controllo',d:'Nessun guardrail: output non verificato e dati non mascherati. '+s.agentiSenzaControlli.slice(0,3).join(', ')+(s.agentiSenzaControlli.length>3?'…':''),azione:"openPoliciesModal()",lab:'Rivedi le politiche'});
  if(!s.politicheAttive)
    r.push({liv:'medio',t:'Nessuna politica attiva',d:'La validazione non suggerisce controlli: ogni presidio dipende dalla sensibilità di chi costruisce.',azione:"openPoliciesModal()",lab:'Definisci le politiche'});
  if(s.agentiMaiUsati)
    r.push({liv:'basso',t:s.agentiMaiUsati+' agenti mai eseguiti',d:'Costruiti e abbandonati: valgono come segnale di adozione incompleta.',azione:"go('myagents')",lab:'Vedi gli agenti'});
  if(s.kbVuoti)
    r.push({liv:'medio',t:s.kbVuoti+' ricerche in Knowledge Base senza risultati',d:'I nodi avevano la KB attiva ma hanno risposto senza fonti: le risposte non sono fondate su documenti.',azione:"openKBDocsModal()",lab:'Verifica la Knowledge Base'});
  if(s.degradazioni)
    r.push({liv:'basso',t:s.degradazioni+' degradazioni di capacità',d:'Un fornitore non supportava una funzione richiesta: il comportamento è stato approssimato.',azione:null});
  if(s.cicliStrumenti)
    r.push({liv:'basso',t:s.cicliStrumenti+' cicli di strumenti interrotti',d:'Il modello ha richiesto lo stesso strumento con gli stessi argomenti: prompt da rivedere.',azione:null});
  if(!s.providerConfigurati.length)
    r.push({liv:'alto',t:'Nessun modello AI collegato',d:'I flussi che usano l\'AI non possono essere eseguiti.',azione:"go('builder')",lab:'Configura un provider'});
  return r;
}

// Scheda numerica semplice, per i valori che non meritano un grafico.
function govCard(icona,etichetta,valore,sotto,colore){
  return '<div class="stat-card" style="'+(colore?'border-left:3px solid '+colore:'')+'">'+
    '<div class="stat-label">'+icona+' '+etichetta+'</div>'+
    '<div class="stat-val">'+valore+'</div>'+
    '<div class="stat-change" style="color:var(--tx4)">'+(sotto||'')+'</div></div>';
}

// ── GRAFICI IN SVG ─────────────────────────────────────────────────────
// Disegnati a mano invece che con una libreria: una libreria di grafici
// andrebbe scaricata, e il vincolo di apertura da file locale non lo
// consente. In cambio si controlla ogni dettaglio dell'interazione.
//
// Interattività: ogni elemento che rappresenta dati reali risponde al
// passaggio del mouse con i valori esatti, e al click aprendo le righe che
// lo compongono. Un grafico da cui non si può scendere ai dati costringe a
// fidarsi, e in un cruscotto di governo la fiducia va verificata.

var GOV_PERIODO=14;   // giorni mostrati, modificabile dall'utente

function govColori(){
  return {ok:'#10B981',err:'#EF4444',warn:'#F59E0B',info:'#6366F1',neutro:'#94A3B8',viola:'#8B5CF6'};
}

// ── Suggerimento contestuale ──
// Un solo elemento riutilizzato da tutti i grafici: crearne uno per punto
// riempirebbe il DOM di nodi che esistono per un decimo di secondo.

// Il testo del suggerimento finisce dentro un letterale JavaScript, dentro un
// attributo HTML delimitato da virgolette doppie. Bastava una virgoletta nel
// contenuto — per esempio in style="color:..." — per chiudere l'attributo in
// anticipo e riversare il markup nel DOM: un punto del grafico diventava un
// elemento <br>. Qui si sfugge per entrambi i livelli, nell'ordine giusto.
function govAttr(html){
  return String(html)
    .replace(/\\/g, '\\\\')     // livello JavaScript: prima le barre inverse
    .replace(/'/g,  "\\'")      // poi gli apici, che delimitano il letterale
    .replace(/&/g,  '&amp;')    // livello HTML: prima la e commerciale
    .replace(/"/g,  '&quot;');  // poi le virgolette, che delimitano l'attributo
}
function govTip(testo,ev){
  var t=document.getElementById('govTooltip');
  if(!t){
    t=document.createElement('div');
    t.id='govTooltip';
    t.style.cssText='position:fixed;z-index:9000;pointer-events:none;background:#0F172A;color:#F1F5F9;'+
      'font-size:11px;line-height:1.5;padding:7px 10px;border-radius:8px;box-shadow:0 6px 20px rgba(15,23,42,.3);'+
      'max-width:260px;opacity:0;transition:opacity .12s';
    document.body.appendChild(t);
  }
  if(!testo){t.style.opacity='0';return}
  t.innerHTML=testo;
  t.style.opacity='1';
  var x=(ev.clientX||0)+14, y=(ev.clientY||0)-10;
  if(x+270>window.innerWidth)x=window.innerWidth-275;
  if(y<8)y=8;
  t.style.left=x+'px'; t.style.top=y+'px';
}
// ── Serie temporale con punti interrogabili ──
// L'area e la linea vivono in un SVG stirato in larghezza (preserveAspectRatio
// "none"): per una spezzata va benissimo. I PUNTI no — lo stiramento li
// trasformava in trattini orizzontali, perché un cerchio dentro un sistema di
// coordinate deformato diventa un'ellisse. Stanno quindi fuori dall'SVG, come
// elementi posizionati in percentuale: restano rotondi a qualsiasi larghezza e
// offrono un bersaglio più generoso al mouse.
function govAreaChart(dati, colore, altezza, alClick){
  altezza=altezza||86;
  var n=dati.length;
  if(!n) return '<div style="font-size:11px;color:var(--tx4);padding:12px 0">Nessun dato nel periodo</div>';

  var h=100, w=100;                       // coordinate interne, sempre normalizzate
  var max=Math.max.apply(null,dati.map(function(d){return d.n}).concat([1]));
  var passo=n>1?(w/(n-1)):0;
  var y=function(v){ return h-(v/max)*(h-12)-6 };   // margine sopra e sotto

  var xy=dati.map(function(d,i){ return {x:n>1?i*passo:w/2, y:y(d.n), d:d, i:i} });
  var linea=xy.map(function(p){return p.x.toFixed(2)+','+p.y.toFixed(2)}).join(' ');
  var area=(n>1)
    ? '0,'+h+' '+linea+' '+w+','+h
    : (w/2-4)+','+h+' '+linea+' '+(w/2+4)+','+h;
  var id='g'+Math.floor(Math.random()*999999);

  // Riferimenti orizzontali: senza, l'altezza di un picco non è confrontabile
  // con nulla e il grafico dice solo "sale" o "scende".
  var griglia=[0,0.5,1].map(function(f){
    return '<line x1="0" y1="'+y(max*f).toFixed(2)+'" x2="'+w+'" y2="'+y(max*f).toFixed(2)+
      '" stroke="var(--bo)" stroke-width="0.5" stroke-dasharray="2 2" vector-effect="non-scaling-stroke"/>';
  }).join('');

  var punti=xy.map(function(p){
    var tip='<strong>'+escHtml(p.d.l)+'</strong><br>'+p.d.n+' esecuzioni'+
            (p.d.ok?'<br>· '+p.d.ok+' riuscite':'')+
            (p.d.ko?'<br>· <span style="color:#FCA5A5">'+p.d.ko+' fallite</span>':'')+
            (p.d.stop?'<br>· '+p.d.stop+' interrotte':'')+
            (p.d.attesa?'<br>· '+p.d.attesa+' in attesa':'');
    var sx=n>1?(p.i/(n-1))*100:50;
    var sy=(p.y/h)*100;
    var pieno=p.d.n>0;
    return '<div style="position:absolute;left:'+sx.toFixed(3)+'%;top:'+sy.toFixed(3)+'%;'+
      'width:16px;height:16px;margin:-8px 0 0 -8px;display:grid;place-items:center;'+
      (alClick?'cursor:pointer;':'')+'" '+
      'onmousemove="govTip(\''+govAttr(tip)+'\',event);this.firstElementChild.style.transform=\'scale(1.6)\'" '+
      'onmouseleave="govTip(null);this.firstElementChild.style.transform=\'\'"'+
      (alClick?' onclick="'+alClick+'(\''+p.d.k+'\')"':'')+'>'+
      '<span style="width:'+(pieno?7:5)+'px;height:'+(pieno?7:5)+'px;border-radius:50%;'+
        'background:'+(pieno?colore:'var(--bg3)')+';border:1.5px solid var(--card);'+
        'box-shadow:0 0 0 1px '+(pieno?colore:'var(--bo)')+';transition:transform .12s;display:block"></span>'+
    '</div>';
  }).join('');

  return '<div style="position:relative;height:'+altezza+'px">'+
    '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" '+
      'style="position:absolute;inset:0;width:100%;height:100%;display:block">'+
      '<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1">'+
        '<stop offset="0" stop-color="'+colore+'" stop-opacity=".30"/>'+
        '<stop offset="1" stop-color="'+colore+'" stop-opacity="0"/></linearGradient></defs>'+
      griglia+
      '<polygon points="'+area+'" fill="url(#'+id+')"/>'+
      '<polyline points="'+linea+'" fill="none" stroke="'+colore+'" stroke-width="2" '+
        'stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>'+
    '</svg>'+
    // Il valore massimo va scritto: la griglia da sola non dice quanto vale.
    '<div style="position:absolute;top:0;left:0;font-size:9.5px;color:var(--tx4);'+
      'background:var(--card);padding:0 4px;border-radius:3px">max '+max+'</div>'+
    punti+
  '</div>';
}

// ── Colonne impilate: esito giorno per giorno ──
// L'andamento totale non dice se la crescita sia fatta di successi o di
// fallimenti. Qui le due cose si vedono insieme.
function govColonneImpilate(dati){
  if(!dati.length) return '<div style="font-size:11px;color:var(--tx4)">Nessun dato</div>';
  var max=Math.max.apply(null,dati.map(function(d){return d.n}).concat([1]));
  var col=govColori();
  // Le colonne si dividono la larghezza disponibile invece di avere una misura
  // fissa calcolata su un box di 680px: in un riquadro più stretto restava
  // metà spazio vuoto a destra, e il grafico sembrava tagliato.
  // Anche lo spazio fra colonne si adatta: su 90 giorni un distacco fisso di
  // 3px somma 267px di soli vuoti e fa debordare il riquadro.
  var gap=dati.length>60?1:dati.length>30?2:3;
  return '<div style="display:flex;align-items:flex-end;gap:'+gap+'px;height:150px;padding-top:6px">'+
    dati.map(function(d){
      var hTot=Math.max(2,Math.round(d.n/max*134));
      var parti=[{n:d.ok,c:col.ok,l:'riuscite'},{n:d.ko,c:col.err,l:'fallite'},
                 {n:d.stop,c:col.neutro,l:'interrotte'},{n:d.attesa,c:col.warn,l:'in attesa'}];
      var tip='<strong>'+escHtml(d.l)+'</strong><br>'+d.n+' esecuzioni'+
              parti.filter(function(p){return p.n}).map(function(p){
                return '<br>· '+p.n+' '+p.l;
              }).join('');
      return '<div style="flex:1;min-width:2px;display:flex;flex-direction:column;justify-content:flex-end;height:100%;cursor:pointer" '+
        'onmousemove="govTip(\''+govAttr(tip)+'\',event)" onmouseleave="govTip(null)" '+
        'onclick="govDettaglioGiorno(\''+d.k+'\')">'+
        (d.n?parti.filter(function(p){return p.n}).map(function(p){
          return '<div style="height:'+Math.max(2,Math.round(p.n/d.n*hTot))+'px;background:'+p.c+'"></div>';
        }).join(''):'<div style="height:2px;background:var(--bg3)"></div>')+
      '</div>';
    }).join('')+'</div>';
}

// ── Mappa di calore: quando si lavora davvero ──
// Le esecuzioni distribuite per giorno della settimana e fascia oraria: dice
// se la piattaforma è usata nel lavoro quotidiano o solo a colpi isolati.
function govHeatmap(griglia){
  var giorni=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  var fasce=['00-04','04-08','08-12','12-16','16-20','20-24'];
  var max=1;
  griglia.forEach(function(r){r.forEach(function(v){if(v>max)max=v})});
  var tot=griglia.reduce(function(a,r){return a+r.reduce(function(x,y){return x+y},0)},0);
  if(!tot) return '<div style="font-size:11px;color:var(--tx4)">Nessuna esecuzione da distribuire</div>';
  return '<div style="display:grid;grid-template-columns:34px repeat(6,1fr);gap:3px;font-size:9.5px">'+
    '<div></div>'+fasce.map(function(f){return '<div style="text-align:center;color:var(--tx4)">'+f+'</div>'}).join('')+
    giorni.map(function(g,gi){
      return '<div style="color:var(--tx4);line-height:22px">'+g+'</div>'+
        fasce.map(function(f,fi){
          var v=griglia[gi][fi];
          var op=v?(0.18+0.82*(v/max)):0;
          return '<div style="height:22px;border-radius:4px;background:'+(v?'rgba(99,102,241,'+op.toFixed(2)+')':'var(--bg3)')+';'+
            'cursor:'+(v?'pointer':'default')+'" '+
            (v?'onmousemove="govTip(\'<strong>'+g+' '+f+'</strong><br>'+v+' esecuzioni\',event)" onmouseleave="govTip(null)"':'')+
            '></div>';
        }).join('');
    }).join('')+
  '</div>';
}

// ── Anello interattivo ──
function govDonut(voci, dimensione, alClick){
  var d=dimensione||130, r=48, cx=60, cy=60, circ=2*Math.PI*r;
  var tot=voci.reduce(function(a,v){return a+v.n},0);
  if(!tot) return '<div style="font-size:11px;color:var(--tx4)">Nessun dato da rappresentare</div>';
  var off=0, archi='';
  voci.forEach(function(v){
    if(!v.n) return;
    var fr=v.n/tot;
    var tip='<strong>'+escHtml(v.l)+'</strong><br>'+v.n+' su '+tot+' ('+Math.round(fr*100)+'%)';
    archi+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+v.c+'" stroke-width="16" '+
      'stroke-dasharray="'+(fr*circ).toFixed(2)+' '+circ.toFixed(2)+'" '+
      'stroke-dashoffset="'+(-off*circ).toFixed(2)+'" transform="rotate(-90 '+cx+' '+cy+')" '+
      'style="cursor:'+(alClick?'pointer':'default')+';transition:stroke-width .15s" '+
      'onmousemove="govTip(\''+govAttr(tip)+'\',event);this.setAttribute(\'stroke-width\',\'19\')" '+
      'onmouseleave="govTip(null);this.setAttribute(\'stroke-width\',\'16\')"'+
      (alClick&&v.k?' onclick="'+alClick+'(\''+v.k+'\')"':'')+'></circle>';
    off+=fr;
  });
  return '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">'+
    '<svg viewBox="0 0 120 120" style="width:'+d+'px;height:'+d+'px;flex-shrink:0">'+
      '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="var(--bg3)" stroke-width="16"/>'+
      archi+
      '<text x="'+cx+'" y="'+(cy-2)+'" text-anchor="middle" font-size="22" font-weight="800" fill="var(--tx)">'+tot+'</text>'+
      '<text x="'+cx+'" y="'+(cy+14)+'" text-anchor="middle" font-size="9" fill="var(--tx4)">totale</text>'+
    '</svg>'+
    '<div style="flex:1;min-width:150px">'+voci.filter(function(v){return v.n}).map(function(v){
      return '<div style="display:flex;align-items:center;gap:7px;font-size:11.5px;padding:3px 0;'+
        (alClick&&v.k?'cursor:pointer" onclick="'+alClick+'(\''+v.k+'\')"':'"')+'>'+
        '<span style="width:9px;height:9px;border-radius:2px;background:'+v.c+';flex-shrink:0"></span>'+
        '<span style="flex:1">'+escHtml(v.l)+'</span><strong>'+v.n+'</strong>'+
        '<span style="color:var(--tx4);width:38px;text-align:right">'+Math.round(v.n/tot*100)+'%</span></div>';
    }).join('')+'</div></div>';
}

// ── Barre orizzontali interrogabili ──
function govBarreOrizzontali(voci, alClick){
  if(!voci.length) return '<div style="font-size:11px;color:var(--tx4)">Nessun dato</div>';
  var max=Math.max.apply(null,voci.map(function(v){return v.n}).concat([1]));
  return voci.map(function(v){
    var tip=v.tip||('<strong>'+escHtml(v.l)+'</strong><br>'+v.n);
    return '<div style="display:flex;align-items:center;gap:10px;font-size:11.5px;padding:4px 0;border-radius:6px;'+
      (alClick&&v.k?'cursor:pointer" onclick="'+alClick+'(\''+govAttr(v.k)+'\')"':'"')+' '+
      'onmousemove="govTip(\''+govAttr(tip)+'\',event)" onmouseleave="govTip(null)">'+
      '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escHtml(v.l)+'</span>'+
      (v.nota?'<span style="color:var(--tx4);font-size:10.5px;white-space:nowrap">'+escHtml(v.nota)+'</span>':'')+
      '<div style="width:130px;height:7px;background:var(--bg3);border-radius:4px;overflow:hidden;flex-shrink:0">'+
        '<div style="height:100%;width:'+Math.round(v.n/max*100)+'%;background:'+(v.c||'var(--ac)')+';border-radius:4px"></div></div>'+
      '<strong style="width:36px;text-align:right;flex-shrink:0">'+v.n+'</strong></div>';
  }).join('');
}

function govGauge(pct, etichetta, soglia){
  var col=pct>=(soglia||70)?'#10B981':pct>=(soglia||70)/2?'#F59E0B':'#EF4444';
  var r=42, circ=Math.PI*r;
  var q=Math.max(0,Math.min(100,pct));
  return '<div style="text-align:center">'+
    '<svg viewBox="0 0 120 70" style="width:210px;height:124px;max-width:100%">'+
      '<path d="M12,60 A'+r+','+r+' 0 0 1 108,60" fill="none" stroke="var(--bg3)" stroke-width="12" stroke-linecap="round"/>'+
      '<path d="M12,60 A'+r+','+r+' 0 0 1 108,60" fill="none" stroke="'+col+'" stroke-width="12" stroke-linecap="round" '+
        'stroke-dasharray="'+(q/100*circ).toFixed(2)+' '+circ.toFixed(2)+'"/>'+
      '<text x="60" y="52" text-anchor="middle" font-size="21" font-weight="800" fill="'+col+'">'+q+'%</text>'+
    '</svg>'+
    '<div style="font-size:11px;color:var(--tx3);margin-top:-8px">'+escHtml(etichetta)+'</div></div>';
}

// ── Imbuto della pubblicazione ──
// Gli stati non sono categorie parallele: sono passaggi in sequenza, e
// l'imbuto mostra dove il flusso si ferma.
function govImbuto(fasi){
  var max=Math.max.apply(null,fasi.map(function(f){return f.n}).concat([1]));
  return fasi.map(function(f,i){
    var w=Math.max(8,Math.round(f.n/max*100));
    var perso=i>0?fasi[i-1].n-f.n:0;
    return '<div style="margin-bottom:5px" onmousemove="govTip(\'<strong>'+escHtml(f.l)+'</strong><br>'+f.n+' agenti'+
      (perso>0?'<br>'+perso+' non sono arrivati qui':'')+'\',event)" onmouseleave="govTip(null)">'+
      '<div style="display:flex;align-items:center;gap:9px;font-size:11.5px">'+
        '<span style="width:118px;flex-shrink:0">'+f.ic+' '+escHtml(f.l)+'</span>'+
        '<div style="flex:1;height:20px;background:var(--bg3);border-radius:5px;overflow:hidden">'+
          '<div style="height:100%;width:'+w+'%;background:'+f.c+';border-radius:5px;display:flex;align-items:center;'+
            'padding-left:8px;color:#fff;font-size:10.5px;font-weight:700">'+(f.n||'')+'</div></div>'+
        (perso>0?'<span style="font-size:10px;color:#EF4444;width:34px">−'+perso+'</span>':'<span style="width:34px"></span>')+
      '</div></div>';
  }).join('');
}

// ── QUERY PER I GRAFICI ────────────────────────────────────────────────

function govSerieGiornaliera(giorni){
  giorni=giorni||GOV_PERIODO;
  var oggi=new Date(); oggi.setHours(0,0,0,0);
  var out=[];
  for(var i=giorni-1;i>=0;i--){
    var g=new Date(oggi.getTime()-i*86400000);
    var k=g.toISOString().substring(0,10);
    var r=dbGetOne("SELECT COUNT(*) n, SUM(CASE WHEN status='err' THEN 1 ELSE 0 END) ko, "+
      "SUM(CASE WHEN status='ok' THEN 1 ELSE 0 END) ok, "+
      "SUM(CASE WHEN status='aborted' THEN 1 ELSE 0 END) stop, "+
      "SUM(CASE WHEN status='waiting' THEN 1 ELSE 0 END) attesa "+
      "FROM exec_log WHERE substr(ts,1,10)=?",[k]);
    out.push({k:k, l:k.substring(8,10)+'/'+k.substring(5,7),
      n:(r&&r.n)||0, ok:(r&&r.ok)||0, ko:(r&&r.ko)||0, stop:(r&&r.stop)||0, attesa:(r&&r.attesa)||0});
  }
  return out;
}

// Griglia 7 giorni × 6 fasce da quattro ore.
function govGrigliaOraria(){
  var g=[];for(var i=0;i<7;i++)g.push([0,0,0,0,0,0]);
  dbAll('SELECT ts FROM exec_log').forEach(function(r){
    var d=new Date(r.ts);
    if(isNaN(d))return;
    var giorno=(d.getDay()+6)%7;              // lunedì = 0
    var fascia=Math.min(5,Math.floor(d.getHours()/4));
    g[giorno][fascia]++;
  });
  return g;
}

// Distribuzione delle durate: la media nasconde i casi lenti, che sono
// quelli che poi generano le lamentele.
function govDistribuzioneDurate(){
  var soglie=[[0,1000,'< 1s'],[1000,3000,'1-3s'],[3000,6000,'3-6s'],[6000,12000,'6-12s'],[12000,1e9,'> 12s']];
  return soglie.map(function(s){
    var r=dbGetOne('SELECT COUNT(*) c FROM exec_log WHERE duration>=? AND duration<?',[s[0],s[1]]);
    return {l:s[2],n:(r&&r.c)||0,c:'#8B5CF6',k:'durata:'+s[0]+'-'+s[1]};
  });
}

function govPerUtente(){
  var m={};
  dbAll("SELECT user, COUNT(*) c FROM exec_log WHERE user IS NOT NULL GROUP BY user").forEach(function(r){
    m[r.user]=m[r.user]||{esec:0,agenti:0}; m[r.user].esec=r.c;
  });
  dbAll("SELECT author, COUNT(*) c FROM agents WHERE author IS NOT NULL GROUP BY author").forEach(function(r){
    m[r.author]=m[r.author]||{esec:0,agenti:0}; m[r.author].agenti=r.c;
  });
  return Object.keys(m).map(function(u){
    return {l:u,n:m[u].esec,k:'utente:'+u,c:'#0EA5E9',
      nota:m[u].agenti+' agenti',
      tip:'<strong>'+escHtml(u)+'</strong><br>'+m[u].esec+' esecuzioni<br>'+m[u].agenti+' agenti creati'};
  }).sort(function(a,b){return b.n-a.n});
}

// ── APPROFONDIMENTO SUI DATI ───────────────────────────────────────────
// Ogni grafico è cliccabile e apre le righe che lo compongono. Senza questo,
// un numero anomalo resta un numero anomalo e basta.
function govDettaglioGiorno(k){ govDrill("substr(ts,1,10)='"+k+"'", 'Esecuzioni del '+k.split('-').reverse().join('/')) }
function govDettaglioEsito(k){
  var etichette={ok:'riuscite',err:'fallite',aborted:'interrotte',waiting:'in attesa'};
  govDrill("status='"+k+"'", 'Esecuzioni '+(etichette[k]||k));
}
function govDettaglioAgente(k){ govDrill("agent='"+String(k).replace(/'/g,"''")+"'", 'Esecuzioni di «'+k+'»') }
function govDettaglioVario(k){
  var p=String(k).split(':');
  if(p[0]==='utente') return govDrill("user='"+p[1].replace(/'/g,"''")+"'", 'Esecuzioni di '+p[1]);
  if(p[0]==='durata'){
    var r=p[1].split('-');
    return govDrill('duration>='+r[0]+' AND duration<'+r[1], 'Esecuzioni fra '+(r[0]/1000)+'s e '+(r[1]>1e8?'oltre':(r[1]/1000)+'s'));
  }
  if(p[0]==='modo') return govDrill("mode='"+p[1]+"'", 'Esecuzioni in modalità '+p[1]);
}

function govDrill(dove, titolo){
  var righe=dbAll('SELECT id,agent,status,duration,mode,user,summary,ts FROM exec_log WHERE '+dove+' ORDER BY id DESC LIMIT 40');
  var badge={ok:['badge-g','✅ OK'],err:['badge-r','❌ Errore'],aborted:['badge-gray','⏹️ Interrotta'],waiting:['badge-p','⏸️ In attesa']};
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>🔎 '+escHtml(titolo)+'</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:8px 0 14px">'+righe.length+' esecuzioni'+(righe.length===40?' (mostrate le 40 più recenti)':'')+'. Clicca una riga per il dettaglio completo.</p>'+
    (righe.length?righe.map(function(l){
      var b=badge[l.status]||['badge-gray',l.status];
      return '<div class="validation-item" style="background:var(--bg2);border-color:var(--bo);cursor:pointer;align-items:center" onclick="closeModal();openExecLogDetail('+l.id+')">'+
        '<span class="badge '+b[0]+'" style="flex-shrink:0">'+b[1]+'</span>'+
        '<div class="vi-msg" style="flex:1;min-width:0">'+
          '<div style="font-weight:600">'+escHtml(l.agent||'—')+'</div>'+
          '<div style="font-size:10px;color:var(--tx4);margin-top:2px">'+
            new Date(l.ts).toLocaleString('it-IT')+' · '+escHtml(l.mode||'—')+' · '+
            (l.duration>1000?(l.duration/1000).toFixed(1)+'s':l.duration+'ms')+
            (l.user?' · '+escHtml(l.user):'')+'</div>'+
          (l.summary?'<div style="font-size:10.5px;color:var(--tx3);margin-top:3px">'+escHtml(String(l.summary).substring(0,140))+'</div>':'')+
        '</div></div>';
    }).join(''):'<div style="text-align:center;padding:30px;color:var(--tx4);font-size:13px">Nessuna esecuzione corrisponde</div>')
  ,true);
}

function govCambiaPeriodo(g){
  GOV_PERIODO=parseInt(g,10)||14;
  renderMonitoraggio();
}

// ── APPROFONDIMENTI IN PAROLE ──────────────────────────────────────────
function govInsights(s,serie){
  var out=[];
  var meta=Math.floor(serie.length/2);
  var somma=function(a){return a.reduce(function(x,y){return x+y.n},0)};
  var primaMeta=somma(serie.slice(0,meta)), secondaMeta=somma(serie.slice(meta));

  if(primaMeta||secondaMeta){
    if(secondaMeta>primaMeta*1.3)
      out.push({ic:'📈',t:'Uso in crescita',d:'Nella seconda metà del periodo le esecuzioni sono passate da '+primaMeta+' a '+secondaMeta+': l\'adozione sta accelerando.'});
    else if(primaMeta>secondaMeta*1.3)
      out.push({ic:'📉',t:'Uso in calo',d:'Le esecuzioni sono scese da '+primaMeta+' a '+secondaMeta+': vale la pena capire se un flusso si è rotto o se è cambiato il processo.'});
    else
      out.push({ic:'➖',t:'Uso stabile',d:primaMeta+' esecuzioni nella prima metà del periodo, '+secondaMeta+' nella seconda: nessuna variazione significativa.'});
  }

  var giorniAttivi=serie.filter(function(d){return d.n}).length;
  if(serie.length&&giorniAttivi)
    out.push({ic:'📅',t:'Continuità d\'uso',d:'La piattaforma è stata usata in '+giorniAttivi+' giorni su '+serie.length+
      (giorniAttivi/serie.length<0.4?': un uso a episodi, non ancora quotidiano.':': un uso regolare.')});

  if(s.concentrazione>=70&&s.agentePiuUsato)
    out.push({ic:'🎯',t:'Dipendenza da un solo caso d\'uso',d:'Il '+s.concentrazione+'% delle esecuzioni fa capo a «'+s.agentePiuUsato+'». Se quell\'agente si ferma, si ferma quasi tutta la piattaforma.'});
  else if(s.concentrazione&&s.concentrazione<40)
    out.push({ic:'🌐',t:'Uso distribuito',d:'Nessun agente supera il '+s.concentrazione+'% delle esecuzioni: la piattaforma regge su più casi d\'uso, non su uno solo.'});

  if(s.agenti&&s.agentiMaiUsati/s.agenti>=0.4)
    out.push({ic:'🗃️',t:'Molti agenti costruiti e mai usati',d:s.agentiMaiUsati+' agenti su '+s.agenti+' non sono mai stati eseguiti. Costruire è facile, adottare no: è lì che l\'adozione si perde.'});

  if(s.coperturaControlli>=70)
    out.push({ic:'🛡️',t:'Presidio applicato',d:'Il '+s.coperturaControlli+'% degli agenti ha almeno un controllo: la governance non è solo disponibile, viene usata.'});
  else if(s.agenti)
    out.push({ic:'⚠️',t:'Presidio disomogeneo',d:'Solo il '+s.coperturaControlli+'% degli agenti ha un controllo. Gli altri passano l\'output del modello senza verifiche.'});

  if(s.kbRecuperi&&s.kbVuoti)
    out.push({ic:'🕳️',t:'Recuperi a vuoto',d:s.kbVuoti+' ricerche su '+(s.kbRecuperi+s.kbVuoti)+' non hanno trovato fonti. Quelle risposte non sono fondate su documenti, pur sembrandolo.'});
  else if(s.kbRecuperi)
    out.push({ic:'📚',t:'Conoscenza usata',d:s.kbRecuperi+' risposte fondate su documenti aziendali, nessun recupero a vuoto.'});

  if(s.durataMedia>6000)
    out.push({ic:'🐌',t:'Esecuzioni lente',d:'Durata media '+(s.durataMedia/1000).toFixed(1)+'s. Sopra i sei secondi un flusso interattivo comincia a pesare su chi lo aspetta.'});

  if(s.esecuzioniStop)
    out.push({ic:'⏹️',t:'Interruzioni volontarie',d:s.esecuzioniStop+' esecuzioni fermate dall\'utente. Non sono fallimenti e non entrano nel tasso di successo.'});

  if(s.esecuzioniAttesa)
    out.push({ic:'✋',t:'In attesa di una persona',d:s.esecuzioniAttesa+' esecuzioni ferme su un\'approvazione umana. Sono presidio che funziona, ma anche tempo che qualcuno deve dedicare.'});

  return out;
}

function govKpi(icona, etichetta, valore, delta, versoBuono, sotto){
  var f='';
  if(delta!==null&&delta!==undefined&&delta!==0){
    var su=delta>0, buono=versoBuono==='giu'?!su:su;
    f='<span style="font-size:11px;font-weight:700;color:'+(buono?'#10B981':'#EF4444')+'">'+(su?'▲':'▼')+' '+Math.abs(delta)+'</span>';
  }else if(delta===0){ f='<span style="font-size:11px;color:var(--tx4)">invariato</span>' }
  return '<div class="stat-card">'+
    '<div class="stat-label">'+icona+' '+etichetta+'</div>'+
    '<div style="display:flex;align-items:baseline;gap:8px"><div class="stat-val">'+valore+'</div>'+f+'</div>'+
    '<div class="stat-change" style="color:var(--tx4)">'+(sotto||'')+'</div></div>';
}

// Le aree del cruscotto: i riquadri c'erano gia', ma erano una sequenza di
// coppie senza nome, e chi guardava doveva ricostruire da solo perche' due
// grafici stessero vicini.
//
// I nomi e l'ordine sono quelli dichiarati nel Capitolo 3 §3.5.4 della tesi:
// il documento elencava sette aree che nella pagina non esistevano. Allineare
// la pagina al documento costa meno che correggere il documento, e rende quel
// paragrafo verificabile invece che da prendere per buono.
var GOV_AREE=[
  ['Popolazione',                'Utenti distinti e indicatori medi per utente'],
  ['Adozione',                   'Agenti creati e utilizzati, installazioni e modalita\u0300 di avvio'],
  ['Uso',                        'Esecuzioni, esiti, tasso di successo, durata media e andamento recente'],
  ['Presidio',                   'Copertura dei controlli, politiche attive, approvazioni, blocchi ed errori gestiti'],
  ['Modelli',                    'Chiamate al modello, strumenti invocati, fornitori e distribuzione'],
  ['Conoscenza',                 'Documenti caricati, porzioni indicizzate, recuperi riusciti e a vuoto'],
  ['Pubblicazione e apprendimento','Stato del ciclo di vita degli agenti, revisioni e avanzamento formativo']
];
function govArea(n){
  var a=GOV_AREE[n-1];
  return '<div class="section-title" style="font-size:14px;margin:24px 0 2px">'+
      '<span style="color:var(--tx4);font-weight:600">'+n+'/7</span> '+a[0]+'</div>'+
    '<div class="section-sub" style="margin-bottom:10px">'+a[1]+'</div>';
}
function govRiquadro(titolo,sottotitolo,corpo,piede){
  return '<div class="card" style="padding:16px">'+
    '<div style="font-size:12.5px;font-weight:700">'+titolo+'</div>'+
    (sottotitolo?'<div style="font-size:10.5px;color:var(--tx4);margin:2px 0 10px">'+sottotitolo+'</div>':'<div style="height:10px"></div>')+
    corpo+
    (piede?'<div style="font-size:10.5px;color:var(--tx4);margin-top:10px;border-top:1px solid var(--bo);padding-top:8px">'+piede+'</div>':'')+
  '</div>';
}

function renderMonitoraggio(){
  var el=document.getElementById('monitoraggio-body');
  if(!el)return;
  var s=govStats();
  var rischi=govRischi(s);
  var serie=govSerieGiornaliera(GOV_PERIODO);
  var col=govColori();

  var meta=Math.floor(serie.length/2);
  var somma=function(a){return a.reduce(function(x,y){return x+y.n},0)};
  var esecPrima=somma(serie.slice(0,meta)), esecDopo=somma(serie.slice(meta));
  var totPeriodo=esecPrima+esecDopo;

  var h='';

  // ── Selettore di periodo ──
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">'+
     '<span style="font-size:11px;color:var(--tx3);font-weight:600">Periodo osservato:</span>'+
     [7,14,30,90].map(function(g){
       var att=g===GOV_PERIODO;
       return '<span onclick="govCambiaPeriodo('+g+')" style="font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;cursor:pointer;'+
         (att?'background:var(--ac2-l);color:var(--ac2)':'color:var(--tx4);border:1px solid var(--bo)')+'">'+g+' giorni</span>';
     }).join('')+
     '<span style="flex:1"></span>'+
     '<span style="font-size:10.5px;color:var(--tx4)">💡 Passa sopra i grafici per i valori, clicca per le righe</span>'+
    '</div>';

  // ── KPI ──
  h+='<div class="stats-row">'+
      govKpi('▶️','Esecuzioni ('+GOV_PERIODO+' gg)',totPeriodo,esecDopo-esecPrima,'su','ultimi '+(serie.length-meta)+' giorni: '+esecDopo)+
      govKpi('✅','Tasso di successo',s.tassoSuccesso+'%',null,'su',s.esecuzioniOk+' riuscite su '+s.esecuzioni)+
      govKpi('🤖','Agenti attivi',s.agentiEseguiti,null,'su','su '+s.agenti+' creati · media '+s.mediaAgenti+'/utente')+
      govKpi('⏱️','Durata media',(s.durataMedia>1000?(s.durataMedia/1000).toFixed(1)+'s':s.durataMedia+'ms'),null,'giu','per esecuzione')+
    '</div>';

  // ── Segnali ──
  if(rischi.length){
    h+='<div class="section-title" style="font-size:15px;margin:22px 0 2px">⚠️ Richiede attenzione</div>'+
       '<div class="section-sub">'+rischi.length+' segnali rilevati sui dati reali.</div>'+
       rischi.map(function(r){
      var c=r.liv==='alto'?'#EF4444':r.liv==='medio'?'#F59E0B':'#94A3B8';
      return '<div class="card" style="padding:11px 14px;margin-bottom:8px;border-left:3px solid '+c+'">'+
        '<div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">'+
          '<div style="flex:1"><div style="font-size:12.5px;font-weight:700">'+escHtml(r.t)+'</div>'+
          '<div style="font-size:11px;color:var(--tx3);margin-top:2px;line-height:1.5">'+escHtml(r.d)+'</div></div>'+
          (r.azione?'<button class="tb-btn" style="font-size:11px;flex-shrink:0" onclick="'+r.azione+'">'+escHtml(r.lab)+'</button>':'')+
        '</div></div>';
    }).join('');
  }else{
    h+='<div class="card" style="padding:14px;margin:22px 0 6px;border-left:3px solid #10B981">'+
       '<div style="font-size:12.5px;font-weight:700">✅ Nessun segnale di rischio</div>'+
       '<div style="font-size:11px;color:var(--tx3);margin-top:2px">Nessuna sospensione, copertura dei controlli adeguata, esecuzioni entro le soglie.</div></div>';
  }

  // ── Area 1 · Popolazione ──
  h+=govArea(1)+
    govRiquadro('Attività per utente','Totale a confronto con la media: dice se l\'uso è diffuso o concentrato',
      govBarreOrizzontali(govPerUtente(),'govDettaglioVario'),
      'Media: '+s.mediaAgenti+' agenti e '+s.mediaEsecuzioni+' esecuzioni a testa');

  // ── Area 2 · Adozione ──
  h+=govArea(2)+
    '<div class="grid-2">'+
      govRiquadro('Agenti più eseguiti','Clicca per vedere le esecuzioni di ciascuno',
        govBarreOrizzontali(s.classificaAgenti.map(function(a){
          return {l:a.agent||'—',n:a.c,k:a.agent,nota:a.ko?a.ko+' ko':'',c:a.ko?'#F59E0B':'var(--ac)',
                  tip:'<strong>'+escHtml(a.agent||'—')+'</strong><br>'+a.c+' esecuzioni'+(a.ko?'<br><span style="color:#FCA5A5">'+a.ko+' fallite</span>':'')};
        }),'govDettaglioAgente'))+
      govRiquadro('Modalità di esecuzione','Da dove partono davvero i flussi',
        govBarreOrizzontali(s.perModalita.map(function(m){
          var et={builder:'Dal Builder',scheduled:'Pianificata',replay:'Riesecuzione'};
          return {l:et[m.mode]||m.mode||'—',n:m.c,k:'modo:'+m.mode,c:'#14B8A6'};
        }),'govDettaglioVario'),
        'Le esecuzioni pianificate girano senza nessuno davanti: i loro errori si scoprono qui.')+
    '</div>';

  // ── Area 3 · Uso ──
  h+=govArea(3)+
    '<div class="grid-2">'+
      govRiquadro('Andamento delle esecuzioni',
        totPeriodo+' nel periodo · '+(esecDopo>=esecPrima?'in crescita':'in calo')+' rispetto alla prima metà',
        govAreaChart(serie,'#6366F1',150,'govDettaglioGiorno')+
        '<div style="display:flex;justify-content:space-between;font-size:9.5px;color:var(--tx4);margin-top:4px">'+
          '<span>'+serie[0].l+'</span><span>'+serie[serie.length-1].l+'</span></div>')+
      govRiquadro('Esito delle esecuzioni','Clicca una fetta per vedere quelle esecuzioni',
        govDonut([
          {l:'Riuscite',n:s.esecuzioniOk,c:col.ok,k:'ok'},
          {l:'Fallite',n:s.esecuzioniKo,c:col.err,k:'err'},
          {l:'Interrotte',n:s.esecuzioniStop,c:col.neutro,k:'aborted'},
          {l:'In attesa',n:s.esecuzioniAttesa,c:col.warn,k:'waiting'}
        ],170,'govDettaglioEsito'))+
    '</div>'+
    '<div class="grid-2" style="margin-top:16px">'+
      govRiquadro('Esito giorno per giorno',
        'L\'andamento totale non dice se la crescita sia fatta di successi o di fallimenti',
        govColonneImpilate(serie))+
      govRiquadro('Quando viene usata',
        'Distribuzione per giorno della settimana e fascia oraria',
        govHeatmap(govGrigliaOraria()))+
    '</div>'+
    '<div style="margin-top:16px">'+
      govRiquadro('Distribuzione delle durate',
        'La media nasconde i casi lenti, che sono quelli che generano le lamentele',
        govBarreOrizzontali(govDistribuzioneDurate(),'govDettaglioVario'))+
    '</div>';

  // ── Area 4 · Presidio ──
  h+=govArea(4)+
    '<div class="card" style="padding:16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">'+
      govGauge(s.coperturaControlli,'Agenti con almeno un controllo',70)+
      '<div style="flex:1;min-width:170px;font-size:11.5px;line-height:1.75">'+
        '<div>📜 Politiche attive <strong>'+s.politicheAttive+'</strong>'+(s.politicheImposte?' ('+s.politicheImposte+' obbligatorie)':'')+'</div>'+
        '<div>🎭 Mascheramenti <strong>'+s.mascheramenti+'</strong></div>'+
        '<div>✋ Approvazioni umane <strong>'+s.approvazioni+'</strong></div>'+
        '<div>⛔ Bloccate da un controllo <strong>'+s.bloccatiDaControlli+'</strong></div>'+
        '<div>🧯 Guasti assorbiti <strong>'+s.erroriAssorbiti+'</strong></div>'+
      '</div>'+
    '</div>';

  // ── Area 5 · Modelli ──
  h+=govArea(5)+
    govRiquadro('Nodi AI per fornitore',
      'Su cosa poggia davvero la piattaforma, non cosa è stato configurato una volta',
      govBarreOrizzontali(s.nodiPerModello.map(function(m){
        return {l:providerLabel(m.modello),n:m.n,c:'#6366F1'};
      })),
      'Collegati: <strong>'+(s.providerConfigurati.length?s.providerConfigurati.map(providerLabel).join(', '):'nessuno')+
      '</strong> · degradazioni '+s.degradazioni+' · strumenti invocati '+s.strumentiInvocati+
      (s.cicliStrumenti?' · cicli interrotti '+s.cicliStrumenti:''));

  // ── Area 6 · Conoscenza ──
  h+=govArea(6)+
    govRiquadro('Uso della Knowledge Base','Quanto è usata, non quanto è grande',
      govDonut([
        {l:'Recuperi riusciti',n:s.kbRecuperi,c:col.ok},
        {l:'Recuperi a vuoto',n:s.kbVuoti,c:col.warn}
      ],110),
      s.kbDocumenti+' documenti · '+s.kbPorzioni+' porzioni indicizzate · '+s.kbDaAgenti+' prodotti dagli agenti');

  // ── Area 7 · Pubblicazione e apprendimento ──
  var perStato={};
  s.perStato.forEach(function(p){perStato[p.status]=p.c});
  var totPub=s.perStato.reduce(function(a,p){return a+p.c},0);
  h+=govArea(7)+
    govRiquadro('Percorso di pubblicazione','Gli stati sono passaggi in sequenza: l\'imbuto mostra dove ci si ferma',
      govImbuto([
        {ic:'📝',l:'Bozza',       n:totPub,                                   c:'#94A3B8'},
        {ic:'🔍',l:'In verifica', n:(perStato.in_verifica||0)+(perStato.in_revisione||0)+(perStato.pubblicato||0)+(perStato.sospeso||0), c:'#F59E0B'},
        {ic:'✅',l:'Pubblicato',  n:(perStato.pubblicato||0)+(perStato.sospeso||0), c:'#10B981'},
        {ic:'⏸️',l:'Sospeso',     n:(perStato.sospeso||0),                    c:'#EF4444'}
      ]))+
    '<div class="stats-row" style="margin-top:16px">'+
      govCard('🕐','In attesa di revisione',s.inAttesaRevisione,'bloccano la diffusione',s.inAttesaRevisione?'#F59E0B':'')+
      govCard('📦','Installati dal catalogo',s.installati,'riuso invece di ricostruzione')+
      govCard('🎓','Lezioni completate',s.lezioniFatte,s.quizSuperati+' quiz superati')+
      govCard('🏆','Iscrizioni a sfide',s.sfideIscritte,'partecipazione alle iniziative')+
    '</div>';

  // ── Approfondimenti ──
  var ins=govInsights(s,serie);
  if(ins.length){
    h+='<div class="section-title" style="font-size:15px;margin:24px 0 2px">💡 Cosa dicono questi numeri</div>'+
       '<div class="section-sub">Osservazioni ricavate dagli stessi dati, non da soglie predefinite.</div>'+
       '<div class="grid-2">'+ins.map(function(i){
      return '<div class="card" style="padding:13px 15px">'+
        '<div style="font-size:12.5px;font-weight:700">'+i.ic+' '+escHtml(i.t)+'</div>'+
        '<div style="font-size:11.5px;color:var(--tx3);margin-top:3px;line-height:1.55">'+escHtml(i.d)+'</div></div>';
    }).join('')+'</div>';
  }

  // ── Limite dichiarato ──
  h+='<div class="card" style="padding:14px;margin-top:24px;border-left:3px solid var(--tx4)">'+
     '<div style="font-size:12px;font-weight:700">Cosa questo cruscotto non può dirti</div>'+
     '<div style="font-size:11px;color:var(--tx3);margin-top:4px;line-height:1.6">'+
     'Gli utenti sono ricavati dalle tracce lasciate nei dati, non da un\'anagrafica: in un prototipo che gira in un solo browser il loro numero resta piccolo e le medie vanno lette come indicative. '+
     'Non esiste una segmentazione per reparto né una distinzione fra utente attivo e registrato. '+
     'Non ci sono costi reali per token, perché le chiavi sono dell\'utente e la piattaforma non le contabilizza. '+
     'Tutto il resto qui sopra è calcolato sui dati effettivi, non stimato.</div></div>'+
     '<div style="display:flex;gap:8px;margin-top:14px">'+
       '<button class="tb-btn" onclick="renderMonitoraggio()">🔄 Ricalcola</button>'+
       '<button class="tb-btn" onclick="govExport()">📥 Esporta il quadro (JSON)</button>'+
     '</div>';

  el.innerHTML=h;
}

function govExport(){
  var s=govStats();
  s._generato=new Date().toISOString();
  s._rischi=govRischi(s).map(function(r){return r.liv+': '+r.t});
  if(typeof foDownload==='function'){
    foDownload('governance_'+new Date().toISOString().substring(0,10)+'.json','application/json',JSON.stringify(s,null,2));
    showToast('📥 Quadro di governo esportato');
  }
}
