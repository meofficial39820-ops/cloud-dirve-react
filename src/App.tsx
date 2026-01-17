import { useState, useEffect } from 'react';
import { Container, Button, Card, Spinner, Form, Alert, Row, Col, InputGroup, Nav, ListGroup } from 'react-bootstrap';
import { supabase } from './supabaseClient';
import { 
  Cloud, Mail, FileText, LogOut, UploadCloud, Trash2, 
  Download, Search, HardDrive, Clock, Star, Grid, List as ListIcon 
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [myFiles, setMyFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'recent'>('all');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getFiles = async () => {
    if (!session) return;
    const { data, error } = await supabase.storage.from('files').list(session.user.id + '/');
    if (!error) setMyFiles(data || []);
  };

  useEffect(() => { if (session) getFiles(); }, [session]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const { error } = await supabase.storage.from('files').upload(`${session.user.id}/${file.name}`, file);
    if (error) alert(error.message);
    else getFiles();
    setUploading(false);
  };

  const downloadFile = async (n: string) => {
    const { data } = await supabase.storage.from('files').createSignedUrl(`${session.user.id}/${n}`, 60);
    if (data) window.open(data.signedUrl, '_blank');
  };

  const deleteFile = async (n: string) => {
    if (confirm("Delete this file permanently?")) {
      await supabase.storage.from('files').remove([`${session.user.id}/${n}`]);
      getFiles();
    }
  };

  const filteredFiles = myFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'recent') {
      const yesterday = new Date().getTime() - (24 * 60 * 60 * 1000);
      return matchesSearch && new Date(file.created_at).getTime() > yesterday;
    }
    return matchesSearch;
  });

  if (loading) return (
    <div className="vh-100 d-flex align-items-center justify-content-center">
      <Spinner animation="grow" variant="primary" />
    </div>
  );

  if (!session) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center bg-light">
        <Card className="p-5 shadow-lg border-0 text-center" style={{ width: '420px', borderRadius: '30px' }}>
          <div className="bg-primary bg-opacity-10 d-inline-flex p-4 rounded-circle mb-4 mx-auto">
            <Cloud size={64} className="text-primary" />
          </div>
          <h2 className="fw-bold">CloudDrive</h2>
          <p className="text-muted mb-4">Your personal space in the cloud</p>
          {message ? <Alert variant="success">{message}</Alert> : (
            <Form onSubmit={handleLogin}>
              <Form.Control type="email" placeholder="Email" className="mb-3 py-3 rounded-3" onChange={(e)=>setEmail(e.target.value)} required />
              <Button variant="primary" type="submit" className="w-100 py-3 fw-bold rounded-3">Get Started</Button>
            </Form>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      {/* Sidebar - Desktop Only */}
      <div className="d-none d-md-flex flex-column p-4 bg-light border-end" style={{ width: '280px' }}>
        <div className="d-flex align-items-center gap-2 mb-5 px-2 text-primary">
          <Cloud size={32} strokeWidth={2.5} />
          <span className="fw-bold fs-4 text-dark">Drive</span>
        </div>
        
        <Button variant="white" className="rounded-pill px-4 py-2 shadow-sm mb-4 d-flex align-items-center gap-2 border" onClick={() => document.getElementById('up')?.click()}>
          <span className="fs-3">+</span> <span className="fw-medium">New</span>
        </Button>
        <input type="file" id="up" className="d-none" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />

        <Nav variant="pills" className="flex-column gap-2">
          <Nav.Link onClick={() => setFilter('all')} className={`rounded-pill d-flex align-items-center gap-3 ${filter === 'all' ? 'bg-primary bg-opacity-10 text-primary' : 'text-dark'}`}>
            <HardDrive size={20} /> My Drive
          </Nav.Link>
          <Nav.Link onClick={() => setFilter('recent')} className={`rounded-pill d-flex align-items-center gap-3 ${filter === 'recent' ? 'bg-primary bg-opacity-10 text-primary' : 'text-dark'}`}>
            <Clock size={20} /> Recent
          </Nav.Link>
        </Nav>
      </div>

      {/* Main Area */}
      <div className="flex-grow-1">
        <header className="p-3 border-bottom d-flex align-items-center justify-content-between px-4">
          <InputGroup style={{ maxWidth: '600px' }}>
            <InputGroup.Text className="bg-light border-0"><Search size={18} /></InputGroup.Text>
            <Form.Control placeholder="Search in Drive" className="bg-light border-0" onChange={(e) => setSearchQuery(e.target.value)} />
          </InputGroup>
          <Button variant="link" onClick={() => supabase.auth.signOut()} className="text-muted"><LogOut size={22}/></Button>
        </header>

        <div className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-normal">{filter === 'all' ? 'My Drive' : 'Recent Files'}</h4>
            <div className="bg-light p-1 rounded d-flex gap-1">
              <Button variant={viewMode === 'list' ? 'white' : 'transparent'} size="sm" onClick={() => setViewMode('list')} className="shadow-sm px-3"><ListIcon size={18}/></Button>
              <Button variant={viewMode === 'grid' ? 'white' : 'transparent'} size="sm" onClick={() => setViewMode('grid')} className="shadow-sm px-3"><Grid size={18}/></Button>
            </div>
          </div>

          {uploading && <Alert variant="info" className="py-2">Uploading file...</Alert>}

          {viewMode === 'grid' ? (
            <Row xs={1} sm={2} lg={4} xl={5} className="g-3">
              {filteredFiles.map(f => (
                <Col key={f.id}>
                  <Card className="h-100 border shadow-sm">
                    <div className="bg-light d-flex justify-content-center align-items-center py-5 border-bottom">
                      <FileText size={48} className="text-primary opacity-50" />
                    </div>
                    <Card.Body className="p-3">
                      <div className="fw-bold text-truncate small">{f.name}</div>
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <small className="text-muted">{(f.metadata.size/1024).toFixed(0)} KB</small>
                        <div className="d-flex gap-2">
                          <Download size={16} className="text-primary cursor-pointer" onClick={() => downloadFile(f.name)}/>
                          <Trash2 size={16} className="text-danger cursor-pointer" onClick={() => deleteFile(f.name)}/>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="border rounded bg-white overflow-auto">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr><th className="ps-4">Name</th><th>Last Modified</th><th className="text-end pe-4">Size</th></tr>
                </thead>
                <tbody>
                  {filteredFiles.map(f => (
                    <tr key={f.id}>
                      <td className="ps-4"><FileText size={18} className="me-2 text-primary" /> {f.name}</td>
                      <td className="small text-muted">{new Date(f.created_at).toLocaleDateString()}</td>
                      <td className="text-end pe-4">
                        <span className="small text-muted me-3">{(f.metadata.size/1024).toFixed(0)} KB</span>
                        <Download size={16} className="me-2" style={{cursor:'pointer'}} onClick={() => downloadFile(f.name)}/>
                        <Trash2 size={16} className="text-danger" style={{cursor:'pointer'}} onClick={() => deleteFile(f.name)}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else setMessage('Check your inbox for the magic link!');
  }
}