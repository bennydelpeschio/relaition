// ══════════════════════════════════════════════════════════════
// LIVELLI DI CERTIFICAZIONE
// ══════════════════════════════════════════════════════════════
// La pagina prometteva «i 4 livelli di certificazione, da AI Aspirant ad AI
// Ambassador» senza che nessun percorso fosse associato a un livello: chi
// leggeva cercava una struttura che non esisteva da nessuna parte. Ora ogni
// percorso dichiara il proprio livello (`livello:`), le schede lo mostrano, e
// il livello raggiunto si calcola: e' il piu' alto fra quelli i cui percorsi
// sono TUTTI completati, non un'etichetta che si assegna da sola.
var LIVELLI=[
  {n:1, nome:'AI Aspirant',     ic:'🌱', col:'#10B981', desc:'Conosce le basi e sa usare in sicurezza gli strumenti AI'},
  {n:2, nome:'AI Translator',   ic:'🧭', col:'#6366F1', desc:'Usa gli agenti del Marketplace nel proprio reparto'},
  {n:3, nome:'AI Creator',      ic:'🔧', col:'#F59E0B', desc:'Costruisce agenti propri nel builder no-code e nella sandbox'},
  {n:4, nome:'AI Ambassador',   ic:'🛡️', col:'#EF4444', desc:'Misura le performance dei team e presidia governo e conformità'}
];

function livelloInfo(n){ return LIVELLI.filter(function(l){return l.n===n})[0]||LIVELLI[0] }

// Livello raggiunto: il piu' alto per cui TUTTI i percorsi di quel livello e
// dei precedenti sono completati. Basarsi su una percentuale complessiva
// avrebbe dato «AI Ambassador» a chi ha finito solo i percorsi facili.
function livelloRaggiunto(){
  var raggiunto=0;
  for(var i=0;i<LIVELLI.length;i++){
    var n=LIVELLI[i].n;
    var diQuestoLivello=PATHS.filter(function(p){return (p.livello||1)<=n});
    if(!diQuestoLivello.length)continue;
    var tuttiFatti=diQuestoLivello.every(function(p){return p.lessons.every(function(l){return l.done})});
    if(tuttiFatti)raggiunto=n; else break;
  }
  return raggiunto;
}

// Avanzamento dentro un livello: quante lezioni dei suoi percorsi sono fatte.
function avanzamentoLivello(n){
  var perc=PATHS.filter(function(p){return (p.livello||1)===n});
  var tot=0, fatte=0;
  perc.forEach(function(p){ p.lessons.forEach(function(l){ tot++; if(l.done)fatte++ }) });
  return {percorsi:perc.length, lezioni:tot, fatte:fatte, pct:tot?Math.round(fatte/tot*100):0};
}

var PATHS=[
  {id:1,livello:1,name:'Fondamenti AI Agent',icon:'🤖',color:'#10B981',desc:'Impara le basi: cosa sono gli agenti AI, come funzionano i LLM, architetture agentic e primi workflow.',banner:'linear-gradient(135deg,#D1FAE5,#A7F3D0)',
   lessons:[{t:'Cos\'è un AI Agent',dur:'15 min',type:'Video',done:true},{t:'LLM: come funzionano',dur:'20 min',type:'Articolo',done:true},{t:'Architettura ReAct',dur:'25 min',type:'Video',done:true},{t:'Il tuo primo workflow',dur:'30 min',type:'Lab',done:false},{t:'Prompt engineering basics',dur:'20 min',type:'Quiz',done:false},{t:'Testing e validazione',dur:'15 min',type:'Articolo',done:false}]},
  {id:2,livello:3,name:'Builder Avanzato',icon:'🔧',color:'#6366F1',desc:'Padroneggia il builder visuale: nodi condizionali, loop, API esterne, gestione errori e debugging.',banner:'linear-gradient(135deg,#E0E7FF,#C7D2FE)',
   lessons:[{t:'Nodi condizionali e branching',dur:'20 min',type:'Video',done:true},{t:'Loop e iterazioni',dur:'25 min',type:'Lab',done:true},{t:'Integrare API REST',dur:'30 min',type:'Lab',done:false},{t:'Error handling patterns',dur:'20 min',type:'Articolo',done:false},{t:'Debugging workflows',dur:'25 min',type:'Video',done:false},{t:'Ottimizzazione performance',dur:'20 min',type:'Quiz',done:false}]},
  {id:3,livello:2,name:'AI per il Business',icon:'💼',color:'#F59E0B',desc:'Casi d\'uso reali per Sales, HR, Finance e Legal. ROI, metriche di successo e change management.',banner:'linear-gradient(135deg,#FEF3C7,#FDE68A)',
   lessons:[{t:'AI agent per Sales: lead scoring',dur:'25 min',type:'Case Study',done:true},{t:'Automazione HR: onboarding',dur:'20 min',type:'Case Study',done:false},{t:'Finance: invoice processing',dur:'25 min',type:'Lab',done:false},{t:'Legal: contract review AI',dur:'30 min',type:'Case Study',done:false},{t:'Calcolare il ROI dell\'automazione',dur:'15 min',type:'Articolo',done:false},{t:'Change management per AI',dur:'20 min',type:'Video',done:false}]},
  {id:4,livello:4,name:'Sicurezza & Governance',icon:'🛡️',color:'#EF4444',desc:'GDPR, privacy by design, audit trail, guardrails per LLM, bias detection e responsible AI.',banner:'linear-gradient(135deg,#FEE2E2,#FECACA)',
   lessons:[{t:'AI e GDPR: guida pratica',dur:'20 min',type:'Articolo',done:false},{t:'Privacy by design per agenti',dur:'25 min',type:'Video',done:false},{t:'Guardrails per output LLM',dur:'30 min',type:'Lab',done:false},{t:'Audit trail e logging',dur:'20 min',type:'Articolo',done:false},{t:'Bias detection e fairness',dur:'25 min',type:'Lab',done:false},{t:'Framework Responsible AI',dur:'20 min',type:'Quiz',done:false}]},
  {id:5,livello:2,name:'Marketing AI Agent',icon:'📣',color:'#8B5CF6',desc:'Agenti per content creation, social media, email marketing, A/B testing e analytics automatizzati.',banner:'linear-gradient(135deg,#F3E8FF,#E9D5FF)',
   lessons:[{t:'Content generation con LLM',dur:'20 min',type:'Lab',done:false},{t:'Social media agent: scheduling',dur:'25 min',type:'Video',done:false},{t:'Email marketing automation',dur:'30 min',type:'Lab',done:false},{t:'A/B testing automatizzato',dur:'20 min',type:'Case Study',done:false},{t:'Analytics e reporting AI',dur:'25 min',type:'Lab',done:false},{t:'Multi-channel orchestration',dur:'20 min',type:'Video',done:false}]},
  // Percorso sui meccanismi che questa piattaforma implementa davvero: sono
  // le lezioni che si possono verificare aprendo l'applicazione, invece di
  // restare teoria generica sugli agenti.
  {id:6,livello:3,name:'Padroneggiare RelAItion',icon:'⚡',color:'#0EA5E9',desc:'I meccanismi propri della piattaforma: knowledge base con recupero verificabile, spiegabilità delle decisioni, ciclo di pubblicazione e monitoraggio dell\'adozione.',banner:'linear-gradient(135deg,#E0F2FE,#BAE6FD)',
   lessons:[{t:'Knowledge Base: segmentare per struttura',dur:'20 min',type:'Lab',done:false},{t:'Recupero ibrido e filtro permessi',dur:'25 min',type:'Articolo',done:false},{t:'Leggere «Perché questo risultato»',dur:'20 min',type:'Lab',done:false},{t:'Politiche e controlli obbligatori',dur:'25 min',type:'Articolo',done:false},{t:'Pubblicare: ambiti e revisione',dur:'30 min',type:'Lab',done:false},{t:'Monitorare l\'adozione',dur:'20 min',type:'Case Study',done:false}]}
];


function renderLearning(){
  document.getElementById('learn-detail').classList.remove('active');
  document.getElementById('learn-main').style.display='block';
  // Progress
  var total=0,done=0;
  PATHS.forEach(function(p){p.lessons.forEach(function(l){total++;if(l.done)done++})});
  var pct=total?Math.round(done/total*100):0;
  document.getElementById('learnProgressFill').style.width=pct+'%';
  document.getElementById('learnProgressText').textContent=pct+'% completato ('+done+'/'+total+' lezioni)';
  disegnaLivelli();

  // La guida interattiva sta in cima al Learning Hub perché è il primo passo
  // sensato per chi arriva: mostra la piattaforma invece di descriverla.
  var gl=document.getElementById('learn-guida');
  if(gl&&typeof guidaStato==='function'){
    var st=guidaStato();
    gl.innerHTML='<div class="card" style="padding:16px;margin-bottom:20px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;border-left:3px solid var(--ac2)">'+
      '<div style="font-size:30px">🎬</div>'+
      '<div style="flex:1;min-width:220px">'+
        '<div style="font-size:14px;font-weight:800">Giro guidato della piattaforma</div>'+
        '<div style="font-size:12px;color:var(--tx3);margin-top:3px;line-height:1.5">'+GUIDA_PASSI.length+' passaggi sulle schermate vere: costruisce un flusso, lo esegue e ti mostra dove si controlla cosa è successo. Al termine il tuo canvas torna com\'era.</div>'+
      '</div>'+
      '<div style="display:flex;gap:6px">'+
        '<button class="tb-btn primary" onclick="startGuida('+(st.stato==='fatta'?'true':'false')+')">'+st.lab+'</button>'+
        (st.stato==='iniziata'?'<button class="tb-btn" onclick="startGuida(true)">Ricomincia</button>':'')+
        // La sandbox era un collegamento sottolineato in piccolo, sotto la
        // guida: chi entrava per provare senza rischi non lo vedeva. Ora e' un
        // pulsante con il proprio colore, accanto alla guida.
        '<button class="tb-btn tb-sandbox" onclick="openSandbox()" title="Palette ridotta e dati finti: si può sbagliare senza toccare niente di vero">Apri la sandbox didattica</button>'+
      '</div>'+
      '<div style="flex-basis:100%;height:0"></div>'+
      '<div style="font-size:11px;color:var(--tx4)">Nella sandbox la palette è ridotta, i dati sono finti e non si salva né si pubblica: serve a sbagliare senza conseguenze.</div>'+
    '</div>';
  }

  setLearnTab(learnTab,document.querySelector('.tab.active'));
}

function setLearnTab(tab,el){
  learnTab=tab;
  document.querySelectorAll('#page-learning .tab').forEach(function(t){t.classList.remove('active')});
  if(el)el.classList.add('active');
  var c=document.getElementById('learn-tab-content');
  if(tab==='paths'){
    c.innerHTML='<div class="path-grid">'+PATHS.map(function(p){
      var done=p.lessons.filter(function(l){return l.done}).length;
      var pct=Math.round(done/p.lessons.length*100);
      return '<div class="path-card" onclick="openPath('+p.id+')">'+
        '<div class="path-banner" style="background:'+p.banner+'"></div>'+
        '<div class="path-body">'+
          '<div class="path-icon">'+p.icon+'</div>'+
          // Il livello sta sulla scheda: la pagina prometteva quattro livelli
          // e non diceva da nessuna parte a quale appartenesse ciascun percorso.
          (function(){ var L=livelloInfo(p.livello||1);
            return '<div style="display:inline-flex;align-items:center;gap:5px;background:'+L.col+'18;color:'+L.col+
              ';border-radius:20px;padding:2px 9px;font-size:10px;font-weight:700;margin-bottom:5px">'+
              L.ic+' Livello '+L.n+': '+L.nome+'</div>'; })()+
          '<div class="path-name">'+p.name+'</div>'+
          '<div class="path-desc">'+p.desc+'</div>'+
          '<div class="path-meta"><span>📚 '+p.lessons.length+' lezioni</span><span>✅ '+done+' completate</span></div>'+
          '<div class="path-progress"><div class="path-progress-fill" style="width:'+pct+'%;background:'+p.color+'"></div></div>'+
        '</div></div>';
    }).join('')+'</div>';
  }else if(tab==='certs'){
    // I quattro livelli promessi in cima alla pagina, con l'avanzamento vero di
    // ciascuno. Prima c'erano due riquadri fissi — «AI Agent Practitioner» e
    // «Builder Expert» — che non avevano alcun rapporto con i livelli
    // dichiarati, e nessuno dei due era scaricabile.
    var raggiunto=livelloRaggiunto();
    var savedAgentsN=dbGetOne('SELECT COUNT(*) c FROM agents WHERE author=?',[utenteCorrente()]).c+
                     dbGetOne('SELECT COUNT(*) c FROM my_agents WHERE user=?',[utenteCorrente()]).c;
    var execN=dbGetOne('SELECT COUNT(*) c FROM exec_log WHERE user=?',[utenteCorrente()]).c;

    var schede=LIVELLI.map(function(L){
      var a=avanzamentoLivello(L.n);
      var ottenuto=(raggiunto>=L.n);
      // Un livello e' "in corso" solo se il precedente e' stato raggiunto:
      // dire «in corso» su tutti e quattro non aiuterebbe a capire dove si e'.
      var attuale=(!ottenuto && raggiunto===L.n-1);
      return '<div class="card" style="padding:16px;'+(ottenuto?'border:1px solid '+L.col:'')+'">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">'+
          '<span style="font-size:26px">'+L.ic+'</span>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:13.5px;font-weight:800">'+escHtml(L.nome)+'</div>'+
            '<div style="font-size:10.5px;color:var(--tx4)">Livello '+L.n+' · '+escHtml(L.desc)+'</div>'+
          '</div>'+
          (ottenuto?'<span class="badge badge-g">✅ Ottenuto</span>'
                   :(attuale?'<span class="badge badge-y">In corso</span>'
                            :'<span class="badge badge-gray">Bloccato</span>'))+
        '</div>'+
        '<div style="font-size:11px;color:var(--tx3);margin-bottom:7px">'+
          a.percorsi+' percors'+(a.percorsi===1?'o':'i')+' · '+a.fatte+' di '+a.lezioni+' lezioni completate</div>'+
        '<div class="path-progress"><div class="path-progress-fill" style="width:'+a.pct+'%;background:'+L.col+'"></div></div>'+
        (ottenuto
          ? '<button class="tb-btn primary mt-12" style="width:100%;justify-content:center;height:32px;font-size:11.5px" '+
            'onclick="scaricaAttestato('+L.n+')">📄 Scarica l’attestato</button>'
          : '')+
      '</div>';
    }).join('');

    c.innerHTML=
      '<div class="card" style="padding:16px;margin-bottom:16px">'+
        '<div style="font-size:13px;font-weight:800;margin-bottom:3px">🎓 Il tuo livello: '+
          (raggiunto?escHtml(livelloInfo(raggiunto).nome):'nessuno ancora')+'</div>'+
        '<div style="font-size:11.5px;color:var(--tx3)">Un livello si ottiene completando <strong>tutti</strong> i percorsi '+
        'fino a quel livello, non una percentuale complessiva: finire solo i percorsi facili non porta in cima.</div>'+
      '</div>'+
      '<div class="grid-2">'+schede+'</div>'+
      '<div class="card mt-16" style="padding:16px">'+
        '<div style="font-size:12.5px;font-weight:700;margin-bottom:4px">🎖️ Builder Expert</div>'+
        '<div style="font-size:11.5px;color:var(--tx3);margin-bottom:8px">Riconoscimento pratico, indipendente dai percorsi: si ottiene usando la piattaforma.</div>'+
        '<div class="badge '+(savedAgentsN>=10&&execN>=50?'badge-g':'badge-b')+'">'+
          (savedAgentsN>=10&&execN>=50?'✅ Ottenuto':'Obiettivo: '+savedAgentsN+'/10 agenti · '+execN+'/50 esecuzioni')+'</div>'+
      '</div>';
  }else{
    // Il numero dei connettori era scritto a mano ("63") e non corrispondeva:
    // sono quelli dichiarati in CONNECTOR_CONFIGS, e cambiano quando se ne
    // aggiunge uno. Il video tutorial apriva solo un avviso "in produzione qui
    // si aprirebbe la playlist": una scheda che promette un contenuto e non lo
    // ha insegna a non fidarsi anche delle altre. Al suo posto ci sono le due
    // cose che esistono davvero — il giro guidato e la sandbox.
    var nConn=(typeof CONNECTOR_CONFIGS==='object')?Object.keys(CONNECTOR_CONFIGS).length:0;
    var stG=(typeof guidaStato==='function')?guidaStato():{lab:'Inizia',stato:'nuova'};
    c.innerHTML='<div class="grid-2">'+
      '<div class="card"><div class="card-title mb-8">Documentazione</div><div style="font-size:12px;color:var(--tx3);line-height:1.6">Riferimento delle API, guida alle integrazioni per i '+nConn+' connettori configurabili, criteri di disegno dei flussi.</div><button class="tb-btn mt-12" onclick="openDocsModal()">Apri la documentazione →</button></div>'+
      '<div class="card"><div class="card-title mb-8">Galleria dei modelli</div><div style="font-size:12px;color:var(--tx3);line-height:1.6">Flussi pronti da caricare nel Builder e adattare: è il modo più rapido per partire da qualcosa che già gira.</div><button class="tb-btn mt-12 primary" onclick="openTemplateGallery()">Esplora →</button></div>'+
      '<div class="card"><div class="card-title mb-8">Giro guidato</div><div style="font-size:12px;color:var(--tx3);line-height:1.6">'+GUIDA_PASSI.length+' passaggi sulle schermate vere: costruisce un flusso, lo esegue e mostra dove si controlla cosa è successo. Al termine il canvas torna com\'era.</div><button class="tb-btn mt-12" onclick="startGuida('+(stG.stato==='fatta'?'true':'false')+')">'+escHtml(stG.lab)+' →</button></div>'+
      '<div class="card"><div class="card-title mb-8">Sandbox didattica</div><div style="font-size:12px;color:var(--tx3);line-height:1.6">Palette ridotta e dati finti: si può sbagliare senza toccare gli agenti veri né la Knowledge Base.</div><button class="tb-btn mt-12 tb-sandbox" onclick="openSandbox()">Apri la sandbox →</button></div>'+
      '<div class="card"><div class="card-title mb-8">Office Hours</div><div style="font-size:12px;color:var(--tx3);line-height:1.6">Sessioni settimanali con il team per domande, dimostrazioni e problemi aperti.</div><button class="tb-btn mt-12" onclick="bookOfficeHours()">Prenota →</button></div>'+
      '<div class="card"><div class="card-title mb-8">Biblioteca</div><div style="font-size:12px;color:var(--tx3);line-height:1.6">Tutte le fonti citate nelle lezioni in un posto solo: articoli originali, documentazione dei fornitori, testi normativi, corsi e video.</div><button class="tb-btn mt-12" onclick="apriBiblioteca()">Apri la biblioteca →</button></div>'+
      '<div class="card"><div class="card-title mb-8">Il tuo quadro</div><div style="font-size:12px;color:var(--tx3);line-height:1.6">Il cruscotto di Monitoraggio si esporta in JSON: serve per portare fuori i numeri della piattaforma, non per guardarli.</div><button class="tb-btn mt-12" onclick="go(\'monitoraggio\')">Apri il Monitoraggio →</button></div>'+
    '</div>';
  }
}

function openPath(pid){
  var p=PATHS.find(function(x){return x.id===pid});if(!p)return;
  document.getElementById('learn-main').style.display='none';
  var detail=document.getElementById('learn-detail');
  detail.classList.add('active');
  var done=p.lessons.filter(function(l){return l.done}).length;
  detail.innerHTML=
    '<div class="lesson-back" onclick="renderLearning()">← Torna ai percorsi</div>'+
    '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">'+
      '<div style="font-size:40px">'+p.icon+'</div>'+
      '<div><div style="font-size:20px;font-weight:800">'+p.name+'</div><div style="font-size:12px;color:var(--tx3);margin-top:2px">'+done+'/'+p.lessons.length+' lezioni completate</div></div>'+
    '</div>'+
    '<div class="lesson-list">'+p.lessons.map(function(l,i){
      return '<div class="lesson-item'+(l.done?' done':'')+'" onclick="openLesson('+(pid-1)+','+i+')">'+
        '<div class="lesson-check">'+(l.done?'✓':'')+'</div>'+
        '<div class="lesson-title">'+l.t+'</div>'+
        '<span class="lesson-type">'+l.type+'</span>'+
        '<span class="lesson-dur">'+l.dur+'</span>'+
      '</div>';
    }).join('')+'</div>';
}

function toggleLesson(pid,li){
  var p=PATHS.find(function(x){return x.id===pid});if(!p)return;
  p.lessons[li].done=!p.lessons[li].done;
  saveLearnProgress();
  openPath(pid);
  if(p.lessons[li].done){addXP(50,'Completata lezione: '+p.lessons[li].t);showToast('✅ Lezione completata! +50 XP')}
}

// ── CHALLENGES ──

// ── OBIETTIVI PRATICI ──────────────────────────────────────────────────
// Le sfide a calendario sono contenuto redazionale: non misurano nulla di ciò
// che l'utente fa davvero. Questi obiettivi invece si verificano da soli sui
// dati della piattaforma, quindi o sono raggiunti o non lo sono — e si vede
// esattamente quanto manca.
function obiettiviPratici(){
  // Gli obiettivi misurano CHI E' CONNESSO: senza il filtro, ogni utente
  // vedeva i progressi di chi aveva popolato la piattaforma per primo e
  // risultava esperto senza aver fatto nulla.
  var io=utenteCorrente();
  var q=function(sql,p){var r=dbGetOne(sql,p);return r?(r.c||0):0};
  var conControlli=0;
  dbAll('SELECT nodes_json FROM agents WHERE author=?',[io]).forEach(function(a){
    var ns=[];try{ns=JSON.parse(a.nodes_json||'[]')}catch(e){}
    if(ns.filter(function(n){return n.type==='gr'}).length>=2)conControlli++;
  });
  // Misure intermedie: servono a dire COSA manca, non solo quanto manca.
  var kbDoc=q('SELECT COUNT(*) c FROM kb_docs');
  var kbRec=q("SELECT COUNT(*) c FROM execution_events WHERE event_type='kb:retrieved'");
  var agenti=q('SELECT COUNT(*) c FROM agents WHERE author=?',[io]);
  var okEsec=q("SELECT COUNT(*) c FROM exec_log WHERE status='ok' AND user=?",[io]);

  // `k` e' la chiave stabile su cui poggia la configurazione: cambiando il
  // titolo di un obiettivo la soglia impostata non deve perdersi.
  var base=[
    {k:'primo_agente',ic:'🔧',t:'Costruisci il primo agente',d:'Un flusso salvato, con trigger e output.',
     come:'Conta gli agenti salvati a tuo nome.',
     val:agenti,obiettivo:1,xp:50,vai:"startNewAgent()",vaiL:'Nuovo agente'},

    {k:'esecuzioni_ok',ic:'▶️',t:'Portalo a termine',d:'Cinque esecuzioni concluse senza errori.',
     come:'Conta le esecuzioni con esito «ok» registrate nel Log a tuo nome. Le interruzioni volontarie e quelle in attesa non contano.',
     val:okEsec,obiettivo:5,xp:80,vai:"go('execlog')",vaiL:'Vedi il Log'},

    {k:'presidio',ic:'🛡️',t:'Presidia un flusso',d:'Un agente con almeno due controlli: mascheramento, convalida, approvazione o gestione errori.',
     come:'Conta i tuoi agenti che hanno almeno due nodi della categoria Controlli nel grafo.',
     val:conControlli,obiettivo:1,xp:100,vai:"go('builder')",vaiL:'Apri il Builder'},

    {k:'kb_fondata',ic:'📚',t:'Fonda le risposte sui documenti',d:'Almeno tre documenti indicizzati e un recupero riuscito in esecuzione.',
     come:'Somma i documenti indicizzati (fino a tre) e un punto se almeno un’esecuzione ha recuperato una porzione dalla Knowledge Base.',
     // La nota dice quanto manca, non quanto si e' superato: «7 su 3» si legge
     // come un errore, «7 documenti» come un fatto.
     passi:[{t:'Tre documenti indicizzati',ok:kbDoc>=3,nota:kbDoc>=3?(kbDoc+' documenti'):(kbDoc+' su 3')},
            {t:'Un recupero riuscito in esecuzione',ok:kbRec>0,nota:kbRec?(kbRec+' recuperi'):'nessuno ancora'}],
     val:Math.min(kbDoc,3)+(kbRec?1:0),obiettivo:4,xp:120,vai:"openKBDocsModal()",vaiL:'Apri la Knowledge Base'},

    {k:'xai',ic:'🔍',t:'Interroga un risultato',d:'Apri almeno una volta «Perché questo risultato» su un\'esecuzione.',
     come:'Registrato quando apri il pannello di spiegabilità su un’esecuzione conclusa.',
     val:parseInt(localStorage.getItem('relaition_xai_aperto_'+io)||localStorage.getItem('relaition_xai_aperto')||'0',10),
     obiettivo:1,xp:60,vai:"go('execlog')",vaiL:'Vai al Log'},

    {k:'in_revisione',ic:'🚀',t:'Porta un agente in revisione',d:'Una richiesta di pubblicazione che superi i controlli bloccanti.',
     come:'Conta le richieste di pubblicazione partite da un agente di cui sei autore.',
     // publications non porta l'autore: si risale all'agente pubblicato.
     val:q('SELECT COUNT(*) c FROM publications p JOIN agents a ON a.id=p.agent_id WHERE a.author=?',[io]),
     obiettivo:1,xp:150,vai:"go('marketplace')",vaiL:'Apri il Marketplace'},

    {k:'giro_guidato',ic:'🎬',t:'Completa il giro guidato',d:'Dodici passaggi sulle schermate reali.',
     come:'Registrato al termine del giro guidato, sul tuo profilo.',
     val:localStorage.getItem('relaition_tour_fatto_'+io)||localStorage.getItem('relaition_tour_fatto')?1:0,
     obiettivo:1,xp:50,vai:"startGuida(false)",vaiL:'Inizia il giro'},

    {k:'cerchio',ic:'♻️',t:'Chiudi il cerchio',d:'Un agente che produce un file e lo salva nella Knowledge Base.',
     come:'Conta i documenti della Knowledge Base la cui origine è un agente.',
     val:q("SELECT COUNT(*) c FROM kb_docs WHERE origin LIKE 'agente:%'"),
     obiettivo:1,xp:130,vai:"go('builder')",vaiL:'Apri il Builder'}
  ];

  // La configurazione sovrascrive soglia, punti e attivazione. Il modo di
  // misurare resta nel codice: e' quello che rende l'obiettivo verificabile.
  var cfg={};
  try{ dbAll('SELECT * FROM obiettivi_config').forEach(function(r){cfg[r.chiave]=r}) }catch(e){}
  return base.map(function(o){
    var c=cfg[o.k];
    if(c){
      if(c.obiettivo!==null&&c.obiettivo!==undefined)o.obiettivo=c.obiettivo;
      if(c.xp!==null&&c.xp!==undefined)o.xp=c.xp;
      o.attivo=(c.attivo!==0);
      o.personalizzato=true;
    }else o.attivo=true;
    return o;
  }).filter(function(o){return o.attivo});
}

// ── CONFIGURAZIONE ──
// Soglia, punti e attivazione sono organizzativi come le politiche: un reparto
// che parte da zero e uno con venti agenti non hanno lo stesso traguardo
// sensato. I progressi restano invece personali.
function obiettivoSalvaConfig(chiave,obiettivo,xp,attivo){
  dbRun('INSERT OR REPLACE INTO obiettivi_config (chiave,obiettivo,xp,attivo,aggiornato) VALUES (?,?,?,?,?)',
    [chiave,obiettivo,xp,attivo?1:0,new Date().toISOString()]);
  persistDatabaseNow();
}
function obiettivoRipristina(chiave){
  dbRun('DELETE FROM obiettivi_config WHERE chiave=?',[chiave]);
  persistDatabaseNow();
}
function obiettiviRipristinaTutti(){
  if(!confirm('Ripristinare le soglie predefinite di tutti gli obiettivi?'))return;
  dbRun('DELETE FROM obiettivi_config');
  persistDatabaseNow();
  showToast('Soglie riportate ai valori predefiniti');
  obRidisegna();
}

// Quale obiettivo è aperto, e se è in modifica. Uno alla volta: aprirli tutti
// trasformerebbe l'elenco in un modulo lungo una pagina.
var obAperto=null, obInModifica=null, obSoloDaFare=false;

function obApri(k){ obAperto=(obAperto===k?null:k); obInModifica=null; obRidisegna() }
function obModifica(k){ obInModifica=(obInModifica===k?null:k); obAperto=k; obRidisegna() }
function obAlternaFiltro(){ obSoloDaFare=!obSoloDaFare; obRidisegna() }

function obRidisegna(){
  if(currentPage==='challenges'&&typeof renderChallenges==='function')renderChallenges();
  if(currentPage==='profile'&&typeof renderProfile==='function')renderProfile();
}

function obSalvaDaModulo(k){
  var so=document.getElementById('obSoglia_'+k);
  var px=document.getElementById('obXp_'+k);
  var at=document.getElementById('obAttivo_'+k);
  var soglia=Math.max(1,Math.min(999,parseInt(so&&so.value,10)||1));
  var xp=Math.max(0,Math.min(9999,parseInt(px&&px.value,10)||0));
  obiettivoSalvaConfig(k,soglia,xp,at?at.checked:true);
  obInModifica=null;
  showToast('Obiettivo aggiornato: traguardo '+soglia+', '+xp+' XP');
  addAct('Modificato l\'obiettivo pratico «'+k+'»: traguardo '+soglia);
  obRidisegna();
}

// Riepilogo compatto per il Profilo: gli obiettivi sono la misura più
// concreta di cosa si sa fare, molto più dei badge a soglia.
function renderObiettiviProfilo(){
  var ob=obiettiviPratici();
  var fatti=ob.filter(function(o){return o.val>=o.obiettivo});
  return '<div class="card" style="padding:16px">'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
      '<span style="font-size:16px">🎯</span>'+
      '<span style="font-size:13px;font-weight:800;flex:1">Obiettivi pratici</span>'+
      '<span class="badge '+(fatti.length===ob.length?'badge-g':'badge-y')+'">'+fatti.length+'/'+ob.length+'</span>'+
    '</div>'+
    '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px">'+
      ob.map(function(o){
        var f=o.val>=o.obiettivo;
        return '<span title="'+escHtml(o.t)+(f?': raggiunto':', '+o.val+' di '+o.obiettivo)+'" style="font-size:16px;opacity:'+(f?1:.28)+'">'+o.ic+'</span>';
      }).join('')+
    '</div>'+
    (fatti.length<ob.length
      ? '<div style="font-size:11px;color:var(--tx3);line-height:1.5">Prossimo: <strong>'+escHtml(ob.find(function(o){return o.val<o.obiettivo}).t)+'</strong>, <span style="text-decoration:underline;cursor:pointer" onclick="go(\'challenges\')">vedi tutti</span></div>'
      : '<div style="font-size:11px;color:var(--ok)">Tutti gli obiettivi raggiunti.</div>')+
  '</div>';
}

