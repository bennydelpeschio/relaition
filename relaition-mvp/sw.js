// Service worker di RelAItion.
// L'applicazione è già interamente client-side: il compito qui non è
// nascondere una rete lenta, ma rendere l'installazione possibile e far sì
// che l'app si apra anche senza connessione — il che è coerente con il fatto
// che i dati vivono nel browser e non su un server.

var CACHE = 'relaition-v89';
// L'elenco e' generato dai <script> e <link> di index.html: quando era
// scritto a mano restava indietro a ogni modulo aggiunto, e nell'app
// installata i moduli mancanti non avevano copia di riserva — bastava una
// richiesta non andata a buon fine perche' l'app partisse monca (senza
// Connessioni, Posta, utenti) senza dire perche'.
var GUSCIO = [
  './', './index.html', './manifest.webmanifest', './icon.svg', './sw.js',
  './css/base.css',
  './css/components.css',
  './css/marketplace.css',
  './css/builder.css',
  './css/pages.css',
  './manifest.webmanifest',
  './icon.svg',
  './lib/sqljs/sql-wasm.js',
  './lib/sqljs/sql-wasm-inline.js',
  './js/state.js',
  './js/db.js',
  './js/guardrails.js',
  './js/policies.js',
  './js/storage.js',
  './js/router.js',
  './js/fileout.js',
  './js/fileread.js',
  './js/cloudsave.js',
  './js/mailer.js',
  './js/webhook.js',
  './js/utenti.js',
  './js/connessioni.js',
  './js/connessioni-ui.js',
  './js/explain.js',
  './js/kb.js',
  './js/publish.js',
  './js/governance.js',
  './js/seed-demo.js',
  './js/tour.js',
  './js/ai-client.js',
  './js/chat-compose.js',
  './js/agent-runtime.js',
  './js/builder.js',
  './js/community.js',
  './js/sfide-contenuti.js',
  './js/lezioni-risorse.js',
  './js/sfide.js',
  './js/lezioni-pratica.js',
  './js/recensioni.js',
  './js/recensioni-seed.js',
  './js/pubblicazioni.js',
  './js/marketplace.js',
  './js/pages.js',
  './js/lessons-piattaforma.js',
  './js/lessons-fondamenti.js',
  './js/modals.js',
  './js/main.js',
  // La demo fa parte della consegna: senza questi file, aperta senza rete,
  // non avrebbe copia di riserva e resterebbe una pagina bianca.
  './demo/demo.html',
  './demo/motore.js',
  './demo/copione.js',
];

self.addEventListener('install', function(e){
  // Un file mancante non deve impedire l'installazione dell'intero guscio:
  // si mette in cache ciò che risponde, il resto arriverà dalla rete.
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(GUSCIO.map(function(u){
      return c.add(u).catch(function(){ return null });
    }));
  }).then(function(){ return self.skipWaiting() }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(chiavi){
    return Promise.all(chiavi.filter(function(k){ return k !== CACHE })
                             .map(function(k){ return caches.delete(k) }));
  }).then(function(){ return self.clients.claim() }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);

  // Le chiamate ai fornitori di modelli non vanno MAI servite dalla cache:
  // restituire una risposta vecchia al posto di una generazione nuova sarebbe
  // il modo più subdolo di far sembrare che l'AI stia funzionando.
  if(url.origin !== self.location.origin) return;

  // Rete per prima sui file dell'app, così una modifica al codice si vede
  // subito; la cache resta come rete di sicurezza quando si è offline.
  e.respondWith(
    fetch(req).then(function(r){
      if(r && r.status === 200){
        var copia = r.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copia) });
      }
      return r;
    }).catch(function(){
      return caches.match(req).then(function(c){
        if(c) return c;
        // Ripiego SOLO per le navigazioni, e solo verso il documento della
        // stessa area. Prima si restituiva `index.html` per qualunque
        // richiesta fallita: aprendo la demo con il server spento compariva
        // l'applicazione al posto della demo, senza un errore e senza una
        // spiegazione. Un ripiego che sostituisce un documento con un altro
        // e' peggio di un ripiego che non c'e'.
        if(req.mode === 'navigate'){
          return caches.match(url.pathname.indexOf('/demo/') >= 0
            ? './demo/demo.html' : './index.html');
        }
        return Response.error();
      });
    })
  );
});
