// ══════════════════════════════════════════
// POLITICHE DI CONTROLLO E SUGGERIMENTI DI PRESIDIO
//
// Chi costruisce un agente decide quali controlli servono al proprio caso.
// La piattaforma interviene in due modi, di intensità diversa:
//
//   • consigliata (default) — alla validazione emette una SEGNALAZIONE non
//     bloccante con l'azione "inserisci", motivata dal rischio effettivo
//     rilevato nel flusso (dati personali in transito, scritture su sistemi
//     esterni, output del modello senza verifica a valle).
//
//   • obbligatoria — il controllo viene inserito d'ufficio e reso non
//     rimovibile. Riservata ai casi in cui l'organizzazione non lascia
//     scelta; non è il comportamento predefinito perché inserire un nodo
//     che l'utente non ha chiesto, quando il caso non lo richiede, è
//     fuorviante.
//
// I suggerimenti nascono dall'analisi del flusso, non dalla mera presenza
// di un tipo di nodo: un flusso che non tratta dati personali non riceve il
// suggerimento di mascherarli.
// ══════════════════════════════════════════

// Punti di inserzione supportati. Sono deliberatamente pochi e verificabili:
// una politica che non sa dire DOVE va inserito il controllo non è applicabile
// in automatico e resterebbe una raccomandazione.
var POLICY_PLACEMENTS = {
  before_ai:     { label: 'Prima di ogni nodo AI',              desc:'Il controllo intercetta il dato prima che raggiunga il modello' },
  after_ai:      { label: 'Dopo ogni nodo AI',                  desc:'Il controllo verifica l\'output del modello prima che prosegua' },
  before_action: { label: 'Prima delle scritture su sistemi esterni', desc:'Il controllo precede ogni nodo Action' }
};

function policiesAll(){
  try { return dbAll('SELECT * FROM policies ORDER BY id'); } catch(e){ return []; }
}
function policiesActive(){
  try { return dbAll('SELECT * FROM policies WHERE active=1 ORDER BY id'); } catch(e){ return []; }
}

function policyAdd(scope, placement, guardrailId, note, mode){
  dbRun('INSERT INTO policies (scope,condition_json,required_guardrail,active,mode) VALUES (?,?,?,?,?)',
    [scope, JSON.stringify({ placement: placement, note: note || '' }), guardrailId, 1, mode || 'consigliata']);
}
function policyToggle(id, active){
  dbRun('UPDATE policies SET active=? WHERE id=?', [active ? 1 : 0, id]);
}
function policySetMode(id, mode){
  dbRun('UPDATE policies SET mode=? WHERE id=?', [mode, id]);
}
function policyDelete(id){
  dbRun('DELETE FROM policies WHERE id=?', [id]);
}

// Politiche di partenza, tutte in modalità *consigliata*: la piattaforma
// segnala, non impone. Passare una politica a "obbligatoria" dalla schermata
// di governance mostra l'altro comportamento (inserimento non rimovibile).
function seedPoliciesOnce(){
  try{
    if(dbGetOne('SELECT COUNT(*) c FROM policies').c > 0) return;
    policyAdd('Tutti gli agenti', 'before_ai', 'gr_mask',
      'I flussi che trattano dati personali dovrebbero mascherare gli identificatori prima di inviarli al modello', 'consigliata');
    policyAdd('Tutti gli agenti', 'before_action', 'gr_approval',
      'Le scritture su sistemi esterni dovrebbero prevedere un punto di sorveglianza umana', 'consigliata');
    policyAdd('Business unit: Finance', 'after_ai', 'gr_schema',
      'Gli output destinati alla contabilità devono superare la convalida di schema', 'consigliata');
  }catch(e){ console.error('Seed politiche fallito', e) }
}

// ── Applicazione al canvas ────────────────────────────────────────────────

// Un nodo inserito da politica è riconoscibile da `locked` + `policyId`.
// Restano nodi ordinari sotto ogni altro aspetto: stessa struttura JSON,
// stessa esecuzione, stesso pannello di configurazione. È il requisito G4
// (nessun artefatto speciale) applicato anche ai controlli imposti.
function isPolicyLocked(n){ return !!(n && n.locked) }

