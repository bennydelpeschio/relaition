// ══════════════════════════════════════════
// RUNTIME DEGLI AGENTI — motore unico di esecuzione.
//
// Prima esistevano due copie della stessa logica: runAgent() (interattiva,
// disegna sul canvas) e runAgentHeadless() (schedulata). Ogni funzione nuova
// andava scritta due volte e le due copie divergevano. Qui il motore è uno
// solo; chi lo invoca fornisce un `onEvent` e decide cosa farne — il Builder
// aggiorna canvas e pannello, lo scheduler si limita a registrare.
//
// Cosa aggiunge rispetto al motore precedente:
//   · esecuzione a ondate: i nodi indipendenti partono insieme (B4)
//   · sei stati, incluso "in attesa" con sospensione reale e ripresa (B5)
//   · eventi tipizzati persistiti in execution_events (B6)
//   · ciclo di tool calling: il modello sceglie lo strumento (B2)
//   · traccia degli input esatti, che rende la riesecuzione deterministica (B8)
//   · chiave di idempotenza per ogni chiamata verso l'esterno (B9)
// ══════════════════════════════════════════

var RUNTIME_STATES = ['idle','running','done','error','skipped','waiting'];

// Esecuzioni sospese in attesa di autorizzazione umana, per id di esecuzione.
// Vivono in memoria: una sospensione non sopravvive alla chiusura della
// scheda, ed è corretto così — nessun server la porterebbe avanti.
var SUSPENDED_RUNS = {};

// ── Astrazione Agent (B1) ────────────────────────────────────────────────
// Deriva dal grafo la forma dichiarativa dell'agente. È ciò che viene
// passato al modello e ciò che la traccia registra: il canvas è la vista,
// questa è la definizione.
function buildAgentFromGraph(nodes, edges, opts){
  opts = opts || {};
  var aiNodes = nodes.filter(function(n){ return n.type === 'ai' });
  var primary = aiNodes[0] || null;
  return {
    id: opts.agentId || null,
    name: opts.agentName || 'Agente',
    systemPrompt: opts.context || '',
    tools: nodes.filter(function(n){ return n.type === 'ac' }).map(function(n){ return n.name }),
    memory: {},
    model: primary ? {
      provider: (primary.config && primary.config.model) || 'claude',
      temperature: primary.config && primary.config.temperature,
      maxTokens: primary.config && primary.config.maxtokens
    } : null,
    guardrails: nodes.filter(function(n){ return n.type === 'gr' }).map(function(n){ return n.id }),
    canHandoffTo: nodes.filter(function(n){ return n.type === 'sa' })
                       .map(function(n){ return n.config && n.config.agentName }).filter(Boolean),
    maxIterations: primary && primary.config && primary.config.maxIterations
                     ? parseInt(primary.config.maxIterations,10) : 3,
    useKnowledgeBase: primary && primary.config && primary.config.useKB
                     ? { enabled:true, businessUnit: primary.config.kbBusinessUnit || null }
                     : { enabled:false }
  };
}

// ── Strumenti disponibili a un nodo AI (B2) ──────────────────────────────
// Un connettore Action collegato a valle di un nodo AI diventa uno strumento
// che il modello può invocare. Lo schema è derivato dai campi già dichiarati
// dal connettore: non c'è un secondo posto dove tenerlo aggiornato.
function toolSchemaForConnector(node){
  var cc = (typeof getConnectorConfig === 'function') ? getConnectorConfig(node.name) : null;
  var props = {}, required = [];
  if(cc && cc.fields){
    cc.fields.forEach(function(f){
      if(f.k === 'condition' || f.k === 'timeout' || f.k === 'onerror' || f.k === 'retries') return;
      props[f.k] = { type:'string', description: f.l + (f.ph ? ' (es. '+f.ph+')' : '') };
      if(f.req) required.push(f.k);
    });
  }
  return {
    name: node.name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''),
    nodeId: node.id,
    label: node.name,
    description: (cc && cc.desc) || ('Esegue l\'azione "'+node.name+'" su '+node.name),
    input_schema: { type:'object', properties: props, required: required }
  };
}

// Nodi Action raggiungibili da `aiNodeId` senza attraversare un altro nodo AI:
// sono gli strumenti che quel nodo può invocare.
function toolsForAiNode(aiNodeId, nodes, edges, enabledNames){
  var out = [], visti = {};
  (function scan(id){
    if(visti[id]) return; visti[id] = true;
    edges.filter(function(e){ return e.from === id }).forEach(function(e){
      var dst = nodes.find(function(n){ return n.id === e.to });
      if(!dst || dst.type === 'ai') return;
      if(dst.type === 'ac'){
        if(!enabledNames || !enabledNames.length || enabledNames.indexOf(dst.name) >= 0) out.push(dst);
      }
      scan(dst.id);
    });
  })(aiNodeId);
  return out;
}

// ── Chiave di idempotenza (B9) ───────────────────────────────────────────
// Deriva da esecuzione + posizione del nodo + tentativo: un nuovo tentativo
// riusa la stessa chiave, così un sistema esterno che la onori non
// duplicherebbe l'effetto.
function idempotencyKey(execId, nodeId, attempt){
  return 'rel-' + execId + '-n' + nodeId + '-a' + (attempt || 1);
}

// ── Motore ───────────────────────────────────────────────────────────────

// ══════════════════════════════════════════
// NODI ESCLUSI DALL'ESECUZIONE
// ══════════════════════════════════════════
// Un nodo marcato `escluso` si comporta come una riga commentata: non viene
// eseguito e non deve nemmeno spezzare la catena. Le sue connessioni in
// ingresso vengono ricucite su quelle in uscita, così il flusso prosegue come
// se il nodo non fosse mai stato inserito. La ricucitura avviene su una COPIA:
// il grafo sul canvas resta intatto, e togliere il flag ripristina tutto.
function rtGrafoEffettivo(nodes, edges){
  var esclusi = (nodes||[]).filter(function(n){ return n.escluso });
  if(!esclusi.length) return { nodes:nodes, edges:edges, esclusi:[] };

  var fuori = {};
  esclusi.forEach(function(n){ fuori[n.id] = true });
  var archi = (edges||[]).slice();

  esclusi.forEach(function(n){
    var entranti = archi.filter(function(e){ return e.to === n.id });
    var uscenti  = archi.filter(function(e){ return e.from === n.id });
    archi = archi.filter(function(e){ return e.to !== n.id && e.from !== n.id });
    // Ogni sorgente si collega a ogni destinazione: la porta di partenza è
    // quella del nodo a monte (è lei a decidere il ramo su una condizione),
    // la porta di arrivo quella del nodo a valle.
    entranti.forEach(function(a){
      uscenti.forEach(function(b){
        var giaCe = archi.some(function(e){ return e.from===a.from && e.to===b.to && e.fp===a.fp });
        if(!giaCe) archi.push({ from:a.from, to:b.to, fp:a.fp, tp:b.tp });
      });
    });
  });

  return {
    nodes: (nodes||[]).filter(function(n){ return !fuori[n.id] }),
    edges: archi,
    esclusi: esclusi
  };
}

function createRuntimeContext(spec){
  var eff = rtGrafoEffettivo(spec.nodes, spec.edges);
  return {
    execId: spec.execId || ('run_' + Date.now()),
    agentName: spec.agentName || 'Workflow',
    agentId: spec.agentId || null,
    nodes: eff.nodes, edges: eff.edges,
    esclusi: eff.esclusi,
    context: spec.context || '',
    onEvent: spec.onEvent || function(){},
    headless: !!spec.headless,
    depth: spec.depth || 0,
    replay: spec.replay || null,      // traccia da cui rigiocare (B8)
    startedAt: Date.now(),
    // Un solo controllore per l'intera esecuzione: interrompendolo cadono
    // insieme tutte le chiamate di rete ancora in volo.
    abortCtrl: (typeof AbortController !== 'undefined') ? new AbortController() : null,
    abort: false,
    seq: 0,
    events: [],
    trace: { calls: [], seed: spec.seed || String(Date.now()) },
    steps: [],
    // Stato condiviso con i guardrail (consumi, mascheramento, ultimo errore)
    gr: { startedAt: Date.now(), aiCalls: 0, kbChunks: [], maskMap: {}, lastError: null },
    pipeline: '',
    hasError: false,
    waiting: null,
    outputs: {},        // output per nodo, per i punti di convergenza
    // Ordine di completamento dei nodi: serve a risolvere un segnaposto
    // risalendo dal piu' recente al piu' lontano, non per identificativo.
    ordineOutput: [],
    skipFrom: {}        // rami disattivati da una condizione
  };
}

function rtEmit(ctx, type, nodeId, payload){
  var evt = { seq: ++ctx.seq, event_type: type, node_id: nodeId == null ? null : nodeId,
              payload: payload || {}, ts: new Date().toISOString() };
  ctx.events.push(evt);
  try{ ctx.onEvent(evt, ctx) }catch(e){}
  return evt;
}

// Persiste gli eventi al termine: una scrittura per esecuzione invece di una
// per evento, altrimenti il salvataggio del database (che riesporta l'intero
// file) diventerebbe il collo di bottiglia dell'esecuzione.
function persistExecutionEvents(execRowId, ctx){
  if(typeof DB === 'undefined' || !DB || !execRowId) return;
  try{
    ctx.events.forEach(function(e){
      DB.run('INSERT INTO execution_events (execution_id,seq,event_type,node_id,payload_json,ts) VALUES (?,?,?,?,?,?)',
        [execRowId, e.seq, e.event_type, e.node_id, JSON.stringify(e.payload), e.ts]);
    });
    persistDatabase();
  }catch(e){ console.error('Persistenza eventi fallita', e) }
}

// Registra input e output di ogni chiamata verso modello o connettore.
// È ciò che rende la riesecuzione deterministica: rigiocando, il motore
// legge da qui invece di richiamare l'esterno.
function rtRecordCall(ctx, nodeId, kind, input, output){
  ctx.trace.calls.push({ i: ctx.trace.calls.length, nodeId: nodeId, kind: kind, input: input, output: output });
}
function rtReplayLookup(ctx, nodeId, kind){
  if(!ctx.replay || !ctx.replay.calls) return null;
  var idx = ctx.trace.calls.filter(function(c){ return c.nodeId === nodeId && c.kind === kind }).length;
  var found = ctx.replay.calls.filter(function(c){ return c.nodeId === nodeId && c.kind === kind })[idx];
  return found ? found.output : null;
}

