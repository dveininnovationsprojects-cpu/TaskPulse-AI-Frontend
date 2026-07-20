import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, ChevronDown } from 'lucide-react';
import api from '../services/api';
import './EmployeesManagement.css';

const EmployeesManagement = ({ role }) => {
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    userId: '', // Required for create
    department: '',
    skills: '',
    capacityHours: '',
    reportingManagerId: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ action: '', title: '', message: '', payload: null });

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const managerDropdownRef = useRef(null);

  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    fetchData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (managerDropdownRef.current && !managerDropdownRef.current.contains(event.target)) {
        setIsManagerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [empRes, userRes] = await Promise.all([
        api.get('/api/employees').catch(() => ({ data: [] })),
        api.get('/api/users').catch(() => ({ data: [] }))
      ]);
      setEmployees(empRes.data || []);
      setUsers(userRes.data || []);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Pending users are those who do not have an employee profile yet AND are not ADMIN.
  const pendingUsers = users.filter(u => u.role !== 'ADMIN' && !employees.some(e => e.userId === u.id));
  const pendingUsersCount = pendingUsers.length;
  
  // Managers are existing employees who hold the PROJECT_MANAGER role in the system.
  const managers = employees.filter(emp => {
    const u = users.find(user => user.id === emp.userId);
    return u && u.role === 'PROJECT_MANAGER';
  });

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (mode, employee = null) => {
    setModalMode(mode);
    setFormError('');
    if (mode === 'edit' && employee) {
      setCurrentEmployeeId(employee.employeeId);
      setFormData({
        userId: employee.userId, // Won't be editable in PUT, but good to have in state
        department: employee.department || '',
        skills: employee.skills || '',
        capacityHours: employee.capacityHours || '',
        reportingManagerId: employee.reportingManagerId || ''
      });
    } else {
      setCurrentEmployeeId(null);
      setFormData({
        userId: '',
        department: '',
        skills: '',
        capacityHours: '',
        reportingManagerId: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (modalMode === 'create' && !formData.userId) {
       setFormError('User ID is required');
       return;
    }

    setConfirmConfig({
      action: modalMode,
      title: modalMode === 'create' ? 'Confirm Add Employee' : 'Confirm Update Employee',
      message: modalMode === 'create' ? 'Are you sure you want to add this employee?' : 'Are you sure you want to update this employee details?',
      payload: { ...formData }
    });
    setShowConfirmModal(true);
  };

  const handleDeleteClick = (emp) => {
    setConfirmConfig({
      action: 'delete',
      title: 'Confirm Delete Employee',
      message: `Are you sure you want to completely delete ${emp.name}? This will also permanently delete their user account from the system.`,
      payload: emp
    });
    setShowConfirmModal(true);
  };

  const executeConfirmAction = async () => {
    setFormError('');
    setIsSubmitting(true);
    
    try {
      const { action, payload } = confirmConfig;
      
      if (action === 'create' || action === 'edit') {
        const data = {
          department: payload.department,
          skills: payload.skills,
          capacityHours: payload.capacityHours ? parseFloat(payload.capacityHours) : null,
          reportingManagerId: payload.reportingManagerId ? parseInt(payload.reportingManagerId, 10) : null
        };
        
        if (action === 'create') {
          data.userId = parseInt(payload.userId, 10);
          await api.post('/api/employees', data);
        } else {
          await api.put(`/api/employees/${currentEmployeeId}`, data);
        }
        
        await fetchData();
        handleCloseModal();
      } else if (action === 'delete') {
        // Delete employee first
        await api.delete(`/api/employees/${payload.employeeId}`);
        // Then delete the user completely so they don't show up again
        await api.delete(`/api/users/${payload.userId}`);
        await fetchData();
      }
      
      setShowConfirmModal(false);
    } catch (err) {
      if (confirmConfig.action === 'delete') {
        alert('Failed to delete: ' + (err.response?.data?.message || err.message));
      } else {
        setFormError(err.response?.data?.message || err.message || 'Failed to process request.');
        setShowConfirmModal(false); // Close confirm modal to show error on main modal
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = employees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(employees.length / itemsPerPage);
  const displayTotalPages = totalPages || 1;

  const getPaginationNumbers = () => {
    const pageNumbers = [];
    if (displayTotalPages <= 5) {
      for (let i = 1; i <= displayTotalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pageNumbers.push(1, 2, 3, 4, '...', displayTotalPages);
      } else if (currentPage >= displayTotalPages - 2) {
        pageNumbers.push(1, '...', displayTotalPages - 3, displayTotalPages - 2, displayTotalPages - 1, displayTotalPages);
      } else {
        pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', displayTotalPages);
      }
    }
    return pageNumbers;
  };

  return (
    <div className="module-container">
      <div className="module-header">
        <h2 className="module-title">Employee Directory</h2>
        {isAdmin && (
          <div className="add-btn-wrapper">
            <button 
              className="btn-pill" 
              style={{ marginTop: 0, padding: '10px 24px' }}
              onClick={() => handleOpenModal('create')}
            >
              <Plus size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
              Add Employee
            </button>
            {pendingUsersCount > 0 && (
              <span className="badge">{pendingUsersCount}</span>
            )}
          </div>
        )}
      </div>

      <div className="module-content">
        {error && <div className="error-message">{error}</div>}
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#11b1c6' }}>Loading employees...</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Skills</th>
                  <th>Capacity (Hrs)</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {currentEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '30px' }}>
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  currentEmployees.map(emp => (
                    <tr key={emp.employeeId}>
                      <td style={{ fontWeight: 600 }}>{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.department || '-'}</td>
                      <td>{emp.skills || '-'}</td>
                      <td>{emp.capacityHours || '-'}</td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="action-btn edit-btn" 
                            title="Edit"
                            onClick={() => handleOpenModal('edit', emp)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            title="Delete"
                            onClick={() => handleDeleteClick(emp)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && (
          <div className="pagination-container">
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            {getPaginationNumbers().map((num, idx) => (
              <button
                key={idx}
                className={`pagination-btn ${num === currentPage ? 'active' : ''} ${num === '...' ? 'dots' : ''}`}
                onClick={() => num !== '...' && setCurrentPage(num)}
                disabled={num === '...'}
              >
                {num}
              </button>
            ))}
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, displayTotalPages))}
              disabled={currentPage === displayTotalPages}
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-bg-glass"></div>
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Add New Employee' : 'Edit Employee'}</h3>
              <button className="modal-close" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              {formError && <div className="error-message" style={{ padding: '8px 12px', marginBottom: '16px' }}>{formError}</div>}
              
              {modalMode === 'create' ? (
                <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
                  <label>Select Pending User *</label>
                  <div 
                    className="form-control" 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    <span style={{ color: formData.userId ? '#0c5965' : '#89c4d1' }}>
                      {formData.userId 
                        ? pendingUsers.find(u => u.id.toString() === formData.userId.toString())?.name + ' (' + pendingUsers.find(u => u.id.toString() === formData.userId.toString())?.email + ')' 
                        : 'Select a user to assign...'}
                    </span>
                    <ChevronDown 
                      size={20} 
                      color="#11b1c6" 
                      style={{ 
                        transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.25s ease' 
                      }} 
                    />
                  </div>
                  
                  {isDropdownOpen && (
                    <div 
                      className="custom-select-options"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(17, 177, 198, 0.2)',
                        borderRadius: '12px',
                        boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)',
                        zIndex: 100,
                        overflowY: 'auto',
                        maxHeight: '150px',
                        marginTop: '4px',
                        padding: '4px 0'
                      }}
                    >
                      {pendingUsers.length === 0 ? (
                        <div style={{ padding: '8px 16px', color: '#64748b', fontSize: '0.9rem' }}>No pending users available.</div>
                      ) : (
                        pendingUsers.map(user => (
                          <div
                            key={user.id}
                            className="custom-select-option"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, userId: user.id.toString() }));
                              setIsDropdownOpen(false);
                            }}
                            style={{
                              padding: '10px 16px',
                              cursor: 'pointer',
                              color: formData.userId === user.id.toString() ? '#34c3d3' : '#0c5965',
                              fontWeight: formData.userId === user.id.toString() ? '600' : '500',
                              backgroundColor: formData.userId === user.id.toString() ? 'rgba(52, 195, 211, 0.08)' : 'transparent',
                              transition: 'all 0.15s ease',
                              fontSize: '0.9rem'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = 'rgba(52, 195, 211, 0.08)';
                              e.target.style.color = '#34c3d3';
                            }}
                            onMouseLeave={(e) => {
                              if (formData.userId !== user.id.toString()) {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#0c5965';
                              }
                            }}
                          >
                            {user.name} <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '4px' }}>({user.email})</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  <small style={{ color: '#89c4d1', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                    Select a registered user to create their employee profile.
                  </small>
                </div>
              ) : (
                <div className="form-group">
                  <label>User Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={employees.find(e => e.employeeId === currentEmployeeId)?.name || 'Unknown User'}
                    disabled
                    style={{ background: 'rgba(241, 245, 249, 0.8)', color: '#475569', opacity: 1, cursor: 'not-allowed', borderColor: 'rgba(17, 177, 198, 0.1)' }}
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  className="form-control"
                  placeholder="e.g. Engineering, Sales"
                  value={formData.department}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Skills</label>
                <input
                  type="text"
                  name="skills"
                  className="form-control"
                  placeholder="e.g. Java, React, SQL"
                  value={formData.skills}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Capacity (Hours/Sprint)</label>
                  <input
                    type="number"
                    step="0.5"
                    name="capacityHours"
                    className="form-control"
                    placeholder="e.g. 80"
                    value={formData.capacityHours}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, position: 'relative' }} ref={managerDropdownRef}>
                  <label>Reporting Manager</label>
                  <div 
                    className="form-control" 
                    onClick={() => setIsManagerDropdownOpen(!isManagerDropdownOpen)}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    <span style={{ color: formData.reportingManagerId ? '#0c5965' : '#89c4d1' }}>
                      {formData.reportingManagerId 
                        ? managers.find(m => m.employeeId.toString() === formData.reportingManagerId.toString())?.name || 'Unknown'
                        : "Select manager..."}
                    </span>
                    <ChevronDown 
                      size={20} 
                      color="#11b1c6" 
                      style={{ 
                        transform: isManagerDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.25s ease' 
                      }} 
                    />
                  </div>
                  
                  {isManagerDropdownOpen && (
                    <div 
                      className="custom-select-options"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(17, 177, 198, 0.2)',
                        borderRadius: '12px',
                        boxShadow: '0 12px 30px rgba(17, 177, 198, 0.16)',
                        zIndex: 100,
                        overflowY: 'auto',
                        maxHeight: '150px',
                        marginTop: '4px',
                        padding: '4px 0'
                      }}
                    >
                      {managers.length === 0 ? (
                        <div style={{ padding: '8px 16px', color: '#64748b', fontSize: '0.9rem' }}>No managers available.</div>
                      ) : (
                        managers.map(mgr => (
                          <div
                            key={mgr.employeeId}
                            className="custom-select-option"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, reportingManagerId: mgr.employeeId.toString() }));
                              setIsManagerDropdownOpen(false);
                            }}
                            style={{
                              padding: '10px 16px',
                              cursor: 'pointer',
                              color: formData.reportingManagerId === mgr.employeeId.toString() ? '#34c3d3' : '#0c5965',
                              fontWeight: formData.reportingManagerId === mgr.employeeId.toString() ? '600' : '500',
                              backgroundColor: formData.reportingManagerId === mgr.employeeId.toString() ? 'rgba(52, 195, 211, 0.08)' : 'transparent',
                              transition: 'all 0.15s ease',
                              fontSize: '0.9rem'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = 'rgba(52, 195, 211, 0.08)';
                              e.target.style.color = '#34c3d3';
                            }}
                            onMouseLeave={(e) => {
                              if (formData.reportingManagerId !== mgr.employeeId.toString()) {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = '#0c5965';
                              }
                            }}
                          >
                            {mgr.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-pill" style={{ background: '#cbd5e1', color: '#334155', boxShadow: 'none' }} onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-pill" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Modal */}
      {showConfirmModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px 30px' }}>
            <div className="modal-bg-glass"></div>
            <h3 style={{ color: '#0c5965', marginBottom: '16px', fontSize: '1.4rem', position: 'relative', zIndex: 2 }}>
              {confirmConfig.title}
            </h3>
            <p style={{ color: '#475569', marginBottom: '30px', lineHeight: '1.5', position: 'relative', zIndex: 2 }}>
              {confirmConfig.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
              <button 
                className="btn-pill" 
                style={{ background: '#e2e8f0', color: '#475569', boxShadow: 'none' }}
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                No, Cancel
              </button>
              <button 
                className="btn-pill" 
                style={{ background: confirmConfig.action === 'delete' ? '#ef4444' : '#11b1c6' }}
                onClick={executeConfirmAction}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EmployeesManagement;
