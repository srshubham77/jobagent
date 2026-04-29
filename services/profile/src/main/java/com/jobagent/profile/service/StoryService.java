package com.jobagent.profile.service;

import com.jobagent.profile.domain.Story;
import com.jobagent.profile.repository.StoryRepository;
import com.jobagent.profile.web.dto.StoryRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class StoryService {

    private final StoryRepository storyRepository;

    public StoryService(StoryRepository storyRepository) {
        this.storyRepository = storyRepository;
    }

    @Transactional(readOnly = true)
    public List<Story> list(UUID userId) {
        return storyRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public Story get(UUID userId, UUID storyId) {
        return storyRepository.findByIdAndUserId(storyId, userId)
                .orElseThrow(() -> new NoSuchElementException("Story not found: " + storyId));
    }

    @Transactional
    public Story create(UUID userId, StoryRequest req) {
        var story = new Story();
        story.setUserId(userId);
        applyRequest(story, req);
        return storyRepository.save(story);
    }

    @Transactional
    public Story update(UUID userId, UUID storyId, StoryRequest req) {
        var story = get(userId, storyId);
        applyRequest(story, req);
        return storyRepository.save(story);
    }

    @Transactional
    public void delete(UUID userId, UUID storyId) {
        var story = get(userId, storyId);
        storyRepository.delete(story);
    }

    @Transactional(readOnly = true)
    public List<Story> findByTheme(UUID userId, String theme) {
        // Wrap in a JSON string literal so the @> operator can match a scalar element
        return storyRepository.findByUserIdAndTheme(userId, "\"" + theme + "\"");
    }

    private void applyRequest(Story story, StoryRequest req) {
        story.setTitle(req.title());
        story.setSituation(req.situation());
        story.setAction(req.action());
        story.setResult(req.result());
        story.setMetrics(req.metrics());
        story.setThemes(req.themes());
        story.setVariants(req.variants());
        story.setSourceRef(req.sourceRef());
    }
}
