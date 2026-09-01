// ═══════════════════════════════════════════
// GUIDA INTERATTIVA SULLE SCHERMATE REALI
// ═══════════════════════════════════════════
// Non un video né una sequenza di immagini: la guida naviga l'applicazione
// vera, illumina l'elemento di cui sta parlando e — dove serve — compie
// l'azione al posto dell'utente, così si vede l'effetto invece di leggerne
// la descrizione. Tutto ciò che costruisce viene rimosso alla fine.

var GUIDA={passo:0,attivo:false,canvasSalvato:null,paginaIniziale:null};

var GUIDA_PASSI=[
  {
    pagina:'dashboard', sel:'.sidebar nav',
    titolo:'Le cinque aree della piattaforma',
    testo:'A sinistra il percorso completo: si <strong>costruisce</strong> nel Builder, si <strong>riusa</strong> dal Marketplace, si <strong>controlla</strong> in Log e Governo. Learning Hub e Community sono il contorno formativo.',
    pos:'right'
  },
  {
    pagina:'builder', sel:'.builder-sidebar',
    titolo:'La palette dei componenti',
    testo:'Dieci categorie, 78 componenti. I <strong>Controlli</strong> sono la categoria che distingue un giocattolo da uno strumento aziendale: mascherano dati, convalidano output, chiedono approvazione umana.',
    pos:'right'
  },
  {
    pagina:'builder', sel:'#canvasArea',
    titolo:'Costruiamo un flusso, davvero',
    testo:'Aggiungo tre nodi al posto tuo: un trigger che riceve una richiesta, un nodo AI che la analizza, un output che chiude. Guarda il canvas.',
    azione:function(){
      resetCanvasForNewAgent();
      var t=b_addNode('tr','📥','Webhook','Richiesta in arrivo',140,90);
      var a=b_addNode('ai','🧠','Analisi richiesta','Classifica e riassume',140,240);
      var o=b_addNode('ou','📊','Output','Registra l\'esito',140,390);
      b_addEdge(t,'out',a,'in','');b_addEdge(a,'out',o,'in','');
      fillRequiredDefaults();b_render();
      GUIDA.nodoAI=a;
    },
    pos:'left'
  },
  {
    pagina:'builder', sel:'#canvasArea',
    titolo:'Il flusso deve iniziare e finire bene',
    testo:'Se togliessi l\'output, la validazione bloccherebbe l\'esecuzione: <em>«il ramo non si chiude con un nodo di output»</em>. Un flusso che non registra l\'esito non lascia traccia di cosa ha fatto.',
    pos:'left'
  },
  {
    pagina:'builder', sel:'.ai-panel',
    titolo:'Il modello lo scegli tu',
    testo:'Claude, OpenAI, Gemini, Mistral, oppure un <strong>modello che gira sul tuo computer</strong>. Senza un modello collegato i flussi con nodi AI <strong>non partono</strong>: meglio un errore chiaro di una risposta inventata.',
    pos:'right'
  },
  {
    pagina:'builder', sel:'.chat-builder',
    titolo:'Costruire parlando',
    testo:'Puoi descrivere il flusso a parole invece di trascinare nodi. La proposta viene <strong>mostrata prima</strong> di toccare il canvas, e si applica solo se confermi.',
    pos:'bottom'
  },
  {
    pagina:'builder', sel:'#btnRun',
    titolo:'Esecuzione e interruzione',
    testo:'Eseguo il flusso adesso. Accanto c\'è <strong>Interrompi</strong>, che ferma davvero anche una chiamata già partita, non al nodo successivo.',
    azione:function(){ if(typeof runAgent==='function')runAgent(); },
    attesa:2200,
    pos:'left'
  },
  {
    pagina:'builder', sel:'.exec-log',
    titolo:'Il registro dice cosa è successo',
    testo:'Ogni nodo lascia una riga: cosa ha ricevuto, cosa ha prodotto, quanto ci ha messo. In fondo trovi <strong>«Perché questo risultato»</strong>, che ricostruisce fonti, decisioni e controlli.',
    pos:'top'
  },
  {
    pagina:'execlog', sel:'#execlog-content',
    titolo:'Lo storico è verificabile',
    testo:'Ogni esecuzione conserva la propria traccia. Puoi <strong>rigiocarla</strong> con gli esiti registrati, per capire se una modifica ha cambiato il comportamento.',
    pos:'top'
  },
  {
    pagina:'monitoraggio', sel:'#monitoraggio-body',
    titolo:'Chi governa vede altro',
    testo:'Qui non contano i singoli agenti ma l\'adozione: quanti flussi girano davvero, quanta parte è presidiata da controlli, dove si accumula rischio. In cima <strong>cosa richiede un\'azione</strong>.',
    pos:'top'
  },
  {
    pagina:'marketplace', sel:'#mkt-grid',
    titolo:'Riusare invece di ricostruire',
    testo:'18 agenti pronti. Installandone uno ne ricevi il flusso completo nel Builder, modificabile: è un punto di partenza, non una scatola chiusa.',
    pos:'top'
  },
  {
    pagina:'learning', sel:'#learning-body',
    titolo:'Da qui in poi tocca a te',
    testo:'I percorsi formativi partono dai concetti e arrivano ai casi reali. Puoi riaprire questa guida quando vuoi dal Learning Hub.',
    pos:'top'
  }
];

