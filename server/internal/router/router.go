package router

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/mosescode1/interview-prep/server/internal/handlers"
	"github.com/mosescode1/interview-prep/server/internal/middleware"
	"gorm.io/gorm"
)

func Setup(db *gorm.DB, jwtSecret string) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	authH := &handlers.AuthHandler{DB: db, JWTSecret: jwtSecret}
	questionH := &handlers.QuestionHandler{DB: db}
	interviewH := &handlers.InterviewHandler{DB: db}
	designH := &handlers.SystemDesignHandler{DB: db}
	debugH := &handlers.DebugLabHandler{DB: db}
	progressH := &handlers.ProgressHandler{DB: db}
	studyPlanH := &handlers.StudyPlanHandler{DB: db}

	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authH.Register)
			auth.POST("/login", authH.Login)
		}

		protected := api.Group("")
		protected.Use(middleware.AuthRequired(jwtSecret))
		{
			q := protected.Group("/questions")
			{
				q.GET("", questionH.List)
				q.GET("/:id", questionH.Get)
				q.GET("/:id/solution", questionH.GetSolution)
			}

			iv := protected.Group("/interview")
			{
				iv.POST("/start", interviewH.Start)
				iv.POST("/:sessionId/answer", interviewH.Answer)
				iv.POST("/:sessionId/hint", interviewH.Hint)
				iv.POST("/:sessionId/finish", interviewH.Finish)
			}

			sd := protected.Group("/system-design")
			{
				sd.GET("/problems", designH.ListProblems)
				sd.POST("/start", designH.Start)
				sd.GET("/:sessionId", designH.GetSession)
				sd.POST("/:sessionId/submit", designH.Submit)
				sd.POST("/:sessionId/hint", designH.Hint)
				sd.POST("/:sessionId/finish", designH.Finish)
			}

			dl := protected.Group("/debug-lab")
			{
				dl.GET("/scenarios", debugH.ListScenarios)
				dl.POST("/start", debugH.Start)
				dl.POST("/:sessionId/investigate", debugH.Investigate)
				dl.POST("/:sessionId/hint", debugH.Hint)
				dl.POST("/:sessionId/finish", debugH.Finish)
			}

			pg := protected.Group("/progress")
			{
				pg.GET("/dashboard", progressH.Dashboard)
				pg.GET("/weak-areas", progressH.WeakAreas)
				pg.GET("/recommendations", progressH.Recommendations)
			}

			sp := protected.Group("/study-plan")
			{
				sp.GET("/today", studyPlanH.Today)
				sp.POST("/review", studyPlanH.Review)
				sp.POST("/add", studyPlanH.Add)
				sp.GET("/stats", studyPlanH.Stats)
			}
		}
	}

	return r
}
