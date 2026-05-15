-- =====================================================
-- IRO APP DATABASE SCHEMA
-- Indian Reformers Org (IRO)
-- Role Promotion + Election + Referral System
-- =====================================================

CREATE DATABASE iro_app;

USE iro_app;

-- =====================================================
-- 1. ROLES TABLE
-- =====================================================

CREATE TABLE roles (
    id CHAR(36) PRIMARY KEY,
    level_code VARCHAR(10) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. USERS TABLE
-- =====================================================

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash TEXT NOT NULL,

    role_id CHAR(36),
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referred_by CHAR(36),

    leadership_score DECIMAL(5,2) DEFAULT 0,
    peer_rating_avg DECIMAL(3,2) DEFAULT 0,

    total_referrals INT DEFAULT 0,
    network_size INT DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    surveys_submitted INT DEFAULT 0,
    days_active INT DEFAULT 0,

    profile_image TEXT,

    state_id CHAR(36),
    district_id CHAR(36),
    block_id CHAR(36),
    booth_id CHAR(36),

    status ENUM(
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED'
    ) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (referred_by) REFERENCES users(id)
);

-- =====================================================
-- 3. HIERARCHY LOCATIONS
-- =====================================================

CREATE TABLE hierarchy_locations (
    id CHAR(36) PRIMARY KEY,

    type ENUM(
        'COUNTRY',
        'STATE',
        'REGION',
        'DISTRICT',
        'BLOCK',
        'BOOTH'
    ) NOT NULL,

    name VARCHAR(150) NOT NULL,

    parent_id CHAR(36),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_id)
    REFERENCES hierarchy_locations(id)
);

-- =====================================================
-- 4. REFERRALS TABLE
-- =====================================================

CREATE TABLE referrals (
    id CHAR(36) PRIMARY KEY,

    referrer_user_id CHAR(36) NOT NULL,
    referred_user_id CHAR(36) NOT NULL,

    level_depth INT DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (referrer_user_id)
    REFERENCES users(id),

    FOREIGN KEY (referred_user_id)
    REFERENCES users(id)
);

-- =====================================================
-- 5. TASKS TABLE
-- =====================================================

CREATE TABLE tasks (
    id CHAR(36) PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    assigned_by CHAR(36),
    assigned_to CHAR(36),

    status ENUM(
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED'
    ) DEFAULT 'PENDING',

    completed_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (assigned_by)
    REFERENCES users(id),

    FOREIGN KEY (assigned_to)
    REFERENCES users(id)
);

-- =====================================================
-- 6. SURVEYS TABLE
-- =====================================================

CREATE TABLE surveys (
    id CHAR(36) PRIMARY KEY,

    user_id CHAR(36) NOT NULL,
    booth_id CHAR(36),

    voter_name VARCHAR(150),
    voter_mobile VARCHAR(20),

    sentiment ENUM(
        'SUPPORTIVE',
        'NEUTRAL',
        'OPPOSITION'
    ),

    gps_lat DECIMAL(10,7),
    gps_long DECIMAL(10,7),

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
);

-- =====================================================
-- 7. PEER RATINGS TABLE
-- =====================================================

CREATE TABLE peer_ratings (
    id CHAR(36) PRIMARY KEY,

    rated_user_id CHAR(36) NOT NULL,
    rated_by_user_id CHAR(36) NOT NULL,

    rating INT CHECK (rating >= 1 AND rating <= 5),

    feedback TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (rated_user_id)
    REFERENCES users(id),

    FOREIGN KEY (rated_by_user_id)
    REFERENCES users(id)
);

-- =====================================================
-- 8. LEADERSHIP SCORES TABLE
-- =====================================================

CREATE TABLE leadership_scores (
    id CHAR(36) PRIMARY KEY,

    user_id CHAR(36) NOT NULL,

    direct_referral_score DECIMAL(5,2) DEFAULT 0,
    network_score DECIMAL(5,2) DEFAULT 0,
    task_score DECIMAL(5,2) DEFAULT 0,
    survey_score DECIMAL(5,2) DEFAULT 0,
    active_days_score DECIMAL(5,2) DEFAULT 0,
    peer_rating_score DECIMAL(5,2) DEFAULT 0,

    final_score DECIMAL(5,2) DEFAULT 0,

    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
    REFERENCES users(id)
);

