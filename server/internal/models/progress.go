package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserProgress struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID             uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_track_subtopic" json:"user_id"`
	Track              string    `gorm:"not null;uniqueIndex:idx_user_track_subtopic" json:"track"`
	Subtopic           string    `gorm:"not null;uniqueIndex:idx_user_track_subtopic" json:"subtopic"`
	QuestionsAttempted int       `gorm:"default:0" json:"questions_attempted"`
	QuestionsCorrect   int       `gorm:"default:0" json:"questions_correct"`
	AvgScore           float64   `gorm:"default:0" json:"avg_score"`
	Level              int       `gorm:"default:1" json:"level"`
	UpdatedAt          time.Time `json:"updated_at"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

func (up *UserProgress) BeforeCreate(tx *gorm.DB) error {
	if up.ID == uuid.Nil {
		up.ID = uuid.New()
	}
	return nil
}
