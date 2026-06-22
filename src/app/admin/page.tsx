'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Backlink, CATEGORIES, DEFAULT_FAVICON, cleanUrl } from '@/lib/constants';

const PAGE_LIMIT = 10;

export default function AdminDashboard() {
  const [password, setPassword]           = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError]       = useState('');
  const [loading, setLoading]             = useState(false);

  // Per-tab state
  const [activeTab, setActiveTab]         = useState<'pending' | 'approved'>('pending');
  const [pendingSites, setPendingSites]   = useState<Backlink[]>([]);
  const [approvedSites, setApprovedSites] = useState<Backlink[]>([]);
  const [pendingTotal, setPendingTotal]   = useState(0);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [pendingPage, setPendingPage]     = useState(1);
  const [approvedPage, setApprovedPage]  = useState(1);
  const [pendingPages, setPendingPages]   = useState(1);
  const [approvedPages, setApprovedPages] = useState(1);
  const [isFetching, setIsFetching]       = useState(false);

  const [editingPriority, setEditingPriority] = useState<{ [key: string]: number }>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  };

  // ── Load password from localStorage on mount ────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('linkvault_admin_password');
    if (saved) verifyPassword(saved);
  }, []);

  // ── Fetch a single tab's page ────────────────────────────────────────────
  const fetchTab = useCallback(async (
    pwd: string,
    tab: 'pending' | 'approved',
    page: number
  ) => {
    setIsFetching(true);
    try {
      const res = await fetch(
        `/api/admin/backlinks?tab=${tab}&page=${page}&limit=${PAGE_LIMIT}`,
        { headers: { 'x-admin-password': pwd } }
      );
      const json = await res.json();
      if (!res.ok) return;
      if (tab === 'pending') {
        setPendingSites(json.data || []);
        setPendingTotal(json.total || 0);
        setPendingPages(json.totalPages || 1);
      } else {
        setApprovedSites(json.data || []);
        setApprovedTotal(json.total || 0);
        setApprovedPages(json.totalPages || 1);
      }
    } catch (err) {
      console.error('Fetch tab error:', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Re-fetch when tab or page changes (after auth)
  useEffect(() => {
    if (!isAuthenticated || !password) return;
    fetchTab(password, activeTab, activeTab === 'pending' ? pendingPage : approvedPage);
  }, [activeTab, pendingPage, approvedPage, isAuthenticated, password, fetchTab]);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const verifyPassword = async (pwdToVerify: string) => {
    setLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/backlinks?tab=pending&page=1&limit=' + PAGE_LIMIT, {
        headers: { 'x-admin-password': pwdToVerify }
      });
      const json = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setPassword(pwdToVerify);
        localStorage.setItem('linkvault_admin_password', pwdToVerify);
        setPendingSites(json.data || []);
        setPendingTotal(json.total || 0);
        setPendingPages(json.totalPages || 1);
        // Pre-fetch approved counts
        fetch('/api/admin/backlinks?tab=approved&page=1&limit=' + PAGE_LIMIT, {
          headers: { 'x-admin-password': pwdToVerify }
        }).then(r => r.json()).then(j => {
          setApprovedTotal(j.total || 0);
          setApprovedPages(j.totalPages || 1);
        }).catch(() => {});
      } else {
        setLoginError(json.error || 'Invalid password.');
        localStorage.removeItem('linkvault_admin_password');
      }
    } catch {
      setLoginError('Failed to communicate with administration server.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) { setLoginError('Please enter a passcode.'); return; }
    verifyPassword(password.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem('linkvault_admin_password');
    setIsAuthenticated(false);
    setPassword('');
    setPendingSites([]); setApprovedSites([]);
    setPendingTotal(0);  setApprovedTotal(0);
  };

  // ── Admin actions ─────────────────────────────────────────────────────────
  const handleApprove = async (id: string | number) => {
    const priority = editingPriority[id] !== undefined ? editingPriority[id] : 0;
    try {
      const res = await fetch('/api/admin/backlinks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id, approved: true, priority })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        triggerToast('Website approved successfully!', 'success');
        // Refresh both tabs' counts
        fetchTab(password, 'pending', pendingPage);
        fetchTab(password, 'approved', approvedPage);
      } else {
        triggerToast(json.error || 'Failed to approve listing.', 'error');
      }
    } catch { triggerToast('Error communicating with server.', 'error'); }
  };

  const handleRevoke = async (id: string | number) => {
    try {
      const res = await fetch('/api/admin/backlinks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id, approved: false })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        triggerToast('Website approval revoked.', 'info');
        fetchTab(password, 'approved', approvedPage);
        fetchTab(password, 'pending', pendingPage);
      } else {
        triggerToast(json.error || 'Failed to revoke approval.', 'error');
      }
    } catch { triggerToast('Error communicating with server.', 'error'); }
  };

  const handleUpdatePriority = async (id: string | number, currentPriority: number) => {
    const priority = editingPriority[id] !== undefined ? editingPriority[id] : currentPriority;
    try {
      const res = await fetch('/api/admin/backlinks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ id, priority })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setApprovedSites(prev => prev.map(s => s.id === id ? { ...s, priority } : s));
        triggerToast('Priority updated successfully!', 'success');
      } else {
        triggerToast(json.error || 'Failed to update priority.', 'error');
      }
    } catch { triggerToast('Error communicating with server.', 'error'); }
  };

  const handleDelete = async (id: string | number) => {
    try {
      const res = await fetch(`/api/admin/backlinks?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
      });
      const json = await res.json();
      if (res.ok && json.success) {
        triggerToast('Listing rejected and deleted successfully.', 'success');
        fetchTab(password, activeTab, activeTab === 'pending' ? pendingPage : approvedPage);
      } else {
        triggerToast(json.error || 'Failed to delete listing.', 'error');
      }
    } catch { triggerToast('Error communicating with server.', 'error'); }
  };

  const getPriorityLabel = (level: number) => {
    switch (level) {
      case 3: return '⭐ Featured';
      case 2: return '🔴 High';
      case 1: return '🟡 Medium';
      default: return '⚪ Standard';
    }
  };

  // ── Pagination bar component ──────────────────────────────────────────────
  const PaginationBar = ({
    page, totalPages, total, onPrev, onNext
  }: { page: number; totalPages: number; total: number; onPrev: () => void; onNext: () => void }) => (
    <div className="admin-pg-wrap">
      <span className="admin-pg-info">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        <span style={{ color: 'var(--border)', margin: '0 8px' }}>·</span>
        {total} total
      </span>
      <div className="admin-pg-btns">
        <button onClick={onPrev} disabled={page <= 1} className="admin-pg-btn">← Prev</button>
        <button onClick={onNext} disabled={page >= totalPages} className="admin-pg-btn">Next →</button>
      </div>
    </div>
  );

  // ── Authentication Login UI ───────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-dm-sans), sans-serif', padding: '24px' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 12px 48px rgba(0,0,0,0.4)', textAlign: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h2 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: '8px', fontSize: '24px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '50%', marginRight: '8px', boxShadow: '0 0 10px var(--accent)' }}></span>
              LinkVault
            </h2>
          </Link>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '32px' }}>Admin Dashboard Gate</p>

          <form onSubmit={handleLoginSubmit}>
            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--label)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Admin Access Passcode
              </label>
              <input
                type="password"
                placeholder="Enter admin passcode…"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '15px', padding: '12px 16px', outline: 'none', textAlign: 'center' }}
              />
            </div>
            {loginError && <p style={{ color: '#ff5c5c', fontSize: '13px', marginBottom: '20px', fontWeight: 500 }}>⚠️ {loginError}</p>}
            <button type="submit" disabled={loading} className="btn-submit" style={{ padding: '13px', width: '100%' }}>
              {loading ? 'Authenticating…' : 'Access Dashboard →'}
            </button>
          </form>

          <div style={{ marginTop: '24px' }}>
            <Link href="/" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>
              ← Return to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard Control UI ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-dm-sans), sans-serif' }}>
      {/* Header */}
      <nav style={{ padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'rgba(10,13,20,0.85)', backdropFilter: 'blur(16px)', height: '64px', gap: '12px' }}>
        <Link className="nav-logo" href="/">
          <span className="dot"></span> LinkVault Admin
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/directory" className="nav-link">Directory</Link>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Log Out
          </button>
        </div>
      </nav>

      {/* Main Body */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Statistics Header */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-label">Total Submissions</span>
            <span className="admin-stat-num">{pendingTotal + approvedTotal}</span>
          </div>
          <div className="admin-stat-card" style={{ borderLeftColor: 'var(--purple)', borderLeftWidth: '3px' }}>
            <span className="admin-stat-label">Pending Review</span>
            <span className="admin-stat-num" style={{ color: 'var(--purple)' }}>{pendingTotal}</span>
          </div>
          <div className="admin-stat-card" style={{ borderLeftColor: 'var(--green)', borderLeftWidth: '3px' }}>
            <span className="admin-stat-label">Approved Listings</span>
            <span className="admin-stat-num" style={{ color: 'var(--green)' }}>{approvedTotal}</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveTab('pending'); setPendingPage(1); }}
            style={{ background: activeTab === 'pending' ? 'var(--accent-dim)' : 'transparent', border: activeTab === 'pending' ? '1px solid rgba(79,142,247,0.2)' : 'none', color: activeTab === 'pending' ? 'var(--accent)' : 'var(--muted)', fontSize: '14px', fontWeight: 600, padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Pending Requests
            <span style={{ background: pendingTotal > 0 ? 'var(--purple)' : 'var(--border)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>
              {pendingTotal}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('approved'); setApprovedPage(1); }}
            style={{ background: activeTab === 'approved' ? 'var(--accent-dim)' : 'transparent', border: activeTab === 'approved' ? '1px solid rgba(79,142,247,0.2)' : 'none', color: activeTab === 'approved' ? 'var(--accent)' : 'var(--muted)', fontSize: '14px', fontWeight: 600, padding: '8px 18px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Approved Directory ({approvedTotal})
          </button>
          {isFetching && <span style={{ fontSize: '12px', color: 'var(--muted)', alignSelf: 'center' }}>Loading…</span>}
        </div>

        {/* Listings Display */}
        {activeTab === 'pending' ? (
          <div>
            {pendingSites.length === 0 && !isFetching ? (
              <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                <p style={{ color: 'var(--muted)', fontSize: '15px' }}>🎉 No pending submissions. Excellent job!</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px', fontWeight: 500 }}>
                  Page {pendingPage} of {pendingPages} · {pendingTotal} total
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {pendingSites.map((s) => (
                    <div key={s.id} className="admin-pending-card">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="card-favicon" style={{ border: '1px solid var(--border)', flexShrink: 0 }}>
                            <img src={`https://www.google.com/s2/favicons?sz=64&domain=${cleanUrl(s.url)}`} alt="" onError={(e) => { e.currentTarget.src = DEFAULT_FAVICON; }} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '17px', color: 'var(--text)', fontWeight: 600 }}>{s.name}</h4>
                            <span className="card-category-pill" style={{ marginTop: '2px' }}>{s.category}</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '13.5px', color: 'var(--label)', marginTop: '4px' }}>{s.description}</p>
                        <div className="admin-pending-meta">
                          <span>🔗 <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{cleanUrl(s.url)}</a></span>
                          <span>👤 {s.submitted_by}</span>
                          <span>✉️ {s.submitted_email}</span>
                          <span>📅 {new Date(s.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="admin-pending-actions">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Priority:</label>
                          <select
                            value={editingPriority[s.id] !== undefined ? editingPriority[s.id] : 0}
                            onChange={(e) => setEditingPriority({ ...editingPriority, [s.id]: Number(e.target.value) })}
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', fontSize: '12px', padding: '6px 12px', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="0">Standard (0)</option>
                            <option value="1">Medium (1)</option>
                            <option value="2">High (2)</option>
                            <option value="3">Featured (3)</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleDelete(s.id)} style={{ background: 'rgba(255, 92, 92, 0.1)', border: '1px solid rgba(255, 92, 92, 0.2)', color: '#ff5c5c', fontWeight: 600, fontSize: '13px', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}>
                            Reject
                          </button>
                          <button onClick={() => handleApprove(s.id)} style={{ background: 'var(--green-dim)', border: '1px solid rgba(34,211,160,0.2)', color: 'var(--green)', fontWeight: 700, fontSize: '13px', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer' }}>
                            Approve ✓
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingPages > 1 && (
                  <PaginationBar
                    page={pendingPage}
                    totalPages={pendingPages}
                    total={pendingTotal}
                    onPrev={() => setPendingPage(p => Math.max(1, p - 1))}
                    onNext={() => setPendingPage(p => Math.min(pendingPages, p + 1))}
                  />
                )}
              </>
            )}
          </div>
        ) : (
          <div>
            {approvedSites.length === 0 && !isFetching ? (
              <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px' }}>
                <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Empty directory. Approved items will appear here.</p>
              </div>
            ) : (
              <>
                <div className="admin-table-wrap">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '16px 20px', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Website</th>
                        <th style={{ padding: '16px 20px', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }} className="col-desc">Description</th>
                        <th style={{ padding: '16px 20px', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', width: '180px' }}>Priority</th>
                        <th style={{ padding: '16px 20px', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', width: '200px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedSites.map((s) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="td-emoji" style={{ border: '1px solid var(--border)' }}>
                                <img src={`https://www.google.com/s2/favicons?sz=64&domain=${cleanUrl(s.url)}`} alt="" onError={(e) => { e.currentTarget.src = DEFAULT_FAVICON; }} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                                <span className="card-category-pill" style={{ marginTop: '2px', padding: '1px 5px', fontSize: '9px' }}>{s.category}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', color: 'var(--label)', maxWidth: '320px' }} className="col-desc">
                            <div style={{ fontSize: '13.5px' }}>{s.description}</div>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                              By: <strong>{s.submitted_by}</strong>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <select
                                value={editingPriority[s.id] !== undefined ? editingPriority[s.id] : s.priority || 0}
                                onChange={(e) => setEditingPriority({ ...editingPriority, [s.id]: Number(e.target.value) })}
                                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '6px', fontSize: '12px', padding: '6px 12px', outline: 'none', cursor: 'pointer' }}
                              >
                                <option value="0">Standard (0)</option>
                                <option value="1">Medium (1)</option>
                                <option value="2">High (2)</option>
                                <option value="3">Featured (3)</option>
                              </select>
                              {editingPriority[s.id] !== undefined && editingPriority[s.id] !== (s.priority || 0) && (
                                <button onClick={() => handleUpdatePriority(s.id, s.priority || 0)} style={{ background: 'var(--accent-dim)', border: '1px solid rgba(79,142,247,0.2)', color: 'var(--accent)', fontSize: '11px', fontWeight: 600, padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                  Save
                                </button>
                              )}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '4px' }}>
                              {getPriorityLabel(s.priority || 0)}
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button onClick={() => handleRevoke(s.id)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 600, fontSize: '12px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                Unapprove
                              </button>
                              <button onClick={() => handleDelete(s.id)} style={{ background: 'rgba(255, 92, 92, 0.1)', border: '1px solid rgba(255, 92, 92, 0.2)', color: '#ff5c5c', fontWeight: 600, fontSize: '12px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {approvedPages > 1 && (
                  <PaginationBar
                    page={approvedPage}
                    totalPages={approvedPages}
                    total={approvedTotal}
                    onPrev={() => setApprovedPage(p => Math.max(1, p - 1))}
                    onNext={() => setApprovedPage(p => Math.min(approvedPages, p + 1))}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`toast ${toastVisible ? 'show' : ''} ${toast.type}`} id="admin-toast">
          {toast.type === 'success' && (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          )}
          {toast.type === 'error' && (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          )}
          {toast.type === 'info' && (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