// ── Esecuzione dei singoli tipi di nodo ──────────────────────────────────

var RT_SAMPLES = {
  webhook:'{"lead":{"nome":"Alessandro Ferri","azienda":"TechnoMec SpA","ruolo":"Operations Director","dipendenti":240,"settore":"Manufacturing","messaggio":"Vorremmo automatizzare la gestione ordini fornitori"}}',
  // Strutturato, non testo libero: un nodo a valle deve poter rispondere al
  // mittente con {{mittente}}. Con un blocco di testo quel campo non esiste e
  // l'email finirebbe a un destinatario inventato.
  email:'{"mittente":"m.colombo@clienteassicura.it","nome":"Marco Colombo",'+
        '"oggetto":"URGENTE - Sistema gestionale bloccato",'+
        '"corpo":"Da stamattina il portale sinistri non carica le pratiche. Abbiamo tre perizie ferme.",'+
        '"ricevuta":"2026-07-03T09:12:00Z"}',
  fattura:'FATTURA N. 2026/0847 - Rossi Componenti SRL - P.IVA 04829110123 - Data: 28/06/2026 - Imponibile: 12.450,00 - IVA 22%: 2.739,00 - Totale: 15.189,00',
  cv:'CV - Martina Esposito - Data Analyst, 4 anni di esperienza in Power BI, SQL, Python.',
  contratto:'ESTRATTO NDA - Art.5 Penali: violazione con penale di 500.000 euro. Art.8 Rinnovo tacito annuale salvo disdetta 180gg.',
  def:'{"evento":"nuova_richiesta","timestamp":"2026-07-03T10:42:00Z","payload":{"tipo":"richiesta_cliente","priorita":"media"}}'
};

function rtTriggerData(node){
  var cfg = node.config || {};

  // Parametri dichiarati sul nodo e compilati dall'utente: sono la sorgente
  // più specifica, quindi vengono prima del payload di esempio e dei dati
  // campione. È ciò che rende il flusso eseguibile con dati propri.
  if(cfg.campi && typeof costruisciPayload === 'function'){
    var payload = costruisciPayload(node);
    var chiavi = Object.keys(payload);
    if(chiavi.length) return {
      text: JSON.stringify(payload, null, 2),
      msg: '▶️ Parametri di ingresso: '+chiavi.map(function(k){
             return k+'='+String(payload[k]).substring(0,30) }).join(', ')
    };
  }

  if(cfg.filedata) return { text:'[FILE: '+(cfg.filename||'file')+']\n'+cfg.filedata,
                            msg:'📄 File reale letto: '+(cfg.filename||'file')+' ('+cfg.filedata.length+' caratteri)' };
  if(cfg.sample && cfg.sample.trim()) return { text: cfg.sample.trim(),
                            msg:'🧪 Payload di test: '+rtTesto(cfg.sample.trim()) };
  var nl = (node.name||'').toLowerCase();
  var t = nl.indexOf('email')>=0 ? RT_SAMPLES.email
        : (nl.indexOf('fattura')>=0||nl.indexOf('upload')>=0||nl.indexOf('file')>=0) ? RT_SAMPLES.fattura
        : nl.indexOf('cv')>=0 ? RT_SAMPLES.cv
        : (nl.indexOf('contratto')>=0||nl.indexOf('documento')>=0) ? RT_SAMPLES.contratto
        : (nl.indexOf('webhook')>=0||nl.indexOf('crm')>=0) ? RT_SAMPLES.webhook
        : RT_SAMPLES.def;
  return { text:t, msg:'📥 Dati campione: '+rtTesto(t) };
}

// Esegue davvero l'azione del connettore. HTTP Request è l'unica con effetto
// reale; le altre restituiscono l'output simulato dichiarato dal connettore.
// Sostituisce i segnaposto nei campi di un connettore.
//   {{result}}          → l'intero output del nodo precedente
//   {{result.campo}}    → un campo, se l'output è JSON
//   {{oggi}}            → la data odierna
// Senza il caso "result.campo" un oggetto veniva incollato per intero dentro un
// destinatario o un oggetto email, rendendo il messaggio inutilizzabile.
// I modelli non restituiscono quasi mai JSON nudo: lo racchiudono in un
// recinto markdown (```json … ```) oppure lo fanno precedere da una frase
// ("Ecco la valutazione:"). `JSON.parse` fallisce su entrambi, e i segnaposto
// {{campo}} restavano scritti tali e quali dentro l'email mentre il registro
// mostrava un output perfettamente corretto — la combinazione piu' difficile
// da diagnosticare, perche' tutto sembra a posto tranne il risultato.
// Il guardrail "Convalida output" toglieva gia' i recinti per conto suo:
// ora la stessa lettura vale ovunque, cosi' i due non possono divergere.
function rtLeggiJson(testo){
  if(testo===undefined||testo===null)return null;
  if(typeof testo==='object')return testo;
  var s=String(testo).trim();
  if(!s)return null;
  try{ return JSON.parse(s) }catch(e){}
  // Recinto markdown, con o senza linguaggio dichiarato.
  var senzaRecinto=s.replace(/^```[a-zA-Z]*\s*/,'').replace(/\s*```$/,'').trim();
  if(senzaRecinto!==s){ try{ return JSON.parse(senzaRecinto) }catch(e){} }
  // Testo attorno: si isola dalla prima graffa all'ultima. Non e' un parser,
  // ma copre il caso reale — una frase introduttiva e l'oggetto dopo.
  var a=senzaRecinto.indexOf('{'), b=senzaRecinto.lastIndexOf('}');
  if(a>=0&&b>a){ try{ return JSON.parse(senzaRecinto.substring(a,b+1)) }catch(e){} }
  var c=senzaRecinto.indexOf('['), d=senzaRecinto.lastIndexOf(']');
  if(c>=0&&d>c){ try{ return JSON.parse(senzaRecinto.substring(c,d+1)) }catch(e){} }
  return null;
}

function rtSostituisci(testo, input, ingresso, ctx){
  if(testo === undefined || testo === null) return '';
  var s = String(testo);
  if(s.indexOf('{{') < 0) return s;

  var dati = rtLeggiJson(input);

  function cerca(fonte, percorso){
    if(!fonte) return undefined;
    var v = fonte;
    percorso.split('.').forEach(function(p){ v = (v && v[p] !== undefined) ? v[p] : undefined });
    return v;
  }

  // Un nodo che produce testo libero SOSTITUISCE la pipeline: da quel punto in
  // poi i campi prodotti prima non sono piu' raggiungibili, e un segnaposto
  // come {{motivazione}} resta scritto tale e quale dentro l'email. E' il caso
  // tipico di "estrai i dati" inserito fra l'analisi e la notifica.
  // Si risale quindi ai nodi gia' completati, dal piu' recente al piu'
  // lontano: chi ha prodotto quel campo per ultimo vince, che e' l'ordine in
  // cui una persona se lo aspetta leggendo il flusso.
  function cercaAMonte(percorso){
    if(!ctx || !ctx.ordineOutput) return undefined;
    for(var i = ctx.ordineOutput.length - 1; i >= 0; i--){
      var grezzo = ctx.outputs[ctx.ordineOutput[i]];
      if(grezzo === undefined || grezzo === null || grezzo === '') continue;
      var o = rtLeggiJson(grezzo);
      if(!o) continue;
      var v = cerca(o, percorso);
      if(v !== undefined) return v;
    }
    return undefined;
  }

  // Ordine: output del nodo a monte, dati d'ingresso del flusso, poi la
  // risalita. Un segnaposto come {{mittente}} riguarda quasi sempre chi ha
  // avviato il flusso, non un risultato intermedio.
  function leggi(percorso){
    var v = cerca(dati, percorso);
    if(v === undefined && percorso.indexOf('trigger.') === 0)
      v = cerca(ingresso, percorso.substring(8));
    if(v === undefined) v = cerca(ingresso, percorso);
    if(v === undefined) v = cercaAMonte(percorso);
    return v;
  }
  function scrivi(v){
    if(v === undefined || v === null) return undefined;
    return (typeof v === 'object') ? JSON.stringify(v) : String(v);
  }

  s = s.replace(/\{\{oggi\}\}/g, new Date().toLocaleDateString('it-IT'));
  s = s.replace(/\{\{result\.([\w.]+)\}\}/g, function(tutto, percorso){
    var v = scrivi(leggi(percorso));
    return v === undefined ? tutto : v;      // irrisolto: resta visibile
  });
  s = s.replace(/\{\{result\}\}/g, String(input === undefined ? '' : input));

  // Segnaposto con nome libero — {{mittente}}, {{cliente}} — risolti come campi
  // dell'output a monte. Un segnaposto che resta non risolto NON viene
  // svuotato: sparendo diventerebbe un destinatario vuoto o un oggetto monco,
  // e nessuno capirebbe da dove viene. Resta scritto, e chi controlla lo vede.
  return s.replace(/\{\{([\w.]+)\}\}/g, function(tutto, chiave){
    var v = scrivi(leggi(chiave));
    return v === undefined ? tutto : v;
  });
}

// Un campo che contiene ancora un segnaposto non è stato risolto: usarlo
// significherebbe scrivere a "{{mittente}}" o creare un record con un titolo
// finto. Si preferisce fermarsi e dirlo.
function rtSegnapostoIrrisolto(valore){
  return typeof valore === 'string' && /\{\{[\w.]+\}\}/.test(valore);
}

