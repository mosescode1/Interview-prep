package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/mosescode1/interview-prep/server/internal/models"
	"gorm.io/gorm"
)

type DebugLabHandler struct {
	DB *gorm.DB
}

func (h *DebugLabHandler) ListScenarios(c *gin.Context) {
	query := h.DB.Model(&models.Scenario{}).Where("type = ?", "debug")

	if track := c.Query("track"); track != "" {
		query = query.Where("track = ?", track)
	}
	if difficulty := c.Query("difficulty"); difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}
	if level := c.Query("level"); level != "" {
		query = query.Where("level = ?", level)
	}

	var scenarios []models.Scenario
	query.Select("id, title, description, track, difficulty, level, tags, created_at").
		Order("level, difficulty").
		Find(&scenarios)

	c.JSON(http.StatusOK, scenarios)
}

func (h *DebugLabHandler) Start(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var input struct {
		ScenarioID string `json:"scenario_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	scenarioID, err := uuid.Parse(input.ScenarioID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid scenario id"})
		return
	}

	var scenario models.Scenario
	if err := h.DB.First(&scenario, "id = ? AND type = ?", scenarioID, "debug").Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "scenario not found"})
		return
	}

	var stages []map[string]interface{}
	json.Unmarshal(scenario.Stages, &stages)

	session := models.Session{
		UserID:       userID,
		Type:         "debug",
		ScenarioID:   &scenarioID,
		Mode:         "debug_lab",
		CurrentStage: "observe",
		Status:       "active",
		StartedAt:    time.Now(),
	}
	h.DB.Create(&session)

	firstPrompt := scenario.Description
	if len(stages) > 0 {
		if prompt, ok := stages[0]["prompt"].(string); ok {
			firstPrompt = prompt
		}
	}

	step := models.SessionStep{
		SessionID:  session.ID,
		Stage:      "observe",
		StepNumber: 1,
		Prompt:     firstPrompt,
	}
	h.DB.Create(&step)

	c.JSON(http.StatusCreated, gin.H{
		"session":       session,
		"scenario":      gin.H{"id": scenario.ID, "title": scenario.Title, "description": scenario.Description},
		"current_stage": "observe",
		"prompt":        firstPrompt,
		"stages":        []string{"observe", "locate", "identify", "fix", "verify"},
	})
}

func (h *DebugLabHandler) Investigate(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("sessionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	var input struct {
		Response string `json:"response" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var session models.Session
	if err := h.DB.Preload("Scenario").First(&session, "id = ? AND type = ?", sessionID, "debug").Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	var lastStep models.SessionStep
	h.DB.Where("session_id = ?", sessionID).Order("step_number DESC").First(&lastStep)

	lastStep.UserResponse = input.Response
	h.DB.Save(&lastStep)

	var stages []map[string]interface{}
	json.Unmarshal(session.Scenario.Stages, &stages)

	debugStageOrder := []string{"observe", "locate", "identify", "fix", "verify"}
	currentIdx := -1
	for i, s := range debugStageOrder {
		if s == session.CurrentStage {
			currentIdx = i
			break
		}
	}

	var evidence interface{}
	var nextPrompt string
	stageAdvanced := false

	for _, s := range stages {
		if name, ok := s["name"].(string); ok && name == session.CurrentStage {
			evidence = s["evidence"]
			break
		}
	}

	if currentIdx >= 0 && currentIdx < len(debugStageOrder)-1 {
		nextStageName := debugStageOrder[currentIdx+1]
		session.CurrentStage = nextStageName
		stageAdvanced = true
		h.DB.Save(&session)

		for _, s := range stages {
			if name, ok := s["name"].(string); ok && name == nextStageName {
				nextPrompt, _ = s["prompt"].(string)
				break
			}
		}

		evidenceJSON, _ := json.Marshal(evidence)
		newStep := models.SessionStep{
			SessionID:        sessionID,
			Stage:            nextStageName,
			StepNumber:       lastStep.StepNumber + 1,
			Prompt:           nextPrompt,
			EvidenceRevealed: models.JSON(evidenceJSON),
		}
		h.DB.Create(&newStep)
	}

	c.JSON(http.StatusOK, gin.H{
		"evidence":       evidence,
		"stage_advanced": stageAdvanced,
		"current_stage":  session.CurrentStage,
		"next_prompt":    nextPrompt,
	})
}

func (h *DebugLabHandler) Hint(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("sessionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	var session models.Session
	if err := h.DB.Preload("Scenario").First(&session, "id = ?", sessionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	var stages []map[string]interface{}
	json.Unmarshal(session.Scenario.Stages, &stages)

	for _, s := range stages {
		if name, ok := s["name"].(string); ok && name == session.CurrentStage {
			if hints, ok := s["hints"].([]interface{}); ok {
				var lastStep models.SessionStep
				h.DB.Where("session_id = ?", sessionID).Order("step_number DESC").First(&lastStep)

				if lastStep.HintsUsed < len(hints) {
					hint := hints[lastStep.HintsUsed]
					lastStep.HintsUsed++
					h.DB.Save(&lastStep)

					c.JSON(http.StatusOK, gin.H{
						"hint":        hint,
						"hint_number": lastStep.HintsUsed,
						"total_hints": len(hints),
					})
					return
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"hint": nil, "message": "no more hints available"})
}

func (h *DebugLabHandler) Finish(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("sessionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	now := time.Now()
	h.DB.Model(&models.Session{}).Where("id = ?", sessionID).Updates(map[string]interface{}{
		"status":   "completed",
		"ended_at": now,
	})

	var session models.Session
	h.DB.Preload("Steps", func(db *gorm.DB) *gorm.DB {
		return db.Order("step_number ASC")
	}).First(&session, "id = ?", sessionID)

	c.JSON(http.StatusOK, session)
}
