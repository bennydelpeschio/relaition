// ══════════════════════════════════════════════════════════════
// CONNESSIONI — INTERFACCIA
// ══════════════════════════════════════════════════════════════
// Separata dalla logica (js/connessioni.js) perché sono due cose diverse:
// lì si stabilisce cosa significa provare una connessione, qui si mostra.

function openConnessioni(){
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center">'+
      '<h2>\ud83d\udd0c Connessioni</h2><button class="modal-close" onclick="closeModal()">\u2715</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 16px;line-height:1.6">'+
      'Configura qui endpoint, cartelle e collegamenti: si provano una volta e pi\u00f9 nodi li riusano. '+
      'Cos\u00ec una credenziale non finisce dentro la definizione di un agente, e quindi nei suoi export.</p>'+
    '<div id="connLista"></div>'+
    '<div style="border-top:1px solid var(--bo);margin-top:18px;padding-top:14px">'+
      '<div style="font-size:11px;font-weight:700;color:var(--tx4);text-transform:uppercase;letter-spacing:.04em;margin-bottom:9px">Aggiungi una connessione</div>'+
      '<div class="conn-tipi">'+
        Object.keys(CONN_TIPI).map(function(t){
          var d=CONN_TIPI[t];
          return '<button class="conn-tipo" onclick="connNuova(\''+t+'\')">'+
            '<span class="ci">'+d.icona+'</span>'+
            '<span style="min-width:0">'+
              '<span class="cn">'+escHtml(d.label.split(' (')[0])+
                (d.nota?' <span class="conn-sim">'+escHtml(d.nota)+'</span>':'')+'</span>'+
              '<span class="cd">'+escHtml(d.descrizione||'')+'</span>'+
            '</span></button>';
        }).join('')+
      '</div></div>'
  );
  renderConnessioni();
}

function renderConnessioni(){
  var box=document.getElementById('connLista');
  if(!box)return;
  var elenco=connElenco();
  if(!elenco.length){
    box.innerHTML='<div style="text-align:center;padding:30px 18px;background:var(--bg2);border:1px dashed var(--bo2);border-radius:11px">'+
      '<div style="font-size:26px;line-height:1">\ud83d\udd0c</div>'+
      '<div style="font-size:12.5px;font-weight:700;color:var(--tx2);margin-top:8px">Nessuna connessione configurata</div>'+
      '<div style="font-size:11px;color:var(--tx4);margin-top:4px;line-height:1.55">Creane una qui sotto e provala: i nodi del builder<br>potranno poi riusarla senza reinserire nulla.</div>'+
      '</div>';
    return;
  }
  // Riepilogo in testa: prima di lanciare un flusso interessa quante
  // connessioni sono state davvero provate, non l'elenco.
  var nOk=elenco.filter(function(c){return c.stato==='ok'}).length;
  var nKo=elenco.filter(function(c){return c.stato==='errore'}).length;
  var html='<div class="conn-riepilogo">'+
    '<div class="conn-kpi"><b>'+elenco.length+'</b><span>Totali</span></div>'+
    '<div class="conn-kpi ok"><b>'+nOk+'</b><span>Provate</span></div>'+
    '<div class="conn-kpi'+(nKo?' ko':'')+'"><b>'+nKo+'</b><span>Con errori</span></div>'+
    '<div class="conn-kpi"><b>'+(elenco.length-nOk-nKo)+'</b><span>Da provare</span></div>'+
    '</div>';

  html+=elenco.map(function(c){
    var t=CONN_TIPI[c.tipo]||{icona:'\ud83d\udd0c',label:c.tipo};
    var cfg=connConfig(c);
    var st=c.stato==='ok'?'ok':c.stato==='errore'?'errore':'nuovo';
    var quando=connQuando(c.ultimo_test);
    var etichetta={ok:'\u2705 Provata',errore:'\u26a0\ufe0f Da sistemare',nuovo:'\u25cb Da provare'}[st];
    if(quando&&st!=='nuovo')etichetta+=' \u00b7 '+quando;
    var riassunto=cfg.baseurl||cfg.host||cfg.alias||cfg.percorso||cfg.destinatarioProva||t.label;
    return '<div class="conn-card st-'+st+'">'+
      '<div class="conn-top">'+
        '<div class="conn-ic">'+t.icona+'</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div class="conn-nome">'+escHtml(c.nome)+
            (t.nota?'<span class="conn-sim" title="'+escHtml(t.notaSpiegazione||'')+'">'+escHtml(t.nota)+'</span>':'')+
          '</div>'+
          '<div class="conn-sub">'+escHtml(t.label.split(' (')[0])+' \u00b7 '+escHtml(String(riassunto))+'</div>'+
        '</div>'+
        '<span class="conn-stato '+st+'">'+etichetta+'</span>'+
      '</div>'+
      '<div id="conn-esito-'+c.id+'">'+
        (c.esito_test?'<div class="conn-esito '+(c.stato==='ok'?'ok':'errore')+'">'+escHtml(c.esito_test)+'</div>':'')+
      '</div>'+
      '<div class="conn-azioni">'+
        '<button class="tb-btn primary fill" id="conn-btn-'+c.id+'" onclick="connProva('+c.id+')">\ud83d\udd0d Prova</button>'+
        '<button class="tb-btn fill" onclick="connModifica('+c.id+')">\u270f\ufe0f Modifica</button>'+
        '<button class="tb-btn" style="color:#EF4444;border-color:#FECACA" title="Elimina" onclick="connElimina('+c.id+')">\ud83d\uddd1\ufe0f</button>'+
      '</div></div>';
  }).join('');
  box.innerHTML=html;
}