async function rtRunConnector(ctx, node, input){
  // Se il nodo punta a una connessione, host/URL/porta vengono da li'. E'
  // cio' che rende un flusso esportabile: chi lo importa lo fa girare sul
  // proprio server senza riaprire ogni nodo.
  var cfg = (typeof configConConnessione === 'function')
    ? configConConnessione(node.name, node.config || {})
    : (node.config || {});
  var key = idempotencyKey(ctx.execId, node.id, 1);

  var replayed = rtReplayLookup(ctx, node.id, 'tool');
  if(replayed !== null){
    rtRecordCall(ctx, node.id, 'tool', { replay:true }, replayed);
    return { text: replayed, msg:'↻ [Rigiocato] '+String(replayed).substring(0,90), real:false };
  }

  // Drive e SharePoint scrivono DAVVERO nella cartella sincronizzata collegata
  // al nodo: è la stessa strada del nodo "Salva su cloud", e l'unica possibile
  // senza backend. Il file prodotto è reale e apribile.
  if((node.name === 'Google Drive' || node.name === 'SharePoint') &&
     typeof csScrivi === 'function' && typeof foBuild === 'function'){
    var fmt = cfg.format || 'PDF';
    var dati = foBuild(fmt, input, cfg.filename || node.name);
    var nomeFile = (cfg.conflitto === 'Sovrascrivi')
      ? (cfg.filename || 'documento') + '.' + (FILE_EXT[fmt] || 'txt')
      : foFilename(cfg.filename || node.name, fmt);
    try{
      // Blob costruito per il formato: un PDF scritto come testo UTF-8 finisce
      // sulla cartella sincronizzata corrotto e non si apre.
      // Cartella e percorso vengono dalla connessione scelta, se c'è.
      var dest = (typeof connCartellaDelNodo === 'function')
        ? connCartellaDelNodo(cfg) : {alias:cfg.cloudAlias, percorso:cfg.cloudPath};
      var esito = await csScrivi(dest.alias, dest.percorso, nomeFile,
                                 foBlob(nomeFile, FILE_MIME[fmt] || 'text/plain', dati),
                                 FILE_MIME[fmt] || 'text/plain');
      rtEmit(ctx, 'file:generated', node.id,
        { nome:nomeFile, byte:dati.length, formato:fmt, cloud:esito.percorso });
      if(typeof LAST_RUN_FILES !== 'undefined')
        LAST_RUN_FILES.push({nome:nomeFile, mime:(FILE_MIME[fmt]||'text/plain'), contenuto:dati});
      return { text: input,
               msg: (node.name==='Google Drive'?'☁️ Drive':'🗄️ SharePoint')+': scritto in '+esito.percorso+
                    ' · '+(dati.length>1024?Math.round(dati.length/1024*10)/10+' KB':dati.length+' byte')+
                    (esito.note&&esito.note.length?': '+esito.note.join(' '):''),
               real:true };
    }catch(errC){
      // Nessuna cartella collegata o permesso revocato: si dichiara, non si
      // ripiega su una simulazione che sembrerebbe un successo.
      return { text: input, msg:'❌ '+node.name+': '+(errC.message||errC),
               real:false, ok:false, error:(errC.message||String(errC)) };
    }
  }

  // Invio email REALE quando il servizio locale è in ascolto. Se non c'è, il
  // nodo non fallisce: registra l'invio come simulato e il flusso prosegue —
  // costruire un flusso non deve dipendere dall'aver avviato un servizio.
  // Il servizio si avvia quando fa comodo, spesso DOPO aver aperto l'app. Una
  // singola verifica all'inizio congelerebbe l'esito negativo e il nodo
  // continuerebbe a simulare anche a servizio acceso, senza dirlo. Quindi:
  // esito negativo -> si ricontrolla sempre (la fetch su una porta chiusa
  // fallisce all'istante); esito positivo -> si tiene per un po', ma non per
  // tutta la sessione, cosi' un servizio fermato a meta' viene notato.
  if(node.name === 'Invia email' && typeof mailInvia === 'function'){
    if(!MAIL_STATO.verificato || !MAIL_STATO.disponibile ||
       (Date.now()-(MAIL_STATO.controllatoIl||0)) > MAIL_TTL_MS) await mailVerificaServizio();
    var destinatario = rtSostituisci(cfg.to, input, ctx.triggerData, ctx);
    // Meglio non inviare che inviare a un indirizzo che non esiste: il
    // segnaposto non risolto verrebbe preso alla lettera dal server di posta.
    if(rtSegnapostoIrrisolto(destinatario)){
      return { text: input, ok:false, error:'destinatario non risolto',
        msg:'❌ Destinatario non risolto: "'+destinatario+'", il dato a monte non contiene quel campo. '+
            'Controlla il nome del segnaposto o usa un indirizzo fisso.' };
    }
    if(MAIL_STATO.disponibile){
      // Due sorgenti diverse: i file PRODOTTI da questa esecuzione e quelli
      // FISSI scelti sul nodo. I secondi partono sempre, anche quando il flusso
      // non ha generato niente: è il caso del listino o del modulo allegato
      // a una notifica.
      var allegati = (cfg.attach === 'Sì' && typeof mailAllegatiDelFlusso === 'function')
        ? mailAllegatiDelFlusso() : [];
      if(typeof mailAllegatiFissi === 'function')
        allegati = allegati.concat(mailAllegatiFissi(cfg));
      var _oggetto = rtSostituisci(cfg.subject, input, ctx.triggerData, ctx);
      var _corpo   = rtSostituisci(cfg.body || '{{result}}', input, ctx.triggerData, ctx);
      // Un segnaposto rimasto scritto parte davvero cosi' nell'email. Non si
      // blocca l'invio — oggetto e corpo restano leggibili — ma va detto qui,
      // altrimenti lo si scopre solo aprendo il messaggio ricevuto.
      var _irrisolti = (_oggetto + ' ' + _corpo).match(/\{\{[\w.]+\}\}/g);
      var _avvisoSegnaposto = null;
      if(_irrisolti && _irrisolti.length){
        _irrisolti = _irrisolti.filter(function(v,i,a){return a.indexOf(v)===i});
        _avvisoSegnaposto = '\u26a0\ufe0f Segnaposto non risolti nel messaggio: '+_irrisolti.join(', ')+
          ': nessun nodo a monte produce quel campo. L\u2019email parte con il segnaposto scritto tale e quale.';
      }
      var esitoMail = await mailInvia({
        a: destinatario, cc: rtSostituisci(cfg.cc, input, ctx.triggerData, ctx),
        oggetto: _oggetto, corpo: _corpo,
        html: cfg.bodytype === 'HTML', allegati: allegati
      });
      if(esitoMail.ok){
        // Il servizio restituisce il destinatario; se una versione piu' vecchia
        // non lo facesse, nel registro comparirebbe "undefined": si ripiega su
        // quello che il nodo ha effettivamente chiesto di contattare.
        var _dest = esitoMail.destinatario || destinatario;
        rtEmit(ctx, 'mail:sent', node.id, { a:_dest, allegati:allegati.length, segnapostoIrrisolti:_irrisolti||[] });
        if(_avvisoSegnaposto) rtPush(ctx, node, _avvisoSegnaposto, 'WARN');
        return { text: input, real:true,
          msg:'📧 Email inviata realmente a ' + _dest +
              (allegati.length ? ' con ' + allegati.length + ' allegato/i' : '') };
      }
      return { text: input, ok:false, error:esitoMail.errore,
               msg:'❌ Invio non riuscito: ' + esitoMail.errore };
    }
    // Servizio assente: si dichiara, non si finge. L'anteprima mostra pero' i
    // segnaposto GIA' RISOLTI, come sarebbero partiti davvero: lasciandoli
    // grezzi il registro faceva credere che la sostituzione non funzionasse,
    // ed e' proprio quando il servizio non c'e' che si controlla il testo.
    var cfgRisolto=Object.assign({},cfg,{
      to:destinatario,
      subject:rtSostituisci(cfg.subject,input,ctx.triggerData,ctx),
      body:rtSostituisci(cfg.body||'{{result}}',input,ctx.triggerData,ctx)
    });
    return { text: input, real:false,
      msg:'🧪 ' + (CONNECTOR_CONFIGS['Invia email'].sim(cfgRisolto)) +
          ' [simulato: servizio di invio non avviato]' };
  }

  if(node.name === 'HTTP Request' && cfg.url){
    var headers = { 'Content-Type':'application/json', 'Idempotency-Key': key };
    if(cfg.headers){ try{ Object.assign(headers, JSON.parse(rtSostituisci(cfg.headers,input,ctx.triggerData,ctx))) }catch(e){} }
    var method = (cfg.method || 'POST').toUpperCase();
    // Il corpo passa dalla stessa sostituzione del nodo email. Prima veniva
    // rimpiazzato SOLO {{result}}: un {{punteggio}} scritto nel corpo partiva
    // verso il sistema esterno cosi' com'era, e il destinatario riceveva la
    // stringa "{{punteggio}}" al posto del valore — senza che nulla lo dicesse.
    // Le virgolette contano: dentro un JSON il valore va inserito gia'
    // scappato, altrimenti un apice nel testo romperebbe il corpo.
    var body = null;
    if(method !== 'GET' && method !== 'DELETE'){
      body = String(cfg.body || '{"data":"{{result}}"}')
        .replace(/\{\{result\}\}/g, JSON.stringify(input||'').slice(1,-1));
      body = rtSostituisci(body, input, ctx.triggerData, ctx);
      var irrisolti = body.match(/\{\{[\w.]+\}\}/g);
      if(irrisolti) rtPush(ctx, node, '\u26a0\ufe0f Segnaposto non risolti nel corpo: '+
        irrisolti.filter(function(v,i,a){return a.indexOf(v)===i}).join(', ')+
        ': partiranno scritti cosi\u0300 verso il sistema esterno.','WARN');
    }
    var t0 = Date.now();
    try{
      var resp = await fetch(cfg.url, { method:method, headers:headers, body:body,
        signal: ctx.abortCtrl ? ctx.abortCtrl.signal : undefined });
      var txt = await resp.text();
      rtRecordCall(ctx, node.id, 'tool', { url:cfg.url, method:method, body:body, key:key }, txt);
      return { text: resp.ok && txt ? txt : input, ok: resp.ok,
               msg:'🌐 REALE '+method+' '+cfg.url+' → HTTP '+resp.status+' ('+(Date.now()-t0)+'ms) · chiave '+key,
               real:true };
    }catch(err){
      // Una chiamata troncata dall'utente non è un guasto del connettore:
      // registrarla come errore farebbe risultare fallito un flusso che è
      // stato semplicemente fermato.
      if(err.name==='AbortError'||ctx.abort){
        return { text: input, ok:true, aborted:true, msg:'⏹ Chiamata a '+cfg.url+' interrotta dall\'utente' };
      }
      rtRecordCall(ctx, node.id, 'tool', { url:cfg.url, method:method, key:key }, 'ERRORE: '+err.message);
      // "Failed to fetch" copre due guasti opposti: endpoint inesistente e
      // endpoint sano che non autorizza le chiamate da una pagina web. Dal
      // browser sono indistinguibili, e chi legge il registro va a cercare
      // l'errore nell'URL quando invece l'URL e' giusto. Se il servizio
      // locale e' avviato, la sonda scioglie il dubbio.
      var diagnosi = ' (endpoint irraggiungibile o CORS)';
      if(typeof sonda === 'function'){
        var s = await sonda({ tipo:'http', url:cfg.url, metodo:method });
        if(s && s.ok) diagnosi = ': l\u2019endpoint risponde HTTP '+s.stato+' ma il browser non pu\u00f2 chiamarlo: manca l\u2019autorizzazione CORS. L\u2019URL \u00e8 corretto';
        else if(s) diagnosi = ': verificato dal servizio locale: '+(s.errore||'endpoint non raggiungibile');
      }
      return { text: input, ok:false, error: err.message,
               msg:'❌ HTTP Request fallita: '+err.message+diagnosi };
    }
  }

  var cc = (typeof getConnectorConfig === 'function') ? getConnectorConfig(node.name) : null;
  var out = cc && cc.sim ? cc.sim(cfg) : ('⚙️ '+node.name+': azione eseguita');
  // Ogni riga che descrive un'azione mai avvenuta deve dirlo. Senza questo
  // marchio il registro scriveva "Jira: creata Task OPS-828" e "K8s: 3/3
  // repliche ready": chi legge conclude ragionevolmente che il ticket esista.
  // Il marchio si applica qui, in un punto solo, invece che dentro le 31
  // funzioni sim(): cosi' vale anche per i connettori aggiunti domani, che
  // altrimenti nascerebbero muti.
  // Questo ramo e' raggiunto SOLO dai connettori senza esecuzione reale:
  // email, HTTP, cartelle cloud ed export escono prima, con `real:true`.
  if(!/\[simulato\]|\[demo\]/i.test(out)) out += ' [simulato]';
  rtRecordCall(ctx, node.id, 'tool', { connettore:node.name, config:cfg, key:key }, out);
  return { text: input, ok:true, msg: out + ' · chiave ' + key, real:false };
}

