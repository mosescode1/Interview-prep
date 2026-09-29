package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Question struct {
	ID                 uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Title              string         `gorm:"not null" json:"title"`
	Body               string         `gorm:"type:text;not null" json:"body"`
	Track              string         `gorm:"not null;index" json:"track"`
	Subtopic           string         `gorm:"not null;index" json:"subtopic"`
	Difficulty         string         `gorm:"not null;index" json:"difficulty"`
	Level              int            `gorm:"not null;index;default:1" json:"level"`
	QuestionType       string         `gorm:"not null" json:"question_type"`
	Language           string         `json:"language,omitempty"`
	Hints              JSON           `gorm:"type:jsonb" json:"hints,omitempty"`
	Solution           string         `gorm:"type:text" json:"solution,omitempty"`
	EvaluationCriteria JSON           `gorm:"type:jsonb" json:"evaluation_criteria,omitempty"`
	Options            JSON           `gorm:"type:jsonb" json:"options,omitempty"`
	CorrectAnswer      string         `json:"correct_answer,omitempty"`
	FollowUpPrompts    JSON           `gorm:"type:jsonb" json:"follow_up_prompts,omitempty"`
	Tags               pq.StringArray `gorm:"type:text[]" json:"tags"`
	CreatedAt          time.Time      `json:"created_at"`
}

func (q *Question) BeforeCreate(tx *gorm.DB) error {
	if q.ID == uuid.Nil {
		q.ID = uuid.New()
	}
	return nil
}