function connNuova(tipo){ connForm(null,tipo) }
function connModifica(id){ var c=connPerId(id); if(c)connForm(c,c.tipo) }

function connForm(c,tipo){
  var t=CONN_TIPI[tipo];
  var cfg=connConfig(c);
  var nome=c?c.nome:'';
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center">'+
      '<h2>'+t.icona+' '+(c?'Modifica connessione':'Nuova connessione')+'</h2>'+
      '<button class="modal-close" onclick="openConnessioni()">✕</button></div>'+
    '<div style="font-size:11.5px;color:var(--tx3);margin:10px 0 14px;line-height:1.55">'+escHtml(t.descrizione)+'</div>'+
    '<div class="prop-group"><div class="prop-label">Nome <span style="color:#EF4444">*</span></div>'+
      '<input class="prop-input" id="connNome" value="'+escHtml(nome)+'" placeholder="es. Drive Contratti"></div>'+
    (t.campi||[]).map(function(f){
      var v=cfg[f.k]||'';
      var lab=f.l+(f.req?' <span style="color:#EF4444">*</span>':'');
      if(f.opts)return '<div class="prop-group"><div class="prop-label">'+lab+'</div>'+
        '<select class="prop-select" id="connC_'+f.k+'">'+f.opts.map(function(o){
          return '<option'+(v===o?' selected':'')+'>'+escHtml(o)+'</option>'}).join('')+'</select></div>';
      if(f.ta)return '<div class="prop-group"><div class="prop-label">'+lab+'</div>'+
        '<textarea class="prop-input" id="connC_'+f.k+'" rows="3" placeholder="'+escHtml(f.ph||'')+'">'+escHtml(v)+'</textarea></div>';
      return '<div class="prop-group"><div class="prop-label">'+lab+'</div>'+
        '<input class="prop-input" id="connC_'+f.k+'" value="'+escHtml(v)+'" placeholder="'+escHtml(f.ph||'')+'"></div>';
    }).join('')+
    // La cartella non è un campo di testo: il permesso si ottiene solo con un
    // click dell'utente sul selettore di sistema.
    (tipo==='cartella'
      ? '<div class="prop-group"><div class="prop-label">Cartella <span style="color:#EF4444">*</span></div>'+
        '<button class="tb-btn" style="width:100%" onclick="connScegliCartella()">'+
          (cfg.alias?'📂 '+escHtml(cfg.alias)+' — cambia':'Scegli cartella…')+'</button>'+
        '<input type="hidden" id="connC_alias" value="'+escHtml(cfg.alias||'')+'">'+
        '<div id="connCartellaInfo" style="font-size:10px;color:var(--tx4);margin-top:5px">'+
          (cfg.alias?'✅ Collegata':'Serve il permesso: si ottiene solo scegliendola qui.')+'</div></div>'
      : '')+
    (tipo==='smtp'||tipo==='webhook'
      ? '<div style="font-size:10.5px;color:var(--tx3);background:var(--bg2);border-radius:8px;padding:9px 11px;line-height:1.5">'+
        'Non ci sono parametri da inserire: le credenziali stanno nel servizio locale. Salva e premi Prova per verificare che sia in ascolto.</div>'
      : '')+
    '<div id="connFormErrori"></div>'+
    '<div style="display:flex;gap:8px;margin-top:16px">'+
      '<button class="tb-btn primary" style="flex:1;justify-content:center" onclick="connSalvaDalForm('+(c?c.id:'null')+',\''+tipo+'\')">💾 Salva</button>'+
      '<button class="tb-btn" style="flex:1;justify-content:center" onclick="openConnessioni()">Annulla</button>'+
    '</div>'
  );
}

