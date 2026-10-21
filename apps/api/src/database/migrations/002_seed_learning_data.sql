-- Migration 002: Seed Core Learning Engine Data
-- Sakura Swipe Learning

-- 1. Ensure Seed Users exist
INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `is_active`)
VALUES
  (1, 'admin@sakura.app', '$2a$10$wTf20f0ZzV12871.3xJt4eeZ.u5Pfq/Y5z47h1R7mH.9mF6wR.fwe', 'ADMIN', TRUE),
  (2, 'user@sakura.app', '$2a$10$wTf20f0ZzV12871.3xJt4eeZ.u5Pfq/Y5z47h1R7mH.9mF6wR.fwe', 'USER', TRUE)
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

INSERT INTO `user_profiles` (`user_id`, `display_name`, `target_jlpt`, `total_exp`, `current_streak_days`)
VALUES
  (1, 'Sakura Admin', 'N1', 1000, 15),
  (2, 'Sakura Learner', 'N5', 120, 3)
ON DUPLICATE KEY UPDATE `display_name` = VALUES(`display_name`);

-- 2. Seed Topics
INSERT INTO `topics` (`id`, `slug`, `title_vi`, `title_ja`, `icon_name`)
VALUES
  (1, 'nature', 'Thiên nhiên & Thời gian', '自然と時間', 'leaf'),
  (2, 'daily-life', 'Đời sống hàng ngày', '日常生活', 'home')
ON DUPLICATE KEY UPDATE `title_vi` = VALUES(`title_vi`);

-- 3. Seed Lessons
INSERT INTO `lessons` (`id`, `title`, `description_vi`, `jlpt_level`, `order_index`, `status`)
VALUES
  (1, 'Bài 1: Chữ Hán Mặt Trời & Mặt Trăng', 'Làm quen với các chữ Hán cơ bản nhất chỉ ngày, tháng và các thứ trong tuần', 'N5', 1, 'PUBLISHED')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 4. Seed Kanji (N5)
INSERT INTO `kanji` (`id`, `character`, `han_viet`, `onyomi`, `kunyomi`, `stroke_count`, `radical`, `meaning_vi`, `status`)
VALUES
  (1, '日', 'NHẬT', 'ニチ, ジツ', 'ひ, -び, -か', 4, '日', 'Mặt trời, ban ngày, ngày', 'PUBLISHED'),
  (2, '月', 'NGUYỆT', 'ゲツ, ガツ', 'つき', 4, '月', 'Mặt trăng, tháng', 'PUBLISHED'),
  (3, '木', 'MỘC', 'モク, ボク', 'き, こ-', 4, '木', 'Cây, gỗ, ngày thứ Năm', 'PUBLISHED'),
  (4, '水', 'THỦY', 'スイ', 'みず', 4, '水', 'Nước, chất lỏng, ngày thứ Tư', 'PUBLISHED')
ON DUPLICATE KEY UPDATE `character` = VALUES(`character`);

INSERT INTO `kanji_jlpt` (`kanji_id`, `jlpt_level`)
VALUES
  (1, 'N5'),
  (2, 'N5'),
  (3, 'N5'),
  (4, 'N5')
ON DUPLICATE KEY UPDATE `jlpt_level` = VALUES(`jlpt_level`);

INSERT INTO `kanji_examples` (`id`, `kanji_id`, `word`, `reading`, `meaning_vi`, `sentence_jp`, `sentence_vi`, `order_index`)
VALUES
  (1, 1, '日本', 'にほん', 'Nhật Bản', '日本の春は桜が綺麗です。', 'Mùa xuân Nhật Bản hoa anh đào rất đẹp.', 1),
  (2, 1, '日曜日', 'にちようび', 'Chủ nhật', '日曜日に休みます。', 'Tôi nghỉ vào ngày Chủ nhật.', 2),
  (3, 2, '月曜日', 'げつようび', 'Thứ Hai', '月曜日に学校へ行きます。', 'Tôi đi học vào thứ Hai.', 1),
  (4, 3, '木曜日', 'もくようび', 'Thứ Năm', '木曜日に買い物をします。', 'Tôi đi mua sắm vào thứ Năm.', 1),
  (5, 4, '水曜日', 'すいようび', 'Thứ Tư', '水曜日に泳ぎます。', 'Tôi bơi vào thứ Tư.', 1)
ON DUPLICATE KEY UPDATE `word` = VALUES(`word`);

-- 5. Seed Vocabulary (N5)
INSERT INTO `vocabulary` (`id`, `word`, `reading`, `romaji`, `part_of_speech`, `meaning_vi`, `status`)
VALUES
  (1, '日本', 'にほん', 'nihon', 'noun', 'Nhật Bản', 'PUBLISHED'),
  (2, '月曜日', 'げつようび', 'getsuyoubi', 'noun', 'Thứ Hai', 'PUBLISHED'),
  (3, '水', 'みず', 'mizu', 'noun', 'Nước', 'PUBLISHED')
