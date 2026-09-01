// ══════════════════════════════════════════════════════════════
// SALVATAGGIO SU PERCORSO E SU CLOUD
// ══════════════════════════════════════════════════════════════
// Una pagina client-side non può autenticarsi su Google Drive o SharePoint:
// OAuth richiede un client secret, che non può stare in un file servito al
// browser. La strada onesta e realmente funzionante è un'altra: l'utente sceglie
// UNA VOLTA una cartella sul disco — tipicamente quella sincronizzata da Google
// Drive o OneDrive — e da lì in poi il flusso ci scrive dentro davvero, anche in
// sottocartelle indicate come percorso. Il client di sincronizzazione fa il
// resto: il file arriva sul cloud senza che noi tocchiamo alcuna API.
//
// Il permesso sulla cartella è concesso dall'utente e revocabile; l'handle viene
// conservato in IndexedDB perché sopravviva alla chiusura del browser.

var CS_STORE = 'relaition_cartelle';
var CS_CACHE = {};   // alias -> FileSystemDirectoryHandle, per la sessione corrente

// La API esiste solo in contesto sicuro (https o localhost) e non su file://.
function csSupportata(){
  return typeof window !== 'undefined' &&
         typeof window.showDirectoryPicker === 'function' &&
         window.isSecureContext;
}

function csMotivoNonSupportata(){
  if(typeof window.showDirectoryPicker !== 'function')
    return 'Questo browser non espone la File System Access API (funziona su Chrome, Edge e Opera da desktop).';
  if(!window.isSecureContext)
    return 'La pagina è aperta da file:// o da una connessione non sicura: la scrittura su cartella richiede https o localhost.';
  return 'Scrittura su cartella non disponibile.';
}

// ── Persistenza degli handle ──────────────────────────────────
function csDb(){
  return new Promise(function(ok, ko){
    var r = indexedDB.open('relaition_fs', 1);
    r.onupgradeneeded = function(){ r.result.createObjectStore(CS_STORE) };
    r.onsuccess = function(){ ok(r.result) };
    r.onerror = function(){ ko(r.error) };
  });
}

function csSalvaHandle(alias, handle){
  return csDb().then(function(db){
    return new Promise(function(ok, ko){
      var t = db.transaction(CS_STORE, 'readwrite');
      t.objectStore(CS_STORE).put(handle, alias);
      t.oncomplete = function(){ CS_CACHE[alias] = handle; ok() };
      t.onerror = function(){ ko(t.error) };
    });
  });
}

function csLeggiHandle(alias){
  // Senza alias IndexedDB solleva "No key or key range specified", un errore
  // illeggibile che finiva nel registro di esecuzione al posto della causa
  // vera: nessuna cartella è stata collegata al nodo.
  if(!alias) return Promise.resolve(null);
  if(CS_CACHE[alias]) return Promise.resolve(CS_CACHE[alias]);
  return csDb().then(function(db){
    return new Promise(function(ok){
      var t = db.transaction(CS_STORE, 'readonly');
      var q = t.objectStore(CS_STORE).get(alias);
      q.onsuccess = function(){ CS_CACHE[alias] = q.result || null; ok(q.result || null) };
      q.onerror  = function(){ ok(null) };
    });
  });
}

function csElencoAlias(){
  return csDb().then(function(db){
    return new Promise(function(ok){
      var t = db.transaction(CS_STORE, 'readonly');
      var q = t.objectStore(CS_STORE).getAllKeys();
      q.onsuccess = function(){ ok(q.result || []) };
      q.onerror  = function(){ ok([]) };
    });
  });
}

// ── Scelta della cartella ─────────────────────────────────────
// Va chiamata da un gestore di click: il browser rifiuta il picker se non
// discende da un gesto dell'utente.
function csScegliCartella(alias){
  if(!csSupportata()) return Promise.reject(new Error(csMotivoNonSupportata()));
  return window.showDirectoryPicker({ mode:'readwrite', id:'relaition-out' })
    .then(function(h){
      return csSalvaHandle(alias || h.name, h).then(function(){ return h });
    });
}

// Il permesso decade quando il browser viene chiuso: qui si prova a
// riottenerlo silenziosamente e, se serve, lo si richiede.
function csAssicuraPermesso(handle, richiedi){
  var opz = {mode:'readwrite'};
  return handle.queryPermission(opz).then(function(stato){
    if(stato === 'granted') return true;
    if(!richiedi) return false;
    return handle.requestPermission(opz).then(function(s){ return s === 'granted' });
  });
}

