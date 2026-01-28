import { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'drive' | 'trash'>('drive');
  const [trashedFiles, setTrashedFiles] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage.from('files').list('public');
      if (error) throw error;
      setFiles(data || []);
    } catch (err: any) { console.error(err.message); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { error } = await supabase.storage.from('files').upload(`public/${file.name}`, file, { upsert: true });
      if (error) throw error;
      fetchFiles(); 
    } catch (err: any) { alert("Upload failed: " + err.message); }
  };

  // --- NEW: PERMANENT DELETE LOGIC ---
  const handlePermanentDelete = async (fileName: string) => {
    if (!window.confirm("This will permanently remove the file from the Cloud. Continue?")) return;
    try {
      const { error } = await supabase.storage.from('files').remove([`public/${fileName}`]);
      if (error) throw error;
      
      // Update local trash state and refresh list
      setTrashedFiles(prev => prev.filter(n => n !== fileName));
      fetchFiles();
      alert("File permanently deleted.");
    } catch (err: any) {
      alert("Delete failed: Check your 'anon' DELETE policy in Supabase.");
    }
  };

  const handleFileAction = (fileName: string) => {
    if (currentView === 'trash') return;
    const { data } = supabase.storage.from('files').getPublicUrl(`public/${fileName}`);
    if (fileName.match(/\.(jpeg|jpg|png|gif|webp)$/i)) setPreviewUrl(data.publicUrl);
    else window.open(data.publicUrl, '_blank');
  };

  const displayFiles = files.filter(f => {
    const isTrashed = trashedFiles.includes(f.name);
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (currentView === 'drive' ? !isTrashed : isTrashed);
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', height: '100vh', overflow: 'hidden' }}>
      <style>{`
        .sidebar { background: white; border-right: 1px solid #e0e0e0; display: flex; flex-direction: column; padding: 24px 0; }
        .nav-item { padding: 12px 24px; border: none; background: transparent; text-align: left; font-weight: 500; border-radius: 0 30px 30px 0; margin-right: 12px; cursor: pointer; transition: 0.2s; color: #444; }
        .nav-item.active { background: #c2e7ff; color: #001d35; }
        .nav-item:hover:not(.active) { background: #f1f3f4; }
        .main { background: #f8f9fa; padding: 24px; overflow-y: auto; }
        .drive-box { background: white; border-radius: 24px; border: 1px solid #e0e0e0; min-height: 100%; padding: 24px; }
        .preview-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .file-card { padding: 16px; border-radius: 12px; transition: 0.2s; cursor: pointer; position: relative; text-align: center; border: 1px solid transparent; }
        .file-card:hover { background: #edf2fc; border-color: #d3e3fd; }
      `}</style>

      {previewUrl && (
        <div className="preview-overlay" onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} style={{maxHeight:'85%', maxWidth:'85%', borderRadius:'8px'}} alt="Preview" />
        </div>
      )}

      <aside className="sidebar">
        <div className="px-4 mb-5 fw-bold fs-4 text-primary">☁️ CloudDrive</div>
        <div className="px-3 mb-4">
          <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary w-100 py-3 rounded-4 shadow-sm fw-bold border-0">+ New</button>
          <input type="file" ref={fileInputRef} className="d-none" onChange={handleUpload} />
        </div>
        <nav className="flex-grow-1">
          <button onClick={() => setCurrentView('drive')} className={`nav-item w-100 ${currentView === 'drive' ? 'active' : ''}`}>🏠 My Drive</button>
          <button onClick={() => setCurrentView('trash')} className={`nav-item w-100 ${currentView === 'trash' ? 'active' : ''}`}>🗑️ Trash</button>
        </nav>
      </aside>

      <main className="main">
        <div className="drive-box shadow-sm">
          <div className="d-flex justify-content-between mb-4 pb-2 border-bottom align-items-center">
            <h5 className="m-0 fw-bold">{currentView === 'drive' ? 'Global Files' : 'Trash'}</h5>
            <input type="text" className="form-control w-25 rounded-pill bg-light border-0 px-3" placeholder="Search..." onChange={e => setSearchTerm(e.target.value)} />
          </div>

          <div className="row row-cols-2 row-cols-md-4 row-cols-lg-6 g-4">
            {displayFiles.map(file => (
              <div key={file.id} className="col">
                <div className="file-card bg-light" onClick={() => handleFileAction(file.name)}>
                  <div className="position-absolute top-0 end-0 p-1">
                    {currentView === 'drive' ? (
                      <button onClick={(e) => { e.stopPropagation(); setTrashedFiles(p => [...p, file.name]); }} className="btn btn-sm text-muted">✕</button>
                    ) : (
                      <div className="d-flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setTrashedFiles(p => p.filter(n => n !== file.name)); }} className="btn btn-sm text-success">↺</button>
                        <button onClick={(e) => { e.stopPropagation(); handlePermanentDelete(file.name); }} className="btn btn-sm text-danger">✕</button>
                      </div>
                    )}
                  </div>
                  <div className="fs-1">{file.name.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? '🖼️' : '📄'}</div>
                  <div className="small fw-bold text-truncate px-2">{file.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;