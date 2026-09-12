// ══════════════════════════════════════════════════════════════
// ACCOUNT DELLA PIATTAFORMA
// ══════════════════════════════════════════════════════════════
// I quattro profili che alimentano le metriche del Monitoraggio hanno ora
// credenziali proprie: entrando con l'una o con l'altra cambia chi sei, e di
// conseguenza cosa vedi come tuo — gli agenti che hai scritto, le esecuzioni
// che hai lanciato, i post che hai pubblicato.
//
// L'autenticazione resta DIMOSTRATIVA: la password è confrontata in chiaro qui
// nel client, dove chiunque può leggerla. Serve a mostrare che la piattaforma
// distingue le persone, non a proteggere alcunché. È dichiarato nella schermata
// di accesso e in ARCHITECTURE.md.

var UTENTI=[
  {
    email:'mario.rossi@relaition.com', password:'mario1234',
    name:'Mario R.', iniziali:'MR', colore:'#6366F1',
    role:'Automation Specialist', org:'Rome Business School',
    bio:'Costruisco agenti per semplificare processi aziendali complessi. Mi occupo soprattutto della fase di disegno e delle prove sul campo.',
    linkedin:'linkedin.com/in/mariorossi'
  },
  {
    email:'giulia.deangelis@relaition.com', password:'giulia1234',
    name:'Giulia D.', iniziali:'GD', colore:'#F59E0B',
    role:'Responsabile Operations', org:'Direzione Operativa',
    bio:'Porto in produzione ciò che funziona e lo tengo in piedi. Guardo più alla continuità che alla novità: un agente che gira ogni giorno vale più di dieci prototipi.',
    linkedin:'linkedin.com/in/giuliadeangelis'
  },
  {
    email:'marco.russo@relaition.com', password:'marco1234',
    name:'Marco R.', iniziali:'MR', colore:'#EC4899',
    role:'Analista di processo', org:'Miglioramento Continuo',
    bio:'Sperimento molto e fallisco spesso: è il modo più rapido che conosco per capire dove l\'automazione conviene davvero e dove no.',
    linkedin:'linkedin.com/in/marcorusso'
  },
  {
    email:'sara.lombardi@relaition.com', password:'sara1234',
    name:'Sara L.', iniziali:'SL', colore:'#EF4444',
    role:'Compliance & Data Protection', org:'Affari Legali',
    bio:'Verifico che quello che gli agenti fanno con i dati sia difendibile. Approvo poco e chiedo molto, ma quando firmo il flusso può andare in produzione.',
    linkedin:'linkedin.com/in/saralombardi'
  }
];

// L'ospite è un account come gli altri, con un nome proprio: senza, i suoi
// agenti e le sue esecuzioni finivano attribuiti a Mario R., e chi entrava
// come ospite si trovava fra le mani il lavoro di qualcun altro.
var UTENTE_OSPITE={
  email:'ospite@relaition.com', password:'',
  name:'Ospite', iniziali:'OS', colore:'#64748B',
  role:'Visitatore', org:'Accesso di prova',
  bio:'Account di prova: quello che costruisci resta separato dagli altri profili e sparisce quando svuoti i dati del browser.',
  linkedin:'', ospite:true
};

function utenteDaEmail(email){
  var e=String(email||'').trim().toLowerCase();
  if(e===UTENTE_OSPITE.email)return UTENTE_OSPITE;
  return UTENTI.filter(function(u){return u.email.toLowerCase()===e})[0]||null;
}

