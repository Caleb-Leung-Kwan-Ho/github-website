function favoriteLink(favorite) {
	var link = document.createElement('a');
	link.setAttribute('href', favorite.href);
	var icon = document.createElement('img');
	icon.setAttribute('src', 'images/internet-explorer-6.svg');
	icon.setAttribute('width', '16');
	icon.setAttribute('height', '16');
	icon.setAttribute('alt', '');
	var label = document.createElement('span');
	label.textContent = favorite.name;
	link.appendChild(icon);
	link.appendChild(label);
	return link;
}

export function setupBrowserWindows(sites, navigation) {
	var favorites = [];
	sites.forEach(function (site) {
		if (site.getFavorites) { favorites = favorites.concat(site.getFavorites()); }
	});

	sites.forEach(function (site) {
		var element = site.element;
		if (!element.classList.contains('browser-window')) { return; }
		var panel = element.querySelector('.browser-favorites');
		var favoriteList = element.querySelector('[data-browser-favorites-list]');
		var favoriteMenu = element.querySelector('[data-browser-favorites-menu]');
		var toggles = element.querySelectorAll('[data-browser-favorites-toggle]');
		var toolbarToggle = element.querySelector('.browser-toolbar [data-browser-favorites-toggle]');
		var backButton = element.querySelector('[data-browser-back]');
		var forwardButton = element.querySelector('[data-browser-forward]');
		var addressLabel = element.querySelector('[data-browser-address]');
		var goLink = element.querySelector('[data-browser-go]');
		var currentId = site.homeId;

		function historyIndex(direction) {
			return navigation.findInHistory(direction, function () { return true; });
		}

		function updateNavigation() {
			var target = document.getElementById(navigation.currentId());
			// Each window retains its own address while another site is active.
			if (site.acceptsTarget(target)) { currentId = target.id; }
			var address = new URL(window.location.href);
			address.hash = currentId;
			addressLabel.textContent = address.host + address.pathname + address.hash;
			goLink.setAttribute('href', '#' + currentId);
			backButton.disabled = historyIndex(-1) === -1;
			forwardButton.disabled = historyIndex(1) === -1;
		}

		function showFavorites(show) {
			var restoreFocus = !show && panel.contains(document.activeElement);
			panel.hidden = !show;
			toggles.forEach(function (toggle) {
				toggle.setAttribute('aria-expanded', String(show));
				if (toggle.hasAttribute('data-browser-favorites-label')) {
					toggle.textContent = show ? 'Hide Favorites panel' : 'Show Favorites panel';
				}
			});
			if (restoreFocus) { toolbarToggle.focus(); }
		}

		// Populate links before shared navigation and menu keyboard handling bind them.
		favorites.forEach(function (favorite) {
			var item = document.createElement('li');
			item.appendChild(favoriteLink(favorite));
			favoriteList.appendChild(item);
			favoriteMenu.appendChild(favoriteLink(favorite));
		});
		toggles.forEach(function (toggle) {
			toggle.addEventListener('click', function () { showFavorites(panel.hidden); });
		});
		element.querySelector('[data-browser-favorites-close]').addEventListener('click', function () { showFavorites(false); });
		element.addEventListener('keydown', function (event) {
			if (event.key === 'Escape' && !panel.hidden && !element.querySelector('.window-menu[open]')) {
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

		if (site.languages && site.selectLanguage) {
			var languageMenu = element.querySelector('[data-browser-language-menu]');
			var languagePanel = languageMenu.parentElement;
			var caption = document.createElement('p');
			caption.className = 'window-menu-caption';
			caption.textContent = 'Page language';
			languagePanel.insertBefore(caption, languageMenu);
			site.languages.forEach(function (language) {
				var button = document.createElement('button');
				button.type = 'button';
				button.setAttribute('data-menu-language', language.id);
				button.setAttribute('lang', language.id);
				button.setAttribute('aria-pressed', String(language.selected));
				button.textContent = language.label;
				languagePanel.insertBefore(button, languageMenu);
			});
			languageMenu.remove();
		}

		navigation.onChange(updateNavigation);
		updateNavigation();
	});
}
