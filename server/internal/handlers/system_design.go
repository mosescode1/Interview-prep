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

type SystemDesignHandler struct {
	DB *gorm.DB
}

func (h *SystemDesignHandler) ListProblems(c *gin.Context) {
	query := h.DB.Model(&models.Scenario{}).Where("type = ?", "design")

	if difficulty := c.Query("difficulty"); difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}
	if level := c.Query("level"); level != "" {
		query = query.Where("level = ?", level)
	}

	var scenarios []models.Scenario
	query.Select("id, title, description, difficulty, level, tags, created_at").
		Order("level, difficulty").
		Find(&scenarios)

	c.JSON(http.StatusOK, scenarios)
}

func (h *SystemDesignHandler) Start(c *gin.Context) {
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
	if err := h.DB.First(&scenario, "id = ? AND type = ?", scenarioID, "design").Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "design problem not found"})
		return
	}

	var stages []map[string]interface{}
	json.Unmarshal(scenario.Stages, &stages)

	firstStage := ""
	firstPrompt := scenario.Description
	if len(stages) > 0 {
		if name, ok := stages[0]["name"].(string); ok {
			firstStage = name
		}
		if prompt, ok := stages[0]["prompt"].(string); ok {
			firstPrompt = prompt
		}
	}

	session := models.Session{
		UserID:       userID,
		Type:         "design",
		ScenarioID:   &scenarioID,
		Mode:         "system_design",
		CurrentStage: firstStage,
		Status:       "active",
		StartedAt:    time.Now(),
	}
	h.DB.Create(&session)

	step := models.SessionStep{
		SessionID:  session.ID,
		Stage:      firstStage,
		StepNumber: 1,
		Prompt:     firstPrompt,
	}
	h.DB.Create(&step)

	c.JSON(http.StatusCreated, gin.H{
		"session":       session,
		"scenario":      scenario,
		"current_stage": firstStage,
		"prompt":        firstPrompt,
		"stages":        stages,
	})
}

func (h *SystemDesignHandler) GetSession(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("sessionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	var session models.Session
	if err := h.DB.Preload("Scenario").Preload("Steps", func(db *gorm.DB) *gorm.DB {
		return db.Order("step_number ASC")
	}).First(&session, "id = ?", sessionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	c.JSON(http.StatusOK, session)
}

func (h *SystemDesignHandler) Submit(c *gin.Context) {
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
	if err := h.DB.Preload("Scenario").First(&session, "id = ? AND type = ?", sessionID, "design").Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	var lastStep models.SessionStep
	h.DB.Where("session_id = ?", sessionID).Order("step_number DESC").First(&lastStep)

	lastStep.UserResponse = input.Response
	evaluation := map[string]interface{}{
		"submitted": true,
		"stage":     session.CurrentStage,
	}
	evalJSON, _ := json.Marshal(evaluation)
	lastStep.AIEvaluation = models.JSON(evalJSON)
	h.DB.Save(&lastStep)

	var stages []map[string]interface{}
	json.Unmarshal(session.Scenario.Stages, &stages)

	currentIdx := -1
	for i, s := range stages {
		if name, ok := s["name"].(string); ok && name == session.CurrentStage {
			currentIdx = i
			break
		}
	}

	var nextPrompt string
	stageAdvanced := false

	if currentIdx >= 0 && currentIdx < len(stages)-1 {
		nextStage := stages[currentIdx+1]
		nextStageName, _ := nextStage["name"].(string)
		nextPrompt, _ = nextStage["prompt"].(string)

		session.CurrentStage = nextStageName
		stageAdvanced = true
		h.DB.Save(&session)

		newStep := models.SessionStep{
			SessionID:  sessionID,
			Stage:      nextStageName,
			StepNumber: lastStep.StepNumber + 1,
			Prompt:     nextPrompt,
		}
		h.DB.Create(&newStep)
	}

	var challengeQuestions []string
	if currentIdx >= 0 {
		if challenges, ok := stages[currentIdx]["challenges"].([]interface{}); ok {
			for _, ch := range challenges {
				if s, ok := ch.(string); ok {
					challengeQuestions = append(challengeQuestions, s)
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"evaluation":     evaluation,
		"challenges":     challengeQuestions,
		"stage_advanced": stageAdvanced,
		"current_stage":  session.CurrentStage,
		"next_prompt":    nextPrompt,
	})
}

func (h *SystemDesignHandler) Hint(c *gin.Context) {
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

func (h *SystemDesignHandler) Finish(c *gin.Context) {
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

	stagesCompleted := 0
	for _, step := range session.Steps {
		if step.UserResponse != "" {
			stagesCompleted++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"session":          session,
		"stages_completed": stagesCompleted,
		"total_stages":     len(session.Steps),
	})
}
