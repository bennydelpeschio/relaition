function escHtml(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}

function showToast(msg){var w=document.getElementById('toastWrap');var t=document.createElement('div');t.className='toast';t.innerHTML=msg;w.appendChild(t);setTimeout(function(){t.remove()},3500)}

function closeModal(){document.getElementById('modalOverlay').classList.remove('show')}

function openModal(html,lg){var m=document.getElementById('modalContent');m.innerHTML=html;m.className=lg?'modal modal-lg':'modal';document.getElementById('modalOverlay').classList.add('show')}

// ── NAVIGATION ──

function toggleNotifications(){
  notifOpen=!notifOpen;
  var panel=document.getElementById('notifPanel');
  if(notifOpen){
    panel.classList.add('show');
    renderNotifications();
  }else{
    panel.classList.remove('show');
  }
}

// Usata dal ciclo di vita delle pubblicazioni (D4): sospensioni e
// ripristini di versione devono raggiungere chi ha installato l'agente.
function addNotif(text,action){
  notifications.unshift({id:Date.now()+Math.floor(Math.random()*999),text:text,
    time:'Adesso',read:false,action:action||'marketplace'});
  if(notifications.length>30)notifications.pop();
  var badge=document.getElementById('notifBadge');
  if(badge)badge.style.display='block';
  if(notifOpen)renderNotifications();
}

function renderNotifications(){
  var panel=document.getElementById('notifPanel');
  panel.innerHTML='<div style="padding:12px 16px;border-bottom:1px solid var(--bo);display:flex;justify-content:space-between;align-items:center"><span style="font-size:14px;font-weight:700">🔔 Notifiche</span><span style="font-size:11px;color:var(--ac);cursor:pointer" onclick="markAllRead()">Segna tutte lette</span></div>'+
    notifications.map(function(n){
      return '<div class="notif-item'+(n.read?'':' unread')+'" onclick="handleNotif('+n.id+')"><div class="activity-dot" style="background:'+(n.read?'var(--tx4)':'var(--ac)')+';margin-top:5px;flex-shrink:0"></div><div><div style="font-size:12px;line-height:1.4">'+n.text+'</div><div style="font-size:10px;color:var(--tx4);margin-top:2px">'+n.time+'</div></div></div>';
    }).join('');
}

function handleNotif(id){
  var n=notifications.find(function(x){return x.id===id});if(!n)return;
  n.read=true;
  toggleNotifications();
  go(n.action);
}

function markAllRead(){
  notifications.forEach(function(n){n.read=true});
  renderNotifications();
  document.querySelector('.notif-dot').style.display='none';
  showToast('✅ Tutte le notifiche segnate come lette');
}

// ══════════════════════════════════════════
// ENHANCED MY AGENTS — Run, Edit, Delete, Stats
// ══════════════════════════════════════════

function openDocsModal(){
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>📖 Documentazione</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<div class="tabs mt-16" style="margin-bottom:16px">'+
      '<div class="tab active">Quick Start</div>'+
    '</div>'+
    '<div class="lesson-content" style="border:none;padding:0">'+
    '<h3>🚀 Quick Start in 4 passi</h3>'+
    '<p><strong>1. Configura l\'AI</strong>: Nel Builder, pannello laterale sinistro in basso: scegli il provider (Claude, GPT, Gemini o endpoint custom), inserisci la API key e clicca Test.</p>'+
    '<p><strong>2. Crea il workflow</strong>: Due modalità: trascina i blocchi dalla palette (63 connettori in 10 categorie) oppure descrivi l\'obiettivo nell\'AI Chat Builder in alto.</p>'+
    '<p><strong>3. Configura i nodi</strong>: Clicca un nodo per aprire il pannello proprietà: ogni connettore ha campi specifici (canale Slack, query SQL, bucket S3...). I nodi AI hanno system prompt e temperature.</p>'+
    '<p><strong>4. Esegui e monitora</strong>: ▶️ Run esegue il flusso end-to-end: i nodi si illuminano in sequenza, l\'execution log mostra output reali, tutto viene tracciato nel Log Esecuzioni.</p>'+
    '<div class="concept-box">💡 <strong>Placeholder dinamici:</strong> usa <code>{{result}}</code> nei campi dei connettori per inserire l\'output del nodo precedente.</div>'+
    '</div>'
  ,true);
}

function bookOfficeHours(){
  openModal(
    '<div style="display:flex;justify-content:space-between;align-items:center"><h2>🤝 Prenota Office Hours</h2><button class="modal-close" onclick="closeModal()">✕</button></div>'+
    '<p style="font-size:12px;color:var(--tx3);margin:10px 0 16px">Sessioni 1:1 di 30 minuti con il team RelAItion, ogni mercoledì.</p>'+
    '<div class="prop-group"><div class="prop-label">Slot disponibili</div><select class="prop-select" id="ohSlot"><option>Mercoledì 8 Luglio: 17:00</option><option>Mercoledì 8 Luglio, 17:30</option><option>Mercoledì 8 Luglio, 18:00</option><option>Mercoledì 15 Luglio, 17:00</option></select></div>'+
    '<div class="prop-group"><div class="prop-label">Argomento</div><input class="prop-input" id="ohTopic" placeholder="es. Aiuto con integrazione Salesforce"></div>'+
    '<button class="tb-btn primary" onclick="closeModal();showToast(\'✅ Office Hours prenotato! Riceverai l\\\'invito via email\');addAct(\'Prenotato Office Hours\')">Conferma prenotazione</button>'
  );
}


// ── GLOBAL SEARCH (debounced) ──
