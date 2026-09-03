// ══════════════════════════════════════════
// DATABASE — SQLite reale (sql.js/WASM) eseguito interamente nel browser.
//
// Perché un DB e non solo localStorage: gli "agenti salvati" nel builder
// vivevano prima in un'unica chiave localStorage condivisa — salvarne uno
// nuovo sovrascriveva silenziosamente i dati completi (nodi/archi) di
// quelli precedenti, lasciando solo nome e conteggio nodi. Un vero schema
// relazionale (una riga per agente, con la sua struttura completa) risolve
// il problema alla radice ed è coerente con la scelta "zero server" della
// piattaforma (Cap. 3): il DB gira nel browser via WebAssembly, nessun
// backend da installare, il file .sqlite risultante è scaricabile e
// riapribile con qualunque client SQLite standard — quindi ancora più
// portabile del JSON per il no-vendor-lock-in.
//
// Persistenza: sql.js tiene il DB in memoria; ad ogni scrittura lo si
// esporta come blob binario e lo si salva in IndexedDB (più adatto di
// localStorage per dati binari e volumi maggiori).
// ══════════════════════════════════════════

var DB=null;
var SQL_MODULE=null;
var DB_READY=null; // promise
var IDB_NAME='relaition_sqlite';
var IDB_STORE='db';
var IDB_KEY='main';

function idbOpen(){
  return new Promise(function(resolve,reject){
    var req=indexedDB.open(IDB_NAME,1);
    req.onupgradeneeded=function(){req.result.createObjectStore(IDB_STORE)};
    req.onsuccess=function(){resolve(req.result)};
    req.onerror=function(){reject(req.error)};
  });
}

function idbGet(key){
  return idbOpen().then(function(db){
    return new Promise(function(resolve,reject){
      var tx=db.transaction(IDB_STORE,'readonly');
      var req=tx.objectStore(IDB_STORE).get(key);
      req.onsuccess=function(){resolve(req.result)};
      req.onerror=function(){reject(req.error)};
    });
  });
}

function idbSet(key,val){
  return idbOpen().then(function(db){
    return new Promise(function(resolve,reject){
      var tx=db.transaction(IDB_STORE,'readwrite');
      tx.objectStore(IDB_STORE).put(val,key);
      tx.oncomplete=function(){resolve()};
      tx.onerror=function(){reject(tx.error)};
    });
  });
}

