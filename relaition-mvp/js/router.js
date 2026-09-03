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
// L'indirizzo porta la pagina e, dove esiste, il dettaglio aperto dentro di
// essa: `#challenges/sprint1`. Serve perche' una scheda di dettaglio che vive
// dentro la pagina — e non in una finestra sovrapposta — deve poter essere
// chiusa con Indietro, condivisa con un collegamento e riaperta ricaricando.
function navRegistra(page,sotto){
  var h='#'+page+(sotto?'/'+sotto:'');
  if(location.hash===h)return;
  try{ location.hash=h }catch(e){}
}

// Nessuna sentinella e nessun timer: quando è `go()` a scrivere l'hash,
// `currentPage` vale già la pagina nuova e il gestore non ha niente da fare.
// Scatta solo quando l'hash cambia per volontà dell'utente — cioè Indietro,
// Avanti, o un indirizzo incollato.
window.addEventListener('hashchange',function(){
  var parti=(location.hash||'').replace(/^#/,'').split('/');
  var p=parti[0], sotto=parti[1]||'';
  if(!p)return;
  if(!document.getElementById('page-'+p))return;
  if(p!==currentPage)go(p,true);
  navApplicaSotto(p,sotto);
});

// Il sotto-stato si applica DOPO che la pagina è quella giusta. Il secondo
// argomento dice alle funzioni di non riscrivere l'hash: lo stiamo già
// seguendo, e riscriverlo creerebbe una voce di cronologia in più a ogni
// passo indietro.
function navApplicaSotto(page,sotto){
  if(page!=='challenges')return;
  if(sotto&&typeof sfApriPagina==='function')sfApriPagina(sotto,true);
  else if(!sotto&&typeof sfChiudiPagina==='function')sfChiudiPagina(true);
}

// All'avvio l'indirizzo comanda: aprendo un collegamento a `#monitoraggio` si
// arriva sul Monitoraggio, non sulla dashboard.
function navPaginaIniziale(){
  var p=(location.hash||'').replace(/^#/,'').split('/')[0];
  return (p&&document.getElementById('page-'+p))?p:'dashboard';
}
function navSottoIniziale(){
  return (location.hash||'').replace(/^#/,'').split('/')[1]||'';
}
function go(page,daStoria){
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
  // Cambiando pagina il dettaglio eventualmente aperto non ha piu' senso: si
  // chiude, e l'indirizzo torna alla sola pagina.
  if(page!=='challenges'&&typeof sfChiudiPagina==='function')sfChiudiPagina(true);
  if(!daStoria)navRegistra(page);
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
  showToast('🆕 Canvas pronto: costruisci da zero o usa l\'AI Chat Builder');
}

// ══════════════════════════════════════════
// MARKETPLACE SORTING
// ══════════════════════════════════════════

// ══════════════════════════════════════════
// MENU LATERALE COLLASSABILE
// ══════════════════════════════════════════
// Il menu occupava 240px fissi anche mentre si disponevano i nodi sul canvas,
// dove lo spazio orizzontale e' esattamente cio' che manca. Collassato resta
// la colonna delle icone: la navigazione si comprime invece di sparire, perche'
// doverlo riaprire a ogni spostamento sarebbe peggio del problema che risolve.
//
// La scelta sopravvive al ricaricamento: e' una preferenza di postazione, non
// di sessione, e ripeterla a ogni avvio sarebbe una piccola tassa quotidiana.
var MENU_CHIAVE='relaition_menu_compatto';

function alternaMenu(compatto){
  var sb=document.getElementById('sidebar');
  if(!sb)return;
  var nuovo=(compatto===undefined)?!sb.classList.contains('compatta'):!!compatto;
  sb.classList.toggle('compatta',nuovo);
  var b=document.getElementById('sbToggle');
  if(b){
    b.textContent=nuovo?'☰':'☰';
    b.title=nuovo?'Espandi il menu':'Riduci il menu';
    b.setAttribute('aria-label',b.title);
    b.setAttribute('aria-expanded',nuovo?'false':'true');
  }
  try{localStorage.setItem(MENU_CHIAVE,nuovo?'1':'0')}catch(e){}
  // Il canvas del Builder calcola le proprie dimensioni sulla larghezza
  // disponibile: senza avvisarlo, i nodi restano disegnati dove stavano prima.
  if(typeof b_render==='function'&&currentPage==='builder')setTimeout(b_render,200);
  window.dispatchEvent(new Event('resize'));
}

function ripristinaMenu(){
  var v=null;
  try{v=localStorage.getItem(MENU_CHIAVE)}catch(e){}
  if(v==='1')alternaMenu(true);
}
