// ══════════════════════════════════════════════════════════════
// CONNESSIONI RIUTILIZZABILI
// ══════════════════════════════════════════════════════════════
// Endpoint, cartelle e parametri di collegamento si configurano UNA VOLTA qui,
// si provano, e più nodi li riusano. Prima ogni nodo portava i propri: bisognava
// ripetere gli stessi valori su ogni flusso, e non c'era modo di sapere se
// funzionassero prima di eseguire.
//
// La prova è la parte che conta. Dove l'operazione è davvero eseguibile dal
// browser la prova è reale — scrive un file nella cartella, chiama l'endpoint —
// e dove non lo è, il test verifica ciò che può (parametri completi, formato
// corretto, raggiungibilità) e dichiara il resto invece di fingere un successo.

var CONN_TIPI={
  cartella:{
    label:'Cartella (Drive, SharePoint, locale)', icona:'📁', reale:true,
    descrizione:'Una cartella sul computer. Se è quella sincronizzata da Google Drive o OneDrive, i file ci arrivano davvero sul cloud.',
    campi:[
      {k:'percorso',l:'Sottocartella predefinita',ph:'Report/2026'},
      {k:'servizio',l:'Servizio',ph:'Google Drive',opts:['Google Drive','OneDrive / SharePoint','Dropbox','Solo locale']}
    ]
  },
  http:{
    label:'Endpoint HTTP / API', icona:'🌐', reale:true,
    descrizione:'Un servizio raggiungibile via HTTP. La prova esegue una chiamata vera.',
    campi:[
      {k:'baseurl',l:'URL',ph:'https://api.azienda.it/v1/stato',req:true},
      {k:'metodoTest',l:'Metodo per la prova',ph:'GET',opts:['GET','POST','HEAD']},
      {k:'headers',l:'Header (JSON)',ph:'{"Authorization":"Bearer ..."}',ta:true}
    ]
  },
  database:{
    label:'Database (PostgreSQL, MySQL, MongoDB)', icona:'🗄️', reale:true,
    // Non è "simulata": la prova apre davvero la porta. Non è però completa,
    // e il distinguo va detto sulla scheda, non solo nella documentazione.
    nota:'solo porta',
    notaSpiegazione:'La prova apre una connessione TCP reale verso host:porta. Le credenziali non vengono inviate: la query la esegue lo script esportato.',
    descrizione:'Parametri di connessione completi. Con il servizio locale avviato la prova esegue un handshake TCP vero verso host e porta.',
    campi:[
      {k:'motore',l:'Motore',ph:'PostgreSQL',opts:['PostgreSQL','MySQL','MongoDB','SQL Server'],req:true},
      {k:'host',l:'Host',ph:'db.azienda.it',req:true},
      {k:'port',l:'Porta',ph:'5432',req:true},
      {k:'database',l:'Database',ph:'produzione',req:true},
      {k:'user',l:'Utente',ph:'app_agente',req:true},
      {k:'ssl',l:'SSL',ph:'require',opts:['require','prefer','disable']}
    ]
  },
  smtp:{
    label:'Posta in uscita (SMTP)', icona:'📧', reale:true,
    descrizione:'Le credenziali restano nel servizio locale e non passano mai dal browser. La prova invia un\'email vera, se indichi un destinatario.',
    campi:[
      {k:'destinatarioProva',l:'Destinatario per la prova',ph:'tuo.indirizzo@gmail.com'}
    ]
  },
  webhook:{
    label:'Webhook in ingresso', icona:'📡', reale:true,
    descrizione:'Il ricevitore locale accetta le chiamate esterne e le mette in coda. La prova verifica che sia in ascolto.',
    campi:[]
  }
};

// ── Registro ──────────────────────────────────────────────────
function connElenco(tipo){
  var sql='SELECT * FROM connessioni WHERE user=?';
  var par=[utenteCorrente()];
  if(tipo){ sql+=' AND tipo=?'; par.push(tipo) }
  return dbAll(sql+' ORDER BY nome',par);
}

function connPerId(id){
  return dbGetOne('SELECT * FROM connessioni WHERE id=? AND user=?',[id,utenteCorrente()]);
}

function connConfig(c){
  if(!c)return {};
  try{ return JSON.parse(c.config_json||'{}') }catch(e){ return {} }
}

