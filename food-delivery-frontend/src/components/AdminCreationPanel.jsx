import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Edit, Trash2 } from "lucide-react";
import Modal from "./Modal";

export default function AdminCreationPanel() {
  const { authToken } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  const fetchAdmins = async () => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch admins');
      const data = await response.json();
      // Assuming the API returns all users; filter to admins
      const adminUsers = data.filter(user => user.roleType === 'ADMIN');
      setAdmins(adminUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [authToken]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!authToken) {
      setError("Authentication error: No admin token found.");
      setIsLoading(false);
      return;
    }

    try {
      const adminPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        roleType: 'ADMIN'
      };

      const url = `${API_BASE_URL}/api/admin/users/create`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(adminPayload)
      });

      if (!response.ok) {
        let errorText = `Request failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorText = errorData.message || JSON.stringify(errorData);
        } catch (jsonError) {
          errorText = response.statusText;
        }
        throw new Error(errorText);
      }

      const createdUser = await response.json();
      setSuccess(`Admin account for ${createdUser.email} created successfully!`);
      setFormData({ name: "", email: "", password: "" });
      fetchAdmins(); // Refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setEditAdmin(admin);
    setFormData({ name: admin.name, email: admin.email, password: "" }); // Password optional for update
    setIsModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!authToken || !editAdmin) {
      setError("Authentication or admin data missing.");
      setIsLoading(false);
      return;
    }

    try {
      const updatePayload = {
        name: formData.name,
        email: formData.email,
        ...(formData.password && { password: formData.password }), // Only include password if provided
        roleType: 'ADMIN'
      };

      const url = `${API_BASE_URL}/api/admin/users/${editAdmin.id}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        let errorText = `Update failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorText = errorData.message || JSON.stringify(errorData);
        } catch (jsonError) {
          errorText = response.statusText;
        }
        throw new Error(errorText);
      }

      const updatedUser = await response.json();
      setSuccess(`Admin account for ${updatedUser.email} updated successfully!`);
      setIsModalOpen(false);
      setEditAdmin(null);
      setFormData({ name: "", email: "", password: "" });
      fetchAdmins(); // Refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) return;
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const url = `${API_BASE_URL}/api/admin/users/${id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete admin');

      setSuccess("Admin deleted successfully!");
      fetchAdmins(); // Refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Admin Management Panel</h3>
      <p className="mb-6 text-sm text-gray-600">Create, edit, or delete administrator accounts.</p>

      {/* Creation Form */}
      <section className="mb-8">
        <h4 className="text-lg font-medium text-gray-700 mb-4">Create New Administrator</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</p>}
          {success && <p className="text-green-600 bg-green-100 p-3 rounded-md text-sm">{success}</p>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="Enter full name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="Enter email address" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="Enter a strong password" required />
          </div>

          <button type="submit" disabled={isLoading} className="w-full btn-primary py-2.5 disabled:opacity-50">
            {isLoading ? "Creating..." : "Create Admin Account"}
          </button>
        </form>
      </section>

      {/* Admins List */}
      <section>
        <h4 className="text-lg font-medium text-gray-700 mb-4">Existing Administrators</h4>
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : admins.length === 0 ? (
          <p className="text-gray-600">No administrators found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-t border-gray-200">
                    <td className="px-6 py-4 text-sm text-gray-900">{admin.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{admin.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => handleEdit(admin)} className="text-blue-600 hover:text-blue-800 mr-4">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(admin.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Edit Administrator</h3>
        <form onSubmit={handleUpdate} className="space-y-4">
          {error && <p className="text-red-600 bg-red-100 p-3 rounded-md text-sm">{error}</p>}
          {success && <p className="text-green-600 bg-green-100 p-3 rounded-md text-sm">{success}</p>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="Enter full name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="Enter email address" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password (Optional)</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="Enter a new password" />
          </div>

          <button type="submit" disabled={isLoading} className="w-full btn-primary py-2.5 disabled:opacity-50">
            {isLoading ? "Updating..." : "Update Admin Account"}
          </button>
        </form>
      </Modal>
    </div>
  );
}