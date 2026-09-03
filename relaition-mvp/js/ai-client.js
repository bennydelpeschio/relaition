function normalizeProviderName(p){
  if(p==='gpt')return 'openai';
  return p||'claude';
}

// Mistral è OpenAI-compatible: cambiano solo host e nome del modello, quindi
// riusa la stessa forma di richiesta e di risposta (choices/tool_calls).
var MISTRAL_URL='https://api.mistral.ai/v1/chat/completions';

// Gli identificativi dei modelli stanno TUTTI qui. Erano ripetuti in otto
// punti, e quando Google ha ritirato gemini-2.0-flash l'integrazione ha
// iniziato a fallire con "chiave non valida" pur avendo una chiave buona:
// il 404 sul modello veniva riportato come errore di connessione. Un solo
// punto da aggiornare quando un fornitore ritira una versione.
var AI_MODELS={
  claude:'claude-opus-5',
  openai:'gpt-4o-mini',
  // Alias mobile di Google: segue la generazione corrente senza richiedere
  // una modifica al codice a ogni ritiro.
  gemini:'gemini-flash-latest',
  mistral:'mistral-large-latest'
};
var MISTRAL_MODEL=AI_MODELS.mistral;   // retro-compatibilità

// ══════════════════════════════════════════
// MODELLI SELEZIONABILI PER FORNITORE
// ══════════════════════════════════════════
// Collegare una chiave da accesso a piu' modelli dello stesso fornitore, che
// costano e rendono in modo diverso: un'estrazione di campi non ha bisogno del
// modello piu' capace, una sintesi legale si'. La scelta e' quindi sul NODO,
// mentre la chiave resta sul fornitore — la stessa impostazione di n8n.
//
// ATTENZIONE alla manutenzione: questo elenco e' scritto nel codice, quindi
// invecchia quando un fornitore ritira una versione. E' gia' successo con
// `gemini-2.0-flash`, e il 404 sul modello arrivava all'utente come «chiave non
// valida». Dove il fornitore offre un alias mobile — Gemini — si usa quello,
// perche' segue la generazione corrente senza modifiche al codice.
//
// I modelli locali non sono qui: il loro elenco lo si chiede al server, che e'
// l'unico a sapere cosa sia installato (`discoverLocalModels`).
var AI_MODELLI_DISPONIBILI={
  claude:[
    {id:'claude-opus-5',    nome:'Claude Opus 5',    nota:'equilibrio fra capacità e costo: predefinito'},
    {id:'claude-sonnet-5',  nome:'Claude Sonnet 5',  nota:'più economico, adatto a estrazione e classificazione'},
    {id:'claude-haiku-4-5', nome:'Claude Haiku 4.5', nota:'il più rapido ed economico, per compiti semplici'},
    {id:'claude-fable-5',   nome:'Claude Fable 5',   nota:'il più capace, per ragionamento e compiti lunghi'}
  ],
  openai:[
    {id:'gpt-4o-mini',   nome:'GPT-4o mini',   nota:'economico, adatto a estrazione e classificazione'},
    {id:'gpt-4o',        nome:'GPT-4o',        nota:'più capace, per sintesi e testi lunghi'},
    {id:'gpt-4.1',       nome:'GPT-4.1',       nota:'contesto ampio, buono sui documenti lunghi'},
    {id:'gpt-4.1-mini',  nome:'GPT-4.1 mini',  nota:'contesto ampio a costo contenuto'}
  ],
  gemini:[
    // Alias mobili di Google: seguono la generazione corrente senza richiedere
    // una modifica al codice a ogni ritiro.
    {id:'gemini-flash-latest',      nome:'Gemini Flash',      nota:'veloce ed economico: predefinito'},
    {id:'gemini-pro-latest',        nome:'Gemini Pro',        nota:'più capace su compiti complessi'},
    {id:'gemini-flash-lite-latest', nome:'Gemini Flash Lite', nota:'il più rapido, per classificazioni ad alto volume'}
  ],
  mistral:[
    {id:'mistral-large-latest', nome:'Mistral Large', nota:'il più capace di Mistral'},
    {id:'mistral-small-latest', nome:'Mistral Small', nota:'economico, per compiti semplici'}
  ],
  locale:[],    // popolati da discoverLocalModels(): dipendono da cosa è installato
  custom:[]
};

// Modelli scegliibili per un fornitore. Per quello locale l'elenco arriva dal
// server stesso: quali modelli ci siano lo sa solo lui.
function modelliDelProvider(p){
  var chiave=normalizeProviderName(p);
  if(chiave==='locale'||chiave==='custom'){
    var pc=(aiConfig.providers||{})[chiave];
    var trovati=(pc&&pc.modelliDisponibili)||[];
    return trovati.map(function(m){
      return typeof m==='string'?{id:m,nome:m,nota:''}:m;
    });
  }
  return AI_MODELLI_DISPONIBILI[chiave]||[];
}

// Il modello effettivo di un nodo: quello scelto, se è fra i validi per il
// fornitore risolto; altrimenti il predefinito. Un modello scelto per Claude
// non può essere inviato a Gemini, che risponderebbe 404.
function modelloEffettivo(provider,scelto){
  var p=normalizeProviderName(provider);
  var elenco=modelliDelProvider(p);
  if(scelto&&elenco.some(function(m){return m.id===scelto}))return scelto;
  var pc=(aiConfig.providers||{})[p];
  if(p==='locale'||p==='custom')return (pc&&pc.model)||scelto||'';
  return AI_MODELS[p]||'';
}

// ── MODELLI IN LOCALE ──
// Ollama, LM Studio, LocalAI e Jan espongono tutti un'API OpenAI-compatible
// sotto /v1: cambia solo la porta. Quello che NON hanno in comune è il nome
// del modello installato, che quindi si scopre interrogando il server invece
// di farlo digitare a memoria.
var LOCAL_PRESETS={
  ollama:  {url:'http://localhost:11434', lab:'Ollama',
            aiuto:'Ollama blocca per impostazione predefinita le chiamate dal browser. Imposta la variabile d\'ambiente OLLAMA_ORIGINS=* e riavvia Ollama.'},
  lmstudio:{url:'http://localhost:1234',  lab:'LM Studio',
            aiuto:'In LM Studio apri la scheda "Local Server", avvia il server e attiva CORS nelle sue impostazioni.'},
  localai: {url:'http://localhost:8080',  lab:'LocalAI', aiuto:'Verifica che LocalAI sia avviato e raggiungibile sulla porta indicata.'},
  jan:     {url:'http://localhost:1337',  lab:'Jan',     aiuto:'In Jan attiva il Local API Server dalle impostazioni.'},
  altro:   {url:'',                       lab:'Server locale', aiuto:'Verifica indirizzo, porta e che il server accetti richieste dal browser (CORS).'}
};

function localeBase(){
  var pc=(aiConfig.providers&&aiConfig.providers.locale)||{};
  var u=(pc.baseUrl||'').trim().replace(/\/+$/,'');
  if(!u)return '';
  return /\/v1$/.test(u)?u:u+'/v1';
}