function connSalva(id,nome,tipo,config){
  var ora=new Date().toISOString();
  if(id){
    dbRun('UPDATE connessioni SET nome=?,tipo=?,config_json=? WHERE id=? AND user=?',
      [nome,tipo,JSON.stringify(config),id,utenteCorrente()]);
    return id;
  }
  dbRun('INSERT INTO connessioni (user,nome,tipo,config_json,stato,created_at) VALUES (?,?,?,?,?,?)',
    [utenteCorrente(),nome,tipo,JSON.stringify(config),'da_provare',ora]);
  var r=dbGetOne('SELECT last_insert_rowid() as id');
  return r?r.id:null;
}

function connElimina(id){
  var c=connPerId(id);
  if(!c)return;
  if(!confirm('Eliminare la connessione "'+c.nome+'"?\nI nodi che la usano torneranno da configurare.'))return;
  dbRun('DELETE FROM connessioni WHERE id=? AND user=?',[id,utenteCorrente()]);
  renderConnessioni();
  showToast('🗑️ Connessione eliminata');
}

function connRegistraEsito(id,ok,messaggio){
  dbRun('UPDATE connessioni SET stato=?,ultimo_test=?,esito_test=? WHERE id=? AND user=?',
    [ok?'ok':'errore',new Date().toISOString(),messaggio,id,utenteCorrente()]);
}

// ── Prove ─────────────────────────────────────────────────────
// Ogni tipo prova ciò che è davvero verificabile. Il valore di questa sezione
// sta qui: sapere PRIMA di costruire un flusso se il collegamento regge.

async function connProva(id){
  var c=connPerId(id);
  if(!c)return;
  var cfg=connConfig(c);
  connMostraProva(id,'in corso','Prova in corso…');
  var esito;
  try{
    if(c.tipo==='cartella')      esito=await connProvaCartella(c,cfg);
    else if(c.tipo==='http')     esito=await connProvaHttp(cfg);
    else if(c.tipo==='database') esito=await connProvaDatabase(cfg);
    else if(c.tipo==='smtp')     esito=await connProvaSmtp(cfg);
    else if(c.tipo==='webhook')  esito=await connProvaWebhook();
    else esito={ok:false,msg:'Tipo di connessione sconosciuto'};
  }catch(e){
    esito={ok:false,msg:e.message||String(e)};
  }
  connRegistraEsito(id,esito.ok,esito.msg);
  renderConnessioni();
  showToast((esito.ok?'✅ ':'❌ ')+c.nome+': '+esito.msg.slice(0,70));
}

// Prova REALE: scrive un file di verifica nella cartella e lo rimuove.
// È l'unico modo onesto di dire "questa cartella è scrivibile".
async function connProvaCartella(c,cfg){
  if(!csSupportata())return {ok:false,msg:csMotivoNonSupportata()};
  if(!cfg.alias)return {ok:false,msg:'Nessuna cartella collegata: usa "Scegli cartella…"'};
  var nome='.relaition-prova-'+Date.now()+'.txt';
  try{
    var r=await csScrivi(cfg.alias,cfg.percorso,nome,
      'Verifica di scrittura RelAItion: '+new Date().toLocaleString('it-IT'),'text/plain');
    // Il file di prova viene rimosso: lasciarlo sporcherebbe la cartella
    // dell'utente a ogni verifica.
    var rimosso=await connRimuoviProva(cfg,nome);
    return {ok:true,msg:'Scrittura riuscita in '+r.percorso.replace('/'+nome,'')+
      (rimosso?'':' (il file di prova è rimasto: rimuovilo a mano)')};
  }catch(e){
    return {ok:false,msg:e.message||String(e)};
  }
}

async function connRimuoviProva(cfg,nome){
  try{
    var h=await csLeggiHandle(cfg.alias);
    if(!h)return false;
    var np=csNormalizzaPercorso(cfg.percorso);
    var dir=await csCartellaDiDestinazione(h,np.parti);
    await dir.removeEntry(nome);
    return true;
  }catch(e){ return false }
}

