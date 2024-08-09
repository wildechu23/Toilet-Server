CREATE TABLE Locations (
    location_id INTEGER PRIMARY KEY,
    location_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
);

CREATE TABLE Restrooms (
    restroom_id INTEGER PRIMARY KEY,
    location_id INTEGER NOT NULL,
    gender TEXT CHECK(gender IN ('Men', 'Women', 'Unisex')) NOT NULL,
    single_stall INTEGER CHECK(single_stall IN (0, 1)),
    wheelchair_stall INTEGER CHECK(wheelchair_stall IN (0, 1)),
    mirrors INTEGER CHECK(mirrors IN (0, 1)),
    hand_dryers INTEGER CHECK(hand_dryers IN (0, 1)),
    paper_towels INTEGER CHECK(paper_towels IN (0, 1)),
    FOREIGN KEY (location_id) REFERENCES Locations(location_id)
); 

CREATE TABLE Reviews (
    review_id INTEGER PRIMARY KEY,
    location_id INTEGER NOT NULL,
    restroom_id INTEGER NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES Locations(location_id),
    FOREIGN KEY (restroom_id) REFERENCES Restrooms(restroom_id)
);