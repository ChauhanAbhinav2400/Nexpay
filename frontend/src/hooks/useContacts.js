import { useState, useCallback } from "react";
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from "../utils/api";

export const useContacts = (walletAddress) => {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch contacts
  const loadContacts = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getContacts(walletAddress);
      setContacts(data || []);
    } catch (err) {
      console.error("Failed to load contacts:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Add new contact
  const addContact = useCallback(
    async (name, contactAddress) => {
      if (!walletAddress) return;
      setError(null);
      try {
        const newContact = await createContact(
          walletAddress,
          name,
          contactAddress,
        );
        setContacts((prev) => [...prev, newContact]);
        return newContact;
      } catch (err) {
        console.error("Failed to create contact:", err);
        setError(err.message);
        throw err;
      }
    },
    [walletAddress],
  );

  // Update contact
  const editContact = useCallback(
    async (contactId, name, contactAddress) => {
      if (!walletAddress) return;
      setError(null);
      try {
        const updated = await updateContact(
          walletAddress,
          contactId,
          name,
          contactAddress,
        );
        setContacts((prev) =>
          prev.map((c) => (c.id === contactId ? updated : c)),
        );
        return updated;
      } catch (err) {
        console.error("Failed to update contact:", err);
        setError(err.message);
        throw err;
      }
    },
    [walletAddress],
  );

  // Delete contact
  const removeContact = useCallback(
    async (contactId) => {
      if (!walletAddress) return;
      setError(null);
      try {
        await deleteContact(walletAddress, contactId);
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
      } catch (err) {
        console.error("Failed to delete contact:", err);
        setError(err.message);
        throw err;
      }
    },
    [walletAddress],
  );

  return {
    contacts,
    isLoading,
    error,
    loadContacts,
    addContact,
    editContact,
    removeContact,
  };
};
