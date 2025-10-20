// components/Profile.js
"use client";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { User, Mail, Smartphone, Camera, KeyRound, UploadCloud } from "lucide-react";

export default function Profile() {
  const { user } = useAuth(); // Destructure what's needed, assuming updateUser/updatePassword exist

  // State for personal information
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [mobile, setMobile] = useState(user.mobile || "");
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(user.avatar || `https://i.pravatar.cc/150?u=${user.name}`);

  // State for password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    // In a real app, you would handle file uploads and update the user context/backend
    console.log("Updating profile with:", { name, email, mobile, profilePicture });
    // Example: await updateUser({ name, email, mobile, avatar: profilePicture });
    alert("Profile updated successfully! (Demo)");
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    // In a real app, call your auth context's updatePassword function
    console.log("Changing password...");
    // Example: await updatePassword(currentPassword, newPassword);
    alert("Password changed successfully! (Demo)");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handlePictureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* --- Profile Information Section --- */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Profile</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <img src={preview} alt="Profile" className="w-32 h-32 rounded-full object-cover shadow-md" />
                <label
                  htmlFor="profile-picture-upload"
                  className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <UploadCloud className="h-8 w-8" />
                  <span className="text-sm mt-1">Change Photo</span>
                </label>
                <input id="profile-picture-upload" type="file" className="hidden" accept="image/*" onChange={handlePictureChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Floating Label Input */}
              <div className="relative">
                <label htmlFor="name" className="label-float">
                  <User className="inline-block w-4 h-4 mr-2" /> Name
                </label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="input-float peer" placeholder="Name " required />
              </div>

              <div className="relative">
                <label htmlFor="email" className="label-float">
                  <Mail className="inline-block w-4 h-4 mr-2" /> Email
                </label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-float peer" placeholder="Email " required />
              </div>

              <div className="relative md:col-span-2">
                <label htmlFor="mobile" className="label-float">
                  <Smartphone className="inline-block w-4 h-4 mr-2" /> Mobile Number
                </label>
                <input type="tel" id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="input-float peer" placeholder="Mobile Number" />
              </div>
            </div>

            <button type="submit" className="w-full btn-primary-modern py-3">
              Save Changes
            </button>
          </form>
        </div>
      </div>

      {/* --- Password Update Section --- */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200 h-full">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-6 flex flex-col h-full">
            <div className="flex-grow space-y-6">
              <div className="relative">
                <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-float peer" placeholder=" " required />
                <label htmlFor="currentPassword" className="label-float">
                  <KeyRound className="inline-block w-4 h-4 mr-2" /> Current Password
                </label>
              </div>
              <div className="relative">
                <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-float peer" placeholder=" " required />
                <label htmlFor="newPassword" className="label-float">
                  <KeyRound className="inline-block w-4 h-4 mr-2" /> New Password
                </label>
              </div>
              <div className="relative">
                <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-float peer" placeholder=" " required />
                <label htmlFor="confirmPassword" className="label-float">
                  <KeyRound className="inline-block w-4 h-4 mr-2" /> Confirm New Password
                </label>
              </div>
            </div>
            <button type="submit" className="w-full btn-secondary-modern py-3 mt-auto">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}