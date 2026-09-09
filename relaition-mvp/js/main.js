// ═══════════════════════════════════════════
// RelAItion v3 — JavaScript Engine
// ═══════════════════════════════════════════

// ── LOGIN (demo — nessuna autenticazione reale, nessun dato lascia il
// browser: serve solo a dare completezza all'esperienza prodotto) ──
// La schermata non viene più rimossa dal documento, ma nascosta: così l'uscita
// può riportarla senza ricaricare la pagina. Ricaricare significava rifare da
// zero l'inizializzazione di SQLite — qualche secondo di attesa per tornare a
// una schermata che era già lì.
// Della dissolvenza vanno tenuti DUE riferimenti, non uno: il temporizzatore e
// l'ascoltatore di fine transizione. Se si esce mentre la dissolvenza è ancora
// pendente, il temporizzatore scatta dopo e nasconde la schermata appena
// riportata; e l'ascoltatore — registrato con `once` ma mai consumato, perché
// la transizione non è arrivata in fondo — si aggancia alla transizione
// SUCCESSIVA, che è proprio quella di riapparizione, e la spegne sul nascere.
// Sintomo di entrambi: si preme «Esci» e sembra che non succeda niente.
var _veloTimer=null, _veloVia=null;

function fermaDissolvenza(ls){
  clearTimeout(_veloTimer);
  if(_veloVia && ls){ ls.removeEventListener('transitionend',_veloVia); _veloVia=null }
}

function hideLoginScreen(immediato){
  var ls=document.getElementById('loginScreen');
  if(!ls)return;
  fermaDissolvenza(ls);
  var via=function(){ ls.style.display='none'; ls.classList.remove('uscita'); _veloVia=null };
  // `immediato` serve all'avvio: se l'accesso è già stato fatto in precedenza
  // la schermata non deve nemmeno comparire, e dissolverla mostrerebbe un
  // lampo di login a chi non lo ha chiesto.
  if(immediato){ via(); return }
  // Dissolvenza invece di sparizione istantanea: al taglio secco si vedeva il
  // salto fra due schermate diverse.
  ls.classList.add('uscita');
  _veloVia=via;
  ls.addEventListener('transitionend',via,{once:true});
  // Rete di sicurezza: se la transizione non parte — scheda in secondo piano,
  // animazioni ridotte a livello di sistema — il velo deve sparire lo stesso.
  _veloTimer=setTimeout(via,420);
}

function mostraLoginScreen(){
  var ls=document.getElementById('loginScreen');
  if(!ls){ location.reload(); return }
  fermaDissolvenza(ls);
  var e=document.getElementById('loginEmail'); if(e)e.value='';
  var p=document.getElementById('loginPassword'); if(p)p.value='';
  var err=document.getElementById('loginError'); if(err)err.textContent='';
  if(typeof renderAccountDisponibili==='function')renderAccountDisponibili();
  // Compare trasparente e si accende: entra come esce. Il ricalcolo forzato
  // fa partire la transizione da zero senza dipendere da `requestAnimationFrame`,
  // che a finestra minimizzata non arriva — e senza, la schermata resterebbe
  // invisibile pur essendo lì.
  ls.classList.add('uscita');
  ls.style.display='flex';
  void ls.offsetWidth;
  ls.classList.remove('uscita');
}

function completeLogin(email){
  localStorage.setItem('relaition_logged_in','1');
  if(email)localStorage.setItem('relaition_login_email',email);
  // L'identità va applicata PRIMA di mostrare l'applicazione: le pagine si
  // disegnano leggendo profileData, e farlo dopo mostrerebbe per un istante
  // i dati dell'utente precedente.
  if(typeof applicaUtente==='function')applicaUtente(utenteDaEmail(email));
  // La pagina di destinazione si disegna MENTRE il velo è ancora davanti, così
  // quando si dissolve sotto c'è già il contenuto giusto. L'ordine inverso —
  // togliere il velo e poi disegnare — lasciava vedere il contenuto vecchio
  // per tutto il tempo del disegno.
  //
  // L'indirizzo comanda anche dopo l'accesso: chi apre un collegamento a
  // `#monitoraggio` e passa dalla schermata di login deve arrivare dove
  // voleva andare, non sulla dashboard.
  if(typeof navPaginaIniziale==='function')go(navPaginaIniziale());
  // Un fotogramma di respiro prima di scoprire: dà al browser il tempo di
  // dipingere quello che è appena stato disegnato.
  var scoperto=false;
  var scopri=function(){ if(scoperto)return; scoperto=true; hideLoginScreen() };
  requestAnimationFrame(function(){ requestAnimationFrame(scopri) });
  // I fotogrammi non arrivano se la finestra è minimizzata o la scheda è in
  // secondo piano: senza questa rete l'accesso resterebbe fermo sulla
  // schermata di login finché qualcuno non riporta la finestra in primo piano.
  setTimeout(scopri,250);
}

