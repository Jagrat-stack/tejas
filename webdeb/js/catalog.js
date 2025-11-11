// js/catalog.js
// Responsible for rendering the catalog, filters, modal, and compare functionality.

let tools = [];
let compareSet = new Set();

const grid = document.getElementById('toolsGrid');
const searchInput = document.getElementById('search');
const categorySel = document.getElementById('category');
const skillSel = document.getElementById('skill');
const priceSel = document.getElementById('price');
const loadSampleBtn = document.getElementById('loadSample');
const resetFiltersBtn = document.getElementById('resetFilters');

const compareBar = document.getElementById('compareBar');
const selectedList = document.getElementById('selectedList');
const openCompareBtn = document.getElementById('openCompare');
const clearCompareBtn = document.getElementById('clearCompare');

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

function initCatalog(){
  // wire events
  loadSampleBtn.onclick = () => {
    tools = JSON.parse(JSON.stringify(TOOLS)); // clone loaded data
    populateFilters();
    renderGrid(tools);
    window.scrollTo({top:0,behavior:'smooth'});
  };
  resetFiltersBtn.onclick = resetAll;
  searchInput.oninput = applyFilters;
  categorySel.onchange = applyFilters;
  skillSel.onchange = applyFilters;
  priceSel.onchange = applyFilters;

  openCompareBtn.onclick = openCompare;
  clearCompareBtn.onclick = () => { compareSet.clear(); updateCompareBar(); renderGrid(filteredTools()); };

  modalClose.onclick = () => modal.style.display='none';
  modal.onclick = (e) => { if(e.target === modal) modal.style.display='none'; };

  // auto-load sample
  loadSampleBtn.click();
}

function populateFilters(){
  // categories
  const cats = [...new Set(tools.map(t=>t.category))].sort();
  categorySel.innerHTML = '<option value="all">All categories</option>';
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    categorySel.appendChild(opt);
  });
}

function filteredTools(){
  const q = (searchInput.value || '').toLowerCase().trim();
  const cat = categorySel.value;
  const skill = skillSel.value;
  const price = priceSel.value;

  return tools.filter(t => {
    if(q){
      const inName = t.name.toLowerCase().includes(q);
      const inDesc = (t.short_description || '').toLowerCase().includes(q) || (t.long_description || '').toLowerCase().includes(q);
      const inTags = (t.tags || []).some(tag => tag.toLowerCase().includes(q));
      if(!(inName || inDesc || inTags)) return false;
    }
    if(cat !== 'all' && t.category !== cat) return false;
    if(skill !== 'all' && t.skill_level !== skill) return false;
    if(price !== 'all' && t.pricing_model !== price) return false;
    return true;
  });
}