var SCHEMA=[
  "CREATE TABLE IF NOT EXISTS agents (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, nodes_json TEXT NOT NULL, edges_json TEXT NOT NULL, next_id INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS exec_log (id INTEGER PRIMARY KEY AUTOINCREMENT, agent TEXT, nodes INTEGER, status TEXT, duration INTEGER, mode TEXT, summary TEXT, user TEXT, ts TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS published_agents (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, cat TEXT, icon TEXT, color TEXT, author TEXT, rating REAL, installs INTEGER, price TEXT, desc TEXT, tags_json TEXT, workflow_json TEXT, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS my_agents (id INTEGER PRIMARY KEY AUTOINCREMENT, catalog_id INTEGER NOT NULL, installed_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS kb_docs (id TEXT PRIMARY KEY, name TEXT, size INTEGER, content TEXT, uploaded_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS forum_posts (id INTEGER PRIMARY KEY, user TEXT, ava TEXT, color TEXT, title TEXT, body TEXT, type TEXT, tag TEXT, likes INTEGER DEFAULT 0, comments INTEGER DEFAULT 0, views INTEGER DEFAULT 0, time TEXT, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS forum_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL, user TEXT, ava TEXT, color TEXT, text TEXT, time TEXT, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS learn_progress (path_id INTEGER NOT NULL, lesson_index INTEGER NOT NULL, done INTEGER DEFAULT 0, PRIMARY KEY (path_id, lesson_index))",
  "CREATE TABLE IF NOT EXISTS quiz_done (quiz_key TEXT PRIMARY KEY, ts TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS challenges_registered (challenge_id TEXT PRIMARY KEY, ts TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS xp_log (id INTEGER PRIMARY KEY AUTOINCREMENT, amount INTEGER NOT NULL, reason TEXT, ts TEXT NOT NULL)",

  // ── Estensione schema (allineamento al capitolo, blocco A1) ──
  // NB: il documento chiama `executions` la tabella delle esecuzioni; nel
  // codice si chiama `exec_log` ed è referenziata in una decina di punti.
  // Viene ESTESA (trace_json, replay_seed nelle MIGRATIONS) anziché
  // rinominata: rinominarla romperebbe codice funzionante senza vantaggio.
  "CREATE TABLE IF NOT EXISTS agent_versions (id INTEGER PRIMARY KEY AUTOINCREMENT, agent_id INTEGER NOT NULL, version TEXT NOT NULL, definition_json TEXT NOT NULL, author TEXT, created_at TEXT NOT NULL, note TEXT)",
  // NB: il documento prevede una tabella `kb_documents` separata. Nel codice
  // i documenti vivono già in `kb_docs`, letta da caricamento, modale, export
  // wiki, pacchetto di uscita e statistiche del profilo. Invece di affiancare
  // un secondo elenco degli stessi documenti, `kb_docs` viene ESTESA con i
  // campi previsti (vedi MIGRATIONS) e `kb_chunks` punta al suo id.
  "CREATE TABLE IF NOT EXISTS kb_chunks (id TEXT PRIMARY KEY, doc_id TEXT NOT NULL, ordinal INTEGER NOT NULL, text TEXT NOT NULL, context_prefix TEXT, embedding TEXT, metadata_json TEXT)",
  "CREATE TABLE IF NOT EXISTS agent_memory (agent_id INTEGER NOT NULL, key TEXT NOT NULL, value TEXT, updated_at TEXT NOT NULL, PRIMARY KEY (agent_id, key))",
  "CREATE TABLE IF NOT EXISTS publications (id INTEGER PRIMARY KEY AUTOINCREMENT, agent_id INTEGER NOT NULL, version TEXT, requested_scope TEXT, checks_json TEXT, reviewer TEXT, decision TEXT, decided_at TEXT, notes TEXT, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS policies (id INTEGER PRIMARY KEY AUTOINCREMENT, scope TEXT NOT NULL, condition_json TEXT, required_guardrail TEXT NOT NULL, active INTEGER DEFAULT 1)",
  "CREATE TABLE IF NOT EXISTS execution_events (id INTEGER PRIMARY KEY AUTOINCREMENT, execution_id INTEGER NOT NULL, seq INTEGER NOT NULL, event_type TEXT NOT NULL, node_id INTEGER, payload_json TEXT, ts TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_kb_chunks_doc ON kb_chunks (doc_id)",
  // Le recensioni erano tre righe scritte nel codice, identiche su tutti e 22
  // gli agenti del catalogo: dicevano che la scheda "ha delle recensioni", non
  // cosa pensa qualcuno di QUELL'agente. Ora sono righe vere, di chi le ha
  // scritte, e una persona ne ha al massimo una per agente (UNIQUE): il
  // secondo invio corregge la propria, non ne accumula un'altra.
  "CREATE TABLE IF NOT EXISTS recensioni (id INTEGER PRIMARY KEY AUTOINCREMENT, agent_key TEXT NOT NULL, autore TEXT NOT NULL, stelle INTEGER NOT NULL, testo TEXT, created_at TEXT NOT NULL, updated_at TEXT)",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_recensioni_uno ON recensioni (agent_key, autore)",
  // Le sfide erano una bacheca: ci si iscriveva e basta. La candidatura di un
  // agente e' cio' che le collega alla piattaforma — senza, la pagina resta
  // contenuto redazionale accanto a un prodotto, non parte del prodotto.
  "CREATE TABLE IF NOT EXISTS challenge_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, challenge_id TEXT NOT NULL, user TEXT NOT NULL, agent_id INTEGER, agent_name TEXT NOT NULL, nota TEXT, ts TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_uno ON challenge_submissions (challenge_id, user)",
  // Una sfida senza contenuto e' un annuncio: si legge una volta e non ci si
  // torna. Le domande e i voti sono cio' che la rende un luogo dove succede
  // qualcosa fra una scadenza e l'altra — e in dimostrazione sono l'unica parte
  // che si puo' mostrare mentre accade, invece di raccontarla.
  "CREATE TABLE IF NOT EXISTS challenge_questions (id INTEGER PRIMARY KEY AUTOINCREMENT, challenge_id TEXT NOT NULL, user TEXT NOT NULL, testo TEXT NOT NULL, risposta TEXT, risposta_di TEXT, ts TEXT NOT NULL)",
  // Un voto per persona e per oggetto: senza il vincolo, «il piu' votato»
  // misurerebbe soltanto chi ha cliccato piu' volte.
  "CREATE TABLE IF NOT EXISTS challenge_votes (tipo TEXT NOT NULL, ref_id INTEGER NOT NULL, user TEXT NOT NULL, ts TEXT NOT NULL, PRIMARY KEY (tipo, ref_id, user))",
  // Il regolamento della sfida sul presidio dichiara una «revisione fra pari»:
  // ogni partecipante commenta il presidio di un altro agente candidato. Era
  // scritto nel regolamento e non esisteva da nessuna parte.
  "CREATE TABLE IF NOT EXISTS challenge_feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, challenge_id TEXT NOT NULL, submission_id INTEGER NOT NULL, user TEXT NOT NULL, testo TEXT NOT NULL, ts TEXT NOT NULL)",
  // Gli obiettivi erano otto righe scritte nel codice, con soglie fisse: un
  // reparto che parte da zero e uno che ha gia' venti agenti non hanno lo
  // stesso traguardo sensato. La soglia, l'attivazione e i punti diventano
  // configurabili; il MODO di misurarli resta nel codice, perche' e' quello
  // che rende l'obiettivo verificabile invece che dichiarato.
  "CREATE TABLE IF NOT EXISTS obiettivi_config (chiave TEXT PRIMARY KEY, obiettivo INTEGER, xp INTEGER, attivo INTEGER DEFAULT 1, aggiornato TEXT)",
  // Il «mi piace» era `p.likes++`: un contatore cieco che saliva a ogni clic
  // della stessa persona e non si poteva togliere. Misurava i clic, non chi
  // aveva apprezzato. Una riga per persona e per post lo rende un conteggio.
  "CREATE TABLE IF NOT EXISTS forum_likes (post_id INTEGER NOT NULL, user TEXT NOT NULL, ts TEXT NOT NULL, PRIMARY KEY (post_id, user))",
  // Le visualizzazioni erano numeri fissi scritti nel seme: 142, 89, 287, e
  // restavano quelli anche aprendo il post cento volte.
  "CREATE TABLE IF NOT EXISTS forum_views (post_id INTEGER NOT NULL, user TEXT NOT NULL, ts TEXT NOT NULL, PRIMARY KEY (post_id, user))",
  // I vincitori delle edizioni passate erano scritti nel markup della pagina:
  // una "Hall of Fame" che non e' un dato non si puo' ne' interrogare ne'
  // estendere quando una sfida si chiude.
  "CREATE TABLE IF NOT EXISTS challenge_winners (id INTEGER PRIMARY KEY AUTOINCREMENT, edizione TEXT NOT NULL, vincitore TEXT NOT NULL, agente TEXT, quando TEXT, posizione INTEGER DEFAULT 1)",
  "CREATE INDEX IF NOT EXISTS idx_exec_events_exec ON execution_events (execution_id, seq)"
];

