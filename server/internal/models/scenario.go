package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Scenario struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Title          string         `gorm:"not null" json:"title"`
	Description    string         `gorm:"type:text;not null" json:"description"`
	Type           string         `gorm:"not null;index" json:"type"` // debug, design
	Track          string         `gorm:"not null;index" json:"track"`
	Difficulty     string         `gorm:"not null;index" json:"difficulty"`
	Level          int            `gorm:"not null;index;default:1" json:"level"`
	Stages         JSON           `gorm:"type:jsonb;not null" json:"stages"`
	InitialContext JSON           `gorm:"type:jsonb" json:"initial_context,omitempty"`
	Tags           pq.StringArray `gorm:"type:text[]" json:"tags"`
	CreatedAt      time.Time      `json:"created_at"`
}

func (s *Scenario) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
