const assert=require("assert");
const C=require("./coach-shared.js");

const a=C.aggregateCats({
  "設備の日常保全":{c:6,t:10},
  "改善・解析":{c:9,t:10}
},"academic");
const p=C.aggregateCats({
  "自主保全":{c:2,t:5},
  "設備保全":{c:8,t:10}
},"practical");
const merged=C.mergeThemes(a,p);
assert.strictEqual(merged["自主保全・日常保全"].c,8);
assert.strictEqual(merged["自主保全・日常保全"].t,15);
assert.strictEqual(C.weakestTheme(merged,5).theme,"自主保全・日常保全");

const history=[
  {year:2022,rate:62},{year:2022,rate:75},{year:2021,rate:80}
];
const ys=C.summarizeYearHistory(history);
assert.strictEqual(ys[2022].latest,75);
assert.strictEqual(ys[2022].best,75);
assert.strictEqual(ys[2022].attempts,2);
assert.strictEqual(C.bestPastScore(history),80);
assert.strictEqual(C.latestPastImprovement(history),13);

const msg=C.coachMessage({themes:merged,academicTotal:100,practicalTotal:20,bestPast:80,improvement:13});
assert.ok(msg.title.includes("13点アップ"));
const badges=C.badges({academicTotal:500,streak:7,bestPast:82,practicalRate:85,yearHistory:[{year:2019},{year:2020},{year:2021},{year:2022},{year:2023},{year:2024},{year:2025}],improvement:12});
assert.ok(badges.length>=6);

console.log("COACH_SHARED_TESTS_OK: 12 assertions");
