export function closeWindowMenus() {
	document.querySelectorAll('.window-menu').forEach(function (menu) { menu.open = false; });
}

export function updateWindowMenu(windowElement) {
	var maximized = windowElement.classList.contains('is-maximized');
	windowElement.querySelectorAll('[data-menu-action="maximize"]').forEach(function (button) {
		button.textContent = maximized ? 'Restore window' : 'Maximize window';
	});
	windowElement.querySelectorAll('[data-menu-action="move"], [data-menu-action="resize"]').forEach(function (button) {
		button.disabled = maximized;
	});
}

function announceWindow(windowElement, message) {
	var status = windowElement.querySelector('.window-menu-status');
	if (status) { status.textContent = message; }
}

function copyWindowText(windowElement, value) {
	function unavailable() {
		announceWindow(windowElement, 'Copy unavailable. Select and copy: ' + value);
	}
	if (!navigator.clipboard || !navigator.clipboard.writeText) { unavailable(); return; }
	navigator.clipboard.writeText(value).then(function () {
		announceWindow(windowElement, 'Copied to clipboard.');
	}, unavailable);
}

export function setupWindowMenus(sites, desktop, navigation) {
	var windowMenus = Array.prototype.slice.call(document.querySelectorAll('.window-menu'));

	windowMenus.forEach(function (menu) {
		var summary = menu.querySelector('summary');
		var windowElement = menu.closest('[data-window]');
		summary.addEventListener('click', function () {
			windowMenus.forEach(function (other) { if (other !== menu) { other.open = false; } });
			desktop.closeStartMenu();
			updateWindowMenu(windowElement);
		});
		menu.addEventListener('focusout', function (event) {
			if (!menu.contains(event.relatedTarget)) { menu.open = false; }
		});
		menu.addEventListener('keydown', function (event) {
			updateWindowMenu(windowElement);
			var controls = Array.prototype.slice.call(menu.querySelectorAll('.window-menu-panel a, .window-menu-panel button:not(:disabled)'));
			var index = controls.indexOf(document.activeElement);
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				windowMenus.forEach(function (other) { if (other !== menu) { other.open = false; } });
				updateWindowMenu(windowElement);
				menu.open = true;
				if (controls.length) {
					var next = index === -1 ? (event.key === 'ArrowDown' ? 0 : controls.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + controls.length) % controls.length;
					controls[next].focus();
				}
			} else if (event.target === summary && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
				event.preventDefault();
				var siblings = Array.prototype.slice.call(menu.parentElement.querySelectorAll('summary'));
				menu.open = false;
				siblings[(siblings.indexOf(summary) + (event.key === 'ArrowRight' ? 1 : -1) + siblings.length) % siblings.length].focus();
			}
		});
		menu.addEventListener('click', function (event) {
			if (!event.target.closest('.window-menu-panel a, .window-menu-panel button')) { return; }
			menu.open = false;
			if (menu.contains(document.activeElement)) {
				if (!windowElement.hidden && windowElement.classList.contains('is-active')) {
					summary.focus();
				} else {
					desktop.focusWindow(document.querySelector('.os-window.is-active'));
				}
			}
		});
	});

	document.querySelectorAll('[data-menu-action]').forEach(function (button) {
		button.addEventListener('click', function () {
			var windowElement = button.closest('[data-window]');
			var site = sites.find(function (candidate) { return candidate.element === windowElement; });
			var action = button.getAttribute('data-menu-action');
			var maximizeButton = windowElement.querySelector('[data-window-action="maximize"]');
			announceWindow(windowElement, '');
			if (action === 'maximize') {
				desktop.toggleMaximize(windowElement, maximizeButton);
			} else if (action === 'reset-position') {
				if (windowElement.classList.contains('is-maximized')) { desktop.toggleMaximize(windowElement, maximizeButton); }
				desktop.dragging.reset(windowElement);
				announceWindow(windowElement, 'Window size and position reset.');
			} else if (action === 'move') {
				desktop.dragging.startKeyboardMove(windowElement, button.closest('.window-menu').querySelector('summary'));
			} else if (action === 'resize') {
				desktop.dragging.startKeyboardResize(windowElement, button.closest('.window-menu').querySelector('summary'));
			} else if (action === 'copy-email') {
				copyWindowText(windowElement, 'caleb.leungkwanho@gmail.com');
			} else if (action === 'copy-link') {
				var url = new URL(window.location.href);
				url.hash = site.getLinkId();
				copyWindowText(windowElement, url.href);
			} else if (action === 'top') {
				navigation.navigate(site.homeId, { record: true, focus: true });
			}
		});
	});

	document.querySelectorAll('[data-menu-language]').forEach(function (button) {
		button.addEventListener('click', function () {
			var site = sites.find(function (candidate) { return candidate.element === button.closest('[data-window]'); });
			if (site.selectLanguage) { site.selectLanguage(button.getAttribute('data-menu-language')); }
		});
	});

}
