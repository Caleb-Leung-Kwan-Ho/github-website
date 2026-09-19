(function () {
	'use strict';

	var body = document.body;
	var windows = Array.prototype.slice.call(document.querySelectorAll('[data-window]'));
	var windowStack = windows.slice();
	var taskButtons = Array.prototype.slice.call(document.querySelectorAll('[data-task-window]'));
	var navLinks = Array.prototype.slice.call(document.querySelectorAll('#site-nav a[href^="#"]'));
	var sections = navLinks
		.map(function (link) {
			return document.querySelector(link.getAttribute('href'));
		})
		.filter(Boolean);
	var portfolioWindow = document.querySelector('[data-window="portfolio"]');
	var notebookWindow = document.querySelector('[data-window="notebook"]');
	var explorerContent = document.querySelector('.explorer-content');
	var hobbiesSite = document.querySelector('.hobbies-site');
	var hobbiesContent = document.querySelector('.hobbies-window-body');
	var addressText = document.getElementById('address-text');
	var backButton = document.getElementById('back-button');
	var forwardButton = document.getElementById('forward-button');
	var windowMenus = Array.prototype.slice.call(document.querySelectorAll('.window-menu'));
	var startButton = document.getElementById('start-button');
	var startMenu = document.getElementById('start-menu');
	var clock = document.getElementById('taskbar-clock');
	var navigationEntries = [];
	var navigationIndex = 0;
	var navigationSession = String(Date.now());
	var activeSectionId = 'intro';
	var lastWindowTrigger = {};

	function getWindow(name) {
		return document.querySelector('[data-window="' + name + '"]');
	}

	function getTaskButton(name) {
		return document.querySelector('[data-task-window="' + name + '"]');
	}

	function setActiveWindow(windowElement) {
		windowMenus.forEach(function (menu) {
			if (menu.closest('[data-window]') !== windowElement) {
				menu.open = false;
			}
		});
		if (windowElement) {
			windowStack = windowStack.filter(function (candidate) {
				return candidate !== windowElement;
			});
			windowStack.push(windowElement);
		}

		windows.forEach(function (candidate) {
			candidate.classList.toggle('is-active', candidate === windowElement);
		});

		taskButtons.forEach(function (button) {
			var isActive = windowElement && button.getAttribute('data-task-window') === windowElement.getAttribute('data-window');
			button.classList.toggle('is-active', Boolean(isActive));
			button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
		});
	}

	function nextVisibleWindow(excludedWindow) {
		var visible = windowStack.filter(function (candidate) {
			return candidate !== excludedWindow && !candidate.hidden;
		});
		return visible[visible.length - 1] || null;
	}

	function focusWindow(windowElement) {
		if (!windowElement) {
			return;
		}
		if (windowElement.getAttribute('data-window') === 'portfolio') {
			explorerContent.focus();
		} else {
			windowElement.focus();
		}
	}

	function canReceiveFocus(element) {
		return element && document.contains(element) && element.getClientRects().length > 0;
	}

	function closeStartMenu() {
		startMenu.hidden = true;
		startButton.setAttribute('aria-expanded', 'false');
	}

	function openWindow(name, opener, shouldFocus) {
		var windowElement = getWindow(name);
		var taskButton = getTaskButton(name);
		if (!windowElement) {
			return;
		}

		if (opener && !opener.hasAttribute('data-task-window')) {
			lastWindowTrigger[name] = startMenu.contains(opener) ? startButton : opener;
		}

		windowElement.hidden = false;
		if (taskButton) {
			taskButton.hidden = false;
		}
		setActiveWindow(windowElement);
		closeStartMenu();

		if (shouldFocus !== false) {
			focusWindow(windowElement);
		}
	}

	function hideWindow(windowElement, isClosing) {
		if (windowDragging) { windowDragging.finish(); }
		closeWindowMenus();
		var name = windowElement.getAttribute('data-window');
		var taskButton = getTaskButton(name);
		windowElement.hidden = true;

		if (isClosing) {
			windowElement.classList.remove('is-maximized');
			var maximizeButton = windowElement.querySelector('[data-window-action="maximize"]');
			if (maximizeButton) {
				maximizeButton.setAttribute('aria-label', 'Maximize ' + name + ' window');
			}
			updateWindowMenu(windowElement);
			if (taskButton) {
				taskButton.hidden = true;
			}
		}

		var nextWindow = nextVisibleWindow(windowElement);
		setActiveWindow(nextWindow);

		if (!isClosing) {
			if (nextWindow) {
				focusWindow(nextWindow);
			} else if (taskButton) {
				taskButton.focus();
			}
			return;
		}

		if (canReceiveFocus(lastWindowTrigger[name])) {
			lastWindowTrigger[name].focus();
		} else if (nextWindow) {
			focusWindow(nextWindow);
		} else {
			startButton.focus();
		}
	}

	function toggleMaximize(windowElement, button) {
		if (windowDragging) { windowDragging.finish(); }
		var isMaximized = windowElement.classList.toggle('is-maximized');
		var name = windowElement.getAttribute('data-window');
		button.setAttribute('aria-label', (isMaximized ? 'Restore ' : 'Maximize ') + name + ' window');
		updateWindowMenu(windowElement);
		setActiveWindow(windowElement);
	}

	function portfolioHistoryIndex(direction) {
		var fromAuxiliary = sections.indexOf(document.getElementById(navigationEntries[navigationIndex])) === -1;
		for (var index = navigationIndex + direction; index >= 0 && index < navigationEntries.length; index += direction) {
			if (sections.indexOf(document.getElementById(navigationEntries[index])) !== -1 && (!fromAuxiliary || navigationEntries[index] !== activeSectionId)) {
				return index;
			}
		}
		return -1;
	}

	function updateNavigationButtons() {
		backButton.disabled = portfolioHistoryIndex(-1) === -1;
		forwardButton.disabled = portfolioHistoryIndex(1) === -1;
	}

	function navigationState() {
		return { desktopNavigation: { session: navigationSession, index: navigationIndex } };
	}

	function recordNavigation(id) {
		if (navigationEntries[navigationIndex] === id) { return; }
		navigationEntries = navigationEntries.slice(0, navigationIndex + 1);
		navigationEntries.push(id);
		navigationIndex = navigationEntries.length - 1;
		window.history.pushState(navigationState(), '', '#' + id);
		updateNavigationButtons();
	}

	function setActiveSection(id) {
		var target = document.getElementById(id);
		if (sections.indexOf(target) === -1) {
			return;
		}

		activeSectionId = id;
		navLinks.forEach(function (link) {
			var isActive = link.getAttribute('href') === '#' + id;
			if (isActive) {
				link.setAttribute('aria-current', 'page');
			} else {
				link.removeAttribute('aria-current');
			}
		});

		addressText.textContent = 'Portfolio / ' + target.getAttribute('data-section-name');
		updateNavigationButtons();
	}

	function navigateToSection(id, updateAddress) {
		var target = document.getElementById(id);
		if (sections.indexOf(target) === -1) {
			return;
		}

		openWindow('portfolio', null, false);
		setActiveSection(id);
		target.scrollIntoView({ block: 'start' });

		if (updateAddress) { recordNavigation(id); }
	}

	function focusAnchorTarget(target) {
		if (!target.hasAttribute('tabindex')) {
			target.setAttribute('tabindex', '-1');
		}
		target.focus({ preventScroll: true });
	}

	function isHobbyTarget(target) {
		return hobbiesSite && target && hobbiesSite.contains(target);
	}

	function navigateToHobby(target, updateAddress, shouldFocus) {
		openWindow('hobbies', null, false);
		// Scroll only the hobby pane; scrollIntoView can also move the simulated desktop.
		var top = target.getBoundingClientRect().top - hobbiesContent.getBoundingClientRect().top;
		hobbiesContent.scrollTo({ top: hobbiesContent.scrollTop + top - hobbiesContent.clientTop });
		if (shouldFocus) {
			focusAnchorTarget(target);
		}
		if (updateAddress) { recordNavigation(target.id); }
	}

	function navigateToFragment(id) {
		var target = document.getElementById(id);
		if (notebookWindow && target === notebookWindow) {
			openWindow('notebook', null, false);
		} else if (isHobbyTarget(target)) {
			navigateToHobby(target, false, false);
		} else if (sections.indexOf(target) !== -1) {
			navigateToSection(id, false);
		}
	}

	document.querySelectorAll('a[href^="#"]').forEach(function (link) {
		link.addEventListener('click', function (event) {
			var id = link.getAttribute('href').slice(1);
			var target = document.getElementById(id);
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !target) {
				return;
			}
			if (target !== notebookWindow && !isHobbyTarget(target) && sections.indexOf(target) === -1) {
				return;
			}
			event.preventDefault();
			if (target === notebookWindow) {
				openWindow('notebook', link, event.detail === 0);
				recordNavigation(id);
				return;
			}
			if (isHobbyTarget(target)) {
				navigateToHobby(target, true, event.detail === 0);
				return;
			}
			if (link.hasAttribute('data-hobby-return')) {
				hideWindow(getWindow('hobbies'), true);
			}
			navigateToSection(id, true);
			if (event.detail === 0 || link.classList.contains('skip-link')) {
				focusAnchorTarget(target);
			}
		});
	});

	if (hobbiesSite) {
		var hobbyTranslations = {
			ja: {
				subtitle: 'アニメ、漫画、ゲームと、香港のことを少し。',
				welcomeLabel: 'ようこそ！',
				welcomeText: 'こんにちは、Calebです。好きなものを集めた小さなサイトへようこそ。',
				navAnime: 'アニメ',
				navManga: '漫画',
				navGames: 'ゲーム',
				navAnticipated: '楽しみな作品',
				navTraining: 'トレーニング',
				navHongKong: '香港',
				navNotes: '暮らしのメモ',
				animeLabel: '好きなアニメ ベスト5',
				mangaLabel: 'いちばん好きな漫画',
				gemLabel: 'もっと知られてほしい作品',
				gamesLabel: '遊んだゲーム',
				watchingLabel: '今見ているアニメ',
				latelyLabel: '最近のこと',
				anticipatedLabel: '楽しみにしているアニメ',
				trainingLabel: 'トレーニングメニュー',
				hongKongLabel: '地元・香港のこと',
				notesLabel: 'アメリカで暮らすこと',
				personalPending: '感想は後日追加予定。',
				favoriteManga: 'いちばん好きな漫画はBerserkです。',
				hiddenGem: 'もっと知られてほしい作品はGundam Thunderboltです。',
				gamesNote: 'ゲームで遊んでいたのは、2025年5月から11月までの間だけです。しばらくは遊べませんが、いつかまた楽しめたらと思っています。',
				musicNote: 'どちらの作品も音楽が大好きです。',
				latelyNote: '最近はAnime MCPにも取り組んでいます。',
				trainingPending: 'メニューは後日追加予定。',
				trainingDescription: '週間メニューと、必要に応じて印刷用PDFを追加予定。',
				hongKongNote: '香港出身で、2019年から帰っていません。芝士鮮魷がとても恋しいです。茶餐廳も大好きです。',
				notesTitle: 'アメリカへの引っ越し',
				notesPending: 'ノートは後日追加予定。',
				thanks: '遊びに来てくれてありがとう！',
				return: 'メインサイトへ戻る',
				top: 'ページの先頭へ',
				artNote: '作品の権利は各権利者に帰属します。非公式のファンページであり、CD PROJEKT REDの承認・推奨を受けたものではありません。',
				nierTitle: 'NieR:Automata — シーズン2',
				grandBlueTitle: 'Grand Blue — シーズン3',
				edgerunnersTitle: 'Cyberpunk: Edgerunners — シーズン2',
				strangeFakeTitle: 'Fate/strange Fake — シーズン2',
				languageLabel: '表示言語',
				navLabel: '趣味の各コーナー',
				sideNavLabel: '趣味のメニュー',
				returnNavLabel: '戻るリンク'
			},
			'zh-HK': {
				subtitle: '動畫、漫畫、遊戲，還有一點香港的事。',
				welcomeLabel: '歡迎！',
				welcomeText: '你好，我是 Caleb。歡迎來到這個分享我喜歡的事物的小天地。',
				navAnime: '動畫',
				navManga: '漫畫',
				navGames: '遊戲',
				navAnticipated: '期待中的作品',
				navTraining: '健身',
				navHongKong: '香港',
				navNotes: '生活筆記',
				animeLabel: '最喜歡的五部動畫',
				mangaLabel: '最喜歡的漫畫',
				gemLabel: '想推薦給更多人的作品',
				gamesLabel: '玩過的遊戲',
				watchingLabel: '最近在追的動畫',
				latelyLabel: '近況',
				anticipatedLabel: '期待中的動畫',
				trainingLabel: '健身計劃',
				hongKongLabel: '我的家鄉：香港',
				notesLabel: '搬到美國的生活筆記',
				personalPending: '個人感想稍後補上。',
				favoriteManga: '我最喜歡的漫畫是 Berserk。',
				hiddenGem: '我想推薦給更多人的作品是 Gundam Thunderbolt。',
				gamesNote: '我只在 2025 年 5 月至 11 月期間玩過遊戲。暫時沒辦法再玩，希望將來有機會再玩。',
				musicNote: '我很喜歡這兩部動畫的音樂。',
				latelyNote: '最近也在做 Anime MCP。',
				trainingPending: '訓練內容稍後補上。',
				trainingDescription: '每週計劃稍後補上，亦可能提供可列印的 PDF。',
				hongKongNote: '我來自香港，自 2019 年起一直沒有回去。我很掛念芝士鮮魷，也很喜歡茶餐廳。',
				notesTitle: '搬到美國',
				notesPending: '生活筆記稍後補上。',
				thanks: '多謝到訪！',
				return: '返回我的主網站',
				top: '返回頁首',
				artNote: '作品版權屬於各自的權利人。本網站為非官方粉絲網頁，未經 CD PROJEKT RED 認可或支持。',
				nierTitle: 'NieR:Automata — 第二季',
				grandBlueTitle: 'Grand Blue — 第三季',
				edgerunnersTitle: 'Cyberpunk: Edgerunners — 第二季',
				strangeFakeTitle: 'Fate/strange Fake — 第二季',
				languageLabel: '頁面語言',
				navLabel: '興趣內容導覽',
				sideNavLabel: '興趣選單',
				returnNavLabel: '返回連結'
			}
		};
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
				document.querySelectorAll('[data-menu-language]').forEach(function (candidate) {
					candidate.setAttribute('aria-pressed', candidate.getAttribute('data-menu-language') === language ? 'true' : 'false');
				});
			});
		});
		var languageControls = hobbiesSite.querySelector('.hobbies-language-controls');
		if (languageControls) {
			languageControls.hidden = false;
		}
	}

	function setupWindowDragging() {
		var activeMove = null;
		var frame = 0;
		var taskbar = document.querySelector('.taskbar');

		function announce(windowElement, message) {
			var status = windowElement.querySelector('.window-menu-status');
			if (status) {
				status.textContent = message;
			}
		}

		function clearPosition(windowElement) {
			windowElement.classList.remove('is-positioned');
			windowElement.style.removeProperty('--window-x');
			windowElement.style.removeProperty('--window-y');
		}

		function paint() {
			frame = 0;
			if (!activeMove) {
				return;
			}
			activeMove.x = Math.max(activeMove.minX, Math.min(activeMove.maxX, activeMove.x));
			activeMove.y = Math.max(0, Math.min(activeMove.maxY, activeMove.y));
			activeMove.element.style.setProperty('--window-x', Math.round(activeMove.x) + 'px');
			activeMove.element.style.setProperty('--window-y', Math.round(activeMove.y) + 'px');
			activeMove.element.classList.add('is-positioned');
		}

		function finish(cancel, restoreFocus) {
			if (!activeMove) {
				return;
			}
			if (frame) {
				window.cancelAnimationFrame(frame);
				frame = 0;
			}
			if (!cancel) {
				paint();
			}
			var move = activeMove;
			activeMove = null;
			move.element.classList.remove('is-dragging');
			if (cancel) {
				clearPosition(move.element);
				if (move.wasPositioned) {
					move.element.style.setProperty('--window-x', move.originalX);
					move.element.style.setProperty('--window-y', move.originalY);
					move.element.classList.add('is-positioned');
				}
			}
			if (move.pointerId !== undefined && move.titlebar.hasPointerCapture(move.pointerId)) {
				move.titlebar.releasePointerCapture(move.pointerId);
			}
			if (move.keyboard) {
				if (move.tabIndex === null) {
					move.titlebar.removeAttribute('tabindex');
				} else {
					move.titlebar.setAttribute('tabindex', move.tabIndex);
				}
				announce(move.element, cancel ? 'Window move canceled.' : 'Window position saved.');
				if (restoreFocus !== false && move.returnFocus && move.returnFocus.getClientRects().length) {
					move.returnFocus.focus();
				}
			}
		}

		function begin(windowElement) {
			finish(false, false);
			if (window.matchMedia('(max-width: 736px)').matches || windowElement.hidden || windowElement.classList.contains('is-maximized')) {
				announce(windowElement, 'Moving is available for restored windows on a desktop screen.');
				return false;
			}
			var titlebar = windowElement.querySelector('[data-titlebar]');
			var bounds = windowElement.getBoundingClientRect();
			var parentBounds = windowElement.offsetParent.getBoundingClientRect();
			var availableWidth = document.documentElement.clientWidth - parentBounds.left;
			var availableHeight = (taskbar ? taskbar.getBoundingClientRect().top : window.innerHeight) - parentBounds.top;
			var titleHeight = titlebar.getBoundingClientRect().height + windowElement.clientTop;
			// Read geometry once; pointer moves only update two CSS coordinates in a single animation frame.
			activeMove = {
				element: windowElement,
				titlebar: titlebar,
				x: bounds.left - parentBounds.left,
				y: bounds.top - parentBounds.top,
				minX: Math.min(0, availableWidth - bounds.width),
				maxX: availableWidth - bounds.width,
				maxY: Math.max(0, availableHeight - Math.min(bounds.height, titleHeight)),
				wasPositioned: windowElement.classList.contains('is-positioned'),
				originalX: windowElement.style.getPropertyValue('--window-x'),
				originalY: windowElement.style.getPropertyValue('--window-y')
			};
			if (bounds.height <= availableHeight) {
				activeMove.maxY = availableHeight - bounds.height;
			}
			setActiveWindow(windowElement);
			closeStartMenu();
			closeWindowMenus();
			paint();
			return true;
		}

		windows.forEach(function (windowElement) {
			var titlebar = windowElement.querySelector('[data-titlebar]');
			titlebar.addEventListener('pointerdown', function (event) {
				if (!event.isPrimary || event.button !== 0 || event.target.closest('button, a, .window-controls') || !begin(windowElement)) {
					return;
				}
				event.preventDefault();
				activeMove.pointerId = event.pointerId;
				activeMove.startClientX = event.clientX;
				activeMove.startClientY = event.clientY;
				activeMove.startX = activeMove.x;
				activeMove.startY = activeMove.y;
				windowElement.classList.add('is-dragging');
				titlebar.setPointerCapture(event.pointerId);
			});
			titlebar.addEventListener('pointermove', function (event) {
				if (!activeMove || activeMove.titlebar !== titlebar || activeMove.pointerId !== event.pointerId) {
					return;
				}
				activeMove.x = activeMove.startX + event.clientX - activeMove.startClientX;
				activeMove.y = activeMove.startY + event.clientY - activeMove.startClientY;
				if (!frame) {
					frame = window.requestAnimationFrame(paint);
				}
			});
			titlebar.addEventListener('pointerup', function (event) {
				if (activeMove && activeMove.titlebar === titlebar && activeMove.pointerId === event.pointerId) {
					activeMove.x = activeMove.startX + event.clientX - activeMove.startClientX;
					activeMove.y = activeMove.startY + event.clientY - activeMove.startClientY;
					finish(false, false);
				}
			});
			['pointercancel', 'lostpointercapture'].forEach(function (eventName) {
				titlebar.addEventListener(eventName, function (event) {
					if (activeMove && activeMove.titlebar === titlebar && activeMove.pointerId === event.pointerId) {
						finish(true, false);
					}
				});
			});
		});

		document.addEventListener('pointerdown', function () {
			if (activeMove && activeMove.keyboard) {
				finish(false, false);
			}
		}, true);

		document.addEventListener('keydown', function (event) {
			if (!activeMove || !activeMove.keyboard) {
				return;
			}
			var steps = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
			if (!steps[event.key] && ['Enter', 'Escape', 'Tab'].indexOf(event.key) === -1) {
				return;
			}
			event.preventDefault();
			event.stopImmediatePropagation();
			if (steps[event.key]) {
				var distance = event.shiftKey ? 50 : 10;
				activeMove.x += steps[event.key][0] * distance;
				activeMove.y += steps[event.key][1] * distance;
				paint();
			} else {
				finish(event.key === 'Escape', true);
			}
		}, true);

		function refresh() {
			finish(false, false);
			windows.forEach(clearPosition);
		}
		window.addEventListener('resize', refresh);
		window.addEventListener('blur', function () { finish(true, false); });

		return {
			reset: function (windowElement) {
				finish(false, false);
				clearPosition(windowElement);
				announce(windowElement, 'Window position reset.');
			},
			startKeyboardMove: function (windowElement, returnFocus) {
				if (begin(windowElement)) {
					activeMove.keyboard = true;
					activeMove.returnFocus = returnFocus;
					activeMove.tabIndex = activeMove.titlebar.getAttribute('tabindex');
					activeMove.titlebar.setAttribute('tabindex', '-1');
					activeMove.titlebar.focus({ preventScroll: true });
					announce(windowElement, 'Use arrow keys to move the window, Shift for larger steps, Enter to save, or Escape to cancel.');
				}
			},
			finish: finish,
			refresh: refresh
		};
	}

	function closeWindowMenus() {
		windowMenus.forEach(function (menu) { menu.open = false; });
	}

	function updateWindowMenu(windowElement) {
		var maximized = windowElement.classList.contains('is-maximized');
		windowElement.querySelectorAll('[data-menu-action="maximize"]').forEach(function (button) {
			button.textContent = maximized ? 'Restore window' : 'Maximize window';
		});
		windowElement.querySelectorAll('[data-menu-action="move"]').forEach(function (button) {
			button.disabled = maximized || window.matchMedia('(max-width: 736px)').matches;
		});
	}

	function announceWindow(windowElement, message) {
		var status = windowElement.querySelector('.window-menu-status');
		if (status) { status.textContent = message; }
	}

	function copyWindowText(windowElement, value) {
		function unavailable() {
			announceWindow(windowElement, 'Copy unavailable. Select and copy: ' + value);
		}
		if (!navigator.clipboard || !navigator.clipboard.writeText) { unavailable(); return; }
		navigator.clipboard.writeText(value).then(function () {
			announceWindow(windowElement, 'Copied to clipboard.');
		}, unavailable);
	}

	windowMenus.forEach(function (menu) {
		var summary = menu.querySelector('summary');
		var windowElement = menu.closest('[data-window]');
		summary.addEventListener('click', function () {
			windowMenus.forEach(function (other) { if (other !== menu) { other.open = false; } });
			closeStartMenu();
			updateWindowMenu(windowElement);
		});
		menu.addEventListener('focusout', function (event) {
			if (!menu.contains(event.relatedTarget)) { menu.open = false; }
		});
		menu.addEventListener('keydown', function (event) {
			updateWindowMenu(windowElement);
			var controls = Array.prototype.slice.call(menu.querySelectorAll('.window-menu-panel a, .window-menu-panel button:not(:disabled)'));
			var index = controls.indexOf(document.activeElement);
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				windowMenus.forEach(function (other) { if (other !== menu) { other.open = false; } });
				updateWindowMenu(windowElement);
				menu.open = true;
				if (controls.length) {
					var next = index === -1 ? (event.key === 'ArrowDown' ? 0 : controls.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + controls.length) % controls.length;
					controls[next].focus();
				}
			} else if (event.target === summary && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
				event.preventDefault();
				var siblings = Array.prototype.slice.call(menu.parentElement.querySelectorAll('summary'));
				menu.open = false;
				siblings[(siblings.indexOf(summary) + (event.key === 'ArrowRight' ? 1 : -1) + siblings.length) % siblings.length].focus();
			}
		});
		menu.addEventListener('click', function (event) {
			if (!event.target.closest('.window-menu-panel a, .window-menu-panel button')) { return; }
			menu.open = false;
			if (menu.contains(document.activeElement)) {
				if (!windowElement.hidden && windowElement.classList.contains('is-active')) {
					summary.focus();
				} else {
					focusWindow(document.querySelector('.os-window.is-active'));
				}
			}
		});
	});

	document.querySelectorAll('[data-menu-action]').forEach(function (button) {
		button.addEventListener('click', function () {
			var windowElement = button.closest('[data-window]');
			var name = windowElement.getAttribute('data-window');
			var action = button.getAttribute('data-menu-action');
			var maximizeButton = windowElement.querySelector('[data-window-action="maximize"]');
			announceWindow(windowElement, '');
			if (action === 'maximize') {
				toggleMaximize(windowElement, maximizeButton);
			} else if (action === 'reset-position') {
				if (windowElement.classList.contains('is-maximized')) { toggleMaximize(windowElement, maximizeButton); }
				windowDragging.reset(windowElement);
				announceWindow(windowElement, 'Window position reset.');
			} else if (action === 'move') {
				windowDragging.startKeyboardMove(windowElement, button.closest('.window-menu').querySelector('summary'));
			} else if (action === 'copy-email') {
				copyWindowText(windowElement, 'caleb.leungkwanho@gmail.com');
			} else if (action === 'copy-link') {
				var url = new URL(window.location.href);
				url.hash = name === 'portfolio' ? activeSectionId : name === 'notebook' ? 'research-notebook' : 'hobby-top';
				copyWindowText(windowElement, url.href);
			} else if (action === 'top') {
				if (name === 'portfolio') {
					navigateToSection('intro', true);
					focusAnchorTarget(document.getElementById('intro'));
				} else if (name === 'hobbies') {
					navigateToHobby(document.getElementById('hobby-top'), true, true);
				} else {
					var page = windowElement.querySelector('.notebook-page');
					page.scrollTo({ top: 0 });
					page.focus({ preventScroll: true });
				}
			}
		});
	});

	document.querySelectorAll('[data-menu-language]').forEach(function (button) {
		button.addEventListener('click', function () {
			var language = button.getAttribute('data-menu-language');
			var original = hobbiesSite.querySelector('[data-hobby-language="' + language + '"]');
			if (original) { original.click(); }
		});
	});

	var windowDragging = setupWindowDragging();

	document.querySelectorAll('[data-open-window]').forEach(function (opener) {
		opener.addEventListener('click', function () {
			openWindow(opener.getAttribute('data-open-window'), opener);
		});
	});

	document.querySelectorAll('[data-window-action]').forEach(function (control) {
		control.addEventListener('click', function () {
			var windowElement = control.closest('[data-window]');
			var action = control.getAttribute('data-window-action');
			if (!windowElement) {
				return;
			}

			if (action === 'minimize') {
				hideWindow(windowElement, false);
			} else if (action === 'maximize') {
				toggleMaximize(windowElement, control);
			} else if (action === 'close') {
				hideWindow(windowElement, true);
			}
		});
	});

	windows.forEach(function (windowElement) {
		windowElement.addEventListener('pointerdown', function () {
			if (!windowElement.hidden) {
				setActiveWindow(windowElement);
			}
		});
		windowElement.addEventListener('focusin', function () {
			setActiveWindow(windowElement);
		});
	});

	taskButtons.forEach(function (button) {
		button.addEventListener('click', function () {
			var name = button.getAttribute('data-task-window');
			var windowElement = getWindow(name);
			if (!windowElement) {
				return;
			}

			if (!windowElement.hidden && windowElement.classList.contains('is-active')) {
				hideWindow(windowElement, false);
			} else {
				openWindow(name, button);
			}
		});
	});

	[backButton, forwardButton].forEach(function (button, index) {
		button.addEventListener('click', function () {
			var destination = portfolioHistoryIndex(index === 0 ? -1 : 1);
			if (destination !== -1) { window.history.go(destination - navigationIndex); }
		});
	});

	startButton.addEventListener('click', function () {
		closeWindowMenus();
		var willOpen = startMenu.hidden;
		startMenu.hidden = !willOpen;
		startButton.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
		if (willOpen) {
			startMenu.querySelector('a, button').focus();
		}
	});

	document.addEventListener('click', function (event) {
		if (!event.target.closest('.window-menu')) { closeWindowMenus(); }
		if (!startMenu.hidden && !startMenu.contains(event.target) && !startButton.contains(event.target)) {
			closeStartMenu();
		}
	});

	document.addEventListener('keydown', function (event) {
		if (event.key !== 'Escape') {
			return;
		}
		var openMenu = windowMenus.filter(function (menu) { return menu.open; })[0];
		if (openMenu) {
			event.preventDefault();
			closeWindowMenus();
			openMenu.querySelector('summary').focus();
			return;
		}

		if (!startMenu.hidden) {
			closeStartMenu();
			startButton.focus();
			return;
		}

		var activeWindow = windows.filter(function (windowElement) {
			return !windowElement.hidden && windowElement.classList.contains('is-active');
		})[0];
		if (activeWindow && activeWindow !== portfolioWindow) {
			hideWindow(activeWindow, true);
		}
	});

	window.addEventListener('popstate', function (event) {
		var id = window.location.hash.slice(1) || 'intro';
		var target = document.getElementById(id);
		if (target !== notebookWindow && !isHobbyTarget(target) && sections.indexOf(target) === -1) {
			id = 'intro';
			target = document.getElementById(id);
			window.history.replaceState(event.state, '', '#' + id);
		}
		var state = event.state && event.state.desktopNavigation;
		// Only traverse entries made in this page session; never send an in-site button off-site.
		if (state && state.session === navigationSession && navigationEntries[state.index] === id) {
			navigationIndex = state.index;
		} else {
			navigationEntries = [id];
			navigationIndex = 0;
			window.history.replaceState(navigationState(), '');
		}
		updateNavigationButtons();
		navigateToFragment(id);
		focusAnchorTarget(target || document.getElementById('intro'));
	});

	if ('IntersectionObserver' in window) {
		var observer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					setActiveSection(entry.target.id);
				}
			});
		}, {
			root: explorerContent,
			rootMargin: '-15% 0px -70% 0px',
			threshold: 0
		});

		sections.forEach(function (section) {
			observer.observe(section);
		});
	}

	function updateClock() {
		var now = new Date();
		clock.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
		clock.setAttribute('datetime', now.toISOString());
		clock.setAttribute('title', now.toLocaleDateString());
	}

	function finishLoading() {
		window.setTimeout(function () {
			body.classList.remove('is-preload');
		}, 100);
	}

	var initialId = window.location.hash.slice(1);
	var initialTarget = document.getElementById(initialId);
	if ((!notebookWindow || initialTarget !== notebookWindow) && !isHobbyTarget(initialTarget) && sections.indexOf(initialTarget) === -1) {
		initialId = 'intro';
	}
	navigationEntries = [initialId];
	window.history.replaceState(navigationState(), '', window.location.hash && window.location.hash !== '#' + initialId ? '#' + initialId : window.location.href);
	updateNavigationButtons();
	setActiveSection(sections.indexOf(initialTarget) !== -1 ? initialId : 'intro');
	updateClock();
	window.setInterval(updateClock, 30000);

	if (document.readyState === 'complete') {
		finishLoading();
	} else {
		window.addEventListener('load', finishLoading);
	}

	// Reset the internal Explorer pane as well as the document's normal scroll restoration.
	window.requestAnimationFrame(function () {
		navigateToFragment(initialId);
	});

	setActiveWindow(portfolioWindow);
})();
