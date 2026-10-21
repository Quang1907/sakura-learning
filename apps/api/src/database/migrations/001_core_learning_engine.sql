-- Migration 001: Core Learning Engine Schema
-- Sakura Swipe Learning

-- 1. Users and Profiles
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('USER', 'ADMIN', 'MODERATOR') NOT NULL DEFAULT 'USER',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_profiles` (
  `user_id` BIGINT UNSIGNED NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `avatar_url` VARCHAR(255) NULL,
  `target_jlpt` ENUM('N5', 'N4', 'N3', 'N2', 'N1') NOT NULL DEFAULT 'N5',
  `daily_goal_cards` INT UNSIGNED NOT NULL DEFAULT 20,
  `current_streak_days` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_exp` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `new_cards_ratio` DECIMAL(3,2) NOT NULL DEFAULT 0.60,
  `review_cards_ratio` DECIMAL(3,2) NOT NULL DEFAULT 0.30,
  `last_study_date` DATE NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_profiles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Core Content Entities
CREATE TABLE IF NOT EXISTS `kanji` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `character` VARCHAR(10) NOT NULL,
  `han_viet` VARCHAR(100) NOT NULL,
  `onyomi` VARCHAR(191) NOT NULL DEFAULT '',
  `kunyomi` VARCHAR(191) NOT NULL DEFAULT '',
  `stroke_count` TINYINT UNSIGNED NOT NULL,
  `radical` VARCHAR(10) NULL,
  `meaning_vi` TEXT NOT NULL,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kanji_character` (`character`),
  INDEX `idx_kanji_status` (`status`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `kanji_jlpt` (
  `kanji_id` BIGINT UNSIGNED NOT NULL,
  `jlpt_level` ENUM('N5', 'N4', 'N3', 'N2', 'N1') NOT NULL,
  PRIMARY KEY (`kanji_id`, `jlpt_level`),
  INDEX `idx_kanji_jlpt_level` (`jlpt_level`),
  CONSTRAINT `fk_kanji_jlpt_id` FOREIGN KEY (`kanji_id`) REFERENCES `kanji` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `kanji_examples` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kanji_id` BIGINT UNSIGNED NOT NULL,
  `word` VARCHAR(100) NOT NULL,
  `reading` VARCHAR(100) NOT NULL,
  `meaning_vi` VARCHAR(255) NOT NULL,
  `sentence_jp` TEXT NULL,
  `sentence_vi` TEXT NULL,
  `order_index` INT UNSIGNED NOT NULL DEFAULT 0,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_kanji_examples_kanji_id` (`kanji_id`),
  CONSTRAINT `fk_kanji_examples_kanji_id` FOREIGN KEY (`kanji_id`) REFERENCES `kanji` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vocabulary` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `word` VARCHAR(191) NOT NULL,
  `reading` VARCHAR(191) NOT NULL,
  `romaji` VARCHAR(191) NULL,
  `part_of_speech` VARCHAR(50) NULL,
  `meaning_vi` TEXT NOT NULL,
  `audio_url` VARCHAR(255) NULL,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_vocab_word` (`word`),
  INDEX `idx_vocab_reading` (`reading`),
  INDEX `idx_vocab_status` (`status`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vocab_jlpt` (
  `vocab_id` BIGINT UNSIGNED NOT NULL,
  `jlpt_level` ENUM('N5', 'N4', 'N3', 'N2', 'N1') NOT NULL,
  PRIMARY KEY (`vocab_id`, `jlpt_level`),
  INDEX `idx_vocab_jlpt_level` (`jlpt_level`),
  CONSTRAINT `fk_vocab_jlpt_id` FOREIGN KEY (`vocab_id`) REFERENCES `vocabulary` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vocab_kanji` (
  `vocab_id` BIGINT UNSIGNED NOT NULL,
  `kanji_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`vocab_id`, `kanji_id`),
  CONSTRAINT `fk_vk_vocab_id` FOREIGN KEY (`vocab_id`) REFERENCES `vocabulary` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vk_kanji_id` FOREIGN KEY (`kanji_id`) REFERENCES `kanji` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `grammar` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `structure` TEXT NOT NULL,
  `meaning_vi` TEXT NOT NULL,
  `usage_notes` TEXT NULL,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_grammar_status` (`status`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `grammar_jlpt` (
  `grammar_id` BIGINT UNSIGNED NOT NULL,
  `jlpt_level` ENUM('N5', 'N4', 'N3', 'N2', 'N1') NOT NULL,
  PRIMARY KEY (`grammar_id`, `jlpt_level`),
  INDEX `idx_grammar_jlpt_level` (`jlpt_level`),
  CONSTRAINT `fk_grammar_jlpt_id` FOREIGN KEY (`grammar_id`) REFERENCES `grammar` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sentences` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sentence_jp` TEXT NOT NULL,
  `sentence_vi` TEXT NOT NULL,
  `audio_url` VARCHAR(255) NULL,
  `grammar_id` BIGINT UNSIGNED NULL,
  `vocab_id` BIGINT UNSIGNED NULL,
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sentences_grammar_id` FOREIGN KEY (`grammar_id`) REFERENCES `grammar` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sentences_vocab_id` FOREIGN KEY (`vocab_id`) REFERENCES `vocabulary` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Lessons & Topics
CREATE TABLE IF NOT EXISTS `topics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `title_vi` VARCHAR(191) NOT NULL,
  `title_ja` VARCHAR(191) NULL,
  `icon_name` VARCHAR(50) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_topics_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lessons` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `description_vi` TEXT NULL,
  `jlpt_level` ENUM('N5', 'N4', 'N3', 'N2', 'N1') NOT NULL DEFAULT 'N5',
  `order_index` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_lessons_jlpt` (`jlpt_level`, `status`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lesson_items` (
  `lesson_id` BIGINT UNSIGNED NOT NULL,
  `item_type` ENUM('KANJI', 'VOCABULARY', 'GRAMMAR', 'SENTENCE') NOT NULL,
  `item_id` BIGINT UNSIGNED NOT NULL,
  `order_index` INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`lesson_id`, `item_type`, `item_id`),
  CONSTRAINT `fk_lesson_items_lesson_id` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content_topics` (
  `topic_id` BIGINT UNSIGNED NOT NULL,
  `item_type` ENUM('KANJI', 'VOCABULARY', 'GRAMMAR', 'SENTENCE') NOT NULL,
  `item_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`topic_id`, `item_type`, `item_id`),
  CONSTRAINT `fk_content_topics_topic_id` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Question Engine
CREATE TABLE IF NOT EXISTS `questions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_type` ENUM('KANJI', 'VOCABULARY', 'GRAMMAR', 'SENTENCE') NOT NULL,
  `item_id` BIGINT UNSIGNED NOT NULL,
  `question_type` ENUM('MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'ORDER_WORDS', 'MEANING_MATCH') NOT NULL,
  `prompt` TEXT NOT NULL,
  `explanation_vi` TEXT NOT NULL,
  `acceptable_answers` JSON NULL,
  `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_questions_item` (`item_type`, `item_id`, `status`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `question_options` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `question_id` BIGINT UNSIGNED NOT NULL,
  `content` VARCHAR(255) NOT NULL,
  `is_correct` BOOLEAN NOT NULL DEFAULT FALSE,
  `order_index` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_options_question_id` (`question_id`),
  CONSTRAINT `fk_options_question_id` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Progress, Learning Sessions & Idempotent Events
CREATE TABLE IF NOT EXISTS `learning_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `jlpt_level` ENUM('N5', 'N4', 'N3', 'N2', 'N1') NOT NULL DEFAULT 'N5',
  `cards_viewed` INT UNSIGNED NOT NULL DEFAULT 0,
  `correct_answers` INT UNSIGNED NOT NULL DEFAULT 0,
  `incorrect_answers` INT UNSIGNED NOT NULL DEFAULT 0,
  `exp_gained` INT UNSIGNED NOT NULL DEFAULT 0,
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_sessions_user` (`user_id`, `started_at`),
  CONSTRAINT `fk_sessions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_progress` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `item_type` ENUM('KANJI', 'VOCABULARY', 'GRAMMAR', 'SENTENCE') NOT NULL,
  `item_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('NEW', 'LEARNING', 'REVIEW_DUE', 'MASTERED') NOT NULL DEFAULT 'NEW',
  `consecutive_correct` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_views` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_correct` INT UNSIGNED NOT NULL DEFAULT 0,
  `total_incorrect` INT UNSIGNED NOT NULL DEFAULT 0,
  `srs_stage` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `ease_factor` DECIMAL(4,2) NOT NULL DEFAULT 2.50,
  `next_review_at` DATETIME NULL,
  `last_reviewed_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_item` (`user_id`, `item_type`, `item_id`),
  INDEX `idx_user_review_due` (`user_id`, `next_review_at`, `status`),
  CONSTRAINT `fk_progress_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `learning_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `client_event_id` VARCHAR(64) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `item_type` ENUM('KANJI', 'VOCABULARY', 'GRAMMAR', 'SENTENCE', 'QUESTION') NOT NULL,
  `item_id` BIGINT UNSIGNED NOT NULL,
  `action` ENUM('SWIPE_RIGHT_KNOWN', 'SWIPE_LEFT_AGAIN', 'SWIPE_UP_NEXT', 'ANSWER_CORRECT', 'ANSWER_INCORRECT') NOT NULL,
  `payload` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_client_event_id` (`client_event_id`),
  INDEX `idx_user_learning_history` (`user_id`, `created_at`),
  CONSTRAINT `fk_events_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `answer_submissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `learning_event_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `question_id` BIGINT UNSIGNED NOT NULL,
  `selected_option_id` BIGINT UNSIGNED NULL,
  `submitted_text` TEXT NULL,
  `is_correct` BOOLEAN NOT NULL,
  `duration_ms` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_submissions_user_question` (`user_id`, `question_id`, `is_correct`),
  CONSTRAINT `fk_submissions_event_id` FOREIGN KEY (`learning_event_id`) REFERENCES `learning_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submissions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submissions_question_id` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_submissions_option_id` FOREIGN KEY (`selected_option_id`) REFERENCES `question_options` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
