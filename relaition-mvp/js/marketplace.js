var AGENTS=[
  {id:1,name:'Lead Qualifier Pro',cat:'Sales',icon:'🎯',color:'#10B981',
   author:'RelAItion Team',rating:4.8,installs:1240,price:'Gratis',
   desc:'Qualifica automaticamente i lead in arrivo da form, email e CRM. Analizza firmografia, intent signal e storico interazioni per assegnare un punteggio 0-100 e instradare al sales rep giusto.',
   tags:['CRM','Salesforce','HubSpot'],
   nodes:[{t:'tr',ic:'📥',n:'Webhook CRM',d:'Lead in arrivo'},{t:'ai',ic:'🧠',n:'Analisi Lead',d:'Scoring con LLM'},{t:'cd',ic:'🔀',n:'Score > 70?',d:'Routing'},{t:'ac',ic:'📧',n:'Email alert',d:'Notifica sales'},{t:'ou',ic:'📊',n:'Update CRM',d:'Salva score'}]},
  {id:2,name:'Invoice Extractor',cat:'Finance',icon:'🧾',color:'#6366F1',
   author:'Giulia D.',rating:4.9,installs:890,price:'Gratis',
   desc:'Estrae automaticamente dati da fatture PDF/immagine in 8 lingue (IT, EN, FR, DE, ES, NL, PT, PL). OCR + LLM per interpretare layout non standard, valida partita IVA e genera record contabile.',
   tags:['PDF','OCR','SAP','Contabilità'],
   nodes:[{t:'tr',ic:'📎',n:'Upload fattura',d:'PDF/JPG'},{t:'ai',ic:'👁️',n:'OCR + Parse',d:'Estrazione dati'},{t:'ai',ic:'✅',n:'Valida P.IVA',d:'Check format'},{t:'cd',ic:'🔀',n:'Formato OK?',d:'Validazione'},{t:'ac',ic:'💾',n:'Salva in ERP',d:'Registrazione'}]},
  {id:3,name:'HR Onboarding Agent',cat:'HR',icon:'👥',color:'#F59E0B',
   author:'Marco R.',rating:4.7,installs:670,price:'Gratis',
   desc:'Automatizza l\'onboarding dei nuovi dipendenti: raccoglie documenti, verifica completezza con LLM, invia reminder, aggiorna anagrafica HR e genera il welcome kit personalizzato.',
   tags:['Onboarding','Workday','BambooHR'],
   nodes:[{t:'tr',ic:'🆕',n:'Nuovo dipendente',d:'Da HR system'},{t:'ac',ic:'📋',n:'Checklist doc',d:'Richiedi documenti'},{t:'ai',ic:'🔍',n:'Verifica AI',d:'Controlla completezza'},{t:'ac',ic:'📧',n:'Welcome email',d:'Kit benvenuto'},{t:'ou',ic:'✅',n:'Onboard completato',d:'Status update'}]},
  {id:4,name:'Support Ticket Triage',cat:'Customer Service',icon:'🎧',color:'#EC4899',
   author:'Valentina M.',rating:4.6,installs:1100,price:'Gratis',
   desc:'Classifica automaticamente i ticket di supporto per urgenza, categoria e competenza richiesta. Suggerisce risposte predefinite e instrada al team corretto, riducendo i tempi di risposta del 45%.',
   tags:['Zendesk','Freshdesk','Intercom'],
   nodes:[{t:'tr',ic:'🎫',n:'Nuovo ticket',d:'Da helpdesk'},{t:'ai',ic:'🏷️',n:'Classifica AI',d:'Urgenza + categoria'},{t:'cd',ic:'🔀',n:'Urgente?',d:'Priority check'},{t:'ai',ic:'💡',n:'Suggerisci risposta',d:'Knowledge base'},{t:'ac',ic:'📨',n:'Instrada',d:'Assegna team'}]},
  {id:5,name:'Content Calendar AI',cat:'Marketing',icon:'📅',color:'#8B5CF6',
   author:'Andrea L.',rating:4.5,installs:560,price:'Gratis',
   desc:'Genera un piano editoriale mensile basato su trend di settore, analisi competitor e storico performance. Produce bozze per ogni canale (LinkedIn, blog, newsletter) con tone of voice personalizzato.',
   tags:['Social Media','SEO','Content Strategy'],
   nodes:[{t:'tr',ic:'⏰',n:'Trigger mensile',d:'1° del mese'},{t:'ai',ic:'📊',n:'Analisi trend',d:'Google Trends + competitor'},{t:'ai',ic:'✍️',n:'Genera piano',d:'Draft contenuti'},{t:'ac',ic:'📤',n:'Pubblica',d:'Schedule post'},{t:'ou',ic:'📈',n:'Report',d:'Analytics'}]},
  {id:6,name:'Contract Reviewer',cat:'Legal',icon:'⚖️',color:'#0EA5E9',
   author:'RelAItion Team',rating:4.8,installs:430,price:'€9/mese',
   desc:'Analizza contratti fino a 50 pagine: identifica clausole rischiose, termini non standard, mancanze GDPR e obblighi nascosti. Genera un executive summary con risk score e raccomandazioni.',
   tags:['GDPR','Compliance','NDA','Contratti'],
   nodes:[{t:'tr',ic:'📄',n:'Upload contratto',d:'PDF/DOCX'},{t:'ai',ic:'🔍',n:'Analisi clausole',d:'LLM review'},{t:'ai',ic:'⚠️',n:'Risk scoring',d:'Calcola rischio'},{t:'ou',ic:'📋',n:'Report rischi',d:'Executive summary'},{t:'ac',ic:'📧',n:'Notifica legal',d:'Alert team'}]},
  {id:7,name:'Meeting Summarizer',cat:'Produttività',icon:'🎙️',color:'#14B8A6',
   author:'Sara L.',rating:4.7,installs:980,price:'Gratis',
   desc:'Trascrivi e sintetizza riunioni da registrazioni audio/video. Estrae action items, decisioni chiave e assegnazioni. Si integra con Google Calendar e Slack per distribuzione automatica.',
   tags:['Zoom','Teams','Google Meet','Slack'],
   nodes:[{t:'tr',ic:'🎥',n:'Registrazione',d:'Da meeting tool'},{t:'ai',ic:'📝',n:'Trascrizione',d:'Speech-to-text'},{t:'ai',ic:'📋',n:'Sintesi AI',d:'Key points + actions'},{t:'ac',ic:'💬',n:'Post su Slack',d:'Canale team'},{t:'ou',ic:'📁',n:'Archivia',d:'Google Drive'}]},
  {id:8,name:'DevOps Alert Manager',cat:'DevOps',icon:'🚨',color:'#EF4444',
   author:'Luca P.',rating:4.4,installs:320,price:'Gratis',
   desc:'Aggrega alert da monitoring tools (Datadog, PagerDuty, Grafana), elimina duplicati, correla incidenti e suggerisce runbook di risoluzione con contesto storico simile.',
   tags:['Datadog','PagerDuty','Grafana','Kubernetes'],
   nodes:[{t:'tr',ic:'🔔',n:'Alert webhook',d:'Da monitoring'},{t:'ai',ic:'🔗',n:'Correla',d:'Dedup + gruppo'},{t:'cd',ic:'🔀',n:'Severity?',d:'P1/P2/P3'},{t:'ai',ic:'📖',n:'Runbook AI',d:'Suggerisci fix'},{t:'ac',ic:'📟',n:'Escalation',d:'Page on-call'}]},
  {id:9,name:'Expense Report AI',cat:'Finance',icon:'💳',color:'#F97316',
   author:'RelAItion Team',rating:4.6,installs:540,price:'Gratis',
   desc:'Processa note spese da foto scontrini: OCR estrae importo, categoria e data, verifica compliance con policy aziendale, genera report approvabile e aggiorna il foglio spese su SAP/Oracle.',
   tags:['OCR','SAP','Oracle','Travel'],
   nodes:[{t:'tr',ic:'📸',n:'Foto scontrino',d:'Upload'},{t:'ai',ic:'👁️',n:'OCR Parse',d:'Estrai dati'},{t:'cd',ic:'🔀',n:'Policy OK?',d:'Check limiti'},{t:'ac',ic:'✅',n:'Pre-approva',d:'Workflow approvazione'},{t:'ou',ic:'📊',n:'Aggiorna ERP',d:'Registra spesa'}]},
  {id:10,name:'Competitor Watch',cat:'Marketing',icon:'🔭',color:'#7C3AED',
   author:'Andrea L.',rating:4.3,installs:280,price:'€5/mese',
   desc:'Monitora competitor: traccia variazioni prezzi, nuovi prodotti, comunicati stampa, social media mentions. Genera report settimanale con insight azionabili e alert real-time per movimenti significativi.',
   tags:['Web Scraping','Social Listening','BI'],
   nodes:[{t:'tr',ic:'⏰',n:'Cron giornaliero',d:'Ogni 24h'},{t:'ac',ic:'🌐',n:'Scrape siti',d:'Competitor list'},{t:'ai',ic:'📊',n:'Analisi differenze',d:'Confronto storico'},{t:'cd',ic:'🔀',n:'Cambio significativo?',d:'Threshold check'},{t:'ac',ic:'📧',n:'Alert email',d:'Notifica team'}]},
  {id:11,name:'GDPR Data Mapper',cat:'Legal',icon:'🛡️',color:'#059669',
   author:'RelAItion Team',rating:4.9,installs:410,price:'€12/mese',
   desc:'Scansiona database e documenti per mappare dati personali (PII). Genera il Registro dei Trattamenti GDPR, identifica basi giuridiche mancanti e prepara la documentazione per il DPO.',
   tags:['GDPR','Privacy','DPO','Compliance'],
   nodes:[{t:'tr',ic:'🗄️',n:'Scan database',d:'Connection string'},{t:'ai',ic:'🔍',n:'Identifica PII',d:'Pattern matching + AI'},{t:'ai',ic:'📋',n:'Classifica',d:'Tipo + base giuridica'},{t:'ou',ic:'📄',n:'Registro GDPR',d:'Export PDF/Excel'},{t:'ac',ic:'📧',n:'Report DPO',d:'Invio periodico'}]},
  {id:12,name:'Candidate Screener',cat:'HR',icon:'📋',color:'#D946EF',
   author:'Marco R.',rating:4.5,installs:350,price:'Gratis',
   desc:'Pre-screening automatico di CV: analizza competenze, esperienza e fit culturale rispetto alla job description. Genera shortlist con punteggio comparativo e punti chiave per il colloquio.',
   tags:['ATS','LinkedIn','Recruiting'],
   nodes:[{t:'tr',ic:'📥',n:'CV ricevuto',d:'Da ATS/email'},{t:'ai',ic:'📄',n:'Parse CV',d:'Estrai competenze'},{t:'ai',ic:'🎯',n:'Match JD',d:'Score compatibilità'},{t:'cd',ic:'🔀',n:'Score > 75?',d:'Shortlist check'},{t:'ac',ic:'📧',n:'Invita colloquio',d:'Email candidato'}]},
  {id:13,name:'Proposal Drafter AI',cat:'Sales',icon:'📝',color:'#0D9488',
   author:'RelAItion Team',rating:4.7,installs:380,price:'Gratis',
   desc:'Genera proposte commerciali personalizzate partendo da brief e dati CRM del prospect. Compila template Word/PDF con pricing dinamico, case study rilevanti e termini contrattuali standard. Riduce il tempo di creazione proposta da 3 ore a 15 minuti.',
   tags:['CRM','Google Docs','Template','PDF'],
   nodes:[{t:'tr',ic:'📥',n:'Nuova opportunità',d:'Da CRM'},{t:'ac',ic:'☁️',n:'Fetch dati prospect',d:'Salesforce / HubSpot'},{t:'ai',ic:'✍️',n:'Genera proposta',d:'LLM con template'},{t:'ac',ic:'📄',n:'Compila documento',d:'Google Docs / Word'},{t:'ac',ic:'📧',n:'Invia per review',d:'Email al sales manager'}]},
  {id:14,name:'SEO Content Optimizer',cat:'Marketing',icon:'🔍',color:'#4F46E5',
   author:'Andrea L.',rating:4.4,installs:290,price:'€7/mese',
   desc:'Analizza pagine web esistenti, identifica gap SEO vs competitor, suggerisce ottimizzazioni on-page (meta, headings, keyword density) e genera contenuti ottimizzati. Integrazione con Google Search Console e Ahrefs.',
   tags:['SEO','Google Search Console','Ahrefs','Content'],
   nodes:[{t:'tr',ic:'🌐',n:'URL da analizzare',d:'Input manuale / crawl'},{t:'ac',ic:'🔍',n:'Scrape pagina',d:'Estrai contenuto'},{t:'ai',ic:'📊',n:'Analisi SEO',d:'Gap analysis vs top 10'},{t:'ai',ic:'✍️',n:'Ottimizza contenuto',d:'Rewrite con keyword'},{t:'ou',ic:'📋',n:'Report SEO',d:'Score + raccomandazioni'}]},
  {id:15,name:'Budget Variance Analyzer',cat:'Finance',icon:'📊',color:'#DC2626',
   author:'Giulia D.',rating:4.6,installs:210,price:'€8/mese',
   desc:'Confronta budget previsionale vs consuntivo per centro di costo. Identifica scostamenti significativi, classifica le cause con LLM (errore previsione, evento straordinario, trend strutturale) e genera report per il CFO con action items.',
   tags:['Excel','SAP','Oracle','BI','PowerBI'],
   nodes:[{t:'tr',ic:'⏰',n:'Fine mese',d:'Trigger mensile'},{t:'ac',ic:'📊',n:'Fetch dati',d:'ERP + budget Excel'},{t:'ai',ic:'🧮',n:'Calcola varianze',d:'Δ per centro costo'},{t:'ai',ic:'🏷️',n:'Classifica cause',d:'LLM root cause'},{t:'ou',ic:'📄',n:'Report CFO',d:'PDF + dashboard'}]},
  {id:16,name:'CI/CD Deploy Agent',cat:'DevOps',icon:'🚀',color:'#7C3AED',
   author:'Luca P.',rating:4.3,installs:180,price:'Gratis',
   desc:'Automatizza il processo di deploy: verifica test CI, controlla code coverage, analizza changelog con LLM per valutare il rischio del release, gestisce rollback automatico se i health check falliscono post-deploy.',
   tags:['GitHub','GitLab','Docker','Kubernetes','Vercel'],
   nodes:[{t:'tr',ic:'🐙',n:'PR merged',d:'GitHub webhook'},{t:'ac',ic:'✅',n:'Check CI status',d:'Test + coverage'},{t:'ai',ic:'⚠️',n:'Risk assessment',d:'Analisi changelog'},{t:'cd',ic:'🔀',n:'Risk < threshold?',d:'Deploy gate'},{t:'ac',ic:'🚀',n:'Deploy prod',d:'K8s / Vercel'}]},
  {id:17,name:'Competitive Analysis AI',cat:'Sales',icon:'🏆',color:'#B45309',
   author:'RelAItion Team',rating:4.5,installs:320,price:'€6/mese',
   desc:'Monitora i competitor in tempo reale: pricing, feature release, job posting (indicatore di espansione), review dei clienti. Genera battle card aggiornate per il team sales con talking points e obiezioni da gestire.',
   tags:['Web Scraping','LinkedIn','Glassdoor','CRM'],
   nodes:[{t:'tr',ic:'⏰',n:'Cron settimanale',d:'Ogni lunedì'},{t:'ac',ic:'🌐',n:'Scrape competitor',d:'Siti + LinkedIn + G2'},{t:'ai',ic:'📊',n:'Analisi comparativa',d:'Feature matrix'},{t:'ai',ic:'📋',n:'Genera battle card',d:'Talking points'},{t:'ac',ic:'💬',n:'Push su Slack',d:'Canale #competitive'}]},
  {id:18,name:'Document Clause Extractor',cat:'Legal',icon:'📑',color:'#0369A1',
   author:'RelAItion Team',rating:4.8,installs:260,price:'€10/mese',
   desc:'Estrae clausole specifiche da contratti complessi (NDA, SLA, MSA): penali, termini di rinnovo, limitazioni di responsabilità, clausole di recesso. Confronta con standard aziendale e segnala deviazioni critiche con risk score.',
   tags:['PDF','NDA','SLA','Compliance','Legal'],
   nodes:[{t:'tr',ic:'📄',n:'Upload documento',d:'PDF / DOCX'},{t:'ai',ic:'🔍',n:'Parse clausole',d:'Estrazione strutturata'},{t:'ai',ic:'⚖️',n:'Confronta standard',d:'Deviazione analysis'},{t:'cd',ic:'🔀',n:'Risk > medium?',d:'Escalation check'},{t:'ou',ic:'📋',n:'Report deviazioni',d:'PDF con highlight'}]},

  // ── Insurance ──────────────────────────────────────────────────────────
  // La business unit compariva fra i filtri del catalogo ma non aveva agenti:
  // selezionandola si otteneva una lista vuota. Sono i quattro previsti dal
  // capitolo, nello stesso formato di anteprima degli altri (nessuna config:
  // il grafo completo si ottiene installando l'agente).
  {id:19,name:'Claims Processor AI',cat:'Insurance',icon:'🛡️',color:'#0EA5E9',
   author:'Sara L.',rating:4.7,installs:410,price:'Gratis',
   desc:'Istruisce le denunce di sinistro dall\'apertura alla proposta di liquidazione: estrae i dati dal modulo e dagli allegati, verifica la copertura sulla polizza, calcola un indice di anomalia e instrada i casi dubbi a un perito invece di chiuderli in automatico.',
   tags:['Sinistri','PDF','Perizia','Human-in-the-loop'],
   nodes:[{t:'tr',ic:'📎',n:'Denuncia sinistro',d:'Modulo + allegati'},{t:'ai',ic:'🔍',n:'Estrai dati',d:'Polizza, data, danno'},{t:'ai',ic:'📊',n:'Indice anomalia',d:'Scoring 0-100'},{t:'cd',ic:'🔀',n:'Anomalia > 75?',d:'Soglia perizia'},{t:'gr',ic:'✋',n:'Approvazione umana',d:'Perito assegnato'},{t:'ou',ic:'📋',n:'Esito istruttoria',d:'Proposta liquidazione'}]},
  {id:20,name:'DORA Checker',cat:'Insurance',icon:'🏛️',color:'#7C3AED',
   author:'Sara L.',rating:4.6,installs:230,price:'€15/mese',
   desc:'Verifica la conformità dei contratti con fornitori ICT ai requisiti del regolamento DORA: clausole di uscita, diritti di audit, notifica degli incidenti, continuità operativa. Segnala le clausole assenti e cita l\'articolo di riferimento.',
   tags:['DORA','Compliance','Contratti','Regolamento'],
   nodes:[{t:'tr',ic:'📄',n:'Upload contratto',d:'PDF / DOCX'},{t:'ai',ic:'🔍',n:'Estrai clausole',d:'Parsing strutturato'},{t:'ai',ic:'⚖️',n:'Confronta DORA',d:'Requisiti obbligatori'},{t:'gr',ic:'📐',n:'Convalida output',d:'Schema conforme'},{t:'ou',ic:'📋',n:'Report conformità',d:'Lacune e articoli'}]},
  {id:21,name:'Polizza Analyzer',cat:'Insurance',icon:'📜',color:'#0891B2',
   author:'RelAItion Team',rating:4.5,installs:320,price:'Gratis',
   desc:'Legge una polizza e ne restituisce la sostanza in linguaggio comprensibile: che cosa è coperto, che cosa è escluso, massimali, franchigie e termini di disdetta. Fonda ogni affermazione sul testo della polizza, citando l\'articolo da cui proviene.',
   tags:['Polizze','RAG','Knowledge Base','Trasparenza'],
   nodes:[{t:'tr',ic:'📄',n:'Upload polizza',d:'PDF'},{t:'ai',ic:'📚',n:'Analisi con KB',d:'Coperture ed esclusioni'},{t:'gr',ic:'🔎',n:'Verifica fondatezza',d:'Ogni voce citata'},{t:'ou',ic:'📊',n:'Scheda sintetica',d:'Massimali e franchigie'}]},
  {id:22,name:'Regulatory Report AI',cat:'Insurance',icon:'📈',color:'#059669',
   author:'Giulia D.',rating:4.6,installs:180,price:'€20/mese',
   desc:'Compone la reportistica periodica verso l\'autorità di vigilanza raccogliendo i dati dai sistemi interni, applicando i controlli di quadratura e producendo il file nel formato richiesto. Blocca l\'invio quando un controllo non passa, invece di trasmettere un dato incoerente.',
   tags:['IVASS','Reporting','Quadratura','Scadenze'],
   nodes:[{t:'tr',ic:'⏰',n:'Scadenza periodica',d:'Cron trimestrale'},{t:'ac',ic:'🗄️',n:'PostgreSQL',d:'Estrazione dati'},{t:'ai',ic:'🧮',n:'Controlli quadratura',d:'Coerenza aggregati'},{t:'cd',ic:'🔀',n:'Quadratura ok?',d:'Blocco su scarto'},{t:'ou',ic:'💾',n:'Esporta file',d:'Formato vigilanza'}]}

];


