/* ════════════════════════════════════════════════════
   CREDENTIALS
════════════════════════════════════════════════════ */
const CREDS = {
  admin:  { user:'admin',  pass:'admin123' },
  vendor: { user:'vendor', pass:'vendor123' },
};

/* ════════════════════════════════════════════════════
   DEFAULT DATA
════════════════════════════════════════════════════ */
const DEFAULT_ITEMS = [
  { id:1, name:'Rice',         emoji:'🌾', alloc:'5 kg / family',   price:'₹3/kg',  avail:true,  cat:'Grain',     unitKg:5,   stockQty:1500, priceNum:15 },
  { id:2, name:'Wheat',        emoji:'🌿', alloc:'3 kg / family',   price:'₹2/kg',  avail:true,  cat:'Grain',     unitKg:3,   stockQty:900,  priceNum:6  },
  { id:3, name:'Sugar',        emoji:'🍬', alloc:'1 kg / family',   price:'₹13/kg', avail:true,  cat:'Sweet',     unitKg:1,   stockQty:300,  priceNum:13 },
  { id:4, name:'Palm Oil',     emoji:'🫙', alloc:'1 L / family',    price:'₹27/L',  avail:true,  cat:'Oil',       unitKg:1,   stockQty:250,  priceNum:27 },
  { id:5, name:'Kerosene',     emoji:'⛽', alloc:'2 L / family',    price:'₹15/L',  avail:false, cat:'Fuel',      unitKg:2,   stockQty:0,    priceNum:30 },
  { id:6, name:'Dal',          emoji:'🫘', alloc:'1 kg / family',   price:'₹20/kg', avail:true,  cat:'Pulse',     unitKg:1,   stockQty:400,  priceNum:20 },
  { id:7, name:'Salt',         emoji:'🧂', alloc:'1 kg / family',   price:'₹1/kg',  avail:true,  cat:'Essential', unitKg:1,   stockQty:500,  priceNum:1  },
  { id:8, name:'Groundnut Oil',emoji:'🥜', alloc:'500 ml / family', price:'₹45/L',  avail:false, cat:'Oil',       unitKg:0.5, stockQty:0,    priceNum:22 },
];

// Sample customers — 6 months ago threshold = 180 days
const DEFAULT_CUSTOMERS = [
  { id:'TN-100001', name:'Murugan Rajan',     phone:'+91 94430 11001', members:4, address:'No.12, Gandhi Street, Villupuram', lastVisit: daysAgo(5),   status:'active' },
  { id:'TN-100002', name:'Selvi Kumaran',      phone:'+91 94430 11002', members:3, address:'No.5, Anna Nagar, Villupuram',    lastVisit: daysAgo(200), status:'inactive' },
  { id:'TN-1000025', name:'Lakshmi',      phone:'+91 7904089265', members:4, address:'No.6, Kamala Nagar, Villupuram',    lastVisit: daysAgo(3), status:'active' },
  { id:'TN-100003', name:'Ravi Chandran',      phone:'+91 94430 11003', members:6, address:'No.88, Market Road, Villupuram',  lastVisit: daysAgo(15),  status:'active' },
  { id:'TN-100004', name:'Meena Subramani',    phone:'+91 94430 11004', members:2, address:'No.3, Nehru Colony, Villupuram',  lastVisit: daysAgo(155), status:'warning' },
  { id:'TN-100005', name:'Karthik Vel',        phone:'+91 94430 11005', members:5, address:'No.21, Bus Stand Area, Villupuram',lastVisit: daysAgo(2),   status:'active' },
  { id:'TN-100006', name:'Parvathi Murugan',   phone:'+91 94430 11006', members:3, address:'No.7, Nehru Street, Villupuram', lastVisit: daysAgo(250), status:'inactive' },
  { id:'TN-100007', name:'Senthil Kumar',      phone:'+91 94430 11007', members:4, address:'No.45, Salem Road, Villupuram',  lastVisit: daysAgo(8),   status:'active' },
  { id:'TN-100008', name:'Lakshmi Narayanan',  phone:'+91 94430 11008', members:5, address:'No.16, Dr. Ambedkar Nagar, Villupuram', lastVisit: daysAgo(190), status:'inactive' },
];

function daysAgo(n) {
  const d = new Date(); 
  d.setDate(d.getDate() - n); 
  // Returns YYYY-MM-DD which is universally parseable
  return d.toISOString().split('T'); 
}

/* ════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════ */
let currentRole = null;
let myToken = null;
let complaintFilter = 'all';
let currentView = 'line';
let pendingBill = null;   // { customer, items, total, otp }
let otpTimer = null;
let otpSeconds = 300;

let state = {
  tokens: [], currentToken: null, tokenCounter: 0,
  announcement: 'Welcome! Shop is open. Please collect your tokens. Items distributed as per government allocation.',
  complaints: [],
  items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
  customers: JSON.parse(JSON.stringify(DEFAULT_CUSTOMERS)),
  transactions: [],
};

/* ════════════════════════════════════════════════════
   STORAGE
════════════════════════════════════════════════════ */
function loadState() {
  try {
    const s = localStorage.getItem('rationnet_v3');
    if (s) {
      const p = JSON.parse(s);
      state = { ...state, ...p };
      if (!state.items || state.items.length === 0) state.items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
      if (!state.customers || state.customers.length === 0) state.customers = JSON.parse(JSON.stringify(DEFAULT_CUSTOMERS));
      if (!state.transactions) state.transactions = [];
    }
  } catch(e) {}
}
function saveState() {
  try { localStorage.setItem('rationnet_v3', JSON.stringify(state)); } catch(e) {}
}
function loadMyToken() {
  try { myToken = JSON.parse(sessionStorage.getItem('rn_mytoken') || 'null'); } catch(e) {}
}
function saveMyToken() {
  try { sessionStorage.setItem('rn_mytoken', JSON.stringify(myToken)); } catch(e) {}
}

/* ════════════════════════════════════════════════════
   LOGIN / ROLE
════════════════════════════════════════════════════ */
let pendingLoginRole = null;

