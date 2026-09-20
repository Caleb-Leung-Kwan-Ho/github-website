import { hobbyTranslations } from './translations.js';

export function createHobbiesSite() {
	var element = document.querySelector('[data-window="hobbies"]');
	var hobbiesSite = element.querySelector('.hobbies-site');
	var content = element.querySelector('.hobbies-window-body');

	// English stays authored in HTML so the complete page is readable without JavaScript.
	var hobbyText = Array.prototype.slice.call(hobbiesSite.querySelectorAll('[data-hobby-text], [data-hobby-aria]')).map(function (element) {
		var isAria = element.hasAttribute('data-hobby-aria');
		return {
			element: element,
			key: element.getAttribute(isAria ? 'data-hobby-aria' : 'data-hobby-text'),
			isAria: isAria,
			english: isAria ? element.getAttribute('aria-label') : element.textContent
		};
	});
	var languageButtons = hobbiesSite.querySelectorAll('[data-hobby-language]');
	languageButtons.forEach(function (button) {
		button.addEventListener('click', function () {
			var language = button.getAttribute('data-hobby-language');
			if (language !== 'en' && !Object.prototype.hasOwnProperty.call(hobbyTranslations, language)) {
				return;
			}
			var translation = language === 'en' ? null : hobbyTranslations[language];
			hobbyText.forEach(function (item) {
				var copy = translation && Object.prototype.hasOwnProperty.call(translation, item.key) ? translation[item.key] : item.english;
				if (item.isAria) {
					item.element.setAttribute('aria-label', copy);
				} else {
					item.element.textContent = copy;
				}
			});
			hobbiesSite.setAttribute('lang', language);
			languageButtons.forEach(function (candidate) {
				candidate.setAttribute('aria-pressed', candidate === button ? 'true' : 'false');
			});
			element.querySelectorAll('[data-menu-language]').forEach(function (candidate) {
				candidate.setAttribute('aria-pressed', candidate.getAttribute('data-menu-language') === language ? 'true' : 'false');
			});
		});
	});
	var languageControls = hobbiesSite.querySelector('.hobbies-language-controls');
	if (languageControls) {
		languageControls.hidden = false;
	}

	return {
		id: 'hobbies',
		element: element,
		homeId: 'hobby-top',
		closeOnEscape: true,
		acceptsTarget: function (target) { return Boolean(target && hobbiesSite.contains(target)); },
		focus: function () { element.focus({ preventScroll: true }); },
		getLinkId: function () { return 'hobby-top'; },
		navigate: function (target) {
			// scrollIntoView would also move the simulated desktop.
			var top = target.getBoundingClientRect().top - content.getBoundingClientRect().top;
			content.scrollTo({ top: content.scrollTop + top - content.clientTop });
		},
		selectLanguage: function (language) {
			var original = Array.prototype.find.call(languageButtons, function (button) {
				return button.getAttribute('data-hobby-language') === language;
			});
			if (original) { original.click(); }
		},
		initialize: function (navigation, desktop) {
			hobbiesSite.querySelectorAll('[data-hobby-return]').forEach(function (link) {
				link.addEventListener('click', function (event) {
					if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
						desktop.hideWindow(element, true);
					}
				});
			});
		}
	};
}
