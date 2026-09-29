package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/mosescode1/interview-prep/server/internal/models"
	"gorm.io/gorm"
)

type QuestionHandler struct {
	DB *gorm.DB
}

func (h *QuestionHandler) List(c *gin.Context) {
	query := h.DB.Model(&models.Question{})

	if track := c.Query("track"); track != "" {
		query = query.Where("track = ?", track)
	}
	if subtopic := c.Query("subtopic"); subtopic != "" {
		query = query.Where("subtopic = ?", subtopic)
	}
	if difficulty := c.Query("difficulty"); difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}
	if level := c.Query("level"); level != "" {
		query = query.Where("level = ?", level)
	}
	if qType := c.Query("type"); qType != "" {
		query = query.Where("question_type = ?", qType)
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	var total int64
	query.Count(&total)

	var questions []models.Question
	query.Select("id, title, track, subtopic, difficulty, level, question_type, language, tags, created_at").
		Offset((page - 1) * limit).Limit(limit).
		Order("track, subtopic, difficulty").
		Find(&questions)

	c.JSON(http.StatusOK, gin.H{
		"questions": questions,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}

func (h *QuestionHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var question models.Question
	if err := h.DB.First(&question, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		return
	}

	question.Solution = ""
	c.JSON(http.StatusOK, question)
}

func (h *QuestionHandler) GetSolution(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var question models.Question
	if err := h.DB.Select("id, solution").First(&question, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"solution": question.Solution})
}
