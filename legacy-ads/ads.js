(function initializeColorMergeAds() {
    'use strict';

    const defaults = {
        adsensePublisherId: '',
        adChannelId: '',
        testMode: false,
        frequencyHint: '120s',
        houseAdSeconds: 10,
        sponsorEmail: 'hello@omiah.cc'
    };
    const config = Object.assign({}, defaults, window.COLOR_MERGE_AD_CONFIG || {});
    const hasGooglePublisher = /^ca-pub-\d{16}$/.test(config.adsensePublisherId);
    let googleReady = false;
    let requestInProgress = false;

    function emitAdEvent(status, details = {}) {
        window.dispatchEvent(new CustomEvent('colormerge:ad', {
            detail: Object.assign({ status }, details)
        }));
    }

    function loadGoogleH5Ads() {
        if (!hasGooglePublisher) {
            emitAdEvent('house-ad-mode', { reason: 'publisher-not-configured' });
            return;
        }

        window.adsbygoogle = window.adsbygoogle || [];
        window.adBreak = window.adConfig = function queueAdCommand(options) {
            window.adsbygoogle.push(options);
        };

        const script = document.createElement('script');
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(config.adsensePublisherId)}`;
        script.dataset.adClient = config.adsensePublisherId;
        script.dataset.adFrequencyHint = config.frequencyHint;

        if (config.adChannelId) {
            script.dataset.adChannel = config.adChannelId;
        }
        if (config.testMode) {
            script.dataset.adbreakTest = 'on';
        }

        script.addEventListener('error', () => {
            googleReady = false;
            emitAdEvent('provider-error', { provider: 'google-h5' });
        });
        document.head.appendChild(script);

        window.adConfig({
            preloadAdBreaks: 'on',
            sound: 'off',
            onReady: () => {
                googleReady = true;
                emitAdEvent('provider-ready', { provider: 'google-h5' });
            }
        });
    }

    function createModal({ label, title, body }) {
        const previousFocus = document.activeElement;
        const overlay = document.createElement('div');
        overlay.id = 'reward-ad-modal';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'reward-ad-title');

        const card = document.createElement('div');
        card.className = 'reward-ad-card';

        const eyebrow = document.createElement('div');
        eyebrow.className = 'reward-ad-label';
        eyebrow.textContent = label;

        const heading = document.createElement('h2');
        heading.id = 'reward-ad-title';
        heading.textContent = title;

        const copy = document.createElement('p');
        copy.className = 'reward-ad-copy';
        copy.textContent = body;

        const closeButton = document.createElement('button');
        closeButton.className = 'reward-ad-close';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', 'Close advertisement');
        closeButton.textContent = '×';

        card.append(eyebrow, heading, copy, closeButton);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        document.body.classList.add('reward-flow-active');

        let onClose = () => {};
        const handleKeydown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        const cleanup = () => {
            document.removeEventListener('keydown', handleKeydown);
            document.body.classList.remove('reward-flow-active');
            overlay.remove();
            if (previousFocus && typeof previousFocus.focus === 'function') {
                previousFocus.focus();
            }
        };

        document.addEventListener('keydown', handleKeydown);
        closeButton.focus();

        return {
            card,
            closeButton,
            cleanup,
            setOnClose(handler) {
                onClose = handler;
                closeButton.onclick = handler;
            }
        };
    }

    function showGoogleRewardPrompt(showAd, callbacks) {
        const modal = createModal({
            label: 'REWARDED AD',
            title: 'Trade a short ad for one more heart?',
            body: 'The heart is awarded only after the ad finishes. You never need to click the ad itself.'
        });
        const actions = document.createElement('div');
        actions.className = 'reward-ad-actions';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'reward-ad-button reward-ad-button-secondary';
        cancelButton.type = 'button';
        cancelButton.textContent = 'Not now';

        const watchButton = document.createElement('button');
        watchButton.className = 'reward-ad-button reward-ad-button-primary';
        watchButton.type = 'button';
        watchButton.textContent = 'Watch ad · +1 heart';

        actions.append(cancelButton, watchButton);
        modal.card.appendChild(actions);

        const dismiss = () => {
            modal.cleanup();
            callbacks.onDismissed({ provider: 'google-h5', reason: 'prompt-dismissed' });
        };
        modal.setOnClose(dismiss);
        cancelButton.onclick = dismiss;
        watchButton.onclick = () => {
            modal.cleanup();
            emitAdEvent('ad-started', { provider: 'google-h5' });
            showAd();
        };
    }

    function showHouseSponsor(callbacks, reason = 'publisher-not-configured') {
        const duration = Math.max(3, Number(config.houseAdSeconds) || 10);
        let secondsRemaining = duration;
        let earned = false;

        const modal = createModal({
            label: 'ADVERTISEMENT · SPONSORSHIP OPEN',
            title: 'Your brand could live here.',
            body: 'ColorMerge is opening this rewarded break to a launch sponsor.'
        });

        const sponsorPanel = document.createElement('div');
        sponsorPanel.className = 'house-ad-panel';
        sponsorPanel.innerHTML = '<span>COLOR</span><strong>MERGE</strong><span>× YOUR BRAND</span>';

        const sponsorLink = document.createElement('a');
        sponsorLink.className = 'house-ad-link';
        sponsorLink.textContent = 'Sponsor this space';
        const subject = encodeURIComponent('ColorMerge sponsorship');
        sponsorLink.href = `mailto:${config.sponsorEmail}?subject=${subject}`;
        sponsorLink.addEventListener('click', () => {
            emitAdEvent('sponsor-link-opened', { provider: 'direct-sponsor' });
        });

        const timerText = document.createElement('p');
        timerText.className = 'reward-ad-timer';
        timerText.setAttribute('aria-live', 'polite');
        timerText.textContent = `Continue in ${secondsRemaining}`;

        const progressTrack = document.createElement('div');
        progressTrack.className = 'reward-ad-progress';
        const progressBar = document.createElement('div');
        progressBar.className = 'reward-ad-progress-bar';
        progressTrack.appendChild(progressBar);

        const continueButton = document.createElement('button');
        continueButton.className = 'reward-ad-button reward-ad-button-primary reward-ad-continue';
        continueButton.type = 'button';
        continueButton.disabled = true;
        continueButton.textContent = `Continue in ${secondsRemaining}`;

        modal.card.append(sponsorPanel, sponsorLink, timerText, progressTrack, continueButton);
        requestAnimationFrame(() => {
            progressBar.style.transitionDuration = `${duration}s`;
            progressBar.style.width = '100%';
        });

        const interval = window.setInterval(() => {
            secondsRemaining -= 1;
            if (secondsRemaining > 0) {
                timerText.textContent = `Continue in ${secondsRemaining}`;
                continueButton.textContent = `Continue in ${secondsRemaining}`;
                return;
            }

            window.clearInterval(interval);
            earned = true;
            timerText.textContent = 'Heart earned';
            continueButton.disabled = false;
            continueButton.textContent = 'Continue · +1 heart';
            continueButton.focus();
        }, 1000);

        const dismiss = () => {
            window.clearInterval(interval);
            modal.cleanup();
            callbacks.onDismissed({ provider: 'direct-sponsor', reason: earned ? 'closed-after-view' : 'closed-early' });
        };
        modal.setOnClose(dismiss);
        continueButton.onclick = () => {
            if (!earned) return;
            window.clearInterval(interval);
            modal.cleanup();
            emitAdEvent('ad-viewed', { provider: 'direct-sponsor', fallbackReason: reason });
            callbacks.onViewed({ provider: 'direct-sponsor', fallbackReason: reason });
        };
        emitAdEvent('ad-started', { provider: 'direct-sponsor', fallbackReason: reason });
    }

    function requestRewardedAd(callbacks = {}) {
        if (requestInProgress) return false;
        requestInProgress = true;

        const userCallbacks = {
            onViewed: typeof callbacks.onViewed === 'function' ? callbacks.onViewed : () => {},
            onDismissed: typeof callbacks.onDismissed === 'function' ? callbacks.onDismissed : () => {}
        };
        let googleFlowAbandoned = false;
        let googlePromptShown = false;
        let googleAdStarted = false;
        let settled = false;

        const finishViewed = (details) => {
            if (settled) return;
            settled = true;
            requestInProgress = false;
            emitAdEvent('reward-granted', details);
            userCallbacks.onViewed(details);
        };
        const finishDismissed = (details) => {
            if (settled) return;
            settled = true;
            requestInProgress = false;
            emitAdEvent('reward-not-granted', details);
            userCallbacks.onDismissed(details);
        };
        const startHouseFallback = (reason) => {
            if (settled || googleFlowAbandoned) return;
            googleFlowAbandoned = true;
            showHouseSponsor({ onViewed: finishViewed, onDismissed: finishDismissed }, reason);
        };

        if (!hasGooglePublisher || typeof window.adBreak !== 'function') {
            startHouseFallback('publisher-not-configured');
            return true;
        }

        const providerTimeout = window.setTimeout(() => {
            startHouseFallback(googleReady ? 'provider-timeout' : 'provider-not-ready');
        }, 5000);

        window.adBreak({
            type: 'reward',
            name: 'extra_heart',
            beforeReward: (showAd) => {
                if (googleFlowAbandoned || settled) return;
                googlePromptShown = true;
                window.clearTimeout(providerTimeout);
                showGoogleRewardPrompt(() => {
                    googleAdStarted = true;
                    showAd();
                }, {
                    onDismissed: finishDismissed
                });
            },
            beforeAd: () => {
                document.body.classList.add('google-ad-playing');
            },
            afterAd: () => {
                document.body.classList.remove('google-ad-playing');
            },
            adDismissed: () => {
                if (!googleFlowAbandoned) {
                    finishDismissed({ provider: 'google-h5', reason: 'ad-dismissed' });
                }
            },
            adViewed: () => {
                if (!googleFlowAbandoned) {
                    finishViewed({ provider: 'google-h5' });
                }
            },
            adBreakDone: (placementInfo = {}) => {
                window.clearTimeout(providerTimeout);
                document.body.classList.remove('google-ad-playing');
                if (settled || googleFlowAbandoned) return;

                if (!googlePromptShown || (googleAdStarted && !['viewed', 'dismissed'].includes(placementInfo.breakStatus))) {
                    startHouseFallback(placementInfo.breakStatus || 'no-ad');
                }
            }
        });

        return true;
    }

    window.ColorMergeAds = Object.freeze({
        requestRewardedAd,
        isGoogleConfigured: () => hasGooglePublisher,
        isGoogleReady: () => googleReady
    });

    loadGoogleH5Ads();
})();