function geminiUrl(key,model){
  return 'https://generativelanguage.googleapis.com/v1beta/models/'+(model||AI_MODELS.gemini)+':generateContent?key='+encodeURIComponent(key);
}

// Un errore del fornitore va letto per quello che è: chiave rifiutata,
// credito esaurito, modello ritirato e limite di frequenza richiedono
// all'utente azioni completamente diverse. Prima finivano tutti nello stesso
// messaggio "non connesso", che non diceva cosa fare.
function aiErrorHint(status,data,provider){
  var msg=(data&&data.error&&(data.error.message||data.error.status))||(data&&data.message)||'';
  var base=String(msg).substring(0,140);
  if(status===401||status===403||/api key not valid|invalid_api_key|unauthorized/i.test(msg))
    return {tipo:'chiave',testo:'Chiave rifiutata da '+providerLabel(provider)+': controlla di averla copiata per intero e che sia attiva. '+base};
  if(status===429&&/quota|credit|billing/i.test(msg))
    return {tipo:'credito',testo:'Chiave valida, ma il piano '+providerLabel(provider)+' non ha credito residuo: aggiungi credito nella console del fornitore. '+base};
  if(status===429)
    return {tipo:'frequenza',testo:'Troppe richieste verso '+providerLabel(provider)+': riprova tra qualche secondo. '+base};
  if(status===404||/not found|is not supported|deprecated/i.test(msg))
    return {tipo:'modello',testo:'Il modello "'+(AI_MODELS[provider]||'?')+'" non è più disponibile su '+providerLabel(provider)+': aggiorna AI_MODELS in js/ai-client.js. '+base};
  return {tipo:'altro',testo:base||('HTTP '+status)};
}

// Mostrato nel pannello del singolo nodo AI: dice subito se il provider
// scelto per QUEL nodo ha una key testata con successo, senza dover aprire
// il pannello AI globale per scoprirlo.
function aiProviderStatusHint(model){
  var p=normalizeProviderName(model);
  var pc=aiConfig.providers&&aiConfig.providers[p];
  if(pc&&pc.status==='ok')return '✅ '+providerLabel(p)+' configurato e pronto per questo nodo';
  if(pc&&pc.status==='err')return '❌ '+providerLabel(p)+' configurato ma non connesso: testa di nuovo la key nel pannello AI';
  return '⚠️ '+providerLabel(p)+' non ancora configurato: apri il pannello AI a sinistra e testa una API key per questo provider (esecuzione in demo mode nel frattempo)';
}

function providerLabel(p){
  return {claude:'Claude',openai:'OpenAI',gemini:'Gemini',mistral:'Mistral',locale:'Modello in locale',custom:'Custom/Open source'}[normalizeProviderName(p)]||p;
}

// Ogni provider ricorda la propria key/stato indipendentemente da quale sia
// selezionato nel dropdown: cambiare provider nel pannello non fa perdere le
// key già testate degli altri.
function saveCurrentProviderDraft(){
  var p=aiConfig.provider;
  var pc=aiConfig.providers[p]||(aiConfig.providers[p]={key:'',status:'idle'});
  pc.key=document.getElementById('aiKeyInput').value.trim();
  if(p==='custom'){
    pc.customUrl=(document.getElementById('customAIUrl').value.trim()||'').replace(/\/+$/,'');
    pc.customModel=document.getElementById('customAIModel').value.trim()||'gpt-4o-mini';
  }
  if(p==='locale'){
    var u=document.getElementById('localeUrl'),m=document.getElementById('localeModel'),pr=document.getElementById('localePreset');
    if(u)pc.baseUrl=u.value.trim().replace(/\/+$/,'');
    if(m)pc.model=m.value;
    if(pr)pc.preset=pr.value;
  }
}

function onLocalePresetChange(){
  var pr=document.getElementById('localePreset').value;
  var def=LOCAL_PRESETS[pr];
  if(def&&def.url)document.getElementById('localeUrl').value=def.url;
  aiConfig.providers.locale.preset=pr;
  saveCurrentProviderDraft();
  // Cambiando server cambiano i modelli disponibili: quelli di prima non
  // valgono più, e lasciarli in elenco sarebbe fuorviante.
  var sel=document.getElementById('localeModel');
  if(sel)sel.innerHTML='<option value="">— premi 🔄 per cercare i modelli —</option>';
}

// Interroga il server locale per sapere quali modelli sono davvero
// installati: farli digitare a memoria è la prima causa di "non funziona",
// perché il nome esatto (es. "llama3.1:8b") raramente si ricorda.
async function discoverLocalModels(){
  saveCurrentProviderDraft();
  var st=document.getElementById('aiStatus');
  var base=localeBase();
  if(!base){st.innerHTML='<span class="ai-dot err"></span> Indica l\'indirizzo del server locale';return}
  st.innerHTML='<span class="ai-dot running"></span> Cerco i modelli su '+base+'…';
  try{
    var r=await fetch(base+'/models');
    var d=await r.json();
    var elenco=(d.data||d.models||[]).map(function(m){return m.id||m.name}).filter(Boolean);
    var sel=document.getElementById('localeModel');
    if(!elenco.length){
      sel.innerHTML='<option value="">— nessun modello installato —</option>';
      st.innerHTML='<span class="ai-dot err"></span> Server raggiunto ma nessun modello installato: scaricane uno (es. <code>ollama pull llama3.1</code>)';
      return;
    }
    var attuale=aiConfig.providers.locale.model;
    sel.innerHTML=elenco.map(function(m){return '<option'+(m===attuale?' selected':'')+'>'+escHtml(m)+'</option>'}).join('');
    aiConfig.providers.locale.model=sel.value;
    st.innerHTML='<span class="ai-dot ok"></span> '+elenco.length+' modelli trovati: premi Test per verificare la generazione';
    showToast('💻 '+elenco.length+' modelli locali trovati');
  }catch(e){
    var pr=LOCAL_PRESETS[aiConfig.providers.locale.preset]||LOCAL_PRESETS.altro;
    // Un errore di rete verso localhost è quasi sempre CORS o server spento:
    // dirlo con l'azione concreta evita il giro di tentativi alla cieca.
    st.innerHTML='<span class="ai-dot err"></span> ❌ Non raggiungibile. '+escHtml(pr.aiuto);
    showToast('❌ Server locale non raggiungibile: '+pr.aiuto);
  }
}

