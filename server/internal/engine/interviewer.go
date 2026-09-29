package engine

import (
	"encoding/json"

	"github.com/mosescode1/interview-prep/server/internal/models"
)

func GetFollowUps(question *models.Question, responseDepth int) []string {
	var followUps []string
	if question == nil || len(question.FollowUpPrompts) == 0 {
		return defaultFollowUps()
	}

	json.Unmarshal(question.FollowUpPrompts, &followUps)

	if responseDepth > 0 && responseDepth < len(followUps) {
		return followUps[:responseDepth]
	}

	return followUps
}

func defaultFollowUps() []string {
	return []string{
		"Why did you choose this approach?",
		"What are the tradeoffs?",
		"How would you test this?",
	}
}