// Ciclo di tool calling (B2): il modello riceve gli schemi degli strumenti,
// ne invoca uno, il runtime lo esegue applicando i guardrail e restituisce
// l'esito, il modello prosegue. Limitato da maxIterations.
async function rtRunAiNode(ctx, node){
  var cfg = node.config || {};
  var sys = cfg.prompt || ('Sei un nodo AI in un workflow aziendale. Il tuo compito: '+node.name+', '+(node.detail||'')+'. Rispondi in modo conciso e strutturato, in italiano.');
  if(ctx.context && ctx.context.trim()){
    sys = 'ISTRUZIONI GENERALI DEL WORKFLOW (da rispettare sempre):\n'+ctx.context.trim()+'\n\n---\n\n'+sys;
  }

  var strumenti = [];
  if(cfg.useTools !== false){
    var abilitati = cfg.enabledTools ? String(cfg.enabledTools).split(',').map(function(s){return s.trim()}).filter(Boolean) : null;
    strumenti = toolsForAiNode(node.id, ctx.nodes, ctx.edges, abilitati).map(toolSchemaForConnector);
  }

  var replayed = rtReplayLookup(ctx, node.id, 'ai');
  if(replayed !== null){
    rtRecordCall(ctx, node.id, 'ai', { replay:true }, replayed);
    return { text: replayed, msgs:['↻ [Rigiocato] '+String(replayed).substring(0,100)] };
  }

  // Un documento esteso — un PDF di cento pagine estratto dal trigger — supera
  // la finestra di contesto e fa fallire la chiamata con un errore che non dice
  // nulla all'utente. Meglio troncare qui, in modo dichiarato: il registro
  // riporta quanto è stato scartato, così il risultato resta interpretabile.
  var RT_MAX_INPUT = 60000;   // ~15.000 token, sotto il limite di ogni fornitore
  var ingresso = String(ctx.pipeline == null ? '' : ctx.pipeline);
  var msgs = [], testo = '', iter = 0, invocazioni = {};
  if(ingresso.length > RT_MAX_INPUT){
    var scartati = ingresso.length - RT_MAX_INPUT;
    ingresso = ingresso.substring(0, RT_MAX_INPUT) +
      '\n\n[…testo troncato: '+scartati.toLocaleString('it-IT')+' caratteri non inviati al modello]';
    msgs.push('✂️ Input troppo lungo per la finestra di contesto: inviati i primi '+
      RT_MAX_INPUT.toLocaleString('it-IT')+' caratteri su '+(RT_MAX_INPUT+scartati).toLocaleString('it-IT')+
      '. Per documenti estesi usa la Knowledge Base, che seleziona solo i passaggi pertinenti.');
  }
  var user = 'Dati in input dal nodo precedente:\n\n'+ingresso+'\n\nEsegui il tuo compito su questi dati.';

  // Fornitore effettivo del nodo. In "Automatico" si usa quello collegato,
  // così integrare UNA chiave basta a rendere eseguibile l'intero flusso.
  var scelto = (typeof risolviProvider === 'function')
    ? risolviProvider(cfg.model)
    : { provider: cfg.model || 'claude' };
  var provRisolto = scelto.provider || cfg.model || 'claude';
  // Il modello va scritto nel registro: due esecuzioni dello stesso flusso con
  // modelli diversi possono dare risultati diversi, e senza saperlo il
  // confronto fra due registri non significa nulla.
  var modelloUsato = (typeof modelloEffettivo === 'function')
    ? modelloEffettivo(provRisolto, cfg.modelId) : '';
  if(scelto.automatico && scelto.provider)
    msgs.push('⚡ Provider automatico: '+providerLabel(scelto.provider)+(modelloUsato?' · '+modelloUsato:''));
  else if(modelloUsato)
    msgs.push('🧩 Modello: '+modelloUsato);
  // Una sostituzione non è mai silenziosa: il risultato viene da un modello
  // diverso da quello indicato sul nodo, e questo cambia come va letto.
  if(scelto.sostituito)
    msgs.push('↪️ Il nodo indica '+providerLabel(scelto.richiesto)+', non collegato: eseguito con '+providerLabel(scelto.provider));
  var maxIter = parseInt(cfg.maxIterations || '3', 10) || 3;

  // ── C3: RECUPERO DALLA KNOWLEDGE BASE ──
  // Le porzioni recuperate finiscono nel prompt CON la citazione della fonte e
  // vengono elencate nel registro di esecuzione: quali frammenti hanno formato
  // la risposta, con nome documento e punteggio, non è un dettaglio di
  // diagnostica ma il requisito di trasparenza del blocco.
  if(cfg.useKB && typeof kbSearch === 'function'){
    // Il quesito è ciò che arriva dal flusso, non il nome del nodo: chiamare
    // un nodo "Rispondi con KB" aggiungeva alla ricerca parole che non
    // appartengono alla domanda e spostava il recupero su porzioni sbagliate.
    // Nome e descrizione restano solo come ripiego a pipeline vuota.
    var quesito = String(ctx.pipeline||'').trim().substring(0, 600) ||
                  (node.name+' '+(node.detail||''));
    var ric = kbSearch(quesito, {
      businessUnit: cfg.kbBusinessUnit || 'Tutte',
      limit: parseInt(cfg.kbTopK || '4', 10) || 4
    });
    if(ric.results.length){
      sys = kbBuildContext(ric.results)+'\n\n---\n\n'+sys;
      ctx.gr.kbChunks = (ctx.gr.kbChunks || []).concat(ric.results);
      rtEmit(ctx, 'kb:retrieved', node.id, {
        query: quesito.substring(0,160), motore: ric.motore,
        scartatiPermessi: ric.scartatiPermessi,
        porzioni: ric.results.map(function(r){ return { doc:r.docName, sezione:r.label, punteggio:r.score } })
      });
      msgs.push('📚 Knowledge Base: '+ric.results.length+' porzioni su '+ric.candidati+' candidate ('+ric.motore+')'+
        (ric.scartatiPermessi ? ' · '+ric.scartatiPermessi+' escluse dai permessi' : ''));
      ric.results.forEach(function(r){
        msgs.push('   ↳ "'+r.docName+'": '+r.label+' · punteggio '+r.score+' (BM25 '+r.bm25+', coseno '+r.cosine+')');
      });
    }else{
      // Nessun recupero è un esito, non un silenzio: senza questa riga il
      // modello risponderebbe a memoria e nel registro sembrerebbe fondato.
      rtEmit(ctx, 'kb:empty', node.id, { query: quesito.substring(0,160), motore: ric.motore, scartatiPermessi: ric.scartatiPermessi });
      msgs.push('📚 Knowledge Base attiva ma nessuna porzione recuperata: '+ric.motore+
        (ric.scartatiPermessi ? ' · '+ric.scartatiPermessi+' escluse dai permessi' : ''));
    }
  }

  // Output vincolato (B3): si usa la modalità nativa dove il fornitore la
  // supporta, altrimenti si ripiega sul vincolo nel prompt e si REGISTRA la
  // differenza, invece di far credere che siano equivalenti.
  var vincolo = cfg.outformat === 'json' ? 'json' : null;
  // Le capacità vanno chieste al fornitore RISOLTO: interrogandole su "auto"
  // la risposta era sempre "non supportato", e ogni nodo con output vincolato
  // ripiegava inutilmente sul vincolo nel prompt.
  var caps = (typeof providerCapabilities === 'function') ? providerCapabilities(provRisolto) : {};
  if(vincolo && !caps.structuredOutput){
    sys += ' Rispondi ESCLUSIVAMENTE con JSON valido, senza testo aggiuntivo.';
    rtEmit(ctx, 'capability:degraded', node.id,
      { capability:'structuredOutput', provider:provRisolto, fallback:'vincolo nel prompt + convalida' });
    msgs.push('⚠️ Output vincolato non supportato da "'+providerLabel(provRisolto)+'": ripiego sul vincolo nel prompt (registrato in traccia)');
  }else if(cfg.outformat === 'markdown'){
    sys += ' Formatta la risposta in Markdown.';
  }

  while(iter < maxIter){
    iter++;
    // Il segnale di interruzione viaggia con la configurazione: una chiamata
    // al modello può durare decine di secondi, ed è proprio quella che
    // l'utente vuole poter troncare.
    var cfgRun = Object.assign({}, cfg, { model: provRisolto, modelId: cfg.modelId,
      signal: ctx.abortCtrl ? ctx.abortCtrl.signal : undefined });
    var res = (typeof callAIWithTools === 'function' && strumenti.length)
      ? await callAIWithTools(user, sys, cfgRun, strumenti)
      : await callAI(user, sys, cfgRun);
    if(ctx.abort) return { text: testo || '', msgs: msgs.concat(['⏹ Chiamata al modello interrotta dall\'utente']) };
    // Un ripiego cambia il fornitore a meta' esecuzione: se non comparisse nel
    // registro, l'esito risulterebbe prodotto da un modello che non e' quello
    // scritto sul nodo, senza che nulla lo dica.
    if(res.ripiego)msgs.push('\u21bb Ripiego: '+res.ripiego.da+' non ha risposto, richiesta servita da '+res.ripiego.a);
    if(res.ripiegoTentato)msgs.push('\u26a0\ufe0f Anche i fornitori di riserva hanno fallito: '+res.ripiegoTentato.join(', '));
    ctx.gr.aiCalls++;
    rtRecordCall(ctx, node.id, 'ai', { system:sys, user:user, tools:strumenti.map(function(t){return t.name}), iter:iter }, res.text);

    if(res.toolCall){
      // Il modello ha scelto uno strumento: il runtime lo esegue e gli
      // restituisce l'esito, poi il modello prosegue.
      var target = ctx.nodes.find(function(n){ return n.id === res.toolCall.nodeId });
      if(!target){ testo = res.text; break }

      // Stesso strumento con gli stessi argomenti significa che il modello
      // non sta usando l'esito che gli è stato restituito: ripetere non
      // porterebbe da nessuna parte e consumerebbe iterazioni e token.
      var firma = res.toolCall.name + '|' + JSON.stringify(res.toolCall.args || {});
      invocazioni[firma] = (invocazioni[firma] || 0) + 1;
      if(invocazioni[firma] > 1){
        msgs.push('⚠️ Il modello ha richiesto di nuovo "'+target.name+'" con gli stessi argomenti: interrompo il ciclo e uso l\'ultimo esito');
        rtEmit(ctx, 'tool:loop', node.id, { tool: res.toolCall.name, ripetizioni: invocazioni[firma] });
        testo = res.text || testo;
        break;
      }
      rtEmit(ctx, 'tool:invoked', node.id, { tool: res.toolCall.name, args: res.toolCall.args, chosenBy: res.demo ? 'simulato' : 'modello' });
      msgs.push((res.demo?'[Demo] ':'')+'🔧 Il modello invoca lo strumento "'+target.name+'"'+(res.toolCall.reason?': '+res.toolCall.reason:''));
      var esito = await rtRunConnector(ctx, target, ctx.pipeline);
      msgs.push('   ↳ '+esito.msg);
      target._toolInvoked = true;
      user = 'Esito dello strumento "'+target.name+'":\n'+String(esito.text||esito.msg).substring(0,800)+'\n\nProsegui il tuo compito.';
      continue;
    }
    testo = res.text;
    if(res.demo) msgs.push('[Demo] '+rtTesto(res.text));
    else msgs.push('🧠 '+rtTesto(res.text));
    break;
  }

  if(iter >= maxIter) msgs.push('⚠️ Raggiunto il limite di '+maxIter+' iterazioni per questo nodo');

  // Convalida del vincolo quando il fornitore non lo garantisce nativamente
  if(vincolo === 'json' && !caps.structuredOutput){
    try{ JSON.parse(String(testo).replace(/```json|```/g,'').trim()) }
    catch(e){ msgs.push('⚠️ Output non conforme al vincolo JSON: un nodo "Convalida output" a valle lo intercetterebbe') }
  }
  return { text: testo, msgs: msgs };
}