function renderMkt(){
  // D4: la sorveglianza gira all'ingresso nel Marketplace. Nel prototipo non
  // c'è un servizio in ascolto — è il momento più vicino a un controllo
  // continuo, e viene dichiarato come tale.
  if(typeof pubAutoSuspendScan==='function'){
    var sosp=pubAutoSuspendScan();
    if(sosp.length)showToast('⏸️ Sospensione automatica: '+sosp.join(', ')+', tasso di fallimento oltre soglia');
  }
  var reviewBtn=document.getElementById('reviewQueueBtn');
  if(reviewBtn){
    var pendingCount=dbGetOne("SELECT COUNT(*) c FROM published_agents WHERE status IN ('in_verifica','in_revisione')").c;
    reviewBtn.textContent='🛡️ Revisiona pubblicazioni'+(pendingCount?' ('+pendingCount+')':'');
  }
  var healthBtn=document.getElementById('pubHealthBtn');
  if(healthBtn){
    var pubCount=dbGetOne("SELECT COUNT(*) c FROM published_agents WHERE status IN ('pubblicato','sospeso')").c;
    healthBtn.style.display=pubCount?'':'none';
    healthBtn.textContent='📈 Salute pubblicazioni ('+pubCount+')';
  }
  // filters
  var cats=['Tutti'];
  AGENTS.concat(getPublishedAgents()).forEach(function(a){if(cats.indexOf(a.cat)<0)cats.push(a.cat)});
  document.getElementById('mkt-filters').innerHTML=cats.map(function(c){
    return '<div class="mkt-filter'+(c===mktFilter?' active':'')+'" onclick="setMktFilter(\''+c+'\')">'+c+'</div>';
  }).join('');
  // grid
  var allAgents=AGENTS.concat(getPublishedAgents());
  var list=mktFilter==='Tutti'?allAgents:allAgents.filter(function(a){return a.cat===mktFilter});
  // Il testo cercato e' un secondo filtro, che si combina con la categoria.
  // Prima si pretende che ci siano TUTTE le parole; se cosi' non si trova
  // niente si ripiega su quelle che ci sono, ordinate per quante ne
  // corrispondono. Chi cerca «estrazione fatture» e ottiene zero perche' la
  // scheda dice «estrae» conclude che la ricerca sia rotta: meglio un elenco
  // parziale, dichiarato come tale, che una pagina vuota.
  window.__ricercaParziale=false;
  if(mktRicerca){
    var stretto=list.filter(function(a){return mktCorrisponde(a,mktRicerca)});
    var parole=mktRicerca.trim().split(/\s+/).filter(Boolean);
    if(stretto.length||parole.length<2){
      list=stretto;
    }else{
      var punteggio={};
      var largo=list.filter(function(a){
        var n=parole.filter(function(p){ return mktCorrisponde(a,p) }).length;
        if(n)punteggio[a.id]=n;
        return n>0;
      });
      if(largo.length){
        window.__ricercaParziale=true;
        largo.sort(function(a,b){ return (punteggio[b.id]||0)-(punteggio[a.id]||0) });
      }
      list=largo;
    }
  }
  list=list.slice().sort(function(a,b){
    // L'ordinamento segue la valutazione MOSTRATA: ordinare per `rating` di
    // catalogo mentre le schede espongono la media delle recensioni darebbe un
    // elenco che contraddice i numeri che ci sono scritti sopra.
    if(mktSort==='rating')return (recValutazione(b).valore||0)-(recValutazione(a).valore||0);
    if(mktSort==='installs')return (b.installs||0)-(a.installs||0);
    if(mktSort==='name')return a.name.localeCompare(b.name);
    return 0;
  });
  // Cosa si sta cercando resta scritto SOPRA i risultati, con quanti ne ha
  // trovati e un modo per togliere il filtro. Senza, chi non ricorda di aver
  // scritto qualcosa nella barra vede un catalogo dimezzato e crede sia rotto.
  var barra=document.getElementById('mkt-ricerca');
  if(!barra){
    barra=document.createElement('div');
    barra.id='mkt-ricerca';
    var griglia=document.getElementById('mkt-grid');
    griglia.parentNode.insertBefore(barra,griglia);
  }
  barra.innerHTML=mktRicerca
    ? '<div style="display:flex;align-items:center;gap:10px;background:var(--ac-ul);border:1px solid var(--ac);'+
      'border-radius:10px;padding:9px 12px;margin-bottom:14px">'+
      '<span style="font-size:13px">🔍</span>'+
      '<span style="flex:1;font-size:12.5px">Risultati per <strong>'+escHtml(mktRicerca)+'</strong>: '+
        list.length+' agent'+(list.length===1?'e':'i')+(window.__ricercaParziale?' che contengono almeno una delle parole':'')+
        (mktFilter!=='Tutti'?' nella categoria '+escHtml(mktFilter):'')+'</span>'+
      '<button class="tb-btn" style="height:28px;font-size:11px" onclick="mktAzzeraRicerca()">Togli il filtro</button>'+
      '</div>'
    : '';

  document.getElementById('mkt-grid').innerHTML=list.length?list.map(function(a){
    return '<div class="agent-card" onclick="openAgentDetail('+a.id+')">'+
      '<div class="agent-top">'+
        '<div class="agent-icon" style="background:'+a.color+'15;color:'+a.color+'">'+a.icon+'</div>'+
        '<div class="agent-info"><div class="agent-name">'+a.name+'</div><div class="agent-author">di '+a.author+'</div></div>'+
        (a.community?'<span class="badge badge-p">'+(a.validating?'🕐 In validazione':'👥 Community')+'</span>':'<span class="badge badge-g">'+a.cat+'</span>')+
      '</div>'+
      '<div class="agent-desc">'+a.desc.substring(0,120)+'...</div>'+
      '<div class="agent-bottom">'+
        '<span class="agent-stat">'+(function(){var v=recValutazione(a);
          return v.valore?('⭐ '+v.valore+(v.reale?' <span style="color:var(--tx4)">('+v.n+')</span>':'')):'🆕 Nuovo'})()+'</span>'+
        '<span class="agent-stat">📥 '+a.installs+'</span>'+
        (a.compliance?'<span class="badge badge-g" style="font-size:9px">🛡️ '+a.compliance[0]+(a.compliance.length>1?' +'+(a.compliance.length-1):'')+'</span>':'')+
        '<span class="agent-price">'+a.price+'</span>'+
      '</div>'+
    '</div>';
  }).join('')
  // Una griglia vuota senza spiegazione sembra un guasto: si dice cosa non ha
  // trovato e si offre la via d'uscita, invece di lasciare un rettangolo bianco.
  : '<div class="card" style="grid-column:1/-1;padding:26px;text-align:center">'+
      '<div style="font-size:26px;margin-bottom:8px">🔍</div>'+
      '<div style="font-size:13px;font-weight:600;margin-bottom:4px">Nessun agente per «'+escHtml(mktRicerca)+'»'+
        (mktFilter!=='Tutti'?' nella categoria '+escHtml(mktFilter):'')+'</div>'+
      '<div style="font-size:12px;color:var(--tx3);margin-bottom:14px">La ricerca guarda nome, descrizione, categoria, autore ed etichette.</div>'+
      '<button class="tb-btn primary" onclick="mktAzzeraRicerca()">Mostra tutto il catalogo</button>'+
    '</div>';
}

