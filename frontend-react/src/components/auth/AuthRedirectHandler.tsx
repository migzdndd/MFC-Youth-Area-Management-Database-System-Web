import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/lib/api';
import type { UserProfile } from '@/types/auth';

/**
 * AuthRedirectHandler
 *
 * What it Does:
 * Automatically intercepts incoming email confirmation / OAuth / magic link tokens
 * delivered in window.location.hash (e.g. #access_token=...&refresh_token=...&type=signup).
 * Resolves the authenticated user profile, establishes the session in auth-store,
 * cleans up the URL bar, and navigates the user to their appropriate destination.
 */
export const AuthRedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const setSession = useAuthStore((state) => state.setSession);
  const setActiveArea = useAuthStore((state) => state.setActiveArea);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;

    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const params = new URLSearchParams(cleanHash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token') || '';
    const type = params.get('type');

    if (!accessToken) return;

    // Allow RegisterPage to handle its own inline verification and form restoration
    if (window.location.pathname.startsWith('/register')) return;

    let isMounted = true;

    async function resolveSession() {
      try {
        const res = await apiClient<{ ok: boolean; user: UserProfile }>('/auth/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!isMounted) return;

        if (res.ok && res.user) {
          setSession({
            access_token: accessToken!,
            refresh_token: refreshToken,
            user: res.user,
          });

          if (res.user.area_id) {
            setActiveArea({
              id: res.user.area_id,
              name: res.user.area_name || '',
            });
          }

          // Clean URL hash so the sensitive access token is removed from browser address bar
          window.history.replaceState(null, '', window.location.pathname);

          if (type === 'signup' || type === 'email_confirmation') {
            toast.success('Email confirmed successfully!', 'Welcome to MFC Youth AMS');
          } else {
            toast.success('Signed in successfully!', 'Authentication verified');
          }

          // Route to appropriate view
          if (!res.user.area_id && res.user.role !== 'member') {
            navigate('/select-area', { replace: true });
          } else if (res.user.role === 'member') {
            navigate('/member', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (err) {
        console.warn('Failed to resolve session from auth hash:', err);
        // Clean URL to avoid stuck state
        window.history.replaceState(null, '', window.location.pathname);
        toast.error('Session establishment failed', 'Please log in with your email and password.');
      }
    }

    resolveSession();

    return () => {
      isMounted = false;
    };
  }, [navigate, setSession, setActiveArea, toast]);

  return null;
};
