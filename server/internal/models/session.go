package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Session struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID       uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	Type         string     `gorm:"not null" json:"type"` // interview, debug, design
	ScenarioID   *uuid.UUID `gorm:"type:uuid" json:"scenario_id,omitempty"`
	Mode         string     `gorm:"not null" json:"mode"` // quick, standard, mock, rapid_fire, code_review, debug_lab, system_design
	CurrentStage string     `json:"current_stage,omitempty"`
	Status       string     `gorm:"not null;default:active" json:"status"` // active, completed, abandoned
	Config       JSON       `gorm:"type:jsonb" json:"config,omitempty"`
	Score        int        `json:"score"`
	StartedAt    time.Time  `json:"started_at"`
	EndedAt      *time.Time `json:"ended_at,omitempty"`

	User     User          `gorm:"foreignKey:UserID" json:"-"`
	Scenario *Scenario     `gorm:"foreignKey:ScenarioID" json:"scenario,omitempty"`
	Steps    []SessionStep `gorm:"foreignKey:SessionID" json:"steps,omitempty"`
}

func (s *Session) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
