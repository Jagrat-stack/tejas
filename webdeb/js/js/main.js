// js/main.js - small helpers for all pages
document.addEventListener('DOMContentLoaded', () => {
    // insert current year
    const y = new Date().getFullYear();
    ['year','year2','year3','year4'].forEach(id=> {
      const el = document.getElementById(id);
      if(el) el.textContent = y;
    });
  
    // simple keyboard shortcut: press "/" to focus search if present
    document.addEventListener('keydown', (e) => {
      if(e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const s = document.querySelector('input[type="search"]');
        if(s) { e.preventDefault(); s.focus(); }
      }
    });
  });
  