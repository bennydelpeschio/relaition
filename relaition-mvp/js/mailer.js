// ══════════════════════════════════════════════════════════════
// INVIO EMAIL TRAMITE SERVIZIO LOCALE
// ══════════════════════════════════════════════════════════════
// SMTP viaggia su TCP e una pagina web parla solo HTTP: il divario si colma
// con un piccolo servizio in ascolto su localhost (servizio-mail/), che riceve
// la richiesta dal builder e la inoltra al server di posta.
//
// Le credenziali NON stanno qui. Il servizio le chiede all'avvio e le tiene nel
// proprio processo: la pagina invia solo destinatario, oggetto e corpo. È la
// ragione per cui questa strada è preferibile a un campo "password" nel nodo —
// che finirebbe nel database, negli export e nelle pubblicazioni.

var MAIL_URL = 'http://127.0.0.1:8787';
// Quanto vale una verifica positiva prima di rifarla: abbastanza da non
// interrogare il servizio a ogni nodo, poco da accorgersi se viene fermato.
var MAIL_TTL_MS = 30000;
var MAIL_STATO = { disponibile:false, verificato:false, mittente:null, server:null, errore:null, controllatoIl:0 };

// Interroga il servizio. Non è un errore che non risponda: significa solo che
// non è stato avviato, e il nodo email ricade sulla simulazione dichiarandolo.
function mailVerificaServizio(){
  return fetch(MAIL_URL + '/stato', { method:'GET', mode:'cors' })
    .then(function(r){ return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)) })
    .then(function(d){
      MAIL_STATO = { disponibile:true, verificato:true, mittente:d.mittente,
                     server:d.server, inviate:d.inviate||0, errore:null,
                     controllatoIl:Date.now() };
      return MAIL_STATO;
    })
    .catch(function(e){
      // Distinguere "spento" da "acceso ma non autorizzato a parlare con
      // questa pagina" e' impossibile dal browser: entrambi arrivano come la
      // stessa eccezione. Si dichiarano quindi tutte e due, con l'origine
      // effettiva, invece di affermare che il servizio non e' in ascolto —
      // che quando il servizio e' avviato e' semplicemente falso.
      MAIL_STATO = { disponibile:false, verificato:true, mittente:null, server:null,
                     errore:'Nessuna risposta da '+MAIL_URL+': il servizio non e\u0300 avviato, oppure e\u0300 avviato ma non autorizza questa pagina ('+location.origin+')',
                     controllatoIl:Date.now() };
      return MAIL_STATO;
    });
}

// Invio reale. Restituisce sempre un esito descritto, mai un'eccezione nuda:
// il registro di esecuzione deve poter dire cosa è successo.
function mailInvia(spec){
  return fetch(MAIL_URL + '/invia', {
    method:'POST', mode:'cors',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({
      a: spec.a, cc: spec.cc || '',
      oggetto: spec.oggetto || '', corpo: spec.corpo || '',
      html: !!spec.html, allegati: spec.allegati || []
    })
  })
  .then(function(r){ return r.json().then(function(d){ return { http:r.status, dati:d } }) })
  .then(function(x){
    if(x.dati && x.dati.ok) return { ok:true, destinatario:x.dati.destinatario, inviate:x.dati.inviate };
    return { ok:false, errore:(x.dati && x.dati.errore) || ('Errore HTTP ' + x.http) };
  })
  .catch(function(e){
    return { ok:false, errore:'Servizio di invio non raggiungibile: avvia servizio-mail/relaition-mail.ps1' };
  });
}

// Gli allegati sono i file che il flusso ha appena generato: si prendono da
// LAST_RUN_FILES, convertiti in data URL perché il servizio li ricostruisca.
function mailAllegatiDelFlusso(){
  if(typeof LAST_RUN_FILES === 'undefined' || !LAST_RUN_FILES.length) return [];
  return LAST_RUN_FILES.map(function(f){
    var mime = f.mime || 'application/octet-stream';
    // btoa non regge i caratteri oltre l'ASCII: si passa da UTF-8 esplicito,
    // altrimenti un allegato con accenti fa fallire l'invio.
    var b64;
    try{
      b64 = btoa(unescape(encodeURIComponent(f.contenuto)));
    }catch(e){
      b64 = btoa(String(f.contenuto).replace(/[^\x00-\x7F]/g,'?'));
    }
    return { nome:f.nome, mime:mime, dati:'data:' + mime + ';base64,' + b64 };
  });
}

