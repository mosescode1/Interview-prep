package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/mosescode1/interview-prep/server/internal/models"
	"gorm.io/gorm"
)

type ProgressHandler struct {
	DB *gorm.DB
}

func (h *ProgressHandler) Dashboard(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var progress []models.UserProgress
	h.DB.Where("user_id = ?", userID).Find(&progress)

	tracks := []string{"fundamentals", "development", "testing", "devops", "production", "security", "databases", "architecture"}
	trackScores := make(map[string]float64)
	for _, t := range tracks {
		trackScores[t] = 0
	}
	for _, p := range progress {
		if p.QuestionsAttempted > 0 {
			trackScores[p.Track] = p.AvgScore
		}
	}

	var totalSessions int64
	h.DB.Model(&models.Session{}).Where("user_id = ? AND status = ?", userID, "completed").Count(&totalSessions)

	c.JSON(http.StatusOK, gin.H{
		"track_scores":    trackScores,
		"total_sessions":  totalSessions,
		"progress_detail": progress,
	})
}

func (h *ProgressHandler) WeakAreas(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var weak []models.UserProgress
	h.DB.Where("user_id = ? AND avg_score < 60 AND questions_attempted > 0", userID).
		Order("avg_score ASC").
		Limit(10).
		Find(&weak)

	c.JSON(http.StatusOK, weak)
}

func (h *ProgressHandler) Recommendations(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var weak []models.UserProgress
	h.DB.Where("user_id = ? AND avg_score < 60 AND questions_attempted > 0", userID).
		Order("avg_score ASC").
		Limit(5).
		Find(&weak)

	tracks := []string{"fundamentals", "development", "testing", "devops", "production", "security", "databases", "architecture"}
	var attempted []string
	h.DB.Model(&models.UserProgress{}).
		Where("user_id = ?", userID).
		Distinct("track").
		Pluck("track", &attempted)

	attemptedMap := make(map[string]bool)
	for _, t := range attempted {
		attemptedMap[t] = true
	}

	var unexplored []string
	for _, t := range tracks {
		if !attemptedMap[t] {
			unexplored = append(unexplored, t)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"weak_areas":       weak,
		"unexplored_tracks": unexplored,
	})
}
