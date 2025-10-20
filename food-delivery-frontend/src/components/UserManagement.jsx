"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Search, Edit, Trash2 } from "lucide-react";
import Modal from "../components/Modal";

// Helper hook for making authenticated API calls
const useApi = (authToken) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }
    if (response.status === 204) return null; // Handle No Content for DELETE
    return response.json();
  }, [authToken]);

  return apiFetch;
};

export default function UserManagement() {
  const { authToken } = useAuth();
  const api = useApi(authToken);

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // Fetch all roles in parallel
      const rolesToFetch = ['CUSTOMER', 'RESTAURANT', 'DELIVERYMAN', 'ADMIN'];
      const userPromises = rolesToFetch.map(role => api(`/api/admin/users?role=${role}`));
      const usersByRole = await Promise.all(userPromises);
      
      // Flatten the array of arrays into a single user list
      const allUsers = usersByRole.flat();
      setUsers(allUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user) => {
    setSelectedUser({ ...user }); // Create a copy to edit
    setIsModalOpen(true);
  };

  const handleDelete = async (userToDelete) => {
    if (window.confirm(`Are you sure you want to delete ${userToDelete.name}?`)) {
      try {
        await api(`/api/admin/users/${userToDelete.id}`, { method: 'DELETE' });
        setUsers(users.filter(u => u.id !== userToDelete.id));
      } catch (err) {
        alert(`Error deleting user: ${err.message}`);
      }
    }
  };
  
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
        const updatedUser = await api(`/api/admin/users/${selectedUser.id}`, {
            method: 'PUT',
            body: JSON.stringify(selectedUser)
        });
        setUsers(users.map(u => (u.id === updatedUser.id ? updatedUser : u)));
        setIsModalOpen(false);
        setSelectedUser(null);
    } catch (err) {
        alert(`Error updating user: ${err.message}`);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="input-field pl-10 w-full"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>

      {error && <div className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Name</th>
              <th className="table-header">Email</th>
              <th className="table-header">Role</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" className="text-center py-4">Loading users...</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="border-b">
                  <td className="table-cell">{user.name}</td>
                  <td className="table-cell">{user.email}</td>
                  <td className="table-cell">{user.role}</td>
                  <td className="table-cell">
                    <button onClick={() => handleEdit(user)} className="text-blue-500 hover:text-blue-700 p-2"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(user)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit User">
        {selectedUser && (
          <form onSubmit={handleSaveChanges}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={selectedUser.name} onChange={e => setSelectedUser({...selectedUser, name: e.target.value})} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={selectedUser.email} onChange={e => setSelectedUser({...selectedUser, email: e.target.value})} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select value={selectedUser.role} onChange={e => setSelectedUser({...selectedUser, role: e.target.value})} className="input-field w-full">
                  <option value="CUSTOMER">Customer</option>
                  <option value="RESTAURANT">Restaurant Owner</option>
                  <option value="DELIVERYMAN">Delivery Partner</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}