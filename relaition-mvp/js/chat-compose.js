// ═══════════════════════════════════════════
// COMPOSIZIONE CONVERSAZIONALE — Blocco G
// ═══════════════════════════════════════════
// La barra chat del builder è AI-only: senza un provider configurato non
// produce nulla. Prima esisteva un ripiego a template ed euristiche su parole
// chiave che dava l'illusione di un builder conversazionale funzionante anche
// senza modello: il canvas si popolava di un flusso pescato da un elenco, non
// di ciò che l'utente aveva chiesto. Il trascinamento dei nodi dalla palette
// resta invece sempre disponibile, con o senza AI.

// ── GATE: almeno un provider testato con esito positivo ──
// Non si guarda aiConfig.status (che descrive solo il provider selezionato nel
// pannello): chi ha configurato OpenAI mentre nel pannello è mostrato Claude
// deve poter usare la chat lo stesso.
function anyProviderReady(){
  var ps=aiConfig.providers||{};
  var pref=normalizeProviderName(aiConfig.provider);
  if(ps[pref]&&ps[pref].status==='ok')return pref;
  var found=null;
  Object.keys(ps).forEach(function(p){if(!found&&ps[p].status==='ok')found=p});
  return found;
}

function updateChatBuilderGate(){
  var input=document.getElementById('chatBuilderInput');
  var btn=document.getElementById('chatBuilderBtn');
  if(!input||!btn)return;
  var prov=anyProviderReady();
  // Durante una generazione il pulsante è già disabilitato dal chiamante:
  // qui non si riabilita nulla, si riflette solo lo stato del gate.
  if(btn.dataset.busy==='1')return;
  input.disabled=!prov;btn.disabled=!prov;
  input.style.opacity=prov?1:0.55;
  btn.style.opacity=prov?1:0.45;
  btn.style.cursor=prov?'pointer':'not-allowed';
  input.placeholder=prov
    ? 'Descrivi l\'agente da creare o la modifica da fare... es: "aggiungi una notifica Slack se lo score è alto"'
    : 'Builder conversazionale disattivato, configura un provider AI nel pannello a sinistra';
}

// ── CATALOGHI E REGOLE CONDIVISE DAL PROMPT ──
// In modifica il catalogo completo (77 connettori con i rispettivi campi di
// configurazione) è controproducente: allunga il prompt di alcune migliaia di
// caratteri, rallenta la risposta e distoglie il modello dal compito, che è
// emettere due o tre operazioni. Qui restano solo i NOMI, che è ciò che serve
// per scegliere un nodo valido.
function ccCompactRules(){
  // I nomi dei CAMPI di configurazione vanno elencati anche in modalità
  // modifica. Senza, il modello inventava chiavi plausibili ma inesistenti
  // ("destinatario" invece di "to"), e il nodo aggiunto nasceva con i campi
  // obbligatori vuoti: la modifica sembrava riuscita ma il flusso non partiva.
  var ac=PALETTE.filter(function(p){return p.type==='ac'}).map(function(p){
    var cc=CONNECTOR_CONFIGS[p.name];
    var req=cc?cc.fields.filter(function(f){return f.req}).map(function(f){return f.k}):[];
    return '"'+p.name+'"'+(req.length?' [obbligatori: '+req.join(', ')+']':'');
  }).join(' · ');
  var tr=PALETTE.filter(function(p){return p.type==='tr'}).map(function(p){return '"'+p.name+'"'}).join(' · ');
  var gr=PALETTE.filter(function(p){return p.type==='gr'}).map(function(p){return '"'+p.name+'"'}).join(' · ');
  var ou=PALETTE.filter(function(p){return p.type==='ou'}).map(function(p){return '"'+p.name+'"'}).join(' · ');
  return 'TIPI DI NODO: "tr" trigger · "ai" AI/LLM (config.prompt) · "cd" condizione (config.condition, porte true/false) · "ac" azione · "gr" controllo · "ou" output.\n'+
    'Trigger ammessi: '+tr+'\n'+
    'Controlli ammessi: '+gr+'\n'+
    'Output ammessi: '+ou+'\n'+
    'Connettori azione ammessi (usa ESATTAMENTE questi nomi e queste chiavi config): '+ac;
}

function ccBaseRules(){
  var connectorCatalog=PALETTE.filter(function(p){return p.type==='ac'}).map(function(p){
    var cc=CONNECTOR_CONFIGS[p.name];
    return '- "'+p.name+'" ('+p.desc+')'+(cc?': config: '+cc.fields.map(function(f){return f.k}).join(', '):'');
  }).join('\n');
  var triggerCatalog=PALETTE.filter(function(p){return p.type==='tr'}).map(function(p){return '- "'+p.name+'" ('+p.desc+')'}).join('\n');
  var guardCatalog=PALETTE.filter(function(p){return p.type==='gr'}).map(function(p){return '- "'+p.name+'"'}).join('\n');
  return 'TIPI DI NODO:\n- "tr" (trigger): usa ESATTAMENTE uno di questi nomi:\n'+triggerCatalog+'\n'+
    '- "ai" (AI/LLM): nomi liberi. Includi config.prompt con il system prompt del nodo.\n'+
    '- "cd" (condizione): diramazione, porte "true" e "false". Includi config.condition.\n'+
    '- "ac" (azione): usa ESATTAMENTE uno di questi connettori (con i loro campi config):\n'+connectorCatalog+'\n'+
    '- "gr" (controllo): usa ESATTAMENTE uno di questi nomi:\n'+guardCatalog+'\n'+
    '- "ou" (output): nodo finale.\n'+
    'Nomi max 20 caratteri, descrizioni max 30, emoji "ic" pertinente.\n'+
    "REGOLA VINCOLANTE: per \"tr\", \"ac\" e \"gr\" NON inventare nomi. Se una capacità non ha un blocco "+
    "dedicato — allegare un file a una email, mettere in copia, scegliere un formato — NON creare un "+
    "blocco nuovo: usa il blocco esistente più vicino e metti quella capacità nella sua configurazione. "+
    "Un blocco con un nome fuori elenco non ha parametri e il flusso non parte.";
}

// Il grafo va passato al modello con gli id REALI dei nodi: è ciò che gli
// permette di riferirsi a un nodo esistente invece di riscrivere tutto.
function ccGraphSnapshot(){
  return {
    nodi:B.nodes.map(function(n){
      return {id:n.id,t:n.type,n:n.name,d:n.detail,config:n.config||{},imposto:!!n.locked};
    }),
    connessioni:B.edges.map(function(e){return {da:e.from,porta:e.fp,a:e.to,etichetta:e.label||''}})
  };
}

function ccParseJson(text){
  try{
    var clean=(text||'').replace(/```json|```/g,'').trim();
    var s=clean.indexOf('{'),e=clean.lastIndexOf('}');
    if(s>=0&&e>s)clean=clean.substring(s,e+1);
    return JSON.parse(clean);
  }catch(err){return null}
}

// I modelli tendono a inventare nomi di connettori: si riallineano a quelli
// realmente presenti in palette, altrimenti il nodo generato non è eseguibile.
// I modelli abbreviano o traducono i codici di tipo ("a" per ai, "action" per
// ac, "trigger" per tr). Un tipo non riconosciuto produceva un nodo grigio e
// inerte sul canvas, quindi si riportano ai cinque codici reali.
var CC_TYPE_ALIAS={a:'ai',llm:'ai',model:'ai',ai:'ai',
  action:'ac',act:'ac',connector:'ac',ac:'ac',
  trigger:'tr',start:'tr',tr:'tr',
  condition:'cd',cond:'cd','if':'cd',branch:'cd',cd:'cd',
  output:'ou',end:'ou',fine:'ou',ou:'ou',
  guardrail:'gr',control:'gr',gr:'gr', subagent:'sa',sa:'sa'};

function ccNormalizeNames(nodes){
  var acNames=PALETTE.filter(function(p){return p.type==='ac'}).map(function(p){return p.name});
  var trNames=PALETTE.filter(function(p){return p.type==='tr'}).map(function(p){return p.name});
  nodes.forEach(function(nd){
    nd.t=CC_TYPE_ALIAS[String(nd.t||'').toLowerCase()]||'ai';
    if(nd.t==='ac'&&acNames.indexOf(nd.n)<0){
      var lower=(nd.n||'').toLowerCase();
      var match=acNames.find(function(a){return a.toLowerCase()===lower})||
                acNames.find(function(a){return lower.indexOf(a.toLowerCase())>=0||a.toLowerCase().indexOf(lower)>=0});
      if(match)nd.n=match;
    }
    if(nd.t==='tr'&&trNames.indexOf(nd.n)<0){
      var lowert=(nd.n||'').toLowerCase();
      var matcht=trNames.find(function(a){return lowert.indexOf(a.toLowerCase().split(' ')[0])>=0});
      if(matcht)nd.n=matcht;
    }
  });
}

