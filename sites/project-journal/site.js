import { JOURNAL_LOCALES, JOURNAL_PROJECTS } from './translations.js';

export function createProjectJournalSite() {
	var element = document.querySelector('[data-window="project-journal"]');
	if (!element) { return null; }
	var content = element.querySelector('.project-journal-content');
	var search = content.querySelector('[data-journal-search]');
	var filter = content.querySelector('[data-journal-filter]');
	var count = content.querySelector('[data-journal-count]');
	var empty = content.querySelector('[data-journal-empty]');
	var outside = content.querySelector('[data-journal-outside]');
	var list = content.querySelector('.journal-project-list');
	var rows = Array.from(content.querySelectorAll('[data-journal-row]'));
	var panels = Array.from(content.querySelectorAll('[data-journal-project-panel]'));
	var links = Array.from(content.querySelectorAll('[data-journal-select]'));
	var languageButtons = Array.from(content.querySelectorAll('[data-journal-language]'));
	var language = 'en';
	var featured = JOURNAL_PROJECTS.find(function (project) { return project.featured; }) || JOURNAL_PROJECTS[0];
	var selected = featured.id;
	var projects = new Map(JOURNAL_PROJECTS.map(function (project) { return [project.id, project]; }));
	var searchIndex = new Map();

	function normalize(value) {
		return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
	}

	function updateResults() {
		var query = normalize(search.value.trim());
		var visible = 0;
		var selectedVisible = false;
		rows.forEach(function (row) {
			var id = row.getAttribute('data-journal-row');
			var matches = (filter.value === 'all' || projects.get(id).status === filter.value) && searchIndex.get(id).includes(query);
			row.hidden = !matches;
			if (matches) { visible += 1; }
			if (id === selected) { selectedVisible = matches; }
		});
		var ui = JOURNAL_LOCALES[language].ui;
		count.textContent = ui.resultCount.replace('{count}', String(visible));
		empty.hidden = visible > 0;
		empty.querySelector('[data-journal-empty-text]').textContent = search.value.trim() ? ui.noResultsFor.replace('{query}', search.value.trim()) : ui.noResults;
		outside.hidden = selectedVisible;
	}

	function selectProject(id) {
		if (!projects.has(id)) { return; }
		selected = id;
		panels.forEach(function (panel) {
			panel.hidden = panel.getAttribute('data-journal-project-panel') !== selected;
		});
		links.forEach(function (link) {
			if (link.getAttribute('data-journal-select') === selected) {
				link.setAttribute('aria-current', 'true');
			} else {
				link.removeAttribute('aria-current');
			}
		});
		content.querySelectorAll('[data-journal-section]').forEach(function (link) {
			link.setAttribute('href', '#project-journal-' + selected + '-' + link.getAttribute('data-journal-section'));
		});
		updateResults();
	}

	function selectLanguage(id) {
		if (!Object.prototype.hasOwnProperty.call(JOURNAL_LOCALES, id)) { return; }
		var scrollTop = content.scrollTop;
		var listScrollTop = list.scrollTop;
		language = id;
		var locale = JOURNAL_LOCALES[id];
		content.querySelectorAll('[data-journal-text]').forEach(function (node) {
			node.textContent = locale.ui[node.getAttribute('data-journal-text')];
		});
		content.querySelectorAll('[data-journal-aria]').forEach(function (node) {
			node.setAttribute('aria-label', locale.ui[node.getAttribute('data-journal-aria')]);
		});
		content.querySelectorAll('[data-journal-placeholder]').forEach(function (node) {
			node.setAttribute('placeholder', locale.ui[node.getAttribute('data-journal-placeholder')]);
		});
		content.querySelectorAll('[data-journal-status]').forEach(function (node) {
			node.textContent = locale.statuses[node.getAttribute('data-journal-status')];
		});
		content.querySelectorAll('[data-journal-project]').forEach(function (node) {
			var copy = locale.projects[node.getAttribute('data-journal-project')];
			var field = node.getAttribute('data-journal-field');
			if (node.hasAttribute('data-journal-link')) {
				node.textContent = copy.linkLabels[node.getAttribute('data-journal-link')];
			} else if (field) {
				if (node.hasAttribute('data-journal-milestone')) { copy = copy.milestones[node.getAttribute('data-journal-milestone')]; }
				if (node.hasAttribute('data-journal-update')) { copy = copy.updates[node.getAttribute('data-journal-update')]; }
				node.textContent = copy[field];
			}
		});
		content.querySelectorAll('[data-journal-photo]').forEach(function (node) {
			node.setAttribute('alt', locale.photos[node.getAttribute('data-journal-photo')].alt);
		});
		content.querySelectorAll('[data-journal-photo-caption]').forEach(function (node) {
			node.textContent = locale.photos[node.getAttribute('data-journal-photo-caption')].caption;
		});
		content.setAttribute('lang', id);
		languageButtons.forEach(function (button) {
			button.setAttribute('aria-pressed', String(button.getAttribute('data-journal-language') === id));
		});
		element.querySelectorAll('[data-menu-language]').forEach(function (button) {
			button.setAttribute('aria-pressed', String(button.getAttribute('data-menu-language') === id));
		});
		JOURNAL_PROJECTS.forEach(function (project) {
			var copy = locale.projects[project.id];
			searchIndex.set(project.id, normalize(copy.title + ' ' + copy.summary + ' ' + project.title + ' ' + project.summary));
		});
		updateResults();
		// Keep the existing nodes so language changes preserve focus and entered filters.
		content.scrollTop = scrollTop;
		list.scrollTop = listScrollTop;
		try { window.localStorage.setItem('project-journal-language', id); } catch (error) { /* Storage is optional. */ }
	}

	search.addEventListener('input', function (event) {
		if (!event.isComposing) { updateResults(); }
	});
	search.addEventListener('compositionend', updateResults);
	filter.addEventListener('change', updateResults);
	content.querySelectorAll('[data-journal-reset]').forEach(function (button) {
		button.addEventListener('click', function () {
			search.value = '';
			filter.value = 'all';
			updateResults();
			search.focus({ preventScroll: true });
		});
	});
	languageButtons.forEach(function (button) {
		button.addEventListener('click', function () { selectLanguage(button.getAttribute('data-journal-language')); });
	});
	try {
		var remembered = window.localStorage.getItem('project-journal-language');
		if (Object.prototype.hasOwnProperty.call(JOURNAL_LOCALES, remembered)) { language = remembered; }
	} catch (error) { /* English remains available when browser storage is blocked. */ }
	content.querySelectorAll('[data-journal-enhancement]').forEach(function (node) { node.hidden = false; });
	selectLanguage(language);
	selectProject(selected);
	content.classList.add('is-enhanced');

	return {
		id: 'project-journal',
		element: element,
		homeId: 'project-journal',
		closeOnEscape: true,
		acceptsTarget: function (target) { return Boolean(target && content.contains(target)); },
		focus: function () { element.focus({ preventScroll: true }); },
		getLinkId: function () { return 'project-journal-' + selected; },
		languages: languageButtons.map(function (button) {
			return { id: button.getAttribute('data-journal-language'), label: button.textContent, selected: button.getAttribute('aria-pressed') === 'true' };
		}),
		selectLanguage: selectLanguage,
		navigate: function (target) {
			var panel = target.closest('[data-journal-project-panel]');
			if (panel) { selectProject(panel.getAttribute('data-journal-project-panel')); }
			var disclosure = target.closest('details');
			if (disclosure) { disclosure.open = true; }
			// Scroll only this site's pane; scrollIntoView would also move the desktop.
			var top = target.getBoundingClientRect().top - content.getBoundingClientRect().top;
			content.scrollTo({ top: content.scrollTop + top - content.clientTop });
		}
	};
}
