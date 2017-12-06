function createGameTimer() {
	return { time: 0,  // elapsed time in seconds since start was called
		     start: function() {},
		     pause: function() {},
		     reset: function() {} }
}
