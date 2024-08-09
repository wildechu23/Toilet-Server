"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const db = new sqlite3_1.default.Database('./toilets.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to database');
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// GET all locations
app.get('/locations', (req, res) => {
    db.all('SELECT * FROM Locations', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
        }
        else {
            res.send(rows);
        }
    });
});
// GET single location by ID
app.get('/locations/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM Locations WHERE location_id = ?', [id], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
        }
        else if (!row) {
            res.status(404).send('Location not found');
        }
        else {
            res.send(row);
        }
    });
});
// POST new location
app.post('/locations', (req, res) => {
    const { name, lat, lng, restrooms } = req.body;
    if (!name || !lat || !lng) {
        res.status(400).send('Name, latitude, and longitude are required');
        return;
    }
    const sql = 'INSERT INTO Locations(location_name, latitude, longitude) VALUES (?, ?, ?)';
    db.run(sql, [name, lat, lng], function (err) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
        }
        else {
            const locationId = this.lastID;
            // Insert restrooms associated with the new location
            const restroomQuery = `
                INSERT INTO Restrooms(
                    location_id, 
                    gender, 
                    single_stall, 
                    wheelchair_stall, 
                    mirrors, 
                    hand_dryers, 
                    paper_towels
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const restroomInsertions = restrooms.map(r => new Promise((resolve, reject) => {
                db.run(restroomQuery, [locationId, r.gender, r.single_stall, r.wheelchair_stall, r.mirrors, r.hand_dryers, r.paper_towels], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }));
            Promise.all(restroomInsertions)
                .then(() => {
                res.status(201).send({ id: locationId, name, lat, lng });
            })
                .catch(err => {
                console.error(err.message);
                res.status(500).send('Internal server error');
            });
        }
    });
});
// PUT location with id
app.put('/locations/:id', (req, res) => {
    const { id } = req.params;
    const { name, lat, lng, restrooms } = req.body;
    console.log(name);
    // Validate the input
    if (!name || !lat || !lng) {
        return res.status(400).send('Name, latitude, and longitude are required');
    }
    const updateLocationQuery = 'UPDATE Locations SET location_name = ?, latitude = ?, longitude = ? WHERE location_id = ?';
    db.run(updateLocationQuery, [name, lat, lng, id], function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Internal server error');
        }
        // Delete existing restrooms for this location
        const deleteRestroomsQuery = 'DELETE FROM Restrooms WHERE location_id = ?';
        db.run(deleteRestroomsQuery, [id], function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Internal server error');
            }
            // Insert updated/new restrooms associated with the location
            const restroomInsertQuery = `
                INSERT INTO Restrooms(
                    location_id, 
                    gender, 
                    single_stall, 
                    wheelchair_stall, 
                    mirrors, 
                    hand_dryers, 
                    paper_towels
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const restroomInsertions = restrooms.map(r => new Promise((resolve, reject) => {
                db.run(restroomInsertQuery, [id, r.gender, r.single_stall, r.wheelchair_stall, r.mirrors, r.hand_dryers, r.paper_towels], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }));
            Promise.all(restroomInsertions)
                .then(() => {
                res.status(200).send({ id: id, name, lat, lng });
            })
                .catch(err => {
                console.error(err.message);
                res.status(500).send('Internal server error');
            });
        });
    });
});
// GET all restrooms
app.get('/restrooms', (req, res) => {
    db.all('SELECT * FROM Restrooms', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
        }
        else {
            res.send(rows);
        }
    });
});
// GET restrooms by location ID
app.get('/restrooms/:id', (req, res) => {
    const { id } = req.params;
    db.all('SELECT * FROM Restrooms WHERE location_id = ?', [id], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal server error');
        }
        else if (!row) {
            res.status(404).send('Restrooms not found');
        }
        else {
            res.send(row);
        }
    });
});
// GET all reviews
app.get('/reviews', (req, res) => {
    const query = `SELECT * FROM Reviews`;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.send(rows);
    });
});
// GET all reviews by location_id
app.get('/reviews/location/:location_id', (req, res) => {
    const location_id = req.params.location_id;
    const query = `SELECT * FROM Reviews WHERE location_id = ?`;
    db.all(query, [location_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.send(rows);
    });
});
// GET all reviews by restroom_id
app.get('/reviews/restroom/:restroom_id', (req, res) => {
    const restroom_id = req.params.restroom_id;
    const query = `SELECT * FROM Reviews WHERE restroom_id = ?`;
    db.all(query, [restroom_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.send(rows);
    });
});
// POST new review
app.post('/reviews', (req, res) => {
    const { restroom_id, location_id, rating, review_text } = req.body;
    const query = `
        INSERT INTO Reviews (restroom_id, location_id, rating, review_text)
        VALUES (?, ?, ?, ?)
    `;
    db.run(query, [restroom_id, location_id, rating, review_text], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ review_id: this.lastID });
    });
});
// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
});