function setMktFilter(f){mktFilter=f;renderMkt()}

// Toglie il filtro di ricerca svuotando anche la barra in alto: azzerare solo
// lo stato lasciava il testo scritto nel campo, e alla ricerca successiva
// sembrava che il filtro fosse ancora attivo.
function mktAzzeraRicerca(){
  mktRicerca='';
  var campo=document.getElementById('globalSearch');
  if(campo)campo.value='';
  renderMkt();
}


function openAgentDetail(id){
  var a=AGENTS.concat(getPublishedAgents()).find(function(x){return x.id===id});if(!a)return;
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:flex-start">'+
      '<div style="display:flex;gap:16px;align-items:center">'+
        '<div class="agent-icon" style="background:'+a.color+'15;color:'+a.color+';width:56px;height:56px;font-size:28px">'+a.icon+'</div>'+
        '<div><h2>'+a.name+'</h2><div style="font-size:12px;color:var(--tx3)">di '+a.author+' · '+a.cat+'</div></div>'+
      '</div>'+
      '<button class="modal-close" onclick="closeModal()">✕</button>'+
    '</div>'+
    '<div style="display:flex;gap:8px;margin:16px 0;flex-wrap:wrap">'+
      (function(){var v=recValutazione(a);
        return '<span class="badge badge-g">⭐ '+(v.valore||'—')+' / 5.0'+(v.reale?' · '+v.n+' recension'+(v.n===1?'e':'i'):'')+'</span>'})()+
      '<span class="badge badge-b">📥 '+a.installs+' installazioni</span>'+
      '<span class="badge '+(a.price==='Gratis'?'badge-g':'badge-y')+'">'+a.price+'</span>'+
      (a.compliance?a.compliance.map(function(c){return '<span class="badge badge-p">🛡️ '+c+'</span>'}).join(''):'')+
    '</div>'+
    (a.compliance?'<div style="background:var(--ac-ul);border:1px solid rgba(37,99,235,.2);border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:11px;color:var(--tx2)"><strong>✅ Governance verificata:</strong> audit log immutabile, esecuzione in sandbox isolata, dati processati in EU. Conforme a '+a.compliance.join(', ')+'.</div>':'')+
    '<p style="font-size:13px;color:var(--tx2);line-height:1.7;margin-bottom:16px">'+a.desc+'</p>'+
    '<div style="font-size:12px;font-weight:700;margin-bottom:8px">🏷️ Integrazioni</div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px">'+a.tags.map(function(t){return '<span class="badge badge-gray">'+t+'</span>'}).join('')+'</div>'+
    '<div style="font-size:12px;font-weight:700;margin-bottom:8px">🔧 Architettura workflow ('+a.nodes.length+' nodi)</div>'+
    '<div style="display:flex;gap:6px;margin-bottom:20px;overflow-x:auto;padding:8px 0">'+a.nodes.map(function(n,i){
      var colors={tr:'#F59E0B',ai:'#6366F1',cd:'#EF4444',ac:'#10B981',ou:'#64748B'};
      return '<div style="background:'+colors[n.t]+'10;border:1px solid '+colors[n.t]+'30;border-radius:8px;padding:10px 14px;min-width:100px;text-align:center;font-size:11px">'+
        '<div style="font-size:18px;margin-bottom:4px">'+n.ic+'</div>'+
        '<div style="font-weight:700">'+n.n+'</div>'+
        '<div style="color:var(--tx4);font-size:10px;margin-top:2px">'+n.d+'</div>'+
        (i<a.nodes.length-1?'<div style="margin-top:6px;color:var(--tx4)">↓</div>':'')+
      '</div>';
    }).join('')+'</div>'+
    recBlocco(a)+
    '<div style="display:flex;gap:8px;margin-top:20px">'+
      '<button class="tb-btn primary" onclick="installAgent('+a.id+')">📥 Installa nel Builder</button>'+
      (a.community?'<button class="tb-btn" style="color:#EF4444;border-color:#FEE2E2" onclick="unpublishAgent('+a.id+')">🗑️ Rimuovi dal marketplace</button>':'')+
      '<button class="tb-btn" onclick="closeModal()">Chiudi</button>'+
    '</div>',true
  );
}


