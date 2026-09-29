import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/States';
import { Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ENGINEER', department: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    api.get('/users').then(r => setUsers(r.data.data)).finally(() => setLoading(false));
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'ENGINEER', department: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, department: user.department || '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, role: form.role, department: form.department };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${editUser._id}`, payload);
      } else {
        await api.post('/users', form);
      }
      setShowModal(false);
      loadUsers();
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await api.patch(`/users/${user._id}/status`, { status: newStatus });
    loadUsers();
  };

  if (loading) return <LoadingState />;

  const roleColors = { ADMIN: 'bg-purple-100 text-purple-700', MANAGER: 'bg-teal-100 text-teal-700', ENGINEER: 'bg-blue-100 text-blue-700' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500">{users.length} users total</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-slate-500 text-xs">
            <th className="text-left px-4 py-3 font-medium">Name</th>
            <th className="text-left px-4 py-3 font-medium">Email</th>
            <th className="text-left px-4 py-3 font-medium">Role</th>
            <th className="text-left px-4 py-3 font-medium">Department</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Last Login</th>
            <th className="text-left px-4 py-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{user.name}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{user.email}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user.role] || 'bg-slate-100'}`}>{user.role}</span></td>
                <td className="px-4 py-3 text-slate-500 text-xs">{user.department || '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs font-medium ${user.status === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'}`}>{user.status}</span></td>
                <td className="px-4 py-3 text-slate-400 text-xs">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(user)} className="text-slate-400 hover:text-blue-600 p-1"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toggleStatus(user)} className={`p-1 ${user.status === 'ACTIVE' ? 'text-emerald-500 hover:text-red-500' : 'text-slate-400 hover:text-emerald-500'}`}>
                      {user.status === 'ACTIVE' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">{editUser ? 'Edit User' : 'Create User'}</h3>
            {error && <div className="mb-3 p-3 bg-red-50 border border-red-100 text-sm text-red-600 rounded-lg">{error}</div>}
            <div className="space-y-3">
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Password', key: 'password', type: 'password', placeholder: editUser ? 'Leave blank to keep current' : 'Required' },
                { label: 'Department', key: 'department', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none">
                  <option value="ENGINEER">ENGINEER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : editUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