-- =====================================================
-- 9. ROLE NOMINATIONS TABLE
-- =====================================================

CREATE TABLE role_nominations (
    id CHAR(36) PRIMARY KEY,

    user_id CHAR(36) NOT NULL,

    current_role_id CHAR(36),
    nominated_role_id CHAR(36),

    nomination_reason TEXT,

    eligibility_score DECIMAL(5,2),

    status ENUM(
        'PENDING',
        'UNDER_REVIEW',
        'ELECTION_STARTED',
        'APPROVED',
        'REJECTED',
        'PROMOTED'
    ) DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
    REFERENCES users(id),

    FOREIGN KEY (current_role_id)
    REFERENCES roles(id),

    FOREIGN KEY (nominated_role_id)
    REFERENCES roles(id)
);

-- =====================================================
-- 10. ELECTIONS TABLE
-- =====================================================

CREATE TABLE elections (
    id CHAR(36) PRIMARY KEY,

    title VARCHAR(255) NOT NULL,

    role_id CHAR(36),

    area_type ENUM(
        'STATE',
        'DISTRICT',
        'BLOCK',
        'BOOTH'
    ),

    state_id CHAR(36),
    district_id CHAR(36),
    block_id CHAR(36),
    booth_id CHAR(36),

    start_date TIMESTAMP,
    end_date TIMESTAMP,

    status ENUM(
        'UPCOMING',
        'ACTIVE',
        'COMPLETED'
    ) DEFAULT 'UPCOMING',

    created_by CHAR(36),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id)
    REFERENCES roles(id),

    FOREIGN KEY (created_by)
    REFERENCES users(id)
);

-- =====================================================
-- 11. ELECTION CANDIDATES TABLE
-- =====================================================

CREATE TABLE election_candidates (
    id CHAR(36) PRIMARY KEY,

    election_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,

    leadership_score DECIMAL(5,2),

    total_votes INT DEFAULT 0,

    final_rank INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (election_id)
    REFERENCES elections(id),

    FOREIGN KEY (user_id)
    REFERENCES users(id)
);

-- =====================================================
-- 12. ELECTION VOTES TABLE
-- =====================================================

CREATE TABLE election_votes (
    id CHAR(36) PRIMARY KEY,

    election_id CHAR(36) NOT NULL,

    voter_user_id CHAR(36) NOT NULL,
    candidate_user_id CHAR(36) NOT NULL,

    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (election_id)
    REFERENCES elections(id),

    FOREIGN KEY (voter_user_id)
    REFERENCES users(id),

    FOREIGN KEY (candidate_user_id)
    REFERENCES users(id)
);

-- =====================================================
-- 13. ROLE PROMOTIONS TABLE
-- =====================================================

CREATE TABLE role_promotions (
    id CHAR(36) PRIMARY KEY,

    user_id CHAR(36) NOT NULL,

    previous_role_id CHAR(36),
    new_role_id CHAR(36),

    promoted_by CHAR(36),

    promotion_reason TEXT,

    election_id CHAR(36),

    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
    REFERENCES users(id),

    FOREIGN KEY (previous_role_id)
    REFERENCES roles(id),

    FOREIGN KEY (new_role_id)
    REFERENCES roles(id),

    FOREIGN KEY (promoted_by)
    REFERENCES users(id),

    FOREIGN KEY (election_id)
    REFERENCES elections(id)
);

-- =====================================================
-- DEFAULT ROLE DATA
-- =====================================================

INSERT INTO roles (id, level_code, role_name) VALUES
(UUID(), 'L1', 'Party President'),
(UUID(), 'L2', 'National Executive'),
(UUID(), 'L3', 'State Leadership'),
(UUID(), 'L4', 'Regional Leader'),
(UUID(), 'L5', 'District Leader'),
(UUID(), 'L6', 'Block Leader'),
(UUID(), 'L7', 'Booth Worker'),
(UUID(), 'L8', 'Volunteer');

-- =====================================================
-- END OF SCHEMA
-- =====================================================