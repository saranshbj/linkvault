'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Backlink, getEmoji, cleanUrl, CATEGORIES, DEFAULT_FAVICON } from '@/lib/constants';

interface HomeClientProps {
  initialSites: Backlink[];
}

export default function HomeClient({ initialSites }: HomeClientProps) {
  const [sites, setSites] = useState<Backlink[]>(initialSites);
  const [searchQ, setSearchQ] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSitename, setFormSitename] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Software & SaaS');

  const LOCAL_STORAGE_KEY = 'linkvault_sites';

  // Merge server-fetched sites with localStorage-only sites on mount
  useEffect(() => {
    let localSites: Backlink[] = [];
    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        localSites = JSON.parse(localData);
      }
    } catch (e) {
      console.warn('LocalStorage load failed', e);
    }

    // Merge databases
    const combined = [...initialSites];
    localSites.forEach(ls => {
      if (!combined.some(s => s.url.toLowerCase() === ls.url.toLowerCase())) {
        combined.push(ls);
      }
    });

    setSites(combined);
  }, [initialSites]);

  const openModal = () => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = '';
  };

  const showToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = formName.trim();
    const email = formEmail.trim();
    const sitename = formSitename.trim();
    const url = formUrl.trim();
    const desc = formDesc.trim();
    const category = formCategory;

    if (!name || !email || !sitename || !url || !desc) {
      triggerShake();
      return;
    }

    if (!/^https?:\/\//.test(url)) {
      alert('Please enter a valid URL starting with http:// or https://');
      return;
    }

    const fallbackSite: Backlink = {
      id: Date.now(),
      name: sitename,
      url,
      description: desc || 'A great website worth visiting.',
      category,
      emoji: getEmoji(sitename),
      submitted_by: name,
      created_at: new Date().toISOString().split('T')[0]
    };

    let finalSite = fallbackSite;
    let success = false;

    // Post to Next.js API Route
    try {
      const res = await fetch('/api/backlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          sitename,
          url,
          desc,
          category
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        success = true;
        if (json.data) {
          finalSite = {
            id: json.data.id,
            name: json.data.name,
            url: json.data.url,
            description: json.data.description,
            category: json.data.category,
            emoji: json.data.emoji || getEmoji(json.data.name),
            submitted_by: json.data.submitted_by,
            created_at: json.data.created_at
          };
        }
      } else {
        alert(json.error || 'Submission failed backend validations.');
        return; // stop insertion if backend validation fails
      }
    } catch (err) {
      console.warn('API submission failed, storing in local storage instead:', err);
      // Fallback local storage saving
      try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        const currentLocals = localData ? JSON.parse(localData) : [];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([fallbackSite, ...currentLocals]));
      } catch (errLocalStorage) {
        console.warn('LocalStorage save failed', errLocalStorage);
      }
    }

    if (!success) {
      setSites(prev => [finalSite, ...prev]);
    }
    closeModal();
    
    // Clear form
    setFormName('');
    setFormEmail('');
    setFormSitename('');
    setFormUrl('');
    setFormDesc('');
    setFormCategory('Software & SaaS');

    showToast();
  };

  // Filter listings based on search
  const filteredSites = sites.filter(s =>
    s.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.url.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQ.toLowerCase())
  );

  // Sort listings: priority DESC, then created_at DESC
  const getSortedSites = (list: Backlink[]) => {
    const sorted = [...list];
    sorted.sort((a, b) => {
      const pA = a.priority || 0;
      const pB = b.priority || 0;
      if (pB !== pA) return pB - pA;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    return sorted;
  };

  const sortedSites = getSortedSites(filteredSites);

  return (
    <>
      {/* NAV */}
      <nav>
        <Link className="nav-logo" href="/">
          <span className="dot"></span> LinkVault
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link active">Home</Link>
          <Link href="/directory" className="nav-link">Directory</Link>
        </div>
        <button className="btn-primary" onClick={openModal}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          <span className="btn-label">Submit Website</span>
        </button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">Free Directory Listing</div>
        <h1>Grow Your Domain Authority with a <span>Free Backlink</span></h1>
        <p>Submit your website and get a permanent do-follow backlink listed in our public directory. Trusted by thousands of site owners.</p>
        <button className="btn-primary" style={{ fontSize: '16px', padding: '13px 28px' }} onClick={openModal}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          Get Your Backlink — It's Free
        </button>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num" id="count">{sites.length}</div>
            <div className="stat-label">Sites Listed</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <div className="stat-num">DA 40+</div>
            <div className="stat-label">Domain Authority</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <div className="stat-num">Free</div>
            <div className="stat-label">Always & Forever</div>
          </div>
        </div>
      </section>

      {/* SEARCH + GRID */}
      <div className="section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search websites by name, category, description…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <span className="search-icon">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
            </svg>
          </span>
        </div>

        <div className="section-head">
          <span className="section-title">Directory — <span className="listing-count-accent">{sortedSites.length}</span> listings</span>
          <Link href="/directory" className="nav-link active" style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px' }}>
            View All →
          </Link>
        </div>

        <div className="grid">
          {sortedSites.length === 0 ? (
            <div className="empty">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/>
              </svg>
              <p>No sites match your search.<br/>Be the first to add one!</p>
            </div>
          ) : (
            sortedSites.map((s, i) => (
              <div className="card" key={s.id} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="card-top">
                  <div style={{ flex: 1 }}>
                    <div className="card-title">{s.name}</div>
                    <div className="card-category-pill">{s.category}</div>
                  </div>
                  <div className="card-favicon">
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain=${cleanUrl(s.url)}`}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_FAVICON;
                      }}
                    />
                  </div>
                </div>
                <div className="card-desc">{s.description}</div>
                <div className="card-footer">
                  <div className="card-url">{cleanUrl(s.url)}</div>
                  <a className="card-link" href={s.url} target="_blank" rel="noopener noreferrer">
                    Visit
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                    </svg>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        © {new Date().getFullYear()} LinkVault · Free Backlink Directory ·{' '}
        <span style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={openModal}>Submit your site</span>
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
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Your Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Website Name</label>
              <input
                type="text"
                placeholder="My Awesome Site"
                value={formSitename}
                onChange={(e) => setFormSitename(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Website URL</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                  fontSize: '15px',
                  padding: '11px 14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
        Your website has been successfully submitted! It will be added to the directory after verification.
      </div>
    </>
  );
}
