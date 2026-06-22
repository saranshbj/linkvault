export const unstable_instant = { prefetch: 'static', unstable_disableValidation: true };

import React, { Suspense } from 'react';
import DirectoryClient from './DirectoryClient';
import { getApprovedBacklinksPaged } from '@/lib/supabase';

// Fetch first page of approved backlinks for SSR hydration
async function fetchFirstPage() {
  'use cache';
  const { data, count, error } = await getApprovedBacklinksPaged(1, 12, '', '', 'newest');
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export default async function DirectoryPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-dm-sans), sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ fontSize: '15px', color: 'var(--muted)' }}>Loading Directory...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    }>
      <DirectoryContent />
    </Suspense>
  );
}

async function DirectoryContent() {
  const { data, count } = await fetchFirstPage();
  return <DirectoryClient initialSites={data} initialTotal={count} />;
}