function showVendorLogin() {
  pendingLoginRole = 'vendor';
  document.getElementById('login-title').textContent = '🏪 Vendor Login';
  document.getElementById('login-sub').textContent = 'Enter your vendor credentials';
  document.getElementById('login-hint').innerHTML = 'Demo: <b>vendor</b> / <b>vendor123</b>';
  document.getElementById('login-user').value = 'vendor';
  document.getElementById('login-pass').value = '';
  showLoginScreen();
}
function showAdminLogin() {
  pendingLoginRole = 'admin';
  document.getElementById('login-title').textContent = '🛡️ Admin Login';
  document.getElementById('login-sub').textContent = 'Enter your admin credentials';
  document.getElementById('login-hint').innerHTML = 'Demo: <b>admin</b> / <b>admin123</b>';
  document.getElementById('login-user').value = 'admin';
  document.getElementById('login-pass').value = '';
  showLoginScreen();
}
function showLoginScreen() {
  document.getElementById('role-screen').style.display = 'none';
  document.getElementById('login-screen').classList.add('show');
  document.getElementById('login-error').style.display = 'none';
  setTimeout(() => document.getElementById('login-pass').focus(), 100);
}
function backToRole() {
  document.getElementById('login-screen').classList.remove('show');
  document.getElementById('role-screen').style.display = 'flex';
  document.getElementById('login-error').style.display = 'none';
}
function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const cred = CREDS[pendingLoginRole];
  if (cred && user === cred.user && pass === cred.pass) {
    document.getElementById('login-screen').classList.remove('show');
    enterApp(pendingLoginRole);
  } else {
    document.getElementById('login-error').style.display = 'block';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-pass').focus();
  }
}
function enterAsCustomer() {
  document.getElementById('role-screen').style.display = 'none';
  enterApp('customer');
}
function enterApp(role) {
  currentRole = role;
  loadState(); loadMyToken();
  document.getElementById('main-nav').style.display = 'flex';
  document.getElementById('main-app').classList.add('show');
  document.getElementById('chatbot-fab').style.display = 'flex';
  const badge = document.getElementById('nav-role-badge');
  badge.textContent = role === 'admin' ? '🛡️ Admin' : role === 'vendor' ? '🏪 Vendor' : '👤 Customer';
  badge.className = 'nav-role-badge ' + role;
  buildNav(role);
  startMasterClock();
  addBotMsg("👋 Hi! I'm RationBot. Ask me about tokens, items, or shop status.");
  if (role === 'admin') { renderAdminStats(); renderCustomerTable(); renderTransactionList(); renderAdminComplaints(); navigate('home-admin'); }
  else if (role === 'vendor') { renderVendorHome(); navigate('vendor-home'); }
  else { renderCustomerHome(); renderCustomerMyToken(); navigate('home-customer'); }
}
function logout() {
  currentRole = null; myToken = null;
  if (otpTimer) clearInterval(otpTimer);
  document.getElementById('main-nav').style.display = 'none';
  document.getElementById('main-app').classList.remove('show');
  document.getElementById('chatbot-fab').style.display = 'none';
  document.getElementById('chatbot-panel').classList.remove('show');
  document.getElementById('role-screen').style.display = 'flex';
  document.getElementById('otp-overlay').classList.remove('show');
  document.getElementById('bill-modal-overlay').classList.remove('show');
}

/* ════════════════════════════════════════════════════
   NAV
════════════════════════════════════════════════════ */
function buildNav(role) {
  const el = document.getElementById('nav-links');
  if (role === 'admin') {
    el.innerHTML = `
      <button class="nav-btn" onclick="navigate('home-admin')">Home</button>
      <button class="nav-btn" onclick="navigate('token-admin')">Tokens</button>
      <button class="nav-btn" onclick="navigate('stock-admin')">Stock</button>
      <button class="nav-btn" onclick="navigate('customers-admin')">Customers</button>
      <button class="nav-btn" onclick="navigate('transactions-admin')">Transactions</button>
      <button class="nav-btn" onclick="navigate('complaints-admin')">Complaints</button>`;
  } else if (role === 'vendor') {
    el.innerHTML = `<button class="nav-btn" onclick="navigate('vendor-home')">🧾 Billing Counter</button>`;
  } else {
    el.innerHTML = `
      <button class="nav-btn" onclick="navigate('home-customer')">Home</button>
      <button class="nav-btn" onclick="navigate('token-customer')">Token Board</button>
      <button class="nav-btn" onclick="navigate('items-customer')">Items</button>
      <button class="nav-btn" onclick="navigate('complaint-customer')">Complaints</button>`;
  }
}

/* ════════════════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════════════════ */
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(page)) b.classList.add('active');
  });
  if (page === 'home-admin') renderAdminStats();
  if (page === 'token-admin') { renderTokens(); setView(currentView); }
  if (page === 'stock-admin') renderStockAdmin();
  if (page === 'customers-admin') renderCustomerTable();
  if (page === 'transactions-admin') renderTransactionList();
  if (page === 'complaints-admin') renderAdminComplaints();
  if (page === 'vendor-home') renderVendorHome();
  if (page === 'home-customer') { renderCustomerHome(); renderCustomerMyToken(); }
  if (page === 'token-customer') renderCustomerTokenBoard();
  if (page === 'items-customer') renderItemsC();
  if (page === 'complaint-customer') renderCustomerComplaints();
}

/* ════════════════════════════════════════════════════
   SHOP STATUS — AUTO TIME-BASED
════════════════════════════════════════════════════ */
function getShopStatus() {
  // Normalize to IST regardless of device settings
  const now = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
  const date = new Date(now);
  const h = date.getHours(), m = date.getMinutes(); 
  const mins = h * 60 + m;

  if (mins >= 9 * 60 && mins < 13 * 60) return 'open';
  if (mins >= 13 * 60 && mins < 14 * 60) return 'lunch';
  if (mins >= 14 * 60 && mins < 18 * 60) return 'open';
  return 'closed';
}

function getNextEventLabel() {
  const now = new Date(); const h = now.getHours(), m = now.getMinutes(); const mins = h*60+m;
  if (mins<9*60) return 'Opens at 9:00 AM';
  if (mins<13*60) return 'Lunch at 1:00 PM';
  if (mins<14*60) return 'Reopens at 2:00 PM';
  if (mins<18*60) return 'Closes at 6:00 PM';
  return 'Opens tomorrow at 9 AM';
}

function updateShopUI() {
  const status = getShopStatus();
  state.shopOpen = (status === 'open');
  const cfg = {
    open:   { label:'🟢 OPEN',        sub:getNextEventLabel(), dot:'open',   pill:'open',   banner:'status-open',   timerLbl:'Open Duration',   col:'var(--green)' },
    lunch:  { label:'🟡 LUNCH BREAK', sub:'Reopens at 2:00 PM',dot:'lunch',  pill:'lunch',  banner:'status-lunch',  timerLbl:'Resumes In',      col:'var(--yellow)' },
    closed: { label:'🔴 CLOSED',      sub:getNextEventLabel(), dot:'closed', pill:'closed', banner:'status-closed', timerLbl:'Opens In',        col:'var(--danger)' },
  }[status];

  ['a','c','v'].forEach(px => {
    const banner = g(px+'-dash-banner'); const dot = g(px+'-hero-dot'); const label = g(px+'-hero-label');
    const pill = g(px+'-status-pill'); const pillSub = g(px+'-status-pill-sub');
    const titleEm = g(px+'-dash-title-em'); const timerLbl = g(px+'-timer-label');
    if (banner) banner.className = 'dash-hero-banner '+cfg.banner;
    if (dot) dot.className = 'status-dot '+cfg.dot;
    if (label) { label.textContent = cfg.label; label.style.color = cfg.col; }
    if (pill) pill.className = 'dash-status-pill '+cfg.pill;
    if (pillSub) pillSub.textContent = cfg.sub;
    if (titleEm) titleEm.style.color = cfg.col;
    if (timerLbl) timerLbl.textContent = cfg.timerLbl;
    const slots = {morning:px+'-slot-morning',lunch:px+'-slot-lunch',evening:px+'-slot-evening'};
    const activeSlot = status==='open'?(new Date().getHours()<13?'morning':'evening'):status==='lunch'?'lunch':null;
    Object.keys(slots).forEach(k => {
      const el = g(slots[k]); if (!el) return;
      el.className = 'timing-slot '+(k==='lunch'?'slot-lunch':'slot-open');
      if (k===activeSlot) el.classList.add('active');
    });
  });
}