function connScegliCartella(){
  csScegliCartella().then(function(h){
    var campo=document.getElementById('connC_alias');
    if(campo)campo.value=h.name;
    var info=document.getElementById('connCartellaInfo');
    if(info)info.innerHTML='✅ Collegata: <strong>'+escHtml(h.name)+'</strong>';
    showToast('Cartella collegata: '+h.name);
  },function(err){
    if(err&&err.name==='AbortError')return;
    showToast('Cartella non collegata: '+(err.message||err));
  });
}

// Controllo dei campi PRIMA di salvare. Senza, si salvava una connessione
// incompleta, partiva la prova automatica e l'errore che compariva era quello
// della prova ("URL mancante") invece che quello vero: un campo non compilato.
function connValidaForm(tipo,cfg,nome){
  var problemi=[];
  if(!nome)problemi.push('Dai un nome alla connessione');
  (CONN_TIPI[tipo].campi||[]).filter(function(f){return f.req}).forEach(function(f){
    if(!cfg[f.k]||!String(cfg[f.k]).trim())problemi.push('Compila "'+f.l+'"');
  });
  if(tipo==='cartella'&&!cfg.alias)
    problemi.push('Scegli una cartella: il permesso si ottiene solo dal selettore di sistema');
  if(tipo==='http'&&cfg.baseurl&&!/^https?:\/\//i.test(cfg.baseurl))
    problemi.push('L\u2019URL deve iniziare con http:// o https://');
  if(tipo==='http'&&cfg.headers&&String(cfg.headers).trim()){
    try{ JSON.parse(cfg.headers) }catch(e){ problemi.push('Gli header non sono JSON valido') }
  }
  if(tipo==='database'&&cfg.port&&!/^\d+$/.test(String(cfg.port).trim()))
    problemi.push('La porta deve essere un numero');
  if(tipo==='smtp'&&cfg.destinatarioProva&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cfg.destinatarioProva.trim()))
    problemi.push('Il destinatario di prova non e\u0300 un indirizzo email valido');
  return problemi;
}

function connSalvaDalForm(id,tipo){
  var nome=((document.getElementById('connNome')||{}).value||'').trim();
  var cfg={};
  (CONN_TIPI[tipo].campi||[]).forEach(function(f){
    var el=document.getElementById('connC_'+f.k);
    if(el)cfg[f.k]=el.value;
  });
  var alias=document.getElementById('connC_alias');
  if(alias)cfg.alias=alias.value;

  var problemi=connValidaForm(tipo,cfg,nome);
  var box=document.getElementById('connFormErrori');
  if(problemi.length){
    if(box)box.innerHTML='<div class="conn-esito errore" style="margin-bottom:10px">'+
      problemi.map(function(p){return '\u2022 '+escHtml(p)}).join('<br>')+'</div>';
    showToast('\u26a0\ufe0f '+problemi[0]);
    return;
  }
  if(box)box.innerHTML='';

  var nuovoId=connSalva(id,nome,tipo,cfg);
  showToast('\ud83d\udcbe Connessione salvata \u2014 la provo subito');
  openConnessioni();
  // La prova parte da sola: una connessione salvata e mai verificata e'
  // esattamente il caso che questa sezione esiste per evitare.
  if(nuovoId)setTimeout(function(){connProva(nuovoId)},250);
}

