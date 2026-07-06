package com.dm.backend.service;

import com.dm.backend.mapper.UserLanguageMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserLanguageService {

    @Autowired
    private UserLanguageMapper userLanguageMapper;

    public String getLanguage(String userId) {

        if (userId == null || userId.isBlank()) {
            return "ko";
        }

        try {
            return normalize(userLanguageMapper.getLanguage(userId));
        } catch (Exception e) {
            return "ko";
        }
    }

    public void updateLanguage(String userId, String language) {

        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("user_id is required.");
        }

        userLanguageMapper.upsertLanguage(
                userId,
                normalize(language)
        );
    }

    public String normalize(String language) {

        if (language == null || language.isBlank()) {
            return "ko";
        }

        String normalized = language.trim().toLowerCase();

        if ("english".equals(normalized)) {
            return "en";
        }

        if ("日本語".equals(language.trim()) || "japanese".equals(normalized)) {
            return "ja";
        }

        if ("en".equals(normalized) || "ja".equals(normalized)) {
            return normalized;
        }

        return "ko";
    }
}