// ── PIANIFICAZIONE: una sola chiamata al modello ──
// In creazione restituisce i nodi; in modifica restituisce OPERAZIONI riferite
// agli id esistenti. È la differenza che rende possibile G2: chiedendo il
// "workflow completo aggiornato" si perdeva tutto ciò che l'utente aveva
// configurato sui nodi che la richiesta non riguardava.
async function composePlan(desc,isModify,prov){
  var sys,usr;
  if(isModify){
    sys='Sei l\'assistente del builder RelAItion. L\'utente ha un workflow ESISTENTE e chiede una modifica.\n'+
      'NON riscrivere il workflow. Restituisci solo le OPERAZIONI MINIME necessarie, riferite agli id reali dei nodi.\n'+
      'Ogni nodo che la richiesta non riguarda deve restare intatto: non emettere operazioni su di esso.\n'+
      'I nodi con "imposto":true sono controlli imposti da una politica organizzativa: non possono essere rimossi.\n\n'+
      ccCompactRules()+'\n\n'+
      ccRegoleDati()+'\n\n'+
      'FORMATO RISPOSTA: SOLO JSON valido, niente markdown:\n'+
      '{"interpretazione":"come hai capito la richiesta, in una frase","ops":[...]}\n'+
      'Operazioni ammesse:\n'+
      '{"op":"add","dopo":<id>|null,"prima":<id>|null,"t":"ai","ic":"🔎","n":"Nome","d":"Desc","config":{},"perche":"..."}\n'+
      '{"op":"update","id":<id>,"n":"...","d":"...","config":{...},"perche":"..."}\n'+
      '{"op":"remove","id":<id>,"perche":"..."}\n'+
      '{"op":"connect","da":<id>,"porta":"out"|"true"|"false","a":<id>,"etichetta":"","perche":"..."}\n'+
      '{"op":"disconnect","da":<id>,"a":<id>,"perche":"..."}\n'+
      'In "update" indica SOLO i campi config che cambiano: gli altri vengono conservati.\n'+
      // Senza queste due regole il modello inseriva i nodi "in aria": add senza
      // dopo/prima produceva un nodo scollegato, che il motore non esegue mai.
      'INSERIMENTO: in "add" indica SEMPRE "dopo" (id del nodo a monte) oppure "prima" (id del nodo a valle). Le connessioni vengono ricucite automaticamente. Un "add" senza dopo/prima crea un nodo isolato ed è un errore.\n'+
      'RAMI: se "dopo" è una condizione, aggiungi "porta":"true" oppure "porta":"false" per dire su QUALE ramo va il nodo. Senza indicazione si assume il ramo vero.\n'+
      'INVARIANTI da rispettare dopo la modifica: il flusso inizia con un trigger, ogni ramo finisce su un nodo di output, nessun nodo resta senza connessioni.\n'+
      'Compila SEMPRE i campi config obbligatori dei nodi che aggiungi.\n\n'+
      // Un esempio funzionante vale piu' di ogni istruzione: la modalità
      // creazione ne aveva uno, la modifica no — ed era la meno affidabile.
      'ESEMPIO: workflow attuale: nodi [{"id":1,"t":"tr","n":"Webhook"},{"id":2,"t":"ai","n":"Analizza"},{"id":3,"t":"ou","n":"Output"}], connessioni 1→2, 2→3.\n'+
      'Richiesta: "avvisa il team su Slack prima di chiudere".\n'+
      'Risposta: {"interpretazione":"Aggiungo una notifica Slack fra l\'analisi e l\'output","ops":[{"op":"add","dopo":2,"t":"ac","ic":"💬","n":"Slack","d":"Avviso al team","config":{"channel":"#team","message":"Esito: {{result}}"},"perche":"la richiesta chiede un avviso prima della chiusura"}]}\n\n'+
      'Se la richiesta non è chiara o non è realizzabile con questi nodi, rispondi {"interpretazione":"...","ops":[],"problema":"spiegazione breve"}.';
    usr='WORKFLOW ATTUALE ("'+currentAgentName+'"):\n'+JSON.stringify(ccGraphSnapshot())+'\n\nMODIFICA RICHIESTA: '+desc;
  }else{
    sys='Sei un generatore di workflow per RelAItion, piattaforma no-code di AI agent. Dato un obiettivo, generi un workflow ESEGUIBILE (4-8 nodi, inizia con un trigger) usando SOLO i connettori reali.\n\n'+
      ccBaseRules()+'\n\n'+
      ccRegoleDati()+'\n\n'+
      'FORMATO RISPOSTA: SOLO JSON valido, niente markdown:\n'+
      '{"interpretazione":"come hai capito la richiesta, in una frase","agentName":"Nome",'+
      '"nodes":[{"id":1,"t":"tr","ic":"📥","n":"Webhook","d":"...","config":{}}],'+
      '"edges":[{"da":1,"porta":"out","a":2,"etichetta":""}]}\n'+
      // Senza edges espliciti la topologia veniva dedotta dall'ordine dell'array,
      // e una condizione finiva collegata ai due nodi successivi qualunque cosa
      // significassero: e' la ragione principale per cui i flussi generati con
      // una diramazione risultavano incomprensibili.
      'OGNI nodo ha un "id" numerico progressivo. "edges" e\' OBBLIGATORIO e descrive TUTTE le connessioni.\n'+
      'PORTE: "out" per i nodi normali; una condizione ("cd") ha DUE uscite, "true" e "false", ed entrambe vanno collegate.\n'+
      'INVARIANTI: un solo trigger all\'inizio; ogni ramo termina su un nodo "ou"; nessun nodo senza connessioni.\n'+
      'Compila SEMPRE i campi config obbligatori.\n\n'+
      'ESEMPIO (richiesta: "valuta i CV e convoca i candidati compatibili"):\n'+
      '{"interpretazione":"Analisi del CV caricato, diramazione sulla compatibilita\', email diversa per esito","agentName":"Screening CV",'+
      '"nodes":['+
      '{"id":1,"t":"tr","ic":"📎","n":"File upload","d":"CV da valutare","config":{"filetipo":"Word"}},'+
      '{"id":2,"t":"ai","ic":"🔍","n":"Analizza CV","d":"Valuta compatibilita","config":{"prompt":"Analizza il CV e valuta la compatibilita con la posizione. Rispondi SOLO JSON: {compatibilita: string, motivazione: string}."}},'+
      '{"id":3,"t":"cd","ic":"🔀","n":"Compatibile?","d":"Soglia","config":{"condition":"compatibilita == \'alta\'"}},'+
      '{"id":4,"t":"ac","ic":"💬","n":"Invia email","d":"Convoca","config":{"to":"hr@azienda.it","subject":"Candidatura in linea","body":"Motivazione: {{motivazione}}","bodytype":"Testo","attach":"No"}},'+
      '{"id":5,"t":"ac","ic":"💬","n":"Invia email","d":"Esito negativo","config":{"to":"hr@azienda.it","subject":"Esito candidatura","body":"Motivazione: {{motivazione}}","bodytype":"Testo","attach":"No"}},'+
      '{"id":6,"t":"ou","ic":"📊","n":"Output","d":"Chiudi flusso","config":{}}],'+
      '"edges":[{"da":1,"porta":"out","a":2},{"da":2,"porta":"out","a":3},'+
      '{"da":3,"porta":"true","a":4,"etichetta":"Sì"},{"da":3,"porta":"false","a":5,"etichetta":"No"},'+
      '{"da":4,"porta":"out","a":6},{"da":5,"porta":"out","a":6}]}';
    usr='Genera il workflow per: '+desc;
  }

  // Un workflow completo in JSON supera facilmente i 2000 token, e i modelli
  // recenti ne consumano una parte in ragionamento interno: con un budget
  // stretto la risposta arrivava valida ma tagliata a metà, e il parsing
  // falliva riportando "richiesta non compresa" — un errore che indicava
  // all'utente la causa sbagliata.
  var result=await callAI(usr,sys,{temperature:0.2,model:prov,maxtokens:8000});
  if(result.demo)return {error:'Provider AI non raggiungibile: '+result.text};
  // Un errore del fornitore va riportato testualmente. Prima arrivava qui come
  // testo normale, il parsing falliva e l'utente leggeva "richiesta non
  // compresa" — la causa sbagliata, per giunta in un avviso che spariva.
  if(result.error)return {error:result.text};
  var parsed=ccParseJson(result.text);
  if(!parsed&&result.truncated)return {error:'La risposta del modello è stata troncata prima di completare il workflow. Chiedi un flusso più breve, o usa un modello con un limite di output più alto.'};
  if(!parsed)return {error:'Il modello non ha restituito un piano leggibile. Riformula la richiesta in modo più specifico.'};
  if(parsed.problema)return {error:parsed.problema,interpretation:parsed.interpretazione||''};

  if(isModify){
    var ops=(parsed.ops||[]).filter(function(o){return o&&o.op});
    if(!ops.length)return {error:'Il modello non ha proposto alcuna modifica.',interpretation:parsed.interpretazione||''};
    return {mode:'modify',interpretation:parsed.interpretazione||'',ops:ops};
  }
  var nodes=parsed.nodes||parsed.nodi||[];
  if(!nodes.length)return {error:'Il modello non ha restituito alcun nodo.'};
  ccNormalizeNames(nodes);
  return {mode:'create',interpretation:parsed.interpretazione||'',agentName:parsed.agentName||null,nodes:nodes};
}

