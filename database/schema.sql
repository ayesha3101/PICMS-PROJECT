



CREATE TABLE officer_roles (
    role_id   INT AUTO_INCREMENT PRIMARY KEY,
    role_name ENUM(
        'Investigating Officer',
        'SHO',
        'Jail Superintendent'
    ) NOT NULL
);

CREATE TABLE admin (
    admin_id         INT AUTO_INCREMENT PRIMARY KEY,
    full_name        VARCHAR(100) NOT NULL,
    badge_number     VARCHAR(20)  UNIQUE NOT NULL,
    email            VARCHAR(100) UNIQUE NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    password_changed TINYINT(1)  DEFAULT 0
);


CREATE TABLE citizens (
    cnic          VARCHAR(15)  PRIMARY KEY,
    c_fname       VARCHAR(50)  NOT NULL,
    c_minit       VARCHAR(50)  NULL,
    c_lname       VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified   TINYINT(1)  DEFAULT 0,
    created_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE stations (
    station_id   INT AUTO_INCREMENT PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    area_covered VARCHAR(100) NOT NULL,
    address      VARCHAR(255) NULL,
    phone        VARCHAR(15)  NULL
);

CREATE TABLE officers (
    officer_id       INT AUTO_INCREMENT PRIMARY KEY,
    full_name        VARCHAR(100) NOT NULL,
    badge_number     VARCHAR(20)  UNIQUE NOT NULL,
    email            VARCHAR(100) UNIQUE NOT NULL,
    rank             ENUM('Inspector','DSP','SI','ASI') NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    password_changed TINYINT(1)  DEFAULT 0,
    active_caseload  INT         DEFAULT 0,
    is_active        TINYINT(1)  DEFAULT 1,
    station_id       INT NULL,
    role_id          INT NOT NULL,
    FOREIGN KEY (station_id) REFERENCES stations(station_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (role_id) REFERENCES officer_roles(role_id)
        ON UPDATE CASCADE
);


CREATE TABLE otp_verifications (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    cnic         VARCHAR(15)  NOT NULL,
    otp          VARCHAR(255) NOT NULL,
    expires_at   DATETIME     NOT NULL,
    attempts     INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    verified     TINYINT(1) DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cnic) REFERENCES citizens(cnic)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX(cnic)
);


CREATE TABLE officer_otps (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    officer_id   INT NOT NULL,
    otp          VARCHAR(255) NOT NULL,
    expires_at   DATETIME     NOT NULL,
    attempts     INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    verified     TINYINT(1) DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (officer_id) REFERENCES officers(officer_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX(officer_id)
);


CREATE TABLE admin_otps (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    admin_id     INT NOT NULL,
    otp          VARCHAR(255) NOT NULL,
    expires_at   DATETIME     NOT NULL,
    attempts     INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    verified     TINYINT(1) DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX(admin_id)
);


CREATE TABLE station_sho_assignments (
    assignment_id  INT AUTO_INCREMENT PRIMARY KEY,
    station_id     INT NOT NULL,
    officer_id     INT NOT NULL,
    appointed_by   INT NOT NULL,
    is_current     TINYINT(1)   DEFAULT 1,
    appointed_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    removed_at     TIMESTAMP    NULL,
    removal_reason VARCHAR(255) NULL,
    FOREIGN KEY (station_id)   REFERENCES stations(station_id),
    FOREIGN KEY (officer_id)   REFERENCES officers(officer_id),
    FOREIGN KEY (appointed_by) REFERENCES admin(admin_id)
);


CREATE TABLE station_superintendent_assignments (
    assignment_id  INT AUTO_INCREMENT PRIMARY KEY,
    station_id     INT NOT NULL,
    officer_id     INT NOT NULL,
    appointed_by   INT NOT NULL,
    is_current     TINYINT(1)   DEFAULT 1,
    appointed_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    removed_at     TIMESTAMP    NULL,
    removal_reason VARCHAR(255) NULL,
    FOREIGN KEY (station_id)   REFERENCES stations(station_id),
    FOREIGN KEY (officer_id)   REFERENCES officers(officer_id),
    FOREIGN KEY (appointed_by) REFERENCES admin(admin_id)
);


CREATE TABLE complaint_categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    is_urgent     TINYINT(1) DEFAULT 0
);


CREATE TABLE complaint_subcategories (
    subcategory_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_id      INT NOT NULL,
    subcategory_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES complaint_categories(category_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE complaints (
    complaint_id      INT AUTO_INCREMENT PRIMARY KEY,
    reference_number  VARCHAR(20)  UNIQUE NOT NULL,
    cnic              VARCHAR(15)  NOT NULL,
    station_id        INT NOT NULL,
    category_id       INT NOT NULL,
    subcategory_id    INT NULL,
    incident_area     VARCHAR(100) NULL,
    incident_landmark VARCHAR(255) NULL,
    incident_date     DATE         NULL,
    incident_time     TIME         NULL,
    description       TEXT         NULL,
    has_witnesses     TINYINT(1)  DEFAULT 0,
    status            ENUM(
                        'Submitted',
                        'Under Review',
                        'Accepted',
                        'Rejected',
                        'Officer Assigned',
                        'Investigation Ongoing',
                        'Withdrawal Pending',
                        'Withdrawn',
                        'Resolved',
                        'Closed'
                      ) DEFAULT 'Submitted',
    rejection_reason  VARCHAR(255) NULL,
    submitted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cnic)           REFERENCES citizens(cnic)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (station_id)     REFERENCES stations(station_id),
    FOREIGN KEY (category_id)    REFERENCES complaint_categories(category_id),
    FOREIGN KEY (subcategory_id) REFERENCES complaint_subcategories(subcategory_id)
        ON DELETE SET NULL,
    INDEX idx_cnic   (cnic),
    INDEX idx_status (status)
);


CREATE TABLE witnesses (
    witness_id      INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id    INT NOT NULL,
    witness_name    VARCHAR(100) NOT NULL,
    witness_contact VARCHAR(15)  NULL,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
        ON DELETE CASCADE
);


CREATE TABLE withdrawal_requests (
    request_id     INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id   INT NOT NULL,
    requested_by   VARCHAR(15) NOT NULL,
    reason         TEXT NULL,
    status         ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    rejection_note VARCHAR(255) NULL,
    actioned_by    INT NULL,
    actioned_at    TIMESTAMP NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
        ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES citizens(cnic)
        ON UPDATE CASCADE,
    FOREIGN KEY (actioned_by)  REFERENCES officers(officer_id)
        ON DELETE SET NULL
);


CREATE TABLE case_updates (
    update_id    INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    status       VARCHAR(50)  NOT NULL,
    note         TEXT NULL,
    updated_by   VARCHAR(100) DEFAULT 'System',
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
        ON DELETE CASCADE
);


CREATE TABLE case_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id  INT NOT NULL,
    officer_id    INT NOT NULL,
    assigned_by   INT NULL,
    is_current    TINYINT(1) DEFAULT 1,
    assigned_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    removed_at    TIMESTAMP NULL,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
        ON DELETE CASCADE,
    FOREIGN KEY (officer_id)   REFERENCES officers(officer_id),
    FOREIGN KEY (assigned_by)  REFERENCES officers(officer_id)
        ON DELETE SET NULL
);


CREATE TABLE sho_schedule (
    schedule_id    INT AUTO_INCREMENT PRIMARY KEY,
    officer_id     INT NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time     TIME NOT NULL,
    end_time       TIME NOT NULL,
    slot_type      ENUM('Appointment','Duty','Court','Leave','Other'),
    notes          VARCHAR(255) NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (officer_id) REFERENCES officers(officer_id)
        ON DELETE CASCADE
);


CREATE TABLE appointments (
    appointment_id      INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id        INT NOT NULL,
    sho_id              INT NOT NULL,
    schedule_id         INT NOT NULL,
    location            VARCHAR(255) NULL,
    status              ENUM('Pending','Confirmed','Completed','Cancelled') DEFAULT 'Pending',
    cancellation_reason VARCHAR(255) NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
        ON DELETE CASCADE,
    FOREIGN KEY (sho_id)       REFERENCES officers(officer_id),
    FOREIGN KEY (schedule_id)  REFERENCES sho_schedule(schedule_id)
);

CREATE TABLE jail_cells (
    cell_id    INT AUTO_INCREMENT PRIMARY KEY,
    station_id INT NOT NULL,
    cell_code  VARCHAR(20) NOT NULL,
    gender     ENUM('Male','Female') NOT NULL,
    capacity   INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_station_cell (station_id, cell_code),
    FOREIGN KEY (station_id) REFERENCES stations(station_id)
);


CREATE TABLE detainees (
    detainee_id          INT AUTO_INCREMENT PRIMARY KEY,
    cnic                 VARCHAR(15) NULL,
    d_fname              VARCHAR(50) NOT NULL,
    d_minit              VARCHAR(50) NULL,
    d_lname              VARCHAR(50) NOT NULL,
    age                  TINYINT UNSIGNED NOT NULL,
    gender               ENUM('Male','Female') NOT NULL,
    cell_id              INT NULL,
    station_id           INT NOT NULL,
    complaint_id         INT NULL,
    purpose_of_admission ENUM('Remand','Sentence','Preventive Detention','Other'),
    admission_date       DATE NOT NULL,
    sentence_end_date    DATE NULL,
    release_date         DATE NULL,
    release_reason       VARCHAR(255) NULL,
    admitted_by          INT NULL,
    INDEX(cnic),
    FOREIGN KEY (cell_id)      REFERENCES jail_cells(cell_id)
        ON DELETE SET NULL,
    FOREIGN KEY (station_id)   REFERENCES stations(station_id),
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
        ON DELETE SET NULL,
    FOREIGN KEY (admitted_by)  REFERENCES officers(officer_id)
        ON DELETE SET NULL
);


CREATE TABLE court_hearings (
    hearing_id        INT AUTO_INCREMENT PRIMARY KEY,
    detainee_id       INT NOT NULL,
    complaint_id      INT NULL,
    court_name        VARCHAR(150) NULL,
    hearing_date      DATE NOT NULL,
    hearing_time      TIME NULL,
    hearing_type      ENUM('Remand Extension','Bail Hearing','Trial','Verdict','Other'),
    result            VARCHAR(255) NULL,
    next_hearing_date DATE NULL,
    notes             TEXT NULL,
    FOREIGN KEY (detainee_id)  REFERENCES detainees(detainee_id)
        ON DELETE CASCADE,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
        ON DELETE SET NULL
);


DELIMITER $$

-- 1. Auto-log every complaint status change into case_updates
CREATE TRIGGER after_status_update
AFTER UPDATE ON complaints
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO case_updates (complaint_id, status, note, updated_by)
        VALUES (NEW.complaint_id, NEW.status, 'Status updated', 'System');
    END IF;
END$$

-- 2. Free jail cell automatically when detainee is released
CREATE TRIGGER after_detainee_release
BEFORE UPDATE ON detainees
FOR EACH ROW
BEGIN
    IF NEW.release_date IS NOT NULL AND OLD.release_date IS NULL THEN
        SET NEW.cell_id = NULL;
    END IF;
END$$

-- 3. Retire old SHO when new one appointed for same station
CREATE TRIGGER before_sho_appoint
BEFORE INSERT ON station_sho_assignments
FOR EACH ROW
BEGIN
    UPDATE station_sho_assignments
    SET is_current = 0, removed_at = NOW()
    WHERE station_id = NEW.station_id AND is_current = 1;
END$$

-- 4. Retire old Superintendent when new one appointed for same station
CREATE TRIGGER before_superintendent_appoint
BEFORE INSERT ON station_superintendent_assignments
FOR EACH ROW
BEGIN
    UPDATE station_superintendent_assignments
    SET is_current = 0, removed_at = NOW()
    WHERE station_id = NEW.station_id AND is_current = 1;
END$$

-- 5. Block overlapping SHO schedule slots
CREATE TRIGGER before_sho_schedule_insert
BEFORE INSERT ON sho_schedule
FOR EACH ROW
BEGIN
    DECLARE conflict_count INT;
    SELECT COUNT(*) INTO conflict_count
    FROM sho_schedule
    WHERE officer_id     = NEW.officer_id
      AND scheduled_date = NEW.scheduled_date
      AND (NEW.start_time < end_time AND NEW.end_time > start_time);
    IF conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Schedule conflict: slot overlaps an existing booking.';
    END IF;
END$$

-- 6. Auto-insert sho_schedule slot when appointment is created
CREATE TRIGGER after_appointment_insert
AFTER INSERT ON appointments
FOR EACH ROW
BEGIN
    INSERT INTO sho_schedule (officer_id, scheduled_date, start_time, end_time, slot_type)
    SELECT
        NEW.sho_id,
        ss.scheduled_date,
        ss.start_time,
        ss.end_time,
        'Appointment'
    FROM sho_schedule ss
    WHERE ss.schedule_id = NEW.schedule_id;
END$$

-- 7. Retire old case assignment when new one inserted
CREATE TRIGGER before_case_reassign
BEFORE INSERT ON case_assignments
FOR EACH ROW
BEGIN
    UPDATE case_assignments
    SET is_current = 0, removed_at = NOW()
    WHERE complaint_id = NEW.complaint_id AND is_current = 1;
END$$

DELIMITER ;


-- officer_roles
INSERT INTO officer_roles (role_name) VALUES
('Investigating Officer'),
('SHO'),
('Jail Superintendent');

-- stations (15 Karachi stations)
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

-- complaint_categories
INSERT INTO complaint_categories (category_name, is_urgent) VALUES
('Theft',             0),
('Fraud',             0),
('Harassment',        0),
('Domestic Violence', 1),
('Missing Person',    1),
('Drug Related',      0),
('Assault',           0),
('Kidnapping',        1),
('Property Dispute',  0),
('Other',             0);

-- complaint_subcategories
INSERT INTO complaint_subcategories (category_id, subcategory_name) VALUES
(1, 'Vehicle Theft'),
(1, 'Mobile Phone Theft'),
(1, 'House Burglary'),
(1, 'Robbery'),
(2, 'Online Fraud'),
(2, 'Financial Fraud'),
(2, 'Identity Fraud'),
(3, 'Street Harassment'),
(3, 'Workplace Harassment'),
(3, 'Cyber Harassment'),
(6, 'Possession'),
(6, 'Trafficking'),
(7, 'Physical Assault'),
(7, 'Armed Assault'),
(9, 'Land Dispute'),
(9, 'Rent Dispute');

--admin password Admin@1234

INSERT INTO admin (full_name, badge_number, email, password_hash, password_changed)
VALUES (
'Ahmed Shah',
  'ADMIN-001',
  'policechief.karachi.picms@gmail.com',
  '$2y$10$qWrVbknbGINiSbVvuFdDF.KfK/IOHTBGbfkZy.PB0WWbTR7nqRP5y',
  1
); 

-- i have run everything till here