let masterInterval = null;
function startMasterClock() {
  if (masterInterval) clearInterval(masterInterval);
  masterInterval = setInterval(() => { updateShopUI(); tickTimer(); }, 1000);
  updateShopUI(); tickTimer();
}
function tickTimer() {
  const status = getShopStatus(); 
  const now = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
  const date = new Date(now);
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  const currentTotalMins = h * 60 + m;

  let fmt = '--:--:--';

  if (status === 'open') {
    // 1. Target set to 6:00 PM (18:00)
    let targetMins = 18 * 60; 
    
    // Morning session-la irundha target 1:00 PM-ah irukkanum
    if (currentTotalMins < 13 * 60) {
      targetMins = 13 * 60;
    }

    const remainingSecs = (targetMins - currentTotalMins) * 60 - s;

    if (remainingSecs > 0) {
      const hh = Math.floor(remainingSecs / 3600);
      const mm = Math.floor((remainingSecs % 3600) / 60);
      const ss = remainingSecs % 60;
      fmt = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    }

    // Label update: Show "Closing In"
    ['a','c','v'].forEach(px => {
      const lbl = document.getElementById(px + '-timer-label');
      if (lbl) lbl.textContent = 'Closing In';
    });

  } else if (status === 'lunch') {
    const rem = (14 * 60 - currentTotalMins) * 60 - s;
    fmt = `${String(Math.floor(rem/3600)).padStart(2,'0')}:${String(Math.floor((rem%3600)/60)).padStart(2,'0')}:${String(rem%60).padStart(2,'0')}`;
  } else {
    // Closed logic...
    fmt = "00:00:00";
  }

  ['a-hero-timer','c-hero-timer','v-hero-timer'].forEach(id => { 
    const el = document.getElementById(id); 
    if(el) el.textContent = fmt; 
  });
}

/* ════════════════════════════════════════════════════
   ANNOUNCEMENT
════════════════════════════════════════════════════ */
function renderAnnouncement() {
  const d=g('ann-display'); const ci=g('ann-input'); const cd=g('c-ann-display');
  if(d) d.textContent=state.announcement;
  if(ci) ci.value=state.announcement;
  if(cd) cd.textContent=state.announcement;
}
function toggleAnnEdit() { g('ann-edit').classList.toggle('show'); }
function saveAnnouncement() {
  const v = g('ann-input').value.trim(); if(!v) return;
  state.announcement = v; renderAnnouncement(); g('ann-edit').classList.remove('show'); saveState(); showToast('📢 Announcement updated!','success');
}

/* ════════════════════════════════════════════════════
   TOKENS — ADMIN
════════════════════════════════════════════════════ */
function generateToken() {
  state.tokenCounter++;
  const id = state.tokenCounter;
  state.tokens.push({id, status:'waiting', name:''});
  if (!state.tokens.find(t=>t.status==='current')) { state.tokens[state.tokens.length-1].status='current'; state.currentToken=id; }
  renderTokens(); renderAdminStats(); saveState(); showToast(`🎫 Token #${id} generated!`,'success');
}
function serveNext() {
  const cur = state.tokens.find(t=>t.status==='current');
  if(cur) cur.status='done';
  const nxt = state.tokens.find(t=>t.status==='waiting');
  if(nxt) { nxt.status='current'; state.currentToken=nxt.id; const an=state.tokens.find(t=>t.status==='waiting'); if(an) showNotification(`🔔 Token #${an.id} — you're next!`); showToast(`✅ Now serving Token #${nxt.id}`,'success'); }
  else { state.currentToken=null; showToast('🎉 All tokens served!','success'); }
  renderTokens(); renderAdminStats(); saveState();
}
function resetTokens() {
  if(!confirm('Reset all tokens? This cannot be undone.')) return;
  state.tokens=[]; state.currentToken=null; state.tokenCounter=0; myToken=null; saveMyToken();
  renderTokens(); renderAdminStats(); saveState(); showToast('🔄 Tokens reset.','error');
}
function setView(v) {
  currentView=v;
  g('view-token-line').style.display=v==='line'?'block':'none';
  g('view-token-list').style.display=v==='list'?'block':'none';
  const lb=g('view-line-btn'),lb2=g('view-list-btn');
  if(lb){lb.style.borderColor=v==='line'?'var(--accent)':'var(--border)';lb.style.color=v==='line'?'var(--accent)':'';}
  if(lb2){lb2.style.borderColor=v==='list'?'var(--accent)':'var(--border)';lb2.style.color=v==='list'?'var(--accent)':'';}
}
function renderTokens() {
  const lineEl=g('token-line-ui');
  if(lineEl){
    if(!state.tokens.length){lineEl.innerHTML='<div style="color:var(--muted);font-size:0.83rem">No tokens yet.</div>';}
    else{
      const fw=state.tokens.find(t=>t.status==='waiting');
      lineEl.innerHTML=state.tokens.map((t,i)=>{
        const isNext=t.status==='waiting'&&fw&&fw.id===t.id;
        let cls='waiting',sub='Waiting';
        if(t.status==='done'){cls='done';sub='Done';}else if(t.status==='current'){cls='current';sub='Now';}else if(isNext){cls='next';sub='Next';}
        return (i>0?'<div class="token-connector"></div>':'')+`<div class="token-chip"><div class="token-num ${cls}">#${t.id}</div><div class="token-lbl">${sub}</div></div>`;
      }).join('');
    }
  }
  const listEl=g('token-list-container');
  if(listEl){
    if(!state.tokens.length){listEl.innerHTML='<div class="empty-state"><div class="es-icon">🎫</div><p>No tokens generated yet.</p></div>';}
    else{
      const fw=state.tokens.find(t=>t.status==='waiting');
      listEl.innerHTML=[...state.tokens].reverse().map(t=>{
        const isNext=t.status==='waiting'&&fw&&fw.id===t.id;
        let badge='badge-wait',btxt='⏳ Waiting';
        if(t.status==='done'){badge='badge-done';btxt='✅ Done';}
        else if(t.status==='current'){badge='badge-current';btxt='🟡 Current';}
        else if(isNext){badge='badge-next';btxt='⏭ Next';}
        return `<div class="token-list-item"><div class="t-num" style="color:${t.status==='done'?'var(--green)':t.status==='current'?'var(--yellow)':'var(--text)'}">#${t.id}${t.name?' — '+t.name:''}</div><span class="token-badge ${badge}">${btxt}</span></div>`;
      }).join('');
    }
  }
}

