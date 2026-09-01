// ═══════════════════════════════════════════
// SPIEGABILITÀ — "Perché questo risultato"
// ═══════════════════════════════════════════
// Il registro di esecuzione dice COSA è successo, riga per riga. Non dice
// perché il risultato è quello: quali fonti hanno pesato, su quale valore si
// è deciso un ramo, quale controllo ha cambiato il testo, cosa NON è stato
// eseguito. Sono informazioni già presenti negli eventi tipizzati: qui
// vengono ricomposte in una lettura che risponde alla domanda dell'utente.
//
// Nessun dato viene inventato: se un'informazione non è stata registrata, la
// sezione lo dichiara invece di riempirsi di supposizioni.

function xaiLoadEvents(fonte){
  // Esecuzione appena conclusa: gli eventi sono già in memoria.
  if(fonte&&fonte.ctx&&fonte.ctx.events)
    return {eventi:fonte.ctx.events,trace:fonte.trace,nodi:fonte.ctx.nodes,stato:fonte.status,agente:fonte.ctx.agentName};
  // Esecuzione storica: si rileggono da execution_events.
  var id=parseInt(fonte,10);
  if(!id)return null;
  var log=dbGetOne('SELECT * FROM exec_log WHERE id=?',[id]);
  if(!log)return null;
  var righe=dbAll('SELECT * FROM execution_events WHERE execution_id=? ORDER BY seq',[id]);
  var eventi=righe.map(function(r){
    var p={};try{p=JSON.parse(r.payload_json||'{}')}catch(e){}
    return {seq:r.seq,event_type:r.event_type,node_id:r.node_id,payload:p,ts:r.ts};
  });
  var trace=null;try{trace=JSON.parse(log.trace_json||'null')}catch(e){}
  var nodi=[];
  var ag=dbGetOne('SELECT nodes_json FROM agents WHERE name=?',[log.agent]);
  if(ag){try{nodi=JSON.parse(ag.nodes_json)}catch(e){}}
  return {eventi:eventi,trace:trace,nodi:nodi,stato:log.status==='err'?'error':log.status,agente:log.agent,log:log};
}

function xaiNodeName(dati,id){
  var n=(dati.nodi||[]).find(function(x){return x.id===id});
  return n?(n.icon+' '+n.name):('nodo #'+id);
}

function xaiSection(titolo,sottotitolo,corpo,vuoto){
  return '<div style="margin-bottom:16px">'+
    '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--tx3);margin-bottom:2px">'+titolo+'</div>'+
    (sottotitolo?'<div style="font-size:10.5px;color:var(--tx4);margin-bottom:6px">'+sottotitolo+'</div>':'')+
    (corpo||'<div style="font-size:11.5px;color:var(--tx4);font-style:italic">'+(vuoto||'Nessuna informazione registrata.')+'</div>')+
  '</div>';
}

function xaiCard(colore,contenuto){
  return '<div style="border-left:3px solid '+colore+';background:var(--bg2);border-radius:0 8px 8px 0;padding:8px 11px;margin-bottom:6px;font-size:11.5px;line-height:1.5">'+contenuto+'</div>';
}

