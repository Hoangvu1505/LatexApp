import React, { useState, useEffect, useRef } from 'react';
import { X, LogIn, LogOut, CheckCircle2, User, Mail, Sparkles, ArrowRight } from 'lucide-react';
import { getColorForEmail } from '../utils/userColors.js';

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  googleClientId
}) {
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const googleBtnRef = useRef(null);

  // Initialize Google Identity Services if client ID is configured
  useEffect(() => {
    if (!isOpen) return;

    if (googleClientId && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            try {
              // Decode JWT credential payload
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const data = JSON.parse(jsonPayload);

              const userData = {
                name: data.name || data.email.split('@')[0],
                email: data.email,
                picture: data.picture,
                isGoogle: true,
                color: getColorForEmail(data.email)
              };

              onLoginSuccess(userData);
              onClose();
            } catch (err) {
              console.error('Lỗi phân tích Google Token:', err);
            }
          }
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          text: authMode === 'signup' ? 'signup_with' : 'signin_with',
          shape: 'pill',
          width: 320
        });
      } catch (e) {
        console.error('Lỗi khởi tạo Google GIS:', e);
      }
    }
  }, [isOpen, googleClientId, authMode]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    const userEmail = email.trim().toLowerCase();
    const displayName = fullName.trim() || userEmail.split('@')[0];

    const userData = {
      name: displayName,
      email: userEmail,
      isGoogle: false,
      color: getColorForEmail(userEmail)
    };

    onLoginSuccess(userData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#181818] border border-[#2e2e2e] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white font-semibold text-base">
            <User className="w-5 h-5 text-gray-300" />
            <span>{currentUser ? 'User Account' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#262626] rounded-full text-gray-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {currentUser ? (
            /* Logged In View */
            <div className="space-y-5 text-center">
              <div className="flex flex-col items-center">
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-20 h-20 rounded-full border-2 border-[#383838] shadow-lg object-cover mb-3"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full border-2 border-[#383838] flex items-center justify-center text-2xl font-bold text-white shadow-lg mb-3"
                    style={{ backgroundColor: currentUser.color || '#3b82f6' }}
                  >
                    {currentUser.name[0]?.toUpperCase()}
                  </div>
                )}
                <h3 className="text-lg font-bold text-white">{currentUser.name}</h3>
                <p className="text-xs text-gray-400 flex items-center space-x-1 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{currentUser.email}</span>
                </p>
                {currentUser.isGoogle && (
                  <span className="mt-2 inline-flex items-center space-x-1 px-3 py-0.5 rounded-full text-[11px] font-medium bg-[#1a2e1a] text-emerald-400 border border-emerald-800/80">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Connected via Google Account</span>
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-[#262626] hover:bg-rose-950/40 hover:border-rose-800 text-gray-300 hover:text-rose-300 border border-[#383838] rounded-full text-xs font-semibold flex items-center justify-center space-x-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            /* Sign In / Sign Up View */
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex p-1 bg-[#121212] rounded-full border border-[#262626] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-1.5 rounded-full transition ${
                    authMode === 'signin' ? 'bg-[#2a2a2a] text-white font-semibold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-1.5 rounded-full transition ${
                    authMode === 'signup' ? 'bg-[#2a2a2a] text-white font-semibold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Google Button */}
              <div className="flex flex-col items-center justify-center p-3 bg-[#121212] rounded-2xl border border-[#262626]">
                {googleClientId ? (
                  <div ref={googleBtnRef} className="flex justify-center" />
                ) : (
                  <div className="text-center w-full">
                    <p className="text-[11px] text-gray-400">
                      Sign in directly with your email address:
                    </p>
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                {authMode === 'signup' && (
                  <div>
                    <label className="text-xs text-gray-300 font-medium block mb-1">
                      Full Name:
                    </label>
                    <input
                      type="text"
                      required={authMode === 'signup'}
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-white transition"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-300 font-medium block mb-1">
                    Email Address:
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-white transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 bg-white hover:bg-gray-100 text-black rounded-full text-xs font-semibold shadow-md transition flex items-center justify-center space-x-1.5"
                >
                  <span>{authMode === 'signin' ? 'Sign In' : 'Sign Up'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
