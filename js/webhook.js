// ══════════════════════════════════════════════════════════════
// WEBHOOK IN ASCOLTO
// ══════════════════════════════════════════════════════════════
// Una pagina web può fare chiamate, non riceverle. Il ricevitore locale
// (servizio-webhook/) accetta le chiamate esterne e le tiene in coda; il
// builder le preleva e avvia il flusso con i dati arrivati.
//
// È il funzionamento di n8n riportato in un contesto senza backend: chi chiama
// non parla direttamente col browser, ma lascia il messaggio a un intermediario
// che il browser interroga.

var WH_URL = 'http://127.0.0.1:8788';
var WH_STATO = { disponibile:false, verificato:false, ricevute:0, errore:null };
var WH_ASCOLTO = null;     // { nodeId, percorso, timer } quando è attivo

function whVerificaServizio(){
  return fetch(WH_URL + '/stato', { method:'GET', mode:'cors' })
    .then(function(r){ return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)) })
    .then(function(d){
      WH_STATO = { disponibile:true, verificato:true, ricevute:d.ricevute||0,
                   inCoda:d.inCoda||0, errore:null };
      return WH_STATO;
    })
    .catch(function(){
      WH_STATO = { disponibile:false, verificato:true, ricevute:0,
                   errore:'Ricevitore non in ascolto su ' + WH_URL };
      return WH_STATO;
    });
}

// Preleva le chiamate accumulate su un percorso. Il servizio le rimuove dalla
// coda: una chiamata deve avviare il flusso una volta sola.
function whPreleva(percorso){
  return fetch(WH_URL + '/preleva?percorso=' + encodeURIComponent(percorso), { mode:'cors' })
    .then(function(r){ return r.json() })
    .then(function(d){ return (d && d.chiamate) || [] })
    .catch(function(){ return [] });
}

// Traduce una chiamata ricevuta nei dati che aprono la pipeline. L'ordine conta:
// il JSON del corpo è il caso normale, la query string serve alle integrazioni
// che chiamano con soli parametri in URL, il testo grezzo copre i file.
function whDatiDaChiamata(c){
  if(c.json && typeof c.json === 'object'){
    var unione = {};
    Object.keys(c.query || {}).forEach(function(k){ unione[k] = c.query[k] });
    Object.keys(c.json).forEach(function(k){ unione[k] = c.json[k] });
    return { testo: JSON.stringify(unione, null, 2), tipo:'JSON', campi:Object.keys(unione) };
  }
  if(c.query && Object.keys(c.query).length){
    return { testo: JSON.stringify(c.query, null, 2), tipo:'parametri URL', campi:Object.keys(c.query) };
  }
  if(c.testo && c.testo.trim()){
    // Contenuto non strutturato: arriva ai nodi come testo, esattamente come
    // un file caricato a mano. È il caso di chi passa un documento.
    return { testo: (c.nomeFile ? '[FILE: ' + c.nomeFile + ']\n' : '') + c.testo,
             tipo: c.nomeFile ? 'file' : 'testo', campi:[] };
  }
  return { testo:'{}', tipo:'vuota', campi:[] };
}

// ── Ascolto attivo ────────────────────────────────────────────
// Il builder interroga il ricevitore a intervalli. Non è un sondaggio
// nascosto: parte solo quando l'utente lo chiede e si ferma da solo alla
// prima chiamata, perché il senso è vedere il flusso partire davvero.
function whAvviaAscolto(nodeId){
  var n = B.nodes.find(function(x){ return x.id === nodeId });
  if(!n) return;
  var percorso = (n.config && n.config.path) || '/hooks/test';
  if(percorso.charAt(0) !== '/') percorso = '/' + percorso;

  whFermaAscolto();
  WH_ASCOLTO = { nodeId:nodeId, percorso:percorso, dalle:Date.now() };
  WH_ASCOLTO.timer = setInterval(function(){ whControlla() }, 1500);
  renderProps(nodeId);
  showToast('👂 In ascolto su ' + percorso + ': invia una chiamata');
}

function whFermaAscolto(){
  if(WH_ASCOLTO && WH_ASCOLTO.timer) clearInterval(WH_ASCOLTO.timer);
  var id = WH_ASCOLTO ? WH_ASCOLTO.nodeId : null;
  WH_ASCOLTO = null;
  if(id && typeof renderProps === 'function' && B.selId === id) renderProps(id);
}

