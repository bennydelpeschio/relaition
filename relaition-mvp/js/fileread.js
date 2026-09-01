// ══════════════════════════════════════════════════════════════
// ESTRAZIONE TESTO DA FILE REALI
// ══════════════════════════════════════════════════════════════
// Prima di questo modulo ogni allegato veniva letto con readAsText: per un .txt
// funziona, per un PDF o un .docx il modello riceveva byte binari e rispondeva
// a caso. Qui il testo viene estratto davvero, senza librerie esterne e senza
// backend, appoggiandosi a DecompressionStream — presente in tutti i browser
// moderni — per lo scompattamento zip/zlib.

var FR_MAX_BYTES = 8 * 1024 * 1024;   // 8 MB: oltre, l'estrazione blocca la UI

// Formati riconosciuti dall'estensione. La firma binaria viene comunque
// ricontrollata dentro frExtract: un .pdf rinominato .txt non deve ingannarci.
var FR_TIPI = {
  txt:'testo', md:'testo', csv:'testo', tsv:'testo', json:'testo',
  xml:'testo', html:'testo', htm:'testo', log:'testo', yml:'testo', yaml:'testo',
  pdf:'pdf', docx:'docx', xlsx:'xlsx', pptx:'pptx'
};

function frEstensione(nome){
  var m = String(nome||'').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

// ── Scompattamento ────────────────────────────────────────────
// DecompressionStream è asincrono e lavora su stream: questo wrapper lo rende
// una semplice funzione da byte a byte.
function frInflate(bytes, formato){
  if(typeof DecompressionStream === 'undefined')
    return Promise.reject(new Error('Il browser non espone DecompressionStream: impossibile leggere file compressi.'));
  var ds = new DecompressionStream(formato);
  var w = ds.writable.getWriter();
  w.write(bytes); w.close();
  return new Response(ds.readable).arrayBuffer().then(function(b){ return new Uint8Array(b) });
}

// ── Lettura ZIP (docx, xlsx, pptx) ────────────────────────────
// Si legge il "central directory" in coda al file invece di scorrere gli header
// locali: solo lì le dimensioni sono sempre valorizzate (negli header locali
// possono essere rimandate al data descriptor e valere zero).
function frZipVoci(buf){
  var dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  var eocd = -1;
  for(var i = buf.length - 22; i >= 0 && i > buf.length - 65558; i--){
    if(dv.getUint32(i, true) === 0x06054b50){ eocd = i; break }
  }
  if(eocd < 0) throw new Error('Archivio ZIP non valido o troncato.');

  var n = dv.getUint16(eocd + 10, true);
  var p = dv.getUint32(eocd + 16, true);
  var voci = [];
  for(var k = 0; k < n && p + 46 <= buf.length; k++){
    if(dv.getUint32(p, true) !== 0x02014b50) break;
    var metodo   = dv.getUint16(p + 10, true);
    var compresso= dv.getUint32(p + 20, true);
    var lunNome  = dv.getUint16(p + 28, true);
    var lunExtra = dv.getUint16(p + 30, true);
    var lunComm  = dv.getUint16(p + 32, true);
    var offset   = dv.getUint32(p + 42, true);
    var nome     = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + lunNome));
    voci.push({nome:nome, metodo:metodo, compresso:compresso, offset:offset});
    p += 46 + lunNome + lunExtra + lunComm;
  }
  return {voci:voci, dv:dv};
}

function frZipLeggi(buf, z, voce){
  // L'header locale ripete nome ed extra con lunghezze proprie: vanno rilette
  // da qui, perché l'extra locale spesso differisce da quello centrale.
  var lunNome  = z.dv.getUint16(voce.offset + 26, true);
  var lunExtra = z.dv.getUint16(voce.offset + 28, true);
  var inizio   = voce.offset + 30 + lunNome + lunExtra;
  var dati     = buf.subarray(inizio, inizio + voce.compresso);
  if(voce.metodo === 0) return Promise.resolve(dati);          // memorizzato
  if(voce.metodo === 8) return frInflate(dati, 'deflate-raw'); // deflate
  return Promise.reject(new Error('Metodo di compressione ZIP non supportato: ' + voce.metodo));
}

function frZipTesto(buf, z, nomeVoce){
  var v = z.voci.filter(function(x){ return x.nome === nomeVoce })[0];
  if(!v) return Promise.resolve('');
  return frZipLeggi(buf, z, v).then(function(b){ return new TextDecoder().decode(b) });
}

