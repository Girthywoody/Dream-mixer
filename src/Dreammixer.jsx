import React, { useState, useEffect, useRef } from 'react';
import { Wind, Droplet, Flame, Leaf, Fan, Waves, Plus } from 'lucide-react';

const SleepSoundMixer = () => {
  // List of available sounds with professional icons from lucide-react
  const soundOptions = [
    { id: 'fire', name: 'Fire', icon: <Flame size={36} />, file: 'fire.mp3', category: 'elements', active: true },
    { id: 'rain', name: 'Rain', icon: <Droplet size={36} />, file: 'rain.mp3', category: 'weather', active: true },
    { id: 'whitenoise', name: 'White Noise', icon: <Fan size={36} />, file: 'white-noise.mp3', category: 'ambient', active: true },
    { id: 'river', name: 'River', icon: <Waves size={36} />, file: 'river.mp3', category: 'nature', active: true },
    { id: 'nature', name: 'Nature', icon: <Leaf size={36} />, file: 'nature.mp3', category: 'nature', active: true },
    { id: 'wind', name: 'Wind', icon: <Wind size={36} />, file: 'wind.mp3', category: 'weather', active: true },
    { id: 'empty1', name: 'Empty', icon: <Plus size={36} />, category: 'empty', active: false },
    { id: 'empty2', name: 'Empty', icon: <Plus size={36} />, category: 'empty', active: false },
    { id: 'empty3', name: 'Empty', icon: <Plus size={36} />, category: 'empty', active: false }
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
      const audio = new Audio();
      audio.loop = true;
      audio.volume = 0;
      
      // Store audio element in refs
      audioRefs.current[sound.id] = audio;
    });

    // Cleanup function to stop all sounds when component unmounts
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
      });
    };
  }, []);

  // Handle sound button click (toggle on/off)
  const toggleSound = (id) => {
    setSoundStates(prevStates => 
      prevStates.map(state => {
        if (state.id === id) {
          const audio = audioRefs.current[id];
          // If not playing, start at 20% volume
          if (!state.playing) {
            audio.volume = 0.2;
            audio.play().catch(e => console.error("Error playing audio:", e));
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
            // Set volume (convert from 0-100 to 0-1) and apply master volume
            audio.volume = (newVolume / 100) * (masterVolume / 100);
            
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
    soundStates.forEach(state => {
      if (state.playing) {
        const audio = audioRefs.current[state.id];
        if (audio) {
          audio.volume = (state.volume / 100) * (newMasterVolume / 100);
        }
      }
    });
  };
  
  // Turn off all sounds
  const turnOffAllSounds = () => {
    // Pause all audio elements
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
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
    <div className="w-full min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 text-white p-6 flex flex-col">
      {/* App Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Dream Mixer
        </h1>
        <p className="text-blue-300 mt-1">Craft your perfect sleep soundscape</p>
      </div>
      
      {/* Active sound counter */}
      <div className="text-center mb-6">
        <div className="inline-block px-4 py-2 rounded-full bg-opacity-20 bg-blue-500 backdrop-blur-md">
          <span className="text-sm text-blue-300">Active Sounds: </span>
          <span className="text-lg font-semibold">{activeSounds}</span>
        </div>
      </div>

      {/* Grid of sound buttons */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {soundOptions.map(sound => {
          const state = soundStates.find(s => s.id === sound.id);
          const isActive = state?.playing;
          const volume = state?.volume || 0;
          
          return (
            <div key={sound.id} className="flex flex-col items-center">
              <button
                onClick={() => sound.active ? toggleSound(sound.id) : null}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl transition-all duration-300 shadow-lg ${
                  isActive 
                    ? 'bg-gradient-to-br from-blue-400 to-purple-500 shadow-blue-500/50' 
                    : sound.active 
                      ? 'bg-gray-800/50 backdrop-blur-md hover:bg-gray-700/50'
                      : 'bg-gray-900/30 text-gray-600 cursor-default'
                }`}
                style={{
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isActive ? '0 0 20px rgba(59, 130, 246, 0.6)' : 'none'
                }}
              >
                <span>{sound.icon}</span>
              </button>
              
              <div className="text-center mt-3 mb-1">
                <span className={`font-medium ${
                  isActive 
                    ? 'text-blue-300' 
                    : sound.active 
                      ? 'text-gray-300' 
                      : 'text-gray-600'
                }`}>
                  {sound.name}
                </span>
              </div>
              
              {/* Volume indicator and slider */}
              <div className={`w-full transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                      style={{ width: `${volume}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(sound.id, parseInt(e.target.value))}
                  className="w-full h-1 mt-2 appearance-none bg-transparent cursor-pointer"
                  style={{
                    // Custom styling for the slider
                    WebkitAppearance: 'none',
                    background: 'transparent',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Master Volume Control */}
      <div className="mt-auto">
        <div className="bg-gray-800/30 backdrop-blur-md rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300">Master Volume</span>
            <span className="text-sm text-gray-400">{masterVolume}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              style={{ width: `${masterVolume}%` }}
            ></div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => handleMasterVolumeChange(parseInt(e.target.value))}
            className="w-full h-1 mt-2 appearance-none bg-transparent cursor-pointer"
          />
          
          {/* Control Buttons */}
          <div className="flex justify-between mt-6">
            <button 
              onClick={turnOffAllSounds}
              className="px-4 py-2 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-sm backdrop-blur-md transition-colors"
            >
              Turn Off All Sounds
            </button>
            <button className="px-4 py-2 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-sm backdrop-blur-md transition-colors">
              Sleep Timer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SleepSoundMixer;