function installAgent(id){
  var a=AGENTS.concat(getPublishedAgents()).find(function(x){return x.id===id});if(!a)return;
  B.dbAgentId=null;B.context=''; // le modifiche successive salvano una NUOVA riga, non sovrascrivono il canvas precedente
  // Published agents carry the full workflow (positions + edges)
  if(a.workflow){
    B.nodes=JSON.parse(JSON.stringify(a.workflow.nodes));
    B.edges=JSON.parse(JSON.stringify(a.workflow.edges));
    B.nextId=a.workflow.nextId||B.nodes.length+1;
    B.selId=-1;b_render();
    closeModal();go('builder');
    currentAgentName=a.name;
    showToast('✅ '+a.name+' caricato nel Builder!');
    addAct('Installato agente: '+a.name);
    return;
  }
  // Load into builder
  B.nodes=[];B.edges=[];B.nextId=1;
  var startX=80,startY=40,gapY=140;
  a.nodes.forEach(function(n,i){
    b_addNode(n.t,n.ic,n.n,n.d,startX,startY+i*gapY);
  });
  // auto-connect
  for(var i=0;i<B.nodes.length-1;i++){
    var from=B.nodes[i],to=B.nodes[i+1];
    var port=from.type==='cd'?'true':'out';
    b_addEdge(from.id,port,to.id,'in','');
  }
  B.selId=-1;b_render();
  closeModal();go('builder');
  currentAgentName=a.name;
  showToast('✅ '+a.name+' installato nel Builder!');
  addAct('Installato agente: '+a.name);
  // Save to my agents
  // Il capitolo 4.4 prevede che gli agenti piu' installati generino esperienza
  // per chi li ha scritti: il merito e' di chi ha costruito, non di chi installa.
  // Vale una volta sola per persona, altrimenti basterebbe disinstallare e
  // reinstallare per far salire il proprio autore preferito.
  if(!dbGetOne('SELECT id FROM my_agents WHERE catalog_id=? AND user=?',[id,utenteCorrente()])){
    dbRun('INSERT INTO my_agents (catalog_id,installed_at,user) VALUES (?,?,?)',[id,new Date().toISOString(),utenteCorrente()]);
    if(a.author && a.author!==utenteCorrente() && typeof addXPa==='function')
      addXPa(a.author,15,'Un tuo agente e\u0300 stato installato: '+a.name);
  }
}
// ── MY AGENTS ──
// ── BUILDER ENGINE ──