/* ════════════════════════════════════════════════════
   ADMIN STATS
════════════════════════════════════════════════════ */
function renderAdminStats() {
  const done=state.tokens.filter(t=>t.status==='done').length;
  const queue=state.tokens.filter(t=>t.status==='waiting').length;
  const total=state.tokens.length;
  const cur=state.tokens.find(t=>t.status==='current');
  const pend=state.complaints.filter(c=>c.status==='Pending').length;
  const inactive=state.customers.filter(c=>c.status==='inactive').length;
  const todayBills=state.transactions.filter(t=>isToday(t.date)).length;
  const set=(id,val)=>{const el=g(id);if(el)el.textContent=val;};
  set('a-stat-current',cur?`#${cur.id}`:'—'); set('a-stat-done',done); set('a-stat-queue',queue); set('a-stat-bills',todayBills);
  set('a-sum-total',total); set('a-sum-done',done); set('a-sum-queue',queue);
  set('a-sum-cust',state.customers.filter(c=>c.status==='active').length); set('a-sum-inactive',inactive);
  renderAnnouncement(); updateShopUI();
}

/* ════════════════════════════════════════════════════
   STOCK ADMIN
════════════════════════════════════════════════════ */
function renderStockAdmin() {
  const list=g('stock-list'); if(!list) return;
  list.innerHTML = state.items.map(item=>`
    <div class="stock-row">
      <div class="stock-info">
        <div class="stock-emoji">${item.emoji}</div>
        <div>
          <div class="stock-name">${item.name}</div>
          <div class="stock-alloc">${item.alloc} · ${item.price}</div>
        </div>
      </div>
      <div class="stock-actions">
        <span class="stock-qty" style="color:${item.stockQty<50?'var(--danger)':item.stockQty<150?'var(--warn)':'var(--muted)'}">Qty: ${item.stockQty}</span>
        <span style="font-size:0.7rem;color:${item.avail?'var(--green)':'var(--danger)'}">${item.avail?'In Stock':'Out of Stock'}</span>
        <button class="stock-toggle ${item.avail?'avail':'unavail'}" onclick="toggleStock(${item.id})" title="Toggle"></button>
      </div>
    </div>`).join('');
  const sel=g('edit-item-select');
  if(sel) sel.innerHTML='<option value="">— Choose item —</option>'+state.items.map(i=>`<option value="${i.id}">${i.emoji} ${i.name}</option>`).join('');
}
function toggleStock(id) {
  const item=state.items.find(i=>i.id===id); if(!item) return;
  item.avail=!item.avail; saveState(); renderStockAdmin();
  showToast(`${item.emoji} ${item.name} marked as ${item.avail?'In Stock':'Out of Stock'}`,item.avail?'success':'error');
}
function loadItemEdit() {
  const id=parseInt(g('edit-item-select').value); const item=state.items.find(i=>i.id===id); if(!item) return;
  g('edit-alloc').value=item.alloc; g('edit-price').value=item.price; g('edit-stock-qty').value=item.stockQty;
}
function saveItemEdit() {
  const id=parseInt(g('edit-item-select').value); if(!id){showToast('⚠️ Select an item first.','error');return;}
  const item=state.items.find(i=>i.id===id); if(!item) return;
  const a=g('edit-alloc').value.trim(); const p=g('edit-price').value.trim(); const q=parseInt(g('edit-stock-qty').value);
  if(a) item.alloc=a; if(p) item.price=p; if(!isNaN(q)) item.stockQty=q;
  // Parse price number
  const match=p.match(/₹(\d+)/); if(match) item.priceNum=parseInt(match[1]);
  saveState(); renderStockAdmin(); showToast(`✅ ${item.name} updated!`,'success');
}

/* ════════════════════════════════════════════════════
   CUSTOMER DATABASE — ADMIN
════════════════════════════════════════════════════ */
function getDaysSinceVisit(lastVisit) {
  if (!lastVisit) return 9999;
  const last = new Date(lastVisit); const now = new Date();
  return Math.floor((now - last) / (1000*60*60*24));
}
function computeCustomerStatus(c) {
  const days = getDaysSinceVisit(c.lastVisit);
  if (days >= 180) return 'inactive';
  if (days >= 120) return 'warning';
  return 'active';
}

