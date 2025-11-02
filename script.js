/* TaskFlow JS (separate file)
   - add/edit/delete/complete
   - filter all/pending/completed
   - due date/time saved
   - persistent localStorage
   - animated background & UI
*/

(() => {
  const q = (sel, el=document) => el.querySelector(sel);
  const qa = (sel, el=document) => Array.from(el.querySelectorAll(sel));

  // DOM
  const titleEl = q('#title');
  const descEl = q('#desc');
  const dateEl = q('#date');
  const timeEl = q('#time');
  const addBtn = q('#addBtn');
  const taskList = q('#taskList');
  const emptyMessage = q('#emptyMessage');
  const quoteEl = q('#quote');
  const totalCountEl = q('#totalCount');
  const pendingCountEl = q('#pendingCount');
  const completedCountEl = q('#completedCount');
  const lastSavedEl = q('#lastSaved');
  const filters = qa('.filters button');
  const CLOCK = q('#clock');

  // state
  let tasks = []; // {id, title, desc, dueDateTime (iso|null), completed, createdAt}
  let filter = 'all';
  const QUOTES = [
    "Small steps lead to big change.",
    "Progress > Perfection.",
    "Focus on one thing at a time.",
    "Plan. Do. Review. Repeat.",
    "Win the morning, win the day."
  ];

  // utils
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const nowISO = () => new Date().toISOString();
  const formatDue = (iso) => {
    if(!iso) return 'No due date';
    const d = new Date(iso);
    const opts = { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' };
    return d.toLocaleString(undefined, opts);
  };

  // storage
  const save = () => {
    localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
    localStorage.setItem('taskflow_lastSaved', new Date().toISOString());
    lastSavedEl.textContent = new Date().toLocaleString();
  };
  const load = () => {
    try {
      const raw = localStorage.getItem('taskflow_tasks');
      tasks = raw ? JSON.parse(raw) : [];
      const last = localStorage.getItem('taskflow_lastSaved');
      lastSavedEl.textContent = last ? new Date(last).toLocaleString() : 'Never';
    } catch(e) { tasks = []; }
  };

  // render
  function render() {
    const filtered = tasks.filter(t => {
      if (filter === 'pending') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    });

    taskList.innerHTML = '';
    if (filtered.length === 0) {
      emptyMessage.style.display = 'flex';
      quoteEl.textContent = QUOTES[Math.floor(Math.random()*QUOTES.length)];
    } else {
      emptyMessage.style.display = 'none';
    }

    filtered.forEach(t => {
      const el = document.createElement('div');
      el.className = 'task' + (t.completed ? ' completed' : '');
      el.dataset.id = t.id;
      el.innerHTML = `
        <div class="left-dot" style="background:${t.completed ? 'linear-gradient(90deg,var(--accent),var(--accent-2))' : '#7b8ca6'}"></div>
        <div class="meta">
          <h3>
            <span>${escapeHtml(t.title)}</span>
            <span class="small muted">${t.completed ? '' : (t.dueDateTime ? '<span class="pill small">'+formatDue(t.dueDateTime)+'</span>' : '')}</span>
          </h3>
          ${t.desc ? `<p>${escapeHtml(t.desc)}</p>` : ''}
          <div class="due small muted">Created: ${new Date(t.createdAt).toLocaleString()}</div>
        </div>
        <div class="controls">
          <button class="icon-btn toggle" title="Toggle complete">${t.completed ? '↺' : '✓'}</button>
          <button class="icon-btn edit" title="Edit task">✏️</button>
          <button class="icon-btn del" title="Delete task">🗑️</button>
        </div>
      `;
      taskList.appendChild(el);
    });

    totalCountEl.textContent = tasks.length;
    pendingCountEl.textContent = tasks.filter(t=>!t.completed).length;
    completedCountEl.textContent = tasks.filter(t=>t.completed).length;
  }

  // sanitize minimal
  function escapeHtml(str=''){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // actions
  function addTaskFromForm(){
    const title = titleEl.value.trim();
    if (!title) { titleEl.focus(); return; }

    const desc = descEl.value.trim();
    let due = null;
    if (dateEl.value) {
      const timeVal = timeEl.value || '00:00';
      const dueDate = new Date(dateEl.value + 'T' + timeVal + ':00');
      if (!isNaN(dueDate)) due = dueDate.toISOString();
      else due = null;
    }

    const t = { id: uid(), title, desc, dueDateTime: due, completed: false, createdAt: nowISO() };
    tasks.unshift(t);
    save();
    render();
    titleEl.value = ''; descEl.value=''; dateEl.value=''; timeEl.value='';
    titleEl.focus();
  }

  function toggleComplete(id){
    const t = tasks.find(x=>x.id===id);
    if (!t) return;
    t.completed = !t.completed;
    save(); render();
    if (t.completed) confettiMini();
  }

  function deleteTask(id){
    tasks = tasks.filter(x=>x.id!==id);
    save(); render();
  }

  function openEdit(id){
    const t = tasks.find(x=>x.id===id);
    if (!t) return;
    const newTitle = prompt('Edit title', t.title);
    if (newTitle === null) return;
    const newDesc = prompt('Edit description', t.desc);
    t.title = newTitle.trim() || t.title;
    t.desc = (newDesc===null)?t.desc:newDesc.trim();
    save(); render();
  }

  function clearCompleted(){
    tasks = tasks.filter(t => !t.completed);
    save(); render();
  }

  // confetti mini
  function confettiMini(){
    for (let i=0;i<18;i++){
      const p = document.createElement('div');
      p.style.position='fixed';
      p.style.left = (50 + (Math.random()*80-40))+'%';
      p.style.top = (40 + Math.random()*20)+'%';
      p.style.width='8px'; p.style.height='12px';
      p.style.background = ['#60e6b0','#4facfe','#ff8aa0','#ffd66b'][Math.floor(Math.random()*4)];
      p.style.opacity='0.95';
      p.style.transform = `translateY(0) rotate(${Math.random()*360}deg)`;
      p.style.borderRadius='2px';
      p.style.zIndex=9999;
      p.style.pointerEvents='none';
      p.style.transition='transform 900ms cubic-bezier(.3,.7,.2,1), opacity 900ms';
      document.body.appendChild(p);
      requestAnimationFrame(()=> {
        p.style.transform = `translateY(${120+Math.random()*120}px) rotate(${Math.random()*360}deg)`;
        p.style.opacity='0';
      });
      setTimeout(()=> p.remove(), 1000);
    }
  }

  // events
  titleEl.addEventListener('keydown', (e)=> {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addTaskFromForm(); }
  });

  addBtn.addEventListener('click', (e)=>{ e.preventDefault(); addTaskFromForm(); });
  q('#clearAll').addEventListener('click',(e)=>{ e.preventDefault(); clearCompleted(); });

  taskList.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button');
    if (!btn) return;
    const taskEl = ev.target.closest('.task');
    if (!taskEl) return;
    const id = taskEl.dataset.id;
    if (btn.classList.contains('toggle')) toggleComplete(id);
    else if (btn.classList.contains('edit')) openEdit(id);
    else if (btn.classList.contains('del')) {
      if (confirm('Delete this task?')) deleteTask(id);
    }
  });

  filters.forEach(b => b.addEventListener('click', ()=>{
    filters.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    filter = b.dataset.filter;
    render();
  }));

  // load & init
  load(); render();

  // live clock
  function updateClock(){
    const d = new Date();
    CLOCK.textContent = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    requestAnimationFrame(updateClock);
  }
  updateClock();

  // autosave snapshot loop
  let lastSnapshot = JSON.stringify(tasks);
  setInterval(()=>{
    const cur = JSON.stringify(tasks);
    if (cur !== lastSnapshot) { save(); lastSnapshot = cur; }
  }, 5000);

  // demo starter if empty
  if (!tasks.length){
    tasks.push({ id: uid(), title: "Welcome to TaskFlow", desc: "Try adding a new task — set a due date & time.", dueDateTime: null, completed:false, createdAt: nowISO() });
    save(); render();
  }

})();
