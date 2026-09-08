import { useEffect, useState } from 'react';
import { getAdminUsers, updateAdminUserRole } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './UserManagement.css';

const roles = ['analyst', 'investigator', 'admin'];

export default function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminUsers(token)
      .then((result) => setUsers(result.users || []))
      .catch((requestError) => setError(requestError.message));
  }, [token]);

  const changeRole = async (id, role) => {
    try {
      const result = await updateAdminUserRole(token, id, role);
      setUsers((current) => current.map((user) => (
        user.id === id ? result.user : user
      )));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="user-management-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>User management</h1>
          <p className="muted">Review accounts and choose what each user is allowed to do.</p>
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
      <article className="panel users-panel">
        {users.map((user) => (
          <div className="user-row" key={user.id}>
            <div>
              <strong>{user.email}</strong>
              <small>Joined {new Date(user.created_at).toLocaleDateString()}</small>
            </div>
            <select
              aria-label={`Role for ${user.email}`}
              value={user.role}
              onChange={(event) => changeRole(user.id, event.target.value)}
            >
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
        ))}
        {!users.length && <p className="muted">No users found.</p>}
      </article>
    </section>
  );
}