function loadProviderIntoUI(p){
  var pc=aiConfig.providers[p]||(aiConfig.providers[p]={key:'',status:'idle'});
  document.getElementById('aiKeyInput').value=pc.key||'';
  if(p==='custom'){
    document.getElementById('customAIUrl').value=pc.customUrl||'';
    document.getElementById('customAIModel').value=pc.customModel||'';
  }
  if(p==='locale'){
    var u=document.getElementById('localeUrl'),pr=document.getElementById('localePreset'),m=document.getElementById('localeModel');
    if(pr)pr.value=pc.preset||'ollama';
    if(u)u.value=pc.baseUrl||(LOCAL_PRESETS[pc.preset||'ollama']||{}).url||'';
    if(m&&pc.model)m.innerHTML='<option selected>'+escHtml(pc.model)+'</option>';
  }
  // mirror per retro-compatibilità (export Python, chat builder, ecc.)
  aiConfig.key=pc.key||'';aiConfig.status=pc.status||'idle';
  aiConfig.customUrl=pc.customUrl||'';aiConfig.customModel=pc.customModel||'';
  var st=document.getElementById('aiStatus');
  if(pc.status==='ok')st.innerHTML='<span class="ai-dot ok"></span> ✅ '+providerLabel(p)+' connesso';
  else if(pc.status==='err')st.innerHTML='<span class="ai-dot err"></span> ❌ '+providerLabel(p)+' non connesso';
  else st.innerHTML='<span class="ai-dot idle"></span> Non configurato';
}

function onAIProviderChange(){
  saveCurrentProviderDraft();
  aiConfig.provider=document.getElementById('aiProvider').value;
  var ph={claude:'sk-ant-api03-...',openai:'sk-proj-...',gemini:'AIzaSy...',mistral:'Chiave API Mistral (La Plateforme)',locale:'Non serve alcuna chiave',custom:'API key (o vuoto per endpoint locali)'}[aiConfig.provider];
  document.getElementById('aiKeyInput').placeholder=ph||'API key';
  // Un modello locale non richiede credenziali: lasciare il campo attivo
  // suggerirebbe che ne serva una.
  document.getElementById('aiKeyInput').disabled=aiConfig.provider==='locale';
  document.getElementById('customAIFields').style.display=aiConfig.provider==='custom'?'block':'none';
  document.getElementById('localeAIFields').style.display=aiConfig.provider==='locale'?'block':'none';
  document.getElementById('openaiProxyField').style.display=aiConfig.provider==='openai'?'block':'none';
  loadProviderIntoUI(aiConfig.provider);
}

// Scrive esito/valori sia nel record del provider (usato dai singoli nodi
// AI in esecuzione) sia nei campi top-level di aiConfig (retro-compatibilità
// con export Python e chat builder, che leggono "il provider attivo").
function commitProviderStatus(p,status,extra){
  // Ogni cambiamento di stato viene riversato nella sessione: cosi' un
  // ricaricamento non azzera una configurazione appena verificata.
  var pc=aiConfig.providers[p]||(aiConfig.providers[p]={key:'',status:'idle'});
  pc.status=status;
  if(extra)Object.assign(pc,extra);
  if(p===aiConfig.provider){
    aiConfig.status=status;
    if(extra)Object.assign(aiConfig,extra);
  }
  // Lo stato di un fornitore governa il pulsante Genera, il suggerimento sui
  // nodi AI e il pallino della barra chat. Prima l'aggiornamento avveniva solo
  // dentro b_render(), che scatta al primo movimento sul canvas: dopo un test
  // riuscito il pulsante restava bloccato finché non si toccava qualcosa, e
  refreshStatoAI();
  if(typeof salvaProviderInSessione==='function')salvaProviderInSessione();
}

// Rinfresca tutto ciò che dipende dallo stato dei fornitori. Chiamata da un
// punto solo, così non serve ricordarsene a ogni cambio di stato.
function refreshStatoAI(){
  // La pastiglia del pannello va tenuta allineata allo stato reale: dopo il
  // ripristino di una sessione diceva ancora "Non configurato" pur avendo un
  // fornitore collegato, e chi legge reinserisce la chiave credendola persa.
  var st=document.getElementById('aiStatus');
  if(st){
    var p=normalizeProviderName(aiConfig.provider);
    var pc=(aiConfig.providers||{})[p];
    if(pc&&pc.status==='ok')
      st.innerHTML='<span class="ai-dot ok"></span> \u2705 '+escHtml(providerLabel(p))+' collegato'+
        (typeof modelloEffettivo==='function'?' \u00b7 '+escHtml(modelloEffettivo(p,null)):'');
    else if(pc&&pc.status==='err')
      st.innerHTML='<span class="ai-dot err"></span> \u274c '+escHtml(providerLabel(p))+' non collegato';
    else
      st.innerHTML='<span class="ai-dot idle"></span> Non configurato';
  }
  // Il campo chiave mostra che una chiave c'e', senza rivelarla.
  var inp=document.getElementById('aiKeyInput');
  if(inp&&!inp.value){
    var pcc=(aiConfig.providers||{})[normalizeProviderName(aiConfig.provider)];
    if(pcc&&pcc.status==='ok'&&pcc.key)inp.value=pcc.key;
  }
  if(typeof updateChatBuilderGate==='function')updateChatBuilderGate();
  if(typeof currentPage!=='undefined'&&currentPage==='builder'){
    if(typeof b_render==='function')b_render();
    // Il pannello proprietà mostra se il fornitore scelto su QUEL nodo è
    // collegato: va ridisegnato anche lui.
    if(typeof renderProps==='function'&&typeof B!=='undefined'&&B.selId>0)renderProps(B.selId);
  }
}

