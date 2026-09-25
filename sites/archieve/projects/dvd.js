export function setupDvdMotion(element) {
	var stage = element.querySelector('[data-dvd-stage]');
	var logo = element.querySelector('[data-dvd-logo]');
	var pauseButton = element.querySelector('[data-dvd-pause]');
	if (!stage || !logo || !pauseButton) { return; }

	var SPEED_PER_AXIS = 55;
	var GLITCH_PADDING = 12;
	var CONTROL_CLEARANCE = 16;
	var GLITCH_INTERVAL = 2.8;
	var GLITCH_DURATION = 0.32;
	var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	var paused = reducedMotion.matches;
	var frame = null;
	var previousTime = null;
	var activeTime = 0;
	var nextGlitch = GLITCH_INTERVAL;
	var glitchUntil = 0;
	var initialized = false;
	var scale = 1;
	var x = 0;
	var y = 0;
	var directionX = 1;
	var directionY = 1;
	var bounds = { left: 0, top: 0, right: 0, bottom: 0, visible: false };

	function draw() {
		logo.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + scale + ')';
	}

	function measure() {
		var width = stage.clientWidth;
		var controlHeight = !pauseButton.hidden && pauseButton.offsetHeight > 0 ? pauseButton.offsetHeight + CONTROL_CLEARANCE : 0;
		// Keep the decorative mark above the bottom control strip, including its glitch offsets.
		var height = Math.max(0, stage.clientHeight - controlHeight);
		var logoWidth = logo.offsetWidth;
		var logoHeight = logo.offsetHeight;
		bounds.visible = width > 0 && height > 0 && logoWidth > 0 && logoHeight > 0;
		if (!bounds.visible) {
			scale = 0;
			draw();
			return;
		}

		// Scale the whole decorative mark only when even its glitch allowance cannot fit.
		scale = Math.min(1, width / (logoWidth + GLITCH_PADDING * 2), height / (logoHeight + GLITCH_PADDING * 2));
		bounds.left = GLITCH_PADDING * scale;
		bounds.top = GLITCH_PADDING * scale;
		bounds.right = Math.max(bounds.left, width - (logoWidth + GLITCH_PADDING) * scale);
		bounds.bottom = Math.max(bounds.top, height - (logoHeight + GLITCH_PADDING) * scale);
		if (!initialized) {
			x = (bounds.left + bounds.right) / 2;
			y = (bounds.top + bounds.bottom) / 2;
			initialized = true;
		}
		x = Math.min(bounds.right, Math.max(bounds.left, x));
		y = Math.min(bounds.bottom, Math.max(bounds.top, y));
		draw();
	}

	function canRun() {
		return !paused && !element.hidden && !document.hidden && bounds.visible;
	}

	function stop() {
		if (frame !== null) { window.cancelAnimationFrame(frame); }
		frame = null;
		previousTime = null;
		glitchUntil = 0;
		nextGlitch = activeTime + GLITCH_INTERVAL;
		logo.classList.remove('is-glitching');
	}

	function reflect(position, direction, minimum, maximum, distance) {
		var range = maximum - minimum;
		if (range < 0.5) { return { position: minimum, direction: direction }; }
		// A folded distance handles narrow travel ranges without repeated edge collisions.
		var phase = direction > 0 ? position - minimum : range * 2 - (position - minimum);
		phase = (phase + distance) % (range * 2);
		return {
			position: minimum + (phase <= range ? phase : range * 2 - phase),
			direction: phase < range ? 1 : -1
		};
	}

	function tick(time) {
		frame = null;
		if (!canRun()) { stop(); return; }
		var elapsed = previousTime === null ? 0 : Math.min(0.08, Math.max(0, (time - previousTime) / 1000));
		previousTime = time;
		activeTime += elapsed;
		var horizontal = reflect(x, directionX, bounds.left, bounds.right, SPEED_PER_AXIS * elapsed);
		var vertical = reflect(y, directionY, bounds.top, bounds.bottom, SPEED_PER_AXIS * elapsed);
		x = horizontal.position;
		y = vertical.position;
		directionX = horizontal.direction;
		directionY = vertical.direction;
		draw();

		if (!reducedMotion.matches && activeTime >= nextGlitch) {
			glitchUntil = activeTime + GLITCH_DURATION;
			nextGlitch = activeTime + GLITCH_INTERVAL;
		}
		logo.classList.toggle('is-glitching', !reducedMotion.matches && activeTime < glitchUntil);
		frame = window.requestAnimationFrame(tick);
	}

	function synchronize() {
		measure();
		if (!canRun()) {
			stop();
		} else if (frame === null) {
			previousTime = null;
			frame = window.requestAnimationFrame(tick);
		}
	}

	function updateControl() {
		stage.classList.toggle('is-paused', paused);
		pauseButton.textContent = paused ? 'Play animation' : 'Pause animation';
		pauseButton.setAttribute('aria-pressed', paused ? 'true' : 'false');
		synchronize();
	}

	pauseButton.hidden = false;
	pauseButton.addEventListener('click', function () {
		paused = !paused;
		updateControl();
	});
	reducedMotion.addEventListener('change', function (event) {
		if (event.matches) { paused = true; }
		updateControl();
	});
	document.addEventListener('visibilitychange', synchronize);
	// Shared desktop controls already express closed and minimized states with hidden.
	new MutationObserver(synchronize).observe(element, { attributes: true, attributeFilter: ['hidden'] });
	var resizeObserver = new ResizeObserver(synchronize);
	resizeObserver.observe(stage);
	resizeObserver.observe(logo);
	resizeObserver.observe(pauseButton);
	updateControl();
}
