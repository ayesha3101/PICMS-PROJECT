set foreign_key_checks=0;

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
    password_changed TINYINT(1)  DEFAULT 0-- ============================================================
-- TEST DATA: Citizens, Officers (Investigating), Complaints
-- Password for all: password (bcrypt hash)
-- ============================================================

SET foreign_key_checks=0;

-- -----------------------------------------------------------
-- CITIZENS (50)
-- -----------------------------------------------------------
INSERT INTO citizens (cnic, c_fname, c_minit, c_lname, email, password_hash, is_verified) VALUES
  ('4210112345671', 'Ali', 'M', 'Khan', 'ali.khan.pkr@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210198765432', 'Fatima', 'A', 'Siddiqui', 'fatima.siddiqui.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210145678901', 'Muhammad', 'R', 'Ahmed', 'm.ahmed.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210187654321', 'Ayesha', NULL, 'Naveed', 'ayesha.naveed3101@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210156789012', 'Usman', 'T', 'Malik', 'usman.malik.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210134567890', 'Sana', 'B', 'Raza', 'sana.raza.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210123456789', 'Hassan', NULL, 'Qureshi', 'hassan.qureshi.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210190123456', 'Nadia', 'S', 'Shaikh', 'nadia.shaikh.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210178901234', 'Bilal', 'M', 'Chaudhry', 'bilal.chaudhry.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210167890123', 'Rabia', NULL, 'Ansari', 'rabia.ansari.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210112378901', 'Tariq', 'A', 'Javed', 'tariq.javed.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210198712345', 'Amna', 'Z', 'Iqbal', 'amna.iqbal.pkr@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210145634567', 'Imran', NULL, 'Sheikh', 'imran.sheikh.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210187623456', 'Zainab', 'F', 'Ali', 'zainab.ali.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210156712345', 'Kamran', 'H', 'Baig', 'kamran.baig.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210134523456', 'Hina', NULL, 'Mirza', 'hina.mirza.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210123412345', 'Asad', 'R', 'Butt', 'asad.butt.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210190112345', 'Lubna', 'M', 'Hussain', 'lubna.hussain.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210178823456', 'Faisal', NULL, 'Naqvi', 'faisal.naqvi.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210167756789', 'Madiha', 'A', 'Gondal', 'madiha.gondal.pkr@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210112399001', 'Omer', 'S', 'Farooq', 'omer.farooq.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210198766789', 'Samina', NULL, 'Khatri', 'samina.khatri.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210145601234', 'Zahid', 'T', 'Hashmi', 'zahid.hashmi.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210187698765', 'Noman', NULL, 'Lodhi', 'noman.lodhi.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210156745678', 'Farah', 'B', 'Niazi', 'farah.niazi.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210134556789', 'Waqas', 'M', 'Rajput', 'waqas.rajput.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210123467890', 'Aisha', NULL, 'Bhatti', 'aisha.bhatti.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210190134567', 'Nasir', 'A', 'Warsi', 'nasir.warsi.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210178856789', 'Sobia', 'F', 'Kazmi', 'sobia.kazmi.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210167789012', 'Adnan', NULL, 'Saeed', 'adnan.saeed.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210112311111', 'Uzma', 'R', 'Gillani', 'uzma.gillani.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210198722222', 'Shahzad', NULL, 'Awan', 'shahzad.awan.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210145633333', 'Huma', 'M', 'Bokhari', 'huma.bokhari.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210187644444', 'Rehan', 'A', 'Soomro', 'rehan.soomro.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210156755555', 'Saira', NULL, 'Tunio', 'saira.tunio.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210134566666', 'Danish', 'Z', 'Phulpoto', 'danish.phulpoto.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210123477777', 'Fiza', NULL, 'Memon', 'fiza.memon.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210190188888', 'Junaid', 'S', 'Murtaza', 'junaid.murtaza.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210178899999', 'Sadaf', 'M', 'Rauf', 'sadaf.rauf.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210167700001', 'Khurram', NULL, 'Shafiq', 'khurram.shafiq.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210112300002', 'Naila', 'A', 'Waheed', 'naila.waheed.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210198700003', 'Asif', NULL, 'Zafar', 'asif.zafar.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210145600004', 'Qurat', 'B', 'Ul Ain', 'qurat.ulain.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210187600005', 'Waqar', 'M', 'Sultan', 'waqar.sultan.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210156700006', 'Afshan', NULL, 'Yousuf', 'afshan.yousuf.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210134500007', 'Naveed', 'R', 'Chattha', 'naveed.chattha.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210123400008', 'Shazia', NULL, 'Pirzada', 'shazia.pirzada.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210190100009', 'Raza', 'T', 'Haider', 'raza.haider.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210178800010', 'Abida', 'F', 'Shaheen', 'abida.shaheen.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210167700011', 'Salman', NULL, 'Dar', 'salman.dar.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);

-- -----------------------------------------------------------
-- OFFICERS (150 Investigating Officers, 10 per station)
-- -----------------------------------------------------------
INSERT INTO officers (full_name, badge_number, email, rank, password_hash, password_changed, active_caseload, is_active, station_id, role_id) VALUES
  ('Shakeel Phulpoto', 'KHI-S01-001', 'shakeel.phulpoto.s1.0@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 1, 1),
  ('Lashari Rajput', 'KHI-S01-002', 'lashari.rajput.s1.1@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 1, 1),
  ('Nabil Faqir', 'KHI-S01-003', 'nabil.faqir.s1.2@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 1, 1),
  ('Taimur Chandio', 'KHI-S01-004', 'taimur.chandio.s1.3@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 1, 1),
  ('Mazhar Umrani', 'KHI-S01-005', 'mazhar.umrani.s1.4@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 1, 1),
  ('Gulfam Lashari', 'KHI-S01-006', 'gulfam.lashari.s1.5@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 1, 1),
  ('Daniyar Pirzado', 'KHI-S01-007', 'daniyar.pirzado.s1.6@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 1, 1),
  ('Wajid Samo', 'KHI-S01-008', 'wajid.samo.s1.7@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 1, 1),
  ('Tanvir Osmani', 'KHI-S01-009', 'tanvir.osmani.s1.8@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 1, 1),
  ('Murad Mahar', 'KHI-S01-010', 'murad.mahar.s1.9@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 1, 1),
  ('Arshad Malik', 'KHI-S02-011', 'arshad.malik.s2.0@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 2, 1),
  ('Ghazanfar Fatani', 'KHI-S02-012', 'ghazanfar.fatani.s2.1@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 2, 1),
  ('Usman Essani', 'KHI-S02-013', 'usman.essani.s2.2@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 2, 1),
  ('Raheel Malik', 'KHI-S02-014', 'raheel.malik.s2.3@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 2, 1),
  ('Owais Hajano', 'KHI-S02-015', 'owais.hajano.s2.4@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 2, 1),
  ('Haroon Talpur', 'KHI-S02-016', 'haroon.talpur.s2.5@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 2, 1),
  ('Obaidullah Farooqui', 'KHI-S02-017', 'obaidullah.farooqui.s2.6@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 2, 1),
  ('Moeed Mangi', 'KHI-S02-018', 'moeed.mangi.s2.7@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 2, 1),
  ('Bahadur Jamot', 'KHI-S02-019', 'bahadur.jamot.s2.8@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 2, 1),
  ('Tauseef Shahwani', 'KHI-S02-020', 'tauseef.shahwani.s2.9@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 2, 1),
  ('Naveed Tanoli', 'KHI-S03-021', 'naveed.tanoli.s3.0@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 3, 1),
  ('Siraj Dahri', 'KHI-S03-022', 'siraj.dahri.s3.1@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 3, 1),
  ('Ehsan Siddiqui', 'KHI-S03-023', 'ehsan.siddiqui.s3.2@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 3, 1),
  ('Rashid Tareen', 'KHI-S03-024', 'rashid.tareen.s3.3@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 3, 1),
  ('Lashari Mahsud', 'KHI-S03-025', 'lashari.mahsud.s3.4@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 3, 1),
  ('Arshad Otho', 'KHI-S03-026', 'arshad.otho.s3.5@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 3, 1),
  ('Ehtisham Otho', 'KHI-S03-027', 'ehtisham.otho.s3.6@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 3, 1),
  ('Hasnain Waryah', 'KHI-S03-028', 'hasnain.waryah.s3.7@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 3, 1),
  ('Rashid Wazir', 'KHI-S03-029', 'rashid.wazir.s3.8@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 3, 1),
  ('Nabeel Zehri', 'KHI-S03-030', 'nabeel.zehri.s3.9@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 3, 1),
  ('Javed Swati', 'KHI-S04-031', 'javed.swati.s4.0@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 4, 1),
  ('Khalil Panhwar', 'KHI-S04-032', 'khalil.panhwar.s4.1@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 4, 1),
  ('Rauf Osmani', 'KHI-S04-033', 'rauf.osmani.s4.2@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 4, 1),
  ('Jawwad Jafri', 'KHI-S04-034', 'jawwad.jafri.s4.3@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 4, 1),
  ('Jawwad Mangi', 'KHI-S04-035', 'jawwad.mangi.s4.4@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 4, 1),
  ('Uzair Ibrahimzai', 'KHI-S04-036', 'uzair.ibrahimzai.s4.5@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 4, 1),
  ('Vikar Jafri', 'KHI-S04-037', 'vikar.jafri.s4.6@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 4, 1),
  ('Fahim Esani', 'KHI-S04-038', 'fahim.esani.s4.7@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 4, 1),
  ('Hamid Shahwani', 'KHI-S04-039', 'hamid.shahwani.s4.8@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 4, 1),
  ('Daud Indhar', 'KHI-S04-040', 'daud.indhar.s4.9@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 4, 1),
  ('Husnain Baladi', 'KHI-S05-041', 'husnain.baladi.s5.0@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 5, 1),
  ('Raees Malik', 'KHI-S05-042', 'raees.malik.s5.1@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 5, 1),
  ('Obaidullah Esani', 'KHI-S05-043', 'obaidullah.esani.s5.2@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 5, 1),
  ('Shahbaz Chattha', 'KHI-S05-044', 'shahbaz.chattha.s5.3@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 5, 1),
  ('Talha Pirzado', 'KHI-S05-045', 'talha.pirzado.s5.4@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 5, 1),
  ('Ubaid Haider', 'KHI-S05-046', 'ubaid.haider.s5.5@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 5, 1),
  ('Rizwan Panhwar', 'KHI-S05-047', 'rizwan.panhwar.s5.6@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 5, 1),
  ('Ahsan Gabol', 'KHI-S05-048', 'ahsan.gabol.s5.7@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 5, 1),
  ('Bahadur Dahri', 'KHI-S05-049', 'bahadur.dahri.s5.8@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 5, 1),
  ('Nabil Gabol', 'KHI-S05-050', 'nabil.gabol.s5.9@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 5, 1),
  ('Pervaiz Channa', 'KHI-S06-051', 'pervaiz.channa.s6.0@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 6, 1),
  ('Zaheer Afridi', 'KHI-S06-052', 'zaheer.afridi.s6.1@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 6, 1),
  ('Wajid Napar', 'KHI-S06-053', 'wajid.napar.s6.2@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 6, 1),
  ('Kamran Kalmati', 'KHI-S06-054', 'kamran.kalmati.s6.3@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 6, 1),
  ('Yasir Junejo', 'KHI-S06-055', 'yasir.junejo.s6.4@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 6, 1),
  ('Hammad Hisbani', 'KHI-S06-056', 'hammad.hisbani.s6.5@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 6, 1),
  ('Karrar Unar', 'KHI-S06-057', 'karrar.unar.s6.6@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 6, 1),
  ('Nabeel Hisbani', 'KHI-S06-058', 'nabeel.hisbani.s6.7@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 6, 1),
  ('Tahir Wagan', 'KHI-S06-059', 'tahir.wagan.s6.8@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 6, 1),
  ('Imtiaz Baloch', 'KHI-S06-060', 'imtiaz.baloch.s6.9@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 6, 1),
  ('Jafar Bugti', 'KHI-S07-061', 'jafar.bugti.s7.0@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 7, 1),
  ('Ramzan Phulpoto', 'KHI-S07-062', 'ramzan.phulpoto.s7.1@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 7, 1),
  ('Murad Rind', 'KHI-S07-063', 'murad.rind.s7.2@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 7, 1),
  ('Dawood Isphahani', 'KHI-S07-064', 'dawood.isphahani.s7.3@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 7, 1),
  ('Imran Gichki', 'KHI-S07-065', 'imran.gichki.s7.4@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 7, 1),
  ('Luqman Shafiq', 'KHI-S07-066', 'luqman.shafiq.s7.5@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 7, 1),
  ('Uzman Chaudhry', 'KHI-S07-067', 'uzman.chaudhry.s7.6@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 7, 1),
  ('Luqman Dareshk', 'KHI-S07-068', 'luqman.dareshk.s7.7@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 7, 1),
  ('Rizwan Rauf', 'KHI-S07-069', 'rizwan.rauf.s7.8@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 7, 1),
  ('Uzman Amrani', 'KHI-S07-070', 'uzman.amrani.s7.9@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 7, 1),
  ('Irfan Ibrahimzai', 'KHI-S08-071', 'irfan.ibrahimzai.s8.0@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 8, 1),
  ('Zia Tareen', 'KHI-S08-072', 'zia.tareen.s8.1@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 8, 1),
  ('Murad Wadho', 'KHI-S08-073', 'murad.wadho.s8.2@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 8, 1),
  ('Nasim Memon', 'KHI-S08-074', 'nasim.memon.s8.3@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 8, 1),
  ('Tahir Oad', 'KHI-S08-075', 'tahir.oad.s8.4@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 8, 1),
  ('Khawar Mirza', 'KHI-S08-076', 'khawar.mirza.s8.5@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 8, 1),
  ('Mansoor Rizvi', 'KHI-S08-077', 'mansoor.rizvi.s8.6@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 8, 1),
  ('Farooq Haider', 'KHI-S08-078', 'farooq.haider.s8.7@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 8, 1),
  ('Mansoor Magsi', 'KHI-S08-079', 'mansoor.magsi.s8.8@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 8, 1),
  ('Qaiser Tareen', 'KHI-S08-080', 'qaiser.tareen.s8.9@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 8, 1),
  ('Saleem Vanar', 'KHI-S09-081', 'saleem.vanar.s9.0@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 9, 1),
  ('Hamid Katohar', 'KHI-S09-082', 'hamid.katohar.s9.1@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 9, 1),
  ('Tariq Rind', 'KHI-S09-083', 'tariq.rind.s9.2@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 9, 1),
  ('Zubair Hashmi', 'KHI-S09-084', 'zubair.hashmi.s9.3@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 9, 1),
  ('Ishaq Otho', 'KHI-S09-085', 'ishaq.otho.s9.4@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 9, 1),
  ('Mubeen Rauf', 'KHI-S09-086', 'mubeen.rauf.s9.5@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 9, 1),
  ('Farooq Fatani', 'KHI-S09-087', 'farooq.fatani.s9.6@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 9, 1),
  ('Khalil Faruqi', 'KHI-S09-088', 'khalil.faruqi.s9.7@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 9, 1),
  ('Zaid Malik', 'KHI-S09-089', 'zaid.malik.s9.8@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 9, 1),
  ('Lal Umrani', 'KHI-S09-090', 'lal.umrani.s9.9@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 9, 1),
  ('Bashir Afridi', 'KHI-S10-091', 'bashir.afridi.s10.0@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 10, 1),
  ('Sajid Kakar', 'KHI-S10-092', 'sajid.kakar.s10.1@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 10, 1),
  ('Tariq Hajano', 'KHI-S10-093', 'tariq.hajano.s10.2@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 10, 1),
  ('Mubeen Dayo', 'KHI-S10-094', 'mubeen.dayo.s10.3@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 10, 1),
  ('Usman Faruqi', 'KHI-S10-095', 'usman.faruqi.s10.4@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 10, 1),
  ('Nadeem Otho', 'KHI-S10-096', 'nadeem.otho.s10.5@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 10, 1),
  ('Waqas Farooqui', 'KHI-S10-097', 'waqas.farooqui.s10.6@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 10, 1),
  ('Sajid Jafri', 'KHI-S10-098', 'sajid.jafri.s10.7@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 10, 1),
  ('Amir Essani', 'KHI-S10-099', 'amir.essani.s10.8@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 10, 1),
  ('Ghazanfar Mengal', 'KHI-S10-100', 'ghazanfar.mengal.s10.9@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 10, 1),
  ('Furqan Amrani', 'KHI-S11-101', 'furqan.amrani.s11.0@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 11, 1),
  ('Ghazanfar Vighio', 'KHI-S11-102', 'ghazanfar.vighio.s11.1@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 11, 1),
  ('Khawar Phulpoto', 'KHI-S11-103', 'khawar.phulpoto.s11.2@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 11, 1),
  ('Junaid Essani', 'KHI-S11-104', 'junaid.essani.s11.3@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 11, 1),
  ('Gulfam Swati', 'KHI-S11-105', 'gulfam.swati.s11.4@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 11, 1),
  ('Lal Essani', 'KHI-S11-106', 'lal.essani.s11.5@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 11, 1),
  ('Taimur Pirzado', 'KHI-S11-107', 'taimur.pirzado.s11.6@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 11, 1),
  ('Baber Oad', 'KHI-S11-108', 'baber.oad.s11.7@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 11, 1),
  ('Bahadur Phulpoto', 'KHI-S11-109', 'bahadur.phulpoto.s11.8@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 11, 1),
  ('Faizan Magsi', 'KHI-S11-110', 'faizan.magsi.s11.9@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 11, 1),
  ('Faizan Indhar', 'KHI-S12-111', 'faizan.indhar.s12.0@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 12, 1),
  ('Mazhar Osmani', 'KHI-S12-112', 'mazhar.osmani.s12.1@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 12, 1),
  ('Khizer Ghori', 'KHI-S12-113', 'khizer.ghori.s12.2@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 12, 1),
  ('Mobin Zardari', 'KHI-S12-114', 'mobin.zardari.s12.3@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 12, 1),
  ('Gulzar Amrani', 'KHI-S12-115', 'gulzar.amrani.s12.4@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 12, 1),
  ('Bahadur Baig', 'KHI-S12-116', 'bahadur.baig.s12.5@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 12, 1),
  ('Usman Mastoi', 'KHI-S12-117', 'usman.mastoi.s12.6@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 12, 1),
  ('Omer Rajput', 'KHI-S12-118', 'omer.rajput.s12.7@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 12, 1),
  ('Saad Wadho', 'KHI-S12-119', 'saad.wadho.s12.8@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 12, 1),
  ('Ejaz Lund', 'KHI-S12-120', 'ejaz.lund.s12.9@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 12, 1),
  ('Shakeel Ittoo', 'KHI-S13-121', 'shakeel.ittoo.s13.0@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 13, 1),
  ('Liaqat Kurd', 'KHI-S13-122', 'liaqat.kurd.s13.1@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 13, 1),
  ('Khizer Noorani', 'KHI-S13-123', 'khizer.noorani.s13.2@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 13, 1),
  ('Wajid Haider', 'KHI-S13-124', 'wajid.haider.s13.3@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 13, 1),
  ('Tahir Tareen', 'KHI-S13-125', 'tahir.tareen.s13.4@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 13, 1),
  ('Imran Channa', 'KHI-S13-126', 'imran.channa.s13.5@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 13, 1),
  ('Arif Mahsud', 'KHI-S13-127', 'arif.mahsud.s13.6@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 13, 1),
  ('Dawood Pato', 'KHI-S13-128', 'dawood.pato.s13.7@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 13, 1),
  ('Wahid Jokhio', 'KHI-S13-129', 'wahid.jokhio.s13.8@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 13, 1),
  ('Moeed Mirani', 'KHI-S13-130', 'moeed.mirani.s13.9@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 13, 1),
  ('Dawood Balouch', 'KHI-S14-131', 'dawood.balouch.s14.0@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 14, 1),
  ('Qasim Thaheem', 'KHI-S14-132', 'qasim.thaheem.s14.1@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 14, 1),
  ('Bilal Dahri', 'KHI-S14-133', 'bilal.dahri.s14.2@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 14, 1),
  ('Ghulam Pato', 'KHI-S14-134', 'ghulam.pato.s14.3@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 14, 1),
  ('Daniyal Thebo', 'KHI-S14-135', 'daniyal.thebo.s14.4@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 14, 1),
  ('Khawaja Rahu', 'KHI-S14-136', 'khawaja.rahu.s14.5@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 14, 1),
  ('Siraj Pirzada', 'KHI-S14-137', 'siraj.pirzada.s14.6@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 14, 1),
  ('Obaid Soomro', 'KHI-S14-138', 'obaid.soomro.s14.7@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 14, 1),
  ('Vikar Ansari', 'KHI-S14-139', 'vikar.ansari.s14.8@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 14, 1),
  ('Murad Fatani', 'KHI-S14-140', 'murad.fatani.s14.9@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 14, 1),
  ('Nabeel Awan', 'KHI-S15-141', 'nabeel.awan.s15.0@gmail.com', 'SI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 15, 1),
  ('Imran Otho', 'KHI-S15-142', 'imran.otho.s15.1@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 15, 1),
  ('Irfan Nawab', 'KHI-S15-143', 'irfan.nawab.s15.2@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 15, 1),
  ('Ahsan Thebo', 'KHI-S15-144', 'ahsan.thebo.s15.3@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 15, 1),
  ('Ijaz Pirzada', 'KHI-S15-145', 'ijaz.pirzada.s15.4@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 15, 1),
  ('Liakat Pirzada', 'KHI-S15-146', 'liakat.pirzada.s15.5@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 15, 1),
  ('Liaqat Rahu', 'KHI-S15-147', 'liaqat.rahu.s15.6@gmail.com', 'ASI', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 15, 1),
  ('Furqan Farooqui', 'KHI-S15-148', 'furqan.farooqui.s15.7@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 15, 1),
  ('Ijaz Mirani', 'KHI-S15-149', 'ijaz.mirani.s15.8@gmail.com', 'Inspector', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 15, 1),
  ('Rizwan Hajano', 'KHI-S15-150', 'rizwan.hajano.s15.9@gmail.com', 'DSP', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 0, 1, 15, 1);

-- -----------------------------------------------------------
-- COMPLAINTS (50)
-- -----------------------------------------------------------
INSERT INTO complaints (reference_number, cnic, station_id, category_id, subcategory_id, incident_area, incident_landmark, incident_date, incident_time, description, has_witnesses, status) VALUES
  ('PICMS-2025-00001', '4210198765432', 1, 6, 12, 'Clifton', 'Opposite Agha Khan Hospital', '2025-11-26', '02:45:00', 'I discovered unauthorized transactions from my bank account totaling Rs. 45,000.', 0, 'Under Review'),
  ('PICMS-2025-00002', '4210145678901', 2, 10, NULL, 'DHA Phase 4', 'Behind KFC', '2025-05-04', '15:45:00', 'My vehicle was stolen from outside my house during the night.', 0, 'Accepted'),
  ('PICMS-2025-00003', '4210187654321', 3, 9, 16, 'Gulshan Block 3', 'Near City Court', '2025-04-19', '22:30:00', 'I have been receiving threatening calls from unknown numbers for the past week.', 1, 'Rejected'),
  ('PICMS-2025-00004', '4210156789012', 4, 1, 4, 'Saddar', 'Opposite Dolmen Mall', '2025-04-09', '18:00:00', 'My shop was broken into and cash and electronics worth Rs. 200,000 were stolen.', 1, 'Officer Assigned'),
  ('PICMS-2025-00005', '4210134567890', 5, 7, 13, 'Korangi', 'Near Metropole Hotel', '2025-11-19', '09:45:00', 'Online fraudster posed as a government official and took money from me.', 1, 'Investigation Ongoing'),
  ('PICMS-2025-00006', '4210123456789', 6, 6, 12, 'North Nazimabad', 'Behind Numaish', '2025-09-11', '04:30:00', 'Physical assault occurred during a dispute with my neighbor resulting in injuries.', 1, 'Resolved'),
  ('PICMS-2025-00007', '4210190123456', 7, 1, 4, 'Malir City', 'Near Mazar-e-Quaid', '2025-09-12', '00:00:00', 'My family member has been missing for three days and we cannot locate them.', 0, 'Closed'),
  ('PICMS-2025-00008', '4210178901234', 8, 2, 7, 'Orangi Town', 'Opposite Empress Market', '2025-02-07', '22:15:00', 'There is an ongoing land dispute with adjacent plot owner who built on my property.', 0, 'Withdrawn'),
  ('PICMS-2025-00009', '4210167890123', 9, 8, NULL, 'Landhi', 'Near Karsaz', '2025-10-27', '14:00:00', 'Workplace harassment by supervisor despite multiple verbal complaints to management.', 0, 'Submitted'),
  ('PICMS-2025-00010', '4210112378901', 10, 8, NULL, 'Baldia Town', 'Behind PAF Base', '2025-09-21', '17:00:00', 'I was robbed at gunpoint near the market area and my belongings were taken.', 0, 'Under Review'),
  ('PICMS-2025-00011', '4210198712345', 11, 7, 14, 'SITE Area', 'Near Civic Centre', '2025-07-14', '23:45:00', 'Domestic dispute has escalated and I fear for my safety and that of my children.', 0, 'Accepted'),
  ('PICMS-2025-00012', '4210145634567', 12, 8, NULL, 'Lyari', 'Near Bilawal House', '2025-11-18', '05:00:00', 'Drug peddling activity is happening near the school in our locality.', 0, 'Rejected'),
  ('PICMS-2025-00013', '4210187623456', 13, 4, NULL, 'Kemari', 'Opposite Agha Khan Hospital', '2025-07-01', '16:45:00', 'My car was damaged deliberately by my neighbor during a heated argument.', 1, 'Officer Assigned'),
  ('PICMS-2025-00014', '4210156712345', 14, 9, 15, 'Garden Road', 'Behind KFC', '2025-09-13', '09:30:00', 'Identity theft - someone opened credit accounts using my CNIC without consent.', 1, 'Investigation Ongoing'),
  ('PICMS-2025-00015', '4210134523456', 15, 2, 7, 'Frere Town', 'Near City Court', '2025-03-14', '10:45:00', 'My mobile phone was snatched by two men on a motorcycle near the main road.', 0, 'Resolved'),
  ('PICMS-2025-00016', '4210123412345', 1, 8, NULL, 'Clifton', 'Opposite Dolmen Mall', '2025-04-05', '11:30:00', 'I discovered unauthorized transactions from my bank account totaling Rs. 45,000.', 1, 'Closed'),
  ('PICMS-2025-00017', '4210190112345', 2, 6, 11, 'DHA Phase 4', 'Near Metropole Hotel', '2025-09-21', '10:30:00', 'My vehicle was stolen from outside my house during the night.', 1, 'Withdrawn'),
  ('PICMS-2025-00018', '4210178823456', 3, 4, NULL, 'Gulshan Block 3', 'Behind Numaish', '2025-03-03', '01:30:00', 'I have been receiving threatening calls from unknown numbers for the past week.', 0, 'Submitted'),
  ('PICMS-2025-00019', '4210167756789', 4, 3, 10, 'Saddar', 'Near Mazar-e-Quaid', '2025-02-09', '11:15:00', 'My shop was broken into and cash and electronics worth Rs. 200,000 were stolen.', 1, 'Under Review'),
  ('PICMS-2025-00020', '4210112399001', 5, 8, NULL, 'Korangi', 'Opposite Empress Market', '2025-04-15', '10:00:00', 'Online fraudster posed as a government official and took money from me.', 0, 'Accepted'),
  ('PICMS-2025-00021', '4210198766789', 6, 2, 7, 'North Nazimabad', 'Near Karsaz', '2025-09-06', '09:00:00', 'Physical assault occurred during a dispute with my neighbor resulting in injuries.', 1, 'Rejected'),
  ('PICMS-2025-00022', '4210145601234', 7, 6, 12, 'Malir City', 'Behind PAF Base', '2025-10-22', '11:45:00', 'My family member has been missing for three days and we cannot locate them.', 1, 'Officer Assigned'),
  ('PICMS-2025-00023', '4210187698765', 8, 5, NULL, 'Orangi Town', 'Near Civic Centre', '2025-11-08', '07:00:00', 'There is an ongoing land dispute with adjacent plot owner who built on my property.', 1, 'Investigation Ongoing'),
  ('PICMS-2025-00024', '4210156745678', 9, 2, 7, 'Landhi', 'Near Bilawal House', '2025-01-27', '20:00:00', 'Workplace harassment by supervisor despite multiple verbal complaints to management.', 0, 'Resolved'),
  ('PICMS-2025-00025', '4210134556789', 10, 1, 3, 'Baldia Town', 'Opposite Agha Khan Hospital', '2025-11-01', '02:45:00', 'I was robbed at gunpoint near the market area and my belongings were taken.', 0, 'Closed'),
  ('PICMS-2025-00026', '4210123467890', 11, 3, 8, 'SITE Area', 'Behind KFC', '2025-08-26', '16:15:00', 'Domestic dispute has escalated and I fear for my safety and that of my children.', 1, 'Withdrawn'),
  ('PICMS-2025-00027', '4210190134567', 12, 1, 2, 'Lyari', 'Near City Court', '2025-02-10', '14:45:00', 'Drug peddling activity is happening near the school in our locality.', 1, 'Submitted'),
  ('PICMS-2025-00028', '4210178856789', 13, 6, 12, 'Kemari', 'Opposite Dolmen Mall', '2025-02-07', '19:45:00', 'My car was damaged deliberately by my neighbor during a heated argument.', 1, 'Under Review'),
  ('PICMS-2025-00029', '4210167789012', 14, 1, 4, 'Garden Road', 'Near Metropole Hotel', '2025-11-07', '08:30:00', 'Identity theft - someone opened credit accounts using my CNIC without consent.', 1, 'Accepted'),
  ('PICMS-2025-00030', '4210112311111', 15, 1, 4, 'Frere Town', 'Behind Numaish', '2025-04-10', '02:00:00', 'My mobile phone was snatched by two men on a motorcycle near the main road.', 0, 'Rejected'),
  ('PICMS-2025-00031', '4210198722222', 1, 2, 6, 'Clifton', 'Near Mazar-e-Quaid', '2025-01-26', '03:15:00', 'I discovered unauthorized transactions from my bank account totaling Rs. 45,000.', 1, 'Officer Assigned'),
  ('PICMS-2025-00032', '4210145633333', 2, 6, 11, 'DHA Phase 4', 'Opposite Empress Market', '2025-12-09', '00:45:00', 'My vehicle was stolen from outside my house during the night.', 1, 'Investigation Ongoing'),
  ('PICMS-2025-00033', '4210187644444', 3, 1, 4, 'Gulshan Block 3', 'Near Karsaz', '2025-12-19', '15:45:00', 'I have been receiving threatening calls from unknown numbers for the past week.', 1, 'Resolved'),
  ('PICMS-2025-00034', '4210156755555', 4, 7, 13, 'Saddar', 'Behind PAF Base', '2025-04-06', '14:00:00', 'My shop was broken into and cash and electronics worth Rs. 200,000 were stolen.', 1, 'Closed'),
  ('PICMS-2025-00035', '4210134566666', 5, 1, 2, 'Korangi', 'Near Civic Centre', '2025-11-05', '03:00:00', 'Online fraudster posed as a government official and took money from me.', 1, 'Withdrawn'),
  ('PICMS-2025-00036', '4210123477777', 6, 8, NULL, 'North Nazimabad', 'Near Bilawal House', '2025-05-14', '10:00:00', 'Physical assault occurred during a dispute with my neighbor resulting in injuries.', 1, 'Submitted'),
  ('PICMS-2025-00037', '4210190188888', 7, 10, NULL, 'Malir City', 'Opposite Agha Khan Hospital', '2025-07-27', '07:15:00', 'My family member has been missing for three days and we cannot locate them.', 1, 'Under Review'),
  ('PICMS-2025-00038', '4210178899999', 8, 7, 13, 'Orangi Town', 'Behind KFC', '2025-09-08', '22:00:00', 'There is an ongoing land dispute with adjacent plot owner who built on my property.', 0, 'Accepted'),
  ('PICMS-2025-00039', '4210167700001', 9, 8, NULL, 'Landhi', 'Near City Court', '2025-07-23', '01:00:00', 'Workplace harassment by supervisor despite multiple verbal complaints to management.', 0, 'Rejected'),
  ('PICMS-2025-00040', '4210112300002', 10, 1, 3, 'Baldia Town', 'Opposite Dolmen Mall', '2025-01-17', '16:15:00', 'I was robbed at gunpoint near the market area and my belongings were taken.', 0, 'Officer Assigned'),
  ('PICMS-2025-00041', '4210198700003', 11, 10, NULL, 'SITE Area', 'Near Metropole Hotel', '2025-10-22', '20:45:00', 'Domestic dispute has escalated and I fear for my safety and that of my children.', 1, 'Investigation Ongoing'),
  ('PICMS-2025-00042', '4210145600004', 12, 6, 12, 'Lyari', 'Behind Numaish', '2025-09-08', '15:45:00', 'Drug peddling activity is happening near the school in our locality.', 1, 'Resolved'),
  ('PICMS-2025-00043', '4210187600005', 13, 1, 2, 'Kemari', 'Near Mazar-e-Quaid', '2025-07-27', '00:30:00', 'My car was damaged deliberately by my neighbor during a heated argument.', 0, 'Closed'),
  ('PICMS-2025-00044', '4210156700006', 14, 4, NULL, 'Garden Road', 'Opposite Empress Market', '2025-02-17', '22:30:00', 'Identity theft - someone opened credit accounts using my CNIC without consent.', 0, 'Withdrawn'),
  ('PICMS-2025-00045', '4210134500007', 15, 4, NULL, 'Frere Town', 'Near Karsaz', '2025-01-24', '23:00:00', 'My mobile phone was snatched by two men on a motorcycle near the main road.', 0, 'Submitted'),
  ('PICMS-2025-00046', '4210123400008', 1, 9, 16, 'Clifton', 'Behind PAF Base', '2025-06-13', '00:00:00', 'I discovered unauthorized transactions from my bank account totaling Rs. 45,000.', 1, 'Under Review'),
  ('PICMS-2025-00047', '4210190100009', 2, 6, 12, 'DHA Phase 4', 'Near Civic Centre', '2025-02-22', '16:45:00', 'My vehicle was stolen from outside my house during the night.', 1, 'Accepted'),
  ('PICMS-2025-00048', '4210178800010', 3, 4, NULL, 'Gulshan Block 3', 'Near Bilawal House', '2025-01-05', '03:45:00', 'I have been receiving threatening calls from unknown numbers for the past week.', 1, 'Rejected'),
  ('PICMS-2025-00049', '4210167700011', 4, 8, NULL, 'Saddar', 'Opposite Agha Khan Hospital', '2025-02-08', '18:15:00', 'My shop was broken into and cash and electronics worth Rs. 200,000 were stolen.', 0, 'Officer Assigned'),
  ('PICMS-2025-00050', '4210112345671', 5, 6, 11, 'Korangi', 'Behind KFC', '2025-12-25', '09:00:00', 'Online fraudster posed as a government official and took money from me.', 1, 'Investigation Ongoing');

SET foreign_key_checks=1;

-- Summary:
-- Citizens: 50
-- Officers: 150 (10 per station x 15 stations, all Investigating Officers)
-- Complaints: 50
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
    requested_by   VARCHAR(15) NOT NULL, --this is redundant
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

--yeh change hua hai
CREATE TABLE appointments (
    appointment_id      INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id        INT NOT NULL,
    sho_id              INT NOT NULL,
    schedule_id         INT NOT NULL,
    location            VARCHAR(255) NULL,
    status              ENUM('Pending','Accepted','Completed','Cancelled') DEFAULT 'Pending',
    cancellation_reason VARCHAR(255) NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id)
        ON DELETE CASCADE,
    FOREIGN KEY (sho_id)       REFERENCES officers(officer_id),
    FOREIGN KEY (schedule_id)  REFERENCES sho_schedule(schedule_id)
);

--this added view
CREATE VIEW vw_appointment_details AS
SELECT
    a.appointment_id,
    a.complaint_id,
    a.sho_id,
    a.schedule_id,
    a.location,
    a.status,
    a.cancellation_reason,
    a.created_at,
    c.reference_number,
    c.cnic,
    c.station_id,
    c.status AS complaint_status,
    s.station_name,
    ss.scheduled_date,
    ss.start_time,
    ss.end_time,
    TIMESTAMP(ss.scheduled_date, ss.start_time) AS scheduled_at,
    TIMESTAMP(ss.scheduled_date, ss.end_time)   AS scheduled_end_at,
    COALESCE((
        SELECT COUNT(*)
        FROM appointments ap2
        WHERE ap2.complaint_id = a.complaint_id
          AND ap2.status = 'Cancelled'
    ), 0) AS miss_count
FROM appointments a
JOIN complaints c
  ON c.complaint_id = a.complaint_id
JOIN stations s
  ON s.station_id = c.station_id
JOIN sho_schedule ss
  ON ss.schedule_id = a.schedule_id;

-- Unified case listing view for admin/SHO/IO reporting
CREATE VIEW vw_case_overview AS
SELECT
    c.complaint_id,
    c.reference_number,
    c.cnic,
    c.station_id,
    s.station_name,
    c.category_id,
    cc.category_name,
    c.subcategory_id,
    csc.subcategory_name,
    c.incident_area,
    c.incident_date,
    c.status,
    cc.is_urgent,
    c.submitted_at,
    ca.officer_id AS current_officer_id,
    o.full_name   AS current_officer_name,
    o.badge_number AS current_officer_badge
FROM complaints c
JOIN stations s
  ON s.station_id = c.station_id
JOIN complaint_categories cc
  ON cc.category_id = c.category_id
LEFT JOIN complaint_subcategories csc
  ON csc.subcategory_id = c.subcategory_id
LEFT JOIN case_assignments ca
  ON ca.complaint_id = c.complaint_id
 AND ca.is_current = 1
LEFT JOIN officers o
  ON o.officer_id = ca.officer_id;

-- Superintendent-focused detainee + case + cell snapshot
CREATE VIEW vw_detainee_overview AS
SELECT
    d.detainee_id,
    d.station_id,
    s.station_name,
    d.cnic,
    d.d_fname,
    d.d_minit,
    d.d_lname,
    d.gender,
    d.age,
    d.admission_date,
    d.release_date,
    d.purpose_of_admission,
    jc.cell_id,
    jc.cell_code,
    jc.gender AS cell_gender,
    jc.capacity AS cell_capacity,
    c.complaint_id,
    c.reference_number,
    c.status AS complaint_status
FROM detainees d
JOIN stations s
  ON s.station_id = d.station_id
LEFT JOIN jail_cells jc
  ON jc.cell_id = d.cell_id
LEFT JOIN complaints c
  ON c.complaint_id = d.complaint_id;

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
--one trigger is removedd
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

-- 6. Retire old case assignment when new one inserted
CREATE TRIGGER before_case_reassign
BEFORE INSERT ON case_assignments
FOR EACH ROW
BEGIN
    UPDATE case_assignments
    SET is_current = 0, removed_at = NOW()
    WHERE complaint_id = NEW.complaint_id AND is_current = 1;
END$$

DELIMITER ;

DELIMITER $$
-- Safely assign/reassign an Investigating Officer to a complaint in the same station
CREATE PROCEDURE sp_assign_officer_to_case (
    IN p_complaint_id INT,
    IN p_officer_id   INT,
    IN p_assigned_by  INT
)
BEGIN
    DECLARE v_station_id INT;
    DECLARE v_officer_station_id INT;
    DECLARE v_officer_role_id INT;
    DECLARE v_officer_active TINYINT(1);

    SELECT station_id
      INTO v_station_id
      FROM complaints
     WHERE complaint_id = p_complaint_id
     LIMIT 1;

    IF v_station_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid complaint_id.';
    END IF;

    SELECT station_id, role_id, is_active
      INTO v_officer_station_id, v_officer_role_id, v_officer_active
      FROM officers
     WHERE officer_id = p_officer_id
     LIMIT 1;

    IF v_officer_station_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid officer_id.';
    END IF;

    IF v_officer_station_id <> v_station_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Officer must belong to the same station as complaint.';
    END IF;

    IF v_officer_role_id <> 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only Investigating Officers can be assigned.';
    END IF;

    IF v_officer_active <> 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Officer is not active.';
    END IF;

    INSERT INTO case_assignments (complaint_id, officer_id, assigned_by, is_current)
    VALUES (p_complaint_id, p_officer_id, p_assigned_by, 1);

    UPDATE complaints
       SET status = 'Officer Assigned'
     WHERE complaint_id = p_complaint_id
       AND status IN ('Accepted', 'Under Review', 'Submitted', 'Investigation Ongoing');
END$$

-- Station dashboard stats in one query (for admin/SHO/superintendent reporting)
CREATE PROCEDURE sp_get_station_dashboard_stats (
    IN p_station_id INT
)
BEGIN
    SELECT
        p_station_id AS station_id,
        (SELECT COUNT(*) FROM complaints WHERE station_id = p_station_id) AS total_complaints,
        (SELECT COUNT(*) FROM complaints WHERE station_id = p_station_id AND status IN ('Submitted','Under Review','Accepted','Officer Assigned','Investigation Ongoing','Withdrawal Pending')) AS open_complaints,
        (SELECT COUNT(*) FROM complaints WHERE station_id = p_station_id AND status IN ('Resolved','Closed','Withdrawn','Rejected')) AS closed_complaints,
        (SELECT COUNT(*) FROM appointments a JOIN complaints c ON c.complaint_id = a.complaint_id WHERE c.station_id = p_station_id AND a.status = 'Pending') AS pending_appointments,
        (SELECT COUNT(*) FROM detainees WHERE station_id = p_station_id AND release_date IS NULL) AS active_detainees,
        (SELECT COUNT(*) FROM jail_cells WHERE station_id = p_station_id) AS total_cells;
END$$

DELIMITER ;

-- Additional reporting views
DROP VIEW IF EXISTS vw_station_case_stats;
CREATE VIEW vw_station_case_stats AS
SELECT
    s.station_id,
    s.station_name,
    COUNT(c.complaint_id) AS total_cases,
    SUM(
        CASE
            WHEN c.status IN ('Submitted', 'Under Review', 'Accepted', 'Officer Assigned', 'Investigation Ongoing', 'Withdrawal Pending')
            THEN 1 ELSE 0
        END
    ) AS open_cases,
    SUM(
        CASE
            WHEN c.status IN ('Resolved', 'Closed', 'Withdrawn', 'Rejected')
            THEN 1 ELSE 0
        END
    ) AS closed_cases
FROM stations s
LEFT JOIN complaints c
  ON c.station_id = s.station_id
GROUP BY s.station_id, s.station_name;

DROP VIEW IF EXISTS vw_officer_workload;
CREATE VIEW vw_officer_workload AS
SELECT
    o.officer_id,
    o.full_name,
    o.badge_number,
    o.station_id,
    s.station_name,
    o.role_id,
    o.is_active,
    COUNT(
        CASE
            WHEN ca.is_current = 1 THEN ca.assignment_id
            ELSE NULL
        END
    ) AS active_cases
FROM officers o
LEFT JOIN stations s
  ON s.station_id = o.station_id
LEFT JOIN case_assignments ca
  ON ca.officer_id = o.officer_id
GROUP BY
    o.officer_id,
    o.full_name,
    o.badge_number,
    o.station_id,
    s.station_name,
    o.role_id,
    o.is_active;

DROP VIEW IF EXISTS vw_hearing_calendar;
CREATE VIEW vw_hearing_calendar AS
SELECT
    h.hearing_id,
    h.hearing_date,
    h.hearing_time,
    h.hearing_type,
    h.court_name,
    h.result,
    h.next_hearing_date,
    d.detainee_id,
    d.station_id,
    s.station_name,
    CONCAT(d.d_fname, ' ', COALESCE(d.d_minit, ''), ' ', d.d_lname) AS detainee_name,
    c.complaint_id,
    c.reference_number
FROM court_hearings h
JOIN detainees d
  ON d.detainee_id = h.detainee_id
JOIN stations s
  ON s.station_id = d.station_id
LEFT JOIN complaints c
  ON c.complaint_id = h.complaint_id;

DELIMITER $$

-- Add withdrawal request with validation and status sync
CREATE PROCEDURE sp_submit_withdrawal_request (
    IN p_complaint_id INT,
    IN p_requested_by VARCHAR(15),
    IN p_reason TEXT
)
BEGIN
    DECLARE v_owner_cnic VARCHAR(15);
    DECLARE v_existing_pending INT DEFAULT 0;

    SELECT cnic
      INTO v_owner_cnic
      FROM complaints
     WHERE complaint_id = p_complaint_id
     LIMIT 1;

    IF v_owner_cnic IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid complaint_id.';
    END IF;

    IF v_owner_cnic <> p_requested_by THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only complaint owner can request withdrawal.';
    END IF;

    SELECT COUNT(*)
      INTO v_existing_pending
      FROM withdrawal_requests
     WHERE complaint_id = p_complaint_id
       AND status = 'Pending';

    IF v_existing_pending > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A pending withdrawal request already exists.';
    END IF;

    INSERT INTO withdrawal_requests (complaint_id, requested_by, reason, status)
    VALUES (p_complaint_id, p_requested_by, p_reason, 'Pending');

    UPDATE complaints
       SET status = 'Withdrawal Pending'
     WHERE complaint_id = p_complaint_id
       AND status NOT IN ('Withdrawn', 'Closed');
END$$

-- Assign detainee to jail cell with station/gender/capacity checks
CREATE PROCEDURE sp_assign_detainee_cell (
    IN p_detainee_id INT,
    IN p_cell_id INT,
    IN p_officer_id INT
)
BEGIN
    DECLARE v_detainee_station_id INT;
    DECLARE v_detainee_gender VARCHAR(10);
    DECLARE v_cell_station_id INT;
    DECLARE v_cell_gender VARCHAR(10);
    DECLARE v_cell_capacity INT;
    DECLARE v_current_occupancy INT;

    SELECT station_id, gender
      INTO v_detainee_station_id, v_detainee_gender
      FROM detainees
     WHERE detainee_id = p_detainee_id
     LIMIT 1;

    IF v_detainee_station_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid detainee_id.';
    END IF;

    SELECT station_id, gender, capacity
      INTO v_cell_station_id, v_cell_gender, v_cell_capacity
      FROM jail_cells
     WHERE cell_id = p_cell_id
     LIMIT 1;

    IF v_cell_station_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid cell_id.';
    END IF;

    IF v_detainee_station_id <> v_cell_station_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Detainee and cell must belong to the same station.';
    END IF;

    IF v_detainee_gender <> v_cell_gender THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cell gender does not match detainee gender.';
    END IF;

    SELECT COUNT(*)
      INTO v_current_occupancy
      FROM detainees
     WHERE cell_id = p_cell_id
       AND release_date IS NULL;

    IF v_current_occupancy >= v_cell_capacity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cell capacity reached.';
    END IF;

    UPDATE detainees
       SET cell_id = p_cell_id,
           admitted_by = p_officer_id
     WHERE detainee_id = p_detainee_id;
END$$

-- Read-only station-level open cases list
CREATE PROCEDURE sp_get_station_open_cases (
    IN p_station_id INT
)
BEGIN
    SELECT
        complaint_id,
        reference_number,
        station_id,
        station_name,
        category_id,
        category_name,
        current_officer_id,
        current_officer_name,
        status,
        submitted_at
    FROM vw_case_overview
    WHERE station_id = p_station_id
      AND status IN ('Submitted', 'Under Review', 'Accepted', 'Officer Assigned', 'Investigation Ongoing', 'Withdrawal Pending')
    ORDER BY submitted_at DESC;
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

-- admin password Admin@1234

INSERT INTO admin (full_name, badge_number, email, password_hash, password_changed)
VALUES (
'Ahmed Shah',
  'ADMIN-001',
  'policechief.karachi.picms@gmail.com',
  '$2y$10$qWrVbknbGINiSbVvuFdDF.KfK/IOHTBGbfkZy.PB0WWbTR7nqRP5y',
  1
); 
set foreign_key_checks=1;
-- i have run everything till here

-- ============================================================
-- TEST DATA: Citizens, Officers (Investigating), Complaints
-- Password for all: password (bcrypt hash)
-- ============================================================

SET foreign_key_checks=0;

-- -----------------------------------------------------------
-- CITIZENS (50)
-- -----------------------------------------------------------
INSERT INTO citizens (cnic, c_fname, c_minit, c_lname, email, password_hash, is_verified) VALUES
  ('4210112345671', 'Ali', 'M', 'Khan', 'ali.khan.pkr@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210198765432', 'Fatima', 'A', 'Siddiqui', 'fatima.siddiqui.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210145678901', 'Muhammad', 'R', 'Ahmed', 'm.ahmed.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210187654321', 'Ayesha', NULL, 'Naveed', 'ayesha.naveed3@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210156789012', 'Usman', 'T', 'Malik', 'usman.malik.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210134567890', 'Sana', 'B', 'Raza', 'sana.raza.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210123456789', 'Hassan', NULL, 'Qureshi', 'hassan.qureshi.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210190123456', 'Nadia', 'S', 'Shaikh', 'nadia.shaikh.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210178901234', 'Bilal', 'M', 'Chaudhry', 'bilal.chaudhry.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210167890123', 'Rabia', NULL, 'Ansari', 'rabia.ansari.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210112378901', 'Tariq', 'A', 'Javed', 'tariq.javed.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210198712345', 'Amna', 'Z', 'Iqbal', 'amna.iqbal.pkr@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210145634567', 'Imran', NULL, 'Sheikh', 'imran.sheikh.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210187623456', 'Zainab', 'F', 'Ali', 'zainab.ali.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210156712345', 'Kamran', 'H', 'Baig', 'kamran.baig.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210134523456', 'Hina', NULL, 'Mirza', 'hina.mirza.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210123412345', 'Asad', 'R', 'Butt', 'asad.butt.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210190112345', 'Lubna', 'M', 'Hussain', 'lubna.hussain.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210178823456', 'Faisal', NULL, 'Naqvi', 'faisal.naqvi.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210167756789', 'Madiha', 'A', 'Gondal', 'madiha.gondal.pkr@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210112399001', 'Omer', 'S', 'Farooq', 'omer.farooq.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210198766789', 'Samina', NULL, 'Khatri', 'samina.khatri.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210145601234', 'Zahid', 'T', 'Hashmi', 'zahid.hashmi.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210187698765', 'Noman', NULL, 'Lodhi', 'noman.lodhi.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210156745678', 'Farah', 'B', 'Niazi', 'farah.niazi.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210134556789', 'Waqas', 'M', 'Rajput', 'waqas.rajput.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210123467890', 'Aisha', NULL, 'Bhatti', 'aisha.bhatti.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210190134567', 'Nasir', 'A', 'Warsi', 'nasir.warsi.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210178856789', 'Sobia', 'F', 'Kazmi', 'sobia.kazmi.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210167789012', 'Adnan', NULL, 'Saeed', 'adnan.saeed.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210112311111', 'Uzma', 'R', 'Gillani', 'uzma.gillani.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210198722222', 'Shahzad', NULL, 'Awan', 'shahzad.awan.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210145633333', 'Huma', 'M', 'Bokhari', 'huma.bokhari.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210187644444', 'Rehan', 'A', 'Soomro', 'rehan.soomro.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210156755555', 'Saira', NULL, 'Tunio', 'saira.tunio.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210134566666', 'Danish', 'Z', 'Phulpoto', 'danish.phulpoto.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210123477777', 'Fiza', NULL, 'Memon', 'fiza.memon.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210190188888', 'Junaid', 'S', 'Murtaza', 'junaid.murtaza.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210178899999', 'Sadaf', 'M', 'Rauf', 'sadaf.rauf.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210167700001', 'Khurram', NULL, 'Shafiq', 'khurram.shafiq.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210112300002', 'Naila', 'A', 'Waheed', 'naila.waheed.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210198700003', 'Asif', NULL, 'Zafar', 'asif.zafar.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210145600004', 'Qurat', 'B', 'Ul Ain', 'qurat.ulain.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210187600005', 'Waqar', 'M', 'Sultan', 'waqar.sultan.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210156700006', 'Afshan', NULL, 'Yousuf', 'afshan.yousuf.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210134500007', 'Naveed', 'R', 'Chattha', 'naveed.chattha.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210123400008', 'Shazia', NULL, 'Pirzada', 'shazia.pirzada.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210190100009', 'Raza', 'T', 'Haider', 'raza.haider.khi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210178800010', 'Abida', 'F', 'Shaheen', 'abida.shaheen.karachi@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1),
  ('4210167700011', 'Salman', NULL, 'Dar', 'salman.dar.pk@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1);


-- -----------------------------------------------------------
-- COMPLAINTS (50)
-- -----------------------------------------------------------
INSERT INTO complaints (reference_number, cnic, station_id, category_id, subcategory_id, incident_area, incident_landmark, incident_date, incident_time, description, has_witnesses, status) VALUES
  ('PICMS-2025-00001', '4210198765432', 1, 6, 12, 'Clifton', 'Opposite Agha Khan Hospital', '2025-11-26', '02:45:00', 'I discovered unauthorized transactions from my bank account totaling Rs. 45,000.', 0, 'Under Review'),
  ('PICMS-2025-00002', '4210145678901', 2, 10, NULL, 'DHA Phase 4', 'Behind KFC', '2025-05-04', '15:45:00', 'My vehicle was stolen from outside my house during the night.', 0, 'Accepted'),
  ('PICMS-2025-00003', '4210187654321', 3, 9, 16, 'Gulshan Block 3', 'Near City Court', '2025-04-19', '22:30:00', 'I have been receiving threatening calls from unknown numbers for the past week.', 1, 'Rejected'),
  ('PICMS-2025-00004', '4210156789012', 4, 1, 4, 'Saddar', 'Opposite Dolmen Mall', '2025-04-09', '18:00:00', 'My shop was broken into and cash and electronics worth Rs. 200,000 were stolen.', 1, 'Officer Assigned'),
  ('PICMS-2025-00005', '4210134567890', 5, 7, 13, 'Korangi', 'Near Metropole Hotel', '2025-11-19', '09:45:00', 'Online fraudster posed as a government official and took money from me.', 1, 'Investigation Ongoing'),
  ('PICMS-2025-00006', '4210123456789', 6, 6, 12, 'North Nazimabad', 'Behind Numaish', '2025-09-11', '04:30:00', 'Physical assault occurred during a dispute with my neighbor resulting in injuries.', 1, 'Resolved'),
  ('PICMS-2025-00007', '4210190123456', 7, 1, 4, 'Malir City', 'Near Mazar-e-Quaid', '2025-09-12', '00:00:00', 'My family member has been missing for three days and we cannot locate them.', 0, 'Closed'),
  ('PICMS-2025-00008', '4210178901234', 8, 2, 7, 'Orangi Town', 'Opposite Empress Market', '2025-02-07', '22:15:00', 'There is an ongoing land dispute with adjacent plot owner who built on my property.', 0, 'Withdrawn'),
  ('PICMS-2025-00009', '4210167890123', 9, 8, NULL, 'Landhi', 'Near Karsaz', '2025-10-27', '14:00:00', 'Workplace harassment by supervisor despite multiple verbal complaints to management.', 0, 'Submitted'),
  ('PICMS-2025-00010', '4210112378901', 10, 8, NULL, 'Baldia Town', 'Behind PAF Base', '2025-09-21', '17:00:00', 'I was robbed at gunpoint near the market area and my belongings were taken.', 0, 'Under Review'),
  ('PICMS-2025-00011', '4210198712345', 11, 7, 14, 'SITE Area', 'Near Civic Centre', '2025-07-14', '23:45:00', 'Domestic dispute has escalated and I fear for my safety and that of my children.', 0, 'Accepted'),
  ('PICMS-2025-00012', '4210145634567', 12, 8, NULL, 'Lyari', 'Near Bilawal House', '2025-11-18', '05:00:00', 'Drug peddling activity is happening near the school in our locality.', 0, 'Rejected'),
  ('PICMS-2025-00013', '4210187623456', 13, 4, NULL, 'Kemari', 'Opposite Agha Khan Hospital', '2025-07-01', '16:45:00', 'My car was damaged deliberately by my neighbor during a heated argument.', 1, 'Officer Assigned'),
  ('PICMS-2025-00014', '4210156712345', 14, 9, 15, 'Garden Road', 'Behind KFC', '2025-09-13', '09:30:00', 'Identity theft - someone opened credit accounts using my CNIC without consent.', 1, 'Investigation Ongoing'),
  ('PICMS-2025-00015', '4210134523456', 15, 2, 7, 'Frere Town', 'Near City Court', '2025-03-14', '10:45:00', 'My mobile phone was snatched by two men on a motorcycle near the main road.', 0, 'Resolved'),
  ('PICMS-2025-00016', '4210123412345', 1, 8, NULL, 'Clifton', 'Opposite Dolmen Mall', '2025-04-05', '11:30:00', 'I discovered unauthorized transactions from my bank account totaling Rs. 45,000.', 1, 'Closed'),
  ('PICMS-2025-00017', '4210190112345', 2, 6, 11, 'DHA Phase 4', 'Near Metropole Hotel', '2025-09-21', '10:30:00', 'My vehicle was stolen from outside my house during the night.', 1, 'Withdrawn'),
  ('PICMS-2025-00018', '4210178823456', 3, 4, NULL, 'Gulshan Block 3', 'Behind Numaish', '2025-03-03', '01:30:00', 'I have been receiving threatening calls from unknown numbers for the past week.', 0, 'Submitted'),
  ('PICMS-2025-00019', '4210167756789', 4, 3, 10, 'Saddar', 'Near Mazar-e-Quaid', '2025-02-09', '11:15:00', 'My shop was broken into and cash and electronics worth Rs. 200,000 were stolen.', 1, 'Under Review'),
  ('PICMS-2025-00020', '4210112399001', 5, 8, NULL, 'Korangi', 'Opposite Empress Market', '2025-04-15', '10:00:00', 'Online fraudster posed as a government official and took money from me.', 0, 'Accepted'),
  ('PICMS-2025-00021', '4210198766789', 6, 2, 7, 'North Nazimabad', 'Near Karsaz', '2025-09-06', '09:00:00', 'Physical assault occurred during a dispute with my neighbor resulting in injuries.', 1, 'Rejected'),
  ('PICMS-2025-00022', '4210145601234', 7, 6, 12, 'Malir City', 'Behind PAF Base', '2025-10-22', '11:45:00', 'My family member has been missing for three days and we cannot locate them.', 1, 'Officer Assigned'),
  ('PICMS-2025-00023', '4210187698765', 8, 5, NULL, 'Orangi Town', 'Near Civic Centre', '2025-11-08', '07:00:00', 'There is an ongoing land dispute with adjacent plot owner who built on my property.', 1, 'Investigation Ongoing'),
  ('PICMS-2025-00024', '4210156745678', 9, 2, 7, 'Landhi', 'Near Bilawal House', '2025-01-27', '20:00:00', 'Workplace harassment by supervisor despite multiple verbal complaints to management.', 0, 'Resolved'),
  ('PICMS-2025-00025', '4210134556789', 10, 1, 3, 'Baldia Town', 'Opposite Agha Khan Hospital', '2025-11-01', '02:45:00', 'I was robbed at gunpoint near the market area and my belongings were taken.', 0, 'Closed'),
  ('PICMS-2025-00026', '4210123467890', 11, 3, 8, 'SITE Area', 'Behind KFC', '2025-08-26', '16:15:00', 'Domestic dispute has escalated and I fear for my safety and that of my children.', 1, 'Withdrawn'),
  ('PICMS-2025-00027', '4210190134567', 12, 1, 2, 'Lyari', 'Near City Court', '2025-02-10', '14:45:00', 'Drug peddling activity is happening near the school in our locality.', 1, 'Submitted'),
  ('PICMS-2025-00028', '4210178856789', 13, 6, 12, 'Kemari', 'Opposite Dolmen Mall', '2025-02-07', '19:45:00', 'My car was damaged deliberately by my neighbor during a heated argument.', 1, 'Under Review'),
  ('PICMS-2025-00029', '4210167789012', 14, 1, 4, 'Garden Road', 'Near Metropole Hotel', '2025-11-07', '08:30:00', 'Identity theft - someone opened credit accounts using my CNIC without consent.', 1, 'Accepted'),
  ('PICMS-2025-00030', '4210112311111', 15, 1, 4, 'Frere Town', 'Behind Numaish', '2025-04-10', '02:00:00', 'My mobile phone was snatched by two men on a motorcycle near the main road.', 0, 'Rejected'),
  ('PICMS-2025-00031', '4210198722222', 1, 2, 6, 'Clifton', 'Near Mazar-e-Quaid', '2025-01-26', '03:15:00', 'I discovered unauthorized transactions from my bank account totaling Rs. 45,000.', 1, 'Officer Assigned'),
  ('PICMS-2025-00032', '4210145633333', 2, 6, 11, 'DHA Phase 4', 'Opposite Empress Market', '2025-12-09', '00:45:00', 'My vehicle was stolen from outside my house during the night.', 1, 'Investigation Ongoing'),
  ('PICMS-2025-00033', '4210187644444', 3, 1, 4, 'Gulshan Block 3', 'Near Karsaz', '2025-12-19', '15:45:00', 'I have been receiving threatening calls from unknown numbers for the past week.', 1, 'Resolved'),
  ('PICMS-2025-00034', '4210156755555', 4, 7, 13, 'Saddar', 'Behind PAF Base', '2025-04-06', '14:00:00', 'My shop was broken into and cash and electronics worth Rs. 200,000 were stolen.', 1, 'Closed'),
  ('PICMS-2025-00035', '4210134566666', 5, 1, 2, 'Korangi', 'Near Civic Centre', '2025-11-05', '03:00:00', 'Online fraudster posed as a government official and took money from me.', 1, 'Withdrawn'),
  ('PICMS-2025-00036', '4210123477777', 6, 8, NULL, 'North Nazimabad', 'Near Bilawal House', '2025-05-14', '10:00:00', 'Physical assault occurred during a dispute with my neighbor resulting in injuries.', 1, 'Submitted'),
  ('PICMS-2025-00037', '4210190188888', 7, 10, NULL, 'Malir City', 'Opposite Agha Khan Hospital', '2025-07-27', '07:15:00', 'My family member has been missing for three days and we cannot locate them.', 1, 'Under Review'),
  ('PICMS-2025-00038', '4210178899999', 8, 7, 13, 'Orangi Town', 'Behind KFC', '2025-09-08', '22:00:00', 'There is an ongoing land dispute with adjacent plot owner who built on my property.', 0, 'Accepted'),
  ('PICMS-2025-00039', '4210167700001', 9, 8, NULL, 'Landhi', 'Near City Court', '2025-07-23', '01:00:00', 'Workplace harassment by supervisor despite multiple verbal complaints to management.', 0, 'Rejected'),
  ('PICMS-2025-00040', '4210112300002', 10, 1, 3, 'Baldia Town', 'Opposite Dolmen Mall', '2025-01-17', '16:15:00', 'I was robbed at gunpoint near the market area and my belongings were taken.', 0, 'Officer Assigned'),
  ('PICMS-2025-00041', '4210198700003', 11, 10, NULL, 'SITE Area', 'Near Metropole Hotel', '2025-10-22', '20:45:00', 'Domestic dispute has escalated and I fear for my safety and that of my children.', 1, 'Investigation Ongoing'),
  ('PICMS-2025-00042', '4210145600004', 12, 6, 12, 'Lyari', 'Behind Numaish', '2025-09-08', '15:45:00', 'Drug peddling activity is happening near the school in our locality.', 1, 'Resolved'),
  ('PICMS-2025-00043', '4210187600005', 13, 1, 2, 'Kemari', 'Near Mazar-e-Quaid', '2025-07-27', '00:30:00', 'My car was damaged deliberately by my neighbor during a heated argument.', 0, 'Closed'),
  ('PICMS-2025-00044', '4210156700006', 14, 4, NULL, 'Garden Road', 'Opposite Empress Market', '2025-02-17', '22:30:00', 'Identity theft - someone opened credit accounts using my CNIC without consent.', 0, 'Withdrawn'),
  ('PICMS-2025-00045', '4210134500007', 15, 4, NULL, 'Frere Town', 'Near Karsaz', '2025-01-24', '23:00:00', 'My mobile phone was snatched by two men on a motorcycle near the main road.', 0, 'Submitted'),
  ('PICMS-2025-00046', '4210123400008', 1, 9, 16, 'Clifton', 'Behind PAF Base', '2025-06-13', '00:00:00', 'I discovered unauthorized transactions from my bank account totaling Rs. 45,000.', 1, 'Under Review'),
  ('PICMS-2025-00047', '4210190100009', 2, 6, 12, 'DHA Phase 4', 'Near Civic Centre', '2025-02-22', '16:45:00', 'My vehicle was stolen from outside my house during the night.', 1, 'Accepted'),
  ('PICMS-2025-00048', '4210178800010', 3, 4, NULL, 'Gulshan Block 3', 'Near Bilawal House', '2025-01-05', '03:45:00', 'I have been receiving threatening calls from unknown numbers for the past week.', 1, 'Rejected'),
  ('PICMS-2025-00049', '4210167700011', 4, 8, NULL, 'Saddar', 'Opposite Agha Khan Hospital', '2025-02-08', '18:15:00', 'My shop was broken into and cash and electronics worth Rs. 200,000 were stolen.', 0, 'Officer Assigned'),
  ('PICMS-2025-00050', '4210112345671', 5, 6, 11, 'Korangi', 'Behind KFC', '2025-12-25', '09:00:00', 'Online fraudster posed as a government official and took money from me.', 1, 'Investigation Ongoing');


  -- ============================================================
-- OFFICERS: 5 Investigating Officers per station (75 total)
-- role_id=1 (Investigating Officer), active_caseload=0
-- password_changed=1, is_active=1
-- Special email: ayesha.naveed3101@gmail.com -> officer_id=1
-- Password: password
-- ============================================================

INSERT INTO officers
  (full_name, badge_number, email, `rank`, password_hash,
   password_changed, active_caseload, is_active, station_id, role_id)
VALUES
  ('Imtiaz Qureshi', 'KHI-IO-S01001', 'ayesha.naveed3101@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 1, 1),
  ('Arif Shafiq', 'KHI-IO-S01002', 'arif.shafiq.s1o1@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 1, 1),
  ('Farhan Umrani', 'KHI-IO-S01003', 'farhan.umrani.s1o2@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 1, 1),
  ('Javed Osmani', 'KHI-IO-S01004', 'javed.osmani.s1o3@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 1, 1),
  ('Hamza Bhatti', 'KHI-IO-S01005', 'hamza.bhatti.s1o4@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 1, 1),
  ('Yasir Mastoi', 'KHI-IO-S02006', 'yasir.mastoi.s2o0@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 2, 1),
  ('Fahim Phulpoto', 'KHI-IO-S02007', 'fahim.phulpoto.s2o1@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 2, 1),
  ('Waqas Talpur', 'KHI-IO-S02008', 'waqas.talpur.s2o2@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 2, 1),
  ('Omar Naqvi', 'KHI-IO-S02009', 'omar.naqvi.s2o3@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 2, 1),
  ('Naveed Jafri', 'KHI-IO-S02010', 'naveed.jafri.s2o4@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 2, 1),
  ('Vaseem Tareen', 'KHI-IO-S03011', 'vaseem.tareen.s3o0@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 3, 1),
  ('Khalid Ghori', 'KHI-IO-S03012', 'khalid.ghori.s3o1@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 3, 1),
  ('Parvez Afridi', 'KHI-IO-S03013', 'parvez.afridi.s3o2@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 3, 1),
  ('Saad Wagan', 'KHI-IO-S03014', 'saad.wagan.s3o3@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 3, 1),
  ('Tanveer Rajput', 'KHI-IO-S03015', 'tanveer.rajput.s3o4@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 3, 1),
  ('Sardar Essani', 'KHI-IO-S04016', 'sardar.essani.s4o0@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 4, 1),
  ('Shahid Ansari', 'KHI-IO-S04017', 'shahid.ansari.s4o1@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 4, 1),
  ('Haroon Rajput', 'KHI-IO-S04018', 'haroon.rajput.s4o2@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 4, 1),
  ('Adeel Ghori', 'KHI-IO-S04019', 'adeel.ghori.s4o3@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 4, 1),
  ('Jameel Essani', 'KHI-IO-S04020', 'jameel.essani.s4o4@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 4, 1),
  ('Saleem Bugti', 'KHI-IO-S05021', 'saleem.bugti.s5o0@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 5, 1),
  ('Ehsan Niazi', 'KHI-IO-S05022', 'ehsan.niazi.s5o1@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 5, 1),
  ('Zubair Chattha', 'KHI-IO-S05023', 'zubair.chattha.s5o2@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 5, 1),
  ('Khalil Ghori', 'KHI-IO-S05024', 'khalil.ghori.s5o3@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 5, 1),
  ('Fahim Shafiq', 'KHI-IO-S05025', 'fahim.shafiq.s5o4@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 5, 1),
  ('Rizwan Abbasi', 'KHI-IO-S06026', 'rizwan.abbasi.s6o0@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 6, 1),
  ('Kamran Lashari', 'KHI-IO-S06027', 'kamran.lashari.s6o1@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 6, 1),
  ('Shahid Rauf', 'KHI-IO-S06028', 'shahid.rauf.s6o2@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 6, 1),
  ('Vaseem Khoso', 'KHI-IO-S06029', 'vaseem.khoso.s6o3@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 6, 1),
  ('Jameel Hashmi', 'KHI-IO-S06030', 'jameel.hashmi.s6o4@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 6, 1),
  ('Luqman Chattha', 'KHI-IO-S07031', 'luqman.chattha.s7o0@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 7, 1),
  ('Iqtidar Osmani', 'KHI-IO-S07032', 'iqtidar.osmani.s7o1@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 7, 1),
  ('Rashid Shafiq', 'KHI-IO-S07033', 'rashid.shafiq.s7o2@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 7, 1),
  ('Tanvir Khoso', 'KHI-IO-S07034', 'tanvir.khoso.s7o3@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 7, 1),
  ('Amir Bokhari', 'KHI-IO-S07035', 'amir.bokhari.s7o4@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 7, 1),
  ('Obaid Osmani', 'KHI-IO-S08036', 'obaid.osmani.s8o0@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 8, 1),
  ('Uzair Ghori', 'KHI-IO-S08037', 'uzair.ghori.s8o1@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 8, 1),
  ('Wajid Durrani', 'KHI-IO-S08038', 'wajid.durrani.s8o2@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 8, 1),
  ('Imtiaz Thebo', 'KHI-IO-S08039', 'imtiaz.thebo.s8o3@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 8, 1),
  ('Naveed Bokhari', 'KHI-IO-S08040', 'naveed.bokhari.s8o4@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 8, 1),
  ('Ghalib Naqvi', 'KHI-IO-S09041', 'ghalib.naqvi.s9o0@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 9, 1),
  ('Omar Faruqi', 'KHI-IO-S09042', 'omar.faruqi.s9o1@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 9, 1),
  ('Siraj Awan', 'KHI-IO-S09043', 'siraj.awan.s9o2@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 9, 1),
  ('Siraj Phulpoto', 'KHI-IO-S09044', 'siraj.phulpoto.s9o3@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 9, 1),
  ('Saleem Naqvi', 'KHI-IO-S09045', 'saleem.naqvi.s9o4@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 9, 1),
  ('Khizer Rizvi', 'KHI-IO-S10046', 'khizer.rizvi.s10o0@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 10, 1),
  ('Bilal Bokhari', 'KHI-IO-S10047', 'bilal.bokhari.s10o1@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 10, 1),
  ('Jawad Baloch', 'KHI-IO-S10048', 'jawad.baloch.s10o2@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 10, 1),
  ('Zaheer Rajput', 'KHI-IO-S10049', 'zaheer.rajput.s10o3@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 10, 1),
  ('Nasim Malik', 'KHI-IO-S10050', 'nasim.malik.s10o4@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 10, 1),
  ('Kashif Chandio', 'KHI-IO-S11051', 'kashif.chandio.s11o0@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 11, 1),
  ('Danyal Samejo', 'KHI-IO-S11052', 'danyal.samejo.s11o1@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 11, 1),
  ('Vaseem Umrani', 'KHI-IO-S11053', 'vaseem.umrani.s11o2@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 11, 1),
  ('Jawad Lashari', 'KHI-IO-S11054', 'jawad.lashari.s11o3@gmail.com', 'SI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 11, 1),
  ('Hasnain Rathore', 'KHI-IO-S11055', 'hasnain.rathore.s11o4@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 11, 1),
  ('Junaid Chattha', 'KHI-IO-S12056', 'junaid.chattha.s12o0@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 12, 1),
  ('Shahid Tareen', 'KHI-IO-S12057', 'shahid.tareen.s12o1@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 12, 1),
  ('Javed Abbasi', 'KHI-IO-S12058', 'javed.abbasi.s12o2@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 12, 1),
  ('Omar Niazi', 'KHI-IO-S12059', 'omar.niazi.s12o3@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 12, 1),
  ('Yasir Malik', 'KHI-IO-S12060', 'yasir.malik.s12o4@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 12, 1),
  ('Mansoor Niazi', 'KHI-IO-S13061', 'mansoor.niazi.s13o0@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 13, 1),
  ('Fawad Junejo', 'KHI-IO-S13062', 'fawad.junejo.s13o1@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 13, 1),
  ('Asghar Tunio', 'KHI-IO-S13063', 'asghar.tunio.s13o2@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 13, 1),
  ('Arif Chandio', 'KHI-IO-S13064', 'arif.chandio.s13o3@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 13, 1),
  ('Sajid Warsi', 'KHI-IO-S13065', 'sajid.warsi.s13o4@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 13, 1),
  ('Ghalib Bugti', 'KHI-IO-S14066', 'ghalib.bugti.s14o0@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 14, 1),
  ('Daniyal Bhutto', 'KHI-IO-S14067', 'daniyal.bhutto.s14o1@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 14, 1),
  ('Adeel Lodhi', 'KHI-IO-S14068', 'adeel.lodhi.s14o2@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 14, 1),
  ('Naveed Awan', 'KHI-IO-S14069', 'naveed.awan.s14o3@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 14, 1),
  ('Sajid Gillani', 'KHI-IO-S14070', 'sajid.gillani.s14o4@gmail.com', 'ASI',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 14, 1),
  ('Luqman Osmani', 'KHI-IO-S15071', 'luqman.osmani.s15o0@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 15, 1),
  ('Fawad Bhutto', 'KHI-IO-S15072', 'fawad.bhutto.s15o1@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 15, 1),
  ('Naeem Solangi', 'KHI-IO-S15073', 'naeem.solangi.s15o2@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 15, 1),
  ('Amir Umrani', 'KHI-IO-S15074', 'amir.umrani.s15o3@gmail.com', 'Inspector',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 15, 1),
  ('Khalid Baloch', 'KHI-IO-S15075', 'khalid.baloch.s15o4@gmail.com', 'DSP',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   1, 0, 1, 15, 1);

SET foreign_key_checks=1;


-- Summary:
-- Citizens: 50
-- Officers: 150 (10 per station x 15 stations, all Investigating Officers)
-- Complaints: 50

-- Run this to update all existing rows at once
UPDATE citizens SET password_hash = '$2b$10$S2QiS2u0KoZABLd4mjYOcuRayrJS7GiLSBeE/V9hp.LMfksF4Zf3C';
UPDATE officers SET password_hash = '$2b$10$S2QiS2u0KoZABLd4mjYOcuRayrJS7GiLSBeE/V9hp.LMfksF4Zf3C';
  --saray citizen and officers ka password Test@1234 hai T is capital

--to run
USE picms_db;  -- replace with your actual DB name
-- 2) update appointments.status enum (Confirmed -> Accepted)
ALTER TABLE appointments
MODIFY COLUMN status ENUM('Pending','Accepted','Completed','Cancelled') DEFAULT 'Pending';
-- 3) remove old trigger that was deleted from schema
DROP TRIGGER IF EXISTS after_appointment_insert;
-- 4) add/update appointment details view
DROP VIEW IF EXISTS vw_appointment_details;
CREATE VIEW vw_appointment_details AS
SELECT
    a.appointment_id,
    a.complaint_id,
    a.sho_id,
    a.schedule_id,
    a.location,
    a.status,
    a.cancellation_reason,
    a.created_at,
    c.reference_number,
    c.cnic,
    c.station_id,
    c.status AS complaint_status,
    s.station_name,
    ss.scheduled_date,
    ss.start_time,
    ss.end_time,
    TIMESTAMP(ss.scheduled_date, ss.start_time) AS scheduled_at,
    TIMESTAMP(ss.scheduled_date, ss.end_time)   AS scheduled_end_at,
    COALESCE((
        SELECT COUNT(*)
        FROM appointments ap2
        WHERE ap2.complaint_id = a.complaint_id
          AND ap2.status = 'Cancelled'
    ), 0) AS miss_count
FROM appointments a
JOIN complaints c
  ON c.complaint_id = a.complaint_id
JOIN stations s
  ON s.station_id = c.station_id
JOIN sho_schedule ss
  ON ss.schedule_id = a.schedule_id;