function renderGrid(list){
  grid.innerHTML = '';
  if(!list.length){
    grid.innerHTML = '<div class="card">No results found.</div>'; return;
  }
  list.forEach(t => {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <div>
          <h3>${escapeHtml(t.name)}</h3>
          <div style="color:var(--muted);font-size:13px;margin-top:6px;">${escapeHtml(t.short_description)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700">${escapeHtml(t.skill_level)}</div>
          <div style="color:var(--muted);font-size:13px;margin-top:6px;">${escapeHtml(t.pricing_model)}</div>
        </div>
      </div>
      <div class="tags">${(t.tags||[]).slice(0,4).map(tag=>`<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
      <div class="meta">
        <div>${escapeHtml(t.category)}</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <label style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" data-id="${t.id}" ${compareSet.has(t.id)?'checked':''}> Compare</label>
          <button class="btn btn-sm" data-id="${t.id}" data-action="view">View</button>
          <a class="btn btn-sm btn-outline" href="${t.official_url}" target="_blank">Official</a>
        </div>
      </div>
    `;
    grid.appendChild(el);
  });

  // attach listeners
  grid.querySelectorAll('button[data-action="view"]').forEach(b=> b.onclick = (e)=> openDetail(e.target.getAttribute('data-id')));
  grid.querySelectorAll('input[type="checkbox"][data-id]').forEach(cb => {
    cb.onchange = (e) => {
      const id = e.target.getAttribute('data-id');
      if(e.target.checked) compareSet.add(id); else compareSet.delete(id);
      updateCompareBar();
    };
  });
}

function openDetail(id){
  const t = tools.find(x=>x.id===id);
  if(!t) return;
  modalBody.innerHTML = `
    <h2>${escapeHtml(t.name)}</h2>
    <p style="color:var(--muted)">${escapeHtml(t.long_description || t.short_description)}</p>
    <h4>Features</h4>
    <ul>${(t.pros||[]).map(p=>`<li>${escapeHtml(p)}</li>`).join('')}</ul>
    <h4>Limitations</h4>
    <ul>${(t.cons||[]).map(c=>`<li>${escapeHtml(c)}</li>`).join('')}</ul>
    <h4>Case study</h4>
    <div style="color:var(--muted)">${(t.case_studies && t.case_studies[0])?escapeHtml(t.case_studies[0].title + ': ' + t.case_studies[0].summary):'—'}</div>
    <div style="margin-top:14px;"><a class="btn btn-sm btn-primary" href="${t.official_url}" target="_blank">Visit official</a></div>
  `;
  modal.style.display = 'flex';
}

function updateCompareBar(){
  if(compareSet.size === 0){ compareBar.style.display='none'; return; }
  compareBar.style.display = 'flex';
  selectedList.innerHTML = '';
  Array.from(compareSet).slice(0,6).forEach(id => {
    const t = tools.find(x=>x.id===id);
    if(t){
      const chip = document.createElement('div'); chip.className='compare-chip'; chip.textContent = t.name;
      selectedList.appendChild(chip);
    }
  });
}

function openCompare(){
  if(compareSet.size < 2){ alert('Select at least two tools to compare.'); return; }
  const selected = Array.from(compareSet).map(id => tools.find(t=>t.id===id)).filter(Boolean);
  modalBody.innerHTML = buildCompareHtml(selected);
  modal.style.display = 'flex';
}

function buildCompareHtml(list){
  const head = `<table style="width:100%;border-collapse:collapse"><thead><tr><th style="background:#07121a;border-bottom:1px solid rgba(255,255,255,0.04);padding:10px">Feature</th>${list.map(s=>`<th style="padding:10px;border-left:1px solid rgba(255,255,255,0.03)">${escapeHtml(s.name)}</th>`).join('')}</tr></thead>`;
  const rows = [
    ['Category', list.map(s=>escapeHtml(s.category)).join('|')],
    ['Skill level', list.map(s=>escapeHtml(s.skill_level)).join('|')],
    ['Pricing', list.map(s=>escapeHtml(s.pricing_model)).join('|')],
    ['Tags', list.map(s=>escapeHtml((s.tags||[]).join(', '))).join('|')],
    ['Pros', list.map(s=>escapeHtml((s.pros||[]).join('; '))).join('|')],
    ['Cons', list.map(s=>escapeHtml((s.cons||[]).join('; '))).join('|')],
    ['Integrations', list.map(s=>escapeHtml((s.integrations||[]).join(', '))).join('|')]
  ];
  const body = `<tbody>${rows.map(r=>`<tr><td style="padding:10px;background:#07121a">${r[0]}</td>${r[1].split('|').map(col=>`<td style="padding:10px;border-left:1px solid rgba(255,255,255,0.03)">${col}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return head + body + `<div style="margin-top:12px"><button class="btn btn-sm btn-primary" onclick="visitAll()">Visit all</button> <button class="btn btn-sm" onclick="clearCompareSet()">Clear</button></div>`;
}

function visitAll(){
  Array.from(compareSet).forEach(id=>{
    const t = tools.find(x=>x.id===id);
    if(t) window.open(t.official_url, '_blank');
  });
}

function clearCompareSet(){ compareSet.clear(); updateCompareBar(); renderGrid(filteredTools()); modal.style.display='none'; }

// helpers
function escapeHtml(s=''){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function applyFilters(){ renderGrid(filteredTools()); updateCompareBar(); }
function resetAll(){ searchInput.value=''; categorySel.value='all'; skillSel.value='all'; priceSel.value='all'; compareSet.clear(); updateCompareBar(); renderGrid(tools); }

document.addEventListener('DOMContentLoaded', initCatalog);
