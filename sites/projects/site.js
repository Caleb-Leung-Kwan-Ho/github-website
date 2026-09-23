import { setupDvdMotion } from './dvd.js';

export function createProjectsSite() {
	var element = document.querySelector('[data-window="projects"]');
	if (!element) { return null; }
	var site = element.querySelector('.projects-site');
	var workspace = site.querySelector('[data-project-workspace]');
	var toggle = site.querySelector('[data-project-toggle]');
	var toggleLabel = site.querySelector('[data-project-toggle-label]');
	var browser = site.querySelector('[data-project-browser]');
	var browserSummary = browser.querySelector('summary');
	var detail = site.querySelector('[data-project-detail]');
	var panels = Array.prototype.slice.call(site.querySelectorAll('[data-project-panel]'));
	var links = Array.prototype.slice.call(browser.querySelectorAll('[data-project-link]'));
	var updates = site.querySelector('[data-project-updates]');
	var search = site.querySelector('[data-project-search-input]');
	var status = site.querySelector('[data-project-status-select]');
	var count = site.querySelector('[data-project-count]');
	var empty = site.querySelector('[data-project-empty]');
	var selectedLink = links.find(function (link) { return link.getAttribute('data-project-featured') === 'true'; }) || links[0];
	var currentView = selectedLink ? selectedLink.getAttribute('href').slice(1) : updates.id;
	var scrollPositions = {};
	var libraryScroll = 0;
	var listScroll = 0;
	var list = browser.querySelector('.project-list');
	var compact = null;
	var navigation;
	var preserveScroll = false;
	panels.concat([updates]).forEach(function (panel) { panel.setAttribute('tabindex', '-1'); });

	function contentScroller() {
		return compact ? workspace : detail;
	}

	function saveScroll() {
		if (workspace.hidden) { return; }
		scrollPositions[currentView] = contentScroller().scrollTop;
		libraryScroll = browser.scrollTop;
		listScroll = list.scrollTop;
	}

	function showView(id) {
		saveScroll();
		var destination = document.getElementById(id);
		if (detail.contains(document.activeElement) && !destination.contains(document.activeElement)) {
			destination.hidden = false;
			destination.focus({ preventScroll: true });
		}
		currentView = id;
		panels.forEach(function (panel) { panel.hidden = panel.id !== id; });
		updates.hidden = id !== updates.id;
		links.forEach(function (link) {
			if (link.getAttribute('href') === '#' + id) {
				link.setAttribute('aria-current', 'page');
			} else {
				link.removeAttribute('aria-current');
			}
		});
		contentScroller().scrollTop = scrollPositions[id] || 0;
	}

	function setExpanded(expanded) {
		if (expanded === !workspace.hidden) { return; }
		if (!expanded) { saveScroll(); }
		if (!expanded && workspace.contains(document.activeElement)) {
			toggle.focus({ preventScroll: true });
		}
		workspace.hidden = !expanded;
		site.classList.toggle('is-expanded', expanded);
		toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
		toggleLabel.textContent = expanded ? 'Collapse projects' : 'Browse projects';
		if (expanded) {
			contentScroller().scrollTop = scrollPositions[currentView] || 0;
			browser.scrollTop = libraryScroll;
			list.scrollTop = listScroll;
		}
	}

	function filterProjects() {
		var query = search.value.trim().toLocaleLowerCase();
		var shown = 0;
		links.forEach(function (link) {
			var matches = (!query || link.getAttribute('data-project-search').toLocaleLowerCase().indexOf(query) !== -1) &&
				(status.value === 'all' || link.getAttribute('data-project-status') === status.value);
			link.closest('[data-project-row]').hidden = !matches;
			if (matches) { shown += 1; }
		});
		count.textContent = shown + ' of ' + links.length + ' projects';
		empty.hidden = shown !== 0;
	}

	function resizeChooser() {
		var nextCompact = element.clientWidth <= 736;
		if (nextCompact === compact) { return; }
		compact = nextCompact;
		// A compact chooser starts closed, but never hides its currently focused controls.
		browser.open = !compact || browser.contains(document.activeElement);
		browserSummary.textContent = compact ? 'Choose a project' : 'Project library';
	}

	site.classList.add('is-enhanced');
	site.querySelector('[data-project-drawer-bar]').hidden = false;
	site.querySelector('[data-dvd-pause]').hidden = false;
	site.querySelector('.project-filters').hidden = false;
	count.hidden = false;
	var names = links.slice(0, 2).map(function (link) { return link.querySelector('.project-name').textContent; });
	site.querySelector('[data-project-preview]').textContent = names.join(' · ') + (links.length > 2 ? ' · +' + (links.length - 2) + ' more' : '');
	showView(currentView);
	setExpanded(false);
	filterProjects();
	resizeChooser();
	if ('ResizeObserver' in window) {
		new ResizeObserver(resizeChooser).observe(element);
	} else {
		window.addEventListener('resize', resizeChooser);
	}
	search.addEventListener('input', filterProjects);
	status.addEventListener('change', filterProjects);
	site.querySelector('[data-project-reset]').addEventListener('click', function () {
		search.value = '';
		status.value = 'all';
		filterProjects();
		search.focus();
	});
	setupDvdMotion(element);

	return {
		id: 'projects',
		element: element,
		homeId: 'project-lab',
		closeOnEscape: false,
		acceptsTarget: function (target) { return Boolean(target && site.contains(target)); },
		focus: function () { site.focus({ preventScroll: true }); },
		getLinkId: function () { return workspace.hidden ? 'project-lab' : currentView; },
		navigate: function (target) {
			if (target === site) { return; }
			var panel = target.closest('[data-project-panel], [data-project-updates]');
			if (!panel) { return; }
			resizeChooser();
			setExpanded(true);
			showView(panel.id);
			if (compact && !preserveScroll) {
				if (browser.contains(document.activeElement)) { panel.focus({ preventScroll: true }); }
				browser.open = false;
			}
			var disclosure = target.closest('details') || (target.hasAttribute('data-milestone-status') ? target.querySelector('details') : null);
			if (disclosure) { disclosure.open = true; }
			if (!preserveScroll) {
				var scroller = contentScroller();
				var top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
				if (compact && target === panel) {
					scroller.scrollTop = 0;
				} else {
					scroller.scrollTop += top - scroller.clientTop;
				}
			}
		},
		initialize: function (controller) {
			navigation = controller;
			toggle.addEventListener('click', function () {
				var expanded = workspace.hidden;
				setExpanded(expanded);
				// Shared history owns the route; reopening the drawer preserves its reading position.
				preserveScroll = true;
				navigation.navigate(expanded ? currentView : 'project-lab', { record: true });
				preserveScroll = false;
			});
		}
	};
}