// Sovrascrive i valori di partenza con quelli salvati dall'utente. Va chiamata
// sia al cambio utente sia ALL'AVVIO: aprendo l'applicazione senza passare dal
// login — un semplice ricaricamento — il profilo tornava ai valori scritti nel
// codice, e le modifiche appena salvate sembravano non essere state registrate.
function caricaProfiloSalvato(nome){
  try{
    if(typeof dbGetOne!=='function')return false;
    var p=dbGetOne('SELECT * FROM profili WHERE user=?',[nome||profileData.name]);
    if(!p)return false;
    if(p.role)profileData.role=p.role;
    if(p.org)profileData.org=p.org;
    if(p.bio)profileData.bio=p.bio;
    if(p.email)profileData.email=p.email;
    if(p.linkedin)profileData.linkedin=p.linkedin;
    // Campi che possono essere vuoti per scelta: si assegnano comunque, senza
    // condizione, altrimenti una cancellazione non verrebbe mai rispecchiata.
    profileData.reparto=p.reparto||'';
    profileData.telefono=p.telefono||'';
    profileData.settore=p.settore||'';
    return true;
  }catch(e){ return false }
}

// Applica l'identità: da qui in poi tutta l'applicazione legge profileData, e
// quindi mostra come "tuoi" i contenuti attribuiti a questo nome.
function applicaUtente(u){
  if(!u)return;
  // La sandbox appartiene alla sessione di chi l'ha aperta. Se resta attiva
  // mentre cambia la persona, chiuderla dopo rimette sulla tela il canvas
  // messo da parte PRIMA del cambio, e l'autosalvataggio lo scrive sopra la
  // copia di lavoro della persona nuova. Si chiude prima, e ognuno ritrova
  // il suo.
  if(typeof SANDBOX!=='undefined'&&SANDBOX&&SANDBOX.attiva&&typeof closeSandbox==='function')closeSandbox();
  // Il nome scelto dall'utente ha la precedenza su quello scritto nel codice:
  // senza, chi si e' rinominato tornerebbe al nome originale a ogni accesso e
  // i suoi contenuti — riattribuiti al nome nuovo — sparirebbero dalla vista.
  var nome=(typeof nomeDellAccount==='function')?nomeDellAccount(u.email,u.name):u.name;
  profileData={
    name:nome, role:u.role, org:u.org, bio:u.bio,
    email:u.email, linkedin:u.linkedin, iniziali:u.iniziali, colore:u.colore
  };
  // Le iniziali seguono il nome scelto, altrimenti resterebbero quelle di
  // partenza e l'avatar direbbe un'altra persona.
  if(nome!==u.name)profileData.iniziali=inizialiDaNome(nome)||u.iniziali;
  caricaProfiloSalvato(nome);
  // Progressi formativi, iscrizioni e community appartengono all'utente, ma
  // vivono anche in memoria dentro PATHS: senza ricaricarli al cambio
  // account restano quelli di chi c'era prima, e il primo salvataggio li
  // riscrive sotto il nome nuovo — un utente si ritrova i corsi di un altro,
  // e quell'altro li perde.
  if(typeof loadPersistedContent==='function'){try{loadPersistedContent()}catch(e){}}
  // Anche la tela del Builder appartiene a chi la sta usando: senza questo
  // entrando con un altro account restavano i nodi del precedente.
  if(typeof ricaricaTelaPerUtente==='function'){try{ricaricaTelaPerUtente()}catch(e){}}
  aggiornaIntestazioneUtente();
}

// "Anna Bianchi" → "AB"; un nome solo → prime due lettere.
function inizialiDaNome(nome){
  var p=String(nome||'').trim().split(/\s+/).filter(Boolean);
  if(!p.length)return '';
  if(p.length===1)return p[0].substring(0,2).toUpperCase();
  return (p[0][0]+p[1][0]).toUpperCase();
}