var LEGACY_KEYS_MIGRATED_FLAG='relaition_db_migrated_v1';

// Colonne aggiunte dopo la creazione iniziale della tabella (deploy in
// produzione/scheduling): ALTER TABLE, non CREATE TABLE, quindi serve una
// migrazione esplicita per i database già esistenti in IndexedDB — wrappata
// in try/catch per essere idempotente (fallisce silenziosamente se la
// colonna esiste già).
var MIGRATIONS=[
  "ALTER TABLE agents ADD COLUMN active INTEGER DEFAULT 0",
  "ALTER TABLE agents ADD COLUMN schedule_type TEXT DEFAULT 'manual'",
  "ALTER TABLE agents ADD COLUMN schedule_value TEXT DEFAULT ''",
  "ALTER TABLE agents ADD COLUMN last_run_at TEXT",
  "ALTER TABLE published_agents ADD COLUMN status TEXT DEFAULT 'validating'",
  "ALTER TABLE published_agents ADD COLUMN review_note TEXT",
  "ALTER TABLE agents ADD COLUMN context TEXT DEFAULT ''",
  "ALTER TABLE exec_log ADD COLUMN steps_json TEXT",
  // Blocco A1: la traccia completa degli input verso modello/connettori
  // (serve alla riesecuzione deterministica B8) e il seme che la rende
  // ripetibile. Su `exec_log`, che è la tabella `executions` del documento.
  "ALTER TABLE exec_log ADD COLUMN trace_json TEXT",
  "ALTER TABLE exec_log ADD COLUMN replay_seed TEXT",
  // Una politica può essere *consigliata* (la validazione la segnala e
  // propone l'inserimento a un click) oppure *obbligatoria* (il controllo
  // viene inserito d'ufficio e reso non rimovibile). Il default è
  // consigliata: imporre un nodo che l'utente non ha chiesto è fuorviante
  // se il caso non lo richiede davvero.
  "ALTER TABLE policies ADD COLUMN mode TEXT DEFAULT 'consigliata'",
  // Blocco C: i metadati che il documento assegna a `kb_documents` vivono
  // sulla tabella dei documenti già esistente. `indexed_at` distingue un
  // documento caricato da uno effettivamente segmentato e indicizzato.
  "ALTER TABLE kb_docs ADD COLUMN source_type TEXT DEFAULT 'non_strutturato'",
  "ALTER TABLE kb_docs ADD COLUMN business_unit TEXT DEFAULT 'Tutte'",
  "ALTER TABLE kb_docs ADD COLUMN confidentiality TEXT DEFAULT 'interno'",
  "ALTER TABLE kb_docs ADD COLUMN chunk_count INTEGER DEFAULT 0",
  "ALTER TABLE kb_docs ADD COLUMN indexed_at TEXT",
  // Provenienza del documento: caricato a mano, prodotto da un agente, oppure
  // proveniente da un archivio aziendale (SharePoint, Drive). Sapere da dove
  // arriva un contenuto cambia il peso che gli si dà quando lo si ritrova
  // come fonte di una risposta.
  // Autore dell'agente: serve al monitoraggio per calcolare le medie per
  // utente. Senza, ogni aggregato sarebbe indistinguibile da un totale.
  "ALTER TABLE agents ADD COLUMN author TEXT",
  "ALTER TABLE kb_docs ADD COLUMN origin TEXT DEFAULT 'caricato'",
  "ALTER TABLE kb_docs ADD COLUMN origin_url TEXT",
  // Blocco D: l'ambito di diffusione determina chi approva e quali controlli
  // sono bloccanti; la versione serve al confronto e al ripristino.
  "ALTER TABLE published_agents ADD COLUMN scope TEXT DEFAULT 'organizzazione'",
  "ALTER TABLE published_agents ADD COLUMN version TEXT DEFAULT '1.0'",
  "ALTER TABLE published_agents ADD COLUMN suspended_reason TEXT",
  "ALTER TABLE published_agents ADD COLUMN suspended_at TEXT",
  "ALTER TABLE published_agents ADD COLUMN source_agent_id INTEGER",
  // Un post può portare un allegato — un workflow esportato, un CSV di
  // esempio, una checklist — che gli altri possono scaricare. Il contenuto sta
  // nel database come testo: sono file piccoli e restano dentro l'esportazione
  // del database, che è l'unico backup che il prototipo ha.
  "ALTER TABLE forum_posts ADD COLUMN attach_name TEXT",
  "ALTER TABLE forum_posts ADD COLUMN attach_mime TEXT",
  "ALTER TABLE forum_posts ADD COLUMN attach_data TEXT",
  "ALTER TABLE forum_posts ADD COLUMN edited_at TEXT",

  // ── Dati per utente ──
  // Agenti, esecuzioni, installazioni, progressi e punti appartengono a una
  // persona; marketplace, Learning Hub e Community sono comuni. Le tabelle
  // personali prendono quindi una colonna `user`.
  "ALTER TABLE my_agents ADD COLUMN user TEXT",
  "ALTER TABLE xp_log ADD COLUMN user TEXT",
  // Le tre tabelle di progresso avevano una chiave primaria senza utente: due
  // persone non potevano completare la stessa lezione. Vanno ricreate, non
  // basta aggiungere una colonna.
  "CREATE TABLE IF NOT EXISTS learn_progress_u (user TEXT NOT NULL, path_id INTEGER NOT NULL, lesson_index INTEGER NOT NULL, done INTEGER DEFAULT 0, PRIMARY KEY (user, path_id, lesson_index))",
  "INSERT OR IGNORE INTO learn_progress_u (user,path_id,lesson_index,done) SELECT 'Mario R.',path_id,lesson_index,done FROM learn_progress",
  "DROP TABLE IF EXISTS learn_progress",
  "ALTER TABLE learn_progress_u RENAME TO learn_progress",

  "CREATE TABLE IF NOT EXISTS quiz_done_u (user TEXT NOT NULL, quiz_key TEXT NOT NULL, ts TEXT NOT NULL, PRIMARY KEY (user, quiz_key))",
  "INSERT OR IGNORE INTO quiz_done_u (user,quiz_key,ts) SELECT 'Mario R.',quiz_key,ts FROM quiz_done",
  "DROP TABLE IF EXISTS quiz_done",
  "ALTER TABLE quiz_done_u RENAME TO quiz_done",

  "CREATE TABLE IF NOT EXISTS challenges_registered_u (user TEXT NOT NULL, challenge_id TEXT NOT NULL, ts TEXT NOT NULL, PRIMARY KEY (user, challenge_id))",
  "INSERT OR IGNORE INTO challenges_registered_u (user,challenge_id,ts) SELECT 'Mario R.',challenge_id,ts FROM challenges_registered",
  "DROP TABLE IF EXISTS challenges_registered",
  "ALTER TABLE challenges_registered_u RENAME TO challenges_registered",

  // Le righe già presenti diventano di Mario R., che è l'utente con cui la
  // piattaforma è stata usata finora.
  "UPDATE my_agents SET user='Mario R.' WHERE user IS NULL",
  "UPDATE xp_log SET user='Mario R.' WHERE user IS NULL",

  // ── Connessioni riutilizzabili ──
  // Endpoint, cartelle e parametri di collegamento vivono qui invece che dentro
  // il singolo nodo: si configurano e si provano una volta, e più flussi le
  // riusano. È anche il motivo per cui una credenziale non finisce più nella
  // definizione di un agente, e quindi nei suoi export e nelle pubblicazioni.
  "CREATE TABLE IF NOT EXISTS connessioni (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT NOT NULL, nome TEXT NOT NULL, tipo TEXT NOT NULL, config_json TEXT, stato TEXT DEFAULT 'da_provare', ultimo_test TEXT, esito_test TEXT, created_at TEXT NOT NULL)",

  // Le modifiche al profilo vanno conservate: prima vivevano solo in memoria e
  // sparivano al ricaricamento.
  "CREATE TABLE IF NOT EXISTS profili (user TEXT PRIMARY KEY, role TEXT, org TEXT, bio TEXT, email TEXT, linkedin TEXT, aggiornato_il TEXT)",
  // Campi aggiunti dopo: reparto e telefono compaiono sulla scheda profilo,
  // il settore alimenta i suggerimenti del cruscotto.
  "ALTER TABLE profili ADD COLUMN reparto TEXT",
  "ALTER TABLE profili ADD COLUMN telefono TEXT",
  "ALTER TABLE profili ADD COLUMN settore TEXT",

  // Il nome mostrato e' anche la chiave con cui agenti, esecuzioni e contenuti
  // sono attribuiti: rinominarsi significa riscrivere quell'attribuzione
  // ovunque. Qui si tiene il legame stabile fra l'ACCOUNT (l'email, che non
  // cambia) e il nome scelto, cosi' un utente rinominato si ritrova con il
  // proprio nome anche dopo un nuovo accesso, invece di tornare a quello
  // scritto nel codice.
  "CREATE TABLE IF NOT EXISTS identita (email TEXT PRIMARY KEY, nome TEXT NOT NULL, aggiornato_il TEXT)",
  // Gli stati passano da 3 a 6 (D1). I valori storici vengono ricondotti ai
  // nuovi senza far sparire nulla dal catalogo.
  "UPDATE published_agents SET status='in_verifica' WHERE status='validating'",
  "UPDATE published_agents SET status='pubblicato' WHERE status='approved'",
  "UPDATE published_agents SET status='ritirato' WHERE status='rejected'",
  // Nomi omonimi già presenti: si rinomina il più vecchio invece di
  // cancellarlo — è comunque lavoro dell'utente, e con lo stesso nome
  // sarebbe irraggiungibile da loadSavedAgent, che cerca per nome.
  "UPDATE agents SET name = name || ' (' || id || ')' WHERE id NOT IN (SELECT MAX(id) FROM agents GROUP BY name)",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_name ON agents (name)"
];

