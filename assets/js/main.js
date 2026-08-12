(function () {
	'use strict';

	var body = document.body;
	var root = document.documentElement;
	var navLinks = Array.prototype.slice.call(document.querySelectorAll('#site-nav a[href^="#"]'));
	var sections = navLinks
		.map(function (link) {
			return document.querySelector(link.getAttribute('href'));
		})
		.filter(Boolean);
	var languageButtons = Array.prototype.slice.call(document.querySelectorAll('[data-language]'));
	var languageStorageKey = 'caleb-profile-language';

	var translations = {
		en: {
			meta: {
				title: 'Caleb(Kwan Ho) Leung Bio Page',
				description: 'The professional profile of Caleb Leung, a software engineer focused on distributed systems, data pipelines, and cloud computing.'
			},
			accessibility: {
				skip: 'Skip to main content',
				logo: 'Back to introduction'
			},
			header: {
				role: 'Software Engineer · AI Systems · Data Pipelines'
			},
			navigation: {
				primary: 'Primary navigation',
				intro: 'Intro',
				resume: 'Resume',
				skills: 'Skills',
				beyond: 'Beyond Tech',
				contact: 'Contact'
			},
			intro: {
				eyebrow: 'Introduction',
				title: 'Software engineer working across AI and data systems.',
				body1: 'I am a software engineer interested in AI and working across the agent and data layers of production systems. My work focuses on backend engineering, distributed processing, and reliable data pipelines.',
				body2: 'At IntellPro, I own three stages—text extraction, chunking, and distributed embedding—within a production document-processing pipeline that handles approximately 3,000 documents per day across more than 10 integrations. I developed its custom chunking algorithm and built the embedding stage’s rate limiting, retries, worker orchestration, concurrency control, dead-letter queue handling, and state-machine-based job coordination. I have also applied agent workflows specifically to metadata extraction.',
				body3: 'As a first-generation college graduate, I earned a B.S. in Mathematics with a concentration in Financial Mathematics and a minor in Economics from Baruch College. I am currently pursuing an M.S. in Computer Science from Georgia Tech.'
			},
			resume: {
				eyebrow: 'Professional snapshot',
				title: 'Resume',
				linkLabel: 'Open Caleb Leung’s resume PDF in a new browser tab',
				imageAlt: 'Preview of Caleb Leung’s resume. Click to open the full PDF in a new browser tab.'
			},
			skills: {
				eyebrow: 'Technical toolkit',
				title: 'Skills',
				description: 'A practical mix of languages, frameworks, infrastructure, and systems knowledge used to build and support software.',
				programming: 'Programming languages',
				frameworks: 'Frameworks & libraries',
				infrastructure: 'Infrastructure & tools',
				concepts: 'Concepts',
				spokenLanguages: 'Spoken Languages'
			},
			learning: {
				title: 'Currently learning',
				aws: 'AWS — going deeper',
				etl: 'ETL / Data Pipelines — going deeper',
				systemDesign: 'System Design / Distributed Systems — lifelong learning',
				erlang: 'Erlang fundamentals — building deeper OTP knowledge through the Elixir ecosystem',
				phoenix: 'Phoenix Framework — building production-ready SFTP, backend',
				deepLearning: 'Deep Learning — CS 7643 (',
				deepLearningClose: ')',
				japanese: 'Japanese — working toward N4'
			},
			links: {
				coursePage: 'course page'
			},
			language: {
				title: 'Language',
				optionsLabel: 'Page language'
			},
			beyond: {
				eyebrow: 'Additional perspective',
				title: 'Beyond Tech',
				body: 'Beyond my technical expertise, I bring a wealth of valuable soft skills acquired from my professional experience spanning over 4 years in luxury/retail and 1 year in dining. I have consistently been a top seller in each retail position, working with renowned brands such as Giorgio Armani, AllSaints, and The North Face UE (Hong Kong location). During my tenure, I had the opportunity to work on crossover collections with Mastermind Japan, Sacai, and THE NORTH FACE Japan (Goldwin) collections. Through these experiences, I have honed my customer service, sales, team collaboration, adaptability, problem-solving, and effective communication skills.'
			},
			contact: {
				eyebrow: 'Let’s connect',
				title: 'Contact',
				body: 'I’m always interested in discussing software engineering, AI systems, and distributed systems. Feel free to connect with me on LinkedIn or GitHub.',
				socialLinks: 'Social links'
			}
		},
		ja: {
			meta: {
				title: 'Caleb(Kwan Ho) Leung プロフィール',
				description: '分散システム、データパイプライン、クラウドコンピューティングに取り組むソフトウェアエンジニア、Caleb Leungのプロフィールです。'
			},
			accessibility: {
				skip: 'メインコンテンツへ移動',
				logo: '自己紹介に戻る'
			},
			header: {
				role: 'ソフトウェアエンジニア · AIシステム · データパイプライン'
			},
			navigation: {
				primary: 'メインナビゲーション',
				intro: '自己紹介',
				resume: '履歴書',
				skills: 'スキル',
				beyond: 'テクノロジー以外',
				contact: '連絡先'
			},
			intro: {
				eyebrow: '自己紹介',
				title: 'AIとデータシステムを横断して働くソフトウェアエンジニア。',
				body1: 'AIに関心を持ち、プロダクションシステムのエージェント層とデータ層にまたがって取り組むソフトウェアエンジニアです。専門はバックエンド開発、分散処理、信頼性の高いデータパイプラインです。',
				body2: 'IntellProでは、1日約3,000件の文書を10以上の連携先で処理する本番文書処理パイプラインのうち、テキスト抽出、チャンク分割、分散埋め込みの3段階を担当しています。独自のチャンク分割アルゴリズムを開発し、埋め込み段階のレート制限、リトライ、ワーカーのオーケストレーション、並行性制御、デッドレターキュー処理、ステートマシンによるジョブ調整を構築しました。また、メタデータ抽出にはエージェントワークフローも適用しています。',
				body3: '第一世代の大学卒業生として、Baruch Collegeで金融数学を専攻し、経済学を副専攻として数学の学士号（B.S.）を取得しました。現在はGeorgia Techでコンピュータサイエンスの修士号（M.S.）取得を目指しています。'
			},
			resume: {
				eyebrow: 'キャリア概要',
				title: '履歴書',
				linkLabel: 'Caleb Leungの履歴書PDFを新しいブラウザタブで開く',
				imageAlt: 'Caleb Leungの履歴書プレビュー。クリックすると完全なPDFを新しいブラウザタブで開きます。'
			},
			skills: {
				eyebrow: '技術スタック',
				title: 'スキル',
				description: 'ソフトウェアの構築と運用に使用している言語、フレームワーク、インフラ、システムの知識を、実務的に組み合わせています。',
				programming: 'プログラミング言語',
				frameworks: 'フレームワークとライブラリ',
				infrastructure: 'インフラとツール',
				concepts: '概念',
				spokenLanguages: '話せる言語'
			},
			learning: {
				title: '現在学習中',
				aws: 'AWS — さらに深く学習中',
				etl: 'ETL / Data Pipelines — さらに深く学習中',
				systemDesign: 'System Design / Distributed Systems — 継続的に学習中',
				erlang: 'Erlang fundamentals — Elixirエコシステムを通じてOTPの知識を深めています',
				phoenix: 'Phoenix Framework — 本番対応のSFTPバックエンドを構築中',
				deepLearning: 'Deep Learning — CS 7643 (',
				deepLearningClose: ')',
				japanese: '日本語 — N4を目指して学習中'
			},
			links: {
				coursePage: '科目ページ'
			},
			language: {
				title: '言語',
				optionsLabel: 'ページの言語'
			},
			beyond: {
				eyebrow: 'もう一つの視点',
				title: 'テクノロジー以外',
				body: '技術面での専門知識に加え、ラグジュアリー／小売業界で4年以上、飲食業界で1年間にわたる職務経験を通じて培った多くのソフトスキルも持ち合わせています。各小売職で常にトップセラーとして成果を上げ、Giorgio Armani、AllSaints、The North Face UE（香港）などの著名ブランドで働きました。在職中には、Mastermind Japan、Sacai、THE NORTH FACE Japan（Goldwin）とのコラボレーションコレクションにも携わりました。これらの経験を通して、カスタマーサービス、販売、チームワーク、適応力、問題解決力、効果的なコミュニケーション能力を磨きました。'
			},
			contact: {
				eyebrow: 'つながりましょう',
				title: '連絡先',
				body: 'ソフトウェアエンジニアリング、AIシステム、分散システムについてお話しできることを楽しみにしています。LinkedInまたはGitHubでお気軽にご連絡ください。',
				socialLinks: 'ソーシャルリンク'
			}
		},
		'zh-HK': {
			meta: {
				title: 'Caleb(Kwan Ho) Leung 個人簡介',
				description: '專注於分散式系統、數據管道及雲端運算的軟件工程師 Caleb Leung 的專業簡介。'
			},
			accessibility: {
				skip: '跳至主要內容',
				logo: '返回簡介'
			},
			header: {
				role: '軟件工程師 · AI 系統 · 數據管道'
			},
			navigation: {
				primary: '主要導覽',
				intro: '簡介',
				resume: '履歷',
				skills: '技能',
				beyond: '技術之外',
				contact: '聯絡'
			},
			intro: {
				eyebrow: '簡介',
				title: '跨越 AI 與數據系統領域的軟件工程師。',
				body1: '我是一名專注於 AI、並在生產系統的代理層與數據層之間工作的軟件工程師。我的工作聚焦於後端工程、分散式處理，以及可靠的數據管道。',
				body2: '在 IntellPro，我負責生產級文件處理管道中的三個階段——文字擷取、分塊及分散式嵌入。該管道每天處理約 3,000 份文件，涵蓋超過 10 個整合項目。我開發了自訂分塊演算法，並為嵌入階段建立速率限制、重試、工作程式協調、並行控制、死信佇列處理，以及以狀態機協調工作的機制。我亦曾將代理工作流程應用於元數據擷取。',
				body3: '作為家中第一代大學畢業生，我於 Baruch College 修畢數學理學士學位，主修金融數學、副修經濟學。目前正在 Georgia Tech 攻讀電腦科學理學碩士。'
			},
			resume: {
				eyebrow: '專業概覽',
				title: '履歷',
				linkLabel: '在新瀏覽器分頁開啟 Caleb Leung 的履歷 PDF',
				imageAlt: 'Caleb Leung 的履歷預覽。點擊即可在新瀏覽器分頁開啟完整 PDF。'
			},
			skills: {
				eyebrow: '技術工具',
				title: '技能',
				description: '以實用方式結合用於構建及支援軟件的語言、框架、基礎設施及系統知識。',
				programming: '程式語言',
				frameworks: '框架及程式庫',
				infrastructure: '基礎設施及工具',
				concepts: '概念',
				spokenLanguages: '語言能力'
			},
			learning: {
				title: '目前學習',
				aws: 'AWS — 深入學習中',
				etl: 'ETL / Data Pipelines — 深入學習中',
				systemDesign: 'System Design / Distributed Systems — 持續學習',
				erlang: 'Erlang fundamentals — 透過 Elixir 生態系深入了解 OTP',
				phoenix: 'Phoenix Framework — 建構可用於生產環境的 SFTP 後端',
				deepLearning: 'Deep Learning — CS 7643（',
				deepLearningClose: '）',
				japanese: '日語 — 以 N4 為目標'
			},
			links: {
				coursePage: '課程頁面'
			},
			language: {
				title: '語言',
				optionsLabel: '頁面語言'
			},
			beyond: {
				eyebrow: '其他面向',
				title: '技術之外',
				body: '除了技術專長外，我亦透過超過 4 年的奢侈品／零售業及 1 年的餐飲業工作經驗，培養了多項重要的軟技能。我在每一份零售工作中都持續成為頂尖銷售員，曾於 Giorgio Armani、AllSaints 及 The North Face UE（香港店）等知名品牌工作。在職期間，我有機會參與 Mastermind Japan、Sacai 及 THE NORTH FACE Japan（Goldwin）的聯乘系列。這些經歷讓我磨練了客戶服務、銷售、團隊協作、適應力、解難及有效溝通等能力。'
			},
			contact: {
				eyebrow: '歡迎聯絡',
				title: '聯絡',
				body: '我樂於交流軟件工程、AI 系統及分散式系統。歡迎透過 LinkedIn 或 GitHub 與我聯絡。',
				socialLinks: '社交連結'
			}
		}
	};

	function getTranslation(language, key) {
		return key.split('.').reduce(function (value, part) {
			return value && value[part];
		}, translations[language]);
	}

	function isSupportedLanguage(language) {
		return Object.prototype.hasOwnProperty.call(translations, language);
	}

	function safelyStoreLanguage(language) {
		try {
			window.localStorage.setItem(languageStorageKey, language);
		} catch (error) {
			// Storage can be unavailable in private browsing; the selector still works for this visit.
		}
	}

	function getStoredLanguage() {
		try {
			var storedLanguage = window.localStorage.getItem(languageStorageKey);
			return isSupportedLanguage(storedLanguage) ? storedLanguage : 'en';
		} catch (error) {
			return 'en';
		}
	}

	function setLanguage(language, shouldStore) {
		if (!isSupportedLanguage(language)) {
			return;
		}

		document.querySelectorAll('[data-i18n]').forEach(function (element) {
			var translation = getTranslation(language, element.getAttribute('data-i18n'));
			if (typeof translation === 'string') {
				element.textContent = translation;
			}
		});

		document.querySelectorAll('[data-i18n-content]').forEach(function (element) {
			var translation = getTranslation(language, element.getAttribute('data-i18n-content'));
			if (typeof translation === 'string') {
				element.setAttribute('content', translation);
			}
		});

		document.querySelectorAll('[data-i18n-aria-label]').forEach(function (element) {
			var translation = getTranslation(language, element.getAttribute('data-i18n-aria-label'));
			if (typeof translation === 'string') {
				element.setAttribute('aria-label', translation);
			}
		});

		document.querySelectorAll('[data-i18n-alt]').forEach(function (element) {
			var translation = getTranslation(language, element.getAttribute('data-i18n-alt'));
			if (typeof translation === 'string') {
				element.setAttribute('alt', translation);
			}
		});

		root.lang = language === 'zh-HK' ? 'zh-Hant-HK' : language;
		root.setAttribute('data-language', language);
		document.title = getTranslation(language, 'meta.title');

		languageButtons.forEach(function (button) {
			var isActive = button.getAttribute('data-language') === language;
			button.classList.toggle('is-active', isActive);
			button.setAttribute('aria-pressed', String(isActive));
		});

		if (shouldStore) {
			safelyStoreLanguage(language);
		}
	}

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

	languageButtons.forEach(function (button) {
		button.addEventListener('click', function () {
			setLanguage(button.getAttribute('data-language'), true);
		});
	});

	setLanguage(getStoredLanguage(), false);

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