function openPublishModal(){
  if(typeof sandboxBlocca==='function'&&sandboxBlocca('pubblicare'))return;
  var _errs=validateWorkflow();
  if(_errs.length){showValidationErrors(_errs);return}
  clearInvalidNodes();
  var cats=['Sales','Marketing','Finance','HR','Legal','Insurance','DevOps','Customer Service','Produttività'];
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>Pubblica nel Marketplace</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 16px">Il tuo agente ('+B.nodes.length+' nodi) sarà visibile nel marketplace con badge <span class="badge badge-p">Community</span>. Prima della pubblicazione passa per la pipeline di validazione.</p>'+
    '<div class="prop-group"><div class="prop-label">Nome agente *</div><input class="prop-input" id="pubName" placeholder="es. Order Processing Agent"></div>'+
    '<div class="prop-group"><div class="prop-label">Categoria *</div><select class="prop-select" id="pubCat">'+cats.map(function(c){return '<option>'+c+'</option>'}).join('')+'</select></div>'+
    '<div class="prop-group"><div class="prop-label">Descrizione *</div><textarea class="prop-input" id="pubDesc" rows="3" placeholder="Cosa fa l\'agente, quale problema risolve, quali sistemi integra..."></textarea></div>'+
    '<div class="prop-group"><div class="prop-label">Tag integrazioni (separati da virgola)</div><input class="prop-input" id="pubTags" placeholder="es. Salesforce, Slack, PostgreSQL"></div>'+
    '<div class="prop-group"><div class="prop-label">Icona (emoji)</div><input class="prop-input" id="pubIcon" value="🤖" style="width:70px"></div>'+
    '<div class="prop-group"><div class="prop-label">Prezzo</div><select class="prop-select" id="pubPrice"><option>Gratis</option><option>€5/mese</option><option>€10/mese</option><option>€15/mese</option><option>€20/mese</option></select></div>'+
    // D1 — l'ambito determina chi approva e quali controlli sono bloccanti
    '<div class="prop-group"><div class="prop-label">Ambito di diffusione *</div><select class="prop-select" id="pubScope" onchange="refreshPublishChecks()">'+
      Object.keys(PUB_SCOPES).map(function(k){
        return '<option value="'+k+'"'+(k==='business_unit'?' selected':'')+'>'+PUB_SCOPES[k].lab+': approva: '+PUB_SCOPES[k].approver+'</option>';
      }).join('')+'</select>'+
      '<div id="pubScopeHint" style="font-size:10px;color:var(--tx4);margin-top:4px"></div></div>'+
    '<div class="prop-group"><div class="prop-label">Prerequisiti</div><input class="prop-input" id="pubPrereq" placeholder="es. credenziali Salesforce, accesso alla cartella condivisa" onchange="refreshPublishChecks()"></div>'+
    '<div class="prop-group"><div class="prop-label">Dati trattati</div><input class="prop-input" id="pubData" placeholder="es. dati personali di contatto, nessun dato sensibile" onchange="refreshPublishChecks()"></div>'+
    '<div style="border-top:1px solid var(--bo);padding-top:12px;margin-bottom:12px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
        '<span style="font-size:12px;font-weight:700">🔍 Verifica automatica</span>'+
        '<button class="tb-btn" style="font-size:11px" onclick="refreshPublishChecks()">Ricontrolla</button>'+
      '</div>'+
      '<div id="pubChecks"></div>'+
    '</div>'+
    '<button class="tb-btn primary" id="pubSubmitBtn" onclick="publishAgent()">🚀 Richiedi pubblicazione</button>'
  );
  refreshPublishChecks();
}