// Sotto-agente (B7): esegue un altro agente salvato usando lo stesso motore.
async function rtRunSubAgent(ctx, node){
  var nome = (node.config && node.config.agentName) || '';
  if(!nome) return { text: ctx.pipeline, msgs:['⚠️ Nessun agente selezionato in questo nodo'] };
  if(ctx.depth >= 2) return { text: ctx.pipeline, msgs:['⛔ Profondità massima di delega raggiunta, chiamata non eseguita'] };

  var row = null;
  try{ row = dbGetOne('SELECT * FROM agents WHERE name=?', [nome]) }catch(e){}
  if(!row) return { text: ctx.pipeline, msgs:['⚠️ Agente "'+nome+'" non trovato fra quelli salvati'] };

  rtEmit(ctx, 'agent:handoff', node.id, { to: nome, direction:'out' });
  var msgs = ['🤝 Delega a "'+nome+'": passaggio di controllo'];
  var sub;
  try{
    sub = await executeGraph({
      nodes: JSON.parse(row.nodes_json), edges: JSON.parse(row.edges_json),
      context: row.context || '', agentName: nome, agentId: row.id,
      headless: true, depth: ctx.depth + 1, seed: ctx.trace.seed,
      inputOverride: ctx.pipeline
    });
  }catch(e){
    return { text: ctx.pipeline, msgs: msgs.concat(['❌ Il sotto-agente ha generato un errore: '+e.message]) };
  }
  rtEmit(ctx, 'agent:handoff', node.id, { to: nome, direction:'in', status: sub.status, nodes: sub.stepsCount });
  msgs.push('   ↳ "'+nome+'" ha completato '+sub.stepsCount+' nodi ('+sub.status+'): controllo restituito');
  return { text: sub.pipeline || ctx.pipeline, msgs: msgs, subTrace: sub.trace };
}

// ── Grafo: dipendenze e ondate (B4) ──────────────────────────────────────

// Nodi pronti = tutte le dipendenze soddisfatte (completate o saltate).
// ══════════════════════════════════════════════════════════════
// CICLI
// ══════════════════════════════════════════════════════════════
// Tetto assoluto alle iterazioni di un Loop. Un ciclo senza limite dentro una
// pagina web blocca il browser, e durante una dimostrazione dal vivo non si
// recupera piu': meglio un limite dichiarato nel registro che una schermata
// morta. Venticinque bastano a mostrare che il meccanismo e' reale e non
// bastano a piantare nulla.
var LOOP_TETTO = 25;

// Tutti i nodi raggiungibili da `id` seguendo le frecce in avanti. Sono quelli
// che un Loop deve riaprire per ripercorrerli. Il nodo di partenza resta
// escluso: se lo si azzera insieme agli altri si perde il conteggio del giro.
function rtNodiAValle(ctx, id){
  var visti = {}, coda = [id], out = [];
  while(coda.length){
    var corrente = coda.shift();
    ctx.edges.forEach(function(e){
      if(e.from !== corrente) return;
      if(visti[e.to]) return;
      visti[e.to] = true;
      out.push(e.to);
      coda.push(e.to);
    });
  }
  return out;
}

// Valore di un campo prodotto dai nodi a monte, cercato nella pipeline
// corrente e poi negli output gia' raccolti. Serve al Loop per sapere QUANTI
// elementi ci sono davvero, invece di ripetere un numero fisso.
// Valore di un campo prodotto dai nodi a monte. Serve al Loop per sapere QUANTI
// elementi ci sono davvero, invece di ripetere un numero fisso.
//
// La pipeline e' una STRINGA, non un oggetto: cercare le chiavi dentro di essa
// come se fosse una struttura non trovava mai niente, e il ciclo ricadeva in
// silenzio sul numero dichiarato. Quando il contenuto e' JSON — ed e' il caso
// dei nodi con output vincolato, cioe' proprio quelli che producono elenchi —
// va prima interpretato.
function rtInterpreta(v){
  if(v == null) return null;
  if(typeof v === 'object') return v;
  var t = String(v).trim();
  if(!t || (t.charAt(0) !== '{' && t.charAt(0) !== '[')) return null;
  try{ return JSON.parse(t) }catch(e){ return null }
}

function rtLeggiCampo(ctx, campo){
  var chiave = String(campo||'').trim();
  if(!chiave) return null;
  var cerca = function(o){
    if(!o || typeof o !== 'object') return undefined;
    if(o[chiave] !== undefined) return o[chiave];
    for(var k in o){
      if(o[k] && typeof o[k] === 'object'){
        var v = cerca(o[k]);
        if(v !== undefined) return v;
      }
    }
    return undefined;
  };
  var v = cerca(rtInterpreta(ctx.pipeline));
  if(v !== undefined) return v;
  var ids = Object.keys(ctx.outputs || {});
  for(var i = ids.length - 1; i >= 0; i--){
    v = cerca(rtInterpreta(ctx.outputs[ids[i]]));
    if(v !== undefined) return v;
  }
  return null;
}

// Riapre i nodi a valle di un ciclo che ha ancora giri da fare. Viene chiamata
// SOLO quando l'ondata si esaurisce, cioe' quando tutto quello che poteva
// girare ha girato: e' questo che garantisce che ogni iterazione sia completa
// prima che cominci la successiva. Restituisce true se ha riaperto qualcosa,
// e in quel caso il motore fa un altro giro invece di concludere.
function rtRiarmaCicli(ctx, stato){
  if(!ctx.cicli) return false;
  var ids = Object.keys(ctx.cicli);
  for(var k=0;k<ids.length;k++){
    var id = parseInt(ids[k],10);
    var g = ctx.cicli[id];
    if(g.i >= g.tot) continue;
    // Si riapre solo se i nodi a valle hanno finito: altrimenti si
    // sovrapporrebbero due iterazioni sugli stessi nodi.
    var inSospeso = g.valle.some(function(n){
      return stato[n] === 'idle' || stato[n] === 'running' || stato[n] === 'waiting';
    });
    if(inSospeso) continue;
    g.i++;
    g.valle.forEach(function(n){ stato[n] = 'idle' });
    var nodo = ctx.nodes.filter(function(n){ return n.id === id })[0];
    if(nodo) rtPush(ctx, nodo, '🔄 Iterazione '+g.i+' di '+g.tot+' ('+g.origine+')', 'OK');
    return true;
  }
  return false;
}

function rtReadyNodes(ctx, stato){
  return ctx.nodes.filter(function(n){
    if(stato[n.id] !== 'idle') return false;
    var ingressi = ctx.edges.filter(function(e){ return e.to === n.id });
    if(!ingressi.length) return n.type === 'tr' || !ctx.edges.some(function(e){ return e.to === n.id });
    return ingressi.every(function(e){
      return stato[e.from] === 'done' || stato[e.from] === 'skipped' || stato[e.from] === 'error';
    });
  });
}

