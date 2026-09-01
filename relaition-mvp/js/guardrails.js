// ══════════════════════════════════════════
// GUARDRAIL — decima categoria della palette ("Controlli").
//
// Sono nodi ordinari a tutti gli effetti: si trascinano dal pannello, si
// collegano, si configurano e si eliminano come qualunque altro nodo. Ciò
// che li distingue è il tipo `gr` e il fatto che il motore di esecuzione
// li interroga PRIMA di lasciar proseguire il dato, potendo bloccare il
// flusso, alterarlo (mascheramento) o sospenderlo (approvazione umana).
//
// Ogni voce dichiara:
//   fields — schema dichiarativo dei parametri, reso da renderConfigFields()
//            esattamente come i connettori (nessun HTML dedicato)
//   run    — funzione di controllo. Riceve ({text, node, ctx}) e restituisce
//            {pass, text, msg, severity}. `text` permette al guardrail di
//            RISCRIVERE il dato in transito (è come gr_mask maschera davvero).
//
// Quelli marcati `deferred:true` hanno bisogno di infrastruttura che arriva
// nei blocchi successivi (stato "in attesa" del runtime, porzioni KB
// recuperate): qui eseguono la parte verificabile e dichiarano il resto,
// invece di fingere un esito.
// ══════════════════════════════════════════

// Espressioni per gli identificatori che si riconoscono in modo affidabile
// senza un modello NER: sono quelli che contano per la conformità (contatti,
// identificativi fiscali e bancari).
//
// L'ORDINE conta. Una partita IVA (11 cifre) è anche una sequenza valida per
// il pattern telefonico italiano: applicando prima il telefono, "04829110123"
// veniva marcato [TELEFONO] invece di [PIVA]. I formati più specifici vanno
// quindi prima dei più permissivi — una volta sostituito, il segnaposto non
// è più intercettabile dai pattern successivi.
var PII_ORDER = ['cf','iban','piva','email','telefono'];
var PII_PATTERNS = {
  cf:       { re: /\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/gi,         ph: '[CODICE_FISCALE]' },
  iban:     { re: /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g,                    ph: '[IBAN]' },
  piva:     { re: /\b(?:IT)?\d{11}\b/g,                                   ph: '[PIVA]' },
  email:    { re: /[\w.+-]+@[\w-]+\.[\w.]{2,}/g,                          ph: '[EMAIL]' },
  telefono: { re: /(?:\+39[\s.-]?)?(?:3\d{2}|0\d{1,3})[\s.-]?\d{5,8}\b/g, ph: '[TELEFONO]' }
};

// Formulazioni ricorrenti nei tentativi di scavalcare le istruzioni
// dell'agente iniettandole nel contenuto in ingresso.
var INJECTION_PATTERNS = [
  /ignor[ae]\s+(?:tutte\s+)?le\s+istruzioni\s+precedenti/i,
  /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions?/i,
  /dimentica\s+(?:tutto|le\s+istruzioni)/i,
  /disregard\s+(?:the\s+)?above/i,
  /(?:sei|agisci)\s+(?:ora\s+)?come\s+(?:un|una)\b/i,
  /you\s+are\s+now\s+(?:a|an)\b/i,
  /rivela\s+(?:il\s+)?(?:tuo\s+)?(?:system\s+)?prompt/i,
  /(?:reveal|print|show)\s+(?:your\s+)?system\s+prompt/i,
  /\bDAN\b|\bjailbreak\b/i
];

function _grText(v){ return typeof v === 'string' ? v : JSON.stringify(v == null ? '' : v); }

