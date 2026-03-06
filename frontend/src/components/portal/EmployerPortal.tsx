import { useState } from 'react';
import {
  useEmployerConversations,
  usePublicConversationInteractions,
  useCreatePortalMessage,
  useCreateNewConversation,
  useDemoOrganizations,
  useDemoOrganization,
} from '@/hooks/useCRM';
import { ConversationThread, MessageComposer, EMPLOYER_THEME } from '@/components/crm';
import { DISPLAY, BODY } from '@/lib/designSystem';

// ── Employer slate color palette ────────────────────────────────────────────

const EC = {
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  navy: '#1E293B',
  navyLight: '#334155',
  text: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  accent: '#475569',
  accentLight: '#F1F5F9',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  green: '#059669',
  greenLight: '#ECFDF5',
  amber: '#D97706',
  amberLight: '#FFFBEB',
} as const;

// ── Main component ──────────────────────────────────────────────────────────

type ViewMode = 'portal' | 'workspace' | 'crm' | 'employer';

interface EmployerPortalProps {
  onChangeView: (mode: ViewMode) => void;
}

export default function EmployerPortal({ onChangeView }: EmployerPortalProps) {
  const [selectedOrgId, setSelectedOrgId] = useState('ORG-001');
  const [selectedConvId, setSelectedConvId] = useState('');
  const [composing, setComposing] = useState(false);
  const [newSubject, setNewSubject] = useState('');

  const { data: organizations } = useDemoOrganizations();
  const { data: org } = useDemoOrganization(selectedOrgId);
  const { data: conversations } = useEmployerConversations(selectedOrgId);
  const { data: interactions } = usePublicConversationInteractions(selectedConvId);
  const sendMessage = useCreatePortalMessage();
  const createConv = useCreateNewConversation();

  const orgList = organizations ?? [];
  const convList = conversations ?? [];
  const effectiveConvId = selectedConvId || (convList.length > 0 ? convList[0].conversationId : '');

  const handleSend = (message: string) => {
    if (composing) {
      if (!newSubject.trim()) return;
      createConv.mutate({
        anchorType: 'organization',
        anchorId: selectedOrgId,
        subject: newSubject.trim(),
        initialMessage: message,
        orgId: selectedOrgId,
        direction: 'inbound',
      }, {
        onSuccess: (result) => {
          setComposing(false);
          setNewSubject('');
          setSelectedConvId(result.conversation.conversationId);
        },
      });
    } else if (effectiveConvId) {
      sendMessage.mutate({
        conversationId: effectiveConvId,
        orgId: selectedOrgId,
        content: message,
        direction: 'inbound',
      });
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      open: { bg: '#DBEAFE', text: '#1E40AF' },
      pending: { bg: EC.amberLight, text: EC.amber },
      resolved: { bg: EC.greenLight, text: EC.green },
      closed: { bg: '#F1F5F9', text: '#64748B' },
      reopened: { bg: '#FEF3C7', text: '#92400E' },
    };
    const c = colors[status] || colors.closed;
    return { background: c.bg, color: c.text };
  };

  return (
    <div style={{ fontFamily: BODY, background: EC.bg, color: EC.text, minHeight: '100vh' }}>
      {/* ═══ TOP NAV ═══ */}
      <div style={{
        background: EC.navy,
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}>
        <div style={{
          maxWidth: 1320,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: DISPLAY, fontWeight: 700, fontSize: 14,
              }}>N</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: DISPLAY, lineHeight: 1.1 }}>NoUI</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', fontWeight: 600, textTransform: 'uppercase' as const }}>Employer Portal</div>
              </div>
            </div>

            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

            <div style={{ display: 'flex', gap: 2 }}>
              {(['Communications', 'Reporting', 'Enrollment'] as const).map((tab, i) => (
                <button
                  key={tab}
                  style={{
                    padding: '7px 16px', borderRadius: 8,
                    background: i === 0 ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: i === 0 ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    border: 'none', fontFamily: BODY,
                  }}
                >{tab}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => onChangeView('portal')}
              style={{
                padding: '6px 12px', borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: BODY,
              }}
            >Member Portal</button>
            <button
              onClick={() => onChangeView('crm')}
              style={{
                padding: '6px 12px', borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: BODY,
              }}
            >Staff CRM</button>

            {/* Org selector */}
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
            <select
              value={selectedOrgId}
              onChange={(e) => { setSelectedOrgId(e.target.value); setSelectedConvId(''); }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                fontFamily: BODY,
                cursor: 'pointer',
              }}
            >
              {orgList.map((o) => (
                <option key={o.orgId} value={o.orgId} style={{ color: '#000' }}>
                  {o.orgShortName || o.orgName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ═══ ORG INFO BANNER ═══ */}
      {org && (
        <div style={{
          background: EC.cardBg,
          borderBottom: `1px solid ${EC.border}`,
          padding: '16px 32px',
        }}>
          <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, color: EC.navy }}>{org.orgName}</h1>
              <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: 12, color: EC.textSecondary }}>
                <span>ID: {org.legacyEmployerId}</span>
                <span>{org.memberCount} members</span>
                <span>Last contribution: {org.lastContributionDate}</span>
                <span>{org.reportingFrequency} reporting</span>
              </div>
            </div>
            <div style={{
              padding: '4px 12px',
              borderRadius: 20,
              background: org.employerStatus === 'active' ? EC.greenLight : EC.amberLight,
              color: org.employerStatus === 'active' ? EC.green : EC.amber,
              fontSize: 12,
              fontWeight: 600,
            }}>
              {org.employerStatus}
            </div>
          </div>
        </div>
      )}

      {/* ═══ COMMUNICATIONS ═══ */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 32px 60px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: 16,
          minHeight: 480,
        }}>
          {/* Left: Thread list */}
          <div style={{
            background: EC.cardBg,
            border: `1px solid ${EC.border}`,
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${EC.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600, color: EC.navy }}>Threads</h3>
              <button
                onClick={() => { setComposing(true); setSelectedConvId(''); }}
                style={{
                  padding: '4px 10px', borderRadius: 6,
                  border: `1px solid ${EC.accent}`,
                  background: EC.accentLight,
                  color: EC.accent,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: BODY,
                }}
              >+ New</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' as const }}>
              {convList.map((conv) => {
                const isSelected = conv.conversationId === effectiveConvId && !composing;
                const badge = statusBadge(conv.status);

                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => { setSelectedConvId(conv.conversationId); setComposing(false); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left' as const,
                      padding: '12px 18px',
                      borderBottom: `1px solid ${EC.borderLight}`,
                      background: isSelected ? EC.accentLight : 'transparent',
                      cursor: 'pointer',
                      border: 'none',
                      borderLeft: isSelected ? `3px solid ${EC.accent}` : '3px solid transparent',
                      fontFamily: BODY,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{
                        fontSize: 13, fontWeight: 600, color: EC.navy,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flex: 1,
                      }}>{conv.subject || 'Untitled'}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10,
                        ...badge,
                        fontSize: 10, fontWeight: 600, flexShrink: 0,
                      }}>{conv.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: EC.textTertiary, marginTop: 4 }}>
                      {conv.interactionCount} message{conv.interactionCount !== 1 ? 's' : ''}
                    </div>
                  </button>
                );
              })}

              {convList.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: EC.textTertiary, fontSize: 12 }}>
                  No communication threads.
                </div>
              )}
            </div>
          </div>

          {/* Right: Thread detail */}
          <div style={{
            background: EC.cardBg,
            border: `1px solid ${EC.border}`,
            borderRadius: 12,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {composing ? (
              <>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${EC.border}` }}>
                  <h3 style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600, color: EC.navy }}>New Thread</h3>
                  <p style={{ fontSize: 12, color: EC.textTertiary, marginTop: 2 }}>Send a message to DERP employer services</p>
                </div>
                <div style={{ flex: 1 }} />
                <MessageComposer
                  theme={EMPLOYER_THEME}
                  onSend={handleSend}
                  placeholder="Type your message..."
                  showSubject
                  onSubjectChange={setNewSubject}
                />
              </>
            ) : effectiveConvId ? (
              <>
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${EC.border}` }}>
                  <h3 style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600, color: EC.navy }}>
                    {convList.find((c) => c.conversationId === effectiveConvId)?.subject || 'Thread'}
                  </h3>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' as const, padding: '0 16px' }}>
                  <ConversationThread
                    interactions={interactions ?? []}
                    visibility="public"
                    theme={EMPLOYER_THEME}
                  />
                </div>
                <MessageComposer
                  theme={EMPLOYER_THEME}
                  onSend={handleSend}
                  placeholder="Reply..."
                />
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: EC.textTertiary,
                fontSize: 13,
              }}>
                Select a thread to view messages
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
