const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Add this line to read the .env file locally

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- DATABASE CONNECTION ---
// Notice: We removed the real passwords from here!
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'finance_system',
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }, // Necessary for Cloud DBs
    dateStrings: true
});

db.connect(err => {
    if (err) console.log('DB Connection Error:', err);
    else console.log('Connected to MySQL Database');
});

// --- HARDCODED USERS ---
const users = {
    'salary_admin': { password: 'salary@123', role: 'salaries' },
    'gem_admin': { password: 'gem@123', role: 'gem_purchases' },
    'medical_admin': { password: 'medical@123', role: 'medical_claims' },
    'ltc_admin': { password: 'ltc@123', role: 'ltc_records' }
};

// --- LOGIN ROUTE ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];
    if (user && user.password === password) {
        res.json({ success: true, role: user.role });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// --- DELETE ROUTE ---
app.delete('/api/:table/:id', (req, res) => {
    const table = req.params.table;
    const id = req.params.id;
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    db.query(sql, [id], (err, result) => {
        if (err) return res.json(err);
        return res.json({ message: "Record deleted" });
    });
});

// --- GENERIC CRUD ROUTES ---
app.post('/api/:table', (req, res) => {
    const table = req.params.table;
    const data = req.body;
    const sql = `INSERT INTO ${table} SET ?`;
    db.query(sql, data, (err, result) => {
        if (err) return res.json({ error: err.message });
        return res.json({ message: "Record added", id: result.insertId });
    });
});

app.get('/api/:table', (req, res) => {
    const table = req.params.table;
    const { from, to } = req.query;
    let sql = `SELECT * FROM ${table}`;
    let params = [];
    
    if (from && to) {
        sql += " WHERE entry_date BETWEEN ? AND ?";
        params = [from, to];
    }
    
    db.query(sql, params, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

app.put('/api/:table/:id', (req, res) => {
    const table = req.params.table;
    const id = req.params.id;
    const data = req.body;
    const sql = `UPDATE ${table} SET ? WHERE id = ?`;
    db.query(sql, [data, id], (err, result) => {
        if (err) return res.json(err);
        return res.json({ message: "Record updated" });
    });
});

app.listen(3001, () => {
    console.log("Server running on port 3001");
});