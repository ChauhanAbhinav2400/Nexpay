const API_BASE_URL = "http://localhost:3001";
// const API_BASE_URL = "https://wavelet-api.onrender.com";

/**
 * Process intent from user message
 * POST /api/intent/process
 * Sends wallet-centric intent with chat history
 */
export const processIntent = async (walletAddress, message, sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/intent/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress,
        message,
        sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Intent process failed:", error);
    throw error;
  }
};

/**
 * Get chat history
 * GET /api/chat/history
 * Fetch conversation history
 */
export const getChatHistory = async (walletAddress, sessionId) => {
  try {
    const params = new URLSearchParams({ walletAddress });
    if (sessionId) params.append("sessionId", sessionId);

    const response = await fetch(`${API_BASE_URL}/api/chat/history?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    throw error;
  }
};

/**
 * Create a new contact
 * POST /api/contacts
 */
export const createContact = async (walletAddress, name, contactAddress) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts?walletAddress=${walletAddress}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          walletAddress: contactAddress,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Create contact failed:", error);
    throw error;
  }
};

/**
 * Get user's contacts
 * GET /api/contacts
 */
export const getContacts = async (walletAddress) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts?walletAddress=${walletAddress}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    throw error;
  }
};

/**
 * Execute transaction
 * POST /api/transactions/execute
 * Submit transaction for execution
 */
export const confirmTransactionApi = async (transactionId, txHash) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId, txHash }),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Confirm transaction failed:", error);
    throw error;
  }
};

/**
 * Update a contact
 * PUT /api/contacts/:id
 */
export const updateContact = async (
  walletAddress,
  contactId,
  name,
  contactAddress,
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}?walletAddress=${walletAddress}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          walletAddress: contactAddress,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Update contact failed:", error);
    throw error;
  }
};

/**
 * Delete a contact
 * DELETE /api/contacts/:id
 */
export const deleteContact = async (walletAddress, contactId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/contacts/${contactId}?walletAddress=${walletAddress}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Delete contact failed:", error);
    throw error;
  }
};

/**
 * Prepare transaction
 * POST /api/transactions/prepare
 */
export const prepareTransaction = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Prepare transaction failed:", error);
    throw error;
  }
};

/**
 * Confirm transaction
 * POST /api/transactions/confirm
 */
export const getAllChatSessions = async (walletAddress) => {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions?walletAddress=${walletAddress}`,
  );
  if (!response.ok) throw new Error("Failed to fetch sessions");
  return response.json();
};

export const saveChatMessageApi = async (
  walletAddress,
  role,
  message,
  sessionId,
) => {
  const response = await fetch(`${API_BASE_URL}/api/chat/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, role, message, sessionId }),
  });
  if (!response.ok) throw new Error("Failed to save chat message");
  return response.json();
};