// ── ANTEPRIMA (G3 + G7) ──
// Nulla viene applicato prima che l'utente veda come è stata interpretata la
// richiesta e cosa cambia esattamente sul canvas.
var ccPendingPlan=null;
var ccLastRequest='';

// Un fallimento va mostrato nello stesso pannello dell'anteprima: è lì che
// l'utente guarda dopo aver premuto Genera. Con il solo avviso a scomparsa
// il click su un suggerimento sembrava non produrre nulla.
function showComposeError(msg){
  var box=document.getElementById('composePreview');
  if(!box){showToast('⚠️ '+msg);return}
  box.innerHTML=
    '<div style="display:flex;gap:9px;align-items:flex-start">'+
      '<span style="font-size:15px;flex-shrink:0">⚠️</span>'+
      '<div style="flex:1">'+
        '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#EF4444;margin-bottom:3px">Generazione non riuscita</div>'+
        '<div style="font-size:11.5px;color:var(--tx2);line-height:1.5">'+escHtml(msg)+'</div>'+
      '</div>'+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-top:11px">'+
      (ccLastRequest?'<button class="chat-builder-btn" style="flex:1;height:30px;justify-content:center" onclick="retryCompose()">Riprova</button>':'')+
      '<button class="chat-builder-btn" style="flex:0 0 90px;height:30px;justify-content:center;background:var(--bg2);color:var(--tx2)" onclick="cancelPendingPlan()">Chiudi</button>'+
    '</div>';
  ccApriRiquadro();
}

// Il modello impiega da qualche secondo a mezzo minuto. Senza un riscontro
// immediato il click su un suggerimento sembra non fare nulla, ed è ciò che
// portava a premerlo di nuovo.
function showComposeWaiting(isModify){
  var box=document.getElementById('composePreview');
  if(!box)return;
  box.innerHTML=
    '<div style="display:flex;gap:10px;align-items:center">'+
      '<span class="cc-spin"></span>'+
      '<div style="flex:1">'+
        '<div style="font-size:11.5px;font-weight:700">'+(isModify?'Analizzo il flusso e preparo le modifiche…':'Compongo il workflow…')+'</div>'+
        '<div style="font-size:10.5px;color:var(--tx4);margin-top:2px">'+escHtml(ccLastRequest.substring(0,90))+(ccLastRequest.length>90?'…':'')+'</div>'+
        '<div style="font-size:10px;color:var(--tx4);margin-top:4px">Nulla viene applicato finché non confermi.</div>'+
      '</div>'+
    '</div>';
  ccApriRiquadro();
}

function retryCompose(){
  if(!ccLastRequest)return;
  var i=document.getElementById('chatBuilderInput');
  if(i)i.value=ccLastRequest;
  var box=document.getElementById('composePreview');
  if(box){box.style.display='none';box.innerHTML=''}
  aiGenerateWorkflow();
}

var CC_TYPE_LABEL={tr:'Trigger',ai:'AI',cd:'Condizione',ac:'Azione',ou:'Output',gr:'Controllo',sa:'Sotto-agente'};

function ccNodeById(id){return B.nodes.find(function(n){return n.id===id})}

function ccNodeLabel(id){
  var n=ccNodeById(id);
  return n?('"'+n.name+'" (#'+n.id+')'):('nodo #'+id+': inesistente');
}

function ccOpLine(o){
  var ic='•',txt='';
  if(o.op==='add'){
    ic='＋';
    txt='Aggiunge <strong>'+escHtml(o.n||'Nodo')+'</strong> <span style="color:var(--tx4)">('+(CC_TYPE_LABEL[o.t]||o.t)+')</span>'+
        (o.dopo!=null?' dopo '+escHtml(ccNodeLabel(o.dopo)):'')+
        (o.prima!=null?' prima di '+escHtml(ccNodeLabel(o.prima)):'');
  }else if(o.op==='update'){
    ic='✎';
    var campi=[];
    if(o.n)campi.push('nome');
    if(o.d)campi.push('descrizione');
    if(o.config)campi.push(Object.keys(o.config).join(', '));
    txt='Modifica '+escHtml(ccNodeLabel(o.id))+(campi.length?' <span style="color:var(--tx4)">→ '+escHtml(campi.join(' · '))+'</span>':'');
  }else if(o.op==='remove'){
    ic='－';txt='Rimuove '+escHtml(ccNodeLabel(o.id));
  }else if(o.op==='connect'){
    ic='→';txt='Collega '+escHtml(ccNodeLabel(o.da))+' → '+escHtml(ccNodeLabel(o.a))+(o.porta&&o.porta!=='out'?' <span style="color:var(--tx4)">(ramo '+escHtml(o.porta)+')</span>':'');
  }else if(o.op==='disconnect'){
    ic='✂';txt='Scollega '+escHtml(ccNodeLabel(o.da))+' → '+escHtml(ccNodeLabel(o.a));
  }else{
    txt='Operazione non riconosciuta: '+escHtml(o.op);
  }
  return '<div style="display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px solid var(--bg2)">'+
    '<span style="width:16px;flex-shrink:0;color:var(--ac2);font-weight:700">'+ic+'</span>'+
    '<div style="flex:1"><div style="font-size:11.5px;line-height:1.45">'+txt+'</div>'+
    (o.perche?'<div style="font-size:10px;color:var(--tx4);margin-top:1px">'+escHtml(o.perche)+'</div>':'')+'</div></div>';
}

// Elenca i nodi che la richiesta NON tocca: è la prova visibile che una
// modifica conversazionale non azzera il lavoro già fatto sul canvas.
function ccUntouchedCount(ops){
  var toccati={};
  ops.forEach(function(o){
    // Anche i nodi solo ricablati contano come toccati: dire "non toccato" di
    // un nodo a cui è cambiata una connessione sarebbe una mezza verità.
    ['id','da','a','dopo','prima'].forEach(function(k){if(o[k]!=null)toccati[o[k]]=1});
  });
  return B.nodes.filter(function(n){return !toccati[n.id]}).length;
}

// ══════════════════════════════════════════════════════════════
// I NODI GENERATI DALLA CHAT SONO GLI STESSI DELLA PALETTE
// ══════════════════════════════════════════════════════════════
// Il modello proponeva nome, icona e descrizione a modo suo: nasceva un
// «Approvazione Umana» con la U maiuscola e l'icona ✅, che SEMBRAVA il
// controllo della palette ma non lo era. `nodoConfigIniziale()` riconosce i
// controlli dal nome esatto, quindi quel nodo restava senza i propri campi —
// niente «chi deve approvare», niente messaggio, niente scadenza — e il
// pannello mostrava un blocco vuoto al posto della configurazione.
//
// Due nodi che si chiamano quasi uguale e si comportano diversamente sono
// peggio di due nodi diversi: chi guarda non ha modo di accorgersene.
// Qui ogni nodo proposto viene ricondotto alla voce di palette che gli
// corrisponde, e da quel momento è identico a quello che si trascinerebbe.
function ccChiave(s){
  return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ').trim();
}

function ccVoceDiPalette(nome,tipo){
  if(typeof PALETTE==='undefined')return null;
  var k=ccChiave(nome);
  if(!k)return null;
  // Prima il nome esatto: è il caso normale, e non deve poter essere scavalcato
  // da una corrispondenza approssimata.
  var esatta=PALETTE.filter(function(p){ return ccChiave(p.name)===k })[0];
  if(esatta)return esatta;
  // Poi, solo fra i nodi dello stesso tipo, una corrispondenza per contenimento:
  // «Approvazione» trova «Approvazione umana». La soglia di lunghezza evita che
  // parole cortissime aggancino la prima voce che le contiene.
  if(!tipo||k.length<5)return null;
  var candidate=PALETTE.filter(function(p){
    if(p.type!==tipo)return false;
    var pk=ccChiave(p.name);
    return pk.indexOf(k)>=0 || k.indexOf(pk)>=0;
  });
  return candidate.length===1?candidate[0]:null;
}

