import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Mail, Building, Shield, Clock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pwSection, setPwSection] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const roleColor = { ENGINEER: 'bg-blue-100 text-blue-800', MANAGER: 'bg-purple-100 text-purple-800', ADMIN: 'bg-red-100 text-red-800' };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.put(`/users/${user._id}`, { name, department });
      if (res.data.success) {
        setMsg({ type: 'success', text: 'Profile updated successfully.' });
        if (setUser) setUser(prev => ({ ...prev, name, department }));
        setEditing(false);
      }
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!oldPw || !newPw) { setPwMsg({ type: 'error', text: 'Please fill both fields.' }); return; }
    if (newPw.length < 8) { setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' }); return; }
    setSaving(true);
    setPwMsg(null);
    try {
      await api.put(`/users/${user._id}`, { currentPassword: oldPw, newPassword: newPw });
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
      setOldPw(''); setNewPw(''); setPwSection(false);
    } catch (e) {
      setPwMsg({ type: 'error', text: e.response?.data?.message || 'Password change failed.' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">My Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">{user.name}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${roleColor[user.role] || 'bg-slate-100'}`}>{user.role}</span>
          </div>
        </div>

        {msg && (
          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg mb-4 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {msg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {msg.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Full Name</label>
            {editing
              ? <input value={name} onChange={e => setName(e.target.value)} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              : <div className="flex items-center gap-2 text-sm text-slate-700"><User size={15} className="text-slate-400" /> {user.name}</div>
            }
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Email</label>
            <div className="flex items-center gap-2 text-sm text-slate-500"><Mail size={15} className="text-slate-400" /> {user.email}</div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Department</label>
            {editing
              ? <input value={department} onChange={e => setDepartment(e.target.value)} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              : <div className="flex items-center gap-2 text-sm text-slate-700"><Building size={15} className="text-slate-400" /> {user.department || '—'}</div>
            }
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Role</label>
            <div className="flex items-center gap-2 text-sm text-slate-700"><Shield size={15} className="text-slate-400" /> {user.role}</div>
          </div>
          {user.lastLogin && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Last Login</label>
              <div className="flex items-center gap-2 text-sm text-slate-700"><Clock size={15} className="text-slate-400" /> {new Date(user.lastLogin).toLocaleString()}</div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => { setEditing(false); setName(user.name); setDepartment(user.department || ''); }} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 font-medium">Edit Profile</button>
          )}
        </div>
      </div>

      {/* Password change */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Password</h3>
            <p className="text-xs text-slate-400 mt-0.5">Change your account password</p>
          </div>
          <button onClick={() => setPwSection(p => !p)} className="text-xs text-blue-600 hover:underline">{pwSection ? 'Cancel' : 'Change Password'}</button>
        </div>

        {pwSection && (
          <div className="space-y-3">
            {pwMsg && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${pwMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {pwMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {pwMsg.text}
              </div>
            )}
            <div className="relative">
              <input type={showOld ? 'text' : 'password'} value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="Current password" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => setShowOld(p => !p)} className="absolute right-2.5 top-2.5 text-slate-400">{showOld ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password (min 8 chars)" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => setShowNew(p => !p)} className="absolute right-2.5 top-2.5 text-slate-400">{showNew ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
            <button onClick={handlePasswordChange} disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        )}
      </div>

      {/* Demo notice */}
      <div className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-3">
        🔒 This is a demonstration environment. Credentials are for demo purposes only.
        Demo accounts: <code>engineer@ertmac.demo</code>, <code>manager@ertmac.demo</code>, <code>admin@ertmac.demo</code> — password: <code>Demo@2024</code>
      </div>
    </div>
  );
};

export default Profile;
