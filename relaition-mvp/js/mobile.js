// ═══════════════════════════════════════════
// COMPORTAMENTO SU SCHERMO TATTILE
// ═══════════════════════════════════════════
// css/mobile.css rimpicciolisce e riordina. Qui c'e' quello che il foglio di
// stile non puo' fare: il menu a scomparsa, i pannelli del Builder che salgono
// dal basso, e soprattutto il fatto che sul Builder NIENTE funzionava al tocco.
//
// Il canvas era stato scritto per il mouse: `mousedown` sul nodo, `mousemove`
// sul documento, `mouseup` per chiudere; la palette usava il trascinamento
// HTML5, che su iOS e Android semplicemente non esiste. Su un telefono si
// poteva guardare un flusso e non toccarlo.
//
// La scelta qui e' un PONTE, non una riscrittura: i gesti a un dito vengono
// tradotti negli eventi del mouse che il Builder gia' sa gestire. Riscrivere
// il canvas per i puntatori avrebbe significato rimettere mano a
// trascinamento dei nodi, collegamento delle porte, selezione a riquadro,
// spostamento della vista e ricollegamento delle frecce — cinque
// comportamenti collaudati — per ottenere lo stesso risultato. Il pizzico per
// ingrandire, che un equivalente col mouse non ce l'ha, e' l'unico gesto
// scritto a parte.

var SOGLIA_TOCCO=768;

function schermoStretto(){ return window.innerWidth>0 && window.innerWidth<=SOGLIA_TOCCO }

// «Tattile» non e' «stretto»: un portatile con schermo tattile resta da
// scrivania, un telefono girato in orizzontale resta un telefono. Serve la
// combinazione, ed e' quella che decide se tradurre i gesti.
function dispositivoTattile(){
  try{ return window.matchMedia('(pointer:coarse)').matches }catch(e){ return 'ontouchstart' in window }
}

function aggiornaClasseTocco(){
  var t=schermoStretto();
  document.body.classList.toggle('tocco',t);
  var sb=document.getElementById('sidebar');
  // `adattaMenuALarghezza()` in js/router.js comprime il menu a colonna di
  // icone sotto i 900px: su un telefono e' sempre vero, e il pannello a
  // scomparsa si apriva con le voci centrate e i gruppi ridotti a trattini.
  // Qui la classe si toglie invece di combatterla a colpi di stili: sopra
  // soglia quella funzione torna a decidere da sola, e la preferenza salvata
  // resta intatta perche' nessuno la riscrive.
  if(t&&sb)sb.classList.remove('compatta');
  if(!t){
    chiudiMenuMobile();
    chiudiFoglioBuilder();
  }
}

// ══════════════════════════════════════════
// MENU A SCOMPARSA
// ══════════════════════════════════════════
function veloMenu(){
  var v=document.getElementById('veloMenu');
  if(!v){
    v=document.createElement('div');
    v.id='veloMenu';
    v.className='velo-menu';
    v.addEventListener('click',chiudiMenuMobile);
    document.body.appendChild(v);
  }
  return v;
}

function apriMenuMobile(){
  var sb=document.getElementById('sidebar');
  if(!sb)return;
  sb.classList.add('aperta');
  veloMenu().classList.add('visibile');
}

function chiudiMenuMobile(){
  var sb=document.getElementById('sidebar');
  if(sb)sb.classList.remove('aperta');
  var v=document.getElementById('veloMenu');
  if(v)v.classList.remove('visibile');
}

function alternaMenuMobile(){
  var sb=document.getElementById('sidebar');
  if(!sb)return;
  if(sb.classList.contains('aperta'))chiudiMenuMobile(); else apriMenuMobile();
}

// Il pulsante ☰ dentro il pannello comprimeva la colonna: con il pannello a
// scomparsa quella funzione non esiste piu', e il gesto che ci si aspetta
// premendolo da aperto e' la chiusura. Si intercetta qui invece di toccare
// alternaMenu(), che sopra la soglia deve restare quella di prima.
function _correggiToggleSidebar(){
  var b=document.getElementById('sbToggle');
  if(!b||b._mobileLegato)return;
  b._mobileLegato=true;
  b.addEventListener('click',function(e){
    if(!schermoStretto())return;
    e.stopImmediatePropagation();
    e.preventDefault();
    chiudiMenuMobile();
  },true);
}

