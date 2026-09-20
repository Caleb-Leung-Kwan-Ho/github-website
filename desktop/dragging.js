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

	function paint() {
		frame = 0;
		if (!activeMove) {
			return;
		}
		activeMove.x = Math.max(activeMove.minX, Math.min(activeMove.maxX, activeMove.x));
		activeMove.y = Math.max(0, Math.min(activeMove.maxY, activeMove.y));
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
		move.element.classList.remove('is-dragging');
		if (cancel) {
			clearPosition(move.element);
			if (move.wasPositioned) {
				move.element.style.setProperty('--window-x', move.originalX);
				move.element.style.setProperty('--window-y', move.originalY);
				move.element.classList.add('is-positioned');
			}
		}
		if (move.pointerId !== undefined && move.titlebar.hasPointerCapture(move.pointerId)) {
			move.titlebar.releasePointerCapture(move.pointerId);
		}
		if (move.keyboard) {
			if (move.tabIndex === null) {
				move.titlebar.removeAttribute('tabindex');
			} else {
				move.titlebar.setAttribute('tabindex', move.tabIndex);
			}
			announce(move.element, cancel ? 'Window move canceled.' : 'Window position saved.');
			if (restoreFocus !== false && move.returnFocus && move.returnFocus.getClientRects().length) {
				move.returnFocus.focus();
			}
		}
	}

	function begin(windowElement) {
		finish(false, false);
		if (windowElement.hidden || windowElement.classList.contains('is-maximized')) {
			announce(windowElement, 'Restore the window before moving it.');
			return false;
		}
		var titlebar = windowElement.querySelector('[data-titlebar]');
		var bounds = windowElement.getBoundingClientRect();
		var parentBounds = windowElement.offsetParent.getBoundingClientRect();
		var availableWidth = document.documentElement.clientWidth - parentBounds.left;
		var availableHeight = (taskbar ? taskbar.getBoundingClientRect().top : window.innerHeight) - parentBounds.top;
		var titleHeight = titlebar.getBoundingClientRect().height + windowElement.clientTop;
		// Read geometry once; pointer moves only update two CSS coordinates in a single animation frame.
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
			originalY: windowElement.style.getPropertyValue('--window-y')
		};
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

	windows.forEach(function (windowElement) {
		var titlebar = windowElement.querySelector('[data-titlebar]');
		titlebar.addEventListener('pointerdown', function (event) {
			if (!event.isPrimary || event.button !== 0 || event.target.closest('button, a, .window-controls') || !begin(windowElement)) {
				return;
			}
			event.preventDefault();
			activeMove.pointerId = event.pointerId;
			activeMove.startClientX = event.clientX;
			activeMove.startClientY = event.clientY;
			activeMove.startX = activeMove.x;
			activeMove.startY = activeMove.y;
			windowElement.classList.add('is-dragging');
			titlebar.setPointerCapture(event.pointerId);
		});
		titlebar.addEventListener('pointermove', function (event) {
			if (!activeMove || activeMove.titlebar !== titlebar || activeMove.pointerId !== event.pointerId) {
				return;
			}
			activeMove.x = activeMove.startX + event.clientX - activeMove.startClientX;
			activeMove.y = activeMove.startY + event.clientY - activeMove.startClientY;
			if (!frame) {
				frame = window.requestAnimationFrame(paint);
			}
		});
		titlebar.addEventListener('pointerup', function (event) {
			if (activeMove && activeMove.titlebar === titlebar && activeMove.pointerId === event.pointerId) {
				activeMove.x = activeMove.startX + event.clientX - activeMove.startClientX;
				activeMove.y = activeMove.startY + event.clientY - activeMove.startClientY;
				finish(false, false);
			}
		});
		['pointercancel', 'lostpointercapture'].forEach(function (eventName) {
			titlebar.addEventListener(eventName, function (event) {
				if (activeMove && activeMove.titlebar === titlebar && activeMove.pointerId === event.pointerId) {
					finish(true, false);
				}
			});
		});
	});

	document.addEventListener('pointerdown', function () {
		if (activeMove && activeMove.keyboard) {
			finish(false, false);
		}
	}, true);

	document.addEventListener('keydown', function (event) {
		if (!activeMove || !activeMove.keyboard) {
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
			activeMove.x += steps[event.key][0] * distance;
			activeMove.y += steps[event.key][1] * distance;
			paint();
		} else {
			finish(event.key === 'Escape', true);
		}
	}, true);

	function refresh() {
		finish(false, false);
		windows.forEach(clearPosition);
	}
	window.addEventListener('resize', refresh);
	window.addEventListener('blur', function () { finish(true, false); });

	return {
		reset: function (windowElement) {
			finish(false, false);
			clearPosition(windowElement);
			announce(windowElement, 'Window position reset.');
		},
		startKeyboardMove: function (windowElement, returnFocus) {
			if (begin(windowElement)) {
				activeMove.keyboard = true;
				activeMove.returnFocus = returnFocus;
				activeMove.tabIndex = activeMove.titlebar.getAttribute('tabindex');
				activeMove.titlebar.setAttribute('tabindex', '-1');
				activeMove.titlebar.focus({ preventScroll: true });
				announce(windowElement, 'Use arrow keys to move the window, Shift for larger steps, Enter to save, or Escape to cancel.');
			}
		},
		finish: finish,
		refresh: refresh
	};
}