ON DUPLICATE KEY UPDATE `word` = VALUES(`word`);

INSERT INTO `vocab_jlpt` (`vocab_id`, `jlpt_level`)
VALUES
  (1, 'N5'),
  (2, 'N5'),
  (3, 'N5')
ON DUPLICATE KEY UPDATE `jlpt_level` = VALUES(`jlpt_level`);

INSERT INTO `vocab_kanji` (`vocab_id`, `kanji_id`)
VALUES
  (1, 1),
  (2, 2),
  (3, 4)
ON DUPLICATE KEY UPDATE `kanji_id` = VALUES(`kanji_id`);

-- 6. Seed Grammar (N5)
INSERT INTO `grammar` (`id`, `title`, `structure`, `meaning_vi`, `usage_notes`, `status`)
VALUES
  (1, '〜は〜です', 'N1 は N2 です', 'N1 là N2', 'Mẫu câu khẳng định cơ bản trong tiếng Nhật', 'PUBLISHED'),
  (2, '〜は〜ではありません', 'N1 は N2 ではありません', 'N1 không phải là N2', 'Mẫu câu phủ định lịch sự', 'PUBLISHED')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

INSERT INTO `grammar_jlpt` (`grammar_id`, `jlpt_level`)
VALUES
  (1, 'N5'),
  (2, 'N5')
ON DUPLICATE KEY UPDATE `jlpt_level` = VALUES(`jlpt_level`);

-- 7. Seed Sentences
INSERT INTO `sentences` (`id`, `sentence_jp`, `sentence_vi`, `grammar_id`, `vocab_id`)
VALUES
  (1, '私は日本人です。', 'Tôi là người Nhật Bản.', 1, 1),
  (2, '今日は月曜日ではありません。', 'Hôm nay không phải là thứ Hai.', 2, 2)
ON DUPLICATE KEY UPDATE `sentence_jp` = VALUES(`sentence_jp`);

-- 8. Link Lesson Items
INSERT INTO `lesson_items` (`lesson_id`, `item_type`, `item_id`, `order_index`)
VALUES
  (1, 'KANJI', 1, 1),
  (1, 'KANJI', 2, 2),
  (1, 'VOCABULARY', 1, 3),
  (1, 'VOCABULARY', 2, 4),
  (1, 'GRAMMAR', 1, 5)
ON DUPLICATE KEY UPDATE `order_index` = VALUES(`order_index`);

-- 9. Seed Questions
INSERT INTO `questions` (`id`, `item_type`, `item_id`, `question_type`, `prompt`, `explanation_vi`, `acceptable_answers`, `status`)
VALUES
  (1, 'KANJI', 1, 'MULTIPLE_CHOICE', 'Chọn cách đọc đúng của chữ Kanji: 日 (trong từ 日本)', 'Trong từ 日本 (Nihon), chữ 日 (Nhật) đọc là に.', NULL, 'PUBLISHED'),
  (2, 'KANJI', 2, 'FILL_IN_BLANK', 'Nhập cách đọc hiragana của chữ: 月 (trong từ 月曜日)', 'Trong từ 月曜日 (getsuyoubi), chữ 月 đọc là げつ.', '["げつ", "getsu"]', 'PUBLISHED'),
  (3, 'VOCABULARY', 3, 'MEANING_MATCH', 'Chọn nghĩa đúng của từ: 水 (みず)', '水 (みず) có nghĩa là nước.', NULL, 'PUBLISHED'),
  (4, 'GRAMMAR', 1, 'ORDER_WORDS', 'Sắp xếp các từ thành câu đúng: "Tôi là người Nhật Bản"', 'Cấu trúc: 私は [N] です -> 私は日本人です。', '["私は日本人です", "わたしはにほんじんです"]', 'PUBLISHED')
ON DUPLICATE KEY UPDATE `prompt` = VALUES(`prompt`);

INSERT INTO `question_options` (`id`, `question_id`, `content`, `is_correct`, `order_index`)
VALUES
  (1, 1, 'に', TRUE, 1),
  (2, 1, 'つき', FALSE, 2),
  (3, 1, 'ほん', FALSE, 3),
  (4, 1, 'みず', FALSE, 4),
  (5, 3, 'Nước', TRUE, 1),
  (6, 3, 'Lửa', FALSE, 2),
  (7, 3, 'Cây', FALSE, 3),
  (8, 3, 'Đất', FALSE, 4)
ON DUPLICATE KEY UPDATE `content` = VALUES(`content`);