// Riquadro di stato mostrato nel pannello del nodo email.
function mailPannelloStato(){
  if(!MAIL_STATO.verificato){
    // La verifica è asincrona: si chiede ora e si ridisegna quando risponde.
    mailVerificaServizio().then(function(){
      if(typeof B !== 'undefined' && B.selId > 0 && typeof renderProps === 'function') renderProps(B.selId);
    });
    return '<div style="font-size:10.5px;color:var(--tx4);background:var(--bg2);border-radius:6px;padding:7px 9px">' +
           'Verifico il servizio di invio…</div>';
  }
  if(MAIL_STATO.disponibile){
    // Un invio di prova vero è l'unica verifica che conta: dice che
    // credenziali, server e destinatario funzionano insieme, non uno per uno.
    return '<div style="font-size:10.5px;color:#047857;background:#D1FAE5;border-radius:6px;padding:8px 10px;line-height:1.5">' +
      '✅ <strong>Invio reale attivo</strong><br>' +
      'Mittente: ' + escHtml(MAIL_STATO.mittente || '—') + ' · server ' + escHtml(MAIL_STATO.server || '—') +
      '<br>Le credenziali restano nel servizio: non passano da questa pagina.' +
      '<div style="margin-top:7px"><button class="tb-btn" style="width:100%;height:30px;font-size:11px" ' +
        'onclick="mailProvaInvio()">📨 Invia un\'email di prova</button></div>' +
      '<div id="mailEsitoProva" style="margin-top:5px"></div></div>';
  }
  // L'invio è reale non appena il servizio è in ascolto: non c'è una modalità
  // "finta" scelta dalla piattaforma. Le istruzioni sono qui, in tre passi,
  // perché è questo il punto in cui servono.
  return '<div style="font-size:10.5px;color:#B45309;background:#FEF3C7;border-radius:8px;padding:10px 12px;line-height:1.55">' +
    '⚠️ <strong>Il servizio di invio non è avviato</strong>: finché resta spento le email vengono registrate come simulate.<br><br>' +
    '<strong>Per inviare davvero, in tre passi:</strong>' +
    '<div style="margin:6px 0 0;padding-left:2px">' +
      '<div style="margin-bottom:5px"><strong>1.</strong> Doppio click su <code>servizio-mail/AVVIA-SERVIZIO-MAIL.cmd</code></div>' +
      '<div style="margin-bottom:5px"><strong>2.</strong> Scegli <code>1</code> (Gmail), inserisci il tuo indirizzo e la <strong>password per le app</strong> ' +
        '(<a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" style="color:#B45309;text-decoration:underline">generala qui</a>: quella dell\'account viene rifiutata da Google)</div>' +
      '<div><strong>3.</strong> Ti arriva un messaggio di prova: da quel momento l\'invio è reale.</div>' +
    '</div>' +
    '<div style="display:flex;gap:6px;margin-top:9px">' +
      '<button class="tb-btn" style="flex:1;justify-content:center;height:30px;font-size:11px" onclick="mailRiverifica()">🔄 L\'ho avviato, ricontrolla</button>' +
      '<button class="tb-btn" style="height:30px;font-size:11px" title="Istruzioni complete" onclick="mailIstruzioni()">❓</button>' +
    '</div></div>';
}

