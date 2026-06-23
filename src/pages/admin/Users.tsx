import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Users,
  ShieldCheck,
  ShieldX,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserCog,
  Calendar,
  Clock,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'vendor';
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  avatar?: string;
}

interface UsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── API calls ────────────────────────────────────────────────────────────────

const fetchUsers = async (params: {
  page: number;
  search: string;
  role: string;
}): Promise<UsersResponse> => {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: '20',
    ...(params.search ? { search: params.search } : {}),
    ...(params.role ? { role: params.role } : {}),
  });
  const { data } = await apiClient.get<UsersResponse>(`/admin/users?${query}`);
  return data;
};

const updateUserRole = async ({ id, role }: { id: string; role: string }) => {
  const { data } = await apiClient.patch(`/admin/users/${id}/role`, { role });
  return data;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-800 border-violet-200',
  vendor: 'bg-amber-100 text-amber-800 border-amber-200',
  customer: 'bg-slate-100 text-slate-700 border-slate-200',
};

const ROLE_ICON: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="h-3 w-3" />,
  vendor: <UserCog className="h-3 w-3" />,
  customer: <Users className="h-3 w-3" />,
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelative(dateStr?: string): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Role Selector ────────────────────────────────────────────────────────────

interface RoleSelectorProps {
  userId: string;
  currentRole: string;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ userId, currentRole }) => {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setOpen(false);
    },
  });

  const roles = ['customer', 'vendor', 'admin'];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer hover:opacity-80 ${ROLE_STYLES[currentRole]}`}
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : ROLE_ICON[currentRole]}
        {currentRole}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[130px]">
            {roles.map(role => (
              <button
                key={role}
                onClick={() => {
                  if (role !== currentRole) mutate({ id: userId, role });
                  else setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors hover:bg-gray-50 ${
                  role === currentRole ? 'text-gray-400 cursor-default' : 'text-gray-700'
                }`}
              >
                {ROLE_ICON[role]}
                {role}
                {role === currentRole && <span className="ml-auto text-[10px] text-gray-400">current</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AdminUsers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', page, debouncedSearch, roleFilter],
    queryFn: () => fetchUsers({ page, search: debouncedSearch, role: roleFilter }),
    placeholderData: prev => prev,
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination ? (
              <>
                <span className="font-semibold text-gray-700">{pagination.total.toLocaleString()}</span> registered accounts
              </>
            ) : (
              'Manage registered accounts, roles, and access.'
            )}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-lg shrink-0">
          <Users className="h-4 w-4" />
          <span>User Directory</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
        >
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <XCircle className="h-10 w-10 text-rose-400" />
            <p className="text-sm text-gray-500 font-medium">Failed to load users. Please try again.</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Users className="h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500 font-medium">No users found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Verified</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Last Login</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50/60 transition-colors group">
                    {/* User info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm">
                          {getInitials(user.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role with inline changer */}
                    <td className="px-6 py-4">
                      <RoleSelector userId={user._id} currentRole={user.role} />
                    </td>

                    {/* Email verified */}
                    <td className="px-4 py-4">
                      {user.isEmailVerified ? (
                        <span title="Email verified" className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-4 w-4" />
                        </span>
                      ) : (
                        <span title="Email not verified" className="inline-flex items-center gap-1 text-rose-400">
                          <XCircle className="h-4 w-4" />
                        </span>
                      )}
                    </td>

                    {/* Last login */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {formatRelative(user.lastLoginAt)}
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-gray-700">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
