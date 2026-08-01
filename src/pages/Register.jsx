import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DEVELOPER',
    projectId: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const [projects, setProjects] = useState([]);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const projectDropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setIsProjectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (formData.role === 'CLIENT_VIEWER') {
      api.get('/api/public/projects')
        .then(res => setProjects(res.data || []))
        .catch(err => console.error("Could not fetch public projects for client registration:", err));
    }
  }, [formData.role]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (formData.role === 'CLIENT_VIEWER' && !formData.projectId) {
      setError('Please select a project to associate with your Client Viewer account.');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'CLIENT_VIEWER' && { projectId: parseInt(formData.projectId, 10) })
      };

      if (formData.role === 'CLIENT_VIEWER' && formData.projectId) {
        localStorage.setItem('registeredProjectId', formData.projectId.toString());
      }

      await api.post('/api/auth/register', payload);
      setSuccess('Registration successful! Waiting for admin approval...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'PROJECT_MANAGER', label: 'Project Manager' },
    { value: 'TEAM_LEAD', label: 'Team Lead' },
    { value: 'DEVELOPER', label: 'Developer' },
    { value: 'DATA_ANALYST', label: 'Data Analyst' },
    { value: 'CLIENT_VIEWER', label: 'Client Viewer' }
  ];

  return (
    <div className="page-wrapper">
      <div className="bg-elements">
        <div className="ribbon-container-left">
          <div className="ribbon-bar bar-1"></div>
          <div className="ribbon-bar bar-2"></div>
          <div className="ribbon-bar bar-3"></div>
          <div className="ribbon-bar bar-4"></div>
        </div>
        <svg className="background-svg" viewBox="0 0 1440 1024" preserveAspectRatio="none">
          <defs>
            <filter id="wave-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="10" dy="10" stdDeviation="20" floodColor="#11b1c6" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* Back Wave (Cyan Translucent Ribbon) */}
          <path d="M 280,0 C 410,180 510,300 380,550 C 250,800 330,920 510,1024 L 130, 1024 C 280,900 210,800 80,550 C -20,300 110,150 80,0 Z" fill="rgba(141, 227, 242, 0.4)" />

          {/* Front Wave (White Ribbon) */}
          <path d="M 250,0 C 380,180 480,300 350,550 C 220,800 300,920 480,1024 L 100,1024 C 250,900 180,800 50,550 C -50,300 80,150 50,0 Z" fill="#ffffff" filter="url(#wave-shadow)" />
        </svg>
        <div className="ribbon-container-right">
          <div className="ribbon-bar bar-r1"></div>
          <div className="ribbon-bar bar-r2"></div>
          <div className="ribbon-bar bar-r3"></div>
        </div>
      </div>

      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-dot"></div>
          TaskPulse AI
        </div>
      </header>

      <main className="content-wrapper">
        <div className="auth-section">
          <div className="auth-title" style={{ marginBottom: '16px' }}>
            <span className="light">CREATE</span>
            <span className="bold">ACCOUNT</span>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="error-message" style={{ backgroundColor: 'rgba(220, 252, 231, 0.8)', color: '#166534', borderColor: '#bbf7d0' }}>{success}</div>}
          
          <form onSubmit={handleRegister}>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '15px', position: 'relative' }}>
               <input
                 id="password"
                 name="password"
                 type={showPassword ? 'text' : 'password'}
                 className="form-control"
                 placeholder="Password"
                 value={formData.password}
                 onChange={handleChange}
                 required
                 style={{ paddingRight: '50px' }}
               />
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 style={{
                   position: 'absolute',
                   right: '20px',
                   top: '50%',
                   transform: 'translateY(-50%)',
                   background: 'none',
                   border: 'none',
                   cursor: 'pointer',
                   color: '#11b1c6',
                   display: 'flex',
                   alignItems: 'center',
                   padding: 0
                 }}
               >
                 {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
               </button>
             </div>
            
            <div className="form-group" style={{ marginBottom: '15px', position: 'relative' }} ref={dropdownRef}>
               <div 
                 className="form-control" 
                 onClick={() => setIsOpen(!isOpen)}
                 style={{ 
                   display: 'flex', 
                   justifyContent: 'space-between', 
                   alignItems: 'center', 
                   cursor: 'pointer',
                   height: '56px',
                   padding: '15px 24px',
                   lineHeight: '1.2'
                 }}
               >
                 <span style={{ color: formData.role ? '#0c5965' : '#89c4d1', fontWeight: formData.role ? '500' : '400' }}>
                   {roles.find(r => r.value === formData.role)?.label || 'Select a role...'}
                 </span>
                 <svg 
                   fill='#11b1c6' 
                   height='24' 
                   viewBox='0 0 24 24' 
                   width='24' 
                   xmlns='http://www.w3.org/2000/svg'
                   style={{ 
                     transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                     transition: 'transform 0.25s ease' 
                   }}
                 >
                   <path d='M7 10l5 5 5-5z'/>
                   <path d='M0 0h24v24H0z' fill='none'/>
                 </svg>
               </div>

               {isOpen && (
                 <div 
                   className="custom-select-options"
                   style={{
                     position: 'absolute',
                     top: '100%',
                     left: 0,
                     right: 0,
                     backgroundColor: 'rgba(255, 255, 255, 0.98)',
                     backdropFilter: 'blur(12px)',
                     border: '1px solid rgba(17, 177, 198, 0.2)',
                     borderRadius: '20px',
                     boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)',
                     zIndex: 100,
                     overflowY: 'auto',
                     maxHeight: '115px',
                     marginTop: '4px',
                     padding: '4px 0'
                   }}
                 >
                   {roles.map(r => (
                     <div
                       key={r.value}
                       className="custom-select-option"
                       onClick={() => {
                         setFormData({ ...formData, role: r.value });
                         setIsOpen(false);
                       }}
                       style={{
                         padding: '8px 20px',
                         cursor: 'pointer',
                         color: formData.role === r.value ? '#34c3d3' : '#11b1c6',
                         fontWeight: formData.role === r.value ? '600' : '500',
                         backgroundColor: formData.role === r.value ? 'rgba(52, 195, 211, 0.08)' : 'transparent',
                         transition: 'all 0.15s ease',
                         fontFamily: 'inherit',
                         fontSize: '0.85rem'
                       }}
                       onMouseEnter={(e) => {
                         e.target.style.backgroundColor = 'rgba(52, 195, 211, 0.08)';
                         e.target.style.color = '#34c3d3';
                       }}
                       onMouseLeave={(e) => {
                         if (formData.role !== r.value) {
                           e.target.style.backgroundColor = 'transparent';
                           e.target.style.color = '#11b1c6';
                         }
                       }}
                     >
                       {r.label}
                     </div>
                   ))}
                 </div>
               )}
             </div>

             {formData.role === 'CLIENT_VIEWER' && (
               <div className="form-group" style={{ marginBottom: '15px', position: 'relative' }} ref={projectDropdownRef}>
                 <div 
                   className="form-control" 
                   onClick={() => setIsProjectOpen(!isProjectOpen)}
                   style={{ 
                     display: 'flex', 
                     justifyContent: 'space-between', 
                     alignItems: 'center', 
                     cursor: 'pointer',
                     height: '56px',
                     padding: '15px 24px',
                     lineHeight: '1.2'
                   }}
                 >
                   <span style={{ color: formData.projectId ? '#0c5965' : '#89c4d1', fontWeight: formData.projectId ? '500' : '400' }}>
                     {formData.projectId 
                       ? (projects.find(p => p.id.toString() === formData.projectId.toString())?.projectName 
                          ? `${projects.find(p => p.id.toString() === formData.projectId.toString())?.projectName} (ID: ${formData.projectId})`
                          : `Assigned Project ID: ${formData.projectId}`)
                       : 'Select Assigned Project...'}
                   </span>
                   <svg 
                     fill='#11b1c6' 
                     height='24' 
                     viewBox='0 0 24 24' 
                     width='24' 
                     xmlns='http://www.w3.org/2000/svg'
                     style={{ 
                       transform: isProjectOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                       transition: 'transform 0.25s ease' 
                     }}
                   >
                     <path d='M7 10l5 5 5-5z'/>
                     <path d='M0 0h24v24H0z' fill='none'/>
                   </svg>
                 </div>
                 
                 {isProjectOpen && (
                   <div 
                     className="custom-select-options"
                     style={{
                       position: 'absolute',
                       top: '100%',
                       left: 0,
                       right: 0,
                       backgroundColor: 'rgba(255, 255, 255, 0.98)',
                       backdropFilter: 'blur(12px)',
                       border: '1px solid rgba(17, 177, 198, 0.2)',
                       borderRadius: '20px',
                       boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)',
                       zIndex: 100,
                       overflowY: 'auto',
                       maxHeight: '150px',
                       marginTop: '4px',
                       padding: '4px 0'
                     }}
                   >
                     {projects.length === 0 ? (
                       <div style={{ padding: '12px 20px', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                         Loading Projects...
                       </div>
                     ) : (
                       projects.map(p => (
                         <div
                           key={p.id}
                           className="custom-select-option"
                           onClick={() => {
                             setFormData({ ...formData, projectId: p.id.toString() });
                             setIsProjectOpen(false);
                           }}
                           style={{
                             padding: '10px 20px',
                             cursor: 'pointer',
                             color: formData.projectId === p.id.toString() ? '#34c3d3' : '#11b1c6',
                             fontWeight: formData.projectId === p.id.toString() ? '600' : '500',
                             backgroundColor: formData.projectId === p.id.toString() ? 'rgba(52, 195, 211, 0.08)' : 'transparent',
                             transition: 'all 0.15s ease',
                             fontFamily: 'inherit',
                             fontSize: '0.85rem'
                           }}
                           onMouseEnter={(e) => {
                             e.target.style.backgroundColor = 'rgba(52, 195, 211, 0.08)';
                             e.target.style.color = '#34c3d3';
                           }}
                           onMouseLeave={(e) => {
                             if (formData.projectId !== p.id.toString()) {
                               e.target.style.backgroundColor = 'transparent';
                               e.target.style.color = '#11b1c6';
                             }
                           }}
                         >
                           {p.projectName} (ID: {p.id})
                         </div>
                       ))
                     )}
                   </div>
                 )}
               </div>
             )}
        
            <button type="submit" className="btn-pill" disabled={isLoading}>
              {isLoading ? 'PLEASE WAIT...' : 'JOIN NOW!'}
            </button>
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Login here</Link>
          </div>
        </div>
      </main>
    </div>
  );
};
export default Register;