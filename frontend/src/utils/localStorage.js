const CHATS_KEY = "walletAgent_chats";

export const loadChats = () => {
  try {
    const chats = localStorage.getItem(CHATS_KEY);
    return chats ? JSON.parse(chats) : [];
  } catch (error) {
    console.error("Failed to load chats:", error);
    return [];
  }
};

export const saveChat = (chat) => {
  try {
    const chats = loadChats();
    const existingIndex = chats.findIndex((c) => c.id === chat.id);

    if (existingIndex >= 0) {
      chats[existingIndex] = chat;
    } else {
      chats.push(chat);
    }

    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error("Failed to save chat:", error);
  }
};

export const deleteChat = (chatId) => {
  try {
    const chats = loadChats();
    const filtered = chats.filter((c) => c.id !== chatId);
    localStorage.setItem(CHATS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete chat:", error);
  }
};

export const getChatById = (chatId) => {
  try {
    const chats = loadChats();
    return chats.find((c) => c.id === chatId);
  } catch (error) {
    console.error("Failed to get chat:", error);
    return null;
  }
};

export const getRecentChats = (limit = 10) => {
  try {
    const chats = loadChats();
    return chats
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error("Failed to get recent chats:", error);
    return [];
  }
};
