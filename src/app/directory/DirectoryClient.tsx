'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { Backlink, getEmoji, cleanUrl, CATEGORIES, DEFAULT_FAVICON } from '@/lib/constants';

interface DirectoryClientProps {
  initialSites: Backlink[];
  initialTotal: number;
}

const PAGE_SIZE = 12;

export default function DirectoryClient({ initialSites, initialTotal }: DirectoryClientProps) {
  const [mounted, setMounted]       = useState(false);
  const [sites, setSites]           = useState<Backlink[]>(initialSites);
  const [total, setTotal]           = useState(initialTotal);
  const [searchQ, setSearchQ]       = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage]       = useState(PAGE_SIZE);
  const [currentView, setView]      = useState<'grid' | 'table'>('grid');
  const [sortMode, setSortMode]     = useState('newest');
  const [isFetching, setIsFetching] = useState(false);

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [isShaking, setIsShaking]       = useState(false);

  // Form states
  const [formName, setFormName]         = useState('');
  const [formEmail, setFormEmail]       = useState('');
  const [formSitename, setFormSitename] = useState('');
  const [formUrl, setFormUrl]           = useState('');
  const [formDesc, setFormDesc]         = useState('');
  const [formCategory, setFormCategory] = useState<string>('Software & SaaS');

  useEffect(() => { setMounted(true); }, []);

  // ── Server-side fetch ─────────────────────────────────────────────────────
  const fetchPage = useCallback(async (
    page: number,
    search: string,
    category: string,
    sort: string,
    limit: number
  ) => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        category: category === 'All Categories' ? '' : category,
        sort
      });
      const res = await fetch(`/api/backlinks?${params}`);
      const json = await res.json();
      if (res.ok) {
        setSites(json.data || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Re-fetch whenever filters / page change (skip the very first render since we have initialSites)
  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchPage(currentPage, searchQ, selectedCategory, sortMode, perPage);
  }, [currentPage, searchQ, selectedCategory, sortMode, perPage, fetchPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const startIdx   = (currentPage - 1) * perPage;

  const goPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetToPage1 = (setter: () => void) => {
    setter();
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | string)[] = [];
    pages.push(1);
    if (currentPage > 3) pages.push('…');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('…');
    pages.push(totalPages);
    return pages;
  };

  const getSortArrow = (col: 'name' | 'date') => {
    const nameActive = sortMode === 'az' || sortMode === 'za';
    const dateActive = sortMode === 'newest' || sortMode === 'oldest';
    if (col === 'name' && nameActive) return sortMode === 'az' ? '↑' : '↓';
    if (col === 'date' && dateActive) return sortMode === 'newest' ? '↓' : '↑';
    return '↕';
  };

  const cycleSort = (col: 'name' | 'date') => {
    resetToPage1(() =>
      setSortMode(prev =>
        col === 'name' ? (prev === 'az' ? 'za' : 'az') : (prev === 'newest' ? 'oldest' : 'newest')
      )
    );
  };

  const openModal = () => { setIsModalOpen(true); document.body.style.overflow = 'hidden'; };
  const closeModal = () => { setIsModalOpen(false); document.body.style.overflow = ''; };
  const showToast = () => { setToastVisible(true); setTimeout(() => setToastVisible(false), 3500); };
  const triggerShake = () => { setIsShaking(true); setTimeout(() => setIsShaking(false), 400); };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name     = formName.trim();
    const email    = formEmail.trim();
    const sitename = formSitename.trim();
    const url      = formUrl.trim();
    const desc     = formDesc.trim();
    const category = formCategory;

    if (!name || !email || !sitename || !url || !desc) { triggerShake(); return; }
    if (!/^https?:\/\//.test(url)) { alert('Please enter a valid URL starting with http:// or https://'); return; }

    try {
      const res = await fetch('/api/backlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, sitename, url, desc, category })
      });
      const json = await res.json();
      if (!res.ok) { alert(json.error || 'Submission failed.'); return; }
    } catch (err) {
      console.warn('API submission failed.', err);
    }

    closeModal();
    setFormName(''); setFormEmail(''); setFormSitename(''); setFormUrl(''); setFormDesc('');
    setFormCategory('Software & SaaS');
    showToast();
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <>
      {/* NAV */}
      <nav>
        <Link className="nav-logo" href="/">
          <span className="dot"></span> LinkVault
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/directory" className="nav-link active">Directory</Link>
        </div>
        <button className="btn-primary" onClick={openModal}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="btn-label">Submit Website</span>
        </button>
      </nav>

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <div className="breadcrumb">
              <Link href="/">Home</Link>
              <span>›</span>
              <span style={{ color: 'var(--label)' }}>Directory</span>
            </div>
            <h1>Full Directory</h1>
            <p>Browse all submitted websites. Every listing includes a free do-follow backlink.</p>
          </div>
          <div className="header-meta">
            <div className="meta-pill">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="num">{total}</span> total listings
            </div>
            <div className="meta-pill" style={{ color: 'var(--green)', borderColor: 'rgba(34,211,160,0.2)' }}>
              <span style={{ width: '6px', height: '6px', background: 'var(--green)', borderRadius: '50%', display: 'inline-block' }}></span>
              Free Forever
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="search-wrap">
          <input
            type="text"
            placeholder="Search by name, URL, description…"
            value={searchQ}
            onChange={(e) => resetToPage1(() => setSearchQ(e.target.value))}
          />
          <span className="ico">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
          </span>
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => resetToPage1(() => setSelectedCategory(e.target.value))}
          >
            <option value="All Categories">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={sortMode}
            onChange={(e) => resetToPage1(() => setSortMode(e.target.value))}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
        </div>

        <div className="view-toggle">
          <button className={`view-btn ${currentView === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')} title="Grid view">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button className={`view-btn ${currentView === 'table' ? 'active' : ''}`} onClick={() => setView('table')} title="Table view">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="content">
        {/* Results bar */}
        <div className="results-bar">
          <div className="results-label">
            {isFetching ? (
              <span style={{ color: 'var(--muted)' }}>Loading…</span>
            ) : total === 0 ? 'No results found' : (
              <>
                Showing <strong>{startIdx + 1}–{Math.min(startIdx + perPage, total)}</strong> of <strong>{total}</strong> listings
              </>
            )}
          </div>
          <div className="per-page">
            <span>Show</span>
            <select
              className="per-page-select"
              value={perPage}
              onChange={(e) => resetToPage1(() => setPerPage(Number(e.target.value)))}
            >
              <option value="9">9</option>
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
            </select>
            <span>per page</span>
          </div>
        </div>

        {/* Listings Container */}
        {total === 0 && !isFetching ? (
          <div className="empty-state">
            <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <p>
              No websites match your search.<br />
              <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => { resetToPage1(() => setSearchQ('')); setSelectedCategory('All Categories'); }}>Clear filters</span> or{' '}
              <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={openModal}>submit a new website</span>.
            </p>
          </div>
        ) : currentView === 'grid' ? (
          <div className={`grid-view${isFetching ? ' fetching' : ''}`}>
            {sites.map((s, i) => (
              <div className="card" key={s.id} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="card-top">
                  <div className="card-info">
                    <div className="card-name">{s.name}</div>
                    <div className="card-category-pill">{s.category}</div>
                    <div className="card-date">{mounted ? formatDate(s.created_at) : '—'}</div>
                  </div>
                  <div className="card-favicon">
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain=${cleanUrl(s.url)}`}
                      alt=""
                      onError={(e) => { e.currentTarget.src = DEFAULT_FAVICON; }}
                    />
                  </div>
                </div>
                <div className="card-desc">{s.description}</div>
                <div className="card-foot">
                  <div className="card-url">{cleanUrl(s.url)}</div>
                  <a className="visit-btn" href={s.url} target="_blank" rel="noopener noreferrer">
                    Visit
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`table-wrap${isFetching ? ' fetching' : ''}`}>
            <table>
              <thead>
                <tr>
                  <th className="td-num">#</th>
                  <th onClick={() => cycleSort('name')} className={sortMode === 'az' || sortMode === 'za' ? 'sorted' : ''}>
                    Website <span className="sort-arrow">{getSortArrow('name')}</span>
                  </th>
                  <th className="col-desc">Description</th>
                  <th className="col-url">URL</th>
                  <th onClick={() => cycleSort('date')} className={sortMode === 'newest' || sortMode === 'oldest' ? 'sorted' : ''}>
                    Added <span className="sort-arrow">{getSortArrow('date')}</span>
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s, i) => (
                  <tr key={s.id}>
                    <td className="td-num">{startIdx + i + 1}</td>
                    <td>
                      <div className="td-site">
                        <div className="td-emoji">
                          <img
                            src={`https://www.google.com/s2/favicons?sz=64&domain=${cleanUrl(s.url)}`}
                            alt=""
                            onError={(e) => { e.currentTarget.src = DEFAULT_FAVICON; }}
                          />
                        </div>
                        <div>
                          <div className="td-name">{s.name}</div>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(79,142,247,0.15)', padding: '1px 5px', borderRadius: '3px', fontWeight: 600, letterSpacing: '0.04em' }}>
                            {s.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="td-desc col-desc">{s.description}</td>
                    <td className="col-url"><div className="td-url">{cleanUrl(s.url)}</div></td>
                    <td className="td-date">{mounted ? formatDate(s.created_at) : '—'}</td>
                    <td className="td-action">
                      <a className="visit-btn" href={s.url} target="_blank" rel="noopener noreferrer">
                        Visit
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-wrap">
            <div className="pagination-info">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </div>
            <div className="pagination">
              <button className="pg-btn pg-nav" onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1}>
                ← Prev
              </button>
              {getPageNumbers().map((p, idx) => {
                if (p === '…') return <span className="pg-dots" key={`dots-${idx}`}>…</span>;
                return (
                  <button
                    className={`pg-btn ${p === currentPage ? 'active' : ''}`}
                    onClick={() => goPage(Number(p))}
                    key={p}
                  >
                    {p}
                  </button>
                );
              })}
              <button className="pg-btn pg-nav" onClick={() => goPage(currentPage + 1)} disabled={currentPage === totalPages}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer>
        © {new Date().getFullYear()} LinkVault · Free Backlink Directory ·{' '}
        <Link href="/">Home</Link> ·{' '}
        <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={openModal}>Submit Your Site</span>
      </footer>

      {/* MODAL */}
      <div className={`overlay ${isModalOpen ? 'open' : ''}`} onClick={handleOverlayClick}>
        <div className="modal">
          <div className="modal-head">
            <div>
              <div className="modal-title">Submit Your Website</div>
              <div className="modal-subtitle">Get a free backlink in our public directory</div>
            </div>
            <button className="btn-close" onClick={closeModal}>✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Your Name</label>
                <input type="text" placeholder="John Doe" value={formName} onChange={(e) => setFormName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Your Email</label>
                <input type="email" placeholder="you@example.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Website Name</label>
              <input type="text" placeholder="My Awesome Site" value={formSitename} onChange={(e) => setFormSitename(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Website URL</label>
              <input type="url" placeholder="https://example.com" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} required />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontFamily: 'inherit', fontSize: '15px', padding: '11px 14px', outline: 'none', cursor: 'pointer' }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Short Description</label>
              <textarea
                placeholder="Briefly describe what your website is about (max 160 chars)…"
                maxLength={160}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                required
              ></textarea>
            </div>

            <button type="submit" className={`btn-submit ${isShaking ? 'animate-shake' : ''}`}>
              Add My Site to Directory →
            </button>
          </form>
        </div>
      </div>

      {/* TOAST */}
      <div className={`toast ${toastVisible ? 'show' : ''}`} id="toast">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Your website has been successfully submitted! It will be added to the directory after verification.
      </div>
    </>
  );
}
