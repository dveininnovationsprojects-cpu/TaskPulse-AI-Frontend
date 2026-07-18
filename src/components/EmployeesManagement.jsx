import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../services/api';
import './EmployeesManagement.css';

const EmployeesManagement = ({ role }) => {
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
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

  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    fetchData();
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

  // Pending users are those who do not have an employee profile yet.
  const pendingUsers = users.filter(u => !employees.some(e => e.userId === u.id));
  const pendingUsersCount = pendingUsers.length;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const payload = {
        department: formData.department,
        skills: formData.skills,
        capacityHours: formData.capacityHours ? parseFloat(formData.capacityHours) : null,
        reportingManagerId: formData.reportingManagerId ? parseInt(formData.reportingManagerId, 10) : null
      };

      if (modalMode === 'create') {
        payload.userId = parseInt(formData.userId, 10);
        if (!payload.userId) {
            throw new Error("User ID is required");
        }
        await api.post('/api/employees', payload);
      } else {
        await api.put(`/api/employees/${currentEmployeeId}`, payload);
      }
      
      await fetchEmployees();
      handleCloseModal();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save employee.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/api/employees/${id}`);
        await fetchEmployees();
      } catch (err) {
        alert('Failed to delete employee: ' + (err.response?.data?.message || err.message));
      }
    }
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
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '30px' }}>
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  employees.map(emp => (
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
                            onClick={() => handleDelete(emp.employeeId)}
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Add New Employee' : 'Edit Employee'}</h3>
              <button className="modal-close" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              {formError && <div className="error-message" style={{ padding: '8px 12px', marginBottom: '16px' }}>{formError}</div>}
              
              {modalMode === 'create' ? (
                <div className="form-group">
                  <label>Select Pending User *</label>
                  <select
                    name="userId"
                    className="form-control"
                    value={formData.userId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select a user to assign...</option>
                    {pendingUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
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
                    style={{ background: 'rgba(255, 255, 255, 0.4)', opacity: 0.8, cursor: 'not-allowed' }}
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
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Manager ID</label>
                  <input
                    type="number"
                    name="reportingManagerId"
                    className="form-control"
                    placeholder="Manager's Employee ID"
                    value={formData.reportingManagerId}
                    onChange={handleInputChange}
                  />
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
        </div>
      )}
    </div>
  );
};

export default EmployeesManagement;