// ── Scrittura ─────────────────────────────────────────────────
// Il percorso è relativo alla cartella scelta: "Report/2026" crea le
// sottocartelle mancanti. I percorsi assoluti (C:\..., /Users/...) non sono
// scrivibili dal browser per ragioni di sicurezza: se ne estrae la parte finale
// e lo si dichiara all'utente invece di fallire in silenzio.
function csNormalizzaPercorso(percorso){
  var p = String(percorso || '').trim().replace(/\\/g, '/');
  var assoluto = /^[a-zA-Z]:\//.test(p) || p.charAt(0) === '/';
  if(assoluto){
    // Si tiene solo la coda dopo un eventuale nome di cartella cloud noto,
    // così "C:/Users/x/Google Drive/Report" diventa "Report".
    var m = p.match(/(?:Google\s*Drive|OneDrive[^/]*|Dropbox|iCloud[^/]*)\/(.*)$/i);
    p = m ? m[1] : p.replace(/^[a-zA-Z]:\//, '').replace(/^\//, '');
  }
  var parti = p.split('/').filter(function(s){ return s && s !== '.' && s !== '..' });
  return {parti:parti, eraAssoluto:assoluto};
}

function csCartellaDiDestinazione(handle, parti){
  return parti.reduce(function(catena, nome){
    return catena.then(function(dir){
      return dir.getDirectoryHandle(nome, {create:true});
    });
  }, Promise.resolve(handle));
}

// Scrive davvero un file. contenuto: stringa, Blob o Uint8Array.
// Ritorna {percorso, cartella, note} — note contiene gli scostamenti da
// dichiarare all'utente (es. percorso assoluto reinterpretato).
function csScrivi(alias, percorso, nomeFile, contenuto, tipoMime){
  if(!csSupportata()) return Promise.reject(new Error(csMotivoNonSupportata()));

  return csLeggiHandle(alias).then(function(h){
    if(!h) throw new Error(alias
      ? 'La cartella "' + alias + '" non è più collegata (il permesso può essere stato revocato). Ricollegala dal pannello del nodo con "Scegli cartella…".'
      : 'Nessuna cartella collegata a questo nodo: aprine una dal pannello con "Scegli cartella…".');
    return csAssicuraPermesso(h, true).then(function(ok){
      if(!ok) throw new Error('Permesso di scrittura negato sulla cartella "' + alias + '".');

      var np = csNormalizzaPercorso(percorso);
      var note = [];
      if(np.eraAssoluto)
        note.push('Il percorso assoluto indicato è stato interpretato come "' + (np.parti.join('/') || alias) +
                  '" dentro la cartella collegata: il browser non può scrivere fuori da lì.');

      return csCartellaDiDestinazione(h, np.parti).then(function(dir){
        return dir.getFileHandle(nomeFile, {create:true}).then(function(fh){
          return fh.createWritable().then(function(w){
            var blob = (contenuto instanceof Blob)
              ? contenuto
              : new Blob([contenuto], {type: tipoMime || 'application/octet-stream'});
            return w.write(blob).then(function(){ return w.close() });
          });
        }).then(function(){
          return {
            percorso: [alias].concat(np.parti, [nomeFile]).join('/'),
            cartella: alias,
            note: note
          };
        });
      });
    });
  });
}

// ── Destinazioni cloud dichiarate ─────────────────────────────
// Elenco mostrato nel pannello del nodo. Ognuna spiega cosa fa davvero: è la
// differenza tra una demo onesta e una che finge un'integrazione inesistente.
var CS_DESTINAZIONI = [
  {k:'cartella',   l:'Cartella sul computer',        reale:true,
   nota:'Scrittura reale nella cartella che scegli.'},
  {k:'drive',      l:'Google Drive (via cartella sincronizzata)', reale:true,
   nota:'Scegli la cartella locale di Google Drive: il file ci viene scritto davvero e il client Drive lo carica sul cloud.'},
  {k:'onedrive',   l:'OneDrive / SharePoint (via cartella sincronizzata)', reale:true,
   nota:'Scegli la cartella locale di OneDrive: la sincronizzazione lo porta anche sulla libreria SharePoint collegata.'},
  {k:'dropbox',    l:'Dropbox (via cartella sincronizzata)', reale:true,
   nota:'Scegli la cartella locale di Dropbox.'},
  {k:'api',        l:'Connessione API diretta (simulata)', reale:false,
   nota:'Il file viene generato realmente, ma il caricamento via API è simulato: servirebbe un backend che custodisca le credenziali OAuth.'}
];

function csDestinazione(k){
  return CS_DESTINAZIONI.filter(function(d){ return d.k === k })[0] || CS_DESTINAZIONI[0];
}

// Il ramo simulato non produce mai un esito che sembri reale: l'identificativo
// è marcato e il registro esecuzioni riporta l'etichetta "simulato".
function csSimulaCaricamento(destinazione, percorso, nomeFile){
  var id = 'sim-' + Math.random().toString(36).substring(2, 12);
  return {
    simulato: true,
    percorso: (percorso ? percorso.replace(/\\/g,'/').replace(/\/$/,'') + '/' : '') + nomeFile,
    id: id,
    url: 'https://esempio.invalid/' + destinazione + '/' + id,
    nota: 'Caricamento simulato: nessuna chiamata reale a ' + destinazione + '.'
  };
}
