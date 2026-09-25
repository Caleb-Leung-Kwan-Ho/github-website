export function createWebsitesSite() {
	var element = document.querySelector('[data-window="websites"]');
	var content = element.querySelector('#websites');
	var shortcuts = element.querySelectorAll('.website-shortcut');

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
		getFavorites: function () {
			return Array.prototype.map.call(shortcuts, function (shortcut) {
				return { href: shortcut.getAttribute('href'), name: shortcut.getAttribute('data-website-name') };
			});
		},
		initialize: function () {
			var count = shortcuts.length;
			element.querySelectorAll('[data-websites-count]').forEach(function (label) {
				label.textContent = count + (count === 1 ? ' website' : ' websites');
			});
		}
	};
}
