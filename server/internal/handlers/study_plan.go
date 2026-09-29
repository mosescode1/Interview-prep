package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/mosescode1/interview-prep/server/internal/models"
	"github.com/mosescode1/interview-prep/server/internal/services"
	"gorm.io/gorm"
)

type StudyPlanHandler struct {
	DB *gorm.DB
}

func (h *StudyPlanHandler) Today(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var cards []models.ReviewCard
	h.DB.Preload("Question").
		Where("user_id = ? AND next_review <= ?", userID, time.Now()).
		Order("next_review ASC").
		Find(&cards)

	c.JSON(http.StatusOK, cards)
}

func (h *StudyPlanHandler) Review(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var input struct {
		QuestionID string `json:"question_id" binding:"required"`
		Quality    int    `json:"quality" binding:"min=0,max=5"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	questionID, err := uuid.Parse(input.QuestionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid question id"})
		return
	}

	var card models.ReviewCard
	if err := h.DB.Where("user_id = ? AND question_id = ?", userID, questionID).First(&card).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "review card not found"})
		return
	}

	services.UpdateSM2(&card, input.Quality)
	h.DB.Save(&card)

	c.JSON(http.StatusOK, card)
}

func (h *StudyPlanHandler) Add(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var input struct {
		QuestionID string `json:"question_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	questionID, err := uuid.Parse(input.QuestionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid question id"})
		return
	}

	card := models.ReviewCard{
		UserID:         userID,
		QuestionID:     questionID,
		EasinessFactor: 2.5,
		IntervalDays:   1,
		NextReview:     time.Now(),
	}

	result := h.DB.Where("user_id = ? AND question_id = ?", userID, questionID).FirstOrCreate(&card)
	if result.RowsAffected == 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "already in review deck"})
		return
	}

	c.JSON(http.StatusCreated, card)
}

func (h *StudyPlanHandler) Stats(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	now := time.Now()

	var dueToday, dueThisWeek, mastered, totalCards int64

	h.DB.Model(&models.ReviewCard{}).Where("user_id = ? AND next_review <= ?", userID, now).Count(&dueToday)
	h.DB.Model(&models.ReviewCard{}).Where("user_id = ? AND next_review <= ?", userID, now.AddDate(0, 0, 7)).Count(&dueThisWeek)
	h.DB.Model(&models.ReviewCard{}).Where("user_id = ? AND interval_days >= 21", userID).Count(&mastered)
	h.DB.Model(&models.ReviewCard{}).Where("user_id = ?", userID).Count(&totalCards)

	c.JSON(http.StatusOK, gin.H{
		"due_today":     dueToday,
		"due_this_week": dueThisWeek,
		"mastered":      mastered,
		"total_cards":   totalCards,
	})
}
