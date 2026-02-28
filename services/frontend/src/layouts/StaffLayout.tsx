/**
 * Staff portal layout — dark theme wrapper with NoUI branding top bar,
 * announcement banner, keyboard shortcuts, command palette, onboarding checklist,
 * walkthrough overlay, and bottom demo case bar. Renders <Outlet /> for nested routes.
 * AuthGate redirects to /staff/login in non-demo mode when unauthenticated.
 * Consumed by: router.tsx (wraps /staff/* routes)
 * Depends on: Badge, DEMO_CASES, theme (C, tierMeta), react-router-dom,
 *   AnnouncementBanner, ShortcutOverlay, CommandPalette, OnboardingPanel,
 *   DiscoveryOverlay, WalkthroughOverlay, useWalkthrough,
 *   StaffAuthProvider, AuthGate
 */
import { Component, type ReactNode, useState, useEffect } from 'react'
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom'
import { C, tierMeta } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { DEMO_CASES } from '@/lib/constants'
import { DiscoveryOverlay, WalkthroughOverlay, useWalkthrough } from '@/discovery'
import { AnnouncementBanner } from '@/components/AnnouncementBanner'
import { ShortcutOverlay } from '@/components/KeyboardShortcuts'
import { CommandPalette } from '@/components/CommandPalette'
import { OnboardingPanel } from '@/adoption'
import { StaffAuthProvider, useStaffAuth } from '@/staff/auth/StaffAuthContext'
import { AuthGate } from '@/components/shared/AuthGate'
import { isDemoMode } from '@/api/demo-data'
import { resolveApiMode } from '@/api/client'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: '20px', color: '#EF4444', background: '#f6f9f9', fontFamily: 'monospace', fontSize: '13px' }}>
        <div style={{ fontWeight: 700, marginBottom: '8px' }}>Component Error:</div>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
      </div>
    )
    return this.props.children
  }
}


