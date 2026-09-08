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
  if(page==='monitoraggio'){ renderMonitoraggio(); if(typeof aggiornaBadgeMonitoraggio==='function')aggiornaBadgeMonitoraggio(); }
  if(page==='dashboard') renderDashboard();
  if(page==='builder') initBuilder();
}

// ── MARKETPLACE DATA ──

// La ricerca calcolava i risultati e poi li BUTTAVA VIA: mostrava un avviso
// «3 agenti trovati» e portava al Marketplace non filtrato, lasciando all'utente
// il compito di ritrovarli a mano fra ventidue schede. Chi cercava «fattura»
// doveva poi scorrere tutto, e chi non azzeccava il nome esatto non trovava
// niente. Ora il testo cercato diventa un filtro vero sulla griglia, e resta
// scritto sopra i risultati finche' non lo si toglie.
function onGlobalSearch(q){
  clearTimeout(_searchTimer);
  var testo=String(q||'').trim();
  // Sotto i due caratteri non si filtra: una lettera sola restringerebbe a
  // meta' catalogo dando l'impressione di un risultato.
  if(testo.length<2){
    if(mktRicerca){ mktRicerca=''; if(currentPage==='marketplace')renderMkt() }
    return;
  }
  _searchTimer=setTimeout(function(){
    mktRicerca=testo;
    if(currentPage!=='marketplace')go('marketplace'); else renderMkt();
  },350);
}

// Cerca in nome, descrizione, categoria, autore ed etichette, e tollera
// l'ordine delle parole: «fatture estrazione» trova «Estrazione dati da
// fatture». Cercare per nome esatto era il difetto piu' segnalato dalle prove.
// Cerca in nome, descrizione, categoria, autore ed etichette, tollerando
// l'ordine delle parole e le desinenze italiane. Con il confronto letterale
// «fattura» non trovava «fatture» — non e' una sottostringa — e chi cercava al
// singolare quello che il catalogo scrive al plurale concludeva che la ricerca
// non funzionasse. Si confronta la RADICE: tolta l'ultima vocale, «fattura» e
// «fatture» diventano entrambe «fattur».
function mktRadice(p){
  return p.length>=5 ? p.replace(/[aeio]$/,'') : p;
}

function mktCorrisponde(a,testo){
  if(!testo)return true;
  var campi=[a.name,a.desc,a.cat,a.author].concat(a.tags||[]).join(' ')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  return testo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .split(/\s+/).filter(Boolean).every(function(p){
      return campi.indexOf(mktRadice(p))>=0;
    });
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

// Sotto una certa larghezza il menu esteso si prende due terzi dello schermo e
// il contenuto resta in una colonna illeggibile. Il progetto non ha una
// impaginazione per telefono — è uno strumento da scrivania — ma il menu sa
// già ridursi, e usarlo qui trasforma una schermata inservibile in una
// usabile con poco.
//
// La preferenza salvata NON viene sovrascritta: sotto soglia si comprime
// comunque, sopra soglia si torna a quello che l'utente aveva scelto. Se
// riducendo la finestra si perdesse l'impostazione, riallargandola si
// troverebbe un menu diverso da quello che si era lasciato.
var MENU_SOGLIA=900;
var _menuCompressoDaLarghezza=false;

function adattaMenuALarghezza(){
  var sb=document.getElementById('sidebar');
  if(!sb)return;
  // Una larghezza di 0 non e' uno schermo stretto: e' una pagina non ancora
  // disegnata (scheda in secondo piano, riquadro nascosto). Comprimere il menu
  // in quel caso lo farebbe trovare compresso a chi non ha ridotto niente.
  var l=window.innerWidth;
  if(!l)return;
  var stretto=l<MENU_SOGLIA;
  if(stretto && !sb.classList.contains('compatta')){
    _menuCompressoDaLarghezza=true;
    sb.classList.add('compatta');
    if(typeof b_render==='function'&&currentPage==='builder')setTimeout(b_render,200);
  }else if(!stretto && _menuCompressoDaLarghezza){
    _menuCompressoDaLarghezza=false;
    var preferenza=null;
    try{preferenza=localStorage.getItem(MENU_CHIAVE)}catch(e){}
    if(preferenza!=='1')sb.classList.remove('compatta');
    if(typeof b_render==='function'&&currentPage==='builder')setTimeout(b_render,200);
  }
}

function ripristinaMenu(){
  var v=null;
  try{v=localStorage.getItem(MENU_CHIAVE)}catch(e){}
  if(v==='1')alternaMenu(true);
  adattaMenuALarghezza();
}
window.addEventListener('resize',adattaMenuALarghezza);
