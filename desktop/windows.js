import { createWindowDragging } from './dragging.js';
import { closeWindowMenus, updateWindowMenu } from './menus.js';

export function createDesktop(sites) {
	var windows = sites.map(function (site) { return site.element; });
	var windowStack = windows.slice();
	var taskButtons = Array.prototype.slice.call(document.querySelectorAll('[data-task-window]'));
	var windowMenus = Array.prototype.slice.call(document.querySelectorAll('.window-menu'));
	var startButton = document.getElementById('start-button');
	var startMenu = document.getElementById('start-menu');
	var clock = document.getElementById('taskbar-clock');
	var lastWindowTrigger = {};

	function getWindow(name) {
		var site = sites.find(function (candidate) { return candidate.id === name; });
		return site ? site.element : null;
	}

	function getTaskButton(name) {
		return document.querySelector('[data-task-window="' + name + '"]');
	}

	function setActiveWindow(windowElement) {
		windowMenus.forEach(function (menu) {
			if (menu.closest('[data-window]') !== windowElement) {
				menu.open = false;
			}
		});
		if (windowElement) {
			windowStack = windowStack.filter(function (candidate) {
				return candidate !== windowElement;
			});
			windowStack.push(windowElement);
		}

		windows.forEach(function (candidate) {
			candidate.classList.toggle('is-active', candidate === windowElement);
		});

		taskButtons.forEach(function (button) {
			var isActive = windowElement && button.getAttribute('data-task-window') === windowElement.getAttribute('data-window');
			button.classList.toggle('is-active', Boolean(isActive));
			button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
		});
	}

	function nextVisibleWindow(excludedWindow) {
		var visible = windowStack.filter(function (candidate) {
			return candidate !== excludedWindow && !candidate.hidden;
		});
		return visible[visible.length - 1] || null;
	}

	function focusWindow(windowElement) {
		if (!windowElement) {
			return;
		}
		var site = sites.find(function (candidate) { return candidate.element === windowElement; });
		if (site && site.focus) {
			site.focus();
		} else {
			windowElement.focus({ preventScroll: true });
		}
	}

	function canReceiveFocus(element) {
		return element && document.contains(element) && element.getClientRects().length > 0;
	}

	function closeStartMenu() {
		startMenu.hidden = true;
		startButton.setAttribute('aria-expanded', 'false');
	}

	function openWindow(name, opener, shouldFocus) {
		var windowElement = getWindow(name);
		var taskButton = getTaskButton(name);
		if (!windowElement) {
			return;
		}

		if (opener && !opener.hasAttribute('data-task-window')) {
			lastWindowTrigger[name] = startMenu.contains(opener) ? startButton : opener;
		}

		if (windowElement.hidden && windowDragging && windowElement.classList.contains('is-positioned') && window.matchMedia('(max-width: 736px)').matches) {
			windowDragging.reset(windowElement);
		}
		windowElement.hidden = false;
		if (taskButton) {
			taskButton.hidden = false;
		}
		setActiveWindow(windowElement);
		closeStartMenu();

		if (shouldFocus !== false) {
			focusWindow(windowElement);
		}
	}

	function hideWindow(windowElement, isClosing) {
		if (windowDragging) { windowDragging.finish(); }
		closeWindowMenus();
		var name = windowElement.getAttribute('data-window');
		var taskButton = getTaskButton(name);
		windowElement.hidden = true;

		if (isClosing) {
			windowElement.classList.remove('is-maximized');
			var maximizeButton = windowElement.querySelector('[data-window-action="maximize"]');
			if (maximizeButton) {
				maximizeButton.setAttribute('aria-label', 'Maximize ' + name + ' window');
			}
			updateWindowMenu(windowElement);
			if (taskButton) {
				taskButton.hidden = true;
			}
		}

		var nextWindow = nextVisibleWindow(windowElement);
		setActiveWindow(nextWindow);

		if (!isClosing) {
			if (nextWindow) {
				focusWindow(nextWindow);
			} else if (taskButton) {
				taskButton.focus();
			}
			return;
		}

		if (canReceiveFocus(lastWindowTrigger[name])) {
			lastWindowTrigger[name].focus();
		} else if (nextWindow) {
			focusWindow(nextWindow);
		} else {
			startButton.focus();
		}
	}

	function showDesktop(focusTarget) {
		if (windowDragging) { windowDragging.finish(); }
		closeWindowMenus();
		closeStartMenu();
		windows.forEach(function (windowElement) {
			windowElement.hidden = true;
		});
		setActiveWindow(null);
		var shortcut = focusTarget && focusTarget.matches && focusTarget.matches('.desktop-shortcut') ? focusTarget : document.querySelector('.desktop-shortcut');
		if (canReceiveFocus(shortcut)) {
			shortcut.focus({ preventScroll: true });
		} else {
			startButton.focus();
		}
	}

	function toggleMaximize(windowElement, button) {
		if (windowDragging) { windowDragging.finish(); }
		var isMaximized = windowElement.classList.toggle('is-maximized');
		var name = windowElement.getAttribute('data-window');
		button.setAttribute('aria-label', (isMaximized ? 'Restore ' : 'Maximize ') + name + ' window');
		updateWindowMenu(windowElement);
		setActiveWindow(windowElement);
	}

	var windowDragging = createWindowDragging({ windows: windows, setActiveWindow: setActiveWindow, closeStartMenu: closeStartMenu });

	document.querySelectorAll('[data-show-desktop]').forEach(function (button) {
		button.addEventListener('click', showDesktop);
	});

	document.querySelector('.desktop-icons').addEventListener('focusin', function (event) {
		var shortcut = event.target.closest('.desktop-shortcut');
		// Phone shortcuts must not receive invisible keyboard focus behind a fitted window.
		if (shortcut && window.matchMedia('(max-width: 736px)').matches && nextVisibleWindow(null)) {
			showDesktop(shortcut);
		}
	});

	document.querySelectorAll('[data-open-window]').forEach(function (opener) {
		opener.addEventListener('click', function () {
			openWindow(opener.getAttribute('data-open-window'), opener);
		});
	});

	document.querySelectorAll('[data-window-action]').forEach(function (control) {
		control.addEventListener('click', function () {
			var windowElement = control.closest('[data-window]');
			var action = control.getAttribute('data-window-action');
			if (!windowElement) {
				return;
			}

			if (action === 'minimize') {
				hideWindow(windowElement, false);
			} else if (action === 'maximize') {
				toggleMaximize(windowElement, control);
			} else if (action === 'close') {
				hideWindow(windowElement, true);
			}
		});
	});

	windows.forEach(function (windowElement) {
		windowElement.addEventListener('pointerdown', function () {
			if (!windowElement.hidden) {
				setActiveWindow(windowElement);
			}
		});
		windowElement.addEventListener('focusin', function () {
			setActiveWindow(windowElement);
		});
	});

	taskButtons.forEach(function (button) {
		button.addEventListener('click', function () {
			var name = button.getAttribute('data-task-window');
			var windowElement = getWindow(name);
			if (!windowElement) {
				return;
			}

			if (!windowElement.hidden && windowElement.classList.contains('is-active')) {
				hideWindow(windowElement, false);
			} else {
				openWindow(name, button);
			}
		});
	});

	startButton.addEventListener('click', function () {
		closeWindowMenus();
		var willOpen = startMenu.hidden;
		startMenu.hidden = !willOpen;
		startButton.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
		if (willOpen) {
			startMenu.querySelector('a, button').focus();
		}
	});

	startMenu.addEventListener('click', function (event) {
		if (event.target.closest('a[href]')) {
			closeStartMenu();
			if (startMenu.contains(document.activeElement)) { startButton.focus(); }
		}
	});

	document.addEventListener('click', function (event) {
		if (!event.target.closest('.window-menu')) { closeWindowMenus(); }
		if (!startMenu.hidden && !startMenu.contains(event.target) && !startButton.contains(event.target)) {
			closeStartMenu();
		}
	});

	document.addEventListener('keydown', function (event) {
		if (event.key !== 'Escape') {
			return;
		}
		var openMenu = windowMenus.filter(function (menu) { return menu.open; })[0];
		if (openMenu) {
			event.preventDefault();
			closeWindowMenus();
			openMenu.querySelector('summary').focus();
			return;
		}

		if (!startMenu.hidden) {
			closeStartMenu();
			startButton.focus();
			return;
		}

		var activeWindow = windows.filter(function (windowElement) {
			return !windowElement.hidden && windowElement.classList.contains('is-active');
		})[0];
		var activeSite = sites.find(function (site) { return site.element === activeWindow; });
		if (activeSite && activeSite.closeOnEscape) {
			hideWindow(activeWindow, true);
		}
	});

	function updateClock() {
		var now = new Date();
		clock.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
		clock.setAttribute('datetime', now.toISOString());
		clock.setAttribute('title', now.toLocaleDateString());
	}

	updateClock();
	window.setInterval(updateClock, 30000);

	return {
		openWindow: openWindow,
		hideWindow: hideWindow,
		focusWindow: focusWindow,
		setActiveWindow: setActiveWindow,
		toggleMaximize: toggleMaximize,
		closeStartMenu: closeStartMenu,
		dragging: windowDragging
	};
}
