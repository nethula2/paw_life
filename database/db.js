const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'pawlife.db');
const SCHEMA_PATH = path.join(__dirname, 'pawlife_schema.sql');
const SEED_PATH = path.join(__dirname, 'seed_data.sql');

// Open or create SQLite DB
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Failed to open database:', err.message);
    } else {
        console.log('Connected to SQLite PawLife database at:', DB_PATH);
    }
});

// Enable Foreign Keys
db.run('PRAGMA foreign_keys = ON;');

// Helper Promise wrappers
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

const exec = (sql) => {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

// Initialize schema and seed data if not yet present
const initDatabase = async () => {
    try {
        const check = await get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
        if (!check) {
            console.log('Initializing PawLife database schema...');
            const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
            await exec(schemaSql);
            console.log('Schema created successfully.');

            console.log('Seeding initial data...');
            const seedSql = fs.readFileSync(SEED_PATH, 'utf-8');
            await exec(seedSql);
            console.log('Initial seed data populated successfully.');
        } else {
            console.log('Database already initialized with tables.');
        }
    } catch (err) {
        console.error('Error during database initialization:', err);
    }
};

module.exports = {
    db,
    query,
    get,
    run,
    exec,
    initDatabase,
    DB_PATH
};
