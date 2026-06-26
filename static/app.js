/* ─────────────────────────────────────────────────────────────────────────
   BigQuery Release Notes – app.js
   ───────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────
  let allEntries = [];
  let activeFilter = 'all';
  let searchQuery = '';

  // ── DOM refs ───────────────────────────────────────────────────────────
  const refreshBtn     = document.getElementById('refresh-btn');
  const feedMeta       = document.getElementById('feed-meta');
  const statusBanner   = document.getElementById('status-banner');
  const skeletonList   = document.getElementById('skeleton-list');
  const releasesList   = document.getElementById('releases-list');
  const emptyState     = document.getElementById('empty-state');
  const searchInput    = document.getElementById('search-input');
  const filterPills    = document.getElementById('filter-pills');
  const tweetModal     = document.getElementById('tweet-modal');
  const tweetTextarea  = document.getElementById('tweet-text');
  const charCount      = document.getElementById('char-count');
  const modalClose     = document.getElementById('modal-close');
  const modalCancel    = document.getElementById('modal-cancel');
  const modalTweetBtn  = document.getElementById('modal-tweet');

  // ── Helpers ────────────────────────────────────────────────────────────

  /** Extract type-heading text content from the raw HTML snippet */
  function extractTypes(html) {
    const types = [];
    const re = /<h3[^>]*>([^<]+)<\/h3>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      const t = m[1].trim();
      if (t) types.push(t);
    }
    return [...new Set(types)];
  }

  /** Colour h3 headings inline so CSS :contains isn't needed */
  function colourHeadings(html) {
    return html.replace(/<h3([^>]*)>([^<]+)<\/h3>/gi, (_, attrs, text) => {
      const key = text.trim();
      const cls = `type-${key}`;
      return `<h3${attrs} class="${cls}">${text}</h3>`;
    });
  }

  /** Format ISO datetime to a friendly local string */
  function fmtDate(iso) {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(iso));
    } catch (_) { return iso; }
  }

  /** Build a plain-text summary of an entry for tweeting */
  function buildTweetText(entry) {
    const types = extractTypes(entry.html).join(' | ');
    const title = entry.title;
    const url   = entry.link;
    // strip tags for a clean preview
    const plain = entry.preview;
    const intro = types ? `[${types}] ` : '';
    const body  = `${intro}BigQuery Release – ${title}\n\n${plain}`;
    const full  = `${body}\n\n${url} #BigQuery #GoogleCloud`;
    // Twitter limit is 280 chars
    if (full.length <= 280) return full;
    // Truncate body to fit
    const overhead = `\n\n${url} #BigQuery #GoogleCloud`.length;
    const maxBody = 280 - overhead;
    return body.slice(0, maxBody - 1) + '…' + `\n\n${url} #BigQuery #GoogleCloud`;
  }

  // ── Banner ─────────────────────────────────────────────────────────────

  function showBanner(msg, type = 'error') {
    statusBanner.textContent = msg;
    statusBanner.className = `status-banner ${type}`;
  }
  function hideBanner() {
    statusBanner.className = 'status-banner hidden';
  }

  // ── Render ─────────────────────────────────────────────────────────────

  function renderCards(entries) {
    releasesList.innerHTML = '';

    if (entries.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    entries.forEach((entry, idx) => {
      const types = extractTypes(entry.html);
      const li = document.createElement('li');
      li.className = 'release-card';
      li.setAttribute('role', 'article');
      li.style.animationDelay = `${Math.min(idx * 45, 400)}ms`;

      const tagHtml = types.map(t =>
        `<span class="tag tag-${t}" aria-label="${t}">${t}</span>`
      ).join('');

      li.innerHTML = `
        <div class="card-header">
          <div class="card-title-group">
            <div class="card-date">${entry.title}</div>
            <div class="card-tags">${tagHtml || '<span class="tag tag-Change">Update</span>'}</div>
          </div>
          <div class="card-actions">
            <svg class="card-chevron" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <p class="card-preview">${entry.preview}</p>
        <div class="card-body">
          <div class="card-body-content">${colourHeadings(entry.html)}</div>
          <div class="card-body-footer">
            <a class="btn-view-full" href="${entry.link}" target="_blank" rel="noopener noreferrer"
               aria-label="View full release notes for ${entry.title}">
              View full notes
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="13" height="13">
                <path d="M7 17 17 7M17 7H7m10 0v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
            <button class="btn-tweet-card" data-idx="${idx}" aria-label="Tweet about ${entry.title}">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Tweet this
            </button>
          </div>
        </div>
      `;

      // Toggle expand on card click (but not on links/buttons)
      li.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        toggleCard(li);
      });

      // Tweet button inside card
      li.querySelector('.btn-tweet-card').addEventListener('click', (e) => {
        e.stopPropagation();
        openTweetModal(entry);
      });

      releasesList.appendChild(li);
    });
  }

  function toggleCard(card) {
    const isExpanded = card.classList.contains('expanded');
    // Collapse all others
    document.querySelectorAll('.release-card.expanded').forEach(c => {
      if (c !== card) c.classList.remove('expanded');
    });
    card.classList.toggle('expanded', !isExpanded);
    if (!isExpanded) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ── Filter + Search ────────────────────────────────────────────────────

  function applyFilters() {
    let filtered = allEntries;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(e => extractTypes(e.html).includes(activeFilter));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.preview.toLowerCase().includes(q) ||
        e.html.toLowerCase().includes(q)
      );
    }

    renderCards(filtered);
  }

  // ── Fetch ──────────────────────────────────────────────────────────────

  async function fetchReleases() {
    setLoading(true);
    hideBanner();

    try {
      const res = await fetch('/api/releases');
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      allEntries = data.entries || [];

      // Update meta
      feedMeta.innerHTML = `
        <span class="count-badge">${data.count}</span>
        releases
        <br>Updated: ${fmtDate(data.fetched_at)}
      `;

      applyFilters();
      showBanner(`✓ Fetched ${data.count} release notes successfully.`, 'success');
      setTimeout(hideBanner, 3500);

    } catch (err) {
      showBanner(`⚠ Failed to load release notes: ${err.message}`, 'error');
      console.error('[BQ Notes]', err);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(loading) {
    skeletonList.classList.toggle('hidden', !loading);
    releasesList.classList.toggle('hidden', loading);
    refreshBtn.classList.toggle('loading', loading);
    refreshBtn.disabled = loading;
    if (loading) {
      emptyState.classList.add('hidden');
    }
  }

  // ── Tweet Modal ────────────────────────────────────────────────────────

  function openTweetModal(entry) {
    const text = buildTweetText(entry);
    tweetTextarea.value = text;
    updateCharCount();
    tweetModal.classList.remove('hidden');
    tweetTextarea.focus();
    tweetTextarea.setSelectionRange(0, 0);
  }

  function closeTweetModal() {
    tweetModal.classList.add('hidden');
  }

  function updateCharCount() {
    const len = tweetTextarea.value.length;
    charCount.textContent = `${len} / 280`;
    charCount.className = 'char-count' + (len > 260 ? ' warn' : '') + (len >= 280 ? ' limit' : '');
  }

  function doTweet() {
    const text = tweetTextarea.value.trim();
    if (!text) return;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=450');
    closeTweetModal();
  }

  // ── Event Wiring ───────────────────────────────────────────────────────

  refreshBtn.addEventListener('click', fetchReleases);

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    applyFilters();
  });

  filterPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeFilter = pill.dataset.filter;
    applyFilters();
  });

  tweetTextarea.addEventListener('input', updateCharCount);
  modalClose.addEventListener('click', closeTweetModal);
  modalCancel.addEventListener('click', closeTweetModal);
  modalTweetBtn.addEventListener('click', doTweet);

  // Close modal on backdrop click
  tweetModal.addEventListener('click', (e) => {
    if (e.target === tweetModal) closeTweetModal();
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !tweetModal.classList.contains('hidden')) {
      closeTweetModal();
    }
  });

  // ── Init ───────────────────────────────────────────────────────────────
  fetchReleases();

})();
