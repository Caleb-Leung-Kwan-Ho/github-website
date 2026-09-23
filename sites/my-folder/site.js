export function createWebsiteFolder() {
	var element = document.querySelector('[data-window="websites"]');
	var content = element.querySelector('#my-folder');
	var shortcuts = element.querySelectorAll('.website-shortcut');
	var count = shortcuts.length;

	// Count the authored links after build-time feature gates have removed disabled sites.
	element.querySelector('[data-folder-count]').textContent = count + (count === 1 ? ' website shortcut' : ' website shortcuts');
	element.querySelector('[data-folder-status]').textContent = count + (count === 1 ? ' object' : ' objects');

	return {
		id: 'websites',
		element: element,
		homeId: 'my-folder',
		closeOnEscape: true,
		acceptsTarget: function (target) { return target === content; },
		focus: function () { content.focus({ preventScroll: true }); },
		getLinkId: function () { return 'my-folder'; },
		navigate: function () { content.scrollTop = 0; },
		initialize: function (navigation) {
			element.querySelector('.folder-back').addEventListener('click', function () {
				var previous = navigation.findInHistory(-1, function (id) { return id !== 'my-folder'; });
				if (previous !== -1) {
					navigation.goToHistory(previous);
				} else {
					// A shared direct link still offers a way back to the parent directory.
					navigation.navigate('websites', { record: true, focus: true });
				}
			});
		}
	};
}
