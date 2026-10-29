import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Users, 
  Mail, 
  Send, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function ShareModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  currentUser,
  smtpConfigured
}) {
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [activeTab, setActiveTab] = useState('gmail'); // 'gmail' | 'link' | 'sim'

  const origin = window.location.origin;
  const inviteUrl = `${origin}/?project=${projectId}`;

  // Fetch project collaborators list
  const fetchCollaborators = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators();
      setSendResult(null);
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Send Invitation via Server API (Nodemailer)
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || isSending) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          inviterName: currentUser?.name || 'Tác giả',
          inviterEmail: currentUser?.email || '',
          role: 'editor'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSendResult({
          success: true,
          emailSent: data.emailSent,
          message: data.emailSent
            ? `Invitation email successfully sent to ${inviteEmail}!`
            : `Access granted to ${inviteEmail}! (Note: ${data.reason || 'Could not deliver automated email - you can click "Open Gmail" to send directly'}).`
        });
        setInviteEmail('');
        fetchCollaborators();
      } else {
        setSendResult({
          success: false,
          message: data.error || 'An error occurred while sending the invitation.'
        });
      }
    } catch (err) {
      setSendResult({ success: false, message: err.message });
    } finally {
      setIsSending(false);
    }
  };

  // 2. Open Gmail Web Compose Directly
  const handleOpenGmailCompose = () => {
    const email = inviteEmail.trim();
    const subject = encodeURIComponent(`[Project Invitation] Collaborate on LaTeX project: ${projectTitle || 'LaTeX Document'}`);
    const body = encodeURIComponent(
      `Hello,\n\n${currentUser?.name || 'A teammate'} invited you to collaborate on the LaTeX document "${projectTitle || 'LaTeX Project'}" at:\n${inviteUrl}\n\nFeatures:\n- Real-time collaborative editing (6+ concurrent users)\n- Live awareness cursor tracking\n- Instant browser-based PDF compilation\n\nBest regards,\nTeX-LaTeX Team`
    );

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
  };

  // Remove collaborator
  const handleRemoveCollaborator = async (email) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchCollaborators();
      }
    } catch (e) {}
  };

  // Open simulated user in new tab
  const openSimulatedUser = (userName) => {
    const encodedUser = encodeURIComponent(userName);
    window.open(`${origin}/?project=${projectId}&user=${encodedUser}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-indigo-400 font-semibold text-base">
            <Users className="w-5 h-5" />
            <span>Share Project & Invite Collaborators</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 bg-gray-950/60 px-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('gmail')}
            className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'gmail'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Invite via Email</span>
          </button>

          <button
            onClick={() => setActiveTab('link')}
            className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'link'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Shareable Link</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-300 font-semibold block mb-1.5">
                  Enter collaborator's email address:
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="e.g. colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    onClick={handleSendInvite}
                    disabled={!inviteEmail.trim() || isSending}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg font-semibold flex items-center space-x-1.5 transition shrink-0 shadow-md shadow-indigo-900/30"
                    title="Send automated email invite"
                  >
                    {isSending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send Invite</span>
                  </button>
                </div>
              </div>

              {/* Quick Gmail Compose Button */}
              <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-200">Compose in Gmail Web</div>
                  <div className="text-[11px] text-gray-500">
                    Opens a Gmail draft with pre-filled title and invitation link.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenGmailCompose}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Gmail</span>
                </button>
              </div>

              {/* Feedback Alert */}
              {sendResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-start space-x-2 ${
                    sendResult.success
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800 text-rose-300'
                  }`}
                >
                  {sendResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  )}
                  <span>{sendResult.message}</span>
                </div>
              )}

              {/* Collaborators List */}
              <div className="pt-2">
                <div className="font-semibold text-gray-300 mb-2 flex items-center justify-between">
                  <span>CURRENT COLLABORATORS ({collaborators.length})</span>
                </div>

                {collaborators.length === 0 ? (
                  <div className="text-gray-500 italic text-[11px] bg-gray-950/40 p-3 rounded-lg border border-gray-800/60 text-center">
                    No collaborators invited yet. Enter an email above to get started!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {collaborators.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 bg-gray-950 rounded-lg border border-gray-800"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                            {c.email[0]?.toUpperCase()}
                          </div>
                          <span className="text-gray-200 font-mono text-[11px] truncate">
                            {c.email}
                          </span>
                          <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                            {c.role || 'Editor'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRemoveCollaborator(c.email)}
                          className="p-1 hover:text-rose-400 text-gray-500 transition"
                          title="Revoke access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-3">
              <label className="text-gray-400 font-medium block">
                Direct project invite link:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 font-mono text-[11px] focus:outline-none select-all"
                />
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center space-x-1.5 transition shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Anyone with this link can join and collaborate in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
