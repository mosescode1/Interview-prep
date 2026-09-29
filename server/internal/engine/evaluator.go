package engine

import (
	"encoding/json"

	"github.com/mosescode1/interview-prep/server/internal/models"
)

type EvaluationResult struct {
	Score     int                    `json:"score"`
	Breakdown map[string]int         `json:"breakdown"`
	Feedback  string                 `json:"feedback"`
	Strengths []string               `json:"strengths"`
	Areas     []string               `json:"areas_to_improve"`
}

func Evaluate(response string, criteria models.JSON) EvaluationResult {
	var criteriaMap map[string]int
	json.Unmarshal(criteria, &criteriaMap)

	result := EvaluationResult{
		Breakdown: make(map[string]int),
	}

	totalWeight := 0
	for _, weight := range criteriaMap {
		totalWeight += weight
	}

	responseLen := len(response)
	for criterion, weight := range criteriaMap {
		score := weight
		if responseLen < 50 {
			score = weight / 3
		} else if responseLen < 200 {
			score = weight * 2 / 3
		}
		result.Breakdown[criterion] = score
		result.Score += score
	}

	if totalWeight > 0 {
		result.Score = result.Score * 100 / totalWeight
	}

	if result.Score >= 80 {
		result.Feedback = "Strong answer demonstrating good understanding."
	} else if result.Score >= 60 {
		result.Feedback = "Decent answer but could go deeper on some aspects."
	} else {
		result.Feedback = "Consider expanding your answer with more detail and examples."
	}

	return result
}
