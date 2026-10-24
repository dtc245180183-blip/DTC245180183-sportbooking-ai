-- ====================================================================
-- SportBooking Pro - Database Schema (DDL)
-- Target DBMS: SQLite 3 / SQLAlchemy 2.0
-- ====================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE ai_logs (
	id INTEGER NOT NULL, 
	type VARCHAR NOT NULL, 
	input_json TEXT NOT NULL, 
	output_text TEXT NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE bookings (
	id INTEGER NOT NULL, 
	customer_id INTEGER NOT NULL, 
	court_id INTEGER NOT NULL, 
	time_slot_id INTEGER NOT NULL, 
	staff_id INTEGER NOT NULL, 
	status VARCHAR NOT NULL, 
	deposit_amount FLOAT, 
	total_amount FLOAT NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	note TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(customer_id) REFERENCES customers (id), 
	FOREIGN KEY(court_id) REFERENCES courts (id), 
	UNIQUE (time_slot_id), 
	FOREIGN KEY(time_slot_id) REFERENCES time_slots (id), 
	FOREIGN KEY(staff_id) REFERENCES users (id)
);

CREATE TABLE court_types (
	id INTEGER NOT NULL, 
	name VARCHAR NOT NULL, 
	description TEXT, image_url VARCHAR, 
	PRIMARY KEY (id)
);

CREATE TABLE courts (
	id INTEGER NOT NULL, 
	name VARCHAR NOT NULL, 
	court_type_id INTEGER NOT NULL, 
	price_per_hour FLOAT NOT NULL, 
	status VARCHAR NOT NULL, image_url VARCHAR, 
	PRIMARY KEY (id), 
	FOREIGN KEY(court_type_id) REFERENCES court_types (id)
);

CREATE TABLE customers (
	id INTEGER NOT NULL, 
	full_name VARCHAR NOT NULL, 
	phone VARCHAR NOT NULL, 
	email VARCHAR, 
	note TEXT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, address VARCHAR, 
	PRIMARY KEY (id)
);

CREATE TABLE maintenance_schedules (
	id INTEGER NOT NULL, 
	court_id INTEGER NOT NULL, 
	start_date DATE NOT NULL, 
	end_date DATE NOT NULL, 
	reason TEXT, 
	status VARCHAR NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(court_id) REFERENCES courts (id)
);

CREATE TABLE payments (
	id INTEGER NOT NULL, 
	booking_id INTEGER NOT NULL, 
	amount FLOAT NOT NULL, 
	method VARCHAR NOT NULL, 
	status VARCHAR NOT NULL, 
	paid_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(booking_id) REFERENCES bookings (id)
);

CREATE TABLE time_slots (
	id INTEGER NOT NULL, 
	court_id INTEGER NOT NULL, 
	date DATE NOT NULL, 
	start_time TIME NOT NULL, 
	end_time TIME NOT NULL, 
	status VARCHAR NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(court_id) REFERENCES courts (id)
);

CREATE TABLE users (
	id INTEGER NOT NULL, 
	username VARCHAR NOT NULL, 
	password_hash VARCHAR NOT NULL, 
	full_name VARCHAR NOT NULL, 
	role VARCHAR NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE INDEX ix_ai_logs_id ON ai_logs (id);

CREATE INDEX ix_bookings_id ON bookings (id);

CREATE INDEX ix_court_types_id ON court_types (id);

CREATE INDEX ix_court_types_name ON court_types (name);

CREATE INDEX ix_courts_id ON courts (id);

CREATE INDEX ix_courts_name ON courts (name);

CREATE INDEX ix_customers_email ON customers (email);

CREATE INDEX ix_customers_id ON customers (id);

CREATE INDEX ix_customers_phone ON customers (phone);

CREATE INDEX ix_maintenance_schedules_id ON maintenance_schedules (id);

CREATE INDEX ix_payments_id ON payments (id);

CREATE INDEX ix_time_slots_date ON time_slots (date);

CREATE INDEX ix_time_slots_id ON time_slots (id);

CREATE INDEX ix_users_id ON users (id);

CREATE UNIQUE INDEX ix_users_username ON users (username);