function guidaOverlay(){
  var o=document.getElementById('guidaOverlay');
  if(o)return o;
  o=document.createElement('div');
  o.id='guidaOverlay';
  o.innerHTML='<div id="tourSpot"></div><div id="tourBox"></div>';
  document.body.appendChild(o);
  return o;
}

function startGuida(daCapo){
  if(GUIDA.attivo)return;
  GUIDA.attivo=true;
  GUIDA.passo=daCapo?0:(parseInt(localStorage.getItem('relaition_tour_passo')||'0',10)||0);
  if(GUIDA.passo>=GUIDA_PASSI.length)GUIDA.passo=0;
  GUIDA.paginaIniziale=currentPage;
  // Il canvas dell'utente non deve essere sacrificato alla dimostrazione:
  // si mette da parte e si rimette esattamente com'era.
  GUIDA.canvasSalvato={nodes:JSON.stringify(B.nodes),edges:JSON.stringify(B.edges),nextId:B.nextId,nome:currentAgentName,dbId:B.dbAgentId,effimero:B.effimero};
  guidaOverlay().style.display='block';
  guidaVai(GUIDA.passo);
}

function guidaVai(i){
  if(i<0)i=0;
  if(i>=GUIDA_PASSI.length){guidaFine(true);return}
  GUIDA.passo=i;
  localStorage.setItem('relaition_tour_passo',String(i));
  var s=GUIDA_PASSI[i];
  if(s.pagina&&currentPage!==s.pagina)go(s.pagina);
  // Il rendering della pagina può essere asincrono: si attende un frame
  // prima di cercare l'elemento da illuminare, altrimenti si illumina il
  // vuoto lasciato dalla pagina precedente.
  setTimeout(function(){
    if(s.azione){try{s.azione()}catch(e){}}
    setTimeout(function(){ guidaDisegna(s,i) }, s.attesa||120);
    if(s.attesa)guidaDisegna(s,i);
  },90);
}