// Nome e iniziali compaiono nella barra laterale: senza aggiornarli si sarebbe
// entrati come Giulia continuando a vedere "Mario R." in basso a sinistra.
function aggiornaIntestazioneUtente(){
  // Il saluto della Dashboard usava il nome scritto nel markup: entrando come
  // Giulia si leggeva comunque "Buongiorno, Mario". Ovunque compaia l'identità
  // deve venire da profileData, mai dal testo fisso della pagina.
  var saluto=document.getElementById('salutoDashboard');
  if(saluto){
    var h=new Date().getHours();
    var momento=h<13?'Buongiorno':h<18?'Buon pomeriggio':'Buonasera';
    // Solo il nome proprio: "Buongiorno, Mario R." suona come un richiamo.
    var breve=String(profileData.name||'').split(' ')[0];
    saluto.textContent=momento+(breve?', '+breve:'')+' 👋';
  }
  var nome=document.querySelector('.sf-name');
  var ruolo=document.querySelector('.sf-role');
  var ava=document.querySelector('.sidebar-footer .ava');
  if(nome)nome.textContent=profileData.name;
  if(ruolo)ruolo.textContent=profileData.role;
  if(ava){
    ava.textContent=profileData.iniziali||profileData.name.substring(0,2).toUpperCase();
    if(profileData.colore)ava.style.background=profileData.colore;
  }
  var ph=document.querySelector('.profile-header');
  if(ph){
    var pn=ph.querySelector('.profile-name'), pr=ph.querySelector('.profile-role');
    if(pn)pn.textContent=profileData.name;
    if(pr)pr.textContent=profileData.role+' · '+profileData.org;
    var pa=ph.querySelector('.profile-avatar');
    if(pa){
      pa.textContent=profileData.iniziali||profileData.name.substring(0,2).toUpperCase();
      if(profileData.colore)pa.style.background=profileData.colore;
    }
  }
}

// Ripristina l'identità all'avvio, se qualcuno era già entrato.
function ripristinaUtente(){
  var e=null;
  try{ e=localStorage.getItem('relaition_login_email') }catch(err){}
  var u=utenteDaEmail(e);
  if(u)applicaUtente(u);
}

// Elenco degli account mostrato nella schermata di accesso: in una demo
// nascondere le credenziali significa solo non poter provare i profili.
// ══════════════════════════════════════════════════════════════
// CLASSIFICA PER ESPERIENZA
// ══════════════════════════════════════════════════════════════
// Somma delle righe di `xp_log` per utente. Prima era un elenco di sei nomi
// con i punti scritti nel codice: completare una lezione o vincere una sfida
// non spostava la classifica di un punto, e il proprio nome restava inchiodato
// al quinto posto. Un numero mostrato dev'essere calcolato, non dichiarato —
// e una classifica finta e' il caso in cui si nota prima.
//
// Compaiono tutti gli utenti noti, anche a zero punti: una classifica che
// nasconde chi non ha ancora fatto niente non e' una classifica, e chi entra
// per la prima volta non si troverebbe.
function classificaXP(){
  var somme={};
  try{
    dbAll('SELECT user, COALESCE(SUM(amount),0) tot FROM xp_log GROUP BY user').forEach(function(r){
      if(r.user)somme[r.user]=r.tot;
    });
  }catch(e){}
  (typeof UTENTI!=='undefined'?UTENTI:[]).forEach(function(u){
    var n=nomeDellAccount(u.email,u.name);
    if(somme[n]===undefined)somme[n]=0;
  });
  return Object.keys(somme)
    .map(function(n){ return {nome:n, xp:somme[n]} })
    .sort(function(a,b){ return b.xp-a.xp || a.nome.localeCompare(b.nome) });
}

function renderAccountDisponibili(){
  var box=document.getElementById('accountDemo');
  if(!box)return;
  // Due colonne di schede: l'elenco verticale con la password scritta sotto
  // occupava mezza schermata e mostrava una credenziale che non serve leggere.
  box.innerHTML=UTENTI.map(function(u){
    return '<button type="button" class="account-scheda" onclick="accediComeDemo(\''+u.email+'\')" '+
      'title="Entra come '+escHtml(u.name)+': '+escHtml(u.role)+'">'+
      '<span class="account-ava" style="background:'+u.colore+'">'+u.iniziali+'</span>'+
      '<span class="account-testo">'+
        '<span class="account-nome">'+escHtml(u.name)+'</span>'+
        '<span class="account-ruolo">'+escHtml(u.role)+'</span>'+
      '</span></button>';
  }).join('');
}

// Compila i campi e accede: la password viene scritta nel modulo, non mostrata
// come testo da leggere. Chi vuole vederla apre il file degli account.
function accediComeDemo(email){
  var u=utenteDaEmail(email);
  if(!u)return;
  document.getElementById('loginEmail').value=u.email;
  document.getElementById('loginPassword').value=u.password;
  var err=document.getElementById('loginError');
  if(err)err.textContent='';
  doLogin();
}

