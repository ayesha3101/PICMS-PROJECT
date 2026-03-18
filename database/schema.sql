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