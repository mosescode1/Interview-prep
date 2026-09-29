package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReviewCard struct {
	ID              uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID          uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_review_q" json:"user_id"`
	QuestionID      uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_review_q" json:"question_id"`
	EasinessFactor  float64   `gorm:"default:2.5" json:"easiness_factor"`
	IntervalDays    int       `gorm:"default:1" json:"interval_days"`
	Repetitions     int       `gorm:"default:0" json:"repetitions"`
	NextReview      time.Time `gorm:"type:date;not null;index" json:"next_review"`

	User     User     `gorm:"foreignKey:UserID" json:"-"`
	Question Question `gorm:"foreignKey:QuestionID" json:"question,omitempty"`
}

func (rc *ReviewCard) BeforeCreate(tx *gorm.DB) error {
	if rc.ID == uuid.Nil {
		rc.ID = uuid.New()
	}
	return nil
}
