// Mock Backup Service for demonstration
export const fetchAvailableWatchers = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '1', name: 'Watcher 1', status: 'available' },
        { id: '2', name: 'Watcher 2', status: 'busy' },
        { id: '3', name: 'Watcher 3', status: 'available' },
      ]);
    }, 500);
  });
};

export const requestBackup = async (watcherIds: string[]) => {
  console.log(`Requesting backup from watchers: ${watcherIds.join(', ')}`);
  return Promise.resolve();
};