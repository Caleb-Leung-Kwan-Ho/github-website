export function createWebsitesSite() {
	var element = document.querySelector('[data-window="websites"]');
	var content = element.querySelector('#websites');
	var shortcuts = element.querySelectorAll('.website-shortcut');
	var favorites = element.querySelector('#websites-favorites');
	var favoriteList = element.querySelector('[data-websites-favorites-list]');
	var favoriteMenu = element.querySelector('[data-websites-favorites-menu]');
	var favoriteToggles = element.querySelectorAll('[data-websites-favorites-toggle]');
	var toolbarToggle = element.querySelector('.websites-toolbar [data-websites-favorites-toggle]');
	var backButton = element.querySelector('[data-websites-back]');
	var forwardButton = element.querySelector('[data-websites-forward]');
	var navigation;

	function historyIndex(direction) {
		return navigation.findInHistory(direction, function () { return true; });
	}

	function updateHistoryButtons() {
		backButton.disabled = historyIndex(-1) === -1;
		forwardButton.disabled = historyIndex(1) === -1;
	}

	function showFavorites(show) {
		var restoreFocus = !show && favorites.contains(document.activeElement);
		favorites.hidden = !show;
		favoriteToggles.forEach(function (toggle) {
			toggle.setAttribute('aria-expanded', String(show));
			if (toggle.hasAttribute('data-websites-favorites-label')) {
				toggle.textContent = show ? 'Hide Favorites panel' : 'Show Favorites panel';
			}
		});
		if (restoreFocus) { toolbarToggle.focus(); }
	}

	function favoriteLink(shortcut) {
		var link = document.createElement('a');
		link.setAttribute('href', shortcut.getAttribute('href'));
		var icon = document.createElement('img');
		icon.setAttribute('src', 'images/internet-explorer-6.ico');
		icon.setAttribute('width', '16');
		icon.setAttribute('height', '16');
		icon.setAttribute('alt', '');
		var label = document.createElement('span');
		label.textContent = shortcut.getAttribute('data-website-name');
		link.appendChild(icon);
		link.appendChild(label);
		return link;
	}

	return {
		id: 'websites',
		element: element,
		homeId: 'websites',
		aliases: { 'my-folder': 'websites', 'hobbies': 'websites' },
		closeOnEscape: true,
		acceptsTarget: function (target) { return target === content; },
		focus: function () { content.focus({ preventScroll: true }); },
		getLinkId: function () { return 'websites'; },
		navigate: function () { content.scrollTop = 0; },
		initialize: function (controller) {
			navigation = controller;
			var count = shortcuts.length;
			element.querySelectorAll('[data-websites-count]').forEach(function (label) {
				label.textContent = count + (count === 1 ? ' website' : ' websites');
			});
			var address = new URL(window.location.href);
			address.hash = 'websites';
			element.querySelector('[data-websites-address]').textContent = address.host + address.pathname + address.hash;

			// Derive Favorites from the built catalogue before shared navigation binds its links.
			shortcuts.forEach(function (shortcut) {
				var item = document.createElement('li');
				item.appendChild(favoriteLink(shortcut));
				favoriteList.appendChild(item);
				favoriteMenu.appendChild(favoriteLink(shortcut));
			});
			favoriteToggles.forEach(function (toggle) {
				toggle.addEventListener('click', function () { showFavorites(favorites.hidden); });
			});
			element.querySelector('[data-websites-favorites-close]').addEventListener('click', function () { showFavorites(false); });
			element.addEventListener('keydown', function (event) {
				if (event.key === 'Escape' && !favorites.hidden && !element.querySelector('.window-menu[open]')) {
					event.preventDefault();
					event.stopPropagation();
					showFavorites(false);
				}
			});
			[backButton, forwardButton].forEach(function (button, index) {
				button.addEventListener('click', function () {
					var destination = historyIndex(index === 0 ? -1 : 1);
					if (destination !== -1) { navigation.goToHistory(destination); }
				});
			});
			navigation.onChange(updateHistoryButtons);
			updateHistoryButtons();
		}
	};
}