// ── DOCX ──────────────────────────────────────────────────────
// word/document.xml contiene il corpo. Si preservano i confini di paragrafo
// (</w:p>) e le interruzioni di riga, altrimenti il testo arriva al modello
// come un unico blocco illeggibile.
function frDocx(buf){
  var z = frZipVoci(buf);
  return frZipTesto(buf, z, 'word/document.xml').then(function(xml){
    if(!xml) throw new Error('Il .docx non contiene word/document.xml.');
    return frPulisciXml(xml
      .replace(/<w:tab[^>]*\/>/g, '\t')
      .replace(/<w:br[^>]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n'));
  });
}

function frPulisciXml(xml){
  return xml.replace(/<[^>]+>/g, '')
            .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
            .replace(/&quot;/g,'"').replace(/&apos;/g,"'")
            .replace(/&#(\d+);/g, function(_,d){ return String.fromCharCode(+d) })
            .replace(/&amp;/g,'&')          // per ultimo: altrimenti riespande
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
}

// ── XLSX ──────────────────────────────────────────────────────
// Le celle di testo non contengono la stringa ma un indice nella tabella
// condivisa sharedStrings.xml: senza risolverla si otterrebbero solo numeri.
// L'uscita è CSV, il formato che i nodi AI e la Knowledge Base già sanno leggere.
function frXlsx(buf){
  var z = frZipVoci(buf);
  return frZipTesto(buf, z, 'xl/sharedStrings.xml').then(function(ss){
    var condivise = [];
    if(ss){
      var si = ss.match(/<si>[\s\S]*?<\/si>/g) || [];
      condivise = si.map(function(b){
        return (b.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [])
          .map(function(t){ return frPulisciXml(t) }).join('');
      });
    }
    var fogli = z.voci.filter(function(v){ return /^xl\/worksheets\/sheet\d+\.xml$/.test(v.nome) })
                      .sort(function(a,b){ return a.nome.localeCompare(b.nome, undefined, {numeric:true}) });
    if(!fogli.length) throw new Error('Il .xlsx non contiene fogli di lavoro.');

    return fogli.reduce(function(catena, f){
      return catena.then(function(acc){
        return frZipTesto(buf, z, f.nome).then(function(xml){
          return acc.concat([{nome:f.nome, righe:frXlsxFoglio(xml, condivise)}]);
        });
      });
    }, Promise.resolve([])).then(function(fs){
      return fs.map(function(f, i){
        // Niente intestazione Markdown: un "###" faceva classificare il foglio
        // come procedura invece che come tabella.
        var testa = fs.length > 1 ? '[Foglio ' + (i+1) + ']\n' : '';
        return testa + f.righe.join('\n');
      }).join('\n\n').trim();
    });
  });
}

function frXlsxFoglio(xml, condivise){
  var righe = xml.match(/<row[^>]*>[\s\S]*?<\/row>/g) || [];
  return righe.map(function(r){
    var celle = r.match(/<c[^>]*(?:\/>|>[\s\S]*?<\/c>)/g) || [];
    var out = [];
    celle.forEach(function(c){
      // L'attributo r ("B7") dà la colonna: le celle vuote non sono scritte nel
      // file, quindi senza questo le colonne si disallineerebbero.
      var rif = (c.match(/\sr="([A-Z]+)\d+"/) || [])[1];
      if(rif){
        var idx = 0;
        for(var i = 0; i < rif.length; i++) idx = idx * 26 + (rif.charCodeAt(i) - 64);
        while(out.length < idx - 1) out.push('');
      }
      var tipo = (c.match(/\st="([^"]+)"/) || [])[1];
      var v;
      if(tipo === 'inlineStr'){
        v = frPulisciXml((c.match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[0] || '');
      } else {
        var raw = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        v = raw == null ? '' : (tipo === 's' ? (condivise[+raw] || '') : raw);
      }
      out.push(String(v).indexOf(';') >= 0 ? '"' + v.replace(/"/g,'""') + '"' : v);
    });
    return out.join(';');
  }).filter(function(r){ return r.replace(/;/g,'').trim() !== '' });
}

// ── PPTX ──────────────────────────────────────────────────────
function frPptx(buf){
  var z = frZipVoci(buf);
  var slide = z.voci.filter(function(v){ return /^ppt\/slides\/slide\d+\.xml$/.test(v.nome) })
                    .sort(function(a,b){ return a.nome.localeCompare(b.nome, undefined, {numeric:true}) });
  if(!slide.length) throw new Error('Il .pptx non contiene slide.');
  return slide.reduce(function(catena, s, i){
    return catena.then(function(acc){
      return frZipTesto(buf, z, s.nome).then(function(xml){
        var t = frPulisciXml(xml.replace(/<\/a:p>/g, '\n'));
        return acc.concat(['## Slide ' + (i+1) + '\n' + t]);
      });
    });
  }, Promise.resolve([])).then(function(a){ return a.join('\n\n') });
}

// ── PDF ───────────────────────────────────────────────────────
// Estrazione a basso livello: si scompattano gli stream di contenuto e si
// leggono gli operatori di testo Tj/TJ. Funziona sui PDF generati da software
// di produttività; NON funziona su scansioni (immagini senza testo) né su font
// con codifica CID personalizzata. Il caso di fallimento viene riconosciuto e
// dichiarato all'utente invece di consegnare simboli casuali al modello.
function frPdf(buf){
  var raw = frLatin1(buf);
  var stream = frPdfStream(raw);
  if(!stream.length) return Promise.reject(new Error('PDF senza stream leggibili.'));

  // I PDF dalla versione 1.5 impacchettano gli oggetti — font, ToUnicode,
  // strutture di pagina — dentro "object stream" a loro volta compressi. Gli
  // stream vanno quindi prima tutti scompattati, e solo dopo si può capire
  // quali contengono testo e quali le tabelle di decodifica dei caratteri.
  return stream.reduce(function(catena, s){
    return catena.then(function(acc){
      if(s.immagine) return acc;                     // niente OCR nel browser
      var dati = buf.subarray(s.inizio, s.fine);
      if(!s.compresso) return acc.concat([frLatin1(dati)]);
      // Uno stream corrotto o con filtro inatteso non deve far fallire tutto
      // il documento: si scarta quello e si prosegue con gli altri.
      return frInflate(dati, 'deflate').then(function(d){ return acc.concat([frLatin1(d)]) },
                                             function(){ return acc });
    });
  }, Promise.resolve([])).then(function(parti){
    // Le tabelle ToUnicode possono trovarsi in qualunque stream, anche dopo il
    // contenuto che servono a decodificare: si raccolgono prima, tutte insieme.
    var mappa = {};
    parti.forEach(function(p){ if(p.indexOf('beginbfchar')>=0 || p.indexOf('beginbfrange')>=0) frToUnicode(p, mappa); });

    var testo = parti.map(function(p){ return frPdfTesto(p, mappa) })
                     .filter(function(t){ return t.trim() }).join('\n');
    testo = frPdfRipulisci(testo);

    if(!testo || !frLeggibile(testo))
      throw new Error('PDF non estraibile: è probabilmente una scansione (pagine come immagini), e nel browser non c\'è riconoscimento ottico. Converti il file in Word o testo e ricaricalo.');
    return testo;
  });
}

// Individua gli stream veri. La parola "stream" compare anche dentro
// "endstream": contarla come inizio di un nuovo stream sfalsava tutte le
// posizioni successive e il documento usciva illeggibile. Qui si scarta quel
// caso e si legge il dizionario risalendo all'inizio dell'oggetto, invece di
// sbirciare un numero fisso di caratteri all'indietro.
function frPdfStream(raw){
  var out = [], re = /stream[ \t]*\r?\n?/g, m;
  while((m = re.exec(raw)) !== null){
    if(raw.substr(m.index - 3, 3) === 'end'){ re.lastIndex = m.index + 6; continue; }
    var inizio = m.index + m[0].length;
    var fine = raw.indexOf('endstream', inizio);
    if(fine < 0){ re.lastIndex = m.index + 6; continue; }

    var apertura = raw.lastIndexOf(' obj', m.index);
    var dizionario = raw.slice(apertura > 0 ? apertura : Math.max(0, m.index - 600), m.index);
    out.push({
      inizio: inizio,
      fine: frPdfFineDati(raw, inizio, fine),
      compresso: /\/Fl(ate)?(Decode)?\b/.test(dizionario),
      immagine: /\/Subtype\s*\/Image/.test(dizionario)
    });
    re.lastIndex = fine;
  }
  return out;
}

// Fra i dati e "endstream" lo scrittore inserisce un fine riga che non fa parte
// dello stream: lasciarlo dentro fa fallire lo scompattatore su alcuni file.
function frPdfFineDati(raw, inizio, fine){
  var f = fine;
  while(f > inizio && (raw.charCodeAt(f-1) === 10 || raw.charCodeAt(f-1) === 13)) f--;
  return f;
}

// ── Tabelle ToUnicode ─────────────────────────────────────────
// I PDF prodotti da Word incorporano sottoinsiemi di font in cui il codice del
// carattere NON è il suo valore Unicode: senza questa tabella il testo esce
// come sequenza di simboli casuali. È la ragione per cui un PDF reale falliva
// mentre quelli generati dall'app funzionavano.
function frToUnicode(contenuto, mappa){
  var bf = /beginbfchar([\s\S]*?)endbfchar/g, m;
  while((m = bf.exec(contenuto)) !== null){
    var coppie = m[1].match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || [];
    coppie.forEach(function(c){
      var p = c.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      mappa[parseInt(p[1], 16)] = frUtf16(p[2]);
    });
  }
  var br = /beginbfrange([\s\S]*?)endbfrange/g;
  while((m = br.exec(contenuto)) !== null){
    // Forma a intervallo: <inizio> <fine> <primoUnicode>, incrementale.
    var righe = m[1].match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) || [];
    righe.forEach(function(r){
      var p = r.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/);
      var da = parseInt(p[1],16), a = parseInt(p[2],16), base = parseInt(p[3],16);
      if(a - da > 65535) return;                    // intervallo assurdo: si ignora
      for(var i = da; i <= a; i++) mappa[i] = String.fromCharCode(base + (i - da));
    });
    // Forma a elenco: <inizio> <fine> [ <u1> <u2> … ]
    var elenchi = m[1].match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/g) || [];
    elenchi.forEach(function(e){
      var p = e.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/);
      var da = parseInt(p[1],16);
      (p[3].match(/<([0-9A-Fa-f]+)>/g) || []).forEach(function(u, i){
        mappa[da + i] = frUtf16(u.slice(1,-1));
      });
    });
  }
  return mappa;
}

// I PDF usano WinAnsiEncoding, non Latin-1: nell'intervallo 0x80–0x9F stanno
// virgolette e trattini tipografici, che letti come Latin-1 diventano caratteri
// di controllo e sparivano dal testo — "l'art. 9" usciva come "lart. 9",
// cambiando le parole che il modello avrebbe poi analizzato.
var FR_WINANSI = {
  0x80:'€',0x82:'‚',0x83:'ƒ',0x84:'„',0x85:'…',0x86:'†',0x87:'‡',0x88:'ˆ',0x89:'‰',
  0x8A:'Š',0x8B:'‹',0x8C:'Œ',0x8E:'Ž',0x91:'‘',0x92:'’',0x93:'“',0x94:'”',
  0x95:'•',0x96:'–',0x97:'—',0x98:'˜',0x99:'™',0x9A:'š',0x9B:'›',0x9C:'œ',0x9E:'ž',0x9F:'Ÿ'
};

function frWinAnsi(s){
  return s.replace(/[\x80-\x9F]/g, function(c){ return FR_WINANSI[c.charCodeAt(0)] || '' })
          // Il pallino degli elenchi puntati arriva dal font Symbol e vive
          // nell'area a uso privato: senza conversione resterebbe un quadratino.
          .replace(//g, '• ');
}

function frUtf16(hex){
  var s = '';
  for(var i = 0; i + 3 < hex.length + 1; i += 4) s += String.fromCharCode(parseInt(hex.substr(i,4), 16));
  return s || String.fromCharCode(parseInt(hex, 16));
}

// Gli operatori PDF che producono testo: (testo) Tj, [(a) -250 (b)] TJ per il
// kerning, e le varianti con stringhe esadecimali <0048> usate dai font a
// sottoinsieme. Un salto di riga si deduce da T*/Td/TD.
function frPdfTesto(contenuto, mappa){
  if(!/\b(Tj|TJ)\b/.test(contenuto)) return '';    // non è uno stream di testo
  var out = [];
  var re = /\[((?:[^\][\\]|\\.)*)\]\s*TJ|(\((?:[^()\\]|\\.)*\))\s*Tj|(<[0-9A-Fa-f\s]*>)\s*Tj|(-?[\d.]+)\s+(-?[\d.]+)\s+(Td|TD)|(T\*)/g, m;
  while((m = re.exec(contenuto)) !== null){
    // Td sposta di (tx, ty): con ty a zero si resta sulla STESSA riga, ed è solo
    // un salto orizzontale — trattarlo come fine riga spezzava le parole a metà
    // ("secondo li / vello"), rovinando proprio il testo da far analizzare.
    if(m[6] != null){ out.push(parseFloat(m[5]) === 0 ? ' ' : '\n'); continue }
    if(m[7] != null){ out.push('\n'); continue }
    if(m[1] != null){
      // Dentro un array TJ si alternano stringhe e spostamenti: uno spostamento
      // molto negativo è uno spazio fra parole che nel PDF non è scritto.
      var pezzi = m[1].match(/\((?:[^()\\]|\\.)*\)|<[0-9A-Fa-f\s]*>|-?\d+(?:\.\d+)?/g) || [];
      pezzi.forEach(function(p){
        if(p.charAt(0) === '(' || p.charAt(0) === '<') out.push(frPdfPezzo(p, mappa));
        else if(parseFloat(p) < -120) out.push(' ');
      });
    } else if(m[2] != null){ out.push(frPdfPezzo(m[2], mappa));
    } else if(m[3] != null){ out.push(frPdfPezzo(m[3], mappa)); }
  }
  return out.join('');
}

function frPdfPezzo(p, mappa){
  if(p.charAt(0) === '<'){
    // Stringa esadecimale: due byte per carattere quando esiste una tabella di
    // decodifica, uno solo altrimenti.
    var hex = p.slice(1, -1).replace(/\s+/g, '');
    var passo = (mappa && Object.keys(mappa).length) ? 4 : 2;
    var s = '';
    for(var i = 0; i + passo <= hex.length; i += passo){
      var c = parseInt(hex.substr(i, passo), 16);
      s += (mappa && mappa[c] != null) ? mappa[c] : String.fromCharCode(c);
    }
    return s;
  }
  var grezzo = frWinAnsi(frPdfStringa(p.slice(1, -1)));
  if(!mappa || !Object.keys(mappa).length) return grezzo;
  // Anche le stringhe fra parentesi passano dalla tabella quando il font è un
  // sottoinsieme: i codici sono glifi, non caratteri.
  var conv = '', trovati = 0;
  for(var k = 0; k < grezzo.length; k++){
    var cc = grezzo.charCodeAt(k);
    if(mappa[cc] != null){ conv += mappa[cc]; trovati++; } else conv += grezzo.charAt(k);
  }
  return trovati > grezzo.length / 2 ? conv : grezzo;
}

// Il testo esce con una riga per riga di layout: si ricompongono i paragrafi e
// si tolgono le righe vuote lasciate dagli spostamenti senza testo.
function frPdfRipulisci(t){
  return t.replace(/[ \t]+/g, ' ')
          .split('\n').map(function(r){ return r.trim() })
          .filter(function(r, i, a){ return r !== '' || (a[i-1] && a[i-1] !== '') })
          .join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
}

function frPdfStringa(s){
  return s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, function(_, c){
    var mappa = {n:'\n', r:'\r', t:'\t', b:'\b', f:'\f', '(':'(', ')':')', '\\':'\\'};
    return mappa[c] != null ? mappa[c] : String.fromCharCode(parseInt(c, 8));
  });
}

function frLatin1(bytes){
  var s = '', blocco = 32768;   // a blocchi: apply() su array enormi va in overflow
  for(var i = 0; i < bytes.length; i += blocco)
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + blocco));
  return s;
}