function doLogin(e){
  if(e)e.preventDefault();
  var email=document.getElementById('loginEmail').value.trim();
  var pass=document.getElementById('loginPassword').value;
  var err=document.getElementById('loginError');
  if(!email||!pass){err.textContent='Inserisci email e password';return false}

  // Account riconosciuto: la password deve corrispondere. Per un indirizzo
  // qualunque si entra lo stesso come ospite — è una demo, e impedire l'accesso
  // a chi prova un'email a caso servirebbe solo a bloccarlo fuori.
  var u=(typeof utenteDaEmail==='function')?utenteDaEmail(email):null;
  if(u&&pass!==u.password){
    err.textContent='Password non corretta per questo account';
    return false;
  }
  err.textContent='';
  completeLogin(email);
  return false;
}

function doGuestLogin(){completeLogin(UTENTE_OSPITE.email)}

function logout(){
  if(!confirm('Uscire da RelAItion?'))return;
  localStorage.removeItem('relaition_logged_in');
  localStorage.removeItem('relaition_login_email');
  // Niente ricaricamento: rifare l'inizializzazione di SQLite costava qualche
  // secondo di schermata vuota per tornare a una schermata che c'è già.
  // Chi rientra passa comunque da `applicaUtente`, che ricarica i contenuti
  // dell'utente scelto: nessun dato dell'uno resta in mano all'altro.
  mostraLoginScreen();
}

// Se in questo browser è già stato fatto login in precedenza, salta la
// schermata — deve ripresentarsi solo dopo un logout esplicito.
// L'identita' va ripristinata prima di nascondere la schermata di accesso:
// le pagine si disegnano leggendo profileData.
if(typeof ripristinaUtente==='function')ripristinaUtente();
if(localStorage.getItem('relaition_logged_in'))hideLoginScreen(true);
else if(typeof renderAccountDisponibili==='function')renderAccountDisponibili();

document.addEventListener('click',function(e){
  if(notifOpen&&!e.target.closest('.notif-panel')&&!e.target.closest('.tb-icon-btn')){
    notifOpen=false;document.getElementById('notifPanel').classList.remove('show');
  }
});

document.addEventListener('keydown',function(e){
  if(currentPage!=='builder')return;
  var tag=(document.activeElement&&document.activeElement.tagName)||'';
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
  // Annulla/ripristina con le scorciatoie attese (B10)
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey){undoCanvas();e.preventDefault();return}
  if((e.ctrlKey||e.metaKey)&&(e.key.toLowerCase()==='y'||(e.key.toLowerCase()==='z'&&e.shiftKey))){redoCanvas();e.preventDefault();return}
  // Ctrl+A seleziona tutti i nodi: con la selezione multipla disponibile è
  // la scorciatoia che ci si aspetta per svuotare o spostare un canvas intero.
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'){copySelection();e.preventDefault();return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='v'){pasteSelection();e.preventDefault();return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){
    // Duplicazione diretta, senza passare dagli appunti: è la scorciatoia
    // attesa quando si vuole solo un secondo nodo uguale.
    if(B.selIds&&B.selIds.length){copySelection();pasteSelection()}
    else if(B.selId>0)duplicateNode(B.selId);
    e.preventDefault();return;
  }
  // Ctrl+E esclude o reinserisce la selezione: come commentare una riga
  // nell'editor, che è esattamente il gesto a cui serve corrispondere.
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='e'){
    if(typeof toggleEsclusoSelezione==='function')toggleEsclusoSelezione();
    e.preventDefault();return;
  }
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){
    B.selIds=B.nodes.map(function(n){return n.id});B.selId=-1;B.selEdgeIdx=-1;
    b_render();renderProps(-1);e.preventDefault();return;
  }
  if((e.key==='Delete'||e.key==='Backspace')){
    if(B.selIds&&B.selIds.length){
      deleteSelectedNodes();e.preventDefault();
    }else if(B.selEdgeIdx!==undefined&&B.selEdgeIdx>=0){
      B.edges.splice(B.selEdgeIdx,1);B.selEdgeIdx=-1;b_render();showToast('🗑️ Connessione eliminata');e.preventDefault();
    }else if(B.selId>0){
      deleteNode(B.selId);e.preventDefault();
    }
  }
  if(e.key==='Escape'){B.selId=-1;B.selEdgeIdx=-1;B.selIds=[];renderProps(-1);b_render()}
});