function _nodesOfType(nodes, t){ return nodes.filter(function(n){ return n.type === t }) }

// Verifica se fra `fromId` e `toId` esiste già il guardrail richiesto:
// evita di accumulare duplicati ad ogni ricalcolo.
function _guardrailAlreadyBetween(guardName, toId){
  var incoming = B.edges.filter(function(e){ return e.to === toId });
  return incoming.some(function(e){
    var src = B.nodes.find(function(n){ return n.id === e.from });
    return src && src.type === 'gr' && src.name === guardName;
  });
}

// Inserisce `guardName` fra tutti i predecessori di `targetId` e il target.
// Se il target non ha predecessori (es. nodo AI collegato direttamente al
// trigger che non esiste ancora) il controllo non viene inserito: inserirlo
// scollegato produrrebbe un flusso non valido.
function _insertGuardrailBefore(targetId, guardName, policyId){
  if(_guardrailAlreadyBetween(guardName, targetId)) return 0;
  var incoming = B.edges.filter(function(e){ return e.to === targetId });
  if(!incoming.length) return 0;
  var target = B.nodes.find(function(n){ return n.id === targetId });
  var def = getGuardrailConfig(guardName);
  var gid = b_addNode('gr', def ? def.icon : '🛡️', guardName,
                      def ? def.desc : 'Controllo obbligatorio',
                      target.x - 20, Math.max(10, target.y - 110),
                      { locked: true, policyId: policyId, config: defaultGuardrailConfig(guardName) });
  incoming.forEach(function(e){ e.to = gid });          // i predecessori ora entrano nel controllo
  b_addEdge(gid, 'out', targetId, 'in', '');            // il controllo entra nel target
  return 1;
}

function _insertGuardrailAfter(sourceId, guardName, policyId){
  var outgoing = B.edges.filter(function(e){ return e.from === sourceId && e.fp === 'out' });
  var already = outgoing.some(function(e){
    var dst = B.nodes.find(function(n){ return n.id === e.to });
    return dst && dst.type === 'gr' && dst.name === guardName;
  });
  if(already) return 0;
  var src = B.nodes.find(function(n){ return n.id === sourceId });
  if(!src) return 0;
  var def = getGuardrailConfig(guardName);
  var gid = b_addNode('gr', def ? def.icon : '🛡️', guardName,
                      def ? def.desc : 'Controllo obbligatorio',
                      src.x + 20, src.y + 110,
                      { locked: true, policyId: policyId, config: defaultGuardrailConfig(guardName) });
  outgoing.forEach(function(e){ e.from = gid });        // le uscite ripartono dal controllo
  b_addEdge(sourceId, 'out', gid, 'in', '');
  return 1;
}

// Ricalcola i controlli IMPOSTI sul canvas corrente.
// Agisce solo sulle politiche in modalità obbligatoria: quelle consigliate
// non toccano il canvas, producono suggerimenti in validazione.
// silent=true durante generazione/installazione, per non sommergere di toast.
function applyPoliciesToCanvas(silent){
  if(typeof DB === 'undefined' || !DB) return 0;
  if(!B.nodes.length) return 0;
  var inserted = 0;
  policiesActive().filter(function(p){ return p.mode === 'obbligatoria' }).forEach(function(p){
    var cond = {}; try { cond = JSON.parse(p.condition_json || '{}') } catch(e){}
    var guardName = guardrailNameById(p.required_guardrail);
    if(!guardName) return;
    // Snapshot dei target prima di modificare: inserendo nodi durante
    // l'iterazione, un filtro calcolato al volo includerebbe i controlli
    // appena creati e genererebbe una catena infinita.
    if(cond.placement === 'before_ai'){
      _nodesOfType(B.nodes.slice(), 'ai').forEach(function(n){ inserted += _insertGuardrailBefore(n.id, guardName, p.id) });
    } else if(cond.placement === 'after_ai'){
      _nodesOfType(B.nodes.slice(), 'ai').forEach(function(n){ inserted += _insertGuardrailAfter(n.id, guardName, p.id) });
    } else if(cond.placement === 'before_action'){
      _nodesOfType(B.nodes.slice(), 'ac').forEach(function(n){ inserted += _insertGuardrailBefore(n.id, guardName, p.id) });
    }
  });
  if(inserted){
    b_render();
    if(!silent && typeof showToast === 'function'){
      showToast('🔒 '+inserted+' controllo/i inserito/i da politica organizzativa (non rimovibile)');
    }
  }
  return inserted;
}

