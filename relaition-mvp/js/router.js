// ══════════════════════════════════════════
// CRONOLOGIA DI NAVIGAZIONE
// ══════════════════════════════════════════
// La piattaforma è una pagina sola: il browser non registrava i cambi di
// schermata, quindi Indietro usciva dall'applicazione invece di tornare alla
// pagina precedente, e i due tasti laterali del mouse non facevano nulla.
// Per tornare sui propri passi bisognava ricliccare la voce di menu.
//
// Ogni cambio pagina scrive `#nome` nell'indirizzo: il browser crea una voce
// di cronologia da sé, e Indietro/Avanti — da tastiera, dal menu o dai tasti
// del mouse — tornano a funzionare. Si usa l'hash e non `pushState` perché
// `pushState` solleva un errore di sicurezza quando la pagina è aperta da
// `file://`, che è uno dei modi previsti per aprire questo prototipo.
function navRegistra(page){
  var h='#'+page;
  if(location.hash===h)return;
  try{ location.hash=h }catch(e){}
}

// Nessuna sentinella e nessun timer: quando è `go()` a scrivere l'hash,
// `currentPage` vale già la pagina nuova e il gestore non ha niente da fare.
// Scatta solo quando l'hash cambia per volontà dell'utente — cioè Indietro,
// Avanti, o un indirizzo incollato.
window.addEventListener('hashchange',function(){
  var p=(location.hash||'').replace(/^#/,'');
  if(!p||p===currentPage)return;
  if(document.getElementById('page-'+p))go(p);
});

// All'avvio l'indirizzo comanda: aprendo un collegamento a `#monitoraggio` si
// arriva sul Monitoraggio, non sulla dashboard.
function navPaginaIniziale(){
  var p=(location.hash||'').replace(/^#/,'');
  return (p&&document.getElementById('page-'+p))?p:'dashboard';
}

function go(page){
  // I sovrapposti temporanei (suggerimenti dei grafici) non appartengono alla
  // pagina che si sta lasciando: senza questo restano appesi sullo schermo.
  if(typeof govTip==='function')govTip(null);
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  document.querySelectorAll('.ni').forEach(function(n){n.classList.remove('active')});
  var pg=document.getElementById('page-'+page);
  if(pg) pg.classList.add('active');
  var ni=document.querySelector('.ni[data-page="'+page+'"]');
  if(ni) ni.classList.add('active');
  var lb=pageLabels[page]||['',''];
  document.getElementById('tb-title').textContent=lb[0];
  document.getElementById('tb-sub').textContent=lb[1];
  // Nome, ruolo, iniziali e saluto vengono riscritti a ogni cambio pagina:
  // alcune pagine ridisegnano la propria intestazione, e senza questo
  // tornerebbero al nome scritto nel markup.
  if(typeof aggiornaIntestazioneUtente==='function')aggiornaIntestazioneUtente();
  currentPage=page;
  navRegistra(page);
  if(page==='marketplace') renderMkt();
  if(page==='learning') renderLearning();
  if(page==='community') renderCommunity();
  if(page==='profile') renderProfile();
  if(page==='challenges') renderChallenges();
  if(page==='myagents') renderMyAgents();
  if(page==='execlog') renderExecLogPage();
  if(page==='monitoraggio') renderMonitoraggio();
  if(page==='dashboard') renderDashboard();
  if(page==='builder') initBuilder();
}

// ── MARKETPLACE DATA ──

function onGlobalSearch(q){
  clearTimeout(_searchTimer);
  if(!q||q.length<3)return;
  _searchTimer=setTimeout(function(){
    var ql=q.toLowerCase();
    var results=AGENTS.concat(getPublishedAgents()).filter(function(a){return a.name.toLowerCase().indexOf(ql)>=0||a.desc.toLowerCase().indexOf(ql)>=0||a.cat.toLowerCase().indexOf(ql)>=0});
    if(results.length>0&&currentPage!=='marketplace'){go('marketplace');showToast('🔍 '+results.length+' agenti trovati per "'+q+'"')}
    else if(results.length===0){showToast('🔍 Nessun agente trovato per "'+q+'"')}
  },600);
}


// ══════════════════════════════════════════
// START NEW AGENT — reset completo canvas
// ══════════════════════════════════════════

function startNewAgent(){
  var doReset=B.nodes.length===0||confirm('Iniziare un nuovo agente?\nIl canvas verrà svuotato (il lavoro non salvato andrà perso).');
  if(!doReset){go('builder');return}
  // L'ordine conta: prima si entra nel Builder, POI si svuota.
  // Facendo il contrario, alla prima apertura initBuilder() trovava il
  // canvas vuoto e ci ricreava dentro il workflow dimostrativo — chi
  // premeva "Nuovo agente" si ritrovava 5 nodi che non aveva chiesto, e i
  // suggerimenti della chat (visibili solo a canvas vuoto) sparivano.
  go('builder');
  resetCanvasForNewAgent();
  var ci=document.getElementById('chatBuilderInput');if(ci)ci.focus();
  showToast('🆕 Canvas pronto — costruisci da zero o usa l\'AI Chat Builder');
}

// ══════════════════════════════════════════
// MARKETPLACE SORTING
// ══════════════════════════════════════════
