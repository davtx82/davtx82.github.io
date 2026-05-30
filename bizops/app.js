'use strict';

// ─── Data layer ───────────────────────────────────────────────────────────────

const DEMO_LEADS = [
  { id: 'l1', name: 'Sarah Chen', company: 'Bright Bakery Co.', phone: '555-210-4488', email: 'sarah@brightbakery.com', status: 'Waiting', value: 3200, followUp: daysFromNow(-3), notes: 'Interested in monthly bookkeeping package. Waiting on her to review proposal.' },
  { id: 'l2', name: 'Marcus Rivera', company: 'Rivera Plumbing LLC', phone: '555-334-9921', email: 'marcus@riveraplumbing.com', status: 'New', value: 1800, followUp: daysFromNow(2), notes: 'Referred by Judy Kim. Needs invoice automation help.' },
  { id: 'l3', name: 'Tamara Wells', company: 'Wells Real Estate', phone: '555-882-3310', email: 'tamara@wellsrealty.com', status: 'Contacted', value: 5500, followUp: daysFromNow(-1), notes: 'Had initial call. Wants to see a demo of the dashboard.' },
  { id: 'l4', name: 'James Okafor', company: 'Okafor Auto Detail', phone: '555-561-7743', email: 'james@okaforauto.com', status: 'Won', value: 2400, followUp: daysFromNow(14), notes: 'Signed contract. Onboarding starts next Monday.' },
  { id: 'l5', name: 'Linda Park', company: 'Park Fitness Studio', phone: '555-743-2280', email: 'linda@parkfitness.com', status: 'Waiting', value: 4100, followUp: daysFromNow(-5), notes: 'Sent proposal two weeks ago. No response yet — follow up again.' },
  { id: 'l6', name: 'Derek Thompson', company: 'Thompson Landscaping', phone: '555-929-5567', email: 'derek@thompsonlawn.com', status: 'Lost', value: 1200, followUp: null, notes: 'Decided to go with a competitor. May revisit in Q3.' },
  { id: 'l7', name: 'Aisha Nwosu', company: 'Nwosu Consulting', phone: '555-448-3392', email: 'aisha@nwosuconsult.com', status: 'New', value: 6800, followUp: daysFromNow(1), notes: 'Big opportunity — full ops setup. Schedule discovery call.' },
];

const DEMO_TASKS = [
  { id: 't1', title: 'Send revised proposal', leadId: 'l1', dueDate: daysFromNow(-2), priority: 'High', status: 'Open' },
  { id: 't2', title: 'Follow up call with Tamara', leadId: 'l3', dueDate: daysFromNow(0), priority: 'High', status: 'Open' },
  { id: 't3', title: 'Prepare demo for Aisha', leadId: 'l7', dueDate: daysFromNow(1), priority: 'Medium', status: 'Open' },
  { id: 't4', title: 'Send onboarding docs to James', leadId: 'l4', dueDate: daysFromNow(0), priority: 'Medium', status: 'Open' },
  { id: 't5', title: 'Check in on Linda proposal', leadId: 'l5', dueDate: daysFromNow(-4), priority: 'High', status: 'Open' },
  { id: 't6', title: 'Update CRM notes after call', leadId: 'l2', dueDate: daysFromNow(-1), priority: 'Low', status: 'Done' },
  { id: 't7', title: 'Research Marcus competitors', leadId: 'l2', dueDate: daysFromNow(3), priority: 'Low', status: 'Open' },
];

const DEMO_ACTIVITY = [
  { text: 'Aisha Nwosu added as new lead ($6,800)', time: 'Today, 9:14 AM', type: 'primary' },
  { text: 'Task "Follow up call with Tamara" is due today', time: 'Today, 8:00 AM', type: 'warn' },
  { text: 'James Okafor marked Won — contract signed!', time: 'Yesterday, 4:32 PM', type: 'success' },
  { text: 'Linda Park follow-up is 5 days overdue', time: 'Yesterday, 8:00 AM', type: 'danger' },
  { text: 'Marcus Rivera added via referral', time: '2 days ago', type: 'primary' },
  { text: 'Derek Thompson marked Lost', time: '3 days ago', type: 'danger' },
];

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function uid() { return '_' + Math.random().toString(36).slice(2, 10); }