// ── INSTALLAZIONE COME APPLICAZIONE ──
// Il service worker richiede un'origine servita (http/https): aprendo il file
// con un doppio click il browser lo rifiuta, ed è corretto che sia così.
// L'app continua a funzionare identica, semplicemente non è installabile —
// e va detto invece di lasciare un pulsante che non fa nulla.
var _promptInstall=null;

window.addEventListener('beforeinstallprompt',function(e){
  e.preventDefault();
  _promptInstall=e;
  var b=document.getElementById('btnInstallApp');
  if(b)b.style.display='';
});

window.addEventListener('appinstalled',function(){
  _promptInstall=null;
  var b=document.getElementById('btnInstallApp');
  if(b)b.style.display='none';
  showToast('✅ RelAItion installata: la trovi fra le applicazioni del computer');
  addAct('Installata RelAItion come applicazione');
});

function installApp(){
  if(_promptInstall){
    _promptInstall.prompt();
    _promptInstall.userChoice.then(function(scelta){
      if(scelta.outcome!=='accepted')showToast('Installazione annullata: puoi rifarla quando vuoi da questo pulsante');
      _promptInstall=null;
    });
    return;
  }
  openInstallGuide();
}

function openInstallGuide(){
  var daFile=location.protocol==='file:';
  var giaInstallata=window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches;
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>⬇️ Installa RelAItion sul computer</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    (giaInstallata
      ? '<p style="font-size:12.5px;color:var(--tx2);margin:12px 0">✅ Stai già usando RelAItion come applicazione installata.</p>'
      : daFile
      ? '<p style="font-size:12.5px;color:var(--tx2);margin:12px 0;line-height:1.6">Hai aperto RelAItion come <strong>file locale</strong>. In questa modalità il browser non consente l\'installazione, per una regola di sicurezza che vale per tutti i siti aperti da file.<br><br>L\'applicazione funziona comunque per intero. Per poterla installare serve servirla da un indirizzo, anche solo sul tuo computer:</p>'+
        '<div style="background:var(--bg2);border-radius:8px;padding:12px;font-family:monospace;font-size:11.5px;line-height:1.7">'+
        'cd "cartella di relaition-mvp"<br>python -m http.server 8099</div>'+
        '<p style="font-size:12px;color:var(--tx3);margin-top:10px">Poi apri <code>http://localhost:8099</code> e il pulsante «Installa app» comparirà da solo.</p>'
      : '<p style="font-size:12.5px;color:var(--tx2);margin:12px 0;line-height:1.6">Il browser non ha ancora proposto l\'installazione. Puoi forzarla dal menu del browser:</p>'+
        '<div style="font-size:12.5px;color:var(--tx2);line-height:1.9">'+
        '<div><strong>Chrome / Edge</strong>: icona ⊕ nella barra degli indirizzi, oppure menu ⋮ → «Installa RelAItion»</div>'+
        '<div><strong>Safari</strong>: Condividi → «Aggiungi al Dock»</div>'+
        '</div>')+
    '<div style="border-top:1px solid var(--bo);margin-top:16px;padding-top:12px;font-size:11.5px;color:var(--tx3);line-height:1.6">'+
      '<strong>Cosa cambia una volta installata:</strong> finestra propria senza barra del browser, icona fra le applicazioni, avvio anche senza connessione. '+
      'I dati restano dove sono adesso: nel database locale del browser, e non vengono duplicati né spostati.'+
    '</div>'+
    // Lo stato reale del service worker va detto: se non si registra,
    // l'installazione non sarà possibile qualunque cosa faccia l'utente, e
    // lasciarglielo scoprire da solo è la peggior forma di silenzio.
    (window.__swAttivo===false
      ? '<div style="font-size:11px;color:#B45309;background:#FEF3C7;border-radius:8px;padding:10px 12px;margin-top:12px;line-height:1.6">'+
        '⚠️ <strong>Questo browser rifiuta il service worker</strong>, che è il requisito tecnico dell\'installazione.'+
        (window.__swErrore?'<br><span style="font-family:monospace;font-size:10px">'+escHtml(String(window.__swErrore).substring(0,120))+'</span>':'')+
        '<br>Il file è servito correttamente: l\'ostacolo è una restrizione del browser o del profilo in uso. Su Chrome o Edge normali l\'installazione funziona.</div>'
      : window.__swAttivo===true
      ? '<div style="font-size:11px;color:#047857;margin-top:12px">✅ Service worker attivo: l\'app funziona anche senza connessione.</div>'
      : '')+
    '<div style="font-size:11px;color:var(--tx4);margin-top:10px;line-height:1.6">'+
      'ℹ️ Non è un pacchetto del Microsoft Store: è un\'applicazione web installabile. Per pubblicarla sullo Store servirebbe un pacchetto MSIX firmato, generabile in seguito da questa stessa applicazione.'+
    '</div>'
  ,true);
}