// I controlli girano sui dati del modulo mentre lo si compila: scoprire un
// blocco solo dopo aver premuto Pubblica è la scoperta più tardiva possibile.
function refreshPublishChecks(){
  var box=document.getElementById('pubChecks');
  if(!box)return;
  var scope=(document.getElementById('pubScope')||{}).value||'business_unit';
  var nome=(document.getElementById('pubName')||{}).value||'';
  var esistente=nome?dbGetOne('SELECT id,version FROM published_agents WHERE name=?',[nome]):null;
  var res=runPublishChecks({
    nodes:B.nodes,edges:B.edges,scope:scope,
    name:nome||currentAgentName,
    desc:(document.getElementById('pubDesc')||{}).value||'',
    tags:((document.getElementById('pubTags')||{}).value||'').split(',').map(function(t){return t.trim()}).filter(Boolean),
    prerequisiti:(document.getElementById('pubPrereq')||{}).value||'',
    datiTrattati:(document.getElementById('pubData')||{}).value||'',
    isUpdate:!!esistente, excludeId:esistente?esistente.id:null, sourceAgentId:B.dbAgentId
  });
  // Se all'ambito scelto mancano dei controlli, si offre di inserirli invece di
  // limitarsi a dire che mancano: il punto in cui vanno messi conta (mascherare
  // dopo la chiamata al modello non protegge nulla) e non è ragionevole
  // chiedere all'utente di indovinarlo.
  var mancanti=(typeof pubGuardrailCheck==='function')
    ? PUB_SCOPES[scope].guardrailRichiesti.filter(function(g){
        return !B.nodes.some(function(n){return n.type==='gr'&&n.name===g})})
    : [];
  box.innerHTML=renderChecksHtml(res)+
    (mancanti.length
      ? '<div style="background:var(--ac3-l);border:1px solid #FDE68A;border-radius:10px;padding:10px 12px;margin-top:10px">'+
        '<div style="font-size:11.5px;color:#92400E;line-height:1.5;margin-bottom:8px">'+
          'Mancano '+mancanti.length+' controllo/i richiesto/i: <strong>'+mancanti.map(escHtml).join(', ')+'</strong>. '+
          'Posso inserirli io nel punto corretto del flusso.</div>'+
        '<button class="tb-btn" style="width:100%;justify-content:center" onclick="aggiungiControlliRichiesti(\''+scope+'\')">'+
          '🛡️ Aggiungi i controlli richiesti</button></div>'
      : '');
  var hint=document.getElementById('pubScopeHint');
  var sd=PUB_SCOPES[scope];
  if(hint)hint.textContent=sd.guardrailRichiesti.length
    ? 'Controlli obbligatori per questo ambito: '+sd.guardrailRichiesti.join(', ')+(sd.conformita?' · richiede verifica di conformità':'')
    : 'Nessun controllo obbligatorio per questo ambito.';
  var btn=document.getElementById('pubSubmitBtn');
  if(btn){
    btn.disabled=!res.puoiProcedere;
    btn.style.opacity=res.puoiProcedere?1:.45;
    btn.style.cursor=res.puoiProcedere?'pointer':'not-allowed';
    btn.textContent=res.puoiProcedere?'🚀 Richiedi pubblicazione':'⛔ Risolvi i controlli bloccanti';
  }
  window.__pubChecks=res;
}