function explainExecution(fonte){
  var d=xaiLoadEvents(fonte);
  if(!d){showToast('⚠️ Nessuna traccia disponibile per questa esecuzione');return}
  // Serve all'obiettivo pratico "Interroga un risultato": si conta l'apertura
  // effettiva del pannello, non il fatto che esista.
  try{localStorage.setItem('relaition_xai_aperto',
    String(parseInt(localStorage.getItem('relaition_xai_aperto')||'0',10)+1))}catch(e){}
  var ev=function(tipo){return d.eventi.filter(function(e){return e.event_type===tipo})};

  var html='<div style="display:flex;justify-content:space-between;align-items:center"><h2>🔍 Perché questo risultato</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:8px 0 16px">Ricostruzione di ciò che ha determinato l\'esito di «'+escHtml(d.agente||'esecuzione')+'», a partire dagli eventi registrati durante l\'esecuzione. Nessun elemento è ricostruito a posteriori.</p>';

  // ── 1. FONTI CONSULTATE ──
  var kb=ev('kb:retrieved'),kbVuoto=ev('kb:empty');
  var corpoKb='';
  kb.forEach(function(e){
    corpoKb+=xaiCard('#0EA5E9',
      '<div style="font-weight:600">'+escHtml(xaiNodeName(d,e.node_id))+' ha consultato la Knowledge Base</div>'+
      '<div style="color:var(--tx4);font-size:10.5px;margin:2px 0 5px">Ricerca: «'+escHtml(String(e.payload.query||'').substring(0,120))+'» · motore '+escHtml(e.payload.motore||'—')+
      (e.payload.scartatiPermessi?' · <strong>'+e.payload.scartatiPermessi+' porzioni escluse dai permessi</strong>':'')+'</div>'+
      (e.payload.porzioni||[]).map(function(p,i){
        return '<div>'+(i+1)+'. <strong>'+escHtml(p.doc)+'</strong> — '+escHtml(p.sezione)+' <span style="color:var(--ac2);font-weight:700">'+p.punteggio+'</span></div>';
      }).join(''));
  });
  kbVuoto.forEach(function(e){
    corpoKb+=xaiCard('#F59E0B','<strong>'+escHtml(xaiNodeName(d,e.node_id))+'</strong> aveva la Knowledge Base attiva ma <strong>non ha recuperato nulla</strong> ('+escHtml(e.payload.motore||'—')+
      (e.payload.scartatiPermessi?', '+e.payload.scartatiPermessi+' escluse dai permessi':'')+'). La risposta si basa quindi solo sul modello, non su documenti aziendali.');
  });
  html+=xaiSection('📚 Fonti che hanno pesato sul risultato',
    'Le porzioni recuperate sono entrate nel prompt del modello con la citazione del documento di origine.',
    corpoKb,'Nessun nodo ha consultato la Knowledge Base: il risultato dipende solo dal modello e dai dati in ingresso.');

  // ── 2. DECISIONI ──
  var rami=ev('branch:decided'),saltati=ev('node:skipped');
  var corpoRami='';
  rami.forEach(function(e){
    corpoRami+=xaiCard(e.payload.esito?'#10B981':'#EF4444',
      '<div><strong>'+escHtml(xaiNodeName(d,e.node_id))+'</strong> ha valutato «'+escHtml(e.payload.espressione||'')+'» → <strong>'+(e.payload.esito?'VERO':'FALSO')+'</strong></div>'+
      '<div style="color:var(--tx4);font-size:10.5px;margin-top:2px">Valutata da: '+escHtml(e.payload.valutatoDa||'—')+' · ramo percorso: <strong>'+escHtml(e.payload.ramoAttivo)+'</strong>, ramo disattivato: '+escHtml(e.payload.ramoDisattivato)+'</div>'+
      (e.payload.inputValutato?'<div style="color:var(--tx4);font-size:10.5px;margin-top:3px;font-style:italic">Su questo input: «'+escHtml(String(e.payload.inputValutato).substring(0,140))+'…»</div>':''));
  });
  html+=xaiSection('🔀 Decisioni che hanno indirizzato il flusso',
    'Ogni diramazione riporta il valore su cui è stata decisa e chi l\'ha valutata.',
    corpoRami,'Il flusso è lineare: nessuna diramazione da decidere.');

  // ── 3. COSA NON È STATO ESEGUITO ──
  var corpoSalt='';
  if(saltati.length){
    corpoSalt=xaiCard('#94A3B8','<strong>'+saltati.length+' nodi non eseguiti</strong> perché appartenenti a rami non attivati: '+
      saltati.map(function(e){return escHtml(xaiNodeName(d,e.node_id))}).join(', ')+
      '<div style="color:var(--tx4);font-size:10.5px;margin-top:3px">Non è un errore: sono le conseguenze delle decisioni qui sopra.</div>');
  }
  var interrotta=ev('execution:aborted');
  if(interrotta.length){
    corpoSalt+=xaiCard('#EF4444','<strong>Esecuzione interrotta su richiesta</strong> dopo '+interrotta[0].payload.eseguiti+' nodi: i successivi non sono stati avviati.');
  }
  html+=xaiSection('⏭️ Cosa non è stato eseguito, e perché','',corpoSalt,'Tutti i nodi raggiungibili sono stati eseguiti.');

  // ── 4. STRUMENTI ──
  var tool=ev('tool:invoked');
  var corpoTool=tool.map(function(e){
    return xaiCard('#8B5CF6',
      '<div><strong>'+escHtml(xaiNodeName(d,e.node_id))+'</strong> ha invocato lo strumento <strong>'+escHtml(e.payload.tool||'')+'</strong></div>'+
      '<div style="color:var(--tx4);font-size:10.5px;margin-top:2px">Scelto da: '+(e.payload.chosenBy==='modello'?'<strong>il modello</strong>, autonomamente':escHtml(e.payload.chosenBy||'—'))+
      '</div>'+(e.payload.args?'<div style="color:var(--tx4);font-size:10.5px;margin-top:2px">Argomenti: <code>'+escHtml(JSON.stringify(e.payload.args).substring(0,160))+'</code></div>':''));
  }).join('');
  html+=xaiSection('🔧 Strumenti che il modello ha deciso di usare',
    'Il modello sceglie autonomamente se invocare un connettore; il runtime lo esegue e gli restituisce l\'esito.',
    corpoTool,'Nessuno strumento invocato: i connettori, se presenti, sono stati eseguiti in sequenza e non su decisione del modello.');

  // ── 5. CONTROLLI ──
  var gr=ev('guardrail:triggered'),gestiti=ev('error:handled');
  var corpoGr=gr.map(function(e){
    var col=e.payload.esito==='blocca'?'#EF4444':e.payload.esito==='segnala'?'#F59E0B':'#10B981';
    return xaiCard(col,'<div><strong>'+escHtml(e.payload.controllo||'')+'</strong> su '+escHtml(xaiNodeName(d,e.node_id))+' → <strong>'+escHtml(e.payload.esito||'')+'</strong></div>'+
      '<div style="color:var(--tx4);font-size:10.5px;margin-top:2px">'+escHtml(e.payload.messaggio||'')+'</div>');
  }).join('');
  corpoGr+=gestiti.map(function(e){
    return xaiCard('#10B981','<strong>'+escHtml(e.payload.controllo||'')+'</strong> ha assorbito un guasto: l\'esecuzione è proseguita e non è stata contata come fallita.');
  }).join('');
  html+=xaiSection('🛡️ Controlli intervenuti e cosa hanno cambiato','',corpoGr,
    'Nessun controllo nel flusso: l\'output del modello non è stato verificato né filtrato.');

  // ── 6. MODELLO ──
  var degrado=ev('capability:degraded');
  var chiamate=(d.trace&&d.trace.calls)?d.trace.calls.filter(function(c){return c.kind==='ai'}):[];
  var corpoModello='';
  if(chiamate.length){
    corpoModello+=xaiCard('#6366F1','<strong>'+chiamate.length+' chiamate al modello</strong> durante l\'esecuzione.'+
      '<div style="color:var(--tx4);font-size:10.5px;margin-top:2px">La traccia conserva prompt e risposta di ciascuna: è ciò che rende la riesecuzione deterministica.</div>');
  }
  corpoModello+=degrado.map(function(e){
    return xaiCard('#F59E0B','<strong>Capacità non disponibile:</strong> «'+escHtml(e.payload.capability||'')+'» non è supportata da '+escHtml(e.payload.provider||'')+
      '. Ripiego adottato: '+escHtml(e.payload.fallback||'')+'.'+
      '<div style="color:var(--tx4);font-size:10.5px;margin-top:2px">Il comportamento è degradato, non identico a quello previsto.</div>');
  }).join('');
  html+=xaiSection('🧠 Chi ha prodotto la risposta','',corpoModello,'Nessuna chiamata al modello registrata in questa esecuzione.');

  // ── 7. FILE PRODOTTI ──
  var file=ev('file:generated');
  var corpoFile=file.map(function(e){
    return xaiCard('#10B981','<strong>'+escHtml(e.payload.nome||'')+'</strong> ('+escHtml(e.payload.formato||'')+', '+e.payload.byte+' byte)'+
      '<div style="color:var(--tx4);font-size:10.5px;margin-top:2px">'+(e.payload.scaricato?'Scaricato sul computer':'Generato')+(e.payload.inKB?' · salvato nella Knowledge Base':'')+'</div>');
  }).join('');
  if(corpoFile)html+=xaiSection('💾 Cosa è stato prodotto','',corpoFile);

  html+='<div style="font-size:10.5px;color:var(--tx4);border-top:1px solid var(--bo);padding-top:10px;margin-top:4px;line-height:1.5">'+
    'Questa lettura è ricostruita dagli eventi registrati durante l\'esecuzione ('+d.eventi.length+' eventi). '+
    'Spiega il percorso seguito e i dati usati; <strong>non</strong> spiega il funzionamento interno del modello linguistico, che resta opaco.'+
  '</div>';

  openModal(html,true);
}
