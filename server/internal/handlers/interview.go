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

type InterviewHandler struct {
	DB *gorm.DB
}

type interviewStartInput struct {
	Mode       string `json:"mode" binding:"required,oneof=quick standard mock rapid_fire code_review"`
	Track      string `json:"track"`
	Difficulty string `json:"difficulty"`
	Level      int    `json:"level"`
	Count      int    `json:"count"`
	TimeLimit  int    `json:"time_limit_sec"`
}

func (h *InterviewHandler) Start(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var input interviewStartInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	count := input.Count
	if count == 0 {
		switch input.Mode {
		case "quick":
			count = 5
		case "standard":
			count = 10
		case "mock":
			count = 20
		case "rapid_fire":
			count = 15
		case "code_review":
			count = 5
		}
	}

	query := h.DB.Model(&models.Question{})
	if input.Track != "" {
		query = query.Where("track = ?", input.Track)
	}
	if input.Difficulty != "" {
		query = query.Where("difficulty = ?", input.Difficulty)
	}
	if input.Level > 0 {
		query = query.Where("level = ?", input.Level)
	}
	if input.Mode == "code_review" {
		query = query.Where("question_type = ?", "code_review")
	}

	var questions []models.Question
	query.Order("RANDOM()").Limit(count).Find(&questions)

	if len(questions) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "no questions match filters"})
		return
	}

	configJSON, _ := json.Marshal(map[string]interface{}{
		"track":          input.Track,
		"difficulty":     input.Difficulty,
		"level":          input.Level,
		"time_limit_sec": input.TimeLimit,
		"question_count": len(questions),
	})

	session := models.Session{
		UserID:    userID,
		Type:      "interview",
		Mode:      input.Mode,
		Status:    "active",
		Config:    models.JSON(configJSON),
		StartedAt: time.Now(),
	}
	h.DB.Create(&session)

	for i, q := range questions {
		step := models.SessionStep{
			SessionID:  session.ID,
			QuestionID: &q.ID,
			StepNumber: i + 1,
			Prompt:     q.Body,
		}
		h.DB.Create(&step)
	}

	for i := range questions {
		questions[i].Solution = ""
		questions[i].CorrectAnswer = ""
	}

	c.JSON(http.StatusCreated, gin.H{
		"session":   session,
		"questions": questions,
	})
}

type answerInput struct {
	StepID   string `json:"step_id" binding:"required"`
	Response string `json:"response" binding:"required"`
}

func (h *InterviewHandler) Answer(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("sessionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	var input answerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	stepID, err := uuid.Parse(input.StepID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid step id"})
		return
	}

	var step models.SessionStep
	if err := h.DB.Preload("Question").Where("id = ? AND session_id = ?", stepID, sessionID).First(&step).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "step not found"})
		return
	}

	step.UserResponse = input.Response

	evaluation := map[string]interface{}{
		"submitted":   true,
		"response_len": len(input.Response),
	}
	evalJSON, _ := json.Marshal(evaluation)
	step.AIEvaluation = models.JSON(evalJSON)

	h.DB.Save(&step)

	var followUps []string
	if step.Question != nil && len(step.Question.FollowUpPrompts) > 0 {
		json.Unmarshal(step.Question.FollowUpPrompts, &followUps)
	}

	c.JSON(http.StatusOK, gin.H{
		"evaluation": evaluation,
		"follow_ups": followUps,
	})
}

func (h *InterviewHandler) Hint(c *gin.Context) {
	sessionID, err := uuid.Parse(c.Param("sessionId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid session id"})
		return
	}

	stepID, err := uuid.Parse(c.Query("step_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "step_id required"})
		return
	}

	var step models.SessionStep
	if err := h.DB.Preload("Question").Where("id = ? AND session_id = ?", stepID, sessionID).First(&step).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "step not found"})
		return
	}

	var hints []string
	if step.Question != nil {
		json.Unmarshal(step.Question.Hints, &hints)
	}

	if step.HintsUsed >= len(hints) {
		c.JSON(http.StatusOK, gin.H{"hint": nil, "message": "no more hints available"})
		return
	}

	hint := hints[step.HintsUsed]
	step.HintsUsed++
	h.DB.Save(&step)

	c.JSON(http.StatusOK, gin.H{
		"hint":       hint,
		"hint_number": step.HintsUsed,
		"total_hints": len(hints),
	})
}

func (h *InterviewHandler) Finish(c *gin.Context) {
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
	h.DB.Preload("Steps").First(&session, "id = ?", sessionID)

	answered := 0
	for _, step := range session.Steps {
		if step.UserResponse != "" {
			answered++
		}
	}
	session.Score = answered

	h.DB.Save(&session)

	c.JSON(http.StatusOK, gin.H{
		"session":          session,
		"questions_total":  len(session.Steps),
		"questions_answered": answered,
	})
}
