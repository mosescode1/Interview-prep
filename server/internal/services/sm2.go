package services

import (
	"math"
	"time"

	"github.com/mosescode1/interview-prep/server/internal/models"
)

func UpdateSM2(card *models.ReviewCard, quality int) {
	if quality < 0 {
		quality = 0
	}
	if quality > 5 {
		quality = 5
	}

	if quality >= 3 {
		switch card.Repetitions {
		case 0:
			card.IntervalDays = 1
		case 1:
			card.IntervalDays = 6
		default:
			card.IntervalDays = int(math.Round(float64(card.IntervalDays) * card.EasinessFactor))
		}
		card.Repetitions++
	} else {
		card.Repetitions = 0
		card.IntervalDays = 1
	}

	card.EasinessFactor = card.EasinessFactor + 0.1 - float64(5-quality)*(0.08+float64(5-quality)*0.02)
	if card.EasinessFactor < 1.3 {
		card.EasinessFactor = 1.3
	}

	card.NextReview = time.Now().AddDate(0, 0, card.IntervalDays)
}
