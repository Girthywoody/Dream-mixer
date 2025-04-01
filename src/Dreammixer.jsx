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

  // Audio context
  const [audioContext, setAudioContext] = useState(null);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  // Audio buffers, sources and gain nodes
  const audioBuffers = useRef({});
  const audioSources = useRef({});
  const gainNodes = useRef({});
  
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
    if (audioContext) return; // Already initialized
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const newContext = new AudioContext();
      setAudioContext(newContext);
      
      // Load all sound files
      soundOptions.forEach(sound => {
        if (sound.active && sound.file) {
          loadSound(sound.id, sound.file, newContext);
        }
      });
      
      setAudioInitialized(true);
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
    }
  };
  
  // Function to load a sound file
  const loadSound = async (id, filename, context) => {
    try {
      // Fetch the audio file
      const response = await fetch(`/${filename}`);
      const arrayBuffer = await response.arrayBuffer();
      
      // Decode the audio data
      context.decodeAudioData(
        arrayBuffer,
        (buffer) => {
          // Store the decoded buffer
          audioBuffers.current[id] = buffer;
          
          // Create a gain node for this sound
          const gainNode = context.createGain();
          gainNode.gain.value = 0; // Start with no volume
          gainNode.connect(context.destination);
          gainNodes.current[id] = gainNode;
        },
        (error) => console.error(`Error decoding ${filename}:`, error)
      );
    } catch (error) {
      console.error(`Error loading sound ${filename}:`, error);
    }
  };
  
  // Function to play a sound
  const playSound = (id) => {
    if (!audioContext || !audioBuffers.current[id] || !gainNodes.current[id]) {
      console.warn(`Cannot play sound ${id}: Audio not loaded`);
      return false;
    }
    
    try {
      // If this sound is already playing, stop it first
      if (audioSources.current[id]) {
        stopSound(id);
      }
      
      // Create a new audio source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffers.current[id];
      source.loop = true;
      
      // Connect source to gain node (which is already connected to destination)
      source.connect(gainNodes.current[id]);
      
      // Start playing
      source.start(0);
      
      // Store the source
      audioSources.current[id] = source;
      
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
          const now = audioContext.currentTime;
          // Schedule a short fade out over 0.1 seconds
          gainNode.gain.setValueAtTime(gainNode.gain.value, now);
          gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
        }
        
        // Schedule source to stop after fade out
        setTimeout(() => {
          try {
            audioSources.current[id].stop();
          } catch (e) {
            // Source might already be stopped
          }
          delete audioSources.current[id];
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
    if (!gainNodes.current[id] || !audioContext) {
      return false;
    }
    
    try {
      // Calculate volume (0-1 range) based on individual and master volume
      const calculatedVolume = (volumePercent / 100) * (masterVolume / 100);
      
      // Get the gain node
      const gainNode = gainNodes.current[id];
      
      // Get current time from audio context
      const now = audioContext.currentTime;
      
      // Set volume with a small ramp for smooth transition
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(calculatedVolume, now + 0.05);
      
      return true;
    } catch (error) {
      console.error(`Error setting volume for ${id}:`, error);
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
    
    // Cleanup
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
      
      // Stop all sounds and close audio context
      if (audioContext) {
        Object.keys(audioSources.current).forEach(id => {
          try {
            audioSources.current[id].stop();
          } catch (e) {
            // Might already be stopped
          }
        });
        
        // Close audio context
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
      }
    };
  }, []);

  // Toggle sound play/stop
  const toggleSound = async (id) => {
    // Make sure audio is initialized
    if (!audioContext) {
      initAudioContext();
      // If we're just initializing, we'll need a moment to load
      setTimeout(() => toggleSound(id), 500);
      return;
    }
    
    // Resume audio context if suspended (needed for iOS/Chrome)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
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
            if (audioContext && audioContext.state === 'suspended') {
              audioContext.resume();
            }
            
            // Set volume
            setSoundVolume(id, newVolume);
            
            // Start playing
            playSound(id);
            
            return {
              ...state,
              volume: newVolume,
              playing: true
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
    
    // Update all currently playing sounds
    soundStates.forEach(state => {
      if (state.playing && state.volume > 0) {
        setSoundVolume(state.id, state.volume);
      }
    });
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

  // Warning message for users
  const getStatusMessage = () => {
    if (!audioInitialized) {
      return "Tap any sound to initialize audio";
    }
    if (audioContext && audioContext.state === 'suspended') {
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
          />
          
          {/* Control Buttons */}
          <div className="flex justify-center mt-6">
            <button 
              onClick={turnOffAllSounds}
              className="px-4 py-2 rounded-lg bg-red-900/50 hover:bg-red-700/50 text-white text-sm transition-colors"
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