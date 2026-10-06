// ═══════════════════════════════════════════
// REGISTRAZIONE E RECUPERO PASSWORD
// ═══════════════════════════════════════════
// La schermata di accesso aveva solo il modulo e i quattro profili
// dimostrativi. Mancavano le due voci che chiunque si aspetta di trovare sotto
// un campo password — «non la ricordo» e «non ho un account» — e la loro
// assenza si nota: una schermata di accesso senza quelle due righe si legge
// come un mockup, non come un prodotto.
//
// I quattro profili dimostrativi restano come sono: sono scritti nel codice,
// servono a far entrare chi guarda senza chiedere niente, e cambiarli
// toglierebbe la cosa che li rende utili. Gli account creati da qui vivono nel
// database SQLite, come agenti, esecuzioni e documenti: stesso posto, stesso
// export, stessa cancellazione.
//
// ── Sul recupero password, una nota che vale la pena leggere ──
// Un'applicazione che gira solo nel browser non può inviare email. La strada
// disonesta sarebbe mostrare «ti abbiamo inviato le istruzioni» e non inviare
// niente: funziona finché nessuno controlla la casella. Qui si dice come
// stanno le cose — in un'installazione vera il collegamento arriva per posta,
// qui l'ambiente è locale e la nuova password si imposta sul dispositivo — e
// la reimpostazione resta possibile solo per gli account creati su QUESTO
// dispositivo. Sui profili dimostrativi la password non si cambia: sono
// scritti nel codice e devono restare quelli per chiunque apra il link.

// ── Lettura ───────────────────────────────────────────────────
function utenteRegistrato(email){
  var e=String(email||'').trim().toLowerCase();
  if(!e||typeof dbGetOne!=='function')return null;
  try{ return dbGetOne('SELECT * FROM utenti_registrati WHERE email=?',[e])||null }
  catch(err){ return null }
}

function emailValida(e){ return /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(String(e||'').trim()) }

function inizialiDa(nome){
  var p=String(nome||'').trim().split(/\s+/).filter(Boolean);
  if(!p.length)return '??';
  return ((p[0][0]||'')+(p.length>1?(p[p.length-1][0]||''):'')).toUpperCase();
}

// Colore dell'avatar: dipende dall'email, così resta lo stesso a ogni accesso
// invece di cambiare a ogni ricaricamento.
var COLORI_ACCOUNT=['#6366F1','#F59E0B','#EC4899','#EF4444','#10B981','#0EA5E9','#8B5CF6','#F97316'];
function coloreDa(email){
  var s=String(email||''), n=0;
  for(var i=0;i<s.length;i++)n=(n+s.charCodeAt(i))%997;
  return COLORI_ACCOUNT[n%COLORI_ACCOUNT.length];
}

// ── Registrazione ─────────────────────────────────────────────
function apriRegistrazione(){
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center">'+
      '<h2>Crea un account</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 16px;line-height:1.6">'+
      'L\'account viene creato nel database di questo dispositivo, insieme ai tuoi agenti e ai tuoi documenti. '+
      'In un\'installazione aziendale l\'accesso passerebbe dall\'SSO: qui non c\'è un server, quindi non c\'è nulla da inviare a nessuno.</p>'+
    '<div class="prop-group"><div class="prop-label">Nome e cognome</div>'+
      '<input class="prop-input" id="regNome" placeholder="Anna Bianchi" autocomplete="name"></div>'+
    '<div class="prop-group"><div class="prop-label">Email</div>'+
      '<input class="prop-input" id="regEmail" type="email" placeholder="anna.bianchi@azienda.it" autocomplete="email"></div>'+
    '<div class="prop-group"><div class="prop-label">Ruolo</div>'+
      '<input class="prop-input" id="regRuolo" placeholder="es. Responsabile Acquisti"></div>'+
    '<div class="prop-group"><div class="prop-label">Organizzazione</div>'+
      '<input class="prop-input" id="regOrg" placeholder="es. Direzione Operativa"></div>'+
    '<div class="prop-group"><div class="prop-label">Password</div>'+
      '<input class="prop-input" id="regPassword" type="password" placeholder="almeno 8 caratteri" autocomplete="new-password"></div>'+
    '<div class="prop-group"><div class="prop-label">Ripeti la password</div>'+
      '<input class="prop-input" id="regPassword2" type="password" autocomplete="new-password"></div>'+
    '<div id="regErrore" style="color:#EF4444;font-size:11.5px;min-height:18px;line-height:1.45"></div>'+
    '<div style="display:flex;gap:8px;margin-top:10px">'+
      '<button class="tb-btn primary" onclick="creaAccount()">Crea account ed entra</button>'+
      '<button class="tb-btn" onclick="closeModal()">Annulla</button></div>'
  );
  setTimeout(function(){ var c=document.getElementById('regNome'); if(c)c.focus() },120);
}