var GUARDRAIL_CONFIGS = {

  'Filtro contenuti': {
    grid: 'gr_filter', icon: '🛡️',
    desc: 'Blocca o segnala input con categorie di dato non ammesse',
    fields: [
      { k:'categories', l:'Categorie non ammesse (una per riga)', ta:true, req:true,
        ph:'dati sanitari\ncredenziali\ncoordinate bancarie' },
      { k:'action', l:'Al rilevamento', opts:['Blocca il flusso','Segnala e prosegui'], ph:'Blocca il flusso' }
    ],
    run: function(text, cfg){
      var cats = String(cfg.categories||'').split('\n').map(function(s){return s.trim().toLowerCase()}).filter(Boolean);
      var low = _grText(text).toLowerCase();
      var hit = cats.filter(function(c){ return c && low.indexOf(c) >= 0 });
      if(!hit.length) return { pass:true, msg:'🛡️ Nessuna categoria vietata rilevata ('+cats.length+' regole)' };
      var blocca = (cfg.action||'Blocca il flusso') === 'Blocca il flusso';
      return { pass: !blocca, severity: blocca?'block':'warn',
               msg:'🛡️ Categoria non ammessa rilevata: '+hit.join(', ')+(blocca?' — flusso bloccato':' — segnalato, prosegue') };
    }
  },

  'Mascheramento dati': {
    grid: 'gr_mask', icon: '🎭',
    desc: 'Sostituisce gli identificatori personali con segnaposto',
    fields: [
      { k:'entities', l:'Identificatori da mascherare', req:true,
        opts:['Tutti','Email e telefono','Solo identificativi fiscali/bancari'], ph:'Tutti' },
      { k:'restore', l:'Ripristina a valle dell\'elaborazione', opts:['No','Sì'], ph:'No' }
    ],
    run: function(text, cfg, ctx){
      var sel = cfg.entities || 'Tutti';
      var scelti = sel === 'Email e telefono' ? ['email','telefono']
                 : sel === 'Solo identificativi fiscali/bancari' ? ['cf','iban','piva']
                 : PII_ORDER;
      // Si scorre sempre in PII_ORDER (specifici → permissivi), filtrando
      // sulla selezione: l'ordine non dipende da come l'utente ha scelto.
      var keys = PII_ORDER.filter(function(k){ return scelti.indexOf(k) >= 0 });
      var out = _grText(text), count = 0, map = {}, perTipo = {};
      keys.forEach(function(k){
        var p = PII_PATTERNS[k];
        out = out.replace(p.re, function(m){
          count++;
          perTipo[k] = (perTipo[k] || 0) + 1;
          // Numerazione per tipo ([EMAIL_1], [TELEFONO_1]) anziché globale:
          // più leggibile nella traccia e più utile per il ripristino.
          var token = p.ph.replace(']', '_' + perTipo[k] + ']');
          map[token] = m;               // conservato per l'eventuale ripristino
          return token;
        });
      });
      // Il ripristino a valle è possibile solo se qualcuno conserva la mappa:
      // la appoggiamo sul contesto di esecuzione, non sul nodo (il nodo è
      // definizione, il contesto è la singola esecuzione).
      if(ctx && (cfg.restore === 'Sì')) { ctx.maskMap = Object.assign(ctx.maskMap||{}, map) }
      return { pass:true, text:out,
               msg: count ? '🎭 '+count+' identificatore/i mascherato/i ('+keys.join(', ')+')'
                          : '🎭 Nessun identificatore personale trovato nel dato in transito' };
    }
  },

  'Difesa da istruzioni ostili': {
    grid: 'gr_injection', icon: '🚧',
    desc: 'Rileva tentativi di alterare le istruzioni dell\'agente',
    fields: [
      { k:'sensitivity', l:'Sensibilità', opts:['Bassa','Media','Alta'], ph:'Media', req:true },
      { k:'action', l:'Al rilevamento', opts:['Blocca il flusso','Segnala e prosegui'], ph:'Blocca il flusso' }
    ],
    run: function(text, cfg){
      var s = _grText(text);
      var hits = INJECTION_PATTERNS.filter(function(re){ return re.test(s) });
      // A sensibilità bassa serve più di un indizio per far scattare il blocco:
      // riduce i falsi positivi su testi che citano l'AI in modo legittimo.
      var soglia = cfg.sensitivity === 'Alta' ? 1 : cfg.sensitivity === 'Bassa' ? 2 : 1;
      if(hits.length < soglia) return { pass:true, msg:'🚧 Nessun tentativo di manipolazione rilevato' };
      var blocca = (cfg.action||'Blocca il flusso') === 'Blocca il flusso';
      return { pass: !blocca, severity: blocca?'block':'warn',
               msg:'🚧 Possibile istruzione ostile nel contenuto in ingresso ('+hits.length+' indizi)'+(blocca?' — bloccato':' — segnalato') };
    }
  },

  'Verifica di fondatezza': {
    grid: 'gr_grounding', icon: '🔎',
    desc: 'Confronta l\'output con le porzioni KB recuperate',
    fields: [
      { k:'threshold', l:'Soglia minima di sovrapposizione (%)', ph:'40', req:true },
      { k:'action', l:'Se non supportato dalle fonti', opts:['Segnala e prosegui','Blocca il flusso'], ph:'Segnala e prosegui' }
    ],
    run: function(text, cfg, ctx){
      var chunks = (ctx && ctx.kbChunks) || [];
      if(!chunks.length){
        return { pass:true, severity:'warn',
                 msg:'🔎 Verifica non eseguibile: nessuna porzione Knowledge Base recuperata a monte' };
      }
      // Sovrapposizione lessicale fra le affermazioni dell'output e il testo
      // delle porzioni realmente recuperate a monte (popolate dal nodo AI con
      // "Usa Knowledge Base"). Misura grezza — non stabilisce se una frase è
      // vera, solo se le sue parole compaiono nelle fonti — ma verificabile.
      var fonte = chunks.map(function(c){ return (c.text||'').toLowerCase() }).join(' ');
      var parole = _grText(text).toLowerCase().match(/\b[a-zàèéìòù]{5,}\b/g) || [];
      if(!parole.length) return { pass:true, msg:'🔎 Output troppo breve per la verifica' };
      var supportate = parole.filter(function(p){ return fonte.indexOf(p) >= 0 }).length;
      var pct = Math.round(supportate / parole.length * 100);
      var soglia = parseInt(cfg.threshold || '40', 10);
      if(pct >= soglia) return { pass:true, msg:'🔎 Fondatezza '+pct+'% (soglia '+soglia+'%) — output supportato dalle fonti' };
      var blocca = cfg.action === 'Blocca il flusso';
      return { pass: !blocca, severity: blocca?'block':'warn',
               msg:'🔎 Fondatezza '+pct+'% sotto la soglia '+soglia+'% — affermazioni non supportate dalle fonti'+(blocca?' — bloccato':'') };
    }
  },

  'Convalida output': {
    grid: 'gr_schema', icon: '📐',
    desc: 'Verifica schema, formati e intervalli attesi a valle',
    fields: [
      // NON obbligatorio: era req:true, e il riempimento automatico dei campi
      // ci scriveva dentro il segnaposto "punteggio, motivazione". Il presidio
      // si metteva cosi' a pretendere campi che l'agente non produce, e
      // bloccava il flusso alla prima esecuzione — su ogni agente installato
      // dal catalogo che includa questo controllo. Il segnaposto e' un
      // esempio, non un valore ragionevole da assumere.
      { k:'required', l:'Campi obbligatori (separati da virgola)', ph:'punteggio, motivazione' },
      { k:'rules', l:'Regole (una per riga: campo op valore)', ta:true, ph:'punteggio >= 0\npunteggio <= 100' },
      { k:'onfail', l:'Se la convalida fallisce', opts:['Blocca il flusso','Segnala e prosegui'], ph:'Blocca il flusso' }
    ],
    run: function(text, cfg){
      var obj = null;
      // Stessa lettura del runtime: se i due divergono, un output valido per
      // l'uno risulta illeggibile all'altro.
      obj = (typeof rtLeggiJson === 'function') ? rtLeggiJson(text) : null;
      if(!obj){ try { obj = typeof text === 'object' ? text : JSON.parse(String(text).replace(/```json|```/g,'').trim()) } catch(e){} }
      var blocca = (cfg.onfail||'Blocca il flusso') === 'Blocca il flusso';
      if(!obj || typeof obj !== 'object'){
        return { pass: !blocca, severity: blocca?'block':'warn',
                 msg:'📐 L\'output non è JSON valido — convalida non superata' };
      }
      var problemi = [];
      String(cfg.required||'').split(',').map(function(s){return s.trim()}).filter(Boolean).forEach(function(f){
        if(obj[f] === undefined || obj[f] === null || obj[f] === '') problemi.push('campo mancante: '+f);
      });
      String(cfg.rules||'').split('\n').map(function(s){return s.trim()}).filter(Boolean).forEach(function(r){
        var m = r.match(/^(\w+)\s*(>=|<=|>|<|==|!=)\s*(.+)$/);
        if(!m) return;
        var val = obj[m[1]], op = m[2], atteso = isNaN(m[3]) ? m[3].trim() : parseFloat(m[3]);
        var ok = op==='>='?val>=atteso : op==='<='?val<=atteso : op==='>'?val>atteso
               : op==='<'?val<atteso : op==='=='?val==atteso : val!=atteso;
        if(!ok) problemi.push('regola non rispettata: '+r+' (valore: '+val+')');
      });
      if(!problemi.length){
        // Senza campi ne' regole il controllo verifica solo che l'output sia
        // JSON: va detto, altrimenti un "convalida superata" fa credere che
        // sia stato verificato qualcosa che nessuno ha dichiarato.
        var nulla=!String(cfg.required||'').trim()&&!String(cfg.rules||'').trim();
        return { pass:true, msg: nulla
          ? '📐 Output JSON valido — nessun campo o regola dichiarati: indica cosa verificare nel pannello del nodo'
          : '📐 Convalida superata — schema e intervalli conformi' };
      }
      return { pass: !blocca, severity: blocca?'block':'warn',
               msg:'📐 Convalida fallita: '+problemi.join(' · ')+(blocca?' — bloccato':' — segnalato') };
    }
  },

  'Soglia di confidenza': {
    grid: 'gr_confidence', icon: '📊',
    desc: 'Devia a revisione umana sotto la soglia impostata',
    fields: [
      { k:'field', l:'Campo che esprime la confidenza', ph:'confidence', req:true },
      { k:'threshold', l:'Soglia minima (0-1 oppure 0-100)', ph:'0.7', req:true },
      { k:'route', l:'Sotto soglia', opts:['Devia a revisione umana','Segnala e prosegui'], ph:'Devia a revisione umana' }
    ],
    run: function(text, cfg){
      var obj=null; try{ obj = typeof text==='object'?text:JSON.parse(String(text).replace(/```json|```/g,'').trim()) }catch(e){}
      var campo = cfg.field || 'confidence';
      var v = obj && obj[campo];
      if(typeof v !== 'number'){
        return { pass:true, severity:'warn', msg:'📊 Campo "'+campo+'" assente o non numerico — soglia non applicabile' };
      }
      var soglia = parseFloat(cfg.threshold || '0.7');
      // Tollera sia 0-1 sia 0-100 senza chiedere all'utente quale usa.
      var norm = v > 1 ? v/100 : v, sogliaNorm = soglia > 1 ? soglia/100 : soglia;
      if(norm >= sogliaNorm) return { pass:true, msg:'📊 Confidenza '+v+' ≥ soglia '+soglia+' — prosegue in automatico' };
      var devia = (cfg.route||'Devia a revisione umana') === 'Devia a revisione umana';
      return { pass:true, severity:'warn', route: devia?'review':null,
               msg:'📊 Confidenza '+v+' sotto la soglia '+soglia+(devia?' — deviato a revisione umana':' — segnalato') };
    }
  },

  'Approvazione umana': {
    grid: 'gr_approval', icon: '✋',
    desc: 'Sospende l\'esecuzione fino ad autorizzazione esplicita',
    // La sospensione è reale: il runtime porta il nodo nello stato "in attesa",
    // conserva lo stato dell'esecuzione e la riprende da lì senza rieseguire
    // ciò che era già stato fatto. Unico limite noto: le esecuzioni sospese
    // vivono in memoria e non sopravvivono alla chiusura della scheda.
    limite: 'Un\'esecuzione sospesa vive in memoria: chiudendo la scheda del browser va persa e va rilanciata.',
    fields: [
      { k:'approver', l:'Chi deve approvare', ph:'Responsabile Operations', req:true },
      { k:'message', l:'Messaggio mostrato all\'approvatore', ta:true, ph:'Verificare i campi estratti prima della registrazione' },
      { k:'timeout', l:'Scadenza attesa (ore, vuoto = nessuna)', ph:'24' }
    ],
    run: function(text, cfg){
      return { pass:true, waiting:true, severity:'warn',
               msg:'✋ Sospensione richiesta — in attesa di approvazione da "'+(cfg.approver||'approvatore')+'"' };
    }
  },

  'Limitatore frequenza': {
    grid: 'gr_ratelimit', icon: '⏲️',
    desc: 'Interrompe al superamento di chiamate, testo o durata',
    fields: [
      { k:'max_calls', l:'Massimo chiamate al modello', ph:'10', req:true },
      { k:'max_chars', l:'Massimo caratteri elaborati', ph:'50000' },
      { k:'max_seconds', l:'Durata massima esecuzione (secondi)', ph:'120' }
    ],
    run: function(text, cfg, ctx){
      var c = ctx || {};
      var problemi = [];
      var maxCalls = parseInt(cfg.max_calls||'0',10);
      var maxChars = parseInt(cfg.max_chars||'0',10);
      var maxSec   = parseInt(cfg.max_seconds||'0',10);
      if(maxCalls && (c.aiCalls||0) > maxCalls) problemi.push('chiamate al modello '+c.aiCalls+' > '+maxCalls);
      if(maxChars && _grText(text).length > maxChars) problemi.push('caratteri '+_grText(text).length+' > '+maxChars);
      if(maxSec && c.startedAt && (Date.now()-c.startedAt)/1000 > maxSec) problemi.push('durata oltre '+maxSec+'s');
      if(!problemi.length){
        return { pass:true, msg:'⏲️ Entro i limiti (chiamate '+(c.aiCalls||0)+(maxCalls?'/'+maxCalls:'')+', '+_grText(text).length+' caratteri)' };
      }
      return { pass:false, severity:'block', msg:'⏲️ Limite superato: '+problemi.join(' · ')+' — esecuzione interrotta' };
    }
  },

  'Gestore eccezioni': {
    grid: 'gr_error', icon: '🧯',
    desc: 'Nuovo tentativo, percorso alternativo o notifica in caso di errore',
    fields: [
      { k:'strategy', l:'Strategia', req:true,
        opts:['Riprova poi prosegui','Percorso alternativo','Solo notifica'], ph:'Riprova poi prosegui' },
      { k:'attempts', l:'Tentativi massimi', ph:'3' },
      { k:'notify', l:'Notifica su', ph:'#ops-alerts' }
    ],
    run: function(text, cfg, ctx){
      var err = ctx && ctx.lastError;
      if(!err) return { pass:true, msg:'🧯 Nessun errore da gestire a monte' };
      var strategia = cfg.strategy || 'Riprova poi prosegui';
      // "Solo notifica" avvisa e basta: l'esecuzione resta fallita, ed è
      // corretto che lo sia. Le altre due strategie assorbono il guasto, e in
      // quel caso l'esecuzione NON va contata come fallita — altrimenti un
      // controllo che dichiara "errore intercettato, proseguo" lascia il
      // flusso in stato di errore, il registro mente e la verifica di non
      // regressione segnala divergenze che non esistono.
      return { pass:true, severity:'warn', handled: strategia !== 'Solo notifica',
               msg:'🧯 Errore intercettato ("'+String(err).substring(0,60)+'") — strategia: '+strategia };
    }
  }
};

