package engine

var DebugStageOrder = []string{"observe", "locate", "identify", "fix", "verify"}

func NextDebugStage(current string) (string, bool) {
	for i, stage := range DebugStageOrder {
		if stage == current && i < len(DebugStageOrder)-1 {
			return DebugStageOrder[i+1], true
		}
	}
	return current, false
}

func DebugStageIndex(stage string) int {
	for i, s := range DebugStageOrder {
		if s == stage {
			return i
		}
	}
	return -1
}

func IsDebugComplete(stage string) bool {
	return stage == DebugStageOrder[len(DebugStageOrder)-1]
}
