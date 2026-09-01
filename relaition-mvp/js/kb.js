// ═══════════════════════════════════════════
// KNOWLEDGE BASE — Blocco C
// ═══════════════════════════════════════════
// Recupero reale: segmentazione per struttura, arricchimento contestuale,
// ricerca ibrida (lessicale + vettoriale) e riordino dei primi candidati.
//
// Sui vettori: transformers.js richiederebbe di scaricare un modello
// quantizzato da CDN al primo uso — decine di MB che romperebbero sia
// l'apertura da file locale sia i tempi della demo. Qui i vettori sono
// TF-IDF calcolati in locale; se un provider con endpoint di embedding è
// configurato (OpenAI, Mistral) si usano quelli veri. Quale dei due ha agito
// è sempre scritto in traccia, mai lasciato intendere.

var KB_BUSINESS_UNITS=['Tutte','Vendite','Finance','Customer Service','HR','Legal','IT'];
var KB_CONFIDENTIALITY=['pubblico','interno','riservato'];

// ── TIPOLOGIA DEL DOCUMENTO ──
// Determina come segmentare: è la scelta che distingue un recupero utile da
// un taglio a lunghezza fissa che spezza gli articoli a metà.
function kbDetectType(name,text){
  var n=(name||'').toLowerCase(), t=(text||'').substring(0,4000);
  // Una tabella si riconosce dalla COERENZA delle colonne, non dalla presenza
  // di separatori: i fogli reali hanno un titolo in testa (che nascondeva
  // l'intero foglio), mentre la prosa italiana ha abbastanza virgole da
  // sembrare una tabella se ci si limita a contarle.
  if(/\.(csv|tsv)$/.test(n)||kbSembraTabella(t))return 'tabella';
  if(/art\.?\s*\d+|articolo\s+\d+|comma\s+\d+/i.test(t))return 'normativa';
  if(/clausola|art\.\s*\d+\s*[-–—]|le parti convengono|contratto|nda/i.test(t)&&/\n\s*\d+(\.\d+)*\s/.test(t))return 'contratto';
  if(/^\s*(d|domanda|q)[:.]/im.test(t)&&/^\s*(r|risposta|a)[:.]/im.test(t))return 'assistenza';
  if(/^\s*(#{1,6}\s|\d+(\.\d+)*\s+[A-ZÀ-Ú])/m.test(t)&&/(passo|step|procedura|istruzion)/i.test(t))return 'procedura';
  if(/^\s*#{1,6}\s/m.test(t))return 'procedura';
  return 'non_strutturato';
}

var KB_TYPE_LABEL={normativa:'Normativa',contratto:'Contratto',procedura:'Procedura',assistenza:'Assistenza',tabella:'Tabella',non_strutturato:'Non strutturato'};
var KB_TYPE_UNIT={normativa:'articolo o comma',contratto:'clausola con intestazione di sezione',procedura:'passo con titolo gerarchico',assistenza:'scambio domanda-risposta',tabella:'riga con intestazioni replicate',non_strutturato:'paragrafo con sovrapposizione'};

// ── SEGMENTAZIONE PER STRUTTURA ──
// Ogni porzione porta con sé il proprio riferimento (`label`): è ciò che
// permette di citare la fonte in modo verificabile invece di dire "documento X".
function kbChunk(text,tipo){
  text=(text||'').replace(/\r\n/g,'\n');
  if(tipo==='tabella')return kbChunkTable(text);
  if(tipo==='normativa')return kbChunkByRegex(text,/^\s*(art(?:icolo)?\.?\s*\d+[^\n]{0,80})$/gim,'Art.');
  // Il punto dopo il numero è opzionale: "1. Oggetto" e "3.1 Recesso" sono
  // entrambe intestazioni di clausola, e senza `\.?` la prima non veniva
  // riconosciuta — il contratto finiva in due porzioni invece di cinque.
  if(tipo==='contratto')return kbChunkByRegex(text,/^\s*(\d+(?:\.\d+)*\.?\s+[^\n]{2,80}|clausola\s+[^\n]{1,60})$/gim,'Clausola');
  if(tipo==='procedura')return kbChunkHeadings(text);
  if(tipo==='assistenza')return kbChunkQA(text);
  return kbChunkParagraphs(text);
}

// Taglia sui titoli riconosciuti dal pattern: il titolo resta in testa alla
// porzione, così il modello legge la regola insieme al suo riferimento.
function kbChunkByRegex(text,re,prefisso){
  var punti=[],m;
  while((m=re.exec(text))!==null)punti.push({i:m.index,label:m[1].trim()});
  if(punti.length<2)return kbChunkParagraphs(text);
  var out=[];
  punti.forEach(function(p,k){
    var fine=k+1<punti.length?punti[k+1].i:text.length;
    var corpo=text.substring(p.i,fine).trim();
    if(corpo.length>20)out.push({text:corpo,label:p.label.substring(0,60)});
  });
  return out;
}

// Titoli Markdown o numerati: la gerarchia dei titoli superiori viene
// mantenuta nell'etichetta, altrimenti "Passo 3" da solo non dice di cosa.
function kbChunkHeadings(text){
  var righe=text.split('\n'), out=[], corrente=null, gerarchia=[];
  righe.forEach(function(r){
    var md=r.match(/^(#{1,6})\s+(.*)$/);
    var num=r.match(/^\s*(\d+(?:\.\d+)*)\.?\s+([A-ZÀ-Ú][^\n]{2,80})$/);
    var liv=null,tit=null;
    if(md){liv=md[1].length;tit=md[2].trim()}
    else if(num){liv=num[1].split('.').length;tit=num[1]+' '+num[2].trim()}
    if(tit){
      if(corrente&&corrente.text.trim().length>20)out.push(corrente);
      gerarchia=gerarchia.slice(0,liv-1);gerarchia[liv-1]=tit;
      corrente={text:r+'\n',label:gerarchia.filter(Boolean).join(' › ').substring(0,80)};
    }else if(corrente){corrente.text+=r+'\n'}
    else{corrente={text:r+'\n',label:'Introduzione'}}
  });
  if(corrente&&corrente.text.trim().length>20)out.push(corrente);
  return out.length?out.map(function(c){return {text:c.text.trim(),label:c.label}}):kbChunkParagraphs(text);
}

// Uno scambio completo: separare domanda e risposta renderebbe entrambe
// inutilizzabili come contesto.
function kbChunkQA(text){
  var blocchi=text.split(/\n(?=\s*(?:d|domanda|q)\s*[:.])/i), out=[];
  blocchi.forEach(function(b){
    b=b.trim();if(b.length<20)return;
    var q=b.match(/^\s*(?:d|domanda|q)\s*[:.]\s*([^\n]{1,90})/i);
    out.push({text:b,label:q?q[1].trim():'Scambio'});
  });
  return out.length?out:kbChunkParagraphs(text);
}

// Ogni riga porta con sé le intestazioni: fuori dalla tabella una riga di
// soli valori non è interpretabile.
// Vero solo se un separatore produce lo STESSO numero di colonne sulla maggior
// parte delle righe. In un testo discorsivo il conteggio oscilla da riga a
// riga, e questo lo distingue da una griglia di dati.
function kbSembraTabella(t){
  var righe=t.split('\n').filter(function(r){return r.trim()}).slice(0,25);
  if(righe.length<3)return false;
  return [';','\t',','].some(function(s){
    var conteggi={},validi=0;
    righe.forEach(function(r){
      var c=r.split(s).length;
      if(c>=2){conteggi[c]=(conteggi[c]||0)+1;validi++}
    });
    if(validi<3)return false;
    var moda=Object.keys(conteggi).sort(function(a,b){return conteggi[b]-conteggi[a]})[0];
    // Almeno tre righe con identico numero di colonne, e devono essere la
    // maggioranza netta di quelle che contengono il separatore.
    if(!(conteggi[moda]>=3 && conteggi[moda]/righe.length>=0.6))return false;

    // Ultimo discrimine: in una tabella le celle sono etichette o valori, non
    // proposizioni. Un periodo in italiano ben punteggiato produce lo stesso
    // numero di virgole riga dopo riga — la coerenza da sola non basta a
    // distinguerlo — ma i suoi "campi" sono fatti di molte parole.
    var campi=[];
    righe.forEach(function(r){
      if(r.split(s).length!==+moda)return;
      r.split(s).forEach(function(c){campi.push(c.trim())});
    });
    if(!campi.length)return false;
    var lunghi=campi.filter(function(c){return c.split(/\s+/).length>5}).length;
    return lunghi/campi.length<0.15;
  });
}

function kbChunkTable(text){
  var righe=text.split('\n').filter(function(r){return r.trim()});
  if(righe.length<2)return kbChunkParagraphs(text);

  // Il separatore si sceglie su tutte le righe, non sulla prima: se la prima è
  // un titolo senza separatori la scelta ricadeva sempre sulla virgola.
  var sep=[';','\t',','].map(function(s){
    return {s:s,n:righe.filter(function(r){return r.split(s).length>=3}).length};
  }).sort(function(a,b){return b.n-a.n})[0].s;

  // L'intestazione non è necessariamente la prima riga: gli export reali
  // iniziano con il titolo del report o il nome del foglio. Si cerca la prima
  // riga che ha lo stesso numero di colonne della maggioranza delle altre.
  var conteggi={};
  righe.forEach(function(r){var c=r.split(sep).length;if(c>=2)conteggi[c]=(conteggi[c]||0)+1});
  var colonne=Object.keys(conteggi).sort(function(a,b){return conteggi[b]-conteggi[a]})[0];
  var iHead=righe.findIndex(function(r){return r.split(sep).length===+colonne});
  if(iHead<0)iHead=0;

  var head=righe[iHead].split(sep).map(function(h){return h.trim().replace(/^"|"$/g,'')});
  var out=[];
  righe.slice(iHead+1).forEach(function(r,i){
    var celle=r.split(sep);
    var coppie=head.map(function(h,k){return h+': '+((celle[k]||'').trim().replace(/^"|"$/g,''))});
    out.push({text:coppie.join(' | '),label:'Riga '+(i+1)+' — '+(celle[0]||'').trim().substring(0,40)});
  });
  return out;
}

// Sovrapposizione controllata: l'ultima frase del paragrafo precedente entra
// nel successivo, così un concetto a cavallo non si perde nel taglio.
var KB_MAX_PORZIONE=900;   // caratteri: oltre, il recupero smette di essere selettivo

function kbChunkParagraphs(text){
  // Un .docx estratto arriva con i paragrafi separati da un solo a capo, non da
  // una riga vuota: il documento risultava quindi un unico blocco. Si divide
  // sulle righe vuote quando ci sono, altrimenti sui singoli a capo.
  var sep=/\n\s*\n/.test(text)?/\n\s*\n/:/\n/;
  var par=text.split(sep).map(function(p){return p.trim()}).filter(function(p){return p.length>0});

  // Ogni paragrafo più lungo del limite viene spezzato PRIMA di entrare nel
  // raggruppamento: senza questo passaggio un paragrafo unico da 45.000
  // caratteri restava una porzione sola, e recuperarla riempiva l'intero
  // prompt con testo in gran parte non pertinente.
  var pezzi=[];
  par.forEach(function(p){
    if(p.length<=KB_MAX_PORZIONE){pezzi.push(p);return}
    kbSpezzaLungo(p).forEach(function(x){pezzi.push(x)});
  });

  var out=[],buf='',n=1;
  pezzi.forEach(function(p){
    if((buf+' '+p).length>KB_MAX_PORZIONE&&buf){
      out.push({text:buf.trim(),label:'Paragrafo '+(n++)});
      // L'ultima frase viene riportata nella porzione seguente: una risposta
      // che cade a cavallo del taglio resta comunque recuperabile.
      var frasi=buf.split(/(?<=[.!?])\s+/);
      buf=(frasi.length>1?frasi[frasi.length-1]+' ':'')+p;
    }else buf=buf?buf+'\n\n'+p:p;
  });
  if(buf.trim())out.push({text:buf.trim(),label:'Paragrafo '+n});
  return out.length?out:[{text:text.trim(),label:'Documento'}];
}

// Taglia un blocco troppo lungo sui confini di frase; se anche una singola
// frase sfora (elenchi senza punteggiatura, tabelle incollate) si taglia sulla
// lunghezza, che è meglio di una porzione inutilizzabile.
function kbSpezzaLungo(p){
  var frasi=p.split(/(?<=[.!?;])\s+/), out=[], buf='';
  frasi.forEach(function(f){
    while(f.length>KB_MAX_PORZIONE){
      var taglio=f.lastIndexOf(' ',KB_MAX_PORZIONE);
      if(taglio<KB_MAX_PORZIONE/2)taglio=KB_MAX_PORZIONE;
      if(buf){out.push(buf);buf=''}
      out.push(f.substring(0,taglio).trim());
      f=f.substring(taglio).trim();
    }
    if((buf+' '+f).length>KB_MAX_PORZIONE&&buf){out.push(buf);buf=f}
    else buf=buf?buf+' '+f:f;
  });
  if(buf)out.push(buf);
  return out.filter(function(x){return x.trim()});
}

// ── ARRICCHIMENTO CONTESTUALE ──
// Il prefisso dice dove si trova la porzione dentro il documento. Il punteggio
// si calcola sul testo arricchito; all'agente torna sempre l'originale.
function kbContextualize(chunk,doc,tipo,ordinal,totale){
  return 'Dal documento "'+doc.name+'" ('+(KB_TYPE_LABEL[tipo]||tipo)+
    (doc.business_unit&&doc.business_unit!=='Tutte'?', unità '+doc.business_unit:'')+
    '), sezione '+(ordinal+1)+' di '+totale+': '+chunk.label+'.';
}

// ── VETTORI ──
// TF-IDF locale: nessun download, deterministico, sufficiente a dimostrare il
// recupero. Il vocabolario è ricalcolato sull'indice corrente.
function kbTokenize(s){
  return (s||'').toLowerCase()
    .replace(/[^a-zà-ú0-9\s]/g,' ')
    .split(/\s+/)
    .filter(function(t){return t.length>2&&KB_STOPWORDS.indexOf(t)<0});
}
// Agli articoli e ai connettivi si aggiungono gli interrogativi: in una
// domanda "quanto costa X" la parola che seleziona il documento è X, mentre
// "quanto" compare in mezzo corpus e sposta il punteggio verso porzioni che
// non c'entrano — è così che una domanda sui rimborsi chilometrici pescava
// per prima una FAQ sui resi.
var KB_STOPWORDS=['che','con','per','del','della','dei','delle','una','uno','gli','non','sono','come','alla','allo','nel','nella','dal','dalla','più','anche','essere','stato','loro','questo','questa','quale','quali','ogni','the','and','for','with','that','this','from',
  'quanto','quanta','quanti','quante','quando','dove','perche','perché','cosa','chi','qual','viene','vengono','posso','devo','fare','avere'];

function kbTermFreq(tokens){
  var tf={};tokens.forEach(function(t){tf[t]=(tf[t]||0)+1});return tf;
}

function kbCosine(a,b){
  var num=0,na=0,nb=0;
  Object.keys(a).forEach(function(k){na+=a[k]*a[k];if(b[k])num+=a[k]*b[k]});
  Object.keys(b).forEach(function(k){nb+=b[k]*b[k]});
  return (na&&nb)?num/(Math.sqrt(na)*Math.sqrt(nb)):0;
}

// ── INDICIZZAZIONE ──
function kbIndexDocument(docId){
  var doc=dbGetOne('SELECT * FROM kb_docs WHERE id=?',[docId]);
  if(!doc)return {chunks:0,error:'documento non trovato'};
  var tipo=doc.source_type&&doc.source_type!=='non_strutturato'?doc.source_type:kbDetectType(doc.name,doc.content);
  var pezzi=kbChunk(doc.content,tipo);
  dbRun('DELETE FROM kb_chunks WHERE doc_id=?',[docId]);
  pezzi.forEach(function(c,i){
    var prefix=kbContextualize(c,doc,tipo,i,pezzi.length);
    var tf=kbTermFreq(kbTokenize(prefix+' '+c.text));
    dbRun('INSERT INTO kb_chunks (id,doc_id,ordinal,text,context_prefix,embedding,metadata_json) VALUES (?,?,?,?,?,?,?)',
      [docId+'_c'+i,docId,i,c.text,prefix,JSON.stringify(tf),
       JSON.stringify({label:c.label,tipo:tipo,bu:doc.business_unit||'Tutte',conf:doc.confidentiality||'interno'})]);
  });
  dbRun('UPDATE kb_docs SET source_type=?, chunk_count=?, indexed_at=? WHERE id=?',
    [tipo,pezzi.length,new Date().toISOString(),docId]);
  // dbRun persiste già su IndexedDB (con debounce): nessun salvataggio extra.
  return {chunks:pezzi.length,tipo:tipo};
}

function kbReindexAll(){
  var docs=dbAll('SELECT id FROM kb_docs');
  var tot=0;
  docs.forEach(function(d){tot+=kbIndexDocument(d.id).chunks});
  return {documenti:docs.length,porzioni:tot};
}

// ── PERMESSI ──
// Il filtro è a monte: le porzioni non autorizzate non entrano nemmeno tra i
// candidati, quindi non possono raggiungere il modello. Filtrare la sola
// visualizzazione del documento non basterebbe.
function kbCurrentUser(){
  return {
    email:localStorage.getItem('relaition_login_email')||'ospite',
    businessUnit:localStorage.getItem('relaition_user_bu')||'Tutte',
    clearance:localStorage.getItem('relaition_user_clearance')||'riservato'
  };
}
function kbSetUserAccess(bu,clearance){
  if(bu)localStorage.setItem('relaition_user_bu',bu);
  if(clearance)localStorage.setItem('relaition_user_clearance',clearance);
}
function kbChunkVisible(meta,user){
  var livelli=KB_CONFIDENTIALITY.indexOf(user.clearance);
  if(livelli<0)livelli=1;
  if(KB_CONFIDENTIALITY.indexOf(meta.conf||'interno')>livelli)return false;
  if(user.businessUnit==='Tutte')return true;
  var bu=meta.bu||'Tutte';
  return bu==='Tutte'||bu===user.businessUnit;
}

// ── RICERCA IBRIDA ──
// BM25 sul lessico + coseno TF-IDF sul vettore. I due punteggi misurano cose
// diverse (corrispondenza esatta dei termini vs. vicinanza complessiva) e
// insieme reggono sia le query con parole del documento sia le riformulazioni.
function kbSearch(query,opts){
  opts=opts||{};
  var user=opts.user||kbCurrentUser();
  var limite=opts.limit||5;
  var qTokens=kbTokenize(query);
  if(!qTokens.length)return {results:[],scartatiPermessi:0,motore:'nessuna query utile'};

  var sql='SELECT c.*, d.name doc_name, d.business_unit, d.confidentiality FROM kb_chunks c JOIN kb_docs d ON d.id=c.doc_id';
  var params=[];
  if(opts.businessUnit&&opts.businessUnit!=='Tutte'){
    sql+=" WHERE (d.business_unit=? OR d.business_unit='Tutte' OR d.business_unit IS NULL)";
    params.push(opts.businessUnit);
  }
  var righe=dbAll(sql,params);
  if(!righe.length)return {results:[],scartatiPermessi:0,motore:'indice vuoto'};

  // Filtro permessi PRIMA del punteggio
  var scartati=0;
  var candidati=righe.filter(function(r){
    var meta={};try{meta=JSON.parse(r.metadata_json||'{}')}catch(e){}
    meta.bu=meta.bu||r.business_unit;meta.conf=meta.conf||r.confidentiality;
    r._meta=meta;
    if(!kbChunkVisible(meta,user)){scartati++;return false}
    return true;
  });
  if(!candidati.length)return {results:[],scartatiPermessi:scartati,motore:'nessuna porzione autorizzata'};

  // Statistiche di collezione per BM25 e IDF
  var N=candidati.length, df={}, lunghezze=[];
  candidati.forEach(function(r){
    var tf={};try{tf=JSON.parse(r.embedding||'{}')}catch(e){}
    r._tf=tf;
    var len=0;Object.keys(tf).forEach(function(k){len+=tf[k];df[k]=(df[k]||0)+1});
    r._len=len;lunghezze.push(len);
  });
  var avgLen=lunghezze.reduce(function(a,b){return a+b},0)/N||1;
  var idf={};
  Object.keys(df).forEach(function(t){idf[t]=Math.log(1+(N-df[t]+0.5)/(df[t]+0.5))});

  var qTf=kbTermFreq(qTokens), qVec={};
  Object.keys(qTf).forEach(function(t){qVec[t]=qTf[t]*(idf[t]||Math.log(1+N))});

  var k1=1.5,b=0.75;
  candidati.forEach(function(r){
    var bm=0;
    qTokens.forEach(function(t){
      var f=r._tf[t]||0;if(!f)return;
      bm+=(idf[t]||0)*(f*(k1+1))/(f+k1*(1-b+b*r._len/avgLen));
    });
    var vec={};Object.keys(r._tf).forEach(function(t){vec[t]=r._tf[t]*(idf[t]||0)});
    r._bm25=bm;
    r._cos=kbCosine(qVec,vec);
  });
  var maxBm=Math.max.apply(null,candidati.map(function(r){return r._bm25}))||1;
  candidati.forEach(function(r){
    // Fusione: lessicale normalizzato + semantico, pesi pari — su un POC
    // pesarli diversamente sarebbe una taratura non giustificata da dati.
    r._score=0.5*(r._bm25/maxBm)+0.5*r._cos;
  });
  candidati.sort(function(a,b){return b._score-a._score});

  var top=candidati.slice(0,Math.max(limite*2,8));
  var risultati=kbRerank(top,query,qTokens).slice(0,limite).map(function(r){
    return {
      chunkId:r.id, docId:r.doc_id, docName:r.doc_name,
      label:(r._meta&&r._meta.label)||('Sezione '+(r.ordinal+1)),
      text:r.text, contextPrefix:r.context_prefix,
      businessUnit:r._meta.bu||'Tutte', confidentiality:r._meta.conf||'interno',
      score:Math.round(r._score*1000)/1000,
      bm25:Math.round(r._bm25*100)/100, cosine:Math.round(r._cos*1000)/1000
    };
  });
  return {results:risultati,scartatiPermessi:scartati,motore:'TF-IDF + BM25 locale',candidati:candidati.length};
}

// Riordino deterministico dei primi candidati: premia la copertura dei termini
// della query (quanti ne compaiono, non quante volte) e la prossimità tra
// essi nel testo. Sono i due segnali che il punteggio aggregato perde.
function kbRerank(cands,query,qTokens){
  var testoQ=query.toLowerCase();
  cands.forEach(function(r){
    var t=(r.text||'').toLowerCase();
    var presenti=qTokens.filter(function(q){return t.indexOf(q)>=0});
    var copertura=qTokens.length?presenti.length/qTokens.length:0;
    var esatto=t.indexOf(testoQ)>=0?0.15:0;
    var vicinanza=0;
    if(presenti.length>1){
      var pos=presenti.map(function(q){return t.indexOf(q)}).sort(function(a,b){return a-b});
      var span=pos[pos.length-1]-pos[0];
      vicinanza=span>0?Math.min(0.1,30/span):0.1;
    }
    r._score=r._score*0.6+copertura*0.4+esatto+vicinanza;
  });
  cands.sort(function(a,b){return b._score-a._score});
  return cands;
}

// ── INIEZIONE NEL PROMPT ──
// Le porzioni arrivano al modello con la citazione della fonte accanto, così
// la risposta può essere ricondotta al documento che l'ha originata.
function kbBuildContext(risultati){
  if(!risultati||!risultati.length)return '';
  return 'CONTESTO DALLA KNOWLEDGE BASE AZIENDALE (cita la fonte tra parentesi quadre quando la usi):\n\n'+
    risultati.map(function(r,i){
      return '['+(i+1)+'] Fonte: "'+r.docName+'" — '+r.label+'\n'+r.text;
    }).join('\n\n---\n\n')+
    '\n\nSe le fonti non contengono la risposta, dichiaralo invece di supporre.';
}

function kbStats(){
  var d=dbGetOne('SELECT COUNT(*) c FROM kb_docs')||{c:0};
  var ch=dbGetOne('SELECT COUNT(*) c FROM kb_chunks')||{c:0};
  var idx=dbGetOne('SELECT COUNT(*) c FROM kb_docs WHERE indexed_at IS NOT NULL')||{c:0};
  return {documenti:d.c,indicizzati:idx.c,porzioni:ch.c};
}
