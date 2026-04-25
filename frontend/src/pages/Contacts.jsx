import React, { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { useContacts } from "../hooks/useContacts";

const Contacts = ({ onBack }) => {
  const { walletAddress } = useWallet();
  const {
    contacts,
    isLoading,
    error,
    loadContacts,
    addContact,
    editContact,
    removeContact,
  } = useContacts(walletAddress);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", walletAddress: "" });

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.walletAddress) return;

    try {
      await addContact(formData.name, formData.walletAddress);
      setFormData({ name: "", walletAddress: "" });
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add contact:", err);
    }
  };

  const handleUpdateContact = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.walletAddress) return;

    try {
      await editContact(editingId, formData.name, formData.walletAddress);
      setFormData({ name: "", walletAddress: "" });
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update contact:", err);
    }
  };

  const handleStartEdit = (contact) => {
    setEditingId(contact.id);
    setFormData({
      name: contact.name,
      walletAddress: contact.walletAddress,
    });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", walletAddress: "" });
  };

  const handleDeleteContact = async (contactId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this contact? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await removeContact(contactId);
    } catch (err) {
      console.error("Failed to delete contact:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your saved wallet addresses
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Back
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-700 text-red-300 rounded-lg">
            Error: {error}
          </div>
        )}

        {/* Add/Edit Form */}
        <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editingId ? "Edit Contact" : "Add New Contact"}
          </h2>
          <form
            onSubmit={editingId ? handleUpdateContact : handleAddContact}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., My Friend"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={formData.walletAddress}
                onChange={(e) =>
                  setFormData({ ...formData, walletAddress: e.target.value })
                }
                placeholder="0x..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 font-mono text-sm"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                {editingId ? "Update Contact" : "Add Contact"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Contacts List */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Your Contacts ({contacts.length})
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-400 mt-4">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-800 rounded-lg border border-slate-700">
              <p className="text-slate-400">No contacts yet</p>
              <p className="text-sm text-slate-500 mt-2">
                Add your first contact to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-purple-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold truncate">
                        {contact.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-mono truncate">
                        {contact.walletAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(contact)}
                      className="flex-1 px-3 py-1 text-sm bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="flex-1 px-3 py-1 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contacts;
