const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: 'Network error occurred' };
    }
    
    throw new ApiError(
      errorData.detail || `HTTP ${response.status}`,
      response.status,
      errorData
    );
  }
  
  return response.json();
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error: Unable to connect to server', 0, null);
  }
};

// Playlist API functions
export const fetchPlaylists = async () => {
  return apiRequest('/playlists/');
};

export const fetchPlaylist = async (playlistId) => {
  return apiRequest(`/playlists/${playlistId}`);
};

export const createPlaylist = async (playlistData) => {
  return apiRequest('/playlists/', {
    method: 'POST',
    body: JSON.stringify(playlistData),
  });
};

export const updatePlaylist = async (playlistId, playlistData) => {
  return apiRequest(`/playlists/${playlistId}`, {
    method: 'PUT',
    body: JSON.stringify(playlistData),
  });
};

export const deletePlaylist = async (playlistId) => {
  return apiRequest(`/playlists/${playlistId}`, {
    method: 'DELETE',
  });
};

// Song API functions
export const fetchPlaylistSongs = async (playlistId) => {
  return apiRequest(`/playlists/${playlistId}/songs/`);
};

export const fetchAllSongs = async () => {
  return apiRequest('/songs/');
};

export const addSongToPlaylist = async (playlistId, songData) => {
  return apiRequest(`/playlists/${playlistId}/songs/`, {
    method: 'POST',
    body: JSON.stringify(songData),
  });
};

export const deleteSong = async (songId) => {
  return apiRequest(`/songs/${songId}`, {
    method: 'DELETE',
  });
};

// Health check
export const checkApiHealth = async () => {
  return apiRequest('/');
};

export { ApiError };