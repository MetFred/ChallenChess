/**
 * Formats the given seconds to a [h:m]m:ss pattern.
 * @return {String} formatted time
 */
function getFormattedTime(seconds) {
	var hours = Math.floor(seconds/3600);
	seconds %= 3600;
	var minutes = Math.floor(seconds/60);
	seconds %= 60;
	if (hours > 0) {
		return hours + ":" + (minutes<10 ? "0" : "") + minutes + ":" + (seconds<10 ? "0" : "") + seconds;
	} else {
		return minutes + ":" + (seconds<10 ? "0" : "") + seconds;
	}
}

/**
 * Returns a game timer object.
 * @return {Object} game timer object
 */
function createGameTimer() {
	return { time: 0,  // elapsed time in seconds since first start()
		     running: false,  // flag whether the timer currently runs
		     intervalHandle: null,  // internal variable for clearing the interval on pause
		     start: function() {  // starts (or un-pauses) the timer
				 if (!this.running) {
					 var that = this;
					 this.intervalHandle = setInterval(function() {
						 that.time++;
						 if (that.onChanged != null) {
							 that.onChanged();
						 }
					 }, 1000);
					 this.running = true;
				 }
		     },
		     pause: function() {  // pauses the timer, can be continued with start()
				 if (this.running) {
					 clearInterval(this.intervalHandle);
					 this.intervalHandle = null;
					 this.running = false;
				 }
		     },
		     reset: function() {  // stops and resets the timer to 0
				 this.pause();
				 if (this.time != 0) {
					this.time = 0;
					if (this.onChanged != null) {
						this.onChanged();
					}
				 }
		     },
		     onChanged: null,  // additional callback function, called when this.time has changed
		   };
}