// ══════════════════════════════════════════
// BARRA SUPERIORE
// ══════════════════════════════════════════
// Sette elementi in fila non stanno in 360px. Il pulsante ☰ apre il menu; i
// tre che si usano di rado (connessioni, Knowledge Base, tema) finiscono
// dietro «⋯» invece di sparire: nasconderli renderebbe irraggiungibile il
// tema scuro da telefono, che e' proprio dove serve di piu'.
function _preparaTopbar(){
  var tb=document.querySelector('.topbar');
  if(!tb||tb._mobilePronta)return;
  tb._mobilePronta=true;

  var menu=document.createElement('div');
  menu.className='tb-icon-btn solo-tocco';
  menu.id='btnMenuMobile';
  menu.title='Apri il menu';
  menu.setAttribute('aria-label','Apri il menu');
  menu.innerHTML='<span>☰</span>';
  menu.onclick=alternaMenuMobile;
  tb.insertBefore(menu,tb.firstChild);

  // I tre pulsanti si spostano dentro un contenitore che di norma e'
  // invisibile: su schermo largo il contenitore non ha stili e i pulsanti
  // restano dov'erano, in fila nella barra.
  var daRaggruppare=['openConnessioni','openKnowledgeBaseModal'];
  var gruppo=document.createElement('div');
  gruppo.className='tb-secondarie';
  gruppo.id='tbSecondarie';
  var temaBtn=null;
  Array.prototype.slice.call(tb.querySelectorAll('.tb-icon-btn')).forEach(function(b){
    var oc=b.getAttribute('onclick')||'';
    if(oc.indexOf('alternaTema')>=0)temaBtn=b;
    for(var i=0;i<daRaggruppare.length;i++){
      if(oc.indexOf(daRaggruppare[i])>=0)gruppo.appendChild(b);
    }
  });
  if(temaBtn)gruppo.appendChild(temaBtn);
  if(gruppo.children.length){
    var piu=document.createElement('div');
    piu.className='tb-icon-btn solo-tocco';
    piu.id='btnAltroMobile';
    piu.title='Altri comandi';
    piu.setAttribute('aria-label','Altri comandi');
    piu.innerHTML='<span>⋯</span>';
    piu.onclick=function(e){
      e.stopPropagation();
      gruppo.classList.toggle('aperte');
    };
    // Il gruppo va inserito dove stavano i pulsanti, prima delle notifiche.
    var notif=tb.querySelector('.notif-panel');
    tb.insertBefore(gruppo, notif||null);
    tb.insertBefore(piu, gruppo);
    document.addEventListener('click',function(){ gruppo.classList.remove('aperte') });
  }
}

// ══════════════════════════════════════════
// PANNELLI DEL BUILDER
// ══════════════════════════════════════════
function _foglio(sel){ return document.querySelector(sel) }

function apriFoglioBuilder(quale){
  chiudiFoglioBuilder();
  var el=_foglio(quale==='palette'?'.builder-sidebar':'.builder-props');
  if(el)el.classList.add('aperto');
}

function chiudiFoglioBuilder(){
  ['.builder-sidebar','.builder-props'].forEach(function(s){
    var el=_foglio(s);
    if(el)el.classList.remove('aperto');
  });
}

function alternaFoglioBuilder(quale){
  var el=_foglio(quale==='palette'?'.builder-sidebar':'.builder-props');
  if(!el)return;
  if(el.classList.contains('aperto'))chiudiFoglioBuilder();
  else apriFoglioBuilder(quale);
}

function _preparaBuilderMobile(){
  var ca=document.getElementById('canvasArea');
  if(!ca||ca._mobilePronto)return;
  ca._mobilePronto=true;

  var barra=document.createElement('div');
  barra.className='barra-builder-mobile solo-tocco';
  barra.id='barraBuilderMobile';
  barra.innerHTML=
    '<button type="button" onclick="alternaFoglioBuilder(\'palette\')">🧩 Blocchi</button>'+
    '<button type="button" onclick="alternaFoglioBuilder(\'props\')">⚙️ Proprietà</button>';
  ca.appendChild(barra);

  // Maniglia in cima ai due pannelli: si tira giu' per chiudere, ed e' anche
  // il segno che dice che il pannello e' chiudibile.
  ['.builder-sidebar','.builder-props'].forEach(function(s){
    var el=_foglio(s);
    if(!el||el._maniglia)return;
    el._maniglia=true;
    var m=document.createElement('div');
    m.className='maniglia-foglio solo-tocco';
    m.addEventListener('click',chiudiFoglioBuilder);
    _trascinaPerChiudere(m,el);
    el.insertBefore(m,el.firstChild);
  });
}

