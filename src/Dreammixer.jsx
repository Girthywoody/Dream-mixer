import React, { useState, useEffect, useRef } from 'react';
import { Wind, Droplet, Flame, Leaf, Fan, Waves, Plus } from 'lucide-react';

const Dreammixer = () => {
  // Sound options
  const soundOptions = [
    { id: 'fire', name: 'Fire', icon: <Flame size={24} />, file: 'fire.mp3', category: 'elements', active: true },
    { id: 'rain', name: 'Rain', icon: <Droplet size={24} />, file: 'rain.mp3', category: 'weather', active: true },
    { id: 'whitenoise', name: 'White Noise', icon: <Fan size={24} />, file: 'white-noise.mp3', category: 'ambient', active: true },
    { id: 'river', name: 'River', icon: <Waves size={24} />, file: 'river.mp3', category: 'nature', active: true },
    { id: 'nature', name: 'Nature', icon: <Leaf size={24} />, file: 'nature.mp3', category: 'nature', active: true },
    { id: 'wind', name: 'Wind', icon: <Wind size={24} />, file: 'wind.mp3', category: 'weather', active: true },
    { id: 'empty1', name: 'Empty', icon: <Plus size={24} />, file: '', category: 'empty', active: false }
  ];

  // Audio context reference - keeping it in a ref to avoid recreation
  const audioContextRef = useRef(null);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  // Audio buffers, sources and gain nodes
  const audioBuffers = useRef({});
  const audioSources = useRef({});
  const gainNodes = useRef({});
  const masterGainNode = useRef(null);
  
  // State for sound volumes
  const [soundStates, setSoundStates] = useState(
    soundOptions.map(sound => ({
      id: sound.id,
      volume: 0,
      playing: false
    }))
  );
  
  // Master volume state
  const [masterVolume, setMasterVolume] = useState(70);
  
  // Check if iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Function to initialize the audio context
  const initAudioContext = () => {
    if (audioContextRef.current) return; // Already initialized
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const newContext = new AudioContext();
      audioContextRef.current = newContext;
      
      // Create master gain node
      const masterGain = newContext.createGain();
      masterGain.gain.value = masterVolume / 100;
      masterGain.connect(newContext.destination);
      masterGainNode.current = masterGain;
      
      // Load all sound files
      soundOptions.forEach(sound => {
        if (sound.active && sound.file) {
          loadSound(sound.id, sound.file);
        }
      });
      
      setAudioInitialized(true);
      console.log("Audio context initialized successfully");
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
    }
  };
  
  // Function to load a sound file
  const loadSound = async (id, filename) => {
    if (!audioContextRef.current) {
      console.error("Cannot load sound - audio context not initialized");
      return;
    }
    
    // Don't reload if already loaded
    if (audioBuffers.current[id]) {
      console.log(`Sound ${id} already loaded`);
      return;
    }
    
    try {
      console.log(`Loading sound: ${id} from ${filename}`);
      
      // Fetch the audio file
      const response = await fetch(`/${filename}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`Sound ${id} fetched, decoding...`);
      
      // Decode the audio data
      audioContextRef.current.decodeAudioData(
        arrayBuffer,
        (buffer) => {
          // Store the decoded buffer
          audioBuffers.current[id] = buffer;
          
          // Create a gain node for this sound
          const gainNode = audioContextRef.current.createGain();
          gainNode.gain.value = 0; // Start with no volume
          gainNode.connect(masterGainNode.current); // Connect to master gain
          gainNodes.current[id] = gainNode;
          
          console.log(`Successfully loaded sound: ${id}`);
          
          // Notify any pending play requests that this sound is now available
          const pendingState = soundStates.find(s => s.id === id && s.volume > 0);
          if (pendingState) {
            console.log(`Auto-playing newly loaded sound: ${id}`);
            setSoundVolume(id, pendingState.volume);
            playSound(id);
          }
        },
        (error) => {
          console.error(`Error decoding ${filename}:`, error);
          // Remove from buffers to allow retry
          delete audioBuffers.current[id];
        }
      );
    } catch (error) {
      console.error(`Error loading sound ${filename}:`, error);
      // Remove from buffers to allow retry
      delete audioBuffers.current[id];
    }
  };
  
  // Function to play a sound
  const playSound = (id) => {
    if (!audioContextRef.current) {
      console.warn(`Cannot play sound ${id}: Audio context not initialized`);
      return false;
    }
    
    if (!audioBuffers.current[id]) {
      console.warn(`Cannot play sound ${id}: Audio buffer not loaded yet`);
      // Try to load the sound if it's not loaded
      const soundOption = soundOptions.find(s => s.id === id);
      if (soundOption && soundOption.file) {
        console.log(`Attempting to load sound: ${id}`);
        loadSound(id, soundOption.file);
        // Return false for now, the sound will be available for the next attempt
      }
      return false;
    }
    
    if (!gainNodes.current[id]) {
      console.warn(`Cannot play sound ${id}: Gain node not created`);
      return false;
    }
    
    try {
      // If this sound is already playing, stop it first
      if (audioSources.current[id]) {
        stopSound(id);
      }
      
      // Create a new audio source
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffers.current[id];
      source.loop = true;
      
      // Connect source to gain node (which is connected to master gain)
      source.connect(gainNodes.current[id]);
      
      // Start playing
      source.start(0);
      
      // Store the source
      audioSources.current[id] = source;
      console.log(`Started playing: ${id}`);
      
      return true;
    } catch (error) {
      console.error(`Error playing sound ${id}:`, error);
      return false;
    }
  };
  
  // Function to stop a sound
  const stopSound = (id) => {
    if (audioSources.current[id]) {
      try {
        // Add small fade out to avoid clicks
        const gainNode = gainNodes.current[id];
        if (gainNode) {
          // Current time from audio context
          const now = audioContextRef.current.currentTime;
          // Schedule a short fade out over 0.1 seconds
          gainNode.gain.setValueAtTime(gainNode.gain.value, now);
          gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
        }
        
        // Schedule source to stop after fade out
        setTimeout(() => {
          try {
            if (audioSources.current[id]) {
              audioSources.current[id].stop();
              delete audioSources.current[id];
            }
          } catch (e) {
            // Source might already be stopped
            console.warn(`Error stopping sound ${id}:`, e);
            delete audioSources.current[id];
          }
        }, 100);
        
        return true;
      } catch (error) {
        console.error(`Error stopping sound ${id}:`, error);
        delete audioSources.current[id];
        return false;
      }
    }
    
    return false;
  };
  
  // Function to set volume of a sound
  const setSoundVolume = (id, volumePercent) => {
    if (!gainNodes.current[id] || !audioContextRef.current) {
      return false;
    }
    
    try {
      // Calculate volume (0-1 range) based on individual volume
      const calculatedVolume = volumePercent / 100;
      
      // Get the gain node
      const gainNode = gainNodes.current[id];
      
      // Get current time from audio context
      const now = audioContextRef.current.currentTime;
      
      // Set volume with a small ramp for smooth transition
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(calculatedVolume, now + 0.05);
      
      return true;
    } catch (error) {
      console.error(`Error setting volume for ${id}:`, error);
      return false;
    }
  };

  // Update master volume
  const updateMasterVolume = (volumePercent) => {
    if (!masterGainNode.current || !audioContextRef.current) {
      return false;
    }
    
    try {
      // Calculate volume (0-1 range)
      const calculatedVolume = volumePercent / 100;
      
      // Get current time from audio context
      const now = audioContextRef.current.currentTime;
      
      // Set master volume with a small ramp for smooth transition
      masterGainNode.current.gain.setValueAtTime(masterGainNode.current.gain.value, now);
      masterGainNode.current.gain.linearRampToValueAtTime(calculatedVolume, now + 0.05);
      
      return true;
    } catch (error) {
      console.error("Error setting master volume:", error);
      return false;
    }
  };

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = () => {
      // Try to initialize audio context
      initAudioContext();
      
      // Remove event listeners once initialized
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
    
    // Add event listeners for first interaction
    window.addEventListener('click', initAudio);
    window.addEventListener('touchstart', initAudio);
    
    // For iOS, we need an additional check
    if (isIOS) {
      window.addEventListener('touchend', initAudio);
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
      if (isIOS) {
        window.removeEventListener('touchend', initAudio);
      }
      
      // Stop all sounds and close audio context
      if (audioContextRef.current) {
        Object.keys(audioSources.current).forEach(id => {
          try {
            if (audioSources.current[id]) {
              audioSources.current[id].stop();
            }
          } catch (e) {
            // Might already be stopped
          }
        });
        
        // Close audio context
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      }
    };
  }, [isIOS]);

  // Update master volume effect
  useEffect(() => {
    if (audioInitialized && masterGainNode.current) {
      updateMasterVolume(masterVolume);
    }
  }, [masterVolume, audioInitialized]);

  // Toggle sound play/stop
  const toggleSound = async (id) => {
    // Make sure audio is initialized
    if (!audioContextRef.current) {
      initAudioContext();
      // If we're just initializing, we'll need a moment to load
      setTimeout(() => toggleSound(id), 1000);
      return;
    }
    
    // Check if the sound buffer is loaded
    if (!audioBuffers.current[id]) {
      // Find sound option
      const soundOption = soundOptions.find(s => s.id === id);
      if (soundOption && soundOption.file) {
        // Show loading state
        console.log(`Sound ${id} not loaded yet, loading now...`);
        loadSound(id, soundOption.file);
        // Try again in a moment
        setTimeout(() => toggleSound(id), 1000);
        return;
      }
    }
    
    // Resume audio context if suspended (needed for iOS/Chrome)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    setSoundStates(prevStates => 
      prevStates.map(state => {
        if (state.id === id) {
          // If currently not playing, start playing
          if (!state.playing) {
            // Use current volume or default to the standard 20%
            const newVolume = state.volume > 0 ? state.volume : 20;
            
            // Set volume first
            setSoundVolume(id, newVolume);
            
            // Start playback
            playSound(id);
            
            return {
              ...state,
              volume: newVolume,
              playing: true
            };
          } 
          // If already playing, stop
          else {
            stopSound(id);
            
            return {
              ...state,
              playing: false
              // Keep volume setting for next time
            };
          }
        }
        return state;
      })
    );
  };

  // Handle individual volume change
  const handleVolumeChange = (id, newVolume) => {
    setSoundStates(prevStates => 
      prevStates.map(state => {
        if (state.id === id) {
          // If changing to zero, stop the sound
          if (newVolume === 0 && state.playing) {
            stopSound(id);
            
            return {
              ...state,
              volume: 0,
              playing: false
            };
          }
          
          // If changing from zero to a positive value, start playing
          if (newVolume > 0 && !state.playing) {
            // Make sure audio context is running
            if (audioContextRef.current) {
              if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
              }
              
              // Check if the sound is loaded before playing
              if (audioBuffers.current[id]) {
                // Set volume
                setSoundVolume(id, newVolume);
                
                // Start playing
                playSound(id);
              } else {
                // Find the sound option
                const soundOption = soundOptions.find(s => s.id === id);
                if (soundOption && soundOption.file) {
                  // Load the sound and try playing when loaded
                  loadSound(id, soundOption.file);
                  console.log(`Loading sound ${id} before playing...`);
                  
                  // Retry after a delay
                  setTimeout(() => {
                    if (audioBuffers.current[id]) {
                      setSoundVolume(id, newVolume);
                      playSound(id);
                      setSoundStates(states => 
                        states.map(s => s.id === id ? {...s, playing: true} : s)
                      );
                    }
                  }, 1000);
                }
              }
            }
            
            return {
              ...state,
              volume: newVolume,
              playing: !!audioBuffers.current[id] // Only mark as playing if buffer exists
            };
          }
          
          // If already playing, just update volume
          if (state.playing && newVolume > 0) {
            setSoundVolume(id, newVolume);
          }
          
          return {
            ...state,
            volume: newVolume,
            playing: newVolume > 0 ? true : state.playing
          };
        }
        return state;
      })
    );
  };
  
  // Handle master volume change
  const handleMasterVolumeChange = (newMasterVolume) => {
    setMasterVolume(newMasterVolume);
  };
  
  // Turn off all sounds
  const turnOffAllSounds = () => {
    // Stop all sounds
    Object.keys(audioSources.current).forEach(id => {
      stopSound(id);
    });
    
    // Update states
    setSoundStates(prevStates => 
      prevStates.map(state => ({
        ...state,
        playing: false
        // Keep volume values
      }))
    );
  };

  // Count active sounds
  const activeSounds = soundStates.filter(state => state.playing).length;
  
  // Track loading state
  const [isLoadingSounds, setIsLoadingSounds] = useState(false);
  
  // Load sounds info
  useEffect(() => {
    if (audioContextRef.current && audioInitialized) {
      setIsLoadingSounds(true);
      
      // Pre-load all sounds
      const loadPromises = soundOptions
        .filter(sound => sound.active && sound.file)
        .map(sound => {
          if (!audioBuffers.current[sound.id]) {
            return loadSound(sound.id, sound.file);
          }
          return Promise.resolve();
        });
      
      Promise.all(loadPromises)
        .then(() => {
          console.log("All sounds pre-loaded");
          setIsLoadingSounds(false);
        })
        .catch(error => {
          console.error("Error pre-loading sounds:", error);
          setIsLoadingSounds(false);
        });
    }
  }, [audioInitialized]);

  // Warning message for users
  const getStatusMessage = () => {
    if (!audioInitialized) {
      return "Tap any sound to initialize audio";
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      return "Audio suspended - tap any sound";
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      {/* App Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-400">
          Dream Mixer
        </h1>
        <p className="text-blue-300 text-sm mt-1">Craft your perfect sleep soundscape</p>
        
        {/* Status message */}
        {getStatusMessage() && (
          <p className="text-amber-400 text-xs mt-1">
            {getStatusMessage()}
          </p>
        )}
      </div>
      
      {/* Active sound counter */}
      <div className="text-center mb-4">
        <div className="inline-block px-3 py-1 rounded-full bg-blue-900/50">
          <span className="text-sm text-blue-300">Active Sounds: </span>
          <span className="text-lg font-semibold">{activeSounds}</span>
        </div>
      </div>

      {/* List of sound controls */}
      <div className="flex-grow mb-6 space-y-4">
        {soundOptions.filter(sound => sound.active).map(sound => {
          const state = soundStates.find(s => s.id === sound.id);
          const isActive = state?.playing;
          const volume = state?.volume || 0;
          
          return (
            <div key={sound.id} className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <button
                    onClick={() => toggleSound(sound.id)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      isActive 
                        ? 'bg-blue-600' 
                        : 'bg-gray-700'
                    }`}
                    aria-label={`Toggle ${sound.name} sound`}
                  >
                    {sound.icon}
                  </button>
                  <span className={`font-medium ${isActive ? 'text-blue-300' : 'text-gray-300'}`}>
                    {sound.name}
                  </span>
                </div>
                <span className="text-sm text-gray-400">{volume}%</span>
              </div>
              
              {/* Volume slider */}
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-600'}`}
                  style={{ width: `${volume}%` }}
                ></div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(sound.id, parseInt(e.target.value))}
                className="w-full mt-1 h-1 appearance-none bg-transparent cursor-pointer"
                aria-label={`${sound.name} volume control`}
              />
            </div>
          );
        })}
      </div>
      
      {/* Master Volume Control */}
      <div className="mt-auto">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300">Master Volume</span>
            <span className="text-sm text-gray-400">{masterVolume}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${masterVolume}%` }}
            ></div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => handleMasterVolumeChange(parseInt(e.target.value))}
            className="w-full h-1 mt-1 appearance-none bg-transparent cursor-pointer"
            aria-label="Master volume control"
          />
          
          {/* Control Buttons */}
          <div className="flex justify-center mt-6">
            <button 
              onClick={turnOffAllSounds}
              className="px-4 py-2 rounded-lg bg-red-900/50 hover:bg-red-700/50 text-white text-sm transition-colors"
              aria-label="Turn off all sounds"
            >
              Turn Off All Sounds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dreammixer;