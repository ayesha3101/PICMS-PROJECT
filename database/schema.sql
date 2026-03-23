/*guys yeh sab aapne paas bhi run krogy phpmyadmin pr
so you can have the same db, yeh sirf schema hai atm
tuples jo add kerne honge wou ill make a seperate file 
for it soon*/




create table citizens (
    cnic          varchar(15) primary key,
    c_fname   varchar(50) not null,
    c_minit   varchar(50),
    c_lname     varchar(50) not null,
    email         varchar(100) unique not null,
    password_hash varchar(255) not null,
    is_verified   tinyint(1) default 0,
    created_at    timestamp default current_timestamp
);




create table otp_verifications (
    -- unique id for each otp record
    id int auto_increment primary key,

    -- foreign key referencing citizens table
    -- links otp to the correct citizen
    cnic varchar(15) not null,

    -- the otp stored as a hash for security
    otp varchar(255) not null,

    -- expiry time calculated by mysql at insert time
    expires_at datetime not null,

    -- tracks wrong otp guesses
    attempts int default 0,

    -- maximum wrong guesses allowed
    max_attempts int default 5,

    -- 0 = not verified, 1 = verified
    verified tinyint(1) default 0,

    -- when this record was created, used for rate limiting
    created_at timestamp default current_timestamp,

    -- foreign key constraint linking to citizens
    foreign key (cnic) references citizens(cnic)
        on delete cascade
        on update cascade,

    -- index for faster lookups
    index(cnic)
);