// Trascinamento verso il basso sulla maniglia: sotto un quarto dell'altezza
// il pannello torna su, oltre si chiude. Senza questo, l'unico modo di
// chiudere sarebbe ripremere il pulsante che l'ha aperto, che su telefono
// nessuno cerca.
function _trascinaPerChiudere(maniglia,pannello){
  var y0=null,h=0;
  maniglia.addEventListener('touchstart',function(e){
    y0=e.touches[0].clientY; h=pannello.offsetHeight;
    pannello.style.transition='none';
  },{passive:true});
  maniglia.addEventListener('touchmove',function(e){
    if(y0==null)return;
    var d=Math.max(0,e.touches[0].clientY-y0);
    pannello.style.transform='translateY('+d+'px)';
  },{passive:true});
  maniglia.addEventListener('touchend',function(e){
    if(y0==null)return;
    var d=Math.max(0,(e.changedTouches[0]||{}).clientY-y0);
    pannello.style.transition='';
    pannello.style.transform='';
    if(d>h*0.25)chiudiFoglioBuilder();
    y0=null;
  });
}

// ── Selezione di un nodo: il pannello NON si apre da solo ──
// Prima bastava toccare un nodo perche' il foglio delle proprieta' salisse a
// coprire mezza tela. Sembrava comodo — selezioni, vedi i parametri — ed era
// insopportabile mentre si costruisce: ogni spostamento di un nodo, ogni tocco
// per collegarne due, ogni selezione per spostare la vista faceva salire il
// pannello, che poi andava richiuso a mano per vedere di nuovo il flusso. Il
// gesto piu' frequente nel Builder non e' «configura questo nodo», e' «metti
// questo nodo qui»: far pagare a quello il costo dell'altro era il verso
// sbagliato.
//
// Ora la selezione seleziona e basta. Le proprieta' si aprono con un gesto
// esplicito: il doppio tocco sul nodo, o il pulsante «⚙️ Proprieta'» in basso,
// che intanto dice su quale nodo si sta lavorando.
// Momento dell'ultimo cambio di contesto (accesso, uscita, cambio pagina).
var _ultimoCambioContesto=0;
function segnaCambioContesto(){ _ultimoCambioContesto=Date.now() }

// Nome del nodo selezionato sul pulsante in basso: senza l'apertura automatica
// serve un modo di sapere che la selezione e' avvenuta e dove sono finiti i
// parametri. Il pulsante e' quel modo.
function _aggiornaPulsanteProprieta(){
  var b=document.querySelector('#barraBuilderMobile button:last-child');
  if(!b)return;
  var n=(typeof B!=='undefined'&&B.selId>=0)?B.nodes.find(function(x){return x.id===B.selId}):null;
  if(n){
    var nome=String(n.name||'').length>14?String(n.name).substring(0,13)+'…':n.name;
    b.innerHTML='⚙️ '+(n.icon||'')+' '+nome;
    b.classList.add('con-selezione');
  }else{
    b.textContent='⚙️ Proprietà';
    b.classList.remove('con-selezione');
  }
}

function _agganciaAperturaProprieta(){
  if(typeof renderProps!=='function'||renderProps._mobileAgganciato)return;
  var originale=renderProps;
  window.renderProps=function(nid){
    var r=originale.apply(this,arguments);
    if(schermoStretto()){
      // Il pannello NON si apre: si aggiorna solo il pulsante in basso, che
      // dice quale nodo e' selezionato. Se il foglio e' gia' aperto, invece,
      // resta aperto e mostra il nodo nuovo — li' l'intenzione e' chiara,
      // si sta configurando.
      _aggiornaPulsanteProprieta();
      if(nid!=null&&nid>=0){
        // Due selezioni ravvicinate dello stesso nodo = doppio tocco.
        if(_valutaDoppioTocco())apriFoglioBuilder('props');
        else _suggerisciProprietaUnaVolta();
      }
    }
    return r;
  };
  window.renderProps._mobileAgganciato=true;
}