// Riconduce un nodo proposto (t/ic/n/d) alla sua voce di palette. La
// configurazione proposta dal modello NON viene toccata: è lì che sta la
// specificità del caso, ed è l'unico posto in cui ha senso.
function ccAllineaNodo(n){
  if(!n)return n;
  var v=ccVoceDiPalette(n.n,n.t);
  if(!v){
    // Nomi liberi per costruzione: un nodo AI descrive il proprio compito, una
    // condizione la propria domanda, un output il proprio esito.
    // Per gli altri tre tipi il nome E' l'identita': se non corrisponde a
    // niente, il nodo nascera' senza parametri e il flusso non partira'. Va
    // detto PRIMA di applicare, non scoperto premendo Esegui.
    if(n.t==='ac'||n.t==='tr'||n.t==='gr')n.fuoriPalette=true;
    return n;
  }
  delete n.fuoriPalette;
  n.t=v.type; n.ic=v.icon; n.n=v.name; n.d=v.desc;
  return n;
}

function ccAllineaPiano(plan){
  if(!plan)return plan;
  (plan.nodes||[]).forEach(ccAllineaNodo);
  (plan.ops||[]).forEach(function(o){ if(o&&o.op==='add')ccAllineaNodo(o) });
  return plan;
}

function previewChanges(plan){
  ccAllineaPiano(plan);
  ccPendingPlan=plan;
  var box=document.getElementById('composePreview');
  if(!box){applyPendingPlan();return}   // senza pannello si applica comunque
  var body='';
  if(plan.mode==='create'){
    body=plan.nodes.map(function(n,i){
      return '<div style="display:flex;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid var(--bg2)">'+
        '<span style="width:16px;flex-shrink:0;color:var(--tx4);font-size:10px">'+(i+1)+'</span>'+
        '<span>'+escHtml(n.ic||'⚙️')+'</span>'+
        '<div style="flex:1;font-size:11.5px"><strong>'+escHtml(n.n||'Nodo')+'</strong> <span style="color:var(--tx4)">'+(CC_TYPE_LABEL[n.t]||n.t)+'</span></div></div>';
    }).join('');
    body+='<div style="font-size:10.5px;color:var(--tx4);margin-top:8px">Il canvas attuale verrà sostituito. L\'operazione è annullabile con Ctrl+Z.</div>';
  }else{
    body=plan.ops.map(ccOpLine).join('');
    var untouched=ccUntouchedCount(plan.ops);
    body+='<div style="font-size:10.5px;color:var(--tx4);margin-top:8px">'+
      (untouched>0?'🔒 '+untouched+' nodi non toccati conservano posizione e configurazione. ':'')+
      'Annullabile con Ctrl+Z.</div>';
  }
  box.innerHTML=
    // Una testata che dice chiaramente che c'e' una decisione da prendere.
    // Senza, la proposta si confondeva con il resto della fascia della chat e
    // passava inosservata: si premeva Genera e sembrava non fosse successo nulla.
    '<div class="cp-testa">'+
      '<span style="font-size:15px">✨</span>'+
      '<span style="flex:1;font-size:12.5px;font-weight:800">'+
        (plan.mode==='create'?'Proposta: nuovo flusso':'Proposta: modifica al flusso')+'</span>'+
      '<span class="badge badge-b" style="font-size:9.5px">da confermare</span>'+
      '<span class="modal-close" title="Annulla" style="cursor:pointer;font-size:15px;line-height:1" onclick="cancelPendingPlan()">✕</span>'+
    '</div>'+
    '<div class="cp-corpo">'+
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--tx3);margin-bottom:4px">Ho interpretato così</div>'+
      '<div style="font-size:11.5px;color:var(--tx2);line-height:1.45;margin-bottom:10px;font-style:italic">'+escHtml(plan.interpretation||'(nessuna interpretazione dichiarata dal modello)')+'</div>'+
      '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--tx3);margin-bottom:2px">'+(plan.mode==='create'?'Nodi da creare':'Modifiche proposte')+'</div>'+
      body+
      // Blocchi che il modello ha inventato: si dicono QUI, mentre la proposta
      // è ancora una proposta. Non vengono nascosti né scartati d'ufficio —
      // l'intenzione dietro «Allega file mail» è legittima, sbagliato è il modo
      // — ma chi conferma deve sapere che quei blocchi non esistono e che il
      // flusso non partirà finché restano lì.
      (function(){
        var fuori=(plan.nodes||[]).concat(plan.ops||[]).filter(function(n){return n&&n.fuoriPalette});
        if(!fuori.length)return '';
        return '<div class="cc-fuoripalette">'+
          '<div class="cc-fuoripalette-testa">⚠️ '+fuori.length+
            (fuori.length===1?' blocco non esiste':' blocchi non esistono')+' nella palette</div>'+
          '<div class="cc-pastiglie">'+fuori.map(function(n){
            return '<span class="cc-pastiglia cc-pastiglia-ko">'+escHtml(n.n||'senza nome')+'</span>';
          }).join('')+'</div>'+
          '<div class="cc-perche">Nascono senza parametri e il flusso non sarà eseguibile finché ci sono. '+
          'Spesso è una capacità di un blocco esistente — un allegato, una copia, un formato — che va messa '+
          'nella sua configurazione. Conviene <strong>annullare</strong> e chiedere usando il nome del blocco.</div>'+
        '</div>';
      })()+
    '</div>'+
    '<div class="cp-piede">'+
      '<button class="chat-builder-btn" style="flex:1;height:32px;justify-content:center" onclick="applyPendingPlan()">Applica</button>'+
      '<button class="chat-builder-btn" style="flex:0 0 96px;height:32px;justify-content:center;background:var(--bg2);color:var(--tx2)" onclick="cancelPendingPlan()">Annulla</button>'+
    '</div>';
  box.style.display='flex';
  ccPosizionaAnteprima();
}

// Posiziona il riquadro sotto la barra della chat. E' `fixed`, quindi va
// collocato a mano: in cambio nessun contenitore con `overflow` puo' tagliarlo,
// ed era esattamente il problema — la fascia della chat scorre e la proposta
// finiva sotto il bordo.
// Apre il riquadro sovrapposto. Il pannello e' `flex` con padding zero e tre
// fasce (testa, corpo, piede); i messaggi piu' semplici — errore, attesa,
// aiuto — non le costruiscono, quindi qui vengono avvolti nel corpo, cosi'
// mantengono i margini senza dover toccare ogni punto che li produce.
function ccApriRiquadro(){
  var box=document.getElementById('composePreview');
  if(!box)return;
  if(!box.querySelector('.cp-testa') && !box.querySelector('.cp-corpo')){
    box.innerHTML='<div class="cp-corpo">'+box.innerHTML+'</div>';
  }
  box.style.display='flex';
  ccPosizionaAnteprima();
}

function ccPosizionaAnteprima(){
  var box=document.getElementById('composePreview');
  if(!box||box.style.display==='none')return;
  var barra=document.querySelector('.builder-header .chat-builder-bar')||
            document.querySelector('.chat-builder-bar');
  var l,t;
  if(barra){
    var r=barra.getBoundingClientRect();
    l=r.left+r.width/2-box.offsetWidth/2;
    t=r.bottom+10;
  }else{
    l=(window.innerWidth-box.offsetWidth)/2;
    t=90;
  }
  // Non deve mai uscire dallo schermo: su finestre basse si alza, su finestre
  // strette si accosta al bordo invece di sparire a meta'.
  if(l<10)l=10;
  if(l+box.offsetWidth>window.innerWidth-10)l=window.innerWidth-box.offsetWidth-10;
  if(t+box.offsetHeight>window.innerHeight-10)t=Math.max(10,window.innerHeight-box.offsetHeight-10);
  box.style.left=Math.round(l)+'px';
  box.style.top=Math.round(t)+'px';
}

// La posizione dipende dalla barra della chat, che si sposta quando la finestra
// cambia o quando si ridimensiona il pannello: senza questo il riquadro
// resterebbe dove si trovava al momento della comparsa.
window.addEventListener('resize',ccPosizionaAnteprima);
function cancelPendingPlan(){
  ccPendingPlan=null;
  var box=document.getElementById('composePreview');
  if(box){box.style.display='none';box.innerHTML=''}
  showToast('Modifica annullata: nulla è cambiato sul canvas');
}

function applyPendingPlan(){
  var plan=ccPendingPlan;
  if(!plan)return;
  ccPendingPlan=null;
  var box=document.getElementById('composePreview');
  if(box){box.style.display='none';box.innerHTML=''}
  if(plan.mode==='create')ccApplyCreate(plan);
  else ccApplyModify(plan);
}