// Prova HTTP. Dal browser si vede solo "ha funzionato" oppure "non ha
// funzionato": una fetch bloccata da CORS e un host inesistente danno lo
// stesso errore. Con la sonda i due casi si separano, ed e' la differenza fra
// "l'indirizzo e' sbagliato" e "l'indirizzo e' giusto ma serve un proxy".
async function connProvaHttp(cfg){
  if(!cfg.baseurl)return {ok:false,msg:'URL mancante'};
  var headers={};
  if(cfg.headers){
    try{ headers=JSON.parse(cfg.headers) }
    catch(e){ return {ok:false,msg:'Gli header non sono JSON valido'} }
  }
  var metodo=cfg.metodoTest||'GET';
  var t0=Date.now(), daBrowser=null;
  try{
    var r=await fetch(cfg.baseurl,{method:metodo,headers:headers,mode:'cors'});
    daBrowser={stato:r.status,ms:Date.now()-t0,ok:r.ok};
  }catch(e){ daBrowser=null; }

  if(daBrowser&&daBrowser.ok)
    return {ok:true,msg:'Risposta '+daBrowser.stato+' in '+daBrowser.ms+' ms (chiamata dal browser)'};
  if(daBrowser&&(daBrowser.stato===401||daBrowser.stato===403))
    return {ok:false,msg:'Il servizio risponde ('+daBrowser.stato+') ma rifiuta le credenziali: controlla gli header'};

  // Il browser non ce l'ha fatta: si chiede al servizio locale, che non ha
  // vincoli di CORS, se l'endpoint esiste davvero.
  var s=await sonda({tipo:'http',url:cfg.baseurl,metodo:metodo});
  if(!s){
    if(daBrowser)return {ok:false,msg:'Risposta '+daBrowser.stato+' dal browser. Avvia il servizio locale per sapere se dipende da CORS'};
    return {ok:false,msg:'Non raggiungibile dal browser. Avvia servizio-webhook/AVVIA-RICEVITORE.cmd per distinguere un blocco CORS da un indirizzo errato'};
  }
  if(s.ok&&!daBrowser)
    return {ok:false,msg:'L\u2019endpoint esiste e risponde '+s.stato+' ('+s.ms+' ms), ma il browser non puo\u0300 chiamarlo: manca l\u2019autorizzazione CORS. L\u2019indirizzo e\u0300 corretto, serve un proxy o un header Access-Control-Allow-Origin'};
  if(s.ok&&daBrowser)
    return {ok:false,msg:'Il servizio risponde '+s.stato+': l\u2019indirizzo e\u0300 giusto ma la richiesta viene rifiutata'};
  return {ok:false,msg:'Verificato dal servizio locale: '+(s.errore||'endpoint non raggiungibile')};
}

// Prova database. Il browser non apre socket TCP, ma il servizio locale si':
// questa e' una connessione TCP reale verso host:porta, con handshake vero.
// Non e' una query — le credenziali non vengono mai inviate — e il messaggio
// lo dice, perche' "porta aperta" e "database accessibile" non sono la stessa
// cosa e prometterlo sarebbe falso.
async function connProvaDatabase(cfg){
  var mancanti=['motore','host','port','database','user'].filter(function(k){return !cfg[k]});
  if(mancanti.length)return {ok:false,msg:'Parametri mancanti: '+mancanti.join(', ')};

  var attese={PostgreSQL:'5432',MySQL:'3306',MongoDB:'27017','SQL Server':'1433'};
  var nota='';
  if(attese[cfg.motore]&&String(cfg.port)!==attese[cfg.motore])
    nota=': nota: la porta standard di '+cfg.motore+' e\u0300 '+attese[cfg.motore];

  var s=await sonda({tipo:'tcp',host:cfg.host,porta:cfg.port});
  if(!s)
    return {ok:false,msg:'Parametri completi e coerenti'+nota+', ma la connessione non e\u0300 stata provata: '+
      'avvia servizio-webhook/AVVIA-RICEVITORE.cmd per una prova TCP reale'};
  if(s.ok)
    return {ok:true,msg:s.dettaglio+' ('+s.ms+' ms): connessione TCP reale riuscita'+nota+
      '. Le credenziali non sono state verificate: la query la esegue lo script esportato'};
  return {ok:false,msg:s.errore+nota};
}

// Prova SMTP. Che il servizio sia in ascolto non dimostra che sappia inviare:
// le credenziali potrebbero essere sbagliate, la password per le app scaduta,
// il provider bloccare l'accesso. L'unica prova che dimostra qualcosa e'
// un'email che arriva davvero, quindi se c'e' un destinatario si invia.
async function connProvaSmtp(cfg){
  if(typeof mailVerificaServizio!=='function')return {ok:false,msg:'Modulo di posta non caricato'};
  var s=await mailVerificaServizio();
  if(!s.disponibile)
    return {ok:false,msg:'Servizio non in ascolto: avvia servizio-mail/AVVIA-SERVIZIO-MAIL.cmd'};

  var dest=((cfg||{}).destinatarioProva||'').trim();
  if(!dest)
    return {ok:true,msg:'Servizio attivo: mittente '+s.mittente+' via '+s.server+
      '. Per una prova completa scrivi un destinatario e premi Prova: verra\u0300 inviata un\u2019email vera'};

  var esito=await mailInvia({
    a:dest, oggetto:'RelAItion: prova di connessione',
    corpo:'Se leggi questo messaggio la connessione SMTP funziona.\n\n'+
          'Inviato da '+s.mittente+' via '+s.server+' il '+new Date().toLocaleString('it-IT')+'.',
    html:false, allegati:[]
  });
  return esito.ok
    ? {ok:true,msg:'Email di prova inviata davvero a '+dest+' via '+s.server+': controlla la casella'}
    : {ok:false,msg:'Il servizio e\u0300 attivo ma l\u2019invio e\u0300 fallito: '+esito.errore};
}

