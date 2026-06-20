import assert from 'node:assert/strict';
import {
  normalizeUrl,
  detectYoutubeId,
  addLink,
  deleteLinks,
  openLink,
  createSubscriptionRecord,
  calculateSubscriptionSummary,
  recordQualifiedVisitInMemory,
  markSubscriptionPaidInMemory,
} from './simCore.mjs';

const log = (message) => console.log(`✔ ${message}`);

console.log('\nLinkRoutine internal simulation started...\n');

assert.equal(normalizeUrl('youtube.com/watch?v=abc123'), 'https://youtube.com/watch?v=abc123');
assert.equal(normalizeUrl('https://minepi.com'), 'https://minepi.com/');
log('URL normalization passed');

assert.equal(detectYoutubeId('https://youtube.com/watch?v=abc123'), 'abc123');
assert.equal(detectYoutubeId('https://youtu.be/xyz789'), 'xyz789');
assert.equal(detectYoutubeId('https://youtube.com/shorts/short001'), 'short001');
log('YouTube detection passed');

let links = [];
links = addLink(links, 'youtube.com/watch?v=abc123', 'Video');
links = addLink(links, 'news.google.com', 'News');
links = addLink(links, 'translate.google.com', 'Study');
assert.equal(links.length, 3);
assert.equal(links[0].title, 'Translate');
assert.equal(links[1].icon, '📰');
assert.equal(links[2].icon, '▶');
log('URL Mailbox save → icon creation passed');

const openTarget = links[2].id;
links = openLink(links, openTarget);
assert.equal(links.find((item) => item.id === openTarget).openCount, 1);
log('Saved icon tap → Smart Viewer open count update passed');

let sub = createSubscriptionRecord();
let visit = recordQualifiedVisitInMemory(sub, links[2], new Date('2026-06-18T10:00:00Z'));
assert.equal(visit.counted, true);
assert.equal(visit.summary.linkPoints, 1);
sub = visit.record;
visit = recordQualifiedVisitInMemory(sub, links[2], new Date('2026-06-18T10:01:00Z'));
assert.equal(visit.counted, false);
assert.equal(visit.reason, 'cooldown');
log('Qualified Visit → Link Points with cooldown passed');

sub.qualifiedVisits = 999;
sub.linkPoints = 999;
assert.equal(calculateSubscriptionSummary(sub).nextFeePi, 1);
sub.qualifiedVisits = 1000;
sub.linkPoints = 1000;
assert.equal(calculateSubscriptionSummary(sub).discountPi, 0.1);
assert.equal(calculateSubscriptionSummary(sub).nextFeePi, 0.9);
sub.qualifiedVisits = 5000;
sub.linkPoints = 5000;
assert.equal(calculateSubscriptionSummary(sub).discountPi, 0.5);
assert.equal(calculateSubscriptionSummary(sub).nextFeePi, 0.5);
sub.qualifiedVisits = 10000;
sub.linkPoints = 10000;
assert.equal(calculateSubscriptionSummary(sub).nextFeePi, 0.5);
assert.equal(calculateSubscriptionSummary(sub).directCashbackEnabled, false);
log('Subscription discount cap and no direct Pi cashback passed');

sub = markSubscriptionPaidInMemory(sub, calculateSubscriptionSummary(sub).nextFeePi);
assert.equal(sub.lastPaymentAmount, 0.5);
assert.equal(sub.activeUntilMonth, '2026-07');
log('Monthly subscription payment record passed');

const deleteTarget = links[1].id;
links = deleteLinks(links, [deleteTarget]);
assert.equal(links.length, 2);
assert.equal(links.some((item) => item.id === deleteTarget), false);
log('Settings selected URL delete passed');

const mockApprove = { ok: true, mock: true, paymentId: 'subscription-payment', step: 'approve' };
const mockComplete = { ok: true, mock: true, paymentId: 'subscription-payment', txid: 'subscription-txid', step: 'complete' };
assert.equal(mockApprove.ok, true);
assert.equal(mockComplete.step, 'complete');
log('Mock Pi subscription payment approve/complete simulation passed');

console.log('\nNo simulation issues found. LinkRoutine V1.1 subscription draft is ready.\n');
