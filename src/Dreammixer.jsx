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

  // Function to set audio volume precisely
  const setAudioVolume = (audio, volumePercent, masterVolumePercent) => {
    if (!audio) return;
    // Convert percentages to 0-1 range and multiply
    const calculatedVolume = (volumePercent / 100) * (masterVolumePercent / 100);
    
    // Debugging - remove in production
    console.log(`Setting volume: ${volumePercent}% × ${masterVolumePercent}% = ${calculatedVolume}`);
    
    // Actually set the volume on the audio element
    audio.volume = calculatedVolume;
  };

  // Initialize audio elements
  useEffect(() => {
    soundOptions.forEach(sound => {
      if (sound.active && sound.file) {
        try {
          const audio = new Audio(`/${sound.file}`);
          audio.loop = true;
          audio.volume = 0; // Start with volume at zero
          
          // Store audio element in refs
          audioRefs.current[sound.id] = audio;
        } catch (error) {
          console.error(`Error loading audio file ${sound.file}:`, error);
        }
      }
    });

    // Cleanup function to stop all sounds when component unmounts
    return () => {
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
          
          // If not playing, start playing
          if (!state.playing) {
            // Get current volume from slider or default to 20
            const currentVolume = state.volume > 0 ? state.volume : 20;
            
            // First set the volume properly before playing
            setAudioVolume(audio, currentVolume, masterVolume);
            
            // Then play the audio
            audio.play().catch(e => console.error("Error playing audio:", e));
            
            return {
              ...state,
              volume: currentVolume,
              playing: true
            };
          } 
          // If already playing, stop
          else {
            audio.pause();
            audio.currentTime = 0;
            return {
              ...state,
              playing: false
              // Keep volume at current setting
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
              audio.pause();
              audio.currentTime = 0;
            }
            return {
              ...state,
              volume: 0,
              playing: false
            };
          }
          
          // If we have a valid volume and the audio exists
          if (newVolume > 0 && audio) {
            // If it was previously not playing or at zero, start playing
            if (!state.playing) {
              // Set volume first
              setAudioVolume(audio, newVolume, masterVolume);
              // Then play
              audio.play().catch(e => console.error("Error playing audio:", e));
            } else {
              // Just update the volume
              setAudioVolume(audio, newVolume, masterVolume);
            }
          }
          
          // Return updated state
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
    // Update all currently playing sounds with the new master volume
    soundStates.forEach(state => {
      if (state.playing) {
        const audio = audioRefs.current[state.id];
        if (audio) {
          setAudioVolume(audio, state.volume, newMasterVolume);
        }
      }
    });
    
    // Update master volume state
    setMasterVolume(newMasterVolume);
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
        playing: false
        // Keep volume values so user settings are preserved
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