function publishAgent(){
  var name=document.getElementById('pubName').value.trim();
  var desc=document.getElementById('pubDesc').value.trim();
  if(!name||!desc){showToast('⚠️ Nome e descrizione sono obbligatori');return}
  var scope=document.getElementById('pubScope').value;
  refreshPublishChecks();
  var res=window.__pubChecks;
  if(res&&!res.puoiProcedere){showToast('⛔ Ci sono controlli bloccanti da risolvere prima di pubblicare');return}

  var cat=document.getElementById('pubCat').value;
  var tags=document.getElementById('pubTags').value.split(',').map(function(t){return t.trim()}).filter(Boolean);
  var icon=document.getElementById('pubIcon').value||'🤖';
  var price=document.getElementById('pubPrice').value;
  var prereq=document.getElementById('pubPrereq').value.trim();
  var dati=document.getElementById('pubData').value.trim();
  var workflow={nodes:JSON.parse(JSON.stringify(B.nodes)),edges:JSON.parse(JSON.stringify(B.edges)),nextId:B.nextId};
  var descCompleta=desc+(prereq?'\n\nPrerequisiti: '+prereq:'')+(dati?'\nDati trattati: '+dati:'');

  var esistente=dbGetOne('SELECT id,version FROM published_agents WHERE name=?',[name]);
  var pubId,versione;
  if(esistente){
    // Aggiornamento: nuova versione dello stesso agente, non un duplicato.
    versione=pubNextVersion(esistente.version);
    dbRun("UPDATE published_agents SET cat=?,icon=?,price=?,desc=?,tags_json=?,workflow_json=?,status='in_verifica',scope=?,version=?,source_agent_id=? WHERE id=?",
      [cat,icon,price,descCompleta,JSON.stringify(tags.length?tags:['Custom']),JSON.stringify(workflow),scope,versione,B.dbAgentId||null,esistente.id]);
    pubId=esistente.id;
  }else{
    var count=dbGetOne('SELECT COUNT(*) c FROM published_agents').c;
    var colors=['#10B981','#6366F1','#F59E0B','#EC4899','#8B5CF6','#0EA5E9','#14B8A6','#F97316'];
    versione='1.0';
    dbRun('INSERT INTO published_agents (name,cat,icon,color,author,rating,installs,price,desc,tags_json,workflow_json,created_at,status,scope,version,source_agent_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [name,cat,icon,colors[count%colors.length],profileData.name,0,0,price,descCompleta,
       JSON.stringify(tags.length?tags:['Custom']),JSON.stringify(workflow),new Date().toISOString(),'in_verifica',scope,versione,B.dbAgentId||null]);
    pubId=dbGetOne('SELECT last_insert_rowid() as id').id;
  }

  // La versione viene conservata prima della revisione: serve al confronto
  // del revisore e al ripristino successivo.
  pubSaveVersion(pubId,versione,workflow,esistente?'Aggiornamento richiesto':'Prima pubblicazione');
  dbRun('INSERT INTO publications (agent_id,version,requested_scope,checks_json,created_at) VALUES (?,?,?,?,?)',
    [pubId,versione,scope,JSON.stringify(res||{}),new Date().toISOString()]);

  closeModal();
  showToast('🚀 "'+name+'" v'+versione+' inviato a '+PUB_SCOPES[scope].approver+' per la revisione');
  addAct('Richiesta pubblicazione: '+name+' v'+versione+' ('+PUB_SCOPES[scope].lab+')');
  go('marketplace');
}

// includeAll=true: usato dalla coda di revisione e da lookup per id (dove
// serve trovare l'agente indipendentemente dal suo stato). Senza
// includeAll, restituisce solo gli agenti APPROVATI — è quello che il
// Marketplace pubblico deve mostrare: prima ogni pubblicazione community
// restava "In validazione" per sempre, perché non esisteva alcun modo di
// farla avanzare a uno stato successivo (vedi openReviewQueue).
function getPublishedAgents(includeAll){
  var rows=includeAll?dbAll('SELECT * FROM published_agents ORDER BY id'):dbAll("SELECT * FROM published_agents WHERE status='pubblicato' ORDER BY id");
  return rows.map(function(a){
    var wf=JSON.parse(a.workflow_json||'{}');
    return {
      id:1000+a.id,name:a.name,cat:a.cat,icon:a.icon,color:a.color,author:a.author,
      rating:a.rating,installs:a.installs,price:a.price,community:true,
      validating:(a.status==='in_verifica'||a.status==='in_revisione'),rejected:a.status==='ritirato',sospeso:a.status==='sospeso',stato:a.status,scope:a.scope,version:a.version,suspendedReason:a.suspended_reason,reviewNote:a.review_note,
      compliance:['GDPR'],desc:a.desc,tags:JSON.parse(a.tags_json||'[]'),
      workflow:wf,
      nodes:wf.nodes?wf.nodes.map(function(n){return{t:n.type,ic:n.icon,n:n.name,d:n.detail}}):[]
    };
  });
}

function unpublishAgent(id){
  if(!confirm('Rimuovere questo agente dal marketplace?'))return;
  dbRun('DELETE FROM published_agents WHERE id=?',[id-1000]);
  closeModal();renderMkt();showToast('🗑️ Agente rimosso dal marketplace');
}

// ══════════════════════════════════════════
// REVISIONE COMMUNITY — chi pubblica un agente non lo rende subito visibile
// a tutti: resta "In validazione" finché un revisore non lo approva
// (o rifiuta, con motivazione). Pipeline dichiarata già nel modale di
// pubblicazione (Bozza → Sandbox → Revisione tecnica → Approvazione
// Workstream Owner → Pubblicazione) — qui il passo "Revisione" diventa
// un'azione reale, non solo testo.
// ══════════════════════════════════════════

function openReviewQueue(){
  var pending=dbAll("SELECT * FROM published_agents WHERE status IN ('in_verifica','in_revisione') ORDER BY created_at");
  var html='<div style="display:flex;justify-content:space-between;align-items:center"><h2>Revisione pubblicazioni</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 16px">Un agente resta invisibile nel Marketplace pubblico finché non viene approvato qui. Ogni richiesta porta con sé l\'esito dei controlli automatici e, per gli aggiornamenti, il confronto con la versione in uso.</p>';
  if(!pending.length){
    html+='<div style="text-align:center;padding:40px;color:var(--tx4)"><div style="font-size:32px;margin-bottom:8px">✅</div><div style="font-size:13px">Nessuna pubblicazione in attesa di revisione</div></div>';
  }else{
    html+=pending.map(renderReviewCard).join('');
  }
  openModal(html,true);
}