// Un nodo va saltato se TUTTI i suoi ingressi provengono da rami disattivati.
function rtShouldSkip(ctx, node, stato){
  var ingressi = ctx.edges.filter(function(e){ return e.to === node.id });
  if(!ingressi.length) return false;
  var attivi = ingressi.filter(function(e){
    if(stato[e.from] === 'skipped') return false;
    var dis = ctx.skipFrom[e.from];
    if(dis && dis === e.fp) return false;   // ramo disattivato dalla condizione
    return true;
  });
  return attivi.length === 0;
}

// Input di un nodo: l'output del predecessore attivo. Nei punti di
// convergenza si uniscono gli output dei rami che hanno prodotto qualcosa.
function rtInputFor(ctx, node, stato){
  var ingressi = ctx.edges.filter(function(e){ return e.to === node.id && stato[e.from] === 'done' });
  if(!ingressi.length) return ctx.pipeline;
  var vals = ingressi.map(function(e){ return ctx.outputs[e.from] }).filter(function(v){ return v !== undefined && v !== '' });
  if(!vals.length) return ctx.pipeline;
  if(vals.length === 1) return vals[0];
  return vals.map(function(v,i){ return '--- contributo '+(i+1)+' ---\n'+v }).join('\n\n');
}

// ── Esecuzione ───────────────────────────────────────────────────────────

async function executeGraph(spec){
  var ctx = createRuntimeContext(spec);
  if(spec.inputOverride) ctx.pipeline = spec.inputOverride;

  var stato = {};
  ctx.nodes.forEach(function(n){ stato[n.id] = 'idle' });

  rtEmit(ctx, 'execution:queued', null, { agente: ctx.agentName, nodi: ctx.nodes.length, seed: ctx.trace.seed, replay: !!ctx.replay });

  // I nodi esclusi vanno dichiarati in apertura: un risultato ottenuto saltando
  // un controllo o un passaggio non è confrontabile con uno ottenuto a flusso
  // intero, e chi legge il registro deve saperlo subito.
  if(ctx.esclusi.length){
    rtEmit(ctx, 'execution:excluded', null, { nodi: ctx.esclusi.map(function(n){ return n.name }) });
    ctx.steps.push({ time: rtNow(), type:'SISTEMA', status:'WARN',
      msg:'🚫 '+ctx.esclusi.length+' nodo/i escluso/i dall\'esecuzione: '+
          ctx.esclusi.map(function(n){ return n.icon+' '+n.name }).join(', ')+
          ': il flusso prosegue collegando i nodi a monte con quelli a valle' });
  }

  // Interruzione richiesta dall'utente. Si controlla fra un'ondata e l'altra:
  // un nodo già partito viene lasciato finire — troncarlo a metà lascerebbe
  // il sistema esterno in uno stato che la traccia non saprebbe descrivere.
  RUNNING_CTX[ctx.execId] = ctx;

  // Il tetto alle ondate cresce con i cicli presenti: un Loop ripercorre i
  // nodi a valle, quindi un flusso con un ciclo ne consuma molte piu' di uno
  // lineare. Con il vecchio limite fisso un ciclo lungo veniva troncato in
  // silenzio a meta', ed e' il tipo di bugia peggiore — il registro diceva
  // «concluso» avendo saltato meta' degli elementi.
  var cicli = ctx.nodes.filter(function(n){ return n.name==='Loop' }).length;
  var maxOndate = 200 + cicli * LOOP_TETTO * Math.max(1, ctx.nodes.length);

  var eseguiti = 0, guardia = 0;
  while(guardia++ < maxOndate){
    if(ctx.abort){
      rtEmit(ctx, 'execution:aborted', null, { eseguiti: eseguiti, richiestaDa: 'utente' });
      ctx.steps.push({ time: rtNow(), type:'SISTEMA', msg:'⏹️ Esecuzione interrotta su richiesta, '+eseguiti+' nodi completati, i restanti non sono stati avviati', status:'WARN' });
      delete RUNNING_CTX[ctx.execId];
      return rtFinalize(ctx, 'aborted', eseguiti);
    }
    var pronti = rtReadyNodes(ctx, stato);
    if(!pronti.length){
      // Niente da eseguire: prima di concludere si guarda se un ciclo ha
      // ancora giri da fare. E' il punto in cui una iterazione e' certamente
      // finita, quindi l'unico in cui e' corretto aprirne un'altra.
      if(rtRiarmaCicli(ctx, stato)) continue;
      break;
    }

    // Un nodo marcato sequenziale non parte insieme agli altri: l'ondata si
    // riduce a lui solo, per i casi in cui l'ordine conta davvero.
    var sequenziale = pronti.find(function(n){ return n.config && n.config.sequential });
    var ondata = sequenziale ? [sequenziale] : pronti;

    if(ondata.length > 1){
      rtEmit(ctx, 'wave:parallel', null, { nodi: ondata.map(function(n){ return n.id }), conteggio: ondata.length });
    }

    var esiti = await Promise.all(ondata.map(function(node){
      return rtExecuteNode(ctx, node, stato);
    }));

    for(var i=0;i<esiti.length;i++){
      eseguiti += esiti[i].counted ? 1 : 0;
      if(esiti[i].waiting){
        // Sospensione: si interrompe qui conservando tutto lo stato, così la
        // ripresa non deve rieseguire ciò che è già stato fatto.
        ctx.waiting = { nodeId: esiti[i].nodeId, stato: stato, eseguiti: eseguiti };
        SUSPENDED_RUNS[ctx.execId] = { ctx: ctx, stato: stato };
        // La sospensione non e piu "in corso": lasciarla in RUNNING_CTX
        // terrebbe isExecutionRunning() vero per sempre e farebbe puntare
        // un eventuale Interrompi a un contesto ormai fermo.
        delete RUNNING_CTX[ctx.execId];
        rtEmit(ctx, 'execution:suspended', esiti[i].nodeId, { motivo:'in attesa di autorizzazione' });
        return rtFinalize(ctx, 'waiting', eseguiti);
      }
      if(esiti[i].fatal){
        delete RUNNING_CTX[ctx.execId];
        return rtFinalize(ctx, 'error', eseguiti);
      }
    }
  }

  delete RUNNING_CTX[ctx.execId];
  return rtFinalize(ctx, ctx.hasError ? 'error' : 'done', eseguiti);
}

// Esecuzioni in corso, indicizzate per id: servono a poterle interrompere
// dall'esterno senza passare variabili globali fra adattatore e motore.
var RUNNING_CTX = {};

function abortExecution(execId){
  var ids = execId ? [execId] : Object.keys(RUNNING_CTX);
  var fermate = 0;
  ids.forEach(function(id){
    var c = RUNNING_CTX[id];
    if(!c) return;
    c.abort = true;
    // Non basta alzare una bandiera e aspettare il nodo successivo: una
    // chiamata al modello o a un sistema esterno può durare decine di
    // secondi. L'AbortController la tronca subito, ed è ciò che rende
    // l'interruzione immediata invece che "al prossimo giro".
    if(c.abortCtrl){ try{ c.abortCtrl.abort() }catch(e){} }
    fermate++;
  });
  return fermate;
}

function isExecutionRunning(){
  return Object.keys(RUNNING_CTX).length > 0;
}

// ── TEMPI DI ESECUZIONE ──
// I nodi simulati completavano in pochi millisecondi: l'intero flusso finiva
// prima che si potesse leggere una riga di registro, e l'evidenziazione del
// nodo in corso non si vedeva affatto. Un'integrazione reale ha invece un
// costo di rete, e la differenza fra un nodo di logica e una scrittura su ERP
// è parte di ciò che il prototipo deve mostrare.
//
// Il ritardo si applica SOLO ai nodi simulati e SOLO in esecuzione
// interattiva: una chiamata AI vera ha già il proprio tempo, e le esecuzioni
// pianificate o le riesecuzioni da traccia non devono rallentare.
var RT_LATENZE={
  tr:[120,260],   // ricezione evento
  cd:[60,140],    // valutazione locale
  gr:[110,300],   // controllo
  ou:[130,320],   // scrittura esito
  ai:[700,1600],  // solo quando la risposta è simulata
  ac:[450,1400],  // chiamata a sistema esterno
  sa:[600,1200]
};
// Connettori notoriamente lenti: un ERP o un data warehouse non rispondono
// come un webhook.
var RT_LENTI=/sap|oracle|netsuite|dynamics|snowflake|bigquery|redshift|salesforce/i;

function rtSimulatedLatency(ctx, node){
  if(ctx.headless || ctx.replay || ctx.noLatency || ctx.abort) return Promise.resolve();
  var r = RT_LATENZE[node.type];
  if(!r) return Promise.resolve();
  var ms = r[0] + Math.random()*(r[1]-r[0]);
  if(node.type==='ac' && RT_LENTI.test(node.name)) ms *= 1.9;
  // Un nodo AI con provider configurato attende già la rete: non si somma.
  if(node.type==='ai'){
    var p = (typeof normalizeProviderName==='function') ? normalizeProviderName((node.config&&node.config.model)||'claude') : 'claude';
    var pc = (typeof aiConfig!=='undefined' && aiConfig.providers) ? aiConfig.providers[p] : null;
    if(pc && pc.status==='ok') return Promise.resolve();
  }
  // L'attesa simulata deve poter essere troncata: se restasse appesa,
  // l'interruzione arriverebbe comunque in ritardo di un nodo.
  return new Promise(function(res){
    var t = setTimeout(res, Math.round(ms));
    if(ctx.abortCtrl){
      ctx.abortCtrl.signal.addEventListener('abort', function(){ clearTimeout(t); res() }, {once:true});
    }
  });
}