async function connProvaWebhook(){
  if(typeof whVerificaServizio!=='function')return {ok:false,msg:'Modulo webhook non caricato'};
  var s=await whVerificaServizio();
  return s.disponibile
    ? {ok:true,msg:'Ricevitore attivo: '+(s.ricevute||0)+' chiamate ricevute'}
    : {ok:false,msg:'Ricevitore non in ascolto: avvia servizio-webhook/AVVIA-RICEVITORE.cmd'};
}

// Stato "prova in corso". Alcune prove durano secondi (la sonda TCP attende
// fino a 5s su una porta filtrata): senza un segnale visibile sembra che il
// pulsante non abbia fatto nulla e si preme di nuovo.
function connMostraProva(id,stato,msg){
  var el=document.getElementById('conn-esito-'+id);
  if(el)el.innerHTML='<div class="conn-esito attesa"><span class="conn-spinner"></span>'+escHtml(msg)+'</div>';
  var card=el&&el.closest?el.closest('.conn-card'):null;
  if(card)card.classList.add('in-prova');
  // Il pulsante si disabilita finche' la prova non torna: due prove
  // sovrapposte scriverebbero l'esito l'una sull'altra.
  var btn=document.getElementById('conn-btn-'+id);
  if(btn){btn.disabled=true;btn.textContent='⏳ Prova…'}
}

// ══════════════════════════════════════════════════════════════
// SONDA: prove di connessione VERE tramite il servizio locale
// ══════════════════════════════════════════════════════════════
// Il browser non apre socket TCP e non puo' aggirare CORS: da solo non puo'
// dire se un database risponde, ne' distinguere "servizio irraggiungibile" da
// "servizio raggiungibile ma non autorizzato a parlare con questa pagina".
// Il servizio locale puo' fare entrambe le cose. Se non e' avviato le prove
// ricadono su cio' che il browser sa fare, dichiarandolo.

// Entrambi i servizi espongono /sonda: si usa quello che risponde, cosi' non
// e' necessario averli avviati tutti e due.
var SONDA_URL = [ (typeof WH_URL!=='undefined'?WH_URL:'http://127.0.0.1:8788'),
                  (typeof MAIL_URL!=='undefined'?MAIL_URL:'http://127.0.0.1:8787') ];

async function sondaDisponibile(){
  for(var i=0;i<SONDA_URL.length;i++){
    try{
      var r=await fetch(SONDA_URL[i]+'/stato',{method:'GET',mode:'cors'});
      if(r.ok)return SONDA_URL[i];
    }catch(e){}
  }
  return null;
}

// Ritorna {ok,...} dal servizio, oppure null se nessun servizio e' in ascolto.
async function sonda(parametri){
  var base=await sondaDisponibile();
  if(!base)return null;
  var qs=Object.keys(parametri).map(function(k){
    return encodeURIComponent(k)+'='+encodeURIComponent(parametri[k])}).join('&');
  try{
    var r=await fetch(base+'/sonda?'+qs,{method:'GET',mode:'cors'});
    if(!r.ok)return {ok:false,errore:'La sonda ha risposto '+r.status};
    return await r.json();
  }catch(e){ return {ok:false,errore:'Sonda non raggiungibile'} }
}
// "Provata" senza una data non dice granche': una connessione verificata un
// mese fa e una verificata poco fa danno la stessa pastiglia verde, ma non
// danno la stessa fiducia.
function connQuando(iso){
  if(!iso)return '';
  var t=new Date(iso), min=Math.round((Date.now()-t.getTime())/60000);
  if(isNaN(min))return '';
  if(min<1)return 'ora';
  if(min<60)return min+' min fa';
  if(min<1440)return Math.round(min/60)+' h fa';
  var g=Math.round(min/1440);
  return g===1?'ieri':g+' giorni fa';
}
