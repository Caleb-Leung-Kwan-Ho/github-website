(function () {
	'use strict';

	var body = document.body;
	var navLinks = Array.prototype.slice.call(document.querySelectorAll('#site-nav a[href^="#"]'));
	var sections = navLinks
		.map(function (link) {
			return document.querySelector(link.getAttribute('href'));
		})
		.filter(Boolean);

	function setActiveSection(id) {
		navLinks.forEach(function (link) {
			var isActive = link.getAttribute('href') === '#' + id;
			if (isActive) {
				link.setAttribute('aria-current', 'page');
			} else {
				link.removeAttribute('aria-current');
			}
		});
	}

	if ('IntersectionObserver' in window) {
		var observer = new IntersectionObserver(function (entries) {
			if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
				setActiveSection(sections[sections.length - 1].id);
				return;
			}

			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					setActiveSection(entry.target.id);
				}
			});
		}, {
			rootMargin: '-20% 0px -65% 0px',
			threshold: 0
		});

		sections.forEach(function (section) {
			observer.observe(section);
		});

		window.addEventListener('scroll', function () {
			if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
				setActiveSection(sections[sections.length - 1].id);
			}
		}, { passive: true });
	}

	navLinks.forEach(function (link) {
		link.addEventListener('click', function () {
			setActiveSection(link.getAttribute('href').slice(1));
		});
	});

	function finishLoading() {
		window.setTimeout(function () {
			body.classList.remove('is-preload');
		}, 100);
	}

	if (document.readyState === 'complete') {
		finishLoading();
	} else {
		window.addEventListener('load', finishLoading);
	}

	setActiveSection(window.location.hash ? window.location.hash.slice(1) : 'intro');
})();