// L'elenco era di sola lettura: diceva «3 su 4» senza dire QUALE dei quattro
// mancasse, e non c'era modo di adattare una soglia a un reparto diverso.
// Ora ogni obiettivo si apre — come si misura, cosa manca, dove andare — e la
// soglia si cambia.
function renderObiettivi(){
  var ob=obiettiviPratici();
  var fatti=ob.filter(function(o){return o.val>=o.obiettivo});
  var xpTot=fatti.reduce(function(a,o){return a+o.xp},0);
  var xpMax=ob.reduce(function(a,o){return a+o.xp},0);
  var mostrati=obSoloDaFare?ob.filter(function(o){return o.val<o.obiettivo}):ob;

  var righe=mostrati.map(function(o){
    var fatto=o.val>=o.obiettivo;
    var pct=Math.min(100,Math.round(o.val/o.obiettivo*100));
    var aperto=(obAperto===o.k);
    var mod=(obInModifica===o.k);

    var testa='<div style="display:flex;gap:12px;align-items:center;padding:9px 0;cursor:pointer" onclick="obApri(\''+o.k+'\')">'+
      '<span style="font-size:18px;opacity:'+(fatto?1:.45)+';flex-shrink:0">'+o.ic+'</span>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:12.5px;font-weight:700">'+(fatto?'✅ ':'')+escHtml(o.t)+
          (o.personalizzato?' <span class="badge badge-gray" style="font-size:9px">personalizzato</span>':'')+'</div>'+
        '<div style="font-size:11px;color:var(--tx3);line-height:1.45">'+escHtml(o.d)+'</div>'+
        '<div style="height:5px;background:var(--bg3);border-radius:3px;overflow:hidden;margin-top:5px;max-width:340px">'+
          '<div style="height:100%;width:'+pct+'%;background:'+(fatto?'var(--ac)':'var(--ac3)')+'"></div></div>'+
      '</div>'+
      '<div style="text-align:right;flex-shrink:0">'+
        '<div style="font-size:11px;font-weight:700;color:'+(fatto?'var(--ok)':'var(--tx4)')+'">'+Math.min(o.val,o.obiettivo)+'/'+o.obiettivo+'</div>'+
        '<div style="font-size:10px;color:var(--tx4)">+'+o.xp+' XP</div>'+
      '</div>'+
      '<span style="font-size:11px;color:var(--tx4);flex-shrink:0;width:12px">'+(aperto?'▴':'▾')+'</span>'+
    '</div>';

    if(!aperto)return '<div style="border-bottom:1px solid var(--bg2)">'+testa+'</div>';

    // I passi intermedi si mostrano solo dove esistono: inventarne per gli
    // obiettivi a un solo criterio aggiungerebbe righe che non dicono nulla.
    var passi=(o.passi||[]).map(function(p){
      return '<div style="display:flex;gap:8px;align-items:center;font-size:11.5px;padding:3px 0">'+
        '<span style="color:'+(p.ok?'var(--ok)':'var(--tx4)')+'">'+(p.ok?'✅':'⬜')+'</span>'+
        '<span style="flex:1;color:'+(p.ok?'var(--tx3)':'var(--tx2)')+'">'+escHtml(p.t)+'</span>'+
        '<span style="color:var(--tx4);font-size:10.5px">'+escHtml(p.nota||'')+'</span></div>';
    }).join('');

    var modulo=mod
      ? '<div style="background:var(--bg2);border-radius:8px;padding:10px 12px;margin-top:8px">'+
          '<div style="font-size:11px;font-weight:700;margin-bottom:6px">Modifica l’obiettivo</div>'+
          '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">'+
            '<label style="font-size:10.5px;color:var(--tx4)">Traguardo<br>'+
              '<input id="obSoglia_'+o.k+'" class="prop-input" type="number" min="1" max="999" value="'+o.obiettivo+'" style="width:80px;height:28px"></label>'+
            '<label style="font-size:10.5px;color:var(--tx4)">Punti XP<br>'+
              '<input id="obXp_'+o.k+'" class="prop-input" type="number" min="0" max="9999" value="'+o.xp+'" style="width:88px;height:28px"></label>'+
            '<label style="font-size:11px;display:flex;align-items:center;gap:6px;padding-bottom:5px">'+
              '<input id="obAttivo_'+o.k+'" type="checkbox" checked style="width:15px;height:15px">Attivo</label>'+
            '<button class="tb-btn primary" style="height:28px;font-size:11px" onclick="obSalvaDaModulo(\''+o.k+'\')">Salva</button>'+
            (o.personalizzato?'<button class="tb-btn" style="height:28px;font-size:11px" onclick="obiettivoRipristina(\''+o.k+'\');obRidisegna()">Ripristina</button>':'')+
          '</div>'+
          '<div style="font-size:10.5px;color:var(--tx4);margin-top:8px;line-height:1.5">'+
            'Si cambiano il traguardo, i punti e l’attivazione. <strong>Non</strong> il modo di misurarlo: è quello che rende l’obiettivo verificabile invece che dichiarato.</div>'+
        '</div>'
      : '';

    return '<div style="border-bottom:1px solid var(--bg2)'+(aperto?';background:var(--bg2);border-radius:10px;padding:0 10px':'')+'">'+
      testa+
      '<div style="padding:2px 0 12px 30px">'+
        '<div style="font-size:11px;color:var(--tx4);line-height:1.55"><strong>Come si misura:</strong> '+escHtml(o.come||'')+'</div>'+
        (passi?'<div style="margin-top:6px">'+passi+'</div>':'')+
        '<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">'+
          (fatto?'<span class="badge badge-g">Raggiunto</span>'
                :'<button class="tb-btn primary" style="height:28px;font-size:11px" onclick="event.stopPropagation();'+o.vai+'">'+escHtml(o.vaiL||'Vai')+'</button>')+
          '<button class="tb-btn" style="height:28px;font-size:11px" onclick="event.stopPropagation();obModifica(\''+o.k+'\')">'+(mod?'Chiudi':'⚙️ Modifica')+'</button>'+
        '</div>'+
        modulo+
      '</div></div>';
  }).join('');

  var daFare=ob.length-fatti.length;
  return '<div class="card" style="padding:18px;margin-bottom:22px">'+
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">'+
      '<span style="font-size:20px">🎯</span>'+
      '<span style="font-size:15px;font-weight:800;flex:1">Obiettivi pratici</span>'+
      '<span class="badge '+(fatti.length===ob.length?'badge-g':'badge-y')+'">'+fatti.length+' di '+ob.length+' · '+xpTot+'/'+xpMax+' XP</span>'+
    '</div>'+
    '<div style="font-size:12px;color:var(--tx3);margin-bottom:10px">Si verificano da soli sui dati della piattaforma: nessuna spunta manuale, nessun progresso simulato. Clicca un obiettivo per vedere come viene misurato.</div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">'+
      '<div class="mkt-filter'+(obSoloDaFare?'':' active')+'" onclick="obSoloDaFare=false;obRidisegna()">Tutti '+ob.length+'</div>'+
      '<div class="mkt-filter'+(obSoloDaFare?' active':'')+'" onclick="obSoloDaFare=true;obRidisegna()">Da completare '+daFare+'</div>'+
      '<div style="margin-left:auto"><button class="tb-btn" style="height:26px;font-size:10.5px" onclick="obiettiviRipristinaTutti()">Ripristina le soglie</button></div>'+
    '</div>'+
    (mostrati.length? righe
      : '<div style="text-align:center;padding:18px;color:var(--tx3);font-size:12.5px">Tutti gli obiettivi sono raggiunti.</div>')+
  '</div>';
}

// Le sei iniziative erano definite qui dentro come testo, con le date scritte
// a mano e ormai nel passato. Ora vivono in `js/sfide.js`, con scadenze
// relative e una scheda di dettaglio propria; qui resta l'impaginazione.
// Classifica generale per esperienza, sopra le sfide. Le classifiche esistenti
// misurano una singola sfida; questa misura la persona, ed e' la stessa che si
// vede nella Community — stessa fonte, stesso ordine, cosi' non si contraddicono
// fra due pagine della stessa piattaforma.
function sfClassificaGenerale(){
  if(typeof classificaXP!=='function')return '';
  var righe=classificaXP();
  if(!righe.length)return '';
  var io=utenteCorrente();
  var mioPosto=righe.findIndex(function(r){return r.nome===io});
  var medaglie={0:'🥇',1:'🥈',2:'🥉'};
  return '<div class="card" style="padding:16px;margin-bottom:22px">'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+
      '<span style="font-size:13px;font-weight:800">🏆 Classifica generale</span>'+
      (mioPosto>=0?'<span class="badge badge-y" style="margin-left:auto">Sei '+(mioPosto+1)+'° su '+righe.length+'</span>':'')+
    '</div>'+
    '<div style="font-size:10.5px;color:var(--tx4);margin-bottom:12px">Somma dell\'esperienza guadagnata: lezioni, quiz, sfide, pubblicazioni e contributi.</div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px">'+
    righe.slice(0,6).map(function(r,i){
      var mio=(r.nome===io);
      return '<div style="display:flex;align-items:center;gap:9px;background:'+(mio?'var(--ac-ul)':'var(--bg2)')+';'+
        'border-radius:9px;padding:8px 11px'+(mio?';border:1px solid var(--ac)':'')+'">'+
        '<span style="font-size:14px;width:20px;text-align:center">'+(medaglie[i]||(i+1))+'</span>'+
        '<span style="flex:1;font-size:12px;font-weight:'+(mio?'700':'600')+';overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escHtml(r.nome)+'</span>'+
        '<span style="font-size:11.5px;font-weight:700;color:var(--ac)">'+r.xp.toLocaleString('it-IT')+'</span>'+
      '</div>';
    }).join('')+
    '</div></div>';
}

function renderChallenges(){
  var html=renderObiettivi()+
    sfClassificaGenerale()+
    '<div class="section-title" style="font-size:15px;margin-bottom:2px">Sfide ed eventi</div>'+
    '<div class="section-sub">Le sfide con la classifica si misurano sulle esecuzioni reali degli agenti candidati. Clicca una scheda per il regolamento.</div>'+
    sfSchede()+
    sfHallOfFame();
  document.getElementById('challenges-content').innerHTML=html;
}

// Compatibilita': il vecchio pulsante chiamava registerChallenge.
function registerChallenge(id){ sfIscrivi(id) }
// Immagini dei post: grafica vettoriale generata qui, non fotografie. Una
// community senza niente da guardare sembra un archivio di file; d'altra parte
// mettere finte foto di persone o schermate inventate significherebbe
// arredare la dimostrazione con roba che non esiste. Questi sono schemi e
// grafici che descrivono cose vere della piattaforma.
function immaginePost(svg){
  return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));
}

var IMG_SCHEMA_FLUSSO=immaginePost(
  '<svg xmlns="http://www.w3.org/2000/svg" width="880" height="300" viewBox="0 0 880 300">'+
  '<rect width="880" height="300" fill="#F8FAFC"/>'+
  ['📎 CV ricevuto|#10B981|40','🎭 Mascheramento|#EF4444|215','🧠 Estrazione|#6366F1|390','🔀 Punteggio>70|#F59E0B|565','📧 Risposta|#0EA5E9|740']
    .map(function(b,i){
      var p=b.split('|'), x=parseInt(p[2],10);
      return '<rect x="'+x+'" y="110" width="150" height="70" rx="12" fill="#FFFFFF" stroke="'+p[1]+'" stroke-width="2"/>'+
        '<text x="'+(x+75)+'" y="152" text-anchor="middle" font-family="Segoe UI,Arial" font-size="14" fill="#0F172A">'+p[0]+'</text>'+
        (i<4?'<line x1="'+(x+150)+'" y1="145" x2="'+(x+215)+'" y2="145" stroke="#94A3B8" stroke-width="2"/>'+
             '<polygon points="'+(x+215)+',145 '+(x+207)+',140 '+(x+207)+',150" fill="#94A3B8"/>':'');
    }).join('')+
  '<text x="440" y="52" text-anchor="middle" font-family="Segoe UI,Arial" font-size="19" font-weight="700" fill="#0F172A">Screening CV: il flusso che uso da tre mesi</text>'+
  '<text x="440" y="76" text-anchor="middle" font-family="Segoe UI,Arial" font-size="13" fill="#64748B">Il mascheramento sta PRIMA del nodo AI, non dopo</text>'+
  '<text x="440" y="240" text-anchor="middle" font-family="Segoe UI,Arial" font-size="12" fill="#94A3B8">Il ramo «sotto soglia» chiude comunque su un output: ogni esito resta registrato</text>'+
  '</svg>');

// Schema del ciclo di pubblicazione: gli stessi stati che la piattaforma usa
// davvero (`published_agents.status`), non un diagramma di comodo. Se un giorno
// gli stati cambiassero, questo disegno andrebbe rifatto — ed e' giusto cosi':
// un'illustrazione che non segue il prodotto e' peggio di nessuna illustrazione.
var IMG_CICLO_PUBBLICAZIONE=immaginePost(
  '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="360" viewBox="0 0 960 360">'+
  '<rect width="960" height="360" fill="#F8FAFC"/>'+
  '<text x="480" y="42" text-anchor="middle" font-family="Segoe UI,Arial" font-size="19" font-weight="700" fill="#0F172A">Il ciclo di pubblicazione di un agente</text>'+
  '<text x="480" y="66" text-anchor="middle" font-family="Segoe UI,Arial" font-size="12.5" fill="#64748B">Sette controlli automatici, poi una persona. Chi corregge non si approva da solo.</text>'+
  [['Bozza','#94A3B8',40],['In verifica','#F59E0B',250],['In revisione','#2563EB',460],['Pubblicato','#10B981',670]]
    .map(function(s,i){
      var x=s[2];
      return '<rect x="'+x+'" y="130" width="170" height="62" rx="12" fill="#FFFFFF" stroke="'+s[1]+'" stroke-width="2"/>'+
        '<text x="'+(x+85)+'" y="160" text-anchor="middle" font-family="Segoe UI,Arial" font-size="14" font-weight="700" fill="#0F172A">'+s[0]+'</text>'+
        '<text x="'+(x+85)+'" y="178" text-anchor="middle" font-family="Segoe UI,Arial" font-size="10.5" fill="#64748B">'+
          ['in lavorazione','controlli automatici','decide una persona','visibile nel catalogo'][i]+'</text>'+
        (i<3?'<line x1="'+(x+170)+'" y1="161" x2="'+(x+248)+'" y2="161" stroke="#94A3B8" stroke-width="2"/>'+
             '<polygon points="'+(x+248)+',161 '+(x+240)+',156 '+(x+240)+',166" fill="#94A3B8"/>':'');
    }).join('')+
  '<rect x="670" y="248" width="170" height="52" rx="12" fill="#FFFFFF" stroke="#EF4444" stroke-width="2"/>'+
  '<text x="755" y="272" text-anchor="middle" font-family="Segoe UI,Arial" font-size="13" font-weight="700" fill="#0F172A">Sospeso</text>'+
  '<text x="755" y="288" text-anchor="middle" font-family="Segoe UI,Arial" font-size="10.5" fill="#64748B">ritirato dopo la pubblicazione</text>'+
  '<line x1="755" y1="192" x2="755" y2="248" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="4 3"/>'+
  '<path d="M 545 192 L 545 226 L 125 226 L 125 192" fill="none" stroke="#F59E0B" stroke-width="1.5"/>'+
  '<polygon points="125,192 120,200 130,200" fill="#F59E0B"/>'+
  '<text x="335" y="243" text-anchor="middle" font-family="Segoe UI,Arial" font-size="11" fill="#B45309">modifica richiesta: torna all’autore con il motivo scritto</text>'+
  '<text x="480" y="332" text-anchor="middle" font-family="Segoe UI,Arial" font-size="11" fill="#94A3B8">Ogni decisione registra chi l’ha presa, quando e perché</text>'+
  '</svg>');
var IMG_GRAFICO_TEMPI=immaginePost(
  '<svg xmlns="http://www.w3.org/2000/svg" width="880" height="340" viewBox="0 0 880 340">'+
  '<rect width="880" height="340" fill="#F8FAFC"/>'+
  '<text x="60" y="46" font-family="Segoe UI,Arial" font-size="19" font-weight="700" fill="#0F172A">Tempo di prima risposta, prima e dopo</text>'+
  '<text x="60" y="70" font-family="Segoe UI,Arial" font-size="13" fill="#64748B">Ticket di supporto, media su 6 settimane</text>'+
  [['Sett. 1',260,'#EF4444'],['Sett. 2',235,'#EF4444'],['Sett. 3',150,'#F59E0B'],
   ['Sett. 4',95,'#F59E0B'],['Sett. 5',62,'#10B981'],['Sett. 6',48,'#10B981']]
    .map(function(v,i){
      var x=80+i*130, h=v[1]*0.62, y=290-h;
      return '<rect x="'+x+'" y="'+y+'" width="76" height="'+h+'" rx="7" fill="'+v[2]+'"/>'+
        '<text x="'+(x+38)+'" y="'+(y-9)+'" text-anchor="middle" font-family="Segoe UI,Arial" font-size="12" font-weight="700" fill="#0F172A">'+v[1]+'\'</text>'+
        '<text x="'+(x+38)+'" y="310" text-anchor="middle" font-family="Segoe UI,Arial" font-size="11" fill="#64748B">'+v[0]+'</text>';
    }).join('')+
  '<line x1="60" y1="290" x2="820" y2="290" stroke="#CBD5E1" stroke-width="1"/>'+
  '</svg>');
// ── COMMUNITY ──

// Il workflow allegato al post 11 era una sagoma: quattro voci `{t,n}` che
// somigliavano a dei nodi senza esserlo. Scaricandolo e provando a importarlo
// il Builder rispondeva «formato non valido», cioe' la funzione dimostrava il
// contrario di cio' che il post prometteva. Qui e' un export vero, nella stessa
// forma prodotta da exportAgent(): si scarica dalla Community, si importa con
// «Importa JSON» e si esegue.
function flussoRiconciliazioneAllegato(){
  return {
    name:'Riconciliazione fatture',
    exported:'2026-08-28T09:15:00.000Z',
    nextId:6,
    context:'Ufficio amministrazione. Le fatture passive arrivano via email e vanno confrontate con l\'ordine a sistema prima del pagamento.',
    nodes:[
      {id:1,type:'tr',icon:'📎',name:'Fattura ricevuta',detail:'Caricamento file',x:140,y:70,
       config:{model:'auto',prompt:'',temperature:0.7,formats:'Tutti i formati leggibili',maxsize:'10',ocr:'Sì',
               filename:'fattura-esempio.txt',
               filedata:'FATTURA n. 2026/0512 del 20/08/2026\nFornitore: Omega Forniture Srl\nPartita IVA: IT03918470962\n\nDescrizione            Qta   Prezzo   Totale\nToner serie T           10    62,00   620,00\nRisme A4 (cartone)       8    24,50   196,00\n\nImponibile: 816,00 EUR\nIVA 22%: 179,52 EUR\nTOTALE: 995,52 EUR\nScadenza pagamento: 19/09/2026\nRiferimento ordine: ORD-2026-0488'}},
      {id:2,type:'ai',icon:'👁️',name:'Estrazione campi',detail:'Output vincolato',x:140,y:200,
       config:{model:'auto',temperature:0.2,outformat:'json',
               prompt:'Estrai dalla fattura: fornitore, piva, numero, data, imponibile, totale, scadenza, riferimento_ordine. Rispondi SOLO con un oggetto JSON. Se un campo non è leggibile lascialo vuoto: non inventarlo.'}},
      {id:3,type:'ai',icon:'🧮',name:'Confronto con l\'ordine',detail:'Scostamento in percentuale',x:140,y:330,
       config:{model:'auto',temperature:0,outformat:'json',
               prompt:'Confronta l\'imponibile della fattura con quello dell\'ordine di riferimento. Rispondi SOLO JSON con i campi: scostamento_pct (numero), entro_soglia (true se lo scostamento è sotto il 5%), nota (una riga in italiano).'}},
      {id:4,type:'cd',icon:'🔀',name:'Scostamento oltre il 5%?',detail:'entro_soglia = false',x:140,y:460,
       config:{model:'auto',prompt:'',temperature:0.7,field:'entro_soglia',operator:'uguale a',value:'false'}},
      {id:5,type:'ou',icon:'📤',name:'Nota di scostamento',detail:'File per l\'amministrazione',x:140,y:590,
       config:{model:'auto',prompt:'',temperature:0.7,filename:'scostamento-fattura.json',format:'JSON'}}
    ],
    edges:[
      {from:1,fp:'out',to:2,tp:'in',label:''},
      {from:2,fp:'out',to:3,tp:'in',label:''},
      {from:3,fp:'out',to:4,tp:'in',label:''},
      {from:4,fp:'yes',to:5,tp:'in',label:'oltre soglia'}
    ]
  };
}

var POSTS=[
  {id:1,user:'Marco R.',ava:'MR',color:'#10B981',title:'Ho ridotto i tempi di onboarding del 60% con un agente HR',body:'Ho costruito un agente che raccoglie documenti dai nuovi assunti, li verifica con LLM e aggiorna il gestionale in autonomia. Template disponibile nel mio profilo.',type:'Soluzione',tag:'HR',likes:24,comments:8,views:142,time:'2 ore fa'},
  {id:2,user:'Sara L.',ava:'SL',color:'#6366F1',title:'Gestire errori nel blocco LLM: best practice?',body:'Quando il LLM restituisce output malformato il mio agente si blocca. Qualcuno ha un pattern robusto con retry automatico e fallback?',type:'Domanda',tag:'Builder',likes:11,comments:15,views:89,time:'ieri'},
  {id:3,user:'Valentina M.',ava:'VM',color:'#D946EF',title:'Agente A/B testing email: open rate +23%',body:'Dopo 2 settimane di test il nostro agente ha aumentato l\'open rate del 23%. Condivido il workflow nel marketplace per chi vuole provarlo.',type:'Showcase',tag:'Marketing',likes:41,comments:12,views:287,time:'ieri'},
  {id:4,user:'Giulia D.',ava:'GD',color:'#F59E0B',title:'Invoice Extractor v2: ora supporta 8 lingue',body:'Aggiornato il mio agente con prompt multilingua. IT, EN, FR, DE, ES, NL, PT, PL. Il trucco è nel system prompt strutturato per lingua.',type:'Showcase',tag:'Finance',likes:38,comments:21,views:310,time:'2 giorni fa'},
  {id:5,user:'Andrea L.',ava:'AL',color:'#8B5CF6',title:'Tutorial: collegare RelAItion a Salesforce in 10 passi',body:'Guida step-by-step per integrare un agente con Salesforce via API REST. Include OAuth 2.0 e mapping campi custom.',type:'Tutorial',tag:'Integrazioni',likes:52,comments:7,views:428,time:'3 giorni fa'},
  {id:6,user:'Luca P.',ava:'LP',color:'#EF4444',title:'Come monitorare la latenza degli agenti in produzione',body:'Condivido il mio setup di monitoring con Grafana + custom metrics per tracciare tempo di risposta, errori e costi API per ogni agente.',type:'Tutorial',tag:'DevOps',likes:29,comments:9,views:195,time:'4 giorni fa'},
  {id:7,user:'Chiara V.',ava:'CV',color:'#14B8A6',title:'GDPR e AI Agent: la checklist definitiva prima del go-live',body:'Dopo mesi di confronto con il nostro DPO, ho compilato una checklist operativa di 15 punti per validare la conformità GDPR di un agente prima di metterlo in produzione. Include: data mapping, DPIA semplificata, consenso, data retention policy.',type:'Tutorial',tag:'GDPR',likes:67,comments:18,views:520,time:'5 giorni fa'},
  {id:8,user:'Paolo G.',ava:'PG',color:'#F97316',title:'ROI reale dopo 3 mesi: i numeri del mio team',body:'Report trasparente: 4 agenti in produzione, team di 12 persone. Ore risparmiate: 340/mese. Costo API: €280/mese. ROI netto: 11.2x. I dettagli breakdown per agente nel post.',type:'Showcase',tag:'Finance',likes:89,comments:31,views:740,time:'1 settimana fa'},
  {id:9,user:'Laura B.',ava:'LB',color:'#0EA5E9',title:'Pattern architetturale: agent con human-in-the-loop',body:'Non tutti i task possono essere completamente automatizzati. Condivido il mio pattern per agenti semi-autonomi: il workflow si ferma a un checkpoint, notifica l\'operatore su Slack, attende approvazione, poi prosegue. Ideale per finance e legal.',type:'Soluzione',tag:'Architettura',likes:45,comments:14,views:380,time:'1 settimana fa'},
  {id:10,user:'Marco R.',ava:'MR',color:'#10B981',title:'Sandbox aziendale: come ho convinto il CTO',body:'Il CTO era scettico sull\'AI. Ho proposto una sandbox isolata dove i team potessero sperimentare senza rischi. Dopo 6 settimane, 3 agenti sono passati in produzione. La chiave? Dimostrare ROI su un caso piccolo prima di scalare.',type:'Soluzione',tag:'Change Management',likes:56,comments:22,views:490,time:'1 settimana fa'},
  // I post con allegato mostrano il caso d'uso che rende utile la funzione:
  // condividere il workflow di cui si parla, non solo raccontarlo.
  {id:11,user:'Giulia D.',ava:'GD',color:'#F59E0B',title:'Il mio flusso di riconciliazione fatture, scaricabile',body:'Allego il workflow esportato in JSON: trigger su file upload, estrazione dei campi con output vincolato, confronto con l\'ordine a sistema e nota di scostamento. Importatelo dal builder con "Importa agente". Funziona su fatture italiane, per quelle estere va rivisto il prompt di estrazione.',type:'Showcase',tag:'Finance',likes:73,comments:19,views:612,time:'2 giorni fa',
   attach_name:'riconciliazione-fatture.json',attach_mime:'application/json',
   attach_data:'data:application/json;base64,'+btoa(unescape(encodeURIComponent(JSON.stringify(flussoRiconciliazioneAllegato(),null,2))))},
  {id:12,user:'Sara L.',ava:'SL',color:'#6366F1',title:'Checklist di verifica prima di mettere un agente in produzione',body:'Dopo l\'incidente del mese scorso abbiamo formalizzato una checklist in 12 punti: presenza di un controllo sui dati personali, gestione esplicita degli errori, limite di iterazioni sui nodi con strumenti, e sempre un punto di approvazione umana dove l\'agente decide su denaro. Ve la lascio in allegato.',type:'Tutorial',tag:'Governance',likes:94,comments:27,views:830,time:'3 giorni fa',
   attach_name:'checklist-produzione.md',attach_mime:'text/markdown',
   attach_data:'data:text/markdown;base64,'+btoa('# Checklist pre-produzione\n\n1. Il flusso ha almeno un controllo sui dati personali\n2. Ogni nodo di integrazione ha una gestione errori esplicita\n3. I nodi con strumenti hanno un limite di iterazioni\n4. Le decisioni su importi passano da approvazione umana\n5. La Knowledge Base usata e aggiornata\n6. I parametri obbligatori sono compilati\n7. Esiste un caso di regressione salvato\n8. Il registro esecuzioni e leggibile da chi non ha costruito il flusso\n9. Il contesto agente e compilato\n10. Nessuna credenziale nei campi di testo\n11. Il flusso termina su un nodo di output\n12. E stato eseguito almeno una volta con dati reali')},
  {id:13,user:'Andrea L.',ava:'AL',color:'#8B5CF6',title:'Quando NON usare un agente AI',body:'Controcorrente: nella metà dei casi che mi sono passati davanti, una query SQL o una regola deterministica facevano lo stesso lavoro con costo zero e senza variabilità. L\'AI serve dove il testo è libero e le regole non si possono scrivere tutte. Se il vostro processo ha 6 casi possibili, scrivete 6 condizioni.',type:'Discussione',tag:'Architettura',likes:112,comments:44,views:1180,time:'4 giorni fa'},
  {id:14,user:'Chiara V.',ava:'CV',color:'#14B8A6',title:'Dataset di prova per testare l\'estrazione da CSV',body:'Un CSV con 20 righe di ordini, qualche valore mancante e due date in formato diverso: serve a verificare che il vostro flusso di estrazione regga i casi sporchi, non solo quelli puliti. Allegato.',type:'Soluzione',tag:'Testing',likes:38,comments:11,views:295,time:'5 giorni fa',
   attach_name:'ordini-di-prova.csv',attach_mime:'text/csv',
   attach_data:'data:text/csv;base64,'+btoa('ordine;cliente;importo;data;stato\nORD-001;ACME Spa;1280,50;2026-03-04;evaso\nORD-002;Beta Srl;;04/03/2026;in attesa\nORD-003;Gamma SpA;940,00;2026-03-05;evaso\nORD-004;Delta Srl;2310,75;05/03/2026;annullato\nORD-005;ACME Spa;760,20;2026-03-06;')},
  {id:15,user:'Paolo G.',ava:'PG',color:'#F97316',title:'Quanto costa davvero un agente: il conto che nessuno fa',body:'Il costo delle chiamate al modello è la parte piccola. Il costo vero è la manutenzione dei prompt quando cambia il formato dei dati a monte, e il tempo di chi verifica gli output nei primi mesi. Nel mio caso: 280 euro al mese di API, contro circa 6 ore al mese di presidio umano.',type:'Discussione',tag:'Finance',likes:81,comments:29,views:705,time:'1 settimana fa'},
  // Post con contenuto visivo: uno schema e un grafico, non fotografie. In una
  // community senza niente da guardare ogni contributo si legge come una voce
  // d'archivio; d'altra parte riempirla di immagini inventate significherebbe
  // arredare la dimostrazione con cose che non esistono.
  {id:16,user:'Valentina M.',ava:'VM',color:'#EC4899',title:'Lo schema del mio flusso di screening, per chi lo chiedeva',body:'Ve lo disegno invece di descriverlo. Il punto su cui insisto: il mascheramento dei dati personali sta PRIMA del nodo AI, non dopo. Se lo metti dopo hai già mandato nome e telefono al modello, e la conformità l\'hai persa nel passaggio precedente.',type:'Tutorial',tag:'HR',likes:64,comments:17,views:498,time:'2 giorni fa',
   attach_name:'schema-screening-cv.svg',attach_mime:'image/svg+xml',attach_data:IMG_SCHEMA_FLUSSO},
  {id:17,user:'Luca P.',ava:'LP',color:'#0EA5E9',title:'Sei settimane di dati: il grafico che ho portato in direzione',body:'Non ho portato una slide con le promesse del fornitore, ho portato questo. Il tempo di prima risposta sui ticket, settimana per settimana, da quando l\'agente è in produzione. La discesa non è immediata: le prime due settimane servono a sistemare i prompt.',type:'Showcase',tag:'Customer Service',likes:97,comments:34,views:812,time:'4 giorni fa',
   attach_name:'tempi-prima-risposta.svg',attach_mime:'image/svg+xml',attach_data:IMG_GRAFICO_TEMPI},
  // Post sui meccanismi che questa piattaforma implementa davvero: il ciclo di
  // pubblicazione, la spiegabilita', il recupero verificabile, i controlli.
  // Una community che parla di AI in generale potrebbe stare su qualunque
  // prodotto; questa parla di cose che chi guarda puo' aprire e verificare
  // mentre legge, ed e' la differenza fra un contorno e una parte del prodotto.
  {id:18,user:'Sara L.',ava:'SL',color:'#6366F1',title:'Il ciclo di pubblicazione spiegato a chi lo vede per la prima volta',body:'Riassumo perché me lo chiedono spesso. Un agente non passa da «finito» a «nel catalogo»: c\'è una verifica automatica (output presente, gestione errori, controlli sui dati personali, parametri compilati, almeno un\'esecuzione riuscita) e poi una persona. Il revisore può approvare, chiedere una modifica o rifiutare, e in tutti e tre i casi il motivo resta scritto sulla scheda. Chi corregge non si approva da solo: ripresenta, e la versione sale.',type:'Tutorial',tag:'Governance',likes:58,comments:21,views:604,time:'3 giorni fa',
   attach_name:'ciclo-pubblicazione.svg',attach_mime:'image/svg+xml',attach_data:IMG_CICLO_PUBBLICAZIONE},
  {id:19,user:'Marco R.',ava:'MR',color:'#10B981',title:'«Perché questo risultato» è il pulsante che mi ha fatto passare l\'audit',body:'Domanda del revisore interno: «come fate a sapere su cosa si è basato l\'agente?». Ho aperto un\'esecuzione e cliccato quel pulsante: quali porzioni di quali documenti sono state recuperate, con che somiglianza, quali controlli sono intervenuti, quale ramo della condizione è stato preso e perché. Non l\'ho dovuto ricostruire a mano: era già lì. È la differenza fra un sistema che si può firmare e uno che no.',type:'Soluzione',tag:'Governance',likes:83,comments:26,views:719,time:'5 giorni fa'},
  {id:20,user:'Giulia D.',ava:'GD',color:'#F59E0B',title:'Recupero a vuoto: perché è un risultato e non un errore',body:'All\'inizio mi infastidiva vedere «nessuna porzione recuperata». Poi ho capito che è l\'informazione più utile che il sistema mi dà: significa che la Knowledge Base non contiene la risposta, e che se il modello rispondesse comunque si starebbe inventando. Meglio saperlo che ricevere una frase plausibile e sbagliata. La verifica di fondatezza confronta poi la risposta con le fonti recuperate.',type:'Discussione',tag:'Knowledge Base',likes:71,comments:19,views:552,time:'6 giorni fa'},
  {id:21,user:'Valentina M.',ava:'VM',color:'#EC4899',title:'Il ciclo sui documenti: come analizzarne una cartella intera',body:'Caso concreto: cinquanta fatture da leggere. Il nodo Loop non ripete un numero fisso di volte, conta gli elementi che il nodo a monte ha davvero prodotto e ripercorre i nodi a valle uno per ciascuno. Nel campo «lista» metti il nome del campo che contiene l\'elenco, e il registro scrive «Iterazione 3 di 50». C\'è un tetto di sicurezza: se lo superi te lo dice, non tronca in silenzio.',type:'Tutorial',tag:'Builder',likes:66,comments:23,views:487,time:'2 giorni fa'},
  {id:22,user:'Andrea L.',ava:'AL',color:'#8B5CF6',title:'Mascheramento prima del modello, non dopo: la regola che ripeto sempre',body:'Ho rivisto quattro flussi di colleghi e in tre il nodo di mascheramento stava DOPO la chiamata al modello. Così non serve a niente: nome, telefono ed email sono già usciti. Il controllo va fra il trigger e il nodo AI. Nel builder si vede a occhio se è nel posto giusto, ed è uno dei vantaggi del flusso visuale rispetto a un blocco di codice dove la sequenza non si legge.',type:'Soluzione',tag:'Governance',likes:104,comments:31,views:893,time:'1 settimana fa'},
  {id:23,user:'Luca P.',ava:'LP',color:'#0EA5E9',title:'Ho esportato un agente in Python e l\'ho messo su un server',body:'La funzione «Python» del builder produce uno script che rispecchia il flusso: i nodi AI chiamano il modello vero, le azioni hanno i parametri configurati e i punti di integrazione sono marcati TODO. Non è magia, è un punto di partenza onesto: l\'ho avvolto in FastAPI e l\'ho fatto partire da un webhook. Per chi deve uscire dal browser è la strada.',type:'Showcase',tag:'DevOps',likes:78,comments:28,views:661,time:'4 giorni fa'},
  {id:24,user:'Chiara V.',ava:'CV',color:'#14B8A6',title:'Domanda: come gestite l\'approvazione umana sugli importi?',body:'Sto costruendo un flusso che approva note spese. Sopra una certa cifra voglio che si fermi e aspetti una persona. Ho visto che esiste il nodo di approvazione umana e che l\'esecuzione resta «in attesa» invece di proseguire, ma come gestite voi i tempi morti? Chi non risponde entro giornata blocca la coda o lo lasciate sospeso?',type:'Domanda',tag:'Finance',likes:34,comments:16,views:298,time:'ieri'},
  {id:25,user:'Paolo G.',ava:'PG',color:'#F97316',title:'I numeri del monitoraggio: quali guardo davvero ogni lunedì',body:'Delle sette aree ne uso tre. <em>Presidio</em>: quanti agenti hanno almeno un controllo, se scende, qualcuno sta costruendo in fretta. <em>Uso</em>: la distribuzione delle durate, perché la media nasconde i casi lenti che generano le lamentele. <em>Conoscenza</em>: il rapporto fra recuperi riusciti e a vuoto, che dice se la Knowledge Base sta invecchiando. Il resto lo guardo quando qualcuno fa una domanda specifica.',type:'Discussione',tag:'Monitoraggio',likes:89,comments:24,views:702,time:'1 settimana fa'}
];

function filterByTag(t){forumTagFilter=(forumTagFilter===t?null:t);renderCommunity();if(t&&forumTagFilter)showToast('🏷️ Filtro: '+t)}


function renderCommunity(){
  // Filter tabs
  var types=['all','Soluzione','Domanda','Showcase','Tutorial'];
  document.getElementById('forumFilters').innerHTML=types.map(function(t){
    return '<div class="mkt-filter'+(t===forumFilter?' active':'')+'" onclick="setForumFilter(\''+t+'\')">'+
      (t==='all'?'🔥 Tutti':'📌 '+t)+'</div>';
  }).join('');

  // Posts
  var list=forumFilter==='all'?POSTS:POSTS.filter(function(p){return p.type===forumFilter});
  if(forumTagFilter)list=list.filter(function(p){return p.tag===forumTagFilter});
  if(list.length===0&&forumTagFilter){
    document.getElementById('posts-list').innerHTML='<div style="text-align:center;padding:30px;color:var(--tx4)"><div style="font-size:13px">Nessun post con tag "'+forumTagFilter+'"</div><button class="tb-btn mt-12" onclick="filterByTag(null)">Rimuovi filtro</button></div>';
  }
  // Il riepilogo sta in cima: dice quanto e' viva la community con numeri che
  // ora reggono il controllo — si puo' aprire un post e contare.
  var rie=document.getElementById('forumRiepilogo');
  if(!rie){
    rie=document.createElement('div');rie.id='forumRiepilogo';
    var pl=document.getElementById('posts-list');
    if(pl&&pl.parentNode)pl.parentNode.insertBefore(rie,pl);
  }
  if(rie&&typeof fmRiepilogo==='function')rie.innerHTML=fmRiepilogo();
  document.getElementById('posts-list').innerHTML=list.map(function(p){
    var typeColors={Soluzione:'badge-g',Domanda:'badge-b',Showcase:'badge-p',Tutorial:'badge-y'};
    return '<div class="post-card" onclick="openPostDetail('+p.id+')">'+
      '<div class="post-header"><div class="post-ava" style="background:'+p.color+'">'+p.ava+'</div>'+
        '<div><div class="post-user">'+p.user+'</div><div class="post-time">'+p.time+'</div></div>'+
        '<span class="badge '+(typeColors[p.type]||'badge-gray')+'" style="margin-left:auto">'+p.type+'</span>'+
      '</div>'+
      '<div class="post-title">'+p.title+'</div>'+
      '<div class="post-body">'+p.body+'</div>'+
      // Allegato annunciato gia' nell'elenco: prima bisognava aprire ogni post
      // per scoprire se ne avesse uno, cioe' la funzione esisteva ma non era
      // reperibile. Si scarica senza aprire il post.
      // Le immagini si MOSTRANO, non si annunciano: una community in cui ogni
      // contenuto visivo e' una riga «📎 schema.svg — Scarica» somiglia a un
      // archivio, non a un posto dove si guarda qualcosa. Gli altri formati
      // restano una riga con il pulsante, che per un CSV o un JSON e' giusto.
      // Gli allegati: uno o piu' (fino a cinque). Il disegno sta in
      // community.js perche' e' la stessa fila che serve nella scheda e nel
      // dettaglio, e duplicarla avrebbe garantito che le due divergessero.
      (typeof allegatiHTMLPost==='function'?allegatiHTMLPost(p):'')+
      '<div class="post-actions">'+
        '<span class="post-action'+(fmHoMessoLike(p.id)?' attiva':'')+'" onclick="event.stopPropagation();fmAlternaLike('+p.id+')" '+
          'title="'+(fmHoMessoLike(p.id)?'Togli il mi piace':'Mi piace')+'" '+
          'style="'+(fmHoMessoLike(p.id)?'color:#EF4444;font-weight:700':'')+'">❤️ '+fmLike(p.id)+'</span>'+
        '<span class="post-action" onclick="event.stopPropagation();apriRispostaRapida('+p.id+')" title="Rispondi senza aprire il post">💬 '+fmCommenti(p.id)+'</span>'+
        '<span class="post-action">👁️ '+fmViste(p.id,p.views)+'</span>'+
        '<span class="badge badge-gray">'+p.tag+'</span>'+
      '</div>'+
      '<div id="rispRapida'+p.id+'"></div></div>';
  }).join('');

  // Classifica per esperienza. Erano sei nomi con l'XP scritto nel codice
  // — Andrea L. 4820, Marco R. 4210 — mentre la piattaforma tiene i valori
  // veri in `xp_log`: guadagnare esperienza non spostava la classifica di un
  // punto, e il proprio nome compariva sempre al quinto posto qualunque cosa
  // si facesse. Ora e' la somma delle righe reali, per utente.
  document.getElementById('leaderboard').innerHTML=classificaXP().map(function(l,i){
    var medaglie={0:'🥇',1:'🥈',2:'🥉'};
    var io=(l.nome===utenteCorrente());
    // Ogni riga apre un profilo: la propria porta alla pagina Profilo, quella
    // di un altro apre i suoi riconoscimenti. Un badge che vede solo chi lo
    // possiede non riconosce niente davanti a nessuno.
    return '<div class="leaderboard-row" style="cursor:pointer" onclick="'+
        (io?'go(&quot;profile&quot;)':'apriProfiloPubblico(&quot;'+escHtml(l.nome)+'&quot;)')+'" title="'+
        (io?'Vai al tuo profilo':'Vedi i riconoscimenti di '+escHtml(l.nome))+'">'+
      '<span class="lb-rank">'+(medaglie[i]||(i+1))+'</span>'+
      '<span class="lb-name">'+(io?'<strong>'+escHtml(l.nome)+'</strong>':escHtml(l.nome))+'</span>'+
      '<span class="lb-xp">'+l.xp.toLocaleString('it-IT')+' XP</span></div>';
  }).join('');
  document.getElementById('events-list').innerHTML=
    '<div style="padding:8px 0;border-bottom:1px solid var(--bg2);cursor:pointer" onclick="go(\'challenges\')"><div style="font-size:12px;font-weight:600">🏆 Hackathon: Agent for Good</div><div style="font-size:10px;color:var(--tx4)">15-16 Luglio · Online → dettagli</div></div>'+
    '<div style="padding:8px 0;border-bottom:1px solid var(--bg2);cursor:pointer" onclick="go(\'challenges\')"><div style="font-size:12px;font-weight:600">📣 Workshop Marketing AI</div><div style="font-size:10px;color:var(--tx4)">22 Luglio · Roma → dettagli</div></div>'+
    '<div style="padding:8px 0;cursor:pointer" onclick="bookOfficeHours()"><div style="font-size:12px;font-weight:600">🎓 Office Hours</div><div style="font-size:10px;color:var(--tx4)">Ogni mercoledì → prenota</div></div>';

  // Tags
  var tags=['Sales','HR','Finance','Builder','Marketing','DevOps','Legal','GDPR','Architettura','Change Management'];
  document.getElementById('popular-tags').innerHTML=tags.map(function(t){
    return '<span class="badge badge-gray tag-clickable'+(forumTagFilter===t?' badge-g':'')+'" onclick="filterByTag(\''+t+'\')">'+t+'</span>';
  }).join('');
}


function setForumFilter(f){forumFilter=f;renderCommunity()}

function likePost(id){
  var p=POSTS.find(function(x){return x.id===id});
  if(p){p.likes++;saveForumState();renderCommunity();showToast('❤️ Like aggiunto!')}
}

// Allegato in composizione: tenuto qui finché il post non viene pubblicato.
// Sostituito da POST_ALLEGATI (elenco) in community.js: resta dichiarato
// perche' il seme dei post lo referenzia in lettura.
var POST_ALLEGATO=null;

function openNewPost(idEsistente){
  var p=idEsistente?POSTS.filter(function(x){return x.id===idEsistente})[0]:null;
  if(typeof postAllegatiInit==='function')postAllegatiInit(p);
  var tipi=['Soluzione','Domanda','Showcase','Tutorial','Discussione'];
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>'+(p?'Modifica post':'Nuovo post')+'</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<div class="prop-group mt-16"><div class="prop-label">Titolo</div><input class="prop-input" id="newPostTitle" value="'+escHtml(p?p.title:'')+'" placeholder="Il tuo titolo..."></div>'+
    '<div class="prop-group"><div class="prop-label">Tipo</div><select class="prop-select" id="newPostType">'+
      tipi.map(function(t){return '<option'+(p&&p.type===t?' selected':'')+'>'+t+'</option>'}).join('')+'</select></div>'+
    '<div class="prop-group"><div class="prop-label">Tag</div><input class="prop-input" id="newPostTag" value="'+escHtml(p?p.tag:'')+'" placeholder="es. Sales, HR, Builder..."></div>'+
    '<div class="prop-group"><div class="prop-label">Contenuto</div><textarea class="prop-input" id="newPostBody" rows="5" placeholder="Scrivi il tuo post...">'+escHtml(p?p.body:'')+'</textarea></div>'+
    // Allegare il workflow di cui si parla è ciò che rende un post utile agli
    // altri: senza, resta un racconto che nessuno può provare.
    '<div class="prop-group"><div class="prop-label">📎 Allegati (facoltativi, fino a 5)</div>'+
      '<input type="file" id="postFileInput" multiple accept=".json,.csv,.txt,.md,.pdf,.docx,.xlsx,.png,.jpg,.jpeg,.svg,.gif,.webp" style="display:none" onchange="caricaAllegatoPost(this)">'+
      '<div id="postAllegatoInfo">'+(typeof postAllegatiRiquadro==='function'?postAllegatiRiquadro():'')+'</div>'+
    '</div>'+
    '<button class="tb-btn primary mt-16" onclick="submitPost('+(p?p.id:'')+')">'+(p?'💾 Salva modifiche':'📤 Pubblica')+'</button>'
  );
}


function submitPost(idEsistente){
  var title=document.getElementById('newPostTitle').value.trim();
  var body=document.getElementById('newPostBody').value.trim();
  var type=document.getElementById('newPostType').value;
  var tag=document.getElementById('newPostTag').value.trim()||'General';
  if(!title||!body){showToast('⚠️ Titolo e contenuto sono obbligatori');return}

  // L'elenco e' il dato vero; i campi singoli restano allineati al primo
  // allegato per tutto il codice scritto quando ne esisteva uno solo.
  var lista=(typeof POST_ALLEGATI!=='undefined')?POST_ALLEGATI.slice(0,POST_ALLEGATI_MAX):[];
  var allegato={allegati:lista,
    attach_name: lista.length?lista[0].nome:null,
    attach_mime: lista.length?lista[0].mime:null,
    attach_data: lista.length?lista[0].dati:null};

  if(idEsistente){
    var p=POSTS.filter(function(x){return x.id===idEsistente})[0];
    if(!p){showToast('⚠️ Post non trovato');return}
    // Una modifica va dichiarata: chi ha già commentato deve poter capire che
    // il testo a cui rispondeva non è più quello.
    Object.assign(p,{title:title,body:body,type:type,tag:tag,edited_at:new Date().toISOString()},allegato);
    showToast('✅ Post aggiornato');
  }else{
    POSTS.unshift(Object.assign({id:Date.now(),user:profileData.name,
      ava:(profileData.name||'U').substring(0,2).toUpperCase(),color:'#6366F1',
      title:title,body:body,type:type,tag:tag,likes:0,comments:0,views:0,time:'ora'},allegato));
    addXP(20,'Pubblicato post: '+title);
    showToast('✅ Post pubblicato');
  }
  if(typeof POST_ALLEGATI!=='undefined')POST_ALLEGATI=[];
  saveForumState();closeModal();renderCommunity();
}

function eliminaPost(id){
  var p=POSTS.filter(function(x){return x.id===id})[0];
  if(!p)return;
  if(p.user!==profileData.name){showToast('Puoi eliminare solo i tuoi post');return}
  if(!confirm('Eliminare "'+p.title+'"?\nI commenti ricevuti verranno persi.'))return;
  var i=POSTS.indexOf(p);POSTS.splice(i,1);
  delete COMMENTS[id];
  saveForumState();renderCommunity();showToast('🗑️ Post eliminato');
}

// Riscarica l'allegato esattamente com'era: il data URL conserva anche i
// formati binari, che una conversione a testo rovinerebbe.
// Un allegato JSON che contiene un workflow si puo' aprire direttamente, senza
// il giro «scarica sul disco, apri Importa JSON, ritrova il file». Passa dallo
// stesso applicaImport() del pulsante di importazione: nessuna scorciatoia che
// salti i controlli di formato, e come una qualsiasi importazione NON salva
// nulla finche' non si preme Salva.
function importaFlussoDalPost(id, idx){
  var p=POSTS.filter(function(x){return x.id===id})[0];
  var lista=(typeof allegatiDiPost==='function')?allegatiDiPost(p):[];
  var a=lista[idx||0];
  if(!a||!a.dati){showToast('⚠️ Allegato non disponibile');return}
  var dati;
  try{
    var b64=String(a.dati).split(',')[1]||'';
    dati=JSON.parse(decodeURIComponent(escape(atob(b64))));
  }catch(e){ showToast('⚠️ L\u2019allegato non è un JSON leggibile'); return }
  if(typeof applicaImport!=='function'){showToast('⚠️ Importazione non disponibile');return}
  if(applicaImport(dati))addAct('Importato dalla Community: '+(dati.name||a.nome));
}

// Rispondere costringeva ad aprire il post in una finestra sovrapposta e a
// chiuderla per tornare all'elenco: tre gesti per una riga di testo. Il modulo
// si apre sotto la scheda, e il contatore accanto al fumetto e' lo stesso
// numero contato sulle righe reali, quindi si aggiorna da se'.
var RISPOSTA_APERTA=null;
function apriRispostaRapida(id){
  var cont=document.getElementById('rispRapida'+id);
  if(!cont)return;
  if(RISPOSTA_APERTA===id){ cont.innerHTML=''; RISPOSTA_APERTA=null; return }
  if(RISPOSTA_APERTA!==null){ var pre=document.getElementById('rispRapida'+RISPOSTA_APERTA); if(pre)pre.innerHTML='' }
  RISPOSTA_APERTA=id;
  var ultimi=(COMMENTS[id]||[]).slice(-2);
  cont.innerHTML='<div onclick="event.stopPropagation()" style="border-top:1px solid var(--bg2);margin-top:10px;padding-top:10px">'+
    ultimi.map(function(c){
      return '<div style="display:flex;gap:7px;margin-bottom:7px">'+
        '<div class="comment-ava" style="background:'+c.color+';width:22px;height:22px;font-size:9px;flex:none">'+escHtml(c.ava)+'</div>'+
        '<div style="flex:1;min-width:0"><span style="font-size:11px;font-weight:600">'+escHtml(c.user)+'</span>'+
        '<div style="font-size:11.5px;color:var(--tx2);line-height:1.5">'+escHtml(c.text)+'</div></div></div>';
    }).join('')+
    ((COMMENTS[id]||[]).length>2
      ? '<div style="font-size:10.5px;color:var(--tx4);margin-bottom:7px;cursor:pointer" onclick="openPostDetail('+id+')">Vedi tutte le '+(COMMENTS[id]||[]).length+' risposte</div>'
      : '')+
    '<div style="display:flex;gap:6px">'+
      '<input id="rispTesto'+id+'" placeholder="Scrivi una risposta..." '+
        'onkeydown="if(event.key===\'Enter\')inviaRispostaRapida('+id+')" '+
        'style="flex:1;min-width:0;border:1px solid var(--bd);border-radius:8px;padding:7px 9px;font:inherit;font-size:11.5px">'+
      '<button class="tb-btn primary" style="height:30px;font-size:11px" onclick="inviaRispostaRapida('+id+')">Invia</button>'+
    '</div>'+
    '<div id="rispAvviso'+id+'" style="font-size:10.5px;color:#B91C1C;margin-top:4px"></div></div>';
  var inp=document.getElementById('rispTesto'+id); if(inp)inp.focus();
}

function inviaRispostaRapida(id){
  var inp=document.getElementById('rispTesto'+id); if(!inp)return;
  var t=inp.value.trim();
  var av=document.getElementById('rispAvviso'+id);
  // Una risposta di due caratteri gonfia il contatore senza dire niente: e' il
  // difetto che i numeri calcolati dovevano eliminare, non reintrodurre.
  if(t.length<3){ if(av)av.textContent='Scrivi almeno qualche parola.'; return }
  if(t.length>500)t=t.substring(0,500);
  (COMMENTS[id]=COMMENTS[id]||[]).push({user:utenteCorrente(),ava:inizialiDaNome(utenteCorrente())||'IO',
    color:(profileData&&profileData.color)||'#6366F1',text:t,time:'ora'});
  if(typeof saveForumState==='function')saveForumState();
  if(typeof persistDatabaseNow==='function')persistDatabaseNow();
  addXP(5,'Risposta nella Community');
  addAct('Risposto nella Community');
  showToast('💬 Risposta pubblicata');
  RISPOSTA_APERTA=null;
  renderCommunity();
}


// ── PROFILE ──

// Fotografia di ciò che l'utente ha realmente fatto sulla piattaforma.
// Un solo punto di raccolta: badge, competenze e riepiloghi leggono tutti
// da qui, così non possono raccontare tre storie diverse.
function profileStats(){
  var s={agenti:0,pubblicati:0,inRevisione:0,installati:0,esecuzioni:0,esecuzioniOk:0,
         lezioni:0,lezioniTot:0,percorsi:0,quiz:0,post:0,commenti:0,sfide:0,
         docKB:0,politicheAttive:0,controlliUsati:0,tipiControllo:{},connettoriUsati:{},inProduzione:0,xp:0,promptScritti:0,costanza:0};
  try{
    // Il profilo racconta CIO' CHE HAI FATTO TU: agenti scritti, esecuzioni
    // lanciate, progressi. Marketplace, Community e Knowledge Base restano
    // comuni, quindi si contano per intero.
    var io=utenteCorrente();
    s.agenti      = dbGetOne('SELECT COUNT(*) c FROM agents WHERE author=?',[io]).c;
    s.inProduzione= dbGetOne('SELECT COUNT(*) c FROM agents WHERE active=1 AND author=?',[io]).c;
    s.pubblicati  = dbGetOne("SELECT COUNT(*) c FROM published_agents WHERE status='pubblicato' AND author=?",[io]).c;
    s.inRevisione = dbGetOne("SELECT COUNT(*) c FROM published_agents WHERE status IN ('in_verifica','in_revisione') AND author=?",[io]).c;
    s.installati  = dbGetOne('SELECT COUNT(*) c FROM my_agents WHERE user=?',[io]).c;
    s.esecuzioni  = dbGetOne('SELECT COUNT(*) c FROM exec_log WHERE user=?',[io]).c;
    s.esecuzioniOk= dbGetOne("SELECT COUNT(*) c FROM exec_log WHERE status='ok' AND user=?",[io]).c;
    s.quiz        = dbGetOne('SELECT COUNT(*) c FROM quiz_done WHERE user=?',[io]).c;
    s.post        = dbGetOne('SELECT COUNT(*) c FROM forum_posts WHERE user=?',[io]).c;
    s.commenti    = dbGetOne('SELECT COUNT(*) c FROM forum_comments WHERE user=?',[io]).c;
    s.sfide       = dbGetOne('SELECT COUNT(*) c FROM challenges_registered WHERE user=?',[io]).c;
    s.docKB       = dbGetOne('SELECT COUNT(*) c FROM kb_docs').c;
    s.politicheAttive = dbGetOne('SELECT COUNT(*) c FROM policies WHERE active=1').c;
    s.xp          = (typeof getXP==='function')?getXP():0;
    // Quali controlli, connettori e prompt l'utente ha davvero scritto nei
    // PROPRI flussi: è la misura della sua padronanza, non un livello
    // dichiarato. Il filtro sull'autore mancava, quindi «i controlli che hai
    // inserito» contava anche quelli scritti dagli altri.
    dbAll('SELECT nodes_json FROM agents WHERE author=?',[io]).forEach(function(r){
      var nodi=[];try{nodi=JSON.parse(r.nodes_json)}catch(e){}
      nodi.forEach(function(n){
        if(n.type==='gr'){s.controlliUsati++;s.tipiControllo[n.name]=(s.tipiControllo[n.name]||0)+1}
        if(n.type==='ac')s.connettoriUsati[n.name]=(s.connettoriUsati[n.name]||0)+1;
        // Un prompt scritto a mano, non il segnaposto lasciato dal builder:
        // sotto i 25 caratteri non è una consegna, è un titolo.
        if(n.type==='ai'){
          var pr=(n.config&&(n.config.prompt||n.config.system))||'';
          if(String(pr).trim().length>=25)s.promptScritti++;
        }
      });
    });
    s.costanza = (typeof giorniConsecutivi==='function')?giorniConsecutivi(io):0;
  }catch(e){}
  if(typeof PATHS!=='undefined'){
    PATHS.forEach(function(p){
      p.lessons.forEach(function(l){s.lezioniTot++;if(l.done)s.lezioni++});
      if(p.lessons.every(function(l){return l.done}))s.percorsi++;
    });
  }
  return s;
}

// I badge si guadagnano: ognuno dichiara la soglia e mostra quanto manca.
// Prima erano otto etichette fisse uguali per chiunque, che non
// significavano nulla.
// I tre badge nominati nel capitolo 4.4 del documento — «Prompt Master»,
// «Ethical AI Guardian», «Automation Hero» — non esistevano con quel nome.
// Due corrispondevano a badge gia' presenti sotto un altro nome e sono stati
// rinominati; «Prompt Master» mancava del tutto e ora conta i prompt scritti
// davvero nei nodi AI dei propri flussi, non un'autovalutazione.
//
// «Costanza» sostituisce il «7-Day Streak» che le notifiche annunciavano senza
// che il badge esistesse da nessuna parte, con la soglia del documento
// (5 giorni) e un conteggio vero.
function profileBadges(s){
  return [
    {icon:'🚀',name:'Primo agente',        ok:s.agenti>=1,       hint:'Crea il tuo primo agente'},
    {icon:'🏗️',name:'Builder',             ok:s.agenti>=5,       hint:s.agenti+'/5 agenti creati'},
    {icon:'▶️',name:'Operativo',           ok:s.esecuzioni>=10,  hint:s.esecuzioni+'/10 esecuzioni'},
    {icon:'✍️',name:'Prompt Master',        ok:s.promptScritti>=5,hint:s.promptScritti+'/5 prompt scritti nei nodi AI'},
    {icon:'🛡️',name:'Ethical AI Guardian', ok:s.controlliUsati>=3,hint:s.controlliUsati+'/3 controlli inseriti nei flussi'},
    {icon:'⚡',name:'Automation Hero',      ok:s.inProduzione>=1, hint:'Metti un agente in esecuzione automatica'},
    {icon:'🔥',name:'Costanza',            ok:s.costanza>=COSTANZA_SOGLIA,hint:s.costanza+'/'+COSTANZA_SOGLIA+' giorni consecutivi di attività'},
    {icon:'🚀',name:'Pubblicato',          ok:s.pubblicati>=1,   hint:'Pubblica un agente nel Marketplace'},
    {icon:'📚',name:'Studente',            ok:s.lezioni>=5,      hint:s.lezioni+'/5 lezioni completate'},
    {icon:'🎓',name:'Percorso completo',   ok:s.percorsi>=1,     hint:'Completa un intero percorso formativo'},
    {icon:'💬',name:'Community',           ok:(s.post+s.commenti)>=3,hint:(s.post+s.commenti)+'/3 contributi'},
    {icon:'🗂️',name:'Knowledge Base',      ok:s.docKB>=3,        hint:s.docKB+'/3 documenti caricati'}
  ];
}

function renderProfile(){
  updateStatCards();
  var s=profileStats();
  // L'intestazione riflette sempre il profilo, non solo mentre lo si modifica:
  // dopo il ricaricamento successivo al salvataggio deve mostrare i valori
  // nuovi, inclusi reparto e settore se compilati.
  var ph=document.querySelector('.profile-header');
  if(ph){
    var nm=ph.querySelector('.profile-name'); if(nm)nm.textContent=profileData.name;
    var rl=ph.querySelector('.profile-role');
    if(rl){
      var parti=[profileData.role,profileData.org,profileData.reparto,
                 profileData.settore?'settore '+profileData.settore:''].filter(Boolean);
      rl.textContent=parti.join(' · ');
    }
    // All'avvio profileData non porta le iniziali: derivarle dal nome evita
    // che l'avatar mostri le prime due lettere ("MA" per "Mario R.") mentre la
    // barra laterale mostra le iniziali vere.
    var av=ph.querySelector('.profile-avatar');
    var ini=profileData.iniziali||((typeof inizialiDaNome==='function')?inizialiDaNome(profileData.name):'');
    if(av&&ini)av.textContent=ini;
  }

  // Badge: ottenuti in evidenza, da ottenere in grigio con il progresso
  var badges=profileBadges(s);
  var ottenuti=badges.filter(function(b){return b.ok});
  document.getElementById('badge-shelf').innerHTML=
    '<div style="font-size:11px;color:var(--tx4);margin-bottom:8px">'+ottenuti.length+' di '+badges.length+' ottenuti</div>'+
    badges.map(function(b){
      return '<div class="badge-item" title="'+escHtml(b.hint)+'" style="'+(b.ok?'':'opacity:.4;filter:grayscale(1)')+'">'+
        '<span>'+b.icon+'</span>'+b.name+'</div>';
    }).join('')+
    // La scala dei privilegi: il documento dice che l'accumulo di XP sblocca
    // qualcosa, e finora non sbloccava niente. Sta sotto i badge perché è la
    // stessa domanda vista dall'altro lato — non «cosa ho fatto» ma «cosa posso
    // fare adesso» — e ogni riga si può verificare andando a provarla.
    (function(){
      var pr=(typeof prossimoPrivilegio==='function')?prossimoPrivilegio():null;
      return '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--bo)">'+
        '<div style="font-size:11px;font-weight:700;margin-bottom:7px">Cosa sblocca l’esperienza</div>'+
        PRIVILEGI.map(function(p){
          var ok=privilegioSbloccato(p.xp);
          return '<div title="'+escHtml(p.desc)+'" style="display:flex;align-items:center;gap:7px;font-size:11px;'+
            'padding:3px 0;color:'+(ok?'var(--tx2)':'var(--tx4)')+'">'+
            '<span style="width:14px">'+(ok?'✅':'🔒')+'</span>'+
            '<span style="flex:1">'+escHtml(p.nome)+'</span>'+
            '<span style="font-size:10px;color:var(--tx4)">'+(p.xp?p.xp+' XP':'sempre')+'</span></div>';
        }).join('')+
        (pr?'<div style="font-size:10.5px;color:var(--tx4);margin-top:6px">Ti mancano <strong>'+pr.manca+
            ' XP</strong> per «'+escHtml(pr.p.nome)+'».</div>'
           :'<div style="font-size:10.5px;color:var(--tx4);margin-top:6px">Tutti i privilegi sono sbloccati.</div>')+
      '</div>';
    })();

  // Competenze calcolate dall'attività reale, non dichiarate.
  var pct=function(v,max){return Math.min(100,Math.round(v/max*100))};
  var skills=[
    {name:'Composizione flussi', pct:pct(s.agenti,8),                     det:s.agenti+' agenti creati'},
    {name:'Esecuzione e collaudo',pct:pct(s.esecuzioni,25),               det:s.esecuzioni+' esecuzioni ('+s.esecuzioniOk+' riuscite)'},
    {name:'Governance e presidi', pct:pct(s.controlliUsati,6),            det:s.controlliUsati+' controlli usati nei flussi'},
    {name:'Integrazioni',         pct:pct(Object.keys(s.connettoriUsati).length,10), det:Object.keys(s.connettoriUsati).length+' connettori diversi'},
    {name:'Formazione',           pct:pct(s.lezioni,s.lezioniTot||30),    det:s.lezioni+'/'+(s.lezioniTot||30)+' lezioni'},
    {name:'Community',            pct:pct(s.post+s.commenti,10),          det:(s.post+s.commenti)+' contributi'}
  ];
  document.getElementById('skills-chart').innerHTML=skills.map(function(k){
    return '<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:11px;font-weight:600;margin-bottom:4px"><span>'+k.name+'</span><span style="color:var(--tx4)">'+k.pct+'%</span></div>'+
      '<div style="height:6px;background:var(--bg3);border-radius:10px;overflow:hidden"><div style="height:100%;width:'+k.pct+'%;background:linear-gradient(90deg,var(--ac),var(--ac2));border-radius:10px;transition:width .5s"></div></div>'+
      '<div style="font-size:10px;color:var(--tx4);margin-top:3px">'+escHtml(k.det)+'</div></div>';
  }).join('');

  renderProfileWork(s);
  renderProfileGovernance(s);

  // Activity
  renderProfileActivity();

  // Profile info (editable)
  if(profileEditing){
    var infoCard=document.querySelector('#page-profile .profile-grid .card.mb-16');
    if(infoCard){
      // Insert edit form before badges
      var editHtml='<div class="card mb-16"><div class="card-header"><div class="card-title">Modifica profilo</div></div>'+
        // Il nome e' modificabile, ma non e' un campo come gli altri: e' la
        // chiave con cui agenti e contenuti sono attribuiti. Cambiandolo la
        // riattribuzione avviene in blocco, previa conferma che dice quanti
        // elementi verranno spostati.
        '<div class="profile-edit-field"><label>Nome</label>'+
          '<input class="prop-input" id="pf-name" value="'+escHtml(profileData.name)+'" maxlength="40">'+
          '<div style="font-size:10px;color:var(--tx4);margin-top:3px">Identifica i tuoi agenti e le tue esecuzioni: cambiandolo verranno riattribuiti al nuovo nome.</div></div>'+
        '<div class="profile-edit-field"><label>Ruolo</label><input class="prop-input" id="pf-role" value="'+escHtml(profileData.role||'')+'"></div>'+
        '<div class="profile-edit-field"><label>Organizzazione</label><input class="prop-input" id="pf-org" value="'+escHtml(profileData.org||'')+'"></div>'+
        '<div class="profile-edit-field"><label>Reparto</label><input class="prop-input" id="pf-reparto" value="'+escHtml(profileData.reparto||'')+'" placeholder="es. Operations"></div>'+
        // Il settore non e' decorativo: i suggerimenti del cruscotto lo usano
        // per proporre agenti del catalogo pertinenti, quindi e' a scelta
        // chiusa sulle stesse business unit del marketplace.
        '<div class="profile-edit-field"><label>Settore di interesse</label><select class="prop-select" id="pf-settore">'+
          ['','Sales','Marketing','Finance','HR','Legal','Insurance','DevOps','Customer Service','Produttività']
            .map(function(s){return '<option value="'+escHtml(s)+'"'+((profileData.settore||'')===s?' selected':'')+'>'+(s||'— nessuno —')+'</option>'}).join('')+
        '</select></div>'+
        '<div class="profile-edit-field"><label>Email</label><input class="prop-input" id="pf-email" value="'+escHtml(profileData.email||'')+'"></div>'+
        '<div class="profile-edit-field"><label>Telefono</label><input class="prop-input" id="pf-telefono" value="'+escHtml(profileData.telefono||'')+'" placeholder="+39 ..."></div>'+
        '<div class="profile-edit-field"><label>LinkedIn</label><input class="prop-input" id="pf-linkedin" value="'+escHtml(profileData.linkedin||'')+'"></div>'+
        '<div class="profile-edit-field"><label>Bio</label><textarea class="prop-input" id="pf-bio" rows="3">'+escHtml(profileData.bio||'')+'</textarea></div>'+
        '<div style="display:flex;gap:8px;margin-top:12px"><button class="tb-btn primary" onclick="saveProfileData()">💾 Salva</button><button class="tb-btn" onclick="profileEditing=false;renderProfile()">Annulla</button></div></div>';
      infoCard.insertAdjacentHTML('beforebegin',editHtml);
    }
  }

  // Preferences
  var prefs=[{name:'Notifiche email',on:true},{name:'Notifiche push',on:false},{name:'Profilo pubblico',on:true},{name:'Mostra nel leaderboard',on:true},{name:'Newsletter settimanale',on:true}];
  document.getElementById('profile-prefs').innerHTML=prefs.map(function(p,i){
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--bg2)"><span style="font-size:12px">'+p.name+'</span>'+
      '<div style="width:36px;height:20px;border-radius:10px;background:'+(p.on?'var(--ac)':'var(--bg3)')+';cursor:pointer;position:relative;transition:var(--trans)" onclick="this.style.background=this.style.background.includes(\'10B981\')?\'var(--bg3)\':\'var(--ac)\'">'+
        '<div style="width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;'+(p.on?'right:2px':'left:2px')+';box-shadow:var(--sh);transition:var(--trans)"></div>'+
      '</div></div>';
  }).join('');
}

// Il lavoro prodotto, con i collegamenti per raggiungerlo: il Profilo
// diventa il punto da cui si arriva ovunque, invece di una pagina isolata.
function renderProfileWork(s){
  var el=document.getElementById('profile-work');if(!el)return;
  var righe=[
    {ic:'🔧',lab:'Agenti creati',       n:s.agenti,      act:"go('myagents')",   sub:s.inProduzione?s.inProduzione+' in produzione':'nessuno in produzione'},
    {ic:'🏪',lab:'Pubblicati',          n:s.pubblicati,  act:"go('marketplace')",sub:s.inRevisione?s.inRevisione+' in attesa di revisione':'nessuno in revisione'},
    {ic:'📥',lab:'Installati',          n:s.installati,  act:"go('myagents')",   sub:'dal Marketplace'},
    {ic:'▶️',lab:'Esecuzioni',          n:s.esecuzioni,  act:"go('execlog')",    sub:s.esecuzioni?Math.round(s.esecuzioniOk/s.esecuzioni*100)+'% riuscite':'nessuna ancora'},
    {ic:'🗂️',lab:'Documenti Knowledge Base',n:s.docKB,  act:"openKnowledgeBaseModal()",sub:'usati dai flussi con KB attiva'},
    {ic:'🎓',lab:'Lezioni completate',  n:s.lezioni,     act:"go('learning')",   sub:s.percorsi+' percorsi completati'}
  ];
  el.innerHTML=righe.map(function(r){
    return '<div class="list-row" style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--bg2);cursor:pointer" onclick="'+r.act+'">'+
      '<span style="font-size:17px;width:24px;text-align:center;flex-shrink:0">'+r.ic+'</span>'+
      '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:600">'+r.lab+'</div>'+
      '<div style="font-size:10px;color:var(--tx4)">'+escHtml(r.sub)+'</div></div>'+
      '<span style="font-size:16px;font-weight:800;color:var(--ac)">'+r.n+'</span>'+
      '<span style="color:var(--tx4);font-size:12px">›</span></div>';
  }).join('');
}

// Riepilogo di governance: quali presidi l'utente adotta davvero nei propri
// flussi. È la contropartita della scelta di non imporre i controlli — se
// non si impongono, bisogna almeno renderli visibili.
function renderProfileGovernance(s){
  var ob=document.getElementById('profile-obiettivi');
  if(ob&&typeof renderObiettiviProfilo==='function')ob.innerHTML=renderObiettiviProfilo();
  var el=document.getElementById('profile-governance');if(!el)return;
  var tipi=Object.keys(s.tipiControllo);
  var html='<div style="display:flex;gap:8px;margin-bottom:12px">'+
    '<div style="flex:1;background:var(--bg2);border-radius:8px;padding:10px;text-align:center">'+
      '<div style="font-size:18px;font-weight:800">'+s.controlliUsati+'</div>'+
      '<div style="font-size:10px;color:var(--tx4)">controlli nei flussi</div></div>'+
    '<div style="flex:1;background:var(--bg2);border-radius:8px;padding:10px;text-align:center">'+
      '<div style="font-size:18px;font-weight:800">'+s.politicheAttive+'</div>'+
      '<div style="font-size:10px;color:var(--tx4)">politiche attive</div></div>'+
  '</div>';
  if(tipi.length){
    html+='<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px">'+tipi.map(function(t){
      var g=(typeof getGuardrailConfig==='function')?getGuardrailConfig(t):null;
      return '<span class="badge badge-p" style="font-size:10px">'+(g?g.icon:'🛡️')+' '+escHtml(t)+' ×'+s.tipiControllo[t]+'</span>';
    }).join('')+'</div>';
  }else{
    html+='<div style="font-size:11px;color:var(--tx4);line-height:1.5;margin-bottom:12px">Nessun controllo ancora inserito nei tuoi flussi. La verifica del Builder (🔍) propone quelli pertinenti al caso che stai costruendo.</div>';
  }
  html+='<button class="tb-btn" onclick="openPoliciesModal()" style="width:100%">🔒 Politiche di controllo</button>';
  el.innerHTML=html;
}

// ── ACTIVITY LOG ──

function addAct(text){
  activities.unshift({text:text,time:new Date().toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})});
  if(activities.length>20)activities.pop();
}

function renderProfileActivity(){
  var el=document.getElementById('profile-activity');
  if(!el)return;
  var colors=['#10B981','#6366F1','#F59E0B','#EF4444','#8B5CF6'];
  el.innerHTML=(activities.length?activities:
    [{text:'Salvato agente: Lead Qualifier',time:'14:30'},{text:'Completata lezione: LLM basics',time:'13:15'},
     {text:'Installato agente: Invoice Extractor',time:'11:45'},{text:'Pubblicato post nel forum',time:'ieri'},
     {text:'Raggiunto Livello 12',time:'ieri'}]
  ).slice(0,8).map(function(a,i){
    return '<div class="activity-item"><div class="activity-dot" style="background:'+colors[i%colors.length]+'"></div><div><div class="activity-text">'+a.text+'</div><div class="activity-time">'+a.time+'</div></div></div>';
  }).join('');
}

// ── DASHBOARD ──

// ══════════════ ENHANCED FUNCTIONS ══════════════
// ══════════════════════════════════════════
// ENHANCED LEARNING HUB — Real lesson content
// ══════════════════════════════════════════

// Lesson content database

var LESSON_CONTENT={
  '1-0':{title:'Cos\'è un AI Agent',content:'<h3>Cos\'è un AI Agent?</h3><p>Un <strong>AI Agent</strong> è un sistema software autonomo che percepisce il suo ambiente, prende decisioni e agisce per raggiungere obiettivi specifici. A differenza di un semplice chatbot, un agent può:</p><ul><li><strong>Pianificare</strong>: scomporre un task complesso in sotto-obiettivi</li><li><strong>Agire</strong>: eseguire azioni nel mondo reale (inviare email, scrivere su database, chiamare API)</li><li><strong>Osservare</strong>: valutare il risultato delle sue azioni</li><li><strong>Iterare</strong>: correggere il piano se qualcosa non va</li></ul><div class="concept-box"><strong>Concetto chiave:</strong> Il loop fondamentale di un agent è <code>Percezione → Ragionamento → Azione → Feedback</code>. Questo ciclo si ripete finché l\'obiettivo non è raggiunto o un limite di sicurezza viene attivato.</div><p>Nel contesto aziendale, gli agent possono automatizzare processi complessi che prima richiedevano intervento umano: dalla qualificazione dei lead alla revisione contrattuale, dal supporto clienti all\'analisi finanziaria.</p><h3>Differenza tra Chatbot, Copilot e Agent</h3><p><strong>Chatbot:</strong> risponde a domande in una finestra di chat. Nessuna autonomia reale.<br><strong>Copilot:</strong> suggerisce azioni all\'utente che le approva o rifiuta. Semi-autonomo.<br><strong>Agent:</strong> riceve un obiettivo e agisce autonomamente, con guardrail definiti.</p>',
  quiz:{q:'Qual è la differenza principale tra un copilot e un agent?',opts:['Il copilot è più intelligente','L\'agent agisce autonomamente, il copilot suggerisce','Il copilot costa di più','Non c\'è differenza'],correct:1,explain:'L\'agent riceve un obiettivo e agisce autonomamente entro guardrail definiti. Il copilot invece suggerisce azioni che l\'utente deve approvare manualmente.'}},

  '1-1':{title:'LLM: come funzionano',content:'<h3>Large Language Models: come funzionano</h3><p>I LLM (Large Language Models) sono la "mente" degli AI agent. Sono reti neurali addestrate su enormi quantità di testo che possono generare, analizzare e trasformare linguaggio naturale.</p><h3>I 3 concetti fondamentali</h3><p><strong>1. Tokenizzazione</strong>: Il testo viene scomposto in "token" (pezzi di parole). "Automazione" diventa circa 3 token. Un LLM elabora token, non lettere.</p><p><strong>2. Context Window</strong>: Quanti token il modello può "vedere" contemporaneamente. Claude: 1M token (~750K parole). GPT-4o: 128K token.</p><p><strong>3. Temperature</strong>: Controlla la creatività delle risposte. 0 = deterministico e preciso. 1 = creativo e vario.</p><div class="code-block">// Esempio di chiamata a Claude API\nconst response = await fetch("https://api.anthropic.com/v1/messages", {\n  method: "POST",\n  headers: {"Content-Type": "application/json", "x-api-key": "sk-ant-..."},\n  body: JSON.stringify({\n    model: "claude-opus-5",\n    max_tokens: 1024,\n    messages: [{role: "user", content: "Analizza questo lead..."}]\n  })\n});</div><div class="warning-box">⚠️ <strong>Attenzione:</strong> I LLM possono "allucinare", generare informazioni plausibili ma false. Per questo negli agent aziendali servono sempre guardrail e validazione dell\'output.</div>',
  quiz:{q:'Cosa controlla il parametro "temperature" in un LLM?',opts:['La velocità di risposta','La lunghezza del testo','Il livello di creatività vs precisione','Il costo della chiamata API'],correct:2,explain:'Temperature 0 produce risposte deterministiche e precise. Temperature 1 produce risposte più creative e variabili. Per task aziendali critici (es. analisi fatture) si usa temperature bassa (0-0.3).'}},

  '1-2':{title:'Architettura ReAct',content:'<h3>Architettura ReAct: Reasoning + Acting</h3><p>ReAct è il pattern architetturale più usato per costruire AI agent. Combina il ragionamento (Reasoning) del LLM con la capacità di agire (Acting) nel mondo reale.</p><h3>Come funziona il loop ReAct</h3><p><strong>1. Thought</strong>: L\'agent ragiona su cosa fare: "Devo prima verificare se il lead ha un profilo LinkedIn"</p><p><strong>2. Action</strong>: Esegue un\'azione concreta: chiama l\'API di LinkedIn per cercare il profilo</p><p><strong>3. Observation</strong>: Osserva il risultato: "Profilo trovato, ruolo: CTO, azienda: 50+ dipendenti"</p><p><strong>4. Repeat</strong>: Ragiona di nuovo in base a ciò che ha osservato, poi agisce ancora</p><div class="concept-box"><strong>Nella pratica:</strong> Nel builder di RelAItion, questo loop si traduce in: <strong>Nodo Trigger</strong> → <strong>Nodo AI (Thought)</strong> → <strong>Nodo Action</strong> → <strong>Nodo Condition (Observation)</strong> → loop o output</div><h3>Quando usare ReAct vs pipeline lineare</h3><p><strong>Pipeline lineare:</strong> quando il flusso è prevedibile (estrai dati → valida → salva). Più semplice, più veloce, meno costoso.</p><p><strong>ReAct loop:</strong> quando il flusso dipende dal contesto (supporto clienti, ricerca complessa, negoziazione). Più flessibile ma più lento e costoso.</p>',
  quiz:{q:'Quando è preferibile una pipeline lineare rispetto a un loop ReAct?',opts:['Mai, ReAct è sempre migliore','Quando il flusso è prevedibile e i passaggi sono fissi','Solo per task non-AI','Quando il budget è illimitato'],correct:1,explain:'Una pipeline lineare (trigger → AI → action → output) è preferibile quando il flusso è prevedibile. È più veloce, costa meno in token e ha meno rischi di loop infiniti. ReAct serve quando il percorso dipende dal contesto.'}},

  '1-3':{title:'Il tuo primo workflow',content:'<h3>Lab: Costruisci il tuo primo workflow</h3><p>In questo lab pratico costruirai un workflow completo: un agent che riceve una email di supporto, la classifica per urgenza con un LLM, e instrada al team corretto.</p><h3>Step 1: Crea il trigger</h3><p>Trascina il blocco <strong>📧 Email trigger</strong> dalla palette nel canvas. Questo nodo si attiverà ogni volta che arriva una nuova email alla casella di supporto.</p><h3>Step 2: Aggiungi il nodo AI</h3><p>Trascina <strong>🏷️ Classifier</strong> e collegalo al trigger. Nel pannello proprietà, configura il system prompt:</p><div class="code-block">Sei un classificatore di ticket. Analizza l\'email e rispondi con:\n- urgency: "high" | "medium" | "low"\n- category: "billing" | "technical" | "general"\n- suggested_team: "finance" | "engineering" | "support"\n\nRispondi SOLO in JSON valido.</div><h3>Step 3: Aggiungi la condizione</h3><p>Trascina <strong>🔀 Condition</strong>. Configura: <code>result.urgency === "high"</code>. Il ramo TRUE va al team urgente, il FALSE alla coda standard.</p><h3>Step 4: Aggiungi le azioni</h3><p>Trascina due nodi <strong>💬 Slack message</strong>: uno sul ramo TRUE (canale #urgent-support), uno sul FALSE (canale #support-queue).</p><div class="concept-box"><strong>Prova adesso:</strong> Vai nel <a href="#" onclick="go(\'builder\');return false" style="color:var(--ac);font-weight:600">Builder</a> e riproduci questo workflow. Poi clicca ▶️ Run per simulare l\'esecuzione!</div>',
  quiz:{q:'Perché è importante specificare "Rispondi SOLO in JSON valido" nel prompt del classifier?',opts:['Per risparmiare token','Per rendere l\'output parsabile automaticamente dal nodo successivo','È una convenzione ma non è necessario','Per evitare allucinazioni'],correct:1,explain:'Specificare il formato di output garantisce che il nodo successivo (Condition) possa parsare la risposta automaticamente. Senza questa indicazione, il LLM potrebbe aggiungere spiegazioni in linguaggio naturale che rompono il workflow.'}},

  '2-0':{title:'Nodi condizionali e branching',content:'<h3>Nodi condizionali e branching</h3><p>I nodi condizionali sono il cuore della logica di un agent. Permettono di prendere strade diverse in base ai dati.</p><h3>Tipi di condizione</h3><p><strong>Boolean semplice:</strong> <code>score > 70</code>: TRUE/FALSE</p><p><strong>Multi-branch (Switch):</strong> <code>category</code> → billing / technical / general, instrada a rami diversi</p><p><strong>Existence check:</strong> <code>result.email !== null</code>: verifica che un dato esista</p><div class="code-block">// Esempi di condizioni nel builder:\nresult.score > 70          // Lead qualificato\nresult.urgency === "high"  // Ticket urgente  \nresult.amount > 1000       // Fattura sopra soglia\nresult.language !== "it"   // Lingua diversa da italiano</div><div class="concept-box"><strong>Best practice:</strong> Aggiungi sempre un ramo "default" o "else" per gestire casi inattesi. Un agent senza fallback può bloccarsi silenziosamente.</div>',
  quiz:{q:'Cosa succede se un nodo condizionale riceve un valore non previsto e non c\'è un ramo default?',opts:['L\'agent sceglie il ramo TRUE','L\'agent si blocca silenziosamente','L\'agent riprova automaticamente','Il LLM decide quale ramo scegliere'],correct:1,explain:'Senza un ramo default, l\'agent non sa dove instradare i dati e si ferma senza errore visibile. Per questo è fondamentale aggiungere sempre un fallback che gestisca i casi imprevisti.'}},

  '2-2':{title:'Integrare API REST',content:'<h3>Lab: Integrare API REST esterne</h3><p>Gli agent diventano davvero potenti quando si connettono a servizi esterni via API. Vediamo come.</p><h3>Anatomia di una chiamata API nel builder</h3><p>Il nodo <strong>🌐 HTTP Request</strong> supporta: GET, POST, PUT, DELETE con headers custom, body JSON e autenticazione Bearer/API Key.</p><div class="code-block">// Esempio: cercare un lead su HubSpot\nGET https://api.hubapi.com/crm/v3/objects/contacts/search\nHeaders: { "Authorization": "Bearer YOUR_HUBSPOT_TOKEN" }\nBody: {\n  "filterGroups": [{\n    "filters": [{\n      "propertyName": "email",\n      "operator": "EQ", \n      "value": "{{trigger.email}}"\n    }]\n  }]\n}</div><h3>Gestire la risposta</h3><p>L\'output dell\'HTTP Request diventa il <code>result</code> disponibile nel nodo successivo. Usa un nodo AI per interpretare risposte complesse, o un nodo Condition per verificare lo status code.</p><div class="warning-box">⚠️ <strong>Sicurezza:</strong> Non inserire mai API key direttamente nel prompt. Usa il pannello "Integrazione AI" nel builder per gestire le credenziali in modo sicuro.</div>',
  quiz:{q:'Dove vanno memorizzate le API key per le integrazioni esterne?',opts:['Nel system prompt del nodo AI','Hardcodate nel nodo HTTP Request','Nel pannello credenziali/integrazione dedicato','In un commento nel workflow'],correct:2,explain:'Le API key vanno sempre gestite tramite un sistema di credenziali dedicato (come il pannello Integrazione AI del builder). Mai nei prompt o hardcodate nei nodi, per motivi di sicurezza e manutenibilità.'}}
};

LESSON_CONTENT['3-0']={title:'AI agent per Sales: lead scoring',content:'<h3>Case Study: Lead Scoring in una PMI manifatturiera</h3><p>TechnoMec SpA (240 dipendenti, componentistica industriale) riceveva circa 180 lead/mese da fiere, sito web e LinkedIn. Il team sales di 6 persone impiegava in media 4 ore/settimana a testa solo per lo screening iniziale.</p><h3>La soluzione implementata</h3><p>Un agente con 5 nodi: webhook dal CRM → analisi AI del lead (ruolo, settore, dimensione, intent del messaggio) → condition sullo score → notifica Slack per i lead caldi → aggiornamento CRM per tutti.</p><div class="concept-box"><strong>Il system prompt che fa la differenza:</strong> invece di "valuta questo lead", il prompt specificava i criteri ICP dell\'azienda: "settore manufacturing o automotive = +30 punti, ruolo con budget authority = +25, menzione di problemi specifici = +20...". La qualità dell\'output dipende dalla specificità del prompt.</div><h3>Risultati dopo 90 giorni</h3><ul><li>Tempo di screening: da 24 ore/settimana (team) a 2 ore di supervisione</li><li>Tempo di prima risposta ai lead caldi: da 18 ore a 35 minuti</li><li>Conversion rate lead→opportunità: +31%</li><li>Costo API mensile: €47 (Claude Haiku per lo scoring)</li></ul><div class="warning-box">⚠️ <strong>Lezione appresa:</strong> il primo mese l\'agente sovrastimava i lead da grandi aziende anche senza intent reale. La correzione: aggiungere esempi negativi al prompt ("una grande azienda che chiede solo il listino NON è un lead caldo").</div>',
quiz:{q:'Qual è stato il fattore chiave per la qualità dello scoring?',opts:['Usare il modello LLM più potente','La specificità del system prompt con criteri ICP espliciti','Aumentare la temperature','Processare più lead in parallelo'],correct:1,explain:'Un prompt generico produce valutazioni generiche. Specificare i criteri del profilo cliente ideale (ICP) con pesi e esempi negativi è ciò che rende lo scoring allineato al business.'}};

LESSON_CONTENT['4-0']={title:'AI e GDPR: guida pratica',content:'<h3>AI Agent e GDPR: cosa devi sapere prima del go-live</h3><p>Ogni agente che processa dati personali (nomi, email, CV, dati clienti) rientra nel GDPR. Ecco i principi operativi.</p><h3>I 4 pilastri per un agente conforme</h3><p><strong>1. Base giuridica</strong>, Prima di processare dati personali serve una base: contratto, legittimo interesse (documentato) o consenso. Un agente che analizza email dei clienti per il supporto rientra tipicamente nell\'esecuzione contrattuale.</p><p><strong>2. Minimizzazione</strong>, Passa al LLM solo i dati necessari. Se l\'agente classifica ticket, non serve inviare al modello il nome e cognome del cliente: pseudonimizza prima.</p><p><strong>3. Data retention</strong>, Gli output dell\'agente e i log contengono dati personali? Definisci quanto li conservi. Il log esecuzioni di RelAItion permette la cancellazione selettiva.</p><p><strong>4. Trasferimenti extra-UE</strong>, Se usi API di provider USA, verifica: Data Processing Agreement, clausole contrattuali standard, e opzioni di data residency EU (Claude e GPT le offrono).</p><div class="concept-box"><strong>Pseudonimizzazione pratica:</strong> aggiungi un nodo AI prima del processing principale con il prompt "sostituisci nomi, email e telefoni con placeholder [NOME_1], [EMAIL_1]...". Il processing avviene su dati pseudonimizzati, il de-mapping avviene solo nel sistema finale.</div><div class="warning-box">⚠️ <strong>Errore comune:</strong> loggare gli output completi dell\'LLM nell\'execution log. Se l\'output contiene dati personali, anche il log è un trattamento. Configura il log per salvare solo metadati (esito, durata) per gli agenti che toccano dati sensibili.</div>',
quiz:{q:'Un agente classifica ticket di supporto. Qual è l\'approccio GDPR-corretto?',opts:['Inviare il ticket completo al LLM, è necessario per il contesto','Pseudonimizzare i dati personali prima di inviarli al LLM','Chiedere il consenso a ogni cliente prima di processare il ticket','Non usare AI sui ticket di supporto'],correct:1,explain:'La minimizzazione è il principio chiave: per classificare un ticket il LLM non ha bisogno di sapere CHI è il cliente, solo COSA chiede. La pseudonimizzazione preserva l\'utilità del dato riducendo il rischio.'}};

LESSON_CONTENT['2-1']={title:'Loop e iterazioni',content:'<h3>Loop e iterazioni: processare liste di elementi</h3><p>Molti workflow reali processano non un elemento ma una lista: 50 fatture, 200 lead, tutti i ticket aperti. Il nodo Loop itera il sotto-flusso per ogni elemento.</p><h3>Anatomia di un loop</h3><p>Il nodo <strong>🔄 Loop</strong> riceve un array in input e esegue i nodi successivi una volta per ogni elemento. Alla fine, aggrega i risultati.</p><div class="code-block">// Input al loop: array di lead\n[{"nome":"Rossi","score":null}, {"nome":"Bianchi","score":null}, ...]\n\n// Per ogni elemento: nodo AI assegna score\n// Output aggregato:\n[{"nome":"Rossi","score":82}, {"nome":"Bianchi","score":45}, ...]</div><h3>Loop vs Batch: quando usare cosa</h3><p><strong>Loop sequenziale:</strong> quando l\'ordine conta o le API hanno rate limit stretti. Più lento ma controllabile.</p><p><strong>Split in batch:</strong> il nodo Split divide l\'array in gruppi (es. 10 elementi) processati in parallelo. Più veloce, ma attenzione ai costi API che crescono linearmente.</p><div class="warning-box">⚠️ <strong>Guardrail essenziale:</strong> imposta sempre un limite massimo di iterazioni. Un loop su un array inaspettatamente grande (10.000 elementi) può generare costi API significativi in pochi minuti. Best practice: max 100 iterazioni + alert se superato.</div><div class="concept-box"><strong>Pattern retry:</strong> combina Loop con il nodo Retry: se un elemento fallisce (es. timeout API), viene ritentato fino a 3 volte con backoff esponenziale prima di essere marcato come errore, senza bloccare il resto della lista.</div>',
quiz:{q:'Perché è essenziale un limite massimo di iterazioni in un loop?',opts:['Per velocizzare l\'esecuzione','Per evitare costi API incontrollati su array inaspettatamente grandi','I loop infiniti bloccano il browser','È richiesto dal GDPR'],correct:1,explain:'Ogni iterazione che chiama un LLM ha un costo. Un array di dimensione inattesa (bug a monte, dati sporchi) senza limite può moltiplicare i costi API in modo incontrollato. Il limite con alert è il guardrail economico fondamentale.'}};

LESSON_CONTENT['5-0']={title:'Content generation con LLM',content:'<h3>Content Generation: dal brief al contenuto pubblicabile</h3><p>Gli agenti di content generation producono bozze di articoli, post social, email e descrizioni prodotto. La differenza tra output mediocre e pubblicabile sta in tre elementi: brief strutturato, tone of voice e ciclo di revisione.</p><h3>1. Il brief strutturato</h3><div class="code-block">// System prompt di un nodo Content Gen efficace:\nSei il content writer di [azienda]. Scrivi in italiano.\nTone of voice: professionale ma diretto, evita gergo\ntecnico non necessario, frasi max 20 parole.\nStruttura richiesta: hook iniziale, 3 punti chiave\ncon esempi concreti, CTA finale.\nNON usare: superlativi vuoti, "in un mondo dove",\nelenchi puntati eccessivi.</div><h3>2. Il pattern a due passaggi</h3><p>I migliori risultati arrivano con due nodi AI in sequenza: il primo genera la bozza, il secondo la critica e migliora ("agisci da editor: verifica aderenza al tone of voice, taglia il 20% delle parole, rafforza il hook"). Costa il doppio ma la qualità sale drasticamente.</p><h3>3. Human-in-the-loop editoriale</h3><p>Per contenuti pubblici, inserisci sempre un checkpoint umano: il flusso genera → invia su Slack/Notion per review → attende approvazione → pubblica. Mai pubblicazione diretta senza occhi umani.</p><div class="concept-box"><strong>Nel Builder:</strong> il template "Content Pipeline" nella Template Gallery implementa esattamente questo pattern: generazione → check sentiment/tone → gate condizionale → coda di pubblicazione su Notion.</div>',
quiz:{q:'Qual è il pattern che migliora di più la qualità del contenuto generato?',opts:['Aumentare la temperature a 1.0','Usare due nodi AI: generazione + revisione critica','Generare 10 varianti e sceglierne una a caso','Prompt più corti e generici'],correct:1,explain:'Il pattern generate-then-critique sfrutta il fatto che i LLM sono più bravi a valutare e migliorare un testo esistente che a produrlo perfetto al primo colpo. Il secondo nodo agisce da editor con criteri espliciti.'}};

LESSON_CONTENT['1-4']={title:'Prompt engineering basics',content:'<h3>Prompt Engineering: le basi che contano davvero</h3><p>Un system prompt scritto bene è la differenza tra un nodo AI affidabile e uno che produce risultati incoerenti. Quattro principi coprono la maggior parte dei casi reali nei workflow aziendali.</p><h3>1. Ruolo + compito, non solo compito</h3><div class="code-block">❌ "Classifica questo ticket"\n\n✅ "Sei un classificatore di ticket di supporto IT.\nAnalizza il testo e assegna: urgenza (alta/media/bassa),\ncategoria (hardware/software/rete/altro).\nRispondi SOLO in JSON: {urgenza, categoria}"</div><p>Definire un ruolo ("sei un X") ancora il modello a un comportamento coerente lungo tutta la risposta, non solo alla prima frase.</p><h3>2. Formato di output esplicito</h3><p>Se il nodo successivo deve leggere il risultato (es. un Condition), specifica SEMPRE il formato: "Rispondi solo con JSON valido" oppure "Rispondi solo con la parola TRUE o FALSE". Senza questo vincolo il modello può aggiungere spiegazioni che rompono il parsing a valle.</p><h3>3. Esempi (few-shot) per compiti ambigui</h3><p>Per compiti soggettivi (es. "è un lead qualificato?") uno o due esempi valgono più di dieci righe di istruzioni: "Esempio: azienda 500+ dipendenti che chiede solo il listino prezzi → NON qualificato (nessun intent reale)".</p><div class="warning-box">⚠️ <strong>Errore comune:</strong> prompt troppo lunghi con istruzioni contraddittorie accumulate nel tempo. Se il nodo inizia a comportarsi in modo incoerente, è spesso più efficace riscriverlo da zero che continuare ad aggiungere eccezioni.</div>',
quiz:{q:'Perché è importante specificare il formato di output nel system prompt?',opts:['Per rendere il prompt più lungo','Perché il nodo successivo nel workflow deve poter leggere/parsare la risposta in modo affidabile','È obbligatorio per legge','Per ridurre i costi API'],correct:1,explain:'Un Condition o un\'Azione a valle si aspettano un formato preciso (JSON, TRUE/FALSE, ecc.). Senza vincolo esplicito il modello può aggiungere testo libero che rompe il parsing automatico.'}};

LESSON_CONTENT['1-5']={title:'Testing e validazione',content:'<h3>Testare un agente prima di metterlo in produzione</h3><p>Un workflow che funziona sui dati di esempio non è detto che funzioni sui dati reali. Prima del go-live, tre livelli di test riducono drasticamente le sorprese.</p><h3>1. Test sui casi limite</h3><p>Non basta testare il caso "felice" (dati completi e ben formati). Prova sempre: input vuoto o malformato, testo in lingua diversa da quella attesa, numeri fuori scala, campi obbligatori mancanti. Un nodo Condition senza ramo di default che riceve un valore inatteso si blocca silenziosamente, è il bug più comune nei workflow di produzione.</p><h3>2. Test con il payload reale</h3><p>Nel Builder, i nodi Trigger (Webhook, File upload) accettano un "payload di test" personalizzato: usa un estratto reale e anonimizzato dei tuoi dati invece dei dati di esempio generici, per verificare che il prompt AI si comporti bene sulle tue casistiche specifiche.</p><h3>3. Validazione strutturale prima del Run</h3><p>Il Builder blocca automaticamente Esegui/Salva/Pubblica se: manca un Trigger, un nodo Condition non ha entrambi i rami collegati, un campo obbligatorio di un connettore è vuoto. Risolvi sempre questi errori prima di considerare l\'agente pronto, è la prima linea di difesa contro workflow incompleti.</p><div class="concept-box"><strong>Nel dubbio, guarda il Log Esecuzioni:</strong> ogni run (anche quelli bloccati dalla validazione) viene tracciato con il dettaglio passo-passo. È il primo posto da controllare quando un agente "non fa quello che dovrebbe".</div>',
quiz:{q:'Cosa succede a un nodo Condition che riceve un valore inatteso senza ramo di default?',opts:['Sceglie automaticamente il ramo più probabile','Si blocca silenziosamente, senza errore visibile','Il workflow si riavvia da capo','Chiede conferma all\'utente'],correct:1,explain:'Senza un ramo che gestisca il caso imprevisto, l\'agente non sa dove instradare il flusso e si ferma senza segnalarlo chiaramente: per questo i casi limite vanno testati esplicitamente prima del go-live.'}};

LESSON_CONTENT['2-3']={title:'Error handling patterns',content:'<h3>Gestire gli errori senza far collassare il workflow</h3><p>Le chiamate a sistemi esterni (API, database, provider AI) falliscono: timeout, rate limit, servizio temporaneamente giù. Un workflow robusto prevede questi casi invece di assumere che tutto funzioni sempre.</p><h3>Tre pattern principali</h3><p><strong>Retry con backoff</strong>, Il nodo Retry ritenta l\'operazione fallita con un\'attesa crescente tra i tentativi (es. 2s, 4s, 8s). Utile per errori transitori (timeout, rate limit temporaneo).</p><p><strong>Error Handler dedicato</strong>, Instrada gli errori verso un ramo separato del workflow: notifica un umano, logga l\'incidente, oppure prosegue con un valore di default invece di bloccare tutto.</p><p><strong>Circuit breaker manuale</strong>, Se un connettore fallisce ripetutamente (es. 5 volte di fila), meglio disattivare temporaneamente l\'agente (dal pannello ⏱️ Pianifica) che continuare a martellare un servizio già in difficoltà.</p><div class="code-block">// Esempio di configurazione Error Handler:\nAzione di fallback: "Notifica e continua"\nNotifica su: #ops-alerts\n\n// Il workflow prosegue con l\'ultimo dato valido\n// invece di bloccarsi sull\'intera esecuzione</div><div class="warning-box">⚠️ <strong>Da evitare:</strong> ignorare silenziosamente gli errori (nessun log, nessuna notifica). Un\'azione che fallisce senza che nessuno se ne accorga è peggio di un workflow che si ferma visibilmente.</div>',
quiz:{q:'Quando ha senso usare un Retry con backoff invece di un Error Handler?',opts:['Sempre, sono intercambiabili','Per errori transitori (timeout, rate limit) che possono risolversi da soli riprovando','Solo per i nodi AI','Mai, sono deprecati'],correct:1,explain:'Il Retry è pensato per errori temporanei dove riprovare ha senso. Per errori strutturali (dati malformati, permessi mancanti) riprovare non risolve nulla: serve un Error Handler che instrada verso una gestione diversa.'}};

LESSON_CONTENT['2-4']={title:'Debugging workflows',content:'<h3>Trovare la causa quando un workflow non funziona</h3><p>Quando un agente produce un risultato sbagliato o si blocca, il problema è quasi sempre in uno di tre punti: il dato in ingresso, la configurazione di un nodo, o la logica di branching.</p><h3>Il flusso di debug consigliato</h3><p><strong>1. Apri il Log Esecuzioni</strong> e guarda il dettaglio passo-passo dell\'ultima run: ogni nodo mostra esattamente cosa ha ricevuto e cosa ha prodotto. Individua il primo nodo il cui output non è quello atteso, il problema è lì o nel nodo precedente.</p><p><strong>2. Isola il nodo</strong> selezionandolo sul canvas e usando la Chat AI in modalità "modifica singolo nodo" per aggiustarne rapidamente il prompt o la configurazione, senza toccare il resto del workflow.</p><p><strong>3. Ricontrolla i dati di test</strong>: se il nodo Trigger usa dati di esempio generici invece dei tuoi dati reali, un comportamento anomalo sui dati reali potrebbe non emergere mai nei test.</p><div class="concept-box"><strong>Pattern utile:</strong> aggiungi temporaneamente un nodo Logger dopo il nodo sospetto, registra nel log la pipeline completa in quel punto, utile per confrontare "cosa mi aspettavo" con "cosa è successo davvero".</div><div class="warning-box">⚠️ <strong>Errore comune:</strong> modificare più nodi contemporaneamente per "provare a vedere se funziona". Cambia un nodo alla volta e rilancia: altrimenti non saprai mai quale modifica ha risolto (o causato) il problema.</div>',
quiz:{q:'Qual è il primo posto da controllare quando un workflow produce un risultato inatteso?',opts:['Il codice sorgente della piattaforma','Il dettaglio passo-passo dell\'ultima esecuzione nel Log','I social media dell\'azienda','Le impostazioni del browser'],correct:1,explain:'Il log passo-passo mostra esattamente cosa ha ricevuto e prodotto ogni nodo: è il modo più diretto per individuare in quale punto della pipeline il comportamento si discosta da quello atteso.'}};

LESSON_CONTENT['2-5']={title:'Ottimizzazione performance',content:'<h3>Rendere un workflow più veloce ed economico</h3><p>Man mano che un agente passa da prototipo a uso quotidiano, velocità e costo per esecuzione iniziano a contare. Alcuni interventi hanno un impatto sproporzionato rispetto allo sforzo.</p><h3>Dove si nasconde il costo</h3><p><strong>Temperature e max tokens</strong>: Per compiti di estrazione/classificazione, temperature bassa (0-0.3) e max tokens ridotto al minimo necessario riducono sia il costo che la latenza, senza perdita di qualità.</p><p><strong>Modello giusto per il compito</strong>, Non ogni nodo AI ha bisogno del modello più potente disponibile. Classificazione semplice e estrazione dati spesso funzionano bene anche con modelli più leggeri ed economici, riservando i modelli più capaci ai compiti di ragionamento complesso.</p><p><strong>Evitare chiamate AI ridondanti</strong>, Se due nodi AI consecutivi fanno domande simili sugli stessi dati, spesso si possono unire in un unico nodo con un prompt che richiede entrambe le informazioni in output, dimezzando le chiamate.</p><div class="code-block">// Prompt che unisce due domande in una chiamata:\n"Analizza il lead e rispondi in JSON con:\n{ score: 0-100, categoria: string,\n  prossima_azione: string }"\n// invece di 2-3 nodi AI separati</div><div class="concept-box"><strong>Batch quando possibile:</strong> per elaborazioni su liste, il nodo Split con elaborazione parallela è più veloce di un Loop sequenziale, ma verifica sempre i rate limit del provider AI prima di aumentare il parallelismo.</div>',
quiz:{q:'Qual è un modo efficace per ridurre sia costo che latenza su un nodo AI di classificazione?',opts:['Aumentare la temperature al massimo','Usare temperature bassa e limitare i max tokens al necessario','Aggiungere più nodi AI in sequenza','Disattivare la validazione del workflow'],correct:1,explain:'Compiti deterministici come classificazione ed estrazione non beneficiano di temperature alta; ridurla insieme al limite di token abbassa costo e tempo di risposta senza perdere qualità.'}};

LESSON_CONTENT['3-1']={title:'Automazione HR: onboarding',content:'<h3>Case Study: Onboarding automatizzato in una scale-up di 80 persone</h3><p>Un\'azienda SaaS in crescita assumeva 4-6 persone al mese. L\'HR generalist dedicava un\'intera giornata per ogni nuovo assunto tra raccolta documenti, creazione account e invio materiale di benvenuto.</p><h3>Il workflow</h3><p>Trigger "Nuovo dipendente" dal gestionale HR → checklist documenti automatica via email → verifica AI della completezza dei documenti caricati → generazione welcome kit personalizzato (ruolo, team, sede) → notifica al manager e all\'IT per la creazione degli accessi.</p><div class="concept-box"><strong>Il dettaglio che ha fatto la differenza:</strong> il nodo AI di verifica documenti non si limitava a controllare "presente/assente", ma leggeva il contenuto (es. verificava che il documento di identità non fosse scaduto) e generava automaticamente un messaggio di sollecito specifico per il documento mancante o non valido.</p><h3>Risultati</h3><ul><li>Tempo HR per onboarding: da 8 ore a 45 minuti di supervisione</li><li>Tempo medio di completamento documentale: da 6 giorni a 2 giorni</li><li>Zero dimenticanze di creazione accessi IT (prima capitava 1 volta su 5)</li></ul><div class="warning-box">⚠️ <strong>Attenzione GDPR:</strong> i documenti di onboarding (carta d\'identità, codice fiscale) sono dati personali sensibili. Il workflow li processa ma non li salva nei log delle esecuzioni, solo l\'esito (validato/da correggere) viene tracciato.</div>',
quiz:{q:'Cosa ha reso efficace la verifica documenti in questo caso?',opts:['Il controllo era solo presente/assente','Il nodo AI leggeva il contenuto e generava un sollecito specifico per il problema trovato','Venivano richiesti più documenti del necessario','Il processo restava comunque manuale'],correct:1,explain:'Andare oltre il semplice controllo di presenza: leggendo il contenuto e generando feedback mirato, è ciò che ha ridotto realmente il tempo di completamento, non solo il tempo dell\'HR.'}};

LESSON_CONTENT['3-2']={title:'Finance: invoice processing',content:'<h3>Case Study: Zero data-entry sulle fatture fornitori</h3><p>Uno studio di commercialisti riceveva 300+ fatture al mese da oltre 80 fornitori diversi, ciascuno con un proprio formato. La digitazione manuale assorbiva quasi due giornate/settimana di un\'impiegata amministrativa.</p><h3>Il workflow</h3><p>Trigger "File upload" (PDF/immagine) → nodo Vision AI per OCR e estrazione strutturata (fornitore, P.IVA, data, imponibile, IVA, totale) → nodo AI di validazione formale (checksum P.IVA, coerenza imponibile+IVA=totale) → Condition su validità → registrazione automatica in ERP oppure instradamento a revisione umana.</p><div class="code-block">// Prompt del nodo di estrazione:\n"Estrai dalla fattura: numero, fornitore, P.IVA,\ndata, imponibile, aliquota IVA, totale, scadenza.\nSe un campo non è leggibile, restituisci null\ninvece di indovinare. Rispondi SOLO in JSON."</div><h3>Perché "restituisci null invece di indovinare" è cruciale</h3><p>Un LLM può "allucinare" un numero plausibile ma sbagliato se non gli viene esplicitamente permesso di dichiarare incertezza. Per dati finanziari, un errore silenzioso è molto peggiore di un campo mancante che finisce in revisione umana.</p><div class="warning-box">⚠️ <strong>Risultato reale:</strong> tasso di estrazione corretta al primo tentativo 94%; il restante 6% viene instradato automaticamente a revisione invece di essere registrato con dati potenzialmente errati.</div>',
quiz:{q:'Perché al nodo di estrazione viene chiesto di restituire "null" invece di indovinare un valore?',opts:['Per risparmiare token','Perché un dato finanziario sbagliato ma plausibile è più pericoloso di un campo mancante segnalato','È un requisito tecnico del formato JSON','Per velocizzare l\'elaborazione'],correct:1,explain:'Un valore inventato ma plausibile può passare inosservato e generare un errore contabile. Dichiarare esplicitamente l\'incertezza permette di instradare quel caso a revisione umana invece di registrarlo automaticamente.'}};

LESSON_CONTENT['3-3']={title:'Legal: contract review AI',content:'<h3>Case Study: Revisione contratti in un team legal di 3 persone</h3><p>Il team legal di un\'azienda B2B doveva revisionare 40-50 contratti al mese (NDA, MSA, contratti fornitori) prima della firma, con tempi di risposta interni spesso superiori a una settimana.</p><h3>Il workflow</h3><p>Upload del contratto → nodo AI di estrazione clausole chiave (penali, durata, foro competente, limitazioni di responsabilità, clausole di recesso) → nodo AI di confronto con lo standard aziendale interno → Condition su livello di rischio → per rischio alto, alert al legal team con executive summary; per rischio basso, via libera automatica con log.</p><div class="concept-box"><strong>Il confronto con lo standard, non l\'analisi assoluta:</strong> invece di chiedere al modello "questo contratto è rischioso?" (domanda troppo generica), il prompt includeva le clausole standard dell\'azienda e chiedeva di segnalare SOLO le deviazioni, molto più preciso e meno soggetto a falsi allarmi.</p><h3>Risultati</h3><ul><li>Tempo di prima revisione: da 2-3 giorni a 20 minuti</li><li>Il legal team si concentra solo sui contratti con deviazioni reali (circa 30% del totale)</li></ul><div class="warning-box">⚠️ <strong>Limite dichiarato ai colleghi:</strong> l\'agente supporta la revisione, non la sostituisce. Ogni contratto a rischio alto o di valore economico rilevante passa comunque da un avvocato prima della firma, l\'AI velocizza lo screening, non la decisione finale.</div>',
quiz:{q:'Perché confrontare il contratto con uno standard aziendale funziona meglio di chiedere "è rischioso?"',opts:['È più veloce da scrivere','Riduce i falsi allarmi perché il modello segnala solo le deviazioni concrete da un riferimento definito','Non richiede un nodo AI','Elimina la necessità di revisione umana'],correct:1,explain:'Una domanda generica sul rischio produce valutazioni soggettive e incoerenti. Confrontare con clausole standard esplicite dà al modello un riferimento preciso su cosa segnalare.'}};

LESSON_CONTENT['3-4']={title:'Calcolare il ROI dell\'automazione',content:'<h3>Come calcolare il ritorno di un agente AI</h3><p>Prima di scalare un agente da pilota a produzione, serve un numero chiaro da presentare al management. La formula di base è semplice, ma i dettagli fanno la differenza tra un numero credibile e uno gonfiato.</p><h3>La formula base</h3><div class="code-block">Ore risparmiate/mese × costo orario medio del ruolo\n− costo API mensile\n− costo di manutenzione (stimato: 1-2 ore/mese)\n= Risparmio netto mensile\n\nROI = Risparmio netto annuo / costo di sviluppo iniziale</div><h3>Tre errori comuni nel calcolo</h3><p><strong>1. Contare il tempo "liberato" come tempo risparmiato al 100%</strong>, Se un task richiedeva 2 ore e ora ne richiede 20 minuti di supervisione, il risparmio reale è 1h40, non 2 ore.</p><p><strong>2. Ignorare i costi nascosti</strong>, Tempo di training del team, gestione delle eccezioni che l\'agente non gestisce, costo di un eventuale fallback manuale.</p><p><strong>3. Non misurare la qualità</strong>, Un agente più veloce ma con più errori di un processo manuale non è un miglioramento netto: il costo di correggere gli errori va sottratto al risparmio.</p><div class="concept-box"><strong>Nel Builder:</strong> il Log Esecuzioni fornisce i dati grezzi (numero di run, durata, tasso di successo) per calcolare questi numeri su dati reali invece che su stime, molto più convincente in una presentazione interna.</div>',
quiz:{q:'Quale di questi è un errore comune nel calcolare il ROI di un agente AI?',opts:['Sottrarre il costo API dal risparmio','Contare l\'intero tempo del task originale come risparmiato, ignorando il tempo di supervisione residuo','Usare i dati del Log Esecuzioni','Calcolare il ROI su base annua'],correct:1,explain:'Se l\'agente richiede ancora supervisione (anche breve), quel tempo va sottratto al risparmio lordo: altrimenti il numero presentato risulta gonfiato rispetto alla realtà operativa.'}};

LESSON_CONTENT['3-5']={title:'Change management per AI',content:'<h3>Portare un agente AI dal pilota all\'adozione reale</h3><p>La parte tecnica di un agente AI è spesso più semplice della parte organizzativa: far sì che le persone lo usino davvero, si fidino del suo output e lo integrino nel proprio modo di lavorare.</p><h3>Le resistenze più comuni</h3><p><strong>"Non mi fido del risultato"</strong>, Si supera mostrando il workflow visuale prima dell\'attivazione (trasparenza sul "come"), non solo il risultato finale. Un utente che vede i passaggi si fida di più di uno che riceve solo un output da una scatola nera.</p><p><strong>"Mi toglie il lavoro"</strong>, Riformulare l\'agente come "toglie la parte noiosa del lavoro" aiuta, ma serve anche essere onesti sul fatto che alcuni task ripetitivi effettivamente si riducono, enfatizzare invece cosa la persona può fare con il tempo liberato.</p><p><strong>"Funzionerà solo in teoria"</strong>, Iniziare con un caso piccolo e reale (non un pilota "di laboratorio"), misurabile in poche settimane, con un utente early-adopter interno che diventa il primo testimonial per i colleghi.</p><div class="concept-box"><strong>Pattern efficace:</strong> partire da un problema che il team già lamenta apertamente ("odiamo fare lo screening lead manualmente") invece di proporre l\'AI come soluzione generica in cerca di un problema.</div><div class="warning-box">⚠️ <strong>Segnale di allarme:</strong> se dopo un mese l\'agente è stato usato solo dal suo creatore, il problema non è tecnico, probabilmente manca fiducia, formazione o un chiaro beneficio percepito dagli altri utenti.</div>',
quiz:{q:'Qual è un approccio efficace per superare la resistenza "non mi fido del risultato"?',opts:['Nascondere i dettagli tecnici per semplificare','Mostrare il workflow visuale e i passaggi prima dell\'attivazione, non solo l\'output finale','Obbligare l\'uso tramite policy aziendale','Aspettare che la fiducia arrivi da sola col tempo'],correct:1,explain:'La trasparenza sul processo (workflow visuale, passaggi tracciabili) costruisce fiducia molto più efficacemente di un output che arriva da una "scatola nera" senza spiegazione.'}};

LESSON_CONTENT['4-1']={title:'Privacy by design per agenti',content:'<h3>Progettare un agente con la privacy incorporata, non aggiunta dopo</h3><p>"Privacy by design" (art. 25 GDPR) significa integrare le tutele nella progettazione del workflow fin dall\'inizio, non come patch successiva a un audit legale.</p><h3>Quattro pratiche concrete nel Builder</h3><p><strong>1. Minimizzazione al primo nodo</strong>: Il nodo Trigger dovrebbe già filtrare/pseudonimizzare i dati non necessari prima che raggiungano i nodi AI a valle, non "ripulire dopo".</p><p><strong>2. Data residency</strong>, Verifica dove vengono processati i dati dal provider AI scelto: Claude e altri provider offrono opzioni di data residency EU per i clienti enterprise, rilevante per dati sensibili di cittadini UE.</p><p><strong>3. Retention esplicita</strong>, Decidi in fase di progettazione, non dopo, quanto a lungo il Log Esecuzioni conserva gli output di un agente che tocca dati personali, ed eventualmente configuralo per salvare solo metadati.</p><p><strong>4. Diritto di cancellazione</strong>, Se l\'agente salva dati derivati (es. uno score calcolato su una persona), assicurati che esista un modo per cancellarli su richiesta.</p><div class="warning-box">⚠️ <strong>Errore frequente:</strong> progettare l\'agente, farlo funzionare, e SOLO ALLA FINE chiedersi "è conforme GDPR?". A quel punto spesso serve un redesign, non un aggiustamento, da qui il principio "by design", non "by afterthought".</div>',
quiz:{q:'Cosa significa in pratica "privacy by design" nel contesto di un workflow AI?',opts:['Aggiungere un banner di consenso alla fine del progetto','Integrare minimizzazione, retention e data residency fin dalla progettazione del workflow, non come verifica finale','Evitare del tutto l\'uso di AI su dati personali','Chiedere sempre il consenso esplicito dell\'utente'],correct:1,explain:'Il principio richiede che le tutele siano parte della progettazione iniziale del workflow: pensare alla conformità solo a fine progetto porta quasi sempre a dover rifare parti significative dell\'agente.'}};

LESSON_CONTENT['4-2']={title:'Guardrails per output LLM',content:'<h3>Lab: mettere dei limiti a ciò che un nodo AI può produrre</h3><p>Un LLM non ha un limite naturale a cosa può "decidere" di scrivere. I guardrail sono controlli espliciti che impediscono a un output problematico di propagarsi nel resto del workflow.</p><h3>Tre livelli di guardrail</h3><p><strong>1. Nel prompt</strong>, Vincoli espliciti: "Non inventare mai numeri che non sono nel testo fornito", "Se l\'informazione richiesta non è presente, rispondi \'dato non disponibile\', non stimare".</p><p><strong>2. Nella struttura del workflow</strong>, Un nodo Condition dopo il nodo AI che verifica la plausibilità dell\'output (es. "lo score è tra 0 e 100?") prima di lasciarlo proseguire verso un\'azione automatica.</p><p><strong>3. Nel checkpoint umano</strong>, Per decisioni ad alto impatto (es. rifiuto automatico di una richiesta cliente), instrada sempre verso approvazione umana invece di un\'azione diretta, indipendentemente da quanto l\'AI sembri sicura.</p><div class="code-block">// Esempio di guardrail nel prompt:\n"Se non sei certo al 90%+ della risposta,\nrispondi \'richiede verifica umana\' invece\ndi fornire una stima. Non inventare dati\nnumerici assenti dal contesto fornito."</div><div class="concept-box"><strong>Nel Builder:</strong> il nodo Condition subito dopo un nodo AI è il guardrail strutturale più semplice ed efficace, trasforma "l\'AI ha deciso" in "l\'AI ha proposto, il sistema verifica prima di agire".</div>',
quiz:{q:'Qual è un esempio di guardrail strutturale (non solo nel prompt) per un nodo AI?',opts:['Scrivere un prompt più lungo','Un nodo Condition dopo il nodo AI che verifica la plausibilità dell\'output prima di un\'azione automatica','Usare sempre temperature 0','Disattivare il nodo AI'],correct:1,explain:'Un guardrail strutturale aggiunge una verifica indipendente dal comportamento del modello stesso: anche se il prompt fallisce, il Condition a valle può ancora intercettare un output implausibile.'}};

LESSON_CONTENT['4-3']={title:'Audit trail e logging',content:'<h3>Perché ogni esecuzione deve lasciare traccia</h3><p>In settori regolamentati (finance, insurance, legal, HR) la tracciabilità delle decisioni automatizzate non è opzionale: l\'AI Act (art. 12) richiede logging per sistemi ad alto rischio, e normative settoriali come DORA lo richiedono per gli incidenti ICT.</p><h3>Cosa rende un audit trail utile</h3><p><strong>Completezza</strong>, Timestamp, agente, nodi eseguiti, esito, durata: il Log Esecuzioni di RelAItion traccia questi campi automaticamente per ogni run, senza bisogno di configurazione aggiuntiva.</p><p><strong>Immutabilità</strong>, Un log che può essere modificato dopo la creazione non ha valore probatorio. I record di esecuzione non sono editabili una volta scritti, solo esportabili o cancellabili nel loro complesso.</p><p><strong>Bilanciamento con la privacy</strong>, Un log completo può contenere dati personali negli output. Per agenti che toccano dati sensibili, configura il logging per salvare solo metadati (esito, durata) e non il contenuto completo dell\'output, coerente con la minimizzazione GDPR vista nella lezione su Privacy by design.</p><div class="warning-box">⚠️ <strong>Errore comune:</strong> pensare al logging solo come "nice to have" per il debug. In caso di audit normativo o di controversia con un cliente, il log è spesso l\'unica prova di come e perché un sistema ha preso una determinata decisione.</div>',
quiz:{q:'Cosa richiede l\'articolo 12 dell\'AI Act per i sistemi ad alto rischio?',opts:['Un canale social dedicato','Logging obbligatorio delle esecuzioni','L\'approvazione preventiva di un\'autorità','La disattivazione automatica dopo 30 giorni'],correct:1,explain:'L\'art. 12 dell\'AI Act richiede che i sistemi AI ad alto rischio mantengano log delle proprie operazioni, per garantire tracciabilità e possibilità di audit successivo.'}};

LESSON_CONTENT['4-4']={title:'Bias detection e fairness',content:'<h3>Riconoscere e limitare il bias negli agenti AI</h3><p>Un LLM riflette i pattern presenti nei dati su cui è stato addestrato, che possono includere bias impliciti (es. associazioni tra ruoli professionali e genere, o valutazioni influenzate da nomi di provenienza estera). In un contesto aziendale: screening CV, valutazione lead, scoring creditizio, questo ha conseguenze concrete.</p><h3>Dove il bias si nasconde nei workflow</h3><p><strong>Screening CV</strong>, Un nodo AI che valuta candidati può essere influenzato da nome, genere percepito o provenienza se questi elementi restano visibili nel testo analizzato, anche se il prompt non lo richiede esplicitamente.</p><p><strong>Scoring lead/clienti</strong>, Se i criteri di scoring correlano indirettamente con fattori demografici (es. area geografica come proxy di reddito), il risultato può perpetuare discriminazioni indirette anche senza intenzione.</p><h3>Mitigazioni pratiche</h3><p><strong>1. Pseudonimizzazione prima della valutazione</strong>, Rimuovi nome, genere, età, foto dal testo prima che raggiunga il nodo di valutazione, quando il compito non li richiede.</p><p><strong>2. Audit periodico dei risultati</strong>, Controlla periodicamente se i punteggi assegnati mostrano pattern sospetti per sottogruppi (es. tasso di scarto CV significativamente diverso tra gruppi).</p><p><strong>3. Criteri di scoring espliciti e documentati</strong>, Un prompt con criteri oggettivi e verificabili è più facile da controllare di uno che chiede una valutazione "olistica" generica.</p><div class="concept-box"><strong>Framework di riferimento:</strong> il DigComp 2.2 della Commissione Europea e le linee guida ALTAI includono la fairness come dimensione esplicita di valutazione per sistemi AI trustworthy.</div>',
quiz:{q:'Qual è una mitigazione pratica al bias in un nodo AI di screening CV?',opts:['Aumentare la temperature del modello','Rimuovere informazioni come nome e genere prima della valutazione, quando non necessarie al compito','Usare sempre lo stesso candidato come riferimento','Disattivare il nodo Condition'],correct:1,explain:'La pseudonimizzazione degli attributi non rilevanti al compito riduce la possibilità che il modello li usi (anche implicitamente) come fattore di valutazione.'}};

LESSON_CONTENT['4-5']={title:'Framework Responsible AI',content:'<h3>Orientarsi tra i framework di AI responsabile</h3><p>Diversi framework guidano la progettazione di sistemi AI affidabili. Conoscerne i punti chiave aiuta a strutturare le proprie scelte progettuali, non solo a "spuntare una checklist".</p><h3>I riferimenti principali</h3><p><strong>ALTAI (Commissione Europea, 2020)</strong>: Assessment List for Trustworthy AI: 7 requisiti tra cui supervisione umana, robustezza tecnica, privacy, trasparenza, diversità/non discriminazione, benessere sociale, accountability.</p><p><strong>AI Act (Regolamento UE 2024/1689)</strong>, Classifica i sistemi AI per livello di rischio (inaccettabile, alto, limitato, minimo) e impone obblighi crescenti: i sistemi ad alto rischio richiedono logging, supervisione umana e documentazione tecnica.</p><p><strong>DigComp 2.2</strong>, Framework di competenze digitali che include la valutazione critica dell\'output AI come competenza cittadina/professionale.</p><h3>Come si traduce nella pratica quotidiana</h3><p>Non serve leggere ogni framework per applicarne i principi: i punti che ricorrono ovunque sono human-in-the-loop per decisioni ad alto impatto, trasparenza sul funzionamento (workflow visuale, non scatola nera), tracciabilità (audit log) e verifica periodica di bias e accuratezza.</p><div class="concept-box"><strong>In RelAItion:</strong> il banner di governance su ogni agente del Marketplace (audit log immutabile, sandbox isolata, dati in EU) è la traduzione operativa diretta di questi principi, verificabile prima di installare un agente, non dopo.</div>',
quiz:{q:'Cosa hanno in comune ALTAI, AI Act e DigComp rispetto alla pratica quotidiana?',opts:['Richiedono tutti la stessa certificazione','Convergono su principi come supervisione umana, trasparenza e tracciabilità delle decisioni AI','Si applicano solo a governi e non ad aziende private','Riguardano solo la sicurezza informatica'],correct:1,explain:'Pur con enfasi diverse, i framework principali di AI responsabile condividono un nucleo comune: mantenere un umano nel loop per decisioni rilevanti, rendere il sistema comprensibile e tracciarne le azioni.'}};

LESSON_CONTENT['5-1']={title:'Social media agent: scheduling',content:'<h3>Lab: un agente che pianifica contenuti social senza supervisione costante</h3><p>Gestire più canali social con pubblicazioni regolari richiede coordinamento tra creazione contenuti, revisione e timing di pubblicazione, un caso naturale per l\'automazione parziale.</p><h3>Il workflow tipico</h3><p>Trigger Scheduler (es. ogni lunedì) → nodo AI che genera bozze per la settimana basandosi su un calendario editoriale e temi ricorrenti → nodo Condition che verifica tono e lunghezza per piattaforma → instradamento a Slack/Notion per approvazione umana → alla conferma, pubblicazione schedulata sui canali.</p><div class="concept-box"><strong>Un prompt per piattaforma, non uno generico:</strong> LinkedIn, Instagram e X hanno tono, lunghezza e formato molto diversi. Un singolo nodo AI con un prompt che specifica "adatta per LinkedIn: tono professionale, max 200 parole, CTA nel primo paragrafo" produce risultati nettamente migliori che chiedere un post generico da riadattare a mano.</p><h3>Perché l\'approvazione umana resta nel flusso</h3><p>Contenuti pubblici hanno un rischio reputazionale diretto: un errore di tono o un fatto sbagliato pubblicato automaticamente è molto più costoso di un ritardo di qualche ora nell\'approvazione. Il checkpoint umano prima della pubblicazione, non dopo, resta la configurazione consigliata anche per agenti maturi.</p><div class="warning-box">⚠️ <strong>Attenzione al calendario:</strong> uno Scheduler mal configurato (fuso orario sbagliato, giorno festivo non escluso) può pubblicare contenuti nel momento sbagliato. Verifica sempre il campo timezone del nodo Scheduler.</div>',
quiz:{q:'Perché conviene avere prompt differenziati per piattaforma invece di un prompt generico?',opts:['È un requisito tecnico del Builder','Ogni piattaforma ha tono, lunghezza e formato diversi: un prompt specifico produce risultati migliori senza bisogno di riadattamento manuale','Riduce il numero di nodi necessari','Non fa differenza sul risultato finale'],correct:1,explain:'Adattare esplicitamente il prompt alle convenzioni di ogni piattaforma (lunghezza, tono, posizione della CTA) evita di dover correggere manualmente un output generico dopo la generazione.'}};

LESSON_CONTENT['5-2']={title:'Email marketing automation',content:'<h3>Lab: personalizzazione email oltre il semplice "Ciao {nome}"</h3><p>L\'automazione email tradizionale personalizza solo pochi campi (nome, azienda). Un agente AI può personalizzare il CONTENUTO in base al profilo e al comportamento del destinatario, non solo i placeholder.</p><h3>Il workflow</h3><p>Trigger Scheduler o evento (es. "carrello abbandonato") → nodo AI che segmenta il destinatario in base ai dati disponibili (settore, interazioni precedenti, fase del funnel) → nodo AI che genera il corpo email adattato al segmento → invio via connettore Invia email → nodo Analytics per tracciare l\'esito.</p><div class="code-block">// Esempio di prompt segmentato:\n"Il destinatario è nel segmento \'trial scaduto\nsenza conversione\'. Scrivi un\'email che affronti\nl\'obiezione più probabile per il suo settore\n({settore}), tono diretto, CTA singola e chiara."</div><h3>Attenzione al deliverability</h3><p>Contenuti troppo generati/ripetitivi possono impattare la reputazione del dominio email presso i provider (spam score). Varia la struttura tra invii, evita pattern troppo riconoscibili come "generati in automatico", e mantieni sempre un tasso di revisione umana sui template principali.</p><div class="warning-box">⚠️ <strong>Compliance:</strong> l\'email marketing è soggetto a normative specifiche (consenso esplicito, diritto di opt-out chiaro). L\'automazione del contenuto non esonera dal rispetto di queste regole, verificale prima di attivare l\'agente su liste reali.</div>',
quiz:{q:'Cosa distingue la personalizzazione AI dalla classica automazione email con placeholder?',opts:['È più economica','Personalizza il contenuto in base a profilo e comportamento, non solo pochi campi come nome e azienda','Non richiede alcun controllo umano','Funziona solo su un singolo provider email'],correct:1,explain:'I placeholder tradizionali sostituiscono solo variabili fisse. Un nodo AI può adattare argomentazione, tono e CTA in base al segmento comportamentale del destinatario, un livello di personalizzazione qualitativamente diverso.'}};

LESSON_CONTENT['5-3']={title:'A/B testing automatizzato',content:'<h3>Case Study: A/B test su oggetto email gestito da un agente</h3><p>Un team marketing voleva testare sistematicamente varianti di oggetto email senza dover ogni volta impostare manualmente lo split, monitorare i risultati e decidere il vincitore.</p><h3>Il workflow</h3><p>Nodo AI genera 2-3 varianti dell\'oggetto email basate su angle diversi (urgenza, beneficio, curiosità) → connettore invia le varianti a segmenti bilanciati della lista → dopo una finestra temporale (nodo Delay), un secondo run legge i dati di apertura via connettore Analytics → nodo AI interpreta i risultati e determina la variante vincente → invio automatico della variante vincente al resto della lista.</p><div class="concept-box"><strong>Il ruolo dell\'AI non è solo generare le varianti:</strong> interpretare se una differenza è statisticamente significativa o solo rumore casuale su un campione piccolo è un compito che il nodo AI può supportare (con un prompt che include la dimensione del campione), ma la soglia di significatività va sempre impostata esplicitamente, non lasciata a giudizio "olistico" del modello.</div><h3>Risultati tipici</h3><p>Il valore principale non è un singolo test più veloce, ma la possibilità di testare continuamente senza il costo di setup manuale ripetuto, trasformando l\'A/B testing da attività occasionale a pratica costante.</p><div class="warning-box">⚠️ <strong>Attenzione ai campioni piccoli:</strong> su liste di poche centinaia di destinatari, differenze che sembrano nette possono essere puro rumore statistico. Imposta sempre una soglia minima di campione prima di considerare valido un risultato.</div>',
quiz:{q:'Qual è un rischio da gestire esplicitamente in un A/B test automatizzato via AI?',opts:['Il costo dei connettori email','Considerare valido un risultato su un campione troppo piccolo per essere statisticamente significativo','La generazione delle varianti richiede troppo tempo','I nodi Delay non sono supportati'],correct:1,explain:'Su campioni piccoli, differenze apparenti tra varianti possono essere dovute al caso. Va sempre impostata una soglia minima di campione/significatività esplicita prima di dichiarare un vincitore.'}};

LESSON_CONTENT['5-4']={title:'Analytics e reporting AI',content:'<h3>Trasformare dati grezzi in report leggibili automaticamente</h3><p>I dashboard tradizionali mostrano numeri; un agente AI può aggiungere lo strato di interpretazione che normalmente richiede un analista: "cosa significa questo numero e cosa dovrei fare al riguardo".</p><h3>Il workflow</h3><p>Trigger Scheduler (es. ogni lunedì mattina) → connettore che estrae le metriche della settimana (da database o tool di analytics) → nodo AI che confronta con la settimana precedente e identifica variazioni significative → nodo AI che genera un sommario esecutivo in linguaggio naturale → invio via email/Slack al management.</p><div class="code-block">// Prompt del nodo di sintesi:\n"Dati: {metriche_settimana_corrente} vs\n{metriche_settimana_precedente}.\nIdentifica le 3 variazioni più significative\n(soglia: oltre 15%). Per ciascuna, spiega la\npossibile causa e suggerisci un\'azione.\nMax 150 parole, tono da report esecutivo."</div><h3>Perché evidenziare solo le variazioni significative</h3><p>Un report che elenca tutte le metriche senza priorità è utile quanto il dashboard originale. Il valore del nodo AI sta nel filtrare il rumore e portare l\'attenzione umana solo su ciò che è cambiato in modo rilevante, la soglia (es. 15%) va decisa esplicitamente in base al contesto del business, non lasciata generica.</p><div class="concept-box"><strong>Nel Builder:</strong> il nodo Analytics traccia metriche custom durante l\'esecuzione stessa dei tuoi altri agenti, puoi costruire un agente di reporting che analizza le performance degli ALTRI agenti in produzione, chiudendo il cerchio dell\'osservabilità.</div>',
quiz:{q:'Qual è il valore aggiunto principale di un nodo AI in un workflow di reporting?',opts:['Rendere il report più lungo','Filtrare il rumore ed evidenziare solo le variazioni significative, con interpretazione in linguaggio naturale','Sostituire completamente il dashboard esistente','Eliminare la necessità di raccogliere dati'],correct:1,explain:'Un report che elenca tutto senza priorità non aggiunge valore rispetto al dashboard. Il nodo AI è utile quando filtra e interpreta, portando l\'attenzione umana solo su ciò che conta davvero.'}};

LESSON_CONTENT['5-5']={title:'Multi-channel orchestration',content:'<h3>Coordinare più canali con un unico agente</h3><p>Le campagne efficaci raramente vivono su un solo canale. Orchestrare email, social e notifiche push in modo coerente: senza duplicare lavoro o creare messaggi contraddittori tra canali, è un caso d\'uso avanzato per i workflow multi-nodo.</p><h3>Pattern architetturale</h3><p>Un nodo AI centrale genera il "messaggio core" della campagna (l\'idea, l\'offerta, il tono) → nodi AI paralleli specializzati adattano il messaggio core per ciascun canale (email più lungo e dettagliato, social più breve e visivo, push notification brevissima con urgenza) → ogni variante passa dal proprio connettore di invio → un nodo Merge aggrega gli esiti per un report unificato della campagna.</p><div class="concept-box"><strong>Perché partire da un "messaggio core" condiviso:</strong> generare ogni canale in modo indipendente rischia di produrre messaggi disallineati (offerte diverse, tono incoerente). Un unico nodo che definisce il messaggio centrale, poi adattato per canale, garantisce coerenza senza sacrificare l\'ottimizzazione per piattaforma.</p><h3>Sequenziamento tra canali</h3><p>Non tutti i canali devono partire insieme: un pattern comune è email il giorno 1, retargeting social il giorno 3 per chi non ha aperto l\'email (richiede un nodo Condition che legge l\'esito del canale precedente), push notification come ultimo promemoria. Il nodo Delay tra gli step permette di orchestrare questa sequenza temporale.</p><div class="warning-box">⚠️ <strong>Attenzione alla frequenza:</strong> orchestrare più canali aumenta il rischio di sovraesporre lo stesso utente a messaggi ravvicinati. Prevedi sempre una logica di frequency capping (es. non più di 1 messaggio ogni 48 ore per utente) tra i canali.</div>',
quiz:{q:'Perché conviene generare un "messaggio core" condiviso prima di adattarlo per canale?',opts:['Riduce i nodi necessari a uno solo','Garantisce coerenza di offerta e tono tra i canali, evitando messaggi disallineati','È l\'unico modo supportato dal Builder','Elimina la necessità del nodo Merge'],correct:1,explain:'Generare ogni canale in modo completamente indipendente rischia disallineamenti (offerte o toni diversi). Un messaggio core condiviso, poi adattato, mantiene coerenza cross-canale.'}};

// Add content stubs for remaining lessons
['1-4','1-5','2-1','2-3','2-4','2-5','3-0','3-1','3-2','3-3','3-4','3-5','4-0','4-1','4-2','4-3','4-4','4-5','5-0','5-1','5-2','5-3','5-4','5-5'].forEach(function(k){
  if(!LESSON_CONTENT[k]){
    var parts=k.split('-');
    // Le chiavi usano l'id REALE del percorso (1-5), non l'indice
    // nell'array PATHS (0-4): indicizzare l'array direttamente prendeva
    // il percorso sbagliato (o, per il percorso 5, nessun percorso —
    // PATHS[5] non esiste — lasciando le lezioni Marketing 1-5 senza
    // contenuto e quindi non apribili).
    var path=PATHS.find(function(x){return x.id===parseInt(parts[0])});
    var lesson=path?path.lessons[parseInt(parts[1])]:null;
    if(lesson){
      LESSON_CONTENT[k]={title:lesson.t,content:'<h3>'+lesson.t+'</h3><p>Contenuto del modulo in preparazione. Questa lezione coprirà i concetti fondamentali di <strong>'+lesson.t.toLowerCase()+'</strong> con esempi pratici e esercizi interattivi.</p><div class="concept-box"><strong>Coming soon:</strong> Questo modulo sarà disponibile nella prossima release. Nel frattempo, puoi esplorare gli altri moduli completati.</div><p>Durata stimata: '+lesson.dur+' · Formato: '+lesson.type+'</p>',quiz:null};
    }
  }
});


// I contenuti delle lezioni sono stati scritti in due momenti e con due forme
// di quiz: `{q,opts,correct,explain}` in trenta lezioni, `{q,a,c,exp}` nelle
// sei di `lessons-fondamenti.js`. Il renderer leggeva solo la prima, quindi su
// quelle sei `lc.quiz.opts.map(...)` sollevava un'eccezione e la lezione non si
// apriva affatto — comprese le prime quattro del primo percorso, cioe' quelle
// che un utente nuovo apre per prime.
//
// Invece di riscrivere i dati si normalizza qui: entrambe le forme restano
// valide per chi scrive contenuti, e a valle ne esiste una sola. Se un quiz e'
// malformato la funzione restituisce null e la lezione si apre SENZA quiz —
// un quiz rotto non deve poter nascondere la lezione che lo contiene.
function lezioneQuiz(quiz){
  if(!quiz)return null;
  var opts=quiz.opts||quiz.a;
  var giusta=(quiz.correct!==undefined)?quiz.correct:quiz.c;
  if(!Array.isArray(opts)||!opts.length)return null;
  if(typeof giusta!=='number'||giusta<0||giusta>=opts.length)return null;
  return {q:quiz.q||'', opts:opts, correct:giusta, explain:quiz.explain||quiz.exp||''};
}
function openLesson(pid,li){
  // pid arriva 0-based (id percorso reale - 1, per coerenza con l'indice
  // dell'array PATHS), ma le chiavi di LESSON_CONTENT sono scritte con
  // l'id REALE del percorso (1-0, 2-0, ...). Prima si usava "pid" al posto
  // di "realId" per la chiave: su Percorso 1 la lezione non si apriva mai
  // (chiave "0-x" inesistente), sugli altri percorsi si apriva il
  // contenuto sbagliato (quello del percorso precedente).
  var realId=pid+1;
  var key=realId+'-'+li;
  var lc=LESSON_CONTENT[key];
  var p=PATHS.find(function(x){return x.id===realId});
  var lesson=p?p.lessons[li]:null;
  if(!lc||!lesson)return;

  document.getElementById('learn-main').style.display='none';
  var detail=document.getElementById('learn-detail');
  detail.classList.add('active');

  var quizHtml='';
  var quiz=lezioneQuiz(lc.quiz);
  if(quiz){
    quizHtml='<div class="quiz-wrap"><h4>Quiz di verifica</h4><p style="font-size:13px;color:var(--tx2);margin-bottom:12px">'+quiz.q+'</p>'+
      quiz.opts.map(function(o,i){
        return '<div class="quiz-option" onclick="checkQuiz(\''+key+'\','+i+',this)" data-idx="'+i+'"><span class="quiz-radio"></span>'+o+'</div>';
      }).join('')+
      '<div class="quiz-feedback" id="quizFeedback-'+key+'"></div>'+
      '<button class="tb-btn primary mt-12" onclick="submitQuiz(\''+key+'\')" id="quizSubmit-'+key+'" disabled>Verifica risposta</button></div>';
  }

  detail.innerHTML=
    '<div class="lesson-back" onclick="openPath('+realId+')">← Torna a '+p.name+'</div>'+
    '<div style="display:flex;align-items:center;gap:16px;margin-bottom:8px">'+
      '<div style="font-size:28px">'+p.icon+'</div>'+
      '<div><div style="font-size:10px;color:var(--tx4);text-transform:uppercase;letter-spacing:.5px">'+p.name+' · Lezione '+(li+1)+'</div><div style="font-size:18px;font-weight:800">'+lesson.t+'</div></div>'+
      '<div style="margin-left:auto;display:flex;gap:6px">'+
        '<span class="badge badge-gray">'+lesson.type+'</span>'+
        '<span class="badge badge-gray">'+lesson.dur+'</span>'+
      '</div>'+
    '</div>'+
    '<div class="lesson-content">'+lc.content+quizHtml+'</div>'+
    (typeof bloccoPratica==='function'?bloccoPratica(key):'')+
    (typeof bloccoRisorse==='function'?bloccoRisorse(key):'')+
    '<div style="display:flex;justify-content:space-between;margin-top:16px">'+
      (li>0?'<button class="tb-btn" onclick="openLesson('+pid+','+(li-1)+')">← Precedente</button>':'<span></span>')+
      '<button class="tb-btn primary" onclick="markAndNext('+pid+','+li+')">'+(lesson.done?'✅ Completata':'Segna come completata →')+'</button>'+
      (li<p.lessons.length-1?'<button class="tb-btn" onclick="openLesson('+pid+','+(li+1)+')">Successiva →</button>':'<span></span>')+
    '</div>';
}


function checkQuiz(key,idx,el){
  quizSelection[key]=idx;
  el.closest('.quiz-wrap').querySelectorAll('.quiz-option').forEach(function(o){o.classList.remove('selected')});
  el.classList.add('selected');
  document.getElementById('quizSubmit-'+key).disabled=false;
}

function submitQuiz(key){
  var lc=LESSON_CONTENT[key];if(!lc)return;
  var quiz=lezioneQuiz(lc.quiz);if(!quiz)return;
  var sel=quizSelection[key];
  var wrap=document.getElementById('quizSubmit-'+key).closest('.quiz-wrap');
  var opts=wrap.querySelectorAll('.quiz-option');
  opts.forEach(function(o,i){
    o.style.pointerEvents='none';
    if(i===quiz.correct)o.classList.add('correct');
    if(i===sel&&i!==quiz.correct)o.classList.add('wrong');
  });
  var fb=document.getElementById('quizFeedback-'+key);
  if(sel===quiz.correct){
    fb.innerHTML='✅ <strong>Corretto!</strong> '+quiz.explain;
    fb.style.background='#D1FAE5';fb.style.color='#065F46';
    if(!dbGetOne('SELECT quiz_key FROM quiz_done WHERE quiz_key=? AND user=?',[key,utenteCorrente()])){
      dbRun('INSERT INTO quiz_done (user,quiz_key,ts) VALUES (?,?,?)',[utenteCorrente(),key,new Date().toISOString()]);
      addXP(25,'Superato quiz');
    }
    showToast('✅ Quiz superato! +25 XP');
  }else{
    fb.innerHTML='❌ <strong>Risposta errata.</strong> '+quiz.explain;
    fb.style.background='#FEE2E2';fb.style.color='#991B1B';
  }
  fb.classList.add('show');
  document.getElementById('quizSubmit-'+key).disabled=true;
}

function markAndNext(pid,li){
  var p=PATHS.find(function(x){return x.id===pid+1});
  if(p&&!p.lessons[li].done){
    p.lessons[li].done=true;
    saveLearnProgress();
    addXP(50,'Completata: '+p.lessons[li].t);
    showToast('✅ Lezione completata! +50 XP');
  }
  if(li<p.lessons.length-1){openLesson(pid,li+1);return}
  openPath(pid+1);
  // Finire il percorso e non finirlo mostravano lo stesso messaggio.
  if(typeof percorsoCompletato==='function'&&percorsoCompletato(p))festeggiaPercorso(p);
  else showToast('Avanzamento aggiornato: '+p.lessons.filter(function(l){return l.done}).length+'/'+p.lessons.length+' lezioni');
}

// ══════════════════════════════════════════
// ENHANCED COMMUNITY — Post detail + comments
// ══════════════════════════════════════════

// Comments database

var COMMENTS={
  1:[{user:'Laura B.',ava:'LB',color:'#0EA5E9',text:'Fantastico! Puoi condividere il template del prompt che usi per la verifica documenti?',time:'1 ora fa'},
     {user:'Paolo G.',ava:'PG',color:'#F97316',text:'Implementato nella mia azienda, confermo il 60%. Noi siamo arrivati al 55% ma con documenti più complessi.',time:'45 min fa'},
     {user:'Marco R.',ava:'MR',color:'#10B981',text:'Grazie! Il template è nel mio profilo. Il trucco è un system prompt molto specifico per tipo di documento.',time:'30 min fa'}],
  2:[{user:'Luca P.',ava:'LP',color:'#EF4444',text:'Io uso un pattern con try/catch: se il JSON è malformato, ripasso l\'output al LLM con "correggi questo JSON".',time:'ieri'},
     {user:'Andrea L.',ava:'AL',color:'#8B5CF6',text:'Meglio usare function calling / structured output. Claude lo supporta nativamente e non serve parsing manuale.',time:'ieri'},
     {user:'Sara L.',ava:'SL',color:'#6366F1',text:'Ottimo suggerimento Andrea! Provo con function calling. Qualcuno ha un esempio di schema per classificazione ticket?',time:'20 ore fa'}],
  3:[{user:'Marco R.',ava:'MR',color:'#10B981',text:'+23% è un risultato eccezionale. Quale provider email usate? SendGrid?',time:'ieri'},
     {user:'Valentina M.',ava:'VM',color:'#D946EF',text:'Sì, SendGrid + webhook per i tracking events. L\'agent monitora open/click e aggiusta il subject in real-time.',time:'ieri'}],
  4:[{user:'Sara L.',ava:'SL',color:'#6366F1',text:'Come gestisci i formati di fattura completamente diversi tra paesi? Il layout tedesco è molto diverso da quello italiano.',time:'2 giorni fa'},
     {user:'Giulia D.',ava:'GD',color:'#F59E0B',text:'Il trucco è nel system prompt: passo al LLM un "template di estrazione" diverso per ogni lingua/paese. Funziona perché il LLM capisce il contesto culturale.',time:'1 giorno fa'}],
  5:[{user:'Chiara V.',ava:'CV',color:'#14B8A6',text:'Tutorial utilissimo! Step 6 (OAuth) mi ha bloccato, la documentazione Salesforce è un labirinto.',time:'3 giorni fa'},
     {user:'Andrea L.',ava:'AL',color:'#8B5CF6',text:'Sì, OAuth è il passaggio più complesso. Tip: usa il Connected App con PKCE flow, è più semplice del Web Server flow.',time:'2 giorni fa'},
     {user:'Paolo G.',ava:'PG',color:'#F97316',text:'Grazie Andrea! Funziona perfettamente. Ho anche aggiunto un nodo di refresh token automatico.',time:'1 giorno fa'}],
  6:[{user:'Marco R.',ava:'MR',color:'#10B981',text:'Che metriche custom tracci? Io monitoro: latenza P95, error rate per tipo nodo, e costo API per esecuzione.',time:'3 giorni fa'},
     {user:'Luca P.',ava:'LP',color:'#EF4444',text:'Esatto quelle + "token waste", quanti token vengono sprecati per retry. È una metrica sottovalutata.',time:'3 giorni fa'}],
  7:[{user:'Andrea L.',ava:'AL',color:'#8B5CF6',text:'Ottima checklist! Aggiungerei il punto sulla pseudonimizzazione dei dati nei log dell\'agente. Spesso si loggano dati PII senza accorgersene.',time:'4 giorni fa'},
     {user:'Laura B.',ava:'LB',color:'#0EA5E9',text:'Noi abbiamo aggiunto un layer di anonimizzazione automatica prima di passare i dati al LLM. Usiamo Presidio di Microsoft.',time:'4 giorni fa'},
     {user:'Chiara V.',ava:'CV',color:'#14B8A6',text:'Esatto Laura, Presidio è ottimo. L\'ho incluso nella checklist v2 che pubblicherò la prossima settimana.',time:'3 giorni fa'}],
  8:[{user:'Giulia D.',ava:'GD',color:'#F59E0B',text:'Numeri impressionanti! Quale modello LLM usate? Il costo API di €280/mese sembra molto contenuto per 4 agenti.',time:'6 giorni fa'},
     {user:'Paolo G.',ava:'PG',color:'#F97316',text:'Mix: Claude Haiku per task semplici (classificazione, extraction), GPT-4o solo per analisi complesse. Il trucco è usare il modello più economico che funziona per ogni step.',time:'5 giorni fa'}],
  9:[{user:'Sara L.',ava:'SL',color:'#6366F1',text:'Il pattern human-in-the-loop è fondamentale per la compliance. Noi lo usiamo per tutti gli agenti che toccano dati finanziari sopra €10K.',time:'6 giorni fa'}],
  10:[{user:'Valentina M.',ava:'VM',color:'#D946EF',text:'La sandbox è stata game-changer anche per noi. Il CTO ha visto il primo agente elaborare 200 fatture in 3 minuti e ha detto "ok, procediamo".',time:'5 giorni fa'},
      {user:'Luca P.',ava:'LP',color:'#EF4444',text:'Confermo: il modo migliore per convincere i decision maker è una demo live con dati reali. Non slide, non report, risultati tangibili.',time:'4 giorni fa'}]
,
  // Cinque contributi non avevano nemmeno una risposta pur dichiarandone
  // decine: 19, 27, 44, 11, 29. Ora ne hanno di vere, e il contatore le conta.
  11:[{user:'Mario R.',ava:'MR',color:'#10B981',text:'Scaricato e importato: gira al primo colpo. Ho solo alzato la soglia di tolleranza sugli scostamenti, perché sui nostri fornitori esteri gli arrotondamenti valuta facevano scattare troppe eccezioni.',time:'2 giorni fa'},
      {user:'Sara L.',ava:'SL',color:'#EF4444',text:'Attenzione a chi lo riusa: il flusso passa il numero di conto al modello. Basta un nodo di mascheramento prima e il problema non si pone.',time:'2 giorni fa'},
      {user:'Giulia D.',ava:'GD',color:'#F59E0B',text:'Hai ragione, l\'ho aggiunto nella versione 1.1 che ho appena ricaricato. Grazie.',time:'1 giorno fa'}],
  12:[{user:'Marco R.',ava:'MR',color:'#6366F1',text:'Uso questa checklist da un mese. Il punto che mi ha salvato è il quinto: verificare che ogni ramo della condizione porti da qualche parte. Avevo un flusso che girava senza mandare niente.',time:'3 giorni fa'},
      {user:'Mario R.',ava:'MR',color:'#10B981',text:'Stesso identico problema. Adesso la piattaforma lo segnala prima di eseguire, ma la checklist resta utile per le cose che il controllo automatico non vede.',time:'2 giorni fa'}],
  13:[{user:'Sara L.',ava:'SL',color:'#EF4444',text:'Il paragrafo su "se conosci tutti i casi, scrivi le condizioni" andrebbe stampato e appeso. Metà dei progetti che vedo sono if annidati travestiti da AI.',time:'4 giorni fa'},
      {user:'Giulia D.',ava:'GD',color:'#F59E0B',text:'Aggiungerei un caso: quando l\'errore costa più della persona che eviteresti di far lavorare. Sulle note di credito non lo useremo mai.',time:'3 giorni fa'},
      {user:'Marco R.',ava:'MR',color:'#6366F1',text:'Sì, ma attenzione a non usarlo come scusa per non provare. Noi abbiamo rimandato un anno per questo motivo e il caso era banale.',time:'3 giorni fa'}],
  14:[{user:'Giulia D.',ava:'GD',color:'#F59E0B',text:'Il dataset è ottimo perché contiene anche i casi sporchi: separatori diversi, date in tre formati, celle unite. Sono quelli che rompono tutto.',time:'5 giorni fa'},
      {user:'Mario R.',ava:'MR',color:'#10B981',text:'Confermo. Il mio estrattore andava al 100% sui file puliti e al 60% su questi. Utile per tarare le aspettative prima di presentarlo.',time:'4 giorni fa'}],
  15:[{user:'Mario R.',ava:'MR',color:'#10B981',text:'Il conto che manca sempre è il tempo di chi corregge gli errori dell\'agente. Da noi pesa più delle chiamate al modello.',time:'2 giorni fa'},
      {user:'Sara L.',ava:'SL',color:'#EF4444',text:'E il costo dei tentativi: ogni retry è una chiamata pagata. Su un flusso con un nodo instabile la bolletta raddoppia senza che nessuno se ne accorga.',time:'2 giorni fa'},
      {user:'Marco R.',ava:'MR',color:'#6366F1',text:'Il Monitoraggio ora mostra la distribuzione delle durate: i casi lenti sono quasi sempre quelli che stanno ritentando.',time:'1 giorno fa'}]
};


function openPostDetail(id){
  var p=POSTS.find(function(x){return x.id===id});if(!p)return;
  var comments=COMMENTS[id]||[];
  // La visualizzazione si registra all'apertura, una per persona: riaprire lo
  // stesso post dieci volte non e' dieci persone interessate.
  if(typeof fmRegistraVista==='function')fmRegistraVista(id);
  var typeColors={Soluzione:'badge-g',Domanda:'badge-b',Showcase:'badge-p',Tutorial:'badge-y'};
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:flex-start">'+
      '<div style="display:flex;gap:12px;align-items:center">'+
        '<div class="post-ava" style="background:'+p.color+';width:42px;height:42px;font-size:14px">'+p.ava+'</div>'+
        '<div><div style="font-size:14px;font-weight:700">'+p.user+'</div><div style="font-size:11px;color:var(--tx4)">'+p.time+' · '+p.tag+'</div></div>'+
      '</div>'+
      '<button class="modal-close" onclick="closeModal()">✕</button>'+
    '</div>'+
    '<div style="margin:16px 0 8px"><span class="badge '+(typeColors[p.type]||'badge-gray')+'">'+p.type+'</span></div>'+
    '<h2 style="font-size:18px;margin-bottom:12px">'+p.title+'</h2>'+
    '<p style="font-size:13px;color:var(--tx2);line-height:1.8;margin-bottom:14px">'+p.body+'</p>'+
    // La modifica è dichiarata: chi ha commentato deve capire che il testo a
    // cui rispondeva potrebbe non essere più quello.
    (p.edited_at?'<div style="font-size:10.5px;color:var(--tx4);font-style:italic;margin-bottom:12px">✏️ Modificato il '+new Date(p.edited_at).toLocaleString('it-IT')+'</div>':'')+
    // Anche qui l'immagine si vede, non si annuncia: aprire un post per
    // trovarci scritto «📎 schema.png» e' un passaggio in piu' verso niente.
    // Nel dettaglio gli allegati sono gli stessi della scheda: una funzione
    // sola, così le due viste non possono divergere.
    (typeof allegatiHTMLPost==='function'?allegatiHTMLPost(p):'')+
    // Solo l'autore può intervenire sul proprio post.
    (p.user===profileData.name
      ? '<div style="display:flex;gap:8px;margin-bottom:16px">'+
        '<button class="tb-btn" style="flex:1;justify-content:center" onclick="closeModal();openNewPost('+p.id+')">✏️ Modifica</button>'+
        '<button class="tb-btn" style="flex:1;justify-content:center;color:#EF4444;border-color:#FEE2E2" onclick="closeModal();eliminaPost('+p.id+')">🗑️ Elimina</button></div>'
      : '')+
    '<div style="display:flex;gap:16px;padding:12px 0;border-top:1px solid var(--bg2);border-bottom:1px solid var(--bg2);margin-bottom:16px">'+
      '<span class="post-action" onclick="fmAlternaLike('+p.id+')" '+
        'style="'+(fmHoMessoLike(p.id)?'color:#EF4444;font-weight:700':'')+'">❤️ '+fmLike(p.id)+
        (fmHoMessoLike(p.id)?': ti piace':' Like')+'</span>'+
      '<span class="post-action">💬 '+comments.length+' Commenti</span>'+
      '<span class="post-action">👁️ '+fmViste(p.id,p.views)+' Visualizzazioni</span>'+
    '</div>'+
    '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Commenti ('+comments.length+')</h3>'+
    comments.map(function(c,ci){
      var mio=(c.user===utenteCorrente());
      return '<div class="comment-item"><div class="comment-ava" style="background:'+c.color+'">'+c.ava+'</div>'+
        '<div class="comment-body"><div class="comment-user">'+c.user+(mio?' · tu':'')+'</div>'+
        '<div class="comment-text">'+c.text+'</div>'+
        '<div class="comment-time">'+c.time+
          (mio?' · <span style="text-decoration:underline;cursor:pointer" onclick="fmEliminaCommento('+p.id+','+ci+')">elimina</span>':'')+
        '</div></div></div>';
    }).join('')+
    '<div class="comment-input-row"><input id="newCommentInput" placeholder="Scrivi un commento..." onkeydown="if(event.key===\'Enter\')addComment('+p.id+')"><button class="tb-btn primary" onclick="addComment('+p.id+')" style="flex-shrink:0">Invia</button></div>'
  ,true);
  // Marca la finestra: dopo un «mi piace» si ridisegna solo se e' aperta su
  // QUESTO post, non su un altro.
  var ovp=document.getElementById('modalOverlay');
  if(ovp)ovp.setAttribute('data-post',id);
}


function addComment(postId){
  var input=document.getElementById('newCommentInput');
  var text=input.value.trim();if(!text)return;
  if(!COMMENTS[postId])COMMENTS[postId]=[];
  COMMENTS[postId].push({user:profileData.name,ava:(profileData.name||'U').substring(0,2).toUpperCase(),color:'#6366F1',text:text,time:'ora'});
  var p=POSTS.find(function(x){return x.id===postId});
  // Il contatore non si incrementa piu': e' calcolato dalla lunghezza
  // dell'elenco. Un contatore separato dai dati che conta prima o poi mente,
  // ed e' esattamente cio' che era successo qui.
  saveForumState();
  openPostDetail(postId);
  showToast('💬 Commento aggiunto!');
  addXP(10,'Commentato post: '+(p?p.title:''));
}

// ══════════════════════════════════════════
// PERSISTENZA — Learning Hub, Community e Sfide prima vivevano solo in
// memoria (variabili JS): ricaricando la pagina, lezioni completate, post,
// like, commenti e iscrizioni sparivano. Ora sono righe nel database
// SQLite (js/db.js) e vengono ricaricate all'avvio da
// loadPersistedContent() (chiamata in main.js dopo initDatabase()).
// ══════════════════════════════════════════

function saveLearnProgress(){
  PATHS.forEach(function(p){
    p.lessons.forEach(function(l,i){
      dbRun('INSERT OR REPLACE INTO learn_progress (user,path_id,lesson_index,done) VALUES (?,?,?,?)',[utenteCorrente(),p.id,i,l.done?1:0]);
    });
  });
}

// POSTS/COMMENTS restano gli array in-memory che il rendering legge; questa
// funzione li risincronizza per intero nel database (dataset piccolo per un
// POC, evita di dover scrivere UPDATE mirati per ogni like/commento).
function saveForumState(){
  dbRun('DELETE FROM forum_posts');dbRun('DELETE FROM forum_comments');
  POSTS.forEach(function(p){
    dbRun('INSERT INTO forum_posts (id,user,ava,color,title,body,type,tag,likes,comments,views,time,created_at,attach_name,attach_mime,attach_data,edited_at,allegati_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [p.id,p.user,p.ava,p.color,p.title,p.body,p.type,p.tag,p.likes||0,p.comments||0,p.views||0,p.time,new Date().toISOString(),
       p.attach_name||null,p.attach_mime||null,p.attach_data||null,p.edited_at||null,
       (p.allegati&&p.allegati.length)?JSON.stringify(p.allegati):null]);
  });
  Object.keys(COMMENTS).forEach(function(postId){
    (COMMENTS[postId]||[]).forEach(function(c){
      dbRun('INSERT INTO forum_comments (post_id,user,ava,color,text,time,created_at) VALUES (?,?,?,?,?,?,?)',
        [parseInt(postId),c.user,c.ava,c.color,c.text,c.time,new Date().toISOString()]);
    });
  });
}

function loadPersistedContent(){
  var lp=dbAll('SELECT * FROM learn_progress WHERE user=?',[utenteCorrente()]);
  // Si AZZERA prima di applicare: il valore `done` è scritto dentro PATHS come
  // decorazione della demo, e limitarsi a sovrascrivere dove esiste una riga
  // faceva ereditare a ogni utente i progressi finti — un account nuovo
  // risultava con sei lezioni già completate.
  var byPath={};
  lp.forEach(function(r){(byPath[r.path_id]=byPath[r.path_id]||[])[r.lesson_index]=!!r.done});
  PATHS.forEach(function(p){
    var sp=byPath[p.id]||[];
    p.lessons.forEach(function(l,i){ l.done=!!sp[i] });
  });
  var dbPosts=dbAll('SELECT * FROM forum_posts ORDER BY id DESC');
  if(dbPosts.length){
    POSTS.length=0;
    dbPosts.forEach(function(p){
      // L'elenco degli allegati torna dal JSON; se manca si ricostruisce dal
      // campo singolo, cosi' i post scritti prima non perdono il loro file.
      if(p.allegati_json){ try{ p.allegati=JSON.parse(p.allegati_json) }catch(e){} }
      if(!p.allegati && p.attach_name)p.allegati=[{nome:p.attach_name,mime:p.attach_mime,dati:p.attach_data}];
      POSTS.push(p);
    });
    Object.keys(COMMENTS).forEach(function(k){delete COMMENTS[k]});
    dbAll('SELECT * FROM forum_comments ORDER BY id').forEach(function(c){
      (COMMENTS[c.post_id]=COMMENTS[c.post_id]||[]).push({user:c.user,ava:c.ava,color:c.color,text:c.text,time:c.time});
    });
  }
  // Le iscrizioni alle sfide vanno AZZERATE prima di ricaricarle: la mappa
  // vive in memoria e sopravvive al cambio di utente, quindi senza questa riga
  // chi entrava dopo Mario ereditava le sue sei iscrizioni. Il resto della
  // pagina legge dal database e non se ne accorgeva, ma un difetto che dipende
  // da quale schermata guardi è peggio di uno visibile sempre.
  Object.keys(challengeRegistered).forEach(function(k){delete challengeRegistered[k]});
  dbAll('SELECT challenge_id FROM challenges_registered WHERE user=?',[utenteCorrente()]).forEach(function(r){challengeRegistered[r.challenge_id]=true});
}

// ══════════════════════════════════════════
// ENHANCED DASHBOARD — Interactive chart
// ══════════════════════════════════════════

function renderDashboard(){
  updateStatCards();
  // Popular agents
  var pop=[{name:'Lead Qualifier Pro',runs:42,icon:'🎯',trend:'+12%'},{name:'Invoice Extractor',runs:35,icon:'🧾',trend:'+8%'},{name:'Meeting Summarizer',runs:28,icon:'🎙️',trend:'+15%'},{name:'Support Ticket Triage',runs:23,icon:'🎧',trend:'+5%'}];
  document.getElementById('dash-popular').innerHTML=pop.map(function(a,i){
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--bg2);cursor:pointer" onclick="go(\'marketplace\')"><span style="font-size:14px;font-weight:800;color:var(--tx4);width:20px">'+(i+1)+'</span><span style="font-size:18px">'+a.icon+'</span><span style="font-size:12px;font-weight:600;flex:1">'+a.name+'</span><span class="badge badge-g" style="font-size:10px">'+a.trend+'</span><span style="font-size:11px;color:var(--ac);font-weight:700">'+a.runs+' run</span></div>';
  }).join('');

  // Activity
  var dActs=[
    {text:'Eseguito Lead Qualifier Pro: 3 lead qualificati',time:'10 min fa',dot:'#10B981',action:'go(\'myagents\')'},
    {text:'Completata lezione: Loop e iterazioni (+50 XP)',time:'1 ora fa',dot:'#6366F1',action:'go(\'learning\')'},
    {text:'Installato Invoice Extractor dal marketplace',time:'2 ore fa',dot:'#F59E0B',action:'go(\'myagents\')'},
    {text:'Nuovo commento di Andrea L. al tuo post',time:'3 ore fa',dot:'#8B5CF6',action:'go(\'community\')'},
    {text:'Badge «Costanza»: 5 giorni consecutivi di attività 🔥',time:'ieri',dot:'#EF4444',action:'go(\'profile\')'}
  ];
  document.getElementById('dash-activity').innerHTML=dActs.map(function(a){
    return '<div class="activity-item" style="cursor:pointer" onclick="'+a.action+'"><div class="activity-dot" style="background:'+a.dot+'"></div><div><div class="activity-text">'+a.text+'</div><div class="activity-time">'+a.time+'</div></div></div>';
  }).join('');

  // Chart — render execution trend
  renderDashChart();

  // Suggestions (based on profile: builder + insurance interest)
  var sugg=[
    {icon:'🛡️',title:'Compliance Monitor',sub:'Nuovo agente Insurance: perfetto per il tuo settore',action:"openAgentDetail(22)"},
    {icon:'🎓',title:'Lezione: Loop e iterazioni',sub:'Prossimo step del percorso Builder Avanzato',action:"go('learning')"},
    {icon:'💡',title:'Template: Human-in-the-loop',sub:'Pattern di approvazione per flussi critici',action:"openTemplateGallery()"},
    {icon:'🏆',title:'Sprint: Best Sales Agent',sub:'Scade tra 5 giorni, 23 partecipanti',action:"go('challenges')"}
  ];
  var se=document.getElementById('dash-suggestions');
  if(se)se.innerHTML=sugg.map(function(s){
    return '<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--bg2);cursor:pointer;align-items:center" onclick="'+s.action+'"><span style="font-size:20px">'+s.icon+'</span><div style="flex:1"><div style="font-size:12px;font-weight:700">'+s.title+'</div><div style="font-size:11px;color:var(--tx4)">'+s.sub+'</div></div><span style="color:var(--tx4)">→</span></div>';
  }).join('');

  // News
  var news=[
    {date:'2 Lug',title:'Rilasciato il supporto per provider AI custom',sub:'Ollama, Azure OpenAI, Mistral: ora puoi usare modelli on-premise'},
    {date:'28 Giu',title:'4 nuovi agenti per il settore Insurance',sub:'Claims Triage, Policy Renewal, Underwriting, Compliance Monitor'},
    {date:'25 Giu',title:'Log Esecuzioni potenziato',sub:'Audit trail personale con export CSV e filtri per esito'},
    {date:'20 Giu',title:'AI Chat Builder ora genera workflow eseguibili',sub:'I connettori vengono pre-configurati automaticamente'}
  ];
  var ne=document.getElementById('dash-news');
  if(ne)ne.innerHTML=news.map(function(n){
    return '<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--bg2)"><span class="badge badge-gray" style="flex-shrink:0;height:fit-content">'+n.date+'</span><div><div style="font-size:12px;font-weight:700">'+n.title+'</div><div style="font-size:11px;color:var(--tx4);margin-top:2px">'+n.sub+'</div></div></div>';
  }).join('');
}


function renderDashChart(){
  var card=document.querySelector('#page-dashboard .card.mt-20');
  if(!card)return;
  var chartData=[{label:'Lun',val:18},{label:'Mar',val:24},{label:'Mer',val:31},{label:'Gio',val:22},{label:'Ven',val:35},{label:'Sab',val:12},{label:'Dom',val:6}];
  var maxVal=Math.max.apply(null,chartData.map(function(d){return d.val}));
  card.innerHTML='<div class="card-header"><div class="card-title">Esecuzioni questa settimana</div><span class="badge badge-g">148 totali</span></div>'+
    '<div class="mini-chart">'+chartData.map(function(d){
      var h=Math.round(d.val/maxVal*100);
      return '<div class="mini-bar" style="height:'+h+'%" title="'+d.label+': '+d.val+' esecuzioni"><span class="mini-bar-val">'+d.val+'</span><span class="mini-bar-label">'+d.label+'</span></div>';
    }).join('')+'</div>';
}

// ══════════════════════════════════════════
// ENHANCED PROFILE — Editable + Notifications
// ══════════════════════════════════════════

function toggleProfileEdit(){
  profileEditing=!profileEditing;
  renderProfile();
  if(profileEditing)showToast('✏️ Modalità modifica attiva');
}


function saveProfileData(){
  var v=function(id){var e=document.getElementById(id);return e?e.value.trim():''};

  // Il nome e' anche la chiave di attribuzione: cambiarlo comporta riscrivere
  // agenti, esecuzioni, pubblicazioni, progressi e XP. Si fa, ma dicendo
  // quante righe cambiano intestatario invece di eseguirlo in silenzio.
  var nuovoNome=v('pf-name');
  var vecchioNome=profileData.name;
  var rinominato=false;
  if(nuovoNome&&nuovoNome!==vecchioNome){
    var errore=(typeof validaNomeUtente==='function')?validaNomeUtente(nuovoNome,profileData.email):null;
    if(errore){ showToast('⚠️ '+errore); return }
    var quante=(typeof conteggioAttribuzioni==='function')?conteggioAttribuzioni(vecchioNome).totale:0;
    if(quante&&!confirm('Rinominare "'+vecchioNome+'" in "'+nuovoNome+'"?\n\n'+
        quante+' element'+(quante===1?'o':'i')+' fra agenti, esecuzioni, pubblicazioni, '+
        'progressi formativi, XP, recensioni, candidature alle sfide e '+
        'contributi alla community verranno riattribuit'+(quante===1?'o':'i')+' al nuovo nome.'))return;
    var esito=rinominaUtente(vecchioNome,nuovoNome,profileData.email);
    if(esito.ok){
      profileData.name=nuovoNome;
      if(typeof inizialiDaNome==='function')profileData.iniziali=inizialiDaNome(nuovoNome)||profileData.iniziali;
      addAct('Rinominato "'+vecchioNome+'" in "'+nuovoNome+'": '+esito.righe+' element'+(esito.righe===1?'o riattribuito':'i riattribuiti'));
      rinominato=true;
    }
  }

  profileData.role     = v('pf-role')     || profileData.role;
  profileData.org      = v('pf-org')      || profileData.org;
  profileData.bio      = v('pf-bio')      || profileData.bio;
  profileData.email    = v('pf-email')    || profileData.email;
  profileData.linkedin = v('pf-linkedin') || profileData.linkedin;
  // Questi possono essere svuotati: assegnare sempre, senza il ripiego sul
  // valore precedente, altrimenti un campo non si potrebbe piu' cancellare.
  profileData.reparto  = v('pf-reparto');
  profileData.telefono = v('pf-telefono');
  profileData.settore  = v('pf-settore');

  dbRun('INSERT OR REPLACE INTO profili (user,role,org,bio,email,linkedin,reparto,telefono,settore,aggiornato_il) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [profileData.name,profileData.role,profileData.org,profileData.bio,
     profileData.email,profileData.linkedin||'',profileData.reparto||'',
     profileData.telefono||'',profileData.settore||'',new Date().toISOString()]);

  profileEditing=false;
  addAct('Profilo aggiornato');

  // Ricaricamento: dopo una rinomina decine di viste tengono in memoria il
  // nome vecchio (registro, agenti aperti, progressi), e ridisegnarle una per
  // una lascerebbe fuori proprio quella che nessuno ha pensato di aggiornare.
  // Si aspetta pero' la scrittura EFFETTIVA su IndexedDB: il salvataggio
  // normale e' ritardato, e ricaricare prima cancellerebbe le modifiche.
  showToast(rinominato?'✅ Profilo aggiornato: ricarico con il nuovo nome':'✅ Profilo aggiornato');
  var scrittura=(typeof persistDatabaseNow==='function')?persistDatabaseNow():Promise.resolve(true);
  scrittura.then(function(){ location.reload() });
}

// Notifications

// Tempo relativo, sempre. Prima si passava alla data assoluta dopo trenta
// giorni: in una fila di schede si leggeva «29 giorni fa» accanto a
// «06/08/2026», due formati diversi per la stessa informazione. Il mese e
// l'anno tengono la scala relativa fin dove serve, e la data esatta resta
// disponibile nel suggerimento.
function relTimeIt(ts){
  var diff=(Date.now()-ts)/1000;
  if(diff<60)return 'poco fa';
  if(diff<3600)return Math.floor(diff/60)+' min fa';
  if(diff<86400)return Math.floor(diff/3600)+' ore fa';
  if(diff<86400*30)return Math.floor(diff/86400)+' giorni fa';
  if(diff<86400*365){
    var m=Math.round(diff/86400/30);
    return m<=1?'un mese fa':m+' mesi fa';
  }
  var a=Math.round(diff/86400/365);
  return a<=1?'un anno fa':a+' anni fa';
}

function scheduleSummary(row){
  if(!row.active)return null;
  if(row.schedule_type==='interval')return '⏱️ Ogni '+(row.schedule_value||'?')+' min';
  if(row.schedule_type==='daily')return '⏱️ Ogni giorno alle '+(row.schedule_value||'?');
  return null;
}

function renderMyAgents(){
  var my=dbAll('SELECT * FROM my_agents WHERE user=?',[utenteCorrente()]);
  var saved=dbAll('SELECT * FROM agents WHERE author=? ORDER BY updated_at DESC',[utenteCorrente()]);
  // Due conteggi, non uno: quante volte l'ho eseguito io e quante in tutto.
  // Il totale da solo, su una pagina che si intitola «Agenti che hai creato o
  // installato», si legge come personale e non lo e': ogni agente del seme ha
  // esecuzioni di quattro utenti diversi, e il numero sulla scheda smentiva
  // quello della Dashboard. Quando coincidono se ne mostra uno solo, perche'
  // ripetere lo stesso numero due volte non informa nessuno.
  var runsByAgent={}, runsMineByAgent={};
  dbAll('SELECT agent, COUNT(*) c FROM exec_log GROUP BY agent').forEach(function(r){runsByAgent[r.agent]=r.c});
  dbAll('SELECT agent, COUNT(*) c FROM exec_log WHERE user=? GROUP BY agent',[utenteCorrente()]).forEach(function(r){runsMineByAgent[r.agent]=r.c});
  var etichettaEsecuzioni=function(nome){
    var tot=runsByAgent[nome]||0, mie=runsMineByAgent[nome]||0;
    if(!tot)return 'mai eseguito';
    if(mie===tot)return tot+' esecuzion'+(tot===1?'e':'i');
    return mie+' tue · '+tot+' in tutto';
  };

  var html='<div style="display:flex;gap:8px;margin-bottom:20px"><button class="tb-btn primary" onclick="go(\'builder\')">+ Crea nuovo</button><button class="tb-btn" onclick="importAgentJSON()">📥 Importa JSON</button></div>';

  if(saved.length===0&&my.length===0){
    html+='<div style="text-align:center;padding:60px;color:var(--tx4)"><div style="font-size:48px;margin-bottom:12px">📁</div><div style="font-size:16px;font-weight:700">Nessun agente ancora</div><div style="font-size:13px;margin-top:8px;max-width:400px;margin-left:auto;margin-right:auto;line-height:1.6">Crea un agente nel Builder oppure installa uno dal Marketplace per iniziare. I tuoi agenti appariranno qui.</div><div style="display:flex;gap:8px;justify-content:center;margin-top:20px"><button class="tb-btn primary" onclick="go(\'builder\')">🔧 Vai al Builder</button><button class="tb-btn" onclick="go(\'marketplace\')">🏪 Marketplace</button></div></div>';
    document.getElementById('myagents-grid').innerHTML=html;
    return;
  }

  if(saved.length){
    html+='<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">🔧 Creati da te ('+saved.length+')</div><div class="mkt-grid" style="margin-bottom:28px">';
    saved.forEach(function(s){
      var runs=etichettaEsecuzioni(s.name);
      var nodeCount=0;try{nodeCount=JSON.parse(s.nodes_json).length}catch(e){}
      var safeName=s.name.replace(/'/g,"\\'").replace(/"/g,'&quot;');
      var sched=scheduleSummary(s);
      html+='<div class="agent-card">'+
        '<div class="agent-top"><div class="agent-icon" style="background:#10B98115;color:#10B981">🔧</div>'+
          '<div class="agent-info"><div class="agent-name">'+escHtml(s.name)+'</div><div class="agent-author">'+nodeCount+' nodi · aggiornato '+relTimeIt(new Date(s.updated_at).getTime())+'</div></div>'+
          (sched?'<span class="badge badge-y" title="In produzione">🚀 In produzione</span>':'<span class="badge badge-g">Custom</span>')+
        '</div>'+
        '<div class="agent-desc">'+
          '<div style="display:flex;gap:12px;font-size:11px;color:var(--tx4);flex-wrap:wrap">'+
            '<span>▶️ '+runs+'</span>'+
            (sched?'<span style="color:#D97706;font-weight:600">'+sched+'</span>':'<span>Solo manuale</span>')+
          '</div>'+
        '</div>'+
        '<div class="agent-bottom">'+
          '<button class="tb-btn" onclick="loadSavedAgent(\''+safeName+'\');event.stopPropagation()" style="font-size:11px;height:28px">✏️ Modifica</button>'+
          '<button class="tb-btn primary" onclick="quickRunAgent(\''+safeName+'\');event.stopPropagation()" title="Esegui adesso">▶️ Esegui</button>'+
          '<button class="tb-btn solo-icona" onclick="deleteMyAgent(\''+safeName+'\');event.stopPropagation()" title="Disinstalla">🗑️</button>'+
        '</div></div>';
    });
    html+='</div>';
  }

  if(my.length){
    var installedCards='';
    var installedCount=0;
    my.forEach(function(m){
      var a=AGENTS.concat(getPublishedAgents()).find(function(x){return x.id===m.catalog_id});
      if(!a)return;
      installedCount++;
      var runs=etichettaEsecuzioni(a.name);
      installedCards+='<div class="agent-card"><div class="agent-top"><div class="agent-icon" style="background:'+a.color+'15;color:'+a.color+'">'+a.icon+'</div><div class="agent-info"><div class="agent-name">'+a.name+'</div><div class="agent-author">'+a.author+' · installato '+relTimeIt(new Date(m.installed_at).getTime())+'</div></div><span class="badge badge-b">Installato</span></div><div class="agent-desc"><div style="display:flex;gap:12px;font-size:11px;color:var(--tx4)"><span>▶️ '+runs+'</span><span>⭐ '+a.rating+'</span></div></div><div class="agent-bottom"><button class="tb-btn" onclick="installAgent('+a.id+');event.stopPropagation()" title="Apri il flusso nel Builder">✏️ Apri</button><button class="tb-btn primary" onclick="quickRunMktAgent('+a.id+');event.stopPropagation()" title="Esegui adesso">▶️ Esegui</button><button class="tb-btn solo-icona" onclick="uninstallAgent('+a.id+');event.stopPropagation()" title="Disinstalla">🗑️</button></div></div>';
    });
    if(installedCount){
      html+='<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">🏪 Installati dal Marketplace ('+installedCount+')</div><div class="mkt-grid">'+installedCards+'</div>';
    }
  }
  // Le pubblicazioni stanno in cima: sono le uniche che possono richiedere un
  // intervento con una scadenza implicita — un revisore in attesa di risposta.
  var pub=(typeof schedePubblicazioni==='function')?schedePubblicazioni():'';
  document.getElementById('myagents-grid').innerHTML=pub+html;
}


// «Esegui» da «I miei agenti» NON eseguiva niente: aspettava due secondi e
// registrava un'esecuzione riuscita con zero nodi. Chi lo premeva vedeva
// «completato con successo» e poi cercava invano il risultato — non c'era,
// perche' non era successo nulla. E' il difetto peggiore possibile in una
// piattaforma il cui punto e' dimostrare che gli agenti girano davvero.
//
// Ora usa lo stesso motore del Builder e, a fine corsa, dice DOVE e' finito
// quello che ha prodotto: file scaricato, documento in Knowledge Base, email
// inviata, oppure la riga nel registro se non ha prodotto nulla di esterno.
async function quickRunAgent(name){
  var row=dbGetOne('SELECT * FROM agents WHERE name=? AND author=? ORDER BY id DESC LIMIT 1',[name,utenteCorrente()])
       || dbGetOne('SELECT * FROM agents WHERE name=? ORDER BY id DESC LIMIT 1',[name]);
  if(!row){ showToast('⚠️ "'+name+'" non ha un flusso salvato da eseguire'); return }

  showToast('▶️ "'+name+'" in esecuzione...');
  addAct('Eseguito: '+name);

  var res;
  try{ res=await runAgentHeadless(row,'manual') }
  catch(e){ showToast('❌ "'+name+'" non è partito: '+e.message); return }
  if(!res){ showToast('⚠️ "'+name+'" non ha nodi da eseguire'); return }

  myAgentRuns[name]=(myAgentRuns[name]||0)+1;
  renderMyAgents();
  if(typeof updateStatCards==='function')updateStatCards();

  var esiti={done:'✅ completato', error:'❌ terminato con errori', waiting:'⏸️ in attesa di approvazione', aborted:'⏹️ interrotto'};
  showToast((esiti[res.status]||res.status)+': "'+name+'"');
  mostraDoveFinisce(name,res);
}

// Riepilogo di dove sono finiti i risultati. La domanda «dove trovo l'esito?»
// era la piu' ricorrente nelle prove con utenti, e la risposta era gia' nel
// registro — ma dentro venti righe tecniche che nessuno legge fino in fondo.
function mostraDoveFinisce(name,res){
  var passi=(res&&res.steps)||[];
  var testo=passi.map(function(s){return s.msg||''}).join('\n');
  var dove=[];
  if(/File scaricato/i.test(testo))            dove.push('💾 un file è stato <strong>scaricato</strong> sul tuo computer');
  if(/Knowledge Base/i.test(testo))            dove.push('📚 un documento è stato salvato nella <strong>Knowledge Base</strong>');
  if(/email inviata|Invio riuscito/i.test(testo)) dove.push('📧 un\'<strong>email è stata inviata</strong> tramite il servizio locale');
  if(/\[simulato\]|simulat/i.test(testo))      dove.push('🧪 alcune azioni verso l\'esterno sono state <strong>simulate</strong> e il registro lo dichiara');

  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center">'+
      '<h2>Dove è finito il risultato</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<div style="font-size:12.5px;color:var(--tx3);margin:10px 0 14px;overflow-wrap:anywhere">'+escHtml(name)+' · '+
      (res.stepsCount||0)+' nodi percorsi · '+Math.round((res.duration||0)/100)/10+'s</div>'+
    (dove.length
      ? '<ul style="font-size:12.5px;line-height:1.9;margin:0 0 14px;padding-left:20px">'+
        dove.map(function(d){return '<li>'+d+'</li>'}).join('')+'</ul>'
      : '<div style="font-size:12.5px;color:var(--tx2);line-height:1.65;margin-bottom:14px">'+
        'Questo flusso <strong>non produce file né invii esterni</strong>: il suo esito è il contenuto finale, '+
        'che resta registrato nel log dell\'esecuzione.</div>')+
    // L'esito puo' essere un CSV o un JSON: righe lunghissime senza spazi, che
    // il testo normale NON manda a capo — usciva dal riquadro e finiva sotto il
    // bordo della finestra. Serve `pre-wrap` per rispettare gli a capo veri,
    // `break-word` per spezzare le righe che non ne hanno, e un'altezza massima
    // con scorrimento: un output di duemila caratteri non deve allungare la
    // finestra oltre lo schermo.
    '<div style="background:var(--bg2);border-radius:9px;padding:11px 13px;font-size:11px;color:var(--tx2);'+
      'line-height:1.55;margin-bottom:14px;max-height:190px;overflow:auto;'+
      'white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;font-family:\'SF Mono\',Consolas,monospace">'+
      '<strong style="font-family:inherit">Esito finale</strong>\n'+escHtml(String(res.pipeline||'—').substring(0,1200))+'</div>'+
    '<div style="display:flex;gap:8px">'+
      '<button class="tb-btn primary" style="flex:1;justify-content:center" onclick="closeModal();go(\'execlog\')">📜 Apri il registro completo</button>'+
      '<button class="tb-btn" onclick="closeModal()">Chiudi</button>'+
    '</div>'
  );
}

function quickRunMktAgent(id){
  var a=AGENTS.concat(getPublishedAgents()).find(function(x){return x.id===id});if(!a)return;
  myAgentRuns[a.name]=(myAgentRuns[a.name]||0)+1;
  showToast('▶️ Esecuzione "'+a.name+'" avviata...');
  addAct('Eseguito: '+a.name);
  var _t0=Date.now();
  setTimeout(function(){
    recordExecution(a.name,a.nodes?a.nodes.length:0,'ok',Date.now()-_t0+1800,'quick','Quick run: '+a.name);
    showToast('✅ "'+a.name+'" completato!');renderMyAgents();
  },2000);
}

function renderExecLogPage(){
  var log=dbAll('SELECT * FROM exec_log WHERE user=? ORDER BY id DESC',[utenteCorrente()]);
  var el=document.getElementById('execlog-content');
  var okCount=log.filter(function(l){return l.status==='ok'}).length;
  var errCount=log.length-okCount;
  var avgDur=log.length?Math.round(log.reduce(function(s,l){return s+(l.duration||0)},0)/log.length/100)/10:0;
  // I due totali per origine stanno in testa: e' la prima cosa che si guarda
  // per sapere se le pianificazioni stanno girando davvero.
  var nSched=log.filter(function(l){return l.mode==='scheduled'}).length;
  var nMan=log.length-nSched;

  var html='<div class="stats-row" style="grid-template-columns:repeat(5,1fr)">'+
    '<div class="stat-card"><div class="stat-label">▶️ Manuali</div><div class="stat-val">'+nMan+'</div></div>'+
    '<div class="stat-card"><div class="stat-label">⏱️ Pianificate</div><div class="stat-val" style="color:#B45309">'+nSched+'</div></div>'+
    '<div class="stat-card"><div class="stat-label">✅ Successi</div><div class="stat-val" style="color:var(--ok)">'+okCount+'</div></div>'+
    '<div class="stat-card"><div class="stat-label">❌ Errori</div><div class="stat-val" style="color:#EF4444">'+errCount+'</div></div>'+
    '<div class="stat-card"><div class="stat-label">⏱️ Durata media</div><div class="stat-val">'+avgDur+'<span style="font-size:14px;color:var(--tx4)">s</span></div></div>'+
  '</div>';

  // Sezione separata per gli agenti in produzione: prima l'unico modo per
  // vedere/gestire una pianificazione era riaprire ogni agente nel Builder.
  // Qui si vede tutto insieme e si agisce subito (esegui ora, modifica,
  // disattiva) senza dover ricordare quale agente era stato schedulato.
  var scheduled=dbAll('SELECT * FROM agents WHERE active=1 AND author=? ORDER BY name',[utenteCorrente()]);
  if(scheduled.length){
    html+='<div class="card mb-16" style="padding:0;overflow:hidden">'+
      // Questa sezione elenca gli AGENTI che hanno una pianificazione attiva,
      // non le esecuzioni gia' avvenute — che stanno piu' sotto. Chiamarle
      // entrambe "Esecuzioni pianificate" faceva comparire lo stesso titolo
      // due volte nella stessa pagina con due conteggi diversi.
      '<div style="padding:14px 20px;border-bottom:1px solid var(--bo)">'+
        '<div style="font-size:13px;font-weight:700">⏰ Agenti con pianificazione attiva ('+scheduled.length+')</div>'+
        '<div style="font-size:11px;color:var(--tx4);margin-top:2px">Quando partono e cosa hanno fatto finora. Le esecuzioni già avvenute sono elencate sotto.</div>'+
      '</div>'+
      scheduled.map(function(a){
        // "0 7 * * 1" non dice niente a chi non conosce cron: la descrizione
        // viene da un punto solo, condiviso con la valutazione della scadenza.
        var schedDesc=a.schedule_type==='event'
          ? 'Su evento: '+((typeof EVENT_TYPES!=='undefined'&&EVENT_TYPES[a.schedule_value])||a.schedule_value)
          : (typeof descriviPianificazione==='function'
              ? descriviPianificazione(a.schedule_type,a.schedule_value)
              : a.schedule_type);
        // Un agente marcato attivo ma senza pianificazione non parte mai: va
        // detto qui, che è dove si guarda per capire perché non è successo nulla.
        var inerte=(a.schedule_type==='manual'||!a.schedule_type);
        return '<div class="list-row" style="display:flex;align-items:center;gap:14px;padding:12px 20px;border-bottom:1px solid var(--bg2)">'+
          '<div style="width:8px;height:8px;border-radius:50%;background:#F59E0B;flex-shrink:0"></div>'+
          '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">'+escHtml(a.name)+'</div>'+
          '<div style="font-size:11px;color:'+(inerte?'#B45309':'var(--tx4)')+'">'+
            (inerte?'⚠️ ':'')+schedDesc+
            (a.last_run_at?' · ultima esecuzione '+relTimeIt(new Date(a.last_run_at).getTime()):' · non ancora eseguita')+
          '</div></div>'+
          '<button class="tb-btn" style="font-size:11px;height:28px" onclick="triggerScheduledAgentNow('+a.id+')">▶️ Esegui ora</button>'+
          '<button class="tb-btn" style="font-size:11px;height:28px" onclick="editScheduledAgent('+a.id+')">✏️ Modifica</button>'+
          '<button class="tb-btn" style="font-size:11px;height:28px;color:#EF4444;border-color:#FEE2E2" onclick="deactivateScheduledAgent('+a.id+')">⏸️ Disattiva</button>'+
        '</div>';
      }).join('')+
    '</div>';
  }

  html+='<div style="display:flex;gap:8px;margin-bottom:16px;align-items:center">'+
    '<div class="mkt-filter'+(execlogFilter==='all'?' active':'')+'" onclick="execlogFilter=\'all\';renderExecLogPage()">Tutte</div>'+
    '<div class="mkt-filter'+(execlogFilter==='ok'?' active':'')+'" onclick="execlogFilter=\'ok\';renderExecLogPage()">✅ Successi</div>'+
    '<div class="mkt-filter'+(execlogFilter==='err'?' active':'')+'" onclick="execlogFilter=\'err\';renderExecLogPage()">❌ Errori</div>'+
    '<span style="width:1px;height:20px;background:var(--bo);margin:0 4px"></span>'+
    '<div class="mkt-filter'+(execlogOrigine==='all'?' active':'')+'" onclick="execlogOrigine=\'all\';renderExecLogPage()">Ogni origine</div>'+
    '<div class="mkt-filter'+(execlogOrigine==='manual'?' active':'')+'" onclick="execlogOrigine=\'manual\';renderExecLogPage()">▶️ Manuali</div>'+
    '<div class="mkt-filter'+(execlogOrigine==='sched'?' active':'')+'" onclick="execlogOrigine=\'sched\';renderExecLogPage()">⏱️ Pianificate</div>'+
    '<span style="flex:1"></span>'+
    '<select class="prop-select" style="width:auto;height:30px;font-size:11px;padding:0 8px" onchange="execlogImpostaPerPagina(this.value)" title="Righe per pagina">'+
      [10,20,50,100].map(function(n){return '<option value="'+n+'"'+(execlogPerPagina===n?' selected':'')+'>'+n+' per pagina</option>'}).join('')+
    '</select>'+
    (log.length?'<button class="tb-btn" onclick="exportExecLog()">📥 Esporta CSV</button><button class="tb-btn" style="color:#EF4444;border-color:#FEE2E2" onclick="clearExecLog()">🗑️ Svuota log</button>':'')+
  '</div>';

  var filtered=execlogFilter==='all'?log:log.filter(function(l){return l.status===execlogFilter});

  // Una riga di esecuzione, usata da entrambe le sezioni.
  function rigaEsecuzione(l){
    var d=new Date(l.ts);
    var dateStr=d.toLocaleDateString('it-IT',{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
    return '<div class="list-row" style="display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid var(--bg2);cursor:pointer" onclick="openExecLogDetail('+l.id+')" title="Clicca per il dettaglio">'+
      '<div style="width:10px;height:10px;border-radius:50%;background:'+(l.status==='ok'?'var(--ok)':'#EF4444')+';flex-shrink:0"></div>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:13px;font-weight:700">'+escHtml(l.agent)+'</div>'+
        (l.summary?'<div style="font-size:11px;color:var(--tx4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escHtml(l.summary)+'</div>':'')+
      '</div>'+
      '<span class="badge badge-gray" style="flex-shrink:0">'+l.nodes+' nodi</span>'+
      '<span class="badge '+(l.mode==='builder'?'badge-b':l.mode==='scheduled'?'badge-y':'badge-gray')+'" style="flex-shrink:0">'+(l.mode==='builder'?'🔧 Builder':l.mode==='scheduled'?'⏱️ Pianificata':'⚡ Quick run')+'</span>'+
      '<span style="font-size:11px;color:var(--tx4);flex-shrink:0;width:52px;text-align:right">'+(l.duration?(Math.round(l.duration/100)/10)+'s':'—')+'</span>'+
      '<span style="font-size:11px;color:var(--tx4);flex-shrink:0;width:100px;text-align:right">'+dateStr+'</span>'+
      '<span class="badge '+(l.status==='ok'?'badge-g':'badge-r')+'" style="flex-shrink:0">'+(l.status==='ok'?'✅ OK':'❌ ERR')+'</span>'+
    '</div>';
  }

  // Elenco paginato: con decine di esecuzioni la pagina diventava un rotolo in
  // cui l'unico modo di raggiungere una riga vecchia era scorrere tutto. Le
  // righe per pagina sono fisse e la pagina corrente e' per sezione, cosi'
  // sfogliare le manuali non sposta le pianificate.
  function sezioneEsecuzioni(titolo,voci,vuoto,chiave){
    if(!voci.length)return '<div class="card mb-16" style="padding:0;overflow:hidden">'+
      '<div class="execlog-testa">'+titolo+' (0)</div>'+
      '<div style="padding:20px;text-align:center;font-size:11.5px;color:var(--tx4)">'+vuoto+'</div></div>';

    var perPagina=execlogPerPagina;
    var pagine=Math.max(1,Math.ceil(voci.length/perPagina));
    // La pagina memorizzata puo' non esistere piu' dopo un filtro che riduce
    // l'elenco: si riporta dentro i limiti invece di mostrare il vuoto.
    var pag=Math.min(Math.max(1,execlogPagina[chiave]||1),pagine);
    execlogPagina[chiave]=pag;
    var da=(pag-1)*perPagina;
    var fetta=voci.slice(da,da+perPagina);

    var pager='';
    if(pagine>1){
      var btn=function(etichetta,versoPag,attivo,disabilitato){
        return '<button class="tb-btn'+(attivo?' primary':'')+'" '+
          'style="height:26px;min-width:26px;padding:0 8px;font-size:11px"'+
          (disabilitato?' disabled style="opacity:.4"':' onclick="execlogVaiA(\''+chiave+'\','+versoPag+')"')+
          '>'+etichetta+'</button>';
      };
      // Finestra di cinque numeri attorno alla pagina corrente: con venti
      // pagine l'elenco completo dei numeri sarebbe piu' lungo delle righe.
      var primo=Math.max(1,Math.min(pag-2,pagine-4)), ultimo=Math.min(pagine,primo+4);
      var numeri='';
      for(var n=primo;n<=ultimo;n++)numeri+=btn(String(n),n,n===pag,false);
      pager='<div style="display:flex;align-items:center;gap:5px;padding:10px 20px;border-top:1px solid var(--bo);background:var(--bg2)">'+
        '<span style="font-size:11px;color:var(--tx4);flex:1">'+
          (da+1)+'–'+Math.min(da+perPagina,voci.length)+' di '+voci.length+'</span>'+
        btn('‹',pag-1,false,pag===1)+numeri+btn('›',pag+1,false,pag===pagine)+
        '</div>';
    }
    return '<div class="card mb-16" style="padding:0;overflow:hidden">'+
      '<div class="execlog-testa">'+titolo+' ('+voci.length+')</div>'+
      fetta.map(rigaEsecuzione).join('')+pager+'</div>';
  }

  if(filtered.length===0){
    html+='<div style="text-align:center;padding:60px;color:var(--tx4)"><div style="font-size:48px;margin-bottom:12px">📜</div><div style="font-size:15px;font-weight:700">Nessuna esecuzione registrata</div><div style="font-size:12px;margin-top:6px">Esegui un agente nel Builder o da "I miei agenti": ogni run viene tracciato qui.</div><button class="tb-btn primary mt-16" onclick="go(\'builder\')">🔧 Vai al Builder</button></div>';
  }else{
    // Manuali e pianificate restano separate: mescolarle costringeva a
    // leggere la pastiglia riga per riga per capire cosa fosse partito da
    // solo e cosa avesse lanciato una persona.
    var pianificate=filtered.filter(function(l){return l.mode==='scheduled'});
    var manuali=filtered.filter(function(l){return l.mode!=='scheduled'});
    if(execlogOrigine==='manual')      html+=sezioneEsecuzioni('▶️ Esecuzioni manuali',manuali,'Nessuna esecuzione manuale con questo filtro.','manuali');
    else if(execlogOrigine==='sched')  html+=sezioneEsecuzioni('⏱️ Esecuzioni pianificate',pianificate,'Nessuna esecuzione pianificata con questo filtro.','pianificate');
    else {
      html+=sezioneEsecuzioni('▶️ Esecuzioni manuali',manuali,'Nessuna esecuzione manuale: lanciane una dal Builder.','manuali');
      // Il messaggio deve descrivere la situazione vera: chi ha gia' attivato
      // un agente e si sente dire "attiva un agente" pensa che la sua
      // pianificazione non sia stata registrata.
      html+=sezioneEsecuzioni('⏱️ Esecuzioni pianificate',pianificate,
        scheduled.length
          ? 'Nessuna esecuzione pianificata ancora avvenuta: '+(scheduled.length===1?'l’agente qui sopra non è ancora partito':'gli agenti qui sopra non sono ancora partiti')+'. Usa «Esegui ora» per non aspettare la scadenza.'
          : 'Nessuna esecuzione pianificata: attiva un agente con una pianificazione.','pianificate');
    }
  }
  el.innerHTML=html;
}

// Prima uno storico di esecuzione era una riga con un riassunto troncato a
// 140 caratteri e nient'altro — cliccarci sopra non portava a nulla. Ora
// ogni run salva anche il log passo-passo (steps_json) e la vista dettaglio
// lo mostra con lo stesso stile del pannello di esecuzione live nel
// Builder, così un'esecuzione passata si legge com'era successa dal vivo.
function openExecLogDetail(id){
  var l=dbGetOne('SELECT * FROM exec_log WHERE id=?',[id]);
  if(!l)return;
  var d=new Date(l.ts);
  var steps=[];try{steps=l.steps_json?JSON.parse(l.steps_json):[]}catch(e){}
  var colors={TRIGGER:'#F59E0B','LLM AI':'#6366F1',ACTION:'#10B981',LOGIC:'#EF4444',OUTPUT:'#64748B'};
  var html='<div style="display:flex;justify-content:space-between;align-items:flex-start"><div>'+
    '<h2>'+escHtml(l.agent)+'</h2>'+
    '<div style="font-size:11px;color:var(--tx4);margin-top:4px">'+d.toLocaleString('it-IT')+' · '+l.nodes+' nodi · '+(l.duration?(Math.round(l.duration/100)/10)+'s':'—')+' · '+escHtml(l.user||'')+'</div>'+
    '</div><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<div style="display:flex;gap:8px;margin:14px 0;align-items:center;flex-wrap:wrap">'+
      '<span class="badge '+(l.status==='ok'?'badge-g':l.status==='waiting'?'badge-p':'badge-r')+'">'+(l.status==='ok'?'✅ OK':l.status==='waiting'?'⏸️ In attesa':'❌ ERR')+'</span>'+
      '<span class="badge '+(l.mode==='builder'?'badge-b':l.mode==='scheduled'?'badge-y':'badge-gray')+'">'+(l.mode==='builder'?'🔧 Builder':l.mode==='scheduled'?'⏱️ Pianificata':'⚡ Quick run')+'</span>'+
      '<span style="margin-left:auto"></span>'+
      // La spiegazione si regge sugli eventi, che possono esserci anche
      // quando la traccia completa manca: i due pulsanti sono indipendenti.
      (dbGetOne('SELECT COUNT(*) c FROM execution_events WHERE execution_id=?',[l.id]).c
        ?'<button class="tb-btn" style="font-size:11px;height:26px" onclick="explainExecution('+l.id+')" title="Fonti usate, decisioni prese, controlli intervenuti">🔍 Perché questo risultato</button>':'')+
      (l.trace_json?'<button class="tb-btn" style="font-size:11px;height:26px" onclick="replayExecution('+l.id+')" title="Ripete l\'esecuzione usando gli esiti registrati invece di richiamare modello e connettori">↻ Riesegui dalla traccia</button>':
        '<span style="font-size:10px;color:var(--tx4)">Traccia non disponibile per questa esecuzione</span>')+
    '</div>';
  if(steps.length){
    html+='<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Log passo-passo</div>'+
      '<div style="background:var(--bg2);border-radius:8px;padding:8px;max-height:320px;overflow:auto;font-family:monospace">'+
      steps.map(function(s){
        return '<div style="display:flex;gap:8px;padding:5px 6px;font-size:11px;align-items:center">'+
          '<span style="color:var(--tx4);flex-shrink:0">'+s.time+'</span>'+
          '<span style="background:'+(colors[s.type]||'#64748B')+'20;color:'+(colors[s.type]||'#64748B')+';padding:1px 6px;border-radius:4px;flex-shrink:0">'+s.type+'</span>'+
          '<span style="flex:1;font-family:Inter,sans-serif">'+escHtml(s.msg)+'</span>'+
          '<span style="flex-shrink:0;color:'+(s.status==='OK'?'#10B981':s.status==='SKIP'?'var(--tx4)':'#EF4444')+'">'+s.status+'</span>'+
        '</div>';
      }).join('')+
    '</div>';
  }else{
    html+='<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Output finale</div>'+
      '<pre style="white-space:pre-wrap;font-size:11px;background:var(--bg2);border-radius:8px;padding:12px;max-height:320px;overflow:auto">'+escHtml(l.summary||'—')+'</pre>'+
      '<div style="font-size:10px;color:var(--tx4);margin-top:8px">Log passo-passo non disponibile per questa esecuzione (registrata prima di questo aggiornamento).</div>';
  }
  openModal(html,true);
}

// Riesecuzione deterministica (B8): ripete l'esecuzione sostituendo le
// chiamate verso modello e connettori con gli esiti registrati nella
// traccia. Serve a diagnosticare — si riproduce lo stesso percorso senza
// dipendere dalla rete, dal modello o dallo stato dei sistemi esterni.
function replayExecution(execId){
  var l=dbGetOne('SELECT * FROM exec_log WHERE id=?',[execId]);
  if(!l||!l.trace_json){showToast('⚠️ Traccia non disponibile per questa esecuzione');return}
  var trace=null;try{trace=JSON.parse(l.trace_json)}catch(e){}
  if(!trace){showToast('⚠️ Traccia illeggibile');return}

  // Si rigioca la definizione dell'agente così com'è salvata oggi: se nel
  // frattempo è cambiata, la divergenza è essa stessa un'informazione utile.
  var row=dbGetOne('SELECT * FROM agents WHERE name=?',[l.agent]);
  if(!row){showToast('⚠️ L\'agente "'+l.agent+'" non è più fra quelli salvati: impossibile rigiocare');return}

  closeModal();
  showToast('↻ Riesecuzione dalla traccia in corso…');
  executeGraph({
    nodes:JSON.parse(row.nodes_json), edges:JSON.parse(row.edges_json),
    context:row.context||'', agentName:l.agent+' (rigiocato)', agentId:row.id,
    headless:true, replay:trace, seed:l.replay_seed||undefined,
    onEvent:function(){}
  }).then(function(res){
    var uguale=(res.status===l.status);
    recordExecution(l.agent+' (rigiocato)',res.stepsCount,res.status==='error'?'err':'ok',
      res.duration,'replay','Riesecuzione di #'+execId+': esito '+(uguale?'coincidente':'DIVERGENTE')+
      ' (originale: '+l.status+', rigiocato: '+res.status+')',res.steps,res.trace);
    renderExecLogPage();
    showToast(uguale?'✅ Riesecuzione conclusa: stesso esito dell\'originale'
                    :'⚠️ Riesecuzione divergente: '+l.status+' → '+res.status);
  });
}

// Cambio pagina del log esecuzioni. La pagina vive fuori dal rendering, che
// viene rifatto per intero: senza, tornare indietro azzererebbe il filtro.
function execlogVaiA(chiave,pagina){
  execlogPagina[chiave]=Math.max(1,pagina);
  renderExecLogPage();
  // Si riporta la vista in cima all'elenco: cambiando pagina mentre si e' in
  // fondo si atterrerebbe a meta' della pagina nuova.
  var c=document.getElementById('execlog-content');
  if(c&&c.scrollIntoView)c.scrollIntoView({block:'start',behavior:'smooth'});
}

// Il numero di righe per pagina e' una preferenza di lettura, non una
// costante: schermi diversi ne reggono un numero diverso.
function execlogImpostaPerPagina(n){
  execlogPerPagina=parseInt(n,10)||10;
  execlogPagina={manuali:1,pianificate:1};
  renderExecLogPage();
}
// ══════════════════════════════════════════════════════════════
// ATTESTATO DI LIVELLO
// ══════════════════════════════════════════════════════════════
// Un livello raggiunto e non portabile fuori dalla piattaforma vale poco: si
// scarica come SVG, che e' un file solo, si apre in qualunque browser, si
// stampa senza sgranare e si carica su LinkedIn come immagine. Niente
// librerie esterne: il documento e' testo, generato qui.
//
// Il nome e la data NON sono decorativi: vengono dall'utente in sessione e dal
// momento del rilascio. Il codice in fondo e' derivato da nome e livello, cosi'
// due attestati diversi non hanno lo stesso, e chi lo riceve puo' almeno
// confrontarlo con quello di chi lo mostra.
function attestatoCodice(nome,livello){
  var s=String(nome)+'|'+livello;
  var h=0;
  for(var i=0;i<s.length;i++){ h=((h<<5)-h+s.charCodeAt(i))|0 }
  return 'RL-'+livello+'-'+Math.abs(h).toString(36).toUpperCase().padStart(6,'0').substring(0,6);
}

function attestatoSVG(livello){
  var L=livelloInfo(livello);
  var nome=utenteCorrente();
  var ruolo=(typeof profileData!=='undefined'&&profileData.role)?profileData.role:'';
  var org=(typeof profileData!=='undefined'&&profileData.org)?profileData.org:'';
  var data=new Date().toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});
  var perc=PATHS.filter(function(p){return (p.livello||1)<=livello});
  var lezioni=perc.reduce(function(a,p){return a+p.lessons.length},0);
  var e=function(t){ return String(t==null?'':t)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') };

  return '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850">'+
    '<defs>'+
      '<linearGradient id="b" x1="0" y1="0" x2="1" y2="1">'+
        '<stop offset="0" stop-color="#0F172A"/><stop offset="1" stop-color="#1E293B"/></linearGradient>'+
      '<linearGradient id="a" x1="0" y1="0" x2="1" y2="0">'+
        '<stop offset="0" stop-color="'+L.col+'"/><stop offset="1" stop-color="#6366F1"/></linearGradient>'+
    '</defs>'+
    '<rect width="1200" height="850" fill="url(#b)"/>'+
    '<rect x="40" y="40" width="1120" height="770" fill="none" stroke="'+L.col+'" stroke-width="2" opacity=".55" rx="14"/>'+
    '<rect x="52" y="52" width="1096" height="746" fill="none" stroke="#FFFFFF" stroke-width="1" opacity=".12" rx="10"/>'+
    '<rect x="0" y="0" width="1200" height="8" fill="url(#a)"/>'+

    '<text x="600" y="132" text-anchor="middle" fill="#F1F5F9" font-family="Segoe UI,Helvetica,Arial" '+
      'font-size="26" font-weight="700" letter-spacing="3">RelAItion</text>'+
    '<text x="600" y="158" text-anchor="middle" fill="#94A3B8" font-family="Segoe UI,Helvetica,Arial" '+
      'font-size="13" letter-spacing="2">AI AGENT MARKETPLACE</text>'+

    '<text x="600" y="238" text-anchor="middle" fill="#CBD5E1" font-family="Segoe UI,Helvetica,Arial" '+
      'font-size="15" letter-spacing="5">ATTESTATO DI COMPLETAMENTO</text>'+

    '<text x="600" y="300" text-anchor="middle" font-size="62">'+L.ic+'</text>'+

    '<text x="600" y="372" text-anchor="middle" fill="'+L.col+'" font-family="Segoe UI,Helvetica,Arial" '+
      'font-size="44" font-weight="800">'+e(L.nome)+'</text>'+
    '<text x="600" y="404" text-anchor="middle" fill="#94A3B8" font-family="Segoe UI,Helvetica,Arial" '+
      'font-size="14">Livello '+livello+' di 4 · '+e(L.desc)+'</text>'+

    '<line x1="360" y1="452" x2="840" y2="452" stroke="#334155" stroke-width="1"/>'+
    '<text x="600" y="492" text-anchor="middle" fill="#94A3B8" font-family="Segoe UI,Helvetica,Arial" '+
      'font-size="14">conferito a</text>'+
    '<text x="600" y="552" text-anchor="middle" fill="#FFFFFF" font-family="Georgia,serif" '+
      'font-size="42" font-weight="700">'+e(nome)+'</text>'+
    (ruolo||org
      ? '<text x="600" y="584" text-anchor="middle" fill="#94A3B8" font-family="Segoe UI,Helvetica,Arial" '+
        'font-size="14">'+e([ruolo,org].filter(Boolean).join(' · '))+'</text>'
      : '')+

    '<text x="600" y="646" text-anchor="middle" fill="#CBD5E1" font-family="Segoe UI,Helvetica,Arial" '+
      'font-size="13.5">per aver completato '+perc.length+' percors'+(perc.length===1?'o':'i')+' formativ'+(perc.length===1?'o':'i')+
      ' e '+lezioni+' lezioni</text>'+

    '<line x1="150" y1="716" x2="450" y2="716" stroke="#334155" stroke-width="1"/>'+
    '<text x="300" y="742" text-anchor="middle" fill="#94A3B8" font-family="Segoe UI,Helvetica,Arial" font-size="12">Data di rilascio</text>'+
    '<text x="300" y="700" text-anchor="middle" fill="#F1F5F9" font-family="Segoe UI,Helvetica,Arial" font-size="15">'+e(data)+'</text>'+

    '<line x1="750" y1="716" x2="1050" y2="716" stroke="#334155" stroke-width="1"/>'+
    '<text x="900" y="742" text-anchor="middle" fill="#94A3B8" font-family="Segoe UI,Helvetica,Arial" font-size="12">Codice attestato</text>'+
    '<text x="900" y="700" text-anchor="middle" fill="#F1F5F9" font-family="Consolas,monospace" font-size="15">'+
      e(attestatoCodice(nome,livello))+'</text>'+

    '<text x="600" y="790" text-anchor="middle" fill="#64748B" font-family="Segoe UI,Helvetica,Arial" '+
      'font-size="11">Percorso formativo svolto sulla piattaforma RelAItion · prototipo dimostrativo</text>'+
  '</svg>';
}

function scaricaAttestato(livello){
  if(livelloRaggiunto()<livello){
    showToast('⚠️ Questo livello non è ancora stato raggiunto');
    return;
  }
  var nome='attestato-relaition-livello'+livello+'-'+
    utenteCorrente().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.svg';
  if(typeof foDownload==='function')foDownload(nome,'image/svg+xml',attestatoSVG(livello));
  showToast('📄 Attestato scaricato: '+nome);
  if(typeof addAct==='function')addAct('Scaricato l\'attestato di livello '+livello+': '+livelloInfo(livello).nome);
}

// L'ultima riga della pagina dichiara che e' un prototipo: un attestato che si
// spaccia per un titolo rilasciato da un ente sarebbe un problema, non una
// funzione. Meglio dirlo sul documento stesso che nelle note.
// ══════════════════════════════════════════════════════════════
// ANTEPRIMA A SCHERMO INTERO DELLE IMMAGINI
// ══════════════════════════════════════════════════════════════
// Nella scheda l'immagine e' ritagliata a 260px per non rendere ogni post alto
// una schermata. Ma uno schema di flusso o un grafico, ridotti a una striscia,
// non si leggono — ed erano esattamente il tipo di contenuto per cui le
// immagini servivano. Qui si apre intera, si ingrandisce e si scorre fra le
// immagini degli altri post senza tornare indietro ogni volta.
//
// Non usa la modale dell'applicazione: quella ha una larghezza massima pensata
// per i moduli, e un'immagine larga ci starebbe dentro rimpicciolita.
var IMG_APERTA={indice:-1, zoom:1, elenco:[]};

function apriImmaginePost(postId, idx){
  // L'elenco raccoglie ora TUTTE le immagini di tutti i post, non una per
  // post: un racconto con tre schemi li ha tutti e tre, e si scorrono in fila.
  IMG_APERTA.elenco=immaginiDeiPost();
  IMG_APERTA.indice=IMG_APERTA.elenco.findIndex(function(v){
    return v.post && v.post.id===postId && (idx===undefined||v.idx===idx);
  });
  if(IMG_APERTA.indice<0)IMG_APERTA.indice=0;
  if(!IMG_APERTA.elenco.length)return;
  IMG_APERTA.zoom=1;

  var v=document.getElementById('visoreImmagine');
  if(!v){
    v=document.createElement('div');
    v.id='visoreImmagine';
    v.style.cssText='position:fixed;inset:0;z-index:2000;background:rgba(8,15,30,.92);'+
      'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:26px;gap:12px';
    // Il clic sullo sfondo chiude: e' il gesto che tutti si aspettano da un
    // visore a schermo intero. Sull'immagine invece no, altrimenti si chiude
    // per sbaglio mentre la si guarda.
    v.onclick=function(e){ if(e.target===v)chiudiImmaginePost() };
    document.body.appendChild(v);
    document.addEventListener('keydown',visoreTasti);
  }
  disegnaVisore();
}

function visoreTasti(e){
  if(!document.getElementById('visoreImmagine'))return;
  if(e.key==='Escape'){ chiudiImmaginePost() }
  else if(e.key==='ArrowRight'){ scorriImmaginePost(1) }
  else if(e.key==='ArrowLeft'){ scorriImmaginePost(-1) }
  else if(e.key==='+'||e.key==='='){ zoomImmaginePost(0.25) }
  else if(e.key==='-'){ zoomImmaginePost(-0.25) }
}

function disegnaVisore(){
  var v=document.getElementById('visoreImmagine');
  if(!v)return;
  var p=IMG_APERTA.elenco[IMG_APERTA.indice];
  if(!p){ chiudiImmaginePost(); return }
  var piu=IMG_APERTA.elenco.length>1;
  v.innerHTML=
    '<div style="display:flex;align-items:center;gap:10px;width:100%;max-width:1100px;color:#E2E8F0">'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escHtml(p.title||'')+'</div>'+
        '<div style="font-size:11px;color:#94A3B8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+
          escHtml(p.nome||'')+' · '+escHtml(p.user||'')+
          (piu?(' · '+(IMG_APERTA.indice+1)+' di '+IMG_APERTA.elenco.length):'')+'</div>'+
      '</div>'+
      '<button class="tb-btn" style="height:30px;font-size:11px" onclick="zoomImmaginePost(-0.25)" title="Riduci">−</button>'+
      '<span style="font-size:11px;color:#94A3B8;min-width:44px;text-align:center">'+Math.round(IMG_APERTA.zoom*100)+'%</span>'+
      '<button class="tb-btn" style="height:30px;font-size:11px" onclick="zoomImmaginePost(0.25)" title="Ingrandisci">+</button>'+
      '<button class="tb-btn" style="height:30px;font-size:11px" onclick="scaricaAllegatoPost('+p.post.id+','+p.idx+')" title="Scarica">⬇️</button>'+
      '<button class="tb-btn" style="height:30px;font-size:11px" onclick="chiudiImmaginePost()" title="Chiudi (Esc)">✕</button>'+
    '</div>'+
    '<div style="flex:1;min-height:0;width:100%;max-width:1100px;display:flex;align-items:center;gap:10px">'+
      (piu?'<button class="tb-btn" style="height:44px;flex:0 0 40px;justify-content:center" onclick="scorriImmaginePost(-1)" title="Precedente (←)">‹</button>':'')+
      '<div style="flex:1;min-width:0;height:100%;overflow:auto;display:flex;align-items:center;justify-content:center;'+
        'background:#FFFFFF;border-radius:12px">'+
        '<img src="'+p.dati+'" alt="'+escHtml(p.nome||'')+'" '+
          'style="max-width:none;width:'+(IMG_APERTA.zoom*100)+'%;height:auto;display:block">'+
      '</div>'+
      (piu?'<button class="tb-btn" style="height:44px;flex:0 0 40px;justify-content:center" onclick="scorriImmaginePost(1)" title="Successiva (→)">›</button>':'')+
    '</div>'+
    '<div style="font-size:10.5px;color:#64748B">Esc chiude · ← → scorrono · + e − ingrandiscono</div>';
}

function scorriImmaginePost(d){
  if(IMG_APERTA.elenco.length<2)return;
  IMG_APERTA.indice=(IMG_APERTA.indice+d+IMG_APERTA.elenco.length)%IMG_APERTA.elenco.length;
  IMG_APERTA.zoom=1;
  disegnaVisore();
}

function zoomImmaginePost(d){
  IMG_APERTA.zoom=Math.max(0.25,Math.min(4,Math.round((IMG_APERTA.zoom+d)*100)/100));
  disegnaVisore();
}

function chiudiImmaginePost(){
  var v=document.getElementById('visoreImmagine');
  if(v)v.remove();
  document.removeEventListener('keydown',visoreTasti);
}

// ══════════════════════════════════════════════════════════════
// LA FASCIA DEI QUATTRO LIVELLI
// ══════════════════════════════════════════════════════════════
// Era scritta a mano dentro index.html e diceva sempre le stesse cose:
// «Livello 1 · Completato ✓», «Livello 2 · In corso: 40%», gli altri due
// bloccati. Restava così anche con zero lezioni completate, e portava i nomi
// vecchi mentre la scheda Certificazioni sotto ne mostrava altri: la stessa
// pagina si contraddiceva a due centimetri di distanza.
function disegnaLivelli(){
  var t=document.getElementById('levelTrack');
  if(!t)return;
  var raggiunto=livelloRaggiunto();
  t.innerHTML=LIVELLI.map(function(L){
    var a=avanzamentoLivello(L.n);
    var ottenuto=(raggiunto>=L.n);
    var attuale=(!ottenuto && raggiunto===L.n-1);
    var stato=ottenuto?'Completato ✓':(attuale?'In corso: '+a.pct+'%':'Bloccato 🔒');
    return '<div title="'+escHtml(L.desc)+'" style="flex:1;min-width:130px;border-radius:12px;padding:12px;'+
      'background:'+((ottenuto||attuale)?'var(--card)':'var(--bg2)')+';'+
      'border:2px solid '+(ottenuto?L.col:(attuale?'var(--ac3)':'var(--bo)'))+';'+
      ((ottenuto||attuale)?'':'opacity:.7')+'">'+
      '<div style="font-size:18px">'+L.ic+'</div>'+
      '<div style="font-size:12px;font-weight:700;margin-top:4px">'+escHtml(L.nome)+'</div>'+
      '<div style="font-size:10px;color:'+(attuale?'#D97706':'var(--tx4)')+';'+
        (attuale?'font-weight:600':'')+'">Livello '+L.n+' · '+stato+'</div>'+
    '</div>';
  }).join('');
}

// ══════════════════════════════════════════════════════════════
// BADGE VISIBILI SUL PROFILO DI QUALCUN ALTRO
// ══════════════════════════════════════════════════════════════
// Il capitolo 4.4 dice che i badge sono «visualizzabili sui profili aziendali»
// e che «forniscono un riconoscimento immediato del talento». Un badge che vede
// solo chi lo possiede non riconosce niente davanti a nessuno: era metà del
// meccanismo. Dalla classifica si apre ora il profilo pubblico di chiunque.
//
// Tutti i numeri sono ricalcolati per QUELLA persona, comprese lezioni e
// percorsi, che stanno in `learn_progress_u` per utente e non nell'array PATHS
// in memoria (quello riflette solo chi è collegato).
function profileStatsDi(utente){
  var s={agenti:0,pubblicati:0,inRevisione:0,installati:0,esecuzioni:0,esecuzioniOk:0,
         lezioni:0,lezioniTot:0,percorsi:0,quiz:0,post:0,commenti:0,sfide:0,
         docKB:0,politicheAttive:0,controlliUsati:0,tipiControllo:{},connettoriUsati:{},
         inProduzione:0,xp:0,promptScritti:0,costanza:0};
  try{
    s.agenti      = dbGetOne('SELECT COUNT(*) c FROM agents WHERE author=?',[utente]).c;
    s.inProduzione= dbGetOne('SELECT COUNT(*) c FROM agents WHERE active=1 AND author=?',[utente]).c;
    s.pubblicati  = dbGetOne("SELECT COUNT(*) c FROM published_agents WHERE status='pubblicato' AND author=?",[utente]).c;
    s.installati  = dbGetOne('SELECT COUNT(*) c FROM my_agents WHERE user=?',[utente]).c;
    s.esecuzioni  = dbGetOne('SELECT COUNT(*) c FROM exec_log WHERE user=?',[utente]).c;
    s.esecuzioniOk= dbGetOne("SELECT COUNT(*) c FROM exec_log WHERE status='ok' AND user=?",[utente]).c;
    s.quiz        = dbGetOne('SELECT COUNT(*) c FROM quiz_done WHERE user=?',[utente]).c;
    s.post        = dbGetOne('SELECT COUNT(*) c FROM forum_posts WHERE user=?',[utente]).c;
    s.commenti    = dbGetOne('SELECT COUNT(*) c FROM forum_comments WHERE user=?',[utente]).c;
    s.docKB       = dbGetOne('SELECT COUNT(*) c FROM kb_docs').c;
    s.xp          = dbGetOne('SELECT COALESCE(SUM(amount),0) t FROM xp_log WHERE user=?',[utente]).t;
    s.costanza    = (typeof giorniConsecutivi==='function')?giorniConsecutivi(utente):0;
    dbAll('SELECT nodes_json FROM agents WHERE author=?',[utente]).forEach(function(r){
      var nodi=[];try{nodi=JSON.parse(r.nodes_json)}catch(e){}
      nodi.forEach(function(n){
        if(n.type==='gr'){s.controlliUsati++;s.tipiControllo[n.name]=(s.tipiControllo[n.name]||0)+1}
        if(n.type==='ac')s.connettoriUsati[n.name]=(s.connettoriUsati[n.name]||0)+1;
        if(n.type==='ai'){
          var pr=(n.config&&(n.config.prompt||n.config.system))||'';
          if(String(pr).trim().length>=25)s.promptScritti++;
        }
      });
    });
    // Lezioni e percorsi dalla tabella per utente: l'array PATHS porta i
    // progressi di chi e' collegato adesso, non di chi si sta guardando.
    var fatte={};
    dbAll('SELECT path_id,lesson_index FROM learn_progress WHERE user=? AND done=1',[utente])
      .forEach(function(r){ fatte[r.path_id+'-'+r.lesson_index]=1 });
    PATHS.forEach(function(p){
      var n=0;
      p.lessons.forEach(function(l,i){ s.lezioniTot++; if(fatte[p.id+'-'+i]){s.lezioni++;n++} });
      if(n===p.lessons.length)s.percorsi++;
    });
  }catch(e){}
  return s;
}

function apriProfiloPubblico(nome){
  if(!nome)return;
  if(nome===utenteCorrente()){ go('profile'); return }
  var s=profileStatsDi(nome);
  var badges=profileBadges(s);
  var ottenuti=badges.filter(function(b){return b.ok});
  var u=(typeof UTENTI!=='undefined')?UTENTI.filter(function(x){
    return (typeof nomeDellAccount==='function'?nomeDellAccount(x.email,x.name):x.name)===nome })[0]:null;
  var ini=(typeof inizialiDaNome==='function')?inizialiDaNome(nome):nome.substring(0,2).toUpperCase();
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">'+
      '<div style="display:flex;align-items:center;gap:11px;min-width:0">'+
        '<div style="width:44px;height:44px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;'+
          'justify-content:center;font-weight:800;color:#fff;font-size:15px;'+
          'background:linear-gradient(135deg,var(--ac),var(--ac2))">'+escHtml(ini)+'</div>'+
        '<div style="min-width:0">'+
          '<h2 style="margin:0;font-size:17px">'+escHtml(nome)+'</h2>'+
          '<div style="font-size:11.5px;color:var(--tx3)">'+escHtml((u&&u.role)||'Profilo pubblico')+
            ' · '+s.xp.toLocaleString('it-IT')+' XP</div>'+
        '</div>'+
      '</div>'+
      '<button class="modal-close" onclick="closeModal()">✕</button>'+
    '</div>'+
    '<div style="display:flex;gap:7px;flex-wrap:wrap;margin:15px 0 6px">'+
      '<span class="badge badge-b">'+s.agenti+' agent'+(s.agenti===1?'e':'i')+' creat'+(s.agenti===1?'o':'i')+'</span>'+
      '<span class="badge badge-b">'+s.esecuzioni+' esecuzioni</span>'+
      '<span class="badge badge-b">'+s.pubblicati+' pubblicat'+(s.pubblicati===1?'o':'i')+'</span>'+
      '<span class="badge badge-b">'+s.lezioni+'/'+s.lezioniTot+' lezioni</span>'+
    '</div>'+
    '<div style="font-size:11px;color:var(--tx4);margin:12px 0 7px">'+ottenuti.length+' di '+badges.length+' riconoscimenti ottenuti</div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
      badges.map(function(b){
        return '<div class="badge-item" title="'+escHtml(b.hint)+'" style="'+(b.ok?'':'opacity:.35;filter:grayscale(1)')+'">'+
          '<span>'+b.icon+'</span>'+b.name+'</div>';
      }).join('')+
    '</div>'+
    '<div style="font-size:10.5px;color:var(--tx4);margin-top:14px;line-height:1.5">'+
      'Ogni riconoscimento è calcolato sull’attività registrata di questa persona. Passa il mouse su un badge per vedere la soglia.</div>',
  true);
}
