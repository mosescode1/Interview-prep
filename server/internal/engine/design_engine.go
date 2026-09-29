package engine

var DesignStageOrder = []string{
	"requirements",
	"scale_estimation",
	"high_level_architecture",
	"services",
	"apis",
	"database",
	"cache",
	"queues",
	"auth_security",
	"reliability",
	"scaling",
	"monitoring",
	"failure_scenarios",
	"tradeoffs",
}

func NextDesignStage(current string) (string, bool) {
	for i, stage := range DesignStageOrder {
		if stage == current && i < len(DesignStageOrder)-1 {
			return DesignStageOrder[i+1], true
		}
	}
	return current, false
}

func DesignStageIndex(stage string) int {
	for i, s := range DesignStageOrder {
		if s == stage {
			return i
		}
	}
	return -1
}

func IsDesignComplete(stage string) bool {
	return stage == DesignStageOrder[len(DesignStageOrder)-1]
}
