package com.jobagent.profile.web;

import com.jobagent.profile.domain.Story;
import com.jobagent.profile.service.StoryService;
import com.jobagent.profile.web.dto.StoryRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/stories")
public class StoryController {

    private final StoryService storyService;

    public StoryController(StoryService storyService) {
        this.storyService = storyService;
    }

    @GetMapping
    public ResponseEntity<List<Story>> list(@CurrentUserId UUID userId,
                                            @RequestParam(required = false) String theme) {
        List<Story> stories = theme != null
                ? storyService.findByTheme(userId, theme)
                : storyService.list(userId);
        return ResponseEntity.ok(stories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Story> get(@CurrentUserId UUID userId, @PathVariable UUID id) {
        return ResponseEntity.ok(storyService.get(userId, id));
    }

    @PostMapping
    public ResponseEntity<Story> create(@CurrentUserId UUID userId,
                                        @Valid @RequestBody StoryRequest req) {
        Story story = storyService.create(userId, req);
        return ResponseEntity.created(URI.create("/stories/" + story.getId())).body(story);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Story> update(@CurrentUserId UUID userId,
                                        @PathVariable UUID id,
                                        @Valid @RequestBody StoryRequest req) {
        return ResponseEntity.ok(storyService.update(userId, id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        storyService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
