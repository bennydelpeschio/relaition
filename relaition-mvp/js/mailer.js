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
      '<h2>Inviare email davvero</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
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

// ══════════════════════════════════════════════════════════════
// ALLEGATI FISSI DEL NODO EMAIL
// ══════════════════════════════════════════════════════════════
// Il nodo sapeva allegare solo i file PRODOTTI dal flusso: utile per un
// report, inutile per un listino, un modulo o delle condizioni contrattuali,
// che sono sempre gli stessi e vanno scelti una volta. Qui si allega un file
// vero, preso dal computer o dalla Knowledge Base, e resta sul nodo.
//
// I file vivono dentro la configurazione del nodo, quindi dentro l'agente
// salvato: è coerente con un prodotto interamente client-side (non c'è un
// server dove depositarli) ma ha un prezzo, il peso. Da qui il tetto.
var ALLEGATI_TETTO_BYTE = 2*1024*1024;   // 2 MB in tutto, non per file

function mailAllegatiFissi(cfg){
  return (cfg && cfg.allegatiFissi) ? cfg.allegatiFissi : [];
}

function mailPesoAllegati(lista){
  return (lista||[]).reduce(function(t,a){ return t+(a.byte||0) },0);
}

function mailFormattaByte(b){
  if(b<1024)return b+' B';
  if(b<1024*1024)return (b/1024).toFixed(0)+' KB';
  return (b/1024/1024).toFixed(1)+' MB';
}

// Pannello mostrato nel builder sotto i campi del nodo email.
function mailPannelloAllegati(nid){
  var n=(typeof B!=='undefined')?B.nodes.filter(function(x){return x.id===nid})[0]:null;
  if(!n)return '';
  var lista=mailAllegatiFissi(n.config);
  var peso=mailPesoAllegati(lista);
  var doc=[];
  try{ doc=dbAll('SELECT id,name,size FROM kb_docs ORDER BY name') }catch(e){}

  var chip=lista.map(function(a,i){
    return '<span class="allegato-chip" title="'+escHtml(a.nome)+' · '+mailFormattaByte(a.byte||0)+'">'+
      '<span class="allegato-nome">'+escHtml(a.nome)+'</span>'+
      '<span class="allegato-peso">'+mailFormattaByte(a.byte||0)+'</span>'+
      '<span class="allegato-x" title="Togli" onclick="mailTogliAllegato('+nid+','+i+')">✕</span></span>';
  }).join('');

  return '<div class="allegati-box">'+
    '<div class="allegati-testa">📎 Allegati fissi'+
      (lista.length?'<span class="allegati-conteggio">'+lista.length+' · '+mailFormattaByte(peso)+'</span>':'')+
    '</div>'+
    (lista.length?'<div class="allegati-lista">'+chip+'</div>':
      '<div class="allegati-vuoto">Nessuno. Vanno con ogni invio, in aggiunta ai file generati dal flusso.</div>')+
    '<div class="allegati-azioni">'+
      '<button class="tb-btn" onclick="mailScegliFile('+nid+')">📄 Dal computer</button>'+
      (doc.length?'<select class="prop-select allegati-sel" id="allegKb'+nid+'">'+
        '<option value="">documento dalla Knowledge Base</option>'+
        doc.map(function(d){ return '<option value="'+escHtml(d.id)+'">'+escHtml(d.name)+'</option>' }).join('')+
       '</select><button class="tb-btn" onclick="mailAllegaDaKB('+nid+')">Aggiungi</button>':'')+
    '</div>'+
    '<div class="allegati-nota">Il totale non può superare '+mailFormattaByte(ALLEGATI_TETTO_BYTE)+
      ': i file restano dentro l\u2019agente salvato, e un agente pesante rallenta tutto il resto.</div>'+
  '</div>';
}

function mailTogliAllegato(nid,i){
  var n=B.nodes.filter(function(x){return x.id===nid})[0];
  if(!n||!n.config||!n.config.allegatiFissi)return;
  var via=n.config.allegatiFissi.splice(i,1)[0];
  pushUndo&&pushUndo('allegato rimosso');
  renderProps(nid);
  showToast('📎 Tolto: '+(via?via.nome:'allegato'));
}

