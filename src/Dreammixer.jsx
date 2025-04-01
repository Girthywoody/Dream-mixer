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
      playing: false
    }))
  );
  
  // State for master volume
  const [masterVolume, setMasterVolume] = useState(70);
  
  // State to track if audio has been initialized (important for iOS)
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Refs for audio elements
  const audioRefs = useRef({});
  
  // Detect iOS device
  const [isIOS, setIsIOS] = useState(false);
  
  useEffect(() => {
    // Detect iOS device
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    setIsIOS(checkIOS());
  }, []);

  // Initialize audio elements
  useEffect(() => {
    const initializeAudio = () => {
      soundOptions.forEach(sound => {
        if (sound.active && sound.file) {
          try {
            // Create audio element
            const audio = new Audio(`/${sound.file}`);
            audio.loop = true;
            audio.preload = 'auto'; // Preload audio
            audio.volume = 0; // Start with volume at 0
            
            // For iOS, we need to load the audio
            if (isIOS) {
              audio.load();
            }
            
            // Store audio element in refs
            audioRefs.current[sound.id] = audio;
          } catch (error) {
            console.error(`Error loading audio file ${sound.file}:`, error);
          }
        }
      });
      
      setAudioInitialized(true);
    };
    
    initializeAudio();
    
    // Initialize iOS audio if needed
    if (isIOS) {
      // iOS requires user interaction to start audio
      // This function will be called on first user interaction
      const unlockAudio = () => {
        // Create and play a silent audio element to unlock audio
        const silentAudio = new Audio();
        silentAudio.play().catch(() => {});
        
        // Also try to play each audio element briefly
        Object.values(audioRefs.current).forEach(audio => {
          if (audio) {
            // Set volume to 0 to be silent
            audio.volume = 0;
            // Play audio briefly then immediately pause
            audio.play()
              .then(() => {
                setTimeout(() => {
                  audio.pause();
                  audio.currentTime = 0;
                }, 1);
              })
              .catch(() => {});
          }
        });
        
        // Remove event listeners after first interaction
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
      };
      
      // Add event listeners to unlock audio on first interaction
      document.addEventListener('touchstart', unlockAudio);
      document.addEventListener('click', unlockAudio);
    }

    // Cleanup function
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio && audio.pause) {
          audio.pause();
        }
      });
      
      // Remove iOS specific listeners if they exist
      if (isIOS) {
        document.removeEventListener('touchstart', () => {});
        document.removeEventListener('click', () => {});
      }
    };
  }, [isIOS]);

  // Function to update audio volume
  const updateVolume = (id, individualVolume) => {
    const audio = audioRefs.current[id];
    if (audio) {
      // Calculate precise volume
      let calculatedVolume = (individualVolume / 100) * (masterVolume / 100);
      
      // iOS often requires a higher minimum volume to be audible
      if (isIOS && calculatedVolume > 0 && calculatedVolume < 0.1) {
        calculatedVolume = 0.1; // Set minimum volume for iOS
      }
      
      // Set the volume with a small delay for iOS
      if (isIOS) {
        setTimeout(() => {
          audio.volume = calculatedVolume;
        }, 50);
      } else {
        audio.volume = calculatedVolume;
      }
      
      return true;
    }
    return false;
  };

  // Handle sound button click (toggle on/off)
  const toggleSound = (id) => {
    // For iOS, we need to ensure audio is initialized
    if (isIOS && !audioInitialized) {
      // Try to initialize audio again
      const audio = audioRefs.current[id];
      if (audio) {
        audio.load();
        audio.play().catch(() => {});
        audio.pause();
      }
    }
    
    setSoundStates(prevStates => 
      prevStates.map(state => {
        if (state.id === id) {
          const audio = audioRefs.current[id];
          if (!audio) return state;
          
          // If not playing, start playing
          if (!state.playing) {
            // Get volume (use current or default to 20%)
            const newVolume = state.volume > 0 ? state.volume : 20;
            
            // Set volume first
            updateVolume(id, newVolume);
            
            // For iOS, play with a small delay after volume is set
            if (isIOS) {
              setTimeout(() => {
                audio.play().catch(e => console.error("Error playing audio:", e));
              }, 100);
            } else {
              audio.play().catch(e => console.error("Error playing audio:", e));
            }
            
            return {
              ...state,
              volume: newVolume,
              playing: true
            };
          } 
          // If already playing, stop
          else {
            // For iOS, lower volume before pausing for a smoother experience
            if (isIOS) {
              updateVolume(id, 0);
              setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
              }, 50);
            } else {
              audio.pause();
              audio.currentTime = 0;
            }
            
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
          const audio = audioRefs.current[id];
          
          // If volume is now zero, pause the audio
          if (newVolume === 0 && state.playing) {
            if (audio) {
              if (isIOS) {
                // iOS: set volume to 0 first, then pause
                updateVolume(id, 0);
                setTimeout(() => {
                  audio.pause();
                  audio.currentTime = 0;
                }, 50);
              } else {
                audio.pause();
                audio.currentTime = 0;
              }
            }
            
            return {
              ...state,
              volume: 0,
              playing: false
            };
          }
          
          // If volume is positive and audio exists
          if (newVolume > 0) {
            if (audio) {
              // Start playing if not playing
              if (!state.playing) {
                updateVolume(id, newVolume);
                
                if (isIOS) {
                  setTimeout(() => {
                    audio.play().catch(e => console.error("Error playing audio:", e));
                  }, 100);
                } else {
                  audio.play().catch(e => console.error("Error playing audio:", e));
                }
              } else {
                // Just update volume if already playing
                updateVolume(id, newVolume);
              }
            }
            
            return {
              ...state,
              volume: newVolume,
              playing: true
            };
          }
          
          // Update volume in state
          return {
            ...state,
            volume: newVolume
          };
        }
        return state;
      })
    );
  };
  
  // Handle master volume change
  const handleMasterVolumeChange = (newMasterVolume) => {
    // Set new master volume
    setMasterVolume(newMasterVolume);
    
    // Update all playing sounds with the new master volume
    soundStates.forEach(state => {
      if (state.playing && state.volume > 0) {
        updateVolume(state.id, state.volume);
      }
    });
  };
  
  // Turn off all sounds
  const turnOffAllSounds = () => {
    // Pause all audio elements
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && audio.pause) {
        // For iOS, fade out before stopping
        if (isIOS) {
          audio.volume = 0;
          setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
          }, 50);
        } else {
          audio.pause();
          audio.currentTime = 0;
        }
      }
    });
    
    // Update all states to not playing
    setSoundStates(prevStates => 
      prevStates.map(state => ({
        ...state,
        playing: false
        // Keep volume settings
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
        {isIOS && (
          <p className="text-amber-400 text-xs mt-1">
            iOS Mode: Tap any sound to initialize audio
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