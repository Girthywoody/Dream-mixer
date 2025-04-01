import React, { useState, useEffect, useRef } from 'react';
import { Wind, Droplet, Flame, Leaf, Fan, Waves, Plus } from 'lucide-react';

const Dreammixer = () => {
  // List of available sounds with professional icons from lucide-react
  const soundOptions = [
    { id: 'fire', name: 'Fire', icon: <Flame size={24} />, file: 'fire.mp3', category: 'elements', active: true },
    { id: 'rain', name: 'Rain', icon: <Droplet size={24} />, file: 'rain.mp3', category: 'weather', active: true },
    { id: 'whitenoise', name: 'White Noise', icon: <Fan size={24} />, file: 'white-noise.mp3', category: 'ambient', active: true },
    { id: 'river', name: 'River', icon: <Waves size={24} />, file: 'river.mp3', category: 'nature', active: true },
    { id: 'nature', name: 'Nature', icon: <Leaf size={24} />, file: 'nature.mp3', category: 'nature', active: true },
    { id: 'wind', name: 'Wind', icon: <Wind size={24} />, file: 'wind.mp3', category: 'weather', active: true },
    { id: 'empty1', name: 'Empty', icon: <Plus size={24} />, file: '', category: 'empty', active: false }
  ];

  // State to track audio elements and their volumes
  const [soundStates, setSoundStates] = useState(
    soundOptions.map(sound => ({
      id: sound.id,
      volume: 0,
      playing: false,
      loaded: false
    }))
  );
  
  // State for master volume
  const [masterVolume, setMasterVolume] = useState(70);

  // Refs for audio elements
  const audioRefs = useRef({});

  // Initialize audio elements with iOS-specific handling
  useEffect(() => {
    // For iOS audio session initialization
    const initIOSAudio = () => {
      // Create temporary silent audio element to initialize audio session
      const tempAudio = new Audio();
      tempAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      tempAudio.play().catch(e => console.log("iOS audio init:", e));
      tempAudio.pause();
    };
    
    // Run iOS init on first touch/click anywhere
    const handleInitialUserInteraction = () => {
      initIOSAudio();
      document.removeEventListener('touchstart', handleInitialUserInteraction);
      document.removeEventListener('click', handleInitialUserInteraction);
    };
    
    document.addEventListener('touchstart', handleInitialUserInteraction);
    document.addEventListener('click', handleInitialUserInteraction);
    
    // Initialize audio elements for all sounds
    soundOptions.forEach(sound => {
      if (sound.active && sound.file) {
        try {
          const audio = new Audio(`/${sound.file}`);
          audio.loop = true;
          audio.volume = 0;
          
          // iOS specific - need to load and then set attributes
          audio.load();
          
          // Store audio element in refs
          audioRefs.current[sound.id] = audio;
        } catch (error) {
          console.error(`Error loading audio file ${sound.file}:`, error);
        }
      }
    });

    // Cleanup function to stop all sounds when component unmounts
    return () => {
      document.removeEventListener('touchstart', handleInitialUserInteraction);
      document.removeEventListener('click', handleInitialUserInteraction);
      
      Object.values(audioRefs.current).forEach(audio => {
        if (audio && audio.pause) {
          audio.pause();
        }
      });
    };
  }, []);

  // Handle sound button click (toggle on/off)
  const toggleSound = (id) => {
    setSoundStates(prevStates => 
      prevStates.map(state => {
        if (state.id === id) {
          const audio = audioRefs.current[id];
          if (!audio) return state;
          
          // If not playing, start at 20% volume
          if (!state.playing) {
            // Play first, then set volume (important for iOS)
            audio.play().catch(e => console.error("Error playing audio:", e));
            
            // Force small delay for iOS
            setTimeout(() => {
              audio.volume = 0.2 * (masterVolume / 100);
              console.log(`Toggle: Setting ${id} volume to: ${audio.volume}`);
            }, 10);
            
            return {
              ...state,
              volume: 20,
              playing: true
            };
          } 
          // If already playing, stop and set volume to 0
          else {
            audio.pause();
            audio.currentTime = 0;
            return {
              ...state,
              volume: 0,
              playing: false
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
          const audio = audioRefs.current[id];
          if (audio) {
            // iOS requires explicit audio context interaction
            if (newVolume > 0 && !state.playing) {
              // If we're increasing volume from zero, need to play first
              audio.play().catch(e => console.error("Error playing audio:", e));
            }
            
            // Set volume (convert from 0-100 to 0-1) and apply master volume
            // Force a small delay for iOS to recognize the change
            setTimeout(() => {
              audio.volume = (newVolume / 100) * (masterVolume / 100);
              console.log(`Setting ${id} volume to: ${audio.volume}`);
            }, 10);
            
            // If volume is 0, stop playing
            if (newVolume === 0 && state.playing) {
              audio.pause();
              return {
                ...state,
                volume: newVolume,
                playing: false
              };
            }
          }
          
          return {
            ...state,
            volume: newVolume,
            playing: newVolume > 0
          };
        }
        return state;
      })
    );
  };
  
  // Handle master volume change
  const handleMasterVolumeChange = (newMasterVolume) => {
    setMasterVolume(newMasterVolume);
    
    // Apply new master volume to all playing sounds
    // Add slight delay for iOS
    setTimeout(() => {
      soundStates.forEach(state => {
        if (state.playing) {
          const audio = audioRefs.current[state.id];
          if (audio) {
            audio.volume = (state.volume / 100) * (newMasterVolume / 100);
            console.log(`Master: Setting ${state.id} volume to: ${audio.volume}`);
          }
        }
      });
    }, 10);
  };
  
  // Turn off all sounds
  const turnOffAllSounds = () => {
    // Pause all audio elements
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && audio.pause) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    // Update all states to not playing
    setSoundStates(prevStates => 
      prevStates.map(state => ({
        ...state,
        volume: 0,
        playing: false
      }))
    );
  };

  // Count active sounds
  const activeSounds = soundStates.filter(state => state.playing).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
      {/* App Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-400">
          Dream Mixer
        </h1>
        <p className="text-blue-300 text-sm mt-1">Craft your perfect sleep soundscape</p>
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
              
              {/* Volume slider - Modified for iOS compatibility */}
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
                className="w-full mt-1 h-12 opacity-0 absolute -mt-6 cursor-pointer"
                style={{
                  WebkitAppearance: 'none',
                  appearance: 'none'
                }}
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
            className="w-full mt-1 h-12 opacity-0 absolute cursor-pointer"
            style={{
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
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