// ── Motore di suggerimento basato sul rischio ─────────────────────────────
//
// Analizza il flusso e propone controlli SOLO dove il rischio è effettivo.
// Un flusso che non tratta dati personali non riceve il suggerimento di
// mascherarli: è la differenza fra un presidio pertinente e un avviso
// generico che l'utente impara a ignorare.

// Il flusso tratta dati personali? Si guarda cosa entra davvero (payload di
// prova, file caricato) e con quali sistemi parla, non il tipo di nodo.
function _flowHandlesPersonalData(){
  var indizi = [];
  B.nodes.forEach(function(n){
    var cfg = n.config || {};
    var testo = [cfg.sample, cfg.filedata, cfg.prompt, n.name, n.detail].filter(Boolean).join(' ');
    // Identificatori realmente presenti nei dati di prova
    if(typeof PII_ORDER !== 'undefined'){
      PII_ORDER.forEach(function(k){
        var re = new RegExp(PII_PATTERNS[k].re.source, 'i');
        if(re.test(testo) && indizi.indexOf('identificatori nei dati di prova') < 0){
          indizi.push('identificatori nei dati di prova');
        }
      });
    }
    // Sistemi che per natura contengono anagrafiche
    if(n.type === 'ac' && /salesforce|hubspot|dynamics|pipedrive|mailchimp/i.test(n.name)){
      if(indizi.indexOf('connettori CRM') < 0) indizi.push('connettori CRM');
    }
    // Lessico del dominio: lead, clienti, candidati, pazienti, assicurati
    if(/\b(lead|client[ei]|contatt[oi]|candidat[oi]|cv|paziente|assicurat[oi]|anagrafic)/i.test(testo)){
      if(indizi.indexOf('dati riferiti a persone') < 0) indizi.push('dati riferiti a persone');
    }
  });
  return indizi;
}

// Esiste un controllo del tipo indicato fra l'inizio del flusso e `nodeId`?
function _hasGuardrailUpstream(nodeId, guardName, visti){
  visti = visti || {};
  if(visti[nodeId]) return false;
  visti[nodeId] = true;
  var incoming = B.edges.filter(function(e){ return e.to === nodeId });
  return incoming.some(function(e){
    var src = B.nodes.find(function(n){ return n.id === e.from });
    if(!src) return false;
    if(src.type === 'gr' && src.name === guardName) return true;
    return _hasGuardrailUpstream(src.id, guardName, visti);
  });
}

// Esiste un controllo qualsiasi a valle di `nodeId`?
function _hasAnyGuardrailDownstream(nodeId, visti){
  visti = visti || {};
  if(visti[nodeId]) return false;
  visti[nodeId] = true;
  var outgoing = B.edges.filter(function(e){ return e.from === nodeId });
  return outgoing.some(function(e){
    var dst = B.nodes.find(function(n){ return n.id === e.to });
    if(!dst) return false;
    if(dst.type === 'gr') return true;
    return _hasAnyGuardrailDownstream(dst.id, visti);
  });
}

