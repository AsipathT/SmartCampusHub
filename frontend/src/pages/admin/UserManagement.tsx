import React, { useEffect, useState, useCallback } from 'react';
import { getUsers, deleteUser, UserDto } from '../../api/userApi';
import { Search, Trash2, Users, ShieldCheck, User, UserPlus, Edit2, BookOpen, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { AddUserModal } from './AddUserModal';
import { EditUserModal } from './EditUserModal';

const getRoleStyle = (role: string) => {
  if (role === 'ADMIN')            return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (role === 'LECTURER')         return 'bg-amber-50 text-amber-700 border-amber-200';
  if (role === 'MAINTENANCE_STAFF') return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const getRoleLabel = (role: string) => {
  if (role === 'MAINTENANCE_STAFF') return 'Maintenance';
  if (role === 'LECTURER')          return 'Lecturer';
  if (role === 'ADMIN')             return 'Admin';
  return 'Student';
};

const formatDate = (iso: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const UserManagement: React.FC = () => {
  const [users, setUsers]       = useState<UserDto[]>([]);
  const [filtered, setFiltered] = useState<UserDto[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [editUser,  setEditUser]        = useState<UserDto | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
      setFiltered(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
      )
    );
  }, [search, users]);

  const handleDelete = async (user: UserDto) => {
    const result = await Swal.fire({
      title: 'Delete User?',
      html: `Are you sure you want to delete <strong>${user.fullName || user.username}</strong>?<br/><span class="text-sm text-gray-500">This action cannot be undone.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await deleteUser(user.id);
      toast.success(`"${user.fullName || user.username}" deleted`);
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const adminCount       = users.filter(u => u.role === 'ADMIN').length;
  const userCount        = users.filter(u => u.role === 'USER').length;
  const lecturerCount    = users.filter(u => u.role === 'LECTURER').length;
  const maintenanceCount = users.filter(u => u.role === 'MAINTENANCE_STAFF').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchUsers}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={fetchUsers}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">User Management</h2>
            <p className="text-slate-500 mt-0.5 text-sm">
              {users.length} registered users · Manage system accounts
            </p>
          </div>
        </div>

        {/* Stats + Add button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl">
            <ShieldCheck size={15} className="text-indigo-600" />
            <span className="text-sm font-bold text-indigo-700">{adminCount} Admin{adminCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
            <User size={15} className="text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">{userCount} Student{userCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <BookOpen size={15} className="text-amber-600" />
            <span className="text-sm font-bold text-amber-700">{lecturerCount} Lecturer{lecturerCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 border border-cyan-200 rounded-xl">
            <Wrench size={15} className="text-cyan-600" />
            <span className="text-sm font-bold text-cyan-700">{maintenanceCount} Maintenance</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-sm text-sm"
          >
            <UserPlus size={17} /> Add User
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, username, or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-bold border-b border-slate-200">
            <tr>
              <th className="py-4 px-6">User</th>
              <th className="py-4 px-6">Username</th>
              <th className="py-4 px-6">Email</th>
              <th className="py-4 px-6">Role</th>
              <th className="py-4 px-6">Joined</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={6} className="h-48 text-center text-slate-500">
                  <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <br />Loading users…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-500 font-medium">
                  No users found.
                </td>
              </tr>
            )}
            {!loading && filtered.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                        {(user.fullName || user.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-800">{user.fullName || '—'}</p>
                      <p className="text-xs text-slate-400 font-mono">#{user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-600 font-mono text-xs">{user.username}</td>
                <td className="py-4 px-6 text-slate-600">{user.email}</td>
                <td className="py-4 px-6">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${getRoleStyle(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="py-4 px-6 text-slate-500 text-sm">{formatDate(user.createdAt)}</td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditUser(user)}
                      className="p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                      title="Edit User"
                    >
                      <Edit2 size={17} />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete User"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer count */}
        {!loading && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-sm text-slate-600">
            Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users
          </div>
        )}
      </div>
    </div>
  );
};