// ── APPLICAZIONE: CREAZIONE ──
function ccApplyCreate(plan){
  pushUndo('generazione da chat');
  B.dbAgentId=null;   // "da zero" crea un nuovo agente salvato, non sovrascrive quello aperto
  B.nodes=[];B.edges=[];B.nextId=1;B.selId=-1;B.selEdgeIdx=-1;

  // Gli id dichiarati dal modello non sono quelli del canvas: si tiene una
  // corrispondenza, altrimenti le connessioni punterebbero a nodi sbagliati.
  var mappa={};
  var startX=120,startY=90,gapY=135;
  plan.nodes.forEach(function(n,i){
    var id=b_addNode(n.t,n.ic||'⚙️',n.n||'Nodo',n.d||'',startX,startY+i*gapY);
    mappa[n.id!==undefined?n.id:(i+1)]=id;
    if(n.config){
      var node=ccNodeById(id);
      // La configurazione proposta si SOMMA a quella iniziale del nodo, non la
      // sostituisce. Prima partiva da {model,temperature} — i valori di un nodo
      // AI — qualunque fosse il tipo: un controllo perdeva così i propri campi
      // e ne guadagnava due che non gli appartengono.
      if(node)node.config=Object.assign(node.config||{},n.config);
    }
  });
  if(plan.agentName)currentAgentName=plan.agentName;

  var archi=plan.edges||plan.connessioni||[];
  if(archi.length){
    // Topologia DICHIARATA dal modello. E' l'unico modo di rappresentare una
    // diramazione in modo sensato: dedurla dall'ordine dell'array collegava la
    // condizione ai due nodi successivi qualunque cosa significassero.
    archi.forEach(function(e){
      var da=mappa[e.da!==undefined?e.da:e.from], a=mappa[e.a!==undefined?e.a:e.to];
      if(!da||!a||da===a)return;
      var porta=e.porta||e.fp||'out';
      var nodoDa=ccNodeById(da);
      // Una porta true/false ha senso solo su una condizione, e una condizione
      // non ha la porta "out": correggere qui evita un arco che il motore
      // ignorerebbe in silenzio.
      if(nodoDa&&nodoDa.type==='cd'&&porta==='out')porta='true';
      if(nodoDa&&nodoDa.type!=='cd'&&porta!=='out')porta='out';
      if(!ccEdgeExists(da,a))b_addEdge(da,porta,a,'in',e.etichetta||e.label||'');
    });
    // Un ramo di condizione lasciato scoperto blocca la validazione: si collega
    // al primo nodo di output disponibile invece di consegnare un flusso che
    // non parte.
    B.nodes.filter(function(n){return n.type==='cd'}).forEach(function(c){
      var porte=B.edges.filter(function(e){return e.from===c.id}).map(function(e){return e.fp});
      var uscita=B.nodes.filter(function(n){return n.type==='ou'})[0];
      if(!uscita)return;
      if(porte.indexOf('true')<0)b_addEdge(c.id,'true',uscita.id,'in','Sì');
      if(porte.indexOf('false')<0)b_addEdge(c.id,'false',uscita.id,'in','No');
    });
  }else{
    // Nessun arco dichiarato: si ricade sulla catena lineare, che resta
    // corretta per i flussi senza diramazioni.
    for(var i=0;i<B.nodes.length-1;i++){
      var from=B.nodes[i],to=B.nodes[i+1];
      if(from.type==='cd'){
        b_addEdge(from.id,'true',to.id,'in','Sì');
        var uscita=B.nodes.filter(function(n){return n.type==='ou'})[0];
        if(uscita&&uscita.id!==to.id)b_addEdge(from.id,'false',uscita.id,'in','No');
      }else if(!ccEdgeExists(from.id,to.id)){
        b_addEdge(from.id,'out',to.id,'in','');
      }
    }
  }

  // La disposizione la calcola il canvas dal grafo vero, invece di impilare i
  // nodi nell'ordine in cui sono arrivati.
  if(typeof bAutoLayout==='function'){try{bAutoLayout(true)}catch(e){}}
  if(typeof fillRequiredDefaults==='function')fillRequiredDefaults(B.nodes);
  ccFinalize('✨ Workflow generato: '+B.nodes.length+' nodi, pronto da eseguire','generato');
}

// ── APPLICAZIONE: MODIFICA CHIRURGICA ──
function ccApplyModify(plan){
  pushUndo('modifica da chat');
  var res=applyOps(plan.ops);
  ccFinalize('✏️ Workflow aggiornato: '+res.applied+' modifiche applicate'+(res.skipped.length?' · '+res.skipped.length+' ignorate':''),'modificato');
  if(res.skipped.length){
    // Un'operazione scartata è un'informazione, non un dettaglio: l'utente deve
    // sapere che parte della sua richiesta non è stata eseguita.
    showToast('⚠️ Non applicate: '+res.skipped.join(' · '));
  }
}

function ccFinalize(toast,verbo){
  // Un flusso composto dalla chat dev'essere eseguibile subito e sottoposto
  // alle stesse politiche di uno costruito a mano (G4, G5).
  if(typeof fillRequiredDefaults==='function')fillRequiredDefaults();
  if(typeof applyPoliciesToCanvas==='function')applyPoliciesToCanvas(true);
  if(typeof clearInvalidNodes==='function')clearInvalidNodes();
  b_render();renderProps(B.selId);
  var input=document.getElementById('chatBuilderInput');
  if(input)input.value='';
  showToast(toast);
  addAct('AI Chat Builder: '+verbo+' workflow');
  if(typeof scheduleAutosave==='function')scheduleAutosave();

  // Una modifica "applicata" ma che lascia il flusso non eseguibile non ha
  // risolto niente: si dice subito cosa manca, invece di lasciarlo scoprire
  // premendo Esegui e leggendo un elenco di errori senza contesto.
  if(typeof validateWorkflow==='function'){
    var resti=validateWorkflow();
    if(resti.length)ccMostraResidui(resti);
  }
}

// Elenco dei problemi rimasti dopo aver applicato una modifica.
//
// Prima era una fila di punti elenco con dentro la frase intera, ripetuta
// identica per ogni nodo: con tre nodi affetti dallo stesso problema si
// leggevano tre volte le stesse due righe e i nomi — l'unica cosa che
// cambiava — annegavano nel testo. I nodi vanno tenuti tutti, perché sono
// tutti da sistemare: è la SPIEGAZIONE che va detta una volta.
//
// Qui i problemi della stessa famiglia si raccolgono sotto un'intestazione
// che li conta, i nomi diventano pastiglie cliccabili che portano al nodo, e
// il perché sta in fondo al gruppo, scritto una volta sola.
var CC_FAMIGLIE={
  'nome-ignoto':{
    titolo:'Blocchi non riconosciuti',
    perche:'Non corrispondono a nessuna voce della palette: non hanno parametri da configurare e '+
           'all\u2019esecuzione non faranno quello che il nome promette. Sostituiscili con i blocchi '+
           'corrispondenti presi dalla palette.'
  }
};

function ccPastiglia(e){
  var nome=String(e.msg||'').replace(/^"([^"]*)".*$/,'$1')||'nodo';
  var salta=(e.nodeId!=null)?('jumpToNode('+e.nodeId+')'):'';
  return '<span class="cc-pastiglia"'+(salta?' onclick="'+salta+'" title="Vai al blocco"':'')+'>'+
    escHtml(nome)+'</span>';
}

function ccMostraResidui(errori){
  var box=document.getElementById('composePreview');
  if(!box)return;
  ccApriRiquadro();

  var perFamiglia={}, sciolti=[];
  errori.forEach(function(e){
    if(e.kind&&CC_FAMIGLIE[e.kind])(perFamiglia[e.kind]=perFamiglia[e.kind]||[]).push(e);
    else sciolti.push(e);
  });

  var corpo='';
  Object.keys(perFamiglia).forEach(function(k){
    var g=perFamiglia[k], f=CC_FAMIGLIE[k];
    corpo+='<div class="cc-gruppo">'+
      '<div class="cc-gruppo-testa">'+escHtml(f.titolo)+
        '<span class="cc-conteggio">'+g.length+'</span></div>'+
      '<div class="cc-pastiglie">'+g.map(ccPastiglia).join('')+'</div>'+
      '<div class="cc-perche">'+f.perche+'</div>'+
    '</div>';
  });
  sciolti.slice(0,5).forEach(function(e){
    var salta=(e.nodeId!=null)?(' onclick="jumpToNode('+e.nodeId+')" title="Vai al blocco"'):'';
    corpo+='<div class="cc-riga"'+salta+'><span class="cc-punto"></span>'+escHtml(e.msg)+'</div>';
  });
  if(sciolti.length>5)corpo+='<div class="cc-altri">e altri '+(sciolti.length-5)+'</div>';

  box.innerHTML=
    '<div class="cp-testa cc-testa-avviso">'+
      '<span style="font-size:15px">\u26a0\ufe0f</span>'+
      '<span style="flex:1;font-size:12.5px;font-weight:800">Modifica applicata, ma il flusso non \u00e8 ancora eseguibile</span>'+
      '<span class="modal-close" title="Chiudi" style="cursor:pointer;font-size:15px;line-height:1" '+
        'onclick="document.getElementById(\'composePreview\').style.display=\'none\'">\u2715</span>'+
    '</div>'+
    '<div class="cp-corpo">'+corpo+'</div>'+
    '<div class="cp-piede">'+
      '<span style="flex:1;font-size:10.5px;color:var(--tx4);line-height:1.4">'+
        'Completa i campi nel pannello a destra, oppure chiedimelo qui.</span>'+
      '<button class="chat-builder-btn" style="flex:0 0 96px;height:32px;justify-content:center" '+
        'onclick="document.getElementById(\'composePreview\').style.display=\'none\'">Ho capito</button>'+
    '</div>';
  ccPosizionaAnteprima();
}

