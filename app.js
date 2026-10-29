// Harmonix Audio Engine & UI Controller

// --- Default Playlist Data ---
const DEFAULT_TRACKS = [
  {
    id: 'track_1',
    title: 'Summer Breeze',
    artist: 'Lofi Dreamer',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    artwork: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80',
    genre: 'lofi',
    durationText: '06:12'
  },
  {
    id: 'track_2',
    title: 'Cyberpunk Horizon',
    artist: 'Neon Samurai',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    artwork: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=500&q=80',
    genre: 'synthwave',
    durationText: '07:05'
  },
  {
    id: 'track_3',
    title: 'Forest Whisper',
    artist: 'Nature Ambient',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    artwork: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&q=80',
    genre: 'ambient',
    durationText: '05:02'
  },
  {
    id: 'track_4',
    title: 'Retro Groove',
    artist: 'Funk Master',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
    genre: 'synthwave',
    durationText: '05:38'
  }
];

// --- App State ---
const state = {
  tracks: [...DEFAULT_TRACKS],
  filteredTracks: [...DEFAULT_TRACKS],
  currentTrackIndex: 0,
  isPlaying: false,
  isMuted: false,
  volume: 0.7,
  shuffle: false,
  repeat: 'none', // 'none' | 'all' | 'one'
  favorites: new Set(['track_1']),
  activeGenre: 'all',
  searchQuery: '',
  visualizerStyle: 'circular', // 'circular' | 'bars' | 'waveform'
  
  // Web Audio Variables
  audioContext: null,
  sourceNode: null,
  analyserNode: null,
  bassFilter: null,
  reverbDelayNode: null,
  reverbFeedbackGain: null,
  reverbWetGain: null,
  reverbDryGain: null,
  audioGraphInitialized: false,
  
  // Audio Effect Toggles
  bassBoostActive: false,
  reverbActive: false,
  synthModeActive: false,
  
  // Synth sequencer variables
  synthTimer: null,
  synthBeatStep: 0,
  synthTempo: 120, // BPM
  synthScale: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440] // A Minor / C Major scale frequencies
};

// --- DOM Elements ---
const audio = document.getElementById('audioElement');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const repeatBadge = document.getElementById('repeatBadge');
const muteBtn = document.getElementById('muteBtn');
const volumeHighIcon = document.getElementById('volumeHighIcon');
const volumeMuteIcon = document.getElementById('volumeMuteIcon');
const volumeSlider = document.getElementById('volumeSlider');
const volumeSliderFill = document.getElementById('volumeSliderFill');

const progressBarContainer = document.getElementById('progressBarContainer');
const progressBarFill = document.getElementById('progressBarFill');
const progressBarHandle = document.getElementById('progressBarHandle');
const progressTooltip = document.getElementById('progressTooltip');
const currentTimeDisplay = document.getElementById('currentTime');
const durationTimeDisplay = document.getElementById('durationTime');

const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const trackGenreTag = document.getElementById('trackGenreTag');
const albumArtImage = document.getElementById('albumArtImage');
const vinylRecord = document.getElementById('vinylRecord');
const ambientGlow = document.getElementById('ambientGlow');
const ambientGlowSecondary = document.getElementById('ambientGlowSecondary');

const searchInput = document.getElementById('searchInput');
const genreTabs = document.getElementById('genreTabs');
const trackListContainer = document.getElementById('trackList');
const trackCount = document.getElementById('trackCount');
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');

const canvas = document.getElementById('visualizerCanvas');
const canvasCtx = canvas.getContext('2d');

const bassBoostBtn = document.getElementById('bassBoostBtn');
const bassBoostStatus = document.getElementById('bassBoostStatus');
const bassBoostCard = document.getElementById('bassBoostCard');
const reverbBtn = document.getElementById('reverbBtn');
const reverbStatus = document.getElementById('reverbStatus');
const reverbCard = document.getElementById('reverbCard');
const synthBtn = document.getElementById('synthBtn');
const synthStatus = document.getElementById('synthStatus');
const synthCard = document.getElementById('synthCard');
const vizModeBtns = document.querySelectorAll('.viz-mode-btn');
const toast = document.getElementById('toast');

// --- Initialization ---
function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Render playlist UI
  renderPlaylist();
  loadTrack(state.currentTrackIndex, false);
  
  // Set volume initial state
  audio.volume = state.volume;
  updateVolumeUI();
  
  // Bind standard UI actions
  bindEvents();
  
  // Start canvas animation (renders mockup when silent)
  requestAnimationFrame(visualizerLoop);
}