const DB = {
  get leads() { return JSON.parse(localStorage.getItem('biz_leads') || 'null') || [...DEMO_LEADS]; },
  set leads(v) { localStorage.setItem('biz_leads', JSON.stringify(v)); },
  get tasks() { return JSON.parse(localStorage.getItem('biz_tasks') || 'null') || [...DEMO_TASKS]; },
  set tasks(v) { localStorage.setItem('biz_tasks', JSON.stringify(v)); },
  get activity() { return JSON.parse(localStorage.getItem('biz_activity') || 'null') || [...DEMO_ACTIVITY]; },
  set activity(v) { localStorage.setItem('biz_activity', JSON.stringify(v)); },
  reset() {
    localStorage.removeItem('biz_leads');
    localStorage.removeItem('biz_tasks');
    localStorage.removeItem('biz_activity');
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().split('T')[0]; }
function isOverdue(dateStr) { return dateStr && dateStr < today(); }

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[+m - 1]} ${+d}, ${y}`;
}

function leadById(id) { return DB.leads.find(l => l.id === id); }

function addActivity(text, type = 'primary') {
  const now = new Date();
  const time = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  const acts = DB.activity;
  acts.unshift({ text, time, type });
  DB.activity = acts.slice(0, 20);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function statusBadge(status) {
  const map = { New: 'badge-new', Contacted: 'badge-contacted', Waiting: 'badge-waiting', Won: 'badge-won', Lost: 'badge-lost', Open: 'badge-open', Done: 'badge-done' };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

function priorityBadge(p) {
  const map = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
  return `<span class="badge ${map[p] || ''}">${p}</span>`;
}

function fmtCurrency(n) { return '$' + (+n || 0).toLocaleString(); }

// ─── Router ───────────────────────────────────────────────────────────────────

let currentPage = 'dashboard';

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`nav a[data-page="${page}"]`).classList.add('active');
  document.getElementById('hero').style.display = page === 'dashboard' ? 'block' : 'none';
  closeSidebar();
  renderPage(page);
}

function renderPage(page) {
  if (page === 'dashboard') renderDashboard();
  else if (page === 'leads') renderLeads();
  else if (page === 'tasks') renderTasks();
  else if (page === 'settings') renderSettings();
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function renderDashboard() {
  const leads = DB.leads;
  const tasks = DB.tasks;
  const activeLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost');
  const overdueFollowups = activeLeads.filter(l => isOverdue(l.followUp));
  const openRevenue = activeLeads.reduce((s, l) => s + (+l.value || 0), 0);
  const tasksDueToday = tasks.filter(t => t.status === 'Open' && t.dueDate === today());

  document.getElementById('stat-leads').textContent = activeLeads.length;
  document.getElementById('stat-overdue').textContent = overdueFollowups.length;
  document.getElementById('stat-revenue').textContent = fmtCurrency(openRevenue);
  document.getElementById('stat-tasks').textContent = tasksDueToday.length;

  const priorityLeads = activeLeads
    .filter(l => l.followUp)
    .sort((a, b) => a.followUp.localeCompare(b.followUp))
    .slice(0, 5);

  document.getElementById('priority-followups').innerHTML = priorityLeads.length === 0
    ? `<tr><td colspan="4" class="empty-state"><p>No upcoming follow-ups</p></td></tr>`
    : priorityLeads.map(l => {
        const over = isOverdue(l.followUp);
        return `<tr class="${over ? 'row-overdue' : ''}">
          <td><strong>${l.name}</strong><br><span style="color:var(--text-muted);font-size:12px">${l.company}</span></td>
          <td>${statusBadge(l.status)}</td>
          <td>${over ? `<span class="badge badge-overdue">Overdue</span>` : formatDate(l.followUp)}</td>
          <td>${fmtCurrency(l.value)}</td>
        </tr>`;
      }).join('');

  document.getElementById('activity-list').innerHTML = DB.activity.slice(0, 8).map(a =>
    `<div class="activity-item">
      <div class="activity-dot ${a.type === 'warn' ? 'warn' : a.type === 'danger' ? 'danger' : a.type === 'success' ? 'success' : ''}"></div>
      <div>
        <div class="activity-text">${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>`
  ).join('');
}

// ─── Leads ────────────────────────────────────────────────────────────────────

let leadSearch = '';
let leadFilter = 'All';

function renderLeads() {
  let leads = DB.leads;
  if (leadFilter !== 'All') leads = leads.filter(l => l.status === leadFilter);
  if (leadSearch) {
    const q = leadSearch.toLowerCase();
    leads = leads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q)
    );
  }

  document.getElementById('leads-tbody').innerHTML = leads.length === 0
    ? `<tr><td colspan="7"><div class="empty-state"><div class="icon">📭</div><p>No leads found</p></div></td></tr>`
    : leads.map(l => {
        const over = isOverdue(l.followUp) && l.status !== 'Won' && l.status !== 'Lost';
        return `<tr class="${over ? 'row-overdue' : ''}">
          <td><strong>${l.name}</strong></td>
          <td>${l.company}</td>
          <td>${statusBadge(l.status)}</td>
          <td>${fmtCurrency(l.value)}</td>
          <td>${over ? `<span class="badge badge-overdue">Overdue</span>` : formatDate(l.followUp)}</td>
          <td style="color:var(--text-muted);font-size:12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.notes || '—'}</td>
          <td style="white-space:nowrap">
            <button class="btn btn-ghost btn-sm" onclick="openLeadModal('${l.id}')">Edit</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteLead('${l.id}')">Delete</button>
          </td>
        </tr>`;
      }).join('');
}

function openLeadModal(id) {
  const lead = id ? leadById(id) : null;
  document.getElementById('lead-modal-title').textContent = lead ? 'Edit Lead' : 'New Lead';
  document.getElementById('lead-id').value = lead ? lead.id : '';
  document.getElementById('lead-name').value = lead ? lead.name : '';
  document.getElementById('lead-company').value = lead ? lead.company : '';
  document.getElementById('lead-phone').value = lead ? lead.phone : '';
  document.getElementById('lead-email').value = lead ? lead.email : '';
  document.getElementById('lead-status').value = lead ? lead.status : 'New';
  document.getElementById('lead-value').value = lead ? lead.value : '';
  document.getElementById('lead-followup').value = lead ? (lead.followUp || '') : '';
  document.getElementById('lead-notes').value = lead ? (lead.notes || '') : '';
  document.getElementById('lead-modal').classList.add('open');
}

function closeLeadModal() { document.getElementById('lead-modal').classList.remove('open'); }

function saveLead() {
  const id = document.getElementById('lead-id').value;
  const data = {
    name: document.getElementById('lead-name').value.trim(),
    company: document.getElementById('lead-company').value.trim(),
    phone: document.getElementById('lead-phone').value.trim(),
    email: document.getElementById('lead-email').value.trim(),
    status: document.getElementById('lead-status').value,
    value: +document.getElementById('lead-value').value || 0,
    followUp: document.getElementById('lead-followup').value || null,
    notes: document.getElementById('lead-notes').value.trim(),
  };
  if (!data.name) { alert('Name is required'); return; }
  const leads = DB.leads;
  if (id) {
    const i = leads.findIndex(l => l.id === id);
    leads[i] = { ...leads[i], ...data };
    addActivity(`Updated lead: ${data.name}`, 'primary');
    showToast('Lead updated');
  } else {
    leads.push({ id: uid(), ...data });
    addActivity(`New lead added: ${data.name} (${fmtCurrency(data.value)})`, 'primary');
    showToast('Lead added');
  }
  DB.leads = leads;
  closeLeadModal();
  renderLeads();
  if (currentPage === 'dashboard') renderDashboard();
}

function deleteLead(id) {
  if (!confirm('Delete this lead?')) return;
  const leads = DB.leads;
  const lead = leads.find(l => l.id === id);
  DB.leads = leads.filter(l => l.id !== id);
  if (lead) addActivity(`Deleted lead: ${lead.name}`, 'danger');
  showToast('Lead deleted');
  renderLeads();
  if (currentPage === 'dashboard') renderDashboard();
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

let taskFilter = 'All';

function renderTasks() {
  let tasks = DB.tasks;
  if (taskFilter === 'Open') tasks = tasks.filter(t => t.status === 'Open');
  else if (taskFilter === 'Done') tasks = tasks.filter(t => t.status === 'Done');
  else if (taskFilter === 'Overdue') tasks = tasks.filter(t => t.status === 'Open' && isOverdue(t.dueDate));

  tasks = [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Open' ? -1 : 1;
    const pMap = { High: 0, Medium: 1, Low: 2 };
    return (pMap[a.priority] || 0) - (pMap[b.priority] || 0);
  });

  document.getElementById('tasks-tbody').innerHTML = tasks.length === 0
    ? `<tr><td colspan="6"><div class="empty-state"><div class="icon">✅</div><p>No tasks here</p></div></td></tr>`
    : tasks.map(t => {
        const over = t.status === 'Open' && isOverdue(t.dueDate);
        const lead = t.leadId ? leadById(t.leadId) : null;
        const dueTd = over ? `<span class="badge badge-overdue">Overdue</span>` : formatDate(t.dueDate);
        return `<tr class="${over ? 'row-overdue' : ''} ${t.status === 'Done' ? 'row-done' : ''}">
          <td class="task-title-cell">
            <input type="checkbox" ${t.status === 'Done' ? 'checked' : ''} onchange="toggleTask('${t.id}', this.checked)">
            <div class="task-title-wrap">
              <strong>${t.title}</strong>
              <div class="task-meta-mobile">
                ${lead ? `<span>${lead.name}</span>` : ''}
                ${t.dueDate ? `<span>${dueTd}</span>` : ''}
                ${priorityBadge(t.priority)}
              </div>
            </div>
          </td>
          <td style="color:var(--text-muted)">${lead ? lead.name : '—'}</td>
          <td>${dueTd}</td>
          <td>${priorityBadge(t.priority)}</td>
          <td>${statusBadge(t.status)}</td>
          <td class="task-actions-cell">
            <button class="btn btn-ghost btn-sm" onclick="openTaskModal('${t.id}')">Edit</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteTask('${t.id}')">Delete</button>
          </td>
        </tr>`;
      }).join('');
}

function toggleTask(id, done) {
  const tasks = DB.tasks;
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  t.status = done ? 'Done' : 'Open';
  DB.tasks = tasks;
  addActivity(`Task "${t.title}" marked ${t.status}`, done ? 'success' : 'primary');
  showToast(`Task marked ${t.status}`);
  renderTasks();
  if (currentPage === 'dashboard') renderDashboard();
}

function openTaskModal(id) {
  const task = id ? DB.tasks.find(t => t.id === id) : null;
  document.getElementById('task-modal-title').textContent = task ? 'Edit Task' : 'New Task';
  document.getElementById('task-id').value = task ? task.id : '';
  document.getElementById('task-title').value = task ? task.title : '';
  document.getElementById('task-due').value = task ? (task.dueDate || '') : '';
  document.getElementById('task-priority').value = task ? task.priority : 'Medium';
  document.getElementById('task-status').value = task ? task.status : 'Open';
  const sel = document.getElementById('task-lead');
  sel.innerHTML = '<option value="">— No linked lead —</option>' +
    DB.leads.map(l => `<option value="${l.id}" ${task && task.leadId === l.id ? 'selected' : ''}>${l.name} (${l.company})</option>`).join('');
  document.getElementById('task-modal').classList.add('open');
}

function closeTaskModal() { document.getElementById('task-modal').classList.remove('open'); }

function saveTask() {
  const id = document.getElementById('task-id').value;
  const data = {
    title: document.getElementById('task-title').value.trim(),
    leadId: document.getElementById('task-lead').value || null,
    dueDate: document.getElementById('task-due').value || null,
    priority: document.getElementById('task-priority').value,
    status: document.getElementById('task-status').value,
  };
  if (!data.title) { alert('Task title is required'); return; }
  const tasks = DB.tasks;
  if (id) {
    const i = tasks.findIndex(t => t.id === id);
    tasks[i] = { ...tasks[i], ...data };
    addActivity(`Updated task: ${data.title}`, 'primary');
    showToast('Task updated');
  } else {
    tasks.push({ id: uid(), ...data });
    addActivity(`New task added: ${data.title}`, 'primary');
    showToast('Task added');
  }
  DB.tasks = tasks;
  closeTaskModal();
  renderTasks();
  if (currentPage === 'dashboard') renderDashboard();
}

function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  const tasks = DB.tasks;
  const t = tasks.find(t => t.id === id);
  DB.tasks = tasks.filter(t => t.id !== id);
  if (t) addActivity(`Deleted task: ${t.title}`, 'danger');
  showToast('Task deleted');
  renderTasks();
  if (currentPage === 'dashboard') renderDashboard();
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function renderSettings() {
  const leads = DB.leads;
  const tasks = DB.tasks;
  document.getElementById('settings-summary').textContent =
    `${leads.length} leads · ${tasks.filter(t => t.status === 'Open').length} open tasks`;
}

function resetDemoData() {
  if (!confirm('This will wipe all your data and reload the original demo data. Continue?')) return;
  DB.reset();
  showToast('Demo data restored');
  renderSettings();
  renderPage(currentPage);
}

function exportData() {
  const data = { leads: DB.leads, tasks: DB.tasks, exported: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'biz-dashboard-export.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported');
}

// ─── Mobile sidebar ───────────────────────────────────────────────────────────

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const isOpen = sidebar.classList.toggle('open');
  overlay.classList.toggle('visible', isOpen);
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('nav a[data-page]').forEach(a => {
    a.addEventListener('click', () => navigate(a.dataset.page));
  });

  document.getElementById('lead-search').addEventListener('input', e => {
    leadSearch = e.target.value;
    renderLeads();
  });

  document.getElementById('lead-filter').addEventListener('change', e => {
    leadFilter = e.target.value;
    renderLeads();
  });

  document.querySelectorAll('.task-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.task-filter-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-ghost');
      });
      btn.classList.remove('btn-ghost');
      btn.classList.add('btn-primary');
      taskFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  document.getElementById('lead-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLeadModal();
  });
  document.getElementById('task-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTaskModal();
  });

  navigate('dashboard');
});
