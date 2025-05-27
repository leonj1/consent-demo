import React, { useState, useEffect } from 'react';
import PlaylistManager from './components/PlaylistManager';
import SongManager from './components/SongManager';

function App() {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [refreshPlaylists, setRefreshPlaylists] = useState(false);

  const handlePlaylistSelect = (playlist) => {
    setSelectedPlaylist(playlist);
  };

  const handlePlaylistUpdate = () => {
    setRefreshPlaylists(!refreshPlaylists);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-100">
              🎵 Music Playlist Manager
            </h1>
            <div className="text-gray-400">
              Manage your music collection
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Playlist Management */}
          <div className="space-y-6">
            <PlaylistManager
              onPlaylistSelect={handlePlaylistSelect}
              refreshTrigger={refreshPlaylists}
              onPlaylistUpdate={handlePlaylistUpdate}
            />
          </div>

          {/* Song Management */}
          <div className="space-y-6">
            <SongManager
              selectedPlaylist={selectedPlaylist}
              onSongUpdate={handlePlaylistUpdate}
            />
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 Music Playlist Manager. Built with React & Tailwind CSS.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;