// Restituisce [{nodeId, guardrail, placement, reason, from}]
function suggestGuardrails(){
  var out = [];
  if(!B.nodes.length) return out;

  var personali = _flowHandlesPersonalData();
  var aiNodes = B.nodes.filter(function(n){ return n.type === 'ai' });
  var acNodes = B.nodes.filter(function(n){ return n.type === 'ac' });

  // 1. Dati personali che raggiungono il modello senza mascheramento
  if(personali.length){
    aiNodes.forEach(function(n){
      if(_hasGuardrailUpstream(n.id, 'Mascheramento dati')) return;
      out.push({ nodeId:n.id, guardrail:'Mascheramento dati', placement:'before',
        reason:'Il flusso tratta dati personali ('+personali.join(', ')+') che raggiungono "'+n.name+'" in chiaro.',
        from:'rischio' });
    });
  }

  // 2. Scritture su sistemi esterni senza punto di sorveglianza
  acNodes.forEach(function(n){
    if(_hasGuardrailUpstream(n.id, 'Approvazione umana')) return;
    // Le sole letture/notifiche interne pesano meno di una scrittura su
    // gestionale: si suggerisce dove l'effetto è persistente o esterno.
    if(!/salesforce|hubspot|dynamics|pipedrive|sap|oracle|quickbooks|stripe|postgre|mongo|sheets|notion|jira/i.test(n.name)) return;
    out.push({ nodeId:n.id, guardrail:'Approvazione umana', placement:'before',
      reason:'"'+n.name+'" scrive su un sistema esterno: un checkpoint umano evita effetti non voluti in caso di output errato.',
      from:'rischio' });
  });

  // 3. Output del modello che prosegue senza alcuna verifica
  aiNodes.forEach(function(n){
    if(_hasAnyGuardrailDownstream(n.id)) return;
    var haValle = B.edges.some(function(e){ return e.from === n.id });
    if(!haValle) return;
    var strutturato = n.config && n.config.outformat === 'json';
    out.push({ nodeId:n.id, guardrail: strutturato ? 'Convalida output' : 'Soglia di confidenza', placement:'after',
      reason:'L\'output di "'+n.name+'" prosegue nel flusso senza alcuna verifica'+(strutturato?': una convalida di schema intercetta risposte malformate.':': una soglia di confidenza devia i casi incerti a revisione.'),
      from:'rischio' });
  });

  // 4. Nodi AI che usano la Knowledge Base senza verifica di fondatezza
  aiNodes.forEach(function(n){
    if(!(n.config && n.config.useKB)) return;
    if(_hasAnyGuardrailDownstream(n.id)) return;
    out.push({ nodeId:n.id, guardrail:'Verifica di fondatezza', placement:'after',
      reason:'"'+n.name+'" risponde usando la Knowledge Base: la verifica di fondatezza segnala le affermazioni non supportate dalle fonti.',
      from:'rischio' });
  });

  // 5. Politiche consigliate dell'organizzazione, se non già soddisfatte
  policiesActive().filter(function(p){ return p.mode !== 'obbligatoria' }).forEach(function(p){
    var cond = {}; try { cond = JSON.parse(p.condition_json || '{}') } catch(e){}
    var guardName = guardrailNameById(p.required_guardrail);
    if(!guardName) return;
    var target = cond.placement === 'before_action' ? acNodes : aiNodes;
    var dopo = cond.placement === 'after_ai';
    target.forEach(function(n){
      var gia = dopo ? _hasAnyGuardrailDownstream(n.id) : _hasGuardrailUpstream(n.id, guardName);
      if(gia) return;
      // Non duplicare un suggerimento già emesso per rischio sullo stesso nodo
      if(out.some(function(s){ return s.nodeId === n.id && s.guardrail === guardName })) return;
      out.push({ nodeId:n.id, guardrail:guardName, placement: dopo ? 'after' : 'before',
        reason:(cond.note || 'Politica organizzativa')+': ambito: '+p.scope,
        from:'politica' });
    });
  });

  return out;
}