-- ──────────────────────────────────────────────
-- TABLE: stations
-- Stores all Karachi police stations
-- station_id is the PK referenced by complaints
-- and officers to know which station they belong to
-- ──────────────────────────────────────────────
CREATE TABLE stations (
    station_id   INT AUTO_INCREMENT PRIMARY KEY,  -- internal PK, used in JOINs
    station_name VARCHAR(100) NOT NULL,            -- display name shown to citizen
    area_covered VARCHAR(100) NOT NULL,            -- area/locality this station serves
    address      VARCHAR(255),                     -- physical address
    phone        VARCHAR(15),                      -- contact number
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ──────────────────────────────────────────────
-- TABLE: officers
-- Stores investigating officers and SHOs only
-- Constables are excluded from this system
-- rank ENUM enforces only valid senior ranks —
--   Inspector, DSP, SI, ASI (no Constable allowed)
-- is_sho = 1 means this officer is the Station House Officer
--   one SHO per station — reviews complaints and assigns cases
-- is_sho = 0 means investigating officer —
--   receives assigned cases, updates status, schedules appointments
-- password_changed = 0 means admin just created the account
--   officer must change password on their very first login
-- active_caseload tracks open cases — SHO uses ORDER BY
--   active_caseload ASC to suggest the least-busy officer
-- ──────────────────────────────────────────────
CREATE TABLE officers (
    officer_id       INT AUTO_INCREMENT PRIMARY KEY,
    full_name        VARCHAR(100) NOT NULL,
    badge_number     VARCHAR(20) UNIQUE NOT NULL,           -- unique badge, used as login identifier
    rank             ENUM('Inspector','DSP','SI','ASI')     -- only senior ranks, no constables
                     NOT NULL,
    station_id       INT,                                   -- which station this officer belongs to
    is_sho           TINYINT(1) DEFAULT 0,                  -- 1 = SHO, 0 = investigating officer
    password_hash    VARCHAR(255) NOT NULL,                 -- hashed by admin at account creation
    password_changed TINYINT(1) DEFAULT 0,                  -- 0 = must change password on first login
    active_caseload  INT DEFAULT 0,                         -- incremented on assign, decremented on resolve
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(station_id)
        ON DELETE SET NULL ON UPDATE CASCADE                -- if station deleted, officer stays but unlinked
);


-- ──────────────────────────────────────────────
-- TABLE: complaints
-- Core table — every citizen complaint lives here
-- complaint_id is the real PK used in all JOINs
-- reference_number is citizen-facing (KHI-26-00001)
--   generated in PHP right after INSERT using last insert id
-- priority auto-set to Urgent for sensitive categories
--   (Domestic Violence, Missing Person) — handled in PHP
-- rejection_reason filled only when SHO rejects
-- ──────────────────────────────────────────────
CREATE TABLE complaints (
    complaint_id      INT AUTO_INCREMENT PRIMARY KEY,  -- real PK, never shown to citizen
    reference_number  VARCHAR(20) UNIQUE NOT NULL,     -- KHI-YY-XXXXX, generated after insert
    cnic              VARCHAR(15) NOT NULL,             -- FK to citizens table
    station_id        INT NOT NULL,                    -- FK to stations, auto-mapped from area
    category          VARCHAR(50) NOT NULL,            -- top level: Theft, Fraud, Harassment etc.
    subcategory       VARCHAR(50),                     -- e.g. Vehicle Theft under Theft
    incident_area     VARCHAR(100),                    -- locality where incident happened
    incident_landmark VARCHAR(255),                    -- optional street / landmark detail
    incident_date     DATE,                            -- date incident occurred
    incident_time     TIME,                            -- time incident occurred
    description       TEXT,                            -- citizen written account
    has_witnesses     TINYINT(1) DEFAULT 0,            -- 1 = witness info provided below
    witness_name      VARCHAR(100),                    -- optional witness full name
    witness_contact   VARCHAR(15),                     -- optional witness phone number
    is_anonymous      TINYINT(1) DEFAULT 0,            -- 1 = hide citizen name from officers
    status            ENUM(
                        'Submitted',             -- just filed, awaiting SHO review
                        'Under Review',          -- SHO is currently reviewing
                        'Accepted',              -- SHO accepted, pending officer assignment
                        'Rejected',              -- SHO rejected, reason stored below
                        'Officer Assigned',      -- officer assigned, investigation starting
                        'Investigation Ongoing', -- officer posted a progress update
                        'Resolved',              -- case closed with resolution
                        'Closed'                 -- fully archived
                      ) DEFAULT 'Submitted',
    priority          ENUM('Normal', 'Urgent') DEFAULT 'Normal', -- Urgent flags DV, Missing Person
    rejection_reason  VARCHAR(255),                    -- only filled when status = Rejected
    submitted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cnic)       REFERENCES citizens(cnic)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(station_id),
    INDEX idx_cnic   (cnic),                           -- speeds up citizen dashboard queries
    INDEX idx_status (status)                          -- speeds up SHO filter queries
);


-- ──────────────────────────────────────────────
-- TABLE: case_updates
-- Every status change on a complaint is logged here
-- Powers the timeline view on the citizen case detail page
-- Rows are inserted automatically by the trigger below
--   and also manually when officers add progress notes
-- updated_by is a string: 'System', 'SHO', or officer name
-- ──────────────────────────────────────────────
CREATE TABLE case_updates (
    update_id    INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,                   -- which complaint this update belongs to
    status       VARCHAR(50) NOT NULL,           -- status value at time of this update
    note         TEXT,                           -- optional explanation of the update
    updated_by   VARCHAR(100) DEFAULT 'System',  -- who triggered it
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
        ON DELETE CASCADE                        -- timeline deleted if complaint deleted
);


-- ──────────────────────────────────────────────
-- TABLE: case_assignments
-- Tracks which officer is assigned to which complaint
-- assigned_by stores the officer_id of the SHO who assigned
-- We keep full history so if reassignment happens it is logged
-- active_caseload on officers table is updated in PHP on each assignment
-- ──────────────────────────────────────────────
CREATE TABLE case_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id  INT NOT NULL,   -- which complaint was assigned
    officer_id    INT NOT NULL,   -- which officer received it
    assigned_by   INT,            -- officer_id of the SHO who made the decision
    assigned_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
        ON DELETE CASCADE,
    FOREIGN KEY (officer_id)  REFERENCES officers(officer_id),
    FOREIGN KEY (assigned_by) REFERENCES officers(officer_id)
        ON DELETE SET NULL        -- if SHO account removed, assignment record still kept
);