// Istruzioni per esteso, con le trappole di ciascun provider: sono le ragioni
// per cui un invio non parte, e conviene averle sotto mano al primo tentativo.
function mailIstruzioni(){
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center">'+
      '<h2>📧 Inviare email davvero</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12.5px;color:var(--tx2);margin:12px 0;line-height:1.65">'+
      'Una pagina web non può aprire una connessione SMTP: SMTP viaggia su TCP, il browser parla solo HTTP. '+
      'Il servizio incluso colma esattamente quel divario: riceve la richiesta dal builder e la inoltra al server di posta.</p>'+
    '<div style="background:var(--bg2);border-radius:10px;padding:14px 16px;font-size:12.5px;line-height:1.75">'+
      '<strong>1.</strong> Doppio click su <code>servizio-mail/AVVIA-SERVIZIO-MAIL.cmd</code><br>'+
      '<strong>2.</strong> Scegli il provider e inserisci utente e password<br>'+
      '<strong>3.</strong> Il servizio invia <strong>un messaggio di prova a te stesso</strong>: se arriva, è configurato<br>'+
      '<strong>4.</strong> Lascia la finestra aperta mentre usi RelAItion'+
    '</div>'+
    '<h3 style="font-size:13px;margin:16px 0 8px">La trappola di ciascun provider</h3>'+
    '<table style="width:100%;border-collapse:collapse;font-size:12px">'+
      '<tr><td style="padding:6px 0;border-bottom:1px solid var(--bg2)"><strong>Gmail</strong></td>'+
        '<td style="padding:6px 0;border-bottom:1px solid var(--bg2);color:var(--tx3)">Serve una password per le app, con verifica in due passaggi attiva. Quella dell\'account viene rifiutata.</td></tr>'+
      '<tr><td style="padding:6px 0;border-bottom:1px solid var(--bg2)"><strong>Microsoft 365</strong></td>'+
        '<td style="padding:6px 0;border-bottom:1px solid var(--bg2);color:var(--tx3)">SMTP di base è disabilitato sui tenant nuovi: va riabilitato dall\'amministratore.</td></tr>'+
      '<tr><td style="padding:6px 0;border-bottom:1px solid var(--bg2)"><strong>SendGrid</strong></td>'+
        '<td style="padding:6px 0;border-bottom:1px solid var(--bg2);color:var(--tx3)">L\'utente è letteralmente <code>apikey</code>; la chiave va al posto della password.</td></tr>'+
      '<tr><td style="padding:6px 0"><strong>Aruba</strong></td>'+
        '<td style="padding:6px 0;color:var(--tx3)">SSL diretto sulla porta 465.</td></tr>'+
    '</table>'+
    '<div style="font-size:11.5px;color:var(--tx3);background:var(--bg2);border-radius:8px;padding:11px 13px;margin-top:14px;line-height:1.6">'+
      '🔒 La password resta nella finestra del servizio: non passa dal browser, non entra nel database, '+
      'non finisce nei flussi esportati. Chiudendo la finestra sparisce.</div>'+
    '<button class="tb-btn primary mt-16" style="width:100%;justify-content:center" onclick="closeModal();mailRiverifica()">🔄 Ho avviato il servizio, ricontrolla</button>'
  );
}

function mailRiverifica(){
  MAIL_STATO.verificato = false;
  mailVerificaServizio().then(function(s){
    if(typeof showToast === 'function')
      showToast(s.disponibile ? '✅ Servizio di invio collegato: ' + s.mittente
                              : '⚠️ Servizio ancora non raggiungibile');
    if(typeof B !== 'undefined' && B.selId > 0 && typeof renderProps === 'function') renderProps(B.selId);
  });
}

// Invio di prova reale: usa il destinatario scritto sul nodo, se c'e',
// altrimenti il mittente stesso. E' l'unica verifica che dice davvero se
// credenziali, server e destinatario funzionano INSIEME.
function mailProvaInvio(){
  var box=document.getElementById('mailEsitoProva');
  var mostra=function(html){ if(box)box.innerHTML=html };
  var n=(typeof B!=='undefined'&&B.selId>0)?B.nodes.find(function(x){return x.id===B.selId}):null;
  var a=(n&&n.config&&n.config.to&&!/\{\{/.test(n.config.to))?n.config.to:MAIL_STATO.mittente;
  if(!a){ mostra('<span style="color:#B45309">Nessun destinatario: compila il campo Destinatario.</span>'); return }

  mostra('<span style="color:var(--tx4)">Invio a '+escHtml(a)+'\u2026</span>');
  mailInvia({
    a:a, oggetto:'RelAItion: email di prova',
    corpo:'Questo messaggio conferma che il nodo email invia realmente.\n\n'+
          'Inviato il '+new Date().toLocaleString('it-IT')+' dal flusso "'+
          (typeof currentAgentName!=='undefined'?currentAgentName:'senza nome')+'".',
    html:false, allegati:[]
  }).then(function(r){
    if(r.ok){
      mostra('<span style="color:#047857">\u2705 Inviata a '+escHtml(r.destinatario)+': controlla la casella.</span>');
      if(typeof showToast==='function')showToast('\ud83d\udce8 Email di prova inviata a '+r.destinatario);
    }else{
      mostra('<span style="color:#B91C1C">\u274c '+escHtml(r.errore)+'</span>');
    }
  });
}
