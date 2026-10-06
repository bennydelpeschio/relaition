// ═══════════════════════════════════════════
// PRODUZIONE DI FILE REALI DAI NODI DI OUTPUT
// ═══════════════════════════════════════════
// Un nodo di output che scrive "risultato registrato" nel log non produce
// nulla di utilizzabile fuori dalla piattaforma. Qui i formati vengono
// generati davvero e il file si scarica: è ciò che rende un flusso
// end-to-end invece di una dimostrazione che si ferma all'ultimo passo.

var FILE_FORMATS=['CSV','JSON','Markdown','Testo','HTML','PDF'];
var FILE_EXT={CSV:'csv',JSON:'json',Markdown:'md',Testo:'txt',HTML:'html',PDF:'pdf'};
var FILE_MIME={CSV:'text/csv;charset=utf-8',JSON:'application/json;charset=utf-8',
  Markdown:'text/markdown;charset=utf-8',Testo:'text/plain;charset=utf-8',
  HTML:'text/html;charset=utf-8',PDF:'application/pdf'};

// Il contenuto in pipeline può essere JSON, testo libero o già tabellare.
// Riconoscerlo evita di produrre un CSV con una sola colonna che contiene
// tutto il JSON come stringa.
function foParse(testo){
  var s=String(testo==null?'':testo).trim();
  if(!s)return {tipo:'vuoto',valore:''};
  if(/^[\[{]/.test(s)){
    try{
      var j=JSON.parse(s);
      if(Array.isArray(j))return {tipo:'righe',valore:j};
      return {tipo:'oggetto',valore:j};
    }catch(e){}
  }
  return {tipo:'testo',valore:s};
}

function foEscapeCsv(v){
  var s=(v==null)?'':String(v);
  return /[";\n\r]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
}

function foToCsv(testo,sep){
  sep=sep||';';
  var d=foParse(testo);
  if(d.tipo==='righe'&&d.valore.length&&typeof d.valore[0]==='object'){
    // Unione delle chiavi di TUTTE le righe: se la prima non le ha tutte,
    // le colonne mancanti sparirebbero silenziosamente dal file.
    var cols=[];
    d.valore.forEach(function(r){Object.keys(r||{}).forEach(function(k){if(cols.indexOf(k)<0)cols.push(k)})});
    var righe=[cols.map(foEscapeCsv).join(sep)];
    d.valore.forEach(function(r){
      righe.push(cols.map(function(c){
        var v=r?r[c]:'';
        return foEscapeCsv(typeof v==='object'&&v!==null?JSON.stringify(v):v);
      }).join(sep));
    });
    return righe.join('\r\n');
  }
  if(d.tipo==='oggetto'){
    var k=Object.keys(d.valore);
    return k.map(foEscapeCsv).join(sep)+'\r\n'+k.map(function(x){
      var v=d.valore[x];
      return foEscapeCsv(typeof v==='object'&&v!==null?JSON.stringify(v):v);
    }).join(sep);
  }
  if(d.tipo==='righe')return 'valore\r\n'+d.valore.map(foEscapeCsv).join('\r\n');

  var testoPiano=String(d.valore);

  // Contenuto GIÀ tabellare (un foglio letto dal trigger, l'output di un nodo
  // che produce righe separate da ';'): va riscritto come tabella, non messo
  // in una colonna sola. Prima ogni riga finiva racchiusa fra virgolette sotto
  // un'intestazione inventata, e il file aperto in Excel era inutilizzabile.
  var rilevato=foRilevaSeparatore(testoPiano);
  if(rilevato) return foRiscriviTabella(testoPiano,rilevato,sep);

  // Elenco "Etichetta: valore" — la forma tipica dell'output di un nodo AI:
  // due colonne sono molto più utili di un muro di testo in una cella.
  var righeT=testoPiano.split(/\r?\n/).filter(function(r){return r.trim()});
  var coppie=righeT.filter(function(r){return /^[^:]{1,40}:\s*\S/.test(r)});
  if(righeT.length>=2 && coppie.length/righeT.length>=0.7){
    return ['campo','valore'].map(foEscapeCsv).join(sep)+'\r\n'+
      righeT.map(function(r){
        var i=r.indexOf(':');
        return i<0 ? foEscapeCsv(r.trim())+sep+''
                   : foEscapeCsv(r.slice(0,i).trim())+sep+foEscapeCsv(r.slice(i+1).trim());
      }).join('\r\n');
  }

  // Testo libero: una riga per riga, così resta comunque apribile in Excel.
  return 'contenuto\r\n'+testoPiano.split(/\r?\n/).map(foEscapeCsv).join('\r\n');
}

// Restituisce il separatore solo se produce lo STESSO numero di colonne sulla
// maggior parte delle righe: la sola presenza di virgole non basta, altrimenti
// qualunque frase discorsiva verrebbe scambiata per una tabella.
function foRilevaSeparatore(testo){
  var righe=testo.split(/\r?\n/).filter(function(r){return r.trim()});
  if(righe.length<2)return null;
  var trovato=null;
  [';','\t','|',','].forEach(function(s){
    if(trovato)return;
    var conteggi={},validi=0;
    righe.forEach(function(r){var c=r.split(s).length;if(c>=2){conteggi[c]=(conteggi[c]||0)+1;validi++}});
    if(validi<2)return;
    var moda=Object.keys(conteggi).sort(function(a,b){return conteggi[b]-conteggi[a]})[0];
    if(conteggi[moda]>=2 && conteggi[moda]/righe.length>=0.7) trovato=s;
  });
  return trovato;
}

// Riscrive con il separatore richiesto, rispettando le virgolette già presenti
// nell'originale invece di racchiudere l'intera riga.
function foRiscriviTabella(testo,sepIn,sepOut){
  return testo.split(/\r?\n/).filter(function(r){return r.trim()}).map(function(r){
    return foSplitRispettandoVirgolette(r,sepIn).map(function(c){
      return foEscapeCsv(c.trim().replace(/^"(.*)"$/,'$1').replace(/""/g,'"'));
    }).join(sepOut);
  }).join('\r\n');
}

function foSplitRispettandoVirgolette(riga,sep){
  var out=[],buf='',dentro=false;
  for(var i=0;i<riga.length;i++){
    var c=riga.charAt(i);
    if(c==='"'){ if(dentro&&riga.charAt(i+1)==='"'){buf+='""';i++} else dentro=!dentro; buf+=c; }
    else if(c===sep&&!dentro){ out.push(buf); buf=''; }
    else buf+=c;
  }
  out.push(buf);
  return out;
}

function foToJson(testo){
  var d=foParse(testo);
  if(d.tipo==='righe'||d.tipo==='oggetto')return JSON.stringify(d.valore,null,2);
  return JSON.stringify({contenuto:d.valore,generato:new Date().toISOString()},null,2);
}

function foToMarkdown(testo,titolo){
  var d=foParse(testo);
  var h='# '+(titolo||'Risultato esecuzione')+'\n\n_Generato da RelAItion il '+new Date().toLocaleString('it-IT')+'_\n\n';
  if(d.tipo==='righe'&&d.valore.length&&typeof d.valore[0]==='object'){
    var cols=[];
    d.valore.forEach(function(r){Object.keys(r||{}).forEach(function(k){if(cols.indexOf(k)<0)cols.push(k)})});
    h+='| '+cols.join(' | ')+' |\n|'+cols.map(function(){return '---'}).join('|')+'|\n';
    d.valore.forEach(function(r){
      h+='| '+cols.map(function(c){
        var v=r?r[c]:'';
        return String(typeof v==='object'&&v!==null?JSON.stringify(v):(v==null?'':v)).replace(/\|/g,'\\|');
      }).join(' | ')+' |\n';
    });
    return h;
  }
  if(d.tipo==='oggetto'){
    Object.keys(d.valore).forEach(function(k){
      var v=d.valore[k];
      h+='**'+k+'**: '+(typeof v==='object'&&v!==null?'\n\n```json\n'+JSON.stringify(v,null,2)+'\n```\n':String(v))+'\n\n';
    });
    return h;
  }
  // Contenuto già tabellare: diventa una tabella Markdown vera, non un blocco
  // di testo con dei punti e virgola in mezzo.
  var piano=String(d.valore);
  var sep=foRilevaSeparatore(piano);
  if(sep){
    var righe=piano.split(/\r?\n/).filter(function(r){return r.trim()})
                   .map(function(r){return foSplitRispettandoVirgolette(r,sep).map(function(c){
                     return c.trim().replace(/^"(.*)"$/,'$1').replace(/\|/g,'\\|')})});
    var nc=Math.max.apply(null,righe.map(function(r){return r.length}));
    h+='| '+righe[0].concat(new Array(nc-righe[0].length+1).join('|').split('|')).slice(0,nc).join(' | ')+' |\n';
    h+='|'+new Array(nc+1).join('---|')+'\n';
    righe.slice(1).forEach(function(r){
      while(r.length<nc)r.push('');
      h+='| '+r.join(' | ')+' |\n';
    });
    return h;
  }
  return h+piano+'\n';
}

// L'HTML si costruisce dal Markdown, ma RENDENDOLO: prima il file conteneva il
// Markdown sfuggito con dei <br>, quindi si leggevano "# Titolo" e gli
// underscore invece di un titolo e di una tabella. Il Markdown lo generiamo
// noi, quindi basta coprire i costrutti che foToMarkdown produce davvero.
function foToHtml(testo,titolo){
  var corpo=foMarkdownToHtml(foToMarkdown(testo,titolo));
  return '<!doctype html><html lang="it"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+escHtml(titolo||'Risultato')+'</title>'+
    '<style>body{font-family:system-ui,sans-serif;max-width:860px;margin:36px auto;padding:0 20px;color:#1e293b;line-height:1.6}'+
    'h1{font-size:23px;margin:0 0 4px}.meta{color:#64748b;font-size:13px;margin:0 0 22px}'+
    'table{border-collapse:collapse;width:100%;margin:16px 0;font-size:14px}'+
    'th,td{border:1px solid #e2e8f0;padding:7px 10px;text-align:left}'+
    'th{background:#f8fafc;font-weight:600}tr:nth-child(even) td{background:#fcfdfe}'+
    'code{background:#f1f5f9;padding:2px 5px;border-radius:4px}'+
    'pre{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;overflow:auto}'+
    '@media print{body{margin:0}}</style></head><body>'+corpo+'</body></html>';
}

function foMarkdownToHtml(md){
  var righe=String(md).split('\n'), out=[], i=0;
  while(i<righe.length){
    var r=righe[i];

    if(/^```/.test(r)){                       // blocco di codice
      var buf=[];i++;
      while(i<righe.length&&!/^```/.test(righe[i])){buf.push(righe[i]);i++}
      i++;
      out.push('<pre><code>'+escHtml(buf.join('\n'))+'</code></pre>');
      continue;
    }
    // Tabella: riga di intestazione seguita dalla riga dei trattini.
    if(/^\|/.test(r)&&/^\|[\s:|-]+\|?$/.test(righe[i+1]||'')){
      var celle=function(x){return x.replace(/^\||\|$/g,'').split('|').map(function(c){return c.trim()})};
      out.push('<table><thead><tr>'+celle(r).map(function(c){return '<th>'+foInline(c)+'</th>'}).join('')+'</tr></thead><tbody>');
      i+=2;
      while(i<righe.length&&/^\|/.test(righe[i])){
        out.push('<tr>'+celle(righe[i]).map(function(c){return '<td>'+foInline(c)+'</td>'}).join('')+'</tr>');
        i++;
      }
      out.push('</tbody></table>');
      continue;
    }
    var h=r.match(/^(#{1,6})\s+(.*)$/);
    if(h){ out.push('<h'+h[1].length+'>'+foInline(h[2])+'</h'+h[1].length+'>'); i++; continue }
    // La riga "_Generato da…_" è il sottotitolo del documento.
    if(/^_.+_$/.test(r.trim())){ out.push('<p class="meta">'+foInline(r.trim())+'</p>'); i++; continue }
    if(!r.trim()){ i++; continue }
    out.push('<p>'+foInline(r)+'</p>');
    i++;
  }
  return out.join('\n');
}

function foInline(s){
  return escHtml(s)
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/(^|\s)_([^_]+)_(?=\s|$)/g,'$1<em>$2</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\\\|/g,'|');
}

// ── PDF ──
// Senza librerie esterne (non scaricabili e incompatibili con l'apertura da
// file locale) il PDF viene scritto a mano: struttura 1.4 minima, font
// standard Helvetica, testo a capo calcolato su larghezza fissa. È un PDF
// valido e apribile ovunque; NON supporta immagini, tabelle o stili — ed è
// dichiarato così nelle semplificazioni.
function foPdfEscape(s){
  return String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
}

// Il font standard non è Unicode: i caratteri fuori da Latin-1 andrebbero
// persi in silenzio. Si traslitterano quelli italiani ricorrenti e si
// sostituisce il resto, invece di produrre un file dall'aspetto corrotto.
function foPdfSanitize(s){
  return String(s)
    .replace(/[‘’]/g,"'").replace(/[“”]/g,'"')
    .replace(/[–—]/g,'-').replace(/…/g,'...')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g,'');
}

function foWrap(testo,maxChars){
  var out=[];
  String(testo).split(/\r?\n/).forEach(function(riga){
    if(!riga.length){out.push('');return}
    var parole=riga.split(/\s+/),cur='';
    parole.forEach(function(p){
      if((cur+' '+p).trim().length>maxChars){ if(cur)out.push(cur); cur=p }
      else cur=(cur?cur+' ':'')+p;
    });
    if(cur)out.push(cur);
  });
  return out;
}

function foToPdf(testo,titolo){
  var righe=foWrap(foPdfSanitize(foToMarkdown(testo,titolo).replace(/[#*_`|]/g,'')),92);
  var PER_PAGINA=52, pagine=[];
  for(var i=0;i<righe.length;i+=PER_PAGINA)pagine.push(righe.slice(i,i+PER_PAGINA));
  if(!pagine.length)pagine.push(['(nessun contenuto)']);

  var oggetti=[], nPag=pagine.length;
  // 1 catalogo, 2 elenco pagine, poi per ogni pagina un oggetto pagina e uno
  // di contenuto, infine il font.
  var idFont=3+nPag*2;
  oggetti.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  var kids=[];for(var p=0;p<nPag;p++)kids.push((3+p*2)+' 0 R');
  oggetti.push('2 0 obj\n<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+nPag+' >>\nendobj\n');
  pagine.forEach(function(linee,idx){
    var idPag=3+idx*2, idCont=idPag+1;
    oggetti.push(idPag+' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] '+
      '/Resources << /Font << /F1 '+idFont+' 0 R >> >> /Contents '+idCont+' 0 R >>\nendobj\n');
    var flusso='BT\n/F1 10 Tf\n12 TL\n50 792 Td\n';
    linee.forEach(function(l){ flusso+='('+foPdfEscape(l)+') Tj\nT*\n' });
    flusso+='ET';
    oggetti.push(idCont+' 0 obj\n<< /Length '+flusso.length+' >>\nstream\n'+flusso+'\nendstream\nendobj\n');
  });
  oggetti.push(idFont+' 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');

  var pdf='%PDF-1.4\n', offsets=[];
  oggetti.forEach(function(o){ offsets.push(pdf.length); pdf+=o });
  var xref=pdf.length;
  pdf+='xref\n0 '+(oggetti.length+1)+'\n0000000000 65535 f \n';
  offsets.forEach(function(o){ pdf+=('0000000000'+o).slice(-10)+' 00000 n \n' });
  pdf+='trailer\n<< /Size '+(oggetti.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF';
  return pdf;
}

// ── GENERAZIONE E SCARICAMENTO ──
function foBuild(formato,contenuto,titolo,sep){
  switch(formato){
    case 'CSV':      return foToCsv(contenuto,sep);
    case 'JSON':     return foToJson(contenuto);
    case 'Markdown': return foToMarkdown(contenuto,titolo);
    case 'HTML':     return foToHtml(contenuto,titolo);
    case 'PDF':      return foToPdf(contenuto,titolo);
    default:         return String(contenuto==null?'':contenuto);
  }
}

function foFilename(base,formato){
  var nome=(base||'risultato').replace(/[\\/:*?"<>|]/g,'-').replace(/\.\w{2,5}$/,'');
  var data=new Date().toISOString().substring(0,19).replace(/[:T]/g,'-');
  return nome+'_'+data+'.'+(FILE_EXT[formato]||'txt');
}

// Costruisce il file nella forma corretta per il suo formato. Vive in un punto
// solo perché le due strade — scaricare e scrivere su cartella sincronizzata —
// devono produrre lo STESSO file: prima la scrittura su Drive passava dal
// costruttore generico e salvava il PDF come UTF-8, cioè corrotto.
function foBlob(nome,mime,contenuto){
  // Il PDF è testo con byte Latin-1: passarlo come UTF-8 corromperebbe le
  // lunghezze dichiarate nel file e alcuni lettori lo rifiuterebbero.
  if(/pdf$/i.test(nome)){
    var bytes=new Uint8Array(contenuto.length);
    for(var i=0;i<contenuto.length;i++)bytes[i]=contenuto.charCodeAt(i)&0xFF;
    return new Blob([bytes],{type:mime});
  }
  // Il BOM serve a Excel: senza, un CSV con accenti si apre con i caratteri
  // corrotti, ed è il primo formato in cui la gente guarda il risultato.
  var bom=/csv$/i.test(nome)?'﻿':'';
  return new Blob([bom+contenuto],{type:mime});
}

function foDownload(nome,mime,contenuto){
  var blob=foBlob(nome,mime,contenuto);
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download=nome;document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(url);a.remove()},1500);
  return blob.size;
}

// Chiamata dal runtime quando un nodo "Esporta file" viene eseguito.
function foEmitFromNode(node,contenuto,interattivo){
  var cfg=node.config||{};
  var formato=cfg.format||'CSV';
  var nome=foFilename(cfg.filename||node.name,formato);
  var dati=foBuild(formato,contenuto,cfg.title||currentAgentName,cfg.separator||';');
  var dest=cfg.destination||'Scarica sul computer';
  var esito={nome:nome,byte:dati.length,contenuto:dati,scaricato:false,inKB:false};

  // In esecuzione pianificata il browser non può avviare un download senza un
  // gesto dell'utente: il file resta comunque disponibile dal registro, e lo
  // si dichiara invece di far credere che sia stato salvato.
  if(interattivo&&(dest==='Scarica sul computer'||dest==='Entrambe')){
    esito.byte=foDownload(nome,FILE_MIME[formato]||'text/plain',dati);
    esito.scaricato=true;
  }

  // Salvataggio nella Knowledge Base: l'output di un flusso diventa fonte per
  // quelli successivi, il che è il caso d'uso che rende utile un archivio
  // interno invece di un file che finisce in Download e si perde.
  if((dest==='Salva nella Knowledge Base'||dest==='Entrambe')&&typeof dbRun==='function'){
    if(formato==='PDF'){
      esito.notaKB='PDF non indicizzabile come testo: nella Knowledge Base è stata salvata la versione Markdown';
      var perKB=foBuild('Markdown',contenuto,cfg.title||currentAgentName);
      esito.idKB=foSaveToKB(nome.replace(/\.pdf$/,'.md'),perKB,node);
    }else{
      esito.idKB=foSaveToKB(nome,dati,node);
    }
    esito.inKB=!!esito.idKB;
  }

  // Scrittura su cartella/cloud. È l'unica parte asincrona dell'emissione: il
  // permesso e la creazione delle sottocartelle passano da promesse. Il motore
  // attende `esito.promessa` prima di chiudere il nodo, così il registro
  // riporta l'esito vero della scrittura e non un ottimismo.
  var vuoleCloud = (node.name==='Salva su cloud') || dest==='Salva su cloud / cartella';
  if(vuoleCloud){
    esito.promessa=foScriviSuCloud(node,nome,dati,formato,esito,interattivo);
  }
  return esito;
}

function foScriviSuCloud(node,nome,dati,formato,esito,interattivo){
  var cfg=node.config||{};
  var chiave=(typeof cloudDestKey==='function')?cloudDestKey(cfg):'cartella';
  var d=csDestinazione(chiave);
  esito.cloudServizio=d.l;

  // Il ramo dichiaratamente simulato non tocca il disco e non finge di averlo
  // fatto: l'esito porta il marchio `simulato` fino al registro esecuzioni.
  if(!d.reale){
    var s=csSimulaCaricamento(chiave,cfg.cloudPath,nome);
    esito.cloudSimulato=true;
    esito.cloudPercorso=s.percorso;
    esito.cloudUrl=s.url;
    esito.cloudNota=s.nota;
    return Promise.resolve(esito);
  }

  if(!csSupportata()){
    // Nessuna scrittura possibile: si ripiega sul download, ma lo si dichiara.
    esito.cloudErrore=csMotivoNonSupportata();
    if(interattivo&&!esito.scaricato){
      esito.byte=foDownload(nome,FILE_MIME[formato]||'text/plain',dati);
      esito.scaricato=true;
      esito.cloudNota='Scritto in Download al posto della cartella.';
    }
    return Promise.resolve(esito);
  }

  // Si passa il Blob già costruito per il formato: scriverlo come testo
  // semplice avrebbe salvato un PDF corrotto sulla cartella sincronizzata.
  // Cartella e percorso vengono dalla connessione scelta, se c'è: è lì che si
  // configurano una volta sola e si provano.
  var dest=(typeof connCartellaDelNodo==='function')
    ? connCartellaDelNodo(cfg) : {alias:cfg.cloudAlias,percorso:cfg.cloudPath};
  return csScrivi(dest.alias,dest.percorso,nome,
                  foBlob(nome,FILE_MIME[formato]||'text/plain',dati),
                  FILE_MIME[formato]||'text/plain')
    .then(function(r){
      esito.cloudPercorso=r.percorso;
      esito.cloudScritto=true;
      if(r.note&&r.note.length)esito.cloudNota=r.note.join(' ');
      if(cfg.alsoDownload==='Sì'&&interattivo&&!esito.scaricato){
        esito.byte=foDownload(nome,FILE_MIME[formato]||'text/plain',dati);
        esito.scaricato=true;
      }
      return esito;
    },function(err){
      esito.cloudErrore=err.message||String(err);
      return esito;
    });
}

// Il documento entra nella KB con la provenienza dichiarata: sapere che un
// contenuto è stato prodotto da un agente, e da quale, cambia il peso che gli
// si dà quando ricompare come fonte di un altro flusso.
function foSaveToKB(nome,contenuto,node){
  try{
    var id='doc_out_'+Date.now()+'_'+Math.floor(Math.random()*9999);
    dbRun('INSERT INTO kb_docs (id,name,size,content,uploaded_at,business_unit,confidentiality,source_type,origin) VALUES (?,?,?,?,?,?,?,?,?)',
      [id,nome,contenuto.length,contenuto,new Date().toISOString(),
       (node.config&&node.config.kbBusinessUnit)||'Tutte','interno','non_strutturato',
       'agente: '+(typeof currentAgentName!=='undefined'?currentAgentName:'flusso')]);
    if(typeof kbIndexDocument==='function')kbIndexDocument(id);
    return id;
  }catch(e){return null}
}

// File prodotti nell'ultima esecuzione, per poterli riscaricare dal registro
// anche dopo che la finestra si è chiusa.
var LAST_RUN_FILES=[];
function foRedownload(idx){
  var f=LAST_RUN_FILES[idx];
  if(!f){showToast('⚠️ File non più disponibile');return}
  foDownload(f.nome,f.mime,f.contenuto);
  showToast('📥 '+f.nome+' scaricato');
}