// Detto una volta sola per sessione, e solo alla prima selezione: dove sono
// finiti i parametri del nodo. Ripeterlo a ogni tocco sarebbe lo stesso
// fastidio dell'apertura automatica, in forma di avviso.
var _suggerimentoProprietaDato=false;
function _suggerisciProprietaUnaVolta(){
  if(_suggerimentoProprietaDato)return;
  if(document.querySelector('.builder-props.aperto'))return;
  _suggerimentoProprietaDato=true;
  if(typeof showToast==='function')
    showToast('Nodo selezionato: doppio tocco, o «⚙️ Proprietà» in basso, per configurarlo');
}

// Doppio tocco su un nodo: apre le proprieta'. E' il gesto che su schermo
// tattile corrisponde al «doppio clic per aprire» di una scrivania, e lascia
// il tocco singolo libero di fare quello che serve piu' spesso — selezionare
// e spostare.
// Il doppio tocco NON si rileva sugli eventi del nodo. Toccando un nodo il
// Builder ridisegna la tela, l'elemento toccato viene sostituito, e il
// `touchend` arriva a un elemento che non e' piu' nel documento: o non risale
// a nessuno, o il browser lo riassegna alla tela e il nodo non si riconosce
// piu'. Un rilevamento basato sul bersaglio sarebbe quindi affidabile solo
// finche' nessuno ridisegna niente, cioe' mai.
//
// Si guarda invece la SELEZIONE: due selezioni ravvicinate dello stesso nodo
// sono un doppio tocco, qualunque strada abbiano preso gli eventi. La sola
// cosa che serve dagli eventi e' sapere se il dito si e' mosso, e per quello
// basta il `touchstart`, che la tela riceve sempre.
var _ultimoTocco={t:0,id:null};
var _inizioTocco=null, _toccoMosso=false, _doppioInCorso=false;
function _agganciaDoppioTocco(){
  var ca=document.getElementById('canvasArea');
  if(!ca||ca._doppioTocco)return;
  ca._doppioTocco=true;

  // Il conteggio dei tocchi sta QUI e non nel gancio su renderProps: un solo
  // tocco fa ridisegnare le proprieta' due volte — una alla selezione, una al
  // rilascio — e contando quelle chiamate un tocco solo passava per due.
  // Il `touchstart` invece e' uno per tocco, ed e' anche l'unico momento in
  // cui l'elemento toccato e' ancora quello vero: subito dopo la tela si
  // ridisegna e il nodo viene sostituito.
  ca.addEventListener('touchstart',function(e){
    if(e.touches.length!==1){ _inizioTocco=null; _toccoMosso=true; _doppioInCorso=false; return }
    _inizioTocco={x:e.touches[0].clientX,y:e.touches[0].clientY};
    _toccoMosso=false; _doppioInCorso=false;

    var nodo=e.target.closest&&e.target.closest('.b-node');
    var id=nodo?parseInt(nodo.getAttribute('data-nid'),10):null;
    var ora=Date.now();
    if(id!=null&&_ultimoTocco.id===id&&(ora-_ultimoTocco.t)<500){
      _doppioInCorso=true; _ultimoTocco={t:0,id:null};
    }else{
      _ultimoTocco={t:ora,id:id};
    }
  },{passive:true});

  // Un dito che si sposta di piu' di una decina di pixel sta trascinando, non
  // toccando: due trascinamenti di seguito sullo stesso nodo somigliano a un
  // doppio tocco senza esserlo, e aprire il pannello li' sarebbe lo stesso
  // fastidio di prima con un gesto in piu'.
  ca.addEventListener('touchmove',function(e){
    if(!_inizioTocco||!e.touches.length)return;
    if(Math.abs(e.touches[0].clientX-_inizioTocco.x)>10||
       Math.abs(e.touches[0].clientY-_inizioTocco.y)>10)_toccoMosso=true;
  },{passive:true});
}

// Chiamata dal gancio su renderProps a ogni selezione di un nodo: dice se
// quella selezione viene da un doppio tocco. Il dito che si e' mosso annulla
// tutto — stava trascinando, non aprendo.
function _valutaDoppioTocco(){
  if(!_doppioInCorso||_toccoMosso)return false;
  _doppioInCorso=false;
  return true;
}