// Indice per identificativo tecnico (gr_filter, gr_mask, ...) usato dalle
// politiche organizzative, che ragionano per id e non per etichetta.
var GUARDRAIL_BY_ID = (function(){
  var m = {};
  Object.keys(GUARDRAIL_CONFIGS).forEach(function(name){
    m[GUARDRAIL_CONFIGS[name].grid] = Object.assign({ name: name }, GUARDRAIL_CONFIGS[name]);
  });
  return m;
})();

function isGuardrailNode(n){ return n && n.type === 'gr' }
function getGuardrailConfig(name){ return GUARDRAIL_CONFIGS[name] || null }
function guardrailNameById(grid){ return GUARDRAIL_BY_ID[grid] ? GUARDRAIL_BY_ID[grid].name : null }

// Configurazione di partenza per un controllo inserito automaticamente da
// una politica. Senza questa, il nodo nascerebbe con i campi obbligatori
// vuoti e la validazione bloccherebbe l'esecuzione di un flusso che
// l'utente non ha nemmeno modificato: il presidio si trasformerebbe in un
// impedimento. I valori sono i suggerimenti già dichiarati nei campi
// (`ph`) o la prima opzione disponibile; restano modificabili.
function defaultGuardrailConfig(name){
  var def = getGuardrailConfig(name);
  if(!def || !def.fields) return {};
  var cfg = {};
  def.fields.forEach(function(f){
    if(!f.req) return;
    cfg[f.k] = f.opts ? (f.ph && f.opts.indexOf(f.ph) >= 0 ? f.ph : f.opts[0]) : (f.ph || '');
  });
  return cfg;
}

// Esegue il controllo di un nodo guardrail sul dato in transito.
// Restituisce sempre un oggetto normalizzato, anche se la voce non esiste
// più (definizione rimossa da una versione futura): il motore non deve mai
// interrompersi per un guardrail sconosciuto.
function runGuardrail(node, text, ctx){
  var def = getGuardrailConfig(node.name);
  if(!def || typeof def.run !== 'function'){
    return { pass:true, msg:'⚠️ Controllo "'+node.name+'" non riconosciuto — ignorato' };
  }
  try{
    var r = def.run(text, node.config || {}, ctx || {}) || {};
    if(r.pass === undefined) r.pass = true;
    return r;
  }catch(e){
    return { pass:true, severity:'warn', msg:'⚠️ Controllo "'+node.name+'" non eseguibile: '+e.message };
  }
}
