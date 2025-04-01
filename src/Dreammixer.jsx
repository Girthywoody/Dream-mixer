import React, { useState, useEffect, useRef } from 'react';
import { Wind, Droplet, Flame, Leaf, Fan, Waves, Plus } from 'lucide-react';

const SleepSoundMixer = () => {
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

  // Initialize audio elements
  useEffect(() => {
    soundOptions.forEach(sound => {
      if (sound.active && sound.file) {
        try {
          const audio = new Audio(`/${sound.file}`);
          audio.loop = true;
          audio.volume = 0;
          
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

  // Update actual audio volume based on individual and master volume
  const updateAudioVolume = (id, individualVolume) => {
    const audio = audioRefs.current[id];
    if (audio) {
      // Set precise volume (convert from 0-100 to 0-1) and apply master volume
      audio.volume = (individualVolume / 100) * (masterVolume / 100);
      return true;
    }
    return false;
  };

  // Handle sound button click (toggle on/off)
  const toggleSound = (id) => {
    setSoundStates(prevStates => 
      prevStates.map(state => {
        if (state.id === id) {
          const audio = audioRefs.current[id];
          if (!audio) return state;
          
          // If not playing, use current volume slider value (or default to 20%)
          if (!state.playing) {
            // Use current volume value if it's above 0, otherwise set to 20%
            const newVolume = state.volume > 0 ? state.volume : 20;
            
            // Set the audio volume according to the slider and master volume
            updateAudioVolume(id, newVolume);
            
            // Start playing
            audio.play().catch(e => console.error("Error playing audio:", e));
            
            return {
              ...state,
              volume: newVolume,
              playing: true
            };
          } 
          // If already playing, stop and keep volume at current value for when user plays again
          else {
            audio.pause();
            audio.currentTime = 0;
            return {
              ...state,
              playing: false
              // Keep volume at current value for when user plays again
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
          const isPlaying = newVolume > 0;
          const audio = audioRefs.current[id];
          
          // Update physical audio volume if element exists
          if (audio) {
            // If volume is changing from 0 to some value, we need to start playing
            if (newVolume > 0 && !state.playing) {
              updateAudioVolume(id, newVolume);
              audio.play().catch(e => console.error("Error playing audio:", e));
            } 
            // If volume is changing to 0, pause the audio
            else if (newVolume === 0 && state.playing) {
              audio.pause();
            }
            // Otherwise just update the volume
            else if (state.playing) {
              updateAudioVolume(id, newVolume);
            }
          }
          
          return {
            ...state,
            volume: newVolume,
            playing: isPlaying
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
    soundStates.forEach(state => {
      if (state.playing) {
        updateAudioVolume(state.id, state.volume);
      }
    });
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
    
    // Update all states to not playing, but maintain their volume settings
    setSoundStates(prevStates => 
      prevStates.map(state => ({
        ...state,
        playing: false
        // Keep the volume value so when toggled back on it uses the same value
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

export default SleepSoundMixer;