// ══════════════════════════════════════════
// PALETTE: SI TOCCA, NON SI TRASCINA
// ══════════════════════════════════════════
// Il trascinamento HTML5 non esiste su schermo tattile. Il tocco aggiunge il
// nodo al centro della vista, dove chi guarda lo vede comparire; e se un nodo
// e' gia' li' si scala di poco, per non sovrapporne due.
function _aggiungiDaPalette(el){
  // Quattro attributi invece di un JSON in uno solo: escHtml() non protegge
  // le virgolette, e un JSON messo in un attributo si troncava alla prima.
  var d={
    type:el.getAttribute('data-tipo'),
    icon:el.getAttribute('data-icona'),
    name:el.getAttribute('data-nome'),
    desc:el.getAttribute('data-desc')
  };
  if(!d.type||!d.name)return;
  var ca=document.getElementById('canvasArea');
  if(!ca||typeof b_addNode!=='function')return;
  var r=ca.getBoundingClientRect();
  var x=(r.width/2-B.panX)/B.zoom-90;
  var y=(r.height/2-B.panY)/B.zoom-40;
  // Un nodo gia' in quel punto: si scende in diagonale finche' il posto e'
  // libero, invece di impilarne due che sembrano uno.
  var tentativi=0;
  while(tentativi<40 && B.nodes.some(function(n){return Math.abs(n.x-x)<40&&Math.abs(n.y-y)<40})){
    x+=34; y+=34; tentativi++;
  }
  B.effimero=false;
  if(typeof pushUndo==='function')pushUndo('aggiunta "'+d.name+'"');
  b_addNode(d.type,d.icon,d.name,d.desc,x,y);
  b_render();
  if(typeof showToast==='function')showToast('➕ Nodo "'+d.name+'" aggiunto al centro');
  if(typeof addAct==='function')addAct('Aggiunto nodo: '+d.name);
  if(typeof applyPoliciesToCanvas==='function')applyPoliciesToCanvas();
  chiudiFoglioBuilder();
}

// La palette viene ridisegnata a ogni ricerca e a ogni cambio di categoria:
// agganciare i singoli elementi non basterebbe. Si ascolta sul contenitore,
// che non cambia mai.
function _preparaPalette(){
  var lista=document.getElementById('paletteList');
  if(!lista||lista._mobilePronta)return;
  lista._mobilePronta=true;
  lista.addEventListener('click',function(e){
    if(!schermoStretto())return;
    var el=e.target.closest('.palette-item');
    if(el)_aggiungiDaPalette(el);
  });
}

// ══════════════════════════════════════════
// PONTE FRA TOCCO E MOUSE SUL CANVAS
// ══════════════════════════════════════════
// Un dito -> gli eventi del mouse che il Builder gia' gestisce.
// Due dita -> pizzico per ingrandire e spostamento della vista, che un
// equivalente col mouse non hanno.
var _pinch=null;

function _eventoMouse(tipo,tocco,bersaglio){
  var ev;
  try{
    ev=new MouseEvent(tipo,{
      bubbles:true,cancelable:true,view:window,
      clientX:tocco.clientX,clientY:tocco.clientY,
      screenX:tocco.screenX,screenY:tocco.screenY,
      button:0,buttons:(tipo==='mouseup'?0:1)
    });
  }catch(e){ return }
  (bersaglio||document).dispatchEvent(ev);
}

