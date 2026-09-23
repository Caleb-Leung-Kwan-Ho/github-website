export function createPortfolioSite() {
	var element = document.querySelector('[data-window="portfolio"]');
	var content = element.querySelector('.explorer-content');
	var navLinks = Array.prototype.slice.call(element.querySelectorAll('#site-nav a[href^="#"]'));
	var sections = navLinks.map(function (link) {
		return document.querySelector(link.getAttribute('href'));
	}).filter(Boolean);
	var addressText = element.querySelector('#address-text');
	var backButton = element.querySelector('#back-button');
	var forwardButton = element.querySelector('#forward-button');
	var activeSectionId = 'intro';
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
		activeSectionId = id;
		navLinks.forEach(function (link) {
			if (link.getAttribute('href') === '#' + id) {
				link.setAttribute('aria-current', 'page');
			} else {
				link.removeAttribute('aria-current');
			}
		});
		addressText.textContent = 'Portfolio / ' + target.getAttribute('data-section-name');
		updateNavigationButtons();
	}

	return {
		id: 'portfolio',
		element: element,
		homeId: 'intro',
		aliases: { 'research-notebook': 'projects', 'hobbies': 'websites' },
		closeOnEscape: false,
		acceptsTarget: acceptsTarget,
		focus: function () { content.focus({ preventScroll: true }); },
		getLinkId: function () { return activeSectionId; },
		navigate: function (target) {
			setActiveSection(target.id);
			// Scrolling the pane avoids moving a window that the visitor has dragged down.
			var top = target.getBoundingClientRect().top - content.getBoundingClientRect().top;
			content.scrollTo({ top: content.scrollTop + top - content.clientTop });
		},
		initialize: function (controller) {
			navigation = controller;
			navigation.onChange(updateNavigationButtons);
			[backButton, forwardButton].forEach(function (button, index) {
				button.addEventListener('click', function () {
					var destination = portfolioHistoryIndex(index === 0 ? -1 : 1);
					if (destination !== -1) { navigation.goToHistory(destination); }
				});
			});
			if ('IntersectionObserver' in window) {
				var observer = new IntersectionObserver(function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) { setActiveSection(entry.target.id); }
					});
				}, { root: content, rootMargin: '-15% 0px -70% 0px', threshold: 0 });
				sections.forEach(function (section) { observer.observe(section); });
			}
			setActiveSection(activeSectionId);
		}
	};
}