// Lettura vera del file scelto: nome, tipo e contenuto in base64, cioè quello
// che il servizio di invio si aspetta di ricevere.
function mailScegliFile(nid){
  var inp=document.createElement('input');
  inp.type='file'; inp.multiple=true;
  inp.onchange=function(){
    var files=Array.prototype.slice.call(inp.files||[]);
    if(!files.length)return;
    var n=B.nodes.filter(function(x){return x.id===nid})[0];
    if(!n)return;
    n.config=n.config||{}; n.config.allegatiFissi=n.config.allegatiFissi||[];
    var letti=0, scartati=[];
    files.forEach(function(f){
      var fr=new FileReader();
      fr.onload=function(){
        var peso=mailPesoAllegati(n.config.allegatiFissi);
        if(peso+f.size>ALLEGATI_TETTO_BYTE){
          scartati.push(f.name);
        }else{
          n.config.allegatiFissi.push({nome:f.name, mime:f.type||'application/octet-stream',
                                       dati:String(fr.result), byte:f.size});
        }
        if(++letti===files.length){
          renderProps(nid);
          if(scartati.length)showToast('⚠️ Oltre il tetto, non allegat'+(scartati.length===1?'o':'i')+': '+scartati.join(', '));
          else showToast('📎 '+files.length+' allegat'+(files.length===1?'o':'i')+' aggiunt'+(files.length===1?'o':'i'));
        }
      };
      fr.onerror=function(){ if(++letti===files.length)renderProps(nid) };
      fr.readAsDataURL(f);
    });
  };
  inp.click();
}

// Dalla Knowledge Base: il documento è già nel database, si trasforma in
// allegato senza passare dal disco.
function mailAllegaDaKB(nid){
  var sel=document.getElementById('allegKb'+nid);
  if(!sel||!sel.value){ showToast('⚠️ Scegli prima un documento'); return }
  var d=dbGetOne('SELECT name,content FROM kb_docs WHERE id=?',[sel.value]);
  if(!d){ showToast('⚠️ Documento non trovato'); return }
  var n=B.nodes.filter(function(x){return x.id===nid})[0];
  if(!n)return;
  n.config=n.config||{}; n.config.allegatiFissi=n.config.allegatiFissi||[];
  var testo=String(d.content||'');
  var byte=new Blob([testo]).size;
  if(mailPesoAllegati(n.config.allegatiFissi)+byte>ALLEGATI_TETTO_BYTE){
    showToast('⚠️ "'+d.name+'" supera il tetto degli allegati'); return;
  }
  var b64;
  try{ b64=btoa(unescape(encodeURIComponent(testo))) }
  catch(e){ b64=btoa(testo.replace(/[^\x00-\x7F]/g,'?')) }
  var nome=/\.[a-z0-9]{2,5}$/i.test(d.name)?d.name:(d.name+'.txt');
  n.config.allegatiFissi.push({nome:nome, mime:'text/plain', dati:'data:text/plain;base64,'+b64, byte:byte});
  renderProps(nid);
  showToast('📎 Allegato dalla Knowledge Base: '+nome);
}

// ══════════════════════════════════════════════════════════════
// «ALLEGA I FILE GENERATI DAL FLUSSO»: QUALI, ESATTAMENTE
// ══════════════════════════════════════════════════════════════
// Attivare l'opzione non basta: qualcuno, a monte, deve produrre quei file.
// Se non c'è, l'email parte senza allegati e nessuno lo dice — chi la riceve
// trova un messaggio che ne annuncia uno.
//
// La risposta giusta NON è un errore che sbarra: è mostrare cosa verrà
// allegato, e quando non c'è niente, permettere di sceglierlo lì per lì.
var MAIL_NODI_CHE_PRODUCONO = {'Esporta file':1,'Salva su cloud':1,'Google Drive':1,'SharePoint':1};

