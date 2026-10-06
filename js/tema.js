// ═══════════════════════════════════════════
// TEMA CHIARO / SCURO
// ═══════════════════════════════════════════
// Un attributo sulla radice del documento e una chiave nel browser. I colori
// stanno tutti nelle variabili CSS, quindi cambiare tema non tocca nessun
// componente: cambia la tavolozza che leggono. Il tema predefinito e' quello
// chiaro, e non si segue la preferenza di sistema: gli screenshot e la
// dimostrazione devono venire uguali su ogni macchina.

var TEMA_CHIAVE='relaition_tema';

function temaCorrente(){
  return document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';
}

function applicaTema(t){
  var scuro=(t==='dark');
  if(scuro)document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
  try{ localStorage.setItem(TEMA_CHIAVE,scuro?'dark':'light') }catch(e){}
  var ic=document.getElementById('temaIcona');
  if(ic){ ic.textContent=scuro?'☀':'☾'; ic.parentNode.title=scuro?'Passa al tema chiaro':'Passa al tema scuro'; }
  var meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',scuro?'#0B1220':'#4F46E5');
}

function alternaTema(){
  applicaTema(temaCorrente()==='dark'?'light':'dark');
}

// All'avvio si allinea solo l'icona: l'attributo e' gia' stato messo dallo
// script in testa alla pagina, prima del primo disegno.
document.addEventListener('DOMContentLoaded',function(){ applicaTema(temaCorrente()) });

// ── Versione in esecuzione ─────────────────────────────────────
// Un numero piccolo in fondo al menu, preso dal service worker che sta
// servendo la pagina: non da un'etichetta scritta a mano, che resta indietro.
// Se non c'e' un service worker (apertura da file) non si mostra niente.
function mostraVersione(){
  var el=document.getElementById('versioneApp'); if(!el)return;
  if(!('serviceWorker' in navigator))return;
  navigator.serviceWorker.addEventListener('message',function(e){
    if(e.data&&e.data.tipo==='versione'&&e.data.cache){
      el.textContent=String(e.data.cache).replace('relaition-','');
      el.title='Versione della cache in esecuzione';
    }
  });
  navigator.serviceWorker.ready.then(function(r){
    if(r.active)r.active.postMessage({tipo:'versione'});
  }).catch(function(){});
}
document.addEventListener('DOMContentLoaded',mostraVersione);
