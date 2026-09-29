package main

import (
	"fmt"
	"log"
	"os"

	"github.com/mosescode1/interview-prep/server/internal/config"
	"github.com/mosescode1/interview-prep/server/internal/models"
	"github.com/mosescode1/interview-prep/server/internal/router"
	"github.com/mosescode1/interview-prep/server/seeds"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPass, cfg.DBName,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.Question{},
		&models.Scenario{},
		&models.Session{},
		&models.SessionStep{},
		&models.UserProgress{},
		&models.ReviewCard{},
	); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	if len(os.Args) > 1 && os.Args[1] == "seed" {
		seedDir := "seeds"
		if len(os.Args) > 2 {
			seedDir = os.Args[2]
		}
		if err := seeds.Run(db, seedDir); err != nil {
			log.Fatalf("Failed to seed: %v", err)
		}
		return
	}

	r := router.Setup(db, cfg.JWTSecret)

	log.Printf("Server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