// Inserisce un controllo suggerito. Il nodo NON è bloccato: l'ha scelto
// l'utente accettando il suggerimento, quindi resta suo a tutti gli effetti
// e può rimuoverlo in seguito.
function insertSuggestedGuardrail(nodeId, guardName, placement){
  var n = B.nodes.find(function(x){ return x.id === nodeId });
  if(!n){ showToast('⚠️ Nodo non più presente nel flusso'); return }
  var conta = placement === 'after'
    ? _insertGuardrailAfter(nodeId, guardName, null)
    : _insertGuardrailBefore(nodeId, guardName, null);
  if(!conta){ showToast('⚠️ Impossibile inserire qui: il nodo non ha collegamenti su cui innestare il controllo'); return }
  // Il nodo appena creato è l'ultimo: gli si tolgono i marcatori di politica
  // e gli si dà una configurazione di partenza valida.
  var nuovo = B.nodes[B.nodes.length - 1];
  delete nuovo.locked; delete nuovo.policyId;
  nuovo.config = defaultGuardrailConfig(guardName);
  b_render();
  showToast('✅ "'+guardName+'" inserito nel flusso');
  if(typeof addAct === 'function') addAct('Accettato suggerimento di controllo: '+guardName);
  // Il pannello resta aperto e si aggiorna: l'utente vede sparire la voce
  // appena risolta senza doverlo riaprire.
  if(document.getElementById('modalOverlay').classList.contains('show')) showValidationErrors(validateWorkflow());
}

// Motivo leggibile per cui un nodo è bloccato — mostrato nel pannello
// proprietà al posto del pulsante Elimina.
function policyReasonFor(node){
  if(!node || !node.policyId) return 'Controllo imposto da una politica organizzativa.';
  var p = dbGetOne('SELECT * FROM policies WHERE id=?', [node.policyId]);
  if(!p) return 'Controllo imposto da una politica organizzativa.';
  var cond = {}; try { cond = JSON.parse(p.condition_json || '{}') } catch(e){}
  return (cond.note || 'Controllo imposto da una politica organizzativa.') + ': ambito: ' + p.scope;
}

// ── Schermata amministrativa (voce nel Profilo) ───────────────────────────

