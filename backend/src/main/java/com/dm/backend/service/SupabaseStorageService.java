package com.dm.backend.service;

import com.dm.backend.vo.FileSignedUrlVO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupabaseStorageService {

    private final RestClient restClient;

    public SupabaseStorageService() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5000);
        requestFactory.setReadTimeout(10000);
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    @Value("${supabase.project.url}")
    private String supabaseUrl;

    @Value("${supabase.project.key}")
    private String supabaseKey;

    @Value("${supabase.storage.bucket:documents}")
    private String bucket;

    public void upload(String storagePath, MultipartFile file) throws IOException {
        try {
            uploadObject(storagePath, file);
        } catch (HttpClientErrorException e) {
            if (!isBucketNotFound(e)) {
                throw e;
            }
            createBucket();
            uploadObject(storagePath, file);
        }
    }

    private void uploadObject(String storagePath, MultipartFile file) throws IOException {
        validateStorageConfig();

        restClient.post()
                .uri(normalizedUrl() + "/storage/v1/object/" + bucket + "/" + encodePath(storagePath))
                .header("apikey", supabaseKey)
                .header("Authorization", "Bearer " + supabaseKey)
                .header("x-upsert", "true")
                .contentType(resolveMediaType(file))
                .body(file.getBytes())
                .retrieve()
                .toBodilessEntity();
    }

    private void createBucket() {
        validateStorageConfig();

        try {
            restClient.post()
                    .uri(normalizedUrl() + "/storage/v1/bucket")
                    .header("apikey", supabaseKey)
                    .header("Authorization", "Bearer " + supabaseKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "id", bucket,
                            "name", bucket,
                            "public", false
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException e) {
            if (!isAlreadyExists(e)) {
                throw e;
            }
        }
    }

    private boolean isBucketNotFound(HttpClientErrorException e) {
        String body = e.getResponseBodyAsString();
        return body != null && body.contains("Bucket not found");
    }

    private boolean isAlreadyExists(HttpClientErrorException e) {
        String body = e.getResponseBodyAsString();
        return body != null && (body.contains("already exists") || body.contains("Duplicate"));
    }

    public String createSignedUrl(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            throw new IllegalArgumentException("Supabase storage path is empty.");
        }
        validateStorageConfig();

        FileSignedUrlVO response = restClient.post()
                .uri(normalizedUrl() + "/storage/v1/object/sign/" + bucket + "/" + encodePath(storagePath))
                .header("apikey", supabaseKey)
                .header("Authorization", "Bearer " + supabaseKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("expiresIn", 3600))
                .retrieve()
                .body(FileSignedUrlVO.class);

        if (response == null || response.getUrl() == null || response.getUrl().isBlank()) {
            return null;
        }
        return normalizedUrl() + "/storage/v1" + response.getUrl();
    }

    private MediaType resolveMediaType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        return MediaType.parseMediaType(contentType);
    }

    private String normalizedUrl() {
        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            throw new IllegalStateException("Supabase project URL is not configured.");
        }
        return supabaseUrl.endsWith("/") ? supabaseUrl.substring(0, supabaseUrl.length() - 1) : supabaseUrl;
    }

    private void validateStorageConfig() {
        if (supabaseUrl == null || supabaseUrl.isBlank()) {
            throw new IllegalStateException("Supabase project URL is not configured.");
        }
        if (supabaseKey == null || supabaseKey.isBlank()) {
            throw new IllegalStateException("Supabase project key is not configured.");
        }
        if (bucket == null || bucket.isBlank()) {
            throw new IllegalStateException("Supabase storage bucket is not configured.");
        }
    }

    private String encodePath(String path) {
        return UriUtils.encodePath(path, StandardCharsets.UTF_8);
    }
}