async function testAIKey(){
  var key=document.getElementById('aiKeyInput').value.trim();
  var st=document.getElementById('aiStatus');
  var provider=aiConfig.provider;

  if(provider==='custom'){
    var customUrl=(document.getElementById('customAIUrl').value.trim()||'').replace(/\/+$/,'');
    var customModel=document.getElementById('customAIModel').value.trim()||'gpt-4o-mini';
    if(!customUrl){st.innerHTML='<span class="ai-dot err"></span> Inserisci il Base URL';return}
    commitProviderStatus(provider,'idle',{key:key,customUrl:customUrl,customModel:customModel});
    st.innerHTML='<span class="ai-dot running"></span> Verifica endpoint...';
    var t0=Date.now();
    try{
      var headers={'Content-Type':'application/json'};
      if(key)headers['Authorization']='Bearer '+key;
      var resp=await fetch(customUrl+'/chat/completions',{method:'POST',headers:headers,
        body:JSON.stringify({model:customModel,max_tokens:5,messages:[{role:'user',content:'ok'}]})});
      var data=await resp.json();
      if(resp.ok&&data.choices){
        commitProviderStatus(provider,'ok');
        st.innerHTML='<span class="ai-dot ok"></span> ✅ Connesso ('+(Date.now()-t0)+'ms): '+customModel;
        showToast('✅ Endpoint custom verificato con chiamata reale');
      }else{
        commitProviderStatus(provider,'err');
        st.innerHTML='<span class="ai-dot err"></span> ❌ '+((data.error&&data.error.message)||'HTTP '+resp.status).substring(0,60);
      }
    }catch(e){
      commitProviderStatus(provider,'err');
      st.innerHTML='<span class="ai-dot err"></span> ❌ Non raggiungibile: '+e.message.substring(0,50);
    }
    return;
  }

  // Modello in locale: nessuna chiave, ma indirizzo e modello sono
  // indispensabili. Il test è una generazione vera, non un ping.
  if(provider==='locale'){
    saveCurrentProviderDraft();
    var pcL=aiConfig.providers.locale;
    var base=localeBase();
    if(!base){st.innerHTML='<span class="ai-dot err"></span> Indica l\'indirizzo del server locale';return}
    if(!pcL.model){st.innerHTML='<span class="ai-dot err"></span> Scegli un modello: premi 🔄 per cercare quelli installati';return}
    st.innerHTML='<span class="ai-dot running"></span> Generazione di prova su '+escHtml(pcL.model)+'…';
    var tL=Date.now();
    try{
      var rL=await fetch(base+'/chat/completions',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:pcL.model,max_tokens:8,messages:[{role:'user',content:'Rispondi con la sola parola: ok'}]})
      });
      var dL=await rL.json();
      if(rL.ok&&dL.choices&&dL.choices[0]){
        commitProviderStatus('locale','ok');
        st.innerHTML='<span class="ai-dot ok"></span> ✅ '+escHtml(pcL.model)+' risponde ('+(Date.now()-tL)+'ms): nessun dato esce dal computer';
        showToast('✅ Modello locale "'+pcL.model+'" verificato con una generazione reale');
      }else{
        commitProviderStatus('locale','err');
        var mL=(dL.error&&(dL.error.message||dL.error))||('HTTP '+rL.status);
        st.innerHTML='<span class="ai-dot err"></span> ❌ '+escHtml(String(mL).substring(0,110));
        showToast('❌ Modello locale: '+String(mL).substring(0,120));
      }
    }catch(eL){
      commitProviderStatus('locale','err');
      var prL=LOCAL_PRESETS[pcL.preset]||LOCAL_PRESETS.altro;
      st.innerHTML='<span class="ai-dot err"></span> ❌ Non raggiungibile. '+escHtml(prL.aiuto);
      showToast('❌ '+prL.aiuto);
    }
    return;
  }

  if(!key){st.innerHTML='<span class="ai-dot err"></span> Inserisci una API key';return}
  commitProviderStatus(provider,'idle',{key:key});
  st.innerHTML='<span class="ai-dot running"></span> Chiamata API di verifica...';
  var t0=Date.now();

  // La verifica usa lo STESSO modello che l'esecuzione userà davvero: se il
  // fornitore lo ritira, il test deve accorgersene qui e non al primo Run.
  try{
    var resp,data,ok=false,dettaglio='';
    if(provider==='claude'){
      resp=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({model:AI_MODELS.claude,max_tokens:5,messages:[{role:'user',content:'ok'}]})
      });
      data=await resp.json();
      ok=resp.ok&&!!data.content;
    }else if(provider==='gemini'){
      resp=await fetch(geminiUrl(key),{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{parts:[{text:'ok'}]}],generationConfig:{maxOutputTokens:5}})
      });
      data=await resp.json();
      ok=resp.ok&&!!data.candidates;
    }else{
      // OpenAI e Mistral condividono forma di richiesta e di risposta.
      resp=await fetch(provider==='mistral'?MISTRAL_URL:openaiUrl(),{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body:JSON.stringify({model:AI_MODELS[provider],max_tokens:5,messages:[{role:'user',content:'ok'}]})
      });
      data=await resp.json();
      ok=resp.ok&&!!data.choices;
      if(ok&&data.model)dettaglio=': '+data.model;
    }
    if(ok){
      commitProviderStatus(provider,'ok');
      st.innerHTML='<span class="ai-dot ok"></span> ✅ '+providerLabel(provider)+' connesso ('+(Date.now()-t0)+'ms)'+escHtml(dettaglio);
      showToast('✅ Connessione a '+providerLabel(provider)+' verificata con chiamata reale');
    }else{
      var h=aiErrorHint(resp.status,data,provider);
      // Il credito esaurito NON è una chiave sbagliata: lo stato resta
      // distinto, altrimenti l'utente cambia chiave inseguendo il problema
      // sbagliato — che è esattamente quello che succedeva.
      commitProviderStatus(provider,'err',{errorKind:h.tipo});
      st.innerHTML='<span class="ai-dot err"></span> ❌ '+escHtml(h.testo.substring(0,120));
      showToast('❌ '+providerLabel(provider)+': '+escHtml(h.testo.substring(0,160)));
    }
  }catch(e){
    commitProviderStatus(provider,'err');
    // Nota: api.openai.com risponde all'OPTIONS di preflight con
    // Access-Control-Allow-Origin, quindi le chiamate dal browser passano.
    // Un fallimento di rete qui è connettività, proxy aziendale o blocco
    // dell'estensione — non più il CORS di OpenAI.
    if(e.message.indexOf('fetch')>=0){
      st.innerHTML='<span class="ai-dot err"></span> ❌ Endpoint non raggiungibile (rete o CORS): <span style="text-decoration:underline;cursor:pointer" onclick="openConnectionGuide()">guida</span>';
    }else{
      st.innerHTML='<span class="ai-dot err"></span> ❌ Errore: '+e.message.substring(0,50);
    }
  }
}

// ══════════════════════════════════════════
// CAPACITÀ PER FORNITORE
// Nessuna capacità mancante deve impedire l'esecuzione: il comportamento
// degrada, ma in modo esplicito e registrato in traccia (mai silenzioso).
// Versione minimale a servizio dei blocchi B2/B3; il blocco E la estende.
// ══════════════════════════════════════════
var PROVIDER_CAPS={
  claude:{toolCalling:true, structuredOutput:true,  streaming:true,  vision:true,  note:'Output vincolato tramite strumento dedicato'},
  openai:{toolCalling:true, structuredOutput:true,  streaming:true,  vision:true,  note:'response_format json_schema nativo'},
  gemini:{toolCalling:true, structuredOutput:true,  streaming:true,  vision:true,  note:'responseSchema nativo'},
  // I modelli Mistral testuali non elaborano immagini: la capacità manca ed è
  // dichiarata, così la degradazione resta esplicita in traccia.
  mistral:{toolCalling:true, structuredOutput:true,  streaming:true,  vision:false, note:'API OpenAI-compatible; nessuna analisi di immagini'},
  // Le capacità dipendono dal modello scaricato, non dal server: si dichiara
  // il minimo garantito, e ciò che manca degrada in modo tracciato.
  locale: {toolCalling:false,structuredOutput:false, streaming:true,  vision:false, note:'Capacità dipendenti dal modello installato: si assume il minimo e si degrada in modo tracciato'},
  custom:{toolCalling:false,structuredOutput:false, streaming:false, vision:false, note:'Endpoint OpenAI-compatible: capacità non garantite, si ripiega sul prompt'}
};
function providerCapabilities(model){
  return PROVIDER_CAPS[normalizeProviderName(model)] || PROVIDER_CAPS.custom;
}