// Il motore SQLite (sql.js) normalmente scarica il proprio file .wasm con
// fetch(). Se la pagina viene aperta come file locale (doppio click su
// index.html, protocollo file://) il browser blocca fetch() verso altri
// file locali per policy di sicurezza — il database non si inizializzava
// più, rompendo lo scenario "apri il file e via" che è il punto di forza
// del progetto (Cap. 3). Soluzione: il binario .wasm è incluso pre-codificato
// in base64 in lib/sqljs/sql-wasm-inline.js (SQL_WASM_BASE64) e decodificato
// qui in memoria — nessun fetch, funziona identico da file:// o da server.
function base64ToUint8Array(b64){
  var bin=atob(b64);
  var bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return bytes;
}

function initDatabase(){
  if(DB_READY)return DB_READY;
  var sqlJsConfig={locateFile:function(f){return 'lib/sqljs/'+f}};
  if(typeof SQL_WASM_BASE64!=='undefined'){
    sqlJsConfig.wasmBinary=base64ToUint8Array(SQL_WASM_BASE64).buffer;
  }
  DB_READY=initSqlJs(sqlJsConfig)
    .then(function(SQL){
      SQL_MODULE=SQL;
      return idbGet(IDB_KEY).then(function(saved){
        if(saved&&saved.byteLength){
          DB=new SQL.Database(new Uint8Array(saved));
        }else{
          DB=new SQL.Database();
        }
        SCHEMA.forEach(function(sql){DB.run(sql)});
        MIGRATIONS.forEach(function(sql){try{DB.run(sql)}catch(e){}});
        migrateFromLocalStorageOnce();
        persistDatabase();
        return DB;
      });
    });
  return DB_READY;
}