async function rtExecuteNode(ctx, node, stato){
  // Ramo disattivato da una condizione a monte
  if(rtShouldSkip(ctx, node, stato)){
    stato[node.id] = 'skipped';
    rtEmit(ctx, 'node:skipped', node.id, { nome: node.name });
    ctx.steps.push({ time: rtNow(), type: rtTypeLabel(node), msg:'⏭ Saltato (ramo non attivo): '+node.name, status:'SKIP' });
    return { counted:false };
  }

  // Interruzione arrivata mentre questo nodo era in coda: non si avvia.
  if(ctx.abort){
    stato[node.id] = 'skipped';
    ctx.steps.push({ time: rtNow(), type: rtTypeLabel(node), msg:'⏹ Non avviato: esecuzione interrotta', status:'WARN' });
    return { counted:false };
  }

  stato[node.id] = 'running';
  rtEmit(ctx, 'node:start', node.id, { nome: node.name, tipo: node.type });
  ctx.pipeline = rtInputFor(ctx, node, stato);
  await rtSimulatedLatency(ctx, node);
  if(ctx.abort){
    stato[node.id] = 'skipped';
    ctx.steps.push({ time: rtNow(), type: rtTypeLabel(node), msg:'⏹ Interrotto prima dell\'esecuzione: '+node.name, status:'WARN' });
    return { counted:false };
  }

  try{
    var r;
    if(node.type === 'tr'){
      var d = rtTriggerData(node);
      ctx.pipeline = d.text;
      // I dati d'ingresso restano disponibili per tutto il flusso. Servono ai
      // segnaposto dei nodi a valle: "{{mittente}}" su un nodo email si
      // riferisce a chi ha scritto, non all'output del modello, che a quel
      // punto ha già sostituito la pipeline.
      if(!ctx.triggerData){
        try{ ctx.triggerData = JSON.parse(d.text) }catch(e){ ctx.triggerData = null }
      }
      rtPush(ctx, node, d.msg, 'OK');
      var tc = (typeof TRIGGER_CONFIGS !== 'undefined') ? TRIGGER_CONFIGS[node.name] : null;
      if(tc && tc.sim) rtPush(ctx, node, tc.sim(node.config||{}), 'OK');

    }else if(node.type === 'ai'){
      r = await rtRunAiNode(ctx, node);
      ctx.pipeline = r.text;
      r.msgs.forEach(function(m){ rtPush(ctx, node, m, 'OK') });

    }else if(node.type === 'gr'){
      var g = runGuardrail(node, ctx.pipeline, ctx.gr);
      if(g.text !== undefined) ctx.pipeline = g.text;
      rtEmit(ctx, 'guardrail:triggered', node.id,
        { controllo: node.name, esito: g.pass === false ? 'blocca' : (g.severity==='warn'?'segnala':'passa'), messaggio: g.msg });
      rtPush(ctx, node, g.msg || 'Controllo eseguito', g.pass === false ? 'ERR' : (g.severity === 'warn' ? 'WARN' : 'OK'));

      // Un controllo che dichiara di aver assorbito il guasto lo assorbe
      // davvero: senza questo, l'esecuzione finiva 'error' pur avendo
      // proseguito, e il registro raccontava il contrario di ciò che era
      // successo.
      if(g.handled && ctx.hasError){
        ctx.hasError = false; ctx.gr.lastError = null;
        rtEmit(ctx, 'error:handled', node.id, { controllo: node.name });
        rtPush(ctx, node, '↩︎ Guasto assorbito: l\'esecuzione prosegue e non viene contata come fallita', 'OK');
      }

      if(g.waiting){
        stato[node.id] = 'waiting';
        rtEmit(ctx, 'node:waiting', node.id, { approvatore: (node.config&&node.config.approver)||'—', messaggio:(node.config&&node.config.message)||'' });
        rtPush(ctx, node, '⏸️ Esecuzione sospesa: in attesa di autorizzazione', 'WARN');
        return { waiting:true, nodeId:node.id, counted:true };
      }
      if(g.pass === false){
        stato[node.id] = 'error'; ctx.hasError = true;
        rtEmit(ctx, 'node:error', node.id, { motivo:'bloccato dal controllo', messaggio:g.msg });
        rtPush(ctx, node, '⛔ Esecuzione interrotta dal controllo "'+node.name+'"', 'ERR');
        return { fatal:true, counted:true };
      }

    }else if(node.type === 'sa'){
      r = await rtRunSubAgent(ctx, node);
      ctx.pipeline = r.text;
      r.msgs.forEach(function(m){ rtPush(ctx, node, m, 'OK') });

    }else if(node.type === 'cd'){
      await rtRunLogicNode(ctx, node, stato);

    }else if(node.type === 'ac'){
      // Se il modello l'ha già invocato come strumento, non si riesegue:
      // sarebbe un secondo effetto sullo stesso sistema esterno.
      if(node._toolInvoked){
        rtPush(ctx, node, '↩︎ Già eseguito come strumento dal nodo AI: non ripetuto', 'OK');
        delete node._toolInvoked;
      }else{
        var e = await rtRunConnector(ctx, node, ctx.pipeline);
        if(e.text !== undefined && e.ok !== false) ctx.pipeline = e.text;
        if(e.ok === false){ ctx.hasError = true; ctx.gr.lastError = e.error || 'azione fallita' }
        rtPush(ctx, node, e.msg, e.ok === false ? 'ERR' : 'OK');
      }

    }else{ // ou: nodi terminali
      await rtRunOutputNode(ctx, node);
    }

    if(stato[node.id] === 'running') stato[node.id] = 'done';
    ctx.outputs[node.id] = ctx.pipeline;
    ctx.ordineOutput.push(node.id);
    rtEmit(ctx, 'node:complete', node.id, { nome: node.name });
    return { counted:true };

  }catch(err){
    stato[node.id] = 'error';
    ctx.hasError = true; ctx.gr.lastError = err.message;
    rtEmit(ctx, 'node:error', node.id, { messaggio: err.message });
    rtPush(ctx, node, '❌ Errore: '+err.message, 'ERR');
    return { counted:true };
  }
}

async function rtRunLogicNode(ctx, node, stato){
  var cfg = node.config || {};
  if(node.name === 'Delay'){
    var secs = Math.min(parseInt(cfg.seconds||3,10), 5);
    rtPush(ctx, node, '⏳ Attesa di '+(cfg.seconds||3)+'s'+(secs<parseInt(cfg.seconds||3,10)?' (demo: limitata a 5s reali)':''), 'OK');
    if(!ctx.headless) await new Promise(function(r){ setTimeout(r, secs*1000) });
    return;
  }
  if(node.name === 'Loop'){
    // Il nodo Loop non ripete nulla da solo: DICHIARA quanti giri servono.
    // A ripetere ci pensa il motore quando l'ondata si esaurisce (vedi
    // `rtRiarmaCicli`), ed e' l'unico ordine che funziona: azzerando qui i
    // nodi a valle insieme a se stesso, il ciclo ripartiva prima che quei
    // nodi girassero — quattro iterazioni tutte vuote, con il registro che
    // dichiarava un lavoro mai fatto.
    ctx.cicli = ctx.cicli || {};
    if(!ctx.cicli[node.id]){
      var elenco = null;
      if(cfg.field){
        var v = rtLeggiCampo(ctx, cfg.field);
        if(Array.isArray(v)) elenco = v;
        else if(v != null && String(v).indexOf('\n')>=0) elenco = String(v).split('\n').filter(Boolean);
      }
      var dichiarate = parseInt(cfg.iterations||cfg.batch||3,10);
      var tot = elenco ? elenco.length : (isNaN(dichiarate)?3:dichiarate);
      var origine = elenco ? ('elementi trovati in «'+cfg.field+'»') : 'numero dichiarato';
      var tetto = Math.min(parseInt(cfg.maxiter||LOOP_TETTO,10)||LOOP_TETTO, LOOP_TETTO);
      if(tot > tetto){
        rtPush(ctx, node, '🔄 Loop: '+tot+' elementi, limitati a '+tetto+' dal tetto di sicurezza', 'WARN');
        tot = tetto;
      }
      if(tot < 1) tot = 1;
      ctx.cicli[node.id] = {i:1, tot:tot, origine:origine, valle:rtNodiAValle(ctx, node.id)};
      rtPush(ctx, node, '🔄 Loop: '+tot+' iterazion'+(tot===1?'e':'i')+' da fare ('+origine+'), '+
        ctx.cicli[node.id].valle.length+' nod'+(ctx.cicli[node.id].valle.length===1?'o':'i')+' a valle da ripetere', 'OK');
    }
    return;
  }
  if(node.name === 'Retry'){ rtPush(ctx, node, '🔁 Retry: max '+(cfg.attempts||3)+' tentativi, backoff '+(cfg.backoff||2)+'s', 'OK'); return }
  if(node.name === 'Switch'){
    var casi=(cfg.cases||'').split('\n').filter(Boolean);
    rtPush(ctx, node, '🔃 Switch: '+(casi.length||3)+' rami, routing sul primo corrispondente', 'OK'); return;
  }
  if(node.name === 'Merge'){
    rtPush(ctx, node, '🔗 Convergenza: uniti gli output dei rami a monte ('+(cfg.strategy||'Concatena')+')', 'OK'); return;
  }
  if(node.name === 'Split'){ rtPush(ctx, node, '✂️ Split in batch da '+(cfg.size||10), 'OK'); return }
  if(node.name === 'Error Handler'){
    rtPush(ctx, node, ctx.gr.lastError ? '🧯 Errore intercettato: '+String(ctx.gr.lastError).substring(0,60) : '🧯 Nessun errore da gestire', 'OK'); return;
  }
  // Condition
  var expr = cfg.condition || node.name;
  var cond;
  var replayed = rtReplayLookup(ctx, node.id, 'cond');
  if(replayed !== null){
    cond = (replayed === true || replayed === 'true');
    rtRecordCall(ctx, node.id, 'cond', { replay:true }, cond);
    rtPush(ctx, node, '↻ [Rigiocato] 🔀 "'+expr+'" → '+(cond?'TRUE ✓':'FALSE ✗'), 'OK');
  }else{
    // Il provider si risolve come per i nodi AI: prima quello scelto sulla
    // condizione, poi uno qualsiasi già connesso. Prima si guardava
    // aiConfig.status, che descrive solo il fornitore selezionato nel
    // pannello: con OpenAI connesso e Claude mostrato, la condizione veniva
    // valutata a caso pur avendo un modello disponibile.
    var provCond = (typeof anyProviderReady === 'function') ? anyProviderReady() : null;
    var risolta = (typeof risolviProvider === 'function') ? risolviProvider(cfg.model) : null;
    var modelloCond = (risolta && risolta.provider) ? risolta.provider : provCond;
    var valutatoDa;
    if(modelloCond){
      var cr = await callAI('Dato questo contesto:\n'+String(ctx.pipeline).substring(0,600)+'\n\nValuta la condizione: "'+expr+'". Rispondi SOLO con la parola TRUE o FALSE.',
                            'Sei un valutatore di condizioni booleane. Rispondi solo TRUE o FALSE.',
                            { temperature:0, model:modelloCond, signal: ctx.abortCtrl ? ctx.abortCtrl.signal : undefined });
      cond = cr.text.toUpperCase().indexOf('TRUE') >= 0;
      valutatoDa = providerLabel(modelloCond);
    }else{
      // Senza modello la condizione non può essere valutata sui dati: si usa
      // il seme dell'esecuzione, così la riesecuzione dà lo stesso esito.
      cond = (parseInt(ctx.trace.seed,10) + node.id) % 3 !== 0;
      valutatoDa = 'simulazione deterministica (nessun modello collegato)';
    }
    rtRecordCall(ctx, node.id, 'cond', { espressione:expr }, cond);
    rtEmit(ctx, 'branch:decided', node.id, {
      espressione: expr, esito: cond, valutatoDa: valutatoDa,
      ramoAttivo: cond ? 'true' : 'false', ramoDisattivato: cond ? 'false' : 'true',
      inputValutato: String(ctx.pipeline).substring(0,200)
    });
    rtPush(ctx, node, '🔀 "'+expr+'" → '+(cond?'TRUE ✓':'FALSE ✗')+(modelloCond?'':' [valutazione simulata]'), 'OK');
    // Stesso criterio della verifica statica: si parla solo quando il dato in
    // ingresso e' strutturato, perche' solo li' i nomi dei campi devono
    // comparire davvero. Su testo libero una condizione in italiano
    // ("urgenza alta") e' legittima e non va segnalata.
    if(!cond&&typeof campiCitati==='function'&&/(==|!=|>=|<=|>|<)/.test(String(expr))){
      var _testo=String(ctx.pipeline||'').trim();
      if(_testo.charAt(0)==='{'||_testo.charAt(0)==='['){
        var _assenti=campiCitati(expr).filter(function(c){return _testo.indexOf(c)<0});
        if(_assenti.length)rtPush(ctx,node,'\u26a0\ufe0f Il dato in ingresso non contiene '+_assenti.map(function(c){return '"'+c+'"'}).join(', ')+': la condizione non potra\u0300 mai essere vera. Verifica il nome del campo o il nodo a monte.','WARN');
      }
    }
  }
  ctx.skipFrom[node.id] = cond ? 'false' : 'true';   // ramo disattivato
}

