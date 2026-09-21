import { closeWindowMenus } from './menus.js';

export function createWindowDragging({ windows, setActiveWindow, closeStartMenu }) {
	var activeMove = null;
	var frame = 0;
	var taskbar = document.querySelector('.taskbar');

	function announce(windowElement, message) {
		var status = windowElement.querySelector('.window-menu-status');
		if (status) {
			status.textContent = message;
		}
	}

	function clearPosition(windowElement) {
		windowElement.classList.remove('is-positioned');
		windowElement.style.removeProperty('--window-x');
		windowElement.style.removeProperty('--window-y');
	}

	function clearSize(windowElement) {
		windowElement.classList.remove('is-resized');
		windowElement.style.removeProperty('--window-width');
		windowElement.style.removeProperty('--window-height');
	}

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function paint() {
		frame = 0;
		if (!activeMove) {
			return;
		}
		if (activeMove.direction) {
			var left = activeMove.startX;
			var top = activeMove.startY;
			var right = left + activeMove.width;
			var bottom = top + activeMove.height;
			var direction = activeMove.direction;
			if (direction.includes('w')) { left = clamp(left + activeMove.deltaX, 0, right - activeMove.minWidth); }
			if (direction.includes('e')) { right = clamp(right + activeMove.deltaX, left + activeMove.minWidth, activeMove.availableWidth); }
			if (direction.includes('n')) { top = clamp(top + activeMove.deltaY, 0, bottom - activeMove.minHeight); }
			if (direction.includes('s')) { bottom = clamp(bottom + activeMove.deltaY, top + activeMove.minHeight, activeMove.availableHeight); }
			// Keyboard steps start at the visible edge, even after reaching a size limit.
			if (activeMove.keyboard) {
				activeMove.deltaX = right - activeMove.startX - activeMove.width;
				activeMove.deltaY = bottom - activeMove.startY - activeMove.height;
			}
			activeMove.x = left;
			activeMove.y = top;
			activeMove.element.style.setProperty('--window-width', Math.round(right - left) + 'px');
			activeMove.element.style.setProperty('--window-height', Math.round(bottom - top) + 'px');
			activeMove.element.classList.add('is-resized');
		} else {
			activeMove.x = clamp(activeMove.x, activeMove.minX, activeMove.maxX);
			activeMove.y = clamp(activeMove.y, 0, activeMove.maxY);
		}
		activeMove.element.style.setProperty('--window-x', Math.round(activeMove.x) + 'px');
		activeMove.element.style.setProperty('--window-y', Math.round(activeMove.y) + 'px');
		activeMove.element.classList.add('is-positioned');
	}

	function finish(cancel, restoreFocus) {
		if (!activeMove) {
			return;
		}
		if (frame) {
			window.cancelAnimationFrame(frame);
			frame = 0;
		}
		if (!cancel) {
			paint();
		}
		var move = activeMove;
		activeMove = null;
		move.element.classList.remove('is-dragging', 'is-resizing');
		if (cancel) {
			clearPosition(move.element);
			if (move.wasPositioned) {
				move.element.style.setProperty('--window-x', move.originalX);
				move.element.style.setProperty('--window-y', move.originalY);
				move.element.classList.add('is-positioned');
			}
			if (move.direction) {
				clearSize(move.element);
				if (move.wasResized) {
					move.element.style.setProperty('--window-width', move.originalWidth);
					move.element.style.setProperty('--window-height', move.originalHeight);
					move.element.classList.add('is-resized');
				}
			}
		}
		if (move.pointerId !== undefined && move.captureElement.hasPointerCapture(move.pointerId)) {
			move.captureElement.releasePointerCapture(move.pointerId);
		}
		if (move.keyboard) {
			if (move.tabIndex === null) {
				move.titlebar.removeAttribute('tabindex');
			} else {
				move.titlebar.setAttribute('tabindex', move.tabIndex);
			}
			announce(move.element, move.direction ? (cancel ? 'Window resize canceled.' : 'Window size saved.') : (cancel ? 'Window move canceled.' : 'Window position saved.'));
			if (restoreFocus !== false && move.returnFocus && move.returnFocus.getClientRects().length) {
				move.returnFocus.focus();
			}
		}
	}

	function begin(windowElement, direction) {
		finish(false, false);
		if (windowElement.hidden || windowElement.classList.contains('is-maximized')) {
			announce(windowElement, 'Restore the window before moving or resizing it.');
			return false;
		}
		var titlebar = windowElement.querySelector('[data-titlebar]');
		var bounds = windowElement.getBoundingClientRect();
		var parentBounds = windowElement.offsetParent.getBoundingClientRect();
		var availableWidth = document.documentElement.clientWidth - parentBounds.left;
		var availableHeight = (taskbar ? taskbar.getBoundingClientRect().top : window.innerHeight) - parentBounds.top;
		var titleHeight = titlebar.getBoundingClientRect().height + windowElement.clientTop;
		// Read geometry once; movement and resizing share one cancellable, frame-batched gesture.
		activeMove = {
			element: windowElement,
			titlebar: titlebar,
			x: bounds.left - parentBounds.left,
			y: bounds.top - parentBounds.top,
			minX: Math.min(0, availableWidth - bounds.width),
			maxX: availableWidth - bounds.width,
			maxY: Math.max(0, availableHeight - Math.min(bounds.height, titleHeight)),
			wasPositioned: windowElement.classList.contains('is-positioned'),
			originalX: windowElement.style.getPropertyValue('--window-x'),
			originalY: windowElement.style.getPropertyValue('--window-y'),
			wasResized: windowElement.classList.contains('is-resized'),
			originalWidth: windowElement.style.getPropertyValue('--window-width'),
			originalHeight: windowElement.style.getPropertyValue('--window-height')
		};
		if (direction) {
			activeMove.direction = direction;
			activeMove.availableWidth = availableWidth;
			activeMove.availableHeight = availableHeight;
			activeMove.minWidth = Math.min(360, availableWidth);
			activeMove.minHeight = Math.min(260, availableHeight);
			activeMove.width = clamp(bounds.width, activeMove.minWidth, availableWidth);
			activeMove.height = clamp(bounds.height, activeMove.minHeight, availableHeight);
			activeMove.startX = clamp(activeMove.x, 0, availableWidth - activeMove.width);
			activeMove.startY = clamp(activeMove.y, 0, availableHeight - activeMove.height);
			activeMove.deltaX = 0;
			activeMove.deltaY = 0;
		}
		// A phone window can slide down to reveal the desktop, while its title bar stays reachable.
		if (!window.matchMedia('(max-width: 736px)').matches && bounds.height <= availableHeight) {
			activeMove.maxY = availableHeight - bounds.height;
		}
		setActiveWindow(windowElement);
		closeStartMenu();
		closeWindowMenus();
		paint();
		return true;
	}

	function updatePointer(event) {
		if (activeMove.direction) {
			activeMove.deltaX = event.clientX - activeMove.startClientX;
			activeMove.deltaY = event.clientY - activeMove.startClientY;
		} else {
			activeMove.x = activeMove.startX + event.clientX - activeMove.startClientX;
			activeMove.y = activeMove.startY + event.clientY - activeMove.startClientY;
		}
	}

	function connectPointer(windowElement, handle, direction) {
		handle.addEventListener('pointerdown', function (event) {
			if (!event.isPrimary || event.button !== 0 || event.target.closest('button, a, .window-controls') || !begin(windowElement, direction)) {
				return;
			}
			event.preventDefault();
			activeMove.pointerId = event.pointerId;
			activeMove.captureElement = handle;
			activeMove.startClientX = event.clientX;
			activeMove.startClientY = event.clientY;
			activeMove.startX = activeMove.x;
			activeMove.startY = activeMove.y;
			windowElement.classList.add(direction ? 'is-resizing' : 'is-dragging');
			handle.setPointerCapture(event.pointerId);
		});
		handle.addEventListener('pointermove', function (event) {
			if (!activeMove || activeMove.captureElement !== handle || activeMove.pointerId !== event.pointerId) { return; }
			updatePointer(event);
			if (!frame) { frame = window.requestAnimationFrame(paint); }
		});
		handle.addEventListener('pointerup', function (event) {
			if (activeMove && activeMove.captureElement === handle && activeMove.pointerId === event.pointerId) {
				updatePointer(event);
				finish(false, false);
			}
		});
		['pointercancel', 'lostpointercapture'].forEach(function (eventName) {
			handle.addEventListener(eventName, function (event) {
				if (activeMove && activeMove.captureElement === handle && activeMove.pointerId === event.pointerId) { finish(true, false); }
			});
		});
	}

	windows.forEach(function (windowElement) {
		var titlebar = windowElement.querySelector('[data-titlebar]');
		connectPointer(windowElement, titlebar);
		['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'].forEach(function (direction) {
			var handle = document.createElement('span');
			handle.className = 'window-resize-handle';
			handle.setAttribute('data-resize-direction', direction);
			handle.setAttribute('aria-hidden', 'true');
			windowElement.appendChild(handle);
			connectPointer(windowElement, handle, direction);
		});
	});

	document.addEventListener('pointerdown', function () {
		if (activeMove && activeMove.keyboard) {
			finish(false, false);
		}
	}, true);

	document.addEventListener('keydown', function (event) {
		if (!activeMove || (!activeMove.keyboard && event.key !== 'Escape')) {
			return;
		}
		var steps = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
		if (!steps[event.key] && ['Enter', 'Escape', 'Tab'].indexOf(event.key) === -1) {
			return;
		}
		event.preventDefault();
		event.stopImmediatePropagation();
		if (steps[event.key]) {
			var distance = event.shiftKey ? 50 : 10;
			if (activeMove.direction) {
				activeMove.deltaX += steps[event.key][0] * distance;
				activeMove.deltaY += steps[event.key][1] * distance;
			} else {
				activeMove.x += steps[event.key][0] * distance;
				activeMove.y += steps[event.key][1] * distance;
			}
			paint();
		} else {
			finish(event.key === 'Escape', true);
		}
	}, true);

	function refresh() {
		finish(false, false);
		windows.forEach(function (windowElement) {
			clearPosition(windowElement);
			clearSize(windowElement);
		});
	}
	window.addEventListener('resize', refresh);
	window.addEventListener('blur', function () { finish(true, false); });

	function startKeyboard(windowElement, returnFocus, direction) {
		if (begin(windowElement, direction)) {
			activeMove.keyboard = true;
			activeMove.returnFocus = returnFocus;
			activeMove.tabIndex = activeMove.titlebar.getAttribute('tabindex');
			activeMove.titlebar.setAttribute('tabindex', '-1');
			activeMove.titlebar.focus({ preventScroll: true });
			announce(windowElement, 'Use arrow keys to ' + (direction ? 'resize' : 'move') + ' the window, Shift for larger steps, Enter to save, or Escape to cancel.');
		}
	}

	return {
		reset: function (windowElement) {
			finish(false, false);
			clearPosition(windowElement);
			clearSize(windowElement);
			announce(windowElement, 'Window size and position reset.');
		},
		startKeyboardMove: function (windowElement, returnFocus) {
			startKeyboard(windowElement, returnFocus);
		},
		startKeyboardResize: function (windowElement, returnFocus) {
			startKeyboard(windowElement, returnFocus, 'se');
		},
		finish: finish,
		refresh: refresh
	};
}
