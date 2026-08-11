import { PROFILES, applyProfile } from '../../src/utils/profiles.js';

describe('configuration profiles', () => {
  test.each([
    ['mobile-fast', 10],
    ['desktop-balanced', 20],
    ['dense-data', 30],
    ['sparse-data', 50]
  ])('%s uses the public highlightTopN option', (profileName, expectedTopN) => {
    const applied = applyProfile(profileName);

    expect(applied.highlightTopN).toBe(expectedTopN);
    expect(applied).not.toHaveProperty('topNHighlight');
    expect(PROFILES[profileName]).not.toHaveProperty('topNHighlight');
  });

  test('user highlightTopN overrides the profile value', () => {
    expect(applyProfile('dense-data', { highlightTopN: 7 }).highlightTopN).toBe(7);
  });
});