// Fa spazio verticale nella colonna in cui si inserisce, senza scomporre il
// resto del layout che l'utente ha sistemato a mano.
function ccMakeRoom(x,y,gap){
  B.nodes.forEach(function(n){
    if(n.y>=y-10&&Math.abs(n.x-x)<200)n.y+=gap;
  });
}

function ccEdgeExists(from,to){
  return B.edges.some(function(e){return e.from===from&&e.to===to});
}

function applyOps(ops){
  var applied=0,skipped=[];
  ops.forEach(function(o){
    try{
      if(o.op==='add'){
        var anchor=o.dopo!=null?ccNodeById(o.dopo):null;
        var succ=o.prima!=null?ccNodeById(o.prima):null;
        if(o.dopo!=null&&!anchor){skipped.push('inserimento dopo nodo #'+o.dopo+' (inesistente)');return}
        if(o.prima!=null&&!succ){skipped.push('inserimento prima del nodo #'+o.prima+' (inesistente)');return}
        var base=anchor||succ||B.nodes[B.nodes.length-1];
        var nx=base?base.x:120, ny=base?(anchor?base.y+135:base.y):90;
        ccMakeRoom(nx,ny,140);
        var nid=b_addNode(o.t||'ac',o.ic||'⚙️',(o.n||'Nodo').substring(0,28),(o.d||'').substring(0,40),nx,ny);
        var nn=ccNodeById(nid);
        if(o.config)nn.config=Object.assign(nn.config||{},o.config);

        if(anchor&&succ){
          // Inserimento su un arco preciso: l'arco esistente viene deviato.
          var found=false;
          B.edges.forEach(function(e){if(e.from===anchor.id&&e.to===succ.id){e.to=nid;e.tp='in';found=true}});
          if(!found)b_addEdge(anchor.id,'out',nid,'in','');
          b_addEdge(nid,'out',succ.id,'in','');
        }else if(anchor){
          // Si intercettano solo le uscite dalla porta principale: i rami
          // "true"/"false" di una condizione restano dove l'utente li ha messi.
          var outs=B.edges.filter(function(e){return e.from===anchor.id&&(e.fp==='out'||!e.fp)});
          if(outs.length){
            var targets=outs.map(function(e){return {id:e.to,tp:e.tp,label:e.label}});
            B.edges=B.edges.filter(function(e){return !(e.from===anchor.id&&(e.fp==='out'||!e.fp))});
            b_addEdge(anchor.id,'out',nid,'in','');
            targets.forEach(function(t){b_addEdge(nid,'out',t.id,t.tp||'in',t.label||'')});
          }else{
            // Nodo inserito DOPO una condizione. Se una porta e' libera la si
            // usa; se sono occupate entrambe, "dopo la condizione" non puo'
            // voler dire un terzo ramo — una condizione ne ha due — e vuol
            // dire invece: mettilo DENTRO un ramo, prima di quello che c'e'
            // gia'. Si intercetta quindi il ramo indicato (o "true" per
            // difetto) esattamente come si fa con una porta normale.
            // Prima il nodo veniva creato e lasciato scollegato: la modifica
            // sembrava applicata ma il flusso diventava invalido.
            var porta='out';
            if(anchor.type==='cd'){
              var usate={};
              B.edges.forEach(function(e){if(e.from===anchor.id)usate[e.fp]=1});
              if(usate['true']&&usate['false']){
                // Il ramo puo' essere indicato dall'operazione ("porta" o
                // "ramo"); in mancanza si sceglie quello vero, che e' il
                // percorso principale.
                var ramo=(o.porta==='false'||o.ramo==='false'||/\bfalse\b|\bno\b/i.test(String(o.perche||'')))?'false':'true';
                var arco=B.edges.filter(function(e){return e.from===anchor.id&&e.fp===ramo})[0];
                if(arco){
                  var vecchio=arco.to;
                  arco.to=nid; arco.tp='in';
                  if(vecchio!==nid)b_addEdge(nid,'out',vecchio,'in','');
                  applied++;return;
                }
              }
              porta=usate['true']?'false':'true';
            }
            b_addEdge(anchor.id,porta,nid,'in',anchor.type==='cd'?(porta==='true'?'Sì':'No'):'');
          }
        }else if(succ){
          var ins=B.edges.filter(function(e){return e.to===succ.id});
          ins.forEach(function(e){e.to=nid;e.tp='in'});
          b_addEdge(nid,'out',succ.id,'in','');
        }else{
          // Nessun ancoraggio: si aggancia alla coda del flusso.
          var tail=B.nodes.filter(function(n){return n.id!==nid&&!B.edges.some(function(e){return e.from===n.id})});
          if(tail.length)b_addEdge(tail[tail.length-1].id,'out',nid,'in','');
        }
        // Un nodo condizione appena inserito eredita archi con porta "out",
        // che su una condizione NON esiste: il motore li ignorerebbe e i due
        // rami resterebbero scollegati, con il nodo a valle mai eseguito.
        // Le uscite vanno quindi riportate su "true"/"false", e il ramo
        // rimasto scoperto agganciato al primo nodo di output: e' cio' che
        // rende la condizione inserita da chat immediatamente eseguibile.
        if(nn&&nn.type==='cd')ccSistemaCondizione(nid,false);
        applied++;
      }else if(o.op==='update'){
        var un=ccNodeById(o.id);
        if(!un){skipped.push('modifica al nodo #'+o.id+' (inesistente)');return}
        if(o.n)un.name=String(o.n).substring(0,28);
        if(o.d)un.detail=String(o.d).substring(0,40);
        // Fusione, non sostituzione: i campi che la richiesta non menziona
        // restano quelli configurati dall'utente.
        if(o.config)un.config=Object.assign({},un.config||{},o.config);
        applied++;
      }else if(o.op==='remove'){
        var rn=ccNodeById(o.id);
        if(!rn){skipped.push('rimozione del nodo #'+o.id+' (inesistente)');return}
        if(rn.locked){skipped.push('rimozione di "'+rn.name+'" (controllo imposto da politica)');return}
        var inE=B.edges.filter(function(e){return e.to===rn.id});
        var outE=B.edges.filter(function(e){return e.from===rn.id});
        B.edges=B.edges.filter(function(e){return e.from!==rn.id&&e.to!==rn.id});
        // Si ricuce il flusso: togliere un nodo non deve spezzare la catena.
        inE.forEach(function(i){outE.forEach(function(ou){
          if(!ccEdgeExists(i.from,ou.to))B.edges.push({from:i.from,fp:i.fp,to:ou.to,tp:ou.tp||'in',label:i.label||''});
        })});
        B.nodes=B.nodes.filter(function(n){return n.id!==rn.id});
        applied++;
      }else if(o.op==='connect'){
        if(!ccNodeById(o.da)||!ccNodeById(o.a)){skipped.push('collegamento #'+o.da+'→#'+o.a+' (nodo inesistente)');return}
        if(ccEdgeExists(o.da,o.a)){skipped.push('collegamento #'+o.da+'→#'+o.a+' (già presente)');return}
        b_addEdge(o.da,o.porta||'out',o.a,'in',o.etichetta||'');
        applied++;
      }else if(o.op==='disconnect'){
        var before=B.edges.length;
        B.edges=B.edges.filter(function(e){return !(e.from===o.da&&e.to===o.a)});
        if(B.edges.length===before){skipped.push('scollegamento #'+o.da+'→#'+o.a+' (connessione assente)');return}
        applied++;
      }else{
        skipped.push('operazione "'+o.op+'" non riconosciuta');
      }
    }catch(err){
      skipped.push('operazione "'+o.op+'" fallita: '+err.message);
    }
  });
  return {applied:applied,skipped:skipped};
}