function creaAccount(){
  var err=document.getElementById('regErrore');
  var nome=(document.getElementById('regNome').value||'').trim();
  var email=(document.getElementById('regEmail').value||'').trim().toLowerCase();
  var ruolo=(document.getElementById('regRuolo').value||'').trim();
  var org=(document.getElementById('regOrg').value||'').trim();
  var p1=document.getElementById('regPassword').value||'';
  var p2=document.getElementById('regPassword2').value||'';

  if(nome.length<2){ err.textContent='Scrivi il tuo nome.'; return }
  if(!emailValida(email)){ err.textContent='L\'email non sembra valida.'; return }
  // I quattro profili dimostrativi non si possono sovrascrivere: sono il modo
  // in cui chiunque apre il link entra senza registrarsi, e devono restare
  // quelli.
  if(typeof profiloDimostrativo==='function'&&profiloDimostrativo(email)){
    err.textContent='Questa email è di un profilo dimostrativo: usala dal riquadro «Oppure entra con un profilo di prova».';
    return;
  }
  if(utenteRegistrato(email)){ err.textContent='Esiste già un account con questa email su questo dispositivo.'; return }
  if(p1.length<8){ err.textContent='La password deve avere almeno 8 caratteri.'; return }
  if(p1!==p2){ err.textContent='Le due password non coincidono.'; return }

  // Il nome è la chiave di attribuzione di agenti, esecuzioni e pubblicazioni:
  // due persone con lo stesso nome si vedrebbero il lavoro a vicenda.
  var nomeBreve=nome;
  try{
    if(typeof validaNomeUtente==='function'){
      var v=validaNomeUtente(nome,email);
      if(v&&v.errore){ err.textContent=v.errore; return }
    }
  }catch(e){}

  try{
    dbRun('INSERT INTO utenti_registrati (email,password,name,iniziali,colore,role,org,creato_il) VALUES (?,?,?,?,?,?,?,?)',
      [email,p1,nomeBreve,inizialiDa(nome),coloreDa(email),ruolo||'Utente',org||'—',new Date().toISOString()]);
    if(typeof persistDatabase==='function')persistDatabase();
  }catch(e){ err.textContent='Non è stato possibile creare l\'account: '+(e.message||e); return }

  closeModal();
  if(typeof showToast==='function')showToast('✅ Account creato: benvenuta/o, '+nomeBreve);
  if(typeof completeLogin==='function')completeLogin(email);
}

