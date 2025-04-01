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
  
  // Refs for audio elements and audio context
  const audioRefs = useRef({});
  const audioContext = useRef(null);
  const gainNodes = useRef({});
  const sourceNodes = useRef({});
  const audioInitialized = useRef(false);

  // Initialize Web Audio API for better iOS compatibility
  const initializeAudio = () => {
    if (audioInitialized.current) return;
    
    try {
      // Create audio context (works better on iOS than direct Audio elements)
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // For each sound, create a gain node and connect it
      soundOptions.forEach(sound => {
        if (sound.active && sound.file) {
          // Create audio element
          const audio = new Audio(`/${sound.file}`);
          audio.loop = true;
          audio.crossOrigin = "anonymous";
          audio.preload = "auto";
          
          // Store audio element
          audioRefs.current[sound.id] = audio;
          
          // Create gain node for volume control
          const gainNode = audioContext.current.createGain();
          gainNode.gain.value = 0; // Start with volume at 0
          gainNode.connect(audioContext.current.destination);
          gainNodes.current[sound.id] = gainNode;
          
          // Connect audio element to gain node
          const source = audioContext.current.createMediaElementSource(audio);
          source.connect(gainNode);
          sourceNodes.current[sound.id] = source;
        }
      });
      
      audioInitialized.current = true;
      console.log("Audio system initialized with Web Audio API");
    } catch (error) {
      console.error("Failed to initialize Web Audio API:", error);
    }
  };

  // Set up event listener for first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      initializeAudio();
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };
    
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('click', handleFirstInteraction);
    
    return () => {
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
      
      // Cleanup
      if (audioContext.current && audioContext.current.state !== 'closed') {
        Object.values(audioRefs.current).forEach(audio => {
          if (audio && audio.pause) {
            audio.pause();
          }
        });
        
        // Close audio context
        audioContext.current.close().catch(e => console.error("Error closing AudioContext:", e));
      }
    };
  }, []);

  // Set volume using gain node (iOS compatible)
  const setGainNodeVolume = (id, volumePercent) => {
    if (!audioInitialized.current) return;
    
    try {
      const gainNode = gainNodes.current[id];
      if (gainNode) {
        // Apply individual and master volume (0-1 scale)
        const volume = (volumePercent / 100) * (masterVolume / 100);
        gainNode.gain.value = volume;
        console.log(`Set ${id} gain to ${volume} (${volumePercent}% × ${masterVolume}%)`);
      }
    } catch (error) {
      console.error(`Error setting gain for ${id}:`, error);
    }
  };

  // Handle sound button click (toggle on/off)
  const toggleSound = (id) => {
    if (!audioInitialized.current) {
      initializeAudio();
    }
    
    setSoundStates(prevStates => 
      prevStates.map(state => {
        if (state.id === id) {
          const audio = audioRefs.current[id];
          if (!audio) return state;
          
          // If not playing, start at 20% volume
          if (!state.playing) {
            // First play the audio
            audio.currentTime = 0;
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
              playPromise.catch(e => console.error("Error playing audio:", e));
            }
            
            // Then set volume using gain node
            setGainNodeVolume(id, 20);
            
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
            setGainNodeVolume(id, 0);
            
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
    if (!audioInitialized.current) {
      initializeAudio();
    }
    
    setSoundStates(prevStates => 
      prevStates.map(state => {
        if (state.id === id) {
          const audio = audioRefs.current[id];
          
          if (audio) {
            // Set volume using gain node (works on iOS)
            setGainNodeVolume(id, newVolume);
            
            // Handle play/pause state
            if (newVolume > 0 && !state.playing) {
              // Start playing if moving from zero volume
              audio.currentTime = 0;
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                playPromise.catch(e => console.error("Error playing audio:", e));
              }
              
              return {
                ...state,
                volume: newVolume,
                playing: true
              };
            } else if (newVolume === 0 && state.playing) {
              // Stop playing if moving to zero volume
              audio.pause();
              return {
                ...state,
                volume: 0,
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
    
    if (!audioInitialized.current) return;
    
    // Apply new master volume to all playing sounds using gain nodes
    soundStates.forEach(state => {
      if (state.playing) {
        setGainNodeVolume(state.id, state.volume);
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
    
    // Set all gain nodes to 0
    Object.keys(gainNodes.current).forEach(id => {
      if (gainNodes.current[id]) {
        gainNodes.current[id].gain.value = 0;
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
              
              {/* Volume slider visualization */}
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-600'}`}
                  style={{ width: `${volume}%` }}
                ></div>
              </div>
              
              {/* iOS compatible input slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(sound.id, parseInt(e.target.value))}
                className="w-full mt-1 h-1 appearance-none bg-transparent cursor-pointer"
                style={{
                  WebkitAppearance: 'slider-horizontal',
                  accentColor: '#3B82F6'
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
          
          {/* iOS compatible master volume slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => handleMasterVolumeChange(parseInt(e.target.value))}
            className="w-full mt-1 h-1 appearance-none bg-transparent cursor-pointer"
            style={{
              WebkitAppearance: 'slider-horizontal',
              accentColor: '#3B82F6'
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