function guidaDisegna(s,i){
  if(!GUIDA.attivo)return;
  var el=s.sel?document.querySelector(s.sel):null;
  var spot=document.getElementById('tourSpot');
  var box=document.getElementById('tourBox');
  if(!spot||!box)return;

  var r=el?el.getBoundingClientRect():{top:window.innerHeight/2-80,left:window.innerWidth/2-200,width:400,height:160,bottom:0,right:0};
  var pad=6;
  spot.style.top=(r.top-pad)+'px';
  spot.style.left=(r.left-pad)+'px';
  spot.style.width=(r.width+pad*2)+'px';
  spot.style.height=(r.height+pad*2)+'px';
  spot.style.display=el?'block':'none';

  box.innerHTML=
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
      '<span style="font-size:10px;font-weight:700;color:var(--ac2);background:var(--ac2-l);padding:3px 8px;border-radius:20px">'+(i+1)+' di '+GUIDA_PASSI.length+'</span>'+
      '<span style="font-size:13px;font-weight:800;flex:1">'+s.titolo+'</span>'+
    '</div>'+
    '<div style="font-size:12px;color:var(--tx2);line-height:1.6">'+s.testo+'</div>'+
    '<div style="height:4px;background:var(--bg3);border-radius:2px;margin:12px 0 10px;overflow:hidden">'+
      '<div style="height:100%;width:'+Math.round((i+1)/GUIDA_PASSI.length*100)+'%;background:var(--ac2);border-radius:2px;transition:width .3s"></div></div>'+
    '<div style="display:flex;gap:6px;align-items:center">'+
      '<button class="tb-btn" style="font-size:11px" onclick="guidaVai('+(i-1)+')"'+(i===0?' disabled style="opacity:.4"':'')+'>← Indietro</button>'+
      '<button class="tb-btn primary" style="font-size:11px;flex:1;justify-content:center" onclick="guidaVai('+(i+1)+')">'+(i===GUIDA_PASSI.length-1?'Concludi':'Avanti →')+'</button>'+
      '<button class="tb-btn" style="font-size:11px" onclick="guidaFine(false)">Esci</button>'+
    '</div>';

  // Il riquadro si posiziona dal lato indicato, ma non deve mai uscire dallo
  // schermo: se non ci sta, si ribalta sul lato opposto.
  var bw=340,bh=box.offsetHeight||190,m=14;
  var top,left;
  var pos=s.pos||'bottom';
  if(pos==='right'){ left=r.right+m; top=r.top; }
  else if(pos==='left'){ left=r.left-bw-m; top=r.top; }
  else if(pos==='top'){ left=r.left+r.width/2-bw/2; top=r.top-bh-m; }
  else { left=r.left+r.width/2-bw/2; top=r.bottom+m; }
  if(left+bw>window.innerWidth-10)left=window.innerWidth-bw-10;
  if(left<10)left=10;
  if(top+bh>window.innerHeight-10)top=window.innerHeight-bh-10;
  if(top<10)top=10;
  box.style.top=top+'px';
  box.style.left=left+'px';
  box.style.width=bw+'px';
}

function guidaFine(completata){
  GUIDA.attivo=false;
  var o=document.getElementById('guidaOverlay');
  if(o)o.style.display='none';
  // Ripristino: la guida ha costruito un flusso di esempio, non deve
  // lasciarlo al posto di quello dell'utente.
  if(GUIDA.canvasSalvato){
    try{
      B.nodes=JSON.parse(GUIDA.canvasSalvato.nodes);
      B.edges=JSON.parse(GUIDA.canvasSalvato.edges);
      B.nextId=GUIDA.canvasSalvato.nextId;
      currentAgentName=GUIDA.canvasSalvato.nome;
      B.dbAgentId=GUIDA.canvasSalvato.dbId;
      B.effimero=GUIDA.canvasSalvato.effimero;
      B.selId=-1;B.selIds=[];
      if(typeof b_render==='function')b_render();
    }catch(e){}
    GUIDA.canvasSalvato=null;
  }
  if(completata){
    localStorage.setItem('relaition_tour_fatto','1');
    localStorage.removeItem('relaition_tour_passo');
    showToast('🎓 Guida completata — puoi rifarla dal Learning Hub');
    addAct('Completata la guida interattiva');
    if(typeof addXP==='function')addXP(50,'Guida interattiva completata');
    go('learning');
  }else{
    showToast('Guida interrotta — riprenderà da dove eri rimasto');
    go(GUIDA.paginaIniziale||'dashboard');
  }
}

// ═══════════════════════════════════════════
// SANDBOX DIDATTICA
// ═══════════════════════════════════════════
// Chi impara ha bisogno di poter sbagliare senza conseguenze. Qui la palette
// è ridotta ai componenti che servono a capire il modello mentale, le azioni
// verso sistemi esterni sono escluse, e nulla viene salvato: non è un
// builder depotenziato, è un banco di prova.

var SANDBOX={attiva:false,paletteSalvata:null,canvasSalvato:null};

// I dodici componenti che bastano a costruire un flusso completo e sensato.
// Le azioni sono solo quelle che non toccano sistemi aziendali reali.
var SANDBOX_COMPONENTI=[
  'Webhook','Scheduler','File upload',
  'Slack','Invia email','HTTP Request',
  'Condition','Output','Logger','Esporta file',
  'Mascheramento dati','Convalida output','Gestore eccezioni'
];

