CREATE TABLE user_language (
    user_id VARCHAR2(21 CHAR) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR2(2 CHAR) DEFAULT 'ko' NOT NULL,
    updated_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_user_language_language ON user_language(language);
