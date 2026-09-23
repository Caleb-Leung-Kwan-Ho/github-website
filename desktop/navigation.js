function focusAnchorTarget(target) {
	if (!target.hasAttribute('tabindex')) { target.setAttribute('tabindex', '-1'); }
	target.focus({ preventScroll: true });
}

export function createNavigation(sites, desktop) {
	var entries = [];
	var index = 0;
	var session = String(Date.now());
	var changeListeners = [];
	var defaultId = sites[0].homeId;

	function destination(id) {
		sites.forEach(function (site) {
			if (site.aliases && Object.prototype.hasOwnProperty.call(site.aliases, id)) {
				id = site.aliases[id];
			}
		});
		var target = document.getElementById(id);
		var site = sites.find(function (candidate) { return candidate.acceptsTarget(target); });
		return site ? { id: id, target: target, site: site } : null;
	}

	function notifyChange() {
		changeListeners.forEach(function (listener) { listener(); });
	}

	function navigationState() {
		return { desktopNavigation: { session: session, index: index } };
	}

	function recordNavigation(id) {
		if (entries[index] === id) { return; }
		entries = entries.slice(0, index + 1);
		entries.push(id);
		index = entries.length - 1;
		window.history.pushState(navigationState(), '', '#' + id);
		notifyChange();
	}

	function navigate(id, options) {
		var route = destination(id);
		if (!route) { return; }
		options = options || {};
		desktop.openWindow(route.site.id, options.opener || null, false);
		route.site.navigate(route.target);
		if (options.record) { recordNavigation(route.id); }
		if (options.focus) { focusAnchorTarget(route.target); }
	}

	function start() {
		document.querySelectorAll('a[href^="#"]').forEach(function (link) {
			link.addEventListener('click', function (event) {
				if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) { return; }
				var route = destination(link.getAttribute('href').slice(1));
				if (!route) { return; }
				event.preventDefault();
				var changesWindow = link.closest('[data-window]') !== route.site.element;
				navigate(route.id, { record: true, focus: changesWindow || event.detail === 0 || link.classList.contains('skip-link'), opener: link });
			});
		});

		window.addEventListener('popstate', function (event) {
			var fragment = window.location.hash.slice(1) || defaultId;
			var route = destination(fragment) || destination(defaultId);
			if (fragment !== route.id) {
				window.history.replaceState(event.state, '', '#' + route.id);
			}
			var state = event.state && event.state.desktopNavigation;
			// Only traverse entries made in this page session; in-site buttons never go off-site.
			if (state && state.session === session && entries[state.index] === route.id) {
				index = state.index;
			} else {
				entries = [route.id];
				index = 0;
				window.history.replaceState(navigationState(), '');
			}
			notifyChange();
			navigate(route.id, { focus: true });
		});

		var initial = destination(window.location.hash.slice(1)) || destination(defaultId);
		entries = [initial.id];
		window.history.replaceState(navigationState(), '', window.location.hash && window.location.hash !== '#' + initial.id ? '#' + initial.id : window.location.href);
		notifyChange();
		// Reset the internal pane as well as the browser's normal scroll restoration.
		window.requestAnimationFrame(function () { navigate(initial.id); });
	}

	return {
		navigate: navigate,
		start: start,
		currentId: function () { return entries[index]; },
		onChange: function (listener) { changeListeners.push(listener); },
		findInHistory: function (direction, acceptsId) {
			for (var candidate = index + direction; candidate >= 0 && candidate < entries.length; candidate += direction) {
				if (acceptsId(entries[candidate])) { return candidate; }
			}
			return -1;
		},
		goToHistory: function (destinationIndex) {
			if (destinationIndex >= 0 && destinationIndex < entries.length) {
				window.history.go(destinationIndex - index);
			}
		}
	};
}