function _preparaPonteTocco(){
  var ca=document.getElementById('canvasArea');
  if(!ca||ca._pontePronto)return;
  ca._pontePronto=true;

  var bersaglio=null, nodoToccato=false;

  ca.addEventListener('touchstart',function(e){
    if(!dispositivoTattile())return;
    // Dentro i comandi, il registro o la chat si lascia fare al browser: sono
    // pulsanti e testo, non tela.
    if(e.target.closest('.canvas-controls'))return;
    if(e.target.closest('.exec-log'))return;
    if(e.target.closest('.chat-builder'))return;
    if(e.target.closest('.barra-builder-mobile'))return;

    if(e.touches.length===2){
      var r=ca.getBoundingClientRect();
      _pinch={
        d:_distanza(e.touches[0],e.touches[1]),
        zoom:B.zoom,
        cx:(e.touches[0].clientX+e.touches[1].clientX)/2-r.left,
        cy:(e.touches[0].clientY+e.touches[1].clientY)/2-r.top
      };
      // Un eventuale trascinamento a un dito iniziato prima va chiuso, o
      // resterebbe appeso e il nodo continuerebbe a seguire il dito.
      if(bersaglio){ _eventoMouse('mouseup',e.touches[0],document); bersaglio=null }
      return;
    }
    if(e.touches.length!==1)return;
    bersaglio=e.target;
    // Toccare un nodo lo fa ridisegnare: l'elemento originale esce dal
    // documento e i suoi touchmove/touchend NON risalgono piu' alla tela (un
    // elemento staccato non ha antenati). E' il motivo per cui il nodo non si
    // riusciva a spostare. Gli ascoltatori vanno messi sull'elemento toccato.
    var el=bersaglio; nodoToccato=!!(el.closest&&el.closest('.b-node'));
    if(el&&el.addEventListener&&!el._ponte){
      el._ponte=true;
      el.addEventListener('touchmove',function(ev){ muovi(ev) },{passive:false});
      el.addEventListener('touchend',function(ev){ fine(ev) },{passive:false});
      el.addEventListener('touchcancel',function(ev){ fine(ev) });
    }
    _eventoMouse('mousedown',e.touches[0],bersaglio);
  },{passive:true});

  var muovi=function(e){
    if(!dispositivoTattile())return;
    if(_pinch&&e.touches.length===2){
      e.preventDefault();
      var d=_distanza(e.touches[0],e.touches[1]);
      if(_pinch.d>0&&typeof bApplicaZoom==='function')
        bApplicaZoom(_pinch.zoom*(d/_pinch.d),_pinch.cx,_pinch.cy);
      return;
    }
    if(!bersaglio||e.touches.length!==1)return;
    // Senza questo, il browser scorre la pagina mentre si sposta un nodo e il
    // nodo resta indietro.
    e.preventDefault();
    if(_inizioTocco&&(Math.abs(e.touches[0].clientX-_inizioTocco.x)>10||Math.abs(e.touches[0].clientY-_inizioTocco.y)>10))_toccoMosso=true;
    _eventoMouse('mousemove',e.touches[0],document);
  };
  ca.addEventListener("touchmove",muovi,{passive:false});

  var fine=function(e){
    if(_pinch&&e.touches.length<2)_pinch=null;
    if(!bersaglio)return;
    var t=(e.changedTouches&&e.changedTouches[0])||{clientX:0,clientY:0,screenX:0,screenY:0};
    _eventoMouse('mouseup',t,document);
    // Gli eventi mouse «di compatibilita'» del browser cadrebbero sulla tela
    // vuota (il nodo e' stato ridisegnato) e la deselezionerebbero: e' il
    // motivo per cui aprendo le proprieta' la selezione spariva.
    // Solo per i nodi: un tocco su una freccia deve restare un clic.
    if(e.cancelable&&nodoToccato)e.preventDefault();
    bersaglio=null;
  };
  ca.addEventListener('touchend',fine);
  ca.addEventListener('touchcancel',fine);
}

function _distanza(a,b){
  var dx=a.clientX-b.clientX, dy=a.clientY-b.clientY;
  return Math.sqrt(dx*dx+dy*dy);
}

// ══════════════════════════════════════════
// AVVIO
// ══════════════════════════════════════════
// Il Builder si inizializza quando la pagina viene aperta la prima volta, non
// al caricamento: i suoi agganci si rimettono a ogni cambio pagina, ed e'
// idempotente perche' ogni funzione controlla di non aver gia' lavorato.
function preparaMobile(){
  aggiornaClasseTocco();
  _preparaTopbar();
  _correggiToggleSidebar();
  _preparaBuilderMobile();
  _preparaPalette();
  _preparaPonteTocco();
  _agganciaDoppioTocco();
  _agganciaAperturaProprieta();
  _agganciaSessione();
  _aggiornaPulsanteProprieta();
}

document.addEventListener('DOMContentLoaded',function(){
  preparaMobile();
  // Navigando da una voce del menu, il pannello deve chiudersi: restare
  // aperto sopra la pagina appena aperta e' il difetto classico dei menu a
  // scomparsa fatti a meta'.
  var sb=document.getElementById('sidebar');
  if(sb)sb.addEventListener('click',function(e){
    if(!schermoStretto())return;
    if(e.target.closest('.ni'))setTimeout(chiudiMenuMobile,60);
  });
  // Il Builder esiste solo dopo la prima apertura della sua pagina.
  setTimeout(preparaMobile,1200);
  setTimeout(preparaMobile,3000);
});

window.addEventListener('resize',function(){
  aggiornaClasseTocco();
  preparaMobile();
});