function openPoliciesModal(){
  var rows = policiesAll();
  var guardOpts = Object.keys(GUARDRAIL_BY_ID).map(function(id){
    return '<option value="'+id+'">'+GUARDRAIL_BY_ID[id].icon+' '+GUARDRAIL_BY_ID[id].name+'</option>';
  }).join('');
  var placeOpts = Object.keys(POLICY_PLACEMENTS).map(function(k){
    return '<option value="'+k+'">'+POLICY_PLACEMENTS[k].label+'</option>';
  }).join('');

  var html =
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>Politiche di controllo</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 6px">Le politiche indicano quali presidi l\'organizzazione si attende sui flussi. Chi costruisce un agente decide se applicarli al proprio caso; la piattaforma li propone dove il rischio è effettivo.</p>'+
    '<div style="display:flex;gap:8px;margin:0 0 16px;font-size:11px;color:var(--tx3)">'+
      '<div style="flex:1;background:var(--bg2);border-radius:8px;padding:8px 10px"><strong>💡 Consigliata</strong><div style="margin-top:2px;line-height:1.4">Segnalata in fase di verifica, con inserimento a un click. Non blocca l\'esecuzione.</div></div>'+
      '<div style="flex:1;background:#FDF4FF;border:1px solid #F5D0FE;border-radius:8px;padding:8px 10px"><strong>🔒 Obbligatoria</strong><div style="margin-top:2px;line-height:1.4">Inserita d\'ufficio nel canvas e non rimovibile. Da riservare ai casi in cui non c\'è margine di scelta.</div></div>'+
    '</div>';

  if(!rows.length){
    html += '<div style="text-align:center;padding:30px;color:var(--tx4);font-size:12px">Nessuna politica definita.</div>';
  } else {
    html += '<div class="validation-list" style="margin-top:0">' + rows.map(function(p){
      var cond = {}; try { cond = JSON.parse(p.condition_json||'{}') } catch(e){}
      var g = GUARDRAIL_BY_ID[p.required_guardrail];
      var place = POLICY_PLACEMENTS[cond.placement];
      var obbl = p.mode === 'obbligatoria';
      return '<div class="validation-item list-row" style="background:'+(obbl?'#FDF4FF':'var(--bg2)')+';border-color:'+(obbl?'#F5D0FE':'var(--bo)')+';cursor:default;align-items:center">'+
        '<span class="vi-ic">'+(p.active?(obbl?'🔒':'💡'):'⚪')+'</span>'+
        '<span class="vi-msg" style="flex:1">'+
          '<strong>'+(g?g.icon+' '+g.name:p.required_guardrail)+'</strong>: '+(place?place.label:cond.placement)+
          ' <span class="badge '+(obbl?'badge-p':'badge-gray')+'" style="font-size:9px">'+(obbl?'obbligatoria':'consigliata')+'</span>'+
          '<div style="font-size:10px;color:var(--tx4);margin-top:2px">'+escHtml(p.scope)+(cond.note?' · '+escHtml(cond.note):'')+'</div>'+
        '</span>'+
        '<button class="tb-btn" style="font-size:11px;height:26px" title="Passa da consigliata a obbligatoria e viceversa" onclick="policySetMode('+p.id+',\''+(obbl?'consigliata':'obbligatoria')+'\');openPoliciesModal()">'+(obbl?'→ consigliata':'→ obbligatoria')+'</button>'+
        '<button class="tb-btn" style="font-size:11px;height:26px" onclick="policyToggle('+p.id+','+(p.active?0:1)+');openPoliciesModal()">'+(p.active?'Disattiva':'Attiva')+'</button>'+
        '<button class="tb-btn" style="font-size:11px;height:26px;color:#EF4444;border-color:#FEE2E2" onclick="policyDelete('+p.id+');openPoliciesModal()">🗑️</button>'+
      '</div>';
    }).join('') + '</div>';
  }

  html +=
    '<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin:18px 0 8px">Nuova politica</div>'+
    '<div class="prop-group"><div class="prop-label">Ambito</div><input class="prop-input" id="polScope" placeholder="Tutti gli agenti / Business unit: Sales"></div>'+
    '<div class="prop-group"><div class="prop-label">Controllo obbligatorio</div><select class="prop-select" id="polGuard">'+guardOpts+'</select></div>'+
    '<div class="prop-group"><div class="prop-label">Punto di inserimento</div><select class="prop-select" id="polPlace">'+placeOpts+'</select></div>'+
    '<div class="prop-group"><div class="prop-label">Motivazione (mostrata a chi costruisce)</div><input class="prop-input" id="polNote" placeholder="es. Gli agenti che trattano dati cliente devono..."></div>'+
    '<div class="prop-group"><div class="prop-label">Modalità</div><select class="prop-select" id="polMode">'+
      '<option value="consigliata">💡 Consigliata: segnalata in verifica</option>'+
      '<option value="obbligatoria">🔒 Obbligatoria: inserita e non rimovibile</option>'+
    '</select></div>'+
    '<button class="tb-btn primary" onclick="submitPolicy()">+ Aggiungi politica</button>'+
    '<div style="background:var(--ac2-l);border-radius:8px;padding:10px 14px;font-size:11px;color:var(--tx2);margin-top:14px">💡 Le politiche consigliate compaiono in "🔍 Verifica" nel Builder. Quelle obbligatorie vengono applicate al canvas all\'apertura del flusso.</div>';

  openModal(html, true);
}

function submitPolicy(){
  var scope = document.getElementById('polScope').value.trim() || 'Tutti gli agenti';
  var guard = document.getElementById('polGuard').value;
  var place = document.getElementById('polPlace').value;
  var note  = document.getElementById('polNote').value.trim();
  var mode  = document.getElementById('polMode').value;
  policyAdd(scope, place, guard, note, mode);
  showToast(mode==='obbligatoria'?'🔒 Politica obbligatoria aggiunta':'💡 Politica aggiunta: comparirà fra i presidi consigliati');
  if(typeof addAct === 'function') addAct('Aggiunta politica di controllo: '+guard);
  openPoliciesModal();
}
