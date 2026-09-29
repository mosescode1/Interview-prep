package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SessionStep struct {
	ID               uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	SessionID        uuid.UUID  `gorm:"type:uuid;not null;index" json:"session_id"`
	QuestionID       *uuid.UUID `gorm:"type:uuid" json:"question_id,omitempty"`
	Stage            string     `json:"stage,omitempty"`
	StepNumber       int        `gorm:"not null" json:"step_number"`
	Prompt           string     `gorm:"type:text;not null" json:"prompt"`
	UserResponse     string     `gorm:"type:text" json:"user_response,omitempty"`
	AIEvaluation     JSON       `gorm:"type:jsonb" json:"ai_evaluation,omitempty"`
	HintsUsed        int        `gorm:"default:0" json:"hints_used"`
	EvidenceRevealed JSON       `gorm:"type:jsonb" json:"evidence_revealed,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`

	Question *Question `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
}

func (ss *SessionStep) BeforeCreate(tx *gorm.DB) error {
	if ss.ID == uuid.Nil {
		ss.ID = uuid.New()
	}
	return nil
}