// Cambiare pagina chiude tutto quello che e' rimasto aperto sopra.
window.addEventListener('hashchange',function(){
  segnaCambioContesto();
  chiudiMenuMobile();
  chiudiFoglioBuilder();
  setTimeout(preparaMobile,300);
});

// ══════════════════════════════════════════
// ENTRARE E USCIRE DA TELEFONO
// ══════════════════════════════════════════
// Uscendo dall'applicazione, i pannelli a scomparsa restavano aperti dietro
// la schermata di accesso: rientrando ci si ritrovava con le proprieta' di un
// nodo sollevate sopra la dashboard di un altro utente. Si chiudono insieme
// alla sessione, che e' il momento in cui perdono senso.
//
// Si aggancia alle funzioni esistenti invece di modificarle: la logica di
// accesso resta dov'e', questo e' un effetto collaterale dell'impaginazione
// per schermi stretti e sta qui.
function _agganciaSessione(){
  ['mostraLoginScreen','hideLoginScreen','applicaUtente','logout'].forEach(function(nome){
    var f=window[nome];
    if(typeof f!=='function'||f._mobileAgganciata)return;
    var avvolta=function(){
      segnaCambioContesto();
      chiudiMenuMobile();
      chiudiFoglioBuilder();
      return f.apply(this,arguments);
    };
    avvolta._mobileAgganciata=true;
    window[nome]=avvolta;
  });
}

// ── Pannello «Integrazione AI» richiudibile (telefono) ──────────
// Nel foglio dei blocchi occupava mezza altezza, e i connettori che si
// cercavano restavano sotto. Chiuso di default; un tocco sul titolo lo apre
// (serve ogni tanto: collegare la chiave si fa una volta). Il pannello compare
// ogni volta che il Builder si ridisegna, quindi si aggancia sul contenitore.
document.addEventListener('click',function(e){
  var t=e.target.closest&&e.target.closest('.ai-panel-title');
  if(!t||!schermoStretto())return;
  var p=t.closest('.ai-panel'); if(!p)return;
  p.classList.toggle('chiuso');
  try{ localStorage.setItem('relaition_ai_panel_aperto',p.classList.contains('chiuso')?'0':'1') }catch(err){}
});
function _chiudiPannelloAI(){
  if(!schermoStretto())return;
  var p=document.querySelector('.ai-panel'); if(!p||p._init)return;
  p._init=true;
  var aperto='0'; try{ aperto=localStorage.getItem('relaition_ai_panel_aperto')||'0' }catch(err){}
  if(aperto!=='1')p.classList.add('chiuso');
}
document.addEventListener('DOMContentLoaded',function(){ setTimeout(_chiudiPannelloAI,600) });
window.addEventListener('hashchange',function(){ setTimeout(_chiudiPannelloAI,300) });

// ── Ricerca da telefono ─────────────────────────────────────────
// La barra di ricerca della testata e' nascosta sotto i 768px perche' non ci
// sta. Nascosta e basta, pero', significava non poter cercare: al suo posto
// un'icona la apre a tutta larghezza.
function _preparaRicercaMobile(){
  var tb=document.querySelector('.topbar');
  if(!tb||document.getElementById('btnCercaMobile')||!tb.querySelector('.tb-search'))return;
  var b=document.createElement('div');
  b.className='tb-icon-btn solo-tocco';
  b.id='btnCercaMobile';
  b.title='Cerca';
  b.setAttribute('aria-label','Cerca');
  b.innerHTML='<span>🔍</span>';
  b.onclick=function(e){
    e.stopPropagation();
    tb.classList.toggle('cerca-aperta');
    if(tb.classList.contains('cerca-aperta')){
      var i=document.getElementById('globalSearch'); if(i)setTimeout(function(){ i.focus() },50);
    }
  };
  var bersaglio=document.getElementById('btnAltroMobile')||tb.querySelector('.notif-panel');
  tb.insertBefore(b,bersaglio||null);
  // Un tocco fuori la richiude, e cosi' il passaggio a un'altra pagina.
  document.addEventListener('click',function(e){
    if(!e.target.closest||e.target.closest('.tb-search')||e.target.closest('#btnCercaMobile'))return;
    tb.classList.remove('cerca-aperta');
  });
}
document.addEventListener('DOMContentLoaded',function(){ setTimeout(_preparaRicercaMobile,400) });