// Risale il grafo dal nodo email e raccoglie i blocchi che scrivono file.
function mailProduttoriAMonte(nid){
  var visti={}, coda=[nid], trovati=[];
  while(coda.length){
    var id=coda.shift();
    B.edges.forEach(function(e){
      if(e.to!==id||visti[e.from])return;
      visti[e.from]=1;
      var m=B.nodes.filter(function(x){return x.id===e.from})[0];
      if(m&&MAIL_NODI_CHE_PRODUCONO[m.name])trovati.push(m);
      coda.push(e.from);
    });
  }
  return trovati;
}

function mailPannelloFileDelFlusso(nid){
  var n=B.nodes.filter(function(x){return x.id===nid})[0];
  if(!n||!n.config||n.config.attach!=='Sì')return '';
  var prod=mailProduttoriAMonte(nid);

  if(prod.length){
    return '<div class="allegati-box">'+
      '<div class="allegati-testa">📄 Verranno allegati'+
        '<span class="allegati-conteggio">'+prod.length+'</span></div>'+
      '<div class="allegati-lista">'+prod.map(function(m){
        var c=m.config||{};
        var nome=(c.filename||'file')+'.'+String(c.format||'CSV').toLowerCase()
          .replace('testo','txt').replace('markdown','md');
        return '<span class="allegato-chip" onclick="jumpToNode('+m.id+')" style="cursor:pointer" '+
          'title="Prodotto da «'+escHtml(m.name)+'» · clicca per aprirlo">'+
          '<span class="allegato-nome">'+escHtml(nome)+'</span>'+
          '<span class="allegato-peso">'+escHtml(m.name)+'</span></span>';
      }).join('')+'</div>'+
      '<div class="allegati-nota">I nomi vengono dai blocchi che li generano: cambiandoli lì cambia l\u2019allegato.</div>'+
    '</div>';
  }

  // Nessun produttore: si offre di crearne uno, scegliendo il formato. È la
  // differenza fra dire «manca qualcosa» e permettere di aggiungerlo.
  return '<div class="allegati-box allegati-manca">'+
    '<div class="allegati-testa">📄 Nessun file da allegare</div>'+
    '<div class="allegati-vuoto">A monte non c\u2019è un blocco che produce file. '+
      'Scegli cosa generare: viene inserito un «Esporta file» subito prima dell\u2019invio.</div>'+
    '<div class="allegati-azioni">'+
      '<select class="prop-select allegati-sel" id="genFmt'+nid+'">'+
        ['PDF','Markdown','CSV','JSON','HTML','Testo'].map(function(f){
          return '<option value="'+f+'">'+f+'</option>' }).join('')+
      '</select>'+
      '<button class="tb-btn primary" onclick="mailCreaEsportaFile('+nid+')">➕ Genera e allega</button>'+
    '</div>'+
  '</div>';
}

// Inserisce un «Esporta file» fra il nodo email e ciò che lo precede, e lo
// collega: il flusso resta valido e l'allegato esiste davvero.
function mailCreaEsportaFile(nid){
  var n=B.nodes.filter(function(x){return x.id===nid})[0];
  if(!n)return;
  var fmt=(document.getElementById('genFmt'+nid)||{}).value||'PDF';
  pushUndo&&pushUndo('esporta file per allegato');

  var entranti=B.edges.filter(function(e){return e.to===nid});
  if(typeof ccMakeRoom==='function')ccMakeRoom(n.x, n.y, 135);
  var id=b_addNode('ou','💾','Esporta file','Allegato per l\u2019email', n.x, n.y);
  var nuovo=B.nodes.filter(function(x){return x.id===id})[0];
  nuovo.config=Object.assign(nuovo.config||{},{
    filename:'allegato-'+String(n.config.subject||'email').toLowerCase()
      .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').substring(0,28)||'allegato',
    format:fmt, title:(n.config.subject||'Allegato'),
    destination:'Solo genera (link nel registro)'
  });
  n.y += 135;

  // Si intercettano gli archi che entravano nell'email: passano dal nuovo nodo.
  entranti.forEach(function(e){ e.to=id });
  b_addEdge(id,'out',nid,'in','allegato');

  b_render(); renderProps(nid);
  showToast('📄 Aggiunto «Esporta file» ('+fmt+'): l\u2019email lo allegherà');
}
