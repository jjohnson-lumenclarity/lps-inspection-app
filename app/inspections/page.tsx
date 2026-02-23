// ADD these state vars (after existing useState):
const [showForm, setShowForm] = useState(false);
const [formData, setFormData] = useState({
  title: '',
  address: '',
  description: ''
});

// ADD this function (before return):
const addInspection = async (e: React.FormEvent) => {
  e.preventDefault();
  const supabase = createClient();
  const { error } = await supabase
    .from('projects')
    .insert([formData]);
  if (!error) {
    setShowForm(false);
    fetchProjects(); // Refresh list
  }
};

// REPLACE return (add + button + form):
return (
  <div className="p-8 max-w-6xl mx-auto">
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold text-gray-800">Lighting Inspections</h1>
      <button 
        onClick={() => setShowForm(true)}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold shadow-lg"
      >
        + New Inspection
      </button>
    </div>
    
    {/* NEW INSPECTION FORM */}
    {showForm && (
      <div className="bg-white p-8 rounded-2xl shadow-2xl border max-w-2xl mx-auto mb-8">
        <h2 className="text-2xl font-bold mb-6">New Lighting Inspection</h2>
        <form onSubmit={addInspection} className="space-y-4">
          <input
            type="text"
            placeholder="Building Name"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Full Address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700">
              Save Inspection
            </button>
            <button 
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )}
    
    {/* EXISTING LIST */}
    {projects.length === 0 ? (
      <div className="text-center py-16 text-gray-500 text-xl">
        No inspections yet - click + to add first
      </div>
    ) : (
      // ... your existing grid code
    )}
  </div>
);