// Un'estrazione riuscita è fatta in larga maggioranza di lettere, cifre e
// punteggiatura. Se prevalgono i simboli, il testo è spazzatura: meglio dirlo.
function frLeggibile(t){
  var campione = t.slice(0, 4000);
  var buoni = (campione.match(/[a-zA-Z0-9àèéìòùÀÈÉÌÒÙ\s.,;:!?'"()\-–—%€$/@#\n]/g) || []).length;
  return buoni / campione.length > 0.75;
}

// ── Punto d'ingresso unico ────────────────────────────────────
// Restituisce {testo, tipo, note} oppure rifiuta con un messaggio comprensibile.
function frExtract(file){
  if(file.size > FR_MAX_BYTES)
    return Promise.reject(new Error('File troppo grande (' + frKb(file.size) + '): il limite è ' + frKb(FR_MAX_BYTES) + '.'));

  var ext = frEstensione(file.name);
  return file.arrayBuffer().then(function(ab){
    var buf = new Uint8Array(ab);
    var tipo = frFirma(buf) || FR_TIPI[ext] || 'testo';

    if(tipo === 'zip'){
      // Firma ZIP generica: il formato vero lo dice l'estensione, perché
      // docx, xlsx e pptx condividono lo stesso contenitore.
      tipo = FR_TIPI[ext] === 'docx' || FR_TIPI[ext] === 'xlsx' || FR_TIPI[ext] === 'pptx'
             ? FR_TIPI[ext] : 'zip-ignoto';
    }

    if(tipo === 'pdf')   return frPdf(buf).then(function(t){ return {testo:t, tipo:'PDF'} });
    if(tipo === 'docx')  return frDocx(buf).then(function(t){ return {testo:t, tipo:'Word'} });
    if(tipo === 'xlsx')  return frXlsx(buf).then(function(t){ return {testo:t, tipo:'Excel (convertito in CSV)'} });
    if(tipo === 'pptx')  return frPptx(buf).then(function(t){ return {testo:t, tipo:'PowerPoint'} });
    if(tipo === 'zip-ignoto')
      return Promise.reject(new Error('Archivio compresso non supportato. Sono leggibili .docx, .xlsx e .pptx.'));
    if(tipo === 'binario')
      return Promise.reject(new Error('File binario non testuale: il modello non potrebbe analizzarlo. Formati supportati: PDF, Word, Excel, PowerPoint, testo, CSV, JSON, Markdown.'));

    var t = new TextDecoder('utf-8').decode(buf);
    return {testo:t, tipo:'Testo (' + (ext || 'senza estensione') + ')'};
  });
}

// Riconoscimento dai primi byte: l'estensione mente, la firma no.
function frFirma(b){
  if(b.length < 4) return null;
  if(b[0]===0x25 && b[1]===0x50 && b[2]===0x44 && b[3]===0x46) return 'pdf';            // %PDF
  if(b[0]===0x50 && b[1]===0x4B && (b[2]===3 || b[2]===5 || b[2]===7)) return 'zip';    // PK
  if(b[0]===0xD0 && b[1]===0xCF) return 'binario';                                      // .doc/.xls legacy
  if(b[0]===0x89 && b[1]===0x50) return 'binario';                                      // PNG
  if(b[0]===0xFF && b[1]===0xD8) return 'binario';                                      // JPEG
  return null;
}

function frKb(n){
  return n < 1024*1024 ? Math.round(n/1024) + ' KB' : (Math.round(n/1024/1024*10)/10) + ' MB';
}

// ══════════════════════════════════════════════════════════════
// LETTURA DI PIU' FILE: CARTELLE LOCALI E INDIRIZZI WEB
// ══════════════════════════════════════════════════════════════
// Un flusso che analizza documenti raramente ne analizza uno solo: piu' spesso
// deve passare in rassegna una cartella. Qui l'estrazione singola diventa un
// lotto, con tre accortezze che contano piu' della funzione stessa:
//   1. un limite al numero di file e alla dimensione complessiva, altrimenti
//      una cartella grande blocca l'interfaccia e satura la memoria;
//   2. i file illeggibili non fermano il lotto: vengono elencati a parte;
//   3. il testo raccolto viene troncato prima di raggiungere il modello, con
//      il conteggio di cio' che e' stato lasciato fuori.

var FR_MAX_FILE_LOTTO = 25;                  // file per esecuzione
var FR_MAX_BYTE_LOTTO = 20 * 1024 * 1024;    // 20 MB complessivi

// Legge ricorsivamente una cartella scelta con la File System Access API.
// La profondita' e' limitata: una cartella annidata all'infinito farebbe
// crescere la scansione senza che nessuno se ne accorga.
async function frFileDaCartella(handle, filtro, profonditaMax, profondita){
  profondita = profondita || 0;
  var trovati = [];
  if(profondita > (profonditaMax === undefined ? 2 : profonditaMax)) return trovati;

  for await (var voce of handle.values()){
    if(trovati.length >= FR_MAX_FILE_LOTTO * 4) break;   // margine prima del filtro
    if(voce.kind === 'file'){
      if(filtro && !filtro(voce.name)) continue;
      trovati.push(voce);
    }else if(voce.kind === 'directory'){
      var dentro = await frFileDaCartella(voce, filtro, profonditaMax, profondita + 1);
      trovati = trovati.concat(dentro);
    }
  }
  return trovati;
}

// Filtro per estensione, dichiarato come elenco separato da virgole.
// Vuoto significa "tutti i formati che sappiamo leggere", non "tutti i file":
// includere binari illeggibili produrrebbe solo una lista di errori.
function frFiltroEstensioni(spec){
  var estensioni = String(spec || '').split(',').map(function(s){
    return s.trim().toLowerCase().replace(/^\./,'');
  }).filter(Boolean);
  return function(nome){
    var e = frEstensione(nome);
    if(!e) return false;
    if(estensioni.length) return estensioni.indexOf(e) >= 0;
    return !!FR_TIPI[e];
  };
}

// Estrae il testo da un elenco di file, fermandosi ai limiti dichiarati.
// Restituisce sempre un resoconto completo: cosa e' stato letto, cosa saltato
// e perche'. Un lotto che fallisce a meta' senza dirlo e' peggio di uno che
// non parte.
async function frEstraiLotto(files, opzioni){
  opzioni = opzioni || {};
  var maxFile = opzioni.maxFile || FR_MAX_FILE_LOTTO;
  var documenti = [], scartati = [], byteTotali = 0;

  for(var i = 0; i < files.length; i++){
    if(documenti.length >= maxFile){
      scartati.push({nome:'(' + (files.length - i) + ' file successivi)',
                     motivo:'raggiunto il limite di ' + maxFile + ' file per esecuzione'});
      break;
    }
    var f = files[i];
    // Un handle della File System Access API va aperto per diventare un File.
    try{ if(typeof f.getFile === 'function') f = await f.getFile() }
    catch(e){ scartati.push({nome:files[i].name, motivo:'permesso negato sul file'}); continue }

    if(byteTotali + f.size > FR_MAX_BYTE_LOTTO){
      scartati.push({nome:f.name, motivo:'superato il limite complessivo di ' + frKb(FR_MAX_BYTE_LOTTO)});
      continue;
    }
    try{
      var r = await frExtract(f);
      documenti.push({nome:f.name, tipo:r.tipo, testo:r.testo, caratteri:r.testo.length});
      byteTotali += f.size;
    }catch(err){
      scartati.push({nome:f.name, motivo:err.message || String(err)});
    }
  }
  return {documenti:documenti, scartati:scartati, byte:byteTotali};
}

// Compone i documenti letti in un unico testo per il modello, con
// un'intestazione per ciascuno: senza, il modello non potrebbe attribuire
// un'informazione al documento da cui viene.
function frComponiLotto(esito, maxCaratteri){
  var limite = maxCaratteri || 60000;
  var parti = [], usati = 0, troncati = 0;

  esito.documenti.forEach(function(d){
    var testa = '\n===== DOCUMENTO: ' + d.nome + ' (' + d.tipo + ') =====\n';
    var spazio = limite - usati - testa.length;
    if(spazio <= 0){ troncati++; return }
    var corpo = d.testo.length > spazio ? d.testo.substring(0, spazio) + '\n[…troncato]' : d.testo;
    parti.push(testa + corpo);
    usati += testa.length + corpo.length;
  });

  var testo = parti.join('\n');
  var note = [];
  if(troncati) note.push(troncati + ' documento/i non inclusi per limite di lunghezza');
  if(esito.scartati.length) note.push(esito.scartati.length + ' file non leggibili');
  return {testo:testo, note:note, inclusi:parti.length};
}

// ── Da indirizzi web ──────────────────────────────────────────
// Un browser puo' scaricare solo da server che lo consentono esplicitamente
// (CORS). Non e' un limite di RelAItion: e' una regola di sicurezza del
// browser, e va detta prima, non scoperta come errore di rete.
async function frFileDaUrl(url, nomeSuggerito){
  var risposta = await fetch(url, {mode:'cors'});
  if(!risposta.ok) throw new Error('Il server ha risposto ' + risposta.status + ' ' + risposta.statusText);
  var blob = await risposta.blob();
  if(blob.size > FR_MAX_BYTES) throw new Error('File troppo grande (' + frKb(blob.size) + ')');
  var nome = nomeSuggerito || decodeURIComponent(String(url).split('/').pop().split('?')[0]) || 'documento';
  return new File([blob], nome, {type:blob.type});
}

async function frEstraiDaUrls(elenco){
  var righe = String(elenco || '').split('\n').map(function(s){return s.trim()}).filter(Boolean);
  var documenti = [], scartati = [];
  for(var i = 0; i < righe.length && documenti.length < FR_MAX_FILE_LOTTO; i++){
    var u = righe[i];
    try{
      var f = await frFileDaUrl(u);
      var r = await frExtract(f);
      documenti.push({nome:f.name, tipo:r.tipo, testo:r.testo, caratteri:r.testo.length});
    }catch(err){
      var msg = err.message || String(err);
      // L'errore di rete di un browser non dice "CORS": lo si spiega, perche'
      // e' di gran lunga la causa piu' frequente.
      if(/Failed to fetch|NetworkError/i.test(msg))
        msg = 'Il server non consente il download da una pagina web (CORS), oppure l\u2019indirizzo non e\u0300 raggiungibile.';
      scartati.push({nome:u.length > 60 ? u.substring(0,60) + '…' : u, motivo:msg});
    }
  }
  return {documenti:documenti, scartati:scartati, byte:0};
}

// ══════════════════════════════════════════════════════════════
// PANNELLO: SORGENTE DEI DOCUMENTI
// ══════════════════════════════════════════════════════════════
// Tre sorgenti, una sola resa: qualunque sia l'origine, ai nodi a valle arriva
// lo stesso testo composto. Cambia solo da dove viene.

function frPannelloSorgente(nid,n){
  var cfg=n.config||{};
  var modo=cfg.sorgente||'File singolo';
  var esito=cfg.lottoEsito;

  var testa='<div class="prop-group"><div class="prop-label">📚 Sorgente dei documenti</div>'+
    '<select class="prop-select" onchange="updConfig('+nid+',\'sorgente\',this.value)">'+
      ['File singolo','Cartella sul computer','Indirizzi web'].map(function(o){
        return '<option'+(modo===o?' selected':'')+'>'+o+'</option>'}).join('')+
    '</select></div>';

  if(modo==='Cartella sul computer'){
    if(!csSupportata()){
      return testa+'<div class="prop-group"><div style="font-size:10.5px;color:#991B1B;background:#FEE2E2;border-radius:6px;padding:8px 10px;line-height:1.5">'+
        escHtml(csMotivoNonSupportata())+' Usa «File singolo» oppure «Indirizzi web».</div></div>';
    }
    return testa+
      '<div class="prop-group"><div class="prop-label">Formati da includere</div>'+
        '<input class="prop-input" value="'+escHtml(cfg.filtro||'')+'" placeholder="pdf, docx (vuoto = tutti i leggibili)" '+
        'onchange="updConfig('+nid+',\'filtro\',this.value)"></div>'+
      '<div class="prop-group"><div class="prop-label">Sottocartelle</div>'+
        '<select class="prop-select" onchange="updConfig('+nid+',\'profondita\',this.value)">'+
          ['Solo questa cartella','Un livello','Due livelli'].map(function(o){
            return '<option'+((cfg.profondita||'Un livello')===o?' selected':'')+'>'+o+'</option>'}).join('')+
        '</select></div>'+
      '<button class="tb-btn" style="width:100%" onclick="frScegliCartellaDocumenti('+nid+')">📂 Scegli la cartella e leggi</button>'+
      frResocontoLotto(esito)+
      '<div style="font-size:10px;color:var(--tx4);margin-top:6px;line-height:1.45">Massimo '+FR_MAX_FILE_LOTTO+' file e '+frKb(FR_MAX_BYTE_LOTTO)+' per esecuzione: oltre, la lettura bloccherebbe l\u2019interfaccia.</div>';
  }

  if(modo==='Indirizzi web'){
    return testa+
      '<div class="prop-group"><div class="prop-label">Indirizzi, uno per riga</div>'+
        '<textarea class="prop-input" rows="4" placeholder="https://esempio.it/contratto.pdf" '+
        'onchange="updConfig('+nid+',\'urls\',this.value)">'+escHtml(cfg.urls||'')+'</textarea></div>'+
      '<button class="tb-btn" style="width:100%" onclick="frLeggiDaUrls('+nid+')">🌐 Scarica e leggi</button>'+
      frResocontoLotto(esito)+
      '<div style="font-size:10px;color:#B45309;background:#FEF3C7;border-radius:6px;padding:7px 9px;margin-top:6px;line-height:1.45">'+
        '⚠️ Il browser scarica solo da server che lo consentono esplicitamente (CORS). Molti siti non lo permettono: in quel caso scarica il file e usa «File singolo».</div>';
  }
  return testa;
}

function frResocontoLotto(e){
  if(!e)return '';
  return '<div style="margin-top:8px;font-size:10.5px;line-height:1.5">'+
    '<div style="color:#047857">✅ '+e.inclusi+' documento/i letti — '+e.caratteri.toLocaleString('it-IT')+' caratteri</div>'+
    (e.elenco&&e.elenco.length
      ? '<details style="margin-top:4px"><summary style="color:var(--tx4);cursor:pointer">Documenti inclusi</summary>'+
        '<div style="max-height:110px;overflow:auto;margin-top:4px">'+e.elenco.map(function(d){
          return '<div style="color:var(--tx3);padding:2px 0">📄 '+escHtml(d)+'</div>'}).join('')+'</div></details>'
      : '')+
    (e.scartati&&e.scartati.length
      ? '<details style="margin-top:4px"><summary style="color:#B45309;cursor:pointer">'+e.scartati.length+' non letti</summary>'+
        '<div style="max-height:110px;overflow:auto;margin-top:4px">'+e.scartati.map(function(s){
          return '<div style="color:var(--tx4);padding:3px 0">⚠️ '+escHtml(s.nome)+' — '+escHtml(s.motivo)+'</div>'}).join('')+'</div></details>'
      : '')+
  '</div>';
}

// Registra l'esito nel nodo: il testo composto diventa il payload del trigger,
// esattamente come per un file singolo.
function frRegistraLotto(nid,composto,esito,origine){
  var n=B.nodes.find(function(x){return x.id===nid});
  if(!n)return;
  if(!n.config)n.config={};
  n.config.filedata=composto.testo;
  n.config.filename=origine;
  n.config.filetipo=composto.inclusi+' documenti';
  n.config.filestato=composto.inclusi?'pronto':'errore';
  if(!composto.inclusi)n.config.fileerrore='Nessun documento leggibile fra quelli indicati.';
  n.config.lottoEsito={inclusi:composto.inclusi,caratteri:composto.testo.length,
    elenco:esito.documenti.map(function(d){return d.nome+' ('+d.tipo+', '+d.caratteri.toLocaleString('it-IT')+' car.)'}),
    scartati:esito.scartati};
  renderProps(nid);
  showToast(composto.inclusi?('📚 '+composto.inclusi+' documento/i letti'):'⚠️ Nessun documento leggibile');
}

async function frScegliCartellaDocumenti(nid){
  var n=B.nodes.find(function(x){return x.id===nid});
  if(!n)return;
  var cfg=n.config||{};
  try{
    var handle=await window.showDirectoryPicker({mode:'read',id:'relaition-docs'});
    showToast('📂 Scansione di "'+handle.name+'"…');
    var prof={'Solo questa cartella':0,'Un livello':1,'Due livelli':2}[cfg.profondita||'Un livello'];
    var files=await frFileDaCartella(handle,frFiltroEstensioni(cfg.filtro),prof);
    if(!files.length){showToast('Nessun file leggibile in "'+handle.name+'"');return}
    var esito=await frEstraiLotto(files);
    frRegistraLotto(nid,frComponiLotto(esito),esito,handle.name+' ('+esito.documenti.length+' file)');
  }catch(err){
    if(err&&err.name==='AbortError')return;
    showToast('Lettura non riuscita: '+(err.message||err));
  }
}

async function frLeggiDaUrls(nid){
  var n=B.nodes.find(function(x){return x.id===nid});
  if(!n||!n.config||!String(n.config.urls||'').trim()){showToast('Inserisci almeno un indirizzo');return}
  showToast('🌐 Scaricamento in corso…');
  var esito=await frEstraiDaUrls(n.config.urls);
  frRegistraLotto(nid,frComponiLotto(esito),esito,'indirizzi web ('+esito.documenti.length+' file)');
}