// --- Event Binding ---
function bindEvents() {
  // Playback Control click listeners
  playPauseBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', playPrevious);
  nextBtn.addEventListener('click', playNext);
  shuffleBtn.addEventListener('click', toggleShuffle);
  repeatBtn.addEventListener('click', toggleRepeat);
  
  // Volume controls
  volumeSlider.addEventListener('input', handleVolumeSlider);
  muteBtn.addEventListener('click', toggleMute);
  
  // Audio state changes
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('durationchange', updateDuration);
  audio.addEventListener('ended', handleTrackEnded);
  audio.addEventListener('error', handleAudioError);
  
  // Timeline interaction
  progressBarContainer.addEventListener('click', seekTo);
  progressBarContainer.addEventListener('mousemove', showTimelineTooltip);
  
  // Search
  searchInput.addEventListener('input', handleSearch);
  
  // Genres Filter
  genreTabs.addEventListener('click', handleGenreFilter);
  
  // Drag & Drop Upload
  uploadZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileUpload);
  
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });
  
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  });

  // Sound Lab Buttons
  bassBoostBtn.addEventListener('click', toggleBassBoost);
  reverbBtn.addEventListener('click', toggleReverb);
  synthBtn.addEventListener('click', toggleSynthMode);
  
  // Visualizer Mode
  vizModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      vizModeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.visualizerStyle = btn.dataset.viz;
    });
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

// --- Canvas Size Handler ---
function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
}