// ── Uso nei nodi ──────────────────────────────────────────────
// Il nodo sceglie una connessione dall'elenco invece di ripetere i parametri.
function connSelettore(nid,n,tipo,etichetta){
  var elenco=connElenco(tipo);
  var scelta=(n.config&&n.config.connessioneId)||'';
  if(!elenco.length){
    // Il pulsante crea direttamente la connessione DEL TIPO GIUSTO: mandare
    // alla sezione generale costringerebbe a ritrovare da soli quale serve.
    return '<div class="prop-group"><div class="prop-label">'+escHtml(etichetta||'Connessione')+' <span style="color:#EF4444">*</span></div>'+
      '<div style="font-size:10.5px;color:#B45309;background:#FEF3C7;border-radius:6px;padding:8px 10px;line-height:1.5">'+
      'Nessuna connessione di questo tipo. Configurala e provala una volta: vale per tutti i flussi.'+
      '<div style="display:flex;gap:6px;margin-top:7px">'+
        '<button class="tb-btn" style="flex:1;justify-content:center;height:30px;font-size:11px" onclick="connNuova(\''+tipo+'\')">➕ Configura ora</button>'+
        '<button class="tb-btn" style="height:30px;font-size:11px" title="Tutte le connessioni" onclick="openConnessioni()">🔌</button>'+
      '</div></div></div>';
  }
  var sceltaOgg=scelta?connPerId(scelta):null;
  return '<div class="prop-group"><div class="prop-label">'+escHtml(etichetta||'Connessione')+' <span style="color:#EF4444">*</span></div>'+
    '<select class="prop-select" onchange="updConfig('+nid+',\'connessioneId\',this.value)">'+
      '<option value="">— scegli —</option>'+
      elenco.map(function(c){
        return '<option value="'+c.id+'"'+(String(scelta)===String(c.id)?' selected':'')+'>'+
          escHtml(c.nome)+(c.stato==='ok'?' ✅':c.stato==='errore'?' ⚠️':'')+'</option>';
      }).join('')+
    '</select>'+
    // Prova e creazione direttamente qui: chi sta costruendo un flusso non
    // deve interrompersi, aprire un'altra sezione e tornare indietro per
    // sapere se il collegamento regge.
    '<div style="display:flex;gap:6px;margin-top:6px">'+
      (scelta
        ? '<button class="tb-btn" style="flex:1;justify-content:center;height:30px;font-size:11px" '+
          'onclick="connProvaDalNodo('+scelta+','+nid+')">🔍 Prova la connessione</button>'+
          '<button class="tb-btn" style="height:30px;font-size:11px" title="Modifica" '+
          'onclick="connModifica('+scelta+')">✏️</button>'
        : '')+
      '<button class="tb-btn" style="'+(scelta?'':'flex:1;justify-content:center;')+'height:30px;font-size:11px" '+
        'onclick="connNuova(\''+tipo+'\')" title="Crea una nuova connessione">'+(scelta?'➕':'➕ Crea una connessione')+'</button>'+
    '</div>'+
    '<div id="conn-nodo-esito-'+nid+'" style="font-size:10.5px;margin-top:6px;line-height:1.45">'+
      (sceltaOgg&&sceltaOgg.esito_test
        ? '<span style="color:'+(sceltaOgg.stato==='ok'?'#047857':'#B45309')+'">'+
          (sceltaOgg.stato==='ok'?'✅ ':'⚠️ ')+escHtml(sceltaOgg.esito_test)+'</span>'
        : (scelta?'<span style="color:var(--tx4)">Non ancora provata.</span>':''))+
    '</div></div>';
}

// Prova lanciata dal pannello del nodo: l'esito compare lì, non in un'altra
// finestra, perché è lì che si sta lavorando.
async function connProvaDalNodo(id,nid){
  var box=document.getElementById('conn-nodo-esito-'+nid);
  if(box)box.innerHTML='<span style="color:var(--tx4)">Prova in corso…</span>';
  await connProva(id);
  var c=connPerId(id);
  if(box&&c)box.innerHTML='<span style="color:'+(c.stato==='ok'?'#047857':'#B45309')+'">'+
    (c.stato==='ok'?'✅ ':'⚠️ ')+escHtml(c.esito_test||'')+'</span>';
}

// Parametri effettivi di un nodo: quelli della connessione scelta. I campi del
// nodo restano prioritari, così una sottocartella diversa per un singolo flusso
// non obbliga a creare una seconda connessione.
function connParametri(cfg){
  if(!cfg||!cfg.connessioneId)return null;
  var c=connPerId(cfg.connessioneId);
  if(!c)return null;
  return Object.assign({},connConfig(c),{_nome:c.nome,_tipo:c.tipo,_stato:c.stato});
}

// Alias e percorso effettivi per un nodo che scrive su cartella: prima la
// connessione scelta, poi gli eventuali valori sul nodo. Un solo punto, cosi'
// il motore e il pannello non possono divergere.
function connCartellaDelNodo(cfg){
  var c=connParametri(cfg);
  return {
    alias:   (c&&c.alias)   || (cfg&&cfg.cloudAlias) || '',
    percorso:(cfg&&cfg.cloudPath) || (c&&c.percorso) || '',
    nome:    c?c._nome:null,
    provata: c?(c._stato==='ok'):false
  };
}