function openSandbox(){
  if(SANDBOX.attiva){go('builder');return}
  SANDBOX.attiva=true;
  SANDBOX.paletteSalvata=PALETTE.slice();
  SANDBOX.canvasSalvato={nodes:JSON.stringify(B.nodes),edges:JSON.stringify(B.edges),nextId:B.nextId,nome:currentAgentName,dbId:B.dbAgentId,effimero:B.effimero};

  // La palette globale viene sostituita, non filtrata alla resa: così ogni
  // percorso che la legge (ricerca, chat builder, validazione) vede lo stesso
  // insieme ridotto, senza controlli sparsi da tenere allineati.
  var ridotta=PALETTE.filter(function(p){
    return p.type==='ai'||SANDBOX_COMPONENTI.indexOf(p.name)>=0;
  });
  PALETTE.length=0;
  ridotta.forEach(function(p){PALETTE.push(p)});

  // Il canvas della sandbox è separato da quello di lavoro e non viene mai
  // salvato: dbAgentId a null impedisce all'autosalvataggio di scrivere.
  B.nodes=[];B.edges=[];B.nextId=1;B.selId=-1;B.selIds=[];
  B.dbAgentId=null;
  currentAgentName='Prova in sandbox';
  go('builder');
  b_render();
  sandboxBanner(true);
  showToast('🧪 Sandbox attiva — '+PALETTE.length+' componenti, nessun dato reale toccato');
}

function closeSandbox(){
  if(!SANDBOX.attiva)return;
  SANDBOX.attiva=false;
  if(SANDBOX.paletteSalvata){
    PALETTE.length=0;
    SANDBOX.paletteSalvata.forEach(function(p){PALETTE.push(p)});
    SANDBOX.paletteSalvata=null;
  }
  if(SANDBOX.canvasSalvato){
    try{
      B.nodes=JSON.parse(SANDBOX.canvasSalvato.nodes);
      B.edges=JSON.parse(SANDBOX.canvasSalvato.edges);
      B.nextId=SANDBOX.canvasSalvato.nextId;
      currentAgentName=SANDBOX.canvasSalvato.nome;
      B.dbAgentId=SANDBOX.canvasSalvato.dbId;
      // Anche lo stato "effimero" va ripristinato: se il canvas era il flusso di
      // esempio, tornando dalla sandbox non deve diventare un agente salvato.
      B.effimero=SANDBOX.canvasSalvato.effimero;
    }catch(e){}
    SANDBOX.canvasSalvato=null;
  }
  B.selId=-1;B.selIds=[];
  sandboxBanner(false);
  if(typeof renderPalette==='function')renderPalette();
  b_render();renderProps(-1);
  showToast('✅ Uscito dalla sandbox — il tuo agente è tornato com\'era');
}

function sandboxBanner(mostra){
  var b=document.getElementById('sandboxBanner');
  if(!mostra){if(b)b.remove();return}
  if(b)return;
  var ca=document.getElementById('canvasArea');
  if(!ca)return;
  b=document.createElement('div');
  b.id='sandboxBanner';
  b.style.cssText='position:absolute;top:0;left:0;right:0;z-index:35;background:linear-gradient(90deg,#FEF3C7,#FDE68A);border-bottom:1px solid #FCD34D;padding:7px 14px;display:flex;align-items:center;gap:10px;font-size:11.5px;color:#78350F';
  b.innerHTML='<span style="font-size:14px">🧪</span>'+
    '<div style="flex:1;line-height:1.45"><strong>Sandbox didattica</strong> — palette ridotta a '+PALETTE.length+' componenti, nessuna scrittura su sistemi esterni, niente salvataggio automatico. Sbaglia pure.</div>'+
    '<button class="tb-btn" style="font-size:11px;height:26px" onclick="closeSandbox()">Esci dalla sandbox</button>';
  ca.appendChild(b);
}

function guidaStato(){
  if(localStorage.getItem('relaition_tour_fatto'))return {stato:'fatta',lab:'🔁 Rivedi la guida'};
  var p=parseInt(localStorage.getItem('relaition_tour_passo')||'0',10);
  if(p>0)return {stato:'iniziata',lab:'▶️ Riprendi la guida (passo '+(p+1)+' di '+GUIDA_PASSI.length+')'};
  return {stato:'nuova',lab:'🎬 Fai il giro guidato'};
}