// --- Notification Toast Utility ---
function showToast(message) {
  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// --- Audio Loading ---
function loadTrack(index, autoPlay = true) {
  if (state.filteredTracks.length === 0) return;
  
  // Loop bounds check
  if (index < 0) index = state.filteredTracks.length - 1;
  if (index >= state.filteredTracks.length) index = 0;
  
  // Get track reference from absolute list based on filtered list ID
  const targetTrack = state.filteredTracks[index];
  const absoluteIndex = state.tracks.findIndex(t => t.id === targetTrack.id);
  state.currentTrackIndex = absoluteIndex;
  
  // Update audio element source
  if (!state.synthModeActive) {
    audio.src = targetTrack.url;
    audio.load();
  }
  
  // Update interface details
  trackTitle.innerText = targetTrack.title;
  trackArtist.innerText = targetTrack.artist;
  trackGenreTag.innerText = targetTrack.genre;
  albumArtImage.src = targetTrack.artwork;
  
  // Highlight active item in playlist
  updateActiveTrackUI();
  
  // Extract and update background glows based on song
  updateAmbientColors(targetTrack.genre);
  
  // Timeline reset
  progressBarFill.style.width = '0%';
  progressBarHandle.style.left = '0%';
  currentTimeDisplay.innerText = '0:00';
  durationTimeDisplay.innerText = targetTrack.durationText || '0:00';
  
  if (autoPlay && !state.synthModeActive) {
    // Attempt play
    initAudioContext();
    playAudio();
  } else if (state.isPlaying) {
    // If we were playing but loaded another track
    playAudio();
  }
}

// --- Ambient Colors custom picker ---
function updateAmbientColors(genre) {
  let color1 = 'rgba(139, 92, 246, 0.45)'; // purple
  let color2 = 'rgba(6, 182, 212, 0.45)';  // cyan
  
  if (genre === 'lofi') {
    color1 = 'rgba(244, 63, 94, 0.4)';  // rose
    color2 = 'rgba(249, 115, 22, 0.35)'; // orange
  } else if (genre === 'synthwave') {
    color1 = 'rgba(236, 72, 153, 0.45)'; // pink
    color2 = 'rgba(124, 58, 237, 0.4)';  // violet
  } else if (genre === 'ambient') {
    color1 = 'rgba(16, 185, 129, 0.35)'; // emerald
    color2 = 'rgba(6, 182, 212, 0.4)';   // cyan
  } else if (genre === 'imported') {
    color1 = 'rgba(59, 130, 246, 0.4)';  // blue
    color2 = 'rgba(236, 72, 153, 0.35)'; // pink
  }
  
  ambientGlow.style.background = `radial-gradient(circle, ${color1} 0%, rgba(13, 8, 30, 0) 70%)`;
  ambientGlowSecondary.style.background = `radial-gradient(circle, ${color2} 0%, rgba(13, 8, 30, 0) 70%)`;
}

// --- Playback controls implementation ---
function togglePlay() {
  if (state.filteredTracks.length === 0 && !state.synthModeActive) {
    showToast("Please import or select a track first.");
    return;
  }
  
  initAudioContext();
  
  if (state.isPlaying) {
    pauseAudio();
  } else {
    playAudio();
  }
}

function playAudio() {
  if (state.synthModeActive) {
    state.isPlaying = true;
    startSynthSequencer();
    updatePlaybackUI();
    return;
  }
  
  audio.play()
    .then(() => {
      state.isPlaying = true;
      updatePlaybackUI();
    })
    .catch(err => {
      console.warn("Playback error/interrupted: ", err);
      // Fallback for CORS: if network play block, show toast
      if (err.name === 'NotAllowedError') {
        showToast("Click anywhere on screen to allow audio.");
      } else {
        showToast("Audio loading. Click play again or toggle Synth Mode!");
      }
    });
}

function pauseAudio() {
  state.isPlaying = false;
  if (state.synthModeActive) {
    stopSynthSequencer();
  } else {
    audio.pause();
  }
  updatePlaybackUI();
}

function playNext() {
  if (state.filteredTracks.length === 0) return;
  
  let nextIndex = 0;
  
  if (state.shuffle) {
    nextIndex = Math.floor(Math.random() * state.filteredTracks.length);
  } else {
    const currentTrackId = state.tracks[state.currentTrackIndex]?.id;
    const currentFilteredIdx = state.filteredTracks.findIndex(t => t.id === currentTrackId);
    nextIndex = currentFilteredIdx + 1;
    if (nextIndex >= state.filteredTracks.length) {
      nextIndex = 0;
    }
  }
  
  loadTrack(nextIndex, true);
}

function playPrevious() {
  if (state.filteredTracks.length === 0) return;
  
  let prevIndex = 0;
  
  if (state.shuffle) {
    prevIndex = Math.floor(Math.random() * state.filteredTracks.length);
  } else {
    const currentTrackId = state.tracks[state.currentTrackIndex]?.id;
    const currentFilteredIdx = state.filteredTracks.findIndex(t => t.id === currentTrackId);
    prevIndex = currentFilteredIdx - 1;
    if (prevIndex < 0) {
      prevIndex = state.filteredTracks.length - 1;
    }
  }
  
  loadTrack(prevIndex, true);
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  shuffleBtn.classList.toggle('active-mode', state.shuffle);
  showToast(state.shuffle ? "Shuffle playlist: ON" : "Shuffle playlist: OFF");
}

function toggleRepeat() {
  // Cycle: none -> all -> one -> none
  if (state.repeat === 'none') {
    state.repeat = 'all';
    repeatBtn.classList.add('active-mode');
    repeatBadge.innerText = 'A';
    showToast("Repeat mode: Repeat All");
  } else if (state.repeat === 'all') {
    state.repeat = 'one';
    repeatBtn.classList.add('active-mode');
    repeatBadge.innerText = '1';
    showToast("Repeat mode: Repeat One");
  } else {
    state.repeat = 'none';
    repeatBtn.classList.remove('active-mode');
    showToast("Repeat mode: OFF");
  }
}

function handleTrackEnded() {
  if (state.repeat === 'one') {
    audio.currentTime = 0;
    playAudio();
  } else if (state.repeat === 'all') {
    playNext();
  } else {
    // If it's the last song in playlist, stop. Otherwise next.
    const currentTrackId = state.tracks[state.currentTrackIndex]?.id;
    const currentFilteredIdx = state.filteredTracks.findIndex(t => t.id === currentTrackId);
    if (currentFilteredIdx < state.filteredTracks.length - 1) {
      playNext();
    } else {
      pauseAudio();
    }
  }
}

function handleAudioError(e) {
  console.error("Audio Engine Load Error:", e);
  showToast("Audio source error. CORS restriction or URL down. Synthesizing synth fallback...");
  // Automatically guide user into Synth Mode if current external audio fails completely
  if (!state.synthModeActive) {
    setTimeout(() => {
      toggleSynthMode();
    }, 2000);
  }
}

// --- Volume Controls ---
function handleVolumeSlider(e) {
  state.volume = parseFloat(e.target.value);
  state.isMuted = state.volume === 0;
  
  if (!state.synthModeActive) {
    audio.volume = state.volume;
  }
  
  updateVolumeUI();
}

function toggleMute() {
  state.isMuted = !state.isMuted;
  
  if (!state.synthModeActive) {
    audio.muted = state.isMuted;
  }
  
  updateVolumeUI();
}

function updateVolumeUI() {
  const effectiveVolume = state.isMuted ? 0 : state.volume;
  volumeSlider.value = effectiveVolume;
  
  // Set filler bar percentage
  const pct = effectiveVolume * 100;
  volumeSliderFill.style.width = `${pct}%`;
  
  // Toggles icons
  if (state.isMuted || effectiveVolume === 0) {
    volumeHighIcon.classList.add('hidden');
    volumeMuteIcon.classList.remove('hidden');
  } else {
    volumeHighIcon.classList.remove('hidden');
    volumeMuteIcon.classList.add('hidden');
  }
}

// --- Timeline Progress & Seeking ---
function updateProgress() {
  if (state.synthModeActive || isNaN(audio.duration) || audio.duration === 0) return;
  
  const progressPercent = (audio.currentTime / audio.duration) * 100;
  progressBarFill.style.width = `${progressPercent}%`;
  progressBarHandle.style.left = `${progressPercent}%`;
  
  currentTimeDisplay.innerText = formatTime(audio.currentTime);
}

function updateDuration() {
  if (!state.synthModeActive && !isNaN(audio.duration)) {
    durationTimeDisplay.innerText = formatTime(audio.duration);
  }
}

function seekTo(e) {
  if (state.synthModeActive) return;
  if (state.filteredTracks.length === 0 || isNaN(audio.duration)) return;
  
  const rect = progressBarContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;
  const seekPercentage = Math.max(0, Math.min(1, clickX / width));
  
  audio.currentTime = seekPercentage * audio.duration;
  updateProgress();
}

function showTimelineTooltip(e) {
  if (state.filteredTracks.length === 0 || isNaN(audio.duration)) return;
  
  const rect = progressBarContainer.getBoundingClientRect();
  const hoverX = e.clientX - rect.left;
  const width = rect.width;
  const hoverPercentage = Math.max(0, Math.min(1, hoverX / width));
  
  const targetTime = hoverPercentage * audio.duration;
  progressTooltip.innerText = formatTime(targetTime);
  progressTooltip.style.left = `${hoverPercentage * 100}%`;
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// --- UI Styling Updates ---
function updatePlaybackUI() {
  if (state.isPlaying) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    vinylRecord.classList.add('playing');
  } else {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    vinylRecord.classList.remove('playing');
  }
}

function updateActiveTrackUI() {
  const currentTrackId = state.tracks[state.currentTrackIndex]?.id;
  const items = trackListContainer.querySelectorAll('.track-item');
  items.forEach(item => {
    if (item.dataset.id === currentTrackId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// --- Playlist Rendering ---
function renderPlaylist() {
  trackListContainer.innerHTML = '';
  state.filteredTracks.forEach((track, idx) => {
    const activeClass = (state.tracks[state.currentTrackIndex]?.id === track.id) ? 'active' : '';
    
    // Heart favorite icon check
    const isFavoriteClass = state.favorites.has(track.id) ? 'is-favorite' : '';
    
    const trackItemHTML = `
      <div class="track-item ${activeClass}" data-id="${track.id}" data-index="${idx}">
        <img class="track-item-artwork" src="${track.artwork}" alt="Artwork">
        <div class="track-item-details">
          <div class="track-item-title">${escapeHTML(track.title)}</div>
          <div class="track-item-artist">${escapeHTML(track.artist)}</div>
        </div>
        <div class="track-item-meta">
          <span class="track-item-duration">${track.durationText}</span>
          <button class="favorite-btn ${isFavoriteClass}" data-id="${track.id}" aria-label="Favorite">
            <svg viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
    trackListContainer.insertAdjacentHTML('beforeend', trackItemHTML);
  });
  
  trackCount.innerText = `${state.filteredTracks.length} tracks`;
  
  // Attach event listeners to newly injected elements
  const items = trackListContainer.querySelectorAll('.track-item');
  items.forEach(item => {
    // Click track to load/play
    item.addEventListener('click', (e) => {
      // Don't trigger load if clicking favorite button
      if (e.target.closest('.favorite-btn')) return;
      
      const filteredIndex = parseInt(item.dataset.index);
      loadTrack(filteredIndex, true);
    });
  });
  
  const favBtns = trackListContainer.querySelectorAll('.favorite-btn');
  favBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.id);
    });
  });
}

function toggleFavorite(trackId) {
  if (state.favorites.has(trackId)) {
    state.favorites.delete(trackId);
    showToast("Removed from Favorites");
  } else {
    state.favorites.add(trackId);
    showToast("Added to Favorites");
  }
  renderPlaylist();
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// --- Search and Filter Logic ---
function handleSearch(e) {
  state.searchQuery = e.target.value.toLowerCase().trim();
  applyFilters();
}

function handleGenreFilter(e) {
  const tab = e.target.closest('.genre-tab');
  if (!tab) return;
  
  const tabs = genreTabs.querySelectorAll('.genre-tab');
  tabs.forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  
  state.activeGenre = tab.dataset.genre;
  applyFilters();
}

function applyFilters() {
  state.filteredTracks = state.tracks.filter(track => {
    // Genre check
    const matchesGenre = (state.activeGenre === 'all') || (track.genre === state.activeGenre);
    
    // Search query check
    const matchesSearch = track.title.toLowerCase().includes(state.searchQuery) ||
                          track.artist.toLowerCase().includes(state.searchQuery);
                          
    return matchesGenre && matchesSearch;
  });
  
  renderPlaylist();
  
  // Reset current view index or align if current track is in filters
  const currentTrackId = state.tracks[state.currentTrackIndex]?.id;
  const matchingFilteredIdx = state.filteredTracks.findIndex(t => t.id === currentTrackId);
  
  // If track is in the filter, keep it, otherwise do not force reset
  updateActiveTrackUI();
}

// --- Local File Upload and Reader ---
function handleFileUpload(e) {
  if (e.target.files.length > 0) {
    processFiles(e.target.files);
  }
}

function processFiles(files) {
  let loadedAny = false;
  
  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('audio/')) {
      showToast(`Skipped non-audio file: ${file.name}`);
      return;
    }
    
    // Format track details from file name
    const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    let title = fileNameWithoutExt;
    let artist = "Local Upload";
    
    // Parse "Artist - Title" format if matches
    if (fileNameWithoutExt.includes('-')) {
      const parts = fileNameWithoutExt.split('-');
      artist = parts[0].trim();
      title = parts.slice(1).join('-').trim();
    }
    
    // Create local blob object URL
    const fileURL = URL.createObjectURL(file);
    
    // Mock duration (gets read on metadata load)
    const newTrack = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: title,
      artist: artist,
      url: fileURL,
      artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80', // Default Retro image
      genre: 'imported',
      durationText: '--:--'
    };
    
    // Read audio metadata for actual duration
    const tempAudio = new Audio(fileURL);
    tempAudio.addEventListener('loadedmetadata', () => {
      newTrack.durationText = formatTime(tempAudio.duration);
      renderPlaylist();
    });
    
    state.tracks.push(newTrack);
    loadedAny = true;
  });
  
  if (loadedAny) {
    showToast("Imported local tracks successfully!");
    
    // Switch to 'imported' tab or 'all' to show new tracks immediately
    const importedTab = genreTabs.querySelector("[data-genre='imported']");
    if (importedTab) {
      importedTab.click();
    } else {
      applyFilters();
    }
    
    // Play the last uploaded track
    const newTrackIndex = state.filteredTracks.length - 1;
    loadTrack(newTrackIndex, true);
  }
}

// --- Web Audio Graph Creation ---
function initAudioContext() {
  if (state.audioGraphInitialized) return;
  
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContextClass();
    
    // Create Nodes
    state.sourceNode = state.audioContext.createMediaElementSource(audio);
    state.analyserNode = state.audioContext.createAnalyser();
    
    // Set up FFT (Fast Fourier Transform) size
    state.analyserNode.fftSize = 256; 
    
    // 1. Create Bass Boost (Low Shelf filter)
    state.bassFilter = state.audioContext.createBiquadFilter();
    state.bassFilter.type = 'lowshelf';
    state.bassFilter.frequency.value = 150; // Boost lower frequencies
    state.bassFilter.gain.value = state.bassBoostActive ? 12 : 0;
    
    // 2. Create Simple Feedback Delay (Reverb Simulator)
    state.reverbDelayNode = state.audioContext.createDelay(1.0);
    state.reverbFeedbackGain = state.audioContext.createGain();
    state.reverbDryGain = state.audioContext.createGain();
    state.reverbWetGain = state.audioContext.createGain();
    
    state.reverbDelayNode.delayTime.value = 0.35; // 350ms echo delay
    state.reverbFeedbackGain.gain.value = 0.4;  // Echo feedback tail decay
    
    // Configure Dry/Wet mixes
    state.reverbDryGain.gain.value = 1.0;
    state.reverbWetGain.gain.value = state.reverbActive ? 0.55 : 0.0;
    
    // Connect Delay Feedback loop
    state.reverbDelayNode.connect(state.reverbFeedbackGain);
    state.reverbFeedbackGain.connect(state.reverbDelayNode);
    
    // Reverb connections routing:
    // Source -> BassFilter -> Analyser
    state.sourceNode.connect(state.bassFilter);
    state.bassFilter.connect(state.analyserNode);
    
    // Analyser splits to Dry and Wet channels
    state.analyserNode.connect(state.reverbDryGain); // Dry
    state.analyserNode.connect(state.reverbDelayNode); // Delay wet generator
    
    state.reverbDelayNode.connect(state.reverbWetGain); // Wet
    
    // Connect both paths to output
    state.reverbDryGain.connect(state.audioContext.destination);
    state.reverbWetGain.connect(state.audioContext.destination);
    
    state.audioGraphInitialized = true;
    console.log("Web Audio Graph initialized successfully.");
  } catch (e) {
    console.error("Web Audio API not supported or initialisation failed: ", e);
  }
}

// --- Toggle Bass Boost Filter ---
function toggleBassBoost() {
  state.bassBoostActive = !state.bassBoostActive;
  
  bassBoostCard.classList.toggle('active', state.bassBoostActive);
  bassBoostStatus.innerText = state.bassBoostActive ? 'ON' : 'OFF';
  
  if (state.audioGraphInitialized && state.bassFilter) {
    // Smooth transition of filter gain using AudioParam ramp
    const targetGain = state.bassBoostActive ? 12 : 0;
    state.bassFilter.gain.setTargetAtTime(targetGain, state.audioContext.currentTime, 0.1);
  }
  
  showToast(state.bassBoostActive ? "Bass Boost: Activated (+12dB)" : "Bass Boost: Deactivated");
}

// --- Toggle Space Reverb Filter ---
function toggleReverb() {
  state.reverbActive = !state.reverbActive;
  
  reverbCard.classList.toggle('active', state.reverbActive);
  reverbStatus.innerText = state.reverbActive ? 'ON' : 'OFF';
  
  if (state.audioGraphInitialized && state.reverbWetGain) {
    const targetWet = state.reverbActive ? 0.55 : 0.0;
    state.reverbWetGain.gain.setTargetAtTime(targetWet, state.audioContext.currentTime, 0.15);
  }
  
  showToast(state.reverbActive ? "Space Reverb: Active (Spacious Echo)" : "Space Reverb: Deactivated");
}

// --- Web Audio Procedural Synthesizer ---
function toggleSynthMode() {
  initAudioContext();
  
  state.synthModeActive = !state.synthModeActive;
  
  synthCard.classList.toggle('active', state.synthModeActive);
  synthStatus.innerText = state.synthModeActive ? 'ON' : 'OFF';
  
  if (state.synthModeActive) {
    // Pause background MP3 audio player
    audio.pause();
    state.isPlaying = false;
    updatePlaybackUI();
    
    // Set UI indicators to synth info
    trackTitle.innerText = "Procedural Synthesizer";
    trackArtist.innerText = "Real-time Web Audio API";
    trackGenreTag.innerText = "System Synth";
    albumArtImage.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80';
    updateAmbientColors('synthwave');
    
    durationTimeDisplay.innerText = "Infinite";
    currentTimeDisplay.innerText = "0:00";
    progressBarFill.style.width = '100%';
    progressBarHandle.style.left = '100%';
    
    // Automatically play the synth loops
    playAudio();
    showToast("Synth Beat Mode: ON. Sound generated locally!");
  } else {
    stopSynthSequencer();
    state.isPlaying = false;
    updatePlaybackUI();
    
    // Reload normal track details
    loadTrack(state.currentTrackIndex, false);
    showToast("Synth Beat Mode: OFF");
  }
}

function startSynthSequencer() {
  stopSynthSequencer();
  
  if (!state.audioContext) return;
  if (state.audioContext.state === 'suspended') {
    state.audioContext.resume();
  }
  
  const stepDuration = 60 / state.synthTempo / 2; // Eighth notes
  let nextNoteTime = state.audioContext.currentTime;
  
  state.synthTimer = setInterval(() => {
    // Schedule notes slightly in advance to avoid jitter
    while (nextNoteTime < state.audioContext.currentTime + 0.1) {
      scheduleSynthStep(state.synthBeatStep, nextNoteTime);
      nextNoteTime += stepDuration;
      state.synthBeatStep = (state.synthBeatStep + 1) % 16; // 16-step sequence loop
    }
    
    // Update simple progress display timer
    const timeSecs = state.audioContext.currentTime % 3600;
    currentTimeDisplay.innerText = formatTime(timeSecs);
  }, 50);
}

function stopSynthSequencer() {
  if (state.synthTimer) {
    clearInterval(state.synthTimer);
    state.synthTimer = null;
  }
}

// Procedural synthesizer sound generators
function scheduleSynthStep(step, time) {
  if (!state.audioContext) return;
  
  // Create synth master node that routes into visualizer
  const synthOutput = state.audioContext.createGain();
  synthOutput.gain.value = state.isMuted ? 0 : state.volume * 0.45;
  synthOutput.connect(state.analyserNode); // Connecting here allows visualizer to show it!
  
  // 1. Kick Drum (Step 0, 4, 8, 12)
  if (step % 4 === 0) {
    const kickOsc = state.audioContext.createOscillator();
    const kickGain = state.audioContext.createGain();
    
    kickOsc.connect(kickGain);
    kickGain.connect(synthOutput);
    
    // Drop pitch sweep rapidly
    kickOsc.frequency.setValueAtTime(150, time);
    kickOsc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    kickGain.gain.setValueAtTime(1.0, time);
    kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    
    kickOsc.start(time);
    kickOsc.stop(time + 0.16);
  }
  
  // 2. Hi-Hat (Steps 2, 6, 10, 14)
  if (step % 4 === 2) {
    // Create synthesized white noise for hi-hat
    const bufferSize = state.audioContext.sampleRate * 0.05; // 50ms
    const buffer = state.audioContext.createBuffer(1, bufferSize, state.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = state.audioContext.createBufferSource();
    noiseNode.buffer = buffer;
    
    // High-pass filter noise
    const hatFilter = state.audioContext.createBiquadFilter();
    hatFilter.type = 'highpass';
    hatFilter.frequency.value = 7000;
    
    const hatGain = state.audioContext.createGain();
    hatGain.gain.setValueAtTime(0.3, time);
    hatGain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);
    
    noiseNode.connect(hatFilter);
    hatFilter.connect(hatGain);
    hatGain.connect(synthOutput);
    
    noiseNode.start(time);
    noiseNode.stop(time + 0.05);
  }
  
  // 3. Synth Chords / Melodies (on eighth notes, melody sequence)
  // Simple predefined pattern map for A-minor chord variations
  const chordProgression = [
    [0, 2, 4], // Am: A, C, E
    [0, 2, 4],
    [3, 5, 7], // Dm: D, F, A
    [3, 5, 7],
    [1, 3, 5], // Bdim / C: B, D, F
    [1, 3, 5],
    [4, 6, 7], // Em / G: E, G, A
    [4, 6, 7]
  ];
  
  // Trigger note on step 0, 3, 6, 8, 11, 14
  const activeMelodySteps = [0, 3, 6, 8, 11, 14];
  if (activeMelodySteps.includes(step)) {
    // Pick active chord based on sequence step
    const progressionIdx = Math.floor(step / 2) % chordProgression.length;
    const notes = chordProgression[progressionIdx];
    
    // Choose one note from chord dynamically
    const noteOffset = notes[step % notes.length];
    const baseFreq = state.synthScale[noteOffset] || 220;
    
    // Play dual detuned oscillators (warm saw sound)
    [baseFreq - 1, baseFreq + 2].forEach((freq) => {
      const osc = state.audioContext.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      
      const filter = state.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.exponentialRampToValueAtTime(200, time + 0.3);
      
      const gainNode = state.audioContext.createGain();
      gainNode.gain.setValueAtTime(0.18, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(synthOutput);
      
      osc.start(time);
      osc.stop(time + 0.4);
    });
  }
}

// --- Visualizer Animation Canvas Loop ---
function visualizerLoop() {
  requestAnimationFrame(visualizerLoop);
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas with a very soft semi-transparent black to create motion trail blur
  canvasCtx.fillStyle = 'rgba(10, 8, 18, 0.16)';
  canvasCtx.fillRect(0, 0, width, height);
  
  let dataArray;
  let bufferLength;
  
  // If audioContext and node exists, read real frequencies, else draw soft procedural waves
  if (state.audioGraphInitialized && state.isPlaying) {
    if (state.visualizerStyle === 'waveform') {
      bufferLength = state.analyserNode.fftSize;
      dataArray = new Uint8Array(bufferLength);
      state.analyserNode.getByteTimeDomainData(dataArray);
    } else {
      bufferLength = state.analyserNode.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      state.analyserNode.getByteFrequencyData(dataArray);
    }
  } else {
    // Generate beautiful procedural data array when silent or paused so visualizer remains alive!
    bufferLength = 128;
    dataArray = new Uint8Array(bufferLength);
    const time = Date.now() * 0.003;
    
    for (let i = 0; i < bufferLength; i++) {
      let value = 0;
      if (state.isPlaying) { // Simulation for loading states
        value = Math.abs(Math.sin(i * 0.1 + time) * Math.cos(i * 0.05 - time * 0.5));
      } else {
        // Quiet state idle waves
        value = Math.abs(Math.sin(i * 0.08 + time * 0.3) * 0.15) + (Math.sin(i * 0.2 + time) * 0.05);
      }
      dataArray[i] = Math.max(0, value * 255);
    }
  }
  
  // Render visualizer styles
  if (state.visualizerStyle === 'circular') {
    drawCircularVisualizer(dataArray, bufferLength, width, height);
  } else if (state.visualizerStyle === 'bars') {
    drawBarsVisualizer(dataArray, bufferLength, width, height);
  } else if (state.visualizerStyle === 'waveform') {
    drawWaveformVisualizer(dataArray, bufferLength, width, height);
  }
}

// Visualizer Styles Implementations
function drawCircularVisualizer(dataArray, bufferLength, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Calculate average bass frequency for center pulsing
  let bassSum = 0;
  const bassBins = Math.floor(bufferLength * 0.15); // First 15% bins are bass
  for (let i = 0; i < bassBins; i++) {
    bassSum += dataArray[i];
  }
  const bassAvg = bassSum / (bassBins || 1);
  const pulseFactor = (bassAvg / 255) * 20; // Maximum pulse of 20px
  
  const baseRadius = 75 + pulseFactor;
  
  // Draw glowing center aura
  const auraGlow = canvasCtx.createRadialGradient(centerX, centerY, baseRadius - 10, centerX, centerY, baseRadius + 40);
  auraGlow.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
  auraGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
  auraGlow.addColorStop(1, 'rgba(0,0,0,0)');
  canvasCtx.fillStyle = auraGlow;
  canvasCtx.beginPath();
  canvasCtx.arc(centerX, centerY, baseRadius + 40, 0, Math.PI * 2);
  canvasCtx.fill();
  
  // Draw radial frequency lines
  const numSpikes = 80;
  for (let i = 0; i < numSpikes; i++) {
    // Map spikes to array elements
    const dataIndex = Math.floor((i / numSpikes) * bufferLength * 0.8);
    const value = dataArray[dataIndex] || 0;
    
    // Scale amplitude
    const amplitude = (value / 255) * 55;
    
    // Radial calculation
    const angle = (i / numSpikes) * Math.PI * 2;
    const xStart = centerX + Math.cos(angle) * baseRadius;
    const yStart = centerY + Math.sin(angle) * baseRadius;
    const xEnd = centerX + Math.cos(angle) * (baseRadius + amplitude);
    const yEnd = centerY + Math.sin(angle) * (baseRadius + amplitude);
    
    // Glowing gradient color paths
    const gradient = canvasCtx.createLinearGradient(xStart, yStart, xEnd, yEnd);
    gradient.addColorStop(0, '#8b5cf6'); // Purple
    gradient.addColorStop(1, '#06b6d4'); // Cyan
    
    canvasCtx.strokeStyle = gradient;
    canvasCtx.lineWidth = 2.5;
    canvasCtx.lineCap = 'round';
    canvasCtx.beginPath();
    canvasCtx.moveTo(xStart, yStart);
    canvasCtx.lineTo(xEnd, yEnd);
    canvasCtx.stroke();
  }
  
  // Outer elegant boundary ring
  canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  canvasCtx.lineWidth = 1;
  canvasCtx.beginPath();
  canvasCtx.arc(centerX, centerY, baseRadius - 4, 0, Math.PI * 2);
  canvasCtx.stroke();
}

function drawBarsVisualizer(dataArray, bufferLength, width, height) {
  const barWidth = (width / (bufferLength * 0.7)) * 1.5;
  let barHeight;
  let x = 0;
  
  for (let i = 0; i < bufferLength * 0.7; i++) {
    const value = dataArray[i];
    barHeight = (value / 255) * (height * 0.75);
    
    // Linear purple-cyan-pink gradient colors
    const gradient = canvasCtx.createLinearGradient(x, height, x, height - barHeight);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)');  // Fade purple at bottom
    gradient.addColorStop(0.5, '#8b5cf6');                 // Solid purple center
    gradient.addColorStop(1, '#06b6d4');                   // Cyan top caps
    
    canvasCtx.fillStyle = gradient;
    
    // Render rounded bars
    const y = height - barHeight;
    canvasCtx.beginPath();
    if (canvasCtx.roundRect) {
      canvasCtx.roundRect(x, y, barWidth - 4, barHeight, [4, 4, 0, 0]);
    } else {
      canvasCtx.rect(x, y, barWidth - 4, barHeight);
    }
    canvasCtx.fill();
    
    // Optional glowing top cap dots
    if (barHeight > 10) {
      canvasCtx.fillStyle = '#ffffff';
      canvasCtx.shadowBlur = 4;
      canvasCtx.shadowColor = '#06b6d4';
      canvasCtx.beginPath();
      canvasCtx.arc(x + (barWidth - 4) / 2, y, 1.5, 0, Math.PI * 2);
      canvasCtx.fill();
      // Reset shadows
      canvasCtx.shadowBlur = 0;
    }
    
    x += barWidth;
  }
}

function drawWaveformVisualizer(dataArray, bufferLength, width, height) {
  canvasCtx.lineWidth = 3;
  
  // Purple/Cyan neon glow trace line
  const grad = canvasCtx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, '#8b5cf6');
  grad.addColorStop(0.5, '#ec4899');
  grad.addColorStop(1, '#06b6d4');
  
  canvasCtx.strokeStyle = grad;
  canvasCtx.beginPath();
  
  const sliceWidth = width / bufferLength;
  let x = 0;
  
  for (let i = 0; i < bufferLength; i++) {
    // Normalise byte time-domain data (128 center line)
    const v = dataArray[i] / 128.0;
    const y = (v * height) / 2;
    
    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }
    
    x += sliceWidth;
  }
  
  canvasCtx.lineTo(width, height / 2);
  canvasCtx.stroke();
  
  // Draw secondary mirror oscilloscope baseline
  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  canvasCtx.beginPath();
  canvasCtx.moveTo(0, height / 2);
  canvasCtx.lineTo(width, height / 2);
  canvasCtx.stroke();
}

// --- Keyboard Navigation Controls ---
function handleKeyboardShortcuts(e) {
  // Avoid interfering with typing inside search input box
  if (document.activeElement === searchInput) return;
  
  switch(e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (!state.synthModeActive) {
        audio.currentTime = Math.max(0, audio.currentTime - 10);
        updateProgress();
        showToast("Rewind -10s");
      }
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (!state.synthModeActive) {
        audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
        updateProgress();
        showToast("Fast Forward +10s");
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      state.volume = Math.min(1.0, state.volume + 0.05);
      if (!state.synthModeActive) {
        audio.volume = state.volume;
      }
      updateVolumeUI();
      break;
    case 'ArrowDown':
      e.preventDefault();
      state.volume = Math.max(0.0, state.volume - 0.05);
      if (!state.synthModeActive) {
        audio.volume = state.volume;
      }
      updateVolumeUI();
      break;
    case 'KeyM':
      toggleMute();
      break;
    case 'KeyS':
      toggleShuffle();
      break;
    case 'KeyR':
      toggleRepeat();
      break;
  }
}

// Start Application on Page Load
window.addEventListener('DOMContentLoaded', init);
