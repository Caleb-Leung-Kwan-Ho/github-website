export function createPortfolioSite() {
	var element = document.querySelector('[data-window="portfolio"]');
	var content = element.querySelector('.explorer-content');
	var navLinks = Array.prototype.slice.call(element.querySelectorAll('#site-nav a[href^="#"]'));
	var sections = Array.prototype.slice.call(element.querySelectorAll('.profile-section'));
	var addressText = element.querySelector('#address-text');
	var windowTitle = element.querySelector('#portfolio-window-title');
	var statusText = element.querySelector('#status-text');
	var locationText = element.querySelector('#portfolio-location');
	var backButton = element.querySelector('#back-button');
	var forwardButton = element.querySelector('#forward-button');
	var activeSectionId = 'work';
	var scrollPositions = {};
	var navigation;

	function acceptsTarget(target) {
		return sections.indexOf(target) !== -1;
	}

	function portfolioHistoryIndex(direction) {
		var fromAuxiliary = !acceptsTarget(document.getElementById(navigation.currentId()));
		return navigation.findInHistory(direction, function (id) {
			return acceptsTarget(document.getElementById(id)) && (!fromAuxiliary || id !== activeSectionId);
		});
	}

	function updateNavigationButtons() {
		backButton.disabled = portfolioHistoryIndex(-1) === -1;
		forwardButton.disabled = portfolioHistoryIndex(1) === -1;
	}

	function setActiveSection(id) {
		var target = document.getElementById(id);
		if (!acceptsTarget(target)) { return; }
		var changedSection = activeSectionId !== id;
		if (changedSection) { scrollPositions[activeSectionId] = content.scrollTop; }
		var movesFocus = sections.some(function (section) {
			return section !== target && section.contains(document.activeElement);
		});
		activeSectionId = id;
		sections.forEach(function (section) { section.hidden = section !== target; });
		navLinks.forEach(function (link) {
			if (link.getAttribute('href') === '#' + id) {
				link.setAttribute('aria-current', 'page');
			} else {
				link.removeAttribute('aria-current');
			}
		});
		var name = target.getAttribute('data-section-name');
		var location = id === 'intro' ? 'My Portfolio' : 'My Portfolio / ' + name;
		addressText.textContent = location;
		windowTitle.textContent = id === 'intro' ? 'My Portfolio' : name + ' — My Portfolio';
		if (locationText) { locationText.textContent = location; }
		if (statusText) {
			var count = target.getAttribute('data-item-count');
			statusText.textContent = count === null ? name : count + (count === '1' ? ' item' : ' items');
		}
		if (movesFocus) { content.focus({ preventScroll: true }); }
		if (changedSection) { content.scrollTop = scrollPositions[id] || 0; }
		updateNavigationButtons();
	}

	function initializePreviewTabs(tablist) {
		var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[data-preview-tab]'));
		var panels = tabs.map(function (tab) {
			return document.getElementById(tab.getAttribute('aria-controls'));
		});
		if (!tabs.length || panels.some(function (panel) { return !panel || !element.contains(panel); })) { return; }
		tablist.setAttribute('role', 'tablist');
		tabs.forEach(function (tab, index) {
			tab.setAttribute('role', 'tab');
			panels[index].setAttribute('role', 'tabpanel');
			panels[index].setAttribute('aria-labelledby', tab.id);
			panels[index].setAttribute('tabindex', '0');
		});

		function selectTab(selectedTab, shouldFocus) {
			tabs.forEach(function (tab, index) {
				var selected = tab === selectedTab;
				tab.setAttribute('aria-selected', selected ? 'true' : 'false');
				tab.tabIndex = selected ? 0 : -1;
				panels[index].hidden = !selected;
			});
			if (shouldFocus) { selectedTab.focus({ preventScroll: true }); }
		}

		tabs.forEach(function (tab, index) {
			tab.addEventListener('click', function () { selectTab(tab, true); });
			tab.addEventListener('keydown', function (event) {
				if (event.altKey || event.ctrlKey || event.metaKey) { return; }
				if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) === -1) { return; }
				event.preventDefault();
				var nextIndex = index + (event.key === 'ArrowLeft' ? -1 : 1);
				if (event.key === 'Home') { nextIndex = 0; }
				if (event.key === 'End') { nextIndex = tabs.length - 1; }
				selectTab(tabs[(nextIndex + tabs.length) % tabs.length], true);
			});
		});

		var engineeringTab = tabs.find(function (tab) { return tab.getAttribute('data-preview-tab') === 'engineering'; });
		var section = tablist.closest('.profile-section');
		if (engineeringTab && section) {
			section.querySelectorAll('[data-open-engineering]').forEach(function (button) {
				button.addEventListener('click', function () { selectTab(engineeringTab, true); });
			});
		}
		selectTab(tabs[0], false);
	}

	return {
		id: 'portfolio',
		element: element,
		homeId: 'work',
		aliases: { 'research-notebook': 'projects', 'hobbies': 'websites' },
		closeOnEscape: false,
		acceptsTarget: acceptsTarget,
		focus: function () { content.focus({ preventScroll: true }); },
		getLinkId: function () { return activeSectionId; },
		navigate: function (target) {
			setActiveSection(target.id);
		},
		initialize: function (controller) {
			navigation = controller;
			// Hide views only after enhancement so every section remains readable without JavaScript.
			element.classList.add('portfolio-enhanced');
			element.querySelectorAll('[data-preview-tabs]').forEach(initializePreviewTabs);
			navigation.onChange(updateNavigationButtons);
			[backButton, forwardButton].forEach(function (button, index) {
				button.addEventListener('click', function () {
					var destination = portfolioHistoryIndex(index === 0 ? -1 : 1);
					if (destination !== -1) { navigation.goToHistory(destination); }
				});
			});
			setActiveSection(activeSectionId);
			content.scrollTop = 0;
		}
	};
}