// ══════════════════════════════════════════
// TOOL CALLING (B2)
// Gli schemi degli strumenti vengono trasmessi col formato nativo del
// fornitore. Il modello sceglie se e quale invocare; il runtime intercetta
// la richiesta, la esegue e gli restituisce l'esito.
//
// Senza chiave configurata la scelta è simulata in modo deterministico e
// dichiarata come tale (`demo:true`) — la traccia distingue sempre "il
// modello ha scelto" da "abbiamo simulato la scelta".
// ══════════════════════════════════════════
async function callAIWithTools(prompt,systemPrompt,config,tools){
  var provider=normalizeProviderName(config&&config.model?config.model:aiConfig.provider);
  var idModello=modelloEffettivo(provider,config&&config.modelId);
  var pc=aiConfig.providers[provider];
  var caps=providerCapabilities(provider);

  if(!pc||pc.status!=='ok'||!caps.toolCalling||!tools||!tools.length){
    var base=await callAI(prompt,systemPrompt,config);
    // Simulazione deterministica: il primo strumento disponibile viene
    // invocato una sola volta, così la demo mostra il ciclo completo anche
    // senza credenziali. Marcata come simulata.
    if(tools&&tools.length&&!(config&&config._toolSimDone)){
      if(config)config._toolSimDone=true;
      return { text:base.text, demo:true,
               toolCall:{ name:tools[0].name, nodeId:tools[0].nodeId, args:{},
                          reason:'scelta simulata: nessuna chiave configurata per '+providerLabel(provider) } };
    }
    if(config)delete config._toolSimDone;
    return base;
  }

  try{
    if(provider==='claude'){
      var r=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':pc.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        signal:(config&&config.signal)||undefined,
        body:JSON.stringify({model:idModello,max_tokens:(config&&config.maxtokens)||1024,
          system:systemPrompt,messages:[{role:'user',content:prompt}],
          temperature:config?config.temperature:0.7,
          tools:tools.map(function(t){return {name:t.name,description:t.description,input_schema:t.input_schema}})})
      });
      var d=await r.json();
      var tu=(d.content||[]).find(function(c){return c.type==='tool_use'});
      if(tu){
        var match=tools.find(function(t){return t.name===tu.name});
        return { text:'', toolCall:{ name:tu.name, nodeId:match?match.nodeId:null, args:tu.input||{}, reason:'scelto dal modello' } };
      }
      var tx=(d.content||[]).filter(function(c){return c.type==='text'}).map(function(c){return c.text}).join('');
      return { text:tx||JSON.stringify(d.error||d), demo:false };
    }
    if(provider==='openai'||provider==='mistral'){
      var r2=await fetch(provider==='mistral'?MISTRAL_URL:openaiUrl(),{
        method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+pc.key},
        signal:(config&&config.signal)||undefined,
        body:JSON.stringify({model:idModello,
          messages:[{role:'system',content:systemPrompt},{role:'user',content:prompt}],
          temperature:config?config.temperature:0.7,max_tokens:(config&&config.maxtokens)||1024,
          tools:tools.map(function(t){return {type:'function',function:{name:t.name,description:t.description,parameters:t.input_schema}}})})
      });
      var d2=await r2.json();
      var m2=d2.choices&&d2.choices[0]&&d2.choices[0].message;
      if(m2&&m2.tool_calls&&m2.tool_calls.length){
        var tc=m2.tool_calls[0], mt=tools.find(function(t){return t.name===tc.function.name});
        var args={};try{args=JSON.parse(tc.function.arguments||'{}')}catch(e){}
        return { text:'', toolCall:{ name:tc.function.name, nodeId:mt?mt.nodeId:null, args:args, reason:'scelto dal modello' } };
      }
      return { text:(m2&&m2.content)||JSON.stringify(d2.error||d2), demo:false };
    }
    if(provider==='gemini'){
      var r3=await fetch(geminiUrl(pc.key,idModello),{
        method:'POST',headers:{'Content-Type':'application/json'},
        signal:(config&&config.signal)||undefined,
        body:JSON.stringify({contents:[{parts:[{text:(systemPrompt?systemPrompt+'\n\n':'')+prompt}]}],
          generationConfig:{temperature:config?config.temperature:0.7,maxOutputTokens:(config&&config.maxtokens)||1024},
          tools:[{functionDeclarations:tools.map(function(t){return {name:t.name,description:t.description,parameters:t.input_schema}})}]})
      });
      var d3=await r3.json();
      var parts=(d3.candidates&&d3.candidates[0]&&d3.candidates[0].content&&d3.candidates[0].content.parts)||[];
      var fc=parts.find(function(p){return p.functionCall});
      if(fc){
        var mt3=tools.find(function(t){return t.name===fc.functionCall.name});
        return { text:'', toolCall:{ name:fc.functionCall.name, nodeId:mt3?mt3.nodeId:null, args:fc.functionCall.args||{}, reason:'scelto dal modello' } };
      }
      return { text:parts.map(function(p){return p.text||''}).join('')||JSON.stringify(d3.error||d3), demo:false };
    }
  }catch(e){
    if(e.name==='AbortError')return { text:'Chiamata interrotta dall\'utente', demo:false, aborted:true };
    return { text:'Errore di rete durante il tool calling: '+e.message, demo:false };
  }
  return await callAI(prompt,systemPrompt,config);
}

// Real AI call function (for production use)

