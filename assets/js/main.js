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
		if (isHobbyTarget(target)) {
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
			if (!isHobbyTarget(target) && sections.indexOf(target) === -1) {
				return;
			}
			event.preventDefault();
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
				navNotes: '留学生へ',
				animeLabel: '好きなアニメ ベスト5',
				mangaLabel: 'いちばん好きな漫画',
				gemLabel: 'もっと知られてほしい作品',
				gamesLabel: 'ゲーム',
				watchingLabel: '今見ているアニメ',
				latelyLabel: '最近のこと',
				anticipatedLabel: '楽しみにしているアニメ',
				trainingLabel: 'トレーニングメニュー',
				hongKongLabel: '地元・香港のこと',
				notesLabel: '留学生へのアドバイス',
				personalPending: '感想は後日追加予定。',
				favoriteManga: 'いちばん好きな漫画はBerserkです。',
				hiddenGem: 'もっと知られてほしい作品はGundam Thunderboltです。',
				gamesNote: '2025年5月から11月にかけて遊んでいたゲームです。今は忙しくて遊ぶ時間がありませんが、どれもおすすめなので、ぜひ遊んでみてください。いつかまたゲームを楽しめたらと思っています。',
				musicNote: 'この2作品を楽しみにしています。どちらも音楽が大好きです。',
				animeNotesPending: '詳しいコメントはまた後日。',
				latelyNote: '最近はAnime MCPの開発で忙しくしています。',
				trainingPending: 'メニューは後日追加予定。',
				trainingIntro: '上半身を鍛えることと、ジャンプ力を伸ばすことが目標です。週に5回筋トレをして、日曜日はジャンプ練習、水曜日は休養にしています。',
				trainingInjury: '今は肘のけがに合わせてメニューを調整しています。一部の種目は控えています。',
				trainingDetails: '1週間のメニューを見る',
				dayMonday: '月曜日',
				dayTuesday: '火曜日',
				dayWednesday: '水曜日',
				dayThursday: '木曜日',
				dayFriday: '金曜日',
				daySaturday: '土曜日',
				daySunday: '日曜日',
				workoutMonday: '上半身（短め）',
				workoutTuesday: '下半身の維持',
				workoutWednesday: '休養',
				workoutThursday: '上半身（中くらいの長さ）',
				workoutFriday: '背中',
				workoutSaturday: '上半身（長め）',
				workoutSunday: 'ジャンプ・ダンク練習',
				exerciseMonday: 'マシンショルダープレス、マシンチェストプレス、チェストサポート式マシンロウ、シーテッドダンベルサイドレイズ、リバースペックデック。',
				exerciseTuesday: 'フロントスクワット、ブルガリアンスクワット、バックエクステンション、片脚レッグプレス、片脚シーテッドレッグカール、カーフレイズ。',
				exerciseWednesday: '休養日。',
				exerciseThursday: 'マシンチェストプレスとショルダープレス、ジロンダ式サイドレイズとシーテッドダンベルサイドレイズ、片腕インクラインマシンプレス、ペックデック、リバースペックデック。',
				exerciseFriday: 'チェストサポート式マシンロウ、斜め方向へのプルダウン／ハイロウ、リバースペックデック。',
				exerciseSaturday: 'マシンショルダープレスとチェストプレス、ジロンダ式サイドレイズ、片腕インクラインマシンプレス、ペックデック、リバースペックデック、マシンアブクランチ。',
				exerciseSunday: '片脚踏み切りジャンプの段階的な練習。',
				trainingDescription: '詳しいトレーニング内容は後日追加予定です。',
				hongKongNote: '香港の沙田出身で、2019年から香港に帰っていません。芝士鮮魷が大好きです。大排檔や茶餐廳も大好きです。',
				hongKongEmail: 'おすすめの大排檔があれば、ぜひメールで教えてください。',
				notesTitle: '留学生へのアドバイス',
				notesIntro: 'アメリカへの留学や、その先のキャリアに向けて、今ならこう準備すると思うことをまとめました。私個人の考えなので、自分の目標や予算に合わせて参考にしてください。',
				adviceOneTitle: '卒業後の進路を考えて専攻を選ぶ',
				adviceOneBody: 'アメリカで働くことが目標なら、自分の興味や目指す仕事に合うSTEM対象のプログラムを検討します。選んだプログラムがSTEM OPTの対象になるかを学校に確認し、OPTや雇用主によるH-1B申請の可能性について早めに調べておきましょう。学位やSTEM OPTがあっても、就職や長期の在留資格が保証されるわけではありません。純粋数学など理論中心の分野を選ぶなら、研究に進むのか、知識を実務にどうつなげるのかを考えてから決めるのがおすすめです。',
				adviceTwoTitle: '留学する目的をはっきりさせる',
				adviceTwoBody: '文化交流を目的に1年間過ごすだけでも、価値のある経験になると思います。英語を学ぶことが主な目的なら、アメリカの学校にお金を払う前に、イギリスやオーストラリアの選択肢も比較します。どの国が必ず安いと決めつけず、授業料、住居費、受講期間を比べましょう。海外でキャリアを築きたいなら、入学を決める前に、教育内容、就職市場、働くために必要な資格や条件を調べておきたいところです。',
				adviceThreeTitle: '渡航前から準備を始める',
				adviceThreeBody: '私なら、大学に入る前に実践的なプログラミングを学びます。物理、化学、数学を専攻する場合でも、母国で費用を抑えて受けられる短期のプログラミング講座などを検討します。費用と内容の両方を比べて選びましょう。修了証は学位ではなく、就職を保証するものでもありません。LinkedInのアカウントを早めに作り、自分で何かを作り、人とつながり、インターンの募集時期を調べる。卒業まで待たずに始めておきたいです。',
				notesPending: 'アドバイスは少しずつ追加していきます。',
				notesSourcesLabel: '最新の要件を確認する',
				optSourceLabel: 'STEM OPT',
				h1bSourceLabel: 'H-1B',
				thanks: '遊びに来てくれてありがとう！',
				return: 'メインサイトへ戻る',
				top: 'ページの先頭へ',
				artNote: '作品の権利は各権利者に帰属します。非公式のファンページであり、CD PROJEKT REDの承認・推奨を受けたものではありません。',
				artReuseNote: 'このサイト用に制作したピクセルアートは、許可なく再利用しないでください。',
				artTermsLabel: 'アートワークの利用について',
				nierTitle: 'NieR:Automata — シーズン2',
				grandBlueTitle: 'ぐらんぶる — シーズン3',
				edgerunnersTitle: 'Cyberpunk: Edgerunners — シーズン2',
				strangeFakeTitle: 'Fate/strange Fake — シーズン2',
				languageLabel: '表示言語',
				navLabel: '趣味の各コーナー',
				sideNavLabel: '趣味のメニュー',
				returnNavLabel: '戻るリンク'
			},
			'zh-HK': {
				subtitle: '動畫、漫畫、遊戲，同埋少少香港嘅事。',
				welcomeLabel: '歡迎歡迎！',
				welcomeText: '我係 Caleb。歡迎嚟到我嘅小網頁！呢度會分享我嘅嗜好，同埋我鍾意嘅嘢。',
				navAnime: '動畫',
				navManga: '漫畫',
				navGames: '遊戲',
				navAnticipated: '期待中的作品',
				navTraining: '健身',
				navHongKong: '香港',
				navNotes: '留學生小貼士',
				animeLabel: '我最鍾意嘅五部動畫',
				mangaLabel: '我最鍾意嘅漫畫',
				gemLabel: '想推薦畀更多人嘅作品',
				gamesLabel: '遊戲',
				watchingLabel: '最近追緊嘅動畫',
				latelyLabel: '近況',
				anticipatedLabel: '期待中的動畫',
				trainingLabel: '健身計劃',
				hongKongLabel: '我嘅家鄉：香港',
				notesLabel: '留學生小貼士',
				personalPending: '感想遲啲再寫。',
				favoriteManga: '我最鍾意嘅漫畫係 Berserk。',
				hiddenGem: '我想推薦畀更多人嘅作品係 Gundam Thunderbolt。',
				gamesNote: '呢幾隻都係我喺 2025 年 5 月至 11 月嗰陣玩嘅遊戲。而家真係太忙，冇時間玩住。不過呢幾隻都唔錯，值得你試吓！希望將來有時間再玩返。',
				musicNote: '我好期待呢兩部動畫，兩部嘅音樂我都好鍾意。',
				animeNotesPending: '更多感想遲啲再寫。',
				latelyNote: '最近忙緊做 Anime MCP。',
				trainingPending: '訓練內容遲啲再補。',
				trainingIntro: '目標係練好上半身，同埋提升彈跳力。每星期五日做重量訓練，星期日練跳，星期三休息。',
				trainingInjury: '而家因為手踭受傷，暫時調整咗訓練，有啲動作做唔到住。',
				trainingDetails: '睇吓每星期嘅訓練',
				dayMonday: '星期一',
				dayTuesday: '星期二',
				dayWednesday: '星期三',
				dayThursday: '星期四',
				dayFriday: '星期五',
				daySaturday: '星期六',
				daySunday: '星期日',
				workoutMonday: '上半身（短時間）',
				workoutTuesday: '下半身維持訓練',
				workoutWednesday: '休息',
				workoutThursday: '上半身（中等長度）',
				workoutFriday: '背部',
				workoutSaturday: '上半身（長時間）',
				workoutSunday: '彈跳同入樽練習',
				exerciseMonday: '器械肩推、器械胸推、胸托式划船機、坐姿啞鈴側平舉、反向蝴蝶機。',
				exerciseTuesday: '前蹲、保加利亞分腿蹲、背部伸展、單腳腿推、坐姿單腳腿彎舉、提踵。',
				exerciseWednesday: '休息一日。',
				exerciseThursday: '器械胸推同肩推、Gironda 式同坐姿啞鈴側平舉、單手上斜器械推舉、蝴蝶機夾胸、反向蝴蝶機。',
				exerciseFriday: '胸托式划船機、斜向下拉／高位划船、反向蝴蝶機。',
				exerciseSaturday: '器械肩推同胸推、Gironda 式側平舉、單手上斜器械推舉、蝴蝶機夾胸、反向蝴蝶機、器械捲腹。',
				exerciseSunday: '循序漸進嘅單腳起跳訓練。',
				trainingDescription: '詳細訓練內容遲啲再補。',
				hongKongNote: '我嚟自香港沙田，2019 年之後就冇返過香港。我好鍾意食芝士鮮魷，大排檔同茶餐廳都係我嘅至愛。',
				hongKongEmail: '有咩大排檔好介紹？歡迎 email 話我知！',
				notesTitle: '留學生小貼士',
				notesIntro: '如果可以再揀一次，為咗去美國讀書同發展事業，我會點樣準備？呢度係我嘅個人建議，大家嘅目標同預算可能唔同，揀適合自己嘅方向就好。',
				adviceOneTitle: '諗清楚出路，再揀主修',
				adviceOneBody: '如果你想喺美國工作，我會考慮揀一個符合 STEM 資格，又配合自己興趣同目標工作嘅課程。報讀之前，同學校確認清楚嗰個課程係咪符合 STEM OPT 資格，亦要及早了解 OPT 同僱主幫你申請 H-1B 嘅可能性。有學位或者 STEM OPT，唔代表一定搵到工或者可以長期留低。如果想讀純數學呢類比較理論性嘅科目，最好先諗清楚之後係想做研究，定係點樣將所學用喺實際工作上。',
				adviceTwoTitle: '諗清楚自己點解想去',
				adviceTwoBody: '去一年做文化交流，本身都可以係好值得嘅經歷。如果主要係想學英文，我會喺畀錢讀美國嘅課程之前，比較埋英國同澳洲嘅選擇。唔好假設某個國家一定平啲，要一齊比較學費、住宿同課程長度。如果目標係喺海外發展事業，入學之前就要做好功課，了解課程、就業市場，同埋合法工作需要符合嘅條件。',
				adviceThreeTitle: '未出發就開始準備',
				adviceThreeBody: '如果係我，我會喺入大學之前先學實用嘅編程技巧。即使打算讀物理、化學或者數學，都可以考慮喺自己住嘅地方讀一個負擔得起嘅短期 coding bootcamp。記得比較價錢同質素；修業證書唔係學位，亦唔保證搵到工。早啲開 LinkedIn、做自己嘅項目、識多啲人，同埋了解實習幾時開始請人，唔好等到畢業先開始。',
				notesPending: '更多留學小貼士，遲啲再寫。',
				notesSourcesLabel: '睇吓最新要求',
				optSourceLabel: 'STEM OPT',
				h1bSourceLabel: 'H-1B',
				thanks: '多謝你嚟睇！',
				return: '返去我嘅主網站',
				top: '返去頁頂',
				artNote: '作品版權屬於各自的權利人。本網站為非官方粉絲網頁，未經 CD PROJEKT RED 認可或支持。',
				artReuseNote: '未經同意，請勿重用呢個網站專屬嘅像素插畫。',
				artTermsLabel: '插畫使用條款',
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
				url.hash = name === 'portfolio' ? activeSectionId : 'hobby-top';
				copyWindowText(windowElement, url.href);
			} else if (action === 'top') {
				if (name === 'portfolio') {
					navigateToSection('intro', true);
					focusAnchorTarget(document.getElementById('intro'));
				} else if (name === 'hobbies') {
					navigateToHobby(document.getElementById('hobby-top'), true, true);
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
		if (id === 'research-notebook') {
			id = 'projects';
			window.history.replaceState(event.state, '', '#projects');
		}
		var target = document.getElementById(id);
		if (!isHobbyTarget(target) && sections.indexOf(target) === -1) {
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
	// Preserve links to the research window now that its content lives with the project.
	if (initialId === 'research-notebook') { initialId = 'projects'; }
	var initialTarget = document.getElementById(initialId);
	if (!isHobbyTarget(initialTarget) && sections.indexOf(initialTarget) === -1) {
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