function whControlla(){
  if(!WH_ASCOLTO) return;
  var asc = WH_ASCOLTO;
  whPreleva(asc.percorso).then(function(chiamate){
    if(!chiamate.length || !WH_ASCOLTO) return;
    var c = chiamate[0];
    var dati = whDatiDaChiamata(c);

    var n = B.nodes.find(function(x){ return x.id === asc.nodeId });
    if(n){
      // I dati ricevuti diventano il payload del trigger: da qui in poi il
      // flusso si comporta esattamente come con dati inseriti a mano.
      if(!n.config) n.config = {};
      n.config.sample = dati.testo;
      n.config.ultimaChiamata = { quando:new Date().toLocaleTimeString('it-IT'),
                                  tipo:dati.tipo, campi:dati.campi };
    }
    whFermaAscolto();
    showToast('📥 Chiamata ricevuta (' + dati.tipo + '): avvio il flusso');
    if(typeof runAgent === 'function') runAgent();
  });
}

// ── Pannello mostrato sul nodo Webhook ────────────────────────
function whPannello(nid, n){
  var percorso = (n.config && n.config.path) || '/hooks/test';
  if(percorso.charAt(0) !== '/') percorso = '/' + percorso;
  var url = WH_URL + percorso;

  if(!WH_STATO.verificato){
    whVerificaServizio().then(function(){
      if(B.selId === nid && typeof renderProps === 'function') renderProps(nid);
    });
    return '<div class="prop-group"><div style="font-size:10.5px;color:var(--tx4);background:var(--bg2);border-radius:6px;padding:7px 9px">Verifico il ricevitore…</div></div>';
  }

  if(!WH_STATO.disponibile){
    return '<div class="prop-group"><div style="font-size:10.5px;color:#B45309;background:#FEF3C7;border-radius:6px;padding:8px 10px;line-height:1.5">'+
      '⚠️ <strong>Ricevitore non attivo</strong>: il flusso si esegue con i parametri inseriti qui sopra.<br>'+
      'Per riceverli da una chiamata esterna, avvia <code>servizio-webhook/relaition-webhook.ps1</code>.'+
      '<div style="margin-top:6px"><button class="tb-btn" style="width:100%" onclick="whRiverifica('+nid+')">🔄 Ho avviato il ricevitore, ricontrolla</button></div></div></div>';
  }

  var inAscolto = WH_ASCOLTO && WH_ASCOLTO.nodeId === nid;
  var ultima = n.config && n.config.ultimaChiamata;

  return '<div class="prop-group"><div class="prop-label">📡 Chiamata in ingresso</div>'+
    '<div style="font-size:10.5px;color:var(--tx3);background:var(--bg2);border-radius:6px;padding:8px 10px;line-height:1.6">'+
      'Indirizzo da chiamare:<br><code style="font-size:10px;word-break:break-all">'+escHtml(url)+'</code>'+
      '<div style="margin-top:6px;color:var(--tx4)">Esempio:<br>'+
      '<code style="font-size:9.5px;word-break:break-all">curl -X POST '+escHtml(url)+
      ' -H "Content-Type: application/json" -d "{\\"cliente\\":\\"ACME\\"}"</code></div>'+
    '</div>'+
    (inAscolto
      ? '<div style="font-size:10.5px;color:#1D4ED8;background:#DBEAFE;border-radius:6px;padding:8px 10px;margin-top:7px;line-height:1.5">'+
        '👂 <strong>In ascolto</strong>: alla prima chiamata il flusso parte da solo.'+
        '<div style="margin-top:6px"><button class="tb-btn" style="width:100%" onclick="whFermaAscolto()">Interrompi l\'ascolto</button></div></div>'
      : '<button class="tb-btn" style="width:100%;margin-top:7px" onclick="whAvviaAscolto('+nid+')">👂 Attendi una chiamata ed esegui</button>')+
    (ultima
      ? '<div style="font-size:10px;color:#047857;margin-top:6px;line-height:1.45">✅ Ultima ricevuta alle '+escHtml(ultima.quando)+
        ' ('+escHtml(ultima.tipo)+(ultima.campi&&ultima.campi.length?': campi: '+escHtml(ultima.campi.join(', ')):'')+')</div>'
      : '')+
  '</div>';
}

function whRiverifica(nid){
  WH_STATO.verificato = false;
  whVerificaServizio().then(function(s){
    showToast(s.disponibile ? '✅ Ricevitore collegato' : '⚠️ Ricevitore ancora non raggiungibile');
    if(typeof renderProps === 'function') renderProps(nid);
  });
}