// ══════════════════════════════════════════════════════════════
// SEPARAZIONE DEI DATI PER UTENTE
// ══════════════════════════════════════════════════════════════
// Cosa e' personale e cosa e' comune:
//
//   PERSONALE  agenti creati, esecuzioni, agenti installati, progressi del
//              Learning Hub, quiz, iscrizioni alle sfide, punti, profilo
//   COMUNE     Marketplace, contenuti del Learning Hub, Community,
//              Knowledge Base aziendale, politiche di governo, Monitoraggio
//
// Il criterio: e' comune cio' che l'organizzazione mette a disposizione, e'
// personale cio' che una persona costruisce o fa. Il Monitoraggio resta
// trasversale perche' serve proprio a guardare la piattaforma nel suo insieme.

function utenteCorrente(){
  return (typeof profileData!=='undefined'&&profileData.name)?profileData.name:'Mario R.';
}

// Frammento SQL da aggiungere a una WHERE. Si usa insieme a parametroUtente()
// per non concatenare mai il nome dentro la query.
function filtroUtente(colonna,conWhere){
  return (conWhere===false?' AND ':' WHERE ')+(colonna||'user')+'=?';
}

function parametroUtente(){ return utenteCorrente() }

// ══════════════════════════════════════════════════════════════
// RINOMINA DELL'UTENTE
// ══════════════════════════════════════════════════════════════
// Il nome mostrato e' anche la chiave di attribuzione: agenti, esecuzioni,
// pubblicazioni, progressi e XP sono legati a QUELLA stringa. Rinominarsi
// senza riscrivere l'attribuzione lascerebbe tutto intestato a una persona
// che non esiste piu', e l'utente si ritroverebbe il profilo svuotato.
// Qui la rinomina e' un'unica operazione che tocca ogni tabella coinvolta.

// Colonna che porta il nome dell'utente, tabella per tabella. Va tenuta
// allineata allo schema: una tabella dimenticata qui e' un pezzo di storia
// che resta intestato al nome vecchio.
var IDENTITA_COLONNE=[
  ['agents','author'], ['agent_versions','author'], ['published_agents','author'],
  ['publications','reviewer'],
  ['exec_log','user'], ['my_agents','user'], ['xp_log','user'],
  ['forum_posts','user'], ['forum_comments','user'],
  ['learn_progress','user'], ['quiz_done','user'], ['challenges_registered','user'],
  ['connessioni','user'], ['profili','user'],
  // Aggiunte dopo: recensioni, candidature alle sfide, voti, revisione fra
  // pari, domande (e chi ha risposto), «mi piace» e visualizzazioni del forum.
  // Sono nate come tabelle separate proprio perche' ogni riga appartiene a
  // qualcuno: dimenticarle qui significava che chi si rinominava perdeva la
  // paternita' delle proprie recensioni e delle proprie candidature, che
  // restavano nel database intestate a un nome non piu' esistente.
  ['recensioni','autore'],
  ['challenge_submissions','user'], ['challenge_votes','user'],
  ['challenge_feedback','user'],
  ['challenge_questions','user'], ['challenge_questions','risposta_di'],
  ['challenge_winners','vincitore'],
  ['forum_likes','user'], ['forum_views','user']
];


// Quante righe cambierebbero intestatario. Serve a dirlo PRIMA, invece di
// eseguire una riscrittura estesa senza avvisare.
function conteggioAttribuzioni(nome){
  var tot=0, per={};
  IDENTITA_COLONNE.forEach(function(c){
    try{
      var r=dbGetOne('SELECT COUNT(*) n FROM '+c[0]+' WHERE '+c[1]+'=?',[nome]);
      // Somma invece di assegnare: una tabella puo' comparire due volte
      // (challenge_questions porta sia chi domanda sia chi risponde), e
      // l'assegnazione faceva sparire il primo conteggio dal riepilogo.
      if(r&&r.n){per[c[0]]=(per[c[0]]||0)+r.n;tot+=r.n}
    }catch(e){}
  });
  return {totale:tot,dettaglio:per};
}