// ── Recupero password ─────────────────────────────────────────
function apriRecuperoPassword(){
  var pre=(document.getElementById('loginEmail')||{}).value||'';
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center">'+
      '<h2>Password dimenticata</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 14px;line-height:1.6">'+
      'Indica l\'email dell\'account. In un\'installazione aziendale riceveresti un collegamento per posta; '+
      'qui l\'applicazione gira interamente nel tuo browser e non c\'è un server che possa inviare email, '+
      'quindi la nuova password si imposta <strong>su questo dispositivo</strong>.</p>'+
    '<div class="prop-group"><div class="prop-label">Email</div>'+
      '<input class="prop-input" id="recEmail" type="email" value="'+escAttr(pre)+'" placeholder="nome@azienda.it"></div>'+
    '<div id="recPasso2" style="display:none">'+
      '<div class="prop-group"><div class="prop-label">Nuova password</div>'+
        '<input class="prop-input" id="recPassword" type="password" placeholder="almeno 8 caratteri" autocomplete="new-password"></div>'+
      '<div class="prop-group"><div class="prop-label">Ripeti la nuova password</div>'+
        '<input class="prop-input" id="recPassword2" type="password" autocomplete="new-password"></div>'+
    '</div>'+
    '<div id="recEsito" style="font-size:11.5px;min-height:18px;line-height:1.5"></div>'+
    '<div style="display:flex;gap:8px;margin-top:10px">'+
      '<button class="tb-btn primary" id="recBtn" onclick="recuperoPasswordAvanti()">Continua</button>'+
      '<button class="tb-btn" onclick="closeModal()">Chiudi</button></div>'
  );
  setTimeout(function(){ var c=document.getElementById('recEmail'); if(c)c.focus() },120);
}

var _recEmail=null;

function recuperoPasswordAvanti(){
  var esito=document.getElementById('recEsito');
  if(!_recEmail){
    var email=(document.getElementById('recEmail').value||'').trim().toLowerCase();
    if(!emailValida(email)){ esito.style.color='#EF4444'; esito.textContent='L\'email non sembra valida.'; return }

    // Sui profili dimostrativi la password non si cambia: sono scritti nel
    // codice e devono restare gli stessi per chiunque apra il link.
    var demo=(typeof profiloDimostrativo==='function')?profiloDimostrativo(email):null;
    if(demo&&!demo.ospite){
      esito.style.color='var(--tx3)';
      esito.innerHTML='Questo è un <strong>profilo dimostrativo</strong>: la sua password è fissa e si trova nel riquadro «Oppure entra con un profilo di prova», dove basta un clic sulla scheda per compilarla.';
      return;
    }

    var u=utenteRegistrato(email);
    if(!u){
      // Non si dice «questa email non esiste»: un modulo di recupero che
      // conferma o smentisce l'esistenza di un account è un modo gentile di
      // regalare l'elenco degli iscritti a chiunque provi.
      esito.style.color='var(--tx3)';
      esito.innerHTML='Se esiste un account con questa email, le istruzioni per reimpostare la password sono state preparate. '+
        '<br><span style="color:var(--tx4)">Nota: questo ambiente è locale e non ha account registrati con questo indirizzo.</span>';
      return;
    }

    _recEmail=email;
    document.getElementById('recPasso2').style.display='block';
    document.getElementById('recBtn').textContent='Imposta la nuova password';
    esito.style.color='var(--tx3)';
    esito.textContent='Account trovato su questo dispositivo. Scegli una nuova password.';
    setTimeout(function(){ var c=document.getElementById('recPassword'); if(c)c.focus() },120);
    return;
  }

  var p1=document.getElementById('recPassword').value||'';
  var p2=document.getElementById('recPassword2').value||'';
  if(p1.length<8){ esito.style.color='#EF4444'; esito.textContent='La password deve avere almeno 8 caratteri.'; return }
  if(p1!==p2){ esito.style.color='#EF4444'; esito.textContent='Le due password non coincidono.'; return }
  try{
    dbRun('UPDATE utenti_registrati SET password=? WHERE email=?',[p1,_recEmail]);
    if(typeof persistDatabase==='function')persistDatabase();
  }catch(e){ esito.style.color='#EF4444'; esito.textContent='Non è stato possibile aggiornare la password.'; return }

  var em=_recEmail; _recEmail=null;
  closeModal();
  if(typeof showToast==='function')showToast('✅ Password aggiornata');
  var campo=document.getElementById('loginEmail');
  if(campo)campo.value=em;
}