function renderCustomerTable() {
  const q = (g('cust-search-input')?.value||'').toLowerCase();
  const statusF = g('cust-filter-status')?.value||'';
  let list = state.customers.map(c => ({...c, status: computeCustomerStatus(c)}));
  if (q) list = list.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  if (statusF) list = list.filter(c => c.status === statusF);

  const tbody = g('customer-table-body');
  if (!tbody) return;
  tbody.innerHTML = list.map(c => {
    const days = getDaysSinceVisit(c.lastVisit);
    const statusBadge = c.status==='active'
      ? `<span class="active-badge">● Active</span>`
      : c.status==='warning'
      ? `<span class="warn-badge">⚠ ${days}d ago</span>`
      : `<span class="inactive-badge">✕ ${days}d ago</span>`;
    return `<tr class="${c.status==='inactive'?'inactive-row':''}">
      <td style="font-family:var(--font-mono);font-size:0.78rem;color:var(--accent)">${c.id}</td>
      <td style="font-weight:600">${c.name}</td>
      <td style="font-size:0.78rem;color:var(--muted)">${c.phone}</td>
      <td style="text-align:center">${c.members}</td>
      <td style="font-size:0.78rem;color:var(--muted)">${c.lastVisit||'Never'}</td>
      <td>${statusBadge}</td>
      <td style="display:flex;gap:0.4rem">
        ${c.status==='inactive'?`<button class="btn btn-warn btn-sm" onclick="sendInactiveMsg('${c.id}')">📩 Msg</button>`:''}
        ${c.status!=='inactive'?`<button class="btn btn-outline btn-sm" onclick="viewCustomerTxns('${c.id}')">📋</button>`:''}
        <button class="btn btn-danger btn-sm" onclick="toggleCardStatus('${c.id}')">${c.status==='inactive'?'Activate':'Deactivate'}</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" style="text-align:center;padding:18px;color:var(--muted)">No customers found</td></tr>';
}

function toggleCardStatus(id) {
  const c = state.customers.find(c=>c.id===id); if(!c) return;
  const days = getDaysSinceVisit(c.lastVisit);
  if (days < 180 && c.status !== 'inactive') {
    // Force deactivate
    c.lastVisit = daysAgo(200); // simulate
    showToast(`🔴 Card ${id} deactivated — customer notified`,'warn');
  } else {
    c.lastVisit = new Date().toLocaleDateString('en-IN');
    showToast(`✅ Card ${id} reactivated`,'success');
  }
  saveState(); renderCustomerTable();
}

function sendInactiveMsg(id) {
  const c = state.customers.find(c=>c.id===id); if(!c) return;
  const days = getDaysSinceVisit(c.lastVisit);
  showToast(`📩 Message sent to ${c.name}: "Your ration card (${c.id}) has been inactive for ${days} days. Please visit soon to avoid deactivation."`, 'warn');
}

function viewCustomerTxns(id) {
  navigate('transactions-admin');
  setTimeout(() => { if(g('txn-search-input')) g('txn-search-input').value = id; renderTransactionList(); }, 100);
}

function openAddCustomerModal() { g('add-customer-modal').classList.add('show'); }
function closeAddCustomerModal() { g('add-customer-modal').classList.remove('show'); }
function submitNewCustomer() {
  const name=(g('new-cust-name').value||'').trim();
  const card=(g('new-cust-card').value||'').trim().toUpperCase();
  if(!name||!card){showToast('Name and Card number required','error');return;}
  if(state.customers.find(c=>c.id===card)){showToast('Card number already exists','error');return;}
  state.customers.push({
    id:card,name,phone:g('new-cust-phone').value||'—',
    members:parseInt(g('new-cust-members').value)||1,
    address:g('new-cust-address').value||'—',
    lastVisit:new Date().toLocaleDateString('en-IN'),status:'active'
  });
  saveState(); renderCustomerTable(); closeAddCustomerModal();
  showToast(`✅ Customer ${name} added!`,'success');
}

/* ════════════════════════════════════════════════════
   TRANSACTIONS
════════════════════════════════════════════════════ */
function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr); const now = new Date();
  return d.toDateString() === now.toDateString();
}

function renderTransactionList() {
  const q = (g('txn-search-input')?.value||'').toLowerCase();
  const df = g('txn-date-filter')?.value||'';
  let list = state.transactions;
  if(q) list=list.filter(t=>t.customerName.toLowerCase().includes(q)||t.cardId.toLowerCase().includes(q));
  if(df==='today') list=list.filter(t=>isToday(t.date));
  const el=g('txn-list-container'); if(!el) return;
  if(!list.length){el.innerHTML='<div class="empty-state"><div class="es-icon">📄</div><p>No transactions found.</p></div>';return;}
  el.innerHTML=list.slice().reverse().map(t=>`
    <div class="txn-item">
      <div class="txn-icon">🧾</div>
      <div class="txn-info">
        <div class="txn-name">${t.customerName} <span style="font-size:0.7rem;color:var(--muted);font-family:var(--font-mono)">${t.cardId}</span></div>
        <div class="txn-meta">${t.items.map(i=>`${i.name} ×${i.qty}`).join(' · ')} · ${new Date(t.date).toLocaleString('en-IN')}</div>
      </div>
      <div class="txn-amount">₹${t.total}</div>
    </div>`).join('');
}

/* ════════════════════════════════════════════════════
   VENDOR — BILLING
════════════════════════════════════════════════════ */
let foundCustomer = null;
let selectedBillItems = {}; // {itemId: qty}

function renderVendorHome() {
  updateShopUI();
  const done=state.tokens.filter(t=>t.status==='done').length;
  const queue=state.tokens.filter(t=>t.status==='waiting').length;
  const cur=state.tokens.find(t=>t.status==='current');
  const todayBills=state.transactions.filter(t=>isToday(t.date)).length;
  const set=(id,val)=>{const el=g(id);if(el)el.textContent=val;};
  set('v-bills-today',todayBills);
  set('v-current-token',cur?`#${cur.id}`:'—');
  set('v-queue-count',queue);
  renderVendorTodayBills();
}

function renderVendorTodayBills() {
  const el=g('vendor-today-bills'); if(!el) return;
  const today=state.transactions.filter(t=>isToday(t.date));
  if(!today.length){el.innerHTML='<div class="empty-state"><div class="es-icon">🧾</div><p>No bills today yet.</p></div>';return;}
  el.innerHTML=today.slice().reverse().map(t=>`
    <div class="txn-item">
      <div class="txn-icon">🧾</div>
      <div class="txn-info">
        <div class="txn-name">${t.customerName}</div>
        <div class="txn-meta" style="font-size:0.72rem">${t.items.map(i=>`${i.name}×${i.qty}`).join(', ')}</div>
      </div>
      <div class="txn-amount">₹${t.total}</div>
    </div>`).join('');
}

function liveSearchCustomer() {
  const val=(g('vendor-card-input').value||'').trim().toUpperCase();
  const res=g('customer-search-results');
  if(val.length<3){res.innerHTML='';g('found-customer-section').style.display='none';foundCustomer=null;return;}
  const matches=state.customers.filter(c=>c.id.includes(val)||c.name.toUpperCase().includes(val));
  if(!matches.length){res.innerHTML='<div style="color:var(--muted);font-size:0.82rem;padding:0.5rem 0">No customer found for this card number.</div>';g('found-customer-section').style.display='none';return;}
  res.innerHTML=matches.map(c=>`
    <div onclick="selectCustomer('${c.id}')" style="padding:0.6rem 0.85rem;background:var(--surface);border:1px solid var(--border);border-radius:9px;cursor:pointer;margin-top:0.4rem;transition:all 0.2s" 
      onmouseover="this.style.borderColor='var(--orange)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="font-weight:600;font-size:0.88rem">${c.name}</div>
      <div style="font-size:0.73rem;color:var(--muted);font-family:var(--font-mono)">${c.id} · ${c.members} members</div>
    </div>`).join('');
}

function selectCustomer(id) {
  const c = state.customers.find(c=>c.id===id); if(!c) return;
  foundCustomer = {...c, status: computeCustomerStatus(c)};
  selectedBillItems = {};
  g('vendor-card-input').value = c.id;
  g('customer-search-results').innerHTML='';
  g('found-customer-section').style.display='block';
  g('found-cust-name').textContent = c.name;
  g('found-cust-card').textContent = c.id;
  g('found-cust-info-rows').innerHTML = `
    <span>👥 ${c.members} members</span>
    <span>📍 ${c.address}</span>
    <span>📞 ${c.phone}</span>`;
  const days=getDaysSinceVisit(c.lastVisit);
  g('found-cust-last-visit').textContent = `Last visit: ${c.lastVisit||'Never'} (${days} days ago)`;

  const badge=g('found-cust-status-badge');
  if (foundCustomer.status==='inactive') {
    badge.innerHTML='<span class="card-badge card-inactive">✕ INACTIVE</span>';
    g('inactive-warning').style.display='block';
    g('inactive-warning').textContent=`⚠️ This card has been inactive for ${days} days (threshold: 180 days). Card is deactivated. Cannot process bill until reactivated by admin.`;
    g('generate-bill-btn').disabled=true; g('generate-bill-btn').style.opacity='0.5';
  } else if (foundCustomer.status==='warning') {
    badge.innerHTML='<span class="card-badge card-warning">⚠ AT RISK</span>';
    g('inactive-warning').style.display='block';
    g('inactive-warning').textContent=`⚠️ This card has not been used for ${days} days. Cards inactive for 180+ days will be deactivated automatically.`;
    g('generate-bill-btn').disabled=false; g('generate-bill-btn').style.opacity='1';
  } else {
    badge.innerHTML='<span class="card-badge card-active">● ACTIVE</span>';
    g('inactive-warning').style.display='none';
    g('generate-bill-btn').disabled=false; g('generate-bill-btn').style.opacity='1';
  }
  renderItemSelector();
}

function renderItemSelector() {
  const el=g('item-selector'); if(!el) return;
  const avail=state.items.filter(i=>i.avail);
  el.innerHTML=avail.map(item=>{
    const qty=selectedBillItems[item.id]||0;
    return `<div class="item-select-row ${qty>0?'selected':''}" id="irow-${item.id}">
      <div class="item-select-emoji">${item.emoji}</div>
      <div class="item-select-info">
        <div class="item-select-name">${item.name}</div>
        <div class="item-select-meta">${item.alloc} · ${item.price} · Stock: ${item.stockQty}</div>
      </div>
      <div class="item-qty-ctrl">
        <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
        <div class="qty-val" id="qty-${item.id}">${qty}</div>
        <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
      </div>
    </div>`;
  }).join('');
  updateBillPreview();
}

function changeQty(id, delta) {
  const item=state.items.find(i=>i.id===id); if(!item) return;
  const cur=selectedBillItems[id]||0;
  const newQ=Math.max(0,cur+delta);
  // Max qty = 1 unit (one allocation per card per visit)
  const maxQ=1;
  selectedBillItems[id]=Math.min(newQ,maxQ);
  const qEl=g('qty-'+id); if(qEl) qEl.textContent=selectedBillItems[id];
  const rowEl=g('irow-'+id); if(rowEl) rowEl.className=`item-select-row ${selectedBillItems[id]>0?'selected':''}`;
  updateBillPreview();
}

function updateBillPreview() {
  const bp=g('bill-preview'); if(!bp) return;
  const items=Object.entries(selectedBillItems).filter(([,q])=>q>0).map(([id,q])=>{
    const item=state.items.find(i=>i.id===parseInt(id));
    return {item, qty:q, subtotal:item.priceNum*q};
  });
  if(!items.length){bp.style.display='none';return;}
  const total=items.reduce((a,b)=>a+b.subtotal,0);
  bp.style.display='block';
  bp.innerHTML=`<div class="bill-header">🧾 Bill Preview <span style="color:var(--accent);font-family:var(--font-mono)">₹${total}</span></div>`
    +items.map(({item,qty,subtotal})=>`<div class="bill-row"><span class="bill-item-name">${item.emoji} ${item.name} ×${qty}</span><span class="bill-item-price">₹${subtotal}</span></div>`).join('')
    +`<div class="bill-row total"><span>Total</span><span style="color:var(--accent)">₹${total}</span></div>`;
}

function clearVendorSearch() {
  foundCustomer=null; selectedBillItems={};
  g('vendor-card-input').value=''; g('customer-search-results').innerHTML='';
  g('found-customer-section').style.display='none';
}

function printBill() { window.print(); }

function printBill() {
    const element = document.getElementById('bill-receipt-content'); // The content you want to convert to PDF
    const customerName = pendingBill?.customer?.name || 'Customer'; // Get customer name for filename
    const transactionId = pendingBill?.id || 'TXN_Unknown'; // Get transaction ID for filename

    html2pdf(element, {
        margin: 10,
        filename: `${customerName}_RationBill_${transactionId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).then(() => {
        showToast('✅ Bill downloaded as PDF!', 'success');
    }).catch(error => {
        console.error('Error generating PDF:', error);
        showToast('❌ Failed to download bill.', 'error');
    });
}


function generateOTP() { return String(Math.floor(100000 + Math.random()*900000)); }

function initiateBill() {
  if(!foundCustomer){showToast('Select a customer first','error');return;}
  if(foundCustomer.status==='inactive'){showToast('This card is deactivated. Contact admin.','error');return;}
  const items=Object.entries(selectedBillItems).filter(([,q])=>q>0).map(([id,q])=>{
    const item=state.items.find(i=>i.id===parseInt(id));
    return {itemId:parseInt(id),name:item.name,emoji:item.emoji,qty:q,price:item.priceNum,subtotal:item.priceNum*q};
  });
  if(!items.length){showToast('Please select at least one item','error');return;}
  const total=items.reduce((a,b)=>a+b.subtotal,0);
  const otp=generateOTP();
  pendingBill={customer:foundCustomer,items,total,otp};

  // Show OTP modal
  g('otp-display').textContent=otp;
  g('otp-sub-text').textContent=`Show this OTP to ${foundCustomer.name} to confirm distribution`;
  g('otp-verify-input').value='';
  g('otp-overlay').classList.add('show');
  startOTPTimer();
}

function startOTPTimer() {
  if(otpTimer) clearInterval(otpTimer);
  otpSeconds=300;
  const timerEl=g('otp-countdown');
  otpTimer=setInterval(()=>{
    otpSeconds--;
    const m=Math.floor(otpSeconds/60), s=otpSeconds%60;
    if(timerEl) timerEl.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    if(otpSeconds<=0){clearInterval(otpTimer);closeOTPModal();showToast('OTP expired. Please try again.','error');}
  },1000);
}

function checkOTP() {
  const entered=(g('otp-verify-input').value||'').trim();
  if(entered===pendingBill?.otp){
    g('otp-verify-input').style.borderColor='var(--green)';
  } else {
    g('otp-verify-input').style.borderColor='var(--border)';
  }
}

function verifyAndBill() {
  const entered=(g('otp-verify-input').value||'').trim();
  if(!pendingBill){return;}
  if(entered!==pendingBill.otp){showToast('❌ Incorrect OTP. Please try again.','error');return;}
  closeOTPModal();
  completeBill();
}

function closeOTPModal() {
  if(otpTimer) clearInterval(otpTimer);
  g('otp-overlay').classList.remove('show');
}

function completeBill() {
  if(!pendingBill) return;
  const {customer,items,total,otp} = pendingBill;

  // Deduct stock
  items.forEach(item=>{
    const si=state.items.find(i=>i.id===item.itemId);
    if(si) si.stockQty=Math.max(0,si.stockQty-(item.qty*si.unitKg));
  });

  // Update customer last visit
  const cust=state.customers.find(c=>c.id===customer.id);
  if(cust) cust.lastVisit=new Date().toLocaleDateString('en-IN');

  // Save transaction
  const txn={
    id:'TXN'+Date.now(), cardId:customer.id, customerName:customer.name,
    items:items.map(i=>({name:i.name,qty:i.qty,subtotal:i.subtotal})),
    total, date:new Date().toISOString(), otp
  };
  state.transactions.push(txn);
  saveState();

  // Show receipt
  showBillReceipt(txn, customer, items, total, otp);
  clearVendorSearch();
  renderVendorHome();
}

function showBillReceipt(txn, customer, items, total, otp) {
  const now=new Date();
  g('bill-receipt-content').innerHTML=`
    <div class="receipt-header">
      <div class="receipt-logo">⬡ RationNet</div>
      <div class="receipt-store">Villupuram Ration Shop · Government of Tamil Nadu</div>
      <div class="receipt-datetime">${now.toLocaleDateString('en-IN')} · ${now.toLocaleTimeString('en-IN')} · ${txn.id}</div>
    </div>
    <div class="receipt-customer-section">
      <div class="receipt-customer-label">Issued To</div>
      <div class="receipt-customer-name">${customer.name}</div>
      <div class="receipt-card-no">${customer.id} · ${customer.members} members · ${customer.address}</div>
    </div>
    <table class="receipt-items-table">
      <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        ${items.map(i=>`<tr><td>${i.emoji} ${i.name}</td><td>${i.qty} unit</td><td>₹${i.price}</td><td>₹${i.subtotal}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="receipt-total-section">
      <div class="receipt-total-row grand"><span>Total Amount</span><span>₹${total}</span></div>
      <div class="receipt-total-row"><span style="font-size:0.78rem;color:var(--muted)">Distribution Status</span><span class="active-badge">✅ Completed</span></div>
    </div>
    <div class="receipt-footer">
      <div style="font-size:0.73rem;color:var(--muted)">OTP Verified Receipt</div>
      <div class="receipt-otp-badge">
        <div class="receipt-otp-val">${otp}</div>
        <div class="receipt-otp-label">Verified OTP</div>
      </div>
      <div class="receipt-thanks">Thank you! Please visit again next month.<br>Items received as per government allocation.</div>
    </div>`;
  g('bill-modal-overlay').classList.add('show');
}

function closeBillModal() { g('bill-modal-overlay').classList.remove('show'); pendingBill=null; }
function printBill() { window.print(); }

/* ════════════════════════════════════════════════════
   COMPLAINTS — ADMIN
════════════════════════════════════════════════════ */
function renderAdminComplaints() {
  const el=g('admin-complaint-list'); if(!el) return;
  let list=state.complaints;
  if(complaintFilter!=='all') list=list.filter(c=>c.status===complaintFilter);
  if(!list.length){el.innerHTML='<div class="empty-state"><div class="es-icon">📭</div><p>No complaints here.</p></div>';return;}
  el.innerHTML=list.map(c=>`
    <div class="complaint-item">
      <div class="complaint-header">
        <span class="complaint-name">👤 ${c.name}${c.token?' — Token #'+c.token:''}</span>
        <span class="complaint-status ${c.status==='Resolved'?'resolved':''}">${c.status}</span>
      </div>
      <div style="font-size:0.7rem;color:var(--accent);margin-bottom:0.32rem">📂 ${c.cat}</div>
      <div class="complaint-text">${c.msg}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.55rem">
        <div style="font-size:0.7rem;color:var(--muted)">🕐 ${c.time}</div>
        ${c.status==='Pending'?`<button class="btn btn-success btn-sm" onclick="resolveComplaint(${c.id})">✅ Resolve</button>`:''}
      </div>
    </div>`).join('');
}
function filterComplaints(f) {
  complaintFilter=f;
  ['all','Pending','Resolved'].forEach(k=>{const btn=g('cf-'+k.toLowerCase());if(btn){btn.style.borderColor=k===f?'var(--accent)':'var(--border)';btn.style.color=k===f?'var(--accent)':'';}});
  renderAdminComplaints();
}
function resolveComplaint(id) {
  const c=state.complaints.find(c=>c.id===id);
  if(c){c.status='Resolved';saveState();renderAdminComplaints();renderAdminStats();showToast('✅ Complaint resolved!','success');}
}

/* ════════════════════════════════════════════════════
   CUSTOMER
════════════════════════════════════════════════════ */
function customerGetToken() {
  if(myToken){showToast('⚠️ You already have a token!','error');return;}
  const name=(g('cust-name').value||'').trim();
  const card=(g('cust-card').value||'').trim().toUpperCase();
  if(!name||!card){showToast('⚠️ Please enter your name and ration card number.','error');return;}
  // Check if card is in DB
  const dbCust=state.customers.find(c=>c.id===card);
  if(!dbCust){showToast('⚠️ Card number not found in database. Please contact admin.','error');return;}
  if(computeCustomerStatus(dbCust)==='inactive'){showToast('❌ Your card has been deactivated (inactive 180+ days). Please contact admin.','error');return;}
  state.tokenCounter++;
  const id=state.tokenCounter;
  state.tokens.push({id,status:'waiting',name});
  if(!state.tokens.find(t=>t.status==='current')){state.tokens[state.tokens.length-1].status='current';state.currentToken=id;}
  myToken={id,name,card}; saveMyToken(); saveState();
  renderCustomerMyToken(); renderCustomerHome();
  showToast(`🎫 Token #${id} generated! Welcome, ${name}!`,'success');
}
function cancelMyToken() {
  if(!myToken) return;
  if(!confirm('Cancel your token? You will lose your place in queue.')) return;
  const t=state.tokens.find(tk=>tk.id===myToken.id);
  if(t&&t.status!=='done'){
    state.tokens=state.tokens.filter(tk=>tk.id!==myToken.id);
    if(state.currentToken===myToken.id){state.currentToken=null;const nxt=state.tokens.find(tk=>tk.status==='waiting');if(nxt){nxt.status='current';state.currentToken=nxt.id;}}
    saveState();
  }
  myToken=null; saveMyToken(); renderCustomerMyToken(); renderCustomerHome(); showToast('Token cancelled.','error');
}
function renderCustomerMyToken() {
  const sec=g('my-token-section'); const getForm=g('get-token-section'); const already=g('already-has-token'); if(!sec) return;
  if(myToken){
    sec.style.display='block';
    g('my-token-num').textContent='#'+myToken.id;
    const t=state.tokens.find(tk=>tk.id===myToken.id); const statusEl=g('my-token-status');
    if(t){
      if(t.status==='current') statusEl.textContent='🟡 You are being served now!';
      else if(t.status==='done') statusEl.textContent='✅ Your token has been served.';
      else{const ahead=state.tokens.filter(tk=>tk.status==='waiting'&&tk.id<myToken.id).length;const cur=state.tokens.find(tk=>tk.status==='current');statusEl.textContent=`⏳ ${ahead} token(s) ahead of you${cur?' (Currently: #'+cur.id+')':''}`;}}
    else{statusEl.textContent='Token info unavailable.';}
    if(getForm) getForm.style.display='none'; if(already) already.style.display='block';
  } else{sec.style.display='none';if(getForm)getForm.style.display='block';if(already)already.style.display='none';}
}
function renderCustomerHome() {
  const done=state.tokens.filter(t=>t.status==='done').length;
  const queue=state.tokens.filter(t=>t.status==='waiting').length;
  const cur=state.tokens.find(t=>t.status==='current');
  const set=(id,val)=>{const el=g(id);if(el)el.textContent=val;};
  set('c-stat-current',cur?'#'+cur.id:'—'); set('c-stat-queue',queue); set('c-stat-done',done);
  set('c-ann-display',state.announcement); updateShopUI(); renderCustomerMyToken();
}
function renderCustomerTokenBoard() {
  const display=g('live-token-display'); const sub=g('live-token-sub');
  const cur=state.tokens.find(t=>t.status==='current');
  if(display){
    if(!state.shopOpen){display.innerHTML='<div class="live-token-none">CLOSED</div>';if(sub)sub.textContent='Shop is currently closed.';}
    else if(cur){display.innerHTML=`<div class="live-token-num">#${cur.id}</div>`;if(sub)sub.textContent=`${state.tokens.filter(t=>t.status==='waiting').length} token(s) waiting`;}
    else{display.innerHTML='<div class="live-token-none">—</div>';if(sub)sub.textContent='No token being served currently.';}
  }
  const lineEl=g('c-token-line-ui'); if(!lineEl) return;
  if(!state.tokens.length){lineEl.innerHTML='<div style="color:var(--muted);font-size:0.83rem">No tokens yet.</div>';return;}
  const fw=state.tokens.find(t=>t.status==='waiting');
  lineEl.innerHTML=state.tokens.map((t,i)=>{
    const isNext=t.status==='waiting'&&fw&&fw.id===t.id;
    let cls='waiting',sub='Waiting';
    if(t.status==='done'){cls='done';sub='Done';}else if(t.status==='current'){cls='current';sub='Now';}else if(isNext){cls='next';sub='Next';}
    return (i>0?'<div class="token-connector"></div>':'')+`<div class="token-chip"><div class="token-num ${cls}">#${t.id}</div><div class="token-lbl">${sub}</div></div>`;
  }).join('');
}
function renderItemsC(filter='') {
  const grid=g('c-items-grid'); if(!grid) return;
  const filtered=state.items.filter(i=>i.name.toLowerCase().includes(filter.toLowerCase())||i.cat.toLowerCase().includes(filter.toLowerCase()));
  if(!filtered.length){grid.innerHTML='<div class="empty-state" style="grid-column:1/-1"><div class="es-icon">🔍</div><p>No items match.</p></div>';return;}
  grid.innerHTML=filtered.map(item=>`
    <div class="item-card">
      <div class="item-img-wrap">${item.emoji}</div>
      <div class="item-body">
        <div class="item-name">${item.name}</div>
        <div class="item-detail">
          <div>Allocation: <strong>${item.alloc}</strong></div>
          <div>Rate: <strong>${item.price}</strong></div>
          <div>Stock: <strong style="color:${item.stockQty<50?'var(--danger)':item.stockQty<150?'var(--warn)':'var(--green)'}">${item.stockQty} units</strong></div>
        </div>
        <span class="item-tag ${item.avail?'item-avail':'item-unavail'}">${item.avail?'✅ Available':'❌ Out of Stock'}</span>
      </div>
    </div>`).join('');
}
function filterItemsC(){renderItemsC(g('c-item-search').value);}
function submitComplaint() {
  const name=(g('c-name').value||'').trim(); const token=(g('c-token-num').value||'').trim();
  const cat=g('c-cat').value; const msg=(g('c-msg').value||'').trim();
  if(!name||!msg){showToast('⚠️ Please fill Name and Complaint.','error');return;}
  const c={id:Date.now(),name,token,cat,msg,time:new Date().toLocaleString(),status:'Pending'};
  state.complaints.unshift(c); saveState(); renderCustomerComplaints();
  g('c-name').value=''; g('c-token-num').value=''; g('c-msg').value='';
  showToast('📝 Complaint submitted!','success');
}
function renderCustomerComplaints() {
  const el=g('c-complaint-list'); if(!el) return;
  if(!state.complaints.length){el.innerHTML='<div class="empty-state"><div class="es-icon">📭</div><p>No complaints yet.</p></div>';return;}
  el.innerHTML=state.complaints.map(c=>`
    <div class="complaint-item">
      <div class="complaint-header"><span class="complaint-name">👤 ${c.name}</span><span class="complaint-status ${c.status==='Resolved'?'resolved':''}">${c.status}</span></div>
      <div style="font-size:0.7rem;color:var(--accent);margin-bottom:0.32rem">📂 ${c.cat}</div>
      <div class="complaint-text">${c.msg}</div>
      <div style="font-size:0.7rem;color:var(--muted);margin-top:0.38rem">🕐 ${c.time}</div>
    </div>`).join('');
}

/* ════════════════════════════════════════════════════
   CHATBOT
════════════════════════════════════════════════════ */
function toggleChat(){g('chatbot-panel').classList.toggle('show');}
function addBotMsg(text){const c=g('chat-messages');if(!c)return;const d=document.createElement('div');d.className='chat-msg bot';d.innerHTML=`<div class="chat-bubble">${text}</div>`;c.appendChild(d);c.scrollTop=c.scrollHeight;}
function addUserMsg(text){const c=g('chat-messages');const d=document.createElement('div');d.className='chat-msg user';d.innerHTML=`<div class="chat-bubble">${text}</div>`;c.appendChild(d);c.scrollTop=c.scrollHeight;}
function quickAsk(q){addUserMsg(q);setTimeout(()=>processBot(q),300);}
function sendChat(){const input=g('chat-input');const text=input.value.trim();if(!text)return;addUserMsg(text);input.value='';setTimeout(()=>processBot(text),400);}
function processBot(text) {
  const t=text.toLowerCase();let reply='';
  const cur=state.tokens.find(tk=>tk.status==='current');
  const done=state.tokens.filter(tk=>tk.status==='done').length;
  const queue=state.tokens.filter(tk=>tk.status==='waiting').length;
  if(t.includes('current')||t.includes('serving')) reply=cur?`🟡 Currently serving Token #${cur.id}.`:'🔇 No token being served right now.';
  else if(t.includes('queue')||t.includes('waiting')) reply=`⏳ ${queue} token(s) in queue.`;
  else if(t.includes('done')||t.includes('complet')) reply=`✅ ${done} token(s) served today.`;
  else if(t.includes('item')||t.includes('available')||t.includes('stock')){
    const avail=state.items.filter(i=>i.avail).map(i=>i.name).join(', ');
    const out=state.items.filter(i=>!i.avail).map(i=>i.name).join(', ');
    reply=`✅ In stock: ${avail}.<br>❌ Out of stock: ${out}.`;
  }
  else if(t.includes('shop')||t.includes('open')||t.includes('close')){
    const s=getShopStatus();
    if(s==='open') reply='🟢 Shop is OPEN now. Hours: 9AM–1PM and 2PM–6PM.';
    else if(s==='lunch') reply='🟡 Shop is on LUNCH BREAK. Reopens at 2:00 PM.';
    else reply='🔴 Shop is CLOSED. Opens tomorrow at 9:00 AM.';
  }
  else if(t.includes('bill')||t.includes('otp')) reply='🧾 Bills are processed at the vendor counter. Customer needs ration card number.';
  else if(t.includes('hello')||t.includes('hi')) reply='👋 Hello! Ask me about tokens, items, bills or shop status.';
  else if(t.includes('help')) reply='I can answer:<br>• Current/next token<br>• Items in stock<br>• Queue length<br>• Shop open/closed<br>• Bill & OTP info';
  else reply="🤔 Try: 'current token', 'items', 'shop open' or 'queue'?";
  addBotMsg(reply);
}

/* ════════════════════════════════════════════════════
   TOAST / NOTIFICATION
════════════════════════════════════════════════════ */
function showToast(msg,type='success'){
  const ex=document.querySelector('.toast');if(ex)ex.remove();
  const t=document.createElement('div');t.className=`toast ${type}`;t.innerHTML=msg;
  document.body.appendChild(t);setTimeout(()=>t.remove(),3500);
}
function showNotification(text){
  const n=g('notif');g('notif-text').textContent=text;n.style.display='flex';setTimeout(()=>n.style.display='none',6000);
}

/* ════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════ */
function g(id){return document.getElementById(id);}

/* ════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════ */
loadState();