function StaffLayoutInner() {
  const rawNavigate = useNavigate()
  const { memberId } = useParams()
  const location = useLocation()
  const isGuided = location.pathname.endsWith('/guided')

  // Preserve query params (e.g. ?kiosk) across StaffLayout navigation.
  // Agent mode is session-sticky via sessionStorage (see resolveApiMode),
  // so it survives navigation even without URL params.
  const navigate = (path: string, opts?: { state?: unknown }) => {
    rawNavigate(path + location.search, opts)
  }
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [toolMenuOpen, setToolMenuOpen] = useState(false)
  const isKiosk = location.search.includes('kiosk')
  const { ref: layoutRef, tier } = useContainerWidth()
  const isCompactBar = tier === 'compact'
  const { isAuthenticated, user, logout } = useStaffAuth()

  // Walkthrough system
  const walkthrough = useWalkthrough()

  // Listen for walkthrough start events (from StaffWelcomeScreen)
  useEffect(() => {
    const handler = (e: Event) => {
      walkthrough.start((e as CustomEvent).detail)
    }
    window.addEventListener('noui:start-walkthrough', handler)
    return () => window.removeEventListener('noui:start-walkthrough', handler)
  }, [walkthrough.start])

  const handleSignOut = () => {
    logout()
    navigate('/staff/login')
  }

  return (
    <AuthGate isAuthenticated={isAuthenticated} loginPath="/staff/login">
      <div ref={layoutRef} style={{
        height: '100vh', display: 'flex', flexDirection: 'column' as const,
        background: C.bg, color: C.text, overflow: 'hidden',
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 16px', borderBottom: `1px solid ${C.border}`,
          background: C.surface, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div onClick={() => navigate('/staff')} style={{
              width: '22px', height: '22px', borderRadius: '5px',
              background: `linear-gradient(135deg,${C.accent},#00695c)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '10px', color: '#ffffff', cursor: 'pointer',
            }}>N</div>
            <span onClick={() => navigate('/staff')} style={{ color: C.text, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>NoUI</span>
            <span style={{ color: C.textMuted, fontSize: '11px' }}>Staff Workspace</span>
            {/* Persistent lookup navigation */}
            <div style={{
              display: 'flex', gap: '2px', marginLeft: '8px', borderRadius: '4px',
              overflow: 'hidden', border: `1px solid ${C.border}`,
            }}>
              {[
                { label: 'Members', path: '/staff/members' },
                { label: 'Employers', path: '/staff/employers' },
              ].map(link => {
                const active = location.pathname.startsWith(link.path)
                return (
                  <button key={link.path} onClick={() => navigate(link.path)} style={{
                    fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                    color: active ? C.accent : C.textDim, fontWeight: active ? 600 : 400,
                    background: active ? C.accentMuted : 'transparent',
                    border: 'none', padding: '2px 8px', cursor: 'pointer',
                    borderRight: link.label === 'Members' ? `1px solid ${C.border}` : 'none',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.accent }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textDim }}
                  >{link.label}</button>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {memberId && (
              <div style={{
                display: 'flex', borderRadius: '4px', overflow: 'hidden',
                border: `1px solid ${C.border}`,
              }}>
                <button
                  onClick={() => navigate(`/staff/case/${memberId}`)}
                  style={{
                    fontSize: '9px', color: isGuided ? C.textMuted : C.accent,
                    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                    background: isGuided ? 'transparent' : C.accentMuted,
                    border: 'none', padding: '2px 8px', cursor: 'pointer',
                    fontWeight: isGuided ? 400 : 600,
                  }}
                >Expert</button>
                <button
                  onClick={() => navigate(`/staff/case/${memberId}/guided`)}
                  style={{
                    fontSize: '9px', color: isGuided ? C.accent : C.textMuted,
                    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                    background: isGuided ? C.accentMuted : 'transparent',
                    border: 'none', borderLeft: `1px solid ${C.border}`,
                    padding: '2px 8px', cursor: 'pointer',
                    fontWeight: isGuided ? 600 : 400,
                  }}
                >Guided</button>
              </div>
            )}
            {/* Productivity tool links — collapse into overflow menu at compact tier */}
            {isCompactBar ? (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setToolMenuOpen(v => !v)} style={{
                  fontSize: '10px', color: C.textDim, background: 'none',
                  border: `1px solid ${C.borderSubtle}`, padding: '2px 6px',
                  borderRadius: '3px', cursor: 'pointer', letterSpacing: '1px',
                }}>{'\u22EF'}</button>
                {toolMenuOpen && (
                  <>
                    <div onClick={() => setToolMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                      background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 99, minWidth: '140px',
                      overflow: 'hidden',
                    }}>
                      {[
                        { label: 'Knowledge', path: '/demos/knowledge-assistant' },
                        { label: 'Compose', path: '/demos/correspondence' },
                        { label: 'Validate', path: '/demos/data-validator' },
                      ].map(tool => (
                        <button key={tool.label} onClick={() => { navigate(tool.path, { state: { from: location.pathname } }); setToolMenuOpen(false) }} style={{
                          display: 'block', width: '100%', textAlign: 'left' as const,
                          fontSize: '11px', color: C.text, background: 'none', border: 'none',
                          padding: '8px 12px', cursor: 'pointer',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = C.elevated }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                        >{tool.label}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {[
                  { label: 'Knowledge', path: '/demos/knowledge-assistant' },
                  { label: 'Compose', path: '/demos/correspondence' },
                  { label: 'Validate', path: '/demos/data-validator' },
                ].map(tool => (
                  <button key={tool.label} onClick={() => navigate(tool.path, { state: { from: location.pathname } })} style={{
                    fontSize: '8px', color: C.textDim, textTransform: 'uppercase' as const,
                    letterSpacing: '0.5px', background: 'none', border: `1px solid ${C.borderSubtle}`,
                    padding: '2px 6px', borderRadius: '3px', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.borderSubtle }}
                  >{tool.label}</button>
                ))}
              </>
            )}
            {/* Access Management link */}
            <button onClick={() => navigate('/staff/access')} style={{
              fontSize: '8px', color: C.textDim, textTransform: 'uppercase' as const,
              letterSpacing: '0.5px', background: 'none', border: `1px solid ${C.borderSubtle}`,
              padding: '2px 6px', borderRadius: '3px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.borderSubtle }}
            >Access Mgmt</button>
            {/* Onboarding checklist icon */}
            {!isKiosk && (
              <button
                onClick={() => setChecklistOpen(v => !v)}
                title="Getting Started checklist"
                style={{
                  fontSize: '13px', background: 'none', border: `1px solid ${C.borderSubtle}`,
                  borderRadius: '4px', padding: '1px 5px', cursor: 'pointer',
                  color: C.textDim, lineHeight: 1,
                }}
              >{'\u2611'}</button>
            )}
            {/* Authenticated user display */}
            {!isDemoMode() && isAuthenticated && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: C.textMuted }}>{user.displayName}</span>
                <button onClick={handleSignOut} style={{
                  fontSize: '9px', color: C.textMuted, textTransform: 'uppercase' as const,
                  letterSpacing: '1px', background: 'none', border: `1px solid ${C.border}`,
                  padding: '2px 8px', borderRadius: '4px', cursor: 'pointer',
                }}>Sign Out</button>
              </div>
            ) : (
              <button onClick={() => navigate('/')} style={{
                fontSize: '9px', color: C.textMuted, textTransform: 'uppercase' as const,
                letterSpacing: '1px', background: 'none', border: `1px solid ${C.border}`,
                padding: '2px 8px', borderRadius: '4px', cursor: 'pointer',
              }}>Platform</button>
            )}
            {!isCompactBar && <Badge text="Phase 1 · Transparent" bg={C.accentMuted} color={C.accent} />}
          </div>
        </div>

        {/* Announcement banner */}
        <AnnouncementBanner />

        {/* Main content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>

        {/* Discovery spotlight — suppressed when walkthrough is active */}
        {!walkthrough.active && <DiscoveryOverlay />}

        {/* Walkthrough overlay */}
        <WalkthroughOverlay
          active={walkthrough.active}
          currentStep={walkthrough.currentStep}
          stepIndex={walkthrough.stepIndex}
          totalSteps={walkthrough.totalSteps}
          targetRect={walkthrough.targetRect}
          onBack={walkthrough.back}
          onNext={walkthrough.next}
          onSkipAll={walkthrough.skipAll}
        />

        {/* Keyboard shortcut overlay (Shift+?) */}
        <ShortcutOverlay />

        {/* Command palette (Ctrl+K) */}
        <CommandPalette />

        {/* Onboarding checklist panel */}
        <OnboardingPanel open={checklistOpen} onClose={() => setChecklistOpen(false)} />

        {/* Agent mode indicator banner — uses session-sticky mode, not URL */}
        {resolveApiMode() === 'agent' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '4px 12px', flexShrink: 0,
            background: 'linear-gradient(90deg, #8B5CF622, #8B5CF611, #8B5CF622)',
            borderTop: '1px solid #8B5CF644',
          }}>
            <span style={{ fontSize: '10px', color: '#8B5CF6', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const }}>
              AI-Composed Workspace
            </span>
            <span style={{ fontSize: '9px', color: '#8B5CF699' }}>
              Stages and components selected by the composition service
            </span>
          </div>
        )}

        {/* Case selector bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '5px 12px', gap: '4px',
          borderTop: `1px solid ${C.border}`, background: C.surface,
          flexShrink: 0, flexWrap: 'wrap' as const,
        }}>
          <span style={{
            fontSize: '9px', color: C.textDim, textTransform: 'uppercase' as const,
            letterSpacing: '1px', marginRight: '4px',
          }}>Demo Case</span>
          {DEMO_CASES.map(c => {
            const t = tierMeta[c.tier]
            const isActive = memberId === c.id
            return (
              <button key={c.id} onClick={() => navigate(`/staff/case/${c.id}${isGuided ? '/guided' : ''}`)} style={{
                padding: '3px 9px', borderRadius: '5px',
                border: `1px solid ${isActive ? t.color : C.border}`,
                background: isActive ? t.muted : 'transparent',
                color: isActive ? t.color : C.textMuted,
                cursor: 'pointer', fontSize: '10px', fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              }}>
                {c.name.split(' ')[0]}{'suffix' in c ? c.suffix : ''}
              </button>
            )
          })}
          {memberId && (
            <span style={{ color: C.textDim, fontSize: '9.5px', marginLeft: '6px', fontStyle: 'italic' }}>
              {DEMO_CASES.find(c => c.id === memberId)?.label}
            </span>
          )}
        </div>
      </div>
    </AuthGate>
  )
}

export function StaffLayout() {
  return (
    <StaffAuthProvider>
      <StaffLayoutInner />
    </StaffAuthProvider>
  )
}
