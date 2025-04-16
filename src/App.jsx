import { useState } from 'react';

// Sample wine data - you would replace this with your actual wine inventory
const wines = [
  // White Wines
  {
    name: "Chardonnay, Sonoma Coast",
    type: "white",
    sweetness: "Dry",
    acidity: "Medium",
    body: "Medium to Full",
    region: "California",
    pairings: "Chicken, Lobster, Creamy Pasta",
    description: "Crisp apple and pear flavors with subtle oak and vanilla notes. Rich mouthfeel with balanced acidity."
  },
  {
    name: "Sauvignon Blanc, Marlborough",
    type: "white",
    sweetness: "Dry",
    acidity: "High",
    body: "Light to Medium",
    region: "New Zealand",
    pairings: "Seafood, Salads, Goat Cheese",
    description: "Vibrant citrus and tropical fruit notes with grassy undertones. Crisp and refreshing."
  },
  {
    name: "Riesling, Mosel",
    type: "white",
    sweetness: "Off-Dry",
    acidity: "High",
    body: "Light",
    region: "Germany",
    pairings: "Spicy Foods, Pork, Asian Cuisine",
    description: "Delicate peach and apricot notes with hints of honey. Balanced sweetness with mineral backbone."
  },
  // Red Wines
  {
    name: "Cabernet Sauvignon, Napa Valley",
    type: "red",
    sweetness: "Dry",
    acidity: "Medium",
    body: "Full",
    region: "California",
    pairings: "Ribeye, NY Strip, Lamb",
    description: "Bold black currant and cherry flavors with notes of cedar and spice. Firm tannins with a long finish."
  },
  {
    name: "Pinot Noir, Willamette Valley",
    type: "red",
    sweetness: "Dry",
    acidity: "Medium-High",
    body: "Light to Medium",
    region: "Oregon",
    pairings: "Filet Mignon, Pork, Duck",
    description: "Elegant red cherry and raspberry flavors with earthy undertones. Silky texture with subtle tannins."
  },
  {
    name: "Malbec, Mendoza",
    type: "red",
    sweetness: "Dry",
    acidity: "Medium",
    body: "Medium to Full",
    region: "Argentina",
    pairings: "Skirt Steak, Flank Steak, BBQ",
    description: "Ripe plum and blackberry flavors with hints of chocolate and violet. Smooth tannins with a velvety finish."
  },
  {
    name: "Syrah, Rhône Valley",
    type: "red",
    sweetness: "Dry",
    acidity: "Medium",
    body: "Full",
    region: "France",
    pairings: "Ribeye, Game Meats, Aged Cheeses",
    description: "Dark berry and pepper notes with smoky, meaty undertones. Bold and full-bodied with firm tannins."
  }
];

const WineCheatSheet = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Filter wines based on search term and active tab
  const filteredWines = wines.filter(wine => {
    const matchesSearch = wine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wine.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wine.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && wine.type === activeTab;
  });

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen pb-8">
      <header className="bg-red-900 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">Steak House Wine Guide</h1>
      </header>
      
      <div className="p-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search wines..."
            className="w-full p-2 border border-gray-300 rounded shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex mb-4 border-b">
          <button
            className={`flex-1 py-2 font-medium ${activeTab === 'all' ? 'text-red-900 border-b-2 border-red-900' : 'text-gray-600'}`}
            onClick={() => setActiveTab('all')}
          >
            All Wines
          </button>
          <button
            className={`flex-1 py-2 font-medium ${activeTab === 'red' ? 'text-red-900 border-b-2 border-red-900' : 'text-gray-600'}`}
            onClick={() => setActiveTab('red')}
          >
            Red
          </button>
          <button
            className={`flex-1 py-2 font-medium ${activeTab === 'white' ? 'text-red-900 border-b-2 border-red-900' : 'text-gray-600'}`}
            onClick={() => setActiveTab('white')}
          >
            White
          </button>
        </div>
        
        <div className="space-y-4">
          {filteredWines.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No wines found. Try a different search.</p>
          ) : (
            filteredWines.map((wine, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg shadow-md ${wine.type === 'red' ? 'bg-red-50' : 'bg-yellow-50'}`}
              >
                <h2 className="text-lg font-bold">{wine.name}</h2>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {wine.type === 'red' ? 'Red' : 'White'}
                  </div>
                  <div>
                    <span className="font-medium">Sweetness:</span> {wine.sweetness}
                  </div>
                  <div>
                    <span className="font-medium">Acidity:</span> {wine.acidity}
                  </div>
                  <div>
                    <span className="font-medium">Body:</span> {wine.body}
                  </div>
                  <div>
                    <span className="font-medium">Region:</span> {wine.region}
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Pairs with:</span> {wine.pairings}
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Description:</span> {wine.description}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WineCheatSheet;