-- ──────────────────────────────────────────────
-- TABLE: appointments
-- When an officer schedules a meeting or call with the citizen
-- Citizen sees this on their case detail page
-- location can be a station address or just "Phone Call"
-- ──────────────────────────────────────────────
CREATE TABLE appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id   INT NOT NULL,     -- which complaint this appointment is for
    scheduled_date DATE,             -- date of meeting or call
    scheduled_time TIME,             -- time of meeting or call
    location       VARCHAR(255),     -- station name, address, or "Phone Call"
    status         ENUM(
                     'Pending',      -- scheduled but not yet confirmed
                     'Confirmed',    -- both sides confirmed
                     'Completed',    -- meeting took place
                     'Cancelled'     -- cancelled by either party
                   ) DEFAULT 'Pending',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
        ON DELETE CASCADE
);




-- ══════════════════════════════════════════════
-- TRIGGER: after_status_update
-- Fires automatically AFTER any UPDATE on complaints
-- If the status column changed value, it logs the
-- transition into case_updates — no PHP needed
-- This is what builds the citizen timeline view
-- NOTE: DELIMITER $$ is required so phpMyAdmin does
--   not mistake the semicolon inside BEGIN...END
--   as the end of the statement
-- ══════════════════════════════════════════════
DELIMITER $$

CREATE TRIGGER after_status_update
AFTER UPDATE ON complaints
FOR EACH ROW
BEGIN
    -- only log if status actually changed, not every update
    IF OLD.status != NEW.status THEN
        INSERT INTO case_updates (complaint_id, status, note, updated_by)
        VALUES (NEW.complaint_id, NEW.status, 'Status updated', 'System');
    END IF;
END$$

DELIMITER ;


-- ══════════════════════════════════════════════
-- SEED DATA — Karachi Police Stations
-- 15 real Karachi stations with area mappings
-- The complaint form will use area_covered to
-- auto-map citizen locality → correct station_id
-- ══════════════════════════════════════════════
INSERT INTO stations (station_name, area_covered, address, phone) VALUES
('Clifton Police Station',          'Clifton',          'Clifton Block 2, Karachi',              '021-35871234'),
('Defence Police Station',          'DHA',              'DHA Phase 4, Karachi',                  '021-35311234'),
('Gulshan-e-Iqbal Police Station',  'Gulshan-e-Iqbal',  'Block 3, Gulshan-e-Iqbal, Karachi',     '021-34821234'),
('Saddar Police Station',           'Saddar',           'Saddar, Karachi',                       '021-32211234'),
('Korangi Police Station',          'Korangi',          'Korangi Industrial Area, Karachi',      '021-35121234'),
('North Nazimabad Police Station',  'North Nazimabad',  'Block H, North Nazimabad, Karachi',     '021-36611234'),
('Malir Police Station',            'Malir',            'Malir City, Karachi',                   '021-34511234'),
('Orangi Police Station',           'Orangi Town',      'Orangi Town, Karachi',                  '021-36811234'),
('Landhi Police Station',           'Landhi',           'Landhi, Karachi',                       '021-35051234'),
('Baldia Police Station',           'Baldia Town',      'Baldia Town, Karachi',                  '021-32551234'),
('SITE Police Station',             'SITE',             'SITE Area, Karachi',                    '021-32571234'),
('Lyari Police Station',            'Lyari',            'Lyari, Karachi',                        '021-32231234'),
('Kemari Police Station',           'Kemari',           'Kemari, Karachi',                       '021-32851234'),
('Garden Police Station',           'Garden',           'Garden Road, Karachi',                  '021-99214000'),
('Frere Police Station',            'Frere Town',       'Frere Town, Karachi',                   '021-35221234');