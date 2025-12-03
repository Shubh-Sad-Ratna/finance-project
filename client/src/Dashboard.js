import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Dashboard({ role }) {
    const [formData, setFormData] = useState({});
    const [records, setRecords] = useState([]);
    const [filter, setFilter] = useState({ from: '', to: '' });
    const [editId, setEditId] = useState(null);

    // --- THE FIX: Universal Date Fixer ---
    // This takes whatever the database gives (UTC Time) and converts it 
    // to your Local System Time (YYYY-MM-DD)
    const fixDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // 'en-CA' is the code for YYYY-MM-DD format
        // This automatically adds your timezone offset (e.g., +5:30 for India)
        return date.toLocaleDateString('en-CA');
    };

    const getFields = () => {
        if (role === 'salaries') return ['employee_id', 'employee_name', 'salary'];
        if (role === 'gem_purchases') return ['item_id', 'item_name', 'quantity', 'cost'];
        if (role === 'medical_claims') return ['claim_name', 'claim_type', 'amount'];
        if (role === 'ltc_records') return ['employee_id', 'employee_name', 'amount'];
        return [];
    };

    const fetchRecords = async () => {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const res = await axios.get(`${apiUrl}/api/${role}`, { params: filter });
        setRecords(res.data);
    };

    useEffect(() => { fetchRecords(); }, [role]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const endpoint = `${apiUrl}/api/${role}`;
        // 1. Copy data
        const payload = { ...formData };
        
        // 2. Ensure date is YYYY-MM-DD before sending
        if (payload.entry_date) {
            // We use the same fixDate function to ensure we send clean local dates
            payload.entry_date = fixDate(payload.entry_date); 
        }
        
        delete payload.id; 

        try {
            if (editId) {
                await axios.put(`${endpoint}/${editId}`, payload);
            } else {
                await axios.post(endpoint, payload);
            }
            setFormData({});
            setEditId(null);
            fetchRecords(); 
            alert("Saved successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to save.");
        }
    };

    const handleEdit = (rec) => {
        // When editing, we must convert the database date to local date immediately
        const cleanRecord = { ...rec, entry_date: fixDate(rec.entry_date) };
        setFormData(cleanRecord);
        setEditId(rec.id);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        await axios.delete(`${apiUrl}/api/${role}/${id}`);
            fetchRecords();
        }
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text(`${role.toUpperCase().replace('_', ' ')} REPORT`, 14, 10);
        
        const headers = getFields().concat(['entry_date']);
        
        // Prepare the data
        const data = records.map(rec => [
            ...getFields().map(f => rec[f]),
            fixDate(rec.entry_date)
        ]);
        
        // --- THE FIX IS HERE ---
        // Instead of doc.autoTable(...), we use autoTable(doc, ...)
        autoTable(doc, {
            head: [headers],
            body: data,
            startY: 20,
        });
        // -----------------------

        doc.save(`${role}_report.pdf`);
    };

    return (
        <div className="app-container">
            <h1>{role.toUpperCase().replace('_', ' ')} Portal</h1>
            
            {/* FORM CARD */}
            <div className="card">
                <h3>{editId ? 'Edit Record' : 'Add New Record'}</h3>
                
                <div className="input-group">
                    {getFields().map(field => (
                        field === 'claim_type' ? 
                        <select key={field} name={field} onChange={handleChange} value={formData[field] || ''}>
                            <option value="">Select Type</option>
                            <option value="Claim">Claim</option>
                            <option value="Advance Claim">Advance Claim</option>
                        </select>
                        :
                        <input 
                            key={field} 
                            name={field} 
                            placeholder={field.replace('_', ' ').toUpperCase()} 
                            value={formData[field] || ''} 
                            onChange={handleChange} 
                        />
                    ))}
                    <input 
                        type="date" 
                        name="entry_date" 
                        value={formData.entry_date || ''} 
                        onChange={handleChange} 
                    />
                </div>

                <button className="btn-primary" onClick={handleSubmit}>
                    {editId ? 'Update Record' : '+ Add Record'}
                </button>
            </div>

            {/* FILTER & ACTIONS */}
            <div className="card" style={{display: 'flex', alignItems: 'center', gap: '10px', padding: '15px'}}>
                <span>Filter From:</span>
                <input type="date" onChange={e => setFilter({...filter, from: e.target.value})} style={{width: 'auto'}} />
                <span>To:</span>
                <input type="date" onChange={e => setFilter({...filter, to: e.target.value})} style={{width: 'auto'}} />
                
                <button className="btn-action" onClick={fetchRecords}>Apply Filter</button>
                <button className="btn-action" style={{backgroundColor: '#f59e0b'}} onClick={downloadPDF}>Download PDF</button>
            </div>

            {/* TABLE */}
            <div style={{overflowX: 'auto'}}> {/* Allows scroll on small screens */}
                <table>
                    <thead>
                        <tr>
                            {getFields().map(f => <th key={f}>{f.replace('_', ' ').toUpperCase()}</th>)}
                            <th>DATE</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map(rec => (
                            <tr key={rec.id}>
                                {getFields().map(f => <td key={f}>{rec[f]}</td>)}
                                <td>{fixDate(rec.entry_date)}</td>
                                <td>
                                    <button className="btn-secondary" onClick={() => handleEdit(rec)}>Edit</button>
                                    <button className="btn-danger" onClick={() => handleDelete(rec.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        {records.length === 0 && (
                            <tr>
                                <td colSpan="10" style={{textAlign: 'center', color: '#888'}}>No records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Dashboard;