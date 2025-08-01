// Mock User Service for demonstration
export const fetchFollowedUsers = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '1', userName: 'Followed User 1', status: 'Safe', lastSeen: '5 mins ago' },
        { id: '2', userName: 'Followed User 2', status: 'Active', lastSeen: '2 mins ago' },
      ]);
    }, 500);
  });
};

export const toggleFollowUser = async (userId: string, userName: string) => {
  console.log(`Toggling follow status for ${userName} (${userId})`);
  return Promise.resolve();
};