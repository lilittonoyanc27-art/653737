import test from 'node:test';
import assert from 'node:assert/strict';
import { getNumberInfo, generateNumberDistractors, generateMathProblem } from './spanishData.ts';
import { getSpanishTime } from './clockUtils.ts';

test('Spanish numbers accurate mapping 1 to 100', () => {
  assert.equal(getNumberInfo(1).spanish, 'uno');
  assert.equal(getNumberInfo(1).russian, 'один');

  assert.equal(getNumberInfo(16).spanish, 'dieciséis');
  assert.equal(getNumberInfo(21).spanish, 'veintiuno');
  assert.equal(getNumberInfo(25).spanish, 'veinticinco');
  assert.equal(getNumberInfo(25).russian, 'двадцать пять');

  assert.equal(getNumberInfo(47).spanish, 'cuarenta y siete');
  assert.equal(getNumberInfo(47).russian, 'сорок семь');

  assert.equal(getNumberInfo(83).spanish, 'ochenta y tres');
  assert.equal(getNumberInfo(83).russian, 'восемьдесят три');

  assert.equal(getNumberInfo(100).spanish, 'cien');
  assert.equal(getNumberInfo(100).russian, 'сто');
});

test('Distractors contain the target and are distinct', () => {
  const distractors = generateNumberDistractors(78);
  assert.equal(distractors.length, 4);
  assert.ok(distractors.includes(78));
  const unique = new Set(distractors);
  assert.equal(unique.size, 4);
});

test('Math problem generation produces valid answers in Spanish and Russian', () => {
  const prob = generateMathProblem('medio');
  assert.ok(prob.result >= 1 && prob.result <= 100);
  assert.ok(prob.questionEs.includes('¿Cuánto es'));
  assert.ok(prob.questionRu.includes('Сколько будет'));
  assert.ok(prob.answerEs.length > 0);
  assert.ok(prob.answerRu.length > 0);
});

test('Spanish time grammatical forms: Es la una vs Son las...', () => {
  const time1 = getSpanishTime(1, 0);
  assert.equal(time1.spanish, 'Es la una en punto');

  const time2 = getSpanishTime(2, 0);
  assert.equal(time2.spanish, 'Son las dos en punto');

  const time3 = getSpanishTime(3, 15);
  assert.equal(time3.spanish, 'Son las tres y cuarto');

  const time5 = getSpanishTime(5, 30);
  assert.equal(time5.spanish, 'Son las cinco y media');

  const time7 = getSpanishTime(7, 45);
  assert.equal(time7.spanish, 'Son las ocho menos cuarto');

  const time10 = getSpanishTime(10, 10);
  assert.equal(time10.spanish, 'Son las diez y diez');

  const time1245 = getSpanishTime(12, 45);
  assert.equal(time1245.spanish, 'Es la una menos cuarto');
});