// Il pulsante resta visibile anche quando il browser non ha ancora emesso
// beforeinstallprompt: cliccandolo si ottiene comunque una spiegazione utile
// invece del nulla.
function updateInstallButton(){
  var b=document.getElementById('btnInstallApp');
  if(!b)return;
  var standalone=window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches;
  b.style.display=standalone?'none':'';
}

// Il pulsante va mostrato in ogni caso: se il service worker non si registra
// (apertura da file locale, browser incorporato, restrizioni aziendali) il
// click apre comunque la guida, che spiega perché e come fare. Legarlo
// all'esito della registrazione lo faceva sparire proprio quando serviva.
window.addEventListener('load',function(){
  updateInstallButton();
  if('serviceWorker' in navigator && location.protocol!=='file:'){
    navigator.serviceWorker.register('sw.js').then(function(){
      window.__swAttivo=true;
    }).catch(function(e){
      window.__swAttivo=false;
      window.__swErrore=e.message;
      console.warn('Service worker non registrato:',e.message);
    });
  }
});

initDatabase().then(function(){
  loadPersistedContent();
  seedPoliciesOnce();
  // Le recensioni del catalogo sono dati, non decorazione: vivono nella stessa
  // tabella di quelle scritte dall'utente e il seme non tocca cio' che esiste.
  if(typeof recSemina==='function'){try{recSemina()}catch(e){}}
  if(typeof ripristinaMenu==='function')ripristinaMenu();
  // Blocco F: dati dimostrativi al primo avvio, mai sopra il lavoro esistente.
  if(typeof seedDemoData==="function"){
    var _s=seedDemoData();
    if(!_s.saltato)addAct("Caricati i dati dimostrativi: "+_s.flussi+" flussi, "+_s.documenti+" documenti, "+_s.esecuzioni+" esecuzioni");
  }
  // La configurazione AI verificata nella stessa scheda torna disponibile: un
  // ricaricamento non deve scollegare tutti i nodi AI a meta' dimostrazione.
  if(typeof ripristinaProviderDaSessione==='function'){
    var _n=ripristinaProviderDaSessione();
    if(_n){
      addAct('Ripristinata la configurazione AI di questa sessione ('+_n+' fornitore/i)');
      if(typeof refreshStatoAI==='function')refreshStatoAI();
      if(typeof aggiornaCampoChiaveAI==='function')aggiornaCampoChiaveAI();
    }
  }
  // Identita' e profilo salvati: vanno riletti anche aprendo l'applicazione
  // senza passare dal login (un semplice ricaricamento). Prima l'identita' del
  // nome, poi il resto del profilo, che e' indicizzato per nome.
  if(typeof ripristinaIdentita==='function')ripristinaIdentita();
  if(typeof caricaProfiloSalvato==='function')caricaProfiloSalvato();
  if(typeof aggiornaIntestazioneUtente==='function')aggiornaIntestazioneUtente();
  if(typeof aggiornaBadgeMarketplace==='function')aggiornaBadgeMarketplace();
  if(typeof aggiornaBadgePubblicazioni==='function')aggiornaBadgePubblicazioni();
  addAct('Benvenuto su RelAItion!');
  renderDashboard();
  // Il pallino sul menu Governo conta i segnali aperti: senza, il cruscotto
  // andrebbe visitato per scoprire che c'era qualcosa da guardare.
  if(typeof aggiornaBadgeMonitoraggio==='function')aggiornaBadgeMonitoraggio();
  startScheduler();
  var ov=document.getElementById('bootOverlay');
  if(ov)ov.remove();
}).catch(function(e){
  console.error('Errore inizializzazione database',e);
  var ov=document.getElementById('bootOverlay');
  if(ov)ov.innerHTML='<div style="font-size:32px">⚠️</div><div style="font-size:13px;color:#FCA5A5;max-width:320px;text-align:center">Impossibile inizializzare il database locale: '+e.message+'<br><br>Ricarica la pagina o verifica la connessione (serve al primo avvio per scaricare il motore SQLite).</div>';
});