async function callAIUnaVolta(prompt,systemPrompt,config){
  // Il provider è quello scelto SUL NODO (config.model): questo è ciò che
  // rende la piattaforma davvero agnostica — nodi diversi nello stesso
  // workflow possono usare Claude, OpenAI, Gemini o un endpoint open source
  // in parallelo, ciascuno con la propria key testata nel pannello AI.
  var provider=normalizeProviderName(config&&config.model?config.model:aiConfig.provider);
  // Modello scelto sul nodo, se valido per questo fornitore. Un identificativo
  // scelto per Claude non può essere inviato a Gemini: risponderebbe 404, e
  // l'errore parlerebbe di modello inesistente invece che di scelta incoerente.
  var idModello=modelloEffettivo(provider,config&&config.modelId);
  var pc=aiConfig.providers[provider];
  if(!pc||pc.status!=='ok'){
    return {text:'[Demo] Provider "'+providerLabel(provider)+'" non configurato per questo nodo. Apri il pannello AI a sinistra, seleziona '+providerLabel(provider)+' e testa la tua API key.',demo:true};
  }
  try{
    if(provider==='claude'){
      var resp=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':pc.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        signal:(config&&config.signal)||undefined,
        body:JSON.stringify({model:idModello,max_tokens:(config&&config.maxtokens)||1024,system:systemPrompt||'You are a helpful assistant.',messages:[{role:'user',content:prompt}],temperature:config?config.temperature:0.7})
      });
      var data=await resp.json();
      if(data.content&&data.content[0])return{text:data.content[0].text,demo:false,truncated:data.stop_reason==='max_tokens'};
      return{text:aiErrorHint(resp.status,data,provider).testo,demo:false,error:true};
    }else if(provider==='openai'||provider==='mistral'||provider==='locale'){
      // Stessa forma di richiesta per tutti e tre: cambiano solo l'indirizzo,
      // il nome del modello e la presenza della credenziale.
      var url=provider==='mistral'?MISTRAL_URL:provider==='locale'?(localeBase()+'/chat/completions'):openaiUrl();
      var hh={'Content-Type':'application/json'};
      if(provider!=='locale')hh['Authorization']='Bearer '+pc.key;
      var resp=await fetch(url,{
        method:'POST',
        headers:hh,
        signal:(config&&config.signal)||undefined,
        body:JSON.stringify({model:idModello,messages:[{role:'system',content:systemPrompt||'You are a helpful assistant.'},{role:'user',content:prompt}],temperature:config?config.temperature:0.7,max_tokens:(config&&config.maxtokens)||1024})
      });
      var data=await resp.json();
      if(data.choices&&data.choices[0])return{text:data.choices[0].message.content,demo:false,truncated:data.choices[0].finish_reason==='length'};
      return{text:aiErrorHint(resp.status,data,provider).testo,demo:false,error:true};
    }else if(provider==='gemini'){
      var resp=await fetch(geminiUrl(pc.key,idModello),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        signal:(config&&config.signal)||undefined,
        body:JSON.stringify({contents:[{parts:[{text:(systemPrompt?systemPrompt+'\n\n':'')+prompt}]}],generationConfig:{temperature:config?config.temperature:0.7,maxOutputTokens:(config&&config.maxtokens)||1024}})
      });
      var data=await resp.json();
      var cand=data.candidates&&data.candidates[0];
      if(cand){
        // I modelli recenti restituiscono più parti (ragionamento + risposta):
        // leggere solo parts[0].text restituiva testo vuoto o parziale.
        var parti=(cand.content&&cand.content.parts)||[];
        var testo=parti.map(function(p){return p.text||''}).join('');
        return{text:testo,demo:false,truncated:cand.finishReason==='MAX_TOKENS'};
      }
      return{text:aiErrorHint(resp.status,data,provider).testo,demo:false,error:true};
    }
    else if(provider==='custom'){
      var headers={'Content-Type':'application/json'};
      if(pc.key)headers['Authorization']='Bearer '+pc.key;
      var resp=await fetch(pc.customUrl+'/chat/completions',{
        method:'POST',headers:headers,
        body:JSON.stringify({model:pc.customModel,messages:[{role:'system',content:systemPrompt||'You are a helpful assistant.'},{role:'user',content:prompt}],temperature:config?config.temperature:0.7,max_tokens:(config&&config.maxtokens)||1024})
      });
      var data=await resp.json();
      if(data.choices&&data.choices[0])return{text:data.choices[0].message.content,demo:false};
      return{text:'Endpoint custom: '+JSON.stringify(data.error||data).substring(0,200),demo:false,error:true};
    }
  }catch(e){
    // Un'interruzione voluta non è un guasto: non va marcata come errore,
    // altrimenti il flusso fermato risulterebbe fallito.
    if(e.name==='AbortError')return{text:'Chiamata interrotta dall\'utente',demo:false,aborted:true};
    return{text:'Errore di rete verso '+providerLabel(provider)+': '+e.message,demo:false,error:true};
  }
  return{text:'Provider non supportato',demo:true};
}

// ── EXECUTION ENGINE ──

// Riconosce l'intento "ricomincia da zero" anche a canvas pieno
function isFromScratchRequest(desc){
  return /\b(da zero|ricomincia|ricrea (da capo|tutto)|nuovo workflow( completo)?|cancella tutto e crea|pulisci( il canvas)? e crea|butta via tutto)\b/i.test(desc);
}
// La barra chat è AI-only (Blocco G): la composizione, l'interpretazione e
// l'anteprima vivono in chat-compose.js. Qui resta solo l'orchestrazione —
// gate sul provider, scelta della modalità, gestione del pulsante.
async function aiGenerateWorkflow(){
  var input=document.getElementById('chatBuilderInput');
  var btn=document.getElementById('chatBuilderBtn');
  var desc=input.value.trim();
  if(!desc){showToast('⚠️ Descrivi cosa vuoi creare o modificare');return}

  var prov=anyProviderReady();
  if(!prov){
    showToast('🔌 Il builder conversazionale richiede un provider AI: configuralo e testalo nel pannello a sinistra');
    updateChatBuilderGate();
    return;
  }

  var forceScratch=isFromScratchRequest(desc);
  // Se un nodo è selezionato sul canvas e non è stato chiesto un reset,
  // l'utente sta chiedendo di modificare QUEL componente, non l'intero workflow.
  var targetNodeId=(!forceScratch&&B.selId>0)?B.selId:null;
  if(targetNodeId){
    await aiModifySingleNode(targetNodeId,desc,btn,input,prov);
    return;
  }

  var isModify=B.nodes.length>0&&!forceScratch;
  ccLastRequest=desc;
  btn.dataset.busy='1';btn.disabled=true;btn.textContent=isModify?'Analizzo...':'Genero...';
  showComposeWaiting(isModify);
  var plan;
  try{
    plan=await composePlan(desc,isModify,prov);
  }catch(e){
    plan={error:'Errore durante la composizione: '+e.message};
  }
  delete btn.dataset.busy;btn.disabled=false;btn.textContent='Genera';

  if(plan.error){
    showComposeError(plan.error);
    return;
  }
  // Nulla tocca il canvas prima che l'utente abbia visto l'interpretazione e
  // l'elenco delle modifiche (G3, G7).
  previewChanges(plan);
}




// ══════════════════════════════════════════
// MODIFICA SINGOLO NODO — quando l'utente ha un nodo selezionato
// sul canvas, la chat non tocca il resto del workflow
// ══════════════════════════════════════════

async function aiModifySingleNode(nodeId,desc,btn,input,prov){
  var node=B.nodes.find(function(n){return n.id===nodeId});
  if(!node){showToast('⚠️ Nodo non trovato: deseleziona e riprova');return}
  if(!prov)prov=anyProviderReady();
  if(!prov){showToast('🔌 Il builder conversazionale richiede un provider AI configurato');return}
  btn.dataset.busy='1';btn.disabled=true;btn.textContent='Modifico...';

  var sysPrompt='Sei l\'assistente del builder RelAItion. L\'utente vuole modificare UN SOLO nodo del workflow (non l\'intero flusso). '+
    'Restituisci SOLO JSON valido, niente markdown: {"interpretazione":"come hai capito la richiesta","n":"nome breve","d":"descrizione breve","config":{...}}. '+
    'In "config" indica SOLO i campi che cambiano: gli altri vengono conservati. Max 20 caratteri per "n", max 30 per "d".';
  var userPrompt='NODO ATTUALE (tipo "'+node.type+'", nome "'+node.name+'"): '+JSON.stringify({n:node.name,d:node.detail,config:node.config||{}})+
    '\n\nMODIFICA RICHIESTA: '+desc;
  var result=await callAI(userPrompt,sysPrompt,{temperature:0.2,model:prov});
  delete btn.dataset.busy;btn.disabled=false;btn.textContent='Genera';

  if(result.demo){showToast('⚠️ Provider AI non raggiungibile: '+result.text);return}
  var parsed=ccParseJson(result.text);
  if(!parsed){
    // Senza ripiego euristico: una modifica non compresa non deve produrre un
    // cambiamento arbitrario sul nodo che l'utente aveva già configurato.
    showToast('⚠️ Il modello non ha restituito una modifica leggibile: riformula la richiesta');
    return;
  }
  // Anche la modifica di un singolo nodo passa dall'anteprima: stessa regola
  // di trasparenza del resto della composizione conversazionale.
  var op={op:'update',id:nodeId,n:parsed.n,d:parsed.d,config:parsed.config,perche:'richiesta: '+desc};
  previewChanges({mode:'modify',interpretation:parsed.interpretazione||('Modifica del solo nodo "'+node.name+'"'),ops:[op]});
  if(input)input.value='';
}