// ── G6: SUGGERIMENTI CONTESTUALI ──
// A canvas vuoto si propongono esempi di partenza; a canvas popolato si
// propone ciò che manca davvero a QUESTO flusso, letto dal grafo.
// Ogni suggerimento porta due testi: `label` è la diagnosi che l'utente legge,
// `request` è l'istruzione operativa inviata al modello. Tenerli separati
// serve perché una diagnosi ("il ramo non termina in un output") non è una
// richiesta di modifica, e passata così com'è al modello produceva risposte
// discorsive invece di operazioni sul grafo.
function ccContextualSuggestions(){
  if(!B.nodes.length){
    // Coprono tutte le business unit del catalogo: a canvas vuoto servono a far
    // capire l'ampiezza di cio' che si puo' chiedere, non a proporre il caso
    // migliore. Ognuno porta il settore, cosi' chi lo ha dichiarato nel profilo
    // vede per primi quelli che lo riguardano.
    // Ogni voce porta l'etichetta BREVE mostrata sulla pastiglia e la
    // richiesta COMPLETA inviata al modello: la pastiglia deve stare su una
    // riga — e' cosi' che si legge — mentre al modello serve la frase intera
    // per capire cosa costruire. Il settore serve a mostrare per primi i casi
    // dell'ambito dichiarato nel profilo.
    var esempi=[
      {l:'Qualifica i lead',            s:'Sales',            t:'Qualifica i lead in arrivo e notifica il team sales'},
      {l:'Aggiorna il CRM',             s:'Sales',            t:'Aggiorna il CRM con i dati raccolti dal form del sito'},
      {l:'Bozza di proposta',           s:'Sales',            t:'Prepara una bozza di proposta commerciale dal profilo del cliente'},
      {l:'Analizza le recensioni',      s:'Sales',            t:'Valuta le recensioni dei clienti e segnala quelle negative al team'},
      {l:'Estrai dati da fattura',      s:'Finance',          t:'Estrai i dati da una fattura caricata e registrala in contabilità'},
      {l:'Controlla le note spese',     s:'Finance',          t:'Controlla le note spese e segnala quelle fuori policy'},
      {l:'Riconcilia ordini e fatture', s:'Finance',          t:'Riconcilia gli ordini con le fatture ricevute e segnala le differenze'},
      {l:'Scostamenti di budget',       s:'Finance',          t:'Confronta il budget con il consuntivo e spiega gli scostamenti'},
      {l:'Verifica un fornitore',       s:'Finance',          t:'Verifica i dati di un nuovo fornitore prima dell\'onboarding'},
      {l:'Analizza un CV',              s:'HR',               t:'Analizza un CV e valuta la compatibilità con la posizione aperta'},
      {l:'Kit di benvenuto',            s:'HR',               t:'Prepara il kit di benvenuto per un nuovo assunto'},
      {l:'Pubblica un annuncio',        s:'HR',               t:'Traduci e pubblica gli annunci di lavoro sui canali attivi'},
      {l:'Smista i ticket',             s:'Customer Service', t:'Classifica i ticket di supporto per urgenza e instradali'},
      {l:'Rispondi con la KB',          s:'Customer Service', t:'Rispondi alle domande dei clienti usando la Knowledge Base aziendale'},
      {l:'Bozza di risposta email',     s:'Customer Service', t:'Smista le email in arrivo e prepara una bozza di risposta'},
      {l:'Riepilogo ticket aperti',     s:'Customer Service', t:'Prepara il riepilogo giornaliero dei ticket ancora aperti'},
      {l:'Clausole a rischio',          s:'Legal',            t:'Rileva le clausole a rischio in un contratto e avvisa il legale'},
      {l:'Contratti in scadenza',       s:'Legal',            t:'Sintetizza i contratti in scadenza e avvisa chi li gestisce'},
      {l:'Scadenze dai documenti',      s:'Legal',            t:'Estrai le scadenze dai documenti caricati e crea i promemoria'},
      {l:'Conformità di un contratto',  s:'Legal',            t:'Verifica che un contratto fornitore rispetti i requisiti normativi'},
      {l:'Istruisci un sinistro',       s:'Insurance',        t:'Istruisci una denuncia di sinistro con controllo antifrode'},
      {l:'Riassumi una polizza',        s:'Insurance',        t:'Riassumi una polizza indicando coperture, esclusioni e massimali'},
      {l:'Report di vigilanza',         s:'Insurance',        t:'Prepara la reportistica periodica per l\'autorità di vigilanza'},
      {l:'Errori in produzione',        s:'DevOps',           t:'Monitora gli errori in produzione e apri un ticket su Jira'},
      {l:'Rilascio fallito',            s:'DevOps',           t:'Avvisa il team quando un rilascio fallisce e allega i log'},
      {l:'Rapporto settimanale',        s:'Marketing',        t:'Genera un rapporto settimanale delle vendite e invialo per email'},
      {l:'Analisi dei concorrenti',     s:'Marketing',        t:'Analizza i contenuti dei concorrenti e proponi i temi del mese'},
      {l:'Ottimizza una pagina',        s:'Marketing',        t:'Riscrivi una pagina del sito ottimizzandola per la ricerca'},
      {l:'Sintesi di una riunione',     s:'Produttività',     t:'Riassumi una riunione e distribuisci gli action item'},
      {l:'Note in piano di lavoro',     s:'Produttività',     t:'Trasforma le note sparse della settimana in un piano di lavoro'}
    ];
    // Chi ha dichiarato un settore nel profilo vede per primi i casi del
    // proprio ambito: e' l'unico uso concreto di quel campo, ed evita di
    // proporre a chi lavora in HR un esempio su DevOps.
    var mio=(typeof profileData!=='undefined'&&profileData.settore)?profileData.settore:'';
    if(!window.__ccSeed)window.__ccSeed=Math.floor(Math.random()*esempi.length);
    var QUANTI=12, scelti=[];
    // Prima i due del settore dichiarato, se c'e'.
    esempi.filter(function(e){return mio&&e.s===mio}).slice(0,2).forEach(function(e){scelti.push(e)});
    // Poi si gira l'elenco prendendo un settore diverso a ogni giro: otto
    // pastiglie tutte di vendite direbbero meno di otto che coprono ambiti
    // diversi, che e' il punto — far capire l'ampiezza di cio' che si puo'
    // chiedere, non proporre il caso migliore.
    var usati={}; scelti.forEach(function(e){usati[e.s]=1});
    for(var giro=0;giro<3&&scelti.length<QUANTI;giro++){
      for(var i=0;i<esempi.length&&scelti.length<QUANTI;i++){
        var e=esempi[(window.__ccSeed+i)%esempi.length];
        if(scelti.indexOf(e)>=0)continue;
        if(giro===0&&usati[e.s])continue;      // primo giro: un settore ciascuno
        scelti.push(e); usati[e.s]=1;
      }
    }
    return scelti.map(function(e){return {label:e.l||e.t,request:e.t}});
  }
  var s=[];
  if(!B.nodes.some(function(n){return n.type==='tr'})){
    s.push({label:'Manca il trigger che avvia il flusso',
            request:'Aggiungi in testa al flusso un nodo trigger adatto e collegalo al primo nodo esistente.'});
  }

  if(!B.nodes.some(function(n){return n.type==='gr'&&/eccezion/i.test(n.name)})){
    s.push({label:'Manca la gestione degli errori',
            request:'Aggiungi un controllo "Gestore eccezioni" dopo il nodo che può fallire, in modo che un errore non interrompa il flusso senza traccia.'});
  }

  // Un ramo che si chiude senza output non lascia traccia di cosa è successo.
  var dangling=B.nodes.filter(function(n){
    return n.type!=='ou'&&!B.edges.some(function(e){return e.from===n.id});
  });
  if(dangling.length){
    s.push({label:'Il ramo dopo "'+dangling[0].name+'" non termina in un nodo di registrazione',
            request:'Aggiungi un nodo di output dopo il nodo #'+dangling[0].id+' ("'+dangling[0].name+'") e collegalo, così il ramo termina registrando il risultato.'});
  }

  // Un nodo AI senza alcun controllo a valle produce output non verificato.
  var aiScoperto=B.nodes.filter(function(n){return n.type==='ai'}).find(function(n){
    var visti={},coda=[n.id],trovato=false;
    while(coda.length){
      var cur=coda.shift();
      if(visti[cur])continue;visti[cur]=1;
      B.edges.filter(function(e){return e.from===cur}).forEach(function(e){
        var t=ccNodeById(e.to);
        if(t&&t.type==='gr')trovato=true;
        coda.push(e.to);
      });
    }
    return !trovato;
  });
  if(aiScoperto){
    s.push({label:'Il nodo AI "'+aiScoperto.name+'" non ha controlli a valle',
            request:'Inserisci subito dopo il nodo #'+aiScoperto.id+' ("'+aiScoperto.name+'") un controllo "Convalida output" che verifichi il risultato prima che prosegua.'});
  }

  var orfani=B.nodes.filter(function(n){
    return n.type!=='tr'&&!B.edges.some(function(e){return e.to===n.id});
  });
  if(orfani.length){
    s.push({label:'"'+orfani[0].name+'" non è collegato al flusso',
            request:'Collega il nodo #'+orfani[0].id+' ("'+orfani[0].name+'") al punto più sensato del flusso esistente.'});
  }

  // Se il flusso è già completo si propone comunque un miglioramento: la barra
  // non deve mai restare vuota su un canvas popolato.
  var ai=B.nodes.find(function(n){return n.type==='ai'});
  var haCondizione=B.nodes.some(function(n){return n.type==='cd'});
  var haNotifica=B.nodes.some(function(n){return n.type==='ac'&&/slack|teams|email|notific/i.test(n.name)});
  var haRegistrazione=B.nodes.some(function(n){return n.type==='ac'&&/postgre|mongo|sheets|database|sql/i.test(n.name)});
  var haApprovazione=B.nodes.some(function(n){return n.type==='gr'&&/approvazione/i.test(n.name)});

  // Anche un flusso corretto può essere migliorato: la barra non deve restare
  // vuota su un canvas popolato, altrimenti sembra che non ci sia altro da fare.
  if(!haNotifica)s.push({label:'Avvisa il team del risultato',
    request:'Aggiungi una notifica Slack al team prima del nodo finale.'});
  if(!haRegistrazione)s.push({label:'Registra l\'esito su database',
    request:'Aggiungi un nodo PostgreSQL che registri l\'esito dell\'esecuzione prima del nodo finale.'});
  if(ai&&!B.nodes.some(function(n){return n.type==='gr'&&/mascheramento/i.test(n.name)}))
    s.push({label:'Maschera i dati personali prima dell\'AI',
      request:'Inserisci un controllo "Mascheramento dati" subito prima del nodo #'+ai.id+' ("'+ai.name+'").'});
  if(!haCondizione)s.push({label:'Distingui i casi con una condizione',
    request:'Aggiungi una condizione che separi i casi da trattare in modo diverso, con i due rami collegati.'});
  if(!haApprovazione)s.push({label:'Richiedi approvazione umana',
    request:'Inserisci un controllo "Approvazione umana" prima dell\'azione che scrive su un sistema esterno.'});
  if(ai&&!ai.config.useKB)s.push({label:'Fonda le risposte sulla Knowledge Base',
    request:'Attiva l\'uso della Knowledge Base sul nodo #'+ai.id+' ("'+ai.name+'") impostando useKB a true.'});
  s.push({label:'Gestisci i tentativi falliti',
    request:'Aggiungi un limitatore di frequenza prima delle chiamate esterne e un gestore eccezioni a valle.'});
  if(ai&&!ai.config.outformat||(ai&&ai.config.outformat==='testo'))
    s.push({label:'Vincola l\'output del nodo AI a JSON',
      request:'Imposta il formato di output del nodo #'+(ai?ai.id:'')+' su JSON e aggiungi a valle un controllo "Convalida output" con i campi attesi.'});
  if(!B.nodes.some(function(n){return n.type==='gr'&&/istruzioni ostili/i.test(n.name)})&&B.nodes.some(function(n){return n.type==='tr'&&/email|webhook|form/i.test(n.name)}))
    s.push({label:'Difendi dalle istruzioni ostili in ingresso',
      request:'Inserisci un controllo "Difesa da istruzioni ostili" subito dopo il trigger, prima che il contenuto raggiunga il nodo AI.'});
  if(!B.nodes.some(function(n){return n.type==='gr'&&/confidenza/i.test(n.name)})&&ai)
    s.push({label:'Scarta le risposte poco affidabili',
      request:'Aggiungi un controllo "Soglia di confidenza" dopo il nodo #'+ai.id+', con instradamento a revisione umana sotto soglia.'});
  s.push({label:'Traccia le metriche di esecuzione',
    request:'Aggiungi un nodo Analytics prima della chiusura per registrare durata ed esito di ogni esecuzione.'});
  s.push({label:'Rendi il flusso periodico',
    request:'Sostituisci il trigger attuale con uno Scheduler giornaliero alle 8:00, mantenendo il resto del flusso invariato.'});

  // Il tetto era quattro su diciassette possibili: la maggior parte dei
  // suggerimenti non veniva mai vista. L'area e' scorrevole, quindi mostrarne
  // di piu' non ruba spazio al canvas.
  return s.slice(0,12);
}