var _persistTimer=null;
function persistDatabase(){
  if(!DB)return;
  clearTimeout(_persistTimer);
  _persistTimer=setTimeout(function(){
    try{
      var data=DB.export();
      idbSet(IDB_KEY,data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength));
    }catch(e){console.error('Errore salvataggio DB',e)}
  },150);
}

function dbRun(sql,params){DB.run(sql,params||[]);persistDatabase()}

function dbAll(sql,params){
  var stmt=DB.prepare(sql);
  if(params)stmt.bind(params);
  var rows=[];
  while(stmt.step())rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function dbGetOne(sql,params){var r=dbAll(sql,params);return r.length?r[0]:null}

// Elenco usato da export/import JSON e dal reset: ogni tabella nuova va
// aggiunta qui, altrimenti resterebbe fuori dal pacchetto di uscita (D6).
var DB_TABLES=['agents','exec_log','published_agents','my_agents','kb_docs','forum_posts','forum_comments','learn_progress','quiz_done','challenges_registered','xp_log',
  'agent_versions','kb_chunks','agent_memory','publications','policies','connessioni','execution_events','recensioni','challenge_submissions','challenge_winners','challenge_questions','challenge_votes','challenge_feedback','obiettivi_config','forum_likes','forum_views','identita','profili'];

function dbInsertRow(table,row){
  // Le chiavi che iniziano con `_` sono annotazioni del pacchetto di export,
  // non colonne: `_campi_esclusi` dice quali campi sono stati tolti da una
  // connessione perche' potevano contenere una credenziale. Senza questo
  // filtro la reimportazione falliva con «no column named _campi_esclusi», e
  // le connessioni sparivano nel silenzio.
  var cols=Object.keys(row).filter(function(c){return c.charAt(0)!=='_'});
  var placeholders=cols.map(function(){return '?'}).join(',');
  dbRun('INSERT INTO '+table+' ('+cols.join(',')+') VALUES ('+placeholders+')',cols.map(function(c){return row[c]}));
}

// Migrazione una tantum: se nel browser esistono ancora i vecchi dati
// salvati con il sistema precedente (localStorage), li importa nel DB così
// nessun lavoro fatto prima di questo aggiornamento va perso.
function migrateFromLocalStorageOnce(){
  if(localStorage.getItem(LEGACY_KEYS_MIGRATED_FLAG))return;
  try{
    var now=new Date().toISOString();
    // agenti salvati: la vecchia struttura aveva solo {name,nodes,saved} +
    // un'unica copia di lavoro in relaition_builder. Recuperiamo quel poco
    // che è recuperabile: l'ultimo workflow salvato, sotto il suo nome.
    var oldAgents=JSON.parse(localStorage.getItem('relaition_agents')||'[]');
    var oldBuilder=JSON.parse(localStorage.getItem('relaition_builder')||'null');
    if(oldAgents.length&&oldBuilder){
      var lastName=oldAgents[oldAgents.length-1].name||'Agente importato';
      dbRun('INSERT INTO agents (name,nodes_json,edges_json,next_id,created_at,updated_at) VALUES (?,?,?,?,?,?)',
        [lastName,JSON.stringify(oldBuilder.nodes||[]),JSON.stringify(oldBuilder.edges||[]),oldBuilder.nextId||1,now,now]);
    }
    var oldLog=JSON.parse(localStorage.getItem('relaition_execlog')||'[]');
    oldLog.forEach(function(l){
      dbRun('INSERT INTO exec_log (agent,nodes,status,duration,mode,summary,user,ts) VALUES (?,?,?,?,?,?,?,?)',
        [l.agent,l.nodes,l.status,l.duration,l.mode,l.summary,l.user,l.ts]);
    });
    var oldPub=JSON.parse(localStorage.getItem('relaition_published')||'[]');
    oldPub.forEach(function(a){
      dbRun('INSERT INTO published_agents (name,cat,icon,color,author,rating,installs,price,desc,tags_json,workflow_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [a.name,a.cat,a.icon,a.color,a.author,a.rating||0,a.installs||0,a.price,a.desc,JSON.stringify(a.tags||[]),JSON.stringify(a.workflow||{}),now]);
    });
    var oldMy=JSON.parse(localStorage.getItem('relaition_myagents')||'[]');
    oldMy.forEach(function(m){
      dbRun('INSERT INTO my_agents (catalog_id,installed_at) VALUES (?,?)',[m.id,new Date(m.installed||Date.now()).toISOString()]);
    });
    var oldDocs=JSON.parse(localStorage.getItem('relaition_kbdocs')||'[]');
    oldDocs.forEach(function(d){
      dbRun('INSERT OR IGNORE INTO kb_docs (id,name,size,content,uploaded_at) VALUES (?,?,?,?,?)',
        [d.id,d.name,d.size,d.content,new Date(d.uploaded||Date.now()).toISOString()]);
    });
    var oldForum=JSON.parse(localStorage.getItem('relaition_forum')||'null');
    if(oldForum&&oldForum.posts){
      oldForum.posts.forEach(function(p){
        dbRun('INSERT OR IGNORE INTO forum_posts (id,user,ava,color,title,body,type,tag,likes,comments,views,time,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [p.id,p.user,p.ava,p.color,p.title,p.body,p.type,p.tag,p.likes||0,p.comments||0,p.views||0,p.time,now]);
      });
      Object.keys(oldForum.comments||{}).forEach(function(postId){
        (oldForum.comments[postId]||[]).forEach(function(c){
          dbRun('INSERT INTO forum_comments (post_id,user,ava,color,text,time,created_at) VALUES (?,?,?,?,?,?,?)',
            [parseInt(postId),c.user,c.ava,c.color,c.text,c.time,now]);
        });
      });
    }
    var oldLearn=JSON.parse(localStorage.getItem('relaition_learnprogress')||'null');
    if(oldLearn){
      Object.keys(oldLearn).forEach(function(pathId){
        (oldLearn[pathId]||[]).forEach(function(done,li){
          dbRun('INSERT OR REPLACE INTO learn_progress (path_id,lesson_index,done) VALUES (?,?,?)',[parseInt(pathId),li,done?1:0]);
        });
      });
    }
    var oldQuiz=JSON.parse(localStorage.getItem('relaition_quizdone')||'{}');
    Object.keys(oldQuiz).forEach(function(k){dbRun('INSERT OR IGNORE INTO quiz_done (quiz_key,ts) VALUES (?,?)',[k,now])});
    var oldCh=JSON.parse(localStorage.getItem('relaition_challenges')||'{}');
    Object.keys(oldCh).forEach(function(k){dbRun('INSERT OR IGNORE INTO challenges_registered (challenge_id,ts) VALUES (?,?)',[k,now])});
    var oldXp=parseInt(localStorage.getItem('relaition_xp')||'0',10);
    if(oldXp>0)dbRun('INSERT INTO xp_log (amount,reason,ts) VALUES (?,?,?)',[oldXp,'Migrazione dati precedenti',now]);
  }catch(e){console.error('Migrazione dati legacy fallita',e)}
  localStorage.setItem(LEGACY_KEYS_MIGRATED_FLAG,'1');
}

function exportDatabaseFile(){
  if(!DB){showToast('⚠️ Database non ancora pronto');return}
  var data=DB.export();
  var blob=new Blob([data],{type:'application/x-sqlite3'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;
  a.download='relaition_'+new Date().toISOString().substring(0,10)+'.sqlite';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(url)},1000);
  showToast('🗄️ Database esportato (.sqlite): apribile con qualunque client SQLite');
  if(typeof addAct==='function')addAct('Esportato database SQLite');
}

function importDatabaseFile(input){
  if(!input.files||!input.files[0])return;
  var reader=new FileReader();
  reader.onload=function(e){
    initDatabase().then(function(){
      try{
        var newDb=new SQL_MODULE.Database(new Uint8Array(e.target.result));
        newDb.exec('SELECT 1 FROM agents LIMIT 1'); // sanity check schema
        DB=newDb;
        persistDatabase();
        showToast('✅ Database importato: ricarico...');
        setTimeout(function(){location.reload()},900);
      }catch(ex){showToast('❌ File .sqlite non valido o schema incompatibile: '+ex.message)}
    });
  };
  reader.readAsArrayBuffer(input.files[0]);
}

// Scrittura IMMEDIATA su IndexedDB, con esito atteso. `persistDatabase()` e'
// volutamente ritardata di 150 ms per non riscrivere il database a ogni query;
// chi sta per ricaricare la pagina non puo' pero' permettersi quel ritardo,
// perche' il ricaricamento arriverebbe prima della scrittura e le modifiche
// appena salvate sparirebbero.
function persistDatabaseNow(){
  if(!DB)return Promise.resolve(false);
  clearTimeout(_persistTimer);
  try{
    var data=DB.export();
    return Promise.resolve(idbSet(IDB_KEY,data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)))
      .then(function(){return true})
      .catch(function(){return false});
  }catch(e){ return Promise.resolve(false) }
}
