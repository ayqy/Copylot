import assert from 'node:assert/strict';

import {
  buildChromeWebStoreDetailUrl,
  buildChromeWebStoreReviewsUrl,
  buildFeedbackIssueUrl,
  buildFeedbackSettingsSnapshot,
  buildShareCopyText,
  type I18nGetMessage
} from '../src/shared/word-of-mouth.ts';

const getMessage: I18nGetMessage = (key, substitutions) => {
  const subs = Array.isArray(substitutions) ? substitutions : substitutions ? [substitutions] : [];

  if (key === 'feedbackIssueTitleTemplate') return 'title';
  if (key === 'feedbackIssueBodyTemplate') {
    return `v=${subs[0]} id=${subs[1]} ua=${subs[2]} nav=${subs[3]} ui=${subs[4]} settings=${subs[5]}`;
  }
  if (key === 'shareCopyTextTemplate') {
    return `share ${subs[0]}`;
  }
  return key;
};

function run() {
  const extensionId = 'abcdefghijklmnopabcdefghijklmnop';

  const storeUrl = buildChromeWebStoreDetailUrl(extensionId);
  const storeParsed = new URL(storeUrl);
  assert.equal(storeParsed.hostname, 'chrome.google.com');
  assert.ok(storeParsed.pathname.endsWith(`/webstore/detail/${extensionId}`));
  assert.equal(storeParsed.searchParams.get('utm_source'), 'copylot-ext');
  assert.equal(storeParsed.searchParams.get('utm_medium'), 'popup-entry');
  assert.equal(storeParsed.searchParams.get('utm_campaign'), 'v1-1');

  const reviewsUrl = buildChromeWebStoreReviewsUrl(extensionId);
  assert.equal(reviewsUrl, `https://chrome.google.com/webstore/detail/${extensionId}/reviews`);

  const settings: Parameters<typeof buildFeedbackSettingsSnapshot>[0] = {
    isMagicCopyEnabled: false,
    isHoverMagicCopyEnabled: true,
    outputFormat: 'plaintext',
    tableOutputFormat: 'csv',
    attachTitle: true,
    attachURL: true,
    language: 'en',
    interactionMode: 'dblclick',
    userPrompts: [],
    isClipboardAccumulatorEnabled: true,
    chatServices: [],
    defaultAutoOpenChat: false,
    editorExclusionClassNames: [],
    editorExclusionAttributeSelectors: []
  };
  const snapshot = buildFeedbackSettingsSnapshot(settings);
  assert.deepEqual(Object.keys(snapshot).sort(), [
    'attachTitle',
    'attachURL',
    'interactionMode',
    'isClipboardAccumulatorEnabled',
    'isHoverMagicCopyEnabled',
    'isMagicCopyEnabled',
    'outputFormat',
    'tableOutputFormat'
  ]);
  assert.equal(snapshot.isMagicCopyEnabled, false);
  assert.equal(snapshot.isHoverMagicCopyEnabled, true);
  assert.equal(snapshot.isClipboardAccumulatorEnabled, true);
  assert.equal(snapshot.interactionMode, 'dblclick');
  assert.equal(snapshot.outputFormat, 'plaintext');
  assert.equal(snapshot.tableOutputFormat, 'csv');
  assert.equal(snapshot.attachTitle, true);
  assert.equal(snapshot.attachURL, true);

  const issueUrl = buildFeedbackIssueUrl({
    env: {
      extensionVersion: '1.1.0',
      extensionId,
      userAgent: 'UA',
      navigatorLanguage: 'en-US',
      uiLanguage: 'en'
    },
    settingsSnapshot: snapshot,
    getMessage
  });
  const issueParsed = new URL(issueUrl);
  assert.equal(issueParsed.hostname, 'github.com');
  assert.ok(issueParsed.pathname.endsWith('/issues/new'));

  const title = issueParsed.searchParams.get('title');
  const body = issueParsed.searchParams.get('body');
  assert.equal(title, 'title');
  assert.ok(body);
  assert.ok(body?.includes('1.1.0'));
  assert.ok(body?.includes(extensionId));
  assert.ok(body?.includes('UA'));
  assert.ok(body?.includes('"isMagicCopyEnabled"'));
  assert.ok(!body?.includes('userPrompts'));

  const shareText = buildShareCopyText(getMessage, storeUrl);
  assert.ok(shareText.includes(storeUrl));
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