// ── STORICO DELLE MODIFICHE (frecce avanti/indietro) ──
// Le scorciatoie Ctrl+Z/Ctrl+Y esistono già, ma una modifica proposta dalla
// chat va poter essere ripercorsa senza conoscerle: le frecce mostrano anche
// COSA si sta annullando o ripristinando.
function renderComposeHistory(){
  var box=document.getElementById('composeHistory');
  if(!box)return;
  var u=(B.undoStack&&B.undoStack.length)?B.undoStack[B.undoStack.length-1]:null;
  var r=(B.redoStack&&B.redoStack.length)?B.redoStack[B.redoStack.length-1]:null;
  if(!u&&!r){box.style.display='none';return}
  box.style.display='flex';
  box.innerHTML=
    '<button class="cc-hist-btn"'+(u?'':' disabled')+' onclick="undoCanvas()" title="'+(u?'Annulla: '+escHtml(u.label||'modifica'):'Niente da annullare')+'">◀</button>'+
    '<span class="cc-hist-lab">'+(u?escHtml(u.label||'modifica'):(r?'inizio':''))+
      ' <span style="color:var(--tx4)">·</span> '+((B.undoStack&&B.undoStack.length)||0)+' modifiche</span>'+
    '<button class="cc-hist-btn"'+(r?'':' disabled')+' onclick="redoCanvas()" title="'+(r?'Ripristina la modifica successiva':'Niente da ripristinare')+'">▶</button>';
}

// ══════════════════════════════════════════════════════════════
// CONTRATTO DEI DATI FRA NODI
// ══════════════════════════════════════════════════════════════
// E' la regola che il modello sbagliava piu' spesso, e che produce i flussi
// "che girano senza fare niente": una condizione che nomina un campo che
// nessuno produce e' sempre falsa, e il ramo a valle non parte mai; un
// segnaposto {{campo}} che nessuno produce finisce scritto tale e quale
// dentro l'email. Entrambi gli errori sono invisibili finche' non si legge
// il registro riga per riga.
// Va detto al modello in modo esplicito, con l'esempio di cosa NON fare.
function ccRegoleDati(){
  return 'CONTRATTO DEI DATI (la regola piu\' importante):\n'+
    '- Un nodo "ai" produce testo libero, A MENO CHE il suo prompt non chieda esplicitamente un JSON. '+
      'Se un nodo a valle deve leggerne un campo, il prompt DEVE finire con: '+
      '"Rispondi SOLO JSON: {campo: tipo, altro: tipo}."\n'+
    '- Una condizione ("cd") puo\' usare SOLO campi dichiarati nello schema JSON di un nodo "ai" a monte. '+
      'Un campo non dichiarato rende la condizione sempre falsa e il ramo non parte MAI.\n'+
    '- Un segnaposto {{campo}} in un\'azione vale solo se quel campo e\' dichiarato da un nodo "ai" a monte '+
      'oppure arriva dal trigger. Altrimenti resta scritto cosi\' com\'e\' nel messaggio.\n'+
    '- Un nodo "ai" che produce testo libero SOSTITUISCE i dati strutturati prodotti prima. '+
      'Non inserirne uno fra il nodo che produce i campi e il nodo che li usa.\n'+
    'SBAGLIATO: prompt "Analizza il CV" (testo libero) + condizione "compatibilita == \'alta\'" '+
      '\u2192 il campo non esiste, il ramo non parte mai.\n'+
    'GIUSTO: prompt "Analizza il CV. Rispondi SOLO JSON: {compatibilita: string, motivazione: string}." '+
      '+ condizione "compatibilita == \'alta\'" + azione con {{motivazione}}.';
}

// Riporta le uscite di una condizione sulle sue porte reali e collega il ramo
// mancante. Usata dopo un inserimento da chat: il modello descrive "aggiungi
// una condizione", non sa nulla delle porte, e senza questo passaggio il nodo
// nasce con archi che il motore non percorre.
function ccSistemaCondizione(id,ricuci){
  var uscite=B.edges.filter(function(e){return e.from===id});
  var usate={};
  uscite.forEach(function(e){
    if(e.fp==='true'||e.fp==='false'){usate[e.fp]=1;return}
    // Il primo arco generico diventa il ramo "vero", il secondo il "falso".
    var porta=usate['true']?'false':'true';
    e.fp=porta; e.label=e.label||(porta==='true'?'Sì':'No'); usate[porta]=1;
  });
  if(ricuci===false)return;
  if(usate['true']&&usate['false'])return;
  // Ramo scoperto: si aggancia a un nodo di output, se c'e'.
  var uscita=B.nodes.filter(function(n){return n.type==='ou'})[0];
  if(!uscita||uscita.id===id)return;
  // Gli archi di ricucitura restano marcati: sono segnaposto, e un successivo
  // inserimento su quel ramo deve PRENDERNE IL POSTO invece di affiancarsi,
  // altrimenti la stessa porta finisce con due archi e il ramo diventa
  // ambiguo.
  if(!usate['true']){b_addEdge(id,'true',uscita.id,'in','Sì');B.edges[B.edges.length-1].auto=true}
  if(!usate['false']){b_addEdge(id,'false',uscita.id,'in','No');B.edges[B.edges.length-1].auto=true}
}
