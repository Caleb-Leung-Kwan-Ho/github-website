import { createDesktop } from '../../desktop/windows.js';
import { createNavigation } from '../../desktop/navigation.js';
import { setupWindowMenus } from '../../desktop/menus.js';
import { setupBrowserWindows } from '../../desktop/browser.js';
import { createSites } from './site-registry.js';

// The generated site order keeps Portfolio first as the default destination.
var sites = createSites();
var desktop = createDesktop(sites);
var navigation = createNavigation(sites, desktop);

sites.forEach(function (site) {
	if (site.initialize) { site.initialize(navigation, desktop); }
});
setupBrowserWindows(sites, navigation);
setupWindowMenus(sites, desktop, navigation);
desktop.setActiveWindow(sites[0].element);
navigation.start();

function finishLoading() {
	window.setTimeout(function () { document.body.classList.remove('is-preload'); }, 100);
}
if (document.readyState === 'complete') {
	finishLoading();
} else {
	window.addEventListener('load', finishLoading);
}
