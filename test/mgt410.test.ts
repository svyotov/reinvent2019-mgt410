import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import Mgt410 = require('../lib/mgt410-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Mgt410.Mgt410Stack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