async function rtRunOutputNode(ctx, node){
  var cfg = node.config || {};
  if(node.name === 'Logger'){
    rtPush(ctx, node, '📝 Log ['+((cfg.level||'info').toUpperCase())+']: '+String(ctx.pipeline).length+' caratteri tracciati', 'OK');
  }else if(node.name === 'Analytics'){
    rtPush(ctx, node, '📈 Metrica "'+(cfg.metric||'workflow_completato')+'" incrementata (+1)', 'OK');
  }else if(node.name === 'Fine'){
    rtPush(ctx, node, '🏁 Ramo terminato: nessuna azione ulteriore', 'OK');
  }else if(node.name === 'Esito positivo'){
    rtPush(ctx, node, '✅ Ramo chiuso con esito positivo', 'OK');
  }else if(node.name === 'Esito negativo'){
    rtPush(ctx, node, '⛔ Ramo chiuso con esito negativo', 'OK');
  }else if((node.name === 'Esporta file' || node.name === 'Salva su cloud') && typeof foEmitFromNode === 'function'){
    // Produzione reale del file: è il punto in cui il flusso smette di
    // essere una dimostrazione e consegna qualcosa di utilizzabile fuori.
    try{
      var f = foEmitFromNode(node, ctx.pipeline, !ctx.headless);
      // La scrittura su cartella è asincrona (permesso + creazione sottocartelle):
      // si attende, altrimenti il registro dichiarerebbe un esito non ancora noto.
      if(f.promessa) f = await f.promessa;

      if(typeof LAST_RUN_FILES !== 'undefined'){
        LAST_RUN_FILES.push({nome:f.nome, mime:(FILE_MIME[(node.config||{}).format||'CSV']||'text/plain'), contenuto:f.contenuto});
      }
      rtEmit(ctx, 'file:generated', node.id, { nome:f.nome, byte:f.byte, formato:(node.config||{}).format||'CSV',
        scaricato:f.scaricato, inKB:f.inKB, cloud:f.cloudPercorso||null, cloudSimulato:!!f.cloudSimulato });

      var peso = ' · '+(f.byte>1024?Math.round(f.byte/1024*10)/10+' KB':f.byte+' byte');
      if(f.cloudScritto){
        rtPush(ctx, node, '☁️ File scritto in '+f.cloudPercorso+peso, 'OK');
      }else if(f.cloudSimulato){
        // Un esito simulato non deve mai somigliare a uno reale nel registro.
        rtPush(ctx, node, '🧪 Caricamento simulato su '+f.cloudServizio+': '+f.cloudPercorso+peso, 'OK');
        rtPush(ctx, node, 'ℹ️ '+f.cloudNota, 'OK');
      }else if(f.cloudErrore){
        ctx.hasError = true; ctx.gr.lastError = f.cloudErrore;
        rtPush(ctx, node, '❌ Scrittura su cartella non riuscita: '+f.cloudErrore, 'ERR');
      }else{
        var dove = f.scaricato && f.inKB ? '💾 File scaricato e salvato in Knowledge Base: '
                 : f.inKB ? '📚 File salvato nella Knowledge Base: '
                 : f.scaricato ? '💾 File generato e scaricato: '
                 : '💾 File generato (scaricabile dal registro): ';
        rtPush(ctx, node, dove+f.nome+peso, 'OK');
      }
      if(f.cloudScritto && f.cloudNota) rtPush(ctx, node, 'ℹ️ '+f.cloudNota, 'OK');
      if(f.notaKB) rtPush(ctx, node, 'ℹ️ '+f.notaKB, 'OK');
    }catch(errF){
      ctx.hasError = true; ctx.gr.lastError = errF.message;
      rtPush(ctx, node, '❌ Generazione file fallita: '+errF.message, 'ERR');
    }
  }else{
    rtPush(ctx, node, '📊 Output finale ['+(cfg.format||'Testo')+']: '+rtTesto(ctx.pipeline), 'OK');
  }
}

function rtNow(){ return new Date().toTimeString().substring(0,8) }
function rtTypeLabel(node){
  return ({tr:'TRIGGER',ai:'LLM AI',ac:'ACTION',cd:'LOGIC',ou:'OUTPUT',gr:'CONTROLLO',sa:'AGENTE'})[node.type] || 'OUTPUT';
}
// Il registro non taglia più il testo alla fonte.
//
// Le voci lunghe venivano accorciate qui, con un `substring(0,80)+'…'`: il
// testo intero non arrivava nemmeno al registro, quindi non c'era modo di
// leggerlo — nemmeno esportando. L'accorciamento è una scelta di
// presentazione, e ora sta nella presentazione: la riga mostra una riga sola e
// si apre al clic.
//
// Resta un tetto, perché una pipeline da centomila caratteri dentro il DOM
// rallenta tutto: si taglia molto più tardi, e lo si dichiara.
var REGISTRO_TETTO = 4000;

function rtTesto(t){
  var s = String(t==null?'':t);
  return s.length>REGISTRO_TETTO
    ? s.substring(0,REGISTRO_TETTO)+'\n\n[…troncato a '+REGISTRO_TETTO+' caratteri]'
    : s;
}

function rtPush(ctx, node, msg, status){
  var step = { time: rtNow(), type: rtTypeLabel(node), msg: msg, status: status || 'OK', nodeId: node.id };
  ctx.steps.push(step);
  try{ ctx.onEvent({ event_type:'step', node_id:node.id, payload:step, seq:++ctx.seq, ts:new Date().toISOString() }, ctx) }catch(e){}
}

function rtFinalize(ctx, status, eseguiti){
  rtEmit(ctx, 'execution:done', null, { status:status, nodi:eseguiti, durata: Date.now()-ctx.startedAt });
  return {
    status: status, pipeline: ctx.pipeline, steps: ctx.steps, events: ctx.events,
    trace: ctx.trace, stepsCount: eseguiti, execId: ctx.execId,
    duration: Date.now()-ctx.startedAt, waiting: ctx.waiting, ctx: ctx
  };
}

// ── Ripresa dopo autorizzazione (B5) ─────────────────────────────────────

async function resumeSuspendedRun(execId, autorizzato){
  var s = SUSPENDED_RUNS[execId];
  if(!s) return null;
  delete SUSPENDED_RUNS[execId];
  var ctx = s.ctx, stato = s.stato;
  var nodeId = ctx.waiting.nodeId;

  if(!autorizzato){
    stato[nodeId] = 'error'; ctx.hasError = true;
    rtEmit(ctx, 'node:error', nodeId, { motivo:'autorizzazione negata' });
    rtPush(ctx, { id:nodeId, type:'gr' }, '⛔ Autorizzazione negata: esecuzione interrotta', 'ERR');
    return rtFinalize(ctx, 'error', ctx.waiting.eseguiti);
  }

  stato[nodeId] = 'done';
  ctx.outputs[nodeId] = ctx.pipeline;
  ctx.ordineOutput.push(nodeId);
  ctx.waiting = null;
  rtEmit(ctx, 'node:complete', nodeId, { autorizzato:true });
  rtPush(ctx, { id:nodeId, type:'gr' }, '✅ Autorizzato: l\'esecuzione riprende', 'OK');

  var eseguiti = s.ctx.waiting ? s.ctx.waiting.eseguiti : 0, guardia = 0;
  while(guardia++ < 200){
    var pronti = rtReadyNodes(ctx, stato);
    if(!pronti.length) break;
    var seq = pronti.find(function(n){ return n.config && n.config.sequential });
    var ondata = seq ? [seq] : pronti;
    var esiti = await Promise.all(ondata.map(function(n){ return rtExecuteNode(ctx, n, stato) }));
    for(var i=0;i<esiti.length;i++){
      eseguiti += esiti[i].counted ? 1 : 0;
      if(esiti[i].waiting){
        ctx.waiting = { nodeId: esiti[i].nodeId, stato: stato, eseguiti: eseguiti };
        SUSPENDED_RUNS[ctx.execId] = { ctx: ctx, stato: stato };
        // La sospensione non e piu "in corso": lasciarla in RUNNING_CTX
        // terrebbe isExecutionRunning() vero per sempre e farebbe puntare
        // un eventuale Interrompi a un contesto ormai fermo.
        delete RUNNING_CTX[ctx.execId];
        return rtFinalize(ctx, 'waiting', eseguiti);
      }
      if(esiti[i].fatal) return rtFinalize(ctx, 'error', eseguiti);
    }
  }
  return rtFinalize(ctx, ctx.hasError ? 'error' : 'done', eseguiti);
}