// Il nome non puo' essere vuoto ne' coincidere con quello di un altro account:
// due utenti con lo stesso nome condividerebbero agenti ed esecuzioni, che e'
// esattamente il difetto che l'attribuzione per nome deve evitare.
function validaNomeUtente(nuovo,emailCorrente){
  var n=String(nuovo||'').trim();
  if(!n)return 'Il nome non puo\u0300 essere vuoto.';
  if(n.length>40)return 'Il nome e\u0300 troppo lungo (massimo 40 caratteri).';
  var altri=UTENTI.concat([UTENTE_OSPITE]).filter(function(u){return u.email!==emailCorrente});
  // Il confronto tiene conto anche dei nomi gia' personalizzati dagli altri.
  altri.forEach(function(u){
    try{
      var r=dbGetOne('SELECT nome FROM identita WHERE email=?',[u.email]);
      if(r&&r.nome)u=Object.assign({},u,{name:r.nome});
    }catch(e){}
    if(u.name.toLowerCase()===n.toLowerCase())altri.trovato=u.name;
  });
  if(altri.trovato)return 'Esiste gia\u0300 un altro utente con questo nome.';
  return null;
}

// Riscrive l'attribuzione ovunque e memorizza il nome scelto per l'account.
function rinominaUtente(vecchio,nuovo,email){
  var v=String(vecchio||''), n=String(nuovo||'').trim();
  if(!n||v===n)return {ok:false,motivo:'nessun cambiamento'};
  var prima=conteggioAttribuzioni(v);
  IDENTITA_COLONNE.forEach(function(c){
    try{ dbRun('UPDATE '+c[0]+' SET '+c[1]+'=? WHERE '+c[1]+'=?',[n,v]) }catch(e){}
  });
  // Il legame nome↔account e' su email, che non cambia mai: e' cio' che fa
  // ritrovare il nome scelto anche dopo un nuovo accesso.
  if(email){
    try{ dbRun('INSERT OR REPLACE INTO identita (email,nome,aggiornato_il) VALUES (?,?,?)',
      [email,n,new Date().toISOString()]) }catch(e){}
  }
  return {ok:true,righe:prima.totale,dettaglio:prima.dettaglio};
}

// Nome scelto per un account, se ne e' stato salvato uno.
function nomeDellAccount(email,predefinito){
  try{
    var r=dbGetOne('SELECT nome FROM identita WHERE email=?',[email]);
    return (r&&r.nome)?r.nome:predefinito;
  }catch(e){ return predefinito }
}

// Ripristina il nome scelto all'avvio, quando non si passa dal login. Senza,
// un ricaricamento riportava il nome a quello scritto in state.js mentre i
// contenuti erano gia' riattribuiti al nome nuovo: il profilo appariva vuoto e
// gli agenti sembravano spariti. E' l'orfanamento che la rinomina a cascata
// esiste per evitare, e va evitato anche qui.
function ripristinaIdentita(){
  try{
    if(typeof dbGetOne!=='function'||!profileData)return false;
    // All'avvio profileData viene da state.js, la cui email non e' quella di
    // un account (e' un indirizzo di facciata): l'account si riconosce dal
    // NOME di partenza, che a quel punto e' ancora quello scritto nel codice.
    var acc=UTENTI.concat([UTENTE_OSPITE]).filter(function(u){
      return u.email===profileData.email || u.name===profileData.name })[0];
    if(!acc)return false;
    var r=dbGetOne('SELECT nome FROM identita WHERE email=?',[acc.email]);
    if(!r||!r.nome||r.nome===profileData.name)return false;
    profileData.name=r.nome;
    profileData.email=acc.email;
    if(typeof inizialiDaNome==='function'){
      var i=inizialiDaNome(r.nome); if(i)profileData.iniziali=i;
    }
    return true;
  }catch(e){ return false }
}
