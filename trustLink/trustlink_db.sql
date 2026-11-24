-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 18, 2026 at 12:40 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `trustlink_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bids`
--

CREATE TABLE `bids` (
  `bid_id` bigint(20) UNSIGNED NOT NULL,
  `job_id` bigint(20) UNSIGNED NOT NULL,
  `technician_id` bigint(20) UNSIGNED NOT NULL,
  `visit_fee` decimal(10,2) NOT NULL,
  `estimated_labor_min` decimal(10,2) NOT NULL,
  `estimated_labor_max` decimal(10,2) NOT NULL,
  `status` enum('SUBMITTED','ACCEPTED','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'SUBMITTED',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bids`
--

INSERT INTO `bids` (`bid_id`, `job_id`, `technician_id`, `visit_fee`, `estimated_labor_min`, `estimated_labor_max`, `status`, `created_at`) VALUES
(1, 1, 5, 500.00, 1000.00, 2450.00, 'ACCEPTED', '2026-09-13 15:16:53'),
(4, 2, 5, 500.00, 1000.00, 3000.00, 'ACCEPTED', '2026-09-19 07:45:50'),
(5, 3, 5, 500.00, 1000.00, 3500.00, 'ACCEPTED', '2026-09-19 10:24:30'),
(6, 4, 5, 500.00, 1000.00, 2500.00, 'ACCEPTED', '2026-09-19 11:19:18'),
(10, 9, 5, 500.00, 1000.00, 2500.00, 'ACCEPTED', '2026-10-13 08:28:22'),
(12, 11, 5, 500.00, 1000.00, 2500.00, 'ACCEPTED', '2026-10-15 10:29:45');

-- --------------------------------------------------------

--
-- Table structure for table `disputes`
--

CREATE TABLE `disputes` (
  `dispute_id` bigint(20) UNSIGNED NOT NULL,
  `contract_id` bigint(20) UNSIGNED NOT NULL,
  `initiated_by` bigint(20) UNSIGNED NOT NULL,
  `reason` text NOT NULL,
  `status` enum('OPEN','UNDER_INVESTIGATION','RESOLVED_REFUND','RESOLVED_REJECTED') NOT NULL DEFAULT 'OPEN',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `job_id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(120) NOT NULL,
  `description` text NOT NULL,
  `location` point NOT NULL,
  `address_text` varchar(255) NOT NULL,
  `search_radius_km` decimal(4,1) NOT NULL DEFAULT 5.0,
  `status` enum('SEARCHING','OFFERS_RECEIVED','LOCKED_STAGE_1','LOCKED_STAGE_2','COMPLETED','CANCELLED') NOT NULL DEFAULT 'SEARCHING',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`job_id`, `customer_id`, `category_id`, `title`, `description`, `location`, `address_text`, `search_radius_km`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Leaky Air Conditioner And Water Damage On Wall At Home', 'URGENT NEED TO FIXING THE ISSUE', 0x0000000001010000002db29defa7965240a4703d0ad7833f40, 'Gulberg III, Lahore', 5.0, 'COMPLETED', '2026-09-13 14:49:05', '2026-09-19 06:49:31'),
(2, 1, 1, 'ac was not cooling', 'same as above', 0x0000000001010000002db29defa7965240a4703d0ad7833f40, 'Gulberg III, Lahore', 5.0, 'COMPLETED', '2026-09-19 07:45:05', '2026-09-19 07:47:13'),
(3, 1, 1, 'new ac installation', 'old ac was not working properly', 0x0000000001010000002db29defa7965240a4703d0ad7833f40, 'Gulberg III, Lahore', 5.0, 'COMPLETED', '2026-09-19 10:23:02', '2026-09-19 10:25:54'),
(4, 1, 1, 'ac compressor tripping', 'n/a', 0x000000000101000000c803368c27c45040dde401767f063940, 'surjani town karachi', 10.0, 'COMPLETED', '2026-09-19 10:57:22', '2026-09-19 11:22:07'),
(9, 1, 1, 'ac leakage fixing ', 'N?A', 0x000000000101000000010000a756c450405ce79d15c8033940, 'Surjani Town Sector 4 B, Surjani Town Sector 4, Manghopir Town', 5.0, 'COMPLETED', '2026-10-13 08:28:08', '2026-10-13 08:32:19'),
(11, 1, 1, 'ac water leak', 'n/a', 0x000000000101000000d9f3a6df57c45040301d74a5c8033940, 'Surjani Town, Karachi', 5.0, 'COMPLETED', '2026-10-15 10:28:59', '2026-10-15 10:31:50');

-- --------------------------------------------------------

--
-- Table structure for table `job_contracts`
--

CREATE TABLE `job_contracts` (
  `contract_id` bigint(20) UNSIGNED NOT NULL,
  `job_id` bigint(20) UNSIGNED NOT NULL,
  `technician_id` bigint(20) UNSIGNED NOT NULL,
  `accepted_bid_id` bigint(20) UNSIGNED NOT NULL,
  `stage2_pin` char(4) DEFAULT NULL,
  `stage1_visit_fee` decimal(10,2) NOT NULL,
  `stage1_locked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `technician_arrived_at` timestamp NULL DEFAULT NULL,
  `stage2_final_labor` decimal(10,2) DEFAULT NULL,
  `stage2_verification_pin_hash` char(64) DEFAULT NULL,
  `stage2_locked_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `contract_status` enum('STAGE_1_EN_ROUTE','STAGE_1_ARRIVED','STAGE_2_IN_PROGRESS','SETTLED','DISPUTED','CANCELLED') NOT NULL DEFAULT 'STAGE_1_EN_ROUTE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `job_contracts`
--

INSERT INTO `job_contracts` (`contract_id`, `job_id`, `technician_id`, `accepted_bid_id`, `stage2_pin`, `stage1_visit_fee`, `stage1_locked_at`, `technician_arrived_at`, `stage2_final_labor`, `stage2_verification_pin_hash`, `stage2_locked_at`, `completed_at`, `contract_status`) VALUES
(1, 1, 5, 1, '1234', 500.00, '2026-09-13 15:17:51', '2026-09-13 15:26:22', 1500.00, '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '2026-09-19 06:48:48', '2026-09-19 06:49:31', 'SETTLED'),
(2, 2, 5, 4, '3295', 500.00, '2026-09-19 07:46:13', '2026-09-19 07:46:28', 2000.00, 'a1e1e86414fd481e6af4ab2cf7a350a97edde2805e8a1aa3b2157883fe32181f', '2026-09-19 07:46:51', '2026-09-19 07:47:13', 'SETTLED'),
(3, 3, 5, 5, '1833', 500.00, '2026-09-19 10:24:51', '2026-09-19 10:25:03', 3000.00, 'c91bcd9ef3968cb25256c8fda7b1613b6a3cdddb7513ca818193e4daac5f00e1', '2026-09-19 10:25:24', '2026-09-19 10:25:54', 'SETTLED'),
(4, 4, 5, 6, '9466', 500.00, '2026-09-19 11:19:27', '2026-09-19 11:20:29', 1500.00, '17ee10213d9ba6b565cd8db1ca05174f00603f2ef3957e713e337a9ad73fd172', '2026-09-19 11:21:53', '2026-09-19 11:22:07', 'SETTLED'),
(8, 9, 5, 10, '9370', 500.00, '2026-10-13 08:28:26', '2026-10-13 08:28:52', 1200.00, '605b6fdd5bd6de9498a7b68b077a7d3cc511ab232b045d5b9022c4c4b3f47490', '2026-10-13 08:31:59', '2026-10-13 08:32:19', 'SETTLED'),
(10, 11, 5, 12, '6190', 500.00, '2026-10-15 10:29:53', '2026-10-15 10:30:54', 2000.00, '8f49713685cc177709f53d984f08e830c9dfb02967e98edae0461483a9d46934', '2026-10-15 10:31:25', '2026-10-15 10:31:50', 'SETTLED');

-- --------------------------------------------------------

--
-- Table structure for table `job_media`
--

CREATE TABLE `job_media` (
  `media_id` bigint(20) UNSIGNED NOT NULL,
  `job_id` bigint(20) UNSIGNED NOT NULL,
  `media_type` enum('IMAGE','AUDIO') NOT NULL,
  `media_url` varchar(512) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `job_media`
--

INSERT INTO `job_media` (`media_id`, `job_id`, `media_type`, `media_url`, `uploaded_at`) VALUES
(1, 1, 'IMAGE', 'http://localhost:5000/uploads/1789310945504-676901991.webp', '2026-09-13 14:49:05'),
(2, 2, 'IMAGE', 'http://localhost:5000/uploads/1789803905511-994617892.webp', '2026-09-19 07:45:05'),
(3, 3, 'IMAGE', 'http://localhost:5000/uploads/1789813382485-564483213.webp', '2026-09-19 10:23:02'),
(4, 4, 'IMAGE', 'http://localhost:5000/uploads/1789815442324-236657175.webp', '2026-09-19 10:57:22'),
(9, 9, 'IMAGE', 'http://localhost:5000/uploads/1791880088345-332699670.webp', '2026-10-13 08:28:08'),
(11, 11, 'IMAGE', 'http://localhost:5000/uploads/1792060139932-917788822.webp', '2026-10-15 10:28:59');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `review_id` bigint(20) UNSIGNED NOT NULL,
  `contract_id` bigint(20) UNSIGNED NOT NULL,
  `reviewer_id` bigint(20) UNSIGNED NOT NULL,
  `reviewee_id` bigint(20) UNSIGNED NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `review_text` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`review_id`, `contract_id`, `reviewer_id`, `reviewee_id`, `rating`, `review_text`, `created_at`) VALUES
(1, 1, 1, 5, 4, 'good work', '2026-09-19 06:49:31'),
(2, 2, 1, 5, 3, 'nice person', '2026-09-19 07:47:13'),
(3, 3, 1, 5, 4, 'good working', '2026-09-19 10:25:54'),
(4, 4, 1, 5, 3, 'Job completed.', '2026-09-19 11:22:07'),
(8, 8, 1, 5, 5, 'Job completed.', '2026-10-13 08:32:19'),
(9, 10, 1, 5, 5, 'Job completed.', '2026-10-15 10:31:50');

-- --------------------------------------------------------

--
-- Table structure for table `service_categories`
--

CREATE TABLE `service_categories` (
  `category_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `base_inspection_fee` decimal(10,2) NOT NULL DEFAULT 500.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_categories`
--

INSERT INTO `service_categories` (`category_id`, `name`, `slug`, `base_inspection_fee`, `created_at`) VALUES
(1, 'AC Repair & Services', 'ac-repair', 600.00, '2026-09-12 09:57:27'),
(2, 'Plumbing & Sanitary', 'plumbing', 400.00, '2026-09-12 09:57:27'),
(3, 'Electrician & Wiring', 'electrician', 500.00, '2026-09-12 09:57:27'),
(4, 'Carpentry & Woodwork', 'carpentry', 500.00, '2026-09-12 09:57:27');

-- --------------------------------------------------------

--
-- Table structure for table `technician_profiles`
--

CREATE TABLE `technician_profiles` (
  `technician_id` bigint(20) UNSIGNED NOT NULL,
  `cnic_number` varchar(15) NOT NULL,
  `cnic_front_url` varchar(512) NOT NULL,
  `cnic_back_url` varchar(512) NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `rejection_reason` varchar(255) DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `is_online` tinyint(1) NOT NULL DEFAULT 0,
  `last_known_location` point NOT NULL,
  `base_trust_score` decimal(5,2) NOT NULL DEFAULT 70.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `technician_profiles`
--

INSERT INTO `technician_profiles` (`technician_id`, `cnic_number`, `cnic_front_url`, `cnic_back_url`, `is_verified`, `rejection_reason`, `rejected_at`, `is_online`, `last_known_location`, `base_trust_score`, `created_at`, `updated_at`) VALUES
(5, '35201-1234567-1', 'https://storage.trustlink.pk/cnic/5_front.webp', 'https://storage.trustlink.pk/cnic/5_back.webp', 1, NULL, NULL, 1, 0x000000000101000000d9f3a6df57c45040301d74a5c8033940, 56.00, '2026-09-12 09:57:27', '2026-10-15 10:31:50'),
(6, '35202-2345678-2', 'https://storage.trustlink.pk/cnic/6_front.webp', 'https://storage.trustlink.pk/cnic/6_back.webp', 1, NULL, NULL, 1, 0x000000000101000000053411363c955240fe43faedeb803f40, 92.50, '2026-09-12 09:57:27', '2026-09-12 09:57:27'),
(7, '35201-3456789-3', 'https://storage.trustlink.pk/cnic/7_front.webp', 'https://storage.trustlink.pk/cnic/7_back.webp', 1, NULL, NULL, 1, 0x000000000101000000e9263108ac94524096218e75717b3f40, 78.00, '2026-09-12 09:57:27', '2026-09-12 09:57:27'),
(8, '35202-4567890-4', 'https://storage.trustlink.pk/cnic/8_front.webp', 'https://storage.trustlink.pk/cnic/8_back.webp', 1, NULL, NULL, 0, 0x000000000101000000c1caa145b69752408e06f01648803f40, 70.00, '2026-09-12 09:57:27', '2026-09-12 09:57:27'),
(11, '12345-1234567-1', 'http://localhost:5000/uploads/cnic-1789796324687-162148075.png', 'http://localhost:5000/uploads/cnic-1789796324695-424089252.jpg', 0, 'Invalid / Fake CNIC Number format', NULL, 0, 0x0000000001010000002db29defa7965240a1d634ef38853f40, 70.00, '2026-09-19 05:38:44', '2026-09-19 05:59:00');

-- --------------------------------------------------------

--
-- Table structure for table `technician_services`
--

CREATE TABLE `technician_services` (
  `technician_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `technician_services`
--

INSERT INTO `technician_services` (`technician_id`, `category_id`, `assigned_at`) VALUES
(5, 1, '2026-09-12 09:57:27'),
(6, 1, '2026-09-12 09:57:27'),
(6, 3, '2026-09-12 09:57:27'),
(7, 2, '2026-09-12 09:57:27'),
(8, 4, '2026-09-12 09:57:27'),
(11, 1, '2026-09-19 05:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `trusted_contacts`
--

CREATE TABLE `trusted_contacts` (
  `contact_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `phone_number` varchar(16) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `avatar_url` varchar(512) DEFAULT NULL,
  `default_address` varchar(255) DEFAULT NULL,
  `role` enum('CUSTOMER','TECHNICIAN','ADMIN') NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `phone_number`, `password_hash`, `first_name`, `last_name`, `avatar_url`, `default_address`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '+923001111111', '$2b$10$.Ggl9/8l.TrZKx3uqeKbDeVtrnzfy7u.CC2XD8DSCxAjyXdaVcnRq', 'Ahmed', 'Raza', 'http://localhost:5000/uploads/avatar-1789804917463-459563111.jpeg', 'surjani town karachi sector 5D', 'CUSTOMER', 1, '2026-09-12 09:57:27', '2026-10-13 07:54:42'),
(2, '+923002222222', '$2b$10$.Ggl9/8l.TrZKx3uqeKbDeVtrnzfy7u.CC2XD8DSCxAjyXdaVcnRq', 'Sara', 'Khan', NULL, NULL, 'CUSTOMER', 1, '2026-09-12 09:57:27', '2026-09-13 11:08:45'),
(3, '+923003333333', '$2b$10$.Ggl9/8l.TrZKx3uqeKbDeVtrnzfy7u.CC2XD8DSCxAjyXdaVcnRq', 'Usman', 'Tariq', NULL, NULL, 'CUSTOMER', 1, '2026-09-12 09:57:27', '2026-09-13 11:08:45'),
(4, '+923004444444', '$2b$10$.Ggl9/8l.TrZKx3uqeKbDeVtrnzfy7u.CC2XD8DSCxAjyXdaVcnRq', 'Fatima', 'Noor', NULL, NULL, 'CUSTOMER', 1, '2026-09-12 09:57:27', '2026-09-13 11:08:45'),
(5, '+923215555555', '$2b$10$.Ggl9/8l.TrZKx3uqeKbDeVtrnzfy7u.CC2XD8DSCxAjyXdaVcnRq', 'Muhammad', 'Bilal', 'http://localhost:5000/uploads/avatar-1791873589039-828740859.jpg', 'surjani town karachi sector 7c', 'TECHNICIAN', 1, '2026-09-12 09:57:27', '2026-10-13 08:03:12'),
(6, '+923216666666', '$2b$10$.Ggl9/8l.TrZKx3uqeKbDeVtrnzfy7u.CC2XD8DSCxAjyXdaVcnRq', 'Tariq', 'Mehmood', NULL, NULL, 'TECHNICIAN', 1, '2026-09-12 09:57:27', '2026-09-13 11:08:45'),
(7, '+923217777777', '$2b$10$.Ggl9/8l.TrZKx3uqeKbDeVtrnzfy7u.CC2XD8DSCxAjyXdaVcnRq', 'Imran', 'Rafiq', NULL, NULL, 'TECHNICIAN', 1, '2026-09-12 09:57:27', '2026-09-13 11:08:45'),
(8, '+923218888888', '$2b$10$.Ggl9/8l.TrZKx3uqeKbDeVtrnzfy7u.CC2XD8DSCxAjyXdaVcnRq', 'Sajid', 'Ali', NULL, NULL, 'TECHNICIAN', 1, '2026-09-12 09:57:27', '2026-09-13 11:08:45'),
(9, '+923339999999', '$2b$10$.Ggl9/8l.TrZKx3uqeKbDeVtrnzfy7u.CC2XD8DSCxAjyXdaVcnRq', 'Zainab', 'Malik', NULL, NULL, 'ADMIN', 1, '2026-09-12 09:57:27', '2026-09-13 11:08:45'),
(11, '+923331111111', '$2b$10$Cm9UZ/4U0wkYf0QVB1NPleyITL8jBzJgVcYIMAJ4MAW0rqYVfX/8e', 'osama', 'hassan', NULL, NULL, 'TECHNICIAN', 1, '2026-09-19 05:38:44', '2026-09-19 05:38:44');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bids`
--
ALTER TABLE `bids`
  ADD PRIMARY KEY (`bid_id`),
  ADD UNIQUE KEY `uq_job_technician_bid` (`job_id`,`technician_id`),
  ADD KEY `fk_bids_technician` (`technician_id`),
  ADD KEY `idx_bids_job_status` (`job_id`,`status`);

--
-- Indexes for table `disputes`
--
ALTER TABLE `disputes`
  ADD PRIMARY KEY (`dispute_id`),
  ADD KEY `fk_disp_contract` (`contract_id`),
  ADD KEY `fk_disp_user` (`initiated_by`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`job_id`),
  ADD KEY `fk_jobs_customer` (`customer_id`),
  ADD KEY `fk_jobs_category` (`category_id`),
  ADD SPATIAL KEY `sp_idx_jobs_location` (`location`),
  ADD KEY `idx_jobs_status_created` (`status`,`created_at`);

--
-- Indexes for table `job_contracts`
--
ALTER TABLE `job_contracts`
  ADD PRIMARY KEY (`contract_id`),
  ADD UNIQUE KEY `uq_contract_job` (`job_id`),
  ADD KEY `fk_jc_technician` (`technician_id`),
  ADD KEY `fk_jc_bid` (`accepted_bid_id`);

--
-- Indexes for table `job_media`
--
ALTER TABLE `job_media`
  ADD PRIMARY KEY (`media_id`),
  ADD KEY `fk_media_job` (`job_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD UNIQUE KEY `uq_contract_reviewer` (`contract_id`,`reviewer_id`),
  ADD KEY `fk_rev_reviewer` (`reviewer_id`),
  ADD KEY `fk_rev_reviewee` (`reviewee_id`);

--
-- Indexes for table `service_categories`
--
ALTER TABLE `service_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `uq_category_name` (`name`),
  ADD UNIQUE KEY `uq_category_slug` (`slug`);

--
-- Indexes for table `technician_profiles`
--
ALTER TABLE `technician_profiles`
  ADD PRIMARY KEY (`technician_id`),
  ADD UNIQUE KEY `uq_tech_cnic` (`cnic_number`),
  ADD SPATIAL KEY `sp_idx_tech_location` (`last_known_location`);

--
-- Indexes for table `technician_services`
--
ALTER TABLE `technician_services`
  ADD PRIMARY KEY (`technician_id`,`category_id`),
  ADD KEY `fk_ts_category` (`category_id`);

--
-- Indexes for table `trusted_contacts`
--
ALTER TABLE `trusted_contacts`
  ADD PRIMARY KEY (`contact_id`),
  ADD KEY `fk_tc_user` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `uq_users_phone` (`phone_number`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bids`
--
ALTER TABLE `bids`
  MODIFY `bid_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `disputes`
--
ALTER TABLE `disputes`
  MODIFY `dispute_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `job_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `job_contracts`
--
ALTER TABLE `job_contracts`
  MODIFY `contract_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `job_media`
--
ALTER TABLE `job_media`
  MODIFY `media_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `service_categories`
--
ALTER TABLE `service_categories`
  MODIFY `category_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `trusted_contacts`
--
ALTER TABLE `trusted_contacts`
  MODIFY `contact_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bids`
--
ALTER TABLE `bids`
  ADD CONSTRAINT `fk_bids_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bids_technician` FOREIGN KEY (`technician_id`) REFERENCES `technician_profiles` (`technician_id`) ON DELETE CASCADE;

--
-- Constraints for table `disputes`
--
ALTER TABLE `disputes`
  ADD CONSTRAINT `fk_disp_contract` FOREIGN KEY (`contract_id`) REFERENCES `job_contracts` (`contract_id`),
  ADD CONSTRAINT `fk_disp_user` FOREIGN KEY (`initiated_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `jobs`
--
ALTER TABLE `jobs`
  ADD CONSTRAINT `fk_jobs_category` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`category_id`),
  ADD CONSTRAINT `fk_jobs_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `job_contracts`
--
ALTER TABLE `job_contracts`
  ADD CONSTRAINT `fk_jc_bid` FOREIGN KEY (`accepted_bid_id`) REFERENCES `bids` (`bid_id`),
  ADD CONSTRAINT `fk_jc_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`),
  ADD CONSTRAINT `fk_jc_technician` FOREIGN KEY (`technician_id`) REFERENCES `technician_profiles` (`technician_id`);

--
-- Constraints for table `job_media`
--
ALTER TABLE `job_media`
  ADD CONSTRAINT `fk_media_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_rev_contract` FOREIGN KEY (`contract_id`) REFERENCES `job_contracts` (`contract_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rev_reviewee` FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_rev_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `technician_profiles`
--
ALTER TABLE `technician_profiles`
  ADD CONSTRAINT `fk_tech_user` FOREIGN KEY (`technician_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `technician_services`
--
ALTER TABLE `technician_services`
  ADD CONSTRAINT `fk_ts_category` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`category_id`),
  ADD CONSTRAINT `fk_ts_tech` FOREIGN KEY (`technician_id`) REFERENCES `technician_profiles` (`technician_id`) ON DELETE CASCADE;

--
-- Constraints for table `trusted_contacts`
--
ALTER TABLE `trusted_contacts`
  ADD CONSTRAINT `fk_tc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