function renderReviewCard(a){
  var wf=JSON.parse(a.workflow_json||'{}');
  var nodeCount=(wf.nodes||[]).length;
  var pub=dbGetOne('SELECT * FROM publications WHERE agent_id=? ORDER BY id DESC LIMIT 1',[a.id]);
  var checks=null;try{checks=JSON.parse(pub&&pub.checks_json||'null')}catch(e){}
  var scope=PUB_SCOPES[a.scope||'business_unit']||PUB_SCOPES.business_unit;
  var versioni=pubVersions(a.id);
  var precedente=versioni.length>1?JSON.parse(versioni[1].definition_json):null;

  var h='<div class="card mb-16" style="padding:14px">'+
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">'+
      '<div style="flex:1"><div style="font-weight:700;font-size:13px">'+a.icon+' '+escHtml(a.name)+' <span style="font-size:10px;color:var(--tx4)">v'+escHtml(a.version||'1.0')+'</span></div>'+
      '<div style="font-size:11px;color:var(--tx4);margin-top:2px">di '+escHtml(a.author)+' · '+escHtml(a.cat)+' · '+nodeCount+' nodi · '+new Date(a.created_at).toLocaleDateString('it-IT')+'</div>'+
      '<div style="font-size:11px;color:var(--ac2);margin-top:3px">Ambito richiesto: <strong>'+escHtml(scope.lab)+'</strong>, approva: '+escHtml(scope.approver)+'</div>'+
      '<div style="font-size:12px;color:var(--tx2);margin-top:6px;white-space:pre-wrap">'+escHtml(a.desc)+'</div></div>'+
      '<span class="badge badge-y" style="flex-shrink:0">'+pubStateLabel(a.status)+'</span>'+
    '</div>';

  // Struttura del flusso
  h+='<div style="margin-top:10px;font-size:10.5px;color:var(--tx3);background:var(--bg2);border-radius:8px;padding:8px 10px">'+
    '<strong>Struttura:</strong> '+(wf.nodes||[]).map(function(n){return escHtml(n.icon+' '+n.name)}).join(' → ')+'</div>';

  // Esito dei controlli automatici, così come registrato alla richiesta
  if(checks&&checks.bloccanti){
    h+='<div style="margin-top:10px">'+renderChecksHtml(checks)+'</div>';
  }

  // Confronto con la versione in uso (D3)
  if(precedente){
    var d=pubDiff(wf,precedente);
    h+='<div style="margin-top:6px;background:var(--bg2);border-radius:8px;padding:9px 11px;font-size:10.5px">'+
      '<div style="font-weight:700;margin-bottom:4px">🔀 Confronto con la versione in uso ('+escHtml(versioni[1].version)+')</div>'+
      (d.aggiunti.length?'<div style="color:#10B981">+ '+d.aggiunti.map(escHtml).join(', ')+'</div>':'')+
      (d.rimossi.length?'<div style="color:#EF4444">− '+d.rimossi.map(escHtml).join(', ')+'</div>':'')+
      (d.modificati.length?'<div style="color:#F59E0B">~ configurazione modificata: '+d.modificati.map(escHtml).join(', ')+'</div>':'')+
      (!d.aggiunti.length&&!d.rimossi.length&&!d.modificati.length?'<div style="color:var(--tx4)">Nessuna differenza nei nodi</div>':'')+
      '<div style="color:var(--tx4);margin-top:2px">Connessioni: '+d.archiPrima+' → '+d.archiDopo+'</div>'+
    '</div>';
    h+='<div style="margin-top:6px"><button class="tb-btn" style="font-size:11px" onclick="pubRunRegression('+a.id+')">↻ Esegui la non regressione</button>'+
       '<span id="reg-'+a.id+'" style="font-size:10.5px;color:var(--tx3);margin-left:8px"></span></div>';
  }

  h+='<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">'+
      '<button class="tb-btn primary" onclick="reviewPublishedAgent('+a.id+',\'pubblicato\')" style="font-size:11px">✅ Approva</button>'+
      '<button class="tb-btn" onclick="reviewPublishedAgent('+a.id+',\'bozza\')" style="font-size:11px">✏️ Richiedi modifica</button>'+
      '<button class="tb-btn" onclick="reviewPublishedAgent('+a.id+',\'ritirato\')" style="font-size:11px;color:#EF4444;border-color:#FEE2E2">❌ Rifiuta</button>'+
    '</div></div>';
  return h;
}

// Non regressione (D2): rigioca con B8 i casi di riferimento e confronta gli
// esiti. Le divergenze sono mostrate al revisore, non nascoste.
function pubRunRegression(id){
  var a=dbGetOne('SELECT * FROM published_agents WHERE id=?',[id]);
  var out=document.getElementById('reg-'+id);
  if(!a||!out)return;
  var casi=pubRegressionCases(a.name,a.source_agent_id);
  if(!casi.length){out.innerHTML='<span style="color:#F59E0B">Nessun caso di riferimento tracciato: non verificabile</span>';return}
  out.textContent='Rigioco '+casi.length+' casi…';
  var wf=JSON.parse(a.workflow_json||'{}');
  var esiti=[];
  var passo=function(i){
    if(i>=casi.length){
      var div=esiti.filter(function(e){return !e.uguale});
      out.innerHTML=div.length
        ? '<span style="color:#F59E0B">⚠️ '+div.length+' divergenze su '+esiti.length+': '+div.map(function(e){return '#'+e.id+' '+e.prima+'→'+e.dopo}).join(', ')+'</span>'
        : '<span style="color:#10B981">✅ '+esiti.length+' casi rigiocati, nessuna divergenza</span>';
      return;
    }
    var c=casi[i];
    var l=dbGetOne('SELECT * FROM exec_log WHERE id=?',[c.id]);
    var trace=null;try{trace=JSON.parse(l.trace_json)}catch(e){}
    executeGraph({nodes:wf.nodes||[],edges:wf.edges||[],context:'',
      agentName:a.name+' (non regressione)',headless:true,replay:trace,
      seed:l.replay_seed||undefined,onEvent:function(){}
    }).then(function(res){
      var atteso=(l.status==='ok')?'ok':'error';
      var ottenuto=(res.status==='error')?'error':'ok';
      esiti.push({id:c.id,prima:atteso,dopo:ottenuto,uguale:atteso===ottenuto});
      passo(i+1);
    }).catch(function(){
      esiti.push({id:c.id,prima:l.status,dopo:'eccezione',uguale:false});
      passo(i+1);
    });
  };
  passo(0);
}

function reviewPublishedAgent(id,decision){
  var note=null;
  if(decision==='ritirato')note=prompt('Motivo del rifiuto (facoltativo):','')||null;
  if(decision==='bozza')note=prompt('Cosa va modificato? Il testo resta allegato alla richiesta:','')||null;
  dbRun('UPDATE published_agents SET status=?,review_note=? WHERE id=?',[decision,note,id]);
  var pub=dbGetOne('SELECT id FROM publications WHERE agent_id=? ORDER BY id DESC LIMIT 1',[id]);
  if(pub)dbRun('UPDATE publications SET reviewer=?,decision=?,decided_at=?,notes=? WHERE id=?',
    [profileData.name,decision,new Date().toISOString(),note,pub.id]);
  var a=dbGetOne('SELECT name,installs FROM published_agents WHERE id=?',[id]);
  var msg={pubblicato:'✅ Approvato: ora visibile nel Marketplace pubblico',
           bozza:'✏️ Riportato in bozza: l\'autore vede la richiesta di modifica',
           ritirato:'❌ Rifiutato'}[decision]||decision;
  if(decision==='pubblicato'&&a&&a.installs&&typeof addNotif==='function')
    addNotif('🆕 "'+a.name+'" ha una nuova versione approvata: '+a.installs+' installazioni interessate');
  showToast(msg);
  addAct('Revisione "'+(a?a.name:'#'+id)+'": '+decision+(note?', '+note:''));
  // Il contatore sulla voce di menu segue la decisione appena presa: se il
  // revisore sta decidendo su un proprio agente, lo vede subito.
  if(typeof aggiornaBadgePubblicazioni==='function')aggiornaBadgePubblicazioni();
  openReviewQueue();
  if(currentPage==='marketplace')renderMkt();
  if(currentPage==='myagents'&&typeof renderMyAgents==='function')renderMyAgents();
}


// ══════════════════════════════════════════
// CONNECTOR CONFIGS — campi specifici + output simulati realistici
// ══════════════════════════════════════════

function setMktSort(s){mktSort=s;renderMkt()}

// ══════════════════════════════════════════
// PYTHON CODE GENERATOR — dal canvas a script eseguibile
// ══════════════════════════════════════════

// Il numero accanto a "Marketplace" era scritto a mano nel markup: aggiungendo
// agenti al catalogo restava indietro, e il conteggio visibile contraddiceva
// la lista sottostante.
function aggiornaBadgeMarketplace(){
  var b=document.getElementById('mktBadge');
  if(b&&typeof AGENTS!=='undefined')b.textContent=AGENTS.length;
}
