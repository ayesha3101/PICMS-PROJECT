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