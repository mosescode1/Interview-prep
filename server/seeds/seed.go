package seeds

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/mosescode1/interview-prep/server/internal/models"
	"gorm.io/gorm"
)

type questionSeed struct {
	Title              string                 `json:"title"`
	Body               string                 `json:"body"`
	Track              string                 `json:"track"`
	Subtopic           string                 `json:"subtopic"`
	Difficulty         string                 `json:"difficulty"`
	Level              int                    `json:"level"`
	QuestionType       string                 `json:"question_type"`
	Language           string                 `json:"language"`
	Hints              []string               `json:"hints"`
	Solution           string                 `json:"solution"`
	EvaluationCriteria map[string]interface{} `json:"evaluation_criteria"`
	Options            []string               `json:"options"`
	CorrectAnswer      string                 `json:"correct_answer"`
	FollowUpPrompts    []string               `json:"follow_up_prompts"`
	Tags               []string               `json:"tags"`
}

type scenarioSeed struct {
	Title          string                   `json:"title"`
	Description    string                   `json:"description"`
	Type           string                   `json:"type"`
	Track          string                   `json:"track"`
	Difficulty     string                   `json:"difficulty"`
	Level          int                      `json:"level"`
	Stages         []map[string]interface{} `json:"stages"`
	InitialContext map[string]interface{}   `json:"initial_context"`
	Tags           []string                 `json:"tags"`
}

func Run(db *gorm.DB, seedDir string) error {
	if err := seedQuestions(db, filepath.Join(seedDir, "questions.json")); err != nil {
		return err
	}
	if err := seedScenarios(db, filepath.Join(seedDir, "debug_scenarios.json")); err != nil {
		return err
	}
	if err := seedScenarios(db, filepath.Join(seedDir, "design_problems.json")); err != nil {
		return err
	}
	return nil
}

func seedQuestions(db *gorm.DB, filePath string) error {
	var count int64
	db.Model(&models.Question{}).Count(&count)
	if count > 0 {
		fmt.Println("Questions already seeded, skipping.")
		return nil
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read %s: %w", filePath, err)
	}

	var seeds []questionSeed
	if err := json.Unmarshal(data, &seeds); err != nil {
		return fmt.Errorf("failed to parse %s: %w", filePath, err)
	}

	for _, s := range seeds {
		hintsJSON, _ := json.Marshal(s.Hints)
		evalJSON, _ := json.Marshal(s.EvaluationCriteria)
		optionsJSON, _ := json.Marshal(s.Options)
		followUpJSON, _ := json.Marshal(s.FollowUpPrompts)

		q := models.Question{
			Title:              s.Title,
			Body:               s.Body,
			Track:              s.Track,
			Subtopic:           s.Subtopic,
			Difficulty:         s.Difficulty,
			Level:              s.Level,
			QuestionType:       s.QuestionType,
			Language:           s.Language,
			Hints:              models.JSON(hintsJSON),
			Solution:           s.Solution,
			EvaluationCriteria: models.JSON(evalJSON),
			Options:            models.JSON(optionsJSON),
			CorrectAnswer:      s.CorrectAnswer,
			FollowUpPrompts:    models.JSON(followUpJSON),
			Tags:               s.Tags,
		}

		if err := db.Create(&q).Error; err != nil {
			fmt.Printf("Failed to seed question %q: %v\n", s.Title, err)
		}
	}

	fmt.Printf("Seeded %d questions.\n", len(seeds))
	return nil
}

func seedScenarios(db *gorm.DB, filePath string) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read %s: %w", filePath, err)
	}

	var seeds []scenarioSeed
	if err := json.Unmarshal(data, &seeds); err != nil {
		return fmt.Errorf("failed to parse %s: %w", filePath, err)
	}

	seeded := 0
	for _, s := range seeds {
		var existing int64
		db.Model(&models.Scenario{}).Where("title = ? AND type = ?", s.Title, s.Type).Count(&existing)
		if existing > 0 {
			continue
		}

		stagesJSON, _ := json.Marshal(s.Stages)
		contextJSON, _ := json.Marshal(s.InitialContext)

		scenario := models.Scenario{
			Title:          s.Title,
			Description:    s.Description,
			Type:           s.Type,
			Track:          s.Track,
			Difficulty:     s.Difficulty,
			Level:          s.Level,
			Stages:         models.JSON(stagesJSON),
			InitialContext: models.JSON(contextJSON),
			Tags:           s.Tags,
		}

		if err := db.Create(&scenario).Error; err != nil {
			fmt.Printf("Failed to seed scenario %q: %v\n", s.Title, err)
		} else {
			seeded++
		}
	}

	fmt.Printf("Seeded %d scenarios from %s.\n", seeded, filepath.Base(filePath))
	return nil
}