// ══════════════════════════════════════════
// NEW BLANK AGENT — crea da zero
// ══════════════════════════════════════════

function openaiUrl(){
  var proxy=(document.getElementById('openaiProxyUrl')&&document.getElementById('openaiProxyUrl').value.trim())||'';
  if(proxy){
    if(!/\/$/.test(proxy))proxy+='/';
    return proxy+'https://api.openai.com/v1/chat/completions';
  }
  return 'https://api.openai.com/v1/chat/completions';
}

function openConnectionGuide(){
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>ℹ️ Guida connessione AI</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<div class="lesson-content" style="border:none;padding:0;margin-top:12px">'+
    '<h3>Perché "Failed to fetch"?</h3>'+
    '<p>I browser bloccano le chiamate verso API che non autorizzano esplicitamente le richieste da pagine web (<strong>CORS</strong>). Non è un problema della tua key: è il server del provider che rifiuta chiamate dirette dal browser.</p>'+
    '<div class="concept-box">✅ <strong>Funzionano direttamente dal browser:</strong><br>· <strong>Anthropic Claude</strong>: supporto ufficiale via header dedicato (consigliato per la demo)<br>· <strong>Google Gemini</strong>, funziona con key nell\'URL<br>· <strong>Ollama locale</strong>, provider Custom con base URL <code>http://localhost:11434/v1</code> (avvia con <code>OLLAMA_ORIGINS=* ollama serve</code>)</div>'+
    '<div class="warning-box">❌ <strong>OpenAI blocca le chiamate browser-direct.</strong> La key funziona da server/terminale ma non da una pagina web. Due soluzioni:</div>'+
    '<h3>Soluzione 1: Proxy locale (2 minuti)</h3>'+
    '<p>Avvia questo micro-proxy sul tuo computer, poi inserisci <code>http://localhost:8010/</code> nel campo "Proxy CORS":</p>'+
    '<div class="code-block"># Con Node.js (npx, senza installare nulla):\nnpx local-cors-proxy --proxyUrl https://api.openai.com --port 8010 --proxyPartial \'\'\n\n# In alternativa con Python 3:\npip install proxy.py && proxy --port 8010 --plugins proxy.plugin.CorsPlugin</div>'+
    '<p>Oppure proxy Node custom (salva come <code>proxy.js</code>, poi <code>node proxy.js</code>):</p>'+
    '<div class="code-block">const http=require("http"),https=require("https");\nhttp.createServer((req,res)=>{\n  res.setHeader("Access-Control-Allow-Origin","*");\n  res.setHeader("Access-Control-Allow-Headers","*");\n  res.setHeader("Access-Control-Allow-Methods","*");\n  if(req.method==="OPTIONS"){res.end();return}\n  const url=req.url.replace(/^\\//,"");\n  const p=https.request(url,{method:req.method,headers:{\n    "content-type":"application/json",\n    "authorization":req.headers.authorization||""}},r=>{r.pipe(res)});\n  req.pipe(p);\n}).listen(8010,()=>console.log("CORS proxy su http://localhost:8010/"));</div>'+
    '<h3>Soluzione 2: Usa Claude o Gemini per la demo browser</h3>'+
    '<p>Il codice Python generato (🐍) funziona invece con <strong>tutti</strong> i provider senza proxy, perché gira da terminale dove il CORS non esiste. Per la demo live: Claude nel browser, OpenAI nel codice esportato.</p>'+
    '<h3>Test di rete rapido</h3>'+
    '<p>Il bottone qui sotto verifica quali endpoint sono raggiungibili dal tuo browser in questo momento:</p>'+
    '<button class="tb-btn primary" onclick="runReachabilityTest(this)">🔬 Testa raggiungibilità endpoint</button>'+
    '<div id="reachabilityResults" style="margin-top:12px"></div>'+
    '</div>'
  ,true);
}

async function runReachabilityTest(btn){
  btn.disabled=true;btn.textContent='Test in corso...';
  var out=document.getElementById('reachabilityResults');
  out.innerHTML='';
  var targets=[
    {name:'Anthropic Claude',url:'https://api.anthropic.com/v1/messages',method:'POST',headers:{'Content-Type':'application/json','anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true','x-api-key':'test'},body:'{"model":"claude-haiku-4-5-20251001","max_tokens":1,"messages":[{"role":"user","content":"x"}]}',
     ok:'Raggiungibile dal browser (risposta API ricevuta)'},
    {name:'Google Gemini',url:'https://generativelanguage.googleapis.com/v1beta/models?key=test',method:'GET',headers:{},body:null,
     ok:'Raggiungibile dal browser (risposta API ricevuta)'},
    {name:'OpenAI',url:'https://api.openai.com/v1/models',method:'GET',headers:{'Authorization':'Bearer test'},body:null,
     ok:'Raggiungibile dal browser'}
  ];
  for(var i=0;i<targets.length;i++){
    var t=targets[i];
    var row='<div style="display:flex;gap:8px;align-items:center;padding:6px 0;font-size:12px">';
    try{
      var resp=await fetch(t.url,{method:t.method,headers:t.headers,body:t.body});
      // Qualsiasi risposta HTTP (anche 401) = endpoint raggiungibile, CORS ok
      row+='<span style="color:#10B981;font-weight:700">✅</span> <strong>'+t.name+'</strong>: '+t.ok+' (HTTP '+resp.status+', con una key valida funzionerà)';
    }catch(e){
      row+='<span style="color:#EF4444;font-weight:700">❌</span> <strong>'+t.name+'</strong>: bloccato dal browser (CORS), serve il proxy o usa il codice Python esportato';
    }
    row+='</div>';
    out.innerHTML+=row;
  }
  btn.disabled=false;btn.textContent='🔬 Riesegui test';
}

// ══════════════════════════════════════════
// RISOLUZIONE DEL FORNITORE DI UN NODO
// ══════════════════════════════════════════
// Un nodo AI puo' indicare un fornitore preciso oppure lasciare "auto".
// In automatico si usa quello effettivamente collegato: e' cio' che rende
// eseguibile un flusso appena si integra UNA chiave, senza dover aprire ogni
// nodo per cambiargli il fornitore. Prima l'assenza di scelta significava
// "claude" in silenzio, e chi configurava Gemini restava bloccato.
function risolviProvider(scelta){
  var s=scelta||'auto';
  if(s!=='auto'){
    var p=normalizeProviderName(s);
    var pc=aiConfig.providers&&aiConfig.providers[p];
    // Il fornitore scelto e' collegato: si rispetta la scelta.
    if(pc&&pc.status==='ok')return {provider:p,automatico:false,sostituito:false};
    var alt=(typeof anyProviderReady==='function')?anyProviderReady():null;
    // Scelto ma non collegato: si segnala la sostituzione, non la si nasconde.
    if(alt)return {provider:alt,automatico:false,sostituito:true,richiesto:p};
    return {provider:p,automatico:false,sostituito:false,nessunoCollegato:true};
  }
  var pronto=(typeof anyProviderReady==='function')?anyProviderReady():null;
  return pronto?{provider:pronto,automatico:true,sostituito:false}
               :{provider:null,automatico:true,nessunoCollegato:true};
}

// ══════════════════════════════════════════
// RIPIEGO FRA FORNITORI
// ══════════════════════════════════════════
// `risolviProvider` sostituisce il fornitore PRIMA della chiamata, quando
// quello scelto non e' collegato. Restava scoperto il caso peggiore: il
// fornitore e' collegato ma la chiamata fallisce a meta' esecuzione — limite
// di frequenza superato, 500 dal fornitore, rete caduta. Il flusso si fermava
// li', anche con un secondo fornitore configurato e pronto.
//
// Il ripiego riguarda SOLO i guasti di trasporto. Non si ripiega su:
//   - un'interruzione voluta dall'utente (non e' un guasto);
//   - una risposta "[Demo]" (nessun fornitore configurato: cambiarlo non aiuta);
//   - una chiave rifiutata (401/403), perche' il problema e' la
//     configurazione di QUEL fornitore e nasconderlo con un altro
//     impedirebbe di accorgersene.
function ripiegabile(r){
  if(!r||!r.error)return false;
  if(r.aborted||r.demo)return false;
  return !/\b(401|403|non autorizzat|unauthorized|invalid[_ ]api[_ ]key|forbidden)\b/i.test(r.text||'');
}

// Fornitori collegati diversi da quello gia' provato, nell'ordine in cui
// compaiono nel pannello.
function fornitoriDiRiserva(escluso){
  var ps=aiConfig.providers||{};
  return Object.keys(ps).filter(function(p){
    return p!==escluso && ps[p] && ps[p].status==='ok';
  });
}

async function callAI(prompt,systemPrompt,config){
  var scelto=normalizeProviderName(config&&config.model?config.model:aiConfig.provider);
  var r=await callAIUnaVolta(prompt,systemPrompt,config);
  if(!ripiegabile(r))return r;

  var riserve=fornitoriDiRiserva(scelto);
  for(var i=0;i<riserve.length;i++){
    var alt=riserve[i];
    // Il modello scelto vale per il fornitore originale: al sostituto si
    // lascia decidere il proprio predefinito, altrimenti riceverebbe un
    // identificativo che non conosce.
    var cfgAlt=Object.assign({},config||{},{model:alt,modelId:null});
    var r2=await callAIUnaVolta(prompt,systemPrompt,cfgAlt);
    if(!r2||!r2.error){
      if(r2)r2.ripiego={da:providerLabel(scelto),a:providerLabel(alt),motivo:(r.text||'').substring(0,120)};
      return r2;
    }
    if(r2&&r2.aborted)return r2;
  }
  // Nessuna riserva ha funzionato: si restituisce l'errore ORIGINALE, che
  // riguarda il fornitore che l'utente aveva scelto.
  if(riserve.length)r.ripiegoTentato=riserve.map(function(p){return providerLabel(p)});
  return r;
}

// ══════════════════════════════════════════
// LA CHIAVE SOPRAVVIVE AL RICARICAMENTO
// ══════════════════════════════════════════
// La chiave viveva solo in `aiConfig`, quindi ogni F5 la cancellava: durante
// una dimostrazione bastava un ricaricamento per ritrovarsi con tutti i nodi
// AI scollegati e nessuna spiegazione visibile.
//
// Si usa `sessionStorage`, non `localStorage`: la chiave resta finche' la
// scheda e' aperta e sparisce quando la si chiude. Non finisce quindi su
// disco a tempo indeterminato, ne' viene condivisa con altre schede. Resta
// comunque leggibile da chi apre la console di QUESTA scheda: e' una comodita'
// da prototipo, non una custodia sicura, ed e' dichiarata come tale.
var AI_SESSIONE='relaition_ai_sessione';

function salvaProviderInSessione(){
  try{
    var d={provider:aiConfig.provider,providers:{}};
    Object.keys(aiConfig.providers||{}).forEach(function(p){
      var pc=aiConfig.providers[p];
      if(pc&&pc.status==='ok')
        d.providers[p]={key:pc.key||'',status:'ok',baseUrl:pc.baseUrl,model:pc.model,
                        customUrl:pc.customUrl,customModel:pc.customModel,preset:pc.preset};
    });
    sessionStorage.setItem(AI_SESSIONE,JSON.stringify(d));
  }catch(e){ /* sessione non disponibile: si prosegue senza persistenza */ }
}

function ripristinaProviderDaSessione(){
  try{
    var g=sessionStorage.getItem(AI_SESSIONE);
    if(!g)return 0;
    var d=JSON.parse(g),n=0;
    Object.keys(d.providers||{}).forEach(function(p){
      if(!aiConfig.providers[p])aiConfig.providers[p]={key:'',status:'idle'};
      Object.keys(d.providers[p]).forEach(function(k){
        if(d.providers[p][k]!==undefined&&d.providers[p][k]!==null)
          aiConfig.providers[p][k]=d.providers[p][k];
      });
      n++;
    });
    if(d.provider&&aiConfig.providers[d.provider])aiConfig.provider=d.provider;
    var pc=aiConfig.providers[aiConfig.provider];
    if(pc&&pc.status==='ok'){aiConfig.status='ok';aiConfig.key=pc.key||''}
    return n;
  }catch(e){ return 0 }
}

function dimenticaChiaviAI(){
  try{ sessionStorage.removeItem(AI_SESSIONE) }catch(e){}
  Object.keys(aiConfig.providers||{}).forEach(function(p){
    aiConfig.providers[p].key='';aiConfig.providers[p].status='idle';
  });
  aiConfig.key='';aiConfig.status='idle';
  if(typeof refreshStatoAI==='function')refreshStatoAI();
  if(typeof showToast==='function')showToast('🔑 Chiavi rimosse da